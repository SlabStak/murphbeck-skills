# SQLAlchemy Template (Python)

Production-ready SQLAlchemy 2.0 setup with async support, Alembic migrations, type annotations, and repository pattern for Python applications.

## Installation

```bash
pip install sqlalchemy[asyncio] alembic asyncpg psycopg2-binary python-dotenv pydantic
```

## Environment Variables

```env
# .env
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/myapp
DATABASE_SYNC_URL=postgresql+psycopg2://user:password@localhost:5432/myapp
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=10
DATABASE_POOL_TIMEOUT=30
DATABASE_ECHO=false
```

## Project Structure

```
src/
├── db/
│   ├── __init__.py
│   ├── base.py              # Base model class
│   ├── session.py           # Session management
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── post.py
│   │   └── mixins.py
│   └── repositories/
│       ├── __init__.py
│       ├── base.py
│       ├── user.py
│       └── post.py
├── schemas/
│   ├── __init__.py
│   ├── user.py
│   └── post.py
├── services/
│   ├── __init__.py
│   └── user.py
└── alembic/
    ├── env.py
    ├── script.py.mako
    └── versions/
```

## Session Management

```python
# src/db/session.py
import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
DATABASE_SYNC_URL = os.getenv("DATABASE_SYNC_URL")
DATABASE_POOL_SIZE = int(os.getenv("DATABASE_POOL_SIZE", "20"))
DATABASE_MAX_OVERFLOW = int(os.getenv("DATABASE_MAX_OVERFLOW", "10"))
DATABASE_POOL_TIMEOUT = int(os.getenv("DATABASE_POOL_TIMEOUT", "30"))
DATABASE_ECHO = os.getenv("DATABASE_ECHO", "false").lower() == "true"

# Async engine
async_engine = create_async_engine(
    DATABASE_URL,
    echo=DATABASE_ECHO,
    pool_size=DATABASE_POOL_SIZE,
    max_overflow=DATABASE_MAX_OVERFLOW,
    pool_timeout=DATABASE_POOL_TIMEOUT,
    pool_pre_ping=True,
    pool_recycle=3600,
)

# Async session factory
AsyncSessionLocal = async_sessionmaker(
    async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Sync engine (for Alembic and sync operations)
sync_engine = create_engine(
    DATABASE_SYNC_URL,
    echo=DATABASE_ECHO,
    pool_size=DATABASE_POOL_SIZE,
    max_overflow=DATABASE_MAX_OVERFLOW,
    pool_timeout=DATABASE_POOL_TIMEOUT,
    pool_pre_ping=True,
)

# Sync session factory
SyncSessionLocal = sessionmaker(
    sync_engine,
    class_=Session,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


@asynccontextmanager
async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    """Async context manager for database sessions."""
    session = AsyncSessionLocal()
    try:
        yield session
        await session.commit()
    except Exception:
        await session.rollback()
        raise
    finally:
        await session.close()


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for FastAPI."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


def get_sync_session() -> Session:
    """Get sync session for migrations."""
    return SyncSessionLocal()


async def check_connection() -> bool:
    """Check database connection health."""
    try:
        async with async_engine.connect() as conn:
            await conn.execute("SELECT 1")
        return True
    except Exception as e:
        print(f"Database connection failed: {e}")
        return False


async def close_connections():
    """Close all database connections."""
    await async_engine.dispose()
```

## Base Model

```python
# src/db/base.py
from datetime import datetime
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import DateTime, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """Base class for all models."""

    __abstract__ = True

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    def to_dict(self) -> dict[str, Any]:
        """Convert model to dictionary."""
        return {
            column.name: getattr(self, column.name)
            for column in self.__table__.columns
        }


class SoftDeleteMixin:
    """Mixin for soft delete functionality."""

    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        default=None,
    )

    @property
    def is_deleted(self) -> bool:
        return self.deleted_at is not None


class TimestampMixin:
    """Mixin for timestamp fields."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
```

## Model Definitions

