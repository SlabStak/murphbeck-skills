# HTMX Application Template

## Overview
Hypermedia-driven web application using HTMX with a Go/Fiber backend, server-rendered HTML templates, minimal JavaScript, progressive enhancement, and real-time updates via SSE. Demonstrates modern hypermedia patterns for building interactive web applications.

## Quick Start
```bash
# Create project directory
mkdir my-htmx-app && cd my-htmx-app

# Initialize Go module
go mod init my-htmx-app

# Install dependencies
go get github.com/gofiber/fiber/v2
go get github.com/gofiber/template/html/v2
go get github.com/joho/godotenv
go get github.com/google/uuid
go get golang.org/x/crypto/bcrypt
go get github.com/go-playground/validator/v10

# Create directory structure
mkdir -p cmd/server internal/{handlers,middleware,models,services,templates}
mkdir -p internal/templates/{layouts,partials,pages,components}
mkdir -p static/{css,js,images}

# Development (with air for hot reload)
go install github.com/cosmtrek/air@latest
air

# Build
go build -o bin/server cmd/server/main.go
```

## Project Structure
```
my-htmx-app/
├── cmd/
│   └── server/
│       └── main.go
├── internal/
│   ├── config/
│   │   └── config.go
│   ├── handlers/
│   │   ├── auth.go
│   │   ├── dashboard.go
│   │   ├── tasks.go
│   │   └── sse.go
│   ├── middleware/
│   │   ├── auth.go
│   │   ├── logger.go
│   │   └── htmx.go
│   ├── models/
│   │   ├── user.go
│   │   ├── task.go
│   │   └── session.go
│   ├── services/
│   │   ├── auth.go
│   │   ├── task.go
│   │   └── session.go
│   └── templates/
│       ├── layouts/
│       │   ├── base.html
│       │   └── auth.html
│       ├── partials/
│       │   ├── header.html
│       │   ├── sidebar.html
│       │   ├── footer.html
│       │   └── toast.html
│       ├── pages/
│       │   ├── home.html
│       │   ├── login.html
│       │   ├── register.html
│       │   ├── dashboard.html
│       │   └── tasks.html
│       └── components/
│           ├── task-list.html
│           ├── task-item.html
│           ├── task-form.html
│           ├── button.html
│           └── input.html
├── static/
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   └── app.js
│   └── images/
├── .air.toml
├── .env
├── go.mod
└── go.sum
```

## Main Server
```go
// cmd/server/main.go
package main

import (
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/compress"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/gofiber/template/html/v2"
	"github.com/joho/godotenv"

	"my-htmx-app/internal/config"
	"my-htmx-app/internal/handlers"
	"my-htmx-app/internal/middleware"
	"my-htmx-app/internal/services"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	cfg := config.Load()

	// Initialize template engine
	engine := html.New("./internal/templates", ".html")
	engine.Reload(cfg.IsDev)
	engine.AddFunc("safe", func(s string) string { return s })

	// Create Fiber app
	app := fiber.New(fiber.Config{
		Views:       engine,
		ViewsLayout: "layouts/base",
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			code := fiber.StatusInternalServerError
			if e, ok := err.(*fiber.Error); ok {
				code = e.Code
			}

			if middleware.IsHTMX(c) {
				return c.Status(code).Render("partials/error", fiber.Map{
					"Error": err.Error(),
				}, "")
			}

			return c.Status(code).Render("pages/error", fiber.Map{
				"Error": err.Error(),
				"Code":  code,
			})
		},
	})

	// Middleware
	app.Use(recover.New())
	app.Use(logger.New())
	app.Use(compress.New())
	app.Use(cors.New())

	// Static files
	app.Static("/static", "./static")

	// Initialize services
	sessionService := services.NewSessionService()
	authService := services.NewAuthService(sessionService)
	taskService := services.NewTaskService()

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(authService)
	dashboardHandler := handlers.NewDashboardHandler()
	taskHandler := handlers.NewTaskHandler(taskService)
	sseHandler := handlers.NewSSEHandler()

	// Auth middleware
	authMiddleware := middleware.NewAuthMiddleware(sessionService)

	// Routes
	setupRoutes(app, authHandler, dashboardHandler, taskHandler, sseHandler, authMiddleware)

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	log.Printf("Server starting on port %s", port)
	log.Fatal(app.Listen(":" + port))
}

func setupRoutes(
	app *fiber.App,
	auth *handlers.AuthHandler,
	dashboard *handlers.DashboardHandler,
	task *handlers.TaskHandler,
	sse *handlers.SSEHandler,
	authMW fiber.Handler,
) {
	// Public routes
	app.Get("/", func(c *fiber.Ctx) error {
		return c.Render("pages/home", fiber.Map{
			"Title": "Home",
		})
	})

	app.Get("/login", auth.LoginPage)
	app.Post("/login", auth.Login)
	app.Get("/register", auth.RegisterPage)
	app.Post("/register", auth.Register)
	app.Post("/logout", auth.Logout)

	// Protected routes
	protected := app.Group("/", authMW)
	protected.Get("/dashboard", dashboard.Index)

	// Tasks
	tasks := protected.Group("/tasks")
	tasks.Get("/", task.List)
	tasks.Post("/", task.Create)
	tasks.Get("/:id", task.Get)
	tasks.Put("/:id", task.Update)
	tasks.Delete("/:id", task.Delete)
	tasks.Post("/:id/toggle", task.Toggle)

	// SSE
	protected.Get("/sse", sse.Stream)
}
```

