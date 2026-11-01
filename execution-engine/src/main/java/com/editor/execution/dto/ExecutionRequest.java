package com.editor.execution.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExecutionRequest {

    @NotBlank(message = "Language is required (e.g. python, javascript, java, cpp)")
    private String language;

    @NotBlank(message = "Code cannot be empty")
    private String code;

    private String stdin;
}
