# Java Spring Boot API Template

## Overview

Production-ready Spring Boot 3.2 REST API with Spring Security, Spring Data JPA, JWT authentication, and comprehensive configuration. Features hexagonal architecture, validation, OpenAPI documentation, and extensive testing support.

## Quick Start

```bash
# Create project using Spring Initializr
curl https://start.spring.io/starter.zip \
  -d type=maven-project \
  -d language=java \
  -d bootVersion=3.2.0 \
  -d baseDir=my-api \
  -d groupId=com.example \
  -d artifactId=my-api \
  -d name=my-api \
  -d packageName=com.example.myapi \
  -d javaVersion=21 \
  -d dependencies=web,data-jpa,security,validation,postgresql,lombok,actuator \
  -o my-api.zip

unzip my-api.zip && cd my-api

# Add additional dependencies to pom.xml, then:
mvn clean install
mvn spring-boot:run
```

## Project Structure

```
my-api/
├── src/
│   ├── main/
│   │   ├── java/com/example/myapi/
│   │   │   ├── MyApiApplication.java
│   │   │   ├── domain/
│   │   │   │   ├── model/
│   │   │   │   │   ├── User.java
│   │   │   │   │   ├── Item.java
│   │   │   │   │   ├── RefreshToken.java
│   │   │   │   │   └── enums/
│   │   │   │   │       └── UserRole.java
│   │   │   │   ├── repository/
│   │   │   │   │   ├── UserRepository.java
│   │   │   │   │   ├── ItemRepository.java
│   │   │   │   │   └── RefreshTokenRepository.java
│   │   │   │   ├── service/
│   │   │   │   │   ├── UserService.java
│   │   │   │   │   ├── ItemService.java
│   │   │   │   │   └── AuthService.java
│   │   │   │   └── exception/
│   │   │   │       ├── ResourceNotFoundException.java
│   │   │   │       ├── BadRequestException.java
│   │   │   │       └── UnauthorizedException.java
│   │   │   ├── application/
│   │   │   │   ├── dto/
│   │   │   │   │   ├── request/
│   │   │   │   │   │   ├── RegisterRequest.java
│   │   │   │   │   │   ├── LoginRequest.java
│   │   │   │   │   │   ├── RefreshTokenRequest.java
│   │   │   │   │   │   ├── CreateItemRequest.java
│   │   │   │   │   │   └── UpdateItemRequest.java
│   │   │   │   │   └── response/
│   │   │   │   │       ├── AuthResponse.java
│   │   │   │   │       ├── UserResponse.java
│   │   │   │   │       ├── ItemResponse.java
│   │   │   │   │       ├── ApiResponse.java
│   │   │   │   │       └── PageResponse.java
│   │   │   │   └── mapper/
│   │   │   │       ├── UserMapper.java
│   │   │   │       └── ItemMapper.java
│   │   │   ├── infrastructure/
│   │   │   │   ├── config/
│   │   │   │   │   ├── SecurityConfig.java
│   │   │   │   │   ├── JwtConfig.java
│   │   │   │   │   ├── OpenApiConfig.java
│   │   │   │   │   ├── CorsConfig.java
│   │   │   │   │   └── CacheConfig.java
│   │   │   │   ├── security/
│   │   │   │   │   ├── JwtTokenProvider.java
│   │   │   │   │   ├── JwtAuthenticationFilter.java
│   │   │   │   │   ├── JwtAuthenticationEntryPoint.java
│   │   │   │   │   ├── CustomUserDetails.java
│   │   │   │   │   └── CustomUserDetailsService.java
│   │   │   │   └── persistence/
│   │   │   │       └── JpaConfig.java
│   │   │   └── web/
│   │   │       ├── controller/
│   │   │       │   ├── AuthController.java
│   │   │       │   ├── UserController.java
│   │   │       │   └── ItemController.java
│   │   │       ├── exception/
│   │   │       │   ├── GlobalExceptionHandler.java
│   │   │       │   └── ErrorResponse.java
│   │   │       └── filter/
│   │   │           ├── RequestLoggingFilter.java
│   │   │           └── RateLimitFilter.java
│   │   └── resources/
│   │       ├── application.yml
│   │       ├── application-dev.yml
│   │       ├── application-prod.yml
│   │       └── db/migration/
│   │           ├── V1__create_users_table.sql
│   │           ├── V2__create_items_table.sql
│   │           └── V3__create_refresh_tokens_table.sql
│   └── test/
│       └── java/com/example/myapi/
│           ├── unit/
│           │   ├── service/
│           │   │   └── ItemServiceTest.java
│           │   └── controller/
│           │       └── ItemControllerTest.java
│           └── integration/
│               ├── AbstractIntegrationTest.java
│               └── ItemControllerIntegrationTest.java
├── pom.xml
├── docker-compose.yml
├── Dockerfile
└── README.md
```

## Configuration