## Configuration
```go
// internal/config/config.go
package config

import (
	"os"
	"strconv"
)

type Config struct {
	Port      string
	IsDev     bool
	SecretKey string
	DBUrl     string
}

func Load() *Config {
	isDev, _ := strconv.ParseBool(os.Getenv("DEV_MODE"))

	return &Config{
		Port:      getEnv("PORT", "3000"),
		IsDev:     isDev,
		SecretKey: getEnv("SECRET_KEY", "your-secret-key"),
		DBUrl:     getEnv("DATABASE_URL", ""),
	}
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
```

## Models
```go
// internal/models/user.go
package models

import (
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type User struct {
	ID           string    `json:"id"`
	Email        string    `json:"email"`
	Name         string    `json:"name"`
	PasswordHash string    `json:"-"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

func NewUser(email, name, password string) (*User, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	return &User{
		ID:           uuid.New().String(),
		Email:        email,
		Name:         name,
		PasswordHash: string(hash),
		CreatedAt:    now,
		UpdatedAt:    now,
	}, nil
}

func (u *User) CheckPassword(password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password))
	return err == nil
}

// internal/models/task.go
package models

import (
	"time"

	"github.com/google/uuid"
)

type Task struct {
	ID          string    `json:"id"`
	UserID      string    `json:"user_id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Completed   bool      `json:"completed"`
	Priority    string    `json:"priority"` // low, medium, high
	DueDate     *time.Time `json:"due_date,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func NewTask(userID, title, description, priority string, dueDate *time.Time) *Task {
	now := time.Now()
	return &Task{
		ID:          uuid.New().String(),
		UserID:      userID,
		Title:       title,
		Description: description,
		Priority:    priority,
		DueDate:     dueDate,
		Completed:   false,
		CreatedAt:   now,
		UpdatedAt:   now,
	}
}
```

## Middleware
```go
// internal/middleware/htmx.go
package middleware

import "github.com/gofiber/fiber/v2"

// IsHTMX checks if the request is from HTMX
func IsHTMX(c *fiber.Ctx) bool {
	return c.Get("HX-Request") == "true"
}

// IsBoosted checks if the request is boosted
func IsBoosted(c *fiber.Ctx) bool {
	return c.Get("HX-Boosted") == "true"
}

// GetTrigger returns the HTMX trigger element ID
func GetTrigger(c *fiber.Ctx) string {
	return c.Get("HX-Trigger")
}

// GetTarget returns the HTMX target element ID
func GetTarget(c *fiber.Ctx) string {
	return c.Get("HX-Target")
}

