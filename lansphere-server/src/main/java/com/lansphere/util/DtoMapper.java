package com.lansphere.util;

import com.lansphere.dto.response.*;
import com.lansphere.entity.*;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

public class DtoMapper {

    public static UserResponse toUserResponse(User user) {
        if (user == null) return null;
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .displayName(user.getDisplayName() != null ? user.getDisplayName() : user.getUsername())
                .email(user.getEmail())
                .avatarUrl(user.getAvatarUrl())
                .bio(user.getBio())
                .status(user.getStatus() != null ? user.getStatus().name() : "OFFLINE")
                .ipAddress(user.getIpAddress())
                .macAddress(user.getMacAddress())
                .hostname(user.getHostname())
                .lastSeen(user.getLastSeen())
                .createdAt(user.getCreatedAt())
                .build();
    }

    public static MessageResponse toMessageResponse(Message message) {
        if (message == null) return null;
        return MessageResponse.builder()
                .id(message.getId())
                .content(message.getContent())
                .type(message.getType() != null ? message.getType().name() : "TEXT")
                .status(message.getStatus() != null ? message.getStatus().name() : "SENT")
                .senderId(message.getSender() != null ? message.getSender().getId() : null)
                .senderName(message.getSender() != null ?
                        (message.getSender().getDisplayName() != null ? message.getSender().getDisplayName() : message.getSender().getUsername())
                        : "Unknown")
                .senderAvatar(message.getSender() != null ? message.getSender().getAvatarUrl() : null)
                .conversationId(message.getConversation() != null ? message.getConversation().getId() : null)
                .replyToId(message.getReplyToId())
                .isEdited(message.getIsEdited())
                .fileTransfer(message.getFileTransfer() != null ? toFileTransferResponse(message.getFileTransfer()) : null)
                .createdAt(message.getCreatedAt())
                .editedAt(message.getEditedAt())
                .build();
    }

    public static ConversationResponse toConversationResponse(Conversation conv, Long currentUserId) {
        if (conv == null) return null;

        List<UserResponse> participants = conv.getParticipants() != null ?
                conv.getParticipants().stream()
                        .map(p -> toUserResponse(p.getUser()))
                        .collect(Collectors.toList())
                : Collections.emptyList();

        Integer unreadCount = 0;
        if (conv.getParticipants() != null && currentUserId != null) {
            unreadCount = conv.getParticipants().stream()
                    .filter(p -> p.getUser().getId().equals(currentUserId))
                    .map(ConversationParticipant::getUnreadCount)
                    .findFirst()
                    .orElse(0);
        }

        String displayName = conv.getName();
        String displayAvatar = conv.getAvatarUrl();

        // If direct message, pick other user's name and avatar if not set
        if ("DIRECT".equals(conv.getType().name()) && currentUserId != null && conv.getParticipants() != null) {
            User otherUser = conv.getParticipants().stream()
                    .map(ConversationParticipant::getUser)
                    .filter(u -> !u.getId().equals(currentUserId))
                    .findFirst()
                    .orElse(null);
            if (otherUser != null) {
                if (displayName == null || displayName.isBlank()) {
                    displayName = otherUser.getDisplayName() != null ? otherUser.getDisplayName() : otherUser.getUsername();
                }
                if (displayAvatar == null || displayAvatar.isBlank()) {
                    displayAvatar = otherUser.getAvatarUrl();
                }
            }
        }

        return ConversationResponse.builder()
                .id(conv.getId())
                .type(conv.getType().name())
                .name(displayName)
                .avatarUrl(displayAvatar)
                .lastMessage(conv.getLastMessage())
                .lastMessageAt(conv.getLastMessageAt())
                .unreadCount(unreadCount)
                .participants(participants)
                .createdAt(conv.getCreatedAt())
                .build();
    }

