package com.lansphere.controller;

import com.lansphere.dto.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.lang.management.ManagementFactory;
import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/health")
public class HealthController {

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getHealth() {
        long uptimeMs = ManagementFactory.getRuntimeMXBean().getUptime();
        Map<String, Object> health = Map.of(
                "status", "UP",
                "app", "LanSphere Node Service",
                "version", "1.0.0",
                "uptimeSeconds", uptimeMs / 1000,
                "timestamp", LocalDateTime.now()
        );
        return ResponseEntity.ok(ApiResponse.success(health));
    }
}
