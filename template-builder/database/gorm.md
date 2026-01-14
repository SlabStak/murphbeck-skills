# GORM Template (Go)

Production-ready GORM setup with PostgreSQL, migrations, repository pattern, and best practices for Go applications.

## Installation

```bash
go get -u gorm.io/gorm
go get -u gorm.io/driver/postgres
go get -u github.com/google/uuid
go get -u github.com/joho/godotenv
```

## Environment Variables

```env
# .env
DATABASE_URL=postgres://user:password@localhost:5432/myapp?sslmode=disable
DATABASE_MAX_OPEN_CONNS=25
DATABASE_MAX_IDLE_CONNS=10
DATABASE_CONN_MAX_LIFETIME=5m
DATABASE_LOG_LEVEL=info
```

## Project Structure

```
├── cmd/
│   └── server/
│       └── main.go
├── internal/
│   ├── database/
│   │   ├── database.go         # Database connection
│   │   ├── migrations.go       # Auto migrations
│   │   └── hooks.go            # GORM hooks
│   ├── models/
│   │   ├── base.go             # Base model
│   │   ├── user.go
│   │   └── post.go
│   ├── repositories/
│   │   ├── base.go             # Generic repository
│   │   ├── user.go
│   │   └── post.go
│   ├── services/
│   │   ├── user.go
│   │   └── post.go
│   └── handlers/
│       ├── user.go
│       └── post.go
├── pkg/
│   └── pagination/
│       └── pagination.go
└── go.mod
```

## Database Connection

```go
// internal/database/database.go
package database

import (
	"fmt"
	"log"
	"os"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

type Config struct {
	URL             string
	MaxOpenConns    int
	MaxIdleConns    int
	ConnMaxLifetime time.Duration
	LogLevel        logger.LogLevel
}

func DefaultConfig() *Config {
	maxOpen := 25
	maxIdle := 10
	lifetime := 5 * time.Minute
	logLevel := logger.Info

	if v := os.Getenv("DATABASE_MAX_OPEN_CONNS"); v != "" {
		fmt.Sscanf(v, "%d", &maxOpen)
	}
	if v := os.Getenv("DATABASE_MAX_IDLE_CONNS"); v != "" {
		fmt.Sscanf(v, "%d", &maxIdle)
	}
	if v := os.Getenv("DATABASE_CONN_MAX_LIFETIME"); v != "" {
		if d, err := time.ParseDuration(v); err == nil {
			lifetime = d
		}
	}
	if v := os.Getenv("DATABASE_LOG_LEVEL"); v != "" {
		switch v {
		case "silent":
			logLevel = logger.Silent
		case "error":
			logLevel = logger.Error
		case "warn":
			logLevel = logger.Warn
		case "info":
			logLevel = logger.Info
		}
	}

	return &Config{
		URL:             os.Getenv("DATABASE_URL"),
		MaxOpenConns:    maxOpen,
		MaxIdleConns:    maxIdle,
		ConnMaxLifetime: lifetime,
		LogLevel:        logLevel,
	}
}

func Connect(cfg *Config) (*gorm.DB, error) {
	if cfg == nil {
		cfg = DefaultConfig()
	}

	newLogger := logger.New(
		log.New(os.Stdout, "\r\n", log.LstdFlags),
		logger.Config{
			SlowThreshold:             200 * time.Millisecond,
			LogLevel:                  cfg.LogLevel,
			IgnoreRecordNotFoundError: true,
			Colorful:                  true,
		},
	)

	db, err := gorm.Open(postgres.Open(cfg.URL), &gorm.Config{
		Logger:                 newLogger,
		SkipDefaultTransaction: true,
		PrepareStmt:            true,
		NowFunc: func() time.Time {
			return time.Now().UTC()
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get underlying sql.DB: %w", err)
	}

	sqlDB.SetMaxOpenConns(cfg.MaxOpenConns)
	sqlDB.SetMaxIdleConns(cfg.MaxIdleConns)
	sqlDB.SetConnMaxLifetime(cfg.ConnMaxLifetime)

	DB = db
	return db, nil
}

func Close() error {
	if DB == nil {
		return nil
	}
	sqlDB, err := DB.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}

func HealthCheck() error {
	if DB == nil {
		return fmt.Errorf("database not initialized")
	}
	sqlDB, err := DB.DB()
	if err != nil {
		return err
	}
	return sqlDB.Ping()
}

// Transaction helper
func WithTransaction(fn func(tx *gorm.DB) error) error {
	return DB.Transaction(fn)
}

// Get database instance (useful for dependency injection)
func GetDB() *gorm.DB {
	return DB
}
```

## Base Model

