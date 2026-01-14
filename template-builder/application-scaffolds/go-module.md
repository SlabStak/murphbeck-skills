# Go Module Template

> Production-ready Go module for pkg.go.dev with comprehensive documentation, testing, and CI/CD

## Overview

This template provides a complete Go module setup with:
- Proper module structure following Go conventions
- Comprehensive documentation with godoc
- Table-driven tests with testify
- Benchmarks and fuzzing support
- GoReleaser for distribution
- GitHub Actions CI/CD
- Semantic versioning support

## Quick Start

```bash
# Create new module
mkdir my-module && cd my-module
go mod init github.com/username/my-module

# Create directory structure
mkdir -p internal/{config,utils} cmd/example

# Initialize and test
go build ./...
go test ./...
go doc -all
```

## Project Structure

```
my-module/
├── go.mod
├── go.sum
├── README.md
├── LICENSE
├── CHANGELOG.md
├── CONTRIBUTING.md
├── Makefile
├── .golangci.yml
├── .goreleaser.yml
├── doc.go
├── module.go
├── module_test.go
├── options.go
├── errors.go
├── internal/
│   ├── config/
│   │   ├── config.go
│   │   └── config_test.go
│   └── utils/
│       ├── utils.go
│       └── utils_test.go
├── cmd/
│   └── example/
│       └── main.go
├── examples/
│   ├── basic/
│   │   └── main.go
│   └── advanced/
│       └── main.go
├── testdata/
│   └── fixtures.json
└── .github/
    └── workflows/
        ├── ci.yml
        ├── release.yml
        └── codeql.yml
```

## Core Files

### go.mod

```go
module github.com/username/my-module

go 1.21

require (
	github.com/stretchr/testify v1.9.0
	golang.org/x/sync v0.6.0
)

require (
	github.com/davecgh/go-spew v1.1.1 // indirect
	github.com/pmezard/go-difflib v1.0.0 // indirect
	gopkg.in/yaml.v3 v3.0.1 // indirect
)
```

### doc.go

```go
// Package mymodule provides functionality for processing and transforming data.
//
// # Overview
//
// This package offers a simple, efficient way to process data with various
// configuration options. It supports concurrent processing, custom transformations,
// and comprehensive error handling.
//
// # Quick Start
//
// Create a new processor with default options:
//
//	p := mymodule.New()
//	result, err := p.Process("input")
//	if err != nil {
//	    log.Fatal(err)
//	}
//	fmt.Println(result)
//
// # Configuration
//
// Use functional options to customize behavior:
//
//	p := mymodule.New(
//	    mymodule.WithTimeout(30 * time.Second),
//	    mymodule.WithConcurrency(4),
//	    mymodule.WithLogger(logger),
//	)
//
// # Concurrency
//
// The processor is safe for concurrent use:
//
//	var wg sync.WaitGroup
//	for i := 0; i < 10; i++ {
//	    wg.Add(1)
//	    go func(input string) {
//	        defer wg.Done()
//	        result, _ := p.Process(input)
//	        fmt.Println(result)
//	    }(fmt.Sprintf("input-%d", i))
//	}
//	wg.Wait()
//
// # Error Handling
//
// All errors are wrapped with context and can be checked using errors.Is:
//
//	result, err := p.Process("")
//	if errors.Is(err, mymodule.ErrEmptyInput) {
//	    // Handle empty input error
//	}
package mymodule
```

### module.go

