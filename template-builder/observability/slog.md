# Go slog Template

Standard library structured logging for Go 1.21+ with handlers, attributes, and context integration.

## Overview

slog is Go's official structured logging package introduced in Go 1.21. It provides high-performance, structured logging with JSON and text handlers, contextual logging, and extensible handler interface.

## Installation

```bash
# slog is part of the Go standard library (Go 1.21+)
# No installation needed for core functionality

# Optional handler packages
go get github.com/lmittmann/tint          # Colored terminal output
go get go.uber.org/zap/exp/zapslog        # Zap handler adapter
go get github.com/samber/slog-multi       # Multi-handler support
go get github.com/samber/slog-sentry      # Sentry integration
go get github.com/samber/slog-datadog     # Datadog integration
go get github.com/samber/slog-loki        # Loki integration
```

## Environment Variables

```env
# Logging Configuration
LOG_LEVEL=info
LOG_FORMAT=json
LOG_ADD_SOURCE=true

# Service identification
SERVICE_NAME=my-service
SERVICE_VERSION=1.0.0
ENVIRONMENT=production
```

## Core Logger Configuration

### pkg/logger/logger.go

```go
package logger

import (
	"context"
	"io"
	"log/slog"
	"os"
	"runtime"
	"strings"
	"time"
)

// Config holds logger configuration
type Config struct {
	Level      string
	Format     string // "json" or "text"
	AddSource  bool
	Output     io.Writer
	ServiceName string
	Version    string
	Environment string
}

// DefaultConfig returns default configuration
func DefaultConfig() *Config {
	return &Config{
		Level:       getEnv("LOG_LEVEL", "info"),
		Format:      getEnv("LOG_FORMAT", "json"),
		AddSource:   getEnv("LOG_ADD_SOURCE", "true") == "true",
		Output:      os.Stdout,
		ServiceName: getEnv("SERVICE_NAME", "app"),
		Version:     getEnv("SERVICE_VERSION", "1.0.0"),
		Environment: getEnv("ENVIRONMENT", "development"),
	}
}

// ParseLevel converts string to slog.Level
func ParseLevel(level string) slog.Level {
	switch strings.ToLower(level) {
	case "debug":
		return slog.LevelDebug
	case "info":
		return slog.LevelInfo
	case "warn", "warning":
		return slog.LevelWarn
	case "error":
		return slog.LevelError
	default:
		return slog.LevelInfo
	}
}

// New creates a new configured logger
func New(cfg *Config) *slog.Logger {
	if cfg == nil {
		cfg = DefaultConfig()
	}

	level := ParseLevel(cfg.Level)

	opts := &slog.HandlerOptions{
		Level:     level,
		AddSource: cfg.AddSource,
		ReplaceAttr: func(groups []string, a slog.Attr) slog.Attr {
			// Customize time format
			if a.Key == slog.TimeKey {
				if t, ok := a.Value.Any().(time.Time); ok {
					a.Value = slog.StringValue(t.Format(time.RFC3339Nano))
				}
			}
			// Rename 'msg' to 'message'
			if a.Key == slog.MessageKey {
				a.Key = "message"
			}
			return a
		},
	}

	var handler slog.Handler
	if cfg.Format == "json" {
		handler = slog.NewJSONHandler(cfg.Output, opts)
	} else {
		handler = slog.NewTextHandler(cfg.Output, opts)
	}

	// Wrap with context handler
	handler = &ContextHandler{
		Handler: handler,
	}

	// Add base attributes
	logger := slog.New(handler).With(
		slog.String("service", cfg.ServiceName),
		slog.String("version", cfg.Version),
		slog.String("environment", cfg.Environment),
	)

	return logger
}

// SetDefault sets the default logger
func SetDefault(logger *slog.Logger) {
	slog.SetDefault(logger)
}

// Initialize sets up the default logger
func Initialize(cfg *Config) *slog.Logger {
	logger := New(cfg)
	SetDefault(logger)
	return logger
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
```

### pkg/logger/context.go

