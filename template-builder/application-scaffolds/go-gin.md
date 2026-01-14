# Go Gin API Template

## Overview
Production-ready REST API using Go with the Gin framework, featuring structured logging, PostgreSQL with GORM, JWT authentication, and comprehensive middleware.

## Quick Start
```bash
# Initialize project
mkdir my-gin-api && cd my-gin-api
go mod init github.com/yourusername/my-gin-api

# Install dependencies
go get -u github.com/gin-gonic/gin
go get -u gorm.io/gorm
go get -u gorm.io/driver/postgres
go get -u github.com/golang-jwt/jwt/v5
go get -u github.com/joho/godotenv
go get -u go.uber.org/zap
go get -u github.com/go-playground/validator/v10
go get -u golang.org/x/crypto/bcrypt
go get -u github.com/redis/go-redis/v9
go get -u github.com/swaggo/gin-swagger
go get -u github.com/swaggo/files
go get -u github.com/swaggo/swag/cmd/swag

# Run the server
go run cmd/api/main.go
```

## Project Structure
```
my-gin-api/
├── cmd/
│   └── api/
│       └── main.go
├── internal/
│   ├── config/
│   │   └── config.go
│   ├── database/
│   │   ├── database.go
│   │   └── migrations.go
│   ├── models/
│   │   ├── user.go
│   │   ├── item.go
│   │   └── base.go
│   ├── handlers/
│   │   ├── auth.go
│   │   ├── users.go
│   │   ├── items.go
│   │   └── health.go
│   ├── middleware/
│   │   ├── auth.go
│   │   ├── cors.go
│   │   ├── logger.go
│   │   ├── ratelimit.go
│   │   └── recovery.go
│   ├── services/
│   │   ├── auth.go
│   │   ├── user.go
│   │   └── item.go
│   ├── repository/
│   │   ├── user.go
│   │   └── item.go
│   ├── dto/
│   │   ├── auth.go
│   │   ├── user.go
│   │   └── item.go
│   ├── validators/
│   │   └── validators.go
│   └── errors/
│       └── errors.go
├── pkg/
│   ├── logger/
│   │   └── logger.go
│   ├── jwt/
│   │   └── jwt.go
│   └── response/
│       └── response.go
├── docs/
│   └── swagger.json
├── .env
├── .env.example
├── Dockerfile
├── docker-compose.yml
├── Makefile
└── go.mod
```

## Configuration

### go.mod
```go
module github.com/yourusername/my-gin-api

go 1.22

require (
    github.com/gin-gonic/gin v1.9.1
    github.com/go-playground/validator/v10 v10.18.0
    github.com/golang-jwt/jwt/v5 v5.2.0
    github.com/joho/godotenv v1.5.1
    github.com/redis/go-redis/v9 v9.4.0
    github.com/swaggo/files v1.0.1
    github.com/swaggo/gin-swagger v1.6.0
    github.com/swaggo/swag v1.16.3
    go.uber.org/zap v1.27.0
    golang.org/x/crypto v0.19.0
    gorm.io/driver/postgres v1.5.6
    gorm.io/gorm v1.25.7
)
```

### .env.example
```env
# Server
PORT=8080
GIN_MODE=debug
API_VERSION=v1

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=ginapi
DB_SSL_MODE=disable

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRY=24h
JWT_REFRESH_EXPIRY=168h

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_DURATION=1m

# Logging
LOG_LEVEL=debug
LOG_FORMAT=json
```