```go
package mymodule

import (
	"context"
	"fmt"
	"strings"
	"sync"
	"time"
)

// Version is the current version of this module.
const Version = "1.0.0"

// Processor handles data processing operations.
type Processor struct {
	opts   options
	mu     sync.RWMutex
	closed bool
}

// New creates a new Processor with the given options.
//
// Example:
//
//	p := mymodule.New(
//	    mymodule.WithTimeout(30 * time.Second),
//	    mymodule.WithConcurrency(4),
//	)
func New(opts ...Option) *Processor {
	o := defaultOptions()
	for _, opt := range opts {
		opt(&o)
	}

	return &Processor{
		opts: o,
	}
}

// Process processes the input and returns the result.
//
// Process is safe for concurrent use.
//
// Example:
//
//	result, err := p.Process("hello world")
//	if err != nil {
//	    return err
//	}
//	fmt.Println(result)
func (p *Processor) Process(input string) (string, error) {
	return p.ProcessContext(context.Background(), input)
}

// ProcessContext processes the input with context support.
//
// The context can be used to cancel long-running operations.
func (p *Processor) ProcessContext(ctx context.Context, input string) (string, error) {
	p.mu.RLock()
	if p.closed {
		p.mu.RUnlock()
		return "", ErrClosed
	}
	p.mu.RUnlock()

	if input == "" {
		return "", ErrEmptyInput
	}

	// Create timeout context if configured
	if p.opts.timeout > 0 {
		var cancel context.CancelFunc
		ctx, cancel = context.WithTimeout(ctx, p.opts.timeout)
		defer cancel()
	}

	// Process with context
	resultCh := make(chan string, 1)
	errCh := make(chan error, 1)

	go func() {
		result, err := p.doProcess(input)
		if err != nil {
			errCh <- err
			return
		}
		resultCh <- result
	}()

	select {
	case <-ctx.Done():
		return "", fmt.Errorf("%w: %v", ErrTimeout, ctx.Err())
	case err := <-errCh:
		return "", err
	case result := <-resultCh:
		return result, nil
	}
}

// doProcess performs the actual processing.
func (p *Processor) doProcess(input string) (string, error) {
	result := input

	// Apply transformations based on options
	if p.opts.uppercase {
		result = strings.ToUpper(result)
	}

	if p.opts.trim {
		result = strings.TrimSpace(result)
	}

	if p.opts.prefix != "" {
		result = p.opts.prefix + result
	}

	if p.opts.suffix != "" {
		result = result + p.opts.suffix
	}

	// Log if logger is configured
	if p.opts.logger != nil {
		p.opts.logger.Printf("processed: %q -> %q", input, result)
	}

	return result, nil
}

// ProcessBatch processes multiple inputs concurrently.
//
// Returns a slice of results in the same order as inputs.
// Any errors are collected and returned as a combined error.
func (p *Processor) ProcessBatch(ctx context.Context, inputs []string) ([]Result, error) {
	if len(inputs) == 0 {
		return nil, nil
	}

	results := make([]Result, len(inputs))
	sem := make(chan struct{}, p.opts.concurrency)
	var wg sync.WaitGroup
	var mu sync.Mutex
	var errs []error

	for i, input := range inputs {
		wg.Add(1)
		go func(idx int, in string) {
			defer wg.Done()

			sem <- struct{}{}        // Acquire semaphore
			defer func() { <-sem }() // Release semaphore

			output, err := p.ProcessContext(ctx, in)
			mu.Lock()
			results[idx] = Result{
				Input:  in,
				Output: output,
				Error:  err,
			}
			if err != nil {
				errs = append(errs, fmt.Errorf("input %d: %w", idx, err))
			}
			mu.Unlock()
		}(i, input)
	}

	wg.Wait()

	if len(errs) > 0 {
		return results, &BatchError{Errors: errs}
	}

	return results, nil
}

// Close closes the processor and releases resources.
//
// After Close is called, all subsequent operations will return ErrClosed.
func (p *Processor) Close() error {
	p.mu.Lock()
	defer p.mu.Unlock()

	if p.closed {
		return ErrAlreadyClosed
	}

	p.closed = true
	return nil
}

// IsClosed returns true if the processor is closed.
func (p *Processor) IsClosed() bool {
	p.mu.RLock()
	defer p.mu.RUnlock()
	return p.closed
}

// Result represents a processing result.
type Result struct {
	Input  string
	Output string
	Error  error
}

// IsSuccess returns true if processing was successful.
func (r Result) IsSuccess() bool {
	return r.Error == nil
}

// MustProcess processes the input and panics on error.
//
// Use only when you are certain the input is valid.
func (p *Processor) MustProcess(input string) string {
	result, err := p.Process(input)
	if err != nil {
		panic(fmt.Sprintf("mymodule: Process(%q): %v", input, err))
	}
	return result
}

// ProcessFunc is a function type for processing.
type ProcessFunc func(string) (string, error)

// Chain creates a processor that chains multiple functions.
//
// Each function receives the output of the previous function.
func Chain(funcs ...ProcessFunc) ProcessFunc {
	return func(input string) (string, error) {
		result := input
		for _, fn := range funcs {
			var err error
			result, err = fn(result)
			if err != nil {
				return "", err
			}
		}
		return result, nil
	}
}

// Middleware wraps a processor with additional functionality.
type Middleware func(ProcessFunc) ProcessFunc

// WithMiddleware applies middleware to the processor.
func (p *Processor) WithMiddleware(mw ...Middleware) ProcessFunc {
	fn := p.Process
	for i := len(mw) - 1; i >= 0; i-- {
		fn = mw[i](fn)
	}
	return fn
}

// LoggingMiddleware logs all processing operations.
func LoggingMiddleware(logger Logger) Middleware {
	return func(next ProcessFunc) ProcessFunc {
		return func(input string) (string, error) {
			start := time.Now()
			result, err := next(input)
			duration := time.Since(start)

			if err != nil {
				logger.Printf("ERROR: input=%q duration=%v error=%v", input, duration, err)
			} else {
				logger.Printf("OK: input=%q output=%q duration=%v", input, result, duration)
			}

			return result, err
		}
	}
}

// RetryMiddleware retries failed operations.
func RetryMiddleware(maxRetries int, delay time.Duration) Middleware {
	return func(next ProcessFunc) ProcessFunc {
		return func(input string) (string, error) {
			var lastErr error
			for i := 0; i <= maxRetries; i++ {
				result, err := next(input)
				if err == nil {
					return result, nil
				}
				lastErr = err
				if i < maxRetries {
					time.Sleep(delay)
				}
			}
			return "", fmt.Errorf("after %d retries: %w", maxRetries, lastErr)
		}
	}
}
```

### module_test.go

