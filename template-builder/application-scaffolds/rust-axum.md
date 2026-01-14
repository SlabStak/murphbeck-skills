# Rust Axum API Template

## Overview
Type-safe, high-performance REST API using Rust with Axum framework, featuring async/await, SQLx for PostgreSQL, Tower middleware ecosystem, JWT authentication, and comprehensive error handling.

## Quick Start
```bash
# Create project
cargo new my-axum-api
cd my-axum-api

# Add dependencies to Cargo.toml, then:
cargo build

# Setup database
sqlx database create
sqlx migrate run

# Run the server
cargo run
```

## Project Structure
```
my-axum-api/
├── src/
│   ├── main.rs
│   ├── lib.rs
│   ├── config.rs
│   ├── error.rs
│   ├── db/
│   │   ├── mod.rs
│   │   └── pool.rs
│   ├── models/
│   │   ├── mod.rs
│   │   ├── user.rs
│   │   └── item.rs
│   ├── handlers/
│   │   ├── mod.rs
│   │   ├── auth.rs
│   │   ├── users.rs
│   │   ├── items.rs
│   │   └── health.rs
│   ├── middleware/
│   │   ├── mod.rs
│   │   ├── auth.rs
│   │   └── logging.rs
│   ├── services/
│   │   ├── mod.rs
│   │   ├── auth.rs
│   │   ├── user.rs
│   │   └── item.rs
│   ├── dto/
│   │   ├── mod.rs
│   │   ├── auth.rs
│   │   └── item.rs
│   └── utils/
│       ├── mod.rs
│       ├── jwt.rs
│       └── password.rs
├── migrations/
│   └── 20240101000000_init.sql
├── tests/
│   ├── common/
│   │   └── mod.rs
│   └── integration_tests.rs
├── .env.example
├── Cargo.toml
├── Dockerfile
├── docker-compose.yml
└── sqlx-data.json
```

## Configuration

### Cargo.toml
```toml
[package]
name = "my-axum-api"
version = "0.1.0"
edition = "2021"

[dependencies]
# Web framework
axum = { version = "0.7", features = ["macros", "ws"] }
axum-extra = { version = "0.9", features = ["typed-header"] }
tower = { version = "0.4", features = ["full"] }
tower-http = { version = "0.5", features = ["cors", "trace", "compression-gzip", "timeout", "request-id"] }

# Async runtime
tokio = { version = "1", features = ["full"] }

# Database
sqlx = { version = "0.7", features = ["runtime-tokio", "postgres", "uuid", "chrono", "migrate"] }

# Serialization
serde = { version = "1", features = ["derive"] }
serde_json = "1"

# Validation
validator = { version = "0.18", features = ["derive"] }

# Authentication
jsonwebtoken = "9"
argon2 = "0.5"
rand = "0.8"

# Time
chrono = { version = "0.4", features = ["serde"] }

# UUID
uuid = { version = "1", features = ["v4", "serde"] }

# Configuration
dotenvy = "0.15"
config = "0.14"

# Logging
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter", "json"] }

# Error handling
thiserror = "1"
anyhow = "1"

# Utilities
once_cell = "1"
async-trait = "0.1"

[dev-dependencies]
reqwest = { version = "0.12", features = ["json"] }
tokio-test = "0.4"
```

### .env.example
```env
# Server
HOST=0.0.0.0
PORT=8080
RUST_LOG=debug

# Database
DATABASE_URL=postgres://postgres:postgres@localhost:5432/axumapi

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_ACCESS_EXPIRY_HOURS=24
JWT_REFRESH_EXPIRY_DAYS=7

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW_SECS=60
```

### src/config.rs
```rust
use config::{Config, ConfigError, Environment, File};
use serde::Deserialize;
use std::env;

#[derive(Debug, Clone, Deserialize)]
pub struct AppConfig {
    pub server: ServerConfig,
    pub database: DatabaseConfig,
    pub jwt: JwtConfig,
    pub rate_limit: RateLimitConfig,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ServerConfig {
    pub host: String,
    pub port: u16,
}

#[derive(Debug, Clone, Deserialize)]
pub struct DatabaseConfig {
    pub url: String,
    pub max_connections: u32,
    pub min_connections: u32,
}

#[derive(Debug, Clone, Deserialize)]
pub struct JwtConfig {
    pub secret: String,
    pub access_expiry_hours: i64,
    pub refresh_expiry_days: i64,
}

#[derive(Debug, Clone, Deserialize)]
pub struct RateLimitConfig {
    pub requests: u32,
    pub window_secs: u64,
}

impl AppConfig {
    pub fn load() -> Result<Self, ConfigError> {
        let run_mode = env::var("RUN_MODE").unwrap_or_else(|_| "development".into());

        let config = Config::builder()
            .add_source(File::with_name("config/default").required(false))
            .add_source(File::with_name(&format!("config/{}", run_mode)).required(false))
            .add_source(
                Environment::default()
                    .separator("__")
                    .prefix("APP")
            )
            .set_default("server.host", "0.0.0.0")?
            .set_default("server.port", 8080)?
            .set_default("database.max_connections", 10)?
            .set_default("database.min_connections", 1)?
            .set_default("jwt.access_expiry_hours", 24)?
            .set_default("jwt.refresh_expiry_days", 7)?
            .set_default("rate_limit.requests", 100)?
            .set_default("rate_limit.window_secs", 60)?
            .build()?;

        config.try_deserialize()
    }
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            server: ServerConfig {
                host: "0.0.0.0".to_string(),
                port: 8080,
            },
            database: DatabaseConfig {
                url: env::var("DATABASE_URL")
                    .unwrap_or_else(|_| "postgres://postgres:postgres@localhost:5432/axumapi".to_string()),
                max_connections: 10,
                min_connections: 1,
            },
            jwt: JwtConfig {
                secret: env::var("JWT_SECRET").unwrap_or_else(|_| "change-me".to_string()),
                access_expiry_hours: 24,
                refresh_expiry_days: 7,
            },
            rate_limit: RateLimitConfig {
                requests: 100,
                window_secs: 60,
            },
        }
    }
}
```

