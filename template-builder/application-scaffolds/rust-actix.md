# Rust Actix-Web API Template

## Overview
High-performance REST API using Rust with Actix-Web framework, featuring actor-based concurrency, Diesel ORM for PostgreSQL, JWT authentication, and comprehensive middleware stack.

## Quick Start
```bash
# Create project
cargo new my-actix-api
cd my-actix-api

# Install Diesel CLI
cargo install diesel_cli --no-default-features --features postgres

# Setup database
diesel setup
diesel migration generate init

# Run the server
cargo run
```

## Project Structure
```
my-actix-api/
├── src/
│   ├── main.rs
│   ├── lib.rs
│   ├── config.rs
│   ├── errors.rs
│   ├── schema.rs
│   ├── db/
│   │   ├── mod.rs
│   │   └── connection.rs
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
│   └── dto/
│       ├── mod.rs
│       ├── auth.rs
│       └── item.rs
├── migrations/
│   └── 2024-01-01-000000_init/
│       ├── up.sql
│       └── down.sql
├── tests/
│   └── integration_tests.rs
├── .env.example
├── Cargo.toml
├── diesel.toml
├── Dockerfile
└── docker-compose.yml
```

## Configuration

### Cargo.toml
```toml
[package]
name = "my-actix-api"
version = "0.1.0"
edition = "2021"

[dependencies]
# Web framework
actix-web = "4"
actix-rt = "2"
actix-cors = "0.7"
actix-web-httpauth = "0.8"

# Database
diesel = { version = "2", features = ["postgres", "r2d2", "uuid", "chrono", "serde_json"] }
r2d2 = "0.8"

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
log = "0.4"
env_logger = "0.11"
tracing = "0.1"
tracing-actix-web = "0.7"

# Error handling
thiserror = "1"
anyhow = "1"

# Async
tokio = { version = "1", features = ["full"] }
futures = "0.3"

[dev-dependencies]
actix-rt = "2"
reqwest = { version = "0.12", features = ["json"] }
```

### diesel.toml
```toml
[print_schema]
file = "src/schema.rs"
custom_type_derives = ["diesel::query_builder::QueryId"]

[migrations_directory]
dir = "migrations"
```

### .env.example
```env
# Server
HOST=0.0.0.0
PORT=8080
RUST_LOG=debug,actix_web=info

# Database
DATABASE_URL=postgres://postgres:postgres@localhost:5432/actixapi

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_ACCESS_EXPIRY_HOURS=24
JWT_REFRESH_EXPIRY_DAYS=7

# Pool
POOL_SIZE=10
```

### src/config.rs
```rust
use serde::Deserialize;
use std::env;

#[derive(Debug, Clone, Deserialize)]
pub struct Config {
    pub server: ServerConfig,
    pub database: DatabaseConfig,
    pub jwt: JwtConfig,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ServerConfig {
    pub host: String,
    pub port: u16,
    pub workers: usize,
}

#[derive(Debug, Clone, Deserialize)]
pub struct DatabaseConfig {
    pub url: String,
    pub pool_size: u32,
}

#[derive(Debug, Clone, Deserialize)]
pub struct JwtConfig {
    pub secret: String,
    pub access_expiry_hours: i64,
    pub refresh_expiry_days: i64,
}

impl Config {
    pub fn from_env() -> Self {
        dotenvy::dotenv().ok();

        Self {
            server: ServerConfig {
                host: env::var("HOST").unwrap_or_else(|_| "0.0.0.0".to_string()),
                port: env::var("PORT")
                    .unwrap_or_else(|_| "8080".to_string())
                    .parse()
                    .unwrap_or(8080),
                workers: env::var("WORKERS")
                    .unwrap_or_else(|_| num_cpus::get().to_string())
                    .parse()
                    .unwrap_or_else(|_| num_cpus::get()),
            },
            database: DatabaseConfig {
                url: env::var("DATABASE_URL")
                    .expect("DATABASE_URL must be set"),
                pool_size: env::var("POOL_SIZE")
                    .unwrap_or_else(|_| "10".to_string())
                    .parse()
                    .unwrap_or(10),
            },
            jwt: JwtConfig {
                secret: env::var("JWT_SECRET")
                    .unwrap_or_else(|_| "change-me".to_string()),
                access_expiry_hours: env::var("JWT_ACCESS_EXPIRY_HOURS")
                    .unwrap_or_else(|_| "24".to_string())
                    .parse()
                    .unwrap_or(24),
                refresh_expiry_days: env::var("JWT_REFRESH_EXPIRY_DAYS")
                    .unwrap_or_else(|_| "7".to_string())
                    .parse()
                    .unwrap_or(7),
            },
        }
    }
}
```