```python
# src/db/models/user.py
from datetime import datetime
from typing import TYPE_CHECKING, Optional
from uuid import UUID

from sqlalchemy import Boolean, Enum, String, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..base import Base, SoftDeleteMixin

if TYPE_CHECKING:
    from .post import Post


class UserRole(str, Enum):
    ADMIN = "admin"
    USER = "user"
    MODERATOR = "moderator"


class User(Base, SoftDeleteMixin):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )
    username: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False,
        index=True,
    )
    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    role: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="user",
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    # Profile fields
    display_name: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
    )
    bio: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    avatar_url: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
    )

    # Settings as JSON
    settings: Mapped[dict] = mapped_column(
        JSON,
        nullable=False,
        default=dict,
    )

    # Timestamps
    last_login_at: Mapped[Optional[datetime]] = mapped_column(
        nullable=True,
    )
    email_verified_at: Mapped[Optional[datetime]] = mapped_column(
        nullable=True,
    )

    # Relationships
    posts: Mapped[list["Post"]] = relationship(
        "Post",
        back_populates="author",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<User {self.email}>"


# src/db/models/post.py
from datetime import datetime
from typing import TYPE_CHECKING, Optional
from uuid import UUID

from sqlalchemy import ForeignKey, String, Text, Integer, Enum
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..base import Base, SoftDeleteMixin

if TYPE_CHECKING:
    from .user import User


class PostStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class Post(Base, SoftDeleteMixin):
    __tablename__ = "posts"

    author_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    slug: Mapped[str] = mapped_column(
        String(300),
        unique=True,
        nullable=False,
        index=True,
    )
    content: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    excerpt: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="draft",
        index=True,
    )
    tags: Mapped[list[str]] = mapped_column(
        ARRAY(String),
        nullable=False,
        default=list,
    )

    # Stats
    view_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )
    like_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    # Timestamps
    published_at: Mapped[Optional[datetime]] = mapped_column(
        nullable=True,
    )

    # Relationships
    author: Mapped["User"] = relationship(
        "User",
        back_populates="posts",
        lazy="joined",
    )

    def __repr__(self) -> str:
        return f"<Post {self.slug}>"
```

## Pydantic Schemas

```python
# src/schemas/user.py
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, ConfigDict


class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(min_length=3, max_length=100)


class UserCreate(UserBase):
    password: str = Field(min_length=8)
    role: str = "user"
    display_name: Optional[str] = None


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = Field(None, min_length=3, max_length=100)
    display_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    settings: Optional[dict] = None


class UserInDB(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    role: str
    is_active: bool
    display_name: Optional[str]
    bio: Optional[str]
    avatar_url: Optional[str]
    settings: dict
    last_login_at: Optional[datetime]
    email_verified_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: str
    username: str
    role: str
    display_name: Optional[str]
    bio: Optional[str]
    avatar_url: Optional[str]
    created_at: datetime


# src/schemas/post.py
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict


class PostBase(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    content: str = Field(min_length=1)


class PostCreate(PostBase):
    excerpt: Optional[str] = None
    tags: list[str] = []


class PostUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    content: Optional[str] = Field(None, min_length=1)
    excerpt: Optional[str] = None
    tags: Optional[list[str]] = None
    status: Optional[str] = None


class PostInDB(PostBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    author_id: UUID
    slug: str
    excerpt: Optional[str]
    status: str
    tags: list[str]
    view_count: int
    like_count: int
    published_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime


class PostResponse(PostInDB):
    pass


class PostWithAuthor(PostResponse):
    author: "UserResponse"


from .user import UserResponse
PostWithAuthor.model_rebuild()
```

## Base Repository