## Core Implementation

### src/main.rs
```rust
use axum::{
    routing::{get, post, put, delete},
    Router,
};
use std::net::SocketAddr;
use std::sync::Arc;
use tokio::signal;
use tower_http::{
    cors::{Any, CorsLayer},
    trace::TraceLayer,
    compression::CompressionLayer,
    timeout::TimeoutLayer,
    request_id::{MakeRequestUuid, PropagateRequestIdLayer, SetRequestIdLayer},
};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod config;
mod db;
mod dto;
mod error;
mod handlers;
mod middleware;
mod models;
mod services;
mod utils;

use crate::config::AppConfig;
use crate::db::pool::create_pool;
use crate::handlers::{auth, health, items, users};
use crate::middleware::auth::auth_middleware;
use crate::services::{AuthService, ItemService, UserService};

#[derive(Clone)]
pub struct AppState {
    pub db: sqlx::PgPool,
    pub config: Arc<AppConfig>,
    pub auth_service: Arc<AuthService>,
    pub user_service: Arc<UserService>,
    pub item_service: Arc<ItemService>,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Load environment variables
    dotenvy::dotenv().ok();

    // Initialize tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "my_axum_api=debug,tower_http=debug,axum=trace".into()),
        )
        .with(tracing_subscriber::fmt::layer().json())
        .init();

    // Load configuration
    let config = AppConfig::load().unwrap_or_default();
    let config = Arc::new(config);

    // Create database pool
    let db = create_pool(&config.database).await?;

    // Run migrations
    sqlx::migrate!("./migrations").run(&db).await?;

    // Initialize services
    let user_service = Arc::new(UserService::new(db.clone()));
    let auth_service = Arc::new(AuthService::new(
        user_service.clone(),
        config.jwt.clone(),
    ));
    let item_service = Arc::new(ItemService::new(db.clone()));

    // Create app state
    let state = AppState {
        db,
        config: config.clone(),
        auth_service,
        user_service,
        item_service,
    };

    // Build router
    let app = create_router(state);

    // Start server
    let addr = SocketAddr::from(([0, 0, 0, 0], config.server.port));
    tracing::info!("Starting server on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await?;

    tracing::info!("Server shutdown complete");
    Ok(())
}

fn create_router(state: AppState) -> Router {
    // Public routes
    let public_routes = Router::new()
        .route("/auth/register", post(auth::register))
        .route("/auth/login", post(auth::login))
        .route("/auth/refresh", post(auth::refresh_token));

    // Protected routes
    let protected_routes = Router::new()
        .route("/auth/logout", post(auth::logout))
        .route("/users/me", get(users::get_current_user))
        .route("/users/me", put(users::update_current_user))
        .route("/users/me", delete(users::delete_current_user))
        .route("/users/me/password", put(users::change_password))
        .route("/items", get(items::list))
        .route("/items", post(items::create))
        .route("/items/:id", get(items::get_by_id))
        .route("/items/:id", put(items::update))
        .route("/items/:id", delete(items::delete))
        .layer(axum::middleware::from_fn_with_state(
            state.clone(),
            auth_middleware,
        ));

    // Admin routes
    let admin_routes = Router::new()
        .route("/admin/users", get(users::list_users))
        .route("/admin/users/:id", get(users::get_user))
        .route("/admin/users/:id", put(users::update_user))
        .route("/admin/users/:id", delete(users::delete_user))
        .layer(axum::middleware::from_fn_with_state(
            state.clone(),
            middleware::auth::require_admin,
        ))
        .layer(axum::middleware::from_fn_with_state(
            state.clone(),
            auth_middleware,
        ));

    // Health routes
    let health_routes = Router::new()
        .route("/health", get(health::health_check))
        .route("/health/ready", get(health::readiness))
        .route("/health/live", get(health::liveness));

    // Combine all routes
    let api_routes = Router::new()
        .merge(public_routes)
        .merge(protected_routes)
        .merge(admin_routes);

    Router::new()
        .nest("/api/v1", api_routes)
        .merge(health_routes)
        .with_state(state)
        .layer(
            CorsLayer::new()
                .allow_origin(Any)
                .allow_methods(Any)
                .allow_headers(Any),
        )
        .layer(CompressionLayer::new())
        .layer(TimeoutLayer::new(std::time::Duration::from_secs(30)))
        .layer(SetRequestIdLayer::new(MakeRequestUuid))
        .layer(PropagateRequestIdLayer::x_request_id())
        .layer(TraceLayer::new_for_http())
}

async fn shutdown_signal() {
    let ctrl_c = async {
        signal::ctrl_c()
            .await
            .expect("failed to install Ctrl+C handler");
    };

    #[cfg(unix)]
    let terminate = async {
        signal::unix::signal(signal::unix::SignalKind::terminate())
            .expect("failed to install signal handler")
            .recv()
            .await;
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => {},
        _ = terminate => {},
    }

    tracing::info!("Shutdown signal received");
}
```