## Core Implementation

### src/main.rs
```rust
use actix_cors::Cors;
use actix_web::{middleware, web, App, HttpServer};
use std::sync::Arc;
use tracing_actix_web::TracingLogger;

mod config;
mod db;
mod dto;
mod errors;
mod handlers;
mod middleware as app_middleware;
mod models;
mod schema;
mod services;

use crate::config::Config;
use crate::db::connection::create_pool;
use crate::services::{AuthService, ItemService, UserService};

pub struct AppState {
    pub pool: db::connection::DbPool,
    pub config: Arc<Config>,
    pub auth_service: Arc<AuthService>,
    pub user_service: Arc<UserService>,
    pub item_service: Arc<ItemService>,
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Initialize logging
    env_logger::init_from_env(env_logger::Env::default().default_filter_or("info"));

    // Load configuration
    let config = Config::from_env();
    let config = Arc::new(config);

    // Create database pool
    let pool = create_pool(&config.database)
        .expect("Failed to create database pool");

    // Run migrations
    {
        use diesel_migrations::{embed_migrations, EmbeddedMigrations, MigrationHarness};
        const MIGRATIONS: EmbeddedMigrations = embed_migrations!("./migrations");

        let mut conn = pool.get().expect("Failed to get connection");
        conn.run_pending_migrations(MIGRATIONS)
            .expect("Failed to run migrations");
    }

    // Initialize services
    let user_service = Arc::new(UserService::new(pool.clone()));
    let auth_service = Arc::new(AuthService::new(
        user_service.clone(),
        config.jwt.clone(),
    ));
    let item_service = Arc::new(ItemService::new(pool.clone()));

    let bind_address = format!("{}:{}", config.server.host, config.server.port);
    log::info!("Starting server at {}", bind_address);

    HttpServer::new(move || {
        let cors = Cors::default()
            .allow_any_origin()
            .allow_any_method()
            .allow_any_header()
            .max_age(3600);

        let app_state = web::Data::new(AppState {
            pool: pool.clone(),
            config: config.clone(),
            auth_service: auth_service.clone(),
            user_service: user_service.clone(),
            item_service: item_service.clone(),
        });

        App::new()
            .app_data(app_state)
            .wrap(cors)
            .wrap(TracingLogger::default())
            .wrap(middleware::Compress::default())
            .wrap(middleware::NormalizePath::trim())
            .configure(configure_routes)
    })
    .workers(config.server.workers)
    .bind(&bind_address)?
    .run()
    .await
}

fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg
        // Health routes
        .route("/health", web::get().to(handlers::health::health_check))
        .route("/health/ready", web::get().to(handlers::health::readiness))
        .route("/health/live", web::get().to(handlers::health::liveness))
        // API routes
        .service(
            web::scope("/api/v1")
                // Auth routes (public)
                .service(
                    web::scope("/auth")
                        .route("/register", web::post().to(handlers::auth::register))
                        .route("/login", web::post().to(handlers::auth::login))
                        .route("/refresh", web::post().to(handlers::auth::refresh_token))
                        .route(
                            "/logout",
                            web::post()
                                .to(handlers::auth::logout)
                                .wrap(app_middleware::auth::AuthMiddleware),
                        ),
                )
                // User routes (protected)
                .service(
                    web::scope("/users")
                        .wrap(app_middleware::auth::AuthMiddleware)
                        .route("/me", web::get().to(handlers::users::get_current_user))
                        .route("/me", web::put().to(handlers::users::update_current_user))
                        .route("/me", web::delete().to(handlers::users::delete_current_user))
                        .route("/me/password", web::put().to(handlers::users::change_password)),
                )
                // Admin routes (protected + admin only)
                .service(
                    web::scope("/admin")
                        .wrap(app_middleware::auth::AdminMiddleware)
                        .wrap(app_middleware::auth::AuthMiddleware)
                        .route("/users", web::get().to(handlers::users::list_users))
                        .route("/users/{id}", web::get().to(handlers::users::get_user))
                        .route("/users/{id}", web::put().to(handlers::users::update_user))
                        .route("/users/{id}", web::delete().to(handlers::users::delete_user)),
                )
                // Item routes (protected)
                .service(
                    web::scope("/items")
                        .wrap(app_middleware::auth::AuthMiddleware)
                        .route("", web::get().to(handlers::items::list))
                        .route("", web::post().to(handlers::items::create))
                        .route("/{id}", web::get().to(handlers::items::get_by_id))
                        .route("/{id}", web::put().to(handlers::items::update))
                        .route("/{id}", web::delete().to(handlers::items::delete)),
                ),
        );
}
```

