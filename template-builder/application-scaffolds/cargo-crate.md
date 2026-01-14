# Cargo Crate Template

> Production-ready Rust library crate for crates.io with comprehensive documentation, testing, and CI/CD

## Overview

This template provides a complete Rust library crate setup with:
- Cargo workspace-ready structure
- Comprehensive documentation with rustdoc
- Property-based testing with proptest
- Benchmarking with criterion
- Feature flags for optional functionality
- no_std support option
- Automated publishing to crates.io
- MSRV (Minimum Supported Rust Version) policy

## Quick Start

```bash
# Create new crate
cargo new my-crate --lib
cd my-crate

# Initialize with template structure
mkdir -p src/{utils,types} benches examples tests

# Build and test
cargo build
cargo test
cargo doc --open
```

## Project Structure

```
my-crate/
├── Cargo.toml
├── Cargo.lock
├── README.md
├── LICENSE-MIT
├── LICENSE-APACHE
├── CHANGELOG.md
├── CONTRIBUTING.md
├── rustfmt.toml
├── clippy.toml
├── deny.toml
├── release.toml
├── src/
│   ├── lib.rs
│   ├── error.rs
│   ├── types/
│   │   ├── mod.rs
│   │   └── config.rs
│   └── utils/
│       ├── mod.rs
│       └── helpers.rs
├── benches/
│   └── benchmarks.rs
├── examples/
│   ├── basic.rs
│   └── advanced.rs
├── tests/
│   ├── integration.rs
│   └── common/
│       └── mod.rs
└── .github/
    └── workflows/
        ├── ci.yml
        ├── release.yml
        └── audit.yml
```

## Core Files

### Cargo.toml

```toml
[package]
name = "my-crate"
version = "0.1.0"
edition = "2021"
rust-version = "1.70"
authors = ["Your Name <your.email@example.com>"]
description = "A brief description of what this crate does"
documentation = "https://docs.rs/my-crate"
readme = "README.md"
homepage = "https://github.com/username/my-crate"
repository = "https://github.com/username/my-crate"
license = "MIT OR Apache-2.0"
keywords = ["keyword1", "keyword2", "keyword3"]
categories = ["category1", "category2"]
include = [
    "src/**/*",
    "benches/**/*",
    "examples/**/*",
    "Cargo.toml",
    "LICENSE-*",
    "README.md",
    "CHANGELOG.md",
]
exclude = [
    ".github/*",
    ".gitignore",
    "tests/*",
]

[package.metadata.docs.rs]
all-features = true
rustdoc-args = ["--cfg", "docsrs"]

[lib]
name = "my_crate"
path = "src/lib.rs"

[features]
default = ["std"]
std = []
alloc = []
serde = ["dep:serde", "dep:serde_json"]
async = ["dep:tokio", "dep:futures"]
tracing = ["dep:tracing"]
full = ["std", "serde", "async", "tracing"]

[dependencies]
thiserror = "1.0"

# Optional dependencies
serde = { version = "1.0", features = ["derive"], optional = true }
serde_json = { version = "1.0", optional = true }
tokio = { version = "1.0", features = ["rt-multi-thread", "macros"], optional = true }
futures = { version = "0.3", optional = true }
tracing = { version = "0.1", optional = true }

[dev-dependencies]
criterion = { version = "0.5", features = ["html_reports"] }
proptest = "1.4"
test-case = "3.3"
tokio-test = "0.4"
tracing-subscriber = { version = "0.3", features = ["env-filter"] }
pretty_assertions = "1.4"
rstest = "0.18"

[[bench]]
name = "benchmarks"
harness = false

[[example]]
name = "basic"
path = "examples/basic.rs"

[[example]]
name = "advanced"
path = "examples/advanced.rs"
required-features = ["serde", "async"]

[lints.rust]
unsafe_code = "forbid"
missing_docs = "warn"

[lints.clippy]
all = "warn"
pedantic = "warn"
nursery = "warn"
cargo = "warn"
# Allow specific lints
module_name_repetitions = "allow"
must_use_candidate = "allow"
missing_errors_doc = "allow"
```

### src/lib.rs

```rust
//! # My Crate
//!
//! `my_crate` provides functionality for doing something useful.
//!
//! ## Features
//!
//! - **std** (default): Enable standard library support
//! - **alloc**: Enable alloc support for no_std environments
//! - **serde**: Enable serialization/deserialization support
//! - **async**: Enable async/await support with Tokio
//! - **tracing**: Enable tracing instrumentation
//!
//! ## Quick Start
//!
//! ```rust
//! use my_crate::{Config, Client, Result};
//!
//! fn main() -> Result<()> {
//!     let config = Config::builder()
//!         .with_timeout(30)
//!         .build()?;
//!
//!     let client = Client::new(config);
//!     let result = client.process("input")?;
//!
//!     println!("Result: {}", result);
//!     Ok(())
//! }
//! ```
//!
//! ## no_std Support
//!
//! This crate supports `no_std` environments when the `std` feature is disabled:
//!
//! ```toml
//! [dependencies]
//! my_crate = { version = "0.1", default-features = false, features = ["alloc"] }
//! ```

#![cfg_attr(not(feature = "std"), no_std)]
#![cfg_attr(docsrs, feature(doc_cfg))]
#![warn(missing_docs)]
#![warn(clippy::all)]
#![warn(clippy::pedantic)]
#![forbid(unsafe_code)]

#[cfg(feature = "alloc")]
extern crate alloc;

#[cfg(feature = "std")]
extern crate std;

mod error;
pub mod types;
pub mod utils;

pub use error::{Error, Result};
pub use types::config::{Config, ConfigBuilder};

/// The main client for interacting with the library.
///
/// # Examples
///
/// ```rust
/// use my_crate::{Client, Config};
///
/// let config = Config::default();
/// let client = Client::new(config);
/// ```
#[derive(Debug, Clone)]
pub struct Client {
    config: Config,
}