```python
# src/db/repositories/base.py
from typing import Generic, TypeVar, Type, Optional, Sequence
from uuid import UUID

from sqlalchemy import select, update, delete, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..base import Base, SoftDeleteMixin

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    """Base repository with common CRUD operations."""

    def __init__(self, model: Type[ModelType], session: AsyncSession):
        self.model = model
        self.session = session

    async def get_by_id(
        self,
        id: UUID,
        include_deleted: bool = False,
    ) -> Optional[ModelType]:
        """Get a single record by ID."""
        query = select(self.model).where(self.model.id == id)

        if not include_deleted and issubclass(self.model, SoftDeleteMixin):
            query = query.where(self.model.deleted_at.is_(None))

        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_all(
        self,
        skip: int = 0,
        limit: int = 100,
        include_deleted: bool = False,
    ) -> Sequence[ModelType]:
        """Get all records with pagination."""
        query = select(self.model)

        if not include_deleted and issubclass(self.model, SoftDeleteMixin):
            query = query.where(self.model.deleted_at.is_(None))

        query = query.offset(skip).limit(limit)
        result = await self.session.execute(query)
        return result.scalars().all()

    async def create(self, obj_in: dict) -> ModelType:
        """Create a new record."""
        db_obj = self.model(**obj_in)
        self.session.add(db_obj)
        await self.session.flush()
        await self.session.refresh(db_obj)
        return db_obj

    async def create_many(self, objects: list[dict]) -> list[ModelType]:
        """Create multiple records."""
        db_objects = [self.model(**obj) for obj in objects]
        self.session.add_all(db_objects)
        await self.session.flush()
        for obj in db_objects:
            await self.session.refresh(obj)
        return db_objects

    async def update(
        self,
        id: UUID,
        obj_in: dict,
    ) -> Optional[ModelType]:
        """Update a record by ID."""
        db_obj = await self.get_by_id(id)
        if not db_obj:
            return None

        for field, value in obj_in.items():
            if hasattr(db_obj, field):
                setattr(db_obj, field, value)

        await self.session.flush()
        await self.session.refresh(db_obj)
        return db_obj

    async def delete(
        self,
        id: UUID,
        soft: bool = True,
    ) -> bool:
        """Delete a record by ID."""
        db_obj = await self.get_by_id(id)
        if not db_obj:
            return False

        if soft and issubclass(self.model, SoftDeleteMixin):
            from datetime import datetime
            db_obj.deleted_at = datetime.utcnow()
        else:
            await self.session.delete(db_obj)

        await self.session.flush()
        return True

    async def restore(self, id: UUID) -> Optional[ModelType]:
        """Restore a soft-deleted record."""
        if not issubclass(self.model, SoftDeleteMixin):
            return None

        db_obj = await self.get_by_id(id, include_deleted=True)
        if not db_obj or not db_obj.deleted_at:
            return None

        db_obj.deleted_at = None
        await self.session.flush()
        await self.session.refresh(db_obj)
        return db_obj

    async def count(self, include_deleted: bool = False) -> int:
        """Count all records."""
        query = select(func.count()).select_from(self.model)

        if not include_deleted and issubclass(self.model, SoftDeleteMixin):
            query = query.where(self.model.deleted_at.is_(None))

        result = await self.session.execute(query)
        return result.scalar() or 0

    async def exists(self, id: UUID) -> bool:
        """Check if a record exists."""
        query = select(func.count()).select_from(self.model).where(
            self.model.id == id
        )
        result = await self.session.execute(query)
        return (result.scalar() or 0) > 0
```

## User Repository