```go
package mymodule_test

import (
	"context"
	"errors"
	"fmt"
	"sync"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	mymodule "github.com/username/my-module"
)

func TestNew(t *testing.T) {
	t.Run("default options", func(t *testing.T) {
		p := mymodule.New()
		require.NotNil(t, p)
		assert.False(t, p.IsClosed())
	})

	t.Run("with options", func(t *testing.T) {
		p := mymodule.New(
			mymodule.WithTimeout(30*time.Second),
			mymodule.WithConcurrency(4),
		)
		require.NotNil(t, p)
	})
}

func TestProcessor_Process(t *testing.T) {
	tests := []struct {
		name    string
		opts    []mymodule.Option
		input   string
		want    string
		wantErr error
	}{
		{
			name:  "simple input",
			input: "hello",
			want:  "hello",
		},
		{
			name:    "empty input",
			input:   "",
			wantErr: mymodule.ErrEmptyInput,
		},
		{
			name:  "with uppercase",
			opts:  []mymodule.Option{mymodule.WithUppercase(true)},
			input: "hello",
			want:  "HELLO",
		},
		{
			name:  "with trim",
			opts:  []mymodule.Option{mymodule.WithTrim(true)},
			input: "  hello  ",
			want:  "hello",
		},
		{
			name:  "with prefix and suffix",
			opts:  []mymodule.Option{mymodule.WithPrefix("<<"), mymodule.WithSuffix(">>")},
			input: "hello",
			want:  "<<hello>>",
		},
		{
			name: "combined options",
			opts: []mymodule.Option{
				mymodule.WithUppercase(true),
				mymodule.WithTrim(true),
				mymodule.WithPrefix("["),
				mymodule.WithSuffix("]"),
			},
			input: "  hello world  ",
			want:  "[HELLO WORLD]",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			p := mymodule.New(tt.opts...)
			got, err := p.Process(tt.input)

			if tt.wantErr != nil {
				assert.ErrorIs(t, err, tt.wantErr)
				return
			}

			require.NoError(t, err)
			assert.Equal(t, tt.want, got)
		})
	}
}

func TestProcessor_ProcessContext(t *testing.T) {
	t.Run("with timeout", func(t *testing.T) {
		p := mymodule.New(mymodule.WithTimeout(100 * time.Millisecond))

		ctx, cancel := context.WithTimeout(context.Background(), 50*time.Millisecond)
		defer cancel()

		_, err := p.ProcessContext(ctx, "hello")
		// May or may not timeout depending on timing
		if err != nil {
			assert.True(t, errors.Is(err, mymodule.ErrTimeout) || errors.Is(err, context.DeadlineExceeded))
		}
	})

	t.Run("cancelled context", func(t *testing.T) {
		p := mymodule.New()

		ctx, cancel := context.WithCancel(context.Background())
		cancel() // Cancel immediately

		_, err := p.ProcessContext(ctx, "hello")
		assert.Error(t, err)
	})
}

func TestProcessor_ProcessBatch(t *testing.T) {
	t.Run("successful batch", func(t *testing.T) {
		p := mymodule.New(mymodule.WithConcurrency(2))
		inputs := []string{"one", "two", "three"}

		results, err := p.ProcessBatch(context.Background(), inputs)

		require.NoError(t, err)
		require.Len(t, results, 3)

		for i, r := range results {
			assert.Equal(t, inputs[i], r.Input)
			assert.Equal(t, inputs[i], r.Output)
			assert.True(t, r.IsSuccess())
		}
	})

	t.Run("batch with errors", func(t *testing.T) {
		p := mymodule.New()
		inputs := []string{"valid", "", "also valid"}

		results, err := p.ProcessBatch(context.Background(), inputs)

		assert.Error(t, err)
		require.Len(t, results, 3)

		assert.True(t, results[0].IsSuccess())
		assert.False(t, results[1].IsSuccess())
		assert.True(t, results[2].IsSuccess())
	})

	t.Run("empty batch", func(t *testing.T) {
		p := mymodule.New()
		results, err := p.ProcessBatch(context.Background(), nil)

		require.NoError(t, err)
		assert.Nil(t, results)
	})
}

func TestProcessor_Close(t *testing.T) {
	t.Run("close once", func(t *testing.T) {
		p := mymodule.New()
		assert.False(t, p.IsClosed())

		err := p.Close()
		require.NoError(t, err)
		assert.True(t, p.IsClosed())
	})

	t.Run("close twice", func(t *testing.T) {
		p := mymodule.New()

		err := p.Close()
		require.NoError(t, err)

		err = p.Close()
		assert.ErrorIs(t, err, mymodule.ErrAlreadyClosed)
	})

	t.Run("process after close", func(t *testing.T) {
		p := mymodule.New()
		_ = p.Close()

		_, err := p.Process("hello")
		assert.ErrorIs(t, err, mymodule.ErrClosed)
	})
}

func TestProcessor_Concurrent(t *testing.T) {
	p := mymodule.New()
	const numGoroutines = 100

	var wg sync.WaitGroup
	errors := make(chan error, numGoroutines)

	for i := 0; i < numGoroutines; i++ {
		wg.Add(1)
		go func(n int) {
			defer wg.Done()
			input := fmt.Sprintf("input-%d", n)
			result, err := p.Process(input)
			if err != nil {
				errors <- err
				return
			}
			if result != input {
				errors <- fmt.Errorf("unexpected result: got %q, want %q", result, input)
			}
		}(i)
	}

	wg.Wait()
	close(errors)

	for err := range errors {
		t.Errorf("concurrent error: %v", err)
	}
}

func TestChain(t *testing.T) {
	upper := func(s string) (string, error) {
		return strings.ToUpper(s), nil
	}

	prefix := func(s string) (string, error) {
		return ">>>" + s, nil
	}

	suffix := func(s string) (string, error) {
		return s + "<<<", nil
	}

	chain := mymodule.Chain(upper, prefix, suffix)
	result, err := chain("hello")

	require.NoError(t, err)
	assert.Equal(t, ">>>HELLO<<<", result)
}

func TestMiddleware(t *testing.T) {
	t.Run("logging middleware", func(t *testing.T) {
		var logs []string
		logger := &testLogger{logs: &logs}

		p := mymodule.New()
		fn := p.WithMiddleware(mymodule.LoggingMiddleware(logger))

		_, err := fn("hello")
		require.NoError(t, err)

		assert.Len(t, *logger.logs, 1)
		assert.Contains(t, (*logger.logs)[0], "OK")
	})

	t.Run("retry middleware", func(t *testing.T) {
		attempts := 0
		failUntil := 2

		fn := func(s string) (string, error) {
			attempts++
			if attempts < failUntil {
				return "", errors.New("temporary error")
			}
			return s, nil
		}

		wrapped := mymodule.RetryMiddleware(3, 10*time.Millisecond)(fn)
		result, err := wrapped("hello")

		require.NoError(t, err)
		assert.Equal(t, "hello", result)
		assert.Equal(t, failUntil, attempts)
	})
}

func TestMustProcess(t *testing.T) {
	t.Run("success", func(t *testing.T) {
		p := mymodule.New()
		result := p.MustProcess("hello")
		assert.Equal(t, "hello", result)
	})

	t.Run("panic on error", func(t *testing.T) {
		p := mymodule.New()
		assert.Panics(t, func() {
			p.MustProcess("")
		})
	})
}

// Benchmarks

func BenchmarkProcess(b *testing.B) {
	p := mymodule.New()
	input := "hello world"

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = p.Process(input)
	}
}

func BenchmarkProcessWithOptions(b *testing.B) {
	p := mymodule.New(
		mymodule.WithUppercase(true),
		mymodule.WithTrim(true),
		mymodule.WithPrefix(">>>"),
		mymodule.WithSuffix("<<<"),
	)
	input := "  hello world  "

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = p.Process(input)
	}
}

func BenchmarkProcessBatch(b *testing.B) {
	p := mymodule.New(mymodule.WithConcurrency(4))
	inputs := make([]string, 100)
	for i := range inputs {
		inputs[i] = fmt.Sprintf("input-%d", i)
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = p.ProcessBatch(context.Background(), inputs)
	}
}

func BenchmarkProcessConcurrent(b *testing.B) {
	p := mymodule.New()
	input := "hello world"

	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			_, _ = p.Process(input)
		}
	})
}

// Test helpers

type testLogger struct {
	logs *[]string
	mu   sync.Mutex
}

func (l *testLogger) Printf(format string, args ...interface{}) {
	l.mu.Lock()
	defer l.mu.Unlock()
	*l.logs = append(*l.logs, fmt.Sprintf(format, args...))
}

// Import for chain test
import "strings"
```