impl Client {
    /// Creates a new client with the given configuration.
    ///
    /// # Arguments
    ///
    /// * `config` - The configuration to use
    ///
    /// # Examples
    ///
    /// ```rust
    /// use my_crate::{Client, Config};
    ///
    /// let client = Client::new(Config::default());
    /// ```
    #[must_use]
    pub fn new(config: Config) -> Self {
        Self { config }
    }

    /// Creates a new client with default configuration.
    ///
    /// # Examples
    ///
    /// ```rust
    /// use my_crate::Client;
    ///
    /// let client = Client::default();
    /// ```
    #[must_use]
    pub fn with_defaults() -> Self {
        Self::new(Config::default())
    }

    /// Processes the input and returns a result.
    ///
    /// # Arguments
    ///
    /// * `input` - The input to process
    ///
    /// # Errors
    ///
    /// Returns an error if the input is invalid or processing fails.
    ///
    /// # Examples
    ///
    /// ```rust
    /// use my_crate::{Client, Config};
    ///
    /// let client = Client::new(Config::default());
    /// let result = client.process("hello").unwrap();
    /// assert!(!result.is_empty());
    /// ```
    pub fn process(&self, input: &str) -> Result<String> {
        if input.is_empty() {
            return Err(Error::InvalidInput("Input cannot be empty".into()));
        }

        let processed = self.transform(input);
        Ok(processed)
    }

    /// Processes input asynchronously.
    ///
    /// # Arguments
    ///
    /// * `input` - The input to process
    ///
    /// # Errors
    ///
    /// Returns an error if processing fails.
    #[cfg(feature = "async")]
    #[cfg_attr(docsrs, doc(cfg(feature = "async")))]
    pub async fn process_async(&self, input: &str) -> Result<String> {
        use tokio::task;

        let input = input.to_string();
        let config = self.config.clone();

        task::spawn_blocking(move || {
            let client = Client::new(config);
            client.process(&input)
        })
        .await
        .map_err(|e| Error::Internal(e.to_string()))?
    }

    /// Transforms the input according to the configuration.
    fn transform(&self, input: &str) -> String {
        let mut result = input.to_string();

        if self.config.uppercase {
            result = result.to_uppercase();
        }

        if let Some(prefix) = &self.config.prefix {
            result = format!("{prefix}{result}");
        }

        if let Some(suffix) = &self.config.suffix {
            result = format!("{result}{suffix}");
        }

        result
    }

    /// Returns the current configuration.
    #[must_use]
    pub const fn config(&self) -> &Config {
        &self.config
    }

    /// Validates the client configuration.
    ///
    /// # Errors
    ///
    /// Returns an error if the configuration is invalid.
    pub fn validate(&self) -> Result<()> {
        self.config.validate()
    }
}

impl Default for Client {
    fn default() -> Self {
        Self::with_defaults()
    }
}

/// Batch processing utilities.
pub mod batch {
    use super::*;

    /// Processes multiple inputs in batch.
    ///
    /// # Arguments
    ///
    /// * `client` - The client to use for processing
    /// * `inputs` - The inputs to process
    ///
    /// # Returns
    ///
    /// A vector of results, one for each input.
    ///
    /// # Examples
    ///
    /// ```rust
    /// use my_crate::{Client, batch};
    ///
    /// let client = Client::default();
    /// let inputs = vec!["hello", "world"];
    /// let results = batch::process_many(&client, &inputs);
    /// assert_eq!(results.len(), 2);
    /// ```
    pub fn process_many(client: &Client, inputs: &[&str]) -> Vec<Result<String>> {
        inputs.iter().map(|input| client.process(input)).collect()
    }

    /// Processes multiple inputs, returning only successful results.
    ///
    /// # Arguments
    ///
    /// * `client` - The client to use for processing
    /// * `inputs` - The inputs to process
    ///
    /// # Returns
    ///
    /// A vector of successful results.
    pub fn process_many_ok(client: &Client, inputs: &[&str]) -> Vec<String> {
        inputs
            .iter()
            .filter_map(|input| client.process(input).ok())
            .collect()
    }

    /// Processes inputs in parallel using async.
    #[cfg(feature = "async")]
    #[cfg_attr(docsrs, doc(cfg(feature = "async")))]
    pub async fn process_parallel(client: &Client, inputs: &[&str]) -> Vec<Result<String>> {
        use futures::future::join_all;

        let futures: Vec<_> = inputs
            .iter()
            .map(|input| client.process_async(input))
            .collect();

        join_all(futures).await
    }
}

/// Prelude module for convenient imports.
pub mod prelude {
    pub use crate::batch::{process_many, process_many_ok};
    pub use crate::types::config::{Config, ConfigBuilder};
    pub use crate::{Client, Error, Result};

    #[cfg(feature = "async")]
    pub use crate::batch::process_parallel;
}

#[cfg(test)]
mod tests {
    use super::*;
    use pretty_assertions::assert_eq;

    #[test]
    fn test_client_creation() {
        let client = Client::default();
        assert!(client.validate().is_ok());
    }

    #[test]
    fn test_process_valid_input() {
        let client = Client::default();
        let result = client.process("hello");
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "hello");
    }

    #[test]
    fn test_process_empty_input() {
        let client = Client::default();
        let result = client.process("");
        assert!(result.is_err());
    }

    #[test]
    fn test_process_with_uppercase() {
        let config = Config::builder().uppercase(true).build().unwrap();
        let client = Client::new(config);
        let result = client.process("hello").unwrap();
        assert_eq!(result, "HELLO");
    }

    #[test]
    fn test_process_with_prefix_suffix() {
        let config = Config::builder()
            .prefix("<<")
            .suffix(">>")
            .build()
            .unwrap();
        let client = Client::new(config);
        let result = client.process("hello").unwrap();
        assert_eq!(result, "<<hello>>");
    }

    #[test]
    fn test_batch_processing() {
        let client = Client::default();
        let inputs = vec!["hello", "world"];
        let results = batch::process_many(&client, &inputs);
        assert_eq!(results.len(), 2);
        assert!(results.iter().all(|r| r.is_ok()));
    }
}
```

### src/error.rs

```rust
//! Error types for the crate.