### internal/config/config.go
```go
package config

import (
    "os"
    "strconv"
    "time"

    "github.com/joho/godotenv"
)

type Config struct {
    Server   ServerConfig
    Database DatabaseConfig
    Redis    RedisConfig
    JWT      JWTConfig
    RateLimit RateLimitConfig
    Log      LogConfig
}

type ServerConfig struct {
    Port    string
    Mode    string
    Version string
}

type DatabaseConfig struct {
    Host     string
    Port     string
    User     string
    Password string
    Name     string
    SSLMode  string
}

type RedisConfig struct {
    Host     string
    Port     string
    Password string
}

type JWTConfig struct {
    Secret        string
    Expiry        time.Duration
    RefreshExpiry time.Duration
}

type RateLimitConfig struct {
    Requests int
    Duration time.Duration
}

type LogConfig struct {
    Level  string
    Format string
}

func Load() (*Config, error) {
    if err := godotenv.Load(); err != nil {
        // .env file not found, use environment variables
    }

    jwtExpiry, _ := time.ParseDuration(getEnv("JWT_EXPIRY", "24h"))
    jwtRefreshExpiry, _ := time.ParseDuration(getEnv("JWT_REFRESH_EXPIRY", "168h"))
    rateLimitDuration, _ := time.ParseDuration(getEnv("RATE_LIMIT_DURATION", "1m"))
    rateLimitRequests, _ := strconv.Atoi(getEnv("RATE_LIMIT_REQUESTS", "100"))

    return &Config{
        Server: ServerConfig{
            Port:    getEnv("PORT", "8080"),
            Mode:    getEnv("GIN_MODE", "debug"),
            Version: getEnv("API_VERSION", "v1"),
        },
        Database: DatabaseConfig{
            Host:     getEnv("DB_HOST", "localhost"),
            Port:     getEnv("DB_PORT", "5432"),
            User:     getEnv("DB_USER", "postgres"),
            Password: getEnv("DB_PASSWORD", "postgres"),
            Name:     getEnv("DB_NAME", "ginapi"),
            SSLMode:  getEnv("DB_SSL_MODE", "disable"),
        },
        Redis: RedisConfig{
            Host:     getEnv("REDIS_HOST", "localhost"),
            Port:     getEnv("REDIS_PORT", "6379"),
            Password: getEnv("REDIS_PASSWORD", ""),
        },
        JWT: JWTConfig{
            Secret:        getEnv("JWT_SECRET", "change-me-in-production"),
            Expiry:        jwtExpiry,
            RefreshExpiry: jwtRefreshExpiry,
        },
        RateLimit: RateLimitConfig{
            Requests: rateLimitRequests,
            Duration: rateLimitDuration,
        },
        Log: LogConfig{
            Level:  getEnv("LOG_LEVEL", "debug"),
            Format: getEnv("LOG_FORMAT", "json"),
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
    "fmt"
    "net/http"
    "os"
    "os/signal"
    "syscall"
    "time"

    "github.com/gin-gonic/gin"
    "github.com/yourusername/my-gin-api/internal/config"
    "github.com/yourusername/my-gin-api/internal/database"
    "github.com/yourusername/my-gin-api/internal/handlers"
    "github.com/yourusername/my-gin-api/internal/middleware"
    "github.com/yourusername/my-gin-api/internal/repository"
    "github.com/yourusername/my-gin-api/internal/services"
    "github.com/yourusername/my-gin-api/pkg/logger"

    _ "github.com/yourusername/my-gin-api/docs"
    swaggerFiles "github.com/swaggo/files"
    ginSwagger "github.com/swaggo/gin-swagger"
)

// @title           Go Gin API
// @version         1.0
// @description     Production-ready REST API with Go and Gin
// @termsOfService  http://swagger.io/terms/

// @contact.name   API Support
// @contact.url    http://www.swagger.io/support
// @contact.email  support@swagger.io

// @license.name  MIT
// @license.url   https://opensource.org/licenses/MIT

// @host      localhost:8080
// @BasePath  /api/v1

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description Type "Bearer" followed by a space and JWT token.

func main() {
    // Load configuration
    cfg, err := config.Load()
    if err != nil {
        panic(fmt.Sprintf("Failed to load config: %v", err))
    }

    // Initialize logger
    log := logger.New(cfg.Log.Level, cfg.Log.Format)
    defer log.Sync()

    // Set Gin mode
    gin.SetMode(cfg.Server.Mode)

    // Initialize database
    db, err := database.New(cfg.Database)
    if err != nil {
        log.Fatal("Failed to connect to database", "error", err)
    }

    // Run migrations
    if err := database.Migrate(db); err != nil {
        log.Fatal("Failed to run migrations", "error", err)
    }

    // Initialize Redis
    redisClient := database.NewRedis(cfg.Redis)

    // Initialize repositories
    userRepo := repository.NewUserRepository(db)
    itemRepo := repository.NewItemRepository(db)

    // Initialize services
    authService := services.NewAuthService(userRepo, cfg.JWT, redisClient)
    userService := services.NewUserService(userRepo)
    itemService := services.NewItemService(itemRepo)

    // Initialize handlers
    authHandler := handlers.NewAuthHandler(authService, log)
    userHandler := handlers.NewUserHandler(userService, log)
    itemHandler := handlers.NewItemHandler(itemService, log)
    healthHandler := handlers.NewHealthHandler(db, redisClient, log)

    // Setup router
    router := gin.New()

    // Global middleware
    router.Use(middleware.Logger(log))
    router.Use(middleware.Recovery(log))
    router.Use(middleware.CORS())
    router.Use(middleware.RequestID())

    // Swagger documentation
    router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

    // Health check
    router.GET("/health", healthHandler.Check)
    router.GET("/health/ready", healthHandler.Ready)
    router.GET("/health/live", healthHandler.Live)

    // API routes
    api := router.Group("/api/" + cfg.Server.Version)
    {
        // Rate limiting for auth routes
        authGroup := api.Group("/auth")
        authGroup.Use(middleware.RateLimit(redisClient, cfg.RateLimit))
        {
            authGroup.POST("/register", authHandler.Register)
            authGroup.POST("/login", authHandler.Login)
            authGroup.POST("/refresh", authHandler.RefreshToken)
            authGroup.POST("/logout", middleware.Auth(cfg.JWT.Secret), authHandler.Logout)
        }

        // Protected routes
        protected := api.Group("")
        protected.Use(middleware.Auth(cfg.JWT.Secret))
        {
            // User routes
            users := protected.Group("/users")
            {
                users.GET("/me", userHandler.GetCurrentUser)
                users.PUT("/me", userHandler.UpdateCurrentUser)
                users.DELETE("/me", userHandler.DeleteCurrentUser)
                users.PUT("/me/password", userHandler.ChangePassword)
            }

            // Admin only routes
            admin := protected.Group("/admin")
            admin.Use(middleware.RequireRole("admin"))
            {
                admin.GET("/users", userHandler.ListUsers)
                admin.GET("/users/:id", userHandler.GetUser)
                admin.PUT("/users/:id", userHandler.UpdateUser)
                admin.DELETE("/users/:id", userHandler.DeleteUser)
            }

            // Item routes
            items := protected.Group("/items")
            {
                items.GET("", itemHandler.List)
                items.POST("", itemHandler.Create)
                items.GET("/:id", itemHandler.Get)
                items.PUT("/:id", itemHandler.Update)
                items.DELETE("/:id", itemHandler.Delete)
            }
        }
    }

    // Create server
    srv := &http.Server{
        Addr:         ":" + cfg.Server.Port,
        Handler:      router,
        ReadTimeout:  15 * time.Second,
        WriteTimeout: 15 * time.Second,
        IdleTimeout:  60 * time.Second,
    }

    // Start server in goroutine
    go func() {
        log.Info("Starting server", "port", cfg.Server.Port)
        if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
            log.Fatal("Failed to start server", "error", err)
        }
    }()

    // Graceful shutdown
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    <-quit

    log.Info("Shutting down server...")

    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    if err := srv.Shutdown(ctx); err != nil {
        log.Fatal("Server forced to shutdown", "error", err)
    }

    log.Info("Server exited properly")
}
```

### internal/models/base.go
```go
package models

import (
    "time"

    "github.com/google/uuid"
    "gorm.io/gorm"
)

type BaseModel struct {
    ID        uuid.UUID      `gorm:"type:uuid;primary_key" json:"id"`
    CreatedAt time.Time      `json:"created_at"`
    UpdatedAt time.Time      `json:"updated_at"`
    DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

func (b *BaseModel) BeforeCreate(tx *gorm.DB) error {
    if b.ID == uuid.Nil {
        b.ID = uuid.New()
    }
    return nil
}
```

### internal/models/user.go
```go
package models

import (
    "golang.org/x/crypto/bcrypt"
    "gorm.io/gorm"
)

type Role string

const (
    RoleUser  Role = "user"
    RoleAdmin Role = "admin"
)

type User struct {
    BaseModel
    Email     string `gorm:"uniqueIndex;not null" json:"email"`
    Password  string `gorm:"not null" json:"-"`
    Name      string `gorm:"not null" json:"name"`
    Role      Role   `gorm:"type:varchar(20);default:user" json:"role"`
    Active    bool   `gorm:"default:true" json:"active"`
    Items     []Item `gorm:"foreignKey:UserID" json:"-"`
}

func (u *User) BeforeCreate(tx *gorm.DB) error {
    if err := u.BaseModel.BeforeCreate(tx); err != nil {
        return err
    }
    return u.hashPassword()
}

func (u *User) hashPassword() error {
    if u.Password == "" {
        return nil
    }
    hashedPassword, err := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
    if err != nil {
        return err
    }
    u.Password = string(hashedPassword)
    return nil
}

func (u *User) ComparePassword(password string) bool {
    err := bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(password))
    return err == nil
}

func (u *User) SetPassword(password string) error {
    u.Password = password
    return u.hashPassword()
}
```

### internal/models/item.go
```go
package models

import "github.com/google/uuid"

type ItemStatus string

const (
    ItemStatusDraft     ItemStatus = "draft"
    ItemStatusPublished ItemStatus = "published"
    ItemStatusArchived  ItemStatus = "archived"
)

type Item struct {
    BaseModel
    Title       string     `gorm:"not null" json:"title"`
    Description string     `json:"description"`
    Status      ItemStatus `gorm:"type:varchar(20);default:draft" json:"status"`
    Price       float64    `gorm:"type:decimal(10,2)" json:"price"`
    UserID      uuid.UUID  `gorm:"type:uuid;not null" json:"user_id"`
    User        User       `gorm:"foreignKey:UserID" json:"-"`
}
```

