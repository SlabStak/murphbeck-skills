# Python CLI with Typer

## Overview

Modern Python command-line interface using Typer with type hints, automatic help generation, rich terminal output, configuration management with Pydantic, async support, and comprehensive testing with pytest. Features subcommands, shell completions, progress bars, and plugin architecture.

## Quick Start

```bash
# Create project with uv (recommended)
uv init my-cli
cd my-cli

# Or with traditional setup
mkdir my-cli && cd my-cli
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows

# Install dependencies
uv add typer rich pydantic pydantic-settings click-completion \
    httpx aiofiles python-dotenv tomli tomli-w

# Or with pip
pip install typer[all] rich pydantic pydantic-settings httpx aiofiles python-dotenv tomli tomli-w

# Install dev dependencies
uv add --dev pytest pytest-asyncio pytest-cov ruff mypy

# Run CLI
python -m my_cli --help
```

## Project Structure

```
my-cli/
├── src/
│   └── my_cli/
│       ├── __init__.py          # Package init
│       ├── __main__.py          # Entry point
│       ├── main.py              # CLI app
│       ├── commands/
│       │   ├── __init__.py      # Command exports
│       │   ├── init.py          # Init command
│       │   ├── config.py        # Config command
│       │   └── generate.py      # Generate command
│       ├── core/
│       │   ├── __init__.py
│       │   ├── config.py        # Configuration
│       │   ├── console.py       # Rich console
│       │   └── exceptions.py    # Custom exceptions
│       ├── utils/
│       │   ├── __init__.py
│       │   ├── fs.py            # File system utils
│       │   ├── template.py      # Template engine
│       │   └── validation.py    # Validators
│       └── plugins/
│           ├── __init__.py
│           └── loader.py        # Plugin loader
├── tests/
│   ├── __init__.py
│   ├── conftest.py              # Fixtures
│   ├── test_init.py
│   ├── test_config.py
│   └── test_generate.py
├── templates/
│   └── default/
│       └── main.py.jinja
├── pyproject.toml
├── README.md
└── CLAUDE.md
```

## Configuration Files

### pyproject.toml

```toml
[project]
name = "my-cli"
version = "1.0.0"
description = "A production-ready CLI application"
readme = "README.md"
license = { text = "MIT" }
authors = [{ name = "Your Name", email = "you@example.com" }]
requires-python = ">=3.11"
classifiers = [
    "Development Status :: 5 - Production/Stable",
    "Environment :: Console",
    "Intended Audience :: Developers",
    "License :: OSI Approved :: MIT License",
    "Programming Language :: Python :: 3.11",
    "Programming Language :: Python :: 3.12",
    "Typing :: Typed",
]
dependencies = [
    "typer[all]>=0.12.0",
    "rich>=13.7.0",
    "pydantic>=2.6.0",
    "pydantic-settings>=2.2.0",
    "httpx>=0.27.0",
    "aiofiles>=23.2.0",
    "python-dotenv>=1.0.0",
    "tomli>=2.0.0",
    "tomli-w>=1.0.0",
    "jinja2>=3.1.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0.0",
    "pytest-asyncio>=0.23.0",
    "pytest-cov>=4.1.0",
    "ruff>=0.3.0",
    "mypy>=1.8.0",
]

[project.scripts]
my-cli = "my_cli.main:app"

[project.urls]
Homepage = "https://github.com/yourname/my-cli"
Documentation = "https://github.com/yourname/my-cli#readme"
Repository = "https://github.com/yourname/my-cli"

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["src/my_cli"]

[tool.ruff]
line-length = 100
target-version = "py311"

[tool.ruff.lint]
select = ["E", "F", "I", "N", "W", "B", "C4", "UP", "RUF"]
ignore = ["E501"]

[tool.mypy]
python_version = "3.11"
strict = true
warn_return_any = true
warn_unused_configs = true

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
addopts = "-v --cov=my_cli --cov-report=term-missing"

[tool.coverage.run]
source = ["src/my_cli"]
branch = true

[tool.coverage.report]
exclude_lines = [
    "pragma: no cover",
    "if TYPE_CHECKING:",
    "raise NotImplementedError",
]
```

## Core Implementation

### src/my_cli/__init__.py

```python
"""My CLI - A production-ready command-line application."""

__version__ = "1.0.0"
```

### src/my_cli/__main__.py