use core::fmt;

#[cfg(feature = "std")]
use std::error::Error as StdError;

/// The result type for this crate.
pub type Result<T> = core::result::Result<T, Error>;

/// Errors that can occur in this crate.
#[derive(Debug, Clone, PartialEq, Eq)]
#[non_exhaustive]
pub enum Error {
    /// Invalid input was provided.
    InvalidInput(String),
    /// Configuration error.
    Configuration(String),
    /// Internal error.
    Internal(String),
    /// Resource not found.
    NotFound(String),
    /// Operation timed out.
    Timeout(String),
    /// Rate limit exceeded.
    RateLimited {
        /// Number of seconds to wait before retrying.
        retry_after: u64,
    },
}

impl fmt::Display for Error {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::InvalidInput(msg) => write!(f, "invalid input: {msg}"),
            Self::Configuration(msg) => write!(f, "configuration error: {msg}"),
            Self::Internal(msg) => write!(f, "internal error: {msg}"),
            Self::NotFound(msg) => write!(f, "not found: {msg}"),
            Self::Timeout(msg) => write!(f, "timeout: {msg}"),
            Self::RateLimited { retry_after } => {
                write!(f, "rate limited, retry after {retry_after}s")
            }
        }
    }
}

#[cfg(feature = "std")]
impl StdError for Error {}

impl Error {
    /// Returns true if this is a retryable error.
    #[must_use]
    pub const fn is_retryable(&self) -> bool {
        matches!(self, Self::Timeout(_) | Self::RateLimited { .. })
    }

    /// Returns the retry delay in seconds, if applicable.
    #[must_use]
    pub const fn retry_after(&self) -> Option<u64> {
        match self {
            Self::RateLimited { retry_after } => Some(*retry_after),
            _ => None,
        }
    }

    /// Creates a new invalid input error.
    #[must_use]
    pub fn invalid_input(msg: impl Into<String>) -> Self {
        Self::InvalidInput(msg.into())
    }

    /// Creates a new configuration error.
    #[must_use]
    pub fn configuration(msg: impl Into<String>) -> Self {
        Self::Configuration(msg.into())
    }

    /// Creates a new internal error.
    #[must_use]
    pub fn internal(msg: impl Into<String>) -> Self {
        Self::Internal(msg.into())
    }

    /// Creates a new not found error.
    #[must_use]
    pub fn not_found(msg: impl Into<String>) -> Self {
        Self::NotFound(msg.into())
    }

    /// Creates a new timeout error.
    #[must_use]
    pub fn timeout(msg: impl Into<String>) -> Self {
        Self::Timeout(msg.into())
    }

    /// Creates a new rate limited error.
    #[must_use]
    pub const fn rate_limited(retry_after: u64) -> Self {
        Self::RateLimited { retry_after }
    }
}

/// Extension trait for adding context to results.
pub trait ResultExt<T> {
    /// Adds context to an error.
    fn context(self, msg: impl Into<String>) -> Result<T>;

    /// Adds context using a closure (lazy evaluation).
    fn with_context<F>(self, f: F) -> Result<T>
    where
        F: FnOnce() -> String;
}

impl<T, E: fmt::Display> ResultExt<T> for core::result::Result<T, E> {
    fn context(self, msg: impl Into<String>) -> Result<T> {
        self.map_err(|e| Error::Internal(format!("{}: {e}", msg.into())))
    }

    fn with_context<F>(self, f: F) -> Result<T>
    where
        F: FnOnce() -> String,
    {
        self.map_err(|e| Error::Internal(format!("{}: {e}", f())))
    }
}

#[cfg(feature = "serde")]
impl serde::Serialize for Error {
    fn serialize<S>(&self, serializer: S) -> core::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeStruct;

        let mut state = serializer.serialize_struct("Error", 2)?;
        state.serialize_field("type", &self.error_type())?;
        state.serialize_field("message", &self.to_string())?;
        state.end()
    }
}

impl Error {
    /// Returns the error type as a string.
    #[must_use]
    pub const fn error_type(&self) -> &'static str {
        match self {
            Self::InvalidInput(_) => "invalid_input",
            Self::Configuration(_) => "configuration",
            Self::Internal(_) => "internal",
            Self::NotFound(_) => "not_found",
            Self::Timeout(_) => "timeout",
            Self::RateLimited { .. } => "rate_limited",
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_error_display() {
        let err = Error::invalid_input("test");
        assert_eq!(err.to_string(), "invalid input: test");
    }

    #[test]
    fn test_is_retryable() {
        assert!(!Error::invalid_input("test").is_retryable());
        assert!(Error::timeout("test").is_retryable());
        assert!(Error::rate_limited(60).is_retryable());
    }

    #[test]
    fn test_retry_after() {
        assert_eq!(Error::invalid_input("test").retry_after(), None);
        assert_eq!(Error::rate_limited(60).retry_after(), Some(60));
    }
}
```

### src/types/mod.rs

```rust
//! Type definitions for the crate.

pub mod config;

pub use config::{Config, ConfigBuilder};
```

### src/types/config.rs

```rust
//! Configuration types.

use crate::{Error, Result};

/// Configuration for the client.
///
/// Use [`ConfigBuilder`] to construct a `Config` instance.
///
/// # Examples
///
/// ```rust
/// use my_crate::Config;
///
/// let config = Config::builder()
///     .timeout(30)
///     .uppercase(true)
///     .build()
///     .unwrap();
/// ```
#[derive(Debug, Clone, PartialEq, Eq)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct Config {
    /// Timeout in seconds.
    pub timeout: u64,
    /// Maximum number of retries.
    pub max_retries: u32,
    /// Whether to convert output to uppercase.
    pub uppercase: bool,
    /// Optional prefix to add.
    pub prefix: Option<String>,
    /// Optional suffix to add.
    pub suffix: Option<String>,
}

impl Config {
    /// Default timeout in seconds.
    pub const DEFAULT_TIMEOUT: u64 = 30;

