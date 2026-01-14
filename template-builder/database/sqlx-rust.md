# SQLx Template (Rust)

Production-ready SQLx setup with PostgreSQL, compile-time query verification, connection pooling, and async operations for Rust applications.

## Installation

```toml
# Cargo.toml
[dependencies]
sqlx = { version = "0.7", features = ["runtime-tokio", "tls-rustls", "postgres", "uuid", "chrono", "json"] }
tokio = { version = "1", features = ["full"] }
uuid = { version = "1", features = ["v4", "serde"] }
chrono = { version = "0.4", features = ["serde"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
thiserror = "1"
async-trait = "0.1"
dotenvy = "0.15"
tracing = "0.1"
```

## Environment Variables

```env
# .env
DATABASE_URL=postgres://user:password@localhost:5432/myapp
DATABASE_MAX_CONNECTIONS=20
DATABASE_MIN_CONNECTIONS=5
DATABASE_CONNECT_TIMEOUT=30
DATABASE_IDLE_TIMEOUT=600
```

## Project Structure

```
src/
├── main.rs
├── db/
│   ├── mod.rs
│   ├── pool.rs              # Connection pool
│   └── migrations.rs        # Migration runner
├── models/
│   ├── mod.rs
│   ├── user.rs
│   └── post.rs
├── repositories/
│   ├── mod.rs
│   ├── base.rs              # Generic repository trait
│   ├── user.rs
│   └── post.rs
├── services/
│   ├── mod.rs
│   └── user.rs
└── error.rs
migrations/
├── 20240101000000_create_users.sql
└── 20240101000001_create_posts.sql
```

## Connection Pool

```rust
// src/db/pool.rs
use sqlx::{postgres::PgPoolOptions, PgPool};
use std::env;
use std::time::Duration;

pub async fn create_pool() -> Result<PgPool, sqlx::Error> {
    let database_url = env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set");

    let max_connections: u32 = env::var("DATABASE_MAX_CONNECTIONS")
        .unwrap_or_else(|_| "20".to_string())
        .parse()
        .unwrap_or(20);

    let min_connections: u32 = env::var("DATABASE_MIN_CONNECTIONS")
        .unwrap_or_else(|_| "5".to_string())
        .parse()
        .unwrap_or(5);

    let connect_timeout: u64 = env::var("DATABASE_CONNECT_TIMEOUT")
        .unwrap_or_else(|_| "30".to_string())
        .parse()
        .unwrap_or(30);

    let idle_timeout: u64 = env::var("DATABASE_IDLE_TIMEOUT")
        .unwrap_or_else(|_| "600".to_string())
        .parse()
        .unwrap_or(600);

    let pool = PgPoolOptions::new()
        .max_connections(max_connections)
        .min_connections(min_connections)
        .acquire_timeout(Duration::from_secs(connect_timeout))
        .idle_timeout(Duration::from_secs(idle_timeout))
        .test_before_acquire(true)
        .connect(&database_url)
        .await?;

    tracing::info!("Database pool created with {} max connections", max_connections);

    Ok(pool)
}

pub async fn health_check(pool: &PgPool) -> Result<(), sqlx::Error> {
    sqlx::query("SELECT 1")
        .execute(pool)
        .await?;
    Ok(())
}

// src/db/mod.rs
pub mod pool;
pub mod migrations;

pub use pool::*;
```

## Migrations

```rust
// src/db/migrations.rs
use sqlx::PgPool;

pub async fn run_migrations(pool: &PgPool) -> Result<(), sqlx::migrate::MigrateError> {
    tracing::info!("Running database migrations...");
    sqlx::migrate!("./migrations")
        .run(pool)
        .await?;
    tracing::info!("Migrations completed successfully");
    Ok(())
}
```

