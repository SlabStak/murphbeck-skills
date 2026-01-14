# Structlog Template (Python)

Structured logging library for Python with powerful processors, context binding, and stdlib integration.

## Overview

Structlog is a production-ready structured logging library for Python that makes logging fun again. It provides context-local bindings, powerful processors, and seamless integration with Python's standard library logging.

## Installation

```bash
# Core package
pip install structlog

# Optional integrations
pip install structlog[dev]  # Development dependencies
pip install orjson          # Faster JSON serialization
pip install rich            # Pretty console output
pip install python-json-logger  # JSON formatter for stdlib

# Async support
pip install aiologger

# Type stubs
pip install types-structlog
```

## Environment Variables

```env
# Logging Configuration
LOG_LEVEL=INFO
LOG_FORMAT=json
LOG_PRETTY=false

# Service identification
SERVICE_NAME=my-app
SERVICE_VERSION=1.0.0
ENVIRONMENT=production

# Output configuration
LOG_FILE=/var/log/app/app.log
```

## Core Configuration

### logging_config.py

```python
import logging
import logging.config
import sys
from typing import Any, MutableMapping

import structlog
from structlog.types import EventDict, Processor


def add_service_context(
    logger: logging.Logger, method_name: str, event_dict: EventDict
) -> EventDict:
    """Add service-level context to all logs."""
    import os

    event_dict["service"] = os.getenv("SERVICE_NAME", "app")
    event_dict["version"] = os.getenv("SERVICE_VERSION", "1.0.0")
    event_dict["environment"] = os.getenv("ENVIRONMENT", "development")
    return event_dict


def add_caller_info(
    logger: logging.Logger, method_name: str, event_dict: EventDict
) -> EventDict:
    """Add caller information (file, function, line)."""
    # Skip structlog internal frames
    frame = sys._getframe()
    while frame:
        module = frame.f_globals.get("__name__", "")
        if not module.startswith("structlog") and not module.startswith("logging"):
            event_dict["caller"] = {
                "file": frame.f_code.co_filename,
                "function": frame.f_code.co_name,
                "line": frame.f_lineno,
            }
            break
        frame = frame.f_back
    return event_dict


def drop_color_message_key(
    logger: logging.Logger, method_name: str, event_dict: EventDict
) -> EventDict:
    """Remove color_message key added by uvicorn."""
    event_dict.pop("color_message", None)
    return event_dict


def rename_event_key(
    logger: logging.Logger, method_name: str, event_dict: EventDict
) -> EventDict:
    """Rename 'event' to 'message' for consistency."""
    event_dict["message"] = event_dict.pop("event", "")
    return event_dict


def censor_sensitive_data(
    logger: logging.Logger, method_name: str, event_dict: EventDict
) -> EventDict:
    """Redact sensitive fields from logs."""
    sensitive_keys = {
        "password", "token", "api_key", "secret", "authorization",
        "credit_card", "ssn", "private_key", "access_token", "refresh_token"
    }

    def redact(obj: Any) -> Any:
        if isinstance(obj, dict):
            return {
                k: "[REDACTED]" if k.lower() in sensitive_keys else redact(v)
                for k, v in obj.items()
            }
        elif isinstance(obj, list):
            return [redact(item) for item in obj]
        return obj

    return redact(event_dict)


def setup_logging(
    log_level: str = "INFO",
    json_logs: bool = True,
    log_file: str | None = None
) -> None:
    """Configure structlog with stdlib integration."""
    import os

    log_level = os.getenv("LOG_LEVEL", log_level).upper()
    json_logs = os.getenv("LOG_FORMAT", "json").lower() == "json"

    # Shared processors for both structlog and stdlib
    shared_processors: list[Processor] = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.UnicodeDecoder(),
        add_service_context,
        censor_sensitive_data,
    ]

    if json_logs:
        # JSON output for production
        shared_processors.extend([
            rename_event_key,
            structlog.processors.format_exc_info,
        ])

        structlog.configure(
            processors=shared_processors + [
                structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
            ],
            logger_factory=structlog.stdlib.LoggerFactory(),
            wrapper_class=structlog.stdlib.BoundLogger,
            cache_logger_on_first_use=True,
        )

        formatter = structlog.stdlib.ProcessorFormatter(
            foreign_pre_chain=shared_processors,
            processors=[
                structlog.stdlib.ProcessorFormatter.remove_processors_meta,
                structlog.processors.JSONRenderer(),
            ],
        )
    else:
        # Pretty console output for development
        structlog.configure(
            processors=shared_processors + [
                structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
            ],
            logger_factory=structlog.stdlib.LoggerFactory(),
            wrapper_class=structlog.stdlib.BoundLogger,
            cache_logger_on_first_use=True,
        )

        formatter = structlog.stdlib.ProcessorFormatter(
            foreign_pre_chain=shared_processors,
            processors=[
                structlog.stdlib.ProcessorFormatter.remove_processors_meta,
                structlog.dev.ConsoleRenderer(colors=True),
            ],
        )

    # Configure handlers
    handlers: dict[str, dict] = {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "structlog",
            "stream": "ext://sys.stdout",
        },
    }

    if log_file:
        handlers["file"] = {
            "class": "logging.handlers.RotatingFileHandler",
            "formatter": "structlog",
            "filename": log_file,
            "maxBytes": 10 * 1024 * 1024,  # 10MB
            "backupCount": 5,
        }

    logging.config.dictConfig({
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "structlog": {
                "()": structlog.stdlib.ProcessorFormatter,
                "foreign_pre_chain": shared_processors,
                "processors": formatter.processors,
            },
        },
        "handlers": handlers,
        "root": {
            "level": log_level,
            "handlers": list(handlers.keys()),
        },
        "loggers": {
            # Quiet noisy loggers
            "uvicorn": {"level": "INFO"},
            "uvicorn.access": {"level": "WARNING"},
            "httpx": {"level": "WARNING"},
            "httpcore": {"level": "WARNING"},
        },
    })


def get_logger(name: str | None = None) -> structlog.stdlib.BoundLogger:
    """Get a bound logger instance."""
    return structlog.get_logger(name)
```

