package com.lansphere.controller;

import com.lansphere.dto.request.SendMessageRequest;
import com.lansphere.dto.response.ApiResponse;
import com.lansphere.dto.response.ConversationResponse;
import com.lansphere.dto.response.MessageResponse;
import com.lansphere.entity.Conversation;
import com.lansphere.entity.User;
import com.lansphere.service.AuthService;
import com.lansphere.service.ChatService;
import com.lansphere.util.DtoMapper;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/chats")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final AuthService authService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ConversationResponse>>> getUserConversations() {
        User currentUser = authService.getCurrentAuthenticatedUser();
        List<ConversationResponse> conversations = chatService.getUserConversations(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(conversations));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ConversationResponse>> getConversation(@PathVariable Long id) {
        User currentUser = authService.getCurrentAuthenticatedUser();
        ConversationResponse response = chatService.getConversationById(id, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}/messages")
    public ResponseEntity<ApiResponse<List<MessageResponse>>> getMessages(@PathVariable Long id) {
        List<MessageResponse> messages = chatService.getConversationMessages(id);
        return ResponseEntity.ok(ApiResponse.success(messages));
    }

    @GetMapping("/{id}/messages/paged")
    public ResponseEntity<ApiResponse<Page<MessageResponse>>> getMessagesPaged(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size) {
        Page<MessageResponse> paged = chatService.getConversationMessagesPaged(id, page, size);
        return ResponseEntity.ok(ApiResponse.success(paged));
    }

    @PostMapping("/direct/{targetUserId}")
    public ResponseEntity<ApiResponse<ConversationResponse>> startDirectChat(@PathVariable Long targetUserId) {
        User currentUser = authService.getCurrentAuthenticatedUser();
        Conversation conv = chatService.getOrCreateDirectConversation(currentUser.getId(), targetUserId);
        return ResponseEntity.ok(ApiResponse.success(DtoMapper.toConversationResponse(conv, currentUser.getId())));
    }

    @PostMapping("/messages")
    public ResponseEntity<ApiResponse<MessageResponse>> sendMessage(@Valid @RequestBody SendMessageRequest request) {
        User currentUser = authService.getCurrentAuthenticatedUser();
        MessageResponse response = chatService.sendMessage(currentUser.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Message sent", response));
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable Long id) {
        User currentUser = authService.getCurrentAuthenticatedUser();
        chatService.markConversationAsRead(id, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Conversation marked as read", null));
    }

    @GetMapping("/{id}/search")
    public ResponseEntity<ApiResponse<List<MessageResponse>>> searchMessages(
            @PathVariable Long id,
            @RequestParam("q") String query) {
        List<MessageResponse> results = chatService.searchMessages(id, query);
        return ResponseEntity.ok(ApiResponse.success(results));
    }
}