```go
package logger

import (
	"context"
	"log/slog"
)

// Context keys
type contextKey string

const (
	loggerKey    contextKey = "logger"
	requestIDKey contextKey = "request_id"
	userIDKey    contextKey = "user_id"
	traceIDKey   contextKey = "trace_id"
	spanIDKey    contextKey = "span_id"
)

// ContextHandler wraps a handler to extract context values
type ContextHandler struct {
	slog.Handler
}

// Handle implements slog.Handler
func (h *ContextHandler) Handle(ctx context.Context, r slog.Record) error {
	// Add context values as attributes
	if requestID := ctx.Value(requestIDKey); requestID != nil {
		r.AddAttrs(slog.String("request_id", requestID.(string)))
	}
	if userID := ctx.Value(userIDKey); userID != nil {
		r.AddAttrs(slog.String("user_id", userID.(string)))
	}
	if traceID := ctx.Value(traceIDKey); traceID != nil {
		r.AddAttrs(slog.String("trace_id", traceID.(string)))
	}
	if spanID := ctx.Value(spanIDKey); spanID != nil {
		r.AddAttrs(slog.String("span_id", spanID.(string)))
	}

	return h.Handler.Handle(ctx, r)
}

// WithAttrs implements slog.Handler
func (h *ContextHandler) WithAttrs(attrs []slog.Attr) slog.Handler {
	return &ContextHandler{Handler: h.Handler.WithAttrs(attrs)}
}

// WithGroup implements slog.Handler
func (h *ContextHandler) WithGroup(name string) slog.Handler {
	return &ContextHandler{Handler: h.Handler.WithGroup(name)}
}

// WithLogger adds a logger to the context
func WithLogger(ctx context.Context, logger *slog.Logger) context.Context {
	return context.WithValue(ctx, loggerKey, logger)
}

// FromContext retrieves the logger from context
func FromContext(ctx context.Context) *slog.Logger {
	if logger, ok := ctx.Value(loggerKey).(*slog.Logger); ok {
		return logger
	}
	return slog.Default()
}

// WithRequestID adds request ID to context
func WithRequestID(ctx context.Context, requestID string) context.Context {
	return context.WithValue(ctx, requestIDKey, requestID)
}

// WithUserID adds user ID to context
func WithUserID(ctx context.Context, userID string) context.Context {
	return context.WithValue(ctx, userIDKey, userID)
}

// WithTraceID adds trace ID to context
func WithTraceID(ctx context.Context, traceID string) context.Context {
	return context.WithValue(ctx, traceIDKey, traceID)
}

// WithSpanID adds span ID to context
func WithSpanID(ctx context.Context, spanID string) context.Context {
	return context.WithValue(ctx, spanIDKey, spanID)
}

// NewContextLogger creates a child logger with context values
func NewContextLogger(ctx context.Context, attrs ...slog.Attr) *slog.Logger {
	logger := FromContext(ctx)
	if len(attrs) > 0 {
		args := make([]any, len(attrs))
		for i, attr := range attrs {
			args[i] = attr
		}
		logger = logger.With(args...)
	}
	return logger
}
```

## HTTP Middleware

### pkg/logger/middleware.go

```go
package logger

import (
	"log/slog"
	"net/http"
	"time"

	"github.com/google/uuid"
)

// responseWriter wraps http.ResponseWriter to capture status code
type responseWriter struct {
	http.ResponseWriter
	statusCode int
	written    int64
}

func newResponseWriter(w http.ResponseWriter) *responseWriter {
	return &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}

func (rw *responseWriter) Write(b []byte) (int, error) {
	n, err := rw.ResponseWriter.Write(b)
	rw.written += int64(n)
	return n, err
}

// HTTPMiddleware returns HTTP logging middleware
func HTTPMiddleware(logger *slog.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()

			// Get or generate request ID
			requestID := r.Header.Get("X-Request-ID")
			if requestID == "" {
				requestID = uuid.New().String()
			}

			// Add to response headers
			w.Header().Set("X-Request-ID", requestID)

			// Create request-scoped logger
			reqLogger := logger.With(
				slog.String("request_id", requestID),
				slog.String("method", r.Method),
				slog.String("path", r.URL.Path),
				slog.String("remote_addr", r.RemoteAddr),
				slog.String("user_agent", r.UserAgent()),
			)

			// Add context values
			ctx := r.Context()
			ctx = WithRequestID(ctx, requestID)
			ctx = WithLogger(ctx, reqLogger)

			// Extract trace headers if present
			if traceID := r.Header.Get("X-Trace-ID"); traceID != "" {
				ctx = WithTraceID(ctx, traceID)
			}

			// Log request start
			reqLogger.Info("request_started",
				slog.String("query", r.URL.RawQuery),
			)

			// Wrap response writer
			wrapped := newResponseWriter(w)

			// Process request
			next.ServeHTTP(wrapped, r.WithContext(ctx))

			// Log request completion
			duration := time.Since(start)

			level := slog.LevelInfo
			if wrapped.statusCode >= 500 {
				level = slog.LevelError
			} else if wrapped.statusCode >= 400 {
				level = slog.LevelWarn
			}

			reqLogger.Log(r.Context(), level, "request_completed",
				slog.Int("status", wrapped.statusCode),
				slog.Int64("bytes", wrapped.written),
				slog.Duration("duration", duration),
				slog.Float64("duration_ms", float64(duration.Nanoseconds())/1e6),
			)
		})
	}
}

// RecoveryMiddleware recovers from panics and logs them
func RecoveryMiddleware(logger *slog.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			defer func() {
				if err := recover(); err != nil {
					reqLogger := FromContext(r.Context())
					reqLogger.Error("panic_recovered",
						slog.Any("error", err),
						slog.String("path", r.URL.Path),
					)

					http.Error(w, "Internal Server Error", http.StatusInternalServerError)
				}
			}()

			next.ServeHTTP(w, r)
		})
	}
}
```

