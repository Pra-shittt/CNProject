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
public class GroupResponse {
    private Long id;
    private String name;
    private String description;
    private String avatarUrl;
    private Long ownerId;
    private String ownerName;
    private Long conversationId;
    private Integer memberCount;
    private Integer maxMembers;
    private Boolean isPublic;
    private List<GroupMemberResponse> members;
    private LocalDateTime createdAt;
}
