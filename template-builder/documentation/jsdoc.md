# JSDoc Documentation Template

## Overview
Comprehensive JSDoc documentation setup with automated generation, custom tags, and IDE integration.

## Quick Start
```bash
npm install jsdoc jsdoc-to-markdown better-docs @types/jsdoc docdash
```

## JSDoc Configuration

### jsdoc.json
```json
{
  "source": {
    "include": ["src"],
    "includePattern": ".+\\.js(x)?$|.+\\.ts(x)?$",
    "excludePattern": "(^|\\/|\\\\)_|node_modules|__tests__|__mocks__"
  },
  "plugins": [
    "plugins/markdown",
    "node_modules/better-docs/typescript",
    "node_modules/better-docs/category"
  ],
  "opts": {
    "template": "node_modules/docdash",
    "destination": "./docs",
    "recurse": true,
    "verbose": true,
    "readme": "README.md"
  },
  "templates": {
    "cleverLinks": true,
    "monospaceLinks": true,
    "default": {
      "outputSourceFiles": true,
      "includeDate": false
    },
    "docdash": {
      "sectionOrder": [
        "Classes",
        "Modules",
        "Externals",
        "Events",
        "Namespaces",
        "Mixins",
        "Tutorials",
        "Interfaces"
      ],
      "search": true,
      "collapse": true,
      "typedefs": true,
      "navLevel": 3
    }
  },
  "tags": {
    "allowUnknownTags": true,
    "dictionaries": ["jsdoc", "closure"]
  }
}
```

## JSDoc Comment Patterns

### Class Documentation
```javascript
/**
 * Represents a user in the system.
 * @class User
 * @extends BaseEntity
 * @implements {Serializable}
 *
 * @example
 * const user = new User({ name: 'John', email: 'john@example.com' });
 * await user.save();
 *
 * @author Development Team
 * @since 1.0.0
 * @version 2.3.0
 */
class User extends BaseEntity {
  /**
   * Creates a new User instance.
   * @constructor
   * @param {UserOptions} options - The user configuration options.
   * @param {string} options.name - The user's display name.
   * @param {string} options.email - The user's email address.
   * @param {string} [options.avatar] - Optional avatar URL.
   * @param {UserRole} [options.role='user'] - The user's role.
   * @throws {ValidationError} If required fields are missing.
   */
  constructor(options) {
    super();
    this.name = options.name;
    this.email = options.email;
    this.avatar = options.avatar;
    this.role = options.role || 'user';
  }

  /**
   * User's unique identifier.
   * @type {string}
   * @readonly
   */
  get id() {
    return this._id;
  }

  /**
   * User's email address.
   * @type {string}
   * @memberof User
   */
  email;

  /**
   * Validates the user data.
   * @async
   * @method validate
   * @memberof User
   * @returns {Promise<ValidationResult>} The validation result.
   * @fires User#validated
   *
   * @example
   * const result = await user.validate();
   * if (result.valid) {
   *   console.log('User is valid');
   * }
   */
  async validate() {
    const result = await this.validator.validate(this);
    /**
     * Validated event.
     * @event User#validated
     * @type {object}
     * @property {boolean} valid - Whether validation passed.
     * @property {string[]} errors - Validation error messages.
     */
    this.emit('validated', result);
    return result;
  }

  /**
   * Updates user profile data.
   * @param {Partial<UserProfile>} updates - The fields to update.
   * @returns {this} The updated user instance for chaining.
   * @throws {PermissionError} If update is not allowed.
   * @see {@link UserProfile} for available fields.
   * @deprecated Use {@link User#patch} instead.
   */
  update(updates) {
    Object.assign(this, updates);
    return this;
  }
}
```

