package com.editor.core;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

@SpringBootApplication
@EnableJpaRepositories(basePackages = "com.editor.core.repository.jpa")
@EnableMongoRepositories(basePackages = "com.editor.core.repository.document")
public class BackendCoreApplication {

    public static void main(String[] args) {
        SpringApplication.run(BackendCoreApplication.class, args);
    }
}
