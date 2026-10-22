package com.lansphere.controller;

import com.lansphere.dto.response.ApiResponse;
import com.lansphere.dto.response.NetworkStatusResponse;
import com.lansphere.service.NetworkMonitorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/network")
@RequiredArgsConstructor
public class NetworkMonitorController {

    private final NetworkMonitorService networkMonitorService;

    @GetMapping("/status")
    public ResponseEntity<ApiResponse<NetworkStatusResponse>> getNetworkStatus() {
        NetworkStatusResponse status = networkMonitorService.getCurrentNetworkStatus();
        return ResponseEntity.ok(ApiResponse.success(status));
    }
}
