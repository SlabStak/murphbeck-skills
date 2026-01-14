# Go Fiber API Template

## Overview
High-performance REST API using Go with Fiber v2 framework, featuring Express-like syntax, zero memory allocation routing, PostgreSQL with sqlx, JWT authentication, and comprehensive middleware.

## Quick Start
```bash
# Initialize project
mkdir my-fiber-api && cd my-fiber-api
go mod init github.com/yourusername/my-fiber-api

# Install dependencies
go get -u github.com/gofiber/fiber/v2
go get -u github.com/gofiber/jwt/v3
go get -u github.com/gofiber/contrib/websocket
go get -u github.com/jmoiron/sqlx
go get -u github.com/lib/pq
go get -u github.com/golang-jwt/jwt/v5
go get -u github.com/joho/godotenv
go get -u go.uber.org/zap
go get -u github.com/go-playground/validator/v10
go get -u golang.org/x/crypto/bcrypt
go get -u github.com/google/uuid
go get -u github.com/golang-migrate/migrate/v4

# Run the server
go run cmd/api/main.go
```

## Project Structure
```
my-fiber-api/
├── cmd/
│   └── api/
│       └── main.go
├── internal/
│   ├── config/
│   │   └── config.go
│   ├── database/
│   │   ├── database.go
│   │   └── queries.go
│   ├── models/
│   │   ├── user.go
│   │   └── item.go
│   ├── handlers/
│   │   ├── auth.go
│   │   ├── users.go
│   │   ├── items.go
│   │   ├── websocket.go
│   │   └── health.go
│   ├── middleware/
│   │   ├── auth.go
│   │   ├── logger.go
│   │   ├── limiter.go
│   │   └── validator.go
│   ├── services/
│   │   ├── auth.go
│   │   ├── user.go
│   │   └── item.go
│   └── routes/
│       └── routes.go
├── pkg/
│   ├── utils/
│   │   ├── password.go
│   │   ├── jwt.go
│   │   └── response.go
│   └── validator/
│       └── validator.go
├── migrations/
│   ├── 000001_init.up.sql
│   └── 000001_init.down.sql
├── .env.example
├── Dockerfile
├── docker-compose.yml
├── Makefile
└── go.mod
```

## Configuration

### go.mod
```go
module github.com/yourusername/my-fiber-api

go 1.22

require (
    github.com/gofiber/fiber/v2 v2.52.0
    github.com/gofiber/jwt/v3 v3.3.10
    github.com/gofiber/contrib/websocket v1.3.0
    github.com/golang-jwt/jwt/v5 v5.2.0
    github.com/golang-migrate/migrate/v4 v4.17.0
    github.com/google/uuid v1.6.0
    github.com/go-playground/validator/v10 v10.18.0
    github.com/jmoiron/sqlx v1.3.5
    github.com/joho/godotenv v1.5.1
    github.com/lib/pq v1.10.9
    go.uber.org/zap v1.27.0
    golang.org/x/crypto v0.19.0
)
```

### .env.example
```env
# Server
PORT=3000
APP_ENV=development
API_PREFIX=/api/v1

# Database
DATABASE_URL=postgres://postgres:postgres@localhost:5432/fiberapi?sslmode=disable

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=168h

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_EXPIRATION=1m

# Logging
LOG_LEVEL=debug

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

### internal/config/config.go
```go
package config

import (
    "os"
    "strconv"
    "strings"
    "time"

    "github.com/joho/godotenv"
)

type Config struct {
    Server    ServerConfig
    Database  DatabaseConfig
    JWT       JWTConfig
    RateLimit RateLimitConfig
    CORS      CORSConfig
    Log       LogConfig
}

type ServerConfig struct {
    Port    string
    Env     string
    Prefix  string
}

type DatabaseConfig struct {
    URL string
}

type JWTConfig struct {
    Secret        string
    AccessExpiry  time.Duration
    RefreshExpiry time.Duration
}

type RateLimitConfig struct {
    Max        int
    Expiration time.Duration
}

type CORSConfig struct {
    Origins []string
}

type LogConfig struct {
    Level string
}

func Load() (*Config, error) {
    _ = godotenv.Load()

    accessExpiry, _ := time.ParseDuration(getEnv("JWT_ACCESS_EXPIRY", "15m"))
    refreshExpiry, _ := time.ParseDuration(getEnv("JWT_REFRESH_EXPIRY", "168h"))
    rateLimitExpiration, _ := time.ParseDuration(getEnv("RATE_LIMIT_EXPIRATION", "1m"))
    rateLimitMax, _ := strconv.Atoi(getEnv("RATE_LIMIT_MAX", "100"))

    origins := strings.Split(getEnv("CORS_ORIGINS", "*"), ",")

    return &Config{
        Server: ServerConfig{
            Port:   getEnv("PORT", "3000"),
            Env:    getEnv("APP_ENV", "development"),
            Prefix: getEnv("API_PREFIX", "/api/v1"),
        },
        Database: DatabaseConfig{
            URL: getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/fiberapi?sslmode=disable"),
        },
        JWT: JWTConfig{
            Secret:        getEnv("JWT_SECRET", "change-me"),
            AccessExpiry:  accessExpiry,
            RefreshExpiry: refreshExpiry,
        },
        RateLimit: RateLimitConfig{
            Max:        rateLimitMax,
            Expiration: rateLimitExpiration,
        },
        CORS: CORSConfig{
            Origins: origins,
        },
        Log: LogConfig{
            Level: getEnv("LOG_LEVEL", "debug"),
        },
    }, nil
}

func getEnv(key, defaultValue string) string {
    if value := os.Getenv(key); value != "" {
        return value
    }
    return defaultValue
}
```

## Core Implementation

### cmd/api/main.go
```go
package main