```python
"""Entry point for running as module: python -m my_cli"""

from my_cli.main import app

if __name__ == "__main__":
    app()
```

### src/my_cli/main.py

```python
"""Main CLI application."""

from typing import Annotated, Optional

import typer
from rich.console import Console

from my_cli import __version__
from my_cli.commands import config, generate, init
from my_cli.core.config import Settings, get_settings
from my_cli.core.console import console, error_console

app = typer.Typer(
    name="my-cli",
    help="A production-ready CLI application",
    no_args_is_help=True,
    rich_markup_mode="rich",
    pretty_exceptions_enable=True,
    pretty_exceptions_show_locals=False,
)

# Add subcommands
app.add_typer(init.app, name="init")
app.add_typer(config.app, name="config")
app.add_typer(generate.app, name="generate", aliases=["g", "gen"])


def version_callback(value: bool) -> None:
    """Print version and exit."""
    if value:
        console.print(f"[cyan]my-cli[/cyan] version [green]{__version__}[/green]")
        raise typer.Exit()


@app.callback()
def main(
    ctx: typer.Context,
    version: Annotated[
        Optional[bool],
        typer.Option(
            "--version",
            "-v",
            help="Show version and exit.",
            callback=version_callback,
            is_eager=True,
        ),
    ] = None,
    verbose: Annotated[
        bool,
        typer.Option("--verbose", "-V", help="Enable verbose output."),
    ] = False,
    quiet: Annotated[
        bool,
        typer.Option("--quiet", "-q", help="Suppress output."),
    ] = False,
    config_file: Annotated[
        Optional[str],
        typer.Option("--config", "-c", help="Path to config file."),
    ] = None,
) -> None:
    """My CLI - A production-ready command-line application.

    Use [bold]--help[/bold] with any command for more information.
    """
    ctx.ensure_object(dict)
    ctx.obj["verbose"] = verbose
    ctx.obj["quiet"] = quiet

    # Load settings
    settings = get_settings(config_file)
    ctx.obj["settings"] = settings


if __name__ == "__main__":
    app()
```

### src/my_cli/core/config.py

```python
"""Configuration management with Pydantic Settings."""

from functools import lru_cache
from pathlib import Path
from typing import Any, Optional

import tomli
import tomli_w
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings."""

    model_config = SettingsConfigDict(
        env_prefix="MY_CLI_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # General settings
    theme: str = Field(default="auto", description="Color theme")
    editor: str = Field(default="code", description="Default editor")
    default_template: str = Field(default="default", description="Default template")

    # Feature flags
    telemetry: bool = Field(default=False, description="Enable telemetry")
    auto_update: bool = Field(default=True, description="Check for updates")

    # Paths
    templates_dir: Optional[Path] = Field(default=None, description="Custom templates directory")
    plugins_dir: Optional[Path] = Field(default=None, description="Plugins directory")

    @classmethod
    def config_path(cls) -> Path:
        """Get the default config file path."""
        return Path.home() / ".config" / "my-cli" / "config.toml"

    @classmethod
    def from_file(cls, path: Optional[Path] = None) -> "Settings":
        """Load settings from a TOML file."""
        config_path = path or cls.config_path()

        if config_path.exists():
            with open(config_path, "rb") as f:
                data = tomli.load(f)
            return cls(**data)

        return cls()

    def save(self, path: Optional[Path] = None) -> None:
        """Save settings to a TOML file."""
        config_path = path or self.config_path()
        config_path.parent.mkdir(parents=True, exist_ok=True)

        data = self.model_dump(exclude_none=True)

        # Convert Path objects to strings for TOML
        for key, value in data.items():
            if isinstance(value, Path):
                data[key] = str(value)

        with open(config_path, "wb") as f:
            tomli_w.dump(data, f)

    def get(self, key: str, default: Any = None) -> Any:
        """Get a setting value by key."""
        return getattr(self, key, default)

    def set(self, key: str, value: Any) -> None:
        """Set a setting value."""
        if hasattr(self, key):
            setattr(self, key, value)


@lru_cache
def get_settings(config_file: Optional[str] = None) -> Settings:
    """Get cached settings instance."""
    path = Path(config_file) if config_file else None
    return Settings.from_file(path)
```

### src/my_cli/core/console.py

