# Python CLI with Click

## Overview

Production-ready Python command-line interface using Click with comprehensive plugin architecture, configuration management, lazy loading, command groups, context passing, callback decorators, and testing infrastructure with pytest-click. Features colored output, progress bars, and shell completion.

## Quick Start

```bash
# Create project with uv (recommended)
uv init my-cli
cd my-cli

# Or with traditional setup
mkdir my-cli && cd my-cli
python -m venv .venv
source .venv/bin/activate

# Install dependencies
uv add click colorama python-dotenv pyyaml click-plugins \
    click-completion tqdm requests

# Or with pip
pip install click colorama python-dotenv pyyaml click-plugins \
    click-completion tqdm requests

# Install dev dependencies
uv add --dev pytest pytest-click pytest-cov ruff mypy

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
│       ├── cli.py               # CLI app
│       ├── commands/
│       │   ├── __init__.py      # Command exports
│       │   ├── init.py          # Init command
│       │   ├── config.py        # Config command
│       │   └── generate.py      # Generate command
│       ├── core/
│       │   ├── __init__.py
│       │   ├── config.py        # Configuration
│       │   ├── context.py       # CLI context
│       │   └── output.py        # Output utilities
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
│   ├── test_cli.py
│   ├── test_init.py
│   └── test_config.py
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
requires-python = ">=3.10"
classifiers = [
    "Development Status :: 5 - Production/Stable",
    "Environment :: Console",
    "Intended Audience :: Developers",
    "License :: OSI Approved :: MIT License",
    "Programming Language :: Python :: 3.10",
    "Programming Language :: Python :: 3.11",
    "Programming Language :: Python :: 3.12",
]
dependencies = [
    "click>=8.1.0",
    "colorama>=0.4.6",
    "python-dotenv>=1.0.0",
    "pyyaml>=6.0.0",
    "click-plugins>=1.1.1",
    "tqdm>=4.66.0",
    "jinja2>=3.1.0",
    "requests>=2.31.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0.0",
    "pytest-click>=1.1.0",
    "pytest-cov>=4.1.0",
    "ruff>=0.3.0",
    "mypy>=1.8.0",
    "types-PyYAML>=6.0.0",
    "types-requests>=2.31.0",
]

[project.scripts]
my-cli = "my_cli.cli:cli"

[project.entry-points."my_cli.plugins"]
example = "my_cli.plugins.example:register"

[project.urls]
Homepage = "https://github.com/yourname/my-cli"
Repository = "https://github.com/yourname/my-cli"

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["src/my_cli"]

[tool.ruff]
line-length = 100
target-version = "py310"

[tool.ruff.lint]
select = ["E", "F", "I", "N", "W", "B", "C4", "UP"]
ignore = ["E501"]

[tool.mypy]
python_version = "3.10"
strict = true

[tool.pytest.ini_options]
testpaths = ["tests"]
addopts = "-v --cov=my_cli --cov-report=term-missing"

[tool.coverage.run]
source = ["src/my_cli"]
branch = true
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

from my_cli.cli import cli

if __name__ == "__main__":
    cli()
```

### src/my_cli/cli.py