## Context Management

### context.py

```python
from contextvars import ContextVar
from typing import Any, Generator
from contextlib import contextmanager
import uuid

import structlog


# Request context storage
request_id_var: ContextVar[str | None] = ContextVar("request_id", default=None)
user_id_var: ContextVar[str | None] = ContextVar("user_id", default=None)
correlation_id_var: ContextVar[str | None] = ContextVar("correlation_id", default=None)


def get_request_id() -> str | None:
    """Get current request ID."""
    return request_id_var.get()


def get_user_id() -> str | None:
    """Get current user ID."""
    return user_id_var.get()


@contextmanager
def request_context(
    request_id: str | None = None,
    user_id: str | None = None,
    correlation_id: str | None = None,
    **extra: Any
) -> Generator[None, None, None]:
    """Context manager for request-scoped logging context."""
    request_id = request_id or str(uuid.uuid4())

    # Set context variables
    request_token = request_id_var.set(request_id)
    user_token = user_id_var.set(user_id) if user_id else None
    correlation_token = correlation_id_var.set(correlation_id) if correlation_id else None

    # Bind to structlog context
    structlog.contextvars.clear_contextvars()
    structlog.contextvars.bind_contextvars(
        request_id=request_id,
        user_id=user_id,
        correlation_id=correlation_id,
        **extra
    )

    try:
        yield
    finally:
        # Reset context variables
        request_id_var.reset(request_token)
        if user_token:
            user_id_var.reset(user_token)
        if correlation_token:
            correlation_id_var.reset(correlation_token)

        structlog.contextvars.clear_contextvars()


def bind_context(**kwargs: Any) -> None:
    """Bind additional context to current logger."""
    structlog.contextvars.bind_contextvars(**kwargs)


def unbind_context(*keys: str) -> None:
    """Unbind context keys from current logger."""
    structlog.contextvars.unbind_contextvars(*keys)


def clear_context() -> None:
    """Clear all bound context."""
    structlog.contextvars.clear_contextvars()
```

## FastAPI Integration

### middleware.py