### internal/dto/auth.go
```go
package dto

type RegisterRequest struct {
    Email    string `json:"email" binding:"required,email" example:"user@example.com"`
    Password string `json:"password" binding:"required,min=8" example:"password123"`
    Name     string `json:"name" binding:"required,min=2" example:"John Doe"`
}

type LoginRequest struct {
    Email    string `json:"email" binding:"required,email" example:"user@example.com"`
    Password string `json:"password" binding:"required" example:"password123"`
}

type RefreshRequest struct {
    RefreshToken string `json:"refresh_token" binding:"required"`
}

type AuthResponse struct {
    AccessToken  string      `json:"access_token"`
    RefreshToken string      `json:"refresh_token"`
    ExpiresIn    int64       `json:"expires_in"`
    TokenType    string      `json:"token_type"`
    User         UserResponse `json:"user"`
}

type UserResponse struct {
    ID    string `json:"id"`
    Email string `json:"email"`
    Name  string `json:"name"`
    Role  string `json:"role"`
}

type ChangePasswordRequest struct {
    CurrentPassword string `json:"current_password" binding:"required"`
    NewPassword     string `json:"new_password" binding:"required,min=8"`
}
```

### internal/dto/item.go
```go
package dto

import "github.com/yourusername/my-gin-api/internal/models"

type CreateItemRequest struct {
    Title       string  `json:"title" binding:"required,min=1,max=255"`
    Description string  `json:"description" binding:"max=1000"`
    Status      string  `json:"status" binding:"omitempty,oneof=draft published archived"`
    Price       float64 `json:"price" binding:"gte=0"`
}

type UpdateItemRequest struct {
    Title       *string  `json:"title" binding:"omitempty,min=1,max=255"`
    Description *string  `json:"description" binding:"omitempty,max=1000"`
    Status      *string  `json:"status" binding:"omitempty,oneof=draft published archived"`
    Price       *float64 `json:"price" binding:"omitempty,gte=0"`
}

type ItemResponse struct {
    ID          string  `json:"id"`
    Title       string  `json:"title"`
    Description string  `json:"description"`
    Status      string  `json:"status"`
    Price       float64 `json:"price"`
    UserID      string  `json:"user_id"`
    CreatedAt   string  `json:"created_at"`
    UpdatedAt   string  `json:"updated_at"`
}

type ItemListResponse struct {
    Items      []ItemResponse `json:"items"`
    Total      int64          `json:"total"`
    Page       int            `json:"page"`
    PageSize   int            `json:"page_size"`
    TotalPages int            `json:"total_pages"`
}

type ItemFilter struct {
    Status   models.ItemStatus `form:"status"`
    MinPrice float64           `form:"min_price"`
    MaxPrice float64           `form:"max_price"`
    Search   string            `form:"search"`
    Page     int               `form:"page,default=1"`
    PageSize int               `form:"page_size,default=20"`
    SortBy   string            `form:"sort_by,default=created_at"`
    SortDir  string            `form:"sort_dir,default=desc"`
}
```

### internal/repository/user.go
```go
package repository

import (
    "context"

    "github.com/google/uuid"
    "github.com/yourusername/my-gin-api/internal/models"
    "gorm.io/gorm"
)

type UserRepository interface {
    Create(ctx context.Context, user *models.User) error
    FindByID(ctx context.Context, id uuid.UUID) (*models.User, error)
    FindByEmail(ctx context.Context, email string) (*models.User, error)
    Update(ctx context.Context, user *models.User) error
    Delete(ctx context.Context, id uuid.UUID) error
    List(ctx context.Context, page, pageSize int) ([]models.User, int64, error)
    ExistsByEmail(ctx context.Context, email string) (bool, error)
}

type userRepository struct {
    db *gorm.DB
}

func NewUserRepository(db *gorm.DB) UserRepository {
    return &userRepository{db: db}
}

func (r *userRepository) Create(ctx context.Context, user *models.User) error {
    return r.db.WithContext(ctx).Create(user).Error
}

func (r *userRepository) FindByID(ctx context.Context, id uuid.UUID) (*models.User, error) {
    var user models.User
    err := r.db.WithContext(ctx).Where("id = ?", id).First(&user).Error
    if err != nil {
        return nil, err
    }
    return &user, nil
}

func (r *userRepository) FindByEmail(ctx context.Context, email string) (*models.User, error) {
    var user models.User
    err := r.db.WithContext(ctx).Where("email = ?", email).First(&user).Error
    if err != nil {
        return nil, err
    }
    return &user, nil
}

func (r *userRepository) Update(ctx context.Context, user *models.User) error {
    return r.db.WithContext(ctx).Save(user).Error
}

func (r *userRepository) Delete(ctx context.Context, id uuid.UUID) error {
    return r.db.WithContext(ctx).Delete(&models.User{}, id).Error
}

func (r *userRepository) List(ctx context.Context, page, pageSize int) ([]models.User, int64, error) {
    var users []models.User
    var total int64

    offset := (page - 1) * pageSize

    if err := r.db.WithContext(ctx).Model(&models.User{}).Count(&total).Error; err != nil {
        return nil, 0, err
    }

    if err := r.db.WithContext(ctx).Offset(offset).Limit(pageSize).Find(&users).Error; err != nil {
        return nil, 0, err
    }

    return users, total, nil
}

func (r *userRepository) ExistsByEmail(ctx context.Context, email string) (bool, error) {
    var count int64
    err := r.db.WithContext(ctx).Model(&models.User{}).Where("email = ?", email).Count(&count).Error
    return count > 0, err
}
```

### internal/repository/item.go
```go
package repository

import (
    "context"

    "github.com/google/uuid"
    "github.com/yourusername/my-gin-api/internal/dto"
    "github.com/yourusername/my-gin-api/internal/models"
    "gorm.io/gorm"
)

type ItemRepository interface {
    Create(ctx context.Context, item *models.Item) error
    FindByID(ctx context.Context, id uuid.UUID) (*models.Item, error)
    FindByIDAndUser(ctx context.Context, id, userID uuid.UUID) (*models.Item, error)
    Update(ctx context.Context, item *models.Item) error
    Delete(ctx context.Context, id uuid.UUID) error
    List(ctx context.Context, userID uuid.UUID, filter dto.ItemFilter) ([]models.Item, int64, error)
}

type itemRepository struct {
    db *gorm.DB
}

func NewItemRepository(db *gorm.DB) ItemRepository {
    return &itemRepository{db: db}
}

func (r *itemRepository) Create(ctx context.Context, item *models.Item) error {
    return r.db.WithContext(ctx).Create(item).Error
}

func (r *itemRepository) FindByID(ctx context.Context, id uuid.UUID) (*models.Item, error) {
    var item models.Item
    err := r.db.WithContext(ctx).Where("id = ?", id).First(&item).Error
    if err != nil {
        return nil, err
    }
    return &item, nil
}

func (r *itemRepository) FindByIDAndUser(ctx context.Context, id, userID uuid.UUID) (*models.Item, error) {
    var item models.Item
    err := r.db.WithContext(ctx).Where("id = ? AND user_id = ?", id, userID).First(&item).Error
    if err != nil {
        return nil, err
    }
    return &item, nil
}

func (r *itemRepository) Update(ctx context.Context, item *models.Item) error {
    return r.db.WithContext(ctx).Save(item).Error
}

func (r *itemRepository) Delete(ctx context.Context, id uuid.UUID) error {
    return r.db.WithContext(ctx).Delete(&models.Item{}, id).Error
}

func (r *itemRepository) List(ctx context.Context, userID uuid.UUID, filter dto.ItemFilter) ([]models.Item, int64, error) {
    var items []models.Item
    var total int64

    query := r.db.WithContext(ctx).Model(&models.Item{}).Where("user_id = ?", userID)

    // Apply filters
    if filter.Status != "" {
        query = query.Where("status = ?", filter.Status)
    }
    if filter.MinPrice > 0 {
        query = query.Where("price >= ?", filter.MinPrice)
    }
    if filter.MaxPrice > 0 {
        query = query.Where("price <= ?", filter.MaxPrice)
    }
    if filter.Search != "" {
        search := "%" + filter.Search + "%"
        query = query.Where("title ILIKE ? OR description ILIKE ?", search, search)
    }

    // Count total
    if err := query.Count(&total).Error; err != nil {
        return nil, 0, err
    }

    // Apply pagination and sorting
    offset := (filter.Page - 1) * filter.PageSize
    order := filter.SortBy + " " + filter.SortDir

    if err := query.Order(order).Offset(offset).Limit(filter.PageSize).Find(&items).Error; err != nil {
        return nil, 0, err
    }

    return items, total, nil
}
```

