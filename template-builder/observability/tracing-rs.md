# Rust Tracing Template

High-performance structured logging and diagnostics for Rust with the `tracing` ecosystem.

## Overview

`tracing` is a framework for instrumenting Rust programs to collect structured, event-based diagnostic information. It's designed for async/await, works across threads, and provides powerful filtering and formatting capabilities.

## Installation

```toml
# Cargo.toml
[dependencies]
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter", "json", "fmt"] }
tracing-appender = "0.2"
tracing-error = "0.2"
tracing-futures = "0.2"

# For async runtimes
tokio = { version = "1", features = ["full", "tracing"] }

# For web frameworks
tracing-actix-web = "0.7"  # Actix-web
tower-http = { version = "0.5", features = ["trace"] }  # Tower/Axum

# For OpenTelemetry
tracing-opentelemetry = "0.22"
opentelemetry = "0.21"
opentelemetry_sdk = "0.21"
opentelemetry-otlp = "0.14"

# For JSON logging
tracing-bunyan-formatter = "0.3"
```

## Environment Variables

```env
# Logging Configuration
RUST_LOG=info
LOG_FORMAT=json
LOG_FILE=/var/log/app/app.log

# Service identification
SERVICE_NAME=my-service
SERVICE_VERSION=1.0.0
ENVIRONMENT=production

# OpenTelemetry
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
```

## Core Configuration

### src/telemetry.rs

```rust
use std::env;
use tracing::subscriber::set_global_default;
use tracing_subscriber::{
    fmt::{self, format::FmtSpan, time::UtcTime},
    layer::SubscriberExt,
    util::SubscriberInitExt,
    EnvFilter, Layer, Registry,
};
use tracing_appender::rolling::{RollingFileAppender, Rotation};

/// Telemetry configuration
pub struct TelemetryConfig {
    pub service_name: String,
    pub service_version: String,
    pub environment: String,
    pub log_level: String,
    pub log_format: LogFormat,
    pub log_file: Option<String>,
}

#[derive(Debug, Clone, PartialEq)]
pub enum LogFormat {
    Json,
    Pretty,
    Compact,
}

impl Default for TelemetryConfig {
    fn default() -> Self {
        Self {
            service_name: env::var("SERVICE_NAME").unwrap_or_else(|_| "app".to_string()),
            service_version: env::var("SERVICE_VERSION").unwrap_or_else(|_| "1.0.0".to_string()),
            environment: env::var("ENVIRONMENT").unwrap_or_else(|_| "development".to_string()),
            log_level: env::var("RUST_LOG").unwrap_or_else(|_| "info".to_string()),
            log_format: match env::var("LOG_FORMAT").as_deref() {
                Ok("json") => LogFormat::Json,
                Ok("pretty") => LogFormat::Pretty,
                _ => LogFormat::Compact,
            },
            log_file: env::var("LOG_FILE").ok(),
        }
    }
}

/// Initialize telemetry with the given configuration
pub fn init_telemetry(config: TelemetryConfig) {
    // Environment filter
    let env_filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new(&config.log_level));

    // Build the subscriber based on format
    match config.log_format {
        LogFormat::Json => init_json_subscriber(config, env_filter),
        LogFormat::Pretty => init_pretty_subscriber(config, env_filter),
        LogFormat::Compact => init_compact_subscriber(config, env_filter),
    }
}

fn init_json_subscriber(config: TelemetryConfig, env_filter: EnvFilter) {
    let formatting_layer = tracing_bunyan_formatter::BunyanFormattingLayer::new(
        config.service_name.clone(),
        std::io::stdout,
    );

    let subscriber = Registry::default()
        .with(env_filter)
        .with(tracing_bunyan_formatter::JsonStorageLayer)
        .with(formatting_layer);

    set_global_default(subscriber).expect("Failed to set subscriber");
}

fn init_pretty_subscriber(config: TelemetryConfig, env_filter: EnvFilter) {
    let fmt_layer = fmt::layer()
        .pretty()
        .with_target(true)
        .with_thread_ids(true)
        .with_thread_names(true)
        .with_file(true)
        .with_line_number(true)
        .with_span_events(FmtSpan::NEW | FmtSpan::CLOSE);

    let subscriber = Registry::default()
        .with(env_filter)
        .with(fmt_layer);

    set_global_default(subscriber).expect("Failed to set subscriber");
}

fn init_compact_subscriber(config: TelemetryConfig, env_filter: EnvFilter) {
    let fmt_layer = fmt::layer()
        .compact()
        .with_target(true)
        .with_timer(UtcTime::rfc_3339());

    // Optional file appender
    if let Some(log_file) = config.log_file {
        let file_appender = RollingFileAppender::new(
            Rotation::DAILY,
            std::path::Path::new(&log_file).parent().unwrap_or(std::path::Path::new(".")),
            std::path::Path::new(&log_file).file_name().unwrap_or_default(),
        );
        let (non_blocking, _guard) = tracing_appender::non_blocking(file_appender);

        let file_layer = fmt::layer()
            .json()
            .with_writer(non_blocking)
            .with_ansi(false);

        let subscriber = Registry::default()
            .with(env_filter)
            .with(fmt_layer)
            .with(file_layer);

        set_global_default(subscriber).expect("Failed to set subscriber");
    } else {
        let subscriber = Registry::default()
            .with(env_filter)
            .with(fmt_layer);

        set_global_default(subscriber).expect("Failed to set subscriber");
    }
}

/// Initialize simple telemetry for quick setup
pub fn init_simple() {
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::from_default_env())
        .with_target(true)
        .init();
}
```