```go
// internal/models/base.go
package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Base model with common fields
type Base struct {
	ID        uuid.UUID      `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	CreatedAt time.Time      `gorm:"not null;default:now()" json:"created_at"`
	UpdatedAt time.Time      `gorm:"not null;default:now()" json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
}

// BeforeCreate hook to generate UUID if not set
func (b *Base) BeforeCreate(tx *gorm.DB) error {
	if b.ID == uuid.Nil {
		b.ID = uuid.New()
	}
	return nil
}

// SoftDeleteMixin for models that need soft delete
type SoftDeleteMixin struct {
	DeletedAt gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
}

// IsDeleted checks if record is soft deleted
func (m *SoftDeleteMixin) IsDeleted() bool {
	return m.DeletedAt.Valid
}

// TimestampMixin for models that only need timestamps
type TimestampMixin struct {
	CreatedAt time.Time `gorm:"not null;default:now()" json:"created_at"`
	UpdatedAt time.Time `gorm:"not null;default:now()" json:"updated_at"`
}
```

## Model Definitions

```go
// internal/models/user.go
package models

import (
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type UserRole string

const (
	UserRoleAdmin     UserRole = "admin"
	UserRoleUser      UserRole = "user"
	UserRoleModerator UserRole = "moderator"
)

type User struct {
	Base

	Email        string    `gorm:"type:varchar(255);uniqueIndex;not null" json:"email"`
	Username     string    `gorm:"type:varchar(100);uniqueIndex;not null" json:"username"`
	PasswordHash string    `gorm:"type:varchar(255);not null" json:"-"`
	Role         UserRole  `gorm:"type:varchar(20);not null;default:'user'" json:"role"`
	IsActive     bool      `gorm:"not null;default:true" json:"is_active"`

	// Profile fields
	DisplayName *string `gorm:"type:varchar(255)" json:"display_name,omitempty"`
	Bio         *string `gorm:"type:text" json:"bio,omitempty"`
	AvatarURL   *string `gorm:"type:varchar(500)" json:"avatar_url,omitempty"`
	Location    *string `gorm:"type:varchar(100)" json:"location,omitempty"`

	// Settings as JSON
	Settings Settings `gorm:"type:jsonb;default:'{}'" json:"settings"`

	// Timestamps
	LastLoginAt     *time.Time `json:"last_login_at,omitempty"`
	EmailVerifiedAt *time.Time `json:"email_verified_at,omitempty"`

	// Relationships
	Posts []Post `gorm:"foreignKey:AuthorID" json:"posts,omitempty"`
}

type Settings struct {
	Theme              string `json:"theme"`
	Language           string `json:"language"`
	EmailNotifications bool   `json:"email_notifications"`
}

// TableName specifies the table name
func (User) TableName() string {
	return "users"
}

// SetPassword hashes and sets the password
func (u *User) SetPassword(password string) error {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	u.PasswordHash = string(hash)
	return nil
}

// CheckPassword verifies the password
func (u *User) CheckPassword(password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password))
	return err == nil
}

// BeforeCreate hook
func (u *User) BeforeCreate(tx *gorm.DB) error {
	if err := u.Base.BeforeCreate(tx); err != nil {
		return err
	}
	// Default settings
	if u.Settings.Theme == "" {
		u.Settings.Theme = "system"
	}
	if u.Settings.Language == "" {
		u.Settings.Language = "en"
	}
	return nil
}


// internal/models/post.go
package models

import (
	"strings"
	"time"
	"unicode"

	"github.com/google/uuid"
	"github.com/lib/pq"
	"gorm.io/gorm"
)

type PostStatus string

const (
	PostStatusDraft     PostStatus = "draft"
	PostStatusPublished PostStatus = "published"
	PostStatusArchived  PostStatus = "archived"
)

type Post struct {
	Base

	AuthorID uuid.UUID  `gorm:"type:uuid;not null;index" json:"author_id"`
	Title    string     `gorm:"type:varchar(255);not null" json:"title"`
	Slug     string     `gorm:"type:varchar(300);uniqueIndex;not null" json:"slug"`
	Content  string     `gorm:"type:text;not null" json:"content"`
	Excerpt  *string    `gorm:"type:text" json:"excerpt,omitempty"`
	Status   PostStatus `gorm:"type:varchar(20);not null;default:'draft';index" json:"status"`
	Tags     pq.StringArray `gorm:"type:text[]" json:"tags"`

	// Stats
	ViewCount int `gorm:"not null;default:0" json:"view_count"`
	LikeCount int `gorm:"not null;default:0" json:"like_count"`

	// Timestamps
	PublishedAt *time.Time `json:"published_at,omitempty"`

	// Relationships
	Author User `gorm:"foreignKey:AuthorID" json:"author,omitempty"`
}

// TableName specifies the table name
func (Post) TableName() string {
	return "posts"
}

// GenerateSlug creates a URL-friendly slug from title
func (p *Post) GenerateSlug() {
	slug := strings.ToLower(p.Title)
	var result []rune
	for _, r := range slug {
		if unicode.IsLetter(r) || unicode.IsNumber(r) {
			result = append(result, r)
		} else if len(result) > 0 && result[len(result)-1] != '-' {
			result = append(result, '-')
		}
	}
	slug = strings.Trim(string(result), "-")
	if len(slug) > 100 {
		slug = slug[:100]
	}
	p.Slug = slug
}

// BeforeCreate hook
func (p *Post) BeforeCreate(tx *gorm.DB) error {
	if err := p.Base.BeforeCreate(tx); err != nil {
		return err
	}
	if p.Slug == "" {
		p.GenerateSlug()
	}
	if p.Tags == nil {
		p.Tags = pq.StringArray{}
	}
	return nil
}

// Publish sets the post status to published
func (p *Post) Publish() {
	p.Status = PostStatusPublished
	now := time.Now()
	p.PublishedAt = &now
}

// Archive sets the post status to archived
func (p *Post) Archive() {
	p.Status = PostStatusArchived
}
```