import (
    "context"
    "log"
    "os"
    "os/signal"
    "syscall"
    "time"

    "github.com/gofiber/fiber/v2"
    "github.com/gofiber/fiber/v2/middleware/compress"
    "github.com/gofiber/fiber/v2/middleware/cors"
    "github.com/gofiber/fiber/v2/middleware/helmet"
    "github.com/gofiber/fiber/v2/middleware/recover"
    "github.com/gofiber/fiber/v2/middleware/requestid"
    "github.com/yourusername/my-fiber-api/internal/config"
    "github.com/yourusername/my-fiber-api/internal/database"
    "github.com/yourusername/my-fiber-api/internal/handlers"
    "github.com/yourusername/my-fiber-api/internal/middleware"
    "github.com/yourusername/my-fiber-api/internal/routes"
    "github.com/yourusername/my-fiber-api/internal/services"
    "github.com/yourusername/my-fiber-api/pkg/logger"
)

func main() {
    // Load configuration
    cfg, err := config.Load()
    if err != nil {
        log.Fatalf("Failed to load config: %v", err)
    }

    // Initialize logger
    appLogger := logger.New(cfg.Log.Level)
    defer appLogger.Sync()

    // Initialize database
    db, err := database.New(cfg.Database.URL)
    if err != nil {
        appLogger.Fatal("Failed to connect to database", "error", err)
    }
    defer db.Close()

    // Run migrations
    if err := database.RunMigrations(cfg.Database.URL); err != nil {
        appLogger.Warn("Migration warning", "error", err)
    }

    // Initialize services
    userService := services.NewUserService(db)
    authService := services.NewAuthService(userService, cfg.JWT)
    itemService := services.NewItemService(db)

    // Initialize handlers
    authHandler := handlers.NewAuthHandler(authService, appLogger)
    userHandler := handlers.NewUserHandler(userService, appLogger)
    itemHandler := handlers.NewItemHandler(itemService, appLogger)
    healthHandler := handlers.NewHealthHandler(db, appLogger)
    wsHandler := handlers.NewWebSocketHandler(appLogger)

    // Create Fiber app
    app := fiber.New(fiber.Config{
        AppName:               "My Fiber API",
        ServerHeader:          "Fiber",
        DisableStartupMessage: cfg.Server.Env == "production",
        ErrorHandler:          middleware.ErrorHandler,
        ReadTimeout:           15 * time.Second,
        WriteTimeout:          15 * time.Second,
        IdleTimeout:           60 * time.Second,
        BodyLimit:             4 * 1024 * 1024, // 4MB
    })

    // Global middleware
    app.Use(requestid.New())
    app.Use(middleware.Logger(appLogger))
    app.Use(recover.New(recover.Config{
        EnableStackTrace: cfg.Server.Env != "production",
    }))
    app.Use(compress.New(compress.Config{
        Level: compress.LevelBestSpeed,
    }))
    app.Use(helmet.New())
    app.Use(cors.New(cors.Config{
        AllowOrigins:     strings.Join(cfg.CORS.Origins, ","),
        AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
        AllowMethods:     "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        AllowCredentials: true,
    }))

    // Setup routes
    routes.Setup(app, routes.Config{
        Prefix:        cfg.Server.Prefix,
        JWTSecret:     cfg.JWT.Secret,
        RateLimit:     cfg.RateLimit,
        AuthHandler:   authHandler,
        UserHandler:   userHandler,
        ItemHandler:   itemHandler,
        HealthHandler: healthHandler,
        WSHandler:     wsHandler,
    })

    // Start server with graceful shutdown
    go func() {
        if err := app.Listen(":" + cfg.Server.Port); err != nil {
            appLogger.Fatal("Failed to start server", "error", err)
        }
    }()

    appLogger.Info("Server started", "port", cfg.Server.Port, "env", cfg.Server.Env)

    // Graceful shutdown
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    <-quit

    appLogger.Info("Shutting down server...")

    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    if err := app.ShutdownWithContext(ctx); err != nil {
        appLogger.Fatal("Server forced to shutdown", "error", err)
    }

    appLogger.Info("Server exited")
}
```

### internal/database/database.go
```go
package database

import (
    "github.com/golang-migrate/migrate/v4"
    "github.com/golang-migrate/migrate/v4/database/postgres"
    _ "github.com/golang-migrate/migrate/v4/source/file"
    "github.com/jmoiron/sqlx"
    _ "github.com/lib/pq"
)

func New(databaseURL string) (*sqlx.DB, error) {
    db, err := sqlx.Connect("postgres", databaseURL)
    if err != nil {
        return nil, err
    }

    db.SetMaxOpenConns(25)
    db.SetMaxIdleConns(5)

    return db, nil
}

func RunMigrations(databaseURL string) error {
    db, err := sqlx.Open("postgres", databaseURL)
    if err != nil {
        return err
    }
    defer db.Close()

    driver, err := postgres.WithInstance(db.DB, &postgres.Config{})
    if err != nil {
        return err
    }

    m, err := migrate.NewWithDatabaseInstance(
        "file://migrations",
        "postgres",
        driver,
    )
    if err != nil {
        return err
    }

    if err := m.Up(); err != nil && err != migrate.ErrNoChange {
        return err
    }

    return nil
}
```

### migrations/000001_init.up.sql
```sql
-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Items table
CREATE TABLE IF NOT EXISTS items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'draft',
    price DECIMAL(10, 2) DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Refresh tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    revoked_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_deleted_at ON users(deleted_at);
CREATE INDEX idx_items_user_id ON items(user_id);
CREATE INDEX idx_items_status ON items(status);
CREATE INDEX idx_items_deleted_at ON items(deleted_at);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER items_updated_at
    BEFORE UPDATE ON items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
```

### internal/models/user.go
```go
package models

import (
    "database/sql"
    "time"

    "github.com/google/uuid"
)

type Role string

const (
    RoleUser  Role = "user"
    RoleAdmin Role = "admin"
)

