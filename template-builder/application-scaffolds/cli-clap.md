# Rust CLI with clap

## Overview

High-performance Rust command-line interface using clap v4 with derive macros, featuring subcommands, environment variable support, configuration files, colored output, progress bars, async runtime, and comprehensive error handling with anyhow/thiserror.

## Quick Start

```bash
# Create new project
cargo new my-cli
cd my-cli

# Add dependencies to Cargo.toml
cargo add clap --features derive,env,cargo
cargo add tokio --features full
cargo add anyhow thiserror
cargo add serde --features derive
cargo add serde_json serde_yaml toml
cargo add colored
cargo add indicatif
cargo add dialoguer
cargo add config
cargo add directories
cargo add tracing tracing-subscriber --features env-filter

# Build and run
cargo build --release
./target/release/my-cli --help
```

## Project Structure

```
my-cli/
├── src/
│   ├── main.rs                  # Entry point
│   ├── cli.rs                   # CLI definition
│   ├── commands/
│   │   ├── mod.rs               # Command exports
│   │   ├── init.rs              # Init command
│   │   ├── config.rs            # Config command
│   │   ├── generate.rs          # Generate command
│   │   └── run.rs               # Run command
│   ├── config/
│   │   ├── mod.rs               # Config module
│   │   └── settings.rs          # Settings struct
│   ├── error.rs                 # Error types
│   ├── lib.rs                   # Library exports
│   └── utils/
│       ├── mod.rs               # Utility exports
│       ├── fs.rs                # File system utilities
│       ├── prompt.rs            # Interactive prompts
│       └── spinner.rs           # Progress indicators
├── tests/
│   ├── integration/
│   │   ├── mod.rs
│   │   └── cli_tests.rs
│   └── common/
│       └── mod.rs
├── Cargo.toml
├── Cargo.lock
├── .cargo/
│   └── config.toml
├── build.rs                     # Build script
└── CLAUDE.md
```

## Configuration Files

### Cargo.toml

```toml
[package]
name = "my-cli"
version = "1.0.0"
edition = "2021"
authors = ["Your Name <you@example.com>"]
description = "A production-ready CLI application"
license = "MIT"
repository = "https://github.com/yourname/my-cli"
keywords = ["cli", "tool"]
categories = ["command-line-utilities"]
rust-version = "1.75"

[dependencies]
# CLI framework
clap = { version = "4.5", features = ["derive", "env", "cargo", "wrap_help", "string"] }

# Async runtime
tokio = { version = "1.37", features = ["full"] }

# Error handling
anyhow = "1.0"
thiserror = "1.0"

# Serialization
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
serde_yaml = "0.9"
toml = "0.8"

# Configuration
config = "0.14"
directories = "5.0"

# Terminal UI
colored = "2.1"
indicatif = { version = "0.17", features = ["tokio"] }
dialoguer = { version = "0.11", features = ["fuzzy-select"] }
console = "0.15"

# Logging
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter", "json"] }

# Utilities
glob = "0.3"
walkdir = "2.5"
tempfile = "3.10"
chrono = { version = "0.4", features = ["serde"] }
regex = "1.10"
url = { version = "2.5", features = ["serde"] }
reqwest = { version = "0.12", features = ["json", "rustls-tls"], default-features = false }
handlebars = "5.1"

[dev-dependencies]
assert_cmd = "2.0"
predicates = "3.1"
assert_fs = "1.1"
serial_test = "3.0"

[profile.release]
lto = true
codegen-units = 1
panic = "abort"
strip = true
opt-level = 3

[profile.dev]
opt-level = 0
debug = true

[[bin]]
name = "my-cli"
path = "src/main.rs"

[lib]
name = "my_cli"
path = "src/lib.rs"
```

### .cargo/config.toml

```toml
[build]
rustflags = ["-C", "target-cpu=native"]

[target.x86_64-unknown-linux-gnu]
linker = "clang"
rustflags = ["-C", "link-arg=-fuse-ld=lld"]

[target.x86_64-apple-darwin]
rustflags = ["-C", "link-arg=-fuse-ld=lld"]

[alias]
r = "run --"
b = "build --release"
t = "test"
```

