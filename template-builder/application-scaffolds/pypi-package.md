# Python PyPI Package

## Overview

Production-ready Python package for PyPI publication with modern tooling (uv/hatch), comprehensive testing with pytest, documentation with Sphinx/MkDocs, type hints with mypy, code quality with ruff, and automated releases with GitHub Actions. Includes multiple distribution formats and trusted publishing.

## Quick Start

```bash
# Create project with uv (recommended)
uv init my-package --lib
cd my-package

# Or with hatch
hatch new my-package
cd my-package

# Install development dependencies
uv add --dev pytest pytest-cov pytest-asyncio mypy ruff \
    mkdocs mkdocs-material mkdocstrings[python]

# Or with pip
pip install -e ".[dev]"

# Run tests
pytest

# Build package
uv build
# or
hatch build
```

## Project Structure

```
my-package/
├── src/
│   └── my_package/
│       ├── __init__.py          # Package init with version
│       ├── py.typed             # PEP 561 marker
│       ├── core.py              # Core functionality
│       ├── utils.py             # Utility functions
│       ├── types.py             # Type definitions
│       └── exceptions.py        # Custom exceptions
├── tests/
│   ├── __init__.py
│   ├── conftest.py              # Pytest fixtures
│   ├── test_core.py
│   └── test_utils.py
├── docs/
│   ├── index.md
│   ├── getting-started.md
│   ├── api/
│   │   └── reference.md
│   └── contributing.md
├── .github/
│   └── workflows/
│       ├── ci.yml               # CI workflow
│       └── release.yml          # Release workflow
├── pyproject.toml               # Project configuration
├── README.md
├── LICENSE
├── CHANGELOG.md
├── mkdocs.yml                   # Documentation config
└── CLAUDE.md
```

## Configuration Files

### pyproject.toml

```toml
[project]
name = "my-package"
version = "1.0.0"
description = "A production-ready Python package"
readme = "README.md"
license = { text = "MIT" }
authors = [{ name = "Your Name", email = "you@example.com" }]
maintainers = [{ name = "Your Name", email = "you@example.com" }]
requires-python = ">=3.10"
classifiers = [
    "Development Status :: 5 - Production/Stable",
    "Intended Audience :: Developers",
    "License :: OSI Approved :: MIT License",
    "Operating System :: OS Independent",
    "Programming Language :: Python :: 3",
    "Programming Language :: Python :: 3.10",
    "Programming Language :: Python :: 3.11",
    "Programming Language :: Python :: 3.12",
    "Programming Language :: Python :: 3.13",
    "Typing :: Typed",
]
keywords = ["python", "library", "utilities"]
dependencies = []

[project.optional-dependencies]
dev = [
    "pytest>=8.0",
    "pytest-cov>=4.1",
    "pytest-asyncio>=0.23",
    "mypy>=1.8",
    "ruff>=0.3",
]
docs = [
    "mkdocs>=1.5",
    "mkdocs-material>=9.5",
    "mkdocstrings[python]>=0.24",
]
all = ["my-package[dev,docs]"]

[project.urls]
Homepage = "https://github.com/yourname/my-package"
Documentation = "https://yourname.github.io/my-package"
Repository = "https://github.com/yourname/my-package"
Changelog = "https://github.com/yourname/my-package/blob/main/CHANGELOG.md"
Issues = "https://github.com/yourname/my-package/issues"

[project.scripts]
my-package = "my_package.cli:main"

[project.entry-points."my_package.plugins"]
example = "my_package.plugins.example:ExamplePlugin"

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["src/my_package"]

[tool.hatch.build.targets.sdist]
include = [
    "/src",
    "/tests",
    "/README.md",
    "/LICENSE",
    "/CHANGELOG.md",
]

[tool.hatch.version]
path = "src/my_package/__init__.py"

# Ruff configuration
[tool.ruff]
line-length = 100
target-version = "py310"
src = ["src"]

[tool.ruff.lint]
select = [
    "E",     # pycodestyle errors
    "W",     # pycodestyle warnings
    "F",     # Pyflakes
    "I",     # isort
    "N",     # pep8-naming
    "UP",    # pyupgrade
    "B",     # flake8-bugbear
    "C4",    # flake8-comprehensions
    "DTZ",   # flake8-datetimez
    "T10",   # flake8-debugger
    "EXE",   # flake8-executable
    "ISC",   # flake8-implicit-str-concat
    "ICN",   # flake8-import-conventions
    "PIE",   # flake8-pie
    "PT",    # flake8-pytest-style
    "Q",     # flake8-quotes
    "RSE",   # flake8-raise
    "RET",   # flake8-return
    "SIM",   # flake8-simplify
    "TID",   # flake8-tidy-imports
    "TCH",   # flake8-type-checking
    "ARG",   # flake8-unused-arguments
    "PTH",   # flake8-use-pathlib
    "ERA",   # eradicate
    "RUF",   # Ruff-specific rules
]
ignore = [
    "E501",  # line too long (handled by formatter)
    "B008",  # function call in default argument
]

[tool.ruff.lint.per-file-ignores]
"tests/**" = ["ARG001", "S101"]

[tool.ruff.lint.isort]
known-first-party = ["my_package"]
force-single-line = true

# Mypy configuration
[tool.mypy]
python_version = "3.10"
strict = true
warn_return_any = true
warn_unused_configs = true
warn_redundant_casts = true
warn_unused_ignores = true
show_error_codes = true
show_column_numbers = true

[[tool.mypy.overrides]]
module = "tests.*"
disallow_untyped_defs = false

# Pytest configuration
[tool.pytest.ini_options]
testpaths = ["tests"]
asyncio_mode = "auto"
addopts = [
    "-v",
    "--strict-markers",
    "--strict-config",
    "-ra",
]
markers = [
    "slow: marks tests as slow",
    "integration: marks integration tests",
]

# Coverage configuration
[tool.coverage.run]
source = ["src/my_package"]
branch = true
parallel = true

[tool.coverage.report]
exclude_lines = [
    "pragma: no cover",
    "def __repr__",
    "raise AssertionError",
    "raise NotImplementedError",
    "if __name__ == .__main__.:",
    "if TYPE_CHECKING:",
    "@abstractmethod",
    "@overload",
]
fail_under = 80
show_missing = true
```

