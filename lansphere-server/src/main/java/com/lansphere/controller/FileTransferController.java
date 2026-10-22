package com.lansphere.controller;

import com.lansphere.dto.response.ApiResponse;
import com.lansphere.dto.response.FileTransferResponse;
import com.lansphere.entity.User;
import com.lansphere.service.AuthService;
import com.lansphere.service.FileTransferService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/files")
@RequiredArgsConstructor
public class FileTransferController {

    private final FileTransferService fileTransferService;
    private final AuthService authService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<FileTransferResponse>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "receiverId", required = false) Long receiverId,
            @RequestParam(value = "conversationId", required = false) Long conversationId) {
        User currentUser = authService.getCurrentAuthenticatedUser();
        FileTransferResponse response = fileTransferService.uploadFile(file, currentUser.getId(), receiverId, conversationId);
        return ResponseEntity.ok(ApiResponse.success("File uploaded successfully", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<FileTransferResponse>>> getAllFiles() {
        return ResponseEntity.ok(ApiResponse.success(fileTransferService.getAllFiles()));
    }

    @GetMapping("/recent")
    public ResponseEntity<ApiResponse<List<FileTransferResponse>>> getRecentFiles(
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(ApiResponse.success(fileTransferService.getRecentFiles(limit)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<FileTransferResponse>> getFileById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(fileTransferService.getFileById(id)));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> downloadFile(@PathVariable Long id) {
        Long userId = null;
        try {
            userId = authService.getCurrentAuthenticatedUser().getId();
        } catch (Exception ignored) {}

        FileTransferResponse fileInfo = fileTransferService.getFileById(id);
        Resource resource = fileTransferService.loadFileAsResource(id, userId);

        String contentType = fileInfo.getMimeType();
        if (contentType == null || contentType.isBlank()) {
            contentType = "application/octet-stream";
        }

        String encodedFilename = URLEncoder.encode(fileInfo.getOriginalName(), StandardCharsets.UTF_8).replace("+", "%20");

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileInfo.getOriginalName() + "\"; filename*=UTF-8''" + encodedFilename)
                .body(resource);
    }
}