```python
# src/db/repositories/user.py
from datetime import datetime
from typing import Optional, Sequence
from uuid import UUID

from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.user import User
from .base import BaseRepository


class UserRepository(BaseRepository[User]):
    """Repository for User model."""

    def __init__(self, session: AsyncSession):
        super().__init__(User, session)

    async def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email."""
        query = select(User).where(
            User.email == email.lower(),
            User.deleted_at.is_(None),
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_by_username(self, username: str) -> Optional[User]:
        """Get user by username."""
        query = select(User).where(
            User.username == username,
            User.deleted_at.is_(None),
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_by_email_or_username(
        self,
        email: str,
        username: str,
    ) -> Optional[User]:
        """Get user by email or username."""
        query = select(User).where(
            or_(User.email == email.lower(), User.username == username),
            User.deleted_at.is_(None),
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def create(self, obj_in: dict) -> User:
        """Create user with normalized email."""
        obj_in["email"] = obj_in["email"].lower()
        return await super().create(obj_in)

    async def get_by_role(
        self,
        role: str,
        skip: int = 0,
        limit: int = 100,
    ) -> Sequence[User]:
        """Get users by role."""
        query = select(User).where(
            User.role == role,
            User.deleted_at.is_(None),
        ).offset(skip).limit(limit)
        result = await self.session.execute(query)
        return result.scalars().all()

    async def get_active_users(
        self,
        skip: int = 0,
        limit: int = 100,
    ) -> Sequence[User]:
        """Get active users."""
        query = select(User).where(
            User.is_active == True,
            User.deleted_at.is_(None),
        ).offset(skip).limit(limit)
        result = await self.session.execute(query)
        return result.scalars().all()

    async def update_last_login(self, id: UUID) -> Optional[User]:
        """Update user's last login timestamp."""
        return await self.update(id, {"last_login_at": datetime.utcnow()})

    async def verify_email(self, id: UUID) -> Optional[User]:
        """Mark user's email as verified."""
        return await self.update(id, {"email_verified_at": datetime.utcnow()})

    async def deactivate(self, id: UUID) -> Optional[User]:
        """Deactivate user."""
        return await self.update(id, {"is_active": False})

    async def activate(self, id: UUID) -> Optional[User]:
        """Activate user."""
        return await self.update(id, {"is_active": True})

    async def search(
        self,
        query: str,
        skip: int = 0,
        limit: int = 20,
    ) -> Sequence[User]:
        """Search users by email or username."""
        search_pattern = f"%{query}%"
        stmt = select(User).where(
            or_(
                User.email.ilike(search_pattern),
                User.username.ilike(search_pattern),
                User.display_name.ilike(search_pattern),
            ),
            User.deleted_at.is_(None),
        ).offset(skip).limit(limit)
        result = await self.session.execute(stmt)
        return result.scalars().all()
```

## Post Repository

