package com.editor.execution.service;

import com.editor.execution.dto.ExecutionRequest;
import com.editor.execution.dto.ExecutionResult;
import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.async.ResultCallback;
import com.github.dockerjava.api.command.CreateContainerResponse;
import com.github.dockerjava.api.command.WaitContainerResultCallback;
import com.github.dockerjava.api.model.Frame;
import com.github.dockerjava.api.model.HostConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.Closeable;
import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class DockerExecutionService {

    private final DockerClient dockerClient;

    @Value("${execution.timeout-seconds:10}")
    private int timeoutSeconds;

    @Value("${execution.memory-limit-mb:256}")
    private long memoryLimitMb;

    public ExecutionResult executeCode(ExecutionRequest request) {
        long startTime = System.currentTimeMillis();

        if (dockerClient == null) {
            return executeWithLocalProcess(request, startTime);
        }

        try {
            return executeInDocker(request, startTime);
        } catch (Exception ex) {
            log.error("Docker execution failed, falling back to local runner: {}", ex.getMessage());
            return executeWithLocalProcess(request, startTime);
        }
    }

    private ExecutionResult executeInDocker(ExecutionRequest request, long startTime) throws Exception {
        String lang = request.getLanguage().toLowerCase();
        String image;
        String[] cmd;

        switch (lang) {
            case "python", "py" -> {
                image = "python:3.11-alpine";
                cmd = new String[]{"python", "-c", request.getCode()};
            }
            case "javascript", "js", "node" -> {
                image = "node:20-alpine";
                cmd = new String[]{"node", "-e", request.getCode()};
            }
            default -> throw new IllegalArgumentException("Unsupported language for Docker sandbox: " + lang);
        }

        HostConfig hostConfig = HostConfig.newHostConfig()
                .withMemory(memoryLimitMb * 1024 * 1024L)
                .withMemorySwap(memoryLimitMb * 1024 * 1024L)
                .withNetworkMode("none") // CRITICAL: No network access
                .withAutoRemove(true);

        CreateContainerResponse container = dockerClient.createContainerCmd(image)
                .withHostConfig(hostConfig)
                .withCmd(cmd)
                .exec();

        String containerId = container.getId();
        dockerClient.startContainerCmd(containerId).exec();

        StringBuilder stdout = new StringBuilder();
        StringBuilder stderr = new StringBuilder();

        dockerClient.logContainerCmd(containerId)
                .withStdOut(true)
                .withStdErr(true)
                .withFollowStream(true)
                .exec(new ResultCallback.Adapter<Frame>() {
                    @Override
                    public void onNext(Frame item) {
                        String payload = new String(item.getPayload(), StandardCharsets.UTF_8);
                        switch (item.getStreamType()) {
                            case STDOUT -> stdout.append(payload);
                            case STDERR -> stderr.append(payload);
                            default -> {}
                        }
                    }
                });

        Integer exitCode = dockerClient.waitContainerCmd(containerId)
                .exec(new WaitContainerResultCallback())
                .awaitStatusCode(timeoutSeconds, TimeUnit.SECONDS);

        long duration = System.currentTimeMillis() - startTime;

        return ExecutionResult.builder()
                .stdout(stdout.toString())
                .stderr(stderr.toString())
                .exitCode(exitCode != null ? exitCode : 0)
                .executionTimeMs(duration)
                .status(exitCode != null && exitCode == 0 ? "SUCCESS" : "ERROR")
                .build();
    }

    private ExecutionResult executeWithLocalProcess(ExecutionRequest request, long startTime) {
        String lang = request.getLanguage().toLowerCase();
        ProcessBuilder processBuilder;
        Path tempFile = null;

        try {
            if ("python".equals(lang) || "py".equals(lang)) {
                tempFile = Files.createTempFile("codesync_run_", ".py");
                Files.writeString(tempFile, request.getCode());
                processBuilder = new ProcessBuilder("python", tempFile.toString());
            } else if ("javascript".equals(lang) || "js".equals(lang) || "node".equals(lang)) {
                tempFile = Files.createTempFile("codesync_run_", ".js");
                Files.writeString(tempFile, request.getCode());
                processBuilder = new ProcessBuilder("node", tempFile.toString());
            } else {
                return ExecutionResult.builder()
                        .stdout("")
                        .stderr("Language not supported for direct execution: " + lang)
                        .exitCode(1)
                        .executionTimeMs(0)
                        .status("ERROR")
                        .build();
            }

            Process process = processBuilder.start();
            boolean completed = process.waitFor(timeoutSeconds, TimeUnit.SECONDS);
            long duration = System.currentTimeMillis() - startTime;

            if (!completed) {
                process.destroyForcibly();
                return ExecutionResult.builder()
                        .stdout("")
                        .stderr("Execution timed out after " + timeoutSeconds + " seconds")
                        .exitCode(-1)
                        .executionTimeMs(duration)
                        .status("TIMED_OUT")
                        .build();
            }

            String stdout = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
            String stderr = new String(process.getErrorStream().readAllBytes(), StandardCharsets.UTF_8);
            int exitCode = process.exitValue();

            return ExecutionResult.builder()
                    .stdout(stdout)
                    .stderr(stderr)
                    .exitCode(exitCode)
                    .executionTimeMs(duration)
                    .status(exitCode == 0 ? "SUCCESS" : "ERROR")
                    .build();

        } catch (Exception e) {
            return ExecutionResult.builder()
                    .stdout("")
                    .stderr("Execution failed: " + e.getMessage())
                    .exitCode(1)
                    .executionTimeMs(System.currentTimeMillis() - startTime)
                    .status("ERROR")
                    .build();
        } finally {
            if (tempFile != null) {
                try {
                    Files.deleteIfExists(tempFile);
                } catch (IOException ignored) {}
            }
        }
    }
}