type User struct {
    ID           uuid.UUID    `db:"id" json:"id"`
    Email        string       `db:"email" json:"email"`
    PasswordHash string       `db:"password_hash" json:"-"`
    Name         string       `db:"name" json:"name"`
    Role         Role         `db:"role" json:"role"`
    Active       bool         `db:"active" json:"active"`
    CreatedAt    time.Time    `db:"created_at" json:"created_at"`
    UpdatedAt    time.Time    `db:"updated_at" json:"updated_at"`
    DeletedAt    sql.NullTime `db:"deleted_at" json:"-"`
}

type RefreshToken struct {
    ID        uuid.UUID    `db:"id"`
    UserID    uuid.UUID    `db:"user_id"`
    TokenHash string       `db:"token_hash"`
    ExpiresAt time.Time    `db:"expires_at"`
    CreatedAt time.Time    `db:"created_at"`
    RevokedAt sql.NullTime `db:"revoked_at"`
}
```

### internal/models/item.go
```go
package models

import (
    "database/sql"
    "encoding/json"
    "time"

    "github.com/google/uuid"
)

type ItemStatus string

const (
    StatusDraft     ItemStatus = "draft"
    StatusPublished ItemStatus = "published"
    StatusArchived  ItemStatus = "archived"
)

type Item struct {
    ID          uuid.UUID       `db:"id" json:"id"`
    UserID      uuid.UUID       `db:"user_id" json:"user_id"`
    Title       string          `db:"title" json:"title"`
    Description sql.NullString  `db:"description" json:"description"`
    Status      ItemStatus      `db:"status" json:"status"`
    Price       float64         `db:"price" json:"price"`
    Metadata    json.RawMessage `db:"metadata" json:"metadata"`
    CreatedAt   time.Time       `db:"created_at" json:"created_at"`
    UpdatedAt   time.Time       `db:"updated_at" json:"updated_at"`
    DeletedAt   sql.NullTime    `db:"deleted_at" json:"-"`
}

type ItemFilter struct {
    Status   ItemStatus `query:"status"`
    MinPrice float64    `query:"min_price"`
    MaxPrice float64    `query:"max_price"`
    Search   string     `query:"search"`
    Page     int        `query:"page"`
    Limit    int        `query:"limit"`
    SortBy   string     `query:"sort_by"`
    SortDir  string     `query:"sort_dir"`
}

func (f *ItemFilter) SetDefaults() {
    if f.Page < 1 {
        f.Page = 1
    }
    if f.Limit < 1 || f.Limit > 100 {
        f.Limit = 20
    }
    if f.SortBy == "" {
        f.SortBy = "created_at"
    }
    if f.SortDir == "" {
        f.SortDir = "desc"
    }
}
```

### internal/services/auth.go
```go
package services

import (
    "context"
    "crypto/sha256"
    "encoding/hex"
    "errors"
    "time"

    "github.com/golang-jwt/jwt/v5"
    "github.com/google/uuid"
    "github.com/yourusername/my-fiber-api/internal/config"
    "github.com/yourusername/my-fiber-api/internal/models"
    "github.com/yourusername/my-fiber-api/pkg/utils"
)

var (
    ErrInvalidCredentials = errors.New("invalid credentials")
    ErrUserExists         = errors.New("user already exists")
    ErrInvalidToken       = errors.New("invalid token")
    ErrTokenExpired       = errors.New("token expired")
    ErrUserNotFound       = errors.New("user not found")
)

type AuthService interface {
    Register(ctx context.Context, req RegisterRequest) (*AuthResponse, error)
    Login(ctx context.Context, req LoginRequest) (*AuthResponse, error)
    RefreshToken(ctx context.Context, refreshToken string) (*AuthResponse, error)
    Logout(ctx context.Context, userID uuid.UUID, refreshToken string) error
    ValidateAccessToken(tokenString string) (*TokenClaims, error)
}

type RegisterRequest struct {
    Email    string `json:"email" validate:"required,email"`
    Password string `json:"password" validate:"required,min=8"`
    Name     string `json:"name" validate:"required,min=2"`
}

type LoginRequest struct {
    Email    string `json:"email" validate:"required,email"`
    Password string `json:"password" validate:"required"`
}

type AuthResponse struct {
    AccessToken  string       `json:"access_token"`
    RefreshToken string       `json:"refresh_token"`
    ExpiresIn    int64        `json:"expires_in"`
    TokenType    string       `json:"token_type"`
    User         UserResponse `json:"user"`
}

type UserResponse struct {
    ID    string `json:"id"`
    Email string `json:"email"`
    Name  string `json:"name"`
    Role  string `json:"role"`
}

type TokenClaims struct {
    UserID uuid.UUID `json:"user_id"`
    Email  string    `json:"email"`
    Role   string    `json:"role"`
    jwt.RegisteredClaims
}

type authService struct {
    userService UserService
    jwtConfig   config.JWTConfig
}

func NewAuthService(userService UserService, jwtConfig config.JWTConfig) AuthService {
    return &authService{
        userService: userService,
        jwtConfig:   jwtConfig,
    }
}

func (s *authService) Register(ctx context.Context, req RegisterRequest) (*AuthResponse, error) {
    // Check if user exists
    exists, err := s.userService.ExistsByEmail(ctx, req.Email)
    if err != nil {
        return nil, err
    }
    if exists {
        return nil, ErrUserExists
    }

    // Hash password
    passwordHash, err := utils.HashPassword(req.Password)
    if err != nil {
        return nil, err
    }

    // Create user
    user, err := s.userService.Create(ctx, CreateUserRequest{
        Email:        req.Email,
        PasswordHash: passwordHash,
        Name:         req.Name,
        Role:         models.RoleUser,
    })
    if err != nil {
        return nil, err
    }

    return s.generateTokens(ctx, user)
}

func (s *authService) Login(ctx context.Context, req LoginRequest) (*AuthResponse, error) {
    user, err := s.userService.GetByEmail(ctx, req.Email)
    if err != nil {
        return nil, ErrInvalidCredentials
    }

    if !user.Active {
        return nil, ErrInvalidCredentials
    }

    if !utils.CheckPassword(req.Password, user.PasswordHash) {
        return nil, ErrInvalidCredentials
    }

    return s.generateTokens(ctx, user)
}

