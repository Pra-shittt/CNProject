package com.lansphere.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationResponse {
    private Long id;
    private String type;
    private String title;
    private String content;
    private Boolean isRead;
    private Long referenceId;
    private String referenceType;
    private String senderName;
    private String senderAvatar;
    private LocalDateTime createdAt;
}