```python
"""Rich console utilities."""

from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TaskProgressColumn
from rich.table import Table
from rich.panel import Panel
from rich.theme import Theme
from contextlib import contextmanager
from typing import Generator

# Custom theme
custom_theme = Theme({
    "info": "cyan",
    "warning": "yellow",
    "error": "bold red",
    "success": "bold green",
    "highlight": "bold magenta",
})

console = Console(theme=custom_theme)
error_console = Console(stderr=True, theme=custom_theme)


def print_success(message: str) -> None:
    """Print a success message."""
    console.print(f"[success]✔[/success] {message}")


def print_error(message: str) -> None:
    """Print an error message."""
    error_console.print(f"[error]✖[/error] {message}")


def print_warning(message: str) -> None:
    """Print a warning message."""
    console.print(f"[warning]⚠[/warning] {message}")


def print_info(message: str) -> None:
    """Print an info message."""
    console.print(f"[info]ℹ[/info] {message}")


@contextmanager
def spinner(message: str) -> Generator[Progress, None, None]:
    """Context manager for a spinner."""
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        transient=True,
        console=console,
    ) as progress:
        progress.add_task(description=message, total=None)
        yield progress


@contextmanager
def progress_bar(total: int, description: str = "Processing") -> Generator[Progress, None, None]:
    """Context manager for a progress bar."""
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        BarColumn(),
        TaskProgressColumn(),
        console=console,
    ) as progress:
        task = progress.add_task(description, total=total)
        yield progress, task


def create_table(title: str, columns: list[str]) -> Table:
    """Create a styled table."""
    table = Table(title=title, show_header=True, header_style="bold cyan")
    for col in columns:
        table.add_column(col)
    return table


def print_panel(content: str, title: str = "", border_style: str = "cyan") -> None:
    """Print content in a panel."""
    console.print(Panel(content, title=title, border_style=border_style))
```

### src/my_cli/core/exceptions.py

```python
"""Custom exceptions."""

from typing import Optional


class CLIError(Exception):
    """Base exception for CLI errors."""

    def __init__(self, message: str, hint: Optional[str] = None):
        self.message = message
        self.hint = hint
        super().__init__(message)


class ConfigError(CLIError):
    """Configuration error."""
    pass


class TemplateError(CLIError):
    """Template processing error."""
    pass


class ValidationError(CLIError):
    """Input validation error."""
    pass


class ProjectExistsError(CLIError):
    """Project already exists."""
    pass


class PluginError(CLIError):
    """Plugin loading error."""
    pass
```

### src/my_cli/commands/init.py