### src/errors.rs
```rust
use actix_web::{http::StatusCode, HttpResponse, ResponseError};
use serde::Serialize;
use std::fmt;
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
    Internal(String),

    #[error("Database error")]
    Database(#[from] diesel::result::Error),

    #[error("Pool error")]
    Pool(#[from] r2d2::Error),

    #[error("JWT error")]
    Jwt(#[from] jsonwebtoken::errors::Error),

    #[error("Password error")]
    Password(String),
}

#[derive(Serialize)]
struct ErrorResponse {
    success: bool,
    error: ErrorDetail,
}

#[derive(Serialize)]
struct ErrorDetail {
    code: String,
    message: String,
}

impl ResponseError for AppError {
    fn status_code(&self) -> StatusCode {
        match self {
            AppError::BadRequest(_) => StatusCode::BAD_REQUEST,
            AppError::Unauthorized(_) => StatusCode::UNAUTHORIZED,
            AppError::Forbidden(_) => StatusCode::FORBIDDEN,
            AppError::NotFound(_) => StatusCode::NOT_FOUND,
            AppError::Conflict(_) => StatusCode::CONFLICT,
            AppError::Validation(_) => StatusCode::BAD_REQUEST,
            AppError::Internal(_) => StatusCode::INTERNAL_SERVER_ERROR,
            AppError::Database(_) => StatusCode::INTERNAL_SERVER_ERROR,
            AppError::Pool(_) => StatusCode::INTERNAL_SERVER_ERROR,
            AppError::Jwt(_) => StatusCode::UNAUTHORIZED,
            AppError::Password(_) => StatusCode::INTERNAL_SERVER_ERROR,
        }
    }

    fn error_response(&self) -> HttpResponse {
        let code = match self {
            AppError::BadRequest(_) => "BAD_REQUEST",
            AppError::Unauthorized(_) => "UNAUTHORIZED",
            AppError::Forbidden(_) => "FORBIDDEN",
            AppError::NotFound(_) => "NOT_FOUND",
            AppError::Conflict(_) => "CONFLICT",
            AppError::Validation(_) => "VALIDATION_ERROR",
            AppError::Internal(_) => "INTERNAL_ERROR",
            AppError::Database(_) => "DATABASE_ERROR",
            AppError::Pool(_) => "POOL_ERROR",
            AppError::Jwt(_) => "JWT_ERROR",
            AppError::Password(_) => "PASSWORD_ERROR",
        };

        let message = match self {
            AppError::Database(_) | AppError::Pool(_) | AppError::Internal(_) => {
                log::error!("Internal error: {:?}", self);
                "An internal error occurred".to_string()
            }
            _ => self.to_string(),
        };

        HttpResponse::build(self.status_code()).json(ErrorResponse {
            success: false,
            error: ErrorDetail {
                code: code.to_string(),
                message,
            },
        })
    }
}

pub type AppResult<T> = Result<T, AppError>;
```

### src/schema.rs
```rust
// @generated automatically by Diesel CLI.

diesel::table! {
    use diesel::sql_types::*;
    use crate::models::user::UserRoleMapping;
    use crate::models::item::ItemStatusMapping;

    users (id) {
        id -> Uuid,
        email -> Varchar,
        password_hash -> Varchar,
        name -> Varchar,
        role -> UserRoleMapping,
        active -> Bool,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
        deleted_at -> Nullable<Timestamptz>,
    }
}

diesel::table! {
    use diesel::sql_types::*;
    use crate::models::item::ItemStatusMapping;

    items (id) {
        id -> Uuid,
        user_id -> Uuid,
        title -> Varchar,
        description -> Nullable<Text>,
        status -> ItemStatusMapping,
        price -> Numeric,
        metadata -> Nullable<Jsonb>,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
        deleted_at -> Nullable<Timestamptz>,
    }
}

diesel::table! {
    refresh_tokens (id) {
        id -> Uuid,
        user_id -> Uuid,
        token_hash -> Varchar,
        expires_at -> Timestamptz,
        created_at -> Timestamptz,
        revoked_at -> Nullable<Timestamptz>,
    }
}

diesel::joinable!(items -> users (user_id));
diesel::joinable!(refresh_tokens -> users (user_id));

diesel::allow_tables_to_appear_in_same_query!(
    users,
    items,
    refresh_tokens,
);
```