### src/error.rs
```rust
use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Bad request: {0}")]
    BadRequest(String),

    #[error("Unauthorized: {0}")]
    Unauthorized(String),

    #[error("Forbidden: {0}")]
    Forbidden(String),

    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Conflict: {0}")]
    Conflict(String),

    #[error("Validation error: {0}")]
    Validation(String),

    #[error("Internal server error")]
    Internal(#[from] anyhow::Error),

    #[error("Database error")]
    Database(#[from] sqlx::Error),

    #[error("JWT error")]
    Jwt(#[from] jsonwebtoken::errors::Error),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, code, message) = match &self {
            AppError::BadRequest(msg) => (StatusCode::BAD_REQUEST, "BAD_REQUEST", msg.clone()),
            AppError::Unauthorized(msg) => (StatusCode::UNAUTHORIZED, "UNAUTHORIZED", msg.clone()),
            AppError::Forbidden(msg) => (StatusCode::FORBIDDEN, "FORBIDDEN", msg.clone()),
            AppError::NotFound(msg) => (StatusCode::NOT_FOUND, "NOT_FOUND", msg.clone()),
            AppError::Conflict(msg) => (StatusCode::CONFLICT, "CONFLICT", msg.clone()),
            AppError::Validation(msg) => (StatusCode::BAD_REQUEST, "VALIDATION_ERROR", msg.clone()),
            AppError::Internal(err) => {
                tracing::error!("Internal error: {:?}", err);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "INTERNAL_ERROR",
                    "An internal error occurred".to_string(),
                )
            }
            AppError::Database(err) => {
                tracing::error!("Database error: {:?}", err);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "DATABASE_ERROR",
                    "A database error occurred".to_string(),
                )
            }
            AppError::Jwt(err) => {
                tracing::error!("JWT error: {:?}", err);
                (
                    StatusCode::UNAUTHORIZED,
                    "JWT_ERROR",
                    "Invalid token".to_string(),
                )
            }
        };

        let body = Json(json!({
            "success": false,
            "error": {
                "code": code,
                "message": message
            }
        }));

        (status, body).into_response()
    }
}

pub type AppResult<T> = Result<T, AppError>;
```

### src/models/user.rs
```rust
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, sqlx::Type)]
#[sqlx(type_name = "user_role", rename_all = "lowercase")]
pub enum UserRole {
    User,
    Admin,
}

impl Default for UserRole {
    fn default() -> Self {
        Self::User
    }
}

#[derive(Debug, Clone, Serialize, FromRow)]
pub struct User {
    pub id: Uuid,
    pub email: String,
    #[serde(skip_serializing)]
    pub password_hash: String,
    pub name: String,
    pub role: UserRole,
    pub active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize)]
pub struct UserResponse {
    pub id: Uuid,
    pub email: String,
    pub name: String,
    pub role: UserRole,
    pub active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl From<User> for UserResponse {
    fn from(user: User) -> Self {
        Self {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            active: user.active,
            created_at: user.created_at,
            updated_at: user.updated_at,
        }
    }
}
```

### src/models/item.rs
```rust
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, sqlx::Type)]
#[sqlx(type_name = "item_status", rename_all = "lowercase")]
pub enum ItemStatus {
    Draft,
    Published,
    Archived,
}

impl Default for ItemStatus {
    fn default() -> Self {
        Self::Draft
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Item {
    pub id: Uuid,
    pub user_id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub status: ItemStatus,
    pub price: f64,
    pub metadata: Option<serde_json::Value>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Deserialize, Default)]
pub struct ItemFilter {
    pub status: Option<ItemStatus>,
    pub min_price: Option<f64>,
    pub max_price: Option<f64>,
    pub search: Option<String>,
    pub page: Option<i64>,
    pub limit: Option<i64>,
    pub sort_by: Option<String>,
    pub sort_dir: Option<String>,
}

impl ItemFilter {
    pub fn page(&self) -> i64 {
        self.page.unwrap_or(1).max(1)
    }

    pub fn limit(&self) -> i64 {
        self.limit.unwrap_or(20).clamp(1, 100)
    }

    pub fn offset(&self) -> i64 {
        (self.page() - 1) * self.limit()
    }

    pub fn sort_by(&self) -> &str {
        self.sort_by.as_deref().unwrap_or("created_at")
    }

    pub fn sort_dir(&self) -> &str {
        match self.sort_dir.as_deref() {
            Some("asc") => "ASC",
            _ => "DESC",
        }
    }
}
```