## Pagination

```go
// pkg/pagination/pagination.go
package pagination

import (
	"math"

	"gorm.io/gorm"
)

type Pagination struct {
	Page       int   `json:"page"`
	Limit      int   `json:"limit"`
	Total      int64 `json:"total"`
	TotalPages int   `json:"total_pages"`
	HasNext    bool  `json:"has_next"`
	HasPrev    bool  `json:"has_prev"`
}

type PaginatedResult[T any] struct {
	Data       []T        `json:"data"`
	Pagination Pagination `json:"pagination"`
}

func NewPagination(page, limit int) *Pagination {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}
	return &Pagination{
		Page:  page,
		Limit: limit,
	}
}

func (p *Pagination) Offset() int {
	return (p.Page - 1) * p.Limit
}

func (p *Pagination) Calculate(total int64) {
	p.Total = total
	p.TotalPages = int(math.Ceil(float64(total) / float64(p.Limit)))
	p.HasNext = p.Page < p.TotalPages
	p.HasPrev = p.Page > 1
}

// Paginate is a GORM scope for pagination
func Paginate(page, limit int) func(db *gorm.DB) *gorm.DB {
	return func(db *gorm.DB) *gorm.DB {
		p := NewPagination(page, limit)
		return db.Offset(p.Offset()).Limit(p.Limit)
	}
}
```

## Base Repository

```go
// internal/repositories/base.go
package repositories

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"myapp/pkg/pagination"
)

var (
	ErrNotFound = errors.New("record not found")
	ErrConflict = errors.New("record already exists")
)

// Repository interface defines common operations
type Repository[T any] interface {
	FindByID(ctx context.Context, id uuid.UUID) (*T, error)
	FindAll(ctx context.Context, page, limit int) (*pagination.PaginatedResult[T], error)
	Create(ctx context.Context, entity *T) error
	Update(ctx context.Context, entity *T) error
	Delete(ctx context.Context, id uuid.UUID) error
	Count(ctx context.Context) (int64, error)
}

// BaseRepository provides common CRUD operations
type BaseRepository[T any] struct {
	db *gorm.DB
}

func NewBaseRepository[T any](db *gorm.DB) *BaseRepository[T] {
	return &BaseRepository[T]{db: db}
}

func (r *BaseRepository[T]) DB() *gorm.DB {
	return r.db
}

func (r *BaseRepository[T]) FindByID(ctx context.Context, id uuid.UUID) (*T, error) {
	var entity T
	result := r.db.WithContext(ctx).First(&entity, "id = ?", id)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, result.Error
	}
	return &entity, nil
}

func (r *BaseRepository[T]) FindAll(ctx context.Context, page, limit int) (*pagination.PaginatedResult[T], error) {
	var entities []T
	var total int64

	p := pagination.NewPagination(page, limit)

	// Count total
	if err := r.db.WithContext(ctx).Model(new(T)).Count(&total).Error; err != nil {
		return nil, err
	}

	// Get paginated results
	result := r.db.WithContext(ctx).
		Offset(p.Offset()).
		Limit(p.Limit).
		Find(&entities)
	if result.Error != nil {
		return nil, result.Error
	}

	p.Calculate(total)

	return &pagination.PaginatedResult[T]{
		Data:       entities,
		Pagination: *p,
	}, nil
}

func (r *BaseRepository[T]) Create(ctx context.Context, entity *T) error {
	return r.db.WithContext(ctx).Create(entity).Error
}

func (r *BaseRepository[T]) Update(ctx context.Context, entity *T) error {
	return r.db.WithContext(ctx).Save(entity).Error
}

func (r *BaseRepository[T]) Delete(ctx context.Context, id uuid.UUID) error {
	var entity T
	result := r.db.WithContext(ctx).Delete(&entity, "id = ?", id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *BaseRepository[T]) HardDelete(ctx context.Context, id uuid.UUID) error {
	var entity T
	result := r.db.WithContext(ctx).Unscoped().Delete(&entity, "id = ?", id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *BaseRepository[T]) Count(ctx context.Context) (int64, error) {
	var count int64
	result := r.db.WithContext(ctx).Model(new(T)).Count(&count)
	return count, result.Error
}

func (r *BaseRepository[T]) Exists(ctx context.Context, id uuid.UUID) (bool, error) {
	var count int64
	result := r.db.WithContext(ctx).Model(new(T)).Where("id = ?", id).Count(&count)
	return count > 0, result.Error
}

// Transaction executes function within a transaction
func (r *BaseRepository[T]) Transaction(ctx context.Context, fn func(tx *gorm.DB) error) error {
	return r.db.WithContext(ctx).Transaction(fn)
}
```

