package com.editor.core.repository.jpa;

import com.editor.core.model.jpa.WorkspaceMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WorkspaceMemberRepository extends JpaRepository<WorkspaceMember, WorkspaceMember.WorkspaceMemberId> {
    Optional<WorkspaceMember> findByWorkspaceIdAndUserId(String workspaceId, String userId);
    void deleteByWorkspaceIdAndUserId(String workspaceId, String userId);
}