```sql
-- migrations/20240101000000_create_users.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_role AS ENUM ('admin', 'user', 'moderator');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'user',
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_name VARCHAR(255),
    bio TEXT,
    avatar_url VARCHAR(500),
    location VARCHAR(100),
    settings JSONB NOT NULL DEFAULT '{}',
    last_login_at TIMESTAMPTZ,
    email_verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_username ON users (username);
CREATE INDEX idx_users_role ON users (role);
CREATE INDEX idx_users_deleted_at ON users (deleted_at) WHERE deleted_at IS NULL;

-- migrations/20240101000001_create_posts.sql
CREATE TYPE post_status AS ENUM ('draft', 'published', 'archived');

CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(300) NOT NULL UNIQUE,
    content TEXT NOT NULL,
    excerpt TEXT,
    status post_status NOT NULL DEFAULT 'draft',
    tags TEXT[] NOT NULL DEFAULT '{}',
    view_count INTEGER NOT NULL DEFAULT 0,
    like_count INTEGER NOT NULL DEFAULT 0,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_posts_author_id ON posts (author_id);
CREATE INDEX idx_posts_slug ON posts (slug);
CREATE INDEX idx_posts_status ON posts (status);
CREATE INDEX idx_posts_status_published_at ON posts (status, published_at DESC);
CREATE INDEX idx_posts_tags ON posts USING GIN (tags);
CREATE INDEX idx_posts_deleted_at ON posts (deleted_at) WHERE deleted_at IS NULL;
```

## Error Types

```rust
// src/error.rs
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),

    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Conflict: {0}")]
    Conflict(String),

    #[error("Validation error: {0}")]
    Validation(String),

    #[error("Unauthorized")]
    Unauthorized,

    #[error("Internal error: {0}")]
    Internal(String),
}

pub type Result<T> = std::result::Result<T, AppError>;
```

## Model Definitions

```rust
// src/models/user.rs
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "user_role", rename_all = "lowercase")]
pub enum UserRole {
    Admin,
    User,
    Moderator,
}

impl Default for UserRole {
    fn default() -> Self {
        UserRole::User
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct UserSettings {
    pub theme: Option<String>,
    pub language: Option<String>,
    pub email_notifications: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct User {
    pub id: Uuid,
    pub email: String,
    pub username: String,
    #[serde(skip_serializing)]
    pub password_hash: String,
    pub role: UserRole,
    pub is_active: bool,
    pub display_name: Option<String>,
    pub bio: Option<String>,
    pub avatar_url: Option<String>,
    pub location: Option<String>,
    #[sqlx(json)]
    pub settings: serde_json::Value,
    pub last_login_at: Option<DateTime<Utc>>,
    pub email_verified_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateUser {
    pub email: String,
    pub username: String,
    pub password: String,
    pub role: Option<UserRole>,
    pub display_name: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct UpdateUser {
    pub username: Option<String>,
    pub display_name: Option<String>,
    pub bio: Option<String>,
    pub avatar_url: Option<String>,
    pub location: Option<String>,
    pub settings: Option<serde_json::Value>,
}


// src/models/post.rs
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "post_status", rename_all = "lowercase")]
pub enum PostStatus {
    Draft,
    Published,
    Archived,
}

impl Default for PostStatus {
    fn default() -> Self {
        PostStatus::Draft
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Post {
    pub id: Uuid,
    pub author_id: Uuid,
    pub title: String,
    pub slug: String,
    pub content: String,
    pub excerpt: Option<String>,
    pub status: PostStatus,
    pub tags: Vec<String>,
    pub view_count: i32,
    pub like_count: i32,
    pub published_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreatePost {
    pub author_id: Uuid,
    pub title: String,
    pub content: String,
    pub excerpt: Option<String>,
    pub tags: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct UpdatePost {
    pub title: Option<String>,
    pub content: Option<String>,
    pub excerpt: Option<String>,
    pub tags: Option<Vec<String>>,
    pub status: Option<PostStatus>,
}

// Post with author joined
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct PostWithAuthor {
    pub id: Uuid,
    pub author_id: Uuid,
    pub title: String,
    pub slug: String,
    pub content: String,
    pub excerpt: Option<String>,
    pub status: PostStatus,
    pub tags: Vec<String>,
    pub view_count: i32,
    pub like_count: i32,
    pub published_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    // Author fields
    pub author_username: String,
    pub author_display_name: Option<String>,
    pub author_avatar_url: Option<String>,
}


// src/models/mod.rs
pub mod user;
pub mod post;

pub use user::*;
pub use post::*;

// Pagination types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Pagination {
    pub page: i64,
    pub limit: i64,
    pub total: i64,
    pub total_pages: i64,
    pub has_next: bool,
    pub has_prev: bool,
}

impl Pagination {
    pub fn new(page: i64, limit: i64, total: i64) -> Self {
        let total_pages = (total as f64 / limit as f64).ceil() as i64;
        Self {
            page,
            limit,
            total,
            total_pages,
            has_next: page < total_pages,
            has_prev: page > 1,
        }
    }

    pub fn offset(&self) -> i64 {
        (self.page - 1) * self.limit
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaginatedResult<T> {
    pub data: Vec<T>,
    pub pagination: Pagination,
}

use serde::{Deserialize, Serialize};
```