### pom.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.0</version>
        <relativePath/>
    </parent>

    <groupId>com.example</groupId>
    <artifactId>my-api</artifactId>
    <version>1.0.0</version>
    <name>my-api</name>
    <description>Production-ready Spring Boot REST API</description>

    <properties>
        <java.version>21</java.version>
        <jjwt.version>0.12.3</jjwt.version>
        <mapstruct.version>1.5.5.Final</mapstruct.version>
        <springdoc.version>2.3.0</springdoc.version>
    </properties>

    <dependencies>
        <!-- Spring Boot Starters -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-cache</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-redis</artifactId>
        </dependency>

        <!-- Database -->
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>org.flywaydb</groupId>
            <artifactId>flyway-core</artifactId>
        </dependency>
        <dependency>
            <groupId>org.flywaydb</groupId>
            <artifactId>flyway-database-postgresql</artifactId>
        </dependency>

        <!-- JWT -->
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-api</artifactId>
            <version>${jjwt.version}</version>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-impl</artifactId>
            <version>${jjwt.version}</version>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-jackson</artifactId>
            <version>${jjwt.version}</version>
            <scope>runtime</scope>
        </dependency>

        <!-- Mapping -->
        <dependency>
            <groupId>org.mapstruct</groupId>
            <artifactId>mapstruct</artifactId>
            <version>${mapstruct.version}</version>
        </dependency>

        <!-- OpenAPI -->
        <dependency>
            <groupId>org.springdoc</groupId>
            <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
            <version>${springdoc.version}</version>
        </dependency>

        <!-- Utilities -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>

        <!-- Testing -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.springframework.security</groupId>
            <artifactId>spring-security-test</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.testcontainers</groupId>
            <artifactId>junit-jupiter</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.testcontainers</groupId>
            <artifactId>postgresql</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>com.h2database</groupId>
            <artifactId>h2</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <configuration>
                    <excludes>
                        <exclude>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                        </exclude>
                    </excludes>
                </configuration>
            </plugin>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <configuration>
                    <annotationProcessorPaths>
                        <path>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                            <version>${lombok.version}</version>
                        </path>
                        <path>
                            <groupId>org.mapstruct</groupId>
                            <artifactId>mapstruct-processor</artifactId>
                            <version>${mapstruct.version}</version>
                        </path>
                        <path>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok-mapstruct-binding</artifactId>
                            <version>0.2.0</version>
                        </path>
                    </annotationProcessorPaths>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
```

### application.yml

```yaml
spring:
  application:
    name: my-api

  profiles:
    active: dev

  datasource:
    url: jdbc:postgresql://${DB_HOST:localhost}:${DB_PORT:5432}/${DB_NAME:myapi_db}
    username: ${DB_USERNAME:postgres}
    password: ${DB_PASSWORD:postgres}
    hikari:
      maximum-pool-size: 10
      minimum-idle: 5
      idle-timeout: 300000
      connection-timeout: 20000

  jpa:
    hibernate:
      ddl-auto: validate
    open-in-view: false
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        format_sql: true
        default_schema: public

  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: true

  data:
    redis:
      host: ${REDIS_HOST:localhost}
      port: ${REDIS_PORT:6379}

  cache:
    type: redis
    redis:
      time-to-live: 3600000

server:
  port: ${SERVER_PORT:8080}
  error:
    include-message: always
    include-binding-errors: always

jwt:
  secret: ${JWT_SECRET:your-super-secret-key-with-at-least-32-characters-for-jwt-signing}
  access-token-expiration: ${JWT_ACCESS_EXPIRATION:900000} # 15 minutes
  refresh-token-expiration: ${JWT_REFRESH_EXPIRATION:604800000} # 7 days