### src/dto/auth.rs
```rust
use serde::{Deserialize, Serialize};
use validator::Validate;

#[derive(Debug, Deserialize, Validate)]
pub struct RegisterRequest {
    #[validate(email(message = "Invalid email format"))]
    pub email: String,

    #[validate(length(min = 8, message = "Password must be at least 8 characters"))]
    pub password: String,

    #[validate(length(min = 2, message = "Name must be at least 2 characters"))]
    pub name: String,
}

#[derive(Debug, Deserialize, Validate)]
pub struct LoginRequest {
    #[validate(email(message = "Invalid email format"))]
    pub email: String,

    #[validate(length(min = 1, message = "Password is required"))]
    pub password: String,
}

#[derive(Debug, Deserialize, Validate)]
pub struct RefreshRequest {
    #[validate(length(min = 1, message = "Refresh token is required"))]
    pub refresh_token: String,
}

#[derive(Debug, Deserialize, Validate)]
pub struct ChangePasswordRequest {
    #[validate(length(min = 1, message = "Current password is required"))]
    pub current_password: String,

    #[validate(length(min = 8, message = "New password must be at least 8 characters"))]
    pub new_password: String,
}

#[derive(Debug, Serialize)]
pub struct AuthResponse {
    pub access_token: String,
    pub refresh_token: String,
    pub expires_in: i64,
    pub token_type: String,
    pub user: UserResponse,
}

#[derive(Debug, Serialize)]
pub struct UserResponse {
    pub id: String,
    pub email: String,
    pub name: String,
    pub role: String,
}
```

### src/services/auth.rs
```rust
use std::sync::Arc;
use uuid::Uuid;

use crate::config::JwtConfig;
use crate::dto::auth::{AuthResponse, LoginRequest, RegisterRequest, UserResponse};
use crate::error::{AppError, AppResult};
use crate::models::user::{User, UserRole};
use crate::services::UserService;
use crate::utils::{jwt, password};

pub struct AuthService {
    user_service: Arc<UserService>,
    jwt_config: JwtConfig,
}

impl AuthService {
    pub fn new(user_service: Arc<UserService>, jwt_config: JwtConfig) -> Self {
        Self {
            user_service,
            jwt_config,
        }
    }

    pub async fn register(&self, req: RegisterRequest) -> AppResult<AuthResponse> {
        // Check if user exists
        if self.user_service.exists_by_email(&req.email).await? {
            return Err(AppError::Conflict("User already exists".to_string()));
        }

        // Hash password
        let password_hash = password::hash(&req.password)
            .map_err(|e| AppError::Internal(e.into()))?;

        // Create user
        let user = self
            .user_service
            .create(&req.email, &password_hash, &req.name, UserRole::User)
            .await?;

        self.generate_auth_response(&user)
    }

    pub async fn login(&self, req: LoginRequest) -> AppResult<AuthResponse> {
        let user = self
            .user_service
            .get_by_email(&req.email)
            .await?
            .ok_or_else(|| AppError::Unauthorized("Invalid credentials".to_string()))?;

        if !user.active {
            return Err(AppError::Unauthorized("Account is disabled".to_string()));
        }

        if !password::verify(&req.password, &user.password_hash)
            .map_err(|e| AppError::Internal(e.into()))?
        {
            return Err(AppError::Unauthorized("Invalid credentials".to_string()));
        }

        self.generate_auth_response(&user)
    }

    pub async fn refresh_token(&self, refresh_token: &str) -> AppResult<AuthResponse> {
        let claims = jwt::validate_token(refresh_token, &self.jwt_config.secret)?;

        if claims.token_type != "refresh" {
            return Err(AppError::Unauthorized("Invalid token type".to_string()));
        }

        let user = self
            .user_service
            .get_by_id(claims.user_id)
            .await?
            .ok_or_else(|| AppError::NotFound("User not found".to_string()))?;

        self.generate_auth_response(&user)
    }

    pub async fn logout(&self, _user_id: Uuid, _token: &str) -> AppResult<()> {
        // In a production system, you would blacklist the token here
        // using Redis or a database table
        Ok(())
    }

    pub fn validate_access_token(&self, token: &str) -> AppResult<jwt::Claims> {
        let claims = jwt::validate_token(token, &self.jwt_config.secret)?;

        if claims.token_type != "access" {
            return Err(AppError::Unauthorized("Invalid token type".to_string()));
        }

        Ok(claims)
    }

    fn generate_auth_response(&self, user: &User) -> AppResult<AuthResponse> {
        let access_token = jwt::generate_token(
            user.id,
            &user.email,
            &format!("{:?}", user.role).to_lowercase(),
            &self.jwt_config.secret,
            chrono::Duration::hours(self.jwt_config.access_expiry_hours),
            "access",
        )?;

        let refresh_token = jwt::generate_token(
            user.id,
            &user.email,
            &format!("{:?}", user.role).to_lowercase(),
            &self.jwt_config.secret,
            chrono::Duration::days(self.jwt_config.refresh_expiry_days),
            "refresh",
        )?;

        Ok(AuthResponse {
            access_token,
            refresh_token,
            expires_in: self.jwt_config.access_expiry_hours * 3600,
            token_type: "Bearer".to_string(),
            user: UserResponse {
                id: user.id.to_string(),
                email: user.email.clone(),
                name: user.name.clone(),
                role: format!("{:?}", user.role).to_lowercase(),
            },
        })
    }
}
```