func (s *authService) RefreshToken(ctx context.Context, refreshToken string) (*AuthResponse, error) {
    // Hash the token
    tokenHash := hashToken(refreshToken)

    // Find and validate refresh token
    storedToken, err := s.userService.GetRefreshToken(ctx, tokenHash)
    if err != nil {
        return nil, ErrInvalidToken
    }

    if storedToken.RevokedAt.Valid {
        return nil, ErrInvalidToken
    }

    if time.Now().After(storedToken.ExpiresAt) {
        return nil, ErrTokenExpired
    }

    // Get user
    user, err := s.userService.GetByID(ctx, storedToken.UserID)
    if err != nil {
        return nil, ErrUserNotFound
    }

    // Revoke old token
    if err := s.userService.RevokeRefreshToken(ctx, storedToken.ID); err != nil {
        return nil, err
    }

    return s.generateTokens(ctx, user)
}

func (s *authService) Logout(ctx context.Context, userID uuid.UUID, refreshToken string) error {
    tokenHash := hashToken(refreshToken)
    return s.userService.RevokeRefreshTokenByHash(ctx, userID, tokenHash)
}

func (s *authService) ValidateAccessToken(tokenString string) (*TokenClaims, error) {
    token, err := jwt.ParseWithClaims(tokenString, &TokenClaims{}, func(token *jwt.Token) (interface{}, error) {
        if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
            return nil, errors.New("unexpected signing method")
        }
        return []byte(s.jwtConfig.Secret), nil
    })

    if err != nil {
        return nil, err
    }

    claims, ok := token.Claims.(*TokenClaims)
    if !ok || !token.Valid {
        return nil, ErrInvalidToken
    }

    return claims, nil
}

func (s *authService) generateTokens(ctx context.Context, user *models.User) (*AuthResponse, error) {
    // Generate access token
    accessToken, err := s.generateAccessToken(user)
    if err != nil {
        return nil, err
    }

    // Generate refresh token
    refreshToken := utils.GenerateRandomString(64)
    tokenHash := hashToken(refreshToken)

    // Store refresh token
    err = s.userService.CreateRefreshToken(ctx, user.ID, tokenHash, s.jwtConfig.RefreshExpiry)
    if err != nil {
        return nil, err
    }

    return &AuthResponse{
        AccessToken:  accessToken,
        RefreshToken: refreshToken,
        ExpiresIn:    int64(s.jwtConfig.AccessExpiry.Seconds()),
        TokenType:    "Bearer",
        User: UserResponse{
            ID:    user.ID.String(),
            Email: user.Email,
            Name:  user.Name,
            Role:  string(user.Role),
        },
    }, nil
}

func (s *authService) generateAccessToken(user *models.User) (string, error) {
    claims := TokenClaims{
        UserID: user.ID,
        Email:  user.Email,
        Role:   string(user.Role),
        RegisteredClaims: jwt.RegisteredClaims{
            ExpiresAt: jwt.NewNumericDate(time.Now().Add(s.jwtConfig.AccessExpiry)),
            IssuedAt:  jwt.NewNumericDate(time.Now()),
            NotBefore: jwt.NewNumericDate(time.Now()),
            Issuer:    "my-fiber-api",
            Subject:   user.ID.String(),
            ID:        uuid.New().String(),
        },
    }

    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    return token.SignedString([]byte(s.jwtConfig.Secret))
}

func hashToken(token string) string {
    hash := sha256.Sum256([]byte(token))
    return hex.EncodeToString(hash[:])
}
```

### internal/services/user.go
```go
package services

import (
    "context"
    "database/sql"
    "time"

    "github.com/google/uuid"
    "github.com/jmoiron/sqlx"
    "github.com/yourusername/my-fiber-api/internal/models"
)

type UserService interface {
    Create(ctx context.Context, req CreateUserRequest) (*models.User, error)
    GetByID(ctx context.Context, id uuid.UUID) (*models.User, error)
    GetByEmail(ctx context.Context, email string) (*models.User, error)
    Update(ctx context.Context, id uuid.UUID, req UpdateUserRequest) (*models.User, error)
    Delete(ctx context.Context, id uuid.UUID) error
    List(ctx context.Context, page, limit int) ([]models.User, int, error)
    ExistsByEmail(ctx context.Context, email string) (bool, error)
    CreateRefreshToken(ctx context.Context, userID uuid.UUID, tokenHash string, expiry time.Duration) error
    GetRefreshToken(ctx context.Context, tokenHash string) (*models.RefreshToken, error)
    RevokeRefreshToken(ctx context.Context, tokenID uuid.UUID) error
    RevokeRefreshTokenByHash(ctx context.Context, userID uuid.UUID, tokenHash string) error
}

type CreateUserRequest struct {
    Email        string
    PasswordHash string
    Name         string
    Role         models.Role
}

type UpdateUserRequest struct {
    Name   *string
    Active *bool
}

type userService struct {
    db *sqlx.DB
}

func NewUserService(db *sqlx.DB) UserService {
    return &userService{db: db}
}

func (s *userService) Create(ctx context.Context, req CreateUserRequest) (*models.User, error) {
    user := &models.User{}

    err := s.db.QueryRowxContext(ctx, `
        INSERT INTO users (email, password_hash, name, role)
        VALUES ($1, $2, $3, $4)
        RETURNING id, email, password_hash, name, role, active, created_at, updated_at
    `, req.Email, req.PasswordHash, req.Name, req.Role).StructScan(user)

    if err != nil {
        return nil, err
    }

    return user, nil
}