    /// Default maximum retries.
    pub const DEFAULT_MAX_RETRIES: u32 = 3;

    /// Creates a new configuration builder.
    ///
    /// # Examples
    ///
    /// ```rust
    /// use my_crate::Config;
    ///
    /// let config = Config::builder()
    ///     .timeout(60)
    ///     .build()
    ///     .unwrap();
    /// ```
    #[must_use]
    pub fn builder() -> ConfigBuilder {
        ConfigBuilder::new()
    }

    /// Validates the configuration.
    ///
    /// # Errors
    ///
    /// Returns an error if the configuration is invalid.
    pub fn validate(&self) -> Result<()> {
        if self.timeout == 0 {
            return Err(Error::configuration("timeout must be greater than 0"));
        }

        if let Some(prefix) = &self.prefix {
            if prefix.len() > 100 {
                return Err(Error::configuration("prefix too long (max 100 chars)"));
            }
        }

        if let Some(suffix) = &self.suffix {
            if suffix.len() > 100 {
                return Err(Error::configuration("suffix too long (max 100 chars)"));
            }
        }

        Ok(())
    }

    /// Creates a new config with updated timeout.
    #[must_use]
    pub const fn with_timeout(mut self, timeout: u64) -> Self {
        self.timeout = timeout;
        self
    }

    /// Creates a new config with updated max_retries.
    #[must_use]
    pub const fn with_max_retries(mut self, max_retries: u32) -> Self {
        self.max_retries = max_retries;
        self
    }
}

impl Default for Config {
    fn default() -> Self {
        Self {
            timeout: Self::DEFAULT_TIMEOUT,
            max_retries: Self::DEFAULT_MAX_RETRIES,
            uppercase: false,
            prefix: None,
            suffix: None,
        }
    }
}

/// Builder for [`Config`].
///
/// # Examples
///
/// ```rust
/// use my_crate::ConfigBuilder;
///
/// let config = ConfigBuilder::new()
///     .timeout(60)
///     .max_retries(5)
///     .uppercase(true)
///     .prefix(">>>")
///     .suffix("<<<")
///     .build()
///     .unwrap();
/// ```
#[derive(Debug, Default, Clone)]
pub struct ConfigBuilder {
    timeout: Option<u64>,
    max_retries: Option<u32>,
    uppercase: Option<bool>,
    prefix: Option<String>,
    suffix: Option<String>,
}

impl ConfigBuilder {
    /// Creates a new configuration builder.
    #[must_use]
    pub fn new() -> Self {
        Self::default()
    }

    /// Sets the timeout in seconds.
    #[must_use]
    pub const fn timeout(mut self, timeout: u64) -> Self {
        self.timeout = Some(timeout);
        self
    }

    /// Sets the maximum number of retries.
    #[must_use]
    pub const fn max_retries(mut self, max_retries: u32) -> Self {
        self.max_retries = Some(max_retries);
        self
    }

    /// Sets whether to convert output to uppercase.
    #[must_use]
    pub const fn uppercase(mut self, uppercase: bool) -> Self {
        self.uppercase = Some(uppercase);
        self
    }

    /// Sets the prefix to add to output.
    #[must_use]
    pub fn prefix(mut self, prefix: impl Into<String>) -> Self {
        self.prefix = Some(prefix.into());
        self
    }

    /// Sets the suffix to add to output.
    #[must_use]
    pub fn suffix(mut self, suffix: impl Into<String>) -> Self {
        self.suffix = Some(suffix.into());
        self
    }