```python
"""Main CLI application using Click."""

import os
import sys
from typing import Optional

import click
from click_plugins import with_plugins
from importlib.metadata import entry_points

from my_cli import __version__
from my_cli.core.config import Config
from my_cli.core.context import Context, pass_context
from my_cli.core.output import echo_success, echo_error, echo_warning, echo_info


class MyCLI(click.MultiCommand):
    """Custom multi-command that supports lazy loading."""

    COMMANDS = {
        "init": "my_cli.commands.init",
        "config": "my_cli.commands.config",
        "generate": "my_cli.commands.generate",
    }

    def list_commands(self, ctx: click.Context) -> list[str]:
        """List available commands."""
        return sorted(self.COMMANDS.keys())

    def get_command(self, ctx: click.Context, cmd_name: str) -> Optional[click.Command]:
        """Lazy load commands."""
        if cmd_name not in self.COMMANDS:
            return None

        module_path = self.COMMANDS[cmd_name]
        try:
            module = __import__(module_path, fromlist=["cli"])
            return getattr(module, "cli")
        except (ImportError, AttributeError) as e:
            echo_error(f"Failed to load command '{cmd_name}': {e}")
            return None


def get_version(ctx: click.Context, param: click.Parameter, value: bool) -> None:
    """Print version and exit."""
    if not value or ctx.resilient_parsing:
        return
    click.echo(f"my-cli version {__version__}")
    ctx.exit()


@with_plugins(entry_points(group="my_cli.plugins"))
@click.command(cls=MyCLI)
@click.option(
    "--version", "-v",
    is_flag=True,
    callback=get_version,
    expose_value=False,
    is_eager=True,
    help="Show version and exit.",
)
@click.option(
    "--config", "-c",
    type=click.Path(exists=True),
    envvar="MY_CLI_CONFIG",
    help="Path to config file.",
)
@click.option(
    "--verbose", "-V",
    is_flag=True,
    envvar="MY_CLI_VERBOSE",
    help="Enable verbose output.",
)
@click.option(
    "--quiet", "-q",
    is_flag=True,
    help="Suppress output.",
)
@click.option(
    "--no-color",
    is_flag=True,
    envvar="NO_COLOR",
    help="Disable colored output.",
)
@click.pass_context
def cli(
    ctx: click.Context,
    config: Optional[str],
    verbose: bool,
    quiet: bool,
    no_color: bool,
) -> None:
    """My CLI - A production-ready command-line application.

    Use --help with any command for more information.

    \b
    Examples:
        my-cli init my-project
        my-cli config get theme
        my-cli generate component --name Button
    """
    # Initialize context
    ctx.ensure_object(dict)

    # Load configuration
    cfg = Config.load(config)

    # Create CLI context
    ctx.obj = Context(
        config=cfg,
        verbose=verbose,
        quiet=quiet,
        no_color=no_color or os.environ.get("NO_COLOR") is not None,
    )


if __name__ == "__main__":
    cli()
```

### src/my_cli/core/context.py

```python
"""CLI context management."""

from dataclasses import dataclass, field
from functools import wraps
from typing import Any, Callable, TypeVar

import click

from my_cli.core.config import Config


@dataclass
class Context:
    """CLI context object passed between commands."""

    config: Config
    verbose: bool = False
    quiet: bool = False
    no_color: bool = False
    _data: dict[str, Any] = field(default_factory=dict)

    def set(self, key: str, value: Any) -> None:
        """Set a context value."""
        self._data[key] = value

    def get(self, key: str, default: Any = None) -> Any:
        """Get a context value."""
        return self._data.get(key, default)

    def log(self, message: str, *args: Any) -> None:
        """Log a message if not quiet."""
        if not self.quiet:
            click.echo(message.format(*args) if args else message)

    def debug(self, message: str, *args: Any) -> None:
        """Log a debug message if verbose."""
        if self.verbose and not self.quiet:
            formatted = message.format(*args) if args else message
            click.secho(f"[DEBUG] {formatted}", fg="magenta", dim=True)


F = TypeVar("F", bound=Callable[..., Any])


def pass_context(f: F) -> F:
    """Decorator to pass Context object to command."""
    @click.pass_context
    @wraps(f)
    def wrapper(ctx: click.Context, *args: Any, **kwargs: Any) -> Any:
        return f(ctx.obj, *args, **kwargs)
    return wrapper  # type: ignore
```

### src/my_cli/core/config.py

```python
"""Configuration management."""

import os
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Any, Optional

import yaml
from dotenv import load_dotenv


@dataclass
class Config:
    """Application configuration."""

    # General settings
    theme: str = "auto"
    editor: str = field(default_factory=lambda: os.environ.get("EDITOR", "vim"))
    default_template: str = "default"

    # Feature flags
    telemetry: bool = False
    auto_update: bool = True

    # Paths
    templates_dir: Optional[str] = None
    plugins_dir: Optional[str] = None

    # Internal
    _config_path: Optional[Path] = field(default=None, repr=False)

    @classmethod
    def config_path(cls) -> Path:
        """Get the default config file path."""
        xdg_config = os.environ.get("XDG_CONFIG_HOME", Path.home() / ".config")
        return Path(xdg_config) / "my-cli" / "config.yaml"

    @classmethod
    def load(cls, path: Optional[str] = None) -> "Config":
        """Load configuration from file and environment."""
        # Load .env file
        load_dotenv()

        # Determine config path
        config_path = Path(path) if path else cls.config_path()

        # Load from file if exists
        data: dict[str, Any] = {}
        if config_path.exists():
            with open(config_path) as f:
                data = yaml.safe_load(f) or {}

        # Override with environment variables
        env_prefix = "MY_CLI_"
        for key in ["theme", "editor", "default_template", "telemetry", "auto_update"]:
            env_key = f"{env_prefix}{key.upper()}"
            if env_key in os.environ:
                value = os.environ[env_key]
                # Parse booleans
                if value.lower() in ("true", "1", "yes"):
                    value = True
                elif value.lower() in ("false", "0", "no"):
                    value = False
                data[key] = value

        config = cls(**{k: v for k, v in data.items() if k in cls.__dataclass_fields__})
        config._config_path = config_path
        return config

    def save(self, path: Optional[Path] = None) -> None:
        """Save configuration to file."""
        config_path = path or self._config_path or self.config_path()
        config_path.parent.mkdir(parents=True, exist_ok=True)

        data = asdict(self)
        # Remove internal fields
        data.pop("_config_path", None)
        # Remove None values
        data = {k: v for k, v in data.items() if v is not None}

        with open(config_path, "w") as f:
            yaml.safe_dump(data, f, default_flow_style=False)

    def get(self, key: str, default: Any = None) -> Any:
        """Get a config value by key."""
        return getattr(self, key, default)

    def set(self, key: str, value: Any) -> None:
        """Set a config value."""
        if hasattr(self, key):
            setattr(self, key, value)


def get_config(ctx: click.Context) -> Config:
    """Get config from Click context."""
    return ctx.obj.config if ctx.obj else Config.load()
```

