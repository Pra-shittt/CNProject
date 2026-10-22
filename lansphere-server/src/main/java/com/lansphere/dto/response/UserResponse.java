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
public class UserResponse {
    private Long id;
    private String username;
    private String displayName;
    private String email;
    private String avatarUrl;
    private String bio;
    private String status;
    private String ipAddress;
    private String macAddress;
    private String hostname;
    private LocalDateTime lastSeen;
    private LocalDateTime createdAt;
}