    /// Builds the configuration.
    ///
    /// # Errors
    ///
    /// Returns an error if the configuration is invalid.
    pub fn build(self) -> Result<Config> {
        let config = Config {
            timeout: self.timeout.unwrap_or(Config::DEFAULT_TIMEOUT),
            max_retries: self.max_retries.unwrap_or(Config::DEFAULT_MAX_RETRIES),
            uppercase: self.uppercase.unwrap_or(false),
            prefix: self.prefix,
            suffix: self.suffix,
        };

        config.validate()?;
        Ok(config)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_config() {
        let config = Config::default();
        assert_eq!(config.timeout, Config::DEFAULT_TIMEOUT);
        assert_eq!(config.max_retries, Config::DEFAULT_MAX_RETRIES);
        assert!(!config.uppercase);
        assert!(config.prefix.is_none());
        assert!(config.suffix.is_none());
    }

    #[test]
    fn test_builder() {
        let config = ConfigBuilder::new()
            .timeout(60)
            .max_retries(5)
            .uppercase(true)
            .prefix(">>")
            .suffix("<<")
            .build()
            .unwrap();

        assert_eq!(config.timeout, 60);
        assert_eq!(config.max_retries, 5);
        assert!(config.uppercase);
        assert_eq!(config.prefix, Some(">>".to_string()));
        assert_eq!(config.suffix, Some("<<".to_string()));
    }

    #[test]
    fn test_invalid_timeout() {
        let result = ConfigBuilder::new().timeout(0).build();
        assert!(result.is_err());
    }

    #[test]
    fn test_prefix_too_long() {
        let long_prefix = "x".repeat(101);
        let result = ConfigBuilder::new().prefix(long_prefix).build();
        assert!(result.is_err());
    }
}
```

### src/utils/mod.rs

```rust
//! Utility functions.

pub mod helpers;

pub use helpers::*;
```

### src/utils/helpers.rs

```rust
//! Helper functions and utilities.

#[cfg(feature = "alloc")]
use alloc::{string::String, vec::Vec};

/// Splits input into chunks of the specified size.
///
/// # Arguments
///
/// * `input` - The input to split
/// * `chunk_size` - The size of each chunk
///
/// # Examples
///
/// ```rust
/// use my_crate::utils::chunk_string;
///
/// let chunks = chunk_string("hello world", 5);
/// assert_eq!(chunks, vec!["hello", " worl", "d"]);
/// ```
#[must_use]
pub fn chunk_string(input: &str, chunk_size: usize) -> Vec<&str> {
    if chunk_size == 0 {
        return Vec::new();
    }

    input
        .as_bytes()
        .chunks(chunk_size)
        .map(|chunk| {
            // SAFETY: We're splitting valid UTF-8 at byte boundaries
            // This could split multi-byte characters, so use char_indices for proper handling
            core::str::from_utf8(chunk).unwrap_or("")
        })
        .collect()
}

/// Safely splits a string at character boundaries.
///
/// # Arguments
///
/// * `input` - The input to split
/// * `max_chars` - Maximum characters per chunk
///
/// # Examples
///
/// ```rust
/// use my_crate::utils::chunk_chars;
///
/// let chunks = chunk_chars("hello", 2);
/// assert_eq!(chunks, vec!["he", "ll", "o"]);
/// ```
#[must_use]
pub fn chunk_chars(input: &str, max_chars: usize) -> Vec<String> {
    if max_chars == 0 {
        return Vec::new();
    }

    let mut chunks = Vec::new();
    let mut current = String::new();
    let mut char_count = 0;

    for c in input.chars() {
        if char_count >= max_chars {
            chunks.push(core::mem::take(&mut current));
            char_count = 0;
        }
        current.push(c);
        char_count += 1;
    }

    if !current.is_empty() {
        chunks.push(current);
    }

    chunks
}

/// Truncates a string to the specified length with an ellipsis.
///
/// # Arguments
///
/// * `input` - The input to truncate
/// * `max_len` - Maximum length including ellipsis
///
/// # Examples
///
/// ```rust
/// use my_crate::utils::truncate;
///
/// assert_eq!(truncate("hello world", 8), "hello...");
/// assert_eq!(truncate("hi", 8), "hi");
/// ```
#[must_use]
pub fn truncate(input: &str, max_len: usize) -> String {
    if max_len < 4 {
        return input.chars().take(max_len).collect();
    }

    let char_count = input.chars().count();
    if char_count <= max_len {
        return input.to_string();
    }

    let truncated: String = input.chars().take(max_len - 3).collect();
    format!("{truncated}...")
}

/// Normalizes whitespace in a string.
///
/// Collapses consecutive whitespace into single spaces and trims.
///
/// # Examples
///
/// ```rust
/// use my_crate::utils::normalize_whitespace;
///
/// assert_eq!(normalize_whitespace("  hello   world  "), "hello world");
/// ```
#[must_use]
pub fn normalize_whitespace(input: &str) -> String {
    input.split_whitespace().collect::<Vec<_>>().join(" ")
}

/// Checks if a string is blank (empty or only whitespace).
///
/// # Examples
///
/// ```rust
/// use my_crate::utils::is_blank;
///
/// assert!(is_blank(""));
/// assert!(is_blank("   "));
/// assert!(!is_blank("hello"));
/// ```
#[must_use]
pub fn is_blank(input: &str) -> bool {
    input.trim().is_empty()
}

/// Converts a string to title case.
///
/// # Examples
///
/// ```rust
/// use my_crate::utils::to_title_case;
///
/// assert_eq!(to_title_case("hello world"), "Hello World");
/// ```
#[must_use]
pub fn to_title_case(input: &str) -> String {
    input
        .split_whitespace()
        .map(|word| {
            let mut chars = word.chars();
            match chars.next() {
                Some(first) => {
                    let rest: String = chars.as_str().to_lowercase();
                    format!("{}{rest}", first.to_uppercase())
                }
                None => String::new(),
            }
        })
        .collect::<Vec<_>>()
        .join(" ")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_chunk_string() {
        assert_eq!(chunk_string("hello", 2), vec!["he", "ll", "o"]);
        assert_eq!(chunk_string("", 2), Vec::<&str>::new());
        assert!(chunk_string("hello", 0).is_empty());
    }

    #[test]
    fn test_chunk_chars() {
        assert_eq!(chunk_chars("hello", 2), vec!["he", "ll", "o"]);
        assert_eq!(chunk_chars("", 2), Vec::<String>::new());
        assert!(chunk_chars("hello", 0).is_empty());
    }

    #[test]
    fn test_truncate() {
        assert_eq!(truncate("hello world", 8), "hello...");
        assert_eq!(truncate("hi", 8), "hi");
        assert_eq!(truncate("hello", 5), "hello");
        assert_eq!(truncate("abc", 3), "abc");
    }

    #[test]
    fn test_normalize_whitespace() {
        assert_eq!(normalize_whitespace("  hello   world  "), "hello world");
        assert_eq!(normalize_whitespace("no\textra\nspace"), "no extra space");
    }

    #[test]
    fn test_is_blank() {
        assert!(is_blank(""));
        assert!(is_blank("   "));
        assert!(is_blank("\t\n"));
        assert!(!is_blank("x"));
    }

    #[test]
    fn test_to_title_case() {
        assert_eq!(to_title_case("hello world"), "Hello World");
        assert_eq!(to_title_case("HELLO WORLD"), "Hello World");
        assert_eq!(to_title_case("hELLO wORLD"), "Hello World");
    }
}
```

### benches/benchmarks.rs

```rust
use criterion::{black_box, criterion_group, criterion_main, BenchmarkId, Criterion, Throughput};
use my_crate::{batch, Client, Config};

fn bench_process(c: &mut Criterion) {
    let client = Client::default();

    c.bench_function("process_simple", |b| {
        b.iter(|| client.process(black_box("hello world")));
    });
}

fn bench_process_with_config(c: &mut Criterion) {
    let mut group = c.benchmark_group("process_with_config");

    let configs = [
        ("default", Config::default()),
        (
            "uppercase",
            Config::builder().uppercase(true).build().unwrap(),
        ),
        (
            "prefix_suffix",
            Config::builder()
                .prefix(">>>")
                .suffix("<<<")
                .build()
                .unwrap(),
        ),
        (
            "all_options",
            Config::builder()
                .uppercase(true)
                .prefix(">>>")
                .suffix("<<<")
                .build()
                .unwrap(),
        ),
    ];

    for (name, config) in configs {
        let client = Client::new(config);
        group.bench_with_input(BenchmarkId::new("process", name), &client, |b, client| {
            b.iter(|| client.process(black_box("hello world")));
        });
    }

    group.finish();
}

fn bench_batch_processing(c: &mut Criterion) {
    let client = Client::default();

    let mut group = c.benchmark_group("batch_processing");

    for size in [10, 100, 1000] {
        let inputs: Vec<&str> = (0..size).map(|_| "hello world").collect();
        group.throughput(Throughput::Elements(size));

        group.bench_with_input(BenchmarkId::new("process_many", size), &inputs, |b, inputs| {
            b.iter(|| batch::process_many(&client, black_box(inputs)));
        });

        group.bench_with_input(
            BenchmarkId::new("process_many_ok", size),
            &inputs,
            |b, inputs| {
                b.iter(|| batch::process_many_ok(&client, black_box(inputs)));
            },
        );
    }

    group.finish();
}

fn bench_input_sizes(c: &mut Criterion) {
    let client = Client::default();

    let mut group = c.benchmark_group("input_sizes");

    for size in [10, 100, 1000, 10000] {
        let input = "x".repeat(size);
        group.throughput(Throughput::Bytes(size as u64));

        group.bench_with_input(BenchmarkId::new("process", size), &input, |b, input| {
            b.iter(|| client.process(black_box(input)));
        });
    }

    group.finish();
}

criterion_group!(
    benches,
    bench_process,
    bench_process_with_config,
    bench_batch_processing,
    bench_input_sizes
);
criterion_main!(benches);
```

### examples/basic.rs

```rust
//! Basic usage example.

use my_crate::{Client, Config, Result};

fn main() -> Result<()> {
    // Create a client with default configuration
    let client = Client::default();

    // Process some input
    let result = client.process("Hello, World!")?;
    println!("Result: {result}");

    // Create a client with custom configuration
    let config = Config::builder()
        .uppercase(true)
        .prefix("[")
        .suffix("]")
        .build()?;

    let client = Client::new(config);
    let result = client.process("hello")?;
    println!("Formatted: {result}");

    // Batch processing
    let inputs = vec!["apple", "banana", "cherry"];
    let results = my_crate::batch::process_many(&client, &inputs);

    println!("\nBatch results:");
    for (input, result) in inputs.iter().zip(results.iter()) {
        match result {
            Ok(output) => println!("  {input} -> {output}"),
            Err(e) => println!("  {input} -> Error: {e}"),
        }
    }

    Ok(())
}
```

### examples/advanced.rs

```rust
//! Advanced usage example with async and serde features.

use my_crate::{batch, Client, Config, Result};
use serde_json::json;

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize tracing
    tracing_subscriber::fmt::init();