### src/services/user.rs
```rust
use sqlx::PgPool;
use uuid::Uuid;

use crate::error::AppResult;
use crate::models::user::{User, UserRole};

pub struct UserService {
    db: PgPool,
}

impl UserService {
    pub fn new(db: PgPool) -> Self {
        Self { db }
    }

    pub async fn create(
        &self,
        email: &str,
        password_hash: &str,
        name: &str,
        role: UserRole,
    ) -> AppResult<User> {
        let user = sqlx::query_as!(
            User,
            r#"
            INSERT INTO users (email, password_hash, name, role)
            VALUES ($1, $2, $3, $4)
            RETURNING id, email, password_hash, name, role as "role: UserRole",
                      active, created_at, updated_at, deleted_at
            "#,
            email,
            password_hash,
            name,
            role as UserRole
        )
        .fetch_one(&self.db)
        .await?;

        Ok(user)
    }

    pub async fn get_by_id(&self, id: Uuid) -> AppResult<Option<User>> {
        let user = sqlx::query_as!(
            User,
            r#"
            SELECT id, email, password_hash, name, role as "role: UserRole",
                   active, created_at, updated_at, deleted_at
            FROM users
            WHERE id = $1 AND deleted_at IS NULL
            "#,
            id
        )
        .fetch_optional(&self.db)
        .await?;

        Ok(user)
    }

    pub async fn get_by_email(&self, email: &str) -> AppResult<Option<User>> {
        let user = sqlx::query_as!(
            User,
            r#"
            SELECT id, email, password_hash, name, role as "role: UserRole",
                   active, created_at, updated_at, deleted_at
            FROM users
            WHERE email = $1 AND deleted_at IS NULL
            "#,
            email
        )
        .fetch_optional(&self.db)
        .await?;

        Ok(user)
    }

    pub async fn update(&self, id: Uuid, name: Option<&str>, active: Option<bool>) -> AppResult<User> {
        let user = sqlx::query_as!(
            User,
            r#"
            UPDATE users
            SET name = COALESCE($2, name),
                active = COALESCE($3, active),
                updated_at = NOW()
            WHERE id = $1 AND deleted_at IS NULL
            RETURNING id, email, password_hash, name, role as "role: UserRole",
                      active, created_at, updated_at, deleted_at
            "#,
            id,
            name,
            active
        )
        .fetch_one(&self.db)
        .await?;

        Ok(user)
    }

    pub async fn update_password(&self, id: Uuid, password_hash: &str) -> AppResult<()> {
        sqlx::query!(
            r#"
            UPDATE users
            SET password_hash = $2, updated_at = NOW()
            WHERE id = $1 AND deleted_at IS NULL
            "#,
            id,
            password_hash
        )
        .execute(&self.db)
        .await?;

        Ok(())
    }

    pub async fn delete(&self, id: Uuid) -> AppResult<()> {
        sqlx::query!(
            r#"
            UPDATE users SET deleted_at = NOW() WHERE id = $1
            "#,
            id
        )
        .execute(&self.db)
        .await?;

        Ok(())
    }

    pub async fn list(&self, page: i64, limit: i64) -> AppResult<(Vec<User>, i64)> {
        let offset = (page - 1) * limit;

        let total = sqlx::query_scalar!(
            r#"SELECT COUNT(*) as "count!" FROM users WHERE deleted_at IS NULL"#
        )
        .fetch_one(&self.db)
        .await?;

        let users = sqlx::query_as!(
            User,
            r#"
            SELECT id, email, password_hash, name, role as "role: UserRole",
                   active, created_at, updated_at, deleted_at
            FROM users
            WHERE deleted_at IS NULL
            ORDER BY created_at DESC
            LIMIT $1 OFFSET $2
            "#,
            limit,
            offset
        )
        .fetch_all(&self.db)
        .await?;

        Ok((users, total))
    }

    pub async fn exists_by_email(&self, email: &str) -> AppResult<bool> {
        let exists = sqlx::query_scalar!(
            r#"SELECT EXISTS(SELECT 1 FROM users WHERE email = $1 AND deleted_at IS NULL) as "exists!""#,
            email
        )
        .fetch_one(&self.db)
        .await?;

        Ok(exists)
    }
}
```