### mkdocs.yml

```yaml
site_name: my-package
site_description: A production-ready Python package
site_url: https://yourname.github.io/my-package
repo_url: https://github.com/yourname/my-package
repo_name: yourname/my-package

theme:
  name: material
  palette:
    - scheme: default
      primary: indigo
      accent: indigo
      toggle:
        icon: material/brightness-7
        name: Switch to dark mode
    - scheme: slate
      primary: indigo
      accent: indigo
      toggle:
        icon: material/brightness-4
        name: Switch to light mode
  features:
    - navigation.tabs
    - navigation.sections
    - navigation.expand
    - navigation.top
    - search.suggest
    - content.code.copy
    - content.code.annotate

plugins:
  - search
  - mkdocstrings:
      handlers:
        python:
          options:
            show_source: true
            show_root_heading: true
            heading_level: 2

nav:
  - Home: index.md
  - Getting Started: getting-started.md
  - API Reference:
      - Core: api/reference.md
  - Contributing: contributing.md
  - Changelog: changelog.md

markdown_extensions:
  - pymdownx.highlight:
      anchor_linenums: true
  - pymdownx.inlinehilite
  - pymdownx.snippets
  - pymdownx.superfences
  - admonition
  - pymdownx.details
  - attr_list
  - md_in_html

extra:
  social:
    - icon: fontawesome/brands/github
      link: https://github.com/yourname/my-package
```

## Core Implementation

### src/my_package/__init__.py

```python
"""
my-package: A production-ready Python package.

This package provides utilities for common development tasks.

Example:
    >>> from my_package import create_instance
    >>> instance = create_instance(name="example")
    >>> result = instance.process("data")
"""

from my_package.core import Instance
from my_package.core import create_instance
from my_package.exceptions import MyPackageError
from my_package.exceptions import ConfigError
from my_package.exceptions import ValidationError
from my_package.types import Config
from my_package.types import Result

__version__ = "1.0.0"
__author__ = "Your Name"
__email__ = "you@example.com"

__all__ = [
    # Version
    "__version__",
    # Core
    "Instance",
    "create_instance",
    # Types
    "Config",
    "Result",
    # Exceptions
    "MyPackageError",
    "ConfigError",
    "ValidationError",
]
```

### src/my_package/py.typed

```
# PEP 561 marker file
```

### src/my_package/types.py