## Span and Event Macros

### src/logging.rs

```rust
use tracing::{debug, error, info, info_span, instrument, trace, warn, Span};

/// Log application startup
pub fn log_startup(port: u16, version: &str) {
    info!(
        port = port,
        version = version,
        "Application starting"
    );
}

/// Log request with span
#[instrument(
    name = "handle_request",
    skip(body),
    fields(
        request_id = %request_id,
        method = %method,
        path = %path,
    )
)]
pub async fn handle_request(
    request_id: &str,
    method: &str,
    path: &str,
    body: &[u8],
) -> Result<(), Error> {
    info!("Processing request");

    // Add dynamic field to span
    Span::current().record("body_size", body.len());

    // Nested span for database operation
    let user = fetch_user(request_id).await?;

    info!(user_id = %user.id, "Request processed successfully");
    Ok(())
}

/// Database operation with instrumentation
#[instrument(skip(request_id), fields(db = "postgres"))]
async fn fetch_user(request_id: &str) -> Result<User, Error> {
    debug!("Fetching user from database");

    // Simulate DB call
    tokio::time::sleep(std::time::Duration::from_millis(10)).await;

    Ok(User {
        id: "user-123".to_string(),
        name: "John Doe".to_string(),
    })
}

/// Error logging with context
pub fn log_error(error: &Error, context: &str) {
    error!(
        error = %error,
        context = context,
        "Operation failed"
    );
}

/// Performance logging
pub fn log_performance(operation: &str, duration_ms: u64) {
    if duration_ms > 1000 {
        warn!(
            operation = operation,
            duration_ms = duration_ms,
            "Slow operation detected"
        );
    } else {
        debug!(
            operation = operation,
            duration_ms = duration_ms,
            "Operation completed"
        );
    }
}

/// Structured event logging
pub fn log_event(event_name: &str, data: serde_json::Value) {
    info!(
        event = event_name,
        data = %data,
        "Business event"
    );
}

/// Audit logging
pub fn log_audit(action: &str, actor: &str, resource: &str, resource_id: &str) {
    info!(
        audit = true,
        action = action,
        actor = actor,
        resource = resource,
        resource_id = resource_id,
        "Audit event"
    );
}

/// Security event logging
pub fn log_security(event: &str, severity: &str, details: &str) {
    match severity {
        "critical" | "high" => error!(
            security = true,
            event = event,
            severity = severity,
            details = details,
            "Security event"
        ),
        _ => warn!(
            security = true,
            event = event,
            severity = severity,
            details = details,
            "Security event"
        ),
    }
}

#[derive(Debug)]
pub struct User {
    pub id: String,
    pub name: String,
}

#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("Database error: {0}")]
    Database(String),
    #[error("Not found: {0}")]
    NotFound(String),
}
```