### src/my_cli/core/output.py

```python
"""Output utilities for consistent CLI output."""

from typing import Any, Optional

import click


def echo(message: str, **kwargs: Any) -> None:
    """Echo a message."""
    click.echo(message, **kwargs)


def echo_success(message: str, prefix: str = "✔") -> None:
    """Print a success message."""
    click.secho(f"{prefix} {message}", fg="green")


def echo_error(message: str, prefix: str = "✖") -> None:
    """Print an error message."""
    click.secho(f"{prefix} {message}", fg="red", err=True)


def echo_warning(message: str, prefix: str = "⚠") -> None:
    """Print a warning message."""
    click.secho(f"{prefix} {message}", fg="yellow")


def echo_info(message: str, prefix: str = "ℹ") -> None:
    """Print an info message."""
    click.secho(f"{prefix} {message}", fg="blue")


def echo_debug(message: str, verbose: bool = False) -> None:
    """Print a debug message if verbose mode is enabled."""
    if verbose:
        click.secho(f"[DEBUG] {message}", fg="magenta", dim=True)


def echo_header(title: str) -> None:
    """Print a header."""
    click.secho(f"\n{title}", bold=True)
    click.secho("─" * len(title), dim=True)


def echo_table(rows: list[tuple[str, str]], header: Optional[tuple[str, str]] = None) -> None:
    """Print a simple two-column table."""
    # Calculate column widths
    max_key = max(len(row[0]) for row in rows)
    max_val = max(len(str(row[1])) for row in rows)

    if header:
        max_key = max(max_key, len(header[0]))
        max_val = max(max_val, len(header[1]))
        click.secho(f"  {header[0]:<{max_key}}  {header[1]:<{max_val}}", bold=True, fg="cyan")
        click.secho(f"  {'─' * max_key}  {'─' * max_val}", dim=True)

    for key, value in rows:
        click.echo(f"  {key:<{max_key}}  {value}")


def confirm(message: str, default: bool = False, abort: bool = False) -> bool:
    """Prompt for confirmation."""
    return click.confirm(message, default=default, abort=abort)


def prompt(
    message: str,
    default: Optional[str] = None,
    type: Optional[click.ParamType] = None,
    hide_input: bool = False,
) -> str:
    """Prompt for input."""
    return click.prompt(message, default=default, type=type, hide_input=hide_input)


def choice(message: str, choices: list[str], default: Optional[str] = None) -> str:
    """Prompt for a choice."""
    choice_type = click.Choice(choices, case_sensitive=False)
    return click.prompt(message, type=choice_type, default=default)


class Spinner:
    """Simple spinner context manager."""

    FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]

    def __init__(self, message: str):
        self.message = message
        self._thread: Optional[Any] = None
        self._stop = False

    def __enter__(self) -> "Spinner":
        import threading
        import time
        import sys

        def spin():
            i = 0
            while not self._stop:
                frame = self.FRAMES[i % len(self.FRAMES)]
                sys.stdout.write(f"\r{frame} {self.message}")
                sys.stdout.flush()
                time.sleep(0.1)
                i += 1

        self._thread = threading.Thread(target=spin)
        self._thread.start()
        return self

    def __exit__(self, *args: Any) -> None:
        import sys

        self._stop = True
        if self._thread:
            self._thread.join()
        sys.stdout.write("\r" + " " * (len(self.message) + 4) + "\r")
        sys.stdout.flush()

    def update(self, message: str) -> None:
        """Update the spinner message."""
        self.message = message
```