```python
"""Type definitions for my-package."""

from dataclasses import dataclass
from dataclasses import field
from datetime import datetime
from typing import Any
from typing import Generic
from typing import TypeVar

T = TypeVar("T")


@dataclass(frozen=True)
class Config:
    """Configuration for an instance.

    Attributes:
        timeout: Request timeout in seconds.
        retries: Number of retry attempts.
        base_url: Base URL for API requests.
        debug: Enable debug mode.
    """

    timeout: float = 30.0
    retries: int = 3
    base_url: str = ""
    debug: bool = False

    def __post_init__(self) -> None:
        """Validate configuration values."""
        if self.timeout <= 0:
            raise ValueError("timeout must be positive")
        if self.retries < 0:
            raise ValueError("retries must be non-negative")


@dataclass
class Result(Generic[T]):
    """Result of an operation.

    Attributes:
        success: Whether the operation succeeded.
        data: Result data if successful.
        error: Error message if failed.
        metadata: Additional metadata.
    """

    success: bool
    data: T | None = None
    error: str | None = None
    metadata: dict[str, Any] = field(default_factory=dict)

    @classmethod
    def ok(cls, data: T, **metadata: Any) -> "Result[T]":
        """Create a successful result.

        Args:
            data: The result data.
            **metadata: Additional metadata.

        Returns:
            A successful Result instance.
        """
        return cls(success=True, data=data, metadata=metadata)

    @classmethod
    def fail(cls, error: str, **metadata: Any) -> "Result[T]":
        """Create a failed result.

        Args:
            error: Error message.
            **metadata: Additional metadata.

        Returns:
            A failed Result instance.
        """
        return cls(success=False, error=error, metadata=metadata)

    def unwrap(self) -> T:
        """Get the result data or raise an exception.

        Returns:
            The result data.

        Raises:
            ValueError: If the result is a failure.
        """
        if not self.success or self.data is None:
            raise ValueError(self.error or "Operation failed")
        return self.data

    def unwrap_or(self, default: T) -> T:
        """Get the result data or return a default value.

        Args:
            default: Default value if result is a failure.

        Returns:
            The result data or default.
        """
        if self.success and self.data is not None:
            return self.data
        return default


@dataclass
class Event:
    """Event data structure.

    Attributes:
        name: Event name.
        timestamp: When the event occurred.
        data: Event payload.
    """

    name: str
    timestamp: datetime = field(default_factory=datetime.utcnow)
    data: dict[str, Any] = field(default_factory=dict)
```

### src/my_package/exceptions.py

```python
"""Custom exceptions for my-package."""

from typing import Any


class MyPackageError(Exception):
    """Base exception for my-package.

    Attributes:
        message: Error message.
        details: Additional error details.
    """

    def __init__(self, message: str, **details: Any) -> None:
        """Initialize the exception.

        Args:
            message: Error message.
            **details: Additional error details.
        """
        self.message = message
        self.details = details
        super().__init__(message)

    def __str__(self) -> str:
        """Return string representation."""
        if self.details:
            details_str = ", ".join(f"{k}={v!r}" for k, v in self.details.items())
            return f"{self.message} ({details_str})"
        return self.message


class ConfigError(MyPackageError):
    """Configuration error.

    Raised when there's an issue with configuration.
    """

    pass


class ValidationError(MyPackageError):
    """Validation error.

    Raised when input validation fails.
    """

    def __init__(self, message: str, field: str | None = None, **details: Any) -> None:
        """Initialize validation error.

        Args:
            message: Error message.
            field: Field that failed validation.
            **details: Additional details.
        """
        super().__init__(message, field=field, **details)
        self.field = field


class NetworkError(MyPackageError):
    """Network-related error.

    Raised when network operations fail.
    """

    def __init__(
        self,
        message: str,
        status_code: int | None = None,
        **details: Any,
    ) -> None:
        """Initialize network error.

        Args:
            message: Error message.
            status_code: HTTP status code if applicable.
            **details: Additional details.
        """
        super().__init__(message, status_code=status_code, **details)
        self.status_code = status_code


class TimeoutError(NetworkError):
    """Timeout error.

    Raised when an operation times out.
    """

    pass
```

### src/my_package/core.py

