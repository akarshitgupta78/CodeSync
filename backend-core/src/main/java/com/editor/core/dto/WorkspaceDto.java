package com.editor.core.dto;

import com.editor.core.model.jpa.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkspaceDto {
    private String id;
    private String name;
    private String ownerId;
    private String ownerUsername;
    private Role currentUserRole;
    private int memberCount;
    private Instant createdAt;
}
