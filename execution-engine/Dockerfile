# Build stage
FROM maven:3.9-eclipse-temurin-21-alpine AS builder

WORKDIR /app

COPY pom.xml .
COPY src ./src

RUN mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:21-jre-alpine

# Install docker-cli for containerized sandboxing and python/nodejs for local fallback
RUN apk add --no-cache docker-cli python3 nodejs

WORKDIR /app

COPY --from=builder /app/target/execution-engine-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8081

ENTRYPOINT ["java", "-jar", "app.jar"]