### internal/services/auth.go
```go
package services

import (
    "context"
    "errors"
    "time"

    "github.com/google/uuid"
    "github.com/redis/go-redis/v9"
    "github.com/yourusername/my-gin-api/internal/config"
    "github.com/yourusername/my-gin-api/internal/dto"
    "github.com/yourusername/my-gin-api/internal/models"
    "github.com/yourusername/my-gin-api/internal/repository"
    "github.com/yourusername/my-gin-api/pkg/jwt"
)

var (
    ErrUserNotFound      = errors.New("user not found")
    ErrInvalidCredentials = errors.New("invalid credentials")
    ErrUserExists        = errors.New("user already exists")
    ErrInvalidToken      = errors.New("invalid token")
    ErrTokenBlacklisted  = errors.New("token has been revoked")
)

type AuthService interface {
    Register(ctx context.Context, req dto.RegisterRequest) (*dto.AuthResponse, error)
    Login(ctx context.Context, req dto.LoginRequest) (*dto.AuthResponse, error)
    RefreshToken(ctx context.Context, refreshToken string) (*dto.AuthResponse, error)
    Logout(ctx context.Context, userID uuid.UUID, token string) error
    ValidateToken(ctx context.Context, token string) (*jwt.Claims, error)
}

type authService struct {
    userRepo    repository.UserRepository
    jwtConfig   config.JWTConfig
    redisClient *redis.Client
}

func NewAuthService(userRepo repository.UserRepository, jwtConfig config.JWTConfig, redisClient *redis.Client) AuthService {
    return &authService{
        userRepo:    userRepo,
        jwtConfig:   jwtConfig,
        redisClient: redisClient,
    }
}

func (s *authService) Register(ctx context.Context, req dto.RegisterRequest) (*dto.AuthResponse, error) {
    // Check if user exists
    exists, err := s.userRepo.ExistsByEmail(ctx, req.Email)
    if err != nil {
        return nil, err
    }
    if exists {
        return nil, ErrUserExists
    }

    // Create user
    user := &models.User{
        Email:    req.Email,
        Password: req.Password,
        Name:     req.Name,
        Role:     models.RoleUser,
        Active:   true,
    }

    if err := s.userRepo.Create(ctx, user); err != nil {
        return nil, err
    }

    // Generate tokens
    return s.generateAuthResponse(user)
}

func (s *authService) Login(ctx context.Context, req dto.LoginRequest) (*dto.AuthResponse, error) {
    user, err := s.userRepo.FindByEmail(ctx, req.Email)
    if err != nil {
        return nil, ErrInvalidCredentials
    }

    if !user.ComparePassword(req.Password) {
        return nil, ErrInvalidCredentials
    }

    if !user.Active {
        return nil, ErrInvalidCredentials
    }

    return s.generateAuthResponse(user)
}

func (s *authService) RefreshToken(ctx context.Context, refreshToken string) (*dto.AuthResponse, error) {
    claims, err := jwt.ValidateToken(refreshToken, s.jwtConfig.Secret)
    if err != nil {
        return nil, ErrInvalidToken
    }

    if claims.TokenType != "refresh" {
        return nil, ErrInvalidToken
    }

    // Check if token is blacklisted
    blacklisted, err := s.isTokenBlacklisted(ctx, refreshToken)
    if err != nil {
        return nil, err
    }
    if blacklisted {
        return nil, ErrTokenBlacklisted
    }

    user, err := s.userRepo.FindByID(ctx, claims.UserID)
    if err != nil {
        return nil, ErrUserNotFound
    }

    // Blacklist old refresh token
    if err := s.blacklistToken(ctx, refreshToken, s.jwtConfig.RefreshExpiry); err != nil {
        return nil, err
    }

    return s.generateAuthResponse(user)
}

func (s *authService) Logout(ctx context.Context, userID uuid.UUID, token string) error {
    return s.blacklistToken(ctx, token, s.jwtConfig.Expiry)
}

func (s *authService) ValidateToken(ctx context.Context, token string) (*jwt.Claims, error) {
    claims, err := jwt.ValidateToken(token, s.jwtConfig.Secret)
    if err != nil {
        return nil, ErrInvalidToken
    }

    blacklisted, err := s.isTokenBlacklisted(ctx, token)
    if err != nil {
        return nil, err
    }
    if blacklisted {
        return nil, ErrTokenBlacklisted
    }

    return claims, nil
}

func (s *authService) generateAuthResponse(user *models.User) (*dto.AuthResponse, error) {
    accessToken, err := jwt.GenerateToken(user.ID, user.Email, string(user.Role), s.jwtConfig.Secret, s.jwtConfig.Expiry, "access")
    if err != nil {
        return nil, err
    }

    refreshToken, err := jwt.GenerateToken(user.ID, user.Email, string(user.Role), s.jwtConfig.Secret, s.jwtConfig.RefreshExpiry, "refresh")
    if err != nil {
        return nil, err
    }

    return &dto.AuthResponse{
        AccessToken:  accessToken,
        RefreshToken: refreshToken,
        ExpiresIn:    int64(s.jwtConfig.Expiry.Seconds()),
        TokenType:    "Bearer",
        User: dto.UserResponse{
            ID:    user.ID.String(),
            Email: user.Email,
            Name:  user.Name,
            Role:  string(user.Role),
        },
    }, nil
}

func (s *authService) blacklistToken(ctx context.Context, token string, expiry time.Duration) error {
    return s.redisClient.Set(ctx, "blacklist:"+token, "1", expiry).Err()
}

func (s *authService) isTokenBlacklisted(ctx context.Context, token string) (bool, error) {
    result, err := s.redisClient.Exists(ctx, "blacklist:"+token).Result()
    if err != nil {
        return false, err
    }
    return result > 0, nil
}
```