## Axum Integration

### src/middleware/logging.rs

```rust
use axum::{
    body::Body,
    extract::Request,
    middleware::Next,
    response::Response,
};
use std::time::Instant;
use tracing::{info, info_span, Instrument, Span};
use uuid::Uuid;

/// Logging middleware for Axum
pub async fn logging_middleware(request: Request, next: Next) -> Response {
    let request_id = request
        .headers()
        .get("x-request-id")
        .and_then(|v| v.to_str().ok())
        .map(String::from)
        .unwrap_or_else(|| Uuid::new_v4().to_string());

    let method = request.method().to_string();
    let uri = request.uri().to_string();
    let path = request.uri().path().to_string();

    // Create span for request
    let span = info_span!(
        "http_request",
        request_id = %request_id,
        method = %method,
        path = %path,
        status_code = tracing::field::Empty,
        latency_ms = tracing::field::Empty,
    );

    let start = Instant::now();

    info!(parent: &span, "Request started");

    // Process request within span
    let response = next.run(request).instrument(span.clone()).await;

    let latency = start.elapsed();
    let status = response.status().as_u16();

    span.record("status_code", status);
    span.record("latency_ms", latency.as_millis() as u64);

    if status >= 500 {
        tracing::error!(parent: &span, "Request failed");
    } else if status >= 400 {
        tracing::warn!(parent: &span, "Request completed with client error");
    } else {
        info!(parent: &span, "Request completed");
    }

    response
}

/// Tower layer for tracing
pub fn trace_layer() -> tower_http::trace::TraceLayer<
    tower_http::classify::SharedClassifier<tower_http::classify::ServerErrorsAsFailures>,
> {
    tower_http::trace::TraceLayer::new_for_http()
        .make_span_with(|request: &Request<Body>| {
            let request_id = request
                .headers()
                .get("x-request-id")
                .and_then(|v| v.to_str().ok())
                .unwrap_or("unknown");

            info_span!(
                "http_request",
                request_id = %request_id,
                method = %request.method(),
                uri = %request.uri(),
            )
        })
        .on_request(|request: &Request<Body>, _span: &Span| {
            info!("Request received");
        })
        .on_response(
            |response: &Response<Body>, latency: std::time::Duration, _span: &Span| {
                info!(
                    status = %response.status(),
                    latency_ms = %latency.as_millis(),
                    "Request completed"
                );
            },
        )
        .on_failure(
            |error: tower_http::classify::ServerErrorsFailureClass,
             latency: std::time::Duration,
             _span: &Span| {
                tracing::error!(
                    error = %error,
                    latency_ms = %latency.as_millis(),
                    "Request failed"
                );
            },
        )
}
```

### src/main.rs (Axum example)

```rust
use axum::{
    extract::Path,
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use tracing::{info, instrument};

mod middleware;
mod telemetry;

#[tokio::main]
async fn main() {
    // Initialize telemetry
    telemetry::init_telemetry(telemetry::TelemetryConfig::default());

    info!("Starting application");

    // Build router
    let app = Router::new()
        .route("/health", get(health_check))
        .route("/api/users/:id", get(get_user))
        .route("/api/users", post(create_user))
        .layer(axum::middleware::from_fn(middleware::logging::logging_middleware));

    let addr = SocketAddr::from(([0, 0, 0, 0], 3000));
    info!(address = %addr, "Server listening");

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn health_check() -> &'static str {
    "OK"
}

#[instrument(skip_all, fields(user_id = %id))]
async fn get_user(Path(id): Path<String>) -> Json<User> {
    info!("Fetching user");

    // Simulate database call
    let user = User {
        id,
        name: "John Doe".to_string(),
        email: "john@example.com".to_string(),
    };

    info!(user_name = %user.name, "User fetched");
    Json(user)
}

#[instrument(skip_all, fields(user_email = %input.email))]
async fn create_user(Json(input): Json<CreateUser>) -> Json<User> {
    info!("Creating user");

    let user = User {
        id: uuid::Uuid::new_v4().to_string(),
        name: input.name,
        email: input.email,
    };

    info!(user_id = %user.id, "User created");
    Json(user)
}

#[derive(Serialize)]
struct User {
    id: String,
    name: String,
    email: String,
}

#[derive(Deserialize)]
struct CreateUser {
    name: String,
    email: String,
}
```