## User Repository

```go
// internal/repositories/user.go
package repositories

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"myapp/internal/models"
	"myapp/pkg/pagination"
)

type UserRepository struct {
	*BaseRepository[models.User]
}

func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{
		BaseRepository: NewBaseRepository[models.User](db),
	}
}

func (r *UserRepository) FindByEmail(ctx context.Context, email string) (*models.User, error) {
	var user models.User
	result := r.DB().WithContext(ctx).
		Where("email = ?", strings.ToLower(email)).
		First(&user)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, result.Error
	}
	return &user, nil
}

func (r *UserRepository) FindByUsername(ctx context.Context, username string) (*models.User, error) {
	var user models.User
	result := r.DB().WithContext(ctx).
		Where("username = ?", username).
		First(&user)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, result.Error
	}
	return &user, nil
}

func (r *UserRepository) FindByEmailOrUsername(ctx context.Context, email, username string) (*models.User, error) {
	var user models.User
	result := r.DB().WithContext(ctx).
		Where("email = ? OR username = ?", strings.ToLower(email), username).
		First(&user)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, nil // Not found is expected
		}
		return nil, result.Error
	}
	return &user, nil
}

func (r *UserRepository) Create(ctx context.Context, user *models.User) error {
	user.Email = strings.ToLower(user.Email)
	return r.BaseRepository.Create(ctx, user)
}

func (r *UserRepository) FindByRole(ctx context.Context, role models.UserRole, page, limit int) (*pagination.PaginatedResult[models.User], error) {
	var users []models.User
	var total int64

	p := pagination.NewPagination(page, limit)

	if err := r.DB().WithContext(ctx).Model(&models.User{}).Where("role = ?", role).Count(&total).Error; err != nil {
		return nil, err
	}

	result := r.DB().WithContext(ctx).
		Where("role = ?", role).
		Offset(p.Offset()).
		Limit(p.Limit).
		Find(&users)
	if result.Error != nil {
		return nil, result.Error
	}

	p.Calculate(total)

	return &pagination.PaginatedResult[models.User]{
		Data:       users,
		Pagination: *p,
	}, nil
}

func (r *UserRepository) FindActive(ctx context.Context, page, limit int) (*pagination.PaginatedResult[models.User], error) {
	var users []models.User
	var total int64

	p := pagination.NewPagination(page, limit)

	if err := r.DB().WithContext(ctx).Model(&models.User{}).Where("is_active = ?", true).Count(&total).Error; err != nil {
		return nil, err
	}

	result := r.DB().WithContext(ctx).
		Where("is_active = ?", true).
		Offset(p.Offset()).
		Limit(p.Limit).
		Find(&users)
	if result.Error != nil {
		return nil, result.Error
	}

	p.Calculate(total)

	return &pagination.PaginatedResult[models.User]{
		Data:       users,
		Pagination: *p,
	}, nil
}

func (r *UserRepository) UpdateLastLogin(ctx context.Context, id uuid.UUID) error {
	now := time.Now()
	return r.DB().WithContext(ctx).
		Model(&models.User{}).
		Where("id = ?", id).
		Update("last_login_at", now).Error
}

func (r *UserRepository) VerifyEmail(ctx context.Context, id uuid.UUID) error {
	now := time.Now()
	return r.DB().WithContext(ctx).
		Model(&models.User{}).
		Where("id = ?", id).
		Update("email_verified_at", now).Error
}

func (r *UserRepository) Deactivate(ctx context.Context, id uuid.UUID) error {
	return r.DB().WithContext(ctx).
		Model(&models.User{}).
		Where("id = ?", id).
		Update("is_active", false).Error
}

func (r *UserRepository) Activate(ctx context.Context, id uuid.UUID) error {
	return r.DB().WithContext(ctx).
		Model(&models.User{}).
		Where("id = ?", id).
		Update("is_active", true).Error
}

func (r *UserRepository) Search(ctx context.Context, query string, page, limit int) (*pagination.PaginatedResult[models.User], error) {
	var users []models.User
	var total int64

	p := pagination.NewPagination(page, limit)
	searchPattern := "%" + query + "%"

	baseQuery := r.DB().WithContext(ctx).Model(&models.User{}).
		Where("email ILIKE ? OR username ILIKE ? OR display_name ILIKE ?", searchPattern, searchPattern, searchPattern)

	if err := baseQuery.Count(&total).Error; err != nil {
		return nil, err
	}

	result := baseQuery.
		Offset(p.Offset()).
		Limit(p.Limit).
		Find(&users)
	if result.Error != nil {
		return nil, result.Error
	}

	p.Calculate(total)

	return &pagination.PaginatedResult[models.User]{
		Data:       users,
		Pagination: *p,
	}, nil
}
```