## Gin Integration

### pkg/logger/gin.go

```go
package logger

import (
	"log/slog"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// GinMiddleware returns Gin logging middleware
func GinMiddleware(logger *slog.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()

		// Get or generate request ID
		requestID := c.GetHeader("X-Request-ID")
		if requestID == "" {
			requestID = uuid.New().String()
		}

		c.Header("X-Request-ID", requestID)

		// Create request-scoped logger
		reqLogger := logger.With(
			slog.String("request_id", requestID),
			slog.String("method", c.Request.Method),
			slog.String("path", c.Request.URL.Path),
			slog.String("client_ip", c.ClientIP()),
			slog.String("user_agent", c.Request.UserAgent()),
		)

		// Store in context
		ctx := WithRequestID(c.Request.Context(), requestID)
		ctx = WithLogger(ctx, reqLogger)
		c.Request = c.Request.WithContext(ctx)

		// Store logger in Gin context for easy access
		c.Set("logger", reqLogger)

		// Log request start
		reqLogger.Info("request_started",
			slog.String("query", c.Request.URL.RawQuery),
		)

		// Process request
		c.Next()

		// Log request completion
		duration := time.Since(start)
		status := c.Writer.Status()

		level := slog.LevelInfo
		if status >= 500 {
			level = slog.LevelError
		} else if status >= 400 {
			level = slog.LevelWarn
		}

		attrs := []any{
			slog.Int("status", status),
			slog.Int("size", c.Writer.Size()),
			slog.Duration("duration", duration),
			slog.Float64("duration_ms", float64(duration.Nanoseconds())/1e6),
		}

		// Add errors if any
		if len(c.Errors) > 0 {
			attrs = append(attrs, slog.String("errors", c.Errors.String()))
		}

		reqLogger.Log(c.Request.Context(), level, "request_completed", attrs...)
	}
}

// GinRecovery returns Gin recovery middleware with logging
func GinRecovery(logger *slog.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if err := recover(); err != nil {
				reqLogger := GetGinLogger(c)
				reqLogger.Error("panic_recovered",
					slog.Any("error", err),
					slog.String("path", c.Request.URL.Path),
				)

				c.AbortWithStatus(500)
			}
		}()

		c.Next()
	}
}

// GetGinLogger retrieves logger from Gin context
func GetGinLogger(c *gin.Context) *slog.Logger {
	if logger, exists := c.Get("logger"); exists {
		return logger.(*slog.Logger)
	}
	return slog.Default()
}
```

## Custom Handlers

### pkg/logger/handlers.go

