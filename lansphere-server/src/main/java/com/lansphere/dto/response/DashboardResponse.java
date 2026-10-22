package com.lansphere.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardResponse {
    private long totalUsers;
    private long onlineUsers;
    private long totalMessages;
    private long totalFiles;
    private long totalGroups;
    private long activeTransfers;
    private long totalStorageBytes;
    private List<UserResponse> recentOnlineUsers;
    private List<ConversationResponse> recentChats;
    private List<FileTransferResponse> recentFiles;
    private List<ActivityLogResponse> recentActivity;
}