func (s *userService) GetByID(ctx context.Context, id uuid.UUID) (*models.User, error) {
    user := &models.User{}

    err := s.db.GetContext(ctx, user, `
        SELECT id, email, password_hash, name, role, active, created_at, updated_at
        FROM users
        WHERE id = $1 AND deleted_at IS NULL
    `, id)

    if err != nil {
        return nil, err
    }

    return user, nil
}

func (s *userService) GetByEmail(ctx context.Context, email string) (*models.User, error) {
    user := &models.User{}

    err := s.db.GetContext(ctx, user, `
        SELECT id, email, password_hash, name, role, active, created_at, updated_at
        FROM users
        WHERE email = $1 AND deleted_at IS NULL
    `, email)

    if err != nil {
        return nil, err
    }

    return user, nil
}

func (s *userService) Update(ctx context.Context, id uuid.UUID, req UpdateUserRequest) (*models.User, error) {
    user := &models.User{}

    err := s.db.QueryRowxContext(ctx, `
        UPDATE users
        SET name = COALESCE($2, name),
            active = COALESCE($3, active)
        WHERE id = $1 AND deleted_at IS NULL
        RETURNING id, email, password_hash, name, role, active, created_at, updated_at
    `, id, req.Name, req.Active).StructScan(user)

    if err != nil {
        return nil, err
    }

    return user, nil
}

func (s *userService) Delete(ctx context.Context, id uuid.UUID) error {
    _, err := s.db.ExecContext(ctx, `
        UPDATE users SET deleted_at = NOW() WHERE id = $1
    `, id)
    return err
}

func (s *userService) List(ctx context.Context, page, limit int) ([]models.User, int, error) {
    offset := (page - 1) * limit

    var total int
    err := s.db.GetContext(ctx, &total, `
        SELECT COUNT(*) FROM users WHERE deleted_at IS NULL
    `)
    if err != nil {
        return nil, 0, err
    }

    var users []models.User
    err = s.db.SelectContext(ctx, &users, `
        SELECT id, email, name, role, active, created_at, updated_at
        FROM users
        WHERE deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
    `, limit, offset)

    if err != nil {
        return nil, 0, err
    }

    return users, total, nil
}

func (s *userService) ExistsByEmail(ctx context.Context, email string) (bool, error) {
    var exists bool
    err := s.db.GetContext(ctx, &exists, `
        SELECT EXISTS(SELECT 1 FROM users WHERE email = $1 AND deleted_at IS NULL)
    `, email)
    return exists, err
}

func (s *userService) CreateRefreshToken(ctx context.Context, userID uuid.UUID, tokenHash string, expiry time.Duration) error {
    _, err := s.db.ExecContext(ctx, `
        INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
        VALUES ($1, $2, $3)
    `, userID, tokenHash, time.Now().Add(expiry))
    return err
}

func (s *userService) GetRefreshToken(ctx context.Context, tokenHash string) (*models.RefreshToken, error) {
    token := &models.RefreshToken{}
    err := s.db.GetContext(ctx, token, `
        SELECT id, user_id, token_hash, expires_at, created_at, revoked_at
        FROM refresh_tokens
        WHERE token_hash = $1
    `, tokenHash)
    if err != nil {
        return nil, err
    }
    return token, nil
}

func (s *userService) RevokeRefreshToken(ctx context.Context, tokenID uuid.UUID) error {
    _, err := s.db.ExecContext(ctx, `
        UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = $1
    `, tokenID)
    return err
}

func (s *userService) RevokeRefreshTokenByHash(ctx context.Context, userID uuid.UUID, tokenHash string) error {
    _, err := s.db.ExecContext(ctx, `
        UPDATE refresh_tokens SET revoked_at = NOW()
        WHERE user_id = $1 AND token_hash = $2 AND revoked_at IS NULL
    `, userID, tokenHash)
    return err
}
```

### internal/handlers/auth.go
```go
package handlers

import (
    "errors"

    "github.com/gofiber/fiber/v2"
    "github.com/yourusername/my-fiber-api/internal/services"
    "github.com/yourusername/my-fiber-api/pkg/logger"
    "github.com/yourusername/my-fiber-api/pkg/utils"
    "github.com/yourusername/my-fiber-api/pkg/validator"
)

type AuthHandler struct {
    service services.AuthService
    log     *logger.Logger
}

func NewAuthHandler(service services.AuthService, log *logger.Logger) *AuthHandler {
    return &AuthHandler{service: service, log: log}
}

func (h *AuthHandler) Register(c *fiber.Ctx) error {
    var req services.RegisterRequest
    if err := c.BodyParser(&req); err != nil {
        return utils.BadRequest(c, "Invalid request body")
    }

    if err := validator.Validate(req); err != nil {
        return utils.ValidationError(c, err)
    }

    result, err := h.service.Register(c.Context(), req)
    if err != nil {
        if errors.Is(err, services.ErrUserExists) {
            return utils.Conflict(c, "User already exists")
        }
        h.log.Error("Failed to register user", "error", err)
        return utils.InternalError(c, "Failed to register user")
    }

    return utils.Created(c, result)
}

func (h *AuthHandler) Login(c *fiber.Ctx) error {
    var req services.LoginRequest
    if err := c.BodyParser(&req); err != nil {
        return utils.BadRequest(c, "Invalid request body")
    }

    if err := validator.Validate(req); err != nil {
        return utils.ValidationError(c, err)
    }

    result, err := h.service.Login(c.Context(), req)
    if err != nil {
        if errors.Is(err, services.ErrInvalidCredentials) {
            return utils.Unauthorized(c, "Invalid email or password")
        }
        h.log.Error("Failed to login", "error", err)
        return utils.InternalError(c, "Failed to login")
    }

    return utils.Success(c, result)
}