### src/services/item.rs
```rust
use sqlx::PgPool;
use uuid::Uuid;

use crate::dto::item::{CreateItemRequest, UpdateItemRequest};
use crate::error::AppResult;
use crate::models::item::{Item, ItemFilter, ItemStatus};

pub struct ItemService {
    db: PgPool,
}

impl ItemService {
    pub fn new(db: PgPool) -> Self {
        Self { db }
    }

    pub async fn create(&self, user_id: Uuid, req: CreateItemRequest) -> AppResult<Item> {
        let status = req.status.unwrap_or(ItemStatus::Draft);

        let item = sqlx::query_as!(
            Item,
            r#"
            INSERT INTO items (user_id, title, description, status, price, metadata)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, user_id, title, description, status as "status: ItemStatus",
                      price, metadata, created_at, updated_at, deleted_at
            "#,
            user_id,
            req.title,
            req.description,
            status as ItemStatus,
            req.price.unwrap_or(0.0),
            req.metadata
        )
        .fetch_one(&self.db)
        .await?;

        Ok(item)
    }

    pub async fn get_by_id(&self, id: Uuid, user_id: Uuid) -> AppResult<Option<Item>> {
        let item = sqlx::query_as!(
            Item,
            r#"
            SELECT id, user_id, title, description, status as "status: ItemStatus",
                   price, metadata, created_at, updated_at, deleted_at
            FROM items
            WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
            "#,
            id,
            user_id
        )
        .fetch_optional(&self.db)
        .await?;

        Ok(item)
    }

    pub async fn update(&self, id: Uuid, user_id: Uuid, req: UpdateItemRequest) -> AppResult<Item> {
        let item = sqlx::query_as!(
            Item,
            r#"
            UPDATE items
            SET title = COALESCE($3, title),
                description = COALESCE($4, description),
                status = COALESCE($5, status),
                price = COALESCE($6, price),
                metadata = COALESCE($7, metadata),
                updated_at = NOW()
            WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
            RETURNING id, user_id, title, description, status as "status: ItemStatus",
                      price, metadata, created_at, updated_at, deleted_at
            "#,
            id,
            user_id,
            req.title,
            req.description,
            req.status as Option<ItemStatus>,
            req.price,
            req.metadata
        )
        .fetch_one(&self.db)
        .await?;

        Ok(item)
    }

    pub async fn delete(&self, id: Uuid, user_id: Uuid) -> AppResult<()> {
        sqlx::query!(
            r#"
            UPDATE items SET deleted_at = NOW()
            WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
            "#,
            id,
            user_id
        )
        .execute(&self.db)
        .await?;

        Ok(())
    }

    pub async fn list(&self, user_id: Uuid, filter: ItemFilter) -> AppResult<(Vec<Item>, i64)> {
        // Build dynamic query based on filters
        let mut conditions = vec!["user_id = $1", "deleted_at IS NULL"];
        let mut params: Vec<String> = vec![];

        if filter.status.is_some() {
            params.push(format!("status = '{:?}'", filter.status.as_ref().unwrap()).to_lowercase());
        }
        if let Some(min_price) = filter.min_price {
            params.push(format!("price >= {}", min_price));
        }
        if let Some(max_price) = filter.max_price {
            params.push(format!("price <= {}", max_price));
        }
        if let Some(ref search) = filter.search {
            params.push(format!("(title ILIKE '%{}%' OR description ILIKE '%{}%')", search, search));
        }

        conditions.extend(params.iter().map(|s| s.as_str()));

        let where_clause = conditions.join(" AND ");

        let count_query = format!(
            "SELECT COUNT(*) as count FROM items WHERE {}",
            where_clause
        );

        let total: i64 = sqlx::query_scalar(&count_query)
            .bind(user_id)
            .fetch_one(&self.db)
            .await?;

        let query = format!(
            r#"
            SELECT id, user_id, title, description, status as "status: ItemStatus",
                   price, metadata, created_at, updated_at, deleted_at
            FROM items
            WHERE {}
            ORDER BY {} {}
            LIMIT {} OFFSET {}
            "#,
            where_clause,
            filter.sort_by(),
            filter.sort_dir(),
            filter.limit(),
            filter.offset()
        );

        let items = sqlx::query_as::<_, Item>(&query)
            .bind(user_id)
            .fetch_all(&self.db)
            .await?;

        Ok((items, total))
    }
}
```

