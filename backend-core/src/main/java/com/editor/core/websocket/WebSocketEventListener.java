package com.editor.core.websocket;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketEventListener {

    private final SimpMessageSendingOperations messagingTemplate;
    // Map of sessionId -> (workspaceId, username)
    private final Map<String, UserPresence> activeSessions = new ConcurrentHashMap<>();

    public record UserPresence(String workspaceId, String username, String color) {}

    public void registerPresence(String sessionId, String workspaceId, String username, String color) {
        activeSessions.put(sessionId, new UserPresence(workspaceId, username, color));
        broadcastPresence(workspaceId);
    }

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        log.info("Received a new web socket connection");
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();

        if (sessionId != null && activeSessions.containsKey(sessionId)) {
            UserPresence presence = activeSessions.remove(sessionId);
            log.info("User {} disconnected from workspace {}", presence.username(), presence.workspaceId());
            broadcastPresence(presence.workspaceId());
        }
    }

    private void broadcastPresence(String workspaceId) {
        var usersInRoom = activeSessions.values().stream()
                .filter(p -> p.workspaceId().equals(workspaceId))
                .toList();

        messagingTemplate.convertAndSend("/topic/workspace/" + workspaceId + "/presence", usersInRoom);
    }
}