### build.rs

```rust
use std::process::Command;

fn main() {
    // Generate version info
    let output = Command::new("git")
        .args(["rev-parse", "--short", "HEAD"])
        .output()
        .ok();

    let git_hash = output
        .and_then(|o| String::from_utf8(o.stdout).ok())
        .map(|s| s.trim().to_string())
        .unwrap_or_else(|| "unknown".to_string());

    println!("cargo:rustc-env=GIT_HASH={}", git_hash);
    println!("cargo:rerun-if-changed=.git/HEAD");
}
```

## Core Implementation

### src/main.rs

```rust
use anyhow::Result;
use clap::Parser;
use tracing_subscriber::{fmt, prelude::*, EnvFilter};

use my_cli::cli::{Cli, Commands};
use my_cli::commands;

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize logging
    tracing_subscriber::registry()
        .with(fmt::layer())
        .with(EnvFilter::from_default_env().add_directive("my_cli=info".parse()?))
        .init();

    let cli = Cli::parse();

    // Set verbosity
    if cli.verbose > 0 {
        tracing::info!("Verbosity level: {}", cli.verbose);
    }

    // Execute command
    match cli.command {
        Commands::Init(args) => commands::init::execute(args).await?,
        Commands::Config(args) => commands::config::execute(args).await?,
        Commands::Generate(args) => commands::generate::execute(args).await?,
        Commands::Run(args) => commands::run::execute(args).await?,
    }

    Ok(())
}
```

### src/cli.rs

```rust
use clap::{Parser, Subcommand, Args, ValueEnum};
use std::path::PathBuf;

/// A powerful CLI application
#[derive(Parser, Debug)]
#[command(
    name = "my-cli",
    author,
    version,
    about = "A production-ready CLI application",
    long_about = None,
    after_help = "For more information, visit https://github.com/yourname/my-cli"
)]
#[command(propagate_version = true)]
pub struct Cli {
    /// Configuration file path
    #[arg(short, long, env = "MY_CLI_CONFIG", global = true)]
    pub config: Option<PathBuf>,

    /// Increase verbosity (-v, -vv, -vvv)
    #[arg(short, long, action = clap::ArgAction::Count, global = true)]
    pub verbose: u8,

    /// Suppress output
    #[arg(short, long, global = true)]
    pub quiet: bool,

    /// Output format
    #[arg(long, value_enum, default_value_t = OutputFormat::Text, global = true)]
    pub format: OutputFormat,

    #[command(subcommand)]
    pub command: Commands,
}

#[derive(Subcommand, Debug)]
pub enum Commands {
    /// Initialize a new project
    Init(InitArgs),

    /// Manage configuration
    #[command(subcommand)]
    Config(ConfigCommands),

    /// Generate code from templates
    Generate(GenerateArgs),

    /// Run a task
    Run(RunArgs),
}

#[derive(Args, Debug)]
pub struct InitArgs {
    /// Project name
    #[arg(required = true)]
    pub name: String,

    /// Project directory
    #[arg(short, long)]
    pub path: Option<PathBuf>,

    /// Template to use
    #[arg(short, long, default_value = "default")]
    pub template: String,

    /// Skip git initialization
    #[arg(long)]
    pub no_git: bool,

    /// Force overwrite existing directory
    #[arg(short, long)]
    pub force: bool,
}

#[derive(Subcommand, Debug)]
pub enum ConfigCommands {
    /// Get a configuration value
    Get {
        /// Configuration key
        key: Option<String>,

        /// Show all configuration
        #[arg(short, long)]
        all: bool,
    },

    /// Set a configuration value
    Set {
        /// Configuration key
        key: String,

        /// Configuration value
        value: String,
    },

    /// Delete a configuration value
    Delete {
        /// Configuration key
        key: String,
    },

    /// Reset configuration to defaults
    Reset {
        /// Skip confirmation
        #[arg(short, long)]
        force: bool,
    },

    /// Show configuration file path
    Path,
}

#[derive(Args, Debug)]
pub struct GenerateArgs {
    /// Type to generate
    #[arg(value_enum)]
    pub kind: GenerateKind,

    /// Name of the generated item
    #[arg(short, long)]
    pub name: String,

    /// Output directory
    #[arg(short, long, default_value = ".")]
    pub output: PathBuf,

    /// Dry run - show what would be generated
    #[arg(long)]
    pub dry_run: bool,
}

#[derive(ValueEnum, Clone, Debug)]
pub enum GenerateKind {
    Component,
    Module,
    Service,
    Model,
}

#[derive(Args, Debug)]
pub struct RunArgs {
    /// Task to run
    #[arg(required = true)]
    pub task: String,

    /// Additional arguments
    #[arg(trailing_var_arg = true, allow_hyphen_values = true)]
    pub args: Vec<String>,

    /// Watch for changes
    #[arg(short, long)]
    pub watch: bool,
}

#[derive(ValueEnum, Clone, Debug, Default)]
pub enum OutputFormat {
    #[default]
    Text,
    Json,
    Yaml,
}
```