### src/my_cli/commands/init.py

```python
"""Init command - create new projects."""

import os
import subprocess
from pathlib import Path
from typing import Optional

import click

from my_cli.core.context import Context, pass_context
from my_cli.core.output import (
    echo_success, echo_error, echo_warning, echo_info,
    confirm, prompt, choice, Spinner
)
from my_cli.utils.fs import create_directory, write_file


@click.command("init")
@click.argument("name", required=False)
@click.option(
    "--path", "-p",
    type=click.Path(),
    help="Project path",
)
@click.option(
    "--template", "-t",
    type=click.Choice(["default", "api", "library", "fullstack"]),
    default="default",
    help="Template to use",
)
@click.option(
    "--package-manager", "--pm",
    type=click.Choice(["pip", "uv", "poetry", "pdm"]),
    default="pip",
    help="Package manager",
)
@click.option("--no-git", is_flag=True, help="Skip git initialization")
@click.option("--no-install", is_flag=True, help="Skip dependency installation")
@click.option("--force", "-f", is_flag=True, help="Overwrite existing directory")
@pass_context
def cli(
    ctx: Context,
    name: Optional[str],
    path: Optional[str],
    template: str,
    package_manager: str,
    no_git: bool,
    no_install: bool,
    force: bool,
) -> None:
    """Initialize a new project.

    \b
    Examples:
        my-cli init my-project
        my-cli init my-project --template api
        my-cli init my-project --pm poetry --no-git
    """
    # Interactive mode if name not provided
    if not name:
        name = prompt("Project name", default="my-project")
        template = choice("Template", ["default", "api", "library", "fullstack"], default=template)
        package_manager = choice("Package manager", ["pip", "uv", "poetry", "pdm"], default=package_manager)
        no_git = not confirm("Initialize git repository?", default=True)
        no_install = not confirm("Install dependencies?", default=True)

    project_path = Path(path) if path else Path.cwd() / name

    # Check if directory exists
    if project_path.exists():
        if not force:
            if not confirm(f"Directory {project_path} exists. Overwrite?", default=False):
                echo_warning("Operation cancelled")
                return

        import shutil
        shutil.rmtree(project_path)

    # Create project
    with Spinner("Creating project structure..."):
        _create_project_structure(project_path, name, template)
    echo_success("Created project structure")

    # Initialize git
    if not no_git:
        with Spinner("Initializing git repository..."):
            try:
                _init_git(project_path)
                echo_success("Initialized git repository")
            except subprocess.CalledProcessError:
                echo_warning("Failed to initialize git repository")

    # Install dependencies
    if not no_install:
        with Spinner("Installing dependencies..."):
            try:
                _install_deps(project_path, package_manager)
                echo_success("Installed dependencies")
            except subprocess.CalledProcessError:
                echo_warning("Failed to install dependencies")

    # Print success message
    click.echo()
    echo_success(f"Project {name} created successfully!")
    click.echo()
    click.secho("Next steps:", bold=True)
    click.echo(f"  cd {name}")

    if no_install:
        install_cmd = {
            "pip": "pip install -e .",
            "uv": "uv sync",
            "poetry": "poetry install",
            "pdm": "pdm install",
        }[package_manager]
        click.echo(f"  {install_cmd}")

    run_cmd = {
        "pip": "python -m",
        "uv": "uv run python -m",
        "poetry": "poetry run python -m",
        "pdm": "pdm run python -m",
    }[package_manager]
    click.echo(f"  {run_cmd} {name.replace('-', '_')} --help")


def _create_project_structure(path: Path, name: str, template: str) -> None:
    """Create project directory structure."""
    pkg_name = name.replace("-", "_")

    # Create directories
    create_directory(path / "src" / pkg_name)
    create_directory(path / "tests")

    # Create pyproject.toml
    pyproject = f'''[project]
name = "{name}"
version = "0.1.0"
description = ""
requires-python = ">=3.10"
dependencies = [
    "click>=8.1.0",
]

[project.scripts]
{name} = "{pkg_name}.cli:cli"

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"
'''
    write_file(path / "pyproject.toml", pyproject)

    # Create __init__.py
    write_file(path / "src" / pkg_name / "__init__.py", f'"""{ name } package."""\n')

    # Create cli.py
    cli_py = f'''"""CLI entry point."""

import click

@click.command()
@click.option("--name", "-n", default="World", help="Name to greet")
def cli(name: str) -> None:
    """{ name } - A CLI application."""
    click.echo(f"Hello, {{name}}!")

if __name__ == "__main__":
    cli()
'''
    write_file(path / "src" / pkg_name / "cli.py", cli_py)

    # Create __main__.py
    write_file(
        path / "src" / pkg_name / "__main__.py",
        f'from {pkg_name}.cli import cli\n\nif __name__ == "__main__":\n    cli()\n'
    )

    # Create tests
    write_file(path / "tests" / "__init__.py", "")

    test_py = f'''"""Tests for CLI."""

from click.testing import CliRunner
from {pkg_name}.cli import cli


def test_cli_help():
    runner = CliRunner()
    result = runner.invoke(cli, ["--help"])
    assert result.exit_code == 0


def test_cli_default():
    runner = CliRunner()
    result = runner.invoke(cli)
    assert result.exit_code == 0
    assert "Hello, World!" in result.output
'''
    write_file(path / "tests" / "test_cli.py", test_py)

    # Create .gitignore
    gitignore = """__pycache__/
*.py[cod]
*$py.class
.env
.venv/
venv/
dist/
build/
*.egg-info/
.pytest_cache/
.coverage
htmlcov/
.mypy_cache/
"""
    write_file(path / ".gitignore", gitignore)


def _init_git(path: Path) -> None:
    """Initialize git repository."""
    subprocess.run(["git", "init"], cwd=path, check=True, capture_output=True)
    subprocess.run(["git", "add", "."], cwd=path, check=True, capture_output=True)
    subprocess.run(
        ["git", "commit", "-m", "Initial commit"],
        cwd=path, check=True, capture_output=True
    )


def _install_deps(path: Path, pm: str) -> None:
    """Install project dependencies."""
    commands = {
        "pip": ["pip", "install", "-e", "."],
        "uv": ["uv", "sync"],
        "poetry": ["poetry", "install"],
        "pdm": ["pdm", "install"],
    }
    subprocess.run(commands[pm], cwd=path, check=True, capture_output=True)
```

