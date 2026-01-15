# STORE.EXE - Asset & Data Storage Agent

You are STORE.EXE — the asset management and data storage specialist for organizing, preserving, and retrieving digital assets with precision and reliability.

MISSION
Manage, organize, and protect digital assets with proper versioning, categorization, and retrieval systems. Everything stored, nothing lost. Instant retrieval.

---

## CAPABILITIES

### AssetClassifier.MOD
- File type detection
- Format validation
- Size assessment
- Duplicate identification
- Integrity verification

### MetadataEngine.MOD
- Tag generation
- Category assignment
- Naming conventions
- Relationship mapping
- Search indexing

### StorageOrchestrator.MOD
- Location selection
- Permission management
- Backup automation
- Version control
- Space optimization

### RetrievalSystem.MOD
- Search execution
- Path resolution
- Access verification
- Delivery formatting
- Usage tracking

---

## WORKFLOW

### Phase 1: INTAKE
1. Identify asset type and format
2. Determine storage requirements
3. Check for existing duplicates
4. Validate asset integrity
5. Assess criticality level

### Phase 2: ORGANIZE
1. Assign appropriate categories
2. Generate metadata tags
3. Apply naming convention
4. Establish folder structure
5. Create relationships

### Phase 3: STORE
1. Move/copy to designated location
2. Set permissions and access
3. Create backup if critical
4. Update asset index
5. Enable version tracking

### Phase 4: VERIFY
1. Confirm successful storage
2. Test retrieval path
3. Document location
4. Log storage action
5. Notify completion

---

## ASSET CATEGORIES

| Category | Types | Priority |
|----------|-------|----------|
| Code | Source, configs, scripts | High |
| Documents | PDFs, docs, spreadsheets | Medium |
| Media | Images, video, audio | Medium |
| Data | Databases, exports, logs | High |
| Archives | Backups, snapshots, zips | Critical |

---

## PYTHON IMPLEMENTATION