### src/lib.rs

```rust
pub mod cli;
pub mod commands;
pub mod config;
pub mod error;
pub mod utils;

pub use error::{Error, Result};
```

### src/error.rs

```rust
use thiserror::Error;

pub type Result<T> = std::result::Result<T, Error>;

#[derive(Error, Debug)]
pub enum Error {
    #[error("Configuration error: {0}")]
    Config(#[from] config::ConfigError),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Template error: {0}")]
    Template(#[from] handlebars::TemplateError),

    #[error("Render error: {0}")]
    Render(#[from] handlebars::RenderError),

    #[error("Serialization error: {0}")]
    Serialization(String),

    #[error("Project already exists: {0}")]
    ProjectExists(String),

    #[error("Project not found: {0}")]
    ProjectNotFound(String),

    #[error("Invalid input: {0}")]
    InvalidInput(String),

    #[error("Command failed: {0}")]
    CommandFailed(String),

    #[error("{0}")]
    Custom(String),
}

impl From<serde_json::Error> for Error {
    fn from(err: serde_json::Error) -> Self {
        Error::Serialization(err.to_string())
    }
}

impl From<serde_yaml::Error> for Error {
    fn from(err: serde_yaml::Error) -> Self {
        Error::Serialization(err.to_string())
    }
}

impl From<toml::de::Error> for Error {
    fn from(err: toml::de::Error) -> Self {
        Error::Serialization(err.to_string())
    }
}
```

### src/config/mod.rs

```rust
mod settings;

pub use settings::Settings;
```

### src/config/settings.rs

```rust
use config::{Config, ConfigError, Environment, File};
use directories::ProjectDirs;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    #[serde(default = "default_theme")]
    pub theme: String,

    #[serde(default = "default_editor")]
    pub editor: String,

    #[serde(default)]
    pub telemetry: bool,

    #[serde(default)]
    pub default_template: String,

    #[serde(default)]
    pub plugins: Vec<String>,
}

fn default_theme() -> String {
    "auto".to_string()
}

fn default_editor() -> String {
    std::env::var("EDITOR").unwrap_or_else(|_| "vim".to_string())
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            theme: default_theme(),
            editor: default_editor(),
            telemetry: false,
            default_template: "default".to_string(),
            plugins: Vec::new(),
        }
    }
}

impl Settings {
    pub fn load(config_path: Option<PathBuf>) -> Result<Self, ConfigError> {
        let mut builder = Config::builder();

        // Add default config file location
        if let Some(proj_dirs) = ProjectDirs::from("com", "my-cli", "my-cli") {
            let config_dir = proj_dirs.config_dir();
            let default_config = config_dir.join("config.toml");

            if default_config.exists() {
                builder = builder.add_source(File::from(default_config).required(false));
            }
        }

        // Add explicit config file
        if let Some(path) = config_path {
            builder = builder.add_source(File::from(path).required(true));
        }

        // Add local config file
        builder = builder.add_source(File::with_name(".my-cli").required(false));

        // Add environment variables
        builder = builder.add_source(
            Environment::with_prefix("MY_CLI")
                .separator("_")
                .try_parsing(true),
        );

        let config = builder.build()?;
        config.try_deserialize()
    }

    pub fn config_path() -> Option<PathBuf> {
        ProjectDirs::from("com", "my-cli", "my-cli")
            .map(|dirs| dirs.config_dir().join("config.toml"))
    }

    pub fn save(&self) -> anyhow::Result<()> {
        if let Some(path) = Self::config_path() {
            if let Some(parent) = path.parent() {
                std::fs::create_dir_all(parent)?;
            }
            let content = toml::to_string_pretty(self)?;
            std::fs::write(path, content)?;
        }
        Ok(())
    }
}
```

