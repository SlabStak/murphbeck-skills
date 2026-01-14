# Code Comments Template

## Overview
Comprehensive code commenting standards and tools for maintainable, self-documenting code with automated comment generation.

## Quick Start
```bash
npm install better-comments eslint-plugin-jsdoc
pip install pydocstyle docformatter
```

## Comment Standards

### TypeScript/JavaScript Comments
```typescript
// src/services/user.service.ts

/**
 * User management service handling CRUD operations and authentication.
 *
 * @module UserService
 * @category Services
 */

import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User, CreateUserDTO, UpdateUserDTO } from './user.types';

/**
 * Service class for user management operations.
 *
 * Handles user CRUD, authentication, and profile management.
 * All methods are transactional and include audit logging.
 *
 * @example
 * ```typescript
 * const userService = new UserService(userRepository);
 * const user = await userService.create({ email: 'user@example.com' });
 * ```
 */
@Injectable()
export class UserService {
  /**
   * Creates a new UserService instance.
   *
   * @param userRepository - TypeORM repository for User entity
   * @param cacheService - Redis cache service for query caching
   * @param eventBus - Event bus for publishing domain events
   */
  constructor(
    private readonly userRepository: Repository<User>,
    private readonly cacheService: CacheService,
    private readonly eventBus: EventBus
  ) {}

  /**
   * Creates a new user in the system.
   *
   * Validates the input data, checks for existing users with the same email,
   * hashes the password, and creates the user record. Publishes a UserCreated
   * event on successful creation.
   *
   * @param data - User creation data
   * @returns The newly created user (without password)
   * @throws {ValidationError} If required fields are missing
   * @throws {ConflictError} If email is already registered
   *
   * @example
   * ```typescript
   * const user = await userService.create({
   *   email: 'new@example.com',
   *   password: 'SecurePass123!',
   *   name: 'John Doe'
   * });
   * ```
   */
  async create(data: CreateUserDTO): Promise<User> {
    // Validate email format and check for duplicates
    await this.validateUniqueEmail(data.email);

    // Hash password using bcrypt with cost factor 12
    // Higher cost = more secure but slower
    const hashedPassword = await this.hashPassword(data.password);

    // Create user entity with hashed password
    const user = this.userRepository.create({
      ...data,
      password: hashedPassword,
      // Set default values for new users
      isActive: true,
      emailVerified: false,
      createdAt: new Date()
    });

    // Save to database within a transaction
    const savedUser = await this.userRepository.save(user);

    // Publish domain event for other services
    // NOTE: Event handlers run asynchronously
    await this.eventBus.publish(new UserCreatedEvent(savedUser));

    // Invalidate any cached user lists
    await this.cacheService.invalidate('users:*');

    // Return user without sensitive fields
    return this.sanitizeUser(savedUser);
  }

  /**
   * Finds a user by their unique identifier.
   *
   * Uses Redis cache with 5-minute TTL to reduce database load.
   * Returns null if user is not found (does not throw).
   *
   * @param id - The user's UUID
   * @returns The user if found, null otherwise
   *
   * @remarks
   * This method is heavily used by authentication middleware.
   * Performance is critical - always check cache before database.
   */
  async findById(id: string): Promise<User | null> {
    // Check cache first for performance
    const cacheKey = `user:${id}`;
    const cached = await this.cacheService.get<User>(cacheKey);

    if (cached) {
      return cached;
    }

    // Query database if not in cache
    const user = await this.userRepository.findOne({
      where: { id },
      // Include related entities needed for auth
      relations: ['roles', 'permissions']
    });

    if (user) {
      // Cache for 5 minutes
      // TRADEOFF: Stale data vs. database load
      await this.cacheService.set(cacheKey, user, 300);
    }

    return user;
  }

  /**
   * Updates a user's profile information.
   *
   * Performs partial update - only provided fields are modified.
   * Validates ownership or admin permission before updating.
   *
   * @param id - The user's UUID
   * @param data - Fields to update
   * @param requesterId - ID of user making the request
   * @returns The updated user
   * @throws {NotFoundError} If user doesn't exist
   * @throws {ForbiddenError} If requester lacks permission
   *
   * @todo Add rate limiting for profile updates
   * @todo Implement email change verification flow
   */
  async update(
    id: string,
    data: UpdateUserDTO,
    requesterId: string
  ): Promise<User> {
    // Verify user exists
    const user = await this.findByIdOrFail(id);

    // Check authorization
    // Users can update own profile, admins can update anyone
    await this.authorizeUpdate(user, requesterId);

    // IMPORTANT: Never allow password update through this method
    // Use dedicated changePassword() for security
    const { password, ...safeData } = data;

    // Merge and save changes
    const updated = await this.userRepository.save({
      ...user,
      ...safeData,
      updatedAt: new Date()
    });

    // Invalidate cache for this user
    await this.cacheService.delete(`user:${id}`);

    return this.sanitizeUser(updated);
  }

  /**
   * Soft-deletes a user account.
   *
   * Sets isActive to false rather than removing the record.
   * User data is retained for audit and can be restored.
   *
   * @param id - The user's UUID
   * @param requesterId - ID of user making the request
   * @throws {NotFoundError} If user doesn't exist
   * @throws {ForbiddenError} If attempting to delete self or lacking permission
   *
   * @deprecated Use deactivate() instead - will be removed in v3.0
   * @see {@link deactivate} for the replacement method
   */
  async delete(id: string, requesterId: string): Promise<void> {
    // WARNING: This method is deprecated
    // Keeping for backwards compatibility until v3.0
    console.warn('delete() is deprecated, use deactivate() instead');

    const user = await this.findByIdOrFail(id);

    // Prevent self-deletion to avoid orphaned resources
    if (id === requesterId) {
      throw new ForbiddenError('Cannot delete your own account');
    }

    // Soft delete by setting inactive
    user.isActive = false;
    user.deletedAt = new Date();

    await this.userRepository.save(user);
    await this.eventBus.publish(new UserDeletedEvent(user));
  }

  // ============================================================
  // PRIVATE METHODS
  // ============================================================

  /**
   * Validates that an email is not already registered.
   * @internal
   */
  private async validateUniqueEmail(email: string): Promise<void> {
    const existing = await this.userRepository.findOne({
      where: { email: email.toLowerCase() }
    });

    if (existing) {
      throw new ConflictError(`Email ${email} is already registered`);
    }
  }

  /**
   * Hashes a password using bcrypt.
   *
   * Uses cost factor 12 as recommended by OWASP.
   * Takes ~250ms on modern hardware.
   *
   * @internal
   */
  private async hashPassword(password: string): Promise<string> {
    const BCRYPT_COST = 12; // OWASP recommended minimum
    return bcrypt.hash(password, BCRYPT_COST);
  }

  /**
   * Removes sensitive fields from user object.
   * @internal
   */
  private sanitizeUser(user: User): User {
    const { password, resetToken, ...safe } = user;
    return safe as User;
  }
}

// ============================================================
// TYPE DEFINITIONS
// ============================================================

/**
 * User roles for authorization.
 * @readonly
 * @enum {string}
 */
export const UserRole = {
  /** Standard user with basic permissions */
  USER: 'user',
  /** Moderator with content management permissions */
  MODERATOR: 'moderator',
  /** Administrator with full system access */
  ADMIN: 'admin'
} as const;
```