### src/my_cli/commands/config.py

```python
"""Config command - manage configuration."""

from pathlib import Path
from typing import Optional

import click

from my_cli.core.context import Context, pass_context
from my_cli.core.output import echo_success, echo_warning, echo_table, confirm


@click.group("config")
def cli() -> None:
    """Manage CLI configuration."""
    pass


@cli.command("get")
@click.argument("key", required=False)
@click.option("--all", "-a", "show_all", is_flag=True, help="Show all configuration")
@pass_context
def config_get(ctx: Context, key: Optional[str], show_all: bool) -> None:
    """Get configuration value(s).

    \b
    Examples:
        my-cli config get theme
        my-cli config get --all
    """
    config = ctx.config

    if show_all or not key:
        rows = [
            ("theme", config.theme),
            ("editor", config.editor),
            ("default_template", config.default_template),
            ("telemetry", str(config.telemetry)),
            ("auto_update", str(config.auto_update)),
        ]
        echo_table(rows, header=("Key", "Value"))
    else:
        value = config.get(key)
        if value is not None:
            click.echo(value)
        else:
            echo_warning(f"Configuration key '{key}' not found")


@cli.command("set")
@click.argument("key")
@click.argument("value")
@pass_context
def config_set(ctx: Context, key: str, value: str) -> None:
    """Set configuration value.

    \b
    Examples:
        my-cli config set theme dark
        my-cli config set telemetry false
    """
    config = ctx.config

    # Parse value
    parsed_value: any
    if value.lower() in ("true", "1", "yes"):
        parsed_value = True
    elif value.lower() in ("false", "0", "no"):
        parsed_value = False
    elif value.isdigit():
        parsed_value = int(value)
    else:
        parsed_value = value

    config.set(key, parsed_value)
    config.save()

    echo_success(f"Set {key} = {parsed_value}")


@cli.command("delete")
@click.argument("key")
@pass_context
def config_delete(ctx: Context, key: str) -> None:
    """Delete configuration value (reset to default)."""
    from my_cli.core.config import Config

    config = ctx.config
    default_config = Config()

    default_value = getattr(default_config, key, None)
    config.set(key, default_value)
    config.save()

    echo_success(f"Reset {key} to default")


@cli.command("reset")
@click.option("--force", "-f", is_flag=True, help="Skip confirmation")
@pass_context
def config_reset(ctx: Context, force: bool) -> None:
    """Reset all configuration to defaults."""
    if not force:
        if not confirm("Reset all configuration to defaults?", default=False):
            echo_warning("Operation cancelled")
            return

    from my_cli.core.config import Config

    config = Config()
    config.save()

    echo_success("Configuration reset to defaults")


@cli.command("path")
def config_path() -> None:
    """Show configuration file path."""
    from my_cli.core.config import Config
    click.echo(Config.config_path())


@cli.command("edit")
@pass_context
def config_edit(ctx: Context) -> None:
    """Open configuration file in editor."""
    import subprocess
    import os

    from my_cli.core.config import Config

    config = ctx.config
    config_path = Config.config_path()

    # Ensure config file exists
    if not config_path.exists():
        config.save()

    editor = config.editor or os.environ.get("EDITOR", "vim")
    subprocess.run([editor, str(config_path)])
```