```python
# src/db/repositories/post.py
from datetime import datetime
from typing import Optional, Sequence
from uuid import UUID
import re

from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..models.post import Post
from ..models.user import User
from .base import BaseRepository


class PostRepository(BaseRepository[Post]):
    """Repository for Post model."""

    def __init__(self, session: AsyncSession):
        super().__init__(Post, session)

    def _generate_slug(self, title: str) -> str:
        """Generate URL-friendly slug from title."""
        slug = title.lower()
        slug = re.sub(r'[^a-z0-9]+', '-', slug)
        slug = slug.strip('-')
        return slug[:100]

    async def create(self, obj_in: dict) -> Post:
        """Create post with generated slug."""
        if "slug" not in obj_in:
            obj_in["slug"] = self._generate_slug(obj_in["title"])
        return await super().create(obj_in)

    async def get_by_slug(self, slug: str) -> Optional[Post]:
        """Get post by slug."""
        query = select(Post).where(
            Post.slug == slug,
            Post.deleted_at.is_(None),
        ).options(selectinload(Post.author))
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_by_author(
        self,
        author_id: UUID,
        skip: int = 0,
        limit: int = 20,
    ) -> Sequence[Post]:
        """Get posts by author."""
        query = select(Post).where(
            Post.author_id == author_id,
            Post.deleted_at.is_(None),
        ).order_by(Post.created_at.desc()).offset(skip).limit(limit)
        result = await self.session.execute(query)
        return result.scalars().all()

    async def get_published(
        self,
        skip: int = 0,
        limit: int = 20,
    ) -> Sequence[Post]:
        """Get published posts."""
        query = select(Post).where(
            Post.status == "published",
            Post.deleted_at.is_(None),
        ).options(
            selectinload(Post.author)
        ).order_by(Post.published_at.desc()).offset(skip).limit(limit)
        result = await self.session.execute(query)
        return result.scalars().all()

    async def get_by_tag(
        self,
        tag: str,
        skip: int = 0,
        limit: int = 20,
    ) -> Sequence[Post]:
        """Get posts by tag."""
        query = select(Post).where(
            Post.tags.contains([tag]),
            Post.status == "published",
            Post.deleted_at.is_(None),
        ).order_by(Post.published_at.desc()).offset(skip).limit(limit)
        result = await self.session.execute(query)
        return result.scalars().all()

    async def publish(self, id: UUID) -> Optional[Post]:
        """Publish a post."""
        return await self.update(id, {
            "status": "published",
            "published_at": datetime.utcnow(),
        })

    async def archive(self, id: UUID) -> Optional[Post]:
        """Archive a post."""
        return await self.update(id, {"status": "archived"})

    async def increment_views(self, id: UUID) -> None:
        """Increment view count."""
        query = select(Post).where(Post.id == id)
        result = await self.session.execute(query)
        post = result.scalar_one_or_none()
        if post:
            post.view_count += 1
            await self.session.flush()

    async def increment_likes(self, id: UUID) -> None:
        """Increment like count."""
        query = select(Post).where(Post.id == id)
        result = await self.session.execute(query)
        post = result.scalar_one_or_none()
        if post:
            post.like_count += 1
            await self.session.flush()

    async def decrement_likes(self, id: UUID) -> None:
        """Decrement like count."""
        query = select(Post).where(Post.id == id)
        result = await self.session.execute(query)
        post = result.scalar_one_or_none()
        if post and post.like_count > 0:
            post.like_count -= 1
            await self.session.flush()

    async def get_trending(
        self,
        days: int = 7,
        limit: int = 10,
    ) -> Sequence[Post]:
        """Get trending posts based on engagement."""
        from datetime import timedelta
        cutoff = datetime.utcnow() - timedelta(days=days)

        query = select(Post).where(
            Post.status == "published",
            Post.published_at >= cutoff,
            Post.deleted_at.is_(None),
        ).order_by(
            (Post.view_count + Post.like_count * 5).desc()
        ).options(
            selectinload(Post.author)
        ).limit(limit)

        result = await self.session.execute(query)
        return result.scalars().all()

    async def search(
        self,
        query: str,
        skip: int = 0,
        limit: int = 20,
    ) -> Sequence[Post]:
        """Search posts by title or content."""
        search_pattern = f"%{query}%"
        stmt = select(Post).where(
            or_(
                Post.title.ilike(search_pattern),
                Post.content.ilike(search_pattern),
            ),
            Post.status == "published",
            Post.deleted_at.is_(None),
        ).options(
            selectinload(Post.author)
        ).offset(skip).limit(limit)
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def get_stats(self) -> dict:
        """Get post statistics."""
        query = select(
            Post.status,
            func.count(Post.id).label("count"),
            func.sum(Post.view_count).label("total_views"),
            func.sum(Post.like_count).label("total_likes"),
        ).where(
            Post.deleted_at.is_(None)
        ).group_by(Post.status)

        result = await self.session.execute(query)
        rows = result.all()

        stats = {}
        for row in rows:
            stats[row.status] = {
                "count": row.count,
                "total_views": row.total_views or 0,
                "total_likes": row.total_likes or 0,
            }
        return stats
```

## User Service

```python
# src/services/user.py
from typing import Optional
from uuid import UUID

from passlib.context import CryptContext

from ..db.session import get_async_session
from ..db.repositories.user import UserRepository
from ..db.models.user import User
from ..schemas.user import UserCreate, UserUpdate, UserResponse


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class UserService:
    """Service layer for user operations."""

    @staticmethod
    def hash_password(password: str) -> str:
        return pwd_context.hash(password)

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        return pwd_context.verify(plain_password, hashed_password)

    @staticmethod
    async def create_user(user_data: UserCreate) -> User:
        """Create a new user."""
        async with get_async_session() as session:
            repo = UserRepository(session)

            # Check if email or username exists
            existing = await repo.get_by_email_or_username(
                user_data.email,
                user_data.username,
            )
            if existing:
                raise ValueError("Email or username already exists")

            # Create user
            user_dict = user_data.model_dump(exclude={"password"})
            user_dict["password_hash"] = UserService.hash_password(user_data.password)
            user_dict["settings"] = {"theme": "system", "language": "en"}

            user = await repo.create(user_dict)
            return user

    @staticmethod
    async def get_user(user_id: UUID) -> Optional[User]:
        """Get user by ID."""
        async with get_async_session() as session:
            repo = UserRepository(session)
            return await repo.get_by_id(user_id)

    @staticmethod
    async def get_by_email(email: str) -> Optional[User]:
        """Get user by email."""
        async with get_async_session() as session:
            repo = UserRepository(session)
            return await repo.get_by_email(email)

    @staticmethod
    async def update_user(user_id: UUID, user_data: UserUpdate) -> Optional[User]:
        """Update user."""
        async with get_async_session() as session:
            repo = UserRepository(session)
            update_dict = user_data.model_dump(exclude_unset=True)
            return await repo.update(user_id, update_dict)

    @staticmethod
    async def delete_user(user_id: UUID, hard: bool = False) -> bool:
        """Delete user."""
        async with get_async_session() as session:
            repo = UserRepository(session)
            return await repo.delete(user_id, soft=not hard)

    @staticmethod
    async def authenticate(email: str, password: str) -> Optional[User]:
        """Authenticate user with email and password."""
        async with get_async_session() as session:
            repo = UserRepository(session)
            user = await repo.get_by_email(email)

            if not user:
                return None

            if not UserService.verify_password(password, user.password_hash):
                return None

            if not user.is_active:
                return None

            # Update last login
            await repo.update_last_login(user.id)

            return user

    @staticmethod
    async def search_users(query: str, skip: int = 0, limit: int = 20):
        """Search users."""
        async with get_async_session() as session:
            repo = UserRepository(session)
            return await repo.search(query, skip, limit)
```

