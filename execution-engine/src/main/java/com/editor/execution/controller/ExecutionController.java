package com.editor.execution.controller;

import com.editor.execution.dto.ExecutionRequest;
import com.editor.execution.dto.ExecutionResult;
import com.editor.execution.service.DockerExecutionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/execute")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ExecutionController {

    private final DockerExecutionService executionService;

    @PostMapping
    public ResponseEntity<ExecutionResult> execute(@Valid @RequestBody ExecutionRequest request) {
        ExecutionResult result = executionService.executeCode(request);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Execution Engine is running on port 8081");
    }
}