### options.go

```go
package mymodule

import (
	"log"
	"time"
)

// Logger defines the interface for logging.
type Logger interface {
	Printf(format string, v ...interface{})
}

// options holds the processor configuration.
type options struct {
	timeout     time.Duration
	concurrency int
	uppercase   bool
	trim        bool
	prefix      string
	suffix      string
	logger      Logger
}

// defaultOptions returns the default options.
func defaultOptions() options {
	return options{
		timeout:     0, // No timeout by default
		concurrency: 1,
		uppercase:   false,
		trim:        false,
		prefix:      "",
		suffix:      "",
		logger:      nil,
	}
}

// Option configures a Processor.
type Option func(*options)

// WithTimeout sets the processing timeout.
//
// A value of 0 means no timeout.
func WithTimeout(d time.Duration) Option {
	return func(o *options) {
		o.timeout = d
	}
}

// WithConcurrency sets the maximum number of concurrent operations.
//
// Must be at least 1.
func WithConcurrency(n int) Option {
	return func(o *options) {
		if n < 1 {
			n = 1
		}
		o.concurrency = n
	}
}

// WithUppercase enables uppercase transformation.
func WithUppercase(enabled bool) Option {
	return func(o *options) {
		o.uppercase = enabled
	}
}

// WithTrim enables whitespace trimming.
func WithTrim(enabled bool) Option {
	return func(o *options) {
		o.trim = enabled
	}
}

// WithPrefix sets the prefix to prepend to output.
func WithPrefix(prefix string) Option {
	return func(o *options) {
		o.prefix = prefix
	}
}

// WithSuffix sets the suffix to append to output.
func WithSuffix(suffix string) Option {
	return func(o *options) {
		o.suffix = suffix
	}
}

// WithLogger sets the logger for the processor.
//
// Pass nil to disable logging.
func WithLogger(logger Logger) Option {
	return func(o *options) {
		o.logger = logger
	}
}

// WithStdLogger uses the standard library logger.
func WithStdLogger() Option {
	return func(o *options) {
		o.logger = log.Default()
	}
}

// Config represents the configuration for creating a Processor.
//
// Use NewFromConfig to create a Processor from a Config.
type Config struct {
	Timeout     time.Duration `json:"timeout" yaml:"timeout"`
	Concurrency int           `json:"concurrency" yaml:"concurrency"`
	Uppercase   bool          `json:"uppercase" yaml:"uppercase"`
	Trim        bool          `json:"trim" yaml:"trim"`
	Prefix      string        `json:"prefix" yaml:"prefix"`
	Suffix      string        `json:"suffix" yaml:"suffix"`
}

// DefaultConfig returns a Config with default values.
func DefaultConfig() Config {
	return Config{
		Timeout:     0,
		Concurrency: 1,
		Uppercase:   false,
		Trim:        false,
		Prefix:      "",
		Suffix:      "",
	}
}

// NewFromConfig creates a Processor from a Config.
func NewFromConfig(cfg Config) *Processor {
	return New(
		WithTimeout(cfg.Timeout),
		WithConcurrency(cfg.Concurrency),
		WithUppercase(cfg.Uppercase),
		WithTrim(cfg.Trim),
		WithPrefix(cfg.Prefix),
		WithSuffix(cfg.Suffix),
	)
}

// Validate validates the configuration.
func (c Config) Validate() error {
	if c.Concurrency < 0 {
		return ErrInvalidConfig
	}
	if c.Timeout < 0 {
		return ErrInvalidConfig
	}
	return nil
}
```

### errors.go