```python
"""Init command - create new projects."""

import asyncio
from pathlib import Path
from typing import Annotated, Optional
from enum import Enum

import typer
from rich.prompt import Prompt, Confirm

from my_cli.core.console import console, print_success, print_error, print_warning, spinner
from my_cli.core.exceptions import ProjectExistsError
from my_cli.utils.fs import create_directory, write_file
from my_cli.utils.template import TemplateEngine


class Template(str, Enum):
    """Available templates."""
    DEFAULT = "default"
    API = "api"
    LIBRARY = "library"
    FULLSTACK = "fullstack"


class PackageManager(str, Enum):
    """Package managers."""
    UV = "uv"
    PIP = "pip"
    POETRY = "poetry"
    PDM = "pdm"


app = typer.Typer(help="Initialize a new project.")


@app.callback(invoke_without_command=True)
def init(
    ctx: typer.Context,
    name: Annotated[
        Optional[str],
        typer.Argument(help="Project name"),
    ] = None,
    path: Annotated[
        Optional[Path],
        typer.Option("--path", "-p", help="Project path"),
    ] = None,
    template: Annotated[
        Template,
        typer.Option("--template", "-t", help="Template to use"),
    ] = Template.DEFAULT,
    package_manager: Annotated[
        PackageManager,
        typer.Option("--package-manager", "--pm", help="Package manager"),
    ] = PackageManager.UV,
    no_git: Annotated[
        bool,
        typer.Option("--no-git", help="Skip git initialization"),
    ] = False,
    no_install: Annotated[
        bool,
        typer.Option("--no-install", help="Skip dependency installation"),
    ] = False,
    force: Annotated[
        bool,
        typer.Option("--force", "-f", help="Overwrite existing directory"),
    ] = False,
) -> None:
    """Initialize a new project with the specified template."""
    # Interactive mode if name not provided
    if name is None:
        name = Prompt.ask("Project name", default="my-project")

        template_choice = Prompt.ask(
            "Template",
            choices=[t.value for t in Template],
            default=Template.DEFAULT.value,
        )
        template = Template(template_choice)

        pm_choice = Prompt.ask(
            "Package manager",
            choices=[pm.value for pm in PackageManager],
            default=PackageManager.UV.value,
        )
        package_manager = PackageManager(pm_choice)

        no_git = not Confirm.ask("Initialize git repository?", default=True)
        no_install = not Confirm.ask("Install dependencies?", default=True)

    project_path = path or Path.cwd() / name

    # Check if directory exists
    if project_path.exists():
        if not force:
            if not Confirm.ask(
                f"[warning]Directory {project_path} already exists. Overwrite?[/warning]",
                default=False,
            ):
                print_warning("Operation cancelled")
                raise typer.Exit()

        import shutil
        shutil.rmtree(project_path)

    # Run async initialization
    asyncio.run(
        create_project(
            name=name,
            path=project_path,
            template=template,
            package_manager=package_manager,
            init_git=not no_git,
            install_deps=not no_install,
        )
    )


async def create_project(
    name: str,
    path: Path,
    template: Template,
    package_manager: PackageManager,
    init_git: bool,
    install_deps: bool,
) -> None:
    """Create the project structure."""
    import subprocess

    with spinner("Creating project structure..."):
        # Create directories
        await create_directory(path / "src" / name.replace("-", "_"))
        await create_directory(path / "tests")

        # Generate files from template
        engine = TemplateEngine()
        await engine.generate(
            template=template.value,
            output_dir=path,
            context={
                "project_name": name,
                "package_name": name.replace("-", "_"),
                "version": "0.1.0",
            },
        )

    print_success("Created project structure")

    # Initialize git
    if init_git:
        with spinner("Initializing git repository..."):
            try:
                subprocess.run(["git", "init"], cwd=path, capture_output=True, check=True)
                subprocess.run(["git", "add", "."], cwd=path, capture_output=True, check=True)
                subprocess.run(
                    ["git", "commit", "-m", "Initial commit"],
                    cwd=path,
                    capture_output=True,
                    check=True,
                )
                print_success("Initialized git repository")
            except subprocess.CalledProcessError:
                print_warning("Failed to initialize git repository")

    # Install dependencies
    if install_deps:
        with spinner("Installing dependencies..."):
            try:
                if package_manager == PackageManager.UV:
                    subprocess.run(["uv", "sync"], cwd=path, capture_output=True, check=True)
                elif package_manager == PackageManager.POETRY:
                    subprocess.run(["poetry", "install"], cwd=path, capture_output=True, check=True)
                elif package_manager == PackageManager.PDM:
                    subprocess.run(["pdm", "install"], cwd=path, capture_output=True, check=True)
                else:
                    subprocess.run(["pip", "install", "-e", "."], cwd=path, capture_output=True, check=True)
                print_success("Installed dependencies")
            except subprocess.CalledProcessError:
                print_warning("Failed to install dependencies")

    # Print success message
    console.print()
    console.print(f"[success]✨ Project {name} created successfully![/success]")
    console.print()
    console.print("[bold]Next steps:[/bold]")
    console.print(f"  cd {name}")

    if not install_deps:
        install_cmd = {
            PackageManager.UV: "uv sync",
            PackageManager.POETRY: "poetry install",
            PackageManager.PDM: "pdm install",
            PackageManager.PIP: "pip install -e .",
        }[package_manager]
        console.print(f"  {install_cmd}")

    run_cmd = {
        PackageManager.UV: "uv run python -m",
        PackageManager.POETRY: "poetry run python -m",
        PackageManager.PDM: "pdm run python -m",
        PackageManager.PIP: "python -m",
    }[package_manager]
    console.print(f"  {run_cmd} {name.replace('-', '_')} --help")
```

### src/my_cli/commands/config.py