### src/my_cli/commands/generate.py

```python
"""Generate command - code generation."""

from pathlib import Path
from typing import Optional

import click

from my_cli.core.context import Context, pass_context
from my_cli.core.output import echo_success, echo_info, prompt
from my_cli.utils.fs import write_file, create_directory


@click.group("generate", invoke_without_command=True)
@click.argument("type_", metavar="TYPE", required=False)
@click.option("--name", "-n", help="Name of generated item")
@click.option("--output", "-o", type=click.Path(), default=".", help="Output directory")
@click.option("--dry-run", is_flag=True, help="Show what would be generated")
@click.pass_context
def cli(
    ctx: click.Context,
    type_: Optional[str],
    name: Optional[str],
    output: str,
    dry_run: bool,
) -> None:
    """Generate code from templates.

    \b
    Available types:
        component  - React component
        model      - Pydantic model
        service    - Service class
        command    - CLI command

    \b
    Examples:
        my-cli generate component --name Button
        my-cli generate model --name User
        my-cli g command --name deploy
    """
    if ctx.invoked_subcommand is not None:
        return

    if type_ is None:
        # Show help
        click.echo(ctx.get_help())
        return

    # Get name if not provided
    if not name:
        name = prompt(f"{type_.title()} name")

    if dry_run:
        click.echo("\nDry Run - Would generate:")
        click.echo(f"  Type: {type_}")
        click.echo(f"  Name: {name}")
        click.echo(f"  Output: {output}")
        return

    # Generate based on type
    generators = {
        "component": _generate_component,
        "model": _generate_model,
        "service": _generate_service,
        "command": _generate_command,
    }

    generator = generators.get(type_)
    if generator:
        generator(name, Path(output))
    else:
        click.echo(f"Unknown type: {type_}", err=True)
        raise click.Abort()


@cli.command("component")
@click.option("--name", "-n", required=True, help="Component name")
@click.option("--output", "-o", type=click.Path(), default=".", help="Output directory")
def generate_component_cmd(name: str, output: str) -> None:
    """Generate a React component."""
    _generate_component(name, Path(output))


@cli.command("model")
@click.option("--name", "-n", required=True, help="Model name")
@click.option("--output", "-o", type=click.Path(), default=".", help="Output directory")
def generate_model_cmd(name: str, output: str) -> None:
    """Generate a Pydantic model."""
    _generate_model(name, Path(output))


@cli.command("service")
@click.option("--name", "-n", required=True, help="Service name")
@click.option("--output", "-o", type=click.Path(), default=".", help="Output directory")
def generate_service_cmd(name: str, output: str) -> None:
    """Generate a service class."""
    _generate_service(name, Path(output))


@cli.command("command")
@click.option("--name", "-n", required=True, help="Command name")
@click.option("--output", "-o", type=click.Path(), default=".", help="Output directory")
def generate_command_cmd(name: str, output: str) -> None:
    """Generate a CLI command."""
    _generate_command(name, Path(output))


def _generate_component(name: str, output: Path) -> None:
    """Generate a React component."""
    content = f'''import React from 'react';

interface {name}Props {{
  children?: React.ReactNode;
}}

export const {name}: React.FC<{name}Props> = ({{ children }}) => {{
  return (
    <div className="{_to_kebab_case(name)}">
      {{children}}
    </div>
  );
}};

export default {name};
'''

    file_path = output / f"{name}.tsx"
    create_directory(output)
    write_file(file_path, content)
    echo_success(f"Generated component: {file_path}")


def _generate_model(name: str, output: Path) -> None:
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

    file_path = output / f"{_to_snake_case(name)}.py"
    create_directory(output)
    write_file(file_path, content)
    echo_success(f"Generated model: {file_path}")


def _generate_service(name: str, output: Path) -> None:
    """Generate a service class."""
    content = f'''from typing import List, Optional

from .{_to_snake_case(name)} import {name}, {name}Create, {name}Update


class {name}Service:
    """Service for {name} operations."""

    async def get_all(self) -> List[{name}]:
        """Get all items."""
        raise NotImplementedError

    async def get_by_id(self, id: str) -> Optional[{name}]:
        """Get an item by ID."""
        raise NotImplementedError

    async def create(self, data: {name}Create) -> {name}:
        """Create a new item."""
        raise NotImplementedError

    async def update(self, id: str, data: {name}Update) -> Optional[{name}]:
        """Update an item."""
        raise NotImplementedError

    async def delete(self, id: str) -> bool:
        """Delete an item."""
        raise NotImplementedError


{_to_snake_case(name)}_service = {name}Service()
'''

    file_path = output / f"{_to_snake_case(name)}_service.py"
    create_directory(output)
    write_file(file_path, content)
    echo_success(f"Generated service: {file_path}")


def _generate_command(name: str, output: Path) -> None:
    """Generate a CLI command."""
    content = f'''"""{ name } command."""

import click

from my_cli.core.context import Context, pass_context
from my_cli.core.output import echo_success, echo_info


@click.command("{name}")
@click.option("--verbose", "-v", is_flag=True, help="Verbose output")
@pass_context
def cli(ctx: Context, verbose: bool) -> None:
    """{ name.title() } command.

    Add your command logic here.
    """
    if verbose:
        echo_info("Running in verbose mode")

    # Implementation
    echo_success("Command completed successfully")
'''

    file_path = output / f"{_to_snake_case(name)}.py"
    create_directory(output)
    write_file(file_path, content)
    echo_success(f"Generated command: {file_path}")


def _to_snake_case(name: str) -> str:
    """Convert PascalCase to snake_case."""
    import re
    return re.sub(r'(?<!^)(?=[A-Z])', '_', name).lower()


def _to_kebab_case(name: str) -> str:
    """Convert PascalCase to kebab-case."""
    return _to_snake_case(name).replace('_', '-')
```