## Alembic Configuration

```python
# alembic/env.py
import asyncio
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

from src.db.base import Base
from src.db.session import DATABASE_SYNC_URL

# Import all models to register them with Base
from src.db.models.user import User
from src.db.models.post import Post

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

config.set_main_option("sqlalchemy.url", DATABASE_SYNC_URL)


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Run migrations in 'online' mode with async engine."""
    from src.db.session import async_engine

    async with async_engine.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await async_engine.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    from src.db.session import sync_engine

    with sync_engine.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

## FastAPI Integration

```python
# src/main.py
from contextlib import asynccontextmanager
from typing import Annotated
from uuid import UUID

from fastapi import FastAPI, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from .db.session import get_session, check_connection, close_connections
from .db.repositories.user import UserRepository
from .db.repositories.post import PostRepository
from .schemas.user import UserCreate, UserUpdate, UserResponse
from .schemas.post import PostCreate, PostUpdate, PostResponse, PostWithAuthor
from .services.user import UserService


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    if not await check_connection():
        raise RuntimeError("Database connection failed")
    yield
    # Shutdown
    await close_connections()


app = FastAPI(title="SQLAlchemy API", lifespan=lifespan)


# Health check
@app.get("/health")
async def health_check():
    healthy = await check_connection()
    return {"status": "healthy" if healthy else "unhealthy"}


# User endpoints
@app.post("/users", response_model=UserResponse)
async def create_user(user_data: UserCreate):
    try:
        user = await UserService.create_user(user_data)
        return user
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: UUID,
    session: Annotated[AsyncSession, Depends(get_session)],
):
    repo = UserRepository(session)
    user = await repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@app.patch("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: UUID,
    user_data: UserUpdate,
    session: Annotated[AsyncSession, Depends(get_session)],
):
    repo = UserRepository(session)
    user = await repo.update(user_id, user_data.model_dump(exclude_unset=True))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@app.delete("/users/{user_id}")
async def delete_user(
    user_id: UUID,
    session: Annotated[AsyncSession, Depends(get_session)],
):
    repo = UserRepository(session)
    success = await repo.delete(user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"success": True}


# Post endpoints
@app.post("/posts", response_model=PostResponse)
async def create_post(
    post_data: PostCreate,
    author_id: UUID = Query(...),
    session: AsyncSession = Depends(get_session),
):
    repo = PostRepository(session)
    post_dict = post_data.model_dump()
    post_dict["author_id"] = author_id
    post = await repo.create(post_dict)
    return post


@app.get("/posts", response_model=list[PostWithAuthor])
async def get_posts(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    tag: str | None = None,
    session: AsyncSession = Depends(get_session),
):
    repo = PostRepository(session)
    if tag:
        return await repo.get_by_tag(tag, skip, limit)
    return await repo.get_published(skip, limit)