// SetRetarget sets the response target
func SetRetarget(c *fiber.Ctx, target string) {
	c.Set("HX-Retarget", target)
}

// SetReswap sets the swap method
func SetReswap(c *fiber.Ctx, swap string) {
	c.Set("HX-Reswap", swap)
}

// SetTrigger sets a client-side event trigger
func SetTrigger(c *fiber.Ctx, event string) {
	c.Set("HX-Trigger", event)
}

// SetRedirect sets a client-side redirect
func SetRedirect(c *fiber.Ctx, url string) {
	c.Set("HX-Redirect", url)
}

// SetRefresh triggers a full page refresh
func SetRefresh(c *fiber.Ctx) {
	c.Set("HX-Refresh", "true")
}

// internal/middleware/auth.go
package middleware

import (
	"my-htmx-app/internal/services"

	"github.com/gofiber/fiber/v2"
)

func NewAuthMiddleware(sessionService *services.SessionService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		sessionID := c.Cookies("session_id")
		if sessionID == "" {
			if IsHTMX(c) {
				SetRedirect(c, "/login")
				return c.SendStatus(fiber.StatusUnauthorized)
			}
			return c.Redirect("/login")
		}

		session, err := sessionService.Get(sessionID)
		if err != nil || session == nil {
			if IsHTMX(c) {
				SetRedirect(c, "/login")
				return c.SendStatus(fiber.StatusUnauthorized)
			}
			return c.Redirect("/login")
		}

		c.Locals("user", session.User)
		c.Locals("session", session)
		return c.Next()
	}
}
```

## Handlers
```go
// internal/handlers/auth.go
package handlers

import (
	"time"

	"my-htmx-app/internal/middleware"
	"my-htmx-app/internal/services"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
)

type AuthHandler struct {
	authService *services.AuthService
	validate    *validator.Validate
}

func NewAuthHandler(authService *services.AuthService) *AuthHandler {
	return &AuthHandler{
		authService: authService,
		validate:    validator.New(),
	}
}

type LoginInput struct {
	Email    string `form:"email" validate:"required,email"`
	Password string `form:"password" validate:"required,min=8"`
}

type RegisterInput struct {
	Name            string `form:"name" validate:"required,min=2"`
	Email           string `form:"email" validate:"required,email"`
	Password        string `form:"password" validate:"required,min=8"`
	ConfirmPassword string `form:"confirm_password" validate:"required,eqfield=Password"`
}

func (h *AuthHandler) LoginPage(c *fiber.Ctx) error {
	return c.Render("pages/login", fiber.Map{
		"Title": "Login",
	}, "layouts/auth")
}

func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var input LoginInput
	if err := c.BodyParser(&input); err != nil {
		return h.renderError(c, "Invalid input")
	}

	if err := h.validate.Struct(input); err != nil {
		return h.renderError(c, "Please check your input")
	}

	session, err := h.authService.Login(input.Email, input.Password)
	if err != nil {
		return h.renderError(c, "Invalid email or password")
	}

	c.Cookie(&fiber.Cookie{
		Name:     "session_id",
		Value:    session.ID,
		Expires:  time.Now().Add(24 * time.Hour * 30),
		HTTPOnly: true,
		Secure:   true,
		SameSite: "Lax",
	})

	middleware.SetRedirect(c, "/dashboard")
	return c.SendStatus(fiber.StatusOK)
}

func (h *AuthHandler) RegisterPage(c *fiber.Ctx) error {
	return c.Render("pages/register", fiber.Map{
		"Title": "Register",
	}, "layouts/auth")
}

func (h *AuthHandler) Register(c *fiber.Ctx) error {
	var input RegisterInput
	if err := c.BodyParser(&input); err != nil {
		return h.renderError(c, "Invalid input")
	}

	if err := h.validate.Struct(input); err != nil {
		return h.renderError(c, "Please check your input")
	}

	session, err := h.authService.Register(input.Email, input.Name, input.Password)
	if err != nil {
		return h.renderError(c, err.Error())
	}

	c.Cookie(&fiber.Cookie{
		Name:     "session_id",
		Value:    session.ID,
		Expires:  time.Now().Add(24 * time.Hour * 30),
		HTTPOnly: true,
		Secure:   true,
		SameSite: "Lax",
	})

	middleware.SetRedirect(c, "/dashboard")
	return c.SendStatus(fiber.StatusOK)
}