### Python Comments
```python
# src/services/user_service.py
"""
User management service module.

This module provides the UserService class for managing user accounts,
including CRUD operations, authentication, and profile management.

Example:
    Basic usage::

        from services import UserService

        service = UserService(repository, cache)
        user = await service.create_user(email="user@example.com")

Attributes:
    DEFAULT_PAGE_SIZE (int): Default pagination size (20).
    MAX_PAGE_SIZE (int): Maximum allowed page size (100).

Note:
    All service methods are async and should be awaited.

.. versionadded:: 1.0.0
.. versionchanged:: 2.0.0
    Added caching support.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING

if TYPE_CHECKING:
    from .repository import UserRepository
    from .cache import CacheService

# Module-level logger
logger = logging.getLogger(__name__)

# Constants
# NOTE: These can be overridden in config
DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100


@dataclass
class UserCreateDTO:
    """Data transfer object for user creation.

    Attributes:
        email: User's email address (must be unique).
        password: Plain text password (will be hashed).
        name: User's display name.
        role: User role, defaults to 'user'.

    Example:
        >>> dto = UserCreateDTO(
        ...     email="user@example.com",
        ...     password="SecurePass123!",
        ...     name="John Doe"
        ... )

    Note:
        Password must meet complexity requirements:
        - Minimum 8 characters
        - At least one uppercase letter
        - At least one number
        - At least one special character
    """
    email: str
    password: str
    name: str
    role: str = "user"


class UserService:
    """Service class for user management operations.

    This service handles all user-related business logic including
    creation, updates, authentication, and authorization.

    Args:
        repository: Database repository for user persistence.
        cache: Redis cache service for query optimization.
        event_bus: Event bus for publishing domain events.

    Attributes:
        repository (UserRepository): The user repository instance.
        cache (CacheService): The cache service instance.

    Example:
        >>> repo = UserRepository(session)
        >>> cache = CacheService(redis_client)
        >>> service = UserService(repo, cache)
        >>> user = await service.create_user(dto)

    Note:
        This service should be instantiated once per request
        or as a singleton in the dependency injection container.

    See Also:
        :class:`UserRepository`: Database operations
        :class:`User`: User entity model

    .. versionadded:: 1.0.0
    """

    def __init__(
        self,
        repository: "UserRepository",
        cache: "CacheService",
        event_bus: Optional["EventBus"] = None
    ) -> None:
        """Initialize the UserService.

        Args:
            repository: User repository for database operations.
            cache: Cache service for Redis operations.
            event_bus: Optional event bus for domain events.
        """
        self._repository = repository
        self._cache = cache
        self._event_bus = event_bus

        # Log initialization
        logger.info("UserService initialized")

    async def create_user(self, data: UserCreateDTO) -> User:
        """Create a new user in the system.

        This method validates the input, checks for duplicate emails,
        hashes the password, and persists the user to the database.

        Args:
            data: User creation data transfer object.

        Returns:
            The newly created user entity.

        Raises:
            ValidationError: If input validation fails.
            ConflictError: If email is already registered.
            DatabaseError: If persistence fails.

        Example:
            >>> dto = UserCreateDTO(
            ...     email="new@example.com",
            ...     password="SecurePass123!",
            ...     name="Jane Doe"
            ... )
            >>> user = await service.create_user(dto)
            >>> print(user.id)
            'uuid-string'

        Note:
            The password is never stored in plain text.
            We use bcrypt with cost factor 12.

        Warning:
            This method does not verify the email address.
            Send verification email after creation.

        .. versionadded:: 1.0.0
        .. versionchanged:: 2.0.0
            Added event publishing.
        """
        # Validate input data
        # TODO: Move validation to a separate validator class
        self._validate_create_data(data)

        # Check for existing user with same email
        # IMPORTANT: Email comparison is case-insensitive
        existing = await self._repository.find_by_email(data.email.lower())
        if existing:
            logger.warning(f"Duplicate email attempt: {data.email}")
            raise ConflictError(f"Email {data.email} already registered")

        # Hash password before storage
        # SECURITY: Never log passwords, even hashed ones
        hashed_password = await self._hash_password(data.password)

        # Create user entity
        user = User(
            email=data.email.lower(),
            password_hash=hashed_password,
            name=data.name,
            role=data.role,
            is_active=True,
            email_verified=False,
            created_at=datetime.utcnow()
        )

        # Persist to database
        saved_user = await self._repository.save(user)
        logger.info(f"Created user: {saved_user.id}")

        # Publish domain event
        # NOTE: Event handlers run asynchronously
        if self._event_bus:
            await self._event_bus.publish(
                UserCreatedEvent(user_id=saved_user.id)
            )

        # Invalidate cache
        await self._invalidate_user_cache()

        return saved_user

    async def get_user_by_id(self, user_id: str) -> Optional[User]:
        """Retrieve a user by their unique identifier.

        Uses Redis cache to minimize database queries.
        Cache TTL is 5 minutes.

        Args:
            user_id: The user's UUID string.

        Returns:
            The user if found, None otherwise.

        Example:
            >>> user = await service.get_user_by_id("uuid-string")
            >>> if user:
            ...     print(user.name)

        Note:
            This method does not raise an exception if the user
            is not found. Use :meth:`get_user_by_id_or_fail` if
            you need an exception.
        """
        # Check cache first
        cache_key = f"user:{user_id}"
        cached = await self._cache.get(cache_key)

        if cached:
            logger.debug(f"Cache hit for user {user_id}")
            return cached

        # Query database
        user = await self._repository.find_by_id(user_id)

        if user:
            # Cache for 5 minutes
            # TRADEOFF: Staleness vs. performance
            await self._cache.set(cache_key, user, ttl=300)

        return user

    async def update_user(
        self,
        user_id: str,
        updates: dict,
        *,
        requester_id: str
    ) -> User:
        """Update a user's information.

        Performs partial update - only provided fields are modified.
        Validates that the requester has permission to update.

        Args:
            user_id: ID of the user to update.
            updates: Dictionary of fields to update.
            requester_id: ID of the user making the request.
                Keyword-only to prevent positional argument errors.

        Returns:
            The updated user entity.

        Raises:
            NotFoundError: If user doesn't exist.
            ForbiddenError: If requester lacks permission.
            ValidationError: If updates contain invalid data.

        Example:
            >>> updated = await service.update_user(
            ...     user_id="uuid",
            ...     updates={"name": "New Name"},
            ...     requester_id="admin-uuid"
            ... )

        Warning:
            Password cannot be updated through this method.
            Use :meth:`change_password` instead.

        Todo:
            * Add support for batch updates
            * Implement optimistic locking
        """
        # Fetch existing user
        user = await self.get_user_by_id_or_fail(user_id)

        # Authorization check
        # Users can update own profile; admins can update anyone
        if user_id != requester_id:
            await self._authorize_admin(requester_id)

        # SECURITY: Never allow password update here
        if "password" in updates or "password_hash" in updates:
            raise ValidationError(
                "Password cannot be updated through this method"
            )

        # Apply updates
        for key, value in updates.items():
            if hasattr(user, key):
                setattr(user, key, value)

        user.updated_at = datetime.utcnow()

        # Save and invalidate cache
        saved = await self._repository.save(user)
        await self._cache.delete(f"user:{user_id}")

        return saved

    # --------------------------------------------------------
    # Private Methods
    # --------------------------------------------------------

    def _validate_create_data(self, data: UserCreateDTO) -> None:
        """Validate user creation data.

        Internal method - not part of public API.
        """
        # Email format validation
        if not self._is_valid_email(data.email):
            raise ValidationError("Invalid email format")

        # Password complexity
        if not self._is_strong_password(data.password):
            raise ValidationError(
                "Password must be at least 8 characters with "
                "uppercase, lowercase, number, and special character"
            )

    async def _hash_password(self, password: str) -> str:
        """Hash a password using bcrypt.

        Internal method - NEVER log the input or output.
        """
        import bcrypt
        # Cost factor 12 as recommended by OWASP
        salt = bcrypt.gensalt(rounds=12)
        return bcrypt.hashpw(password.encode(), salt).decode()

    @staticmethod
    def _is_valid_email(email: str) -> bool:
        """Check if email format is valid."""
        import re
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email))
```