## Base Repository Trait

```rust
// src/repositories/base.rs
use async_trait::async_trait;
use sqlx::PgPool;
use uuid::Uuid;

use crate::error::Result;
use crate::models::{Pagination, PaginatedResult};

#[async_trait]
pub trait Repository<T, C, U>: Send + Sync {
    async fn find_by_id(&self, id: Uuid) -> Result<Option<T>>;
    async fn find_all(&self, page: i64, limit: i64) -> Result<PaginatedResult<T>>;
    async fn create(&self, input: C) -> Result<T>;
    async fn update(&self, id: Uuid, input: U) -> Result<Option<T>>;
    async fn delete(&self, id: Uuid) -> Result<bool>;
    async fn count(&self) -> Result<i64>;
}

pub struct BaseRepository {
    pub pool: PgPool,
}

impl BaseRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}
```

## User Repository

```rust
// src/repositories/user.rs
use async_trait::async_trait;
use chrono::Utc;
use sqlx::PgPool;
use uuid::Uuid;

use crate::error::{AppError, Result};
use crate::models::{CreateUser, Pagination, PaginatedResult, UpdateUser, User, UserRole};
use crate::repositories::base::Repository;

pub struct UserRepository {
    pool: PgPool,
}

impl UserRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn find_by_email(&self, email: &str) -> Result<Option<User>> {
        let user = sqlx::query_as!(
            User,
            r#"
            SELECT
                id, email, username, password_hash,
                role as "role: UserRole",
                is_active, display_name, bio, avatar_url, location,
                settings, last_login_at, email_verified_at,
                created_at, updated_at, deleted_at
            FROM users
            WHERE email = $1 AND deleted_at IS NULL
            "#,
            email.to_lowercase()
        )
        .fetch_optional(&self.pool)
        .await?;

        Ok(user)
    }

    pub async fn find_by_username(&self, username: &str) -> Result<Option<User>> {
        let user = sqlx::query_as!(
            User,
            r#"
            SELECT
                id, email, username, password_hash,
                role as "role: UserRole",
                is_active, display_name, bio, avatar_url, location,
                settings, last_login_at, email_verified_at,
                created_at, updated_at, deleted_at
            FROM users
            WHERE username = $1 AND deleted_at IS NULL
            "#,
            username
        )
        .fetch_optional(&self.pool)
        .await?;

        Ok(user)
    }

    pub async fn find_by_role(&self, role: UserRole, page: i64, limit: i64) -> Result<PaginatedResult<User>> {
        let total = sqlx::query_scalar!(
            r#"SELECT COUNT(*) FROM users WHERE role = $1 AND deleted_at IS NULL"#,
            role as UserRole
        )
        .fetch_one(&self.pool)
        .await?
        .unwrap_or(0);

        let pagination = Pagination::new(page, limit, total);

        let users = sqlx::query_as!(
            User,
            r#"
            SELECT
                id, email, username, password_hash,
                role as "role: UserRole",
                is_active, display_name, bio, avatar_url, location,
                settings, last_login_at, email_verified_at,
                created_at, updated_at, deleted_at
            FROM users
            WHERE role = $1 AND deleted_at IS NULL
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
            "#,
            role as UserRole,
            limit,
            pagination.offset()
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(PaginatedResult {
            data: users,
            pagination,
        })
    }

    pub async fn update_last_login(&self, id: Uuid) -> Result<()> {
        sqlx::query!(
            r#"UPDATE users SET last_login_at = $1 WHERE id = $2"#,
            Utc::now(),
            id
        )
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn verify_email(&self, id: Uuid) -> Result<()> {
        sqlx::query!(
            r#"UPDATE users SET email_verified_at = $1 WHERE id = $2"#,
            Utc::now(),
            id
        )
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn deactivate(&self, id: Uuid) -> Result<()> {
        sqlx::query!(
            r#"UPDATE users SET is_active = false, updated_at = $1 WHERE id = $2"#,
            Utc::now(),
            id
        )
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn search(&self, query: &str, page: i64, limit: i64) -> Result<PaginatedResult<User>> {
        let search_pattern = format!("%{}%", query);

        let total = sqlx::query_scalar!(
            r#"
            SELECT COUNT(*) FROM users
            WHERE (email ILIKE $1 OR username ILIKE $1 OR display_name ILIKE $1)
            AND deleted_at IS NULL
            "#,
            search_pattern
        )
        .fetch_one(&self.pool)
        .await?
        .unwrap_or(0);

        let pagination = Pagination::new(page, limit, total);

        let users = sqlx::query_as!(
            User,
            r#"
            SELECT
                id, email, username, password_hash,
                role as "role: UserRole",
                is_active, display_name, bio, avatar_url, location,
                settings, last_login_at, email_verified_at,
                created_at, updated_at, deleted_at
            FROM users
            WHERE (email ILIKE $1 OR username ILIKE $1 OR display_name ILIKE $1)
            AND deleted_at IS NULL
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
            "#,
            search_pattern,
            limit,
            pagination.offset()
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(PaginatedResult {
            data: users,
            pagination,
        })
    }
}

#[async_trait]
impl Repository<User, CreateUser, UpdateUser> for UserRepository {
    async fn find_by_id(&self, id: Uuid) -> Result<Option<User>> {
        let user = sqlx::query_as!(
            User,
            r#"
            SELECT
                id, email, username, password_hash,
                role as "role: UserRole",
                is_active, display_name, bio, avatar_url, location,
                settings, last_login_at, email_verified_at,
                created_at, updated_at, deleted_at
            FROM users
            WHERE id = $1 AND deleted_at IS NULL
            "#,
            id
        )
        .fetch_optional(&self.pool)
        .await?;

        Ok(user)
    }

    async fn find_all(&self, page: i64, limit: i64) -> Result<PaginatedResult<User>> {
        let total = sqlx::query_scalar!(
            r#"SELECT COUNT(*) FROM users WHERE deleted_at IS NULL"#
        )
        .fetch_one(&self.pool)
        .await?
        .unwrap_or(0);

        let pagination = Pagination::new(page, limit, total);

        let users = sqlx::query_as!(
            User,
            r#"
            SELECT
                id, email, username, password_hash,
                role as "role: UserRole",
                is_active, display_name, bio, avatar_url, location,
                settings, last_login_at, email_verified_at,
                created_at, updated_at, deleted_at
            FROM users
            WHERE deleted_at IS NULL
            ORDER BY created_at DESC
            LIMIT $1 OFFSET $2
            "#,
            limit,
            pagination.offset()
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(PaginatedResult {
            data: users,
            pagination,
        })
    }

    async fn create(&self, input: CreateUser) -> Result<User> {
        // Check if email or username exists
        if self.find_by_email(&input.email).await?.is_some() {
            return Err(AppError::Conflict("Email already exists".to_string()));
        }
        if self.find_by_username(&input.username).await?.is_some() {
            return Err(AppError::Conflict("Username already exists".to_string()));
        }

        let role = input.role.unwrap_or(UserRole::User);
        let settings = serde_json::json!({
            "theme": "system",
            "language": "en",
            "email_notifications": true
        });

        // In production, hash the password here
        let password_hash = input.password; // TODO: Hash password

        let user = sqlx::query_as!(
            User,
            r#"
            INSERT INTO users (email, username, password_hash, role, display_name, settings)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING
                id, email, username, password_hash,
                role as "role: UserRole",
                is_active, display_name, bio, avatar_url, location,
                settings, last_login_at, email_verified_at,
                created_at, updated_at, deleted_at
            "#,
            input.email.to_lowercase(),
            input.username,
            password_hash,
            role as UserRole,
            input.display_name,
            settings
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(user)
    }

    async fn update(&self, id: Uuid, input: UpdateUser) -> Result<Option<User>> {
        let existing = self.find_by_id(id).await?;
        if existing.is_none() {
            return Ok(None);
        }

        let existing = existing.unwrap();

        let user = sqlx::query_as!(
            User,
            r#"
            UPDATE users SET
                username = COALESCE($2, username),
                display_name = COALESCE($3, display_name),
                bio = COALESCE($4, bio),
                avatar_url = COALESCE($5, avatar_url),
                location = COALESCE($6, location),
                settings = COALESCE($7, settings),
                updated_at = NOW()
            WHERE id = $1 AND deleted_at IS NULL
            RETURNING
                id, email, username, password_hash,
                role as "role: UserRole",
                is_active, display_name, bio, avatar_url, location,
                settings, last_login_at, email_verified_at,
                created_at, updated_at, deleted_at
            "#,
            id,
            input.username.or(Some(existing.username)),
            input.display_name.or(existing.display_name),
            input.bio.or(existing.bio),
            input.avatar_url.or(existing.avatar_url),
            input.location.or(existing.location),
            input.settings.or(Some(existing.settings))
        )
        .fetch_optional(&self.pool)
        .await?;

        Ok(user)
    }

    async fn delete(&self, id: Uuid) -> Result<bool> {
        let result = sqlx::query!(
            r#"UPDATE users SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL"#,
            id
        )
        .execute(&self.pool)
        .await?;

        Ok(result.rows_affected() > 0)
    }

    async fn count(&self) -> Result<i64> {
        let count = sqlx::query_scalar!(
            r#"SELECT COUNT(*) FROM users WHERE deleted_at IS NULL"#
        )
        .fetch_one(&self.pool)
        .await?
        .unwrap_or(0);

        Ok(count)
    }
}
```

