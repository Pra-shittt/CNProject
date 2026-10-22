package com.lansphere.service;

import com.lansphere.dto.request.LoginRequest;
import com.lansphere.dto.request.RegisterRequest;
import com.lansphere.dto.response.AuthResponse;
import com.lansphere.dto.response.UserResponse;
import com.lansphere.entity.User;
import com.lansphere.entity.enums.NotificationType;
import com.lansphere.entity.enums.UserStatus;
import com.lansphere.exception.BadRequestException;
import com.lansphere.repository.UserRepository;
import com.lansphere.security.JwtTokenProvider;
import com.lansphere.security.UserPrincipal;
import com.lansphere.util.DtoMapper;
import com.lansphere.util.NetworkUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UserService userService;
    private final NotificationService notificationService;
    private final ActivityLogService activityLogService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException("Username '" + request.getUsername() + "' is already taken.");
        }

        if (request.getEmail() != null && !request.getEmail().isBlank() && userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email is already registered.");
        }

        String localIp = NetworkUtil.getLocalIpAddress();
        String mac = NetworkUtil.getLocalMacAddress();
        String host = NetworkUtil.getHostName();

        User user = User.builder()
                .username(request.getUsername().trim().toLowerCase())
                .password(passwordEncoder.encode(request.getPassword()))
                .displayName(request.getDisplayName() != null && !request.getDisplayName().isBlank()
                        ? request.getDisplayName().trim()
                        : request.getUsername().trim())
                .email(request.getEmail())
                .status(UserStatus.ONLINE)
                .ipAddress(localIp)
                .macAddress(mac)
                .hostname(host)
                .lastSeen(LocalDateTime.now())
                .avatarUrl("https://api.dicebear.com/7.x/bottts/svg?seed=" + request.getUsername().trim())
                .build();

        User savedUser = userRepository.save(user);

        // Generate token
        String token = tokenProvider.generateTokenFromUsername(savedUser.getUsername());
        UserResponse userResponse = DtoMapper.toUserResponse(savedUser);

        // Send welcome notification
        notificationService.sendNotification(savedUser, NotificationType.SYSTEM,
                "Welcome to LanSphere!",
                "You are connected to the local network peer group. Start collaborating with zero internet dependency.",
                null, "SYSTEM", null);

        // Activity log
        activityLogService.logActivity(savedUser, "USER_REGISTERED", "New user registered from " + localIp,
                localIp, "USER", savedUser.getId());

        return AuthResponse.of(token, userResponse);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername().trim().toLowerCase(),
                        request.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String token = tokenProvider.generateToken(authentication);

        User user = userService.getUserEntityByUsername(request.getUsername().trim().toLowerCase());
        
        // Update user network status to ONLINE
        String localIp = NetworkUtil.getLocalIpAddress();
        String mac = NetworkUtil.getLocalMacAddress();
        String host = NetworkUtil.getHostName();

        userService.updateUserStatus(user.getId(), UserStatus.ONLINE, localIp, mac, host);

        activityLogService.logActivity(user, "USER_LOGIN", "User logged in successfully",
                localIp, "USER", user.getId());

        return AuthResponse.of(token, DtoMapper.toUserResponse(user));
    }

    @Transactional(readOnly = true)
    public User getCurrentAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || authentication.getPrincipal().equals("anonymousUser")) {
            throw new BadRequestException("No authenticated user found in security context");
        }

        if (authentication.getPrincipal() instanceof UserPrincipal principal) {
            return userService.getUserEntity(principal.getId());
        }

        String username = authentication.getName();
        return userService.getUserEntityByUsername(username);
    }
}