```go
package logger

import (
	"context"
	"encoding/json"
	"io"
	"log/slog"
	"os"
	"sync"
)

// MultiHandler writes to multiple handlers
type MultiHandler struct {
	handlers []slog.Handler
}

// NewMultiHandler creates a handler that writes to multiple handlers
func NewMultiHandler(handlers ...slog.Handler) *MultiHandler {
	return &MultiHandler{handlers: handlers}
}

func (h *MultiHandler) Enabled(ctx context.Context, level slog.Level) bool {
	for _, handler := range h.handlers {
		if handler.Enabled(ctx, level) {
			return true
		}
	}
	return false
}

func (h *MultiHandler) Handle(ctx context.Context, r slog.Record) error {
	var errs []error
	for _, handler := range h.handlers {
		if handler.Enabled(ctx, r.Level) {
			if err := handler.Handle(ctx, r); err != nil {
				errs = append(errs, err)
			}
		}
	}
	if len(errs) > 0 {
		return errs[0]
	}
	return nil
}

func (h *MultiHandler) WithAttrs(attrs []slog.Attr) slog.Handler {
	handlers := make([]slog.Handler, len(h.handlers))
	for i, handler := range h.handlers {
		handlers[i] = handler.WithAttrs(attrs)
	}
	return NewMultiHandler(handlers...)
}

func (h *MultiHandler) WithGroup(name string) slog.Handler {
	handlers := make([]slog.Handler, len(h.handlers))
	for i, handler := range h.handlers {
		handlers[i] = handler.WithGroup(name)
	}
	return NewMultiHandler(handlers...)
}

// LevelFilterHandler filters logs by level
type LevelFilterHandler struct {
	handler  slog.Handler
	minLevel slog.Level
}

func NewLevelFilterHandler(handler slog.Handler, minLevel slog.Level) *LevelFilterHandler {
	return &LevelFilterHandler{handler: handler, minLevel: minLevel}
}

func (h *LevelFilterHandler) Enabled(ctx context.Context, level slog.Level) bool {
	return level >= h.minLevel && h.handler.Enabled(ctx, level)
}

func (h *LevelFilterHandler) Handle(ctx context.Context, r slog.Record) error {
	return h.handler.Handle(ctx, r)
}

func (h *LevelFilterHandler) WithAttrs(attrs []slog.Attr) slog.Handler {
	return &LevelFilterHandler{handler: h.handler.WithAttrs(attrs), minLevel: h.minLevel}
}

func (h *LevelFilterHandler) WithGroup(name string) slog.Handler {
	return &LevelFilterHandler{handler: h.handler.WithGroup(name), minLevel: h.minLevel}
}

// AsyncHandler handles logs asynchronously
type AsyncHandler struct {
	handler slog.Handler
	ch      chan slog.Record
	wg      sync.WaitGroup
	done    chan struct{}
}

func NewAsyncHandler(handler slog.Handler, bufferSize int) *AsyncHandler {
	h := &AsyncHandler{
		handler: handler,
		ch:      make(chan slog.Record, bufferSize),
		done:    make(chan struct{}),
	}

	h.wg.Add(1)
	go h.process()

	return h
}

func (h *AsyncHandler) process() {
	defer h.wg.Done()
	for {
		select {
		case r := <-h.ch:
			_ = h.handler.Handle(context.Background(), r)
		case <-h.done:
			// Drain remaining logs
			for {
				select {
				case r := <-h.ch:
					_ = h.handler.Handle(context.Background(), r)
				default:
					return
				}
			}
		}
	}
}

func (h *AsyncHandler) Enabled(ctx context.Context, level slog.Level) bool {
	return h.handler.Enabled(ctx, level)
}

func (h *AsyncHandler) Handle(ctx context.Context, r slog.Record) error {
	// Clone record to avoid data races
	clone := slog.NewRecord(r.Time, r.Level, r.Message, r.PC)
	r.Attrs(func(a slog.Attr) bool {
		clone.AddAttrs(a)
		return true
	})

	select {
	case h.ch <- clone:
	default:
		// Buffer full, handle synchronously
		return h.handler.Handle(ctx, r)
	}
	return nil
}

func (h *AsyncHandler) WithAttrs(attrs []slog.Attr) slog.Handler {
	return &AsyncHandler{
		handler: h.handler.WithAttrs(attrs),
		ch:      h.ch,
		done:    h.done,
	}
}

func (h *AsyncHandler) WithGroup(name string) slog.Handler {
	return &AsyncHandler{
		handler: h.handler.WithGroup(name),
		ch:      h.ch,
		done:    h.done,
	}
}

func (h *AsyncHandler) Close() {
	close(h.done)
	h.wg.Wait()
}

// SensitiveHandler redacts sensitive fields
type SensitiveHandler struct {
	handler slog.Handler
	keys    map[string]bool
}

func NewSensitiveHandler(handler slog.Handler, sensitiveKeys []string) *SensitiveHandler {
	keys := make(map[string]bool)
	for _, k := range sensitiveKeys {
		keys[k] = true
	}
	return &SensitiveHandler{handler: handler, keys: keys}
}

func (h *SensitiveHandler) Enabled(ctx context.Context, level slog.Level) bool {
	return h.handler.Enabled(ctx, level)
}

func (h *SensitiveHandler) Handle(ctx context.Context, r slog.Record) error {
	clone := slog.NewRecord(r.Time, r.Level, r.Message, r.PC)
	r.Attrs(func(a slog.Attr) bool {
		clone.AddAttrs(h.redactAttr(a))
		return true
	})
	return h.handler.Handle(ctx, clone)
}

func (h *SensitiveHandler) redactAttr(a slog.Attr) slog.Attr {
	if h.keys[a.Key] {
		return slog.String(a.Key, "[REDACTED]")
	}
	if a.Value.Kind() == slog.KindGroup {
		attrs := a.Value.Group()
		redacted := make([]slog.Attr, len(attrs))
		for i, attr := range attrs {
			redacted[i] = h.redactAttr(attr)
		}
		return slog.Group(a.Key, any(redacted)...)
	}
	return a
}

func (h *SensitiveHandler) WithAttrs(attrs []slog.Attr) slog.Handler {
	redacted := make([]slog.Attr, len(attrs))
	for i, a := range attrs {
		redacted[i] = h.redactAttr(a)
	}
	return &SensitiveHandler{handler: h.handler.WithAttrs(redacted), keys: h.keys}
}

func (h *SensitiveHandler) WithGroup(name string) slog.Handler {
	return &SensitiveHandler{handler: h.handler.WithGroup(name), keys: h.keys}
}
```