## Post Repository

```rust
// src/repositories/post.rs
use async_trait::async_trait;
use chrono::Utc;
use sqlx::PgPool;
use uuid::Uuid;

use crate::error::{AppError, Result};
use crate::models::{
    CreatePost, Pagination, PaginatedResult, Post, PostStatus,
    PostWithAuthor, UpdatePost
};
use crate::repositories::base::Repository;

pub struct PostRepository {
    pool: PgPool,
}

impl PostRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    fn generate_slug(title: &str) -> String {
        title
            .to_lowercase()
            .chars()
            .map(|c| if c.is_alphanumeric() { c } else { '-' })
            .collect::<String>()
            .split('-')
            .filter(|s| !s.is_empty())
            .collect::<Vec<_>>()
            .join("-")
            .chars()
            .take(100)
            .collect()
    }

    pub async fn find_by_slug(&self, slug: &str) -> Result<Option<PostWithAuthor>> {
        let post = sqlx::query_as!(
            PostWithAuthor,
            r#"
            SELECT
                p.id, p.author_id, p.title, p.slug, p.content, p.excerpt,
                p.status as "status: PostStatus",
                p.tags, p.view_count, p.like_count, p.published_at,
                p.created_at, p.updated_at,
                u.username as author_username,
                u.display_name as author_display_name,
                u.avatar_url as author_avatar_url
            FROM posts p
            JOIN users u ON p.author_id = u.id
            WHERE p.slug = $1 AND p.deleted_at IS NULL
            "#,
            slug
        )
        .fetch_optional(&self.pool)
        .await?;

        Ok(post)
    }

    pub async fn find_by_author(&self, author_id: Uuid, page: i64, limit: i64) -> Result<PaginatedResult<Post>> {
        let total = sqlx::query_scalar!(
            r#"SELECT COUNT(*) FROM posts WHERE author_id = $1 AND deleted_at IS NULL"#,
            author_id
        )
        .fetch_one(&self.pool)
        .await?
        .unwrap_or(0);

        let pagination = Pagination::new(page, limit, total);

        let posts = sqlx::query_as!(
            Post,
            r#"
            SELECT
                id, author_id, title, slug, content, excerpt,
                status as "status: PostStatus",
                tags, view_count, like_count, published_at,
                created_at, updated_at, deleted_at
            FROM posts
            WHERE author_id = $1 AND deleted_at IS NULL
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
            "#,
            author_id,
            limit,
            pagination.offset()
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(PaginatedResult {
            data: posts,
            pagination,
        })
    }

    pub async fn find_published(&self, page: i64, limit: i64) -> Result<PaginatedResult<PostWithAuthor>> {
        let total = sqlx::query_scalar!(
            r#"SELECT COUNT(*) FROM posts WHERE status = 'published' AND deleted_at IS NULL"#
        )
        .fetch_one(&self.pool)
        .await?
        .unwrap_or(0);

        let pagination = Pagination::new(page, limit, total);

        let posts = sqlx::query_as!(
            PostWithAuthor,
            r#"
            SELECT
                p.id, p.author_id, p.title, p.slug, p.content, p.excerpt,
                p.status as "status: PostStatus",
                p.tags, p.view_count, p.like_count, p.published_at,
                p.created_at, p.updated_at,
                u.username as author_username,
                u.display_name as author_display_name,
                u.avatar_url as author_avatar_url
            FROM posts p
            JOIN users u ON p.author_id = u.id
            WHERE p.status = 'published' AND p.deleted_at IS NULL
            ORDER BY p.published_at DESC
            LIMIT $1 OFFSET $2
            "#,
            limit,
            pagination.offset()
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(PaginatedResult {
            data: posts,
            pagination,
        })
    }

    pub async fn find_by_tag(&self, tag: &str, page: i64, limit: i64) -> Result<PaginatedResult<PostWithAuthor>> {
        let total = sqlx::query_scalar!(
            r#"SELECT COUNT(*) FROM posts WHERE $1 = ANY(tags) AND status = 'published' AND deleted_at IS NULL"#,
            tag
        )
        .fetch_one(&self.pool)
        .await?
        .unwrap_or(0);

        let pagination = Pagination::new(page, limit, total);

        let posts = sqlx::query_as!(
            PostWithAuthor,
            r#"
            SELECT
                p.id, p.author_id, p.title, p.slug, p.content, p.excerpt,
                p.status as "status: PostStatus",
                p.tags, p.view_count, p.like_count, p.published_at,
                p.created_at, p.updated_at,
                u.username as author_username,
                u.display_name as author_display_name,
                u.avatar_url as author_avatar_url
            FROM posts p
            JOIN users u ON p.author_id = u.id
            WHERE $1 = ANY(p.tags) AND p.status = 'published' AND p.deleted_at IS NULL
            ORDER BY p.published_at DESC
            LIMIT $2 OFFSET $3
            "#,
            tag,
            limit,
            pagination.offset()
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(PaginatedResult {
            data: posts,
            pagination,
        })
    }

    pub async fn publish(&self, id: Uuid) -> Result<Option<Post>> {
        let post = sqlx::query_as!(
            Post,
            r#"
            UPDATE posts SET
                status = 'published',
                published_at = NOW(),
                updated_at = NOW()
            WHERE id = $1 AND deleted_at IS NULL
            RETURNING
                id, author_id, title, slug, content, excerpt,
                status as "status: PostStatus",
                tags, view_count, like_count, published_at,
                created_at, updated_at, deleted_at
            "#,
            id
        )
        .fetch_optional(&self.pool)
        .await?;

        Ok(post)
    }

    pub async fn archive(&self, id: Uuid) -> Result<Option<Post>> {
        let post = sqlx::query_as!(
            Post,
            r#"
            UPDATE posts SET
                status = 'archived',
                updated_at = NOW()
            WHERE id = $1 AND deleted_at IS NULL
            RETURNING
                id, author_id, title, slug, content, excerpt,
                status as "status: PostStatus",
                tags, view_count, like_count, published_at,
                created_at, updated_at, deleted_at
            "#,
            id
        )
        .fetch_optional(&self.pool)
        .await?;

        Ok(post)
    }

    pub async fn increment_views(&self, id: Uuid) -> Result<()> {
        sqlx::query!(
            r#"UPDATE posts SET view_count = view_count + 1 WHERE id = $1"#,
            id
        )
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn increment_likes(&self, id: Uuid) -> Result<()> {
        sqlx::query!(
            r#"UPDATE posts SET like_count = like_count + 1 WHERE id = $1"#,
            id
        )
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn decrement_likes(&self, id: Uuid) -> Result<()> {
        sqlx::query!(
            r#"UPDATE posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = $1"#,
            id
        )
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn find_trending(&self, days: i32, limit: i64) -> Result<Vec<PostWithAuthor>> {
        let posts = sqlx::query_as!(
            PostWithAuthor,
            r#"
            SELECT
                p.id, p.author_id, p.title, p.slug, p.content, p.excerpt,
                p.status as "status: PostStatus",
                p.tags, p.view_count, p.like_count, p.published_at,
                p.created_at, p.updated_at,
                u.username as author_username,
                u.display_name as author_display_name,
                u.avatar_url as author_avatar_url
            FROM posts p
            JOIN users u ON p.author_id = u.id
            WHERE p.status = 'published'
            AND p.published_at >= NOW() - INTERVAL '1 day' * $1
            AND p.deleted_at IS NULL
            ORDER BY (p.view_count + p.like_count * 5) DESC
            LIMIT $2
            "#,
            days,
            limit
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(posts)
    }
}

#[async_trait]
impl Repository<Post, CreatePost, UpdatePost> for PostRepository {
    async fn find_by_id(&self, id: Uuid) -> Result<Option<Post>> {
        let post = sqlx::query_as!(
            Post,
            r#"
            SELECT
                id, author_id, title, slug, content, excerpt,
                status as "status: PostStatus",
                tags, view_count, like_count, published_at,
                created_at, updated_at, deleted_at
            FROM posts
            WHERE id = $1 AND deleted_at IS NULL
            "#,
            id
        )
        .fetch_optional(&self.pool)
        .await?;

        Ok(post)
    }

    async fn find_all(&self, page: i64, limit: i64) -> Result<PaginatedResult<Post>> {
        let total = sqlx::query_scalar!(
            r#"SELECT COUNT(*) FROM posts WHERE deleted_at IS NULL"#
        )
        .fetch_one(&self.pool)
        .await?
        .unwrap_or(0);

        let pagination = Pagination::new(page, limit, total);

        let posts = sqlx::query_as!(
            Post,
            r#"
            SELECT
                id, author_id, title, slug, content, excerpt,
                status as "status: PostStatus",
                tags, view_count, like_count, published_at,
                created_at, updated_at, deleted_at
            FROM posts
            WHERE deleted_at IS NULL
            ORDER BY created_at DESC
            LIMIT $1 OFFSET $2
            "#,
            limit,
            pagination.offset()
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(PaginatedResult {
            data: posts,
            pagination,
        })
    }

    async fn create(&self, input: CreatePost) -> Result<Post> {
        let slug = Self::generate_slug(&input.title);
        let tags = input.tags.unwrap_or_default();

        let post = sqlx::query_as!(
            Post,
            r#"
            INSERT INTO posts (author_id, title, slug, content, excerpt, tags)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING
                id, author_id, title, slug, content, excerpt,
                status as "status: PostStatus",
                tags, view_count, like_count, published_at,
                created_at, updated_at, deleted_at
            "#,
            input.author_id,
            input.title,
            slug,
            input.content,
            input.excerpt,
            &tags
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(post)
    }

    async fn update(&self, id: Uuid, input: UpdatePost) -> Result<Option<Post>> {
        let existing = self.find_by_id(id).await?;
        if existing.is_none() {
            return Ok(None);
        }

        let existing = existing.unwrap();

        let post = sqlx::query_as!(
            Post,
            r#"
            UPDATE posts SET
                title = COALESCE($2, title),
                content = COALESCE($3, content),
                excerpt = COALESCE($4, excerpt),
                tags = COALESCE($5, tags),
                status = COALESCE($6, status),
                updated_at = NOW()
            WHERE id = $1 AND deleted_at IS NULL
            RETURNING
                id, author_id, title, slug, content, excerpt,
                status as "status: PostStatus",
                tags, view_count, like_count, published_at,
                created_at, updated_at, deleted_at
            "#,
            id,
            input.title.or(Some(existing.title)),
            input.content.or(Some(existing.content)),
            input.excerpt.or(existing.excerpt),
            input.tags.as_ref().or(Some(&existing.tags)),
            input.status.map(|s| s as PostStatus).or(Some(existing.status)) as Option<PostStatus>
        )
        .fetch_optional(&self.pool)
        .await?;

        Ok(post)
    }

    async fn delete(&self, id: Uuid) -> Result<bool> {
        let result = sqlx::query!(
            r#"UPDATE posts SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL"#,
            id
        )
        .execute(&self.pool)
        .await?;

        Ok(result.rows_affected() > 0)
    }

    async fn count(&self) -> Result<i64> {
        let count = sqlx::query_scalar!(
            r#"SELECT COUNT(*) FROM posts WHERE deleted_at IS NULL"#
        )
        .fetch_one(&self.pool)
        .await?
        .unwrap_or(0);

        Ok(count)
    }
}
```