### Function Documentation
```javascript
/**
 * Fetches data from an API endpoint with retry logic.
 *
 * @async
 * @function fetchWithRetry
 * @template T - The expected response type.
 * @param {string} url - The URL to fetch from.
 * @param {FetchOptions} [options={}] - Fetch configuration.
 * @param {number} [options.retries=3] - Number of retry attempts.
 * @param {number} [options.delay=1000] - Delay between retries in ms.
 * @param {RequestInit} [options.fetchOptions] - Native fetch options.
 * @returns {Promise<ApiResponse<T>>} The API response.
 * @throws {NetworkError} When all retries are exhausted.
 * @throws {TimeoutError} When request exceeds timeout.
 *
 * @example <caption>Basic usage</caption>
 * const users = await fetchWithRetry('/api/users');
 *
 * @example <caption>With options</caption>
 * const data = await fetchWithRetry('/api/data', {
 *   retries: 5,
 *   delay: 2000,
 *   fetchOptions: { headers: { 'Authorization': 'Bearer token' } }
 * });
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API|Fetch API}
 * @since 2.0.0
 */
async function fetchWithRetry(url, options = {}) {
  const { retries = 3, delay = 1000, fetchOptions } = options;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, fetchOptions);
      return await response.json();
    } catch (error) {
      if (attempt === retries) throw new NetworkError(error.message);
      await sleep(delay * Math.pow(2, attempt));
    }
  }
}

/**
 * Callback for array transformation.
 * @callback TransformCallback
 * @template T, R
 * @param {T} item - The current item.
 * @param {number} index - The current index.
 * @param {T[]} array - The source array.
 * @returns {R} The transformed item.
 */

/**
 * Transforms an array with batching support.
 * @function transformArray
 * @template T, R
 * @param {T[]} items - Items to transform.
 * @param {TransformCallback<T, R>} callback - Transform function.
 * @param {object} [options] - Transformation options.
 * @param {number} [options.batchSize=100] - Items per batch.
 * @param {boolean} [options.parallel=false] - Run batches in parallel.
 * @returns {R[]} Transformed items.
 */
function transformArray(items, callback, options = {}) {
  const { batchSize = 100, parallel = false } = options;
  // Implementation
}
```

### Type Definitions
```javascript
/**
 * User configuration options.
 * @typedef {object} UserOptions
 * @property {string} name - Display name.
 * @property {string} email - Email address.
 * @property {string} [avatar] - Avatar URL.
 * @property {UserRole} [role='user'] - User role.
 * @property {UserPreferences} [preferences] - User preferences.
 */

/**
 * User role enumeration.
 * @typedef {'admin'|'moderator'|'user'|'guest'} UserRole
 */

/**
 * User preferences configuration.
 * @typedef {object} UserPreferences
 * @property {string} theme - UI theme ('light' or 'dark').
 * @property {string} language - Preferred language code.
 * @property {NotificationSettings} notifications - Notification settings.
 */

/**
 * API response wrapper.
 * @typedef {object} ApiResponse
 * @template T
 * @property {boolean} success - Whether request succeeded.
 * @property {T} [data] - Response data if successful.
 * @property {ApiError} [error] - Error details if failed.
 * @property {ResponseMeta} meta - Response metadata.
 */

/**
 * Pagination parameters.
 * @typedef {object} PaginationParams
 * @property {number} [page=1] - Current page number.
 * @property {number} [limit=20] - Items per page.
 * @property {string} [sortBy] - Field to sort by.
 * @property {'asc'|'desc'} [sortOrder='asc'] - Sort direction.
 */

/**
 * Generic record type.
 * @typedef {Object<string, T>} Record
 * @template T
 */

/**
 * Nullable type wrapper.
 * @typedef {T|null} Nullable
 * @template T
 */
```

### Module Documentation
```javascript
/**
 * Authentication utilities module.
 * Provides functions for user authentication and authorization.
 *
 * @module auth
 * @requires crypto
 * @requires jsonwebtoken
 * @see {@link module:auth/jwt} for JWT-specific functions
 * @see {@link module:auth/oauth} for OAuth integration
 *
 * @example
 * import { authenticate, authorize } from './auth';
 *
 * const user = await authenticate(credentials);
 * const canAccess = authorize(user, 'admin');
 */

/**
 * Authenticates a user with credentials.
 * @memberof module:auth
 * @param {Credentials} credentials - User credentials.
 * @returns {Promise<AuthResult>} Authentication result.
 */
export async function authenticate(credentials) {
  // Implementation
}

/**
 * Checks if user has required permission.
 * @memberof module:auth
 * @param {User} user - The user to check.
 * @param {string|string[]} permissions - Required permissions.
 * @returns {boolean} True if authorized.
 */
export function authorize(user, permissions) {
  // Implementation
}
```

