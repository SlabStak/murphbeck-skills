# Sphinx Documentation Template

## Overview
Sphinx documentation setup for Python projects with autodoc, custom themes, and multi-format output.

## Quick Start
```bash
pip install sphinx sphinx-rtd-theme sphinx-autodoc-typehints myst-parser
sphinx-quickstart docs
```

## Sphinx Configuration

### conf.py
```python
# docs/conf.py
"""Sphinx configuration file."""

import os
import sys
from datetime import datetime
from pathlib import Path

# Add source directory to path for autodoc
sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))

# -- Project information -----------------------------------------------------
project = 'My Project'
copyright = f'{datetime.now().year}, My Org'
author = 'My Org'
version = '2.0'
release = '2.0.0'

# -- General configuration ---------------------------------------------------
extensions = [
    'sphinx.ext.autodoc',
    'sphinx.ext.autosummary',
    'sphinx.ext.napoleon',
    'sphinx.ext.viewcode',
    'sphinx.ext.intersphinx',
    'sphinx.ext.todo',
    'sphinx.ext.coverage',
    'sphinx.ext.mathjax',
    'sphinx.ext.githubpages',
    'sphinx_autodoc_typehints',
    'sphinx_copybutton',
    'sphinx_tabs.tabs',
    'myst_parser',
    'sphinxcontrib.mermaid',
]

# Templates
templates_path = ['_templates']
exclude_patterns = ['_build', 'Thumbs.db', '.DS_Store']

# Source file configuration
source_suffix = {
    '.rst': 'restructuredtext',
    '.md': 'markdown',
}
master_doc = 'index'

# -- Options for HTML output -------------------------------------------------
html_theme = 'furo'  # or 'sphinx_rtd_theme'
html_static_path = ['_static']
html_css_files = ['custom.css']
html_js_files = ['custom.js']

html_theme_options = {
    # Furo theme options
    'light_css_variables': {
        'color-brand-primary': '#3b82f6',
        'color-brand-content': '#3b82f6',
        'color-api-name': '#3b82f6',
        'color-api-pre-name': '#3b82f6',
    },
    'dark_css_variables': {
        'color-brand-primary': '#60a5fa',
        'color-brand-content': '#60a5fa',
    },
    'sidebar_hide_name': False,
    'navigation_with_keys': True,
    'top_of_page_button': 'edit',
    'source_repository': 'https://github.com/my-org/my-project',
    'source_branch': 'main',
    'source_directory': 'docs/',
}

# RTD theme options (alternative)
# html_theme_options = {
#     'logo_only': False,
#     'display_version': True,
#     'prev_next_buttons_location': 'bottom',
#     'style_external_links': True,
#     'style_nav_header_background': '#3b82f6',
#     'collapse_navigation': False,
#     'sticky_navigation': True,
#     'navigation_depth': 4,
#     'includehidden': True,
#     'titles_only': False,
# }

html_logo = '_static/logo.svg'
html_favicon = '_static/favicon.ico'
html_title = f'{project} v{version}'
html_short_title = project
html_show_sourcelink = True
html_show_sphinx = False
html_show_copyright = True

# -- Extension configuration -------------------------------------------------

# Autodoc settings
autodoc_default_options = {
    'members': True,
    'member-order': 'bysource',
    'special-members': '__init__',
    'undoc-members': True,
    'exclude-members': '__weakref__',
    'show-inheritance': True,
    'inherited-members': True,
}
autodoc_typehints = 'description'
autodoc_typehints_description_target = 'documented'
autodoc_class_signature = 'separated'
autodoc_member_order = 'bysource'

# Autosummary settings
autosummary_generate = True
autosummary_generate_overwrite = True
autosummary_imported_members = True

# Napoleon settings (Google/NumPy docstrings)
napoleon_google_docstring = True
napoleon_numpy_docstring = True
napoleon_include_init_with_doc = True
napoleon_include_private_with_doc = False
napoleon_include_special_with_doc = True
napoleon_use_admonition_for_examples = True
napoleon_use_admonition_for_notes = True
napoleon_use_admonition_for_references = False
napoleon_use_ivar = False
napoleon_use_param = True
napoleon_use_rtype = True
napoleon_use_keyword = True
napoleon_preprocess_types = True
napoleon_type_aliases = None
napoleon_attr_annotations = True

# Type hints settings
typehints_defaults = 'comma'
always_document_param_types = True
typehints_document_rtype = True

# Intersphinx mapping
intersphinx_mapping = {
    'python': ('https://docs.python.org/3', None),
    'numpy': ('https://numpy.org/doc/stable/', None),
    'pandas': ('https://pandas.pydata.org/docs/', None),
    'requests': ('https://requests.readthedocs.io/en/latest/', None),
}

# MyST parser settings
myst_enable_extensions = [
    'colon_fence',
    'deflist',
    'dollarmath',
    'fieldlist',
    'html_admonition',
    'html_image',
    'linkify',
    'replacements',
    'smartquotes',
    'strikethrough',
    'substitution',
    'tasklist',
]
myst_heading_anchors = 3

# Copy button settings
copybutton_prompt_text = r'>>> |\.\.\. |\$ |In \[\d*\]: | {2,5}\.\.\.: | {5,8}: '
copybutton_prompt_is_regexp = True

# Todo settings
todo_include_todos = True
todo_emit_warnings = True

# Mermaid settings
mermaid_version = '10.6.1'
mermaid_init_js = '''
mermaid.initialize({
    startOnLoad: true,
    theme: 'default',
    securityLevel: 'loose',
});
'''

# -- Custom setup ------------------------------------------------------------
def setup(app):
    """Custom Sphinx setup."""
    app.add_css_file('custom.css')
```