func (h *AuthHandler) Logout(c *fiber.Ctx) error {
	sessionID := c.Cookies("session_id")
	if sessionID != "" {
		h.authService.Logout(sessionID)
	}

	c.Cookie(&fiber.Cookie{
		Name:     "session_id",
		Value:    "",
		Expires:  time.Now().Add(-1 * time.Hour),
		HTTPOnly: true,
	})

	middleware.SetRedirect(c, "/login")
	return c.SendStatus(fiber.StatusOK)
}

func (h *AuthHandler) renderError(c *fiber.Ctx, message string) error {
	return c.Render("partials/toast", fiber.Map{
		"Type":    "error",
		"Message": message,
	}, "")
}

// internal/handlers/tasks.go
package handlers

import (
	"my-htmx-app/internal/middleware"
	"my-htmx-app/internal/models"
	"my-htmx-app/internal/services"

	"github.com/gofiber/fiber/v2"
)

type TaskHandler struct {
	taskService *services.TaskService
}

func NewTaskHandler(taskService *services.TaskService) *TaskHandler {
	return &TaskHandler{taskService: taskService}
}

func (h *TaskHandler) List(c *fiber.Ctx) error {
	user := c.Locals("user").(*models.User)
	tasks := h.taskService.GetByUser(user.ID)

	// Return partial for HTMX requests
	if middleware.IsHTMX(c) {
		return c.Render("components/task-list", fiber.Map{
			"Tasks": tasks,
		}, "")
	}

	return c.Render("pages/tasks", fiber.Map{
		"Title": "Tasks",
		"User":  user,
		"Tasks": tasks,
	})
}

func (h *TaskHandler) Create(c *fiber.Ctx) error {
	user := c.Locals("user").(*models.User)

	title := c.FormValue("title")
	description := c.FormValue("description")
	priority := c.FormValue("priority", "medium")

	if title == "" {
		return c.Status(fiber.StatusBadRequest).Render("partials/toast", fiber.Map{
			"Type":    "error",
			"Message": "Title is required",
		}, "")
	}

	task := h.taskService.Create(user.ID, title, description, priority, nil)

	// Trigger toast and return new task item
	middleware.SetTrigger(c, `{"showToast": {"type": "success", "message": "Task created"}}`)

	return c.Render("components/task-item", fiber.Map{
		"Task": task,
	}, "")
}

func (h *TaskHandler) Get(c *fiber.Ctx) error {
	id := c.Params("id")
	task := h.taskService.Get(id)

	if task == nil {
		return fiber.NewError(fiber.StatusNotFound, "Task not found")
	}

	return c.Render("components/task-item", fiber.Map{
		"Task": task,
	}, "")
}

func (h *TaskHandler) Update(c *fiber.Ctx) error {
	id := c.Params("id")
	task := h.taskService.Get(id)

	if task == nil {
		return fiber.NewError(fiber.StatusNotFound, "Task not found")
	}

	task.Title = c.FormValue("title", task.Title)
	task.Description = c.FormValue("description", task.Description)
	task.Priority = c.FormValue("priority", task.Priority)

	h.taskService.Update(task)

	middleware.SetTrigger(c, `{"showToast": {"type": "success", "message": "Task updated"}}`)

	return c.Render("components/task-item", fiber.Map{
		"Task": task,
	}, "")
}

func (h *TaskHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")
	h.taskService.Delete(id)

	middleware.SetTrigger(c, `{"showToast": {"type": "success", "message": "Task deleted"}}`)

	return c.SendString("")
}