@app.get("/posts/{slug}", response_model=PostWithAuthor)
async def get_post(
    slug: str,
    session: AsyncSession = Depends(get_session),
):
    repo = PostRepository(session)
    post = await repo.get_by_slug(slug)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    await repo.increment_views(post.id)
    return post


@app.post("/posts/{post_id}/publish", response_model=PostResponse)
async def publish_post(
    post_id: UUID,
    session: AsyncSession = Depends(get_session),
):
    repo = PostRepository(session)
    post = await repo.publish(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post


@app.get("/posts/trending", response_model=list[PostWithAuthor])
async def get_trending_posts(
    days: int = Query(7, ge=1, le=30),
    limit: int = Query(10, ge=1, le=50),
    session: AsyncSession = Depends(get_session),
):
    repo = PostRepository(session)
    return await repo.get_trending(days, limit)
```

## Testing

```python
# tests/test_user_repository.py
import pytest
from uuid import uuid4

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from src.db.base import Base
from src.db.models.user import User
from src.db.repositories.user import UserRepository


@pytest.fixture
async def engine():
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        echo=True,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    await engine.dispose()


@pytest.fixture
async def session(engine):
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    async with async_session() as session:
        yield session


@pytest.mark.asyncio
async def test_create_user(session):
    repo = UserRepository(session)

    user = await repo.create({
        "email": "test@example.com",
        "username": "testuser",
        "password_hash": "hashed",
        "role": "user",
        "settings": {},
    })

    assert user.id is not None
    assert user.email == "test@example.com"
    assert user.username == "testuser"


@pytest.mark.asyncio
async def test_get_by_email(session):
    repo = UserRepository(session)

    await repo.create({
        "email": "test@example.com",
        "username": "testuser",
        "password_hash": "hashed",
        "role": "user",
        "settings": {},
    })

    user = await repo.get_by_email("test@example.com")
    assert user is not None
    assert user.email == "test@example.com"


@pytest.mark.asyncio
async def test_soft_delete(session):
    repo = UserRepository(session)

    user = await repo.create({
        "email": "test@example.com",
        "username": "testuser",
        "password_hash": "hashed",
        "role": "user",
        "settings": {},
    })

    await repo.delete(user.id, soft=True)

    # Should not find soft-deleted user
    found = await repo.get_by_id(user.id)
    assert found is None

    # Should find with include_deleted
    found = await repo.get_by_id(user.id, include_deleted=True)
    assert found is not None
    assert found.deleted_at is not None
```

## CLAUDE.md Integration

```markdown
# SQLAlchemy Integration

## Commands

```bash
# Create migration
alembic revision --autogenerate -m "description"

# Run migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# Show current revision
alembic current
```

## Repository Pattern

```python
async with get_async_session() as session:
    repo = UserRepository(session)
    user = await repo.create({"email": "...", ...})
    users = await repo.get_all(skip=0, limit=20)
```

## Async Sessions

Always use async context manager:

```python
from src.db.session import get_async_session

async with get_async_session() as session:
    # Operations here
    pass  # Auto-commits on success, rollbacks on error
```

## Models

- All models inherit from `Base`
- Use `SoftDeleteMixin` for soft delete
- Use `mapped_column` for column definitions
- Relationships use `Mapped[]` type hints

## Queries

```python
# Select with join
query = select(Post).options(selectinload(Post.author))

# Filter
query = select(User).where(User.role == "admin")

# Order and limit
query = query.order_by(User.created_at.desc()).limit(10)
```
```

## AI Suggestions

1. **Add connection pooling monitoring** - Implement metrics for pool usage and connection health
2. **Create query profiler** - Log slow queries with explain plans for optimization
3. **Implement row-level security** - Add multi-tenant support with automatic filtering
4. **Add database events** - Use SQLAlchemy events for audit logging
5. **Create async batch operations** - Implement bulk insert/update with chunking
6. **Add full-text search** - Integrate PostgreSQL full-text search with tsvector
7. **Implement optimistic locking** - Add version columns for concurrent update handling
8. **Create database health dashboard** - Monitor connections, locks, and query performance
9. **Add read replicas support** - Configure separate engines for read/write splitting
10. **Implement query caching** - Add Redis caching layer for frequently accessed data