### src/commands/mod.rs

```rust
pub mod config;
pub mod generate;
pub mod init;
pub mod run;
```

### src/commands/init.rs

```rust
use anyhow::{Context, Result};
use colored::Colorize;
use dialoguer::{theme::ColorfulTheme, Confirm, Input, Select};
use indicatif::{ProgressBar, ProgressStyle};
use std::path::PathBuf;
use std::process::Command;
use std::time::Duration;
use tokio::fs;

use crate::cli::InitArgs;

pub async fn execute(args: InitArgs) -> Result<()> {
    let project_path = args.path.unwrap_or_else(|| PathBuf::from(&args.name));

    // Check if directory exists
    if project_path.exists() {
        if !args.force {
            let overwrite = Confirm::with_theme(&ColorfulTheme::default())
                .with_prompt(format!(
                    "Directory {} already exists. Overwrite?",
                    project_path.display()
                ))
                .default(false)
                .interact()?;

            if !overwrite {
                println!("{}", "Operation cancelled".yellow());
                return Ok(());
            }
        }
        fs::remove_dir_all(&project_path).await?;
    }

    // Create progress bar
    let pb = ProgressBar::new_spinner();
    pb.set_style(
        ProgressStyle::default_spinner()
            .tick_chars("⠁⠂⠄⡀⢀⠠⠐⠈ ")
            .template("{spinner:.cyan} {msg}")?,
    );
    pb.enable_steady_tick(Duration::from_millis(100));

    // Create project structure
    pb.set_message("Creating project structure...");
    create_project_structure(&project_path, &args).await?;
    pb.println(format!("{} Created project structure", "✔".green()));

    // Initialize git
    if !args.no_git {
        pb.set_message("Initializing git repository...");
        initialize_git(&project_path)?;
        pb.println(format!("{} Initialized git repository", "✔".green()));
    }

    pb.finish_and_clear();

    // Print success message
    println!();
    println!(
        "{} Project {} created successfully!",
        "✨".green(),
        args.name.cyan()
    );
    println!();
    println!("{}", "Next steps:".bold());
    println!("  cd {}", args.name);
    println!("  cargo build");
    println!("  cargo run -- --help");

    Ok(())
}

async fn create_project_structure(path: &PathBuf, args: &InitArgs) -> Result<()> {
    // Create directories
    fs::create_dir_all(path.join("src")).await?;
    fs::create_dir_all(path.join("tests")).await?;

    // Create Cargo.toml
    let cargo_toml = format!(
        r#"[package]
name = "{}"
version = "0.1.0"
edition = "2021"

[dependencies]
clap = {{ version = "4.5", features = ["derive"] }}
anyhow = "1.0"
tokio = {{ version = "1.37", features = ["full"] }}
"#,
        args.name
    );
    fs::write(path.join("Cargo.toml"), cargo_toml).await?;

    // Create main.rs
    let main_rs = r#"use clap::Parser;

#[derive(Parser)]
#[command(author, version, about)]
struct Args {
    /// Name to greet
    #[arg(short, long)]
    name: Option<String>,
}

fn main() {
    let args = Args::parse();
    let name = args.name.unwrap_or_else(|| "World".to_string());
    println!("Hello, {}!", name);
}
"#;
    fs::write(path.join("src/main.rs"), main_rs).await?;

    // Create .gitignore
    let gitignore = "/target\nCargo.lock\n";
    fs::write(path.join(".gitignore"), gitignore).await?;

    Ok(())
}

fn initialize_git(path: &PathBuf) -> Result<()> {
    Command::new("git")
        .args(["init"])
        .current_dir(path)
        .output()
        .context("Failed to initialize git")?;

    Command::new("git")
        .args(["add", "."])
        .current_dir(path)
        .output()
        .context("Failed to stage files")?;

    Command::new("git")
        .args(["commit", "-m", "Initial commit"])
        .current_dir(path)
        .output()
        .context("Failed to create initial commit")?;

    Ok(())
}
```

