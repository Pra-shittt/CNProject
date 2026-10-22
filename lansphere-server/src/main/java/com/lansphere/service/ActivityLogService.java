package com.lansphere.service;

import com.lansphere.dto.response.ActivityLogResponse;
import com.lansphere.entity.ActivityLog;
import com.lansphere.entity.User;
import com.lansphere.repository.ActivityLogRepository;
import com.lansphere.util.DtoMapper;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ActivityLogService {

    private static final Logger log = LoggerFactory.getLogger(ActivityLogService.class);
    private final ActivityLogRepository activityLogRepository;

    @Transactional
    public void logActivity(User user, String action, String description, String ipAddress, String targetType, Long targetId) {
        try {
            ActivityLog entry = ActivityLog.builder()
                    .user(user)
                    .action(action)
                    .description(description)
                    .ipAddress(ipAddress)
                    .targetType(targetType)
                    .targetId(targetId)
                    .build();
            activityLogRepository.save(entry);
        } catch (Exception e) {
            log.error("Failed to record activity log: {}", e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public List<ActivityLogResponse> getRecentActivities(int limit) {
        return activityLogRepository.findTop20ByOrderByCreatedAtDesc()
                .stream()
                .limit(limit)
                .map(DtoMapper::toActivityLogResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<ActivityLogResponse> getAllActivities(int page, int size) {
        return activityLogRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(page, size))
                .map(DtoMapper::toActivityLogResponse);
    }
}