func (h *AuthHandler) Refresh(c *fiber.Ctx) error {
    var req struct {
        RefreshToken string `json:"refresh_token" validate:"required"`
    }

    if err := c.BodyParser(&req); err != nil {
        return utils.BadRequest(c, "Invalid request body")
    }

    if err := validator.Validate(req); err != nil {
        return utils.ValidationError(c, err)
    }

    result, err := h.service.RefreshToken(c.Context(), req.RefreshToken)
    if err != nil {
        if errors.Is(err, services.ErrInvalidToken) || errors.Is(err, services.ErrTokenExpired) {
            return utils.Unauthorized(c, "Invalid or expired refresh token")
        }
        h.log.Error("Failed to refresh token", "error", err)
        return utils.InternalError(c, "Failed to refresh token")
    }

    return utils.Success(c, result)
}

func (h *AuthHandler) Logout(c *fiber.Ctx) error {
    userID := utils.GetUserID(c)

    var req struct {
        RefreshToken string `json:"refresh_token" validate:"required"`
    }

    if err := c.BodyParser(&req); err != nil {
        return utils.BadRequest(c, "Invalid request body")
    }

    if err := h.service.Logout(c.Context(), userID, req.RefreshToken); err != nil {
        h.log.Error("Failed to logout", "error", err)
        return utils.InternalError(c, "Failed to logout")
    }

    return utils.Success(c, fiber.Map{"message": "Logged out successfully"})
}
```

### internal/handlers/websocket.go
```go
package handlers

import (
    "encoding/json"
    "sync"

    "github.com/gofiber/contrib/websocket"
    "github.com/gofiber/fiber/v2"
    "github.com/google/uuid"
    "github.com/yourusername/my-fiber-api/pkg/logger"
)

type WebSocketHandler struct {
    log     *logger.Logger
    clients map[uuid.UUID]*websocket.Conn
    mu      sync.RWMutex
}

type WSMessage struct {
    Type    string          `json:"type"`
    Payload json.RawMessage `json:"payload"`
}

func NewWebSocketHandler(log *logger.Logger) *WebSocketHandler {
    return &WebSocketHandler{
        log:     log,
        clients: make(map[uuid.UUID]*websocket.Conn),
    }
}

func (h *WebSocketHandler) Upgrade(c *fiber.Ctx) error {
    if websocket.IsWebSocketUpgrade(c) {
        return c.Next()
    }
    return fiber.ErrUpgradeRequired
}

func (h *WebSocketHandler) Handle(c *websocket.Conn) {
    userID, ok := c.Locals("user_id").(uuid.UUID)
    if !ok {
        h.log.Error("User ID not found in context")
        c.Close()
        return
    }

    // Register client
    h.mu.Lock()
    h.clients[userID] = c
    h.mu.Unlock()

    h.log.Info("WebSocket connected", "user_id", userID)

    defer func() {
        h.mu.Lock()
        delete(h.clients, userID)
        h.mu.Unlock()
        c.Close()
        h.log.Info("WebSocket disconnected", "user_id", userID)
    }()

    for {
        _, msg, err := c.ReadMessage()
        if err != nil {
            if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
                h.log.Error("WebSocket error", "error", err)
            }
            break
        }

        var wsMsg WSMessage
        if err := json.Unmarshal(msg, &wsMsg); err != nil {
            h.log.Error("Failed to unmarshal message", "error", err)
            continue
        }

        h.handleMessage(c, userID, wsMsg)
    }
}

func (h *WebSocketHandler) handleMessage(c *websocket.Conn, userID uuid.UUID, msg WSMessage) {
    switch msg.Type {
    case "ping":
        h.sendMessage(c, WSMessage{Type: "pong"})
    case "subscribe":
        // Handle subscription logic
    case "unsubscribe":
        // Handle unsubscription logic
    default:
        h.log.Warn("Unknown message type", "type", msg.Type)
    }
}

func (h *WebSocketHandler) sendMessage(c *websocket.Conn, msg WSMessage) {
    data, err := json.Marshal(msg)
    if err != nil {
        h.log.Error("Failed to marshal message", "error", err)
        return
    }

    if err := c.WriteMessage(websocket.TextMessage, data); err != nil {
        h.log.Error("Failed to send message", "error", err)
    }
}

func (h *WebSocketHandler) Broadcast(msg WSMessage) {
    data, err := json.Marshal(msg)
    if err != nil {
        h.log.Error("Failed to marshal broadcast message", "error", err)
        return
    }

    h.mu.RLock()
    defer h.mu.RUnlock()

    for userID, c := range h.clients {
        if err := c.WriteMessage(websocket.TextMessage, data); err != nil {
            h.log.Error("Failed to broadcast to client", "user_id", userID, "error", err)
        }
    }
}

func (h *WebSocketHandler) SendToUser(userID uuid.UUID, msg WSMessage) {
    h.mu.RLock()
    c, ok := h.clients[userID]
    h.mu.RUnlock()

    if !ok {
        return
    }

    h.sendMessage(c, msg)
}
```

### internal/middleware/auth.go
```go
package middleware

import (
    "strings"

    "github.com/gofiber/fiber/v2"
    "github.com/yourusername/my-fiber-api/internal/services"
    "github.com/yourusername/my-fiber-api/pkg/utils"
)

func Auth(authService services.AuthService) fiber.Handler {
    return func(c *fiber.Ctx) error {
        authHeader := c.Get("Authorization")
        if authHeader == "" {
            return utils.Unauthorized(c, "Authorization header required")
        }

        parts := strings.SplitN(authHeader, " ", 2)
        if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
            return utils.Unauthorized(c, "Invalid authorization header format")
        }

        token := parts[1]
        claims, err := authService.ValidateAccessToken(token)
        if err != nil {
            return utils.Unauthorized(c, "Invalid or expired token")
        }

        c.Locals("user_id", claims.UserID)
        c.Locals("user_email", claims.Email)
        c.Locals("user_role", claims.Role)
        c.Locals("claims", claims)

        return c.Next()
    }
}