```python
"""Core functionality for my-package."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING
from typing import Any
from typing import Callable

from my_package.exceptions import ConfigError
from my_package.exceptions import ValidationError
from my_package.types import Config
from my_package.types import Result
from my_package.utils import validate_string

if TYPE_CHECKING:
    from collections.abc import Awaitable

logger = logging.getLogger(__name__)


class Instance:
    """Main instance class for operations.

    This class provides the primary interface for interacting
    with the package functionality.

    Attributes:
        name: Instance name.
        config: Configuration object.

    Example:
        >>> instance = Instance("my-instance")
        >>> result = instance.process("data")
        >>> if result.success:
        ...     print(result.data)
    """

    def __init__(
        self,
        name: str,
        config: Config | None = None,
    ) -> None:
        """Initialize an instance.

        Args:
            name: Instance name.
            config: Optional configuration.

        Raises:
            ValidationError: If name is invalid.
        """
        if not validate_string(name):
            raise ValidationError("Name must be a non-empty string", field="name")

        self.name = name
        self.config = config or Config()
        self._callbacks: list[Callable[[str], None]] = []

        logger.debug("Created instance: %s", name)

    def __repr__(self) -> str:
        """Return string representation."""
        return f"Instance(name={self.name!r})"

    def process(self, data: str) -> Result[str]:
        """Process input data.

        Args:
            data: Input data to process.

        Returns:
            Result containing processed data.

        Example:
            >>> instance = Instance("test")
            >>> result = instance.process("hello")
            >>> result.unwrap()
            'HELLO'
        """
        try:
            if not data:
                return Result.fail("Empty data provided")

            processed = data.upper()

            # Notify callbacks
            for callback in self._callbacks:
                callback(processed)

            return Result.ok(processed, processed_by=self.name)

        except Exception as e:
            logger.exception("Processing failed")
            return Result.fail(str(e))

    async def process_async(self, data: str) -> Result[str]:
        """Process input data asynchronously.

        Args:
            data: Input data to process.

        Returns:
            Result containing processed data.
        """
        # Simulate async operation
        import asyncio

        await asyncio.sleep(0.1)
        return self.process(data)

    def on_process(self, callback: Callable[[str], None]) -> None:
        """Register a callback for process events.

        Args:
            callback: Function to call with processed data.
        """
        self._callbacks.append(callback)

    def configure(self, **kwargs: Any) -> None:
        """Update configuration.

        Args:
            **kwargs: Configuration values to update.

        Raises:
            ConfigError: If configuration is invalid.
        """
        try:
            current = {
                "timeout": self.config.timeout,
                "retries": self.config.retries,
                "base_url": self.config.base_url,
                "debug": self.config.debug,
            }
            current.update(kwargs)
            self.config = Config(**current)
        except (TypeError, ValueError) as e:
            raise ConfigError(f"Invalid configuration: {e}") from e


def create_instance(
    name: str = "default",
    *,
    config: Config | None = None,
    **config_kwargs: Any,
) -> Instance:
    """Create a new instance.

    This is the recommended way to create instances.

    Args:
        name: Instance name.
        config: Optional configuration object.
        **config_kwargs: Configuration values (used if config is None).

    Returns:
        A new Instance object.

    Example:
        >>> instance = create_instance("my-instance", timeout=60)
        >>> instance.name
        'my-instance'
    """
    if config is None and config_kwargs:
        config = Config(**config_kwargs)

    return Instance(name, config)
```

### src/my_package/utils.py