## Custom JSDoc Tags

### Custom Tag Plugin
```javascript
// plugins/custom-tags.js
/**
 * @module plugins/custom-tags
 */

exports.defineTags = function(dictionary) {
  // @api tag for API endpoint documentation
  dictionary.defineTag('api', {
    mustHaveValue: true,
    canHaveType: false,
    canHaveName: false,
    onTagged: function(doclet, tag) {
      doclet.api = {
        method: tag.value.split(' ')[0],
        path: tag.value.split(' ')[1]
      };
    }
  });

  // @permission tag for required permissions
  dictionary.defineTag('permission', {
    mustHaveValue: true,
    canHaveType: false,
    canHaveName: true,
    onTagged: function(doclet, tag) {
      doclet.permissions = doclet.permissions || [];
      doclet.permissions.push(tag.value);
    }
  });

  // @complexity tag for algorithmic complexity
  dictionary.defineTag('complexity', {
    mustHaveValue: true,
    canHaveType: false,
    canHaveName: false,
    onTagged: function(doclet, tag) {
      const [time, space] = tag.value.split(',').map(s => s.trim());
      doclet.complexity = { time, space };
    }
  });

  // @tested tag for test coverage status
  dictionary.defineTag('tested', {
    mustHaveValue: false,
    canHaveType: false,
    canHaveName: false,
    onTagged: function(doclet, tag) {
      doclet.tested = tag.value || true;
    }
  });

  // @ratelimit tag for rate limiting info
  dictionary.defineTag('ratelimit', {
    mustHaveValue: true,
    canHaveType: false,
    canHaveName: false,
    onTagged: function(doclet, tag) {
      const [limit, window] = tag.value.split('/');
      doclet.rateLimit = { limit: parseInt(limit), window };
    }
  });
};

exports.handlers = {
  newDoclet: function(e) {
    // Process custom tags into doclet
    if (e.doclet.api) {
      e.doclet.description = `**${e.doclet.api.method}** \`${e.doclet.api.path}\`\n\n${e.doclet.description || ''}`;
    }

    if (e.doclet.permissions && e.doclet.permissions.length) {
      e.doclet.description += `\n\n**Required Permissions:** ${e.doclet.permissions.join(', ')}`;
    }

    if (e.doclet.complexity) {
      e.doclet.description += `\n\n**Complexity:** Time: ${e.doclet.complexity.time}`;
      if (e.doclet.complexity.space) {
        e.doclet.description += `, Space: ${e.doclet.complexity.space}`;
      }
    }
  }
};
```

### Using Custom Tags
```javascript
/**
 * Fetches paginated list of users.
 * @api GET /api/users
 * @permission users:read
 * @ratelimit 100/minute
 * @tested unit, integration
 * @complexity O(n), O(1)
 *
 * @param {PaginationParams} params - Pagination options.
 * @returns {Promise<PaginatedResponse<User>>} Paginated users.
 */
async function getUsers(params) {
  // Implementation
}

/**
 * Binary search implementation.
 * @complexity O(log n), O(1)
 * @tested unit
 *
 * @template T
 * @param {T[]} arr - Sorted array to search.
 * @param {T} target - Value to find.
 * @param {function(T, T): number} [comparator] - Custom comparator.
 * @returns {number} Index of target or -1 if not found.
 */
function binarySearch(arr, target, comparator) {
  // Implementation
}
```

## JSDoc to Markdown Generation

### jsdoc2md Configuration
```javascript
// jsdoc2md.config.js
module.exports = {
  source: {
    include: ['src'],
    includePattern: '.+\\.js$'
  },
  plugins: ['./plugins/custom-tags.js'],

  // Template configuration
  template: require.resolve('./templates/api.hbs'),

  // Partial templates
  partial: [
    './templates/partials/header.hbs',
    './templates/partials/params.hbs',
    './templates/partials/examples.hbs'
  ],

  // Helper functions
  helper: ['./templates/helpers.js'],

  // Output configuration
  'heading-depth': 2,
  'member-index-format': 'list',
  'param-list-format': 'table',
  'property-list-format': 'table',
  'example-lang': 'javascript',

  // Grouping
  'group-by': ['category', 'kind'],
  'no-gfm': false
};
```

### Custom Template
```handlebars
{{!-- templates/api.hbs --}}
# API Documentation