```go
package mymodule

import (
	"errors"
	"fmt"
	"strings"
)

// Sentinel errors for the package.
var (
	// ErrEmptyInput is returned when the input is empty.
	ErrEmptyInput = errors.New("mymodule: empty input")

	// ErrClosed is returned when operating on a closed processor.
	ErrClosed = errors.New("mymodule: processor is closed")

	// ErrAlreadyClosed is returned when closing an already closed processor.
	ErrAlreadyClosed = errors.New("mymodule: processor is already closed")

	// ErrTimeout is returned when an operation times out.
	ErrTimeout = errors.New("mymodule: operation timed out")

	// ErrInvalidConfig is returned when configuration is invalid.
	ErrInvalidConfig = errors.New("mymodule: invalid configuration")
)

// BatchError represents errors from batch processing.
type BatchError struct {
	Errors []error
}

// Error implements the error interface.
func (e *BatchError) Error() string {
	if len(e.Errors) == 0 {
		return "mymodule: batch processing failed"
	}

	if len(e.Errors) == 1 {
		return fmt.Sprintf("mymodule: batch processing failed: %v", e.Errors[0])
	}

	var msgs []string
	for _, err := range e.Errors {
		msgs = append(msgs, err.Error())
	}
	return fmt.Sprintf("mymodule: batch processing failed with %d errors: %s",
		len(e.Errors), strings.Join(msgs, "; "))
}

// Unwrap returns the underlying errors.
func (e *BatchError) Unwrap() []error {
	return e.Errors
}

// Is checks if the target error is contained in this batch error.
func (e *BatchError) Is(target error) bool {
	for _, err := range e.Errors {
		if errors.Is(err, target) {
			return true
		}
	}
	return false
}

// ProcessError wraps an error with processing context.
type ProcessError struct {
	Input string
	Op    string
	Err   error
}

// Error implements the error interface.
func (e *ProcessError) Error() string {
	if e.Op != "" {
		return fmt.Sprintf("mymodule: %s: input=%q: %v", e.Op, e.Input, e.Err)
	}
	return fmt.Sprintf("mymodule: input=%q: %v", e.Input, e.Err)
}

// Unwrap returns the underlying error.
func (e *ProcessError) Unwrap() error {
	return e.Err
}

// NewProcessError creates a new ProcessError.
func NewProcessError(input, op string, err error) *ProcessError {
	return &ProcessError{
		Input: input,
		Op:    op,
		Err:   err,
	}
}

// IsRetryable returns true if the error is retryable.
func IsRetryable(err error) bool {
	if err == nil {
		return false
	}

	// Timeout errors are retryable
	if errors.Is(err, ErrTimeout) {
		return true
	}

	// Check for temporary errors
	var temp interface{ Temporary() bool }
	if errors.As(err, &temp) && temp.Temporary() {
		return true
	}

	return false
}
```

### internal/config/config.go

```go
package config

import (
	"encoding/json"
	"fmt"
	"os"
	"time"
)

// Config holds application configuration.
type Config struct {
	Processing ProcessingConfig `json:"processing" yaml:"processing"`
	Logging    LoggingConfig    `json:"logging" yaml:"logging"`
	Features   FeatureFlags     `json:"features" yaml:"features"`
}

// ProcessingConfig holds processing-related configuration.
type ProcessingConfig struct {
	Timeout     time.Duration `json:"timeout" yaml:"timeout"`
	Concurrency int           `json:"concurrency" yaml:"concurrency"`
	BatchSize   int           `json:"batch_size" yaml:"batch_size"`
	RetryCount  int           `json:"retry_count" yaml:"retry_count"`
	RetryDelay  time.Duration `json:"retry_delay" yaml:"retry_delay"`
}

// LoggingConfig holds logging configuration.
type LoggingConfig struct {
	Level  string `json:"level" yaml:"level"`
	Format string `json:"format" yaml:"format"`
	Output string `json:"output" yaml:"output"`
}

// FeatureFlags holds feature toggles.
type FeatureFlags struct {
	EnableMetrics    bool `json:"enable_metrics" yaml:"enable_metrics"`
	EnableTracing    bool `json:"enable_tracing" yaml:"enable_tracing"`
	EnableProfiling  bool `json:"enable_profiling" yaml:"enable_profiling"`
	EnableCaching    bool `json:"enable_caching" yaml:"enable_caching"`
	ExperimentalMode bool `json:"experimental_mode" yaml:"experimental_mode"`
}

// Default returns a Config with default values.
func Default() Config {
	return Config{
		Processing: ProcessingConfig{
			Timeout:     30 * time.Second,
			Concurrency: 4,
			BatchSize:   100,
			RetryCount:  3,
			RetryDelay:  time.Second,
		},
		Logging: LoggingConfig{
			Level:  "info",
			Format: "json",
			Output: "stdout",
		},
		Features: FeatureFlags{
			EnableMetrics:    true,
			EnableTracing:    false,
			EnableProfiling:  false,
			EnableCaching:    true,
			ExperimentalMode: false,
		},
	}
}

// Load loads configuration from a file.
func Load(path string) (Config, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return Config{}, fmt.Errorf("reading config file: %w", err)
	}

	var cfg Config
	if err := json.Unmarshal(data, &cfg); err != nil {
		return Config{}, fmt.Errorf("parsing config file: %w", err)
	}

	if err := cfg.Validate(); err != nil {
		return Config{}, fmt.Errorf("validating config: %w", err)
	}

	return cfg, nil
}

// LoadWithDefaults loads configuration with defaults for missing values.
func LoadWithDefaults(path string) (Config, error) {
	cfg := Default()

	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return cfg, nil
		}
		return Config{}, fmt.Errorf("reading config file: %w", err)
	}

	if err := json.Unmarshal(data, &cfg); err != nil {
		return Config{}, fmt.Errorf("parsing config file: %w", err)
	}

	return cfg, nil
}

// Validate validates the configuration.
func (c Config) Validate() error {
	if c.Processing.Concurrency < 1 {
		return fmt.Errorf("concurrency must be at least 1")
	}

	if c.Processing.BatchSize < 1 {
		return fmt.Errorf("batch_size must be at least 1")
	}

	if c.Processing.RetryCount < 0 {
		return fmt.Errorf("retry_count cannot be negative")
	}

	validLevels := map[string]bool{
		"debug": true, "info": true, "warn": true, "error": true,
	}
	if !validLevels[c.Logging.Level] {
		return fmt.Errorf("invalid log level: %s", c.Logging.Level)
	}

	return nil
}

// Save saves the configuration to a file.
func (c Config) Save(path string) error {
	data, err := json.MarshalIndent(c, "", "  ")
	if err != nil {
		return fmt.Errorf("marshaling config: %w", err)
	}

	if err := os.WriteFile(path, data, 0644); err != nil {
		return fmt.Errorf("writing config file: %w", err)
	}

	return nil
}
```