```python
import time
import uuid
from typing import Callable

import structlog
from fastapi import FastAPI, Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from .context import request_context, bind_context
from .logging_config import get_logger

logger = get_logger(__name__)


class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware for request logging with structlog."""

    async def dispatch(
        self, request: Request, call_next: Callable
    ) -> Response:
        # Extract or generate request ID
        request_id = (
            request.headers.get("x-request-id") or
            request.headers.get("x-correlation-id") or
            str(uuid.uuid4())
        )

        # Extract user ID if available (e.g., from auth)
        user_id = getattr(request.state, "user_id", None)

        # Set up request context
        with request_context(
            request_id=request_id,
            user_id=user_id,
            method=request.method,
            path=request.url.path,
            client_ip=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
        ):
            start_time = time.perf_counter()

            logger.info(
                "request_started",
                query_params=dict(request.query_params),
                path_params=request.path_params,
            )

            try:
                response = await call_next(request)

                duration_ms = (time.perf_counter() - start_time) * 1000

                # Determine log level based on status code
                if response.status_code >= 500:
                    log_method = logger.error
                elif response.status_code >= 400:
                    log_method = logger.warning
                else:
                    log_method = logger.info

                log_method(
                    "request_completed",
                    status_code=response.status_code,
                    duration_ms=round(duration_ms, 2),
                )

                # Add request ID to response headers
                response.headers["x-request-id"] = request_id

                return response

            except Exception as exc:
                duration_ms = (time.perf_counter() - start_time) * 1000

                logger.exception(
                    "request_failed",
                    duration_ms=round(duration_ms, 2),
                    error_type=type(exc).__name__,
                    error_message=str(exc),
                )
                raise


def setup_middleware(app: FastAPI) -> None:
    """Set up logging middleware for FastAPI."""
    app.add_middleware(LoggingMiddleware)


# Alternative: Pure ASGI middleware for better performance
class ASGILoggingMiddleware:
    """ASGI middleware for request logging."""

    def __init__(self, app: ASGIApp) -> None:
        self.app = app
        self.logger = get_logger(__name__)

    async def __call__(self, scope: dict, receive: Callable, send: Callable) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        request_id = str(uuid.uuid4())
        start_time = time.perf_counter()
        status_code = 500

        async def send_wrapper(message: dict) -> None:
            nonlocal status_code
            if message["type"] == "http.response.start":
                status_code = message["status"]
            await send(message)

        with request_context(request_id=request_id):
            try:
                await self.app(scope, receive, send_wrapper)
            finally:
                duration_ms = (time.perf_counter() - start_time) * 1000
                self.logger.info(
                    "request_completed",
                    method=scope.get("method"),
                    path=scope.get("path"),
                    status_code=status_code,
                    duration_ms=round(duration_ms, 2),
                )
```

### main.py

```python
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel

from .logging_config import setup_logging, get_logger
from .middleware import setup_middleware
from .context import bind_context

# Initialize logging before app creation
setup_logging(log_level="INFO", json_logs=True)

app = FastAPI(title="My API")
logger = get_logger(__name__)

# Set up middleware
setup_middleware(app)


class User(BaseModel):
    id: str
    name: str
    email: str


@app.on_event("startup")
async def startup():
    logger.info("application_started", port=8000)


@app.on_event("shutdown")
async def shutdown():
    logger.info("application_stopped")


@app.get("/api/users/{user_id}")
async def get_user(user_id: str) -> User:
    """Get user by ID."""
    # Add user context to logs
    bind_context(target_user_id=user_id)

    logger.info("fetching_user")

    # Simulate user fetch
    user = User(id=user_id, name="John Doe", email="john@example.com")

    logger.info("user_fetched", user_name=user.name)

    return user


@app.post("/api/users")
async def create_user(user: User) -> User:
    """Create a new user."""
    logger.info("creating_user", user_name=user.name, user_email=user.email)

    # Simulate user creation
    logger.info("user_created", user_id=user.id)

    return user


@app.get("/api/error")
async def trigger_error():
    """Endpoint that triggers an error for testing."""
    logger.warning("about_to_fail")
    raise HTTPException(status_code=500, detail="Intentional error")
```

## Django Integration

### django_logging.py