```python
"""Utility functions for my-package."""

from __future__ import annotations

import functools
import time
from collections.abc import Awaitable
from collections.abc import Callable
from typing import Any
from typing import ParamSpec
from typing import TypeVar

P = ParamSpec("P")
T = TypeVar("T")


def validate_string(value: Any) -> bool:
    """Check if value is a non-empty string.

    Args:
        value: Value to check.

    Returns:
        True if value is a non-empty string.
    """
    return isinstance(value, str) and len(value) > 0


def validate_positive(value: Any) -> bool:
    """Check if value is a positive number.

    Args:
        value: Value to check.

    Returns:
        True if value is positive.
    """
    return isinstance(value, (int, float)) and value > 0


def retry(
    retries: int = 3,
    delay: float = 1.0,
    backoff: float = 2.0,
    exceptions: tuple[type[Exception], ...] = (Exception,),
) -> Callable[[Callable[P, T]], Callable[P, T]]:
    """Decorator for retrying functions on failure.

    Args:
        retries: Maximum number of retries.
        delay: Initial delay between retries in seconds.
        backoff: Multiplier for delay after each retry.
        exceptions: Exceptions to catch and retry on.

    Returns:
        Decorated function.

    Example:
        >>> @retry(retries=3, delay=0.1)
        ... def flaky_function():
        ...     pass
    """

    def decorator(func: Callable[P, T]) -> Callable[P, T]:
        @functools.wraps(func)
        def wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
            current_delay = delay
            last_exception: Exception | None = None

            for attempt in range(retries + 1):
                try:
                    return func(*args, **kwargs)
                except exceptions as e:
                    last_exception = e
                    if attempt < retries:
                        time.sleep(current_delay)
                        current_delay *= backoff

            assert last_exception is not None
            raise last_exception

        return wrapper

    return decorator


def async_retry(
    retries: int = 3,
    delay: float = 1.0,
    backoff: float = 2.0,
    exceptions: tuple[type[Exception], ...] = (Exception,),
) -> Callable[
    [Callable[P, Awaitable[T]]],
    Callable[P, Awaitable[T]],
]:
    """Decorator for retrying async functions on failure.

    Args:
        retries: Maximum number of retries.
        delay: Initial delay between retries in seconds.
        backoff: Multiplier for delay after each retry.
        exceptions: Exceptions to catch and retry on.

    Returns:
        Decorated async function.
    """
    import asyncio

    def decorator(
        func: Callable[P, Awaitable[T]],
    ) -> Callable[P, Awaitable[T]]:
        @functools.wraps(func)
        async def wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
            current_delay = delay
            last_exception: Exception | None = None

            for attempt in range(retries + 1):
                try:
                    return await func(*args, **kwargs)
                except exceptions as e:
                    last_exception = e
                    if attempt < retries:
                        await asyncio.sleep(current_delay)
                        current_delay *= backoff

            assert last_exception is not None
            raise last_exception

        return wrapper

    return decorator


def memoize(func: Callable[P, T]) -> Callable[P, T]:
    """Simple memoization decorator.

    Args:
        func: Function to memoize.

    Returns:
        Memoized function.
    """
    cache: dict[tuple[Any, ...], T] = {}

    @functools.wraps(func)
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
        key = (args, tuple(sorted(kwargs.items())))
        if key not in cache:
            cache[key] = func(*args, **kwargs)
        return cache[key]

    return wrapper


def timing(func: Callable[P, T]) -> Callable[P, T]:
    """Decorator to measure function execution time.

    Args:
        func: Function to time.

    Returns:
        Decorated function that logs timing.
    """
    import logging

    logger = logging.getLogger(func.__module__)

    @functools.wraps(func)
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
        start = time.perf_counter()
        try:
            return func(*args, **kwargs)
        finally:
            elapsed = time.perf_counter() - start
            logger.debug("%s took %.3f seconds", func.__name__, elapsed)

    return wrapper


def deprecated(
    message: str = "",
    version: str | None = None,
) -> Callable[[Callable[P, T]], Callable[P, T]]:
    """Mark a function as deprecated.

    Args:
        message: Deprecation message.
        version: Version when deprecated.

    Returns:
        Decorated function that warns on use.
    """
    import warnings

    def decorator(func: Callable[P, T]) -> Callable[P, T]:
        @functools.wraps(func)
        def wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
            warn_msg = f"{func.__name__} is deprecated"
            if version:
                warn_msg += f" since version {version}"
            if message:
                warn_msg += f": {message}"

            warnings.warn(warn_msg, DeprecationWarning, stacklevel=2)
            return func(*args, **kwargs)

        return wrapper

    return decorator
```

## Testing

### tests/conftest.py

```python
"""Pytest fixtures for my-package tests."""

import pytest

from my_package import Config
from my_package import Instance
from my_package import create_instance


@pytest.fixture
def default_config() -> Config:
    """Create a default configuration."""
    return Config()


@pytest.fixture
def custom_config() -> Config:
    """Create a custom configuration."""
    return Config(timeout=60.0, retries=5, debug=True)


@pytest.fixture
def instance() -> Instance:
    """Create a default instance."""
    return create_instance("test-instance")


@pytest.fixture
def configured_instance(custom_config: Config) -> Instance:
    """Create a configured instance."""
    return create_instance("configured-instance", config=custom_config)
```

### tests/test_core.py