### internal/utils/utils.go

```go
package utils

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"regexp"
	"strings"
	"unicode"
)

// GenerateID generates a random hex ID.
func GenerateID(length int) (string, error) {
	bytes := make([]byte, length/2+1)
	if _, err := rand.Read(bytes); err != nil {
		return "", fmt.Errorf("generating random bytes: %w", err)
	}
	return hex.EncodeToString(bytes)[:length], nil
}

// Slugify converts a string to a URL-safe slug.
func Slugify(s string) string {
	// Convert to lowercase
	s = strings.ToLower(s)

	// Replace spaces with hyphens
	s = strings.ReplaceAll(s, " ", "-")

	// Remove non-alphanumeric characters except hyphens
	reg := regexp.MustCompile(`[^a-z0-9-]+`)
	s = reg.ReplaceAllString(s, "")

	// Remove multiple consecutive hyphens
	reg = regexp.MustCompile(`-+`)
	s = reg.ReplaceAllString(s, "-")

	// Trim hyphens from start and end
	s = strings.Trim(s, "-")

	return s
}

// Truncate truncates a string to the specified length with ellipsis.
func Truncate(s string, maxLen int) string {
	if maxLen < 4 {
		return s[:min(len(s), maxLen)]
	}

	runes := []rune(s)
	if len(runes) <= maxLen {
		return s
	}

	return string(runes[:maxLen-3]) + "..."
}

// ToCamelCase converts a string to camelCase.
func ToCamelCase(s string) string {
	words := splitWords(s)
	if len(words) == 0 {
		return ""
	}

	result := strings.ToLower(words[0])
	for _, word := range words[1:] {
		result += strings.Title(strings.ToLower(word))
	}

	return result
}

// ToSnakeCase converts a string to snake_case.
func ToSnakeCase(s string) string {
	words := splitWords(s)
	for i, word := range words {
		words[i] = strings.ToLower(word)
	}
	return strings.Join(words, "_")
}

// ToKebabCase converts a string to kebab-case.
func ToKebabCase(s string) string {
	words := splitWords(s)
	for i, word := range words {
		words[i] = strings.ToLower(word)
	}
	return strings.Join(words, "-")
}

// ToPascalCase converts a string to PascalCase.
func ToPascalCase(s string) string {
	words := splitWords(s)
	for i, word := range words {
		words[i] = strings.Title(strings.ToLower(word))
	}
	return strings.Join(words, "")
}

// splitWords splits a string into words based on various separators.
func splitWords(s string) []string {
	// Replace common separators with spaces
	for _, sep := range []string{"-", "_", ".", " "} {
		s = strings.ReplaceAll(s, sep, " ")
	}

	// Handle camelCase by inserting spaces before uppercase letters
	var result []rune
	for i, r := range s {
		if i > 0 && unicode.IsUpper(r) {
			prev := rune(s[i-1])
			if unicode.IsLower(prev) || unicode.IsDigit(prev) {
				result = append(result, ' ')
			}
		}
		result = append(result, r)
	}

	// Split on spaces and filter empty strings
	words := strings.Fields(string(result))
	return words
}

// Contains checks if a slice contains a value.
func Contains[T comparable](slice []T, value T) bool {
	for _, v := range slice {
		if v == value {
			return true
		}
	}
	return false
}

// Unique returns a slice with duplicate values removed.
func Unique[T comparable](slice []T) []T {
	seen := make(map[T]bool)
	result := make([]T, 0, len(slice))

	for _, v := range slice {
		if !seen[v] {
			seen[v] = true
			result = append(result, v)
		}
	}

	return result
}

// Map applies a function to each element of a slice.
func Map[T, U any](slice []T, fn func(T) U) []U {
	result := make([]U, len(slice))
	for i, v := range slice {
		result[i] = fn(v)
	}
	return result
}

// Filter returns elements that satisfy the predicate.
func Filter[T any](slice []T, fn func(T) bool) []T {
	result := make([]T, 0)
	for _, v := range slice {
		if fn(v) {
			result = append(result, v)
		}
	}
	return result
}

// Reduce reduces a slice to a single value.
func Reduce[T, U any](slice []T, initial U, fn func(U, T) U) U {
	result := initial
	for _, v := range slice {
		result = fn(result, v)
	}
	return result
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
```

### examples/basic/main.go

```go
package main

import (
	"fmt"
	"log"

	mymodule "github.com/username/my-module"
)

func main() {
	// Create a processor with default options
	p := mymodule.New()

	// Process a simple input
	result, err := p.Process("Hello, World!")
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("Result: %s\n", result)

	// Create a processor with options
	p2 := mymodule.New(
		mymodule.WithUppercase(true),
		mymodule.WithPrefix(">>> "),
		mymodule.WithSuffix(" <<<"),
	)

	result2, err := p2.Process("hello")
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("Formatted: %s\n", result2)

	// Use MustProcess for known-valid inputs
	result3 := p.MustProcess("guaranteed valid")
	fmt.Printf("Must: %s\n", result3)

	// Don't forget to close
	_ = p.Close()
	_ = p2.Close()
}
```

### examples/advanced/main.go

