package com.editor.core.repository.document;

import com.editor.core.model.document.DocumentSnapshot;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DocumentSnapshotRepository extends MongoRepository<DocumentSnapshot, String> {
    Optional<DocumentSnapshot> findByWorkspaceIdAndDocumentName(String workspaceId, String documentName);
    void deleteByWorkspaceId(String workspaceId);
}