## Main Entry Point

```rust
// src/main.rs
mod db;
mod error;
mod models;
mod repositories;
mod services;

use dotenvy::dotenv;
use tracing_subscriber;

use crate::db::{create_pool, health_check, migrations::run_migrations};
use crate::repositories::user::UserRepository;
use crate::repositories::post::PostRepository;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Load environment variables
    dotenv().ok();

    // Initialize tracing
    tracing_subscriber::fmt::init();

    tracing::info!("Starting application...");

    // Create database pool
    let pool = create_pool().await?;

    // Run migrations
    run_migrations(&pool).await?;

    // Health check
    health_check(&pool).await?;
    tracing::info!("Database connection healthy");

    // Initialize repositories
    let user_repo = UserRepository::new(pool.clone());
    let post_repo = PostRepository::new(pool.clone());

    // Example usage
    use crate::models::CreateUser;
    use crate::repositories::base::Repository;

    let new_user = CreateUser {
        email: "test@example.com".to_string(),
        username: "testuser".to_string(),
        password: "password123".to_string(),
        role: None,
        display_name: Some("Test User".to_string()),
    };

    match user_repo.create(new_user).await {
        Ok(user) => tracing::info!("Created user: {:?}", user.id),
        Err(e) => tracing::error!("Failed to create user: {:?}", e),
    }

    Ok(())
}
```