## Post Repository

```go
// internal/repositories/post.go
package repositories

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"myapp/internal/models"
	"myapp/pkg/pagination"
)

type PostRepository struct {
	*BaseRepository[models.Post]
}

func NewPostRepository(db *gorm.DB) *PostRepository {
	return &PostRepository{
		BaseRepository: NewBaseRepository[models.Post](db),
	}
}

func (r *PostRepository) FindBySlug(ctx context.Context, slug string) (*models.Post, error) {
	var post models.Post
	result := r.DB().WithContext(ctx).
		Preload("Author").
		Where("slug = ?", slug).
		First(&post)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, ErrNotFound
		}
		return nil, result.Error
	}
	return &post, nil
}

func (r *PostRepository) FindByAuthor(ctx context.Context, authorID uuid.UUID, page, limit int) (*pagination.PaginatedResult[models.Post], error) {
	var posts []models.Post
	var total int64

	p := pagination.NewPagination(page, limit)

	if err := r.DB().WithContext(ctx).Model(&models.Post{}).Where("author_id = ?", authorID).Count(&total).Error; err != nil {
		return nil, err
	}

	result := r.DB().WithContext(ctx).
		Where("author_id = ?", authorID).
		Order("created_at DESC").
		Offset(p.Offset()).
		Limit(p.Limit).
		Find(&posts)
	if result.Error != nil {
		return nil, result.Error
	}

	p.Calculate(total)

	return &pagination.PaginatedResult[models.Post]{
		Data:       posts,
		Pagination: *p,
	}, nil
}

func (r *PostRepository) FindPublished(ctx context.Context, page, limit int) (*pagination.PaginatedResult[models.Post], error) {
	var posts []models.Post
	var total int64

	p := pagination.NewPagination(page, limit)

	if err := r.DB().WithContext(ctx).Model(&models.Post{}).Where("status = ?", models.PostStatusPublished).Count(&total).Error; err != nil {
		return nil, err
	}

	result := r.DB().WithContext(ctx).
		Preload("Author").
		Where("status = ?", models.PostStatusPublished).
		Order("published_at DESC").
		Offset(p.Offset()).
		Limit(p.Limit).
		Find(&posts)
	if result.Error != nil {
		return nil, result.Error
	}

	p.Calculate(total)

	return &pagination.PaginatedResult[models.Post]{
		Data:       posts,
		Pagination: *p,
	}, nil
}

func (r *PostRepository) FindByTag(ctx context.Context, tag string, page, limit int) (*pagination.PaginatedResult[models.Post], error) {
	var posts []models.Post
	var total int64

	p := pagination.NewPagination(page, limit)

	baseQuery := r.DB().WithContext(ctx).Model(&models.Post{}).
		Where("? = ANY(tags) AND status = ?", tag, models.PostStatusPublished)

	if err := baseQuery.Count(&total).Error; err != nil {
		return nil, err
	}

	result := baseQuery.
		Preload("Author").
		Order("published_at DESC").
		Offset(p.Offset()).
		Limit(p.Limit).
		Find(&posts)
	if result.Error != nil {
		return nil, result.Error
	}

	p.Calculate(total)

	return &pagination.PaginatedResult[models.Post]{
		Data:       posts,
		Pagination: *p,
	}, nil
}

func (r *PostRepository) Publish(ctx context.Context, id uuid.UUID) error {
	now := time.Now()
	return r.DB().WithContext(ctx).
		Model(&models.Post{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"status":       models.PostStatusPublished,
			"published_at": now,
		}).Error
}

func (r *PostRepository) Archive(ctx context.Context, id uuid.UUID) error {
	return r.DB().WithContext(ctx).
		Model(&models.Post{}).
		Where("id = ?", id).
		Update("status", models.PostStatusArchived).Error
}

func (r *PostRepository) IncrementViews(ctx context.Context, id uuid.UUID) error {
	return r.DB().WithContext(ctx).
		Model(&models.Post{}).
		Where("id = ?", id).
		UpdateColumn("view_count", gorm.Expr("view_count + ?", 1)).Error
}

func (r *PostRepository) IncrementLikes(ctx context.Context, id uuid.UUID) error {
	return r.DB().WithContext(ctx).
		Model(&models.Post{}).
		Where("id = ?", id).
		UpdateColumn("like_count", gorm.Expr("like_count + ?", 1)).Error
}

func (r *PostRepository) DecrementLikes(ctx context.Context, id uuid.UUID) error {
	return r.DB().WithContext(ctx).
		Model(&models.Post{}).
		Where("id = ? AND like_count > 0", id).
		UpdateColumn("like_count", gorm.Expr("like_count - ?", 1)).Error
}

func (r *PostRepository) FindTrending(ctx context.Context, days, limit int) ([]models.Post, error) {
	var posts []models.Post
	cutoff := time.Now().AddDate(0, 0, -days)

	result := r.DB().WithContext(ctx).
		Preload("Author").
		Where("status = ? AND published_at >= ?", models.PostStatusPublished, cutoff).
		Order("(view_count + like_count * 5) DESC").
		Limit(limit).
		Find(&posts)
	if result.Error != nil {
		return nil, result.Error
	}

	return posts, nil
}

func (r *PostRepository) Search(ctx context.Context, query string, page, limit int) (*pagination.PaginatedResult[models.Post], error) {
	var posts []models.Post
	var total int64

	p := pagination.NewPagination(page, limit)
	searchPattern := "%" + query + "%"

	baseQuery := r.DB().WithContext(ctx).Model(&models.Post{}).
		Where("status = ? AND (title ILIKE ? OR content ILIKE ?)", models.PostStatusPublished, searchPattern, searchPattern)

	if err := baseQuery.Count(&total).Error; err != nil {
		return nil, err
	}

	result := baseQuery.
		Preload("Author").
		Order("published_at DESC").
		Offset(p.Offset()).
		Limit(p.Limit).
		Find(&posts)
	if result.Error != nil {
		return nil, result.Error
	}

	p.Calculate(total)

	return &pagination.PaginatedResult[models.Post]{
		Data:       posts,
		Pagination: *p,
	}, nil
}

type PostStats struct {
	Status     models.PostStatus `json:"status"`
	Count      int64             `json:"count"`
	TotalViews int64             `json:"total_views"`
	TotalLikes int64             `json:"total_likes"`
}

func (r *PostRepository) GetStats(ctx context.Context) ([]PostStats, error) {
	var stats []PostStats
	result := r.DB().WithContext(ctx).
		Model(&models.Post{}).
		Select("status, COUNT(*) as count, SUM(view_count) as total_views, SUM(like_count) as total_likes").
		Group("status").
		Scan(&stats)
	return stats, result.Error
}
```