## Logging Helpers

### pkg/logger/helpers.go

```go
package logger

import (
	"context"
	"log/slog"
	"runtime"
	"time"
)

// LogFunc logs with custom function for lazy evaluation
func LogFunc(logger *slog.Logger, level slog.Level, msg string, fn func() []slog.Attr) {
	if !logger.Enabled(context.Background(), level) {
		return
	}
	logger.LogAttrs(context.Background(), level, msg, fn()...)
}

// Timing logs operation duration
func Timing(logger *slog.Logger, operation string) func() {
	start := time.Now()
	logger.Info(operation+"_started", slog.String("operation", operation))

	return func() {
		duration := time.Since(start)
		logger.Info(operation+"_completed",
			slog.String("operation", operation),
			slog.Duration("duration", duration),
			slog.Float64("duration_ms", float64(duration.Nanoseconds())/1e6),
		)
	}
}

// TimingCtx logs operation duration with context
func TimingCtx(ctx context.Context, operation string) func() {
	logger := FromContext(ctx)
	return Timing(logger, operation)
}

// Error helper for error logging
func Error(ctx context.Context, msg string, err error, attrs ...slog.Attr) {
	logger := FromContext(ctx)
	allAttrs := append([]slog.Attr{slog.Any("error", err)}, attrs...)
	logger.LogAttrs(ctx, slog.LevelError, msg, allAttrs...)
}

// Event logs a business event
func Event(ctx context.Context, name string, attrs ...slog.Attr) {
	logger := FromContext(ctx)
	allAttrs := append([]slog.Attr{
		slog.String("event_type", "business_event"),
		slog.String("event_name", name),
	}, attrs...)
	logger.LogAttrs(ctx, slog.LevelInfo, name, allAttrs...)
}

// Metric logs a metric
func Metric(ctx context.Context, name string, value float64, attrs ...slog.Attr) {
	logger := FromContext(ctx)
	allAttrs := append([]slog.Attr{
		slog.String("metric_type", "gauge"),
		slog.String("metric_name", name),
		slog.Float64("metric_value", value),
	}, attrs...)
	logger.LogAttrs(ctx, slog.LevelInfo, "metric", allAttrs...)
}

// Audit logs an audit event
func Audit(ctx context.Context, action, actor, resource string, attrs ...slog.Attr) {
	logger := FromContext(ctx)
	allAttrs := append([]slog.Attr{
		slog.String("audit_type", "action"),
		slog.String("action", action),
		slog.String("actor", actor),
		slog.String("resource", resource),
		slog.Time("audit_time", time.Now()),
	}, attrs...)
	logger.LogAttrs(ctx, slog.LevelInfo, "audit_event", allAttrs...)
}

// Security logs a security event
func Security(ctx context.Context, event, severity string, attrs ...slog.Attr) {
	logger := FromContext(ctx)
	level := slog.LevelWarn
	if severity == "critical" || severity == "high" {
		level = slog.LevelError
	}
	allAttrs := append([]slog.Attr{
		slog.String("security_event", event),
		slog.String("severity", severity),
	}, attrs...)
	logger.LogAttrs(ctx, level, "security_event", allAttrs...)
}

// WithError returns attrs with error
func WithError(err error) slog.Attr {
	return slog.Any("error", err)
}

// WithStack returns attrs with stack trace
func WithStack() slog.Attr {
	buf := make([]byte, 4096)
	n := runtime.Stack(buf, false)
	return slog.String("stack", string(buf[:n]))
}

// Group creates an attribute group
func Group(name string, attrs ...slog.Attr) slog.Attr {
	args := make([]any, len(attrs))
	for i, a := range attrs {
		args[i] = a
	}
	return slog.Group(name, args...)
}
```