### Better Comments Configuration
```json
// .vscode/settings.json
{
  "better-comments.tags": [
    {
      "tag": "!",
      "color": "#FF2D00",
      "strikethrough": false,
      "underline": false,
      "backgroundColor": "transparent",
      "bold": true,
      "italic": false
    },
    {
      "tag": "?",
      "color": "#3498DB",
      "strikethrough": false,
      "underline": false,
      "backgroundColor": "transparent",
      "bold": false,
      "italic": false
    },
    {
      "tag": "//",
      "color": "#474747",
      "strikethrough": true,
      "underline": false,
      "backgroundColor": "transparent",
      "bold": false,
      "italic": false
    },
    {
      "tag": "TODO",
      "color": "#FF8C00",
      "strikethrough": false,
      "underline": false,
      "backgroundColor": "transparent",
      "bold": true,
      "italic": false
    },
    {
      "tag": "FIXME",
      "color": "#FF2D00",
      "strikethrough": false,
      "underline": false,
      "backgroundColor": "transparent",
      "bold": true,
      "italic": false
    },
    {
      "tag": "NOTE",
      "color": "#98C379",
      "strikethrough": false,
      "underline": false,
      "backgroundColor": "transparent",
      "bold": false,
      "italic": true
    },
    {
      "tag": "HACK",
      "color": "#FF8C00",
      "strikethrough": false,
      "underline": false,
      "backgroundColor": "transparent",
      "bold": true,
      "italic": false
    },
    {
      "tag": "SECURITY",
      "color": "#FF2D00",
      "strikethrough": false,
      "underline": true,
      "backgroundColor": "transparent",
      "bold": true,
      "italic": false
    },
    {
      "tag": "PERF",
      "color": "#A855F7",
      "strikethrough": false,
      "underline": false,
      "backgroundColor": "transparent",
      "bold": false,
      "italic": false
    }
  ]
}
```