## Actix-web Integration

### src/actix_logging.rs

```rust
use actix_web::{
    dev::{ServiceRequest, ServiceResponse},
    Error, HttpMessage,
};
use tracing::{info, info_span, Span};
use tracing_actix_web::{DefaultRootSpanBuilder, RootSpanBuilder, TracingLogger};
use uuid::Uuid;

/// Custom root span builder
pub struct CustomRootSpanBuilder;

impl RootSpanBuilder for CustomRootSpanBuilder {
    fn on_request_start(request: &ServiceRequest) -> Span {
        let request_id = request
            .headers()
            .get("x-request-id")
            .and_then(|v| v.to_str().ok())
            .map(String::from)
            .unwrap_or_else(|| Uuid::new_v4().to_string());

        // Store request_id in extensions for later use
        request.extensions_mut().insert(request_id.clone());

        info_span!(
            "http_request",
            request_id = %request_id,
            method = %request.method(),
            path = %request.path(),
            query = %request.query_string(),
            peer_ip = tracing::field::Empty,
            status_code = tracing::field::Empty,
        )
    }

    fn on_request_end<B>(span: Span, outcome: &Result<ServiceResponse<B>, Error>) {
        match outcome {
            Ok(response) => {
                let status = response.status().as_u16();
                span.record("status_code", status);

                if status >= 500 {
                    tracing::error!(parent: &span, "Request failed");
                } else {
                    info!(parent: &span, "Request completed");
                }
            }
            Err(error) => {
                tracing::error!(parent: &span, error = %error, "Request error");
            }
        }
    }
}

/// Get the tracing logger middleware
pub fn tracing_logger() -> TracingLogger<CustomRootSpanBuilder> {
    TracingLogger::<CustomRootSpanBuilder>::new()
}
```

## OpenTelemetry Integration

### src/otel.rs

```rust
use opentelemetry::trace::TracerProvider;
use opentelemetry_otlp::WithExportConfig;
use opentelemetry_sdk::{
    runtime,
    trace::{Config, Tracer},
    Resource,
};
use opentelemetry::KeyValue;
use tracing_opentelemetry::OpenTelemetryLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt, EnvFilter, Registry};
use std::env;

/// Initialize OpenTelemetry with tracing
pub fn init_otel_tracing() -> Result<(), Box<dyn std::error::Error>> {
    let service_name = env::var("SERVICE_NAME").unwrap_or_else(|_| "app".to_string());
    let service_version = env::var("SERVICE_VERSION").unwrap_or_else(|_| "1.0.0".to_string());
    let environment = env::var("ENVIRONMENT").unwrap_or_else(|_| "development".to_string());

    // Configure OTLP exporter
    let otlp_endpoint = env::var("OTEL_EXPORTER_OTLP_ENDPOINT")
        .unwrap_or_else(|_| "http://localhost:4317".to_string());

    let tracer = opentelemetry_otlp::new_pipeline()
        .tracing()
        .with_exporter(
            opentelemetry_otlp::new_exporter()
                .tonic()
                .with_endpoint(otlp_endpoint),
        )
        .with_trace_config(
            Config::default().with_resource(Resource::new(vec![
                KeyValue::new("service.name", service_name.clone()),
                KeyValue::new("service.version", service_version),
                KeyValue::new("deployment.environment", environment),
            ])),
        )
        .install_batch(runtime::Tokio)?;

    // Create OpenTelemetry layer
    let otel_layer = OpenTelemetryLayer::new(tracer);

    // Create fmt layer for console output
    let fmt_layer = tracing_subscriber::fmt::layer()
        .with_target(true)
        .json();

    // Create env filter
    let env_filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new("info"));

    // Combine layers
    Registry::default()
        .with(env_filter)
        .with(fmt_layer)
        .with(otel_layer)
        .init();

    tracing::info!(service = %service_name, "Telemetry initialized with OpenTelemetry");

    Ok(())
}

/// Shutdown OpenTelemetry
pub fn shutdown_otel() {
    opentelemetry::global::shutdown_tracer_provider();
}
```