func RequireRole(roles ...string) fiber.Handler {
    return func(c *fiber.Ctx) error {
        userRole, ok := c.Locals("user_role").(string)
        if !ok {
            return utils.Unauthorized(c, "User role not found")
        }

        for _, role := range roles {
            if role == userRole {
                return c.Next()
            }
        }

        return utils.Forbidden(c, "Insufficient permissions")
    }
}
```

### internal/routes/routes.go
```go
package routes

import (
    "github.com/gofiber/contrib/websocket"
    "github.com/gofiber/fiber/v2"
    "github.com/gofiber/fiber/v2/middleware/limiter"
    "github.com/yourusername/my-fiber-api/internal/config"
    "github.com/yourusername/my-fiber-api/internal/handlers"
    "github.com/yourusername/my-fiber-api/internal/middleware"
)

type Config struct {
    Prefix        string
    JWTSecret     string
    RateLimit     config.RateLimitConfig
    AuthHandler   *handlers.AuthHandler
    UserHandler   *handlers.UserHandler
    ItemHandler   *handlers.ItemHandler
    HealthHandler *handlers.HealthHandler
    WSHandler     *handlers.WebSocketHandler
}

func Setup(app *fiber.App, cfg Config) {
    // Health checks (no prefix)
    app.Get("/health", cfg.HealthHandler.Check)
    app.Get("/health/ready", cfg.HealthHandler.Ready)
    app.Get("/health/live", cfg.HealthHandler.Live)

    // API routes
    api := app.Group(cfg.Prefix)

    // Rate limiter for auth routes
    authLimiter := limiter.New(limiter.Config{
        Max:        cfg.RateLimit.Max,
        Expiration: cfg.RateLimit.Expiration,
        KeyGenerator: func(c *fiber.Ctx) string {
            return c.IP()
        },
        LimitReached: func(c *fiber.Ctx) error {
            return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
                "success": false,
                "error": fiber.Map{
                    "code":    "TOO_MANY_REQUESTS",
                    "message": "Rate limit exceeded",
                },
            })
        },
    })

    // Auth routes
    auth := api.Group("/auth")
    auth.Use(authLimiter)
    auth.Post("/register", cfg.AuthHandler.Register)
    auth.Post("/login", cfg.AuthHandler.Login)
    auth.Post("/refresh", cfg.AuthHandler.Refresh)
    auth.Post("/logout", middleware.Auth(nil), cfg.AuthHandler.Logout)

    // Protected routes
    protected := api.Group("")
    protected.Use(middleware.Auth(nil))

    // User routes
    users := protected.Group("/users")
    users.Get("/me", cfg.UserHandler.GetCurrentUser)
    users.Put("/me", cfg.UserHandler.UpdateCurrentUser)
    users.Delete("/me", cfg.UserHandler.DeleteCurrentUser)
    users.Put("/me/password", cfg.UserHandler.ChangePassword)

    // Admin routes
    admin := protected.Group("/admin")
    admin.Use(middleware.RequireRole("admin"))
    admin.Get("/users", cfg.UserHandler.List)
    admin.Get("/users/:id", cfg.UserHandler.GetByID)
    admin.Put("/users/:id", cfg.UserHandler.Update)
    admin.Delete("/users/:id", cfg.UserHandler.Delete)

    // Item routes
    items := protected.Group("/items")
    items.Get("", cfg.ItemHandler.List)
    items.Post("", cfg.ItemHandler.Create)
    items.Get("/:id", cfg.ItemHandler.GetByID)
    items.Put("/:id", cfg.ItemHandler.Update)
    items.Delete("/:id", cfg.ItemHandler.Delete)

    // WebSocket
    ws := api.Group("/ws")
    ws.Use(middleware.Auth(nil))
    ws.Use(cfg.WSHandler.Upgrade)
    ws.Get("/", websocket.New(cfg.WSHandler.Handle))
}
```

### pkg/utils/response.go
```go
package utils

import (
    "github.com/go-playground/validator/v10"
    "github.com/gofiber/fiber/v2"
    "github.com/google/uuid"
)

type Response struct {
    Success bool        `json:"success"`
    Data    interface{} `json:"data,omitempty"`
    Error   *ErrorData  `json:"error,omitempty"`
}

type ErrorData struct {
    Code    string            `json:"code"`
    Message string            `json:"message"`
    Details map[string]string `json:"details,omitempty"`
}

func Success(c *fiber.Ctx, data interface{}) error {
    return c.JSON(Response{Success: true, Data: data})
}

func Created(c *fiber.Ctx, data interface{}) error {
    return c.Status(fiber.StatusCreated).JSON(Response{Success: true, Data: data})
}

func NoContent(c *fiber.Ctx) error {
    return c.SendStatus(fiber.StatusNoContent)
}

func BadRequest(c *fiber.Ctx, message string) error {
    return c.Status(fiber.StatusBadRequest).JSON(Response{
        Success: false,
        Error:   &ErrorData{Code: "BAD_REQUEST", Message: message},
    })
}

func Unauthorized(c *fiber.Ctx, message string) error {
    return c.Status(fiber.StatusUnauthorized).JSON(Response{
        Success: false,
        Error:   &ErrorData{Code: "UNAUTHORIZED", Message: message},
    })
}

func Forbidden(c *fiber.Ctx, message string) error {
    return c.Status(fiber.StatusForbidden).JSON(Response{
        Success: false,
        Error:   &ErrorData{Code: "FORBIDDEN", Message: message},
    })
}

func NotFound(c *fiber.Ctx, message string) error {
    return c.Status(fiber.StatusNotFound).JSON(Response{
        Success: false,
        Error:   &ErrorData{Code: "NOT_FOUND", Message: message},
    })
}

func Conflict(c *fiber.Ctx, message string) error {
    return c.Status(fiber.StatusConflict).JSON(Response{
        Success: false,
        Error:   &ErrorData{Code: "CONFLICT", Message: message},
    })
}

func InternalError(c *fiber.Ctx, message string) error {
    return c.Status(fiber.StatusInternalServerError).JSON(Response{
        Success: false,
        Error:   &ErrorData{Code: "INTERNAL_ERROR", Message: message},
    })
}