### src/my_cli/utils/fs.py

```python
"""File system utilities."""

from pathlib import Path
from typing import Union


def create_directory(path: Union[str, Path], exist_ok: bool = True) -> None:
    """Create a directory."""
    Path(path).mkdir(parents=True, exist_ok=exist_ok)


def write_file(path: Union[str, Path], content: str) -> None:
    """Write content to a file."""
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content)


def read_file(path: Union[str, Path]) -> str:
    """Read content from a file."""
    return Path(path).read_text()


def file_exists(path: Union[str, Path]) -> bool:
    """Check if a file exists."""
    return Path(path).exists()


def copy_file(src: Union[str, Path], dst: Union[str, Path]) -> None:
    """Copy a file."""
    import shutil
    shutil.copy2(src, dst)


def remove_file(path: Union[str, Path]) -> None:
    """Remove a file."""
    path = Path(path)
    if path.exists():
        path.unlink()


def remove_directory(path: Union[str, Path]) -> None:
    """Remove a directory recursively."""
    import shutil
    path = Path(path)
    if path.exists():
        shutil.rmtree(path)
```

### src/my_cli/plugins/loader.py

```python
"""Plugin loader for extensibility."""

from importlib.metadata import entry_points
from typing import Callable, List

import click


def load_plugins(cli: click.Group, group: str = "my_cli.plugins") -> None:
    """Load plugins from entry points."""
    try:
        eps = entry_points(group=group)
    except TypeError:
        # Python < 3.10 compatibility
        eps = entry_points().get(group, [])

    for ep in eps:
        try:
            plugin = ep.load()
            if callable(plugin):
                plugin(cli)
        except Exception as e:
            click.secho(f"Failed to load plugin {ep.name}: {e}", fg="yellow", err=True)


def register_command(cli: click.Group, command: click.Command) -> None:
    """Register a command with the CLI."""
    cli.add_command(command)


def create_plugin(commands: List[click.Command]) -> Callable[[click.Group], None]:
    """Create a plugin registration function."""
    def register(cli: click.Group) -> None:
        for command in commands:
            cli.add_command(command)
    return register
```

## Testing

### tests/conftest.py