    public static GroupResponse toGroupResponse(Group group) {
        if (group == null) return null;

        List<GroupMemberResponse> members = group.getMembers() != null ?
                group.getMembers().stream()
                        .map(DtoMapper::toGroupMemberResponse)
                        .collect(Collectors.toList())
                : Collections.emptyList();

        return GroupResponse.builder()
                .id(group.getId())
                .name(group.getName())
                .description(group.getDescription())
                .avatarUrl(group.getAvatarUrl())
                .ownerId(group.getOwner() != null ? group.getOwner().getId() : null)
                .ownerName(group.getOwner() != null ?
                        (group.getOwner().getDisplayName() != null ? group.getOwner().getDisplayName() : group.getOwner().getUsername())
                        : "Unknown")
                .conversationId(group.getConversation() != null ? group.getConversation().getId() : null)
                .memberCount(members.size())
                .maxMembers(group.getMaxMembers())
                .isPublic(group.getIsPublic())
                .members(members)
                .createdAt(group.getCreatedAt())
                .build();
    }

    public static GroupMemberResponse toGroupMemberResponse(GroupMember member) {
        if (member == null) return null;
        User u = member.getUser();
        return GroupMemberResponse.builder()
                .id(member.getId())
                .userId(u != null ? u.getId() : null)
                .username(u != null ? u.getUsername() : null)
                .displayName(u != null ? (u.getDisplayName() != null ? u.getDisplayName() : u.getUsername()) : null)
                .avatarUrl(u != null ? u.getAvatarUrl() : null)
                .status(u != null && u.getStatus() != null ? u.getStatus().name() : "OFFLINE")
                .role(member.getRole() != null ? member.getRole().name() : "MEMBER")
                .joinedAt(member.getJoinedAt())
                .build();
    }

    public static FileTransferResponse toFileTransferResponse(FileTransfer ft) {
        if (ft == null) return null;
        return FileTransferResponse.builder()
                .id(ft.getId())
                .fileName(ft.getFileName())
                .originalName(ft.getOriginalName())
                .fileType(ft.getFileType())
                .fileSize(ft.getFileSize())
                .mimeType(ft.getMimeType())
                .senderId(ft.getSender() != null ? ft.getSender().getId() : null)
                .senderName(ft.getSender() != null ?
                        (ft.getSender().getDisplayName() != null ? ft.getSender().getDisplayName() : ft.getSender().getUsername())
                        : "Unknown")
                .receiverId(ft.getReceiver() != null ? ft.getReceiver().getId() : null)
                .receiverName(ft.getReceiver() != null ?
                        (ft.getReceiver().getDisplayName() != null ? ft.getReceiver().getDisplayName() : ft.getReceiver().getUsername())
                        : "Everyone")
                .conversationId(ft.getConversation() != null ? ft.getConversation().getId() : null)
                .status(ft.getStatus() != null ? ft.getStatus().name() : "COMPLETED")
                .progress(ft.getProgress())
                .downloadUrl("/api/files/" + ft.getId() + "/download")
                .checksum(ft.getChecksum())
                .transferSpeed(ft.getTransferSpeed())
                .createdAt(ft.getCreatedAt())
                .completedAt(ft.getCompletedAt())
                .build();
    }

    public static NotificationResponse toNotificationResponse(Notification notif) {
        if (notif == null) return null;
        return NotificationResponse.builder()
                .id(notif.getId())
                .type(notif.getType() != null ? notif.getType().name() : "SYSTEM")
                .title(notif.getTitle())
                .content(notif.getContent())
                .isRead(notif.getIsRead())
                .referenceId(notif.getReferenceId())
                .referenceType(notif.getReferenceType())
                .senderName(notif.getSenderName())
                .senderAvatar(notif.getSenderAvatar())
                .createdAt(notif.getCreatedAt())
                .build();
    }

    public static ActivityLogResponse toActivityLogResponse(ActivityLog log) {
        if (log == null) return null;
        return ActivityLogResponse.builder()
                .id(log.getId())
                .userId(log.getUser() != null ? log.getUser().getId() : null)
                .username(log.getUser() != null ? log.getUser().getUsername() : "System")
                .userAvatar(log.getUser() != null ? log.getUser().getAvatarUrl() : null)
                .action(log.getAction())
                .description(log.getDescription())
                .ipAddress(log.getIpAddress())
                .targetType(log.getTargetType())
                .targetId(log.getTargetId())
                .createdAt(log.getCreatedAt())
                .build();
    }
}