```python
"""Tests for core functionality."""

import pytest

from my_package import Config
from my_package import Instance
from my_package import Result
from my_package import ValidationError
from my_package import create_instance


class TestInstance:
    """Tests for Instance class."""

    def test_create_instance(self) -> None:
        """Test instance creation."""
        instance = Instance("test")
        assert instance.name == "test"
        assert instance.config.timeout == 30.0

    def test_create_instance_with_config(self, custom_config: Config) -> None:
        """Test instance creation with custom config."""
        instance = Instance("test", config=custom_config)
        assert instance.config.timeout == 60.0
        assert instance.config.retries == 5

    def test_create_instance_invalid_name(self) -> None:
        """Test instance creation with invalid name."""
        with pytest.raises(ValidationError, match="non-empty string"):
            Instance("")

    def test_process_success(self, instance: Instance) -> None:
        """Test successful processing."""
        result = instance.process("hello")
        assert result.success is True
        assert result.data == "HELLO"

    def test_process_empty_data(self, instance: Instance) -> None:
        """Test processing empty data."""
        result = instance.process("")
        assert result.success is False
        assert "Empty data" in (result.error or "")

    def test_process_callback(self, instance: Instance) -> None:
        """Test process callback is called."""
        received: list[str] = []
        instance.on_process(lambda x: received.append(x))

        instance.process("test")
        assert received == ["TEST"]

    @pytest.mark.asyncio
    async def test_process_async(self, instance: Instance) -> None:
        """Test async processing."""
        result = await instance.process_async("hello")
        assert result.success is True
        assert result.data == "HELLO"

    def test_configure(self, instance: Instance) -> None:
        """Test configuration update."""
        instance.configure(timeout=120.0)
        assert instance.config.timeout == 120.0

    def test_repr(self, instance: Instance) -> None:
        """Test string representation."""
        assert "Instance(name=" in repr(instance)


class TestCreateInstance:
    """Tests for create_instance factory."""

    def test_create_with_defaults(self) -> None:
        """Test creation with defaults."""
        instance = create_instance()
        assert instance.name == "default"

    def test_create_with_name(self) -> None:
        """Test creation with name."""
        instance = create_instance("custom")
        assert instance.name == "custom"

    def test_create_with_config_kwargs(self) -> None:
        """Test creation with config kwargs."""
        instance = create_instance("test", timeout=60.0)
        assert instance.config.timeout == 60.0


class TestResult:
    """Tests for Result class."""

    def test_ok_result(self) -> None:
        """Test successful result."""
        result = Result.ok("data", key="value")
        assert result.success is True
        assert result.data == "data"
        assert result.metadata["key"] == "value"

    def test_fail_result(self) -> None:
        """Test failed result."""
        result: Result[str] = Result.fail("error occurred")
        assert result.success is False
        assert result.error == "error occurred"

    def test_unwrap_success(self) -> None:
        """Test unwrap on success."""
        result = Result.ok("data")
        assert result.unwrap() == "data"

    def test_unwrap_failure(self) -> None:
        """Test unwrap on failure."""
        result: Result[str] = Result.fail("error")
        with pytest.raises(ValueError, match="error"):
            result.unwrap()

    def test_unwrap_or(self) -> None:
        """Test unwrap_or."""
        success: Result[str] = Result.ok("data")
        failure: Result[str] = Result.fail("error")

        assert success.unwrap_or("default") == "data"
        assert failure.unwrap_or("default") == "default"
```

### tests/test_utils.py

