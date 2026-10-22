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
public class GroupMemberResponse {
    private Long id;
    private Long userId;
    private String username;
    private String displayName;
    private String avatarUrl;
    private String status;
    private String role;
    private LocalDateTime joinedAt;
}