func (h *TaskHandler) Toggle(c *fiber.Ctx) error {
	id := c.Params("id")
	task := h.taskService.Get(id)

	if task == nil {
		return fiber.NewError(fiber.StatusNotFound, "Task not found")
	}

	task.Completed = !task.Completed
	h.taskService.Update(task)

	return c.Render("components/task-item", fiber.Map{
		"Task": task,
	}, "")
}
```

## SSE Handler
```go
// internal/handlers/sse.go
package handlers

import (
	"bufio"
	"encoding/json"
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/valyala/fasthttp"
)

type SSEHandler struct {
	clients map[string]chan string
}

func NewSSEHandler() *SSEHandler {
	return &SSEHandler{
		clients: make(map[string]chan string),
	}
}

func (h *SSEHandler) Stream(c *fiber.Ctx) error {
	c.Set("Content-Type", "text/event-stream")
	c.Set("Cache-Control", "no-cache")
	c.Set("Connection", "keep-alive")
	c.Set("Transfer-Encoding", "chunked")

	userID := c.Locals("user").(*models.User).ID
	clientChan := make(chan string, 10)
	h.clients[userID] = clientChan

	c.Context().SetBodyStreamWriter(fasthttp.StreamWriter(func(w *bufio.Writer) {
		// Send initial connection event
		fmt.Fprintf(w, "event: connected\ndata: {\"status\": \"connected\"}\n\n")
		w.Flush()

		// Keep-alive ticker
		ticker := time.NewTicker(30 * time.Second)
		defer ticker.Stop()

		for {
			select {
			case msg := <-clientChan:
				fmt.Fprintf(w, "data: %s\n\n", msg)
				w.Flush()
			case <-ticker.C:
				fmt.Fprintf(w, ": keepalive\n\n")
				w.Flush()
			}
		}
	}))

	delete(h.clients, userID)
	return nil
}

func (h *SSEHandler) Broadcast(event string, data interface{}) {
	payload, _ := json.Marshal(map[string]interface{}{
		"event": event,
		"data":  data,
	})

	for _, client := range h.clients {
		select {
		case client <- string(payload):
		default:
			// Client buffer full, skip
		}
	}
}

func (h *SSEHandler) SendToUser(userID, event string, data interface{}) {
	if client, ok := h.clients[userID]; ok {
		payload, _ := json.Marshal(map[string]interface{}{
			"event": event,
			"data":  data,
		})
		select {
		case client <- string(payload):
		default:
		}
	}
}
```

## Templates

### Base Layout
```html
<!-- internal/templates/layouts/base.html -->
<!DOCTYPE html>
<html lang="en" class="h-full">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{.Title}} - MyApp</title>
    <script src="https://unpkg.com/htmx.org@1.9.10"></script>
    <script src="https://unpkg.com/htmx.org/dist/ext/sse.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="/static/css/styles.css">
</head>
<body class="h-full bg-gray-50 dark:bg-gray-900" hx-boost="true">
    <div id="app" class="min-h-full">
        {{template "partials/header" .}}

        <div class="flex">
            {{if .User}}
            {{template "partials/sidebar" .}}
            {{end}}

            <main class="flex-1 p-6 {{if .User}}ml-64{{end}}">
                {{embed}}
            </main>
        </div>
    </div>

    <!-- Toast container -->
    <div id="toast-container" class="fixed top-4 right-4 z-50 space-y-2"></div>

    <!-- SSE connection for logged-in users -->
    {{if .User}}
    <div hx-ext="sse" sse-connect="/sse" sse-swap="message">
        <div id="sse-notifications" sse-swap="notification" hx-swap="beforeend:#toast-container"></div>
    </div>
    {{end}}

    <script src="/static/js/app.js"></script>
</body>
</html>
```

### Task Components
```html
<!-- internal/templates/components/task-list.html -->
<div id="task-list" class="space-y-4">
    {{range .Tasks}}
    {{template "components/task-item" dict "Task" .}}
    {{else}}
    <div class="text-center py-12 text-gray-500">
        <p>No tasks yet. Create one to get started!</p>
    </div>
    {{end}}
</div>