## User Service

```go
// internal/services/user.go
package services

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"myapp/internal/models"
	"myapp/internal/repositories"
	"myapp/pkg/pagination"
)

var (
	ErrUserNotFound      = errors.New("user not found")
	ErrEmailExists       = errors.New("email already exists")
	ErrUsernameExists    = errors.New("username already exists")
	ErrInvalidPassword   = errors.New("invalid password")
	ErrUserNotActive     = errors.New("user is not active")
)

type UserService struct {
	repo *repositories.UserRepository
}

func NewUserService(repo *repositories.UserRepository) *UserService {
	return &UserService{repo: repo}
}

type CreateUserInput struct {
	Email       string
	Username    string
	Password    string
	Role        models.UserRole
	DisplayName *string
}

func (s *UserService) CreateUser(ctx context.Context, input CreateUserInput) (*models.User, error) {
	// Check if email or username exists
	existing, err := s.repo.FindByEmailOrUsername(ctx, input.Email, input.Username)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		if existing.Email == input.Email {
			return nil, ErrEmailExists
		}
		return nil, ErrUsernameExists
	}

	user := &models.User{
		Email:       input.Email,
		Username:    input.Username,
		Role:        input.Role,
		DisplayName: input.DisplayName,
		IsActive:    true,
		Settings: models.Settings{
			Theme:              "system",
			Language:           "en",
			EmailNotifications: true,
		},
	}

	if err := user.SetPassword(input.Password); err != nil {
		return nil, err
	}

	if err := s.repo.Create(ctx, user); err != nil {
		return nil, err
	}

	return user, nil
}

func (s *UserService) GetUser(ctx context.Context, id uuid.UUID) (*models.User, error) {
	user, err := s.repo.FindByID(ctx, id)
	if err != nil {
		if errors.Is(err, repositories.ErrNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return user, nil
}

func (s *UserService) GetByEmail(ctx context.Context, email string) (*models.User, error) {
	user, err := s.repo.FindByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, repositories.ErrNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return user, nil
}

type UpdateUserInput struct {
	Username    *string
	DisplayName *string
	Bio         *string
	AvatarURL   *string
	Location    *string
	Settings    *models.Settings
}

func (s *UserService) UpdateUser(ctx context.Context, id uuid.UUID, input UpdateUserInput) (*models.User, error) {
	user, err := s.repo.FindByID(ctx, id)
	if err != nil {
		if errors.Is(err, repositories.ErrNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}

	if input.Username != nil {
		// Check if username is taken by another user
		existing, _ := s.repo.FindByUsername(ctx, *input.Username)
		if existing != nil && existing.ID != id {
			return nil, ErrUsernameExists
		}
		user.Username = *input.Username
	}
	if input.DisplayName != nil {
		user.DisplayName = input.DisplayName
	}
	if input.Bio != nil {
		user.Bio = input.Bio
	}
	if input.AvatarURL != nil {
		user.AvatarURL = input.AvatarURL
	}
	if input.Location != nil {
		user.Location = input.Location
	}
	if input.Settings != nil {
		user.Settings = *input.Settings
	}

	if err := s.repo.Update(ctx, user); err != nil {
		return nil, err
	}

	return user, nil
}

func (s *UserService) DeleteUser(ctx context.Context, id uuid.UUID) error {
	if err := s.repo.Delete(ctx, id); err != nil {
		if errors.Is(err, repositories.ErrNotFound) {
			return ErrUserNotFound
		}
		return err
	}
	return nil
}

func (s *UserService) Authenticate(ctx context.Context, email, password string) (*models.User, error) {
	user, err := s.repo.FindByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, repositories.ErrNotFound) {
			return nil, ErrInvalidPassword
		}
		return nil, err
	}

	if !user.CheckPassword(password) {
		return nil, ErrInvalidPassword
	}

	if !user.IsActive {
		return nil, ErrUserNotActive
	}

	// Update last login
	_ = s.repo.UpdateLastLogin(ctx, user.ID)

	return user, nil
}

func (s *UserService) SearchUsers(ctx context.Context, query string, page, limit int) (*pagination.PaginatedResult[models.User], error) {
	return s.repo.Search(ctx, query, page, limit)
}
```