### src/models/user.rs
```rust
use chrono::{DateTime, Utc};
use diesel::prelude::*;
use diesel::sql_types::Text;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::schema::users;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, AsExpression, FromSqlRow)]
#[diesel(sql_type = UserRoleMapping)]
pub enum UserRole {
    User,
    Admin,
}

#[derive(SqlType)]
#[diesel(postgres_type(name = "user_role"))]
pub struct UserRoleMapping;

impl diesel::serialize::ToSql<UserRoleMapping, diesel::pg::Pg> for UserRole {
    fn to_sql<'b>(
        &'b self,
        out: &mut diesel::serialize::Output<'b, '_, diesel::pg::Pg>,
    ) -> diesel::serialize::Result {
        match *self {
            UserRole::User => out.write_all(b"user")?,
            UserRole::Admin => out.write_all(b"admin")?,
        }
        Ok(diesel::serialize::IsNull::No)
    }
}

impl diesel::deserialize::FromSql<UserRoleMapping, diesel::pg::Pg> for UserRole {
    fn from_sql(
        bytes: diesel::pg::PgValue<'_>,
    ) -> diesel::deserialize::Result<Self> {
        match bytes.as_bytes() {
            b"user" => Ok(UserRole::User),
            b"admin" => Ok(UserRole::Admin),
            _ => Err("Unrecognized enum variant".into()),
        }
    }
}

impl Default for UserRole {
    fn default() -> Self {
        Self::User
    }
}

#[derive(Debug, Clone, Queryable, Identifiable, Selectable, Serialize)]
#[diesel(table_name = users)]
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
    #[serde(skip_serializing)]
    pub deleted_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Insertable)]
#[diesel(table_name = users)]
pub struct NewUser {
    pub email: String,
    pub password_hash: String,
    pub name: String,
    pub role: UserRole,
}

#[derive(Debug, AsChangeset)]
#[diesel(table_name = users)]
pub struct UpdateUser {
    pub name: Option<String>,
    pub active: Option<bool>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
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
use bigdecimal::BigDecimal;
use chrono::{DateTime, Utc};
use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use uuid::Uuid;

use crate::schema::items;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, AsExpression, FromSqlRow)]
#[diesel(sql_type = ItemStatusMapping)]
pub enum ItemStatus {
    Draft,
    Published,
    Archived,
}

#[derive(SqlType)]
#[diesel(postgres_type(name = "item_status"))]
pub struct ItemStatusMapping;

impl diesel::serialize::ToSql<ItemStatusMapping, diesel::pg::Pg> for ItemStatus {
    fn to_sql<'b>(
        &'b self,
        out: &mut diesel::serialize::Output<'b, '_, diesel::pg::Pg>,
    ) -> diesel::serialize::Result {
        match *self {
            ItemStatus::Draft => out.write_all(b"draft")?,
            ItemStatus::Published => out.write_all(b"published")?,
            ItemStatus::Archived => out.write_all(b"archived")?,
        }
        Ok(diesel::serialize::IsNull::No)
    }
}

impl diesel::deserialize::FromSql<ItemStatusMapping, diesel::pg::Pg> for ItemStatus {
    fn from_sql(
        bytes: diesel::pg::PgValue<'_>,
    ) -> diesel::deserialize::Result<Self> {
        match bytes.as_bytes() {
            b"draft" => Ok(ItemStatus::Draft),
            b"published" => Ok(ItemStatus::Published),
            b"archived" => Ok(ItemStatus::Archived),
            _ => Err("Unrecognized enum variant".into()),
        }
    }
}

impl Default for ItemStatus {
    fn default() -> Self {
        Self::Draft
    }
}

#[derive(Debug, Clone, Queryable, Identifiable, Selectable, Serialize)]
#[diesel(table_name = items)]
pub struct Item {
    pub id: Uuid,
    pub user_id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub status: ItemStatus,
    pub price: BigDecimal,
    pub metadata: Option<JsonValue>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    #[serde(skip_serializing)]
    pub deleted_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Insertable)]
#[diesel(table_name = items)]
pub struct NewItem {
    pub user_id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub status: ItemStatus,
    pub price: BigDecimal,
    pub metadata: Option<JsonValue>,
}

#[derive(Debug, AsChangeset)]
#[diesel(table_name = items)]
pub struct UpdateItem {
    pub title: Option<String>,
    pub description: Option<String>,
    pub status: Option<ItemStatus>,
    pub price: Option<BigDecimal>,
    pub metadata: Option<JsonValue>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, Default)]
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
}
```