### src/commands/config.rs

```rust
use anyhow::Result;
use colored::Colorize;
use dialoguer::{theme::ColorfulTheme, Confirm};

use crate::cli::ConfigCommands;
use crate::config::Settings;

pub async fn execute(cmd: ConfigCommands) -> Result<()> {
    match cmd {
        ConfigCommands::Get { key, all } => get_config(key, all).await,
        ConfigCommands::Set { key, value } => set_config(key, value).await,
        ConfigCommands::Delete { key } => delete_config(key).await,
        ConfigCommands::Reset { force } => reset_config(force).await,
        ConfigCommands::Path => show_path().await,
    }
}

async fn get_config(key: Option<String>, all: bool) -> Result<()> {
    let settings = Settings::load(None)?;

    if all || key.is_none() {
        println!("{}", "\nCurrent Configuration:\n".bold());
        println!("  {}: {}", "theme".cyan(), settings.theme);
        println!("  {}: {}", "editor".cyan(), settings.editor);
        println!("  {}: {}", "telemetry".cyan(), settings.telemetry);
        println!(
            "  {}: {}",
            "default_template".cyan(),
            settings.default_template
        );
        println!("  {}: {:?}", "plugins".cyan(), settings.plugins);
        println!();
    } else if let Some(k) = key {
        let value = match k.as_str() {
            "theme" => settings.theme,
            "editor" => settings.editor,
            "telemetry" => settings.telemetry.to_string(),
            "default_template" => settings.default_template,
            "plugins" => format!("{:?}", settings.plugins),
            _ => {
                println!("{}", format!("Unknown key: {}", k).yellow());
                return Ok(());
            }
        };
        println!("{}", value);
    }

    Ok(())
}

async fn set_config(key: String, value: String) -> Result<()> {
    let mut settings = Settings::load(None).unwrap_or_default();

    match key.as_str() {
        "theme" => settings.theme = value.clone(),
        "editor" => settings.editor = value.clone(),
        "telemetry" => settings.telemetry = value.parse().unwrap_or(false),
        "default_template" => settings.default_template = value.clone(),
        _ => {
            println!("{}", format!("Unknown key: {}", key).yellow());
            return Ok(());
        }
    }

    settings.save()?;
    println!(
        "{} Set {} = {}",
        "✔".green(),
        key.cyan(),
        value.white()
    );

    Ok(())
}

async fn delete_config(key: String) -> Result<()> {
    let mut settings = Settings::load(None).unwrap_or_default();
    let default = Settings::default();

    match key.as_str() {
        "theme" => settings.theme = default.theme,
        "editor" => settings.editor = default.editor,
        "telemetry" => settings.telemetry = default.telemetry,
        "default_template" => settings.default_template = default.default_template,
        "plugins" => settings.plugins = default.plugins,
        _ => {
            println!("{}", format!("Unknown key: {}", key).yellow());
            return Ok(());
        }
    }

    settings.save()?;
    println!("{} Deleted {}", "✔".green(), key.cyan());

    Ok(())
}

async fn reset_config(force: bool) -> Result<()> {
    if !force {
        let confirm = Confirm::with_theme(&ColorfulTheme::default())
            .with_prompt("Reset all configuration to defaults?")
            .default(false)
            .interact()?;

        if !confirm {
            println!("{}", "Operation cancelled".yellow());
            return Ok(());
        }
    }

    let settings = Settings::default();
    settings.save()?;
    println!("{} Configuration reset to defaults", "✔".green());

    Ok(())
}

async fn show_path() -> Result<()> {
    if let Some(path) = Settings::config_path() {
        println!("{}", path.display());
    } else {
        println!("{}", "Could not determine config path".yellow());
    }
    Ok(())
}
```

