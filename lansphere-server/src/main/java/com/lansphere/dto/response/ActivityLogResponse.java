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
public class ActivityLogResponse {
    private Long id;
    private Long userId;
    private String username;
    private String userAvatar;
    private String action;
    private String description;
    private String ipAddress;
    private String targetType;
    private Long targetId;
    private LocalDateTime createdAt;
}