## Comment Generation Tool

```typescript
// tools/comment-generator.ts
import * as ts from 'typescript';
import * as fs from 'fs';

interface GeneratedComment {
  line: number;
  comment: string;
}

class CommentGenerator {
  /**
   * Generates JSDoc comments for functions lacking documentation.
   */
  generateForFile(filePath: string): GeneratedComment[] {
    const sourceCode = fs.readFileSync(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(
      filePath,
      sourceCode,
      ts.ScriptTarget.Latest,
      true
    );

    const comments: GeneratedComment[] = [];

    const visit = (node: ts.Node) => {
      if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) {
        if (!this.hasJSDoc(node, sourceFile)) {
          const comment = this.generateFunctionComment(node, sourceFile);
          comments.push({
            line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line,
            comment
          });
        }
      }
      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return comments;
  }

  private hasJSDoc(node: ts.Node, sourceFile: ts.SourceFile): boolean {
    const text = sourceFile.getFullText();
    const commentRanges = ts.getLeadingCommentRanges(text, node.pos);

    if (!commentRanges) return false;

    return commentRanges.some(range => {
      const comment = text.slice(range.pos, range.end);
      return comment.startsWith('/**');
    });
  }

  private generateFunctionComment(
    node: ts.FunctionDeclaration | ts.MethodDeclaration,
    sourceFile: ts.SourceFile
  ): string {
    const name = node.name?.getText(sourceFile) || 'anonymous';
    const params = node.parameters.map(p => ({
      name: p.name.getText(sourceFile),
      type: p.type?.getText(sourceFile) || 'any',
      optional: !!p.questionToken
    }));

    const returnType = node.type?.getText(sourceFile) || 'void';

    let comment = `/**\n * ${this.generateDescription(name)}.\n *\n`;

    for (const param of params) {
      const optionalMark = param.optional ? ' (optional)' : '';
      comment += ` * @param ${param.name} - Description${optionalMark}\n`;
    }

    if (returnType !== 'void') {
      comment += ` * @returns Description\n`;
    }

    comment += ` */`;
    return comment;
  }

  private generateDescription(name: string): string {
    // Convert camelCase to words
    const words = name.replace(/([A-Z])/g, ' $1').toLowerCase().trim();
    return words.charAt(0).toUpperCase() + words.slice(1);
  }
}
```

