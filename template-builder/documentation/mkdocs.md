# MkDocs Documentation Template

## Overview
MkDocs setup with Material theme for Python documentation sites featuring search, versioning, and plugins.

## Quick Start
```bash
pip install mkdocs mkdocs-material mkdocs-awesome-pages-plugin
mkdocs new my-docs
cd my-docs
mkdocs serve
```

## MkDocs Configuration

### mkdocs.yml
```yaml
site_name: My Project
site_url: https://docs.myproject.com
site_author: My Org
site_description: Documentation for My Project

repo_name: my-org/my-project
repo_url: https://github.com/my-org/my-project
edit_uri: edit/main/docs/

copyright: Copyright &copy; 2024 My Org

theme:
  name: material
  custom_dir: overrides
  language: en

  logo: assets/logo.svg
  favicon: assets/favicon.ico

  font:
    text: Inter
    code: JetBrains Mono

  icon:
    repo: fontawesome/brands/github
    edit: material/pencil
    view: material/eye

  palette:
    - media: "(prefers-color-scheme: light)"
      scheme: default
      primary: blue
      accent: blue
      toggle:
        icon: material/brightness-7
        name: Switch to dark mode
    - media: "(prefers-color-scheme: dark)"
      scheme: slate
      primary: blue
      accent: blue
      toggle:
        icon: material/brightness-4
        name: Switch to light mode

  features:
    - navigation.instant
    - navigation.instant.prefetch
    - navigation.tracking
    - navigation.tabs
    - navigation.tabs.sticky
    - navigation.sections
    - navigation.expand
    - navigation.path
    - navigation.indexes
    - navigation.top
    - navigation.footer
    - search.suggest
    - search.highlight
    - search.share
    - header.autohide
    - toc.follow
    - toc.integrate
    - content.code.copy
    - content.code.annotate
    - content.tabs.link
    - content.tooltips
    - announce.dismiss

plugins:
  - search:
      lang: en
      separator: '[\s\-,:!=\[\]()"/]+|(?!\b)(?=[A-Z][a-z])|\.(?!\d)|&[lg]t;'

  - awesome-pages

  - tags:
      tags_file: tags.md

  - git-revision-date-localized:
      enable_creation_date: true
      type: timeago

  - git-authors

  - minify:
      minify_html: true
      minify_js: true
      minify_css: true

  - social:
      cards_layout: default

  - privacy:
      enabled: true

  - offline:
      enabled: true

  - mkdocstrings:
      default_handler: python
      handlers:
        python:
          paths: [src]
          options:
            show_source: true
            show_root_heading: true
            show_root_full_path: false
            show_category_heading: true
            show_symbol_type_heading: true
            show_symbol_type_toc: true
            docstring_style: google
            docstring_section_style: spacy
            merge_init_into_class: true
            show_signature_annotations: true
            separate_signature: true
            signature_crossrefs: true
            filters:
              - "!^_"
              - "^__init__$"

markdown_extensions:
  - abbr
  - admonition
  - attr_list
  - def_list
  - footnotes
  - md_in_html
  - tables
  - toc:
      permalink: true
      permalink_title: Anchor link to this section
      toc_depth: 3

  - pymdownx.arithmatex:
      generic: true

  - pymdownx.betterem:
      smart_enable: all

  - pymdownx.caret
  - pymdownx.mark
  - pymdownx.tilde

  - pymdownx.critic

  - pymdownx.details

  - pymdownx.emoji:
      emoji_index: !!python/name:material.extensions.emoji.twemoji
      emoji_generator: !!python/name:material.extensions.emoji.to_svg

  - pymdownx.highlight:
      anchor_linenums: true
      line_spans: __span
      pygments_lang_class: true

  - pymdownx.inlinehilite

  - pymdownx.keys

  - pymdownx.magiclink:
      normalize_issue_symbols: true
      repo_url_shorthand: true
      user: my-org
      repo: my-project

  - pymdownx.smartsymbols

  - pymdownx.snippets:
      auto_append:
        - includes/abbreviations.md

  - pymdownx.superfences:
      custom_fences:
        - name: mermaid
          class: mermaid
          format: !!python/name:pymdownx.superfences.fence_code_format

  - pymdownx.tabbed:
      alternate_style: true
      combine_header_slug: true
      slugify: !!python/object/apply:pymdownx.slugs.slugify
        kwds:
          case: lower

  - pymdownx.tasklist:
      custom_checkbox: true

extra:
  version:
    provider: mike
    default: latest

  social:
    - icon: fontawesome/brands/github
      link: https://github.com/my-org
      name: GitHub
    - icon: fontawesome/brands/twitter
      link: https://twitter.com/myproject
      name: Twitter
    - icon: fontawesome/brands/discord
      link: https://discord.gg/myproject
      name: Discord

  analytics:
    provider: google
    property: G-XXXXXXXXXX
    feedback:
      title: Was this page helpful?
      ratings:
        - icon: material/emoticon-happy-outline
          name: This page was helpful
          data: 1
          note: Thanks for your feedback!
        - icon: material/emoticon-sad-outline
          name: This page could be improved
          data: 0
          note: Thanks for your feedback! Help us improve by using our feedback form.

  consent:
    title: Cookie consent
    description: >-
      We use cookies to recognize your repeated visits and preferences, as well
      as to measure the effectiveness of our documentation. With your consent,
      you're helping us to make our documentation better.
    actions:
      - accept
      - reject
      - manage

  generator: false

extra_css:
  - stylesheets/extra.css

extra_javascript:
  - javascripts/extra.js
  - https://polyfill.io/v3/polyfill.min.js?features=es6
  - https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js

nav:
  - Home: index.md
  - Getting Started:
    - getting-started/index.md
    - Installation: getting-started/installation.md
    - Quick Start: getting-started/quickstart.md
    - Configuration: getting-started/configuration.md
  - User Guide:
    - guide/index.md
    - Basic Usage: guide/basic-usage.md
    - Advanced Features: guide/advanced.md
    - Best Practices: guide/best-practices.md
  - API Reference:
    - api/index.md
    - Client: api/client.md
    - Models: api/models.md
    - Utilities: api/utilities.md
  - Examples:
    - examples/index.md
    - Basic Examples: examples/basic.md
    - Advanced Examples: examples/advanced.md
  - Changelog: changelog.md
  - Contributing: contributing.md
```

