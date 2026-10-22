package com.lansphere.service;

import com.lansphere.dto.request.CreateGroupRequest;
import com.lansphere.dto.response.GroupResponse;
import com.lansphere.entity.*;
import com.lansphere.entity.enums.ConversationType;
import com.lansphere.entity.enums.GroupMemberRole;
import com.lansphere.entity.enums.NotificationType;
import com.lansphere.exception.BadRequestException;
import com.lansphere.exception.ResourceNotFoundException;
import com.lansphere.repository.*;
import com.lansphere.util.DtoMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GroupService {

    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final ConversationRepository conversationRepository;
    private final ConversationParticipantRepository participantRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final ActivityLogService activityLogService;

    @Transactional
    public GroupResponse createGroup(Long ownerId, CreateGroupRequest request) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", ownerId));

        // Create underlying group conversation
        Conversation conv = Conversation.builder()
                .type(ConversationType.GROUP)
                .name(request.getName())
                .avatarUrl("https://api.dicebear.com/7.x/identicon/svg?seed=" + request.getName())
                .build();
        Conversation savedConv = conversationRepository.save(conv);

        // Add owner as participant
        ConversationParticipant ownerParticipant = ConversationParticipant.builder()
                .conversation(savedConv)
                .user(owner)
                .unreadCount(0)
                .build();
        participantRepository.save(ownerParticipant);

        // Create group
        Group group = Group.builder()
                .name(request.getName())
                .description(request.getDescription())
                .avatarUrl("https://api.dicebear.com/7.x/identicon/svg?seed=" + request.getName())
                .owner(owner)
                .conversation(savedConv)
                .maxMembers(request.getMaxMembers() != null ? request.getMaxMembers() : 50)
                .isPublic(request.getIsPublic() != null ? request.getIsPublic() : true)
                .build();

        Group savedGroup = groupRepository.save(group);

        // Add owner as GroupMember with OWNER role
        GroupMember ownerMember = GroupMember.builder()
                .group(savedGroup)
                .user(owner)
                .role(GroupMemberRole.OWNER)
                .build();
        groupMemberRepository.save(ownerMember);

        List<GroupMember> membersList = new ArrayList<>();
        membersList.add(ownerMember);

        // Add optional initial members
        if (request.getMemberIds() != null) {
            for (Long memberId : request.getMemberIds()) {
                if (!memberId.equals(ownerId)) {
                    userRepository.findById(memberId).ifPresent(user -> {
                        GroupMember gm = GroupMember.builder()
                                .group(savedGroup)
                                .user(user)
                                .role(GroupMemberRole.MEMBER)
                                .build();
                        groupMemberRepository.save(gm);
                        membersList.add(gm);

                        ConversationParticipant cp = ConversationParticipant.builder()
                                .conversation(savedConv)
                                .user(user)
                                .unreadCount(0)
                                .build();
                        participantRepository.save(cp);

                        notificationService.sendNotification(user, NotificationType.GROUP_INVITE,
                                "Added to Group: " + savedGroup.getName(),
                                owner.getUsername() + " added you to the group.",
                                savedGroup.getId(), "GROUP", owner);
                    });
                }
            }
        }

        savedGroup.setMembers(membersList);

        activityLogService.logActivity(owner, "GROUP_CREATED", "Created group " + savedGroup.getName(),
                owner.getIpAddress(), "GROUP", savedGroup.getId());

        return DtoMapper.toGroupResponse(savedGroup);
    }

    @Transactional(readOnly = true)
    public List<GroupResponse> getPublicGroups() {
        return groupRepository.findByIsPublicTrue().stream()
                .map(DtoMapper::toGroupResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<GroupResponse> getUserGroups(Long userId) {
        return groupRepository.findByMemberUserId(userId).stream()
                .map(DtoMapper::toGroupResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public GroupResponse getGroupById(Long groupId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group", "id", groupId));
        return DtoMapper.toGroupResponse(group);
    }

    @Transactional
    public GroupResponse joinGroup(Long groupId, Long userId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group", "id", groupId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (groupMemberRepository.existsByGroupIdAndUserId(groupId, userId)) {
            throw new BadRequestException("You are already a member of this group.");
        }

        long count = groupMemberRepository.countByGroupId(groupId);
        if (count >= group.getMaxMembers()) {
            throw new BadRequestException("Group has reached its maximum member capacity.");
        }

        GroupMember gm = GroupMember.builder()
                .group(group)
                .user(user)
                .role(GroupMemberRole.MEMBER)
                .build();
        groupMemberRepository.save(gm);

        ConversationParticipant cp = ConversationParticipant.builder()
                .conversation(group.getConversation())
                .user(user)
                .unreadCount(0)
                .build();
        participantRepository.save(cp);

        activityLogService.logActivity(user, "GROUP_JOINED", "Joined group " + group.getName(),
                user.getIpAddress(), "GROUP", group.getId());

        return getGroupById(groupId);
    }

    @Transactional
    public void leaveGroup(Long groupId, Long userId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group", "id", groupId));

        if (group.getOwner().getId().equals(userId)) {
            throw new BadRequestException("Group owner cannot leave the group. Transfer ownership or delete group.");
        }

        groupMemberRepository.deleteByGroupIdAndUserId(groupId, userId);
        participantRepository.deleteByConversationIdAndUserId(group.getConversation().getId(), userId);

        User user = userRepository.findById(userId).orElse(null);
        if (user != null) {
            activityLogService.logActivity(user, "GROUP_LEFT", "Left group " + group.getName(),
                    user.getIpAddress(), "GROUP", group.getId());
        }
    }
}
