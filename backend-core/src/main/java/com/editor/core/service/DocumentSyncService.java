package com.editor.core.service;

import com.editor.core.model.document.DocumentSnapshot;
import com.editor.core.model.document.YjsUpdateLog;
import com.editor.core.repository.document.DocumentSnapshotRepository;
import com.editor.core.repository.document.YjsUpdateLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentSyncService {

    private final DocumentSnapshotRepository snapshotRepository;
    private final YjsUpdateLogRepository updateLogRepository;
    private final RedisTemplate<String, byte[]> redisTemplate;

    /**
     * Store incremental update log in Mongo & publish to Redis Pub/Sub cluster.
     */
    public void processIncomingUpdate(String workspaceId, String documentName, String userId, byte[] update) {
        // 1. Persist incremental update in MongoDB
        YjsUpdateLog logEntry = YjsUpdateLog.builder()
                .workspaceId(workspaceId)
                .documentName(documentName != null ? documentName : "main")
                .senderUserId(userId)
                .updatePayload(update)
                .timestamp(Instant.now())
                .build();
        updateLogRepository.save(logEntry);

        // 2. Publish to Redis channel for multi-node synchronization
        String channel = "crdt:workspace:" + workspaceId;
        redisTemplate.convertAndSend(channel, update);
    }

    /**
     * Retrieve the document snapshot or empty base state for initial sync.
     */
    public Optional<DocumentSnapshot> getLatestSnapshot(String workspaceId, String documentName) {
        return snapshotRepository.findByWorkspaceIdAndDocumentName(
                workspaceId,
                documentName != null ? documentName : "main"
        );
    }

    /**
     * Persist or update merged document snapshot.
     */
    public void saveSnapshot(String workspaceId, String documentName, byte[] mergedState) {
        String docName = (documentName != null ? documentName : "main");
        DocumentSnapshot snapshot = snapshotRepository.findByWorkspaceIdAndDocumentName(workspaceId, docName)
                .orElse(DocumentSnapshot.builder()
                        .workspaceId(workspaceId)
                        .documentName(docName)
                        .build());

        snapshot.setYjsState(mergedState);
        snapshot.setUpdatedAt(Instant.now());
        snapshotRepository.save(snapshot);
        log.info("Persisted CRDT snapshot for workspace={}, doc={}", workspaceId, docName);
    }
}