## Custom Theme Overrides

### overrides/main.html
```html
{% extends "base.html" %}

{% block announce %}
  <a href="https://github.com/my-org/my-project/releases">
    📢 Version 2.0 is out! Check out the new features.
  </a>
{% endblock %}

{% block extrahead %}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@myproject" />
  <meta property="og:image" content="{{ config.site_url }}assets/social-card.png" />

  {% if page and page.meta.description %}
    <meta name="description" content="{{ page.meta.description }}" />
    <meta property="og:description" content="{{ page.meta.description }}" />
  {% endif %}
{% endblock %}

{% block content %}
  {% if page.meta.banner %}
    <div class="md-banner">
      <div class="md-banner__inner md-grid">
        {{ page.meta.banner }}
      </div>
    </div>
  {% endif %}

  {{ super() }}

  {% if page and page.meta.feedback != false %}
    <div class="md-feedback">
      <h4>Was this page helpful?</h4>
      <div class="md-feedback__buttons">
        <button class="md-feedback__button" data-value="1">👍 Yes</button>
        <button class="md-feedback__button" data-value="0">👎 No</button>
      </div>
    </div>
  {% endif %}
{% endblock %}

{% block footer %}
  {{ super() }}

  <script>
    document.querySelectorAll('.md-feedback__button').forEach(button => {
      button.addEventListener('click', () => {
        const value = button.dataset.value;
        const page = window.location.pathname;
        // Send feedback to analytics
        if (window.gtag) {
          gtag('event', 'feedback', {
            'event_category': 'documentation',
            'event_label': page,
            'value': parseInt(value)
          });
        }
        // Show thank you message
        button.parentElement.innerHTML = '<span>Thanks for your feedback!</span>';
      });
    });
  </script>
{% endblock %}
```