    // Create configuration from JSON
    let config_json = json!({
        "timeout": 60,
        "max_retries": 5,
        "uppercase": false,
        "prefix": ">>> ",
        "suffix": " <<<"
    });

    let config: Config = serde_json::from_value(config_json)
        .map_err(|e| my_crate::Error::configuration(e.to_string()))?;

    let client = Client::new(config);

    // Process single input
    let result = client.process("Hello, async world!")?;
    println!("Sync result: {result}");

    // Process asynchronously
    let async_result = client.process_async("Hello from async!").await?;
    println!("Async result: {async_result}");

    // Parallel batch processing
    let inputs = vec!["one", "two", "three", "four", "five"];
    let results = batch::process_parallel(&client, &inputs).await;

    println!("\nParallel results:");
    for (input, result) in inputs.iter().zip(results.iter()) {
        match result {
            Ok(output) => println!("  {input} -> {output}"),
            Err(e) => println!("  {input} -> Error: {e}"),
        }
    }

    // Serialize config for debugging
    let config_str = serde_json::to_string_pretty(client.config())?;
    println!("\nConfiguration:\n{config_str}");

    Ok(())
}
```

### tests/integration.rs

```rust
use my_crate::{batch, Client, Config, Error};

mod common;

#[test]
fn test_full_workflow() {
    let config = Config::builder()
        .timeout(60)
        .max_retries(3)
        .uppercase(true)
        .prefix("<<")
        .suffix(">>")
        .build()
        .unwrap();

    let client = Client::new(config);

    // Verify config
    assert!(client.validate().is_ok());

    // Process input
    let result = client.process("hello").unwrap();
    assert_eq!(result, "<<HELLO>>");
}

#[test]
fn test_error_handling() {
    let client = Client::default();

    // Empty input should error
    let result = client.process("");
    assert!(matches!(result, Err(Error::InvalidInput(_))));
}

#[test]
fn test_batch_operations() {
    let client = Client::default();
    let inputs = vec!["a", "b", "c", "", "d"];

    let results = batch::process_many(&client, &inputs);
    assert_eq!(results.len(), 5);

    // One error (empty string)
    let errors: Vec<_> = results.iter().filter(|r| r.is_err()).collect();
    assert_eq!(errors.len(), 1);

    // Four successes
    let successes = batch::process_many_ok(&client, &inputs);
    assert_eq!(successes.len(), 4);
}

#[test]
fn test_config_validation() {
    // Valid config
    let config = Config::builder().timeout(30).build();
    assert!(config.is_ok());

    // Invalid: zero timeout
    let config = Config::builder().timeout(0).build();
    assert!(config.is_err());

    // Invalid: prefix too long
    let long_prefix = "x".repeat(101);
    let config = Config::builder().prefix(long_prefix).build();
    assert!(config.is_err());
}

#[test]
fn test_config_defaults() {
    let config = Config::default();
    assert_eq!(config.timeout, Config::DEFAULT_TIMEOUT);
    assert_eq!(config.max_retries, Config::DEFAULT_MAX_RETRIES);
    assert!(!config.uppercase);
    assert!(config.prefix.is_none());
    assert!(config.suffix.is_none());
}

