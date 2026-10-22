package com.lansphere.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SendMessageRequest {

    @NotBlank(message = "Message content is required")
    private String content;

    @NotNull(message = "Conversation ID is required")
    private Long conversationId;

    private String type = "TEXT";

    private Long replyToId;

    private Long fileTransferId;
}