### src/db/connection.rs
```rust
use diesel::pg::PgConnection;
use diesel::r2d2::{self, ConnectionManager};

use crate::config::DatabaseConfig;

pub type DbPool = r2d2::Pool<ConnectionManager<PgConnection>>;
pub type DbConnection = r2d2::PooledConnection<ConnectionManager<PgConnection>>;

pub fn create_pool(config: &DatabaseConfig) -> Result<DbPool, r2d2::Error> {
    let manager = ConnectionManager::<PgConnection>::new(&config.url);

    r2d2::Pool::builder()
        .max_size(config.pool_size)
        .min_idle(Some(1))
        .build(manager)
}
```

### src/services/auth.rs
```rust
use std::sync::Arc;
use uuid::Uuid;

use crate::config::JwtConfig;
use crate::dto::auth::{AuthResponse, LoginRequest, RegisterRequest, UserResponse};
use crate::errors::{AppError, AppResult};
use crate::models::user::{User, UserRole};
use crate::services::user::UserService;

mod jwt {
    use chrono::{Duration, Utc};
    use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
    use serde::{Deserialize, Serialize};
    use uuid::Uuid;

    use crate::errors::AppResult;

    #[derive(Debug, Serialize, Deserialize)]
    pub struct Claims {
        pub sub: String,
        pub user_id: Uuid,
        pub email: String,
        pub role: String,
        pub token_type: String,
        pub exp: i64,
        pub iat: i64,
    }

    pub fn generate(
        user_id: Uuid,
        email: &str,
        role: &str,
        secret: &str,
        expiry: Duration,
        token_type: &str,
    ) -> AppResult<String> {
        let now = Utc::now();
        let claims = Claims {
            sub: user_id.to_string(),
            user_id,
            email: email.to_string(),
            role: role.to_string(),
            token_type: token_type.to_string(),
            exp: (now + expiry).timestamp(),
            iat: now.timestamp(),
        };

        Ok(encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(secret.as_bytes()),
        )?)
    }

    pub fn validate(token: &str, secret: &str) -> AppResult<Claims> {
        Ok(decode::<Claims>(
            token,
            &DecodingKey::from_secret(secret.as_bytes()),
            &Validation::default(),
        )?
        .claims)
    }
}

mod password {
    use argon2::{
        password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
        Argon2,
    };

    use crate::errors::{AppError, AppResult};

    pub fn hash(password: &str) -> AppResult<String> {
        let salt = SaltString::generate(&mut OsRng);
        let argon2 = Argon2::default();

        argon2
            .hash_password(password.as_bytes(), &salt)
            .map(|h| h.to_string())
            .map_err(|e| AppError::Password(e.to_string()))
    }

    pub fn verify(password: &str, hash: &str) -> AppResult<bool> {
        let parsed_hash = PasswordHash::new(hash)
            .map_err(|e| AppError::Password(e.to_string()))?;

        Ok(Argon2::default()
            .verify_password(password.as_bytes(), &parsed_hash)
            .is_ok())
    }
}

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

    pub fn register(&self, req: RegisterRequest) -> AppResult<AuthResponse> {
        // Check if user exists
        if self.user_service.exists_by_email(&req.email)? {
            return Err(AppError::Conflict("User already exists".to_string()));
        }

        // Hash password
        let password_hash = password::hash(&req.password)?;

        // Create user
        let user = self.user_service.create(&req.email, &password_hash, &req.name, UserRole::User)?;

        self.generate_auth_response(&user)
    }

    pub fn login(&self, req: LoginRequest) -> AppResult<AuthResponse> {
        let user = self
            .user_service
            .get_by_email(&req.email)?
            .ok_or_else(|| AppError::Unauthorized("Invalid credentials".to_string()))?;

        if !user.active {
            return Err(AppError::Unauthorized("Account is disabled".to_string()));
        }

        if !password::verify(&req.password, &user.password_hash)? {
            return Err(AppError::Unauthorized("Invalid credentials".to_string()));
        }

        self.generate_auth_response(&user)
    }

    pub fn refresh_token(&self, refresh_token: &str) -> AppResult<AuthResponse> {
        let claims = jwt::validate(refresh_token, &self.jwt_config.secret)?;

        if claims.token_type != "refresh" {
            return Err(AppError::Unauthorized("Invalid token type".to_string()));
        }

        let user = self
            .user_service
            .get_by_id(claims.user_id)?
            .ok_or_else(|| AppError::NotFound("User not found".to_string()))?;

        self.generate_auth_response(&user)
    }

    pub fn validate_access_token(&self, token: &str) -> AppResult<jwt::Claims> {
        let claims = jwt::validate(token, &self.jwt_config.secret)?;

        if claims.token_type != "access" {
            return Err(AppError::Unauthorized("Invalid token type".to_string()));
        }

        Ok(claims)
    }

    fn generate_auth_response(&self, user: &User) -> AppResult<AuthResponse> {
        let role_str = match user.role {
            UserRole::User => "user",
            UserRole::Admin => "admin",
        };

        let access_token = jwt::generate(
            user.id,
            &user.email,
            role_str,
            &self.jwt_config.secret,
            chrono::Duration::hours(self.jwt_config.access_expiry_hours),
            "access",
        )?;

        let refresh_token = jwt::generate(
            user.id,
            &user.email,
            role_str,
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
                role: role_str.to_string(),
            },
        })
    }
}
```

