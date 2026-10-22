package com.lansphere.service;

import com.lansphere.dto.request.UpdateProfileRequest;
import com.lansphere.dto.response.UserResponse;
import com.lansphere.entity.User;
import com.lansphere.entity.enums.UserStatus;
import com.lansphere.exception.ResourceNotFoundException;
import com.lansphere.repository.UserRepository;
import com.lansphere.util.DtoMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final ActivityLogService activityLogService;

    @Transactional(readOnly = true)
    public User getUserEntity(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
    }

    @Transactional(readOnly = true)
    public User getUserEntityByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));
    }

    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        return DtoMapper.toUserResponse(getUserEntity(id));
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(DtoMapper::toUserResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getOnlineUsers() {
        return userRepository.findByStatusNot(UserStatus.OFFLINE).stream()
                .map(DtoMapper::toUserResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<UserResponse> searchUsers(String query) {
        return userRepository.findByUsernameContainingIgnoreCase(query).stream()
                .map(DtoMapper::toUserResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserResponse updateProfile(Long userId, UpdateProfileRequest request) {
        User user = getUserEntity(userId);

        if (request.getDisplayName() != null) user.setDisplayName(request.getDisplayName());
        if (request.getEmail() != null) user.setEmail(request.getEmail());
        if (request.getBio() != null) user.setBio(request.getBio());
        if (request.getAvatarUrl() != null) user.setAvatarUrl(request.getAvatarUrl());
        if (request.getStatus() != null) {
            try {
                user.setStatus(UserStatus.valueOf(request.getStatus().toUpperCase()));
            } catch (IllegalArgumentException ignored) {}
        }

        User updated = userRepository.save(user);
        UserResponse response = DtoMapper.toUserResponse(updated);

        // Broadcast presence update over WebSocket
        try {
            messagingTemplate.convertAndSend("/topic/users/status", response);
        } catch (Exception ignored) {}

        activityLogService.logActivity(user, "PROFILE_UPDATED", "User updated profile details",
                user.getIpAddress(), "USER", user.getId());

        return response;
    }

    @Transactional
    public void updateUserStatus(Long userId, UserStatus status, String ipAddress, String macAddress, String hostname) {
        userRepository.findById(userId).ifPresent(user -> {
            user.setStatus(status);
            user.setLastSeen(LocalDateTime.now());
            if (ipAddress != null) user.setIpAddress(ipAddress);
            if (macAddress != null) user.setMacAddress(macAddress);
            if (hostname != null) user.setHostname(hostname);
            User saved = userRepository.save(user);

            UserResponse response = DtoMapper.toUserResponse(saved);
            try {
                messagingTemplate.convertAndSend("/topic/users/status", response);
            } catch (Exception ignored) {}
        });
    }
}