## CLAUDE.md Integration

```markdown
## Code Comments Standards

### Comment Types
- `//` - Inline explanations
- `/* */` - Block comments
- `/** */` - Documentation (JSDoc/TSDoc)
- `#` - Python comments
- `"""` - Python docstrings

### Special Tags
- TODO - Future tasks
- FIXME - Known issues to fix
- NOTE - Important information
- HACK - Temporary workarounds
- SECURITY - Security-sensitive code
- PERF - Performance considerations

### When to Comment
- Complex algorithms
- Non-obvious business logic
- API contracts and interfaces
- Configuration options
- Security-critical code

### When NOT to Comment
- Self-explanatory code
- Redundant descriptions
- Obvious operations
- Commented-out code (delete it)
```

## AI Suggestions

1. **Auto-generate comments** - Generate JSDoc from signatures
2. **Comment quality check** - Validate comment completeness
3. **TODO tracking** - Extract and track TODO comments
4. **Deprecated detection** - Find deprecated code usage
5. **Comment formatting** - Enforce consistent style
6. **Translation support** - Multi-language comments
7. **Stale comment detection** - Find outdated comments
8. **Security review** - Flag SECURITY comments
9. **Documentation coverage** - Measure comment coverage
10. **Comment extraction** - Generate docs from comments