## HTTP Handlers

```go
// internal/handlers/user.go
package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"myapp/internal/models"
	"myapp/internal/services"
)

type UserHandler struct {
	service *services.UserService
}

func NewUserHandler(service *services.UserService) *UserHandler {
	return &UserHandler{service: service}
}

type CreateUserRequest struct {
	Email       string `json:"email"`
	Username    string `json:"username"`
	Password    string `json:"password"`
	Role        string `json:"role"`
	DisplayName string `json:"display_name"`
}

func (h *UserHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req CreateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	role := models.UserRole(req.Role)
	if role == "" {
		role = models.UserRoleUser
	}

	var displayName *string
	if req.DisplayName != "" {
		displayName = &req.DisplayName
	}

	user, err := h.service.CreateUser(r.Context(), services.CreateUserInput{
		Email:       req.Email,
		Username:    req.Username,
		Password:    req.Password,
		Role:        role,
		DisplayName: displayName,
	})
	if err != nil {
		switch err {
		case services.ErrEmailExists:
			http.Error(w, "Email already exists", http.StatusConflict)
		case services.ErrUsernameExists:
			http.Error(w, "Username already exists", http.StatusConflict)
		default:
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(user)
}

func (h *UserHandler) Get(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	user, err := h.service.GetUser(r.Context(), id)
	if err != nil {
		if err == services.ErrUserNotFound {
			http.Error(w, "User not found", http.StatusNotFound)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

type UpdateUserRequest struct {
	Username    *string          `json:"username"`
	DisplayName *string          `json:"display_name"`
	Bio         *string          `json:"bio"`
	AvatarURL   *string          `json:"avatar_url"`
	Location    *string          `json:"location"`
	Settings    *models.Settings `json:"settings"`
}

func (h *UserHandler) Update(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	var req UpdateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	user, err := h.service.UpdateUser(r.Context(), id, services.UpdateUserInput{
		Username:    req.Username,
		DisplayName: req.DisplayName,
		Bio:         req.Bio,
		AvatarURL:   req.AvatarURL,
		Location:    req.Location,
		Settings:    req.Settings,
	})
	if err != nil {
		switch err {
		case services.ErrUserNotFound:
			http.Error(w, "User not found", http.StatusNotFound)
		case services.ErrUsernameExists:
			http.Error(w, "Username already exists", http.StatusConflict)
		default:
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

func (h *UserHandler) Delete(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	if err := h.service.DeleteUser(r.Context(), id); err != nil {
		if err == services.ErrUserNotFound {
			http.Error(w, "User not found", http.StatusNotFound)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *UserHandler) Search(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")
	if query == "" {
		http.Error(w, "Search query required", http.StatusBadRequest)
		return
	}

	page := 1
	limit := 20
	// Parse page and limit from query params...

	result, err := h.service.SearchUsers(r.Context(), query, page, limit)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

// Register routes
func (h *UserHandler) RegisterRoutes(r chi.Router) {
	r.Route("/users", func(r chi.Router) {
		r.Post("/", h.Create)
		r.Get("/search", h.Search)
		r.Get("/{id}", h.Get)
		r.Patch("/{id}", h.Update)
		r.Delete("/{id}", h.Delete)
	})
}
```

## Migrations

```go
// internal/database/migrations.go
package database

import (
	"log"

	"gorm.io/gorm"
	"myapp/internal/models"
)

func AutoMigrate(db *gorm.DB) error {
	log.Println("Running auto migrations...")

	err := db.AutoMigrate(
		&models.User{},
		&models.Post{},
	)
	if err != nil {
		return err
	}

	log.Println("Migrations completed successfully")
	return nil
}

// CreateIndexes creates additional indexes
func CreateIndexes(db *gorm.DB) error {
	// Create composite indexes
	queries := []string{
		`CREATE INDEX IF NOT EXISTS idx_posts_status_published_at ON posts (status, published_at DESC)`,
		`CREATE INDEX IF NOT EXISTS idx_users_role_is_active ON users (role, is_active)`,
	}

	for _, query := range queries {
		if err := db.Exec(query).Error; err != nil {
			return err
		}
	}

	return nil
}
```