### Custom CSS
```css
/* docs/stylesheets/extra.css */
:root {
  --md-primary-fg-color: #3b82f6;
  --md-primary-fg-color--light: #60a5fa;
  --md-primary-fg-color--dark: #2563eb;
  --md-accent-fg-color: #8b5cf6;
}

/* Custom admonition types */
.md-typeset .admonition.api,
.md-typeset details.api {
  border-color: #3b82f6;
}

.md-typeset .api > .admonition-title,
.md-typeset .api > summary {
  background-color: rgba(59, 130, 246, 0.1);
}

.md-typeset .api > .admonition-title::before,
.md-typeset .api > summary::before {
  background-color: #3b82f6;
  -webkit-mask-image: var(--md-admonition-icon--api);
  mask-image: var(--md-admonition-icon--api);
}

:root {
  --md-admonition-icon--api: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M7 7H5a2 2 0 0 0-2 2v8h2v-4h2v4h2V9a2 2 0 0 0-2-2m0 4H5V9h2m7-2h-4v10h2v-4h2a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2m0 4h-2V9h2m6 0v6h1v2h-4v-2h1V9h-1V7h4v2Z"/></svg>');
}

/* Banner styles */
.md-banner {
  background-color: var(--md-primary-fg-color);
  color: white;
  padding: 0.5rem 0;
  text-align: center;
}

/* Feedback widget */
.md-feedback {
  margin-top: 2rem;
  padding: 1rem;
  border: 1px solid var(--md-default-fg-color--lightest);
  border-radius: 4px;
  text-align: center;
}

.md-feedback h4 {
  margin: 0 0 1rem;
}

.md-feedback__buttons {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.md-feedback__button {
  padding: 0.5rem 1rem;
  border: 1px solid var(--md-default-fg-color--lightest);
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.md-feedback__button:hover {
  border-color: var(--md-primary-fg-color);
  background-color: rgba(59, 130, 246, 0.1);
}

/* API endpoint styling */
.api-endpoint {
  border: 1px solid var(--md-default-fg-color--lightest);
  border-radius: 4px;
  margin: 1rem 0;
  overflow: hidden;
}

.api-endpoint__header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background-color: var(--md-code-bg-color);
}

.api-endpoint__method {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
}

.api-endpoint__method--get { background: #61affe; color: white; }
.api-endpoint__method--post { background: #49cc90; color: white; }
.api-endpoint__method--put { background: #fca130; color: white; }
.api-endpoint__method--delete { background: #f93e3e; color: white; }

.api-endpoint__path {
  font-family: var(--md-code-font-family);
  font-size: 0.875rem;
}

.api-endpoint__body {
  padding: 1rem;
}

/* Version selector improvements */
.md-version {
  margin-left: 0.5rem;
}

/* Better table responsiveness */
.md-typeset table:not([class]) {
  display: block;
  overflow-x: auto;
}

/* Code annotation improvements */
.md-typeset .md-annotation {
  outline: none;
}

[data-md-color-scheme="slate"] .md-typeset .md-annotation__index {
  background-color: var(--md-primary-fg-color);
}
```

## Python API Documentation

