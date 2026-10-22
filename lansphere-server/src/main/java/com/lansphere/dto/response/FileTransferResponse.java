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
public class FileTransferResponse {
    private Long id;
    private String fileName;
    private String originalName;
    private String fileType;
    private Long fileSize;
    private String mimeType;
    private Long senderId;
    private String senderName;
    private Long receiverId;
    private String receiverName;
    private Long conversationId;
    private String status;
    private Integer progress;
    private String downloadUrl;
    private String checksum;
    private Long transferSpeed;
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;
}
