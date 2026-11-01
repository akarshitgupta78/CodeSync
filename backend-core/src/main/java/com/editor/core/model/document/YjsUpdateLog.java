package com.editor.core.model.document;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.Instant;

@Document(collection = "yjs_update_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class YjsUpdateLog {

    @Id
    private String id;

    @Indexed
    @Field("workspace_id")
    private String workspaceId;

    @Field("document_name")
    private String documentName;

    @Field("sender_user_id")
    private String senderUserId;

    /**
     * Raw Yjs binary delta update.
     */
    @Field("update_payload")
    private byte[] updatePayload;

    @Field("timestamp")
    private Instant timestamp;
}