<!-- internal/templates/components/task-item.html -->
<div id="task-{{.Task.ID}}" class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center gap-4 group">
    <button
        hx-post="/tasks/{{.Task.ID}}/toggle"
        hx-target="#task-{{.Task.ID}}"
        hx-swap="outerHTML"
        class="flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center
               {{if .Task.Completed}}bg-green-500 border-green-500{{else}}border-gray-300 hover:border-green-400{{end}}"
    >
        {{if .Task.Completed}}
        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
        </svg>
        {{end}}
    </button>

    <div class="flex-1 min-w-0">
        <h3 class="font-medium {{if .Task.Completed}}line-through text-gray-400{{else}}text-gray-900 dark:text-white{{end}}">
            {{.Task.Title}}
        </h3>
        {{if .Task.Description}}
        <p class="text-sm text-gray-500 truncate">{{.Task.Description}}</p>
        {{end}}
    </div>

    <span class="px-2 py-1 text-xs font-medium rounded-full
        {{if eq .Task.Priority "high"}}bg-red-100 text-red-700
        {{else if eq .Task.Priority "medium"}}bg-yellow-100 text-yellow-700
        {{else}}bg-gray-100 text-gray-700{{end}}">
        {{.Task.Priority}}
    </span>

    <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
            hx-get="/tasks/{{.Task.ID}}/edit"
            hx-target="#modal-container"
            class="p-2 text-gray-400 hover:text-gray-600"
        >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
            </svg>
        </button>
        <button
            hx-delete="/tasks/{{.Task.ID}}"
            hx-target="#task-{{.Task.ID}}"
            hx-swap="outerHTML swap:1s"
            hx-confirm="Are you sure you want to delete this task?"
            class="p-2 text-gray-400 hover:text-red-600"
        >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
        </button>
    </div>
</div>

<!-- internal/templates/components/task-form.html -->
<form
    hx-post="/tasks"
    hx-target="#task-list"
    hx-swap="afterbegin"
    hx-on::after-request="this.reset()"
    class="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
>
    <h2 class="text-lg font-semibold mb-4">Create New Task</h2>

    <div class="space-y-4">
        <div>
            <label for="title" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title
            </label>
            <input
                type="text"
                id="title"
                name="title"
                required
                class="w-full h-10 px-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="What needs to be done?"
            >
        </div>

        <div>
            <label for="description" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description (optional)
            </label>
            <textarea
                id="description"
                name="description"
                rows="2"
                class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add more details..."
            ></textarea>
        </div>

        <div>
            <label for="priority" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Priority
            </label>
            <select
                id="priority"
                name="priority"
                class="w-full h-10 px-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
                <option value="low">Low</option>
                <option value="medium" selected>Medium</option>
                <option value="high">High</option>
            </select>
        </div>

        <button
            type="submit"
            class="w-full h-10 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
            Create Task
        </button>
    </div>
</form>
```

### Login Page
```html
<!-- internal/templates/pages/login.html -->
<div class="min-h-screen flex items-center justify-center py-12 px-4">
    <div class="max-w-md w-full space-y-8">
        <div class="text-center">
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Welcome back</h1>
            <p class="mt-2 text-gray-600 dark:text-gray-400">
                Sign in to your account
            </p>
        </div>

        <div id="login-form-container">
            <form
                hx-post="/login"
                hx-target="#login-form-container"
                hx-swap="innerHTML"
                class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 space-y-6"
            >
                <div>
                    <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        class="w-full h-10 px-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="you@example.com"
                    >
                </div>

                <div>
                    <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Password
                    </label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        required
                        minlength="8"
                        class="w-full h-10 px-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="••••••••"
                    >
                </div>

                <div class="flex items-center justify-between">
                    <label class="flex items-center gap-2">
                        <input type="checkbox" class="rounded border-gray-300">
                        <span class="text-sm">Remember me</span>
                    </label>
                    <a href="/forgot-password" class="text-sm text-blue-600 hover:underline">
                        Forgot password?
                    </a>
                </div>

                <button
                    type="submit"
                    class="w-full h-10 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors htmx-indicator:opacity-50"
                >
                    <span class="htmx-indicator">
                        <svg class="animate-spin h-5 w-5 inline mr-2" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                    </span>
                    Sign in
                </button>
            </form>
        </div>

        <p class="text-center text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?
            <a href="/register" class="text-blue-600 hover:underline">Sign up</a>
        </p>
    </div>
