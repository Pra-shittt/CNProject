package com.lansphere.service;

import com.lansphere.dto.response.NotificationResponse;
import com.lansphere.entity.Notification;
import com.lansphere.entity.User;
import com.lansphere.entity.enums.NotificationType;
import com.lansphere.repository.NotificationRepository;
import com.lansphere.util.DtoMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public NotificationResponse sendNotification(User recipient, NotificationType type, String title, String content,
                                                Long refId, String refType, User sender) {
        Notification notification = Notification.builder()
                .user(recipient)
                .type(type)
                .title(title)
                .content(content)
                .referenceId(refId)
                .referenceType(refType)
                .senderName(sender != null ? (sender.getDisplayName() != null ? sender.getDisplayName() : sender.getUsername()) : "System")
                .senderAvatar(sender != null ? sender.getAvatarUrl() : null)
                .isRead(false)
                .build();

        Notification saved = notificationRepository.save(notification);
        NotificationResponse response = DtoMapper.toNotificationResponse(saved);

        // Push real-time notification to user's personal WebSocket topic
        try {
            messagingTemplate.convertAndSend("/topic/user/" + recipient.getId() + "/notifications", response);
        } catch (Exception ignored) {}

        return response;
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getUserNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(DtoMapper::toNotificationResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Transactional
    public void markAsRead(Long notificationId) {
        notificationRepository.markAsRead(notificationId);
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsRead(userId);
    }
}
