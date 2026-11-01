package com.editor.core.repository.jpa;

import com.editor.core.model.jpa.Workspace;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkspaceRepository extends JpaRepository<Workspace, String> {

    @Query("SELECT w FROM Workspace w WHERE w.owner.id = :userId OR EXISTS (SELECT wm FROM WorkspaceMember wm WHERE wm.workspace = w AND wm.user.id = :userId)")
    List<Workspace> findAllAccessibleByUser(@Param("userId") String userId);
}