```python
"""Tests for utility functions."""

import time

import pytest

from my_package.utils import async_retry
from my_package.utils import deprecated
from my_package.utils import memoize
from my_package.utils import retry
from my_package.utils import validate_positive
from my_package.utils import validate_string


class TestValidators:
    """Tests for validator functions."""

    def test_validate_string(self) -> None:
        """Test string validation."""
        assert validate_string("hello") is True
        assert validate_string("") is False
        assert validate_string(123) is False
        assert validate_string(None) is False

    def test_validate_positive(self) -> None:
        """Test positive number validation."""
        assert validate_positive(1) is True
        assert validate_positive(0.5) is True
        assert validate_positive(0) is False
        assert validate_positive(-1) is False
        assert validate_positive("1") is False


class TestRetry:
    """Tests for retry decorator."""

    def test_retry_success(self) -> None:
        """Test retry on eventual success."""
        attempts = 0

        @retry(retries=3, delay=0.01)
        def flaky() -> str:
            nonlocal attempts
            attempts += 1
            if attempts < 3:
                raise ValueError("Fail")
            return "success"

        result = flaky()
        assert result == "success"
        assert attempts == 3

    def test_retry_exhausted(self) -> None:
        """Test retry exhaustion."""

        @retry(retries=2, delay=0.01)
        def always_fails() -> None:
            raise ValueError("Always fails")

        with pytest.raises(ValueError, match="Always fails"):
            always_fails()


class TestAsyncRetry:
    """Tests for async retry decorator."""

    @pytest.mark.asyncio
    async def test_async_retry_success(self) -> None:
        """Test async retry on eventual success."""
        attempts = 0

        @async_retry(retries=3, delay=0.01)
        async def flaky() -> str:
            nonlocal attempts
            attempts += 1
            if attempts < 3:
                raise ValueError("Fail")
            return "success"

        result = await flaky()
        assert result == "success"
        assert attempts == 3


class TestMemoize:
    """Tests for memoize decorator."""

    def test_memoize_caches(self) -> None:
        """Test that memoize caches results."""
        call_count = 0

        @memoize
        def expensive(x: int) -> int:
            nonlocal call_count
            call_count += 1
            return x * 2

        assert expensive(5) == 10
        assert expensive(5) == 10
        assert call_count == 1  # Only called once


class TestDeprecated:
    """Tests for deprecated decorator."""

    def test_deprecated_warning(self) -> None:
        """Test deprecation warning."""

        @deprecated(message="Use new_func instead", version="2.0")
        def old_func() -> str:
            return "old"

        with pytest.warns(DeprecationWarning, match="old_func is deprecated"):
            result = old_func()
            assert result == "old"
```

## GitHub Workflows

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
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        python-version: ["3.10", "3.11", "3.12"]

    steps:
      - uses: actions/checkout@v4

      - name: Install uv
        uses: astral-sh/setup-uv@v3

      - name: Set up Python ${{ matrix.python-version }}
        run: uv python install ${{ matrix.python-version }}

      - name: Install dependencies
        run: uv sync --all-extras

      - name: Run linting
        run: uv run ruff check src tests

      - name: Run type checking
        run: uv run mypy src

      - name: Run tests
        run: uv run pytest --cov --cov-report=xml

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage.xml

  docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install uv
        uses: astral-sh/setup-uv@v3

      - name: Install dependencies
        run: uv sync --extra docs

      - name: Build docs
        run: uv run mkdocs build
```

### .github/workflows/release.yml

```yaml
name: Release

on:
  push:
    tags: ["v*"]

permissions:
  contents: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install uv
        uses: astral-sh/setup-uv@v3

      - name: Build package
        run: uv build

      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/

  publish:
    needs: build
    runs-on: ubuntu-latest
    environment: pypi

    steps:
      - name: Download artifacts
        uses: actions/download-artifact@v4
        with:
          name: dist
          path: dist/

      - name: Publish to PyPI
        uses: pypa/gh-action-pypi-publish@release/v1
        with:
          packages-dir: dist/

  github-release:
    needs: publish
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Download artifacts
        uses: actions/download-artifact@v4
        with:
          name: dist
          path: dist/

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v1
        with:
          files: dist/*
          generate_release_notes: true
```

## CLAUDE.md Integration

```markdown
# Python Package Project

## Commands
- `uv run pytest` - Run tests
- `uv build` - Build package
- `uv run mypy src` - Type check
- `uv run ruff check .` - Lint

## Architecture
- src/ layout for proper packaging
- Types in types.py
- Exceptions in exceptions.py
- Core logic in core.py

## Testing
Run `uv run pytest` or `pytest`
Coverage: `pytest --cov`

## Publishing
1. Update version in __init__.py
2. Create git tag: `git tag v1.0.0`
3. Push: `git push --tags`
4. CI publishes automatically
```

## AI Suggestions

1. **Trusted Publishing** - Configure PyPI trusted publishing for secure releases
2. **Pre-commit Hooks** - Add pre-commit with ruff, mypy, and commitizen
3. **Benchmarking** - Add pytest-benchmark for performance tests
4. **Type Stubs** - Generate .pyi stub files for IDE support
5. **Conda Package** - Add conda-forge recipe for conda distribution
6. **API Versioning** - Implement semantic versioning with deprecation warnings
7. **Plugin System** - Add pluggy-based plugin architecture
8. **Telemetry** - Add opt-in usage telemetry with PostHog
9. **Security Scanning** - Add bandit/safety to CI for vulnerability scanning
10. **Multi-platform Testing** - Add Windows and macOS to CI matrix