## Testing

### pkg/logger/logger_test.go

```go
package logger

import (
	"bytes"
	"context"
	"encoding/json"
	"log/slog"
	"strings"
	"testing"
)

func TestLogger(t *testing.T) {
	var buf bytes.Buffer

	logger := New(&Config{
		Level:  "debug",
		Format: "json",
		Output: &buf,
	})

	logger.Info("test message", slog.String("key", "value"))

	var log map[string]interface{}
	if err := json.Unmarshal(buf.Bytes(), &log); err != nil {
		t.Fatalf("Failed to parse log: %v", err)
	}

	if log["message"] != "test message" {
		t.Errorf("Expected message 'test message', got '%v'", log["message"])
	}

	if log["key"] != "value" {
		t.Errorf("Expected key 'value', got '%v'", log["key"])
	}
}

func TestLogLevels(t *testing.T) {
	tests := []struct {
		level    string
		expected slog.Level
	}{
		{"debug", slog.LevelDebug},
		{"info", slog.LevelInfo},
		{"warn", slog.LevelWarn},
		{"error", slog.LevelError},
		{"unknown", slog.LevelInfo},
	}

	for _, tt := range tests {
		t.Run(tt.level, func(t *testing.T) {
			result := ParseLevel(tt.level)
			if result != tt.expected {
				t.Errorf("ParseLevel(%s) = %v, expected %v", tt.level, result, tt.expected)
			}
		})
	}
}

func TestContextLogger(t *testing.T) {
	var buf bytes.Buffer

	handler := slog.NewJSONHandler(&buf, nil)
	ctxHandler := &ContextHandler{Handler: handler}
	logger := slog.New(ctxHandler)

	ctx := context.Background()
	ctx = WithRequestID(ctx, "req-123")
	ctx = WithUserID(ctx, "user-456")
	ctx = WithLogger(ctx, logger)

	ctxLogger := FromContext(ctx)
	ctxLogger.InfoContext(ctx, "test with context")

	var log map[string]interface{}
	if err := json.Unmarshal(buf.Bytes(), &log); err != nil {
		t.Fatalf("Failed to parse log: %v", err)
	}

	if log["request_id"] != "req-123" {
		t.Errorf("Expected request_id 'req-123', got '%v'", log["request_id"])
	}

	if log["user_id"] != "user-456" {
		t.Errorf("Expected user_id 'user-456', got '%v'", log["user_id"])
	}
}

func TestSensitiveHandler(t *testing.T) {
	var buf bytes.Buffer

	handler := slog.NewJSONHandler(&buf, nil)
	sensitive := NewSensitiveHandler(handler, []string{"password", "token"})
	logger := slog.New(sensitive)

	logger.Info("user login",
		slog.String("username", "john"),
		slog.String("password", "secret123"),
		slog.String("token", "abc123"),
	)

	logStr := buf.String()

	if strings.Contains(logStr, "secret123") {
		t.Error("Password was not redacted")
	}

	if strings.Contains(logStr, "abc123") {
		t.Error("Token was not redacted")
	}

	if !strings.Contains(logStr, "[REDACTED]") {
		t.Error("REDACTED marker not found")
	}
}

func TestMultiHandler(t *testing.T) {
	var buf1, buf2 bytes.Buffer

	handler1 := slog.NewJSONHandler(&buf1, nil)
	handler2 := slog.NewTextHandler(&buf2, nil)

	multi := NewMultiHandler(handler1, handler2)
	logger := slog.New(multi)

	logger.Info("test message")

	if buf1.Len() == 0 {
		t.Error("Handler 1 received no logs")
	}

	if buf2.Len() == 0 {
		t.Error("Handler 2 received no logs")
	}
}

func TestTiming(t *testing.T) {
	var buf bytes.Buffer

	logger := slog.New(slog.NewJSONHandler(&buf, nil))

	done := Timing(logger, "test_operation")
	done()

	logStr := buf.String()
	lines := strings.Split(strings.TrimSpace(logStr), "\n")

	if len(lines) != 2 {
		t.Errorf("Expected 2 log lines, got %d", len(lines))
	}

	if !strings.Contains(lines[0], "test_operation_started") {
		t.Error("Start log not found")
	}

	if !strings.Contains(lines[1], "test_operation_completed") {
		t.Error("Completion log not found")
	}

	if !strings.Contains(lines[1], "duration_ms") {
		t.Error("Duration not logged")
	}
}

func BenchmarkLogger(b *testing.B) {
	logger := slog.New(slog.NewJSONHandler(
		&bytes.Buffer{},
		&slog.HandlerOptions{Level: slog.LevelInfo},
	))

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		logger.Info("benchmark message",
			slog.String("key", "value"),
			slog.Int("count", i),
		)
	}
}
```

