package com.lansphere.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConversationResponse {
    private Long id;
    private String type;
    private String name;
    private String avatarUrl;
    private String lastMessage;
    private LocalDateTime lastMessageAt;
    private Integer unreadCount;
    private List<UserResponse> participants;
    private LocalDateTime createdAt;
}