### src/handlers/auth.rs
```rust
use axum::{extract::State, Json};
use validator::Validate;

use crate::dto::auth::{AuthResponse, LoginRequest, RefreshRequest, RegisterRequest};
use crate::error::{AppError, AppResult};
use crate::middleware::auth::AuthUser;
use crate::AppState;

pub async fn register(
    State(state): State<AppState>,
    Json(req): Json<RegisterRequest>,
) -> AppResult<Json<AuthResponse>> {
    req.validate().map_err(|e| AppError::Validation(e.to_string()))?;

    let response = state.auth_service.register(req).await?;
    Ok(Json(response))
}

pub async fn login(
    State(state): State<AppState>,
    Json(req): Json<LoginRequest>,
) -> AppResult<Json<AuthResponse>> {
    req.validate().map_err(|e| AppError::Validation(e.to_string()))?;

    let response = state.auth_service.login(req).await?;
    Ok(Json(response))
}

pub async fn refresh_token(
    State(state): State<AppState>,
    Json(req): Json<RefreshRequest>,
) -> AppResult<Json<AuthResponse>> {
    req.validate().map_err(|e| AppError::Validation(e.to_string()))?;

    let response = state.auth_service.refresh_token(&req.refresh_token).await?;
    Ok(Json(response))
}

pub async fn logout(
    State(state): State<AppState>,
    auth_user: AuthUser,
) -> AppResult<Json<serde_json::Value>> {
    state.auth_service.logout(auth_user.id, "").await?;
    Ok(Json(serde_json::json!({
        "success": true,
        "message": "Logged out successfully"
    })))
}
```

### src/handlers/items.rs
```rust
use axum::{
    extract::{Path, Query, State},
    Json,
};
use uuid::Uuid;
use validator::Validate;

use crate::dto::item::{CreateItemRequest, ItemListResponse, UpdateItemRequest};
use crate::error::{AppError, AppResult};
use crate::middleware::auth::AuthUser;
use crate::models::item::{Item, ItemFilter};
use crate::AppState;

pub async fn list(
    State(state): State<AppState>,
    auth_user: AuthUser,
    Query(filter): Query<ItemFilter>,
) -> AppResult<Json<ItemListResponse>> {
    let (items, total) = state.item_service.list(auth_user.id, filter.clone()).await?;

    let total_pages = (total as f64 / filter.limit() as f64).ceil() as i64;

    Ok(Json(ItemListResponse {
        items,
        total,
        page: filter.page(),
        page_size: filter.limit(),
        total_pages,
    }))
}

pub async fn create(
    State(state): State<AppState>,
    auth_user: AuthUser,
    Json(req): Json<CreateItemRequest>,
) -> AppResult<Json<Item>> {
    req.validate().map_err(|e| AppError::Validation(e.to_string()))?;

    let item = state.item_service.create(auth_user.id, req).await?;
    Ok(Json(item))
}

pub async fn get_by_id(
    State(state): State<AppState>,
    auth_user: AuthUser,
    Path(id): Path<Uuid>,
) -> AppResult<Json<Item>> {
    let item = state
        .item_service
        .get_by_id(id, auth_user.id)
        .await?
        .ok_or_else(|| AppError::NotFound("Item not found".to_string()))?;

    Ok(Json(item))
}

pub async fn update(
    State(state): State<AppState>,
    auth_user: AuthUser,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdateItemRequest>,
) -> AppResult<Json<Item>> {
    let item = state.item_service.update(id, auth_user.id, req).await?;
    Ok(Json(item))
}

pub async fn delete(
    State(state): State<AppState>,
    auth_user: AuthUser,
    Path(id): Path<Uuid>,
) -> AppResult<Json<serde_json::Value>> {
    state.item_service.delete(id, auth_user.id).await?;
    Ok(Json(serde_json::json!({
        "success": true,
        "message": "Item deleted successfully"
    })))
}
```

### src/middleware/auth.rs
```rust
use axum::{
    body::Body,
    extract::{Request, State},
    http::header::AUTHORIZATION,
    middleware::Next,
    response::Response,
};
use uuid::Uuid;

use crate::error::{AppError, AppResult};
use crate::models::user::UserRole;
use crate::AppState;

#[derive(Clone, Debug)]
pub struct AuthUser {
    pub id: Uuid,
    pub email: String,
    pub role: String,
}

impl axum::extract::FromRequestParts<AppState> for AuthUser {
    type Rejection = AppError;

    async fn from_request_parts(
        parts: &mut axum::http::request::Parts,
        _state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        parts
            .extensions
            .get::<AuthUser>()
            .cloned()
            .ok_or_else(|| AppError::Unauthorized("Not authenticated".to_string()))
    }
}

pub async fn auth_middleware(
    State(state): State<AppState>,
    mut request: Request<Body>,
    next: Next,
) -> AppResult<Response> {
    let auth_header = request
        .headers()
        .get(AUTHORIZATION)
        .and_then(|h| h.to_str().ok())
        .ok_or_else(|| AppError::Unauthorized("Authorization header required".to_string()))?;

    let token = auth_header
        .strip_prefix("Bearer ")
        .ok_or_else(|| AppError::Unauthorized("Invalid authorization header format".to_string()))?;

    let claims = state.auth_service.validate_access_token(token)?;

    let auth_user = AuthUser {
        id: claims.user_id,
        email: claims.email,
        role: claims.role,
    };

    request.extensions_mut().insert(auth_user);

    Ok(next.run(request).await)
}

pub async fn require_admin(
    State(_state): State<AppState>,
    request: Request<Body>,
    next: Next,
) -> AppResult<Response> {
    let auth_user = request
        .extensions()
        .get::<AuthUser>()
        .ok_or_else(|| AppError::Unauthorized("Not authenticated".to_string()))?;

    if auth_user.role != "admin" {
        return Err(AppError::Forbidden("Admin access required".to_string()));
    }

    Ok(next.run(request).await)
}
```