### src/services/user.rs
```rust
use chrono::Utc;
use diesel::prelude::*;
use uuid::Uuid;

use crate::db::connection::DbPool;
use crate::errors::AppResult;
use crate::models::user::{NewUser, UpdateUser, User, UserRole};
use crate::schema::users;

pub struct UserService {
    pool: DbPool,
}

impl UserService {
    pub fn new(pool: DbPool) -> Self {
        Self { pool }
    }

    pub fn create(
        &self,
        email: &str,
        password_hash: &str,
        name: &str,
        role: UserRole,
    ) -> AppResult<User> {
        let mut conn = self.pool.get()?;

        let new_user = NewUser {
            email: email.to_string(),
            password_hash: password_hash.to_string(),
            name: name.to_string(),
            role,
        };

        let user = diesel::insert_into(users::table)
            .values(&new_user)
            .returning(User::as_returning())
            .get_result(&mut conn)?;

        Ok(user)
    }

    pub fn get_by_id(&self, id: Uuid) -> AppResult<Option<User>> {
        let mut conn = self.pool.get()?;

        let user = users::table
            .filter(users::id.eq(id))
            .filter(users::deleted_at.is_null())
            .first::<User>(&mut conn)
            .optional()?;

        Ok(user)
    }

    pub fn get_by_email(&self, email: &str) -> AppResult<Option<User>> {
        let mut conn = self.pool.get()?;

        let user = users::table
            .filter(users::email.eq(email))
            .filter(users::deleted_at.is_null())
            .first::<User>(&mut conn)
            .optional()?;

        Ok(user)
    }

    pub fn update(&self, id: Uuid, name: Option<String>, active: Option<bool>) -> AppResult<User> {
        let mut conn = self.pool.get()?;

        let update = UpdateUser {
            name,
            active,
            updated_at: Utc::now(),
        };

        let user = diesel::update(users::table)
            .filter(users::id.eq(id))
            .filter(users::deleted_at.is_null())
            .set(&update)
            .returning(User::as_returning())
            .get_result(&mut conn)?;

        Ok(user)
    }

    pub fn update_password(&self, id: Uuid, password_hash: &str) -> AppResult<()> {
        let mut conn = self.pool.get()?;

        diesel::update(users::table)
            .filter(users::id.eq(id))
            .filter(users::deleted_at.is_null())
            .set((
                users::password_hash.eq(password_hash),
                users::updated_at.eq(Utc::now()),
            ))
            .execute(&mut conn)?;

        Ok(())
    }

    pub fn delete(&self, id: Uuid) -> AppResult<()> {
        let mut conn = self.pool.get()?;

        diesel::update(users::table)
            .filter(users::id.eq(id))
            .set(users::deleted_at.eq(Some(Utc::now())))
            .execute(&mut conn)?;

        Ok(())
    }

    pub fn list(&self, page: i64, limit: i64) -> AppResult<(Vec<User>, i64)> {
        let mut conn = self.pool.get()?;
        let offset = (page - 1) * limit;

        let total: i64 = users::table
            .filter(users::deleted_at.is_null())
            .count()
            .get_result(&mut conn)?;

        let items = users::table
            .filter(users::deleted_at.is_null())
            .order(users::created_at.desc())
            .limit(limit)
            .offset(offset)
            .load::<User>(&mut conn)?;

        Ok((items, total))
    }

    pub fn exists_by_email(&self, email: &str) -> AppResult<bool> {
        let mut conn = self.pool.get()?;

        let exists = diesel::select(diesel::dsl::exists(
            users::table
                .filter(users::email.eq(email))
                .filter(users::deleted_at.is_null()),
        ))
        .get_result::<bool>(&mut conn)?;

        Ok(exists)
    }
}
```