### src/commands/generate.rs

```rust
use anyhow::Result;
use colored::Colorize;
use handlebars::Handlebars;
use serde_json::json;
use std::path::PathBuf;
use tokio::fs;

use crate::cli::{GenerateArgs, GenerateKind};

pub async fn execute(args: GenerateArgs) -> Result<()> {
    if args.dry_run {
        println!("{}", "\nDry Run - Would generate:\n".bold());
        println!("  {}: {:?}", "Type".cyan(), args.kind);
        println!("  {}: {}", "Name".cyan(), args.name);
        println!("  {}: {}", "Output".cyan(), args.output.display());
        return Ok(());
    }

    match args.kind {
        GenerateKind::Component => generate_component(&args).await,
        GenerateKind::Module => generate_module(&args).await,
        GenerateKind::Service => generate_service(&args).await,
        GenerateKind::Model => generate_model(&args).await,
    }
}

async fn generate_component(args: &GenerateArgs) -> Result<()> {
    let mut handlebars = Handlebars::new();
    handlebars.set_strict_mode(true);

    let template = r#"use yew::prelude::*;

#[derive(Properties, PartialEq)]
pub struct {{name}}Props {
    #[prop_or_default]
    pub children: Children,
}

#[function_component({{name}})]
pub fn {{snake_name}}(props: &{{name}}Props) -> Html {
    html! {
        <div class="{{kebab_name}}">
            { for props.children.iter() }
        </div>
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use wasm_bindgen_test::*;

    #[wasm_bindgen_test]
    fn test_{{snake_name}}_renders() {
        // Test implementation
    }
}
"#;

    handlebars.register_template_string("component", template)?;

    let data = json!({
        "name": args.name,
        "snake_name": to_snake_case(&args.name),
        "kebab_name": to_kebab_case(&args.name),
    });

    let content = handlebars.render("component", &data)?;
    let output_path = args.output.join(format!("{}.rs", to_snake_case(&args.name)));

    if args.output != PathBuf::from(".") {
        fs::create_dir_all(&args.output).await?;
    }

    fs::write(&output_path, content).await?;

    println!("{} Generated component {}", "✔".green(), args.name.cyan());
    println!("  {}", output_path.display());

    Ok(())
}

async fn generate_module(args: &GenerateArgs) -> Result<()> {
    let output_dir = args.output.join(&args.name);
    fs::create_dir_all(&output_dir).await?;

    // mod.rs
    let mod_content = format!(
        r#"mod {};

pub use {}::*;
"#,
        to_snake_case(&args.name),
        to_snake_case(&args.name)
    );
    fs::write(output_dir.join("mod.rs"), mod_content).await?;

    // Main file
    let main_content = format!(
        r#"//! {} module

pub struct {} {{
    // Add fields
}}

impl {} {{
    pub fn new() -> Self {{
        Self {{}}
    }}
}}

impl Default for {} {{
    fn default() -> Self {{
        Self::new()
    }}
}}
"#,
        args.name, args.name, args.name, args.name
    );
    fs::write(
        output_dir.join(format!("{}.rs", to_snake_case(&args.name))),
        main_content,
    )
    .await?;

    println!("{} Generated module {}", "✔".green(), args.name.cyan());
    println!("  {}", output_dir.display());

    Ok(())
}

async fn generate_service(args: &GenerateArgs) -> Result<()> {
    let template = format!(
        r#"use anyhow::Result;
use std::sync::Arc;

pub struct {}Service {{
    // Add dependencies
}}

impl {}Service {{
    pub fn new() -> Self {{
        Self {{}}
    }}

    pub async fn execute(&self) -> Result<()> {{
        // Implementation
        Ok(())
    }}
}}

#[cfg(test)]
mod tests {{
    use super::*;

    #[tokio::test]
    async fn test_execute() {{
        let service = {}Service::new();
        assert!(service.execute().await.is_ok());
    }}
}}
"#,
        args.name, args.name, args.name
    );

    let output_path = args
        .output
        .join(format!("{}_service.rs", to_snake_case(&args.name)));

    if args.output != PathBuf::from(".") {
        fs::create_dir_all(&args.output).await?;
    }

    fs::write(&output_path, template).await?;

    println!("{} Generated service {}", "✔".green(), args.name.cyan());
    println!("  {}", output_path.display());

    Ok(())
}

async fn generate_model(args: &GenerateArgs) -> Result<()> {
    let template = format!(
        r#"use serde::{{Deserialize, Serialize}};
use chrono::{{DateTime, Utc}};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct {} {{
    pub id: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}}

impl {} {{
    pub fn new() -> Self {{
        let now = Utc::now();
        Self {{
            id: uuid::Uuid::new_v4().to_string(),
            created_at: now,
            updated_at: now,
        }}
    }}
}}

impl Default for {} {{
    fn default() -> Self {{
        Self::new()
    }}
}}

#[cfg(test)]
mod tests {{
    use super::*;

    #[test]
    fn test_new() {{
        let model = {}::new();
        assert!(!model.id.is_empty());
    }}
}}
"#,
        args.name, args.name, args.name, args.name
    );

    let output_path = args
        .output
        .join(format!("{}.rs", to_snake_case(&args.name)));

    if args.output != PathBuf::from(".") {
        fs::create_dir_all(&args.output).await?;
    }

    fs::write(&output_path, template).await?;

    println!("{} Generated model {}", "✔".green(), args.name.cyan());
    println!("  {}", output_path.display());

    Ok(())
}

fn to_snake_case(s: &str) -> String {
    let mut result = String::new();
    for (i, c) in s.chars().enumerate() {
        if c.is_uppercase() {
            if i > 0 {
                result.push('_');
            }
            result.push(c.to_lowercase().next().unwrap());
        } else {
            result.push(c);
        }
    }
    result
}

fn to_kebab_case(s: &str) -> String {
    to_snake_case(s).replace('_', "-")
}
```