### src/utils/jwt.rs
```rust
use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::error::AppResult;

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub user_id: Uuid,
    pub email: String,
    pub role: String,
    pub token_type: String,
    pub exp: i64,
    pub iat: i64,
    pub jti: String,
}

pub fn generate_token(
    user_id: Uuid,
    email: &str,
    role: &str,
    secret: &str,
    expiry: Duration,
    token_type: &str,
) -> AppResult<String> {
    let now = Utc::now();
    let exp = (now + expiry).timestamp();
    let iat = now.timestamp();

    let claims = Claims {
        sub: user_id.to_string(),
        user_id,
        email: email.to_string(),
        role: role.to_string(),
        token_type: token_type.to_string(),
        exp,
        iat,
        jti: Uuid::new_v4().to_string(),
    };

    let token = encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )?;

    Ok(token)
}

pub fn validate_token(token: &str, secret: &str) -> AppResult<Claims> {
    let claims = decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &Validation::default(),
    )?
    .claims;

    Ok(claims)
}
```

### src/utils/password.rs
```rust
use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};

pub fn hash(password: &str) -> Result<String, argon2::password_hash::Error> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();

    let hash = argon2
        .hash_password(password.as_bytes(), &salt)?
        .to_string();

    Ok(hash)
}

pub fn verify(password: &str, hash: &str) -> Result<bool, argon2::password_hash::Error> {
    let parsed_hash = PasswordHash::new(hash)?;
    let result = Argon2::default().verify_password(password.as_bytes(), &parsed_hash);

    Ok(result.is_ok())
}
```

### migrations/20240101000000_init.sql
```sql
-- Create custom types
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE item_status AS ENUM ('draft', 'published', 'archived');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'user',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Items table
CREATE TABLE items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status item_status DEFAULT 'draft',
    price DECIMAL(10, 2) DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_deleted_at ON users(deleted_at);
CREATE INDEX idx_items_user_id ON items(user_id);
CREATE INDEX idx_items_status ON items(status);
CREATE INDEX idx_items_deleted_at ON items(deleted_at);
```

## Docker Configuration

### Dockerfile
```dockerfile
# Build stage
FROM rust:1.75-alpine AS builder

WORKDIR /app

RUN apk add --no-cache musl-dev openssl-dev

COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
RUN rm -rf src

COPY . .
RUN touch src/main.rs
RUN cargo build --release

# Runtime stage
FROM alpine:3.19

WORKDIR /app

RUN apk --no-cache add ca-certificates libgcc

COPY --from=builder /app/target/release/my-axum-api .
COPY --from=builder /app/migrations ./migrations

RUN adduser -D -g '' appuser
USER appuser

EXPOSE 8080

CMD ["./my-axum-api"]
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
      - DATABASE_URL=postgres://postgres:postgres@postgres:5432/axumapi
      - JWT_SECRET=${JWT_SECRET}
      - RUST_LOG=info
    depends_on:
      postgres:
        condition: service_healthy

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: axumapi
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

## CLAUDE.md Integration

```markdown
# Rust Axum API

## Build Commands
- `cargo run` - Start development server
- `cargo build --release` - Build optimized binary
- `cargo test` - Run all tests
- `sqlx migrate run` - Run database migrations

## Architecture
- Axum for type-safe async HTTP handling
- SQLx for compile-time verified SQL queries
- Tower middleware ecosystem
- Argon2 for password hashing

## Key Patterns
- Use `AppResult<T>` for consistent error handling
- Extract state with `State<AppState>`
- Use typed extractors (Path, Query, Json)
- Middleware via tower layers

## Database
- Enable `sqlx-cli` for migrations
- Use `query_as!` for compile-time checked queries
- Custom enum types map to PostgreSQL enums
```

## AI Suggestions

1. **Add OpenAPI generation** - Use utoipa for automatic OpenAPI spec generation
2. **Implement connection pooling tuning** - Configure SQLx pool based on load patterns
3. **Add request coalescing** - Deduplicate identical concurrent database queries
4. **Implement graceful degradation** - Add circuit breakers for external services
5. **Add distributed tracing** - Integrate OpenTelemetry with Jaeger
6. **Implement batch operations** - Support bulk create/update with transactions
7. **Add response caching** - Implement ETag and conditional requests
8. **Implement WebSocket support** - Add real-time features with axum-extra
9. **Add metrics endpoint** - Expose Prometheus metrics via axum-prometheus
10. **Implement rate limiting** - Add tower-governor for request rate limiting