### Auto-generated from Docstrings
```python
# src/client.py
"""
HTTP Client module for API interactions.

This module provides the main Client class for interacting with the API.

Example:
    Basic usage::

        from myproject import Client

        client = Client(api_key="your-key")
        result = await client.query("Hello")
        print(result)

Note:
    All methods are async and should be awaited.
"""

from typing import Optional, Dict, Any, List
from dataclasses import dataclass
import httpx


@dataclass
class ClientConfig:
    """Configuration options for the Client.

    Attributes:
        api_key: Your API key for authentication.
        base_url: Base URL for API requests. Defaults to production.
        timeout: Request timeout in seconds. Defaults to 30.
        max_retries: Maximum retry attempts. Defaults to 3.

    Example:
        >>> config = ClientConfig(
        ...     api_key="sk-...",
        ...     timeout=60
        ... )
    """
    api_key: str
    base_url: str = "https://api.myproject.com"
    timeout: float = 30.0
    max_retries: int = 3


class Client:
    """Main client for interacting with the API.

    This class provides methods for making API requests with automatic
    retry logic, error handling, and response parsing.

    Args:
        config: Client configuration options.

    Attributes:
        config: The client configuration.

    Raises:
        ValueError: If api_key is not provided.

    Example:
        Create a client and make a request::

            client = Client(ClientConfig(api_key="sk-..."))
            result = await client.query("Hello, world!")
            print(result.text)

    See Also:
        ClientConfig: Configuration options.
        QueryResult: Result type for queries.
    """

    def __init__(self, config: ClientConfig) -> None:
        """Initialize the client with configuration.

        Args:
            config: Client configuration options.

        Raises:
            ValueError: If api_key is empty or None.
        """
        if not config.api_key:
            raise ValueError("api_key is required")
        self.config = config
        self._client = httpx.AsyncClient(
            base_url=config.base_url,
            timeout=config.timeout,
            headers={"Authorization": f"Bearer {config.api_key}"}
        )

    async def query(
        self,
        prompt: str,
        *,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        stop: Optional[List[str]] = None
    ) -> "QueryResult":
        """Execute a query against the API.

        Args:
            prompt: The input prompt to process.
            temperature: Sampling temperature (0-2). Higher values mean more
                random outputs. Defaults to 0.7.
            max_tokens: Maximum tokens to generate. If None, uses model default.
            stop: Sequences where the API will stop generating further tokens.

        Returns:
            QueryResult: The query result containing the generated text
                and metadata.

        Raises:
            APIError: If the API returns an error response.
            NetworkError: If there's a connection issue.
            RateLimitError: If rate limit is exceeded.

        Example:
            Simple query::

                result = await client.query("What is Python?")
                print(result.text)

            With parameters::

                result = await client.query(
                    "Write a poem about coding",
                    temperature=0.9,
                    max_tokens=200
                )

        Note:
            The temperature parameter significantly affects output randomness.
            Use lower values (0.1-0.3) for factual responses and higher
            values (0.7-1.0) for creative content.
        """
        payload = {
            "prompt": prompt,
            "temperature": temperature,
        }
        if max_tokens is not None:
            payload["max_tokens"] = max_tokens
        if stop is not None:
            payload["stop"] = stop

        response = await self._client.post("/v1/query", json=payload)
        response.raise_for_status()
        return QueryResult.from_response(response.json())

    async def close(self) -> None:
        """Close the HTTP client connection.

        Should be called when the client is no longer needed to release
        resources.

        Example:
            >>> client = Client(config)
            >>> try:
            ...     result = await client.query("Hello")
            ... finally:
            ...     await client.close()

        Note:
            Consider using the client as an async context manager instead::

                async with Client(config) as client:
                    result = await client.query("Hello")
        """
        await self._client.aclose()

    async def __aenter__(self) -> "Client":
        """Enter async context manager."""
        return self

    async def __aexit__(self, *args) -> None:
        """Exit async context manager."""
        await self.close()


@dataclass
class QueryResult:
    """Result from a query operation.

    Attributes:
        text: The generated text response.
        tokens_used: Number of tokens consumed.
        finish_reason: Why generation stopped ('stop', 'length', etc).
        model: The model that generated the response.

    Example:
        >>> result = await client.query("Hello")
        >>> print(f"Response: {result.text}")
        >>> print(f"Tokens: {result.tokens_used}")
    """
    text: str
    tokens_used: int
    finish_reason: str
    model: str

    @classmethod
    def from_response(cls, data: Dict[str, Any]) -> "QueryResult":
        """Create a QueryResult from API response data.

        Args:
            data: The raw API response dictionary.

        Returns:
            QueryResult: Parsed result object.
        """
        return cls(
            text=data["choices"][0]["text"],
            tokens_used=data["usage"]["total_tokens"],
            finish_reason=data["choices"][0]["finish_reason"],
            model=data["model"]
        )
```