## Testing

```rust
// tests/user_repository_test.rs
use sqlx::PgPool;
use uuid::Uuid;

use myapp::models::{CreateUser, UpdateUser, UserRole};
use myapp::repositories::base::Repository;
use myapp::repositories::user::UserRepository;

#[sqlx::test]
async fn test_create_user(pool: PgPool) {
    let repo = UserRepository::new(pool);

    let input = CreateUser {
        email: "test@example.com".to_string(),
        username: "testuser".to_string(),
        password: "password123".to_string(),
        role: Some(UserRole::User),
        display_name: Some("Test User".to_string()),
    };

    let user = repo.create(input).await.unwrap();

    assert_eq!(user.email, "test@example.com");
    assert_eq!(user.username, "testuser");
    assert!(user.is_active);
}

#[sqlx::test]
async fn test_find_by_email(pool: PgPool) {
    let repo = UserRepository::new(pool);

    let input = CreateUser {
        email: "test@example.com".to_string(),
        username: "testuser".to_string(),
        password: "password123".to_string(),
        role: None,
        display_name: None,
    };

    repo.create(input).await.unwrap();

    let found = repo.find_by_email("test@example.com").await.unwrap();
    assert!(found.is_some());
    assert_eq!(found.unwrap().email, "test@example.com");
}

#[sqlx::test]
async fn test_soft_delete(pool: PgPool) {
    let repo = UserRepository::new(pool);

    let input = CreateUser {
        email: "test@example.com".to_string(),
        username: "testuser".to_string(),
        password: "password123".to_string(),
        role: None,
        display_name: None,
    };

    let user = repo.create(input).await.unwrap();

    let deleted = repo.delete(user.id).await.unwrap();
    assert!(deleted);

    let found = repo.find_by_id(user.id).await.unwrap();
    assert!(found.is_none());
}
```