```python
"""Config command - manage configuration."""

from pathlib import Path
from typing import Annotated, Optional

import typer
from rich.prompt import Confirm

from my_cli.core.config import Settings, get_settings
from my_cli.core.console import console, print_success, print_warning, create_table


app = typer.Typer(help="Manage CLI configuration.")


@app.command("get")
def config_get(
    ctx: typer.Context,
    key: Annotated[
        Optional[str],
        typer.Argument(help="Configuration key"),
    ] = None,
    all_: Annotated[
        bool,
        typer.Option("--all", "-a", help="Show all configuration"),
    ] = False,
) -> None:
    """Get configuration value(s)."""
    settings: Settings = ctx.obj.get("settings", get_settings())

    if all_ or key is None:
        table = create_table("Configuration", ["Key", "Value"])

        for field_name, field_info in settings.model_fields.items():
            value = getattr(settings, field_name)
            table.add_row(field_name, str(value) if value is not None else "[dim]not set[/dim]")

        console.print(table)
    else:
        value = settings.get(key)
        if value is not None:
            console.print(value)
        else:
            print_warning(f"Configuration key '{key}' not found")


@app.command("set")
def config_set(
    ctx: typer.Context,
    key: Annotated[str, typer.Argument(help="Configuration key")],
    value: Annotated[str, typer.Argument(help="Configuration value")],
) -> None:
    """Set configuration value."""
    settings: Settings = ctx.obj.get("settings", get_settings())

    # Parse value
    parsed_value: any
    if value.lower() == "true":
        parsed_value = True
    elif value.lower() == "false":
        parsed_value = False
    elif value.isdigit():
        parsed_value = int(value)
    else:
        parsed_value = value

    settings.set(key, parsed_value)
    settings.save()

    print_success(f"Set {key} = {parsed_value}")


@app.command("delete")
def config_delete(
    ctx: typer.Context,
    key: Annotated[str, typer.Argument(help="Configuration key")],
) -> None:
    """Delete configuration value (reset to default)."""
    settings: Settings = ctx.obj.get("settings", get_settings())
    default_settings = Settings()

    default_value = getattr(default_settings, key, None)
    settings.set(key, default_value)
    settings.save()

    print_success(f"Reset {key} to default")


@app.command("reset")
def config_reset(
    force: Annotated[
        bool,
        typer.Option("--force", "-f", help="Skip confirmation"),
    ] = False,
) -> None:
    """Reset all configuration to defaults."""
    if not force:
        if not Confirm.ask("Reset all configuration to defaults?", default=False):
            print_warning("Operation cancelled")
            raise typer.Exit()

    settings = Settings()
    settings.save()

    print_success("Configuration reset to defaults")


@app.command("path")
def config_path() -> None:
    """Show configuration file path."""
    console.print(Settings.config_path())


@app.command("edit")
def config_edit(ctx: typer.Context) -> None:
    """Open configuration file in editor."""
    import subprocess
    import os

    settings: Settings = ctx.obj.get("settings", get_settings())
    config_path = Settings.config_path()

    # Ensure config file exists
    if not config_path.exists():
        settings.save()

    editor = settings.editor or os.environ.get("EDITOR", "vim")
    subprocess.run([editor, str(config_path)])
```

### src/my_cli/commands/generate.py

