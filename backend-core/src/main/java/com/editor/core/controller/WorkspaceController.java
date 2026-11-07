package com.editor.core.controller;

import com.editor.core.dto.CreateWorkspaceRequest;
import com.editor.core.dto.WorkspaceDto;
import com.editor.core.model.document.DocumentSnapshot;
import com.editor.core.service.DocumentSyncService;
import com.editor.core.service.WorkspaceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Base64;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/workspaces")
@RequiredArgsConstructor
public class WorkspaceController {

    private final WorkspaceService workspaceService;
    private final DocumentSyncService documentSyncService;

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgumentException(IllegalArgumentException ex) {
        return ResponseEntity.status(404).body(Map.of("message", ex.getMessage()));
    }

    @PostMapping
    public ResponseEntity<WorkspaceDto> createWorkspace(
            @Valid @RequestBody CreateWorkspaceRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(workspaceService.createWorkspace(request, authentication.getName()));
    }

    @GetMapping
    public ResponseEntity<List<WorkspaceDto>> getUserWorkspaces(Authentication authentication) {
        return ResponseEntity.ok(workspaceService.getUserWorkspaces(authentication.getName()));
    }

    @GetMapping("/{workspaceId}")
    public ResponseEntity<WorkspaceDto> getWorkspace(
            @PathVariable String workspaceId,
            Authentication authentication) {
        return ResponseEntity.ok(workspaceService.getWorkspaceById(workspaceId, authentication.getName()));
    }

    @DeleteMapping("/{workspaceId}")
    public ResponseEntity<?> deleteWorkspace(
            @PathVariable String workspaceId,
            Authentication authentication) {
        workspaceService.deleteWorkspace(workspaceId, authentication.getName());
        return ResponseEntity.ok(Map.of("message", "Workspace deleted successfully"));
    }

    @GetMapping("/{workspaceId}/snapshot")
    public ResponseEntity<?> getSnapshot(
            @PathVariable String workspaceId,
            @RequestParam(defaultValue = "main") String docName) {
        return ResponseEntity.ok(documentSyncService.getInitialState(workspaceId, docName));
    }

    @PostMapping("/{workspaceId}/snapshot")
    public ResponseEntity<?> saveSnapshot(
            @PathVariable String workspaceId,
            @RequestParam(defaultValue = "main") String docName,
            @RequestBody Map<String, String> body) {
        String base64State = body.get("yjsStateBase64");
        if (base64State != null) {
            byte[] state = Base64.getDecoder().decode(base64State);
            documentSyncService.saveSnapshot(workspaceId, docName, state);
        }
        return ResponseEntity.ok(Map.of("status", "saved"));
    }
}