```go
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"time"

	mymodule "github.com/username/my-module"
)

func main() {
	// Create processor from config
	cfg := mymodule.Config{
		Timeout:     30 * time.Second,
		Concurrency: 4,
		Uppercase:   false,
		Trim:        true,
		Prefix:      "[",
		Suffix:      "]",
	}

	p := mymodule.NewFromConfig(cfg)
	defer p.Close()

	// Single processing
	result, err := p.Process("  hello world  ")
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("Single: %s\n", result)

	// Batch processing
	inputs := []string{"one", "two", "three", "four", "five"}
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	results, err := p.ProcessBatch(ctx, inputs)
	if err != nil {
		log.Printf("Batch had errors: %v", err)
	}

	fmt.Println("\nBatch results:")
	for _, r := range results {
		if r.IsSuccess() {
			fmt.Printf("  %s -> %s\n", r.Input, r.Output)
		} else {
			fmt.Printf("  %s -> ERROR: %v\n", r.Input, r.Error)
		}
	}

	// Using middleware
	logger := log.New(os.Stdout, "[mymodule] ", log.LstdFlags)
	fn := p.WithMiddleware(
		mymodule.LoggingMiddleware(logger),
		mymodule.RetryMiddleware(3, 100*time.Millisecond),
	)

	fmt.Println("\nWith middleware:")
	_, _ = fn("test with logging")

	// Chaining processors
	chain := mymodule.Chain(
		func(s string) (string, error) { return s + "-step1", nil },
		func(s string) (string, error) { return s + "-step2", nil },
		func(s string) (string, error) { return s + "-step3", nil },
	)

	chained, _ := chain("start")
	fmt.Printf("\nChained: %s\n", chained)

	// Export config as JSON
	configJSON, _ := json.MarshalIndent(cfg, "", "  ")
	fmt.Printf("\nConfig:\n%s\n", configJSON)
}
```

### Makefile

```makefile
.PHONY: all build test lint fmt vet clean docs bench fuzz cover release

# Go parameters
GOCMD=go
GOBUILD=$(GOCMD) build
GOTEST=$(GOCMD) test
GOGET=$(GOCMD) get
GOMOD=$(GOCMD) mod
GOFMT=gofmt
GOVET=$(GOCMD) vet
GOLINT=golangci-lint

# Binary name
BINARY_NAME=my-module
VERSION=$(shell git describe --tags --always --dirty 2>/dev/null || echo "dev")
LDFLAGS=-ldflags "-X main.version=$(VERSION)"

all: lint test build

build:
	$(GOBUILD) $(LDFLAGS) -o $(BINARY_NAME) ./...

test:
	$(GOTEST) -v -race -coverprofile=coverage.out ./...

test-short:
	$(GOTEST) -short ./...

bench:
	$(GOTEST) -bench=. -benchmem ./...

cover: test
	$(GOCMD) tool cover -html=coverage.out -o coverage.html

lint:
	$(GOLINT) run ./...

fmt:
	$(GOFMT) -s -w .

vet:
	$(GOVET) ./...

clean:
	$(GOCMD) clean
	rm -f $(BINARY_NAME)
	rm -f coverage.out coverage.html

docs:
	godoc -http=:6060

tidy:
	$(GOMOD) tidy

verify:
	$(GOMOD) verify

deps:
	$(GOGET) -u ./...

fuzz:
	$(GOTEST) -fuzz=Fuzz -fuzztime=30s ./...

# Install development tools
tools:
	go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
	go install github.com/goreleaser/goreleaser@latest

# Release
release:
	goreleaser release --clean

release-snapshot:
	goreleaser release --snapshot --clean
```

### .golangci.yml

```yaml
run:
  timeout: 5m
  tests: true
  modules-download-mode: readonly

linters:
  enable:
    - bodyclose
    - dogsled
    - dupl
    - errcheck
    - exhaustive
    - funlen
    - gochecknoinits
    - goconst
    - gocritic
    - gocyclo
    - gofmt
    - goimports
    - gomnd
    - goprintffuncname
    - gosec
    - gosimple
    - govet
    - ineffassign
    - lll
    - misspell
    - nakedret
    - noctx
    - nolintlint
    - revive
    - staticcheck
    - stylecheck
    - typecheck
    - unconvert
    - unparam
    - unused
    - whitespace

linters-settings:
  dupl:
    threshold: 150

  funlen:
    lines: 100
    statements: 50

  goconst:
    min-len: 2
    min-occurrences: 3

  gocritic:
    enabled-tags:
      - diagnostic
      - experimental
      - opinionated
      - performance
      - style

  gocyclo:
    min-complexity: 15

  goimports:
    local-prefixes: github.com/username/my-module

  gomnd:
    settings:
      mnd:
        checks:
          - argument
          - case
          - condition
          - return

  govet:
    check-shadowing: true

  lll:
    line-length: 120

  misspell:
    locale: US

  nolintlint:
    allow-leading-space: false
    allow-unused: false
    require-explanation: true
    require-specific: true

issues:
  exclude-rules:
    - path: _test\.go
      linters:
        - dupl
        - funlen
        - gomnd
    - path: examples/
      linters:
        - gomnd
        - errcheck

  max-issues-per-linter: 50
  max-same-issues: 10
```

### .github/workflows/ci.yml

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    name: Test
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
        go: ['1.21', '1.22']
        exclude:
          - os: macos-latest
            go: '1.21'
          - os: windows-latest
            go: '1.21'

    steps:
      - uses: actions/checkout@v4

      - name: Set up Go
        uses: actions/setup-go@v5
        with:
          go-version: ${{ matrix.go }}
          cache: true

      - name: Download dependencies
        run: go mod download

      - name: Verify dependencies
        run: go mod verify

      - name: Build
        run: go build -v ./...

      - name: Test
        run: go test -v -race -coverprofile=coverage.out ./...

      - name: Upload coverage
        if: matrix.os == 'ubuntu-latest' && matrix.go == '1.22'
        uses: codecov/codecov-action@v4
        with:
          files: coverage.out
          fail_ci_if_error: true

  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Go
        uses: actions/setup-go@v5
        with:
          go-version: '1.22'
          cache: true

      - name: golangci-lint
        uses: golangci/golangci-lint-action@v4
        with:
          version: latest
          args: --timeout=5m

  security:
    name: Security
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Gosec
        uses: securego/gosec@master
        with:
          args: ./...

      - name: Run govulncheck
        uses: golang/govulncheck-action@v1
        with:
          go-version-input: '1.22'

  fuzz:
    name: Fuzz
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Go
        uses: actions/setup-go@v5
        with:
          go-version: '1.22'
          cache: true

      - name: Run Fuzz tests
        run: go test -fuzz=Fuzz -fuzztime=30s ./...