## Example Application

### main.go

```go
package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"myapp/pkg/logger"
)

func main() {
	// Initialize logger
	log := logger.Initialize(nil)

	log.Info("application_starting",
		slog.String("version", "1.0.0"),
	)

	// Create router
	mux := http.NewServeMux()

	// Routes
	mux.HandleFunc("/api/users", handleUsers)
	mux.HandleFunc("/health", handleHealth)

	// Apply middleware
	handler := logger.HTTPMiddleware(log)(
		logger.RecoveryMiddleware(log)(mux),
	)

	// Create server
	server := &http.Server{
		Addr:    ":8080",
		Handler: handler,
	}

	// Start server
	go func() {
		log.Info("server_started", slog.String("addr", server.Addr))
		if err := server.ListenAndServe(); err != http.ErrServerClosed {
			log.Error("server_error", slog.Any("error", err))
		}
	}()

	// Wait for shutdown signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Info("server_shutting_down")

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Error("shutdown_error", slog.Any("error", err))
	}

	log.Info("server_stopped")
}

func handleUsers(w http.ResponseWriter, r *http.Request) {
	log := logger.FromContext(r.Context())

	log.Info("handling_users_request")

	// Simulate work
	users := []map[string]string{
		{"id": "1", "name": "John"},
		{"id": "2", "name": "Jane"},
	}

	log.Info("users_fetched", slog.Int("count", len(users)))

	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"users": [{"id": "1", "name": "John"}, {"id": "2", "name": "Jane"}]}`))
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("OK"))
}
```

## CLAUDE.md Integration

```markdown
## Logging with slog

This project uses Go's standard library slog for structured logging.

### Usage
```go
import "log/slog"

// Get logger from context
log := logger.FromContext(ctx)

// Log with attributes
log.Info("user_action",
    slog.String("user_id", userID),
    slog.String("action", "login"),
)

// Log errors
log.Error("operation_failed",
    slog.Any("error", err),
    slog.String("operation", "create_user"),
)
```

### Best Practices
1. Always use structured logging with slog.Attr
2. Include context-relevant attributes
3. Use appropriate log levels
4. Never log sensitive data
5. Use FromContext for request-scoped logging

### Log Levels
- Error: Errors requiring attention
- Warn: Potential issues
- Info: Normal operations
- Debug: Debugging information
```

## AI Suggestions

1. **OpenTelemetry Integration**: Add trace ID propagation from OpenTelemetry spans to logs
2. **Log Sampling**: Implement probabilistic sampling for high-volume debug logs
3. **Remote Configuration**: Add dynamic log level configuration via config service
4. **Custom Exporters**: Create exporters for Datadog, Loki, and Elasticsearch
5. **Metrics Bridge**: Extract metrics from log patterns automatically
6. **Error Aggregation**: Implement error grouping and deduplication
7. **Context Propagation**: Add W3C Trace Context support for distributed tracing
8. **Async Batching**: Implement efficient batch writing to external systems
9. **Structured Errors**: Create error types with structured context
10. **Log Rotation**: Add file-based logging with rotation support
