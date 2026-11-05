package com.editor.core.service;

import com.editor.core.dto.CreateWorkspaceRequest;
import com.editor.core.dto.WorkspaceDto;
import com.editor.core.model.jpa.Role;
import com.editor.core.model.jpa.User;
import com.editor.core.model.jpa.Workspace;
import com.editor.core.model.jpa.WorkspaceMember;
import com.editor.core.repository.document.DocumentSnapshotRepository;
import com.editor.core.repository.document.YjsUpdateLogRepository;
import com.editor.core.repository.jpa.UserRepository;
import com.editor.core.repository.jpa.WorkspaceMemberRepository;
import com.editor.core.repository.jpa.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WorkspaceService {

    private static final String ROOM_ID_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";
    private static final int ROOM_ID_LENGTH = 6;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository memberRepository;
    private final UserRepository userRepository;
    private final DocumentSnapshotRepository snapshotRepository;
    private final YjsUpdateLogRepository updateLogRepository;

    private String generateUniqueRoomId() {
        String id;
        do {
            StringBuilder sb = new StringBuilder(ROOM_ID_LENGTH);
            for (int i = 0; i < ROOM_ID_LENGTH; i++) {
                sb.append(ROOM_ID_CHARS.charAt(RANDOM.nextInt(ROOM_ID_CHARS.length())));
            }
            id = sb.toString();
        } while (workspaceRepository.existsById(id));
        return id;
    }

    @Transactional
    public WorkspaceDto createWorkspace(CreateWorkspaceRequest request, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));

        String workspaceId = generateUniqueRoomId();
        Workspace workspace = Workspace.builder()
                .id(workspaceId)
                .name(request.getName().trim())
                .owner(user)
                .build();

        workspaceRepository.save(workspace);

        WorkspaceMember adminMember = WorkspaceMember.builder()
                .id(new WorkspaceMember.WorkspaceMemberId(workspaceId, user.getId()))
                .workspace(workspace)
                .user(user)
                .role(Role.ADMIN)
                .build();

        memberRepository.save(adminMember);

        return WorkspaceDto.builder()
                .id(workspace.getId())
                .name(workspace.getName())
                .ownerId(user.getId())
                .ownerUsername(user.getUsername())
                .currentUserRole(Role.ADMIN)
                .memberCount(1)
                .createdAt(workspace.getCreatedAt())
                .build();
    }

    @Transactional(readOnly = true)
    public List<WorkspaceDto> getUserWorkspaces(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));

        return workspaceRepository.findAllAccessibleByUser(user.getId())
                .stream()
                .map(ws -> {
                    Role role = ws.getOwner().getId().equals(user.getId()) ? Role.ADMIN :
                            memberRepository.findByWorkspaceIdAndUserId(ws.getId(), user.getId())
                                    .map(WorkspaceMember::getRole)
                                    .orElse(Role.VIEWER);

                    return WorkspaceDto.builder()
                            .id(ws.getId())
                            .name(ws.getName())
                            .ownerId(ws.getOwner().getId())
                            .ownerUsername(ws.getOwner().getUsername())
                            .currentUserRole(role)
                            .memberCount(ws.getMembers().size())
                            .createdAt(ws.getCreatedAt())
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public WorkspaceDto getWorkspaceById(String workspaceId, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));

        Workspace ws = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new IllegalArgumentException("Workspace not found: " + workspaceId));

        boolean isOwner = ws.getOwner().getId().equals(user.getId());
        Role role = isOwner ? Role.ADMIN :
                memberRepository.findByWorkspaceIdAndUserId(ws.getId(), user.getId())
                        .map(WorkspaceMember::getRole)
                        .orElse(null);

        if (role == null) {
            // Auto-join as EDITOR for collaborative room link sharing
            WorkspaceMember newMember = WorkspaceMember.builder()
                    .id(new WorkspaceMember.WorkspaceMemberId(ws.getId(), user.getId()))
                    .workspace(ws)
                    .user(user)
                    .role(Role.EDITOR)
                    .build();
            memberRepository.save(newMember);
            role = Role.EDITOR;
        }

        return WorkspaceDto.builder()
                .id(ws.getId())
                .name(ws.getName())
                .ownerId(ws.getOwner().getId())
                .ownerUsername(ws.getOwner().getUsername())
                .currentUserRole(role)
                .memberCount(ws.getMembers().size())
                .createdAt(ws.getCreatedAt())
                .build();
    }

    @Transactional
    public void deleteWorkspace(String workspaceId, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));

        Workspace ws = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new IllegalArgumentException("Workspace not found: " + workspaceId));

        boolean isOwner = ws.getOwner().getId().equals(user.getId());
        Role role = isOwner ? Role.ADMIN :
                memberRepository.findByWorkspaceIdAndUserId(ws.getId(), user.getId())
                        .map(WorkspaceMember::getRole)
                        .orElse(null);

        if (!isOwner && role != Role.ADMIN) {
            throw new AccessDeniedException("Only a workspace admin or owner can delete this workspace");
        }

        // 1. Delete associated MongoDB document snapshots & CRDT update logs
        snapshotRepository.deleteByWorkspaceId(workspaceId);
        updateLogRepository.deleteByWorkspaceId(workspaceId);

        // 2. Delete workspace from PostgreSQL (members are cascade deleted)
        workspaceRepository.delete(ws);
    }
}