### internal/middleware/auth.go
```go
package middleware

import (
    "net/http"
    "strings"

    "github.com/gin-gonic/gin"
    "github.com/yourusername/my-gin-api/pkg/jwt"
    "github.com/yourusername/my-gin-api/pkg/response"
)

const (
    AuthUserKey     = "auth_user"
    AuthUserIDKey   = "auth_user_id"
    AuthUserRoleKey = "auth_user_role"
)

func Auth(secret string) gin.HandlerFunc {
    return func(c *gin.Context) {
        authHeader := c.GetHeader("Authorization")
        if authHeader == "" {
            response.Error(c, http.StatusUnauthorized, "Authorization header required")
            c.Abort()
            return
        }

        parts := strings.SplitN(authHeader, " ", 2)
        if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
            response.Error(c, http.StatusUnauthorized, "Invalid authorization header format")
            c.Abort()
            return
        }

        token := parts[1]
        claims, err := jwt.ValidateToken(token, secret)
        if err != nil {
            response.Error(c, http.StatusUnauthorized, "Invalid or expired token")
            c.Abort()
            return
        }

        if claims.TokenType != "access" {
            response.Error(c, http.StatusUnauthorized, "Invalid token type")
            c.Abort()
            return
        }

        c.Set(AuthUserKey, claims)
        c.Set(AuthUserIDKey, claims.UserID)
        c.Set(AuthUserRoleKey, claims.Role)

        c.Next()
    }
}

func RequireRole(roles ...string) gin.HandlerFunc {
    return func(c *gin.Context) {
        userRole, exists := c.Get(AuthUserRoleKey)
        if !exists {
            response.Error(c, http.StatusUnauthorized, "User role not found")
            c.Abort()
            return
        }

        role := userRole.(string)
        for _, r := range roles {
            if r == role {
                c.Next()
                return
            }
        }

        response.Error(c, http.StatusForbidden, "Insufficient permissions")
        c.Abort()
    }
}

func OptionalAuth(secret string) gin.HandlerFunc {
    return func(c *gin.Context) {
        authHeader := c.GetHeader("Authorization")
        if authHeader == "" {
            c.Next()
            return
        }

        parts := strings.SplitN(authHeader, " ", 2)
        if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
            c.Next()
            return
        }

        token := parts[1]
        claims, err := jwt.ValidateToken(token, secret)
        if err != nil {
            c.Next()
            return
        }

        c.Set(AuthUserKey, claims)
        c.Set(AuthUserIDKey, claims.UserID)
        c.Set(AuthUserRoleKey, claims.Role)

        c.Next()
    }
}
```

### internal/middleware/ratelimit.go
```go
package middleware

import (
    "context"
    "fmt"
    "net/http"
    "time"

    "github.com/gin-gonic/gin"
    "github.com/redis/go-redis/v9"
    "github.com/yourusername/my-gin-api/internal/config"
    "github.com/yourusername/my-gin-api/pkg/response"
)

func RateLimit(client *redis.Client, cfg config.RateLimitConfig) gin.HandlerFunc {
    return func(c *gin.Context) {
        ctx := context.Background()

        // Use IP address as key
        key := fmt.Sprintf("ratelimit:%s:%s", c.ClientIP(), c.FullPath())

        // Get current count
        count, err := client.Incr(ctx, key).Result()
        if err != nil {
            c.Next()
            return
        }

        // Set expiry on first request
        if count == 1 {
            client.Expire(ctx, key, cfg.Duration)
        }

        // Check if over limit
        if int(count) > cfg.Requests {
            ttl, _ := client.TTL(ctx, key).Result()

            c.Header("X-RateLimit-Limit", fmt.Sprintf("%d", cfg.Requests))
            c.Header("X-RateLimit-Remaining", "0")
            c.Header("X-RateLimit-Reset", fmt.Sprintf("%d", time.Now().Add(ttl).Unix()))
            c.Header("Retry-After", fmt.Sprintf("%d", int(ttl.Seconds())))

            response.Error(c, http.StatusTooManyRequests, "Rate limit exceeded")
            c.Abort()
            return
        }

        c.Header("X-RateLimit-Limit", fmt.Sprintf("%d", cfg.Requests))
        c.Header("X-RateLimit-Remaining", fmt.Sprintf("%d", cfg.Requests-int(count)))

        c.Next()
    }
}
```

### internal/middleware/logger.go
```go
package middleware

import (
    "time"

    "github.com/gin-gonic/gin"
    "github.com/yourusername/my-gin-api/pkg/logger"
)

func Logger(log *logger.Logger) gin.HandlerFunc {
    return func(c *gin.Context) {
        start := time.Now()
        path := c.Request.URL.Path
        query := c.Request.URL.RawQuery

        c.Next()

        latency := time.Since(start)
        statusCode := c.Writer.Status()

        fields := map[string]interface{}{
            "status":     statusCode,
            "method":     c.Request.Method,
            "path":       path,
            "query":      query,
            "ip":         c.ClientIP(),
            "user_agent": c.Request.UserAgent(),
            "latency":    latency.String(),
            "latency_ms": latency.Milliseconds(),
        }

        if requestID, exists := c.Get("request_id"); exists {
            fields["request_id"] = requestID
        }

        if userID, exists := c.Get(AuthUserIDKey); exists {
            fields["user_id"] = userID
        }

        if len(c.Errors) > 0 {
            fields["errors"] = c.Errors.String()
            log.Error("Request completed with errors", fields)
        } else if statusCode >= 500 {
            log.Error("Server error", fields)
        } else if statusCode >= 400 {
            log.Warn("Client error", fields)
        } else {
            log.Info("Request completed", fields)
        }
    }
}
```

