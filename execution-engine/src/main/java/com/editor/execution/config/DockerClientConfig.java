package com.editor.execution.config;

import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.core.DefaultDockerClientConfig;
import com.github.dockerjava.core.DockerClientImpl;
import com.github.dockerjava.httpclient5.ApacheDockerHttpClient;
import com.github.dockerjava.transport.DockerHttpClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Slf4j
@Configuration
public class DockerClientConfig {

    @Bean
    public DockerClient dockerClient() {
        try {
            DefaultDockerClientConfig config = DefaultDockerClientConfig.createDefaultConfigBuilder().build();

            DockerHttpClient httpClient = new ApacheDockerHttpClient.Builder()
                    .dockerHost(config.getDockerHost())
                    .sslConfig(config.getSSLConfig())
                    .maxConnections(50)
                    .connectionTimeout(Duration.ofSeconds(10))
                    .responseTimeout(Duration.ofSeconds(30))
                    .build();

            DockerClient client = DockerClientImpl.getInstance(config, httpClient);
            log.info("Initialized DockerClient connecting to host: {}", config.getDockerHost());
            return client;
        } catch (Exception e) {
            log.warn("Could not connect to Docker daemon: {}. Sandboxed Docker execution will run in simulation/fallback mode.", e.getMessage());
            return null;
        }
    }
}