{{#each (groupBy this "category")}}
## {{@key}}

{{#each this}}
### {{name}}

{{#if description}}
{{{description}}}
{{/if}}

{{#if params}}
#### Parameters

| Name | Type | Default | Description |
|------|------|---------|-------------|
{{#each params}}
| `{{name}}` | `{{type.names}}` | {{#if defaultvalue}}`{{defaultvalue}}`{{else}}-{{/if}} | {{description}} |
{{/each}}
{{/if}}

{{#if returns}}
#### Returns

`{{returns.[0].type.names}}` - {{returns.[0].description}}
{{/if}}

{{#if examples}}
#### Examples

{{#each examples}}
```javascript
{{{this}}}
```
{{/each}}
{{/if}}

{{#if throws}}
#### Throws

{{#each throws}}
- `{{type.names}}` - {{description}}
{{/each}}
{{/if}}

---

{{/each}}
{{/each}}
```

### Generation Script
```javascript
// scripts/generate-docs.js
const jsdoc2md = require('jsdoc-to-markdown');
const fs = require('fs').promises;
const path = require('path');
const glob = require('glob');

class DocsGenerator {
  constructor(options = {}) {
    this.options = {
      sourceDir: 'src',
      outputDir: 'docs/api',
      templateDir: 'templates',
      ...options
    };
  }

  async generate() {
    console.log('Generating documentation...');

    // Get all source files
    const files = glob.sync(`${this.options.sourceDir}/**/*.js`);

    // Group by module
    const modules = this.groupByModule(files);

    // Generate docs for each module
    for (const [moduleName, moduleFiles] of Object.entries(modules)) {
      await this.generateModuleDocs(moduleName, moduleFiles);
    }

    // Generate index
    await this.generateIndex(Object.keys(modules));

    console.log('Documentation generated successfully!');
  }

  groupByModule(files) {
    const modules = {};

    for (const file of files) {
      const relativePath = path.relative(this.options.sourceDir, file);
      const moduleName = path.dirname(relativePath).split(path.sep)[0] || 'core';

      modules[moduleName] = modules[moduleName] || [];
      modules[moduleName].push(file);
    }

    return modules;
  }

  async generateModuleDocs(moduleName, files) {
    const output = await jsdoc2md.render({
      files,
      configure: './jsdoc.json',
      template: await fs.readFile(
        path.join(this.options.templateDir, 'module.hbs'),
        'utf8'
      ),
      'heading-depth': 2
    });

    const outputPath = path.join(
      this.options.outputDir,
      `${moduleName}.md`
    );

    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, output);

    console.log(`Generated: ${outputPath}`);
  }

  async generateIndex(modules) {
    const index = `# API Reference

## Modules

${modules.map(m => `- [${m}](./${m}.md)`).join('\n')}

---

Generated on ${new Date().toISOString()}
`;

    await fs.writeFile(
      path.join(this.options.outputDir, 'README.md'),
      index
    );
  }
}

// CLI execution
if (require.main === module) {
  const generator = new DocsGenerator();
  generator.generate().catch(console.error);
}

module.exports = DocsGenerator;
```

## VSCode Integration

### settings.json
```json
{
  "javascript.suggest.completeJSDocs": true,
  "typescript.suggest.completeJSDocs": true,
  "editor.quickSuggestions": {
    "comments": true
  },
  "[javascript]": {
    "editor.formatOnSave": true
  },
  "docthis.includeDescriptionTag": true,
  "docthis.includeAuthorTag": true,
  "docthis.authorName": "Development Team"
}
```

### ESLint JSDoc Plugin
```javascript
// .eslintrc.js
module.exports = {
  plugins: ['jsdoc'],
  extends: ['plugin:jsdoc/recommended'],
  rules: {
    'jsdoc/require-description': 'warn',
    'jsdoc/require-param-description': 'warn',
    'jsdoc/require-returns-description': 'warn',
    'jsdoc/require-example': 'off',
    'jsdoc/check-alignment': 'error',
    'jsdoc/check-indentation': 'warn',
    'jsdoc/check-param-names': 'error',
    'jsdoc/check-tag-names': 'error',
    'jsdoc/check-types': 'error',
    'jsdoc/no-undefined-types': ['error', {
      definedTypes: ['Promise', 'Record', 'Partial', 'Pick']
    }],
    'jsdoc/require-jsdoc': ['warn', {
      require: {
        FunctionDeclaration: true,
        MethodDefinition: true,
        ClassDeclaration: true,
        ArrowFunctionExpression: false,
        FunctionExpression: false
      },
      contexts: [
        'ExportDefaultDeclaration',
        'ExportNamedDeclaration'
      ]
    }],
    'jsdoc/tag-lines': ['warn', 'any', { startLines: 1 }],
    'jsdoc/valid-types': 'error'
  },
  settings: {
    jsdoc: {
      tagNamePreference: {
        returns: 'returns',
        augments: 'extends'
      },
      preferredTypes: {
        object: 'Object',
        array: 'Array',
        function: 'Function'
      }
    }
  }
};
```

## Express API Documentation

```javascript
/**
 * User management REST API routes.
 * @module routes/users
 * @requires express
 * @requires ../services/user-service
 */

const express = require('express');
const router = express.Router();
const userService = require('../services/user-service');

/**
 * @api {get} /users List all users
 * @apiName GetUsers
 * @apiGroup Users
 * @apiPermission admin
 *
 * @param {express.Request} req - Express request object.
 * @param {express.Response} res - Express response object.
 * @returns {void}
 *
 * @example
 * // GET /api/users?page=1&limit=20
 * // Response: { users: [...], total: 100, page: 1, pages: 5 }
 */
router.get('/', async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const result = await userService.list({ page, limit });
  res.json(result);
});

/**
 * @api {get} /users/:id Get user by ID
 * @apiName GetUser
 * @apiGroup Users
 *
 * @param {express.Request} req - Express request with user ID.
 * @param {string} req.params.id - The user's unique identifier.
 * @param {express.Response} res - Express response object.
 * @returns {void}
 *
 * @throws {NotFoundError} When user doesn't exist.
 *
 * @example
 * // GET /api/users/123
 * // Response: { id: '123', name: 'John', email: 'john@example.com' }
 */
router.get('/:id', async (req, res) => {
  const user = await userService.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

/**
 * @api {post} /users Create new user
 * @apiName CreateUser
 * @apiGroup Users
 * @apiPermission admin
 *
 * @param {express.Request} req - Express request with user data.
 * @param {UserCreateDTO} req.body - The user creation data.
 * @param {string} req.body.name - User's display name.
 * @param {string} req.body.email - User's email address.
 * @param {string} req.body.password - User's password.
 * @param {express.Response} res - Express response object.
 * @returns {void}
 *
 * @throws {ValidationError} When required fields are missing.
 * @throws {ConflictError} When email already exists.
 */
router.post('/', async (req, res) => {
  const user = await userService.create(req.body);
  res.status(201).json(user);
});

module.exports = router;
```

## CLAUDE.md Integration

```markdown
## JSDoc Documentation

### Commenting Standards
- All exported functions must have JSDoc comments
- Include @param, @returns, and @throws tags
- Add @example for complex functions
- Use @see for related functions

### Custom Tags
- @api - REST endpoint definition
- @permission - Required permissions
- @complexity - Time/space complexity
- @tested - Test coverage status

### Generation Commands
- `npm run docs` - Generate HTML docs
- `npm run docs:md` - Generate markdown
- `npm run docs:watch` - Watch mode

### Type Definitions
- Define types with @typedef
- Use @template for generics
- Document callback signatures
```

## AI Suggestions

1. **Auto-generate JSDoc** - Generate comments from function signatures
2. **Type inference** - Suggest types from usage patterns
3. **Example generation** - Create examples from test cases
4. **Missing docs detection** - Find undocumented exports
5. **Tag validation** - Verify JSDoc tags match implementation
6. **Link verification** - Check @see and @link references
7. **Deprecation tracking** - Find uses of deprecated functions
8. **Coverage reporting** - Calculate documentation coverage
9. **Template expansion** - Expand JSDoc from shorthand
10. **Cross-reference builder** - Build module dependency graphs
