package com.lansphere.config;

import com.lansphere.dto.request.CreateGroupRequest;
import com.lansphere.dto.request.SendMessageRequest;
import com.lansphere.entity.Conversation;
import com.lansphere.entity.User;
import com.lansphere.entity.enums.UserStatus;
import com.lansphere.repository.UserRepository;
import com.lansphere.service.ActivityLogService;
import com.lansphere.service.ChatService;
import com.lansphere.service.GroupService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ChatService chatService;
    private final GroupService groupService;
    private final ActivityLogService activityLogService;

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            log.info("Database already initialized with users.");
            return;
        }

        log.info("Initializing LanSphere default demonstration dataset...");

        // 1. Seed users
        User alice = User.builder()
                .username("alice")
                .password(passwordEncoder.encode("password123"))
                .displayName("Alice Johnson")
                .email("alice@lansphere.local")
                .bio("Computer Networks Lead Engineer & System Architect")
                .avatarUrl("https://api.dicebear.com/7.x/bottts/svg?seed=alice")
                .status(UserStatus.ONLINE)
                .ipAddress("192.168.1.102")
                .macAddress("A4:83:E7:2B:11:01")
                .hostname("alice-workstation")
                .lastSeen(LocalDateTime.now())
                .build();

        User bob = User.builder()
                .username("bob")
                .password(passwordEncoder.encode("password123"))
                .displayName("Bob Smith")
                .email("bob@lansphere.local")
                .bio("Infra & Security Specialist")
                .avatarUrl("https://api.dicebear.com/7.x/bottts/svg?seed=bob")
                .status(UserStatus.ONLINE)
                .ipAddress("192.168.1.103")
                .macAddress("BC:54:2F:81:92:02")
                .hostname("bob-thinkpad")
                .lastSeen(LocalDateTime.now())
                .build();

        User charlie = User.builder()
                .username("charlie")
                .password(passwordEncoder.encode("password123"))
                .displayName("Charlie Davis")
                .email("charlie@lansphere.local")
                .bio("Embedded Systems & Socket Programmer")
                .avatarUrl("https://api.dicebear.com/7.x/bottts/svg?seed=charlie")
                .status(UserStatus.AWAY)
                .ipAddress("192.168.1.104")
                .macAddress("E8:9D:87:3C:44:03")
                .hostname("charlie-macbook")
                .lastSeen(LocalDateTime.now().minusMinutes(12))
                .build();

        User david = User.builder()
                .username("david")
                .password(passwordEncoder.encode("password123"))
                .displayName("David Miller")
                .email("david@lansphere.local")
                .bio("Network Protocols & Performance Analyst")
                .avatarUrl("https://api.dicebear.com/7.x/bottts/svg?seed=david")
                .status(UserStatus.BUSY)
                .ipAddress("192.168.1.108")
                .macAddress("F0:2F:74:10:85:04")
                .hostname("david-desktop")
                .lastSeen(LocalDateTime.now())
                .build();

        userRepository.saveAll(List.of(alice, bob, charlie, david));

        // 2. Direct Conversations & Messages
        Conversation convAliceBob = chatService.getOrCreateDirectConversation(alice.getId(), bob.getId());
        chatService.sendMessage(bob.getId(), new SendMessageRequest("Hey Alice! Connected to LanSphere node. Latency is sub-2ms!", convAliceBob.getId(), "TEXT", null, null));
        chatService.sendMessage(alice.getId(), new SendMessageRequest("Awesome Bob! Local file transfers are reaching full Gigabit speeds on this subnet.", convAliceBob.getId(), "TEXT", null, null));

        Conversation convAliceCharlie = chatService.getOrCreateDirectConversation(alice.getId(), charlie.getId());
        chatService.sendMessage(charlie.getId(), new SendMessageRequest("Verified the socket listener on port 8080. Ready for the next protocol tests.", convAliceCharlie.getId(), "TEXT", null, null));

        // 3. Groups
        CreateGroupRequest groupReq = new CreateGroupRequest(
                "LAN Core Engineers",
                "Local network architecture discussion and telemetry channel",
                true,
                50,
                List.of(bob.getId(), charlie.getId(), david.getId())
        );
        var group = groupService.createGroup(alice.getId(), groupReq);

        chatService.sendMessage(alice.getId(), new SendMessageRequest(
                "Welcome everyone to the #LAN-Core group! High-throughput zero-internet collaboration is live.",
                group.getConversationId(),
                "TEXT",
                null,
                null
        ));

        // 4. Activity Logs
        activityLogService.logActivity(alice, "NODE_ONLINE", "Node initialized on IP 192.168.1.102", "192.168.1.102", "NETWORK", null);
        activityLogService.logActivity(bob, "PEER_CONNECTED", "Peer authenticated via local credentials", "192.168.1.103", "USER", bob.getId());
        activityLogService.logActivity(alice, "CHANNEL_BROADCAST", "Sent announcement in LAN Core Engineers", "192.168.1.102", "GROUP", group.getId());

        log.info("LanSphere demonstration dataset successfully seeded!");
    }
}