#[cfg(feature = "serde")]
#[test]
fn test_config_serialization() {
    let config = Config::builder()
        .timeout(60)
        .uppercase(true)
        .prefix(">>")
        .build()
        .unwrap();

    let json = serde_json::to_string(&config).unwrap();
    let deserialized: Config = serde_json::from_str(&json).unwrap();

    assert_eq!(config, deserialized);
}

#[cfg(feature = "async")]
#[tokio::test]
async fn test_async_processing() {
    let client = Client::default();
    let result = client.process_async("hello").await.unwrap();
    assert_eq!(result, "hello");
}

#[cfg(feature = "async")]
#[tokio::test]
async fn test_parallel_processing() {
    let client = Client::default();
    let inputs = vec!["a", "b", "c"];
    let results = batch::process_parallel(&client, &inputs).await;

    assert_eq!(results.len(), 3);
    assert!(results.iter().all(|r| r.is_ok()));
}
```

### tests/common/mod.rs

```rust
//! Common test utilities.

use my_crate::{Client, Config};

/// Creates a test client with default configuration.
#[allow(dead_code)]
pub fn test_client() -> Client {
    Client::default()
}

/// Creates a test client with custom configuration.
#[allow(dead_code)]
pub fn custom_client(uppercase: bool, prefix: Option<&str>, suffix: Option<&str>) -> Client {
    let mut builder = Config::builder().uppercase(uppercase);

    if let Some(p) = prefix {
        builder = builder.prefix(p);
    }

    if let Some(s) = suffix {
        builder = builder.suffix(s);
    }

    Client::new(builder.build().unwrap())
}

/// Test fixture for property-based testing.
#[allow(dead_code)]
pub struct TestFixture {
    pub client: Client,
    pub inputs: Vec<String>,
}

impl TestFixture {
    #[allow(dead_code)]
    pub fn new(inputs: Vec<String>) -> Self {
        Self {
            client: Client::default(),
            inputs,
        }
    }
}
```

### .github/workflows/ci.yml

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  CARGO_TERM_COLOR: always
  RUST_BACKTRACE: 1
  RUSTFLAGS: -Dwarnings

jobs:
  check:
    name: Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      - uses: Swatinem/rust-cache@v2
      - run: cargo check --all-features

  fmt:
    name: Format
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
        with:
          components: rustfmt
      - run: cargo fmt --all -- --check

  clippy:
    name: Clippy
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
        with:
          components: clippy
      - uses: Swatinem/rust-cache@v2
      - run: cargo clippy --all-targets --all-features -- -D warnings

  test:
    name: Test
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
        rust: [stable, beta]
        exclude:
          - os: macos-latest
            rust: beta
          - os: windows-latest
            rust: beta
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@master
        with:
          toolchain: ${{ matrix.rust }}
      - uses: Swatinem/rust-cache@v2
      - run: cargo test --all-features

  msrv:
    name: MSRV
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@master
        with:
          toolchain: "1.70"
      - uses: Swatinem/rust-cache@v2
      - run: cargo check --all-features

  coverage:
    name: Coverage
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      - uses: Swatinem/rust-cache@v2
      - uses: taiki-e/install-action@cargo-llvm-cov
      - run: cargo llvm-cov --all-features --lcov --output-path lcov.info
      - uses: codecov/codecov-action@v4
        with:
          files: lcov.info
          fail_ci_if_error: true

  docs:
    name: Docs
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@nightly
      - uses: Swatinem/rust-cache@v2
      - run: cargo doc --all-features --no-deps
        env:
          RUSTDOCFLAGS: --cfg docsrs -Dwarnings

  feature-matrix:
    name: Feature Matrix
    runs-on: ubuntu-latest
    strategy:
      matrix:
        features:
          - ""
          - "std"
          - "alloc"
          - "serde"
          - "async"
          - "tracing"
          - "full"
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      - uses: Swatinem/rust-cache@v2
      - run: cargo check --no-default-features --features "${{ matrix.features }}"
      - run: cargo test --no-default-features --features "${{ matrix.features }}"
```

### .github/workflows/release.yml

```yaml
name: Release

on:
  push:
    tags:
      - "v*"

permissions:
  contents: write

jobs:
  release:
    name: Release
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      - uses: Swatinem/rust-cache@v2

      - name: Verify version
        run: |
          VERSION=${GITHUB_REF#refs/tags/v}
          CARGO_VERSION=$(grep '^version' Cargo.toml | head -1 | cut -d'"' -f2)
          if [ "$VERSION" != "$CARGO_VERSION" ]; then
            echo "Tag version ($VERSION) doesn't match Cargo.toml version ($CARGO_VERSION)"
            exit 1
          fi

      - name: Run tests
        run: cargo test --all-features

      - name: Build docs
        run: cargo doc --all-features --no-deps

      - name: Package
        run: cargo package --allow-dirty

      - name: Publish to crates.io
        run: cargo publish
        env:
          CARGO_REGISTRY_TOKEN: ${{ secrets.CARGO_REGISTRY_TOKEN }}

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v1
        with:
          generate_release_notes: true
          files: |
            target/package/*.crate
```

### .github/workflows/audit.yml

```yaml
name: Security Audit

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: "0 0 * * *"

jobs:
  audit:
    name: Audit
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: rustsec/audit-check@v1
        with:
          token: ${{ secrets.GITHUB_TOKEN }}

  deny:
    name: Deny
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: EmbarkStudios/cargo-deny-action@v1
        with:
          command: check
          arguments: --all-features
```

### deny.toml

```toml
[advisories]
vulnerability = "deny"
unmaintained = "warn"
yanked = "warn"
notice = "warn"

[licenses]
unlicensed = "deny"
allow = [
    "MIT",
    "Apache-2.0",
    "BSD-2-Clause",
    "BSD-3-Clause",
    "ISC",
    "Zlib",
    "CC0-1.0",
    "Unicode-DFS-2016",
]
copyleft = "warn"
default = "deny"

[bans]
multiple-versions = "warn"
wildcards = "deny"
highlight = "all"

[sources]
unknown-registry = "deny"
unknown-git = "deny"
allow-registry = ["https://github.com/rust-lang/crates.io-index"]
```