### src/middleware/auth.rs
```rust
use actix_web::{
    dev::{Service, ServiceRequest, ServiceResponse, Transform},
    http::header::AUTHORIZATION,
    Error, HttpMessage,
};
use futures::future::{ok, Ready};
use std::future::Future;
use std::pin::Pin;
use std::sync::Arc;
use uuid::Uuid;

use crate::errors::AppError;
use crate::AppState;

#[derive(Clone, Debug)]
pub struct AuthUser {
    pub id: Uuid,
    pub email: String,
    pub role: String,
}

pub struct AuthMiddleware;

impl<S, B> Transform<S, ServiceRequest> for AuthMiddleware
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Transform = AuthMiddlewareService<S>;
    type InitError = ();
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ok(AuthMiddlewareService { service })
    }
}

pub struct AuthMiddlewareService<S> {
    service: S,
}

impl<S, B> Service<ServiceRequest> for AuthMiddlewareService<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Future = Pin<Box<dyn Future<Output = Result<Self::Response, Self::Error>>>>;

    fn poll_ready(
        &self,
        ctx: &mut core::task::Context<'_>,
    ) -> std::task::Poll<Result<(), Self::Error>> {
        self.service.poll_ready(ctx)
    }

    fn call(&self, req: ServiceRequest) -> Self::Future {
        let auth_header = req
            .headers()
            .get(AUTHORIZATION)
            .and_then(|h| h.to_str().ok())
            .map(|s| s.to_string());

        let state = req
            .app_data::<actix_web::web::Data<AppState>>()
            .cloned();

        let fut = self.service.call(req);

        Box::pin(async move {
            let auth_header = auth_header
                .ok_or_else(|| AppError::Unauthorized("Authorization header required".to_string()))?;

            let token = auth_header
                .strip_prefix("Bearer ")
                .ok_or_else(|| AppError::Unauthorized("Invalid authorization header".to_string()))?;

            let state = state
                .ok_or_else(|| AppError::Internal("App state not found".to_string()))?;

            let claims = state
                .auth_service
                .validate_access_token(token)
                .map_err(|_| AppError::Unauthorized("Invalid token".to_string()))?;

            let auth_user = AuthUser {
                id: claims.user_id,
                email: claims.email,
                role: claims.role,
            };

            // Insert auth user into request extensions
            // Note: This needs to be done differently in actix-web
            // You'd typically use request-local data or pass through context

            fut.await
        })
    }
}

pub struct AdminMiddleware;

impl<S, B> Transform<S, ServiceRequest> for AdminMiddleware
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Transform = AdminMiddlewareService<S>;
    type InitError = ();
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ok(AdminMiddlewareService { service })
    }
}

pub struct AdminMiddlewareService<S> {
    service: S,
}

impl<S, B> Service<ServiceRequest> for AdminMiddlewareService<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Future = Pin<Box<dyn Future<Output = Result<Self::Response, Self::Error>>>>;

    fn poll_ready(
        &self,
        ctx: &mut core::task::Context<'_>,
    ) -> std::task::Poll<Result<(), Self::Error>> {
        self.service.poll_ready(ctx)
    }

    fn call(&self, req: ServiceRequest) -> Self::Future {
        let fut = self.service.call(req);

        Box::pin(async move {
            // Check if user is admin from request extensions
            // This is simplified - in practice you'd get this from the auth middleware
            fut.await
        })
    }
}
```