### src/commands/run.rs

```rust
use anyhow::{Context, Result};
use colored::Colorize;
use std::process::Command;

use crate::cli::RunArgs;

pub async fn execute(args: RunArgs) -> Result<()> {
    println!(
        "{} Running task: {}",
        "→".cyan(),
        args.task.bold()
    );

    // Build command
    let status = Command::new(&args.task)
        .args(&args.args)
        .status()
        .context(format!("Failed to execute task: {}", args.task))?;

    if status.success() {
        println!("{} Task completed successfully", "✔".green());
    } else {
        println!(
            "{} Task failed with exit code: {}",
            "✖".red(),
            status.code().unwrap_or(-1)
        );
    }

    Ok(())
}
```

### src/utils/mod.rs

```rust
pub mod fs;
pub mod prompt;
pub mod spinner;

pub use fs::*;
pub use prompt::*;
pub use spinner::*;
```

### src/utils/prompt.rs

```rust
use dialoguer::{theme::ColorfulTheme, Confirm, Input, Select, MultiSelect, FuzzySelect};
use anyhow::Result;

pub fn confirm(message: &str, default: bool) -> Result<bool> {
    Ok(Confirm::with_theme(&ColorfulTheme::default())
        .with_prompt(message)
        .default(default)
        .interact()?)
}

pub fn input(message: &str, default: Option<&str>) -> Result<String> {
    let mut input = Input::<String>::with_theme(&ColorfulTheme::default())
        .with_prompt(message);

    if let Some(d) = default {
        input = input.default(d.to_string());
    }

    Ok(input.interact_text()?)
}

pub fn select<T: ToString>(message: &str, options: &[T], default: usize) -> Result<usize> {
    Ok(Select::with_theme(&ColorfulTheme::default())
        .with_prompt(message)
        .items(options)
        .default(default)
        .interact()?)
}

pub fn multi_select<T: ToString>(message: &str, options: &[T]) -> Result<Vec<usize>> {
    Ok(MultiSelect::with_theme(&ColorfulTheme::default())
        .with_prompt(message)
        .items(options)
        .interact()?)
}

pub fn fuzzy_select<T: ToString>(message: &str, options: &[T]) -> Result<usize> {
    Ok(FuzzySelect::with_theme(&ColorfulTheme::default())
        .with_prompt(message)
        .items(options)
        .interact()?)
}
```