## reStructuredText Patterns

### Module Documentation
```rst
.. docs/api/client.rst

Client Module
=============

.. module:: myproject.client
   :synopsis: HTTP client for API interactions

This module provides the main Client class for interacting with the API.

.. contents:: Table of Contents
   :local:
   :depth: 2

Quick Start
-----------

.. code-block:: python

   from myproject import Client

   client = Client(api_key="your-key")
   result = await client.query("Hello")
   print(result.text)

Classes
-------

Client
~~~~~~

.. autoclass:: Client
   :members:
   :undoc-members:
   :show-inheritance:
   :special-members: __init__, __aenter__, __aexit__

   .. rubric:: Example

   .. code-block:: python

      async with Client(api_key="sk-...") as client:
          result = await client.query("Hello")

ClientConfig
~~~~~~~~~~~~

.. autoclass:: ClientConfig
   :members:
   :undoc-members:

QueryResult
~~~~~~~~~~~

.. autoclass:: QueryResult
   :members:
   :undoc-members:

Exceptions
----------

.. autoexception:: APIError
   :show-inheritance:

.. autoexception:: RateLimitError
   :show-inheritance:

See Also
--------

- :doc:`/guide/authentication` - Authentication guide
- :doc:`/guide/error-handling` - Error handling patterns
```

### Guide Documentation
```rst
.. docs/guide/quickstart.rst

Quick Start Guide
=================

.. meta::
   :description: Get started with My Project in 5 minutes
   :keywords: quickstart, tutorial, getting started

This guide will help you get up and running with My Project quickly.

.. contents::
   :local:

Prerequisites
-------------

Before you begin, ensure you have:

* Python 3.8 or higher
* An API key (get one at https://myproject.com/keys)

Installation
------------

Install using pip:

.. tabs::

   .. tab:: pip

      .. code-block:: bash

         pip install my-project

   .. tab:: poetry

      .. code-block:: bash

         poetry add my-project

   .. tab:: conda

      .. code-block:: bash

         conda install -c conda-forge my-project

Basic Usage
-----------

Here's a simple example to get you started:

.. code-block:: python
   :linenos:
   :emphasize-lines: 5,8

   import asyncio
   from myproject import Client

   async def main():
       client = Client(api_key="your-api-key")

       try:
           result = await client.query("What is Python?")
           print(result.text)
       finally:
           await client.close()

   asyncio.run(main())

.. tip::

   Use the client as an async context manager for automatic cleanup:

   .. code-block:: python

      async with Client(api_key="...") as client:
          result = await client.query("Hello")

Configuration Options
---------------------

.. list-table:: Client Configuration
   :widths: 20 15 15 50
   :header-rows: 1

   * - Parameter
     - Type
     - Default
     - Description
   * - api_key
     - str
     - *required*
     - Your API authentication key
   * - base_url
     - str
     - https://api.myproject.com
     - API base URL
   * - timeout
     - float
     - 30.0
     - Request timeout in seconds
   * - max_retries
     - int
     - 3
     - Maximum retry attempts

Error Handling
--------------

The client may raise the following exceptions:

.. warning::

   Always handle potential errors in production code.

.. code-block:: python

   from myproject import Client
   from myproject.exceptions import APIError, RateLimitError

   try:
       result = await client.query("Hello")
   except RateLimitError as e:
       print(f"Rate limited. Retry after {e.retry_after} seconds")
   except APIError as e:
       print(f"API error: {e.message}")

Next Steps
----------

Now that you've completed the quick start:

1. Read the :doc:`configuration` guide for advanced setup
2. Explore the :doc:`/api/index` reference
3. Check out :doc:`/examples/index` for more use cases

.. seealso::

   - :doc:`authentication` - Detailed auth guide
   - :doc:`best-practices` - Production best practices
```