```python
import time
import uuid
from typing import Callable

import structlog
from django.http import HttpRequest, HttpResponse

from .logging_config import setup_logging, get_logger
from .context import request_context

logger = get_logger(__name__)


class StructlogMiddleware:
    """Django middleware for structured logging."""

    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]):
        self.get_response = get_response
        setup_logging()

    def __call__(self, request: HttpRequest) -> HttpResponse:
        request_id = (
            request.headers.get("x-request-id") or
            request.headers.get("x-correlation-id") or
            str(uuid.uuid4())
        )

        # Get user ID if authenticated
        user_id = None
        if hasattr(request, "user") and request.user.is_authenticated:
            user_id = str(request.user.id)

        with request_context(
            request_id=request_id,
            user_id=user_id,
            method=request.method,
            path=request.path,
            client_ip=self._get_client_ip(request),
            user_agent=request.headers.get("user-agent"),
        ):
            start_time = time.perf_counter()

            logger.info(
                "request_started",
                query_params=dict(request.GET),
            )

            try:
                response = self.get_response(request)

                duration_ms = (time.perf_counter() - start_time) * 1000

                logger.info(
                    "request_completed",
                    status_code=response.status_code,
                    duration_ms=round(duration_ms, 2),
                )

                response["x-request-id"] = request_id
                return response

            except Exception as exc:
                duration_ms = (time.perf_counter() - start_time) * 1000

                logger.exception(
                    "request_failed",
                    duration_ms=round(duration_ms, 2),
                    error_type=type(exc).__name__,
                )
                raise

    @staticmethod
    def _get_client_ip(request: HttpRequest) -> str:
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            return x_forwarded_for.split(",")[0].strip()
        return request.META.get("REMOTE_ADDR", "")


# Django settings.py configuration
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "json": {
            "()": "structlog.stdlib.ProcessorFormatter",
            "processor": structlog.processors.JSONRenderer(),
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "json",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },
}
```

## Async Support

### async_logging.py

```python
import asyncio
from functools import wraps
from typing import Any, Callable, TypeVar

import structlog

from .logging_config import get_logger
from .context import bind_context

logger = get_logger(__name__)

T = TypeVar("T")


def log_async_operation(operation_name: str):
    """Decorator for logging async operations."""
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> T:
            bind_context(operation=operation_name)

            logger.info(f"{operation_name}_started")

            try:
                result = await func(*args, **kwargs)
                logger.info(f"{operation_name}_completed")
                return result
            except Exception as exc:
                logger.exception(
                    f"{operation_name}_failed",
                    error_type=type(exc).__name__,
                )
                raise

        return wrapper
    return decorator


class AsyncBatchLogger:
    """Async logger that batches log entries for efficiency."""

    def __init__(
        self,
        batch_size: int = 100,
        flush_interval: float = 5.0,
        output_fn: Callable[[list[dict]], Any] | None = None
    ):
        self.batch_size = batch_size
        self.flush_interval = flush_interval
        self.output_fn = output_fn or self._default_output
        self._buffer: list[dict] = []
        self._lock = asyncio.Lock()
        self._flush_task: asyncio.Task | None = None

    async def start(self) -> None:
        """Start the background flush task."""
        self._flush_task = asyncio.create_task(self._periodic_flush())

    async def stop(self) -> None:
        """Stop the logger and flush remaining entries."""
        if self._flush_task:
            self._flush_task.cancel()
            try:
                await self._flush_task
            except asyncio.CancelledError:
                pass
        await self.flush()

    async def log(self, **kwargs: Any) -> None:
        """Add a log entry to the buffer."""
        async with self._lock:
            self._buffer.append(kwargs)

            if len(self._buffer) >= self.batch_size:
                await self._flush_buffer()

    async def flush(self) -> None:
        """Flush the buffer immediately."""
        async with self._lock:
            await self._flush_buffer()

    async def _flush_buffer(self) -> None:
        """Flush buffer without lock (internal use)."""
        if not self._buffer:
            return

        entries = self._buffer.copy()
        self._buffer.clear()

        try:
            await self.output_fn(entries)
        except Exception as exc:
            logger.error(
                "batch_flush_failed",
                error_type=type(exc).__name__,
                entries_lost=len(entries),
            )

    async def _periodic_flush(self) -> None:
        """Periodically flush the buffer."""
        while True:
            await asyncio.sleep(self.flush_interval)
            await self.flush()

    @staticmethod
    async def _default_output(entries: list[dict]) -> None:
        """Default output function - prints to stdout."""
        import json
        for entry in entries:
            print(json.dumps(entry))


# Usage example
async def main():
    batch_logger = AsyncBatchLogger(batch_size=10, flush_interval=2.0)
    await batch_logger.start()

    for i in range(25):
        await batch_logger.log(
            event="item_processed",
            item_id=i,
            status="success",
        )

    await batch_logger.stop()
```

## Structured Logging Helpers

### helpers.py