### internal/handlers/auth.go
```go
package handlers

import (
    "errors"
    "net/http"

    "github.com/gin-gonic/gin"
    "github.com/google/uuid"
    "github.com/yourusername/my-gin-api/internal/dto"
    "github.com/yourusername/my-gin-api/internal/middleware"
    "github.com/yourusername/my-gin-api/internal/services"
    "github.com/yourusername/my-gin-api/pkg/logger"
    "github.com/yourusername/my-gin-api/pkg/response"
)

type AuthHandler struct {
    service services.AuthService
    log     *logger.Logger
}

func NewAuthHandler(service services.AuthService, log *logger.Logger) *AuthHandler {
    return &AuthHandler{service: service, log: log}
}

// Register godoc
// @Summary      Register a new user
// @Description  Create a new user account
// @Tags         auth
// @Accept       json
// @Produce      json
// @Param        request body dto.RegisterRequest true "Registration details"
// @Success      201 {object} dto.AuthResponse
// @Failure      400 {object} response.ErrorResponse
// @Failure      409 {object} response.ErrorResponse
// @Router       /auth/register [post]
func (h *AuthHandler) Register(c *gin.Context) {
    var req dto.RegisterRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        response.ValidationError(c, err)
        return
    }

    result, err := h.service.Register(c.Request.Context(), req)
    if err != nil {
        if errors.Is(err, services.ErrUserExists) {
            response.Error(c, http.StatusConflict, "User already exists")
            return
        }
        h.log.Error("Failed to register user", "error", err)
        response.Error(c, http.StatusInternalServerError, "Failed to register user")
        return
    }

    response.Success(c, http.StatusCreated, result)
}

// Login godoc
// @Summary      Login user
// @Description  Authenticate user and get tokens
// @Tags         auth
// @Accept       json
// @Produce      json
// @Param        request body dto.LoginRequest true "Login credentials"
// @Success      200 {object} dto.AuthResponse
// @Failure      400 {object} response.ErrorResponse
// @Failure      401 {object} response.ErrorResponse
// @Router       /auth/login [post]
func (h *AuthHandler) Login(c *gin.Context) {
    var req dto.LoginRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        response.ValidationError(c, err)
        return
    }

    result, err := h.service.Login(c.Request.Context(), req)
    if err != nil {
        if errors.Is(err, services.ErrInvalidCredentials) {
            response.Error(c, http.StatusUnauthorized, "Invalid email or password")
            return
        }
        h.log.Error("Failed to login", "error", err)
        response.Error(c, http.StatusInternalServerError, "Failed to login")
        return
    }

    response.Success(c, http.StatusOK, result)
}

// RefreshToken godoc
// @Summary      Refresh access token
// @Description  Get new access token using refresh token
// @Tags         auth
// @Accept       json
// @Produce      json
// @Param        request body dto.RefreshRequest true "Refresh token"
// @Success      200 {object} dto.AuthResponse
// @Failure      400 {object} response.ErrorResponse
// @Failure      401 {object} response.ErrorResponse
// @Router       /auth/refresh [post]
func (h *AuthHandler) RefreshToken(c *gin.Context) {
    var req dto.RefreshRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        response.ValidationError(c, err)
        return
    }

    result, err := h.service.RefreshToken(c.Request.Context(), req.RefreshToken)
    if err != nil {
        if errors.Is(err, services.ErrInvalidToken) || errors.Is(err, services.ErrTokenBlacklisted) {
            response.Error(c, http.StatusUnauthorized, "Invalid or expired refresh token")
            return
        }
        h.log.Error("Failed to refresh token", "error", err)
        response.Error(c, http.StatusInternalServerError, "Failed to refresh token")
        return
    }

    response.Success(c, http.StatusOK, result)
}

// Logout godoc
// @Summary      Logout user
// @Description  Invalidate current access token
// @Tags         auth
// @Security     BearerAuth
// @Produce      json
// @Success      200 {object} response.SuccessResponse
// @Failure      401 {object} response.ErrorResponse
// @Router       /auth/logout [post]
func (h *AuthHandler) Logout(c *gin.Context) {
    userID, _ := c.Get(middleware.AuthUserIDKey)
    token := c.GetHeader("Authorization")[7:] // Remove "Bearer "

    if err := h.service.Logout(c.Request.Context(), userID.(uuid.UUID), token); err != nil {
        h.log.Error("Failed to logout", "error", err)
        response.Error(c, http.StatusInternalServerError, "Failed to logout")
        return
    }

    response.Success(c, http.StatusOK, gin.H{"message": "Logged out successfully"})
}
```

### internal/handlers/items.go
```go
package handlers

import (
    "errors"
    "net/http"

    "github.com/gin-gonic/gin"
    "github.com/google/uuid"
    "github.com/yourusername/my-gin-api/internal/dto"
    "github.com/yourusername/my-gin-api/internal/middleware"
    "github.com/yourusername/my-gin-api/internal/services"
    "github.com/yourusername/my-gin-api/pkg/logger"
    "github.com/yourusername/my-gin-api/pkg/response"
)

type ItemHandler struct {
    service services.ItemService
    log     *logger.Logger
}

func NewItemHandler(service services.ItemService, log *logger.Logger) *ItemHandler {
    return &ItemHandler{service: service, log: log}
}

// List godoc
// @Summary      List items
// @Description  Get paginated list of user's items
// @Tags         items
// @Security     BearerAuth
// @Produce      json
// @Param        status query string false "Filter by status"
// @Param        min_price query number false "Minimum price"
// @Param        max_price query number false "Maximum price"
// @Param        search query string false "Search in title/description"
// @Param        page query int false "Page number" default(1)
// @Param        page_size query int false "Items per page" default(20)
// @Success      200 {object} dto.ItemListResponse
// @Failure      401 {object} response.ErrorResponse
// @Router       /items [get]
func (h *ItemHandler) List(c *gin.Context) {
    userID, _ := c.Get(middleware.AuthUserIDKey)

    var filter dto.ItemFilter
    if err := c.ShouldBindQuery(&filter); err != nil {
        response.ValidationError(c, err)
        return
    }

    result, err := h.service.List(c.Request.Context(), userID.(uuid.UUID), filter)
    if err != nil {
        h.log.Error("Failed to list items", "error", err)
        response.Error(c, http.StatusInternalServerError, "Failed to list items")
        return
    }

    response.Success(c, http.StatusOK, result)
}

// Create godoc
// @Summary      Create item
// @Description  Create a new item
// @Tags         items
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        request body dto.CreateItemRequest true "Item details"
// @Success      201 {object} dto.ItemResponse
// @Failure      400 {object} response.ErrorResponse
// @Failure      401 {object} response.ErrorResponse
// @Router       /items [post]
func (h *ItemHandler) Create(c *gin.Context) {
    userID, _ := c.Get(middleware.AuthUserIDKey)

    var req dto.CreateItemRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        response.ValidationError(c, err)
        return
    }

    result, err := h.service.Create(c.Request.Context(), userID.(uuid.UUID), req)
    if err != nil {
        h.log.Error("Failed to create item", "error", err)
        response.Error(c, http.StatusInternalServerError, "Failed to create item")
        return
    }

    response.Success(c, http.StatusCreated, result)
}

// Get godoc
// @Summary      Get item
// @Description  Get item by ID
// @Tags         items
// @Security     BearerAuth
// @Produce      json
// @Param        id path string true "Item ID"
// @Success      200 {object} dto.ItemResponse
// @Failure      401 {object} response.ErrorResponse
// @Failure      404 {object} response.ErrorResponse
// @Router       /items/{id} [get]
func (h *ItemHandler) Get(c *gin.Context) {
    userID, _ := c.Get(middleware.AuthUserIDKey)

    itemID, err := uuid.Parse(c.Param("id"))
    if err != nil {
        response.Error(c, http.StatusBadRequest, "Invalid item ID")
        return
    }

    result, err := h.service.GetByID(c.Request.Context(), itemID, userID.(uuid.UUID))
    if err != nil {
        if errors.Is(err, services.ErrItemNotFound) {
            response.Error(c, http.StatusNotFound, "Item not found")
            return
        }
        h.log.Error("Failed to get item", "error", err)
        response.Error(c, http.StatusInternalServerError, "Failed to get item")
        return
    }

    response.Success(c, http.StatusOK, result)
}

// Update godoc
// @Summary      Update item
// @Description  Update item by ID
// @Tags         items
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        id path string true "Item ID"
// @Param        request body dto.UpdateItemRequest true "Item details"
// @Success      200 {object} dto.ItemResponse
// @Failure      400 {object} response.ErrorResponse
// @Failure      401 {object} response.ErrorResponse
// @Failure      404 {object} response.ErrorResponse
// @Router       /items/{id} [put]
func (h *ItemHandler) Update(c *gin.Context) {
    userID, _ := c.Get(middleware.AuthUserIDKey)

    itemID, err := uuid.Parse(c.Param("id"))
    if err != nil {
        response.Error(c, http.StatusBadRequest, "Invalid item ID")
        return
    }

    var req dto.UpdateItemRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        response.ValidationError(c, err)
        return
    }

    result, err := h.service.Update(c.Request.Context(), itemID, userID.(uuid.UUID), req)
    if err != nil {
        if errors.Is(err, services.ErrItemNotFound) {
            response.Error(c, http.StatusNotFound, "Item not found")
            return
        }
        h.log.Error("Failed to update item", "error", err)
        response.Error(c, http.StatusInternalServerError, "Failed to update item")
        return
    }

    response.Success(c, http.StatusOK, result)
}

// Delete godoc
// @Summary      Delete item
// @Description  Delete item by ID
// @Tags         items
// @Security     BearerAuth
// @Produce      json
// @Param        id path string true "Item ID"
// @Success      200 {object} response.SuccessResponse
// @Failure      401 {object} response.ErrorResponse
// @Failure      404 {object} response.ErrorResponse
// @Router       /items/{id} [delete]
func (h *ItemHandler) Delete(c *gin.Context) {
    userID, _ := c.Get(middleware.AuthUserIDKey)

    itemID, err := uuid.Parse(c.Param("id"))
    if err != nil {
        response.Error(c, http.StatusBadRequest, "Invalid item ID")
        return
    }

    if err := h.service.Delete(c.Request.Context(), itemID, userID.(uuid.UUID)); err != nil {
        if errors.Is(err, services.ErrItemNotFound) {
            response.Error(c, http.StatusNotFound, "Item not found")
            return
        }
        h.log.Error("Failed to delete item", "error", err)
        response.Error(c, http.StatusInternalServerError, "Failed to delete item")
        return
    }

    response.Success(c, http.StatusOK, gin.H{"message": "Item deleted successfully"})
}
```

