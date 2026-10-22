package com.lansphere.controller;

import com.lansphere.dto.response.ActivityLogResponse;
import com.lansphere.dto.response.ApiResponse;
import com.lansphere.service.ActivityLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/activities")
@RequiredArgsConstructor
public class ActivityLogController {

    private final ActivityLogService activityLogService;

    @GetMapping("/recent")
    public ResponseEntity<ApiResponse<List<ActivityLogResponse>>> getRecentActivities(
            @RequestParam(defaultValue = "15") int limit) {
        return ResponseEntity.ok(ApiResponse.success(activityLogService.getRecentActivities(limit)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ActivityLogResponse>>> getAllActivities(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(activityLogService.getAllActivities(page, size)));
    }
}