</div>
```

## Client-Side JavaScript
```javascript
// static/js/app.js

// Handle HTMX events
document.body.addEventListener('htmx:configRequest', (e) => {
  // Add CSRF token if needed
  // e.detail.headers['X-CSRF-Token'] = document.querySelector('meta[name="csrf-token"]').content;
});

document.body.addEventListener('htmx:responseError', (e) => {
  console.error('HTMX Error:', e.detail);
  showToast('error', 'Something went wrong. Please try again.');
});

// Toast notifications
document.body.addEventListener('showToast', (e) => {
  const { type, message } = e.detail;
  showToast(type, message);
});

function showToast(type, message) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');

  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500',
  };

  toast.className = `${colors[type] || colors.info} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 transform transition-all duration-300 translate-x-full`;
  toast.innerHTML = `
    <span>${message}</span>
    <button onclick="this.parentElement.remove()" class="ml-2 hover:opacity-75">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
      </svg>
    </button>
  `;

  container.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    toast.classList.remove('translate-x-full');
  });

  // Auto remove after 5 seconds
  setTimeout(() => {
    toast.classList.add('translate-x-full');
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

// Parse HX-Trigger events
document.body.addEventListener('htmx:afterRequest', (e) => {
  const trigger = e.detail.xhr.getResponseHeader('HX-Trigger');
  if (trigger) {
    try {
      const events = JSON.parse(trigger);
      Object.entries(events).forEach(([event, data]) => {
        document.body.dispatchEvent(new CustomEvent(event, { detail: data }));
      });
    } catch {
      // Single event trigger
      document.body.dispatchEvent(new CustomEvent(trigger));
    }
  }
});

// Theme toggle
function toggleTheme() {
  document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme',
    document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  );
}

// Initialize theme
if (localStorage.theme === 'dark' ||
    (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
  document.documentElement.classList.add('dark');
}
```

## CLAUDE.md Integration
```markdown
# HTMX Application

## Project Type
Hypermedia-driven web application with Go/Fiber backend and HTMX frontend.

## Key Directories
- `cmd/server/` - Application entry point
- `internal/handlers/` - HTTP handlers
- `internal/middleware/` - Fiber middleware
- `internal/services/` - Business logic
- `internal/templates/` - HTML templates
- `static/` - Static assets (CSS, JS, images)

## Commands
- `air` - Development with hot reload
- `go build -o bin/server cmd/server/main.go` - Build
- `./bin/server` - Run production

## HTMX Patterns
- Use `hx-boost="true"` on body for SPA-like navigation
- Return partial HTML for HTMX requests
- Use `HX-Trigger` header for client events
- Use `HX-Redirect` for navigation after actions

## Template Organization
- `layouts/` - Base HTML layouts
- `pages/` - Full page templates
- `partials/` - Reusable page sections
- `components/` - Interactive HTMX components

## Response Patterns
- Check `HX-Request` header to detect HTMX
- Return partials for HTMX, full pages otherwise
- Use OOB swaps for updating multiple elements
```

## AI Suggestions

1. **Database integration** - Add SQLite or PostgreSQL with GORM for persistent storage
2. **WebSocket fallback** - Add WebSocket support as SSE fallback for older browsers
3. **File uploads** - Add drag-and-drop file upload with progress using HTMX
4. **Infinite scroll** - Implement infinite scroll pagination with `hx-trigger="revealed"`
5. **Optimistic UI** - Add optimistic updates with rollback on error
6. **Form validation** - Add server-side validation with inline error display
7. **Search with debounce** - Implement live search with `hx-trigger="keyup changed delay:300ms"`
8. **Bulk actions** - Add multi-select with bulk operations
9. **Keyboard shortcuts** - Add keyboard navigation and shortcuts
10. **Offline support** - Add service worker for basic offline functionality
