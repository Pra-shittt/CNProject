package com.lansphere.service;

import com.lansphere.dto.response.FileTransferResponse;
import com.lansphere.entity.FileTransfer;
import com.lansphere.entity.TransferHistory;
import com.lansphere.entity.User;
import com.lansphere.entity.enums.FileTransferStatus;
import com.lansphere.entity.enums.NotificationType;
import com.lansphere.exception.BadRequestException;
import com.lansphere.exception.ResourceNotFoundException;
import com.lansphere.repository.ConversationRepository;
import com.lansphere.repository.FileTransferRepository;
import com.lansphere.repository.TransferHistoryRepository;
import com.lansphere.repository.UserRepository;
import com.lansphere.util.DtoMapper;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FileTransferService {

    private static final Logger log = LoggerFactory.getLogger(FileTransferService.class);

    private final FileTransferRepository fileTransferRepository;
    private final TransferHistoryRepository transferHistoryRepository;
    private final UserRepository userRepository;
    private final ConversationRepository conversationRepository;
    private final NotificationService notificationService;
    private final ActivityLogService activityLogService;

    @Value("${app.upload.dir:./uploads}")
    private String uploadDirStr;

    private Path uploadDirPath;

    @PostConstruct
    public void init() {
        this.uploadDirPath = Paths.get(uploadDirStr).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.uploadDirPath);
        } catch (IOException e) {
            log.error("Could not create upload directory: {}", e.getMessage());
        }
    }

    @Transactional
    public FileTransferResponse uploadFile(MultipartFile file, Long senderId, Long receiverId, Long conversationId) {
        if (file.isEmpty()) {
            throw new BadRequestException("Cannot upload empty file.");
        }

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", senderId));

        User receiver = receiverId != null ? userRepository.findById(receiverId).orElse(null) : null;

        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "unnamed");
        String extension = "";
        int extIndex = originalFilename.lastIndexOf('.');
        if (extIndex > 0) {
            extension = originalFilename.substring(extIndex);
        }

        String storedFileName = UUID.randomUUID() + extension;
        Path targetLocation = this.uploadDirPath.resolve(storedFileName);

        String checksum = "";
        try {
            // Save file and calculate SHA-256 checksum simultaneously
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            try (InputStream is = file.getInputStream()) {
                byte[] buffer = new byte[8192];
                int bytesRead;
                while ((bytesRead = is.read(buffer)) != -1) {
                    digest.update(buffer, 0, bytesRead);
                }
            }
            byte[] hash = digest.digest();
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            checksum = hexString.toString();

            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
        } catch (Exception e) {
            log.error("Failed to store file: {}", e.getMessage());
            throw new BadRequestException("Could not store file: " + e.getMessage());
        }

        String fileType = determineFileType(originalFilename, file.getContentType());

        FileTransfer ft = FileTransfer.builder()
                .fileName(storedFileName)
                .originalName(originalFilename)
                .fileType(fileType)
                .fileSize(file.getSize())
                .mimeType(file.getContentType())
                .sender(sender)
                .receiver(receiver)
                .conversation(conversationId != null ? conversationRepository.findById(conversationId).orElse(null) : null)
                .status(FileTransferStatus.COMPLETED)
                .progress(100)
                .storagePath(targetLocation.toString())
                .checksum(checksum)
                .transferSpeed(104857600L) // simulated 100 MB/s LAN rate
                .completedAt(LocalDateTime.now())
                .build();

        FileTransfer saved = fileTransferRepository.save(ft);

        // Record transfer history
        TransferHistory th = TransferHistory.builder()
                .fileTransfer(saved)
                .action("UPLOAD")
                .performedBy(sender)
                .details("Uploaded " + originalFilename + " (" + formatBytes(file.getSize()) + ")")
                .bytesTransferred(file.getSize())
                .build();
        transferHistoryRepository.save(th);

        // Notify receiver if direct transfer
        if (receiver != null) {
            notificationService.sendNotification(
                    receiver,
                    NotificationType.FILE_TRANSFER,
                    "New File Received",
                    sender.getUsername() + " sent you " + originalFilename,
                    saved.getId(), "FILE", sender
            );
        }

        activityLogService.logActivity(sender, "FILE_UPLOADED", "Uploaded " + originalFilename,
                sender.getIpAddress(), "FILE", saved.getId());

        return DtoMapper.toFileTransferResponse(saved);
    }

    @Transactional(readOnly = true)
    public Resource loadFileAsResource(Long fileId, Long requestingUserId) {
        FileTransfer ft = fileTransferRepository.findById(fileId)
                .orElseThrow(() -> new ResourceNotFoundException("File", "id", fileId));

        try {
            Path filePath = Paths.get(ft.getStoragePath()).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                // Record download in transfer history
                if (requestingUserId != null) {
                    userRepository.findById(requestingUserId).ifPresent(user -> {
                        TransferHistory th = TransferHistory.builder()
                                .fileTransfer(ft)
                                .action("DOWNLOAD")
                                .performedBy(user)
                                .details("Downloaded " + ft.getOriginalName())
                                .bytesTransferred(ft.getFileSize())
                                .build();
                        transferHistoryRepository.save(th);
                    });
                }
                return resource;
            } else {
                throw new ResourceNotFoundException("File not found or not readable");
            }
        } catch (MalformedURLException e) {
            throw new ResourceNotFoundException("File path invalid");
        }
    }

    @Transactional(readOnly = true)
    public FileTransferResponse getFileById(Long id) {
        FileTransfer ft = fileTransferRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("File", "id", id));
        return DtoMapper.toFileTransferResponse(ft);
    }

    @Transactional(readOnly = true)
    public List<FileTransferResponse> getAllFiles() {
        return fileTransferRepository.findAll().stream()
                .map(DtoMapper::toFileTransferResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<FileTransferResponse> getRecentFiles(int limit) {
        return fileTransferRepository.findTop10ByOrderByCreatedAtDesc().stream()
                .limit(limit)
                .map(DtoMapper::toFileTransferResponse)
                .collect(Collectors.toList());
    }

    private String determineFileType(String filename, String mimeType) {
        String lower = filename.toLowerCase();
        if (lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".gif") || lower.endsWith(".webp") || lower.endsWith(".svg")) {
            return "IMAGE";
        } else if (lower.endsWith(".mp4") || lower.endsWith(".mkv") || lower.endsWith(".avi") || lower.endsWith(".mov")) {
            return "VIDEO";
        } else if (lower.endsWith(".pdf") || lower.endsWith(".docx") || lower.endsWith(".doc") || lower.endsWith(".xlsx") || lower.endsWith(".txt") || lower.endsWith(".csv")) {
            return "DOCUMENT";
        } else if (lower.endsWith(".zip") || lower.endsWith(".rar") || lower.endsWith(".tar") || lower.endsWith(".gz") || lower.endsWith(".7z")) {
            return "ARCHIVE";
        }
        return "OTHER";
    }

    private String formatBytes(long bytes) {
        if (bytes < 1024) return bytes + " B";
        int z = (63 - Long.numberOfLeadingZeros(bytes)) / 10;
        return String.format("%.1f %sB", (double) bytes / (1L << (z * 10)), " KMGTPE".charAt(z));
    }
}