## Documentation Pages

### docs/index.md
```markdown
---
title: Home
description: Welcome to My Project documentation
hide:
  - navigation
  - toc
---

# Welcome to My Project

<div class="grid cards" markdown>

-   :material-clock-fast:{ .lg .middle } __Quick Start__

    ---

    Get up and running in minutes with our quick start guide.

    [:octicons-arrow-right-24: Getting Started](getting-started/quickstart.md)

-   :material-code-tags:{ .lg .middle } __API Reference__

    ---

    Comprehensive API documentation with examples.

    [:octicons-arrow-right-24: API Docs](api/index.md)

-   :material-book-open:{ .lg .middle } __User Guide__

    ---

    In-depth guides for all features and use cases.

    [:octicons-arrow-right-24: Read Guide](guide/index.md)

-   :material-github:{ .lg .middle } __Open Source__

    ---

    Contribute to the project on GitHub.

    [:octicons-arrow-right-24: GitHub](https://github.com/my-org/my-project)

</div>

## Installation

=== "pip"

    ```bash
    pip install my-project
    ```

=== "poetry"

    ```bash
    poetry add my-project
    ```

=== "conda"

    ```bash
    conda install -c conda-forge my-project
    ```

## Quick Example

```python
from myproject import Client, ClientConfig

# Initialize the client
config = ClientConfig(api_key="your-api-key")
client = Client(config)

# Make a request
async with client:
    result = await client.query("Hello, world!")
    print(result.text)
```

!!! tip "Need Help?"
    Check out our [FAQ](faq.md) or join our [Discord](https://discord.gg/myproject).
```

### docs/api/client.md
```markdown
---
title: Client API
description: API reference for the Client class
---

# Client

::: myproject.client.Client
    options:
      show_root_heading: true
      show_source: true
      members:
        - __init__
        - query
        - close

## Configuration

::: myproject.client.ClientConfig
    options:
      show_root_heading: true

## Result Types

::: myproject.client.QueryResult
    options:
      show_root_heading: true
```

## CLAUDE.md Integration

```markdown
## MkDocs Documentation

### Structure
- `/docs` - Documentation source files
- `/overrides` - Theme customizations
- `mkdocs.yml` - Main configuration

### Commands
- `mkdocs serve` - Development server
- `mkdocs build` - Production build
- `mkdocs gh-deploy` - Deploy to GitHub Pages
- `mike deploy` - Version deployment

### Features
- Material theme with dark mode
- Mermaid diagrams
- Code annotations
- Search with highlighting
- mkdocstrings for Python API docs

### Plugins
- search - Full-text search
- awesome-pages - Auto navigation
- mkdocstrings - API from docstrings
- git-revision-date - Last updated dates
```

## AI Suggestions

1. **Auto-generate API docs** - Build docs from Python docstrings
2. **Navigation structure** - Create nav from directory structure
3. **Search optimization** - Improve search index configuration
4. **Theme customization** - Build custom Material theme
5. **Plugin configuration** - Set up mkdocstrings for Python
6. **Diagram generation** - Create Mermaid diagrams from code
7. **Version management** - Configure mike for versioning
8. **i18n setup** - Multi-language documentation
9. **Social cards** - Auto-generate OpenGraph images
10. **Link validation** - Check for broken links
