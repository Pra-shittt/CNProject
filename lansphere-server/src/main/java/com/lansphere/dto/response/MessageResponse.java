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
public class MessageResponse {
    private Long id;
    private String content;
    private String type;
    private String status;
    private Long senderId;
    private String senderName;
    private String senderAvatar;
    private Long conversationId;
    private Long replyToId;
    private Boolean isEdited;
    private FileTransferResponse fileTransfer;
    private LocalDateTime createdAt;
    private LocalDateTime editedAt;
}
