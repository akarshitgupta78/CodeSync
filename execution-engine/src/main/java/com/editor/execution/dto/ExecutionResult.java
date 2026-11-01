package com.editor.execution.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExecutionResult {
    private String stdout;
    private String stderr;
    private int exitCode;
    private long executionTimeMs;
    private String status; // SUCCESS, TIMED_OUT, ERROR
}