## Custom Layers

### src/layers.rs

```rust
use std::fmt;
use tracing::{Event, Subscriber};
use tracing_subscriber::{
    fmt::{format, FormatEvent, FormatFields, FormattedFields},
    layer::Context,
    registry::LookupSpan,
    Layer,
};

/// Custom formatting layer
pub struct CustomFormatter {
    service_name: String,
}

impl CustomFormatter {
    pub fn new(service_name: impl Into<String>) -> Self {
        Self {
            service_name: service_name.into(),
        }
    }
}

impl<S, N> FormatEvent<S, N> for CustomFormatter
where
    S: Subscriber + for<'a> LookupSpan<'a>,
    N: for<'a> FormatFields<'a> + 'static,
{
    fn format_event(
        &self,
        ctx: &format::FmtContext<'_, S, N>,
        mut writer: format::Writer<'_>,
        event: &Event<'_>,
    ) -> fmt::Result {
        let metadata = event.metadata();
        let timestamp = chrono::Utc::now().to_rfc3339();

        // Write base fields
        write!(
            writer,
            r#"{{"timestamp":"{}","level":"{}","service":"{}","target":"{}""#,
            timestamp,
            metadata.level(),
            self.service_name,
            metadata.target(),
        )?;

        // Write span context
        if let Some(scope) = ctx.event_scope() {
            write!(writer, r#","spans":["#)?;
            let mut first = true;
            for span in scope {
                if !first {
                    write!(writer, ",")?;
                }
                write!(writer, r#""{}""#, span.name())?;

                // Include span fields
                let extensions = span.extensions();
                if let Some(fields) = extensions.get::<FormattedFields<N>>() {
                    if !fields.is_empty() {
                        // Fields available
                    }
                }
                first = false;
            }
            write!(writer, "]")?;
        }

        // Write event fields
        write!(writer, r#","fields":{{"#)?;
        let mut visitor = JsonVisitor::new();
        event.record(&mut visitor);
        write!(writer, "{}", visitor.output)?;
        write!(writer, "}}")?;

        writeln!(writer, "}}")
    }
}

struct JsonVisitor {
    output: String,
    first: bool,
}

impl JsonVisitor {
    fn new() -> Self {
        Self {
            output: String::new(),
            first: true,
        }
    }
}

impl tracing::field::Visit for JsonVisitor {
    fn record_str(&mut self, field: &tracing::field::Field, value: &str) {
        if !self.first {
            self.output.push(',');
        }
        self.output.push_str(&format!(r#""{}":"{}""#, field.name(), value));
        self.first = false;
    }

    fn record_debug(&mut self, field: &tracing::field::Field, value: &dyn fmt::Debug) {
        if !self.first {
            self.output.push(',');
        }
        self.output.push_str(&format!(r#""{}":"{:?}""#, field.name(), value));
        self.first = false;
    }

    fn record_i64(&mut self, field: &tracing::field::Field, value: i64) {
        if !self.first {
            self.output.push(',');
        }
        self.output.push_str(&format!(r#""{}":"{}""#, field.name(), value));
        self.first = false;
    }

    fn record_u64(&mut self, field: &tracing::field::Field, value: u64) {
        if !self.first {
            self.output.push(',');
        }
        self.output.push_str(&format!(r#""{}":"{}""#, field.name(), value));
        self.first = false;
    }

    fn record_bool(&mut self, field: &tracing::field::Field, value: bool) {
        if !self.first {
            self.output.push(',');
        }
        self.output.push_str(&format!(r#""{}":"{}""#, field.name(), value));
        self.first = false;
    }
}

/// Filtering layer that only logs specific targets
pub struct TargetFilter {
    targets: Vec<String>,
}

impl TargetFilter {
    pub fn new(targets: Vec<String>) -> Self {
        Self { targets }
    }
}

impl<S> Layer<S> for TargetFilter
where
    S: Subscriber,
{
    fn enabled(
        &self,
        metadata: &tracing::Metadata<'_>,
        _ctx: Context<'_, S>,
    ) -> bool {
        self.targets.iter().any(|t| metadata.target().starts_with(t))
    }
}

/// Metrics layer that counts events by level
pub struct MetricsLayer {
    // In production, use atomic counters or metrics library
}

impl MetricsLayer {
    pub fn new() -> Self {
        Self {}
    }
}

impl<S> Layer<S> for MetricsLayer
where
    S: Subscriber,
{
    fn on_event(&self, event: &Event<'_>, _ctx: Context<'_, S>) {
        let level = event.metadata().level();
        // Increment metrics counter for level
        // metrics::counter!("log_events", "level" => level.to_string()).increment(1);
    }
}
```