## CLAUDE.md Integration

```markdown
# SQLx Integration

## Commands

```bash
# Run migrations
sqlx migrate run

# Create new migration
sqlx migrate add <name>

# Prepare for offline compilation
cargo sqlx prepare

# Check query validity
cargo sqlx prepare --check
```

## Query Macros

SQLx provides compile-time verified queries:

```rust
// Type-safe query
let user = sqlx::query_as!(User, "SELECT * FROM users WHERE id = $1", id)
    .fetch_optional(&pool)
    .await?;

// With custom type mapping
sqlx::query_as!(
    User,
    r#"SELECT role as "role: UserRole" FROM users"#
)
```

## Offline Mode

For CI/CD without database:

```bash
# Generate query metadata
cargo sqlx prepare

# Build with offline mode
SQLX_OFFLINE=true cargo build
```

## Transactions

```rust
let mut tx = pool.begin().await?;
// Operations...
tx.commit().await?;
```

## Connection Pooling

Pool is managed automatically. Configure via environment variables or `PgPoolOptions`.
```

## AI Suggestions

1. **Add compile-time SQL verification** - Use `cargo sqlx prepare` for offline builds
2. **Implement connection retry** - Add exponential backoff for transient failures
3. **Create query builder** - Build type-safe dynamic queries with sqlx-builder
4. **Add tracing instrumentation** - Integrate with tracing for query logging
5. **Implement batch operations** - Use `COPY` for bulk inserts
6. **Add read replicas support** - Configure separate pools for read/write
7. **Create migration testing** - Test migrations in CI with real database
8. **Implement row locking** - Add `FOR UPDATE` support for concurrent access
9. **Add query caching** - Cache frequently used prepared statements
10. **Create health check endpoint** - Expose pool statistics for monitoring