func ValidationError(c *fiber.Ctx, err error) error {
    details := make(map[string]string)

    if validationErrors, ok := err.(validator.ValidationErrors); ok {
        for _, e := range validationErrors {
            details[e.Field()] = formatValidationError(e)
        }
    }

    return c.Status(fiber.StatusBadRequest).JSON(Response{
        Success: false,
        Error: &ErrorData{
            Code:    "VALIDATION_ERROR",
            Message: "Validation failed",
            Details: details,
        },
    })
}

func formatValidationError(e validator.FieldError) string {
    switch e.Tag() {
    case "required":
        return "This field is required"
    case "email":
        return "Invalid email format"
    case "min":
        return "Value is too short"
    case "max":
        return "Value is too long"
    case "uuid":
        return "Invalid UUID format"
    default:
        return "Invalid value"
    }
}

func GetUserID(c *fiber.Ctx) uuid.UUID {
    userID, _ := c.Locals("user_id").(uuid.UUID)
    return userID
}

func GetUserRole(c *fiber.Ctx) string {
    role, _ := c.Locals("user_role").(string)
    return role
}
```

## Docker Configuration

### Dockerfile
```dockerfile
# Build stage
FROM golang:1.22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache gcc musl-dev

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main ./cmd/api

# Runtime stage
FROM alpine:3.19

WORKDIR /app

RUN apk --no-cache add ca-certificates tzdata

COPY --from=builder /app/main .
COPY --from=builder /app/migrations ./migrations

RUN adduser -D -g '' appuser
USER appuser

EXPOSE 3000

CMD ["./main"]
```

### docker-compose.yml
```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
      - APP_ENV=production
      - DATABASE_URL=postgres://postgres:postgres@postgres:5432/fiberapi?sslmode=disable
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      postgres:
        condition: service_healthy

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: fiberapi
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

## Testing

### internal/handlers/auth_test.go
```go
package handlers_test

import (
    "bytes"
    "encoding/json"
    "io"
    "net/http/httptest"
    "testing"

    "github.com/gofiber/fiber/v2"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/mock"
    "github.com/yourusername/my-fiber-api/internal/handlers"
    "github.com/yourusername/my-fiber-api/internal/services"
    "github.com/yourusername/my-fiber-api/pkg/logger"
)

type MockAuthService struct {
    mock.Mock
}

func (m *MockAuthService) Register(ctx context.Context, req services.RegisterRequest) (*services.AuthResponse, error) {
    args := m.Called(ctx, req)
    if args.Get(0) == nil {
        return nil, args.Error(1)
    }
    return args.Get(0).(*services.AuthResponse), args.Error(1)
}

func TestAuthHandler_Register(t *testing.T) {
    tests := []struct {
        name           string
        body           interface{}
        setupMock      func(*MockAuthService)
        expectedStatus int
    }{
        {
            name: "successful registration",
            body: services.RegisterRequest{
                Email:    "test@example.com",
                Password: "password123",
                Name:     "Test User",
            },
            setupMock: func(m *MockAuthService) {
                m.On("Register", mock.Anything, mock.AnythingOfType("services.RegisterRequest")).
                    Return(&services.AuthResponse{
                        AccessToken:  "access_token",
                        RefreshToken: "refresh_token",
                        ExpiresIn:    900,
                        TokenType:    "Bearer",
                    }, nil)
            },
            expectedStatus: fiber.StatusCreated,
        },
        {
            name: "user exists",
            body: services.RegisterRequest{
                Email:    "existing@example.com",
                Password: "password123",
                Name:     "Test User",
            },
            setupMock: func(m *MockAuthService) {
                m.On("Register", mock.Anything, mock.AnythingOfType("services.RegisterRequest")).
                    Return(nil, services.ErrUserExists)
            },
            expectedStatus: fiber.StatusConflict,
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            mockService := new(MockAuthService)
            tt.setupMock(mockService)

            log := logger.New("debug")
            handler := handlers.NewAuthHandler(mockService, log)

            app := fiber.New()
            app.Post("/auth/register", handler.Register)

            body, _ := json.Marshal(tt.body)
            req := httptest.NewRequest("POST", "/auth/register", bytes.NewBuffer(body))
            req.Header.Set("Content-Type", "application/json")

            resp, _ := app.Test(req)

            assert.Equal(t, tt.expectedStatus, resp.StatusCode)
            mockService.AssertExpectations(t)
        })
    }
}
```

## CLAUDE.md Integration

```markdown
# Go Fiber API

## Build Commands
- `go run cmd/api/main.go` - Start development server
- `go build -o bin/api ./cmd/api` - Build binary
- `go test ./...` - Run all tests
- `make migrate-up` - Run database migrations

## Architecture
- Fiber v2 for high-performance HTTP routing
- sqlx for raw SQL with struct scanning
- JWT with refresh token rotation
- WebSocket support built-in

## Key Patterns
- Services contain business logic
- Handlers handle HTTP concerns only
- Use context for request-scoped values
- Graceful shutdown with signal handling

## Database
- Use prepared statements for security
- Soft deletes with deleted_at column
- Migration files in /migrations directory
```

## AI Suggestions

1. **Add connection pooling metrics** - Monitor database connection pool health and auto-scale
2. **Implement request coalescing** - Deduplicate identical concurrent requests
3. **Add prefork mode** - Enable Fiber's prefork for multi-process scaling
4. **Implement response caching** - Add ETag and Last-Modified header support
5. **Add gRPC support** - Create gRPC handlers alongside REST for internal services
6. **Implement batch operations** - Support bulk create/update/delete endpoints
7. **Add request/response compression** - Configure Brotli compression for responses
8. **Implement idempotency keys** - Support idempotent POST requests for reliability
9. **Add distributed tracing** - Integrate Jaeger or Zipkin for request tracing
10. **Implement graceful degradation** - Add circuit breakers for external dependencies