```python
"""Generate command - code generation."""

import asyncio
from pathlib import Path
from typing import Annotated, Optional
from enum import Enum

import typer
from rich.prompt import Prompt

from my_cli.core.console import console, print_success, spinner
from my_cli.utils.fs import write_file


class GeneratorType(str, Enum):
    """Generator types."""
    COMPONENT = "component"
    MODEL = "model"
    SERVICE = "service"
    HOOK = "hook"
    TEST = "test"


app = typer.Typer(help="Generate code from templates.")


@app.callback(invoke_without_command=True)
def generate(
    ctx: typer.Context,
    type_: Annotated[
        GeneratorType,
        typer.Argument(help="Type to generate"),
    ],
    name: Annotated[
        Optional[str],
        typer.Option("--name", "-n", help="Name of generated item"),
    ] = None,
    output: Annotated[
        Path,
        typer.Option("--output", "-o", help="Output directory"),
    ] = Path("."),
    dry_run: Annotated[
        bool,
        typer.Option("--dry-run", help="Show what would be generated"),
    ] = False,
) -> None:
    """Generate code from templates."""
    # Get name if not provided
    if name is None:
        name = Prompt.ask(f"{type_.value.title()} name")

    if dry_run:
        console.print("\n[bold]Dry Run - Would generate:[/bold]")
        console.print(f"  Type: {type_.value}")
        console.print(f"  Name: {name}")
        console.print(f"  Output: {output}")
        return

    # Generate based on type
    generators = {
        GeneratorType.COMPONENT: generate_component,
        GeneratorType.MODEL: generate_model,
        GeneratorType.SERVICE: generate_service,
        GeneratorType.HOOK: generate_hook,
        GeneratorType.TEST: generate_test,
    }

    generator = generators[type_]
    asyncio.run(generator(name, output))


async def generate_component(name: str, output: Path) -> None:
    """Generate a React component."""
    content = f'''import React from 'react';

interface {name}Props {{
  children?: React.ReactNode;
}}

export const {name}: React.FC<{name}Props> = ({{ children }}) => {{
  return (
    <div className="{to_kebab_case(name)}">
      {{children}}
    </div>
  );
}};

export default {name};
'''

    file_path = output / f"{name}.tsx"
    await write_file(file_path, content)
    print_success(f"Generated component: {file_path}")


async def generate_model(name: str, output: Path) -> None:
    """Generate a Pydantic model."""
    content = f'''from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class {name}Base(BaseModel):
    """Base {name} schema."""
    pass


class {name}Create({name}Base):
    """Schema for creating a {name}."""
    pass


class {name}Update({name}Base):
    """Schema for updating a {name}."""
    pass


class {name}({name}Base):
    """Full {name} schema."""
    id: str = Field(..., description="Unique identifier")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True
'''

    file_path = output / f"{to_snake_case(name)}.py"
    await write_file(file_path, content)
    print_success(f"Generated model: {file_path}")


async def generate_service(name: str, output: Path) -> None:
    """Generate a service class."""
    content = f'''from typing import Optional, List
from .models import {name}, {name}Create, {name}Update


class {name}Service:
    """Service for {name} operations."""

    async def get_all(self) -> List[{name}]:
        """Get all {to_snake_case(name)}s."""
        raise NotImplementedError

    async def get_by_id(self, id: str) -> Optional[{name}]:
        """Get a {to_snake_case(name)} by ID."""
        raise NotImplementedError

    async def create(self, data: {name}Create) -> {name}:
        """Create a new {to_snake_case(name)}."""
        raise NotImplementedError

    async def update(self, id: str, data: {name}Update) -> Optional[{name}]:
        """Update a {to_snake_case(name)}."""
        raise NotImplementedError

    async def delete(self, id: str) -> bool:
        """Delete a {to_snake_case(name)}."""
        raise NotImplementedError


{to_snake_case(name)}_service = {name}Service()
'''

    file_path = output / f"{to_snake_case(name)}_service.py"
    await write_file(file_path, content)
    print_success(f"Generated service: {file_path}")


async def generate_hook(name: str, output: Path) -> None:
    """Generate a React hook."""
    hook_name = name if name.startswith("use") else f"use{name}"

    content = f'''import {{ useState, useCallback }} from 'react';

interface {hook_name}State {{
  data: unknown | null;
  loading: boolean;
  error: Error | null;
}}

export function {hook_name}() {{
  const [state, setState] = useState<{hook_name}State>({{
    data: null,
    loading: false,
    error: null,
  }});

  const execute = useCallback(async () => {{
    setState(prev => ({{ ...prev, loading: true, error: null }}));
    try {{
      // Implementation
      const data = null;
      setState({{ data, loading: false, error: null }});
    }} catch (error) {{
      setState(prev => ({{ ...prev, loading: false, error: error as Error }}));
    }}
  }}, []);

  return {{ ...state, execute }};
}}
'''

    file_path = output / f"{hook_name}.ts"
    await write_file(file_path, content)
    print_success(f"Generated hook: {file_path}")


async def generate_test(name: str, output: Path) -> None:
    """Generate a pytest test file."""
    content = f'''import pytest
from {to_snake_case(name)} import {name}


class Test{name}:
    """Tests for {name}."""

    def test_create(self):
        """Test creating a {name}."""
        instance = {name}()
        assert instance is not None

    def test_str(self):
        """Test string representation."""
        instance = {name}()
        assert str(instance)

    @pytest.mark.asyncio
    async def test_async_operation(self):
        """Test async operations."""
        # Implementation
        pass
'''

    file_path = output / f"test_{to_snake_case(name)}.py"
    await write_file(file_path, content)
    print_success(f"Generated test: {file_path}")


def to_snake_case(name: str) -> str:
    """Convert PascalCase to snake_case."""
    import re
    return re.sub(r'(?<!^)(?=[A-Z])', '_', name).lower()


def to_kebab_case(name: str) -> str:
    """Convert PascalCase to kebab-case."""
    return to_snake_case(name).replace('_', '-')
```

### src/my_cli/utils/fs.py