### pkg/jwt/jwt.go
```go
package jwt

import (
    "errors"
    "time"

    "github.com/golang-jwt/jwt/v5"
    "github.com/google/uuid"
)

type Claims struct {
    UserID    uuid.UUID `json:"user_id"`
    Email     string    `json:"email"`
    Role      string    `json:"role"`
    TokenType string    `json:"token_type"`
    jwt.RegisteredClaims
}

func GenerateToken(userID uuid.UUID, email, role, secret string, expiry time.Duration, tokenType string) (string, error) {
    claims := Claims{
        UserID:    userID,
        Email:     email,
        Role:      role,
        TokenType: tokenType,
        RegisteredClaims: jwt.RegisteredClaims{
            ExpiresAt: jwt.NewNumericDate(time.Now().Add(expiry)),
            IssuedAt:  jwt.NewNumericDate(time.Now()),
            NotBefore: jwt.NewNumericDate(time.Now()),
            Issuer:    "my-gin-api",
            Subject:   userID.String(),
            ID:        uuid.New().String(),
        },
    }

    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    return token.SignedString([]byte(secret))
}

func ValidateToken(tokenString, secret string) (*Claims, error) {
    token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
        if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
            return nil, errors.New("unexpected signing method")
        }
        return []byte(secret), nil
    })

    if err != nil {
        return nil, err
    }

    claims, ok := token.Claims.(*Claims)
    if !ok || !token.Valid {
        return nil, errors.New("invalid token")
    }

    return claims, nil
}
```

### pkg/response/response.go
```go
package response

import (
    "github.com/gin-gonic/gin"
    "github.com/go-playground/validator/v10"
)

type SuccessResponse struct {
    Success bool        `json:"success"`
    Data    interface{} `json:"data"`
}

type ErrorResponse struct {
    Success bool        `json:"success"`
    Error   ErrorDetail `json:"error"`
}

type ErrorDetail struct {
    Code    string            `json:"code"`
    Message string            `json:"message"`
    Details map[string]string `json:"details,omitempty"`
}

func Success(c *gin.Context, status int, data interface{}) {
    c.JSON(status, SuccessResponse{
        Success: true,
        Data:    data,
    })
}

func Error(c *gin.Context, status int, message string) {
    c.JSON(status, ErrorResponse{
        Success: false,
        Error: ErrorDetail{
            Code:    httpStatusToCode(status),
            Message: message,
        },
    })
}

func ValidationError(c *gin.Context, err error) {
    details := make(map[string]string)

    if validationErrors, ok := err.(validator.ValidationErrors); ok {
        for _, e := range validationErrors {
            details[e.Field()] = formatValidationError(e)
        }
    }

    c.JSON(400, ErrorResponse{
        Success: false,
        Error: ErrorDetail{
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
    case "gte":
        return "Value must be greater than or equal to " + e.Param()
    case "lte":
        return "Value must be less than or equal to " + e.Param()
    default:
        return "Invalid value"
    }
}

func httpStatusToCode(status int) string {
    codes := map[int]string{
        400: "BAD_REQUEST",
        401: "UNAUTHORIZED",
        403: "FORBIDDEN",
        404: "NOT_FOUND",
        409: "CONFLICT",
        429: "TOO_MANY_REQUESTS",
        500: "INTERNAL_ERROR",
    }
    if code, ok := codes[status]; ok {
        return code
    }
    return "UNKNOWN_ERROR"
}
```

### pkg/logger/logger.go
```go
package logger

import (
    "os"

    "go.uber.org/zap"
    "go.uber.org/zap/zapcore"
)

type Logger struct {
    *zap.SugaredLogger
}

func New(level, format string) *Logger {
    var zapLevel zapcore.Level
    switch level {
    case "debug":
        zapLevel = zapcore.DebugLevel
    case "info":
        zapLevel = zapcore.InfoLevel
    case "warn":
        zapLevel = zapcore.WarnLevel
    case "error":
        zapLevel = zapcore.ErrorLevel
    default:
        zapLevel = zapcore.InfoLevel
    }

    var encoder zapcore.Encoder
    encoderConfig := zap.NewProductionEncoderConfig()
    encoderConfig.TimeKey = "timestamp"
    encoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder

    if format == "json" {
        encoder = zapcore.NewJSONEncoder(encoderConfig)
    } else {
        encoderConfig.EncodeLevel = zapcore.CapitalColorLevelEncoder
        encoder = zapcore.NewConsoleEncoder(encoderConfig)
    }

    core := zapcore.NewCore(
        encoder,
        zapcore.AddSync(os.Stdout),
        zapLevel,
    )

    logger := zap.New(core, zap.AddCaller(), zap.AddCallerSkip(1))
    return &Logger{logger.Sugar()}
}

func (l *Logger) Info(msg string, fields ...interface{}) {
    l.SugaredLogger.Infow(msg, fields...)
}

func (l *Logger) Error(msg string, fields ...interface{}) {
    l.SugaredLogger.Errorw(msg, fields...)
}

func (l *Logger) Warn(msg string, fields ...interface{}) {
    l.SugaredLogger.Warnw(msg, fields...)
}

func (l *Logger) Debug(msg string, fields ...interface{}) {
    l.SugaredLogger.Debugw(msg, fields...)
}

func (l *Logger) Fatal(msg string, fields ...interface{}) {
    l.SugaredLogger.Fatalw(msg, fields...)
}
```