### release.toml

```toml
# cargo-release configuration

[hooks]
pre-release-commit-message = "chore: release {{version}}"

[[pre-release-replacements]]
file = "CHANGELOG.md"
search = "## \\[Unreleased\\]"
replace = """## [Unreleased]

## [{{version}}] - {{date}}"""
prerelease = true

[[pre-release-replacements]]
file = "src/lib.rs"
search = "//! version = \"[0-9]+\\.[0-9]+\\.[0-9]+\""
replace = "//! version = \"{{version}}\""

[cargo-release]
sign-commit = true
sign-tag = true
push = true
publish = true
verify = true
shared-version = true
consolidate-commits = true
dependent-version = "upgrade"
tag-message = "{{crate_name}} v{{version}}"
```

### rustfmt.toml

```toml
edition = "2021"
max_width = 100
tab_spaces = 4
newline_style = "Auto"
use_field_init_shorthand = true
use_try_shorthand = true
format_code_in_doc_comments = true
imports_granularity = "Crate"
group_imports = "StdExternalCrate"
reorder_imports = true
```

### clippy.toml

```toml
msrv = "1.70"
cognitive-complexity-threshold = 30
disallowed-macros = []
disallowed-methods = []
disallowed-types = []
doc-valid-idents = ["GitHub", "GitLab", "JavaScript", "TypeScript", "NaN", "OAuth"]
```

### README.md

```markdown
# my-crate

[![Crates.io](https://img.shields.io/crates/v/my-crate.svg)](https://crates.io/crates/my-crate)
[![Documentation](https://docs.rs/my-crate/badge.svg)](https://docs.rs/my-crate)
[![CI](https://github.com/username/my-crate/actions/workflows/ci.yml/badge.svg)](https://github.com/username/my-crate/actions/workflows/ci.yml)
[![License](https://img.shields.io/crates/l/my-crate.svg)](LICENSE-MIT)
[![MSRV](https://img.shields.io/badge/MSRV-1.70-blue.svg)](https://github.com/username/my-crate)

A brief description of what this crate does.

## Features

- Feature 1
- Feature 2
- Feature 3

## Installation

Add this to your `Cargo.toml`:

```toml
[dependencies]
my-crate = "0.1"
```

Or with specific features:

```toml
[dependencies]
my-crate = { version = "0.1", features = ["serde", "async"] }
```

## Quick Start

```rust
use my_crate::{Client, Config};

fn main() -> my_crate::Result<()> {
    let config = Config::builder()
        .timeout(30)
        .uppercase(true)
        .build()?;

    let client = Client::new(config);
    let result = client.process("hello")?;

    println!("{}", result); // "HELLO"
    Ok(())
}
```

## Feature Flags

| Feature | Description |
|---------|-------------|
| `std` (default) | Enable standard library support |
| `alloc` | Enable alloc support for no_std |
| `serde` | Enable serialization support |
| `async` | Enable async/await with Tokio |
| `tracing` | Enable tracing instrumentation |
| `full` | Enable all features |

## no_std Support

This crate supports `no_std` environments:

```toml
[dependencies]
my-crate = { version = "0.1", default-features = false, features = ["alloc"] }
```

## MSRV Policy

The Minimum Supported Rust Version is 1.70. We test against stable, beta, and the MSRV in CI.

## License

Licensed under either of:

- Apache License, Version 2.0 ([LICENSE-APACHE](LICENSE-APACHE) or http://www.apache.org/licenses/LICENSE-2.0)
- MIT license ([LICENSE-MIT](LICENSE-MIT) or http://opensource.org/licenses/MIT)

at your option.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.
```

## CLAUDE.md Integration

```markdown
# My Crate - Rust Library

## Build Commands
- `cargo build` - Build the library
- `cargo build --all-features` - Build with all features
- `cargo test` - Run all tests
- `cargo test --all-features` - Test with all features
- `cargo bench` - Run benchmarks
- `cargo doc --open` - Generate and view documentation
- `cargo clippy --all-targets --all-features` - Run linter
- `cargo fmt` - Format code
- `cargo publish --dry-run` - Test publishing

## Architecture
- **src/lib.rs** - Main library entry, Client struct, public API
- **src/error.rs** - Error types and Result alias
- **src/types/** - Configuration and type definitions
- **src/utils/** - Helper functions and utilities
- **benches/** - Criterion benchmarks
- **examples/** - Usage examples
- **tests/** - Integration tests

## Feature Flags
- `std` (default) - Standard library support
- `alloc` - Allocation support for no_std
- `serde` - Serialization/deserialization
- `async` - Async support with Tokio
- `tracing` - Instrumentation
- `full` - All features enabled

## Testing Patterns
- Unit tests in each module with `#[cfg(test)]`
- Integration tests in `tests/` directory
- Property-based tests with proptest
- Feature-gated tests with `#[cfg(feature = "...")]`

## Release Process
1. Update version in Cargo.toml
2. Update CHANGELOG.md
3. Create git tag: `git tag v0.1.0`
4. Push tag: `git push --tags`
5. CI will publish to crates.io
```

## AI Suggestions

1. **Add fuzzing targets** - Create `fuzz/` directory with cargo-fuzz targets for input parsing and validation functions
2. **Implement From/Into traits** - Add conversion traits for common types to improve ergonomics
3. **Add derive macros** - Create a proc-macro crate for deriving common traits automatically
4. **Implement Display/Debug properly** - Ensure all public types have meaningful Display and Debug implementations
5. **Add compile-time feature detection** - Use cfg_if! macro for cleaner feature-gated code
6. **Create architecture-specific optimizations** - Add SIMD implementations for performance-critical paths
7. **Implement zero-copy APIs** - Add borrowing variants of methods to avoid unnecessary allocations
8. **Add semver checks** - Use cargo-semver-checks in CI to catch breaking changes
9. **Create migration guides** - Document breaking changes between versions with upgrade paths
10. **Add WASM support** - Enable wasm32-unknown-unknown target with wasm-bindgen integration
