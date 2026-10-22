package com.lansphere.service;

import com.lansphere.dto.response.DashboardResponse;
import com.lansphere.entity.FileTransfer;
import com.lansphere.entity.enums.FileTransferStatus;
import com.lansphere.entity.enums.UserStatus;
import com.lansphere.repository.*;
import com.lansphere.util.DtoMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final UserRepository userRepository;
    private final MessageRepository messageRepository;
    private final FileTransferRepository fileTransferRepository;
    private final GroupRepository groupRepository;
    private final ConversationRepository conversationRepository;
    private final ActivityLogRepository activityLogRepository;

    @Transactional(readOnly = true)
    public DashboardResponse getDashboardData(Long currentUserId) {
        long totalUsers = userRepository.count();
        long onlineUsers = userRepository.findByStatusNot(UserStatus.OFFLINE).size();
        long totalMessages = messageRepository.count();
        long totalFiles = fileTransferRepository.count();
        long totalGroups = groupRepository.count();
        long activeTransfers = fileTransferRepository.countByStatus(FileTransferStatus.UPLOADING)
                + fileTransferRepository.countByStatus(FileTransferStatus.DOWNLOADING);

        long totalStorage = fileTransferRepository.findAll().stream()
                .mapToLong(FileTransfer::getFileSize)
                .sum();

        var recentOnlineUsers = userRepository.findByStatusNot(UserStatus.OFFLINE).stream()
                .limit(6)
                .map(DtoMapper::toUserResponse)
                .collect(Collectors.toList());

        var recentChats = conversationRepository.findByParticipantUserId(currentUserId).stream()
                .limit(5)
                .map(c -> DtoMapper.toConversationResponse(c, currentUserId))
                .collect(Collectors.toList());

        var recentFiles = fileTransferRepository.findTop10ByOrderByCreatedAtDesc().stream()
                .limit(5)
                .map(DtoMapper::toFileTransferResponse)
                .collect(Collectors.toList());

        var recentActivity = activityLogRepository.findTop20ByOrderByCreatedAtDesc().stream()
                .limit(6)
                .map(DtoMapper::toActivityLogResponse)
                .collect(Collectors.toList());

        return DashboardResponse.builder()
                .totalUsers(totalUsers)
                .onlineUsers(onlineUsers)
                .totalMessages(totalMessages)
                .totalFiles(totalFiles)
                .totalGroups(totalGroups)
                .activeTransfers(activeTransfers)
                .totalStorageBytes(totalStorage)
                .recentOnlineUsers(recentOnlineUsers)
                .recentChats(recentChats)
                .recentFiles(recentFiles)
                .recentActivity(recentActivity)
                .build();
    }
}