```python
import time
from contextlib import contextmanager
from functools import wraps
from typing import Any, Callable, Generator, TypeVar

import structlog

from .logging_config import get_logger
from .context import bind_context

logger = get_logger(__name__)

T = TypeVar("T")


@contextmanager
def log_operation(
    operation: str,
    log_args: bool = False,
    **extra: Any
) -> Generator[dict[str, Any], None, None]:
    """Context manager for logging operation duration."""
    context: dict[str, Any] = {"operation": operation, **extra}
    bind_context(**context)

    start_time = time.perf_counter()
    logger.info(f"{operation}_started")

    try:
        yield context

        duration_ms = (time.perf_counter() - start_time) * 1000
        logger.info(
            f"{operation}_completed",
            duration_ms=round(duration_ms, 2),
            success=True,
        )
    except Exception as exc:
        duration_ms = (time.perf_counter() - start_time) * 1000
        logger.exception(
            f"{operation}_failed",
            duration_ms=round(duration_ms, 2),
            success=False,
            error_type=type(exc).__name__,
        )
        raise


def log_function(
    operation: str | None = None,
    log_args: bool = False,
    log_result: bool = False,
) -> Callable[[Callable[..., T]], Callable[..., T]]:
    """Decorator for logging function calls."""
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        op_name = operation or func.__name__

        @wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> T:
            extra: dict[str, Any] = {}

            if log_args:
                extra["args"] = str(args)[:200]
                extra["kwargs"] = str(kwargs)[:200]

            with log_operation(op_name, **extra) as ctx:
                result = func(*args, **kwargs)

                if log_result:
                    ctx["result"] = str(result)[:200]

                return result

        return wrapper
    return decorator


class StructuredLogger:
    """Helper class for domain-specific logging."""

    def __init__(self, domain: str):
        self.logger = get_logger(domain)
        self.domain = domain

    def event(self, name: str, **kwargs: Any) -> None:
        """Log a domain event."""
        self.logger.info(
            f"{self.domain}_{name}",
            event_type="domain_event",
            **kwargs
        )

    def metric(self, name: str, value: float, unit: str = "", **tags: Any) -> None:
        """Log a metric."""
        self.logger.info(
            f"metric_{name}",
            event_type="metric",
            metric_name=name,
            metric_value=value,
            metric_unit=unit,
            **tags
        )

    def audit(
        self,
        action: str,
        actor: str,
        resource: str,
        resource_id: str,
        outcome: str = "success",
        **details: Any
    ) -> None:
        """Log an audit event."""
        self.logger.info(
            "audit_event",
            event_type="audit",
            action=action,
            actor=actor,
            resource=resource,
            resource_id=resource_id,
            outcome=outcome,
            **details
        )

    def security(
        self,
        event: str,
        severity: str,
        **details: Any
    ) -> None:
        """Log a security event."""
        log_method = self.logger.warning if severity in ("high", "critical") else self.logger.info
        log_method(
            f"security_{event}",
            event_type="security",
            severity=severity,
            **details
        )


# Pre-configured domain loggers
user_logger = StructuredLogger("user")
payment_logger = StructuredLogger("payment")
auth_logger = StructuredLogger("auth")
```

## Testing

### test_logging.py