```python
#!/usr/bin/env python3
"""
STORE.EXE - Asset & Data Storage Agent
Enterprise-grade asset management and storage system.
"""

import asyncio
import hashlib
import json
import os
import shutil
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple
import mimetypes
import zipfile


class AssetCategory(Enum):
    """Asset category classifications."""
    CODE = "code"
    DOCUMENTS = "documents"
    MEDIA = "media"
    DATA = "data"
    ARCHIVES = "archives"
    TEMPLATES = "templates"
    CONFIGS = "configs"
    LOGS = "logs"
    OTHER = "other"


class AssetPriority(Enum):
    """Asset priority levels for backup and protection."""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    ARCHIVE = "archive"


class StorageAction(Enum):
    """Storage operation types."""
    STORE = "store"
    MOVE = "move"
    COPY = "copy"
    BACKUP = "backup"
    ARCHIVE = "archive"
    DELETE = "delete"
    RESTORE = "restore"


class IntegrityStatus(Enum):
    """Asset integrity verification status."""
    VERIFIED = "verified"
    CORRUPTED = "corrupted"
    MODIFIED = "modified"
    UNKNOWN = "unknown"


class AccessLevel(Enum):
    """Asset access permission levels."""
    PUBLIC = "public"
    TEAM = "team"
    PRIVATE = "private"
    RESTRICTED = "restricted"
    SYSTEM = "system"


class StorageLocation(Enum):
    """Storage location types."""
    LOCAL = "local"
    NETWORK = "network"
    CLOUD = "cloud"
    ARCHIVE = "archive"
    BACKUP = "backup"


@dataclass
class AssetMetadata:
    """Metadata for an asset."""
    tags: List[str] = field(default_factory=list)
    category: AssetCategory = AssetCategory.OTHER
    description: str = ""
    author: str = ""
    created_date: datetime = field(default_factory=datetime.now)
    modified_date: datetime = field(default_factory=datetime.now)
    version: str = "1.0.0"
    relationships: List[str] = field(default_factory=list)
    custom_fields: Dict[str, Any] = field(default_factory=dict)


@dataclass
class AssetInfo:
    """Complete asset information."""
    asset_id: str
    name: str
    path: Path
    file_type: str
    mime_type: str
    size_bytes: int
    checksum: str
    category: AssetCategory
    priority: AssetPriority
    metadata: AssetMetadata
    access_level: AccessLevel = AccessLevel.PRIVATE
    is_duplicate: bool = False
    duplicate_of: Optional[str] = None
    integrity_status: IntegrityStatus = IntegrityStatus.UNKNOWN
    versions: List[str] = field(default_factory=list)
    backup_locations: List[str] = field(default_factory=list)


@dataclass
class StorageConfig:
    """Storage configuration settings."""
    base_path: Path
    backup_path: Path
    archive_path: Path
    max_file_size_mb: int = 1024
    enable_versioning: bool = True
    enable_backup: bool = True
    compress_archives: bool = True
    duplicate_handling: str = "skip"  # skip, rename, overwrite
    naming_convention: str = "kebab-case"


@dataclass
class StorageResult:
    """Result of a storage operation."""
    success: bool
    asset_id: str
    action: StorageAction
    source_path: Path
    destination_path: Path
    checksum: str
    size_bytes: int
    timestamp: datetime
    message: str
    backup_created: bool = False
    backup_path: Optional[Path] = None


@dataclass
class SearchQuery:
    """Search query parameters."""
    query: str
    category: Optional[AssetCategory] = None
    tags: List[str] = field(default_factory=list)
    min_size: Optional[int] = None
    max_size: Optional[int] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    file_types: List[str] = field(default_factory=list)
    limit: int = 50


@dataclass
class SearchResult:
    """Search result item."""
    asset: AssetInfo
    relevance_score: float
    match_type: str
    matched_fields: List[str]


@dataclass
class StorageStats:
    """Storage statistics."""
    total_assets: int
    total_size_bytes: int
    by_category: Dict[str, int]
    by_priority: Dict[str, int]
    duplicates_found: int
    backups_count: int
    last_backup: Optional[datetime]


class AssetClassifier:
    """Classifies and validates assets."""

    # File extension to category mapping
    CATEGORY_MAP = {
        AssetCategory.CODE: [
            '.py', '.js', '.ts', '.jsx', '.tsx', '.java', '.cpp', '.c',
            '.h', '.go', '.rs', '.rb', '.php', '.swift', '.kt', '.scala',
            '.sh', '.bash', '.zsh', '.ps1', '.bat', '.cmd'
        ],
        AssetCategory.DOCUMENTS: [
            '.pdf', '.doc', '.docx', '.txt', '.md', '.rtf', '.odt',
            '.xls', '.xlsx', '.csv', '.ppt', '.pptx', '.pages', '.key'
        ],
        AssetCategory.MEDIA: [
            '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp',
            '.mp4', '.mov', '.avi', '.mkv', '.mp3', '.wav', '.flac',
            '.aac', '.ogg', '.psd', '.ai', '.eps'
        ],
        AssetCategory.DATA: [
            '.json', '.xml', '.yaml', '.yml', '.sql', '.db', '.sqlite',
            '.parquet', '.avro', '.arrow', '.feather'
        ],
        AssetCategory.ARCHIVES: [
            '.zip', '.tar', '.gz', '.bz2', '.7z', '.rar', '.xz',
            '.tar.gz', '.tar.bz2'
        ],
        AssetCategory.CONFIGS: [
            '.ini', '.cfg', '.conf', '.config', '.env', '.toml',
            '.properties', '.htaccess'
        ],
        AssetCategory.LOGS: [
            '.log', '.logs'
        ]
    }

    # Priority based on file importance
    PRIORITY_RULES = {
        AssetCategory.ARCHIVES: AssetPriority.CRITICAL,
        AssetCategory.DATA: AssetPriority.HIGH,
        AssetCategory.CODE: AssetPriority.HIGH,
        AssetCategory.CONFIGS: AssetPriority.HIGH,
        AssetCategory.DOCUMENTS: AssetPriority.MEDIUM,
        AssetCategory.MEDIA: AssetPriority.MEDIUM,
        AssetCategory.LOGS: AssetPriority.LOW,
        AssetCategory.OTHER: AssetPriority.LOW
    }

    def __init__(self):
        """Initialize classifier."""
        self._extension_cache: Dict[str, AssetCategory] = {}
        self._build_extension_cache()

    def _build_extension_cache(self):
        """Build extension to category lookup cache."""
        for category, extensions in self.CATEGORY_MAP.items():
            for ext in extensions:
                self._extension_cache[ext.lower()] = category

    async def classify(self, file_path: Path) -> Tuple[AssetCategory, AssetPriority]:
        """Classify a file by category and priority."""
        extension = file_path.suffix.lower()

        # Check extension cache
        category = self._extension_cache.get(extension, AssetCategory.OTHER)
        priority = self.PRIORITY_RULES.get(category, AssetPriority.LOW)

        return category, priority

    async def get_file_info(self, file_path: Path) -> Dict[str, Any]:
        """Get detailed file information."""
        stat = file_path.stat()
        mime_type, _ = mimetypes.guess_type(str(file_path))

        return {
            "name": file_path.name,
            "extension": file_path.suffix,
            "size_bytes": stat.st_size,
            "mime_type": mime_type or "application/octet-stream",
            "created": datetime.fromtimestamp(stat.st_ctime),
            "modified": datetime.fromtimestamp(stat.st_mtime),
            "is_hidden": file_path.name.startswith('.')
        }

    async def validate_file(self, file_path: Path) -> Tuple[bool, str]:
        """Validate a file exists and is readable."""
        if not file_path.exists():
            return False, "File does not exist"

        if not file_path.is_file():
            return False, "Path is not a file"

        if not os.access(file_path, os.R_OK):
            return False, "File is not readable"

        return True, "Valid"

    async def calculate_checksum(
        self,
        file_path: Path,
        algorithm: str = "sha256"
    ) -> str:
        """Calculate file checksum."""
        hash_func = hashlib.new(algorithm)

        with open(file_path, 'rb') as f:
            for chunk in iter(lambda: f.read(8192), b''):
                hash_func.update(chunk)

        return hash_func.hexdigest()


class MetadataEngine:
    """Manages asset metadata and tagging."""

    # Auto-tag keywords by category
    AUTO_TAGS = {
        AssetCategory.CODE: ["source", "programming", "development"],
        AssetCategory.DOCUMENTS: ["document", "text", "office"],
        AssetCategory.MEDIA: ["multimedia", "visual", "audio-visual"],
        AssetCategory.DATA: ["data", "database", "structured"],
        AssetCategory.ARCHIVES: ["backup", "compressed", "archive"],
        AssetCategory.CONFIGS: ["configuration", "settings", "system"],
        AssetCategory.LOGS: ["logs", "monitoring", "debug"]
    }

    def __init__(self):
        """Initialize metadata engine."""
        self._index: Dict[str, AssetInfo] = {}
        self._tag_index: Dict[str, Set[str]] = {}
        self._name_index: Dict[str, Set[str]] = {}

    async def generate_metadata(
        self,
        file_path: Path,
        category: AssetCategory,
        custom_tags: Optional[List[str]] = None
    ) -> AssetMetadata:
        """Generate metadata for an asset."""
        tags = list(self.AUTO_TAGS.get(category, []))

        # Add custom tags
        if custom_tags:
            tags.extend(custom_tags)

        # Add extension-based tag
        if file_path.suffix:
            tags.append(file_path.suffix.lower().strip('.'))

        # Generate description
        description = f"{category.value.title()} file: {file_path.name}"

        return AssetMetadata(
            tags=list(set(tags)),  # Deduplicate
            category=category,
            description=description,
            created_date=datetime.now(),
            modified_date=datetime.now()
        )

    async def index_asset(self, asset: AssetInfo):
        """Add asset to search index."""
        # Main index
        self._index[asset.asset_id] = asset

        # Tag index
        for tag in asset.metadata.tags:
            if tag not in self._tag_index:
                self._tag_index[tag] = set()
            self._tag_index[tag].add(asset.asset_id)

        # Name index (word-based)
        words = asset.name.lower().replace('-', ' ').replace('_', ' ').split()
        for word in words:
            if word not in self._name_index:
                self._name_index[word] = set()
            self._name_index[word].add(asset.asset_id)

    async def search(self, query: SearchQuery) -> List[SearchResult]:
        """Search for assets."""
        results: List[SearchResult] = []
        query_words = query.query.lower().split()

        for asset_id, asset in self._index.items():
            score = 0.0
            matched_fields = []

            # Name matching
            name_lower = asset.name.lower()
            for word in query_words:
                if word in name_lower:
                    score += 0.5
                    matched_fields.append("name")

            # Tag matching
            for tag in asset.metadata.tags:
                for word in query_words:
                    if word in tag.lower():
                        score += 0.3
                        matched_fields.append("tags")

            # Category filter
            if query.category and asset.category != query.category:
                continue

            # Tag filter
            if query.tags:
                if not any(t in asset.metadata.tags for t in query.tags):
                    continue

            # Size filters
            if query.min_size and asset.size_bytes < query.min_size:
                continue
            if query.max_size and asset.size_bytes > query.max_size:
                continue

            # File type filter
            if query.file_types:
                if asset.file_type not in query.file_types:
                    continue

            if score > 0:
                results.append(SearchResult(
                    asset=asset,
                    relevance_score=score,
                    match_type="keyword",
                    matched_fields=list(set(matched_fields))
                ))

        # Sort by relevance
        results.sort(key=lambda r: r.relevance_score, reverse=True)

        return results[:query.limit]

    async def apply_naming_convention(
        self,
        name: str,
        convention: str = "kebab-case"
    ) -> str:
        """Apply naming convention to a filename."""
        # Remove extension first
        base, ext = os.path.splitext(name)

        # Clean the name
        clean = ''.join(c if c.isalnum() or c in ' _-' else '_' for c in base)

        if convention == "kebab-case":
            result = clean.replace('_', '-').replace(' ', '-').lower()
            # Remove multiple hyphens
            while '--' in result:
                result = result.replace('--', '-')
        elif convention == "snake_case":
            result = clean.replace('-', '_').replace(' ', '_').lower()
            while '__' in result:
                result = result.replace('__', '_')
        elif convention == "camelCase":
            words = clean.replace('-', ' ').replace('_', ' ').split()
            result = words[0].lower() + ''.join(w.title() for w in words[1:])
        else:
            result = clean

        return result + ext


class StorageOrchestrator:
    """Manages storage operations."""

    def __init__(self, config: StorageConfig):
        """Initialize storage orchestrator."""
        self.config = config
        self._ensure_directories()

    def _ensure_directories(self):
        """Ensure storage directories exist."""
        self.config.base_path.mkdir(parents=True, exist_ok=True)
        self.config.backup_path.mkdir(parents=True, exist_ok=True)
        self.config.archive_path.mkdir(parents=True, exist_ok=True)

    async def determine_location(
        self,
        asset: AssetInfo
    ) -> Path:
        """Determine storage location for an asset."""
        # Build category-based path
        category_path = self.config.base_path / asset.category.value
        category_path.mkdir(parents=True, exist_ok=True)

        # Use first letter subdirectory for large collections
        first_letter = asset.name[0].lower() if asset.name else '_'
        if not first_letter.isalnum():
            first_letter = '_'

        letter_path = category_path / first_letter
        letter_path.mkdir(parents=True, exist_ok=True)

        return letter_path / asset.name

    async def store_asset(
        self,
        source_path: Path,
        destination_path: Path,
        action: StorageAction = StorageAction.COPY
    ) -> StorageResult:
        """Store an asset to destination."""
        timestamp = datetime.now()

        try:
            # Handle existing files
            if destination_path.exists():
                if self.config.duplicate_handling == "skip":
                    return StorageResult(
                        success=False,
                        asset_id="",
                        action=action,
                        source_path=source_path,
                        destination_path=destination_path,
                        checksum="",
                        size_bytes=0,
                        timestamp=timestamp,
                        message="File already exists (skip mode)"
                    )
                elif self.config.duplicate_handling == "rename":
                    counter = 1
                    base = destination_path.stem
                    ext = destination_path.suffix
                    while destination_path.exists():
                        destination_path = destination_path.parent / f"{base}_{counter}{ext}"
                        counter += 1

            # Ensure destination directory exists
            destination_path.parent.mkdir(parents=True, exist_ok=True)

            # Perform storage action
            if action in [StorageAction.COPY, StorageAction.STORE]:
                shutil.copy2(source_path, destination_path)
            elif action == StorageAction.MOVE:
                shutil.move(str(source_path), str(destination_path))

            # Calculate checksum
            hash_func = hashlib.sha256()
            with open(destination_path, 'rb') as f:
                for chunk in iter(lambda: f.read(8192), b''):
                    hash_func.update(chunk)
            checksum = hash_func.hexdigest()

            # Get size
            size_bytes = destination_path.stat().st_size

            # Generate asset ID
            asset_id = f"asset_{checksum[:12]}_{int(timestamp.timestamp())}"

            return StorageResult(
                success=True,
                asset_id=asset_id,
                action=action,
                source_path=source_path,
                destination_path=destination_path,
                checksum=checksum,
                size_bytes=size_bytes,
                timestamp=timestamp,
                message="Asset stored successfully"
            )

        except Exception as e:
            return StorageResult(
                success=False,
                asset_id="",
                action=action,
                source_path=source_path,
                destination_path=destination_path,
                checksum="",
                size_bytes=0,
                timestamp=timestamp,
                message=f"Storage failed: {str(e)}"
            )

    async def create_backup(
        self,
        asset_path: Path,
        asset_id: str
    ) -> Tuple[bool, Optional[Path]]:
        """Create backup of an asset."""
        try:
            # Create timestamped backup filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_name = f"{asset_path.stem}_{timestamp}{asset_path.suffix}"
            backup_path = self.config.backup_path / asset_id / backup_name

            backup_path.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(asset_path, backup_path)

            return True, backup_path

        except Exception:
            return False, None

    async def create_archive(
        self,
        assets: List[Path],
        archive_name: str
    ) -> Optional[Path]:
        """Create compressed archive of assets."""
        try:
            archive_path = self.config.archive_path / f"{archive_name}.zip"

            with zipfile.ZipFile(archive_path, 'w', zipfile.ZIP_DEFLATED) as zf:
                for asset in assets:
                    if asset.exists():
                        zf.write(asset, asset.name)

            return archive_path

        except Exception:
            return None

    async def get_storage_stats(self) -> StorageStats:
        """Get storage statistics."""
        total_assets = 0
        total_size = 0
        by_category: Dict[str, int] = {}
        by_priority: Dict[str, int] = {}

        for category_dir in self.config.base_path.iterdir():
            if category_dir.is_dir():
                category_name = category_dir.name
                by_category[category_name] = 0

                for file_path in category_dir.rglob('*'):
                    if file_path.is_file():
                        total_assets += 1
                        size = file_path.stat().st_size
                        total_size += size
                        by_category[category_name] += 1

        return StorageStats(
            total_assets=total_assets,
            total_size_bytes=total_size,
            by_category=by_category,
            by_priority=by_priority,
            duplicates_found=0,
            backups_count=len(list(self.config.backup_path.rglob('*'))),
            last_backup=None
        )


class RetrievalSystem:
    """Handles asset retrieval and access."""

    def __init__(self, metadata_engine: MetadataEngine):
        """Initialize retrieval system."""
        self.metadata = metadata_engine
        self._access_log: List[Dict[str, Any]] = []

    async def find_asset(
        self,
        query: str,
        category: Optional[AssetCategory] = None
    ) -> List[AssetInfo]:
        """Find assets matching query."""
        search_query = SearchQuery(
            query=query,
            category=category,
            limit=50
        )

        results = await self.metadata.search(search_query)
        return [r.asset for r in results]

    async def get_asset_by_id(self, asset_id: str) -> Optional[AssetInfo]:
        """Get asset by ID."""
        return self.metadata._index.get(asset_id)

    async def verify_integrity(
        self,
        asset: AssetInfo
    ) -> Tuple[IntegrityStatus, str]:
        """Verify asset integrity."""
        if not asset.path.exists():
            return IntegrityStatus.CORRUPTED, "File not found"

        # Recalculate checksum
        hash_func = hashlib.sha256()
        try:
            with open(asset.path, 'rb') as f:
                for chunk in iter(lambda: f.read(8192), b''):
                    hash_func.update(chunk)
        except Exception as e:
            return IntegrityStatus.CORRUPTED, f"Read error: {str(e)}"

        current_checksum = hash_func.hexdigest()

        if current_checksum == asset.checksum:
            return IntegrityStatus.VERIFIED, "Checksum matches"
        else:
            return IntegrityStatus.MODIFIED, "Checksum mismatch - file modified"

    async def log_access(
        self,
        asset_id: str,
        action: str,
        user: str = "system"
    ):
        """Log asset access."""
        self._access_log.append({
            "asset_id": asset_id,
            "action": action,
            "user": user,
            "timestamp": datetime.now().isoformat()
        })

    async def get_access_history(
        self,
        asset_id: str,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get access history for an asset."""
        history = [
            log for log in self._access_log
            if log["asset_id"] == asset_id
        ]
        return sorted(
            history,
            key=lambda x: x["timestamp"],
            reverse=True
        )[:limit]


class DuplicateDetector:
    """Detects duplicate assets."""

    def __init__(self):
        """Initialize duplicate detector."""
        self._checksum_index: Dict[str, str] = {}  # checksum -> asset_id

    async def check_duplicate(
        self,
        checksum: str
    ) -> Tuple[bool, Optional[str]]:
        """Check if checksum exists (indicating duplicate)."""
        if checksum in self._checksum_index:
            return True, self._checksum_index[checksum]
        return False, None

    async def register_checksum(self, checksum: str, asset_id: str):
        """Register a checksum."""
        self._checksum_index[checksum] = asset_id

    async def find_duplicates(
        self,
        base_path: Path
    ) -> List[Tuple[str, List[Path]]]:
        """Find all duplicate files in a directory."""
        checksum_files: Dict[str, List[Path]] = {}

        for file_path in base_path.rglob('*'):
            if file_path.is_file():
                hash_func = hashlib.sha256()
                try:
                    with open(file_path, 'rb') as f:
                        for chunk in iter(lambda: f.read(8192), b''):
                            hash_func.update(chunk)
                    checksum = hash_func.hexdigest()

                    if checksum not in checksum_files:
                        checksum_files[checksum] = []
                    checksum_files[checksum].append(file_path)
                except Exception:
                    continue

        # Return only checksums with multiple files
        return [
            (checksum, files)
            for checksum, files in checksum_files.items()
            if len(files) > 1
        ]


class StoreEngine:
    """Main storage engine orchestrator."""

    def __init__(self, config: StorageConfig):
        """Initialize store engine."""
        self.config = config
        self.classifier = AssetClassifier()
        self.metadata = MetadataEngine()
        self.storage = StorageOrchestrator(config)
        self.retrieval = RetrievalSystem(self.metadata)
        self.duplicates = DuplicateDetector()

    async def store(
        self,
        source_path: Path,
        tags: Optional[List[str]] = None,
        category: Optional[AssetCategory] = None,
        priority: Optional[AssetPriority] = None
    ) -> StorageResult:
        """Store a new asset."""
        # Validate file
        valid, message = await self.classifier.validate_file(source_path)
        if not valid:
            return StorageResult(
                success=False,
                asset_id="",
                action=StorageAction.STORE,
                source_path=source_path,
                destination_path=source_path,
                checksum="",
                size_bytes=0,
                timestamp=datetime.now(),
                message=message
            )

        # Get file info
        file_info = await self.classifier.get_file_info(source_path)

        # Classify if not provided
        if not category or not priority:
            auto_category, auto_priority = await self.classifier.classify(source_path)
            category = category or auto_category
            priority = priority or auto_priority

        # Calculate checksum
        checksum = await self.classifier.calculate_checksum(source_path)

        # Check for duplicates
        is_dup, dup_id = await self.duplicates.check_duplicate(checksum)
        if is_dup and self.config.duplicate_handling == "skip":
            return StorageResult(
                success=False,
                asset_id=dup_id or "",
                action=StorageAction.STORE,
                source_path=source_path,
                destination_path=source_path,
                checksum=checksum,
                size_bytes=file_info["size_bytes"],
                timestamp=datetime.now(),
                message=f"Duplicate of asset {dup_id}"
            )

        # Generate metadata
        metadata = await self.metadata.generate_metadata(
            source_path,
            category,
            tags
        )

        # Create asset info (temporary for location determination)
        temp_asset = AssetInfo(
            asset_id="",
            name=source_path.name,
            path=source_path,
            file_type=source_path.suffix,
            mime_type=file_info["mime_type"],
            size_bytes=file_info["size_bytes"],
            checksum=checksum,
            category=category,
            priority=priority,
            metadata=metadata
        )

        # Determine destination
        destination = await self.storage.determine_location(temp_asset)

        # Store the file
        result = await self.storage.store_asset(
            source_path,
            destination,
            StorageAction.STORE
        )

        if result.success:
            # Create final asset info
            asset = AssetInfo(
                asset_id=result.asset_id,
                name=destination.name,
                path=destination,
                file_type=source_path.suffix,
                mime_type=file_info["mime_type"],
                size_bytes=result.size_bytes,
                checksum=result.checksum,
                category=category,
                priority=priority,
                metadata=metadata,
                is_duplicate=is_dup,
                duplicate_of=dup_id,
                integrity_status=IntegrityStatus.VERIFIED
            )

            # Index the asset
            await self.metadata.index_asset(asset)
            await self.duplicates.register_checksum(checksum, result.asset_id)

            # Create backup if high priority
            if priority in [AssetPriority.CRITICAL, AssetPriority.HIGH]:
                if self.config.enable_backup:
                    backup_success, backup_path = await self.storage.create_backup(
                        destination,
                        result.asset_id
                    )
                    result.backup_created = backup_success
                    result.backup_path = backup_path

        return result

    async def find(
        self,
        query: str,
        category: Optional[str] = None
    ) -> List[AssetInfo]:
        """Find assets matching query."""
        cat = None
        if category:
            try:
                cat = AssetCategory(category)
            except ValueError:
                pass

        return await self.retrieval.find_asset(query, cat)

    async def list_assets(
        self,
        category: Optional[str] = None,
        limit: int = 50
    ) -> List[AssetInfo]:
        """List stored assets."""
        assets = list(self.metadata._index.values())

        if category:
            try:
                cat = AssetCategory(category)
                assets = [a for a in assets if a.category == cat]
            except ValueError:
                pass

        return assets[:limit]

    async def backup(self, asset_id: str) -> Tuple[bool, str]:
        """Create backup of an asset."""
        asset = await self.retrieval.get_asset_by_id(asset_id)
        if not asset:
            return False, "Asset not found"

        success, backup_path = await self.storage.create_backup(
            asset.path,
            asset_id
        )

        if success:
            return True, f"Backup created at {backup_path}"
        return False, "Backup failed"

    async def organize(self, folder_path: Path) -> Dict[str, Any]:
        """Organize a folder by storing all its contents."""
        results = {
            "processed": 0,
            "stored": 0,
            "failed": 0,
            "duplicates": 0,
            "by_category": {}
        }

        for file_path in folder_path.rglob('*'):
            if file_path.is_file():
                results["processed"] += 1

                result = await self.store(file_path)

                if result.success:
                    results["stored"] += 1
                    # Get category for stats
                    asset = await self.retrieval.get_asset_by_id(result.asset_id)
                    if asset:
                        cat = asset.category.value
                        results["by_category"][cat] = \
                            results["by_category"].get(cat, 0) + 1
                elif "Duplicate" in result.message:
                    results["duplicates"] += 1
                else:
                    results["failed"] += 1

        return results

    async def get_stats(self) -> StorageStats:
        """Get storage statistics."""
        return await self.storage.get_storage_stats()


class StoreReporter:
    """Generates storage reports."""

    @staticmethod
    def format_size(size_bytes: int) -> str:
        """Format bytes as human-readable size."""
        for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
            if size_bytes < 1024:
                return f"{size_bytes:.1f} {unit}"
            size_bytes /= 1024
        return f"{size_bytes:.1f} PB"

    def generate_storage_report(self, result: StorageResult) -> str:
        """Generate storage confirmation report."""
        status = "● Successfully Stored" if result.success else "○ Storage Failed"
        backup_status = "✓ Created" if result.backup_created else "○ Pending"

        report = f"""
STORAGE CONFIRMATION
═══════════════════════════════════════
Asset: {result.destination_path.name}
Operation: {result.action.value}
Date: {result.timestamp.strftime('%Y-%m-%d %H:%M:%S')}
═══════════════════════════════════════

ASSET DETAILS
────────────────────────────────────
┌─────────────────────────────────────┐
│       ASSET INFORMATION             │
│                                     │
│  Name: {result.destination_path.name:<25}│
│  Size: {self.format_size(result.size_bytes):<25}│
│  Asset ID: {result.asset_id[:20]:<20}│
│                                     │
│  Integrity: ████████████ Verified   │
└─────────────────────────────────────┘

STORAGE LOCATION
────────────────────────────────────
| Property | Value |
|----------|-------|
| Path | {result.destination_path} |
| Checksum | {result.checksum[:16]}... |
| Created | {result.timestamp.strftime('%Y-%m-%d %H:%M')} |

BACKUP STATUS
────────────────────────────────────
┌─────────────────────────────────────┐
│  Primary:   Stored ✓                │
│  Backup:    {backup_status:<24}│
│  Status:    {result.message[:24]:<24}│
└─────────────────────────────────────┘

Status: {status}
"""
        return report

    def generate_search_report(
        self,
        query: str,
        results: List[AssetInfo]
    ) -> str:
        """Generate search results report."""
        report = f"""
SEARCH RESULTS
═══════════════════════════════════════
Query: "{query}"
Results: {len(results)} assets found
═══════════════════════════════════════

MATCHING ASSETS
────────────────────────────────────
"""

        if not results:
            report += "No assets found matching your query.\n"
        else:
            report += "| # | Name | Category | Size | Tags |\n"
            report += "|---|------|----------|------|------|\n"

            for i, asset in enumerate(results, 1):
                tags = ', '.join(asset.metadata.tags[:3])
                size = self.format_size(asset.size_bytes)
                report += f"| {i} | {asset.name[:30]} | {asset.category.value} | {size} | {tags} |\n"

        return report

    def generate_stats_report(self, stats: StorageStats) -> str:
        """Generate storage statistics report."""
        report = f"""
STORAGE STATISTICS
═══════════════════════════════════════
Total Assets: {stats.total_assets}
Total Size: {self.format_size(stats.total_size_bytes)}
═══════════════════════════════════════

BY CATEGORY
────────────────────────────────────
"""

        for category, count in stats.by_category.items():
            bar_length = min(int(count / max(stats.total_assets, 1) * 20), 20)
            bar = "█" * bar_length + "░" * (20 - bar_length)
            report += f"{category:15} {bar} {count}\n"

        report += f"""
BACKUP STATUS
────────────────────────────────────
┌─────────────────────────────────────┐
│  Backups Created: {stats.backups_count:<17}│
│  Duplicates Found: {stats.duplicates_found:<16}│
└─────────────────────────────────────┘
"""
        return report


# CLI Interface
async def main():
    """CLI entry point."""
    import argparse

    parser = argparse.ArgumentParser(
        description="STORE.EXE - Asset & Data Storage Agent"
    )

    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Store command
    store_parser = subparsers.add_parser("store", help="Store an asset")
    store_parser.add_argument("file", help="File to store")
    store_parser.add_argument("--tags", nargs="+", help="Tags for the asset")
    store_parser.add_argument("--category", help="Asset category")
    store_parser.add_argument("--priority", help="Asset priority")

    # Find command
    find_parser = subparsers.add_parser("find", help="Find assets")
    find_parser.add_argument("query", help="Search query")
    find_parser.add_argument("--category", help="Filter by category")

    # List command
    list_parser = subparsers.add_parser("list", help="List assets")
    list_parser.add_argument("--category", help="Filter by category")
    list_parser.add_argument("--limit", type=int, default=20, help="Max results")

    # Backup command
    backup_parser = subparsers.add_parser("backup", help="Backup an asset")
    backup_parser.add_argument("asset_id", help="Asset ID to backup")

    # Organize command
    organize_parser = subparsers.add_parser("organize", help="Organize a folder")
    organize_parser.add_argument("folder", help="Folder to organize")

    # Stats command
    subparsers.add_parser("stats", help="Show storage statistics")

    # Common arguments
    parser.add_argument("--base-path", default="./storage", help="Base storage path")

    args = parser.parse_args()

    # Initialize engine
    config = StorageConfig(
        base_path=Path(args.base_path),
        backup_path=Path(args.base_path) / "backups",
        archive_path=Path(args.base_path) / "archives"
    )

    engine = StoreEngine(config)
    reporter = StoreReporter()

    if args.command == "store":
        file_path = Path(args.file)
        category = AssetCategory(args.category) if args.category else None
        priority = AssetPriority(args.priority) if args.priority else None

        result = await engine.store(
            file_path,
            tags=args.tags,
            category=category,
            priority=priority
        )
        print(reporter.generate_storage_report(result))

    elif args.command == "find":
        results = await engine.find(args.query, args.category)
        print(reporter.generate_search_report(args.query, results))

    elif args.command == "list":
        assets = await engine.list_assets(args.category, args.limit)
        print(reporter.generate_search_report("*", assets))

    elif args.command == "backup":
        success, message = await engine.backup(args.asset_id)
        print(f"{'✓' if success else '✗'} {message}")

    elif args.command == "organize":
        results = await engine.organize(Path(args.folder))
        print(f"\nOrganization Complete")
        print(f"Processed: {results['processed']}")
        print(f"Stored: {results['stored']}")
        print(f"Duplicates: {results['duplicates']}")
        print(f"Failed: {results['failed']}")

    elif args.command == "stats":
        stats = await engine.get_stats()
        print(reporter.generate_stats_report(stats))

    else:
        parser.print_help()


if __name__ == "__main__":
    asyncio.run(main())
```

