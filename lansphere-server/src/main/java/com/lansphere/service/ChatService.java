package com.lansphere.service;

import com.lansphere.dto.request.SendMessageRequest;
import com.lansphere.dto.response.ConversationResponse;
import com.lansphere.dto.response.MessageResponse;
import com.lansphere.entity.*;
import com.lansphere.entity.enums.ConversationType;
import com.lansphere.entity.enums.MessageStatus;
import com.lansphere.entity.enums.MessageType;
import com.lansphere.entity.enums.NotificationType;
import com.lansphere.exception.ResourceNotFoundException;
import com.lansphere.repository.*;
import com.lansphere.util.DtoMapper;
import com.lansphere.network.Peer;
import com.lansphere.network.PeerRegistry;
import com.lansphere.network.chat.SocketChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import java.nio.charset.StandardCharsets;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ConversationRepository conversationRepository;
    private final ConversationParticipantRepository participantRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final FileTransferRepository fileTransferRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationService notificationService;
    private final ActivityLogService activityLogService;
    private final PeerRegistry peerRegistry;
    private final SocketChatService socketChatService;

    @Transactional
    public Conversation getOrCreateDirectConversation(Long userId1, Long userId2) {
        return conversationRepository.findDirectConversation(userId1, userId2)
                .orElseGet(() -> {
                    User user1 = userRepository.findById(userId1)
                            .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId1));
                    User user2 = userRepository.findById(userId2)
                            .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId2));

                    Conversation conv = Conversation.builder()
                            .type(ConversationType.DIRECT)
                            .name(user2.getDisplayName() != null ? user2.getDisplayName() : user2.getUsername())
                            .avatarUrl(user2.getAvatarUrl())
                            .build();

                    Conversation saved = conversationRepository.save(conv);

                    ConversationParticipant p1 = ConversationParticipant.builder()
                            .conversation(saved)
                            .user(user1)
                            .unreadCount(0)
                            .build();

                    ConversationParticipant p2 = ConversationParticipant.builder()
                            .conversation(saved)
                            .user(user2)
                            .unreadCount(0)
                            .build();

                    participantRepository.save(p1);
                    participantRepository.save(p2);

                    List<ConversationParticipant> list = new ArrayList<>();
                    list.add(p1);
                    list.add(p2);
                    saved.setParticipants(list);

                    return saved;
                });
    }

    @Transactional(readOnly = true)
    public List<ConversationResponse> getUserConversations(Long userId) {
        return conversationRepository.findByParticipantUserId(userId).stream()
                .map(conv -> DtoMapper.toConversationResponse(conv, userId))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ConversationResponse getConversationById(Long convId, Long currentUserId) {
        Conversation conv = conversationRepository.findById(convId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation", "id", convId));
        return DtoMapper.toConversationResponse(conv, currentUserId);
    }

    @Transactional(readOnly = true)
    public List<MessageResponse> getConversationMessages(Long conversationId) {
        return messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId).stream()
                .map(DtoMapper::toMessageResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<MessageResponse> getConversationMessagesPaged(Long conversationId, int page, int size) {
        return messageRepository.findByConversationIdOrderByCreatedAtDesc(conversationId, PageRequest.of(page, size))
                .map(DtoMapper::toMessageResponse);
    }

    @Transactional
    public MessageResponse sendMessage(Long senderId, SendMessageRequest request) {
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", senderId));

        Conversation conversation = conversationRepository.findById(request.getConversationId())
                .orElseThrow(() -> new ResourceNotFoundException("Conversation", "id", request.getConversationId()));

        MessageType type = MessageType.TEXT;
        if (request.getType() != null) {
            try {
                type = MessageType.valueOf(request.getType().toUpperCase());
            } catch (IllegalArgumentException ignored) {}
        }

        FileTransfer fileTransfer = null;
        if (request.getFileTransferId() != null) {
            fileTransfer = fileTransferRepository.findById(request.getFileTransferId()).orElse(null);
        }

        Message message = Message.builder()
                .content(request.getContent())
                .type(type)
                .status(MessageStatus.SENT)
                .sender(sender)
                .conversation(conversation)
                .fileTransfer(fileTransfer)
                .replyToId(request.getReplyToId())
                .isEdited(false)
                .build();

        Message savedMessage = messageRepository.save(message);

        // Update conversation summary
        conversation.setLastMessage(request.getContent().length() > 100
                ? request.getContent().substring(0, 97) + "..."
                : request.getContent());
        conversation.setLastMessageAt(LocalDateTime.now());
        conversationRepository.save(conversation);

        // Increment unread count for other participants & dispatch notifications
        List<ConversationParticipant> participants = participantRepository.findByConversationId(conversation.getId());
        for (ConversationParticipant p : participants) {
            if (!p.getUser().getId().equals(senderId)) {
                p.setUnreadCount(p.getUnreadCount() + 1);
                participantRepository.save(p);

                notificationService.sendNotification(
                        p.getUser(),
                        NotificationType.MESSAGE,
                        "Message from " + (sender.getDisplayName() != null ? sender.getDisplayName() : sender.getUsername()),
                        request.getContent(),
                        conversation.getId(),
                        "CONVERSATION",
                        sender
                );
            }
        }

        MessageResponse response = DtoMapper.toMessageResponse(savedMessage);

        // Real-time broadcast over STOMP WebSocket
        try {
            messagingTemplate.convertAndSend("/topic/conversation/" + conversation.getId(), response);
        } catch (Exception ignored) {}

        // The browser keeps its existing REST request.  This local node then relays
        // the message over LSAP/TCP to peer nodes associated with recipients.
        String envelope = conversation.getId() + "\u001F" + type.name() + "\u001F" + request.getContent();
        for (ConversationParticipant participant : participants) {
            if (participant.getUser().getId().equals(senderId) || participant.getUser().getIpAddress() == null) continue;
            for (Peer peer : peerRegistry.all()) {
                if (participant.getUser().getIpAddress().equals(peer.getIpAddress())) {
                    socketChatService.send(peer, sender.getUsername(), participant.getUser().getUsername(), envelope);
                }
            }
        }

        return response;
    }

    @Transactional
    public void markConversationAsRead(Long conversationId, Long userId) {
        participantRepository.findByConversationIdAndUserId(conversationId, userId).ifPresent(p -> {
            p.setUnreadCount(0);
            p.setLastReadAt(LocalDateTime.now());
            participantRepository.save(p);
        });
        messageRepository.markAsRead(conversationId, userId);
    }

    @Transactional(readOnly = true)
    public List<MessageResponse> searchMessages(Long conversationId, String query) {
        return messageRepository.searchInConversation(conversationId, query).stream()
                .map(DtoMapper::toMessageResponse)
                .collect(Collectors.toList());
    }

    /** Persists a TCP-delivered chat envelope after validating the local conversation and sender. */
    @Transactional
    public void receiveNetworkMessage(String senderUsername, byte[] payload) {
        String[] fields = new String(payload, StandardCharsets.UTF_8).split("\u001F", 3);
        if (fields.length != 3) throw new IllegalArgumentException("Invalid network chat envelope");
        Long conversationId = Long.valueOf(fields[0]);
        User sender = userRepository.findByUsername(senderUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", senderUsername));
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation", "id", conversationId));
        MessageType type = MessageType.valueOf(fields[1]);
        Message message = messageRepository.save(Message.builder().content(fields[2]).type(type).status(MessageStatus.DELIVERED)
                .sender(sender).conversation(conversation).isEdited(false).build());
        conversation.setLastMessage(fields[2].length() > 100 ? fields[2].substring(0, 97) + "..." : fields[2]);
        conversation.setLastMessageAt(LocalDateTime.now()); conversationRepository.save(conversation);
        participantRepository.findByConversationId(conversationId).forEach(participant -> {
            if (!participant.getUser().getId().equals(sender.getId())) { participant.setUnreadCount(participant.getUnreadCount() + 1); participantRepository.save(participant); }
        });
        try { messagingTemplate.convertAndSend("/topic/conversation/" + conversationId, DtoMapper.toMessageResponse(message)); } catch (Exception ignored) { }
    }
}