### Index Page
```rst
.. docs/index.rst

Welcome to My Project
=====================

.. image:: _static/logo.svg
   :alt: My Project Logo
   :align: center
   :width: 200px

My Project is a powerful Python library for building amazing applications.

.. toctree::
   :maxdepth: 2
   :caption: Getting Started

   guide/installation
   guide/quickstart
   guide/configuration

.. toctree::
   :maxdepth: 2
   :caption: User Guide

   guide/authentication
   guide/advanced
   guide/best-practices
   guide/error-handling

.. toctree::
   :maxdepth: 3
   :caption: API Reference

   api/index
   api/client
   api/models
   api/exceptions

.. toctree::
   :maxdepth: 2
   :caption: Examples

   examples/basic
   examples/advanced
   examples/async

.. toctree::
   :maxdepth: 1
   :caption: Project

   changelog
   contributing
   license

Quick Example
-------------

.. code-block:: python

   from myproject import Client

   async with Client(api_key="your-key") as client:
       result = await client.query("Hello, world!")
       print(result.text)

Features
--------

.. grid:: 2
   :gutter: 3

   .. grid-item-card:: 🚀 Fast
      :link: guide/quickstart
      :link-type: doc

      Optimized for performance with async support.

   .. grid-item-card:: 🔒 Secure
      :link: guide/authentication
      :link-type: doc

      Enterprise-grade security features.

   .. grid-item-card:: 📦 Simple
      :link: guide/installation
      :link-type: doc

      Easy to install and configure.

   .. grid-item-card:: 📚 Documented
      :link: api/index
      :link-type: doc

      Comprehensive API documentation.

Indices and tables
------------------

* :ref:`genindex`
* :ref:`modindex`
* :ref:`search`
```

## Python Code Documentation

```python
# src/myproject/client.py
"""
Client module for API interactions.

This module provides the main :class:`Client` class for making
API requests with automatic retry logic and error handling.

Example:
    Basic usage::

        from myproject import Client

        async with Client(api_key="sk-...") as client:
            result = await client.query("Hello")

Note:
    All methods are async and should be awaited.

See Also:
    :mod:`myproject.models` - Data models
    :mod:`myproject.exceptions` - Exception classes
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Optional, List, Dict, Any

if TYPE_CHECKING:
    from .models import QueryResult


@dataclass
class ClientConfig:
    """Configuration options for the API client.

    This dataclass holds all configuration options needed to
    initialize a :class:`Client` instance.

    Args:
        api_key: Your API authentication key. Required.
        base_url: The base URL for API requests.
            Defaults to production endpoint.
        timeout: Request timeout in seconds. Defaults to 30.
        max_retries: Maximum number of retry attempts.
            Defaults to 3.
        headers: Additional headers to include in requests.

    Attributes:
        api_key (str): The API key for authentication.
        base_url (str): The API base URL.
        timeout (float): Request timeout in seconds.
        max_retries (int): Maximum retry count.
        headers (dict): Custom request headers.

    Example:
        Create a config with custom settings::

            config = ClientConfig(
                api_key="sk-...",
                timeout=60,
                max_retries=5
            )

    Note:
        The ``api_key`` should be kept secure and not committed
        to version control.

    .. versionadded:: 1.0.0
    .. versionchanged:: 2.0.0
       Added ``headers`` parameter.
    """

    api_key: str
    base_url: str = "https://api.myproject.com"
    timeout: float = 30.0
    max_retries: int = 3
    headers: Dict[str, str] = field(default_factory=dict)


class Client:
    """HTTP client for API interactions.

    This class provides the main interface for making API requests.
    It handles authentication, retries, and error handling automatically.

    Args:
        config: Client configuration options.

    Raises:
        ValueError: If the API key is not provided.
        ConfigurationError: If the configuration is invalid.

    Example:
        Create a client and make requests::

            config = ClientConfig(api_key="sk-...")
            client = Client(config)

            async with client:
                result = await client.query("Hello")
                print(result.text)

        Or use the simplified constructor::

            async with Client.from_api_key("sk-...") as client:
                result = await client.query("Hello")

    Note:
        The client should be used as an async context manager
        to ensure proper resource cleanup.

    See Also:
        :class:`ClientConfig` - Configuration options
        :meth:`query` - Make a query request

    .. versionadded:: 1.0.0
    """

    def __init__(self, config: ClientConfig) -> None:
        """Initialize the client.

        Args:
            config: Client configuration instance.

        Raises:
            ValueError: If ``config.api_key`` is empty.
        """
        if not config.api_key:
            raise ValueError("api_key is required")
        self.config = config
        self._client = None

    @classmethod
    def from_api_key(cls, api_key: str, **kwargs: Any) -> "Client":
        """Create a client from an API key.

        This is a convenience method for creating a client
        with minimal configuration.

        Args:
            api_key: Your API authentication key.
            **kwargs: Additional configuration options passed
                to :class:`ClientConfig`.

        Returns:
            A new :class:`Client` instance.

        Example:
            >>> client = Client.from_api_key("sk-...")
            >>> async with client:
            ...     result = await client.query("Hello")

        .. versionadded:: 2.0.0
        """
        config = ClientConfig(api_key=api_key, **kwargs)
        return cls(config)

    async def query(
        self,
        prompt: str,
        *,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        stop: Optional[List[str]] = None,
    ) -> "QueryResult":
        """Execute a query against the API.

        This method sends a prompt to the API and returns the
        generated response.

        Args:
            prompt: The input text to process.
            temperature: Sampling temperature between 0 and 2.
                Higher values produce more random outputs.
                Defaults to 0.7.
            max_tokens: Maximum tokens to generate. If ``None``,
                uses the model's default.
            stop: List of sequences where generation stops.

        Returns:
            :class:`~myproject.models.QueryResult`: The query result
            containing the generated text and metadata.

        Raises:
            APIError: If the API returns an error.
            RateLimitError: If rate limit is exceeded.
            NetworkError: If there's a connection issue.

        Example:
            Basic query::

                result = await client.query("What is Python?")
                print(result.text)

            With parameters::

                result = await client.query(
                    "Write a poem",
                    temperature=0.9,
                    max_tokens=200,
                    stop=["END"]
                )

        Note:
            - Use lower temperature (0.1-0.3) for factual content
            - Use higher temperature (0.7-1.0) for creative content

        Warning:
            The ``stop`` parameter is case-sensitive.

        .. versionadded:: 1.0.0
        .. versionchanged:: 2.0.0
           Added ``stop`` parameter.
        """
        # Implementation
        pass

    async def close(self) -> None:
        """Close the client and release resources.

        This method should be called when you're done using
        the client to properly release network connections.

        Note:
            If using the client as a context manager, this
            is called automatically.

        Example:
            >>> client = Client(config)
            >>> try:
            ...     result = await client.query("Hello")
            ... finally:
            ...     await client.close()
        """
        if self._client:
            await self._client.aclose()

    async def __aenter__(self) -> "Client":
        """Enter async context manager.

        Returns:
            The client instance.
        """
        return self

    async def __aexit__(self, *args: Any) -> None:
        """Exit async context manager."""
        await self.close()
```