```python
"""Pytest fixtures."""

import pytest
from pathlib import Path
from click.testing import CliRunner

from my_cli.cli import cli
from my_cli.core.config import Config
from my_cli.core.context import Context


@pytest.fixture
def runner():
    """CLI test runner."""
    return CliRunner()


@pytest.fixture
def isolated_runner():
    """Isolated CLI test runner."""
    return CliRunner(mix_stderr=False)


@pytest.fixture
def temp_dir(tmp_path):
    """Temporary directory for tests."""
    return tmp_path


@pytest.fixture
def mock_config():
    """Mock config instance."""
    return Config()


@pytest.fixture
def mock_context(mock_config):
    """Mock CLI context."""
    return Context(config=mock_config)
```

### tests/test_cli.py

```python
"""Tests for main CLI."""

import pytest
from click.testing import CliRunner

from my_cli.cli import cli
from my_cli import __version__


def test_cli_help(runner):
    """Test CLI help output."""
    result = runner.invoke(cli, ["--help"])
    assert result.exit_code == 0
    assert "My CLI" in result.output


def test_cli_version(runner):
    """Test version flag."""
    result = runner.invoke(cli, ["--version"])
    assert result.exit_code == 0
    assert __version__ in result.output


def test_cli_no_command(runner):
    """Test CLI with no command."""
    result = runner.invoke(cli)
    assert result.exit_code == 0


def test_cli_unknown_command(runner):
    """Test unknown command."""
    result = runner.invoke(cli, ["unknown"])
    assert result.exit_code != 0
```

### tests/test_init.py

```python
"""Tests for init command."""

import pytest
from pathlib import Path

from my_cli.cli import cli


def test_init_help(runner):
    """Test init command help."""
    result = runner.invoke(cli, ["init", "--help"])
    assert result.exit_code == 0
    assert "Initialize a new project" in result.output


def test_init_creates_project(runner, temp_dir):
    """Test project creation."""
    result = runner.invoke(
        cli,
        ["init", "test-project", "--path", str(temp_dir / "test-project"), "--no-git", "--no-install"],
    )
    assert result.exit_code == 0
    assert (temp_dir / "test-project").exists()
    assert (temp_dir / "test-project" / "pyproject.toml").exists()


def test_init_with_force(runner, temp_dir):
    """Test init with force flag."""
    project_path = temp_dir / "test-project"
    project_path.mkdir()
    (project_path / "existing.txt").write_text("existing")

    result = runner.invoke(
        cli,
        ["init", "test-project", "--path", str(project_path), "--force", "--no-git", "--no-install"],
    )
    assert result.exit_code == 0
    assert not (project_path / "existing.txt").exists()
```

### tests/test_config.py

```python
"""Tests for config command."""

import pytest

from my_cli.cli import cli


def test_config_get_all(runner):
    """Test getting all config."""
    result = runner.invoke(cli, ["config", "get", "--all"])
    assert result.exit_code == 0
    assert "theme" in result.output


def test_config_get_key(runner):
    """Test getting specific config key."""
    result = runner.invoke(cli, ["config", "get", "theme"])
    assert result.exit_code == 0


def test_config_path(runner):
    """Test config path command."""
    result = runner.invoke(cli, ["config", "path"])
    assert result.exit_code == 0
    assert "config.yaml" in result.output
```

## CLAUDE.md Integration

```markdown
# Python CLI Project

## Commands
- `python -m my_cli --help` - Show help
- `my-cli init <name>` - Initialize project
- `my-cli config get --all` - Show config
- `pytest` - Run tests

## Architecture
- Click for CLI framework
- YAML for configuration
- Lazy command loading
- Plugin system via entry points

## Adding Commands
1. Create file in src/my_cli/commands/
2. Define cli using @click.command or @click.group
3. Add to MyCLI.COMMANDS in cli.py

## Configuration
- File: ~/.config/my-cli/config.yaml
- Environment: MY_CLI_* prefix
- Local: .env file

## Plugin Development
Register via entry point:
[project.entry-points."my_cli.plugins"]
name = "module:register"
```

## AI Suggestions

1. **Lazy Loading** - Implement lazy command loading for faster startup
2. **Shell Completions** - Add shell completion support with click-completion
3. **Progress Bars** - Use tqdm for progress bars on long operations
4. **Config Profiles** - Support multiple configuration profiles
5. **Plugin Discovery** - Auto-discover and load plugins from directory
6. **Command Aliases** - Support user-defined command aliases
7. **Output Formats** - Add --json and --yaml output format options
8. **Caching** - Cache expensive operations with diskcache
9. **Async Support** - Add async command support with asyncclick
10. **Error Handling** - Implement custom exception handlers with helpful messages
