package com.editor.core.websocket;

import com.editor.core.service.DocumentSyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Controller;

import java.util.Base64;
import java.util.Map;

@Slf4j
@Controller
@RequiredArgsConstructor
public class DocumentSyncHandler {

    private final SimpMessageSendingOperations messagingTemplate;
    private final DocumentSyncService documentSyncService;
    private final WebSocketEventListener eventListener;

    /**
     * Handles incoming Yjs binary/base64 updates from collaborators.
     */
    @MessageMapping("/workspace/{workspaceId}/sync")
    public void handleSyncMessage(
            @DestinationVariable String workspaceId,
            @Payload Map<String, Object> payload,
            SimpMessageHeaderAccessor headerAccessor) {

        String docName = (String) payload.getOrDefault("docName", "main");
        String senderId = (String) payload.getOrDefault("senderId", "anonymous");
        String updateBase64 = (String) payload.get("update");

        if (updateBase64 != null) {
            byte[] updateBytes = Base64.getDecoder().decode(updateBase64);

            // Persist incremental update in Mongo & publish to Redis for cluster scaling
            documentSyncService.processIncomingUpdate(workspaceId, docName, senderId, updateBytes);

            // Broadcast to other clients subscribed to this workspace
            messagingTemplate.convertAndSend("/topic/workspace/" + workspaceId + "/sync", payload);
        }
    }

    /**
     * Broadcasts live cursor position & text selections.
     */
    @MessageMapping("/workspace/{workspaceId}/cursor")
    public void handleCursorMessage(
            @DestinationVariable String workspaceId,
            @Payload Map<String, Object> cursorData) {
        messagingTemplate.convertAndSend("/topic/workspace/" + workspaceId + "/cursor", cursorData);
    }

    /**
     * Broadcasts Yjs awareness (cursor positions, selections, and user presence).
     */
    @MessageMapping("/workspace/{workspaceId}/awareness")
    public void handleAwarenessMessage(
            @DestinationVariable String workspaceId,
            @Payload Map<String, Object> payload) {
        messagingTemplate.convertAndSend("/topic/workspace/" + workspaceId + "/awareness", payload);
    }

    /**
     * Registers presence for a user in the workspace.
     */
    @MessageMapping("/workspace/{workspaceId}/join")
    public void handleJoin(
            @DestinationVariable String workspaceId,
            @Payload Map<String, String> joinData,
            SimpMessageHeaderAccessor headerAccessor) {

        String sessionId = headerAccessor.getSessionId();
        String username = joinData.getOrDefault("username", "Anonymous");
        String color = joinData.getOrDefault("color", "#58a6ff");

        eventListener.registerPresence(sessionId, workspaceId, username, color);
    }
}
