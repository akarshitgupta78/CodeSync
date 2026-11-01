package com.editor.core.model.document;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.Instant;

@Document(collection = "documents")
@CompoundIndex(name = "ws_doc_idx", def = "{'workspace_id': 1, 'document_name': 1}", unique = true)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentSnapshot {

    @Id
    private String id;

    @Field("workspace_id")
    private String workspaceId;

    @Field("document_name")
    private String documentName;

    /**
     * Binary representation of the base merged Yjs state vector / document.
     */
    @Field("yjs_state")
    private byte[] yjsState;

    @Field("updated_at")
    private Instant updatedAt;
}