## Custom Templates

### _templates/autosummary/class.rst
```rst
{{ fullname | escape | underline }}

.. currentmodule:: {{ module }}

.. autoclass:: {{ objname }}
   :members:
   :show-inheritance:
   :inherited-members:
   :special-members: __init__, __call__

   {% block methods %}
   {% if methods %}
   .. rubric:: Methods

   .. autosummary::
      :nosignatures:
   {% for item in methods %}
      ~{{ name }}.{{ item }}
   {%- endfor %}
   {% endif %}
   {% endblock %}

   {% block attributes %}
   {% if attributes %}
   .. rubric:: Attributes

   .. autosummary::
   {% for item in attributes %}
      ~{{ name }}.{{ item }}
   {%- endfor %}
   {% endif %}
   {% endblock %}
```

## CLAUDE.md Integration

```markdown
## Sphinx Documentation

### Structure
- `/docs` - Documentation source
- `/docs/conf.py` - Sphinx configuration
- `/docs/api` - API reference (autodoc)
- `/docs/guide` - User guides

### Commands
- `sphinx-build -b html docs docs/_build` - Build HTML
- `sphinx-autobuild docs docs/_build` - Live reload
- `make html` - Build using Makefile

### Docstring Format
- Use Google or NumPy style
- Include Args, Returns, Raises
- Add Examples with doctests
- Cross-reference with :class:, :meth:, :func:

### Extensions
- autodoc - Auto-generate from docstrings
- napoleon - Google/NumPy style support
- intersphinx - Cross-project references
- viewcode - Link to source
```

## AI Suggestions

1. **Auto-generate API docs** - Build docs from Python docstrings
2. **Docstring validation** - Check docstring completeness
3. **Cross-reference linking** - Verify intersphinx references
4. **Example testing** - Run doctest examples
5. **Coverage reporting** - Measure documentation coverage
6. **Theme customization** - Build custom Sphinx themes
7. **Multi-format output** - Generate PDF, EPUB, man pages
8. **Translation management** - i18n with sphinx-intl
9. **Search optimization** - Improve search index
10. **Version comparison** - Diff API between versions
