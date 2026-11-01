package com.editor.core.repository.document;

import com.editor.core.model.document.YjsUpdateLog;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface YjsUpdateLogRepository extends MongoRepository<YjsUpdateLog, String> {
    List<YjsUpdateLog> findByWorkspaceIdAndDocumentNameOrderByTimestampAsc(String workspaceId, String documentName);
    void deleteByWorkspaceId(String workspaceId);
}