```

### .github/workflows/release.yml

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

permissions:
  contents: write

jobs:
  release:
    name: Release
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Set up Go
        uses: actions/setup-go@v5
        with:
          go-version: '1.22'
          cache: true

      - name: Run tests
        run: go test -v ./...

      - name: Run GoReleaser
        uses: goreleaser/goreleaser-action@v5
        with:
          distribution: goreleaser
          version: latest
          args: release --clean
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### .goreleaser.yml

```yaml
version: 1

before:
  hooks:
    - go mod tidy
    - go generate ./...

builds:
  - skip: true  # Library only, no binaries

archives:
  - format: tar.gz
    name_template: >-
      {{ .ProjectName }}_
      {{- title .Os }}_
      {{- if eq .Arch "amd64" }}x86_64
      {{- else if eq .Arch "386" }}i386
      {{- else }}{{ .Arch }}{{ end }}
      {{- if .Arm }}v{{ .Arm }}{{ end }}

changelog:
  sort: asc
  filters:
    exclude:
      - '^docs:'
      - '^test:'
      - '^ci:'
      - Merge pull request
      - Merge branch

release:
  github:
    owner: username
    name: my-module
  draft: false
  prerelease: auto
  mode: replace
  header: |
    ## What's Changed
  footer: |
    **Full Changelog**: https://github.com/username/my-module/compare/{{ .PreviousTag }}...{{ .Tag }}
```

### README.md

```markdown
# my-module

[![Go Reference](https://pkg.go.dev/badge/github.com/username/my-module.svg)](https://pkg.go.dev/github.com/username/my-module)
[![Go Report Card](https://goreportcard.com/badge/github.com/username/my-module)](https://goreportcard.com/report/github.com/username/my-module)
[![CI](https://github.com/username/my-module/actions/workflows/ci.yml/badge.svg)](https://github.com/username/my-module/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/username/my-module/branch/main/graph/badge.svg)](https://codecov.io/gh/username/my-module)
[![License](https://img.shields.io/github/license/username/my-module)](LICENSE)

A brief description of what this module does.

## Installation

```bash
go get github.com/username/my-module
```

## Quick Start

```go
package main

import (
    "fmt"
    "log"

    mymodule "github.com/username/my-module"
)

func main() {
    // Create a processor
    p := mymodule.New(
        mymodule.WithTimeout(30 * time.Second),
        mymodule.WithConcurrency(4),
    )
    defer p.Close()

    // Process input
    result, err := p.Process("hello world")
    if err != nil {
        log.Fatal(err)
    }

    fmt.Println(result)
}
```

## Features

- Functional options pattern for configuration
- Concurrent batch processing
- Middleware support for extensibility
- Comprehensive error handling
- Context support for cancellation

## Configuration Options

| Option | Description | Default |
|--------|-------------|---------|
| `WithTimeout` | Processing timeout | No timeout |
| `WithConcurrency` | Max concurrent operations | 1 |
| `WithUppercase` | Convert output to uppercase | false |
| `WithTrim` | Trim whitespace | false |
| `WithPrefix` | Add prefix to output | "" |
| `WithSuffix` | Add suffix to output | "" |
| `WithLogger` | Set custom logger | nil |

## Documentation

- [API Reference](https://pkg.go.dev/github.com/username/my-module)
- [Examples](./examples/)
- [CHANGELOG](./CHANGELOG.md)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](LICENSE) for details.
```

## CLAUDE.md Integration

```markdown
# My Module - Go Library

## Build Commands
- `go build ./...` - Build the module
- `go test ./...` - Run all tests
- `go test -v -race ./...` - Run tests with race detector
- `go test -bench=. ./...` - Run benchmarks
- `go test -fuzz=Fuzz ./...` - Run fuzz tests
- `golangci-lint run` - Run linter
- `go doc -all` - Generate documentation
- `make` - Run default targets (lint, test, build)

## Architecture
- **module.go** - Main Processor type and core functionality
- **options.go** - Functional options and Config type
- **errors.go** - Error types and sentinel errors
- **doc.go** - Package documentation
- **internal/config/** - Internal configuration utilities
- **internal/utils/** - Internal helper functions
- **examples/** - Usage examples

## Testing Patterns
- Table-driven tests with testify
- Parallel tests with t.Parallel()
- Benchmark tests with b.ResetTimer()
- Fuzz tests for input validation
- Integration tests in separate _test.go files

## Key Patterns
- Functional options (WithXxx functions)
- Middleware chain pattern
- Context for cancellation
- Generics for utility functions
- Sync primitives for concurrency

## Release Process
1. Update version in module.go
2. Update CHANGELOG.md
3. Create and push tag: `git tag v1.0.0 && git push --tags`
4. GoReleaser creates GitHub release automatically
```

## AI Suggestions

1. **Add OpenTelemetry integration** - Implement tracing spans for distributed tracing with OTEL SDK
2. **Create gRPC service wrapper** - Add protobuf definitions and gRPC server implementation
3. **Implement caching layer** - Add in-memory LRU cache with configurable TTL and size limits
4. **Add metrics collection** - Implement Prometheus metrics for processing latency and throughput
5. **Create mock generator** - Use mockgen to auto-generate mocks for testing interfaces
6. **Implement rate limiting** - Add token bucket or leaky bucket rate limiter for API protection
7. **Add circuit breaker** - Implement circuit breaker pattern for fault tolerance
8. **Create plugin system** - Support dynamic loading of processing plugins via Go plugins
9. **Add streaming support** - Implement io.Reader/io.Writer interfaces for stream processing
10. **Generate client SDKs** - Create OpenAPI spec and generate client libraries for other languages