```python
"""File system utilities."""

import aiofiles
from pathlib import Path
from typing import Optional


async def create_directory(path: Path, exist_ok: bool = True) -> None:
    """Create a directory asynchronously."""
    path.mkdir(parents=True, exist_ok=exist_ok)


async def write_file(path: Path, content: str) -> None:
    """Write content to a file asynchronously."""
    path.parent.mkdir(parents=True, exist_ok=True)
    async with aiofiles.open(path, "w") as f:
        await f.write(content)


async def read_file(path: Path) -> str:
    """Read content from a file asynchronously."""
    async with aiofiles.open(path, "r") as f:
        return await f.read()


async def file_exists(path: Path) -> bool:
    """Check if a file exists."""
    return path.exists()


async def copy_file(src: Path, dst: Path) -> None:
    """Copy a file asynchronously."""
    content = await read_file(src)
    await write_file(dst, content)


async def remove_file(path: Path) -> None:
    """Remove a file."""
    if path.exists():
        path.unlink()


async def remove_directory(path: Path) -> None:
    """Remove a directory recursively."""
    import shutil
    if path.exists():
        shutil.rmtree(path)
```

### src/my_cli/utils/template.py

```python
"""Template engine for code generation."""

from pathlib import Path
from typing import Any, Dict

from jinja2 import Environment, FileSystemLoader, select_autoescape

from my_cli.utils.fs import write_file, create_directory


class TemplateEngine:
    """Jinja2-based template engine."""

    def __init__(self, templates_dir: Path | None = None):
        self.templates_dir = templates_dir or Path(__file__).parent.parent.parent.parent / "templates"
        self.env = Environment(
            loader=FileSystemLoader(self.templates_dir),
            autoescape=select_autoescape(["html", "xml"]),
            trim_blocks=True,
            lstrip_blocks=True,
        )

        # Register custom filters
        self.env.filters["snake_case"] = self._to_snake_case
        self.env.filters["kebab_case"] = self._to_kebab_case
        self.env.filters["pascal_case"] = self._to_pascal_case
        self.env.filters["camel_case"] = self._to_camel_case

    async def generate(
        self,
        template: str,
        output_dir: Path,
        context: Dict[str, Any],
    ) -> list[Path]:
        """Generate files from a template directory."""
        template_dir = self.templates_dir / template
        created_files: list[Path] = []

        if not template_dir.exists():
            # Use inline templates
            return await self._generate_inline(template, output_dir, context)

        for template_file in template_dir.rglob("*.jinja"):
            relative_path = template_file.relative_to(template_dir)
            output_path = output_dir / str(relative_path).replace(".jinja", "")

            # Render filename
            output_path = Path(self._render_string(str(output_path), context))

            # Render content
            jinja_template = self.env.get_template(f"{template}/{relative_path}")
            content = jinja_template.render(**context)

            await create_directory(output_path.parent)
            await write_file(output_path, content)
            created_files.append(output_path)

        return created_files

    async def _generate_inline(
        self,
        template: str,
        output_dir: Path,
        context: Dict[str, Any],
    ) -> list[Path]:
        """Generate from inline templates."""
        templates = self._get_inline_templates(template, context)
        created_files: list[Path] = []

        for filename, content in templates.items():
            output_path = output_dir / filename
            await create_directory(output_path.parent)
            await write_file(output_path, content)
            created_files.append(output_path)

        return created_files

    def _get_inline_templates(
        self,
        template: str,
        context: Dict[str, Any],
    ) -> Dict[str, str]:
        """Get inline template content."""
        name = context.get("project_name", "my-project")
        pkg_name = context.get("package_name", name.replace("-", "_"))

        templates = {
            "default": {
                "pyproject.toml": f'''[project]
name = "{name}"
version = "{context.get("version", "0.1.0")}"
description = ""
requires-python = ">=3.11"
dependencies = []

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"
''',
                f"src/{pkg_name}/__init__.py": f'"""{ name } package."""\n',
                f"src/{pkg_name}/__main__.py": f'''"""Main entry point."""

def main():
    print("Hello from {name}!")

if __name__ == "__main__":
    main()
''',
                "tests/__init__.py": "",
            },
        }

        return templates.get(template, templates["default"])

    def _render_string(self, template_str: str, context: Dict[str, Any]) -> str:
        """Render a string template."""
        template = self.env.from_string(template_str)
        return template.render(**context)

    @staticmethod
    def _to_snake_case(value: str) -> str:
        """Convert to snake_case."""
        import re
        return re.sub(r'(?<!^)(?=[A-Z])', '_', value).lower()

    @staticmethod
    def _to_kebab_case(value: str) -> str:
        """Convert to kebab-case."""
        return TemplateEngine._to_snake_case(value).replace('_', '-')

    @staticmethod
    def _to_pascal_case(value: str) -> str:
        """Convert to PascalCase."""
        return ''.join(word.title() for word in value.replace('-', '_').split('_'))

    @staticmethod
    def _to_camel_case(value: str) -> str:
        """Convert to camelCase."""
        pascal = TemplateEngine._to_pascal_case(value)
        return pascal[0].lower() + pascal[1:] if pascal else ""
```