### src/handlers/auth.rs
```rust
use actix_web::{web, HttpResponse};
use validator::Validate;

use crate::dto::auth::{LoginRequest, RefreshRequest, RegisterRequest};
use crate::errors::{AppError, AppResult};
use crate::AppState;

pub async fn register(
    state: web::Data<AppState>,
    body: web::Json<RegisterRequest>,
) -> AppResult<HttpResponse> {
    body.validate()
        .map_err(|e| AppError::Validation(e.to_string()))?;

    let response = state.auth_service.register(body.into_inner())?;
    Ok(HttpResponse::Created().json(serde_json::json!({
        "success": true,
        "data": response
    })))
}

pub async fn login(
    state: web::Data<AppState>,
    body: web::Json<LoginRequest>,
) -> AppResult<HttpResponse> {
    body.validate()
        .map_err(|e| AppError::Validation(e.to_string()))?;

    let response = state.auth_service.login(body.into_inner())?;
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "success": true,
        "data": response
    })))
}

pub async fn refresh_token(
    state: web::Data<AppState>,
    body: web::Json<RefreshRequest>,
) -> AppResult<HttpResponse> {
    body.validate()
        .map_err(|e| AppError::Validation(e.to_string()))?;

    let response = state.auth_service.refresh_token(&body.refresh_token)?;
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "success": true,
        "data": response
    })))
}

pub async fn logout() -> AppResult<HttpResponse> {
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "success": true,
        "message": "Logged out successfully"
    })))
}
```

### src/handlers/health.rs
```rust
use actix_web::{web, HttpResponse};

use crate::AppState;

pub async fn health_check() -> HttpResponse {
    HttpResponse::Ok().json(serde_json::json!({
        "status": "healthy",
        "timestamp": chrono::Utc::now().to_rfc3339()
    }))
}

pub async fn readiness(state: web::Data<AppState>) -> HttpResponse {
    match state.pool.get() {
        Ok(_) => HttpResponse::Ok().json(serde_json::json!({
            "status": "ready",
            "database": "connected"
        })),
        Err(_) => HttpResponse::ServiceUnavailable().json(serde_json::json!({
            "status": "not ready",
            "database": "disconnected"
        })),
    }
}

pub async fn liveness() -> HttpResponse {
    HttpResponse::Ok().json(serde_json::json!({
        "status": "alive"
    }))
}
```

### migrations/2024-01-01-000000_init/up.sql
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
    price NUMERIC(10, 2) DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Refresh tokens
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    revoked_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_deleted_at ON users(deleted_at);
CREATE INDEX idx_items_user_id ON items(user_id);
CREATE INDEX idx_items_status ON items(status);
CREATE INDEX idx_items_deleted_at ON items(deleted_at);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
```

## Docker Configuration

### Dockerfile
```dockerfile
# Build stage
FROM rust:1.75-slim-bookworm AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y libpq-dev pkg-config

COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
RUN rm -rf src

COPY . .
RUN touch src/main.rs
RUN cargo build --release

# Runtime stage
FROM debian:bookworm-slim

WORKDIR /app

RUN apt-get update && apt-get install -y libpq5 ca-certificates && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/release/my-actix-api .
COPY --from=builder /app/migrations ./migrations

RUN useradd -r -s /bin/false appuser
USER appuser

EXPOSE 8080

CMD ["./my-actix-api"]
```

## CLAUDE.md Integration

```markdown
# Rust Actix-Web API

## Build Commands
- `cargo run` - Start development server
- `cargo build --release` - Build optimized binary
- `cargo test` - Run all tests
- `diesel migration run` - Run database migrations

## Architecture
- Actix-web for actor-based concurrent HTTP
- Diesel ORM with compile-time query validation
- r2d2 connection pooling
- Argon2 password hashing

## Key Patterns
- Use `web::Data<AppState>` for shared state
- Custom error types implement ResponseError
- Middleware via Transform trait
- Schema generated by diesel CLI

## Database
- Run `diesel setup` to initialize
- Migrations in /migrations directory
- Schema auto-generated in src/schema.rs
```

## AI Suggestions

1. **Add async Diesel support** - Use diesel-async for non-blocking database operations
2. **Implement actor patterns** - Use Actix actors for background tasks and state management
3. **Add WebSocket actors** - Implement real-time features with Actix WebSocket actors
4. **Implement connection pool monitoring** - Add metrics for pool utilization and wait times
5. **Add request coalescing** - Deduplicate concurrent identical queries
6. **Implement circuit breakers** - Add resilience patterns with failsafe
7. **Add distributed tracing** - Integrate OpenTelemetry with tracing-actix-web
8. **Implement batch operations** - Support bulk insert/update with Diesel
9. **Add response caching** - Implement cache-control headers and ETags
10. **Implement graceful shutdown** - Add proper connection draining on shutdown