## Testing

### src/tests.rs

```rust
#[cfg(test)]
mod tests {
    use tracing::{info, info_span, instrument};
    use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
    use tracing_test::traced_test;

    #[traced_test]
    #[test]
    fn test_basic_logging() {
        info!("Test message");
        assert!(logs_contain("Test message"));
    }

    #[traced_test]
    #[test]
    fn test_logging_with_fields() {
        info!(user_id = "123", action = "login", "User action");
        assert!(logs_contain("user_id"));
        assert!(logs_contain("123"));
    }

    #[traced_test]
    #[test]
    fn test_span_logging() {
        let span = info_span!("test_span", test_field = "value");
        let _guard = span.enter();

        info!("Inside span");
        assert!(logs_contain("test_span"));
    }

    #[traced_test]
    #[tokio::test]
    async fn test_async_instrumented() {
        #[instrument]
        async fn async_operation() {
            info!("Async operation");
        }

        async_operation().await;
        assert!(logs_contain("async_operation"));
    }

    #[test]
    fn test_log_levels() {
        // Set up test subscriber
        let subscriber = tracing_subscriber::fmt()
            .with_test_writer()
            .with_max_level(tracing::Level::DEBUG)
            .finish();

        tracing::subscriber::with_default(subscriber, || {
            tracing::trace!("Trace message");
            tracing::debug!("Debug message");
            tracing::info!("Info message");
            tracing::warn!("Warn message");
            tracing::error!("Error message");
        });
    }
}
```

## CLAUDE.md Integration

```markdown
## Logging with tracing

This project uses the `tracing` crate for structured logging.

### Usage
```rust
use tracing::{info, debug, error, instrument, info_span};

// Basic logging
info!("Operation completed");
info!(user_id = %id, action = "login", "User logged in");

// Instrument functions
#[instrument]
async fn my_function(param: &str) -> Result<(), Error> {
    info!("Processing");
    Ok(())
}

// Manual spans
let span = info_span!("operation", op_id = %id);
let _guard = span.enter();
```

### Best Practices
1. Use `#[instrument]` for function-level tracing
2. Include relevant context in span fields
3. Use appropriate log levels
4. Never log sensitive data
5. Use structured fields instead of string interpolation

### Log Levels
- `error!`: Errors requiring attention
- `warn!`: Potential issues
- `info!`: Normal operations
- `debug!`: Debugging information
- `trace!`: Very detailed tracing
```

## AI Suggestions

1. **Distributed Tracing**: Implement full OpenTelemetry integration with trace context propagation
2. **Custom Exporters**: Create exporters for Datadog, Honeycomb, and other observability platforms
3. **Metrics Integration**: Add metrics extraction from spans using prometheus
4. **Sampling Strategies**: Implement adaptive sampling based on error rates or latency
5. **Span Links**: Add support for linking related spans across service boundaries
6. **Baggage Propagation**: Implement W3C baggage for cross-service context
7. **Error Enhancement**: Create custom error types with automatic span recording
8. **Performance Profiling**: Add CPU/memory profiling spans for critical paths
9. **Log Correlation**: Ensure logs include trace/span IDs for correlation
10. **Dynamic Configuration**: Support runtime log level changes via config