```python
import json
from io import StringIO
from unittest.mock import patch

import pytest
import structlog
from structlog.testing import capture_logs

from .logging_config import setup_logging, get_logger
from .context import request_context, bind_context
from .helpers import log_operation, log_function


class TestStructlog:
    """Tests for structlog configuration."""

    def setup_method(self):
        """Set up test logging."""
        structlog.reset_defaults()
        setup_logging(log_level="DEBUG", json_logs=False)

    def test_basic_logging(self):
        """Test basic log output."""
        with capture_logs() as cap_logs:
            logger = get_logger("test")
            logger.info("test message", key="value")

        assert len(cap_logs) == 1
        assert cap_logs[0]["event"] == "test message"
        assert cap_logs[0]["key"] == "value"
        assert cap_logs[0]["log_level"] == "info"

    def test_log_levels(self):
        """Test different log levels."""
        with capture_logs() as cap_logs:
            logger = get_logger("test")
            logger.debug("debug")
            logger.info("info")
            logger.warning("warning")
            logger.error("error")

        assert len(cap_logs) == 4
        assert cap_logs[0]["log_level"] == "debug"
        assert cap_logs[1]["log_level"] == "info"
        assert cap_logs[2]["log_level"] == "warning"
        assert cap_logs[3]["log_level"] == "error"

    def test_exception_logging(self):
        """Test exception logging."""
        with capture_logs() as cap_logs:
            logger = get_logger("test")
            try:
                raise ValueError("test error")
            except ValueError:
                logger.exception("error occurred")

        assert len(cap_logs) == 1
        assert "exception" in cap_logs[0]
        assert "ValueError" in cap_logs[0]["exception"]


class TestContext:
    """Tests for context management."""

    def setup_method(self):
        """Set up test logging."""
        structlog.reset_defaults()
        setup_logging(log_level="DEBUG", json_logs=False)

    def test_request_context(self):
        """Test request context binding."""
        with capture_logs() as cap_logs:
            with request_context(request_id="test-123", user_id="user-456"):
                logger = get_logger("test")
                logger.info("in context")

        assert cap_logs[0]["request_id"] == "test-123"
        assert cap_logs[0]["user_id"] == "user-456"

    def test_context_isolation(self):
        """Test context isolation between requests."""
        with capture_logs() as cap_logs:
            with request_context(request_id="req-1"):
                logger = get_logger("test")
                logger.info("first")

            with request_context(request_id="req-2"):
                logger = get_logger("test")
                logger.info("second")

        assert cap_logs[0]["request_id"] == "req-1"
        assert cap_logs[1]["request_id"] == "req-2"

    def test_bind_context(self):
        """Test dynamic context binding."""
        with capture_logs() as cap_logs:
            with request_context(request_id="test"):
                bind_context(extra_key="extra_value")
                logger = get_logger("test")
                logger.info("with extra")

        assert cap_logs[0]["extra_key"] == "extra_value"


class TestHelpers:
    """Tests for logging helpers."""

    def setup_method(self):
        """Set up test logging."""
        structlog.reset_defaults()
        setup_logging(log_level="DEBUG", json_logs=False)

    def test_log_operation(self):
        """Test log_operation context manager."""
        with capture_logs() as cap_logs:
            with log_operation("test_op"):
                pass

        assert len(cap_logs) == 2
        assert "test_op_started" in cap_logs[0]["event"]
        assert "test_op_completed" in cap_logs[1]["event"]
        assert "duration_ms" in cap_logs[1]

    def test_log_operation_failure(self):
        """Test log_operation on failure."""
        with capture_logs() as cap_logs:
            with pytest.raises(ValueError):
                with log_operation("failing_op"):
                    raise ValueError("test error")

        assert "failing_op_failed" in cap_logs[1]["event"]
        assert cap_logs[1]["success"] is False

    def test_log_function_decorator(self):
        """Test log_function decorator."""
        @log_function("decorated_func")
        def my_function(x: int) -> int:
            return x * 2

        with capture_logs() as cap_logs:
            result = my_function(5)

        assert result == 10
        assert len(cap_logs) == 2
        assert "decorated_func_started" in cap_logs[0]["event"]
        assert "decorated_func_completed" in cap_logs[1]["event"]
```

## CLAUDE.md Integration

```markdown
## Logging with Structlog

This project uses structlog for structured logging.

### Configuration
```python
from logging_config import get_logger

logger = get_logger(__name__)
```

### Usage Patterns
```python
# Basic logging with context
logger.info("user_action", user_id=user.id, action="login")

# Request context (automatically bound)
with request_context(request_id=req_id):
    logger.info("processing")  # request_id automatically included

# Operation timing
with log_operation("database_query"):
    result = db.query(...)

# Exception logging
try:
    risky_operation()
except Exception:
    logger.exception("operation_failed")
```

### Best Practices
1. Use snake_case for event names
2. Always include relevant context as keyword arguments
3. Use request_context for request-scoped logging
4. Never log sensitive data (passwords, tokens, PII)
5. Use log_operation for timing critical operations
```

## AI Suggestions

1. **Distributed Tracing Integration**: Add OpenTelemetry trace ID propagation to correlate logs across services
2. **Log Sampling**: Implement adaptive log sampling for high-volume debug logs
3. **Async Log Shipping**: Create async transport for shipping logs to external systems without blocking
4. **Alert Rules**: Define log-based alerting rules for error rate thresholds
5. **Log Aggregation**: Set up centralized log aggregation with Elasticsearch or Loki
6. **PII Detection**: Add automated PII detection and masking in log processors
7. **Metrics Extraction**: Derive metrics from structured logs (error rates, latencies)
8. **Log Retention**: Implement tiered log retention policies based on log level
9. **Query Interface**: Build a log query API for debugging and analysis
10. **Real-time Dashboard**: Create a live log streaming dashboard for operations