## Testing

### tests/conftest.py

```python
"""Pytest fixtures."""

import pytest
from pathlib import Path
from typer.testing import CliRunner

from my_cli.main import app
from my_cli.core.config import Settings


@pytest.fixture
def runner():
    """CLI test runner."""
    return CliRunner()


@pytest.fixture
def temp_dir(tmp_path):
    """Temporary directory for tests."""
    return tmp_path


@pytest.fixture
def mock_settings():
    """Mock settings instance."""
    return Settings()
```

### tests/test_init.py

```python
"""Tests for init command."""

import pytest
from pathlib import Path

from my_cli.main import app


def test_init_help(runner):
    """Test init command help."""
    result = runner.invoke(app, ["init", "--help"])
    assert result.exit_code == 0
    assert "Initialize a new project" in result.stdout


def test_init_creates_project(runner, temp_dir):
    """Test project creation."""
    result = runner.invoke(
        app,
        ["init", "test-project", "--path", str(temp_dir / "test-project"), "--no-git", "--no-install"],
    )
    assert result.exit_code == 0
    assert (temp_dir / "test-project").exists()


def test_init_with_template(runner, temp_dir):
    """Test project creation with template."""
    result = runner.invoke(
        app,
        ["init", "test-project", "--path", str(temp_dir / "test-project"), "--template", "api", "--no-git", "--no-install"],
    )
    assert result.exit_code == 0
```

### tests/test_config.py

```python
"""Tests for config command."""

import pytest

from my_cli.main import app
from my_cli.core.config import Settings


def test_config_get_all(runner):
    """Test getting all config."""
    result = runner.invoke(app, ["config", "get", "--all"])
    assert result.exit_code == 0


def test_config_set_and_get(runner, temp_dir, monkeypatch):
    """Test setting and getting config."""
    # Use temp config path
    monkeypatch.setattr(Settings, "config_path", lambda: temp_dir / "config.toml")

    # Set value
    result = runner.invoke(app, ["config", "set", "theme", "dark"])
    assert result.exit_code == 0

    # Get value
    result = runner.invoke(app, ["config", "get", "theme"])
    assert result.exit_code == 0


def test_config_path(runner):
    """Test config path command."""
    result = runner.invoke(app, ["config", "path"])
    assert result.exit_code == 0
    assert "config.toml" in result.stdout
```

## CLAUDE.md Integration

```markdown
# Python CLI Project

## Commands
- `python -m my_cli --help` - Show help
- `uv run python -m my_cli` - Run with uv
- `pytest` - Run tests
- `ruff check .` - Run linter

## Architecture
- Typer for CLI framework
- Pydantic for configuration
- Rich for terminal output
- Async with aiofiles

## Adding Commands
1. Create file in src/my_cli/commands/
2. Create Typer app
3. Add to main.py with add_typer()

## Configuration
- File: ~/.config/my-cli/config.toml
- Environment: MY_CLI_* prefix
- Local: .env file

## Testing
Run `pytest` or `pytest -v --cov`
```

## AI Suggestions

1. **Auto-completion** - Ship shell completions using typer's completion feature
2. **Plugin System** - Implement entry points-based plugin discovery for extensibility
3. **Progress Tracking** - Add rich progress bars for long-running operations
4. **Config Profiles** - Support multiple config profiles with --profile flag
5. **JSON Output** - Add --json flag for machine-readable output in CI
6. **Self-Update** - Implement self-update using pip or pipx
7. **Telemetry** - Add opt-in anonymous usage telemetry
8. **Aliases** - Support user-defined command aliases
9. **Interactive Mode** - Add REPL mode with prompt_toolkit
10. **Error Reporting** - Integrate Sentry for automatic error tracking
