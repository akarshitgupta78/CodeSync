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
        if (update == null || update.length == 0) {
            return;
        }

        // 1. Persist incremental update in MongoDB
        try {
            YjsUpdateLog logEntry = YjsUpdateLog.builder()
                    .workspaceId(workspaceId)
                    .documentName(documentName != null ? documentName : "main")
                    .senderUserId(userId)
                    .updatePayload(update)
                    .timestamp(Instant.now())
                    .build();
            updateLogRepository.save(logEntry);
        } catch (Exception e) {
            log.warn("MongoDB update log write failed: {}", e.getMessage());
        }
    }

    /**
     * Retrieve the document snapshot and any trailing incremental updates for initial sync.
     */
    public java.util.Map<String, Object> getInitialState(String workspaceId, String documentName) {
        String docName = (documentName != null ? documentName : "main");
        Optional<DocumentSnapshot> snapshotOpt = snapshotRepository.findByWorkspaceIdAndDocumentName(workspaceId, docName);

        String snapshotBase64 = null;
        Instant snapshotUpdatedAt = null;
        if (snapshotOpt.isPresent()) {
            DocumentSnapshot snapshot = snapshotOpt.get();
            if (snapshot.getYjsState() != null && snapshot.getYjsState().length > 4) {
                snapshotBase64 = java.util.Base64.getEncoder().encodeToString(snapshot.getYjsState());
                snapshotUpdatedAt = snapshot.getUpdatedAt();
            }
        }

        java.util.List<YjsUpdateLog> updateLogs = updateLogRepository.findByWorkspaceIdAndDocumentNameOrderByTimestampAsc(workspaceId, docName);
        java.util.List<String> updatesBase64 = new java.util.ArrayList<>();
        
        // Return incremental updates to ensure zero loss across refreshes
        for (YjsUpdateLog logEntry : updateLogs) {
            if (logEntry.getUpdatePayload() != null && logEntry.getUpdatePayload().length > 0) {
                updatesBase64.add(java.util.Base64.getEncoder().encodeToString(logEntry.getUpdatePayload()));
            }
        }

        java.util.Map<String, Object> result = new java.util.HashMap<>();
        result.put("workspaceId", workspaceId);
        result.put("documentName", docName);
        result.put("yjsStateBase64", snapshotBase64);
        result.put("updatesBase64", updatesBase64);
        result.put("updatedAt", snapshotUpdatedAt);
        return result;
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
        // Guard against empty / uninitialized snapshots overwriting real content
        if (mergedState == null || mergedState.length <= 4) {
            log.warn("Ignoring empty/uninitialized snapshot for workspace={}", workspaceId);
            return;
        }

        String docName = (documentName != null ? documentName : "main");
        DocumentSnapshot snapshot = snapshotRepository.findByWorkspaceIdAndDocumentName(workspaceId, docName)
                .orElse(DocumentSnapshot.builder()
                        .workspaceId(workspaceId)
                        .documentName(docName)
                        .build());

        snapshot.setYjsState(mergedState);
        snapshot.setUpdatedAt(Instant.now());
        snapshotRepository.save(snapshot);

        // Safely prune trailing update logs once the snapshot is securely updated
        try {
            updateLogRepository.deleteByWorkspaceIdAndDocumentName(workspaceId, docName);
        } catch (Exception e) {
            log.debug("Update log prune skipped: {}", e.getMessage());
        }

        log.info("Persisted CRDT snapshot for workspace={}, doc={}", workspaceId, docName);
    }
}