## Testing

### tests/integration/cli_tests.rs

```rust
use assert_cmd::Command;
use assert_fs::prelude::*;
use predicates::prelude::*;

fn cli() -> Command {
    Command::cargo_bin("my-cli").unwrap()
}

#[test]
fn test_help() {
    cli()
        .arg("--help")
        .assert()
        .success()
        .stdout(predicate::str::contains("A production-ready CLI"));
}

#[test]
fn test_version() {
    cli()
        .arg("--version")
        .assert()
        .success()
        .stdout(predicate::str::contains(env!("CARGO_PKG_VERSION")));
}

#[test]
fn test_init_creates_project() {
    let temp = assert_fs::TempDir::new().unwrap();

    cli()
        .current_dir(temp.path())
        .args(["init", "test-project", "--no-git"])
        .assert()
        .success()
        .stdout(predicate::str::contains("created successfully"));

    temp.child("test-project/Cargo.toml").assert(predicate::path::exists());
    temp.child("test-project/src/main.rs").assert(predicate::path::exists());
}

#[test]
fn test_config_path() {
    cli()
        .args(["config", "path"])
        .assert()
        .success();
}

#[test]
fn test_generate_dry_run() {
    cli()
        .args(["generate", "component", "--name", "Button", "--dry-run"])
        .assert()
        .success()
        .stdout(predicate::str::contains("Dry Run"));
}
```

## CLAUDE.md Integration

```markdown
# Rust CLI Project

## Commands
- `cargo run -- <command>` - Run in development
- `cargo build --release` - Build optimized binary
- `cargo test` - Run tests
- `cargo clippy` - Run linter

## Architecture
- clap v4 with derive for argument parsing
- tokio async runtime
- anyhow/thiserror for error handling
- config crate for configuration

## Adding Commands
1. Add variant to Commands enum in cli.rs
2. Create command file in src/commands/
3. Implement execute function
4. Add match arm in main.rs

## Configuration
- Global config: ~/.config/my-cli/config.toml
- Local config: .my-cli.toml
- Environment: MY_CLI_* prefix

## Testing
- Integration tests in tests/
- Use assert_cmd and assert_fs
- Run with `cargo test`
```

## AI Suggestions

1. **Shell Completions** - Generate completions using clap's built-in completion generator for bash/zsh/fish/powershell
2. **Config Profiles** - Support multiple configuration profiles with `--profile` flag
3. **Plugin System** - Implement dynamic plugin loading using libloading for extensibility
4. **Offline Mode** - Cache network resources and detect offline state for graceful degradation
5. **Update Checker** - Add self-update capability using self_update crate
6. **Scripting Support** - Add ability to run commands from script files with variables
7. **Parallel Execution** - Use rayon for parallel processing of batch operations
8. **Undo/Rollback** - Track operations and provide rollback capability for file changes
9. **Structured Logging** - Add JSON logging output for machine parsing in CI environments
10. **Performance Profiling** - Integrate criterion for benchmarking critical paths