### internal/database/database.go
```go
package database

import (
    "fmt"

    "github.com/redis/go-redis/v9"
    "github.com/yourusername/my-gin-api/internal/config"
    "github.com/yourusername/my-gin-api/internal/models"
    "gorm.io/driver/postgres"
    "gorm.io/gorm"
    "gorm.io/gorm/logger"
)

func New(cfg config.DatabaseConfig) (*gorm.DB, error) {
    dsn := fmt.Sprintf(
        "host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
        cfg.Host, cfg.Port, cfg.User, cfg.Password, cfg.Name, cfg.SSLMode,
    )

    db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
        Logger: logger.Default.LogMode(logger.Info),
    })
    if err != nil {
        return nil, err
    }

    sqlDB, err := db.DB()
    if err != nil {
        return nil, err
    }

    sqlDB.SetMaxIdleConns(10)
    sqlDB.SetMaxOpenConns(100)

    return db, nil
}

func Migrate(db *gorm.DB) error {
    return db.AutoMigrate(
        &models.User{},
        &models.Item{},
    )
}

func NewRedis(cfg config.RedisConfig) *redis.Client {
    return redis.NewClient(&redis.Options{
        Addr:     fmt.Sprintf("%s:%s", cfg.Host, cfg.Port),
        Password: cfg.Password,
        DB:       0,
    })
}
```

## Docker Configuration

### Dockerfile
```dockerfile
# Build stage
FROM golang:1.22-alpine AS builder

WORKDIR /app

# Install dependencies
RUN apk add --no-cache gcc musl-dev

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source
COPY . .

# Build
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main ./cmd/api

# Runtime stage
FROM alpine:3.19

WORKDIR /app

# Install ca-certificates for HTTPS
RUN apk --no-cache add ca-certificates tzdata

# Copy binary
COPY --from=builder /app/main .

# Create non-root user
RUN adduser -D -g '' appuser
USER appuser

EXPOSE 8080

CMD ["./main"]
```

### docker-compose.yml
```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "8080:8080"
    environment:
      - PORT=8080
      - GIN_MODE=release
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_USER=postgres
      - DB_PASSWORD=postgres
      - DB_NAME=ginapi
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: ginapi
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
```

### Makefile
```makefile
.PHONY: build run test lint swagger migrate docker-up docker-down

# Build the application
build:
	go build -o bin/api ./cmd/api

# Run the application
run:
	go run ./cmd/api

# Run tests
test:
	go test -v -cover ./...

# Run tests with coverage report
test-coverage:
	go test -v -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html

# Run linter
lint:
	golangci-lint run ./...

# Generate Swagger documentation
swagger:
	swag init -g cmd/api/main.go -o docs

# Run database migrations
migrate:
	go run ./cmd/migrate

# Start Docker containers
docker-up:
	docker-compose up -d

# Stop Docker containers
docker-down:
	docker-compose down

# Build Docker image
docker-build:
	docker build -t my-gin-api .

# Clean build artifacts
clean:
	rm -rf bin/ coverage.out coverage.html
```

## Testing

### internal/handlers/auth_test.go
```go
package handlers_test

import (
    "bytes"
    "encoding/json"
    "net/http"
    "net/http/httptest"
    "testing"

    "github.com/gin-gonic/gin"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/mock"
    "github.com/yourusername/my-gin-api/internal/dto"
    "github.com/yourusername/my-gin-api/internal/handlers"
    "github.com/yourusername/my-gin-api/pkg/logger"
)

type MockAuthService struct {
    mock.Mock
}

func (m *MockAuthService) Register(ctx context.Context, req dto.RegisterRequest) (*dto.AuthResponse, error) {
    args := m.Called(ctx, req)
    if args.Get(0) == nil {
        return nil, args.Error(1)
    }
    return args.Get(0).(*dto.AuthResponse), args.Error(1)
}

func (m *MockAuthService) Login(ctx context.Context, req dto.LoginRequest) (*dto.AuthResponse, error) {
    args := m.Called(ctx, req)
    if args.Get(0) == nil {
        return nil, args.Error(1)
    }
    return args.Get(0).(*dto.AuthResponse), args.Error(1)
}

func TestAuthHandler_Register(t *testing.T) {
    gin.SetMode(gin.TestMode)

    tests := []struct {
        name           string
        body           dto.RegisterRequest
        setupMock      func(*MockAuthService)
        expectedStatus int
    }{
        {
            name: "successful registration",
            body: dto.RegisterRequest{
                Email:    "test@example.com",
                Password: "password123",
                Name:     "Test User",
            },
            setupMock: func(m *MockAuthService) {
                m.On("Register", mock.Anything, mock.AnythingOfType("dto.RegisterRequest")).
                    Return(&dto.AuthResponse{
                        AccessToken:  "access_token",
                        RefreshToken: "refresh_token",
                        ExpiresIn:    3600,
                        TokenType:    "Bearer",
                    }, nil)
            },
            expectedStatus: http.StatusCreated,
        },
        {
            name: "duplicate email",
            body: dto.RegisterRequest{
                Email:    "existing@example.com",
                Password: "password123",
                Name:     "Test User",
            },
            setupMock: func(m *MockAuthService) {
                m.On("Register", mock.Anything, mock.AnythingOfType("dto.RegisterRequest")).
                    Return(nil, services.ErrUserExists)
            },
            expectedStatus: http.StatusConflict,
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            mockService := new(MockAuthService)
            tt.setupMock(mockService)

            log := logger.New("debug", "console")
            handler := handlers.NewAuthHandler(mockService, log)

            router := gin.New()
            router.POST("/auth/register", handler.Register)

            body, _ := json.Marshal(tt.body)
            req := httptest.NewRequest(http.MethodPost, "/auth/register", bytes.NewBuffer(body))
            req.Header.Set("Content-Type", "application/json")
            rec := httptest.NewRecorder()

            router.ServeHTTP(rec, req)

            assert.Equal(t, tt.expectedStatus, rec.Code)
            mockService.AssertExpectations(t)
        })
    }
}
```

## CLAUDE.md Integration

```markdown
# Go Gin API

## Build Commands
- `go run cmd/api/main.go` - Start development server
- `go build -o bin/api ./cmd/api` - Build binary
- `go test ./...` - Run all tests
- `go test -cover ./...` - Run tests with coverage
- `swag init -g cmd/api/main.go -o docs` - Generate Swagger docs

## Architecture
- Clean architecture with handlers/services/repositories
- JWT authentication with refresh tokens
- Redis for token blacklisting and rate limiting
- GORM for PostgreSQL database access
- Zap for structured logging

## Key Patterns
- Use repository pattern for database access
- Services contain business logic
- Handlers handle HTTP concerns only
- DTOs for request/response serialization
- Middleware for cross-cutting concerns

## Error Handling
- Custom error types in internal/errors
- Validation errors return field-level details
- All errors logged with context
- Consistent JSON error responses
```

## AI Suggestions

1. **Add request tracing** - Implement OpenTelemetry for distributed tracing across services
2. **Implement caching** - Add Redis caching layer for frequently accessed data with cache invalidation
3. **Add API versioning** - Support multiple API versions with graceful deprecation
4. **Implement webhook support** - Add outbound webhooks for event notifications
5. **Add GraphQL endpoint** - Consider gqlgen for GraphQL alongside REST
6. **Implement circuit breaker** - Add resilience patterns for external service calls
7. **Add background job processing** - Integrate with asynq or machinery for async tasks
8. **Implement audit logging** - Track all data modifications with actor context
9. **Add metrics endpoint** - Expose Prometheus metrics for monitoring
10. **Implement soft delete recovery** - Add admin endpoints for recovering soft-deleted records
