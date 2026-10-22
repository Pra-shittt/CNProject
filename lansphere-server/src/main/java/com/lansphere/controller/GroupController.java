package com.lansphere.controller;

import com.lansphere.dto.request.CreateGroupRequest;
import com.lansphere.dto.response.ApiResponse;
import com.lansphere.dto.response.GroupResponse;
import com.lansphere.entity.User;
import com.lansphere.service.AuthService;
import com.lansphere.service.GroupService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/groups")
@RequiredArgsConstructor
public class GroupController {

    private final GroupService groupService;
    private final AuthService authService;

    @GetMapping("/public")
    public ResponseEntity<ApiResponse<List<GroupResponse>>> getPublicGroups() {
        return ResponseEntity.ok(ApiResponse.success(groupService.getPublicGroups()));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<GroupResponse>>> getMyGroups() {
        User currentUser = authService.getCurrentAuthenticatedUser();
        return ResponseEntity.ok(ApiResponse.success(groupService.getUserGroups(currentUser.getId())));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<GroupResponse>> getGroupById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(groupService.getGroupById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<GroupResponse>> createGroup(@Valid @RequestBody CreateGroupRequest request) {
        User currentUser = authService.getCurrentAuthenticatedUser();
        GroupResponse response = groupService.createGroup(currentUser.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Group created successfully", response));
    }

    @PostMapping("/{id}/join")
    public ResponseEntity<ApiResponse<GroupResponse>> joinGroup(@PathVariable Long id) {
        User currentUser = authService.getCurrentAuthenticatedUser();
        GroupResponse response = groupService.joinGroup(id, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Joined group successfully", response));
    }

    @PostMapping("/{id}/leave")
    public ResponseEntity<ApiResponse<Void>> leaveGroup(@PathVariable Long id) {
        User currentUser = authService.getCurrentAuthenticatedUser();
        groupService.leaveGroup(id, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Left group successfully", null));
    }
}
