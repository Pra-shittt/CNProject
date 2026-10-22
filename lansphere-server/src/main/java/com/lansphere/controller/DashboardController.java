package com.lansphere.controller;

import com.lansphere.dto.response.ApiResponse;
import com.lansphere.dto.response.DashboardResponse;
import com.lansphere.entity.User;
import com.lansphere.service.AuthService;
import com.lansphere.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;
    private final AuthService authService;

    @GetMapping
    public ResponseEntity<ApiResponse<DashboardResponse>> getDashboard() {
        User currentUser = authService.getCurrentAuthenticatedUser();
        DashboardResponse data = dashboardService.getDashboardData(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(data));
    }
}