## Main Entry Point

```go
// cmd/server/main.go
package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/joho/godotenv"
	"myapp/internal/database"
	"myapp/internal/handlers"
	"myapp/internal/repositories"
	"myapp/internal/services"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	// Connect to database
	db, err := database.Connect(nil)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer database.Close()

	// Run migrations
	if err := database.AutoMigrate(db); err != nil {
		log.Fatal("Failed to run migrations:", err)
	}

	// Create indexes
	if err := database.CreateIndexes(db); err != nil {
		log.Println("Warning: Failed to create indexes:", err)
	}

	// Initialize repositories
	userRepo := repositories.NewUserRepository(db)
	postRepo := repositories.NewPostRepository(db)

	// Initialize services
	userService := services.NewUserService(userRepo)
	_ = postRepo // Use in post service

	// Initialize handlers
	userHandler := handlers.NewUserHandler(userService)

	// Setup router
	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(30 * time.Second))

	// Health check
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		if err := database.HealthCheck(); err != nil {
			http.Error(w, "unhealthy", http.StatusServiceUnavailable)
			return
		}
		w.Write([]byte("healthy"))
	})

	// Register routes
	r.Route("/api/v1", func(r chi.Router) {
		userHandler.RegisterRoutes(r)
	})

	// Start server
	server := &http.Server{
		Addr:    ":8080",
		Handler: r,
	}

	// Graceful shutdown
	go func() {
		log.Println("Server starting on :8080")
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal("Server error:", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown:", err)
	}

	log.Println("Server exited properly")
}
```

## Testing

```go
// internal/repositories/user_test.go
package repositories

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"myapp/internal/models"
)

func setupTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)

	err = db.AutoMigrate(&models.User{})
	require.NoError(t, err)

	return db
}

func TestUserRepository_Create(t *testing.T) {
	db := setupTestDB(t)
	repo := NewUserRepository(db)
	ctx := context.Background()

	user := &models.User{
		Email:    "test@example.com",
		Username: "testuser",
		Role:     models.UserRoleUser,
	}
	user.SetPassword("password123")

	err := repo.Create(ctx, user)
	assert.NoError(t, err)
	assert.NotEmpty(t, user.ID)
}

func TestUserRepository_FindByEmail(t *testing.T) {
	db := setupTestDB(t)
	repo := NewUserRepository(db)
	ctx := context.Background()

	user := &models.User{
		Email:    "test@example.com",
		Username: "testuser",
		Role:     models.UserRoleUser,
	}
	user.SetPassword("password123")
	repo.Create(ctx, user)

	found, err := repo.FindByEmail(ctx, "test@example.com")
	assert.NoError(t, err)
	assert.Equal(t, user.Email, found.Email)
}

func TestUserRepository_FindByEmail_NotFound(t *testing.T) {
	db := setupTestDB(t)
	repo := NewUserRepository(db)
	ctx := context.Background()

	_, err := repo.FindByEmail(ctx, "notfound@example.com")
	assert.ErrorIs(t, err, ErrNotFound)
}
```

## CLAUDE.md Integration

```markdown
# GORM Integration

## Commands

```bash
# Run the server
go run cmd/server/main.go

# Run tests
go test ./...

# Run tests with coverage
go test -cover ./...
```

## Repository Pattern

```go
// Get user by ID
user, err := userRepo.FindByID(ctx, id)

// Create user
err := userRepo.Create(ctx, &user)

// Paginated query
result, err := userRepo.FindAll(ctx, page, limit)
```

## Transactions

```go
err := db.Transaction(func(tx *gorm.DB) error {
    // All operations use tx
    return nil
})
```

## Eager Loading

```go
db.Preload("Author").Find(&posts)
db.Joins("Author").Find(&posts)
```

## Soft Delete

All models with `gorm.DeletedAt` field support soft delete:

```go
repo.Delete(ctx, id)           // Soft delete
repo.HardDelete(ctx, id)       // Permanent delete
```
```

## AI Suggestions

1. **Add database connection retries** - Implement exponential backoff for connection failures
2. **Create query builder** - Build type-safe query builder for complex filters
3. **Implement caching layer** - Add Redis caching for frequently accessed data
4. **Add request tracing** - Integrate OpenTelemetry for distributed tracing
5. **Create database metrics** - Export Prometheus metrics for query performance
6. **Implement bulk operations** - Add batch insert/update with chunking
7. **Add audit logging** - Use GORM hooks for automatic audit trails
8. **Create migration tool** - Use golang-migrate for versioned migrations
9. **Implement read replicas** - Configure separate connections for read/write
10. **Add connection pooling monitoring** - Track pool usage and adjust settings