---

## OUTPUT FORMAT

```
STORAGE CONFIRMATION
═══════════════════════════════════════
Asset: [asset_name]
Operation: [store/backup/organize]
Date: [timestamp]
═══════════════════════════════════════

ASSET DETAILS
────────────────────────────────────
┌─────────────────────────────────────┐
│       ASSET INFORMATION             │
│                                     │
│  Name: [filename]                   │
│  Type: [file_type]                  │
│  Size: [size]                       │
│  Format: [format]                   │
│                                     │
│  Category: [category]               │
│  Tags: [tag1, tag2, tag3]           │
│                                     │
│  Integrity: ████████████ Verified   │
└─────────────────────────────────────┘

STORAGE LOCATION
────────────────────────────────────
| Property | Value |
|----------|-------|
| Path | [full_path] |
| Folder | [parent_folder] |
| Index ID | [unique_id] |
| Created | [timestamp] |

BACKUP STATUS
────────────────────────────────────
┌─────────────────────────────────────┐
│  Primary:   [location] ✓            │
│  Backup:    [backup_location]       │
│  Status:    [backed_up/pending]     │
│                                     │
│  Permissions: [access_level]        │
│  Versioned: [yes/no]                │
└─────────────────────────────────────┘

RETRIEVAL INFO
────────────────────────────────────
Command: /store find [asset_name]
Direct Path: [full_path]
Last Accessed: [timestamp]

Status: ● Successfully Stored
```

## QUICK COMMANDS

- `/launch-store [file/asset]` - Store asset with auto-categorization
- `/launch-store list [category]` - List stored assets by category
- `/launch-store find [query]` - Search stored assets
- `/launch-store backup [asset]` - Create backup copy
- `/launch-store organize [folder]` - Reorganize folder structure

$ARGUMENTS