cors:
  allowed-origins: ${CORS_ORIGINS:http://localhost:3000}
  allowed-methods: GET,POST,PUT,DELETE,PATCH,OPTIONS
  allowed-headers: "*"
  allow-credentials: true

rate-limit:
  requests-per-minute: ${RATE_LIMIT:100}

management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  endpoint:
    health:
      show-details: when-authorized

springdoc:
  api-docs:
    path: /api-docs
  swagger-ui:
    path: /swagger-ui.html
    operationsSorter: method

logging:
  level:
    root: INFO
    com.example.myapi: DEBUG
    org.springframework.security: DEBUG
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n"
```

### application-dev.yml

```yaml
spring:
  jpa:
    show-sql: true

logging:
  level:
    org.hibernate.SQL: DEBUG
    org.hibernate.type.descriptor.sql.BasicBinder: TRACE
```

### application-prod.yml

```yaml
spring:
  jpa:
    show-sql: false

logging:
  level:
    root: WARN
    com.example.myapi: INFO
```

## Database Migrations

### V1__create_users_table.sql

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'USER',
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);
```

### V2__create_items_table.sql

```sql
CREATE TABLE items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(18, 2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_items_user ON items(user_id);
CREATE INDEX idx_items_active ON items(is_active);
CREATE INDEX idx_items_created ON items(created_at);
```

### V3__create_refresh_tokens_table.sql

```sql
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_hash VARCHAR(255) NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP,
    revoked_reason VARCHAR(255),
    replaced_by_token VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);
```

## Domain Layer

### User.java

```java
package com.example.myapi.domain.model;

import com.example.myapi.domain.model.enums.UserRole;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private UserRole role = UserRole.USER;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Item> items = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<RefreshToken> refreshTokens = new ArrayList<>();

    public void recordLogin() {
        this.lastLoginAt = LocalDateTime.now();
    }

    public void updateProfile(String name, String email) {
        this.name = name;
        if (email != null) {
            this.email = email.toLowerCase();
        }
    }

    public void deactivate() {
        this.active = false;
    }

    public void activate() {
        this.active = true;
    }

    @PrePersist
    public void prePersist() {
        this.email = this.email.toLowerCase();
    }
}
```

### Item.java

```java
package com.example.myapi.domain.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Item {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal price;

    @Column(nullable = false)
    @Builder.Default
    private Integer quantity = 0;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public void update(String title, String description, BigDecimal price, Integer quantity) {
        this.title = title;
        this.description = description;
        this.price = price;
        this.quantity = quantity;
    }

    public void adjustQuantity(int adjustment) {
        int newQuantity = this.quantity + adjustment;
        if (newQuantity < 0) {
            throw new IllegalArgumentException("Quantity cannot be negative");
        }
        this.quantity = newQuantity;
    }

    public void deactivate() {
        this.active = false;
    }
}
```

### RefreshToken.java

```java
package com.example.myapi.domain.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "refresh_tokens")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "token_hash", nullable = false)
    private String tokenHash;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "revoked_at")
    private LocalDateTime revokedAt;

    @Column(name = "revoked_reason")
    private String revokedReason;

    @Column(name = "replaced_by_token")
    private String replacedByToken;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }

    public boolean isRevoked() {
        return revokedAt != null;
    }

    public boolean isActive() {
        return !isRevoked() && !isExpired();
    }

    public void revoke(String reason, String replacedByToken) {
        this.revokedAt = LocalDateTime.now();
        this.revokedReason = reason;
        this.replacedByToken = replacedByToken;
    }
}
```

### UserRole.java

```java
package com.example.myapi.domain.model.enums;

public enum UserRole {
    USER,
    ADMIN,
    SUPER_ADMIN
}
```

## Repositories

### UserRepository.java

```java
package com.example.myapi.domain.repository;

import com.example.myapi.domain.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.refreshTokens WHERE u.email = :email")
    Optional<User> findByEmailWithRefreshTokens(String email);

    @Query("SELECT u FROM User u WHERE u.email = :email AND u.active = true")
    Optional<User> findActiveByEmail(String email);
}
```

### ItemRepository.java

```java
package com.example.myapi.domain.repository;

import com.example.myapi.domain.model.Item;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface ItemRepository extends JpaRepository<Item, UUID>, JpaSpecificationExecutor<Item> {

    Page<Item> findByActiveTrue(Pageable pageable);

    Page<Item> findByUserIdAndActiveTrue(UUID userId, Pageable pageable);

    @Query("SELECT i FROM Item i WHERE i.active = true AND " +
           "(LOWER(i.title) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(i.description) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Item> searchItems(String search, Pageable pageable);

    @Query("SELECT i FROM Item i WHERE i.active = true AND i.price BETWEEN :minPrice AND :maxPrice")
    List<Item> findByPriceRange(BigDecimal minPrice, BigDecimal maxPrice);

    long countByUserId(UUID userId);
}
```

### RefreshTokenRepository.java

```java
package com.example.myapi.domain.repository;

import com.example.myapi.domain.model.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {

    Optional<RefreshToken> findByTokenHashAndRevokedAtIsNull(String tokenHash);

    @Query("SELECT rt FROM RefreshToken rt WHERE rt.user.id = :userId AND rt.tokenHash = :tokenHash AND rt.revokedAt IS NULL")
    Optional<RefreshToken> findActiveByUserIdAndTokenHash(UUID userId, String tokenHash);

    @Modifying
    @Query("UPDATE RefreshToken rt SET rt.revokedAt = :now, rt.revokedReason = 'Logout' WHERE rt.user.id = :userId AND rt.revokedAt IS NULL")
    void revokeAllByUserId(UUID userId, LocalDateTime now);

    @Modifying
    @Query("DELETE FROM RefreshToken rt WHERE rt.expiresAt < :now")
    int deleteExpiredTokens(LocalDateTime now);
}
```

## Services

### AuthService.java

```java
package com.example.myapi.domain.service;

import com.example.myapi.application.dto.request.LoginRequest;
import com.example.myapi.application.dto.request.RefreshTokenRequest;
import com.example.myapi.application.dto.request.RegisterRequest;
import com.example.myapi.application.dto.response.AuthResponse;
import com.example.myapi.application.dto.response.UserResponse;
import com.example.myapi.application.mapper.UserMapper;
import com.example.myapi.domain.exception.BadRequestException;
import com.example.myapi.domain.exception.UnauthorizedException;
import com.example.myapi.domain.model.RefreshToken;
import com.example.myapi.domain.model.User;
import com.example.myapi.domain.repository.RefreshTokenRepository;
import com.example.myapi.domain.repository.UserRepository;
import com.example.myapi.infrastructure.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email().toLowerCase())) {
            throw new BadRequestException("Email already exists");
        }

        User user = User.builder()
                .email(request.email().toLowerCase())
                .passwordHash(passwordEncoder.encode(request.password()))
                .name(request.name())
                .build();

        user = userRepository.save(user);
        log.info("User registered: {}", user.getEmail());

        return generateAuthResponse(user);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findActiveByEmail(request.email().toLowerCase())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid email or password");
        }

        user.recordLogin();
        userRepository.save(user);

        log.info("User logged in: {}", user.getEmail());
        return generateAuthResponse(user);
    }

    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        UUID userId = jwtTokenProvider.getUserIdFromExpiredToken(request.accessToken());
        if (userId == null) {
            throw new UnauthorizedException("Invalid token");
        }

        String tokenHash = jwtTokenProvider.hashToken(request.refreshToken());
        RefreshToken storedToken = refreshTokenRepository
                .findActiveByUserIdAndTokenHash(userId, tokenHash)
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));

        if (!storedToken.isActive()) {
            throw new UnauthorizedException("Refresh token is expired or revoked");
        }

        User user = storedToken.getUser();
        if (!user.isActive()) {
            throw new UnauthorizedException("User account is deactivated");
        }

        // Generate new tokens
        String newAccessToken = jwtTokenProvider.generateAccessToken(user);
        String newRefreshToken = jwtTokenProvider.generateRefreshToken();
        String newRefreshTokenHash = jwtTokenProvider.hashToken(newRefreshToken);

        // Revoke old token and create new one
        storedToken.revoke("Replaced by new token", newRefreshToken);

        RefreshToken newStoredToken = RefreshToken.builder()
                .tokenHash(newRefreshTokenHash)
                .user(user)
                .expiresAt(LocalDateTime.now().plusDays(7))
                .build();

        refreshTokenRepository.save(newStoredToken);

        log.info("Token refreshed for user: {}", user.getEmail());

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .user(userMapper.toResponse(user))
                .build();
    }

    @Transactional
    public void logout(UUID userId) {
        refreshTokenRepository.revokeAllByUserId(userId, LocalDateTime.now());
        log.info("User logged out: {}", userId);
    }

    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("User not found"));
        return userMapper.toResponse(user);
    }

    private AuthResponse generateAuthResponse(User user) {
        String accessToken = jwtTokenProvider.generateAccessToken(user);
        String refreshToken = jwtTokenProvider.generateRefreshToken();
        String refreshTokenHash = jwtTokenProvider.hashToken(refreshToken);

        RefreshToken storedToken = RefreshToken.builder()
                .tokenHash(refreshTokenHash)
                .user(user)
                .expiresAt(LocalDateTime.now().plusDays(7))
                .build();

        refreshTokenRepository.save(storedToken);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(userMapper.toResponse(user))
                .build();
    }
}
```

### ItemService.java

```java
package com.example.myapi.domain.service;

import com.example.myapi.application.dto.request.CreateItemRequest;
import com.example.myapi.application.dto.request.UpdateItemRequest;
import com.example.myapi.application.dto.response.ItemResponse;
import com.example.myapi.application.dto.response.PageResponse;
import com.example.myapi.application.mapper.ItemMapper;
import com.example.myapi.domain.exception.BadRequestException;
import com.example.myapi.domain.exception.ResourceNotFoundException;
import com.example.myapi.domain.model.Item;
import com.example.myapi.domain.model.User;
import com.example.myapi.domain.model.enums.UserRole;
import com.example.myapi.domain.repository.ItemRepository;
import com.example.myapi.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ItemService {

    private final ItemRepository itemRepository;
    private final UserRepository userRepository;
    private final ItemMapper itemMapper;

    @Transactional(readOnly = true)
    @Cacheable(value = "items", key = "#page + '-' + #size + '-' + #sortBy + '-' + #sortDesc")
    public PageResponse<ItemResponse> getItems(int page, int size, String sortBy, boolean sortDesc,
                                                String search, BigDecimal minPrice, BigDecimal maxPrice) {
        Sort sort = sortDesc ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Item> itemPage;

        if (search != null && !search.isBlank()) {
            itemPage = itemRepository.searchItems(search.trim(), pageable);
        } else {
            itemPage = itemRepository.findByActiveTrue(pageable);
        }

        return PageResponse.<ItemResponse>builder()
                .content(itemPage.getContent().stream().map(itemMapper::toResponse).toList())
                .page(page)
                .size(size)
                .totalElements(itemPage.getTotalElements())
                .totalPages(itemPage.getTotalPages())
                .hasNext(itemPage.hasNext())
                .hasPrevious(itemPage.hasPrevious())
                .build();
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "item", key = "#id")
    public ItemResponse getItem(UUID id) {
        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Item", id));

        if (!item.isActive()) {
            throw new ResourceNotFoundException("Item", id);
        }

        return itemMapper.toResponse(item);
    }

    @Transactional
    @CacheEvict(value = {"items", "item"}, allEntries = true)
    public ItemResponse createItem(CreateItemRequest request, UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        if (request.price().compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("Price cannot be negative");
        }

        if (request.quantity() < 0) {
            throw new BadRequestException("Quantity cannot be negative");
        }

        Item item = Item.builder()
                .title(request.title())
                .description(request.description())
                .price(request.price())
                .quantity(request.quantity())
                .user(user)
                .build();

        item = itemRepository.save(item);
        log.info("Item created: {} by user {}", item.getId(), userId);

        return itemMapper.toResponse(item);
    }

    @Transactional
    @CacheEvict(value = {"items", "item"}, allEntries = true)
    public ItemResponse updateItem(UUID id, UpdateItemRequest request, UUID userId, UserRole userRole) {
        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Item", id));

        if (!item.getUser().getId().equals(userId) && userRole != UserRole.ADMIN) {
            throw new BadRequestException("Not authorized to update this item");
        }

        item.update(request.title(), request.description(), request.price(), request.quantity());
        item = itemRepository.save(item);

        log.info("Item updated: {} by user {}", id, userId);

        return itemMapper.toResponse(item);
    }

    @Transactional
    @CacheEvict(value = {"items", "item"}, allEntries = true)
    public void deleteItem(UUID id, UUID userId, UserRole userRole) {
        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Item", id));

        if (!item.getUser().getId().equals(userId) && userRole != UserRole.ADMIN) {
            throw new BadRequestException("Not authorized to delete this item");
        }

        item.deactivate();
        itemRepository.save(item);

        log.info("Item deleted (soft): {} by user {}", id, userId);
    }
}
```

## DTOs

### RegisterRequest.java

```java
package com.example.myapi.application.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        String email,

        @NotBlank(message = "Password is required")
        @Size(min = 8, message = "Password must be at least 8 characters")
        @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$",
                message = "Password must contain uppercase, lowercase and number")
        String password,

        @NotBlank(message = "Name is required")
        @Size(max = 100, message = "Name must not exceed 100 characters")
        String name
) {}
```

### LoginRequest.java

```java
package com.example.myapi.application.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        String email,

        @NotBlank(message = "Password is required")
        String password
) {}
```

### RefreshTokenRequest.java

```java
package com.example.myapi.application.dto.request;

import jakarta.validation.constraints.NotBlank;

public record RefreshTokenRequest(
        @NotBlank(message = "Access token is required")
        String accessToken,

        @NotBlank(message = "Refresh token is required")
        String refreshToken
) {}
```

### CreateItemRequest.java

```java
package com.example.myapi.application.dto.request;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record CreateItemRequest(
        @NotBlank(message = "Title is required")
        @Size(max = 200, message = "Title must not exceed 200 characters")
        String title,

        @Size(max = 2000, message = "Description must not exceed 2000 characters")
        String description,

        @NotNull(message = "Price is required")
        @DecimalMin(value = "0.00", message = "Price must be non-negative")
        BigDecimal price,

        @NotNull(message = "Quantity is required")
        @Min(value = 0, message = "Quantity must be non-negative")
        Integer quantity
) {}
```

### UpdateItemRequest.java

```java
package com.example.myapi.application.dto.request;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record UpdateItemRequest(
        @NotBlank(message = "Title is required")
        @Size(max = 200, message = "Title must not exceed 200 characters")
        String title,

        @Size(max = 2000, message = "Description must not exceed 2000 characters")
        String description,

        @NotNull(message = "Price is required")
        @DecimalMin(value = "0.00", message = "Price must be non-negative")
        BigDecimal price,

        @NotNull(message = "Quantity is required")
        @Min(value = 0, message = "Quantity must be non-negative")
        Integer quantity
) {}
```

### AuthResponse.java

```java
package com.example.myapi.application.dto.response;

import lombok.Builder;

@Builder
public record AuthResponse(
        String accessToken,
        String refreshToken,
        UserResponse user
) {}
```

### UserResponse.java

```java
package com.example.myapi.application.dto.response;

import lombok.Builder;

import java.time.LocalDateTime;
import java.util.UUID;

@Builder
public record UserResponse(
        UUID id,
        String email,
        String name,
        String role,
        LocalDateTime createdAt
) {}
```

### ItemResponse.java

```java
package com.example.myapi.application.dto.response;

import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Builder
public record ItemResponse(
        UUID id,
        String title,
        String description,
        BigDecimal price,
        Integer quantity,
        UUID userId,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
```

### ApiResponse.java

```java
package com.example.myapi.application.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;

@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiResponse<T>(
        boolean success,
        T data,
        ErrorDetails error
) {
    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .data(data)
                .build();
    }

    public static <T> ApiResponse<T> error(String code, String message) {
        return ApiResponse.<T>builder()
                .success(false)
                .error(new ErrorDetails(code, message, null))
                .build();
    }

    public record ErrorDetails(String code, String message, Object details) {}
}
```

### PageResponse.java

```java
package com.example.myapi.application.dto.response;

import lombok.Builder;

import java.util.List;

@Builder
public record PageResponse<T>(
        List<T> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean hasNext,
        boolean hasPrevious
) {}
```

## Mappers

### UserMapper.java

```java
package com.example.myapi.application.mapper;

import com.example.myapi.application.dto.response.UserResponse;
import com.example.myapi.domain.model.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UserMapper {

    @Mapping(target = "role", expression = "java(user.getRole().name())")
    UserResponse toResponse(User user);
}
```

### ItemMapper.java

```java
package com.example.myapi.application.mapper;

import com.example.myapi.application.dto.response.ItemResponse;
import com.example.myapi.domain.model.Item;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ItemMapper {

    @Mapping(target = "userId", source = "user.id")
    ItemResponse toResponse(Item item);
}
```

## Security Configuration

### SecurityConfig.java

```java
package com.example.myapi.infrastructure.config;

import com.example.myapi.infrastructure.security.JwtAuthenticationEntryPoint;
import com.example.myapi.infrastructure.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configure(http))
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint(jwtAuthenticationEntryPoint))
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints
                        .requestMatchers("/api/auth/register", "/api/auth/login", "/api/auth/refresh").permitAll()
                        .requestMatchers("/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                        .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                        // Read-only item endpoints are public
                        .requestMatchers(HttpMethod.GET, "/api/items/**").permitAll()
                        // Admin endpoints
                        .requestMatchers("/api/admin/**").hasAnyRole("ADMIN", "SUPER_ADMIN")
                        // All other endpoints require authentication
                        .anyRequest().authenticated())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
```

### JwtTokenProvider.java

```java
package com.example.myapi.infrastructure.security;

import com.example.myapi.domain.model.User;
import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Date;
import java.util.UUID;

@Component
@Slf4j
public class JwtTokenProvider {

    private final SecretKey key;
    private final long accessTokenExpiration;
    private final long refreshTokenExpiration;
    private final SecureRandom secureRandom = new SecureRandom();

    public JwtTokenProvider(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.access-token-expiration}") long accessTokenExpiration,
            @Value("${jwt.refresh-token-expiration}") long refreshTokenExpiration) {
        this.key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(Base64.getEncoder().encodeToString(secret.getBytes())));
        this.accessTokenExpiration = accessTokenExpiration;
        this.refreshTokenExpiration = refreshTokenExpiration;
    }

    public String generateAccessToken(User user) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + accessTokenExpiration);

        return Jwts.builder()
                .subject(user.getId().toString())
                .claim("email", user.getEmail())
                .claim("name", user.getName())
                .claim("role", user.getRole().name())
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(key)
                .compact();
    }

    public String generateRefreshToken() {
        byte[] randomBytes = new byte[64];
        secureRandom.nextBytes(randomBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
    }

    public String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not found", e);
        }
    }

    public UUID getUserIdFromToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        return UUID.fromString(claims.getSubject());
    }

    public UUID getUserIdFromExpiredToken(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            return UUID.fromString(claims.getSubject());
        } catch (ExpiredJwtException e) {
            return UUID.fromString(e.getClaims().getSubject());
        } catch (Exception e) {
            log.error("Failed to get user ID from expired token", e);
            return null;
        }
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (SecurityException | MalformedJwtException e) {
            log.error("Invalid JWT signature");
        } catch (ExpiredJwtException e) {
            log.error("Expired JWT token");
        } catch (UnsupportedJwtException e) {
            log.error("Unsupported JWT token");
        } catch (IllegalArgumentException e) {
            log.error("JWT claims string is empty");
        }
        return false;
    }

    public String getRoleFromToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return claims.get("role", String.class);
    }
}
```

### JwtAuthenticationFilter.java

```java
package com.example.myapi.infrastructure.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        try {
            String jwt = getJwtFromRequest(request);

            if (StringUtils.hasText(jwt) && jwtTokenProvider.validateToken(jwt)) {
                UUID userId = jwtTokenProvider.getUserIdFromToken(jwt);
                String role = jwtTokenProvider.getRoleFromToken(jwt);

                var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + role));

                var authentication = new UsernamePasswordAuthenticationToken(
                        userId, null, authorities);
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        } catch (Exception e) {
            log.error("Could not set user authentication in security context", e);
        }

        filterChain.doFilter(request, response);
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
```

### JwtAuthenticationEntryPoint.java

```java
package com.example.myapi.infrastructure.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper;

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                         AuthenticationException authException) throws IOException {

        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);

        var body = Map.of(
                "success", false,
                "error", Map.of(
                        "code", "UNAUTHORIZED",
                        "message", "Authentication required"
                )
        );

        objectMapper.writeValue(response.getOutputStream(), body);
    }
}
```

## Controllers

### AuthController.java

```java
package com.example.myapi.web.controller;

import com.example.myapi.application.dto.request.LoginRequest;
import com.example.myapi.application.dto.request.RefreshTokenRequest;
import com.example.myapi.application.dto.request.RegisterRequest;
import com.example.myapi.application.dto.response.ApiResponse;
import com.example.myapi.application.dto.response.AuthResponse;
import com.example.myapi.application.dto.response.UserResponse;
import com.example.myapi.domain.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Authentication endpoints")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Register a new user")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/login")
    @Operation(summary = "Login with email and password")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        AuthResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout and invalidate tokens")
    public ResponseEntity<ApiResponse<Void>> logout(@AuthenticationPrincipal UUID userId) {
        authService.logout(userId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/me")
    @Operation(summary = "Get current user info")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser(@AuthenticationPrincipal UUID userId) {
        UserResponse response = authService.getCurrentUser(userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
```

### ItemController.java

```java
package com.example.myapi.web.controller;

import com.example.myapi.application.dto.request.CreateItemRequest;
import com.example.myapi.application.dto.request.UpdateItemRequest;
import com.example.myapi.application.dto.response.ApiResponse;
import com.example.myapi.application.dto.response.ItemResponse;
import com.example.myapi.application.dto.response.PageResponse;
import com.example.myapi.domain.model.enums.UserRole;
import com.example.myapi.domain.service.ItemService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.UUID;

@RestController
@RequestMapping("/api/items")
@RequiredArgsConstructor
@Tag(name = "Items", description = "Item management endpoints")
public class ItemController {

    private final ItemService itemService;

    @GetMapping
    @Operation(summary = "Get paginated list of items")
    public ResponseEntity<ApiResponse<PageResponse<ItemResponse>>> getItems(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "true") boolean sortDesc,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice) {

        PageResponse<ItemResponse> response = itemService.getItems(page, size, sortBy, sortDesc, search, minPrice, maxPrice);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get item by ID")
    public ResponseEntity<ApiResponse<ItemResponse>> getItem(@PathVariable UUID id) {
        ItemResponse response = itemService.getItem(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    @Operation(summary = "Create a new item")
    public ResponseEntity<ApiResponse<ItemResponse>> createItem(
            @Valid @RequestBody CreateItemRequest request,
            @AuthenticationPrincipal UUID userId) {

        ItemResponse response = itemService.createItem(request, userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing item")
    public ResponseEntity<ApiResponse<ItemResponse>> updateItem(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateItemRequest request,
            @AuthenticationPrincipal UUID userId) {

        UserRole role = getCurrentUserRole();
        ItemResponse response = itemService.updateItem(id, request, userId, role);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete an item")
    public ResponseEntity<ApiResponse<Void>> deleteItem(
            @PathVariable UUID id,
            @AuthenticationPrincipal UUID userId) {

        UserRole role = getCurrentUserRole();
        itemService.deleteItem(id, userId, role);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    private UserRole getCurrentUserRole() {
        return SecurityContextHolder.getContext().getAuthentication()
                .getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(a -> a.startsWith("ROLE_"))
                .map(a -> a.substring(5))
                .findFirst()
                .map(UserRole::valueOf)
                .orElse(UserRole.USER);
    }
}
```

## Exception Handling

### GlobalExceptionHandler.java

```java
package com.example.myapi.web.exception;

import com.example.myapi.application.dto.response.ApiResponse;
import com.example.myapi.domain.exception.BadRequestException;
import com.example.myapi.domain.exception.ResourceNotFoundException;
import com.example.myapi.domain.exception.UnauthorizedException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        return ResponseEntity.badRequest().body(
                ApiResponse.<Void>builder()
                        .success(false)
                        .error(new ApiResponse.ErrorDetails("VALIDATION_ERROR", "Validation failed", errors))
                        .build()
        );
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleResourceNotFoundException(ResourceNotFoundException ex) {
        log.error("Resource not found: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error("NOT_FOUND", ex.getMessage()));
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ApiResponse<Void>> handleBadRequestException(BadRequestException ex) {
        log.error("Bad request: {}", ex.getMessage());
        return ResponseEntity.badRequest()
                .body(ApiResponse.error("BAD_REQUEST", ex.getMessage()));
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ApiResponse<Void>> handleUnauthorizedException(UnauthorizedException ex) {
        log.error("Unauthorized: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("UNAUTHORIZED", ex.getMessage()));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDeniedException(AccessDeniedException ex) {
        log.error("Access denied: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error("FORBIDDEN", "Access denied"));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleAllUncaughtException(Exception ex) {
        log.error("Unexpected error occurred", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("INTERNAL_ERROR", "An unexpected error occurred"));
    }
}
```

### ResourceNotFoundException.java

```java
package com.example.myapi.domain.exception;

public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String resourceName, Object resourceId) {
        super(String.format("%s with ID '%s' not found", resourceName, resourceId));
    }
}
```

### BadRequestException.java

```java
package com.example.myapi.domain.exception;

public class BadRequestException extends RuntimeException {

    public BadRequestException(String message) {
        super(message);
    }
}
```

### UnauthorizedException.java

```java
package com.example.myapi.domain.exception;

public class UnauthorizedException extends RuntimeException {

    public UnauthorizedException(String message) {
        super(message);
    }
}
```

## Docker Configuration

### Dockerfile

```dockerfile
# Build stage
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app

# Copy maven wrapper and pom
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .

# Download dependencies
RUN ./mvnw dependency:go-offline -B

# Copy source and build
COPY src src
RUN ./mvnw package -DskipTests -B

# Runtime stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Create non-root user
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copy jar from build stage
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  api:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=prod
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_NAME=myapi_db
      - DB_USERNAME=postgres
      - DB_PASSWORD=postgres
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - JWT_SECRET=your-super-secret-key-with-at-least-32-characters-for-production
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    networks:
      - app-network

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: myapi_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - app-network

volumes:
  postgres_data:
  redis_data:

networks:
  app-network:
    driver: bridge
```

## Testing

### AbstractIntegrationTest.java

```java
package com.example.myapi.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Testcontainers
public abstract class AbstractIntegrationTest {

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected ObjectMapper objectMapper;

    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("testdb")
            .withUsername("test")
            .withPassword("test");

    static {
        postgres.start();
    }

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }
}
```

### ItemControllerIntegrationTest.java

```java
package com.example.myapi.integration;

import com.example.myapi.application.dto.request.CreateItemRequest;
import com.example.myapi.application.dto.request.LoginRequest;
import com.example.myapi.application.dto.request.RegisterRequest;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.math.BigDecimal;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class ItemControllerIntegrationTest extends AbstractIntegrationTest {

    private String authToken;

    @BeforeEach
    void setUp() throws Exception {
        // Register and login
        var registerRequest = new RegisterRequest("test@example.com", "Password123", "Test User");

        String response = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode json = objectMapper.readTree(response);
        authToken = json.path("data").path("accessToken").asText();
    }

    @Test
    void getItems_ReturnsEmptyList_WhenNoItems() throws Exception {
        mockMvc.perform(get("/api/items"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content").isArray())
                .andExpect(jsonPath("$.data.content").isEmpty());
    }

    @Test
    void createItem_ReturnsCreatedItem_WhenAuthenticated() throws Exception {
        var request = new CreateItemRequest("Test Item", "Description", BigDecimal.valueOf(99.99), 10);

        mockMvc.perform(post("/api/items")
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.title").value("Test Item"))
                .andExpect(jsonPath("$.data.price").value(99.99));
    }

    @Test
    void createItem_ReturnsUnauthorized_WhenNotAuthenticated() throws Exception {
        var request = new CreateItemRequest("Test Item", "Description", BigDecimal.valueOf(99.99), 10);

        mockMvc.perform(post("/api/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void createItem_ReturnsBadRequest_WhenValidationFails() throws Exception {
        var request = new CreateItemRequest("", "Description", BigDecimal.valueOf(-1), -5);

        mockMvc.perform(post("/api/items")
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));
    }
}
```

### ItemServiceTest.java

```java
package com.example.myapi.unit.service;

import com.example.myapi.application.dto.request.CreateItemRequest;
import com.example.myapi.application.dto.response.ItemResponse;
import com.example.myapi.application.mapper.ItemMapper;
import com.example.myapi.domain.model.Item;
import com.example.myapi.domain.model.User;
import com.example.myapi.domain.repository.ItemRepository;
import com.example.myapi.domain.repository.UserRepository;
import com.example.myapi.domain.service.ItemService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ItemServiceTest {

    @Mock
    private ItemRepository itemRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ItemMapper itemMapper;

    @InjectMocks
    private ItemService itemService;

    private User testUser;
    private Item testItem;
    private UUID userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        testUser = User.builder()
                .id(userId)
                .email("test@example.com")
                .name("Test User")
                .build();

        testItem = Item.builder()
                .id(UUID.randomUUID())
                .title("Test Item")
                .description("Description")
                .price(BigDecimal.valueOf(99.99))
                .quantity(10)
                .user(testUser)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Test
    void createItem_ShouldReturnCreatedItem() {
        // Arrange
        var request = new CreateItemRequest("Test Item", "Description", BigDecimal.valueOf(99.99), 10);
        var expectedResponse = ItemResponse.builder()
                .id(testItem.getId())
                .title("Test Item")
                .description("Description")
                .price(BigDecimal.valueOf(99.99))
                .quantity(10)
                .userId(userId)
                .build();

        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(itemRepository.save(any(Item.class))).thenReturn(testItem);
        when(itemMapper.toResponse(any(Item.class))).thenReturn(expectedResponse);

        // Act
        ItemResponse result = itemService.createItem(request, userId);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.title()).isEqualTo("Test Item");
        assertThat(result.price()).isEqualByComparingTo(BigDecimal.valueOf(99.99));

        verify(userRepository).findById(userId);
        verify(itemRepository).save(any(Item.class));
        verify(itemMapper).toResponse(any(Item.class));
    }
}
```

## CLAUDE.md Integration

```markdown
# Java Spring Boot API Project

## Build & Run
- `mvn clean install` - Build project and run tests
- `mvn spring-boot:run` - Run application
- `mvn spring-boot:run -Dspring-boot.run.profiles=dev` - Run with dev profile
- `mvn test` - Run unit tests
- `mvn verify` - Run all tests including integration tests
- `mvn flyway:migrate` - Run database migrations manually

## Architecture
- **Hexagonal Architecture**: Domain → Application → Infrastructure → Web
- **Repository Pattern**: Spring Data JPA repositories
- **MapStruct**: Compile-time DTO mapping
- **FluentValidation**: Jakarta Validation annotations

## Code Patterns
- Entity classes use Lombok for boilerplate reduction
- DTOs are Java records for immutability
- Services are transactional by default
- Cache annotations for Redis caching

## Testing
- Unit tests with Mockito in `src/test/java/.../unit/`
- Integration tests with Testcontainers in `src/test/java/.../integration/`
- Use `AbstractIntegrationTest` base class for integration tests

## Key Files
- `SecurityConfig.java` - Spring Security configuration
- `JwtTokenProvider.java` - JWT token generation and validation
- `GlobalExceptionHandler.java` - Centralized exception handling
- `application.yml` - Application configuration

## Environment Variables
- `DB_HOST`, `DB_PORT`, `DB_NAME` - PostgreSQL connection
- `DB_USERNAME`, `DB_PASSWORD` - Database credentials
- `REDIS_HOST`, `REDIS_PORT` - Redis connection
- `JWT_SECRET` - JWT signing key (min 32 chars)
```

## AI Suggestions

1. **Add Distributed Tracing**: Integrate Micrometer with Zipkin or Jaeger for distributed tracing across microservices.

2. **Implement Circuit Breaker**: Add Resilience4j for circuit breaker, retry, and rate limiting patterns for external service calls.

3. **Add Request Validation Middleware**: Create custom validators with reusable validation logic using Hibernate Validator.

4. **Implement Event Sourcing**: Consider adding Spring Cloud Stream with Kafka for event-driven architecture.

5. **Add GraphQL Support**: Integrate Spring for GraphQL alongside REST endpoints for flexible querying.

6. **Implement Multi-tenancy**: Add tenant isolation using database schemas or row-level security for SaaS applications.

7. **Add API Rate Limiting**: Implement rate limiting using Bucket4j with Redis backend for distributed rate limiting.

8. **Implement Request/Response Logging**: Add detailed request/response logging with sensitive data masking for audit trails.

9. **Add Health Check Details**: Expand actuator health checks with custom indicators for external dependencies.

10. **Implement Async Processing**: Add Spring Async with ThreadPoolTaskExecutor for background task processing and @Scheduled tasks.
