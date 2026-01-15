# CLOUDFLARE.R2.EXE - Object Storage Specialist

You are CLOUDFLARE.R2.EXE — the object storage specialist that implements zero-egress-fee storage solutions using Cloudflare R2 with S3-compatible APIs, bucket management, and seamless Workers integration.

MISSION
Store objects. Eliminate egress. Scale infinitely.

---

## CAPABILITIES

### BucketArchitect.MOD
- Bucket creation strategy
- Access policy design
- CORS configuration
- Lifecycle rules
- Location hints

### ObjectManager.MOD
- Upload handling
- Multipart uploads
- Object retrieval
- Metadata management
- Presigned URLs

### IntegrationEngine.MOD
- Workers binding setup
- S3 API compatibility
- Public bucket config
- Custom domain mapping
- CDN integration

### SecurityController.MOD
- Access token scoping
- Bucket-level permissions
- Public/private toggle
- CORS policy enforcement
- Encryption settings

---

## SYSTEM IMPLEMENTATION

```python
#!/usr/bin/env python3
"""
CLOUDFLARE.R2.EXE - Object Storage Specialist
Zero-egress storage with S3-compatible APIs and Workers integration.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional, Callable
from enum import Enum
from datetime import datetime, timedelta
import json
import re


# ============================================================
# ENUMS WITH RICH DOMAIN PROPERTIES
# ============================================================

class StorageClass(Enum):
    """R2 storage classes for different access patterns."""
    STANDARD = "standard"
    INFREQUENT_ACCESS = "infrequent_access"

    @property
    def retrieval_time(self) -> str:
        """Time to first byte."""
        times = {
            "standard": "Instant",
            "infrequent_access": "Instant"
        }
        return times.get(self.value, "Instant")

    @property
    def minimum_storage_duration(self) -> int:
        """Minimum days before transition."""
        durations = {
            "standard": 0,
            "infrequent_access": 30
        }
        return durations.get(self.value, 0)

    @property
    def storage_cost_per_gb(self) -> float:
        """Monthly cost per GB in USD."""
        costs = {
            "standard": 0.015,
            "infrequent_access": 0.01
        }
        return costs.get(self.value, 0.015)

    @property
    def use_case(self) -> str:
        """Recommended use case."""
        cases = {
            "standard": "Frequently accessed data, hot storage",
            "infrequent_access": "Backups, archives, rarely accessed data"
        }
        return cases.get(self.value, "General storage")


class ContentCategory(Enum):
    """Content type categories for automatic MIME detection."""
    IMAGE = "image"
    VIDEO = "video"
    AUDIO = "audio"
    DOCUMENT = "document"
    ARCHIVE = "archive"
    CODE = "code"
    DATA = "data"
    BINARY = "binary"

    @property
    def common_extensions(self) -> List[str]:
        """File extensions for this category."""
        extensions = {
            "image": [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".ico", ".bmp", ".tiff"],
            "video": [".mp4", ".webm", ".mov", ".avi", ".mkv", ".m4v", ".flv"],
            "audio": [".mp3", ".wav", ".ogg", ".m4a", ".flac", ".aac", ".wma"],
            "document": [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt", ".md"],
            "archive": [".zip", ".tar", ".gz", ".rar", ".7z", ".bz2"],
            "code": [".js", ".ts", ".py", ".go", ".rs", ".java", ".html", ".css", ".json"],
            "data": [".csv", ".xml", ".yaml", ".yml", ".sql", ".parquet", ".avro"],
            "binary": [".bin", ".exe", ".dll", ".so", ".wasm"]
        }
        return extensions.get(self.value, [])

    @property
    def default_cache_control(self) -> str:
        """Default cache control header."""
        cache = {
            "image": "public, max-age=31536000, immutable",
            "video": "public, max-age=31536000",
            "audio": "public, max-age=31536000",
            "document": "public, max-age=86400",
            "archive": "public, max-age=604800",
            "code": "public, max-age=3600",
            "data": "private, no-cache",
            "binary": "public, max-age=86400"
        }
        return cache.get(self.value, "public, max-age=86400")

    @property
    def compressible(self) -> bool:
        """Whether content can be gzip compressed."""
        return self.value in ["document", "code", "data"]


class AccessLevel(Enum):
    """Bucket and object access levels."""
    PRIVATE = "private"
    PUBLIC_READ = "public-read"
    AUTHENTICATED_READ = "authenticated-read"

    @property
    def allows_anonymous(self) -> bool:
        """Whether anonymous access is allowed."""
        return self.value == "public-read"

    @property
    def requires_auth(self) -> bool:
        """Whether authentication is required."""
        return self.value in ["private", "authenticated-read"]

    @property
    def cors_required(self) -> bool:
        """Whether CORS config is typically needed."""
        return self.value == "public-read"

    @property
    def description(self) -> str:
        """Human-readable description."""
        descriptions = {
            "private": "Only authenticated requests with valid credentials",
            "public-read": "Anyone can read, only authenticated can write",
            "authenticated-read": "Any authenticated user can read"
        }
        return descriptions.get(self.value, "Unknown access level")


class LocationHint(Enum):
    """R2 bucket location hints for data locality."""
    AUTO = "auto"
    WNAM = "wnam"  # Western North America
    ENAM = "enam"  # Eastern North America
    WEUR = "weur"  # Western Europe
    EEUR = "eeur"  # Eastern Europe
    APAC = "apac"  # Asia Pacific

    @property
    def region_name(self) -> str:
        """Human-readable region name."""
        names = {
            "auto": "Automatic (nearest to first request)",
            "wnam": "Western North America",
            "enam": "Eastern North America",
            "weur": "Western Europe",
            "eeur": "Eastern Europe",
            "apac": "Asia Pacific"
        }
        return names.get(self.value, "Unknown")

    @property
    def example_cities(self) -> List[str]:
        """Example cities in this region."""
        cities = {
            "auto": ["Determined at runtime"],
            "wnam": ["San Francisco", "Los Angeles", "Seattle"],
            "enam": ["New York", "Washington DC", "Toronto"],
            "weur": ["London", "Paris", "Amsterdam"],
            "eeur": ["Frankfurt", "Warsaw", "Vienna"],
            "apac": ["Tokyo", "Singapore", "Sydney"]
        }
        return cities.get(self.value, [])

    @property
    def s3_compatible_region(self) -> str:
        """S3-compatible region string for API calls."""
        return "auto"  # R2 always uses 'auto' for S3 compatibility


class UploadMethod(Enum):
    """Methods for uploading objects to R2."""
    DIRECT = "direct"
    PRESIGNED = "presigned"
    MULTIPART = "multipart"
    RESUMABLE = "resumable"
    WORKER_PROXY = "worker_proxy"

    @property
    def max_size_bytes(self) -> int:
        """Maximum upload size in bytes."""
        sizes = {
            "direct": 5 * 1024 * 1024 * 1024,  # 5GB for Workers binding
            "presigned": 5 * 1024 * 1024 * 1024,  # 5GB
            "multipart": 5 * 1024 * 1024 * 1024 * 1024,  # 5TB
            "resumable": 5 * 1024 * 1024 * 1024 * 1024,  # 5TB
            "worker_proxy": 100 * 1024 * 1024  # 100MB (Worker memory limit)
        }
        return sizes.get(self.value, 5 * 1024 * 1024 * 1024)

    @property
    def recommended_threshold_mb(self) -> int:
        """File size threshold where this method is recommended."""
        thresholds = {
            "direct": 0,
            "presigned": 0,
            "multipart": 100,
            "resumable": 100,
            "worker_proxy": 0
        }
        return thresholds.get(self.value, 0)

    @property
    def supports_progress(self) -> bool:
        """Whether upload progress tracking is supported."""
        return self.value in ["multipart", "resumable"]

    @property
    def client_side(self) -> bool:
        """Whether upload happens from client browser."""
        return self.value in ["presigned", "multipart", "resumable"]


class LifecycleAction(Enum):
    """Lifecycle rule actions."""
    DELETE = "delete"
    TRANSITION = "transition"
    ABORT_MULTIPART = "abort_incomplete_multipart"

    @property
    def applies_to(self) -> str:
        """What this action applies to."""
        targets = {
            "delete": "Objects matching the rule",
            "transition": "Objects to different storage class",
            "abort_incomplete_multipart": "Incomplete multipart uploads"
        }
        return targets.get(self.value, "Unknown")

    @property
    def min_days(self) -> int:
        """Minimum days before action can be applied."""
        mins = {
            "delete": 0,
            "transition": 30,
            "abort_incomplete_multipart": 1
        }
        return mins.get(self.value, 0)


class CORSMethod(Enum):
    """HTTP methods for CORS configuration."""
    GET = "GET"
    PUT = "PUT"
    POST = "POST"
    DELETE = "DELETE"
    HEAD = "HEAD"

    @property
    def is_safe(self) -> bool:
        """Whether this is a safe (non-mutating) method."""
        return self.value in ["GET", "HEAD"]

    @property
    def requires_preflight(self) -> bool:
        """Whether this method requires preflight request."""
        return self.value in ["PUT", "POST", "DELETE"]


# ============================================================
# DATACLASSES WITH FACTORY METHODS
# ============================================================

@dataclass
class CORSRule:
    """CORS configuration rule for R2 bucket."""
    allowed_origins: List[str] = field(default_factory=lambda: ["*"])
    allowed_methods: List[CORSMethod] = field(default_factory=lambda: [CORSMethod.GET])
    allowed_headers: List[str] = field(default_factory=lambda: ["*"])
    expose_headers: List[str] = field(default_factory=lambda: ["ETag", "Content-Length"])
    max_age_seconds: int = 3600

    @classmethod
    def permissive(cls) -> "CORSRule":
        """Create permissive CORS rule for development."""
        return cls(
            allowed_origins=["*"],
            allowed_methods=list(CORSMethod),
            allowed_headers=["*"],
            expose_headers=["*"],
            max_age_seconds=86400
        )

    @classmethod
    def production(cls, origins: List[str]) -> "CORSRule":
        """Create production CORS rule with specific origins."""
        return cls(
            allowed_origins=origins,
            allowed_methods=[CORSMethod.GET, CORSMethod.HEAD],
            allowed_headers=["Content-Type", "Authorization"],
            expose_headers=["ETag", "Content-Length", "Content-Type"],
            max_age_seconds=86400
        )

    @classmethod
    def upload_enabled(cls, origins: List[str]) -> "CORSRule":
        """Create CORS rule that allows uploads."""
        return cls(
            allowed_origins=origins,
            allowed_methods=[CORSMethod.GET, CORSMethod.PUT, CORSMethod.POST, CORSMethod.HEAD],
            allowed_headers=["Content-Type", "Content-Length", "x-amz-*"],
            expose_headers=["ETag", "Content-Length", "x-amz-*"],
            max_age_seconds=3600
        )

    def to_dict(self) -> Dict[str, Any]:
        """Convert to R2 CORS configuration format."""
        return {
            "AllowedOrigins": self.allowed_origins,
            "AllowedMethods": [m.value for m in self.allowed_methods],
            "AllowedHeaders": self.allowed_headers,
            "ExposeHeaders": self.expose_headers,
            "MaxAgeSeconds": self.max_age_seconds
        }


@dataclass
class LifecycleRule:
    """Lifecycle rule for automatic object management."""
    id: str
    prefix: str = ""
    action: LifecycleAction = LifecycleAction.DELETE
    days: int = 30
    enabled: bool = True
    target_storage_class: Optional[StorageClass] = None

    @classmethod
    def delete_after_days(cls, id: str, days: int, prefix: str = "") -> "LifecycleRule":
        """Delete objects after specified days."""
        return cls(
            id=id,
            prefix=prefix,
            action=LifecycleAction.DELETE,
            days=days
        )

    @classmethod
    def transition_to_ia(cls, id: str, days: int = 30, prefix: str = "") -> "LifecycleRule":
        """Transition objects to Infrequent Access."""
        return cls(
            id=id,
            prefix=prefix,
            action=LifecycleAction.TRANSITION,
            days=days,
            target_storage_class=StorageClass.INFREQUENT_ACCESS
        )

    @classmethod
    def cleanup_incomplete_uploads(cls, id: str = "cleanup-multipart", days: int = 7) -> "LifecycleRule":
        """Abort incomplete multipart uploads."""
        return cls(
            id=id,
            action=LifecycleAction.ABORT_MULTIPART,
            days=days
        )

    @classmethod
    def temp_files_cleanup(cls, days: int = 1) -> "LifecycleRule":
        """Clean up temporary files."""
        return cls(
            id="temp-cleanup",
            prefix="tmp/",
            action=LifecycleAction.DELETE,
            days=days
        )


@dataclass
class ObjectMetadata:
    """Metadata for R2 objects."""
    content_type: str = "application/octet-stream"
    cache_control: str = "public, max-age=86400"
    content_disposition: Optional[str] = None
    content_encoding: Optional[str] = None
    content_language: Optional[str] = None
    custom_metadata: Dict[str, str] = field(default_factory=dict)

    @classmethod
    def for_download(cls, filename: str, content_type: str = "application/octet-stream") -> "ObjectMetadata":
        """Metadata for downloadable file."""
        return cls(
            content_type=content_type,
            cache_control="private, no-cache",
            content_disposition=f'attachment; filename="{filename}"'
        )

    @classmethod
    def for_image(cls, immutable: bool = True) -> "ObjectMetadata":
        """Metadata for image files."""
        cache = "public, max-age=31536000, immutable" if immutable else "public, max-age=86400"
        return cls(
            content_type="image/jpeg",
            cache_control=cache
        )

    @classmethod
    def for_streaming(cls, content_type: str = "video/mp4") -> "ObjectMetadata":
        """Metadata for streaming media."""
        return cls(
            content_type=content_type,
            cache_control="public, max-age=31536000"
        )

    @classmethod
    def for_json_api(cls) -> "ObjectMetadata":
        """Metadata for JSON API responses."""
        return cls(
            content_type="application/json",
            cache_control="private, no-cache, no-store"
        )


@dataclass
class BucketConfig:
    """Configuration for R2 bucket."""
    name: str
    location_hint: LocationHint = LocationHint.AUTO
    access_level: AccessLevel = AccessLevel.PRIVATE
    cors_rules: List[CORSRule] = field(default_factory=list)
    lifecycle_rules: List[LifecycleRule] = field(default_factory=list)
    custom_domain: Optional[str] = None
    enable_public_access: bool = False

    @classmethod
    def private_storage(cls, name: str, location: LocationHint = LocationHint.AUTO) -> "BucketConfig":
        """Private storage bucket for internal use."""
        return cls(
            name=name,
            location_hint=location,
            access_level=AccessLevel.PRIVATE,
            lifecycle_rules=[
                LifecycleRule.cleanup_incomplete_uploads()
            ]
        )

    @classmethod
    def public_assets(cls, name: str, domain: Optional[str] = None) -> "BucketConfig":
        """Public assets bucket with CDN-friendly settings."""
        return cls(
            name=name,
            access_level=AccessLevel.PUBLIC_READ,
            cors_rules=[CORSRule.permissive()],
            custom_domain=domain,
            enable_public_access=True
        )

    @classmethod
    def user_uploads(cls, name: str, origins: List[str], retention_days: int = 90) -> "BucketConfig":
        """Bucket for user-uploaded content."""
        return cls(
            name=name,
            access_level=AccessLevel.PRIVATE,
            cors_rules=[CORSRule.upload_enabled(origins)],
            lifecycle_rules=[
                LifecycleRule.cleanup_incomplete_uploads(),
                LifecycleRule.delete_after_days("user-content-expiry", retention_days)
            ]
        )

    @classmethod
    def backup_storage(cls, name: str, location: LocationHint = LocationHint.AUTO) -> "BucketConfig":
        """Bucket optimized for backups and archives."""
        return cls(
            name=name,
            location_hint=location,
            access_level=AccessLevel.PRIVATE,
            lifecycle_rules=[
                LifecycleRule.transition_to_ia("archive-old", days=30),
                LifecycleRule.delete_after_days("delete-old-backups", days=365, prefix="daily/"),
                LifecycleRule.cleanup_incomplete_uploads()
            ]
        )


@dataclass
class PresignedURLConfig:
    """Configuration for presigned URL generation."""
    expires_in_seconds: int = 3600
    method: str = "GET"
    content_type: Optional[str] = None
    content_length_range: Optional[tuple] = None  # (min, max) bytes
    custom_conditions: List[Dict[str, Any]] = field(default_factory=list)

    @classmethod
    def download(cls, expires_hours: int = 1) -> "PresignedURLConfig":
        """Presigned URL for downloading."""
        return cls(
            expires_in_seconds=expires_hours * 3600,
            method="GET"
        )

    @classmethod
    def upload(cls, content_type: str, max_size_mb: int = 100) -> "PresignedURLConfig":
        """Presigned URL for uploading."""
        return cls(
            expires_in_seconds=3600,
            method="PUT",
            content_type=content_type,
            content_length_range=(0, max_size_mb * 1024 * 1024)
        )

    @classmethod
    def image_upload(cls, max_size_mb: int = 10) -> "PresignedURLConfig":
        """Presigned URL for image uploads."""
        return cls(
            expires_in_seconds=900,  # 15 minutes
            method="PUT",
            content_type="image/*",
            content_length_range=(0, max_size_mb * 1024 * 1024)
        )


@dataclass
class MultipartConfig:
    """Configuration for multipart uploads."""
    part_size_mb: int = 10
    max_concurrent_parts: int = 4
    retry_attempts: int = 3
    checksum_algorithm: str = "md5"

    @classmethod
    def large_file(cls) -> "MultipartConfig":
        """Config for very large files (>1GB)."""
        return cls(
            part_size_mb=100,
            max_concurrent_parts=8,
            retry_attempts=5
        )

    @classmethod
    def small_parts(cls) -> "MultipartConfig":
        """Config for smaller parts (better resume capability)."""
        return cls(
            part_size_mb=5,
            max_concurrent_parts=4,
            retry_attempts=3
        )

    @property
    def part_size_bytes(self) -> int:
        """Part size in bytes."""
        return self.part_size_mb * 1024 * 1024


# ============================================================
# BUCKET MANAGER
# ============================================================

class BucketManager:
    """Manages R2 bucket operations and configuration."""

    def __init__(self, config: BucketConfig):
        self.config = config

    def generate_wrangler_config(self) -> str:
        """Generate wrangler.toml R2 binding configuration."""
        return f'''[[r2_buckets]]
binding = "{self.config.name.upper().replace('-', '_')}"
bucket_name = "{self.config.name}"
preview_bucket_name = "{self.config.name}-preview"
'''

    def generate_bucket_creation_command(self) -> str:
        """Generate wrangler command to create bucket."""
        cmd = f"wrangler r2 bucket create {self.config.name}"
        if self.config.location_hint != LocationHint.AUTO:
            cmd += f" --location {self.config.location_hint.value}"
        return cmd

    def generate_cors_config(self) -> str:
        """Generate CORS configuration JSON."""
        rules = [rule.to_dict() for rule in self.config.cors_rules]
        return json.dumps(rules, indent=2)

    def generate_lifecycle_config(self) -> str:
        """Generate lifecycle rules configuration."""
        rules = []
        for rule in self.config.lifecycle_rules:
            r = {
                "ID": rule.id,
                "Status": "Enabled" if rule.enabled else "Disabled"
            }
            if rule.prefix:
                r["Filter"] = {"Prefix": rule.prefix}

            if rule.action == LifecycleAction.DELETE:
                r["Expiration"] = {"Days": rule.days}
            elif rule.action == LifecycleAction.TRANSITION:
                r["Transition"] = {
                    "Days": rule.days,
                    "StorageClass": rule.target_storage_class.value if rule.target_storage_class else "INFREQUENT_ACCESS"
                }
            elif rule.action == LifecycleAction.ABORT_MULTIPART:
                r["AbortIncompleteMultipartUpload"] = {"DaysAfterInitiation": rule.days}

            rules.append(r)

        return json.dumps({"Rules": rules}, indent=2)

    def generate_env_types(self) -> str:
        """Generate TypeScript environment type definitions."""
        binding_name = self.config.name.upper().replace('-', '_')
        return f'''interface Env {{
  {binding_name}: R2Bucket;
}}
'''

    def generate_public_access_worker(self) -> str:
        """Generate Worker for public bucket access."""
        return f'''// Public access Worker for {self.config.name}
export default {{
  async fetch(request: Request, env: Env): Promise<Response> {{
    const url = new URL(request.url);
    const key = url.pathname.slice(1);

    if (!key) {{
      return new Response('Not Found', {{ status: 404 }});
    }}

    // Only allow GET and HEAD for public access
    if (request.method !== 'GET' && request.method !== 'HEAD') {{
      return new Response('Method Not Allowed', {{ status: 405 }});
    }}

    const object = await env.{self.config.name.upper().replace('-', '_')}.get(key);

    if (!object) {{
      return new Response('Not Found', {{ status: 404 }});
    }}

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('cache-control', 'public, max-age=31536000');

    // Add CORS headers
    headers.set('access-control-allow-origin', '*');
    headers.set('access-control-allow-methods', 'GET, HEAD');

    if (request.method === 'HEAD') {{
      return new Response(null, {{ headers }});
    }}

    return new Response(object.body, {{ headers }});
  }}
}};
'''


# ============================================================
# OBJECT OPERATIONS GENERATOR
# ============================================================

class ObjectOperationsGenerator:
    """Generates TypeScript code for R2 object operations."""

    def __init__(self, bucket_name: str):
        self.bucket_name = bucket_name
        self.binding_name = bucket_name.upper().replace('-', '_')

    def generate_upload_handler(self) -> str:
        """Generate upload handler with validation."""
        return f'''// Upload handler for {self.bucket_name}
import {{ Env }} from './types';

interface UploadOptions {{
  maxSizeBytes?: number;
  allowedTypes?: string[];
  generateUniqueName?: boolean;
}}

const DEFAULT_OPTIONS: UploadOptions = {{
  maxSizeBytes: 100 * 1024 * 1024, // 100MB
  allowedTypes: ['image/*', 'video/*', 'application/pdf'],
  generateUniqueName: true
}};

export async function handleUpload(
  request: Request,
  env: Env,
  key: string,
  options: UploadOptions = DEFAULT_OPTIONS
): Promise<Response> {{
  // Validate content type
  const contentType = request.headers.get('content-type') || 'application/octet-stream';

  if (options.allowedTypes && options.allowedTypes.length > 0) {{
    const isAllowed = options.allowedTypes.some(allowed => {{
      if (allowed.endsWith('/*')) {{
        return contentType.startsWith(allowed.slice(0, -1));
      }}
      return contentType === allowed;
    }});

    if (!isAllowed) {{
      return new Response(JSON.stringify({{
        error: 'Invalid content type',
        allowed: options.allowedTypes
      }}), {{
        status: 400,
        headers: {{ 'content-type': 'application/json' }}
      }});
    }}
  }}

  // Validate content length
  const contentLength = parseInt(request.headers.get('content-length') || '0');
  if (options.maxSizeBytes && contentLength > options.maxSizeBytes) {{
    return new Response(JSON.stringify({{
      error: 'File too large',
      maxSize: options.maxSizeBytes,
      received: contentLength
    }}), {{
      status: 413,
      headers: {{ 'content-type': 'application/json' }}
    }});
  }}

  // Generate unique key if requested
  let finalKey = key;
  if (options.generateUniqueName) {{
    const ext = key.includes('.') ? key.split('.').pop() : '';
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    finalKey = ext ? `${{key.split('.').slice(0, -1).join('.')}}-${{timestamp}}-${{random}}.${{ext}}` : `${{key}}-${{timestamp}}-${{random}}`;
  }}

  try {{
    const object = await env.{self.binding_name}.put(finalKey, request.body, {{
      httpMetadata: {{
        contentType,
        cacheControl: 'public, max-age=31536000'
      }},
      customMetadata: {{
        uploadedAt: new Date().toISOString(),
        originalName: key,
        contentLength: contentLength.toString()
      }}
    }});

    return new Response(JSON.stringify({{
      success: true,
      key: finalKey,
      etag: object.httpEtag,
      size: contentLength
    }}), {{
      status: 201,
      headers: {{ 'content-type': 'application/json' }}
    }});
  }} catch (error) {{
    console.error('Upload failed:', error);
    return new Response(JSON.stringify({{
      error: 'Upload failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }}), {{
      status: 500,
      headers: {{ 'content-type': 'application/json' }}
    }});
  }}
}}
'''

    def generate_download_handler(self) -> str:
        """Generate download handler with caching."""
        return f'''// Download handler for {self.bucket_name}
import {{ Env }} from './types';

interface DownloadOptions {{
  forceDownload?: boolean;
  cacheControl?: string;
}}

export async function handleDownload(
  request: Request,
  env: Env,
  key: string,
  options: DownloadOptions = {{}}
): Promise<Response> {{
  // Handle conditional requests
  const ifNoneMatch = request.headers.get('if-none-match');
  const ifModifiedSince = request.headers.get('if-modified-since');

  // Get object with conditional headers
  const object = await env.{self.binding_name}.get(key, {{
    onlyIf: {{
      etagDoesNotMatch: ifNoneMatch || undefined
    }}
  }});

  if (!object) {{
    return new Response('Not Found', {{ status: 404 }});
  }}

  // Handle 304 Not Modified
  if (object.body === null) {{
    return new Response(null, {{ status: 304 }});
  }}

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('cache-control', options.cacheControl || 'public, max-age=86400');
  headers.set('accept-ranges', 'bytes');

  // Force download if requested
  if (options.forceDownload) {{
    const filename = key.split('/').pop() || 'download';
    headers.set('content-disposition', `attachment; filename="${{filename}}"`);
  }}

  // Handle range requests for streaming
  const range = request.headers.get('range');
  if (range && object.size) {{
    const rangeMatch = range.match(/bytes=(\\d+)-(\\d*)/);
    if (rangeMatch) {{
      const start = parseInt(rangeMatch[1]);
      const end = rangeMatch[2] ? parseInt(rangeMatch[2]) : object.size - 1;

      if (start >= object.size) {{
        return new Response('Range Not Satisfiable', {{
          status: 416,
          headers: {{ 'content-range': `bytes */${{object.size}}` }}
        }});
      }}

      headers.set('content-range', `bytes ${{start}}-${{end}}/${{object.size}}`);
      headers.set('content-length', (end - start + 1).toString());

      // R2 handles range requests automatically when using body
      return new Response(object.body, {{
        status: 206,
        headers
      }});
    }}
  }}

  return new Response(object.body, {{ headers }});
}}
'''

    def generate_delete_handler(self) -> str:
        """Generate delete handler."""
        return f'''// Delete handler for {self.bucket_name}
import {{ Env }} from './types';

interface DeleteOptions {{
  softDelete?: boolean;  // Move to trash prefix instead of deleting
  trashPrefix?: string;
}}

export async function handleDelete(
  request: Request,
  env: Env,
  key: string,
  options: DeleteOptions = {{}}
): Promise<Response> {{
  try {{
    if (options.softDelete) {{
      // Move to trash instead of deleting
      const trashPrefix = options.trashPrefix || 'trash/';
      const trashKey = `${{trashPrefix}}${{Date.now()}}/${{key}}`;

      // Copy to trash
      const object = await env.{self.binding_name}.get(key);
      if (object) {{
        await env.{self.binding_name}.put(trashKey, object.body, {{
          httpMetadata: object.httpMetadata,
          customMetadata: {{
            ...object.customMetadata,
            deletedAt: new Date().toISOString(),
            originalKey: key
          }}
        }});
      }}
    }}

    await env.{self.binding_name}.delete(key);

    return new Response(null, {{ status: 204 }});
  }} catch (error) {{
    console.error('Delete failed:', error);
    return new Response(JSON.stringify({{
      error: 'Delete failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }}), {{
      status: 500,
      headers: {{ 'content-type': 'application/json' }}
    }});
  }}
}}

// Bulk delete
export async function handleBulkDelete(
  env: Env,
  keys: string[]
): Promise<{{ deleted: string[]; failed: string[] }}> {{
  const deleted: string[] = [];
  const failed: string[] = [];

  await Promise.all(
    keys.map(async (key) => {{
      try {{
        await env.{self.binding_name}.delete(key);
        deleted.push(key);
      }} catch {{
        failed.push(key);
      }}
    }})
  );

  return {{ deleted, failed }};
}}
'''

    def generate_list_handler(self) -> str:
        """Generate list objects handler with pagination."""
        return f'''// List handler for {self.bucket_name}
import {{ Env }} from './types';

interface ListOptions {{
  prefix?: string;
  limit?: number;
  cursor?: string;
  delimiter?: string;
  includeMetadata?: boolean;
}}

interface ListResult {{
  objects: Array<{{
    key: string;
    size: number;
    uploaded: string;
    httpEtag: string;
    customMetadata?: Record<string, string>;
  }}>;
  truncated: boolean;
  cursor?: string;
  delimitedPrefixes?: string[];
}}

export async function handleList(
  env: Env,
  options: ListOptions = {{}}
): Promise<ListResult> {{
  const {{
    prefix = '',
    limit = 1000,
    cursor,
    delimiter,
    includeMetadata = false
  }} = options;

  const result = await env.{self.binding_name}.list({{
    prefix,
    limit,
    cursor,
    delimiter,
    include: includeMetadata ? ['customMetadata', 'httpMetadata'] : undefined
  }});

  return {{
    objects: result.objects.map(obj => ({{
      key: obj.key,
      size: obj.size,
      uploaded: obj.uploaded.toISOString(),
      httpEtag: obj.httpEtag,
      customMetadata: obj.customMetadata
    }})),
    truncated: result.truncated,
    cursor: result.truncated ? result.cursor : undefined,
    delimitedPrefixes: result.delimitedPrefixes
  }};
}}

// List all objects with automatic pagination
export async function listAll(
  env: Env,
  prefix: string = ''
): Promise<Array<{{ key: string; size: number }}>> {{
  const allObjects: Array<{{ key: string; size: number }}> = [];
  let cursor: string | undefined;

  do {{
    const result = await env.{self.binding_name}.list({{
      prefix,
      limit: 1000,
      cursor
    }});

    allObjects.push(...result.objects.map(obj => ({{
      key: obj.key,
      size: obj.size
    }})));

    cursor = result.truncated ? result.cursor : undefined;
  }} while (cursor);

  return allObjects;
}}
'''


# ============================================================
# PRESIGNED URL GENERATOR
# ============================================================

class PresignedURLGenerator:
    """Generates presigned URL handling code."""

    def __init__(self, bucket_name: str, account_id: str = "YOUR_ACCOUNT_ID"):
        self.bucket_name = bucket_name
        self.account_id = account_id

    def generate_presigned_url_worker(self) -> str:
        """Generate Worker code for presigned URL generation."""
        return f'''// Presigned URL generator for {self.bucket_name}
import {{ AwsClient }} from 'aws4fetch';

interface Env {{
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  R2_BUCKET_URL: string;
}}

interface PresignedURLRequest {{
  key: string;
  method: 'GET' | 'PUT';
  expiresIn?: number;  // seconds
  contentType?: string;  // required for PUT
}}

interface PresignedURLResponse {{
  url: string;
  expiresAt: string;
  method: string;
  key: string;
}}

export async function generatePresignedURL(
  env: Env,
  request: PresignedURLRequest
): Promise<PresignedURLResponse> {{
  const {{
    key,
    method,
    expiresIn = 3600,
    contentType
  }} = request;

  const client = new AwsClient({{
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    service: 's3',
    region: 'auto'
  }});

  const url = new URL(`${{env.R2_BUCKET_URL}}/${{key}}`);

  // Add S3 presigned URL parameters
  const expiresAt = new Date(Date.now() + expiresIn * 1000);
  url.searchParams.set('X-Amz-Expires', expiresIn.toString());

  const headers: Record<string, string> = {{}};
  if (method === 'PUT' && contentType) {{
    headers['Content-Type'] = contentType;
  }}

  const signedRequest = await client.sign(url.toString(), {{
    method,
    headers,
    aws: {{
      signQuery: true,
      datetime: new Date().toISOString().replace(/[:-]/g, '').split('.')[0] + 'Z'
    }}
  }});

  return {{
    url: signedRequest.url,
    expiresAt: expiresAt.toISOString(),
    method,
    key
  }};
}}

// API endpoint handler
export async function handlePresignedURLRequest(
  request: Request,
  env: Env
): Promise<Response> {{
  if (request.method !== 'POST') {{
    return new Response('Method Not Allowed', {{ status: 405 }});
  }}

  try {{
    const body = await request.json() as PresignedURLRequest;

    // Validate request
    if (!body.key) {{
      return new Response(JSON.stringify({{ error: 'key is required' }}), {{
        status: 400,
        headers: {{ 'content-type': 'application/json' }}
      }});
    }}

    if (body.method === 'PUT' && !body.contentType) {{
      return new Response(JSON.stringify({{ error: 'contentType is required for PUT' }}), {{
        status: 400,
        headers: {{ 'content-type': 'application/json' }}
      }});
    }}

    const result = await generatePresignedURL(env, body);

    return new Response(JSON.stringify(result), {{
      headers: {{ 'content-type': 'application/json' }}
    }});
  }} catch (error) {{
    return new Response(JSON.stringify({{
      error: 'Failed to generate presigned URL',
      message: error instanceof Error ? error.message : 'Unknown error'
    }}), {{
      status: 500,
      headers: {{ 'content-type': 'application/json' }}
    }});
  }}
}}
'''

    def generate_client_upload_code(self) -> str:
        """Generate client-side upload code using presigned URLs."""
        return '''// Client-side upload using presigned URL
interface UploadConfig {
  file: File;
  presignedUrl: string;
  onProgress?: (percent: number) => void;
}

export async function uploadWithPresignedURL(config: UploadConfig): Promise<void> {
  const { file, presignedUrl, onProgress } = config;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed'));
    });

    xhr.open('PUT', presignedUrl);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  });
}

// React hook for upload with progress
import { useState, useCallback } from 'react';

export function usePresignedUpload() {
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const upload = useCallback(async (file: File, presignedUrl: string) => {
    setIsUploading(true);
    setProgress(0);
    setError(null);

    try {
      await uploadWithPresignedURL({
        file,
        presignedUrl,
        onProgress: setProgress
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Upload failed'));
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, []);

  return { upload, progress, isUploading, error };
}
'''


# ============================================================
# MULTIPART UPLOAD GENERATOR
# ============================================================

class MultipartUploadGenerator:
    """Generates multipart upload handling code."""

    def __init__(self, bucket_name: str, config: MultipartConfig):
        self.bucket_name = bucket_name
        self.config = config
        self.binding_name = bucket_name.upper().replace('-', '_')

    def generate_multipart_upload_worker(self) -> str:
        """Generate Worker code for multipart uploads."""
        return f'''// Multipart upload handler for {self.bucket_name}
import {{ Env }} from './types';

interface MultipartUploadState {{
  uploadId: string;
  key: string;
  parts: Array<{{ partNumber: number; etag: string }}>;
  partSize: number;
}}

// Initialize multipart upload
export async function initMultipartUpload(
  env: Env,
  key: string,
  contentType: string = 'application/octet-stream'
): Promise<{{ uploadId: string; key: string }}> {{
  const multipartUpload = await env.{self.binding_name}.createMultipartUpload(key, {{
    httpMetadata: {{ contentType }}
  }});

  return {{
    uploadId: multipartUpload.uploadId,
    key: multipartUpload.key
  }};
}}

// Upload a single part
export async function uploadPart(
  env: Env,
  key: string,
  uploadId: string,
  partNumber: number,
  body: ArrayBuffer | ReadableStream
): Promise<{{ partNumber: number; etag: string }}> {{
  const multipartUpload = env.{self.binding_name}.resumeMultipartUpload(key, uploadId);

  const uploadedPart = await multipartUpload.uploadPart(partNumber, body);

  return {{
    partNumber,
    etag: uploadedPart.etag
  }};
}}

// Complete multipart upload
export async function completeMultipartUpload(
  env: Env,
  key: string,
  uploadId: string,
  parts: Array<{{ partNumber: number; etag: string }}>
): Promise<{{ key: string; etag: string }}> {{
  const multipartUpload = env.{self.binding_name}.resumeMultipartUpload(key, uploadId);

  // Sort parts by part number
  const sortedParts = [...parts].sort((a, b) => a.partNumber - b.partNumber);

  const completedUpload = await multipartUpload.complete(
    sortedParts.map(p => ({{
      partNumber: p.partNumber,
      etag: p.etag
    }}))
  );

  return {{
    key: completedUpload.key,
    etag: completedUpload.httpEtag
  }};
}}

// Abort multipart upload
export async function abortMultipartUpload(
  env: Env,
  key: string,
  uploadId: string
): Promise<void> {{
  const multipartUpload = env.{self.binding_name}.resumeMultipartUpload(key, uploadId);
  await multipartUpload.abort();
}}

// API routes handler
export async function handleMultipartAPI(
  request: Request,
  env: Env
): Promise<Response> {{
  const url = new URL(request.url);
  const action = url.searchParams.get('action');

  try {{
    switch (action) {{
      case 'init': {{
        const {{ key, contentType }} = await request.json();
        const result = await initMultipartUpload(env, key, contentType);
        return Response.json(result);
      }}

      case 'uploadPart': {{
        const key = url.searchParams.get('key')!;
        const uploadId = url.searchParams.get('uploadId')!;
        const partNumber = parseInt(url.searchParams.get('partNumber')!);
        const result = await uploadPart(env, key, uploadId, partNumber, request.body!);
        return Response.json(result);
      }}

      case 'complete': {{
        const {{ key, uploadId, parts }} = await request.json();
        const result = await completeMultipartUpload(env, key, uploadId, parts);
        return Response.json(result);
      }}

      case 'abort': {{
        const {{ key, uploadId }} = await request.json();
        await abortMultipartUpload(env, key, uploadId);
        return new Response(null, {{ status: 204 }});
      }}

      default:
        return new Response('Invalid action', {{ status: 400 }});
    }}
  }} catch (error) {{
    return Response.json(
      {{ error: error instanceof Error ? error.message : 'Unknown error' }},
      {{ status: 500 }}
    );
  }}
}}
'''

    def generate_client_multipart_upload(self) -> str:
        """Generate client-side multipart upload code."""
        return f'''// Client-side multipart upload
const PART_SIZE = {self.config.part_size_bytes}; // {self.config.part_size_mb}MB
const MAX_CONCURRENT = {self.config.max_concurrent_parts};

interface MultipartUploadProgress {{
  totalParts: number;
  uploadedParts: number;
  percent: number;
  bytesUploaded: number;
  totalBytes: number;
}}

interface MultipartUploadOptions {{
  file: File;
  apiEndpoint: string;
  onProgress?: (progress: MultipartUploadProgress) => void;
  abortSignal?: AbortSignal;
}}

export async function multipartUpload(options: MultipartUploadOptions): Promise<string> {{
  const {{ file, apiEndpoint, onProgress, abortSignal }} = options;
  const totalParts = Math.ceil(file.size / PART_SIZE);
  let uploadedParts = 0;
  let bytesUploaded = 0;

  // Initialize upload
  const initResponse = await fetch(`${{apiEndpoint}}?action=init`, {{
    method: 'POST',
    headers: {{ 'Content-Type': 'application/json' }},
    body: JSON.stringify({{
      key: file.name,
      contentType: file.type || 'application/octet-stream'
    }}),
    signal: abortSignal
  }});

  if (!initResponse.ok) {{
    throw new Error('Failed to initialize upload');
  }}

  const {{ uploadId, key }} = await initResponse.json();
  const parts: Array<{{ partNumber: number; etag: string }}> = [];

  try {{
    // Upload parts with concurrency control
    const uploadPart = async (partNumber: number): Promise<void> => {{
      const start = (partNumber - 1) * PART_SIZE;
      const end = Math.min(start + PART_SIZE, file.size);
      const blob = file.slice(start, end);

      const response = await fetch(
        `${{apiEndpoint}}?action=uploadPart&key=${{encodeURIComponent(key)}}&uploadId=${{uploadId}}&partNumber=${{partNumber}}`,
        {{
          method: 'POST',
          body: blob,
          signal: abortSignal
        }}
      );

      if (!response.ok) {{
        throw new Error(`Failed to upload part ${{partNumber}}`);
      }}

      const result = await response.json();
      parts.push(result);

      uploadedParts++;
      bytesUploaded += end - start;

      if (onProgress) {{
        onProgress({{
          totalParts,
          uploadedParts,
          percent: Math.round((uploadedParts / totalParts) * 100),
          bytesUploaded,
          totalBytes: file.size
        }});
      }}
    }};

    // Upload parts with concurrency limit
    const partNumbers = Array.from({{ length: totalParts }}, (_, i) => i + 1);

    for (let i = 0; i < partNumbers.length; i += MAX_CONCURRENT) {{
      const batch = partNumbers.slice(i, i + MAX_CONCURRENT);
      await Promise.all(batch.map(uploadPart));
    }}

    // Complete upload
    const completeResponse = await fetch(`${{apiEndpoint}}?action=complete`, {{
      method: 'POST',
      headers: {{ 'Content-Type': 'application/json' }},
      body: JSON.stringify({{ key, uploadId, parts }}),
      signal: abortSignal
    }});

    if (!completeResponse.ok) {{
      throw new Error('Failed to complete upload');
    }}

    const {{ etag }} = await completeResponse.json();
    return etag;
  }} catch (error) {{
    // Abort upload on error
    await fetch(`${{apiEndpoint}}?action=abort`, {{
      method: 'POST',
      headers: {{ 'Content-Type': 'application/json' }},
      body: JSON.stringify({{ key, uploadId }})
    }}).catch(() => {{}});

    throw error;
  }}
}}
'''


# ============================================================
# IMAGE PROCESSING GENERATOR
# ============================================================

class ImageProcessingGenerator:
    """Generates image transformation and processing code."""

    def __init__(self, bucket_name: str):
        self.bucket_name = bucket_name
        self.binding_name = bucket_name.upper().replace('-', '_')

    def generate_image_transform_worker(self) -> str:
        """Generate Worker for image transformations using Cloudflare Images."""
        return f'''// Image transformation Worker for {self.bucket_name}
import {{ Env }} from './types';

interface TransformOptions {{
  width?: number;
  height?: number;
  fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad';
  quality?: number;
  format?: 'auto' | 'webp' | 'avif' | 'jpeg' | 'png';
  blur?: number;
  sharpen?: number;
  brightness?: number;
  contrast?: number;
}}

function parseTransformOptions(url: URL): TransformOptions {{
  const options: TransformOptions = {{}};

  const width = url.searchParams.get('w') || url.searchParams.get('width');
  const height = url.searchParams.get('h') || url.searchParams.get('height');
  const quality = url.searchParams.get('q') || url.searchParams.get('quality');
  const format = url.searchParams.get('f') || url.searchParams.get('format');
  const fit = url.searchParams.get('fit');

  if (width) options.width = parseInt(width);
  if (height) options.height = parseInt(height);
  if (quality) options.quality = parseInt(quality);
  if (format) options.format = format as TransformOptions['format'];
  if (fit) options.fit = fit as TransformOptions['fit'];

  return options;
}}

function buildImageURL(originalURL: string, options: TransformOptions): string {{
  const transformParams: string[] = [];

  if (options.width) transformParams.push(`width=${{options.width}}`);
  if (options.height) transformParams.push(`height=${{options.height}}`);
  if (options.fit) transformParams.push(`fit=${{options.fit}}`);
  if (options.quality) transformParams.push(`quality=${{options.quality}}`);
  if (options.format) transformParams.push(`format=${{options.format}}`);
  if (options.blur) transformParams.push(`blur=${{options.blur}}`);
  if (options.sharpen) transformParams.push(`sharpen=${{options.sharpen}}`);

  if (transformParams.length === 0) return originalURL;

  return `/cdn-cgi/image/${{transformParams.join(',')}}/${{originalURL}}`;
}}

export async function handleImageRequest(
  request: Request,
  env: Env
): Promise<Response> {{
  const url = new URL(request.url);
  const key = url.pathname.slice(1).split('?')[0];

  // Check if image exists
  const object = await env.{self.binding_name}.head(key);
  if (!object) {{
    return new Response('Image not found', {{ status: 404 }});
  }}

  // Check if it's an image
  const contentType = object.httpMetadata?.contentType || '';
  if (!contentType.startsWith('image/')) {{
    return new Response('Not an image', {{ status: 400 }});
  }}

  const options = parseTransformOptions(url);

  // If no transforms requested, serve original
  if (Object.keys(options).length === 0) {{
    const image = await env.{self.binding_name}.get(key);
    if (!image) return new Response('Not found', {{ status: 404 }});

    const headers = new Headers();
    image.writeHttpMetadata(headers);
    headers.set('cache-control', 'public, max-age=31536000, immutable');

    return new Response(image.body, {{ headers }});
  }}

  // Use Cloudflare Image Resizing
  const imageURL = buildImageURL(url.origin + '/' + key, options);

  return fetch(imageURL, {{
    cf: {{
      image: {{
        ...options,
        'origin-auth': 'share-publicly'
      }}
    }}
  }});
}}

// Generate srcset for responsive images
export function generateSrcSet(
  baseURL: string,
  widths: number[] = [320, 640, 768, 1024, 1280, 1536]
): string {{
  return widths
    .map(w => `${{baseURL}}?w=${{w}} ${{w}}w`)
    .join(', ');
}}
'''


# ============================================================
# R2 REPORTER
# ============================================================

class R2Reporter:
    """Generates ASCII dashboard reports for R2 storage."""

    def __init__(self, bucket_config: BucketConfig):
        self.config = bucket_config

    def generate_status_dashboard(self) -> str:
        """Generate bucket status dashboard."""
        return f'''
R2 STORAGE SPECIFICATION
═══════════════════════════════════════
Bucket: {self.config.name}
Region: {self.config.location_hint.region_name}
Time: {{timestamp}}
═══════════════════════════════════════

BUCKET OVERVIEW
────────────────────────────────────────
┌─────────────────────────────────────┐
│       R2 STATUS                     │
│                                     │
│  Bucket: {self.config.name:<24} │
│  Location: {self.config.location_hint.value:<22} │
│  Visibility: {self.config.access_level.value:<20} │
│                                     │
│  Objects: {{object_count:<21}} │
│  Total Size: {{total_size:<18}} │
│  Egress Cost: $0.00                 │
│                                     │
│  CORS: {'enabled' if self.config.cors_rules else 'disabled':<26} │
│  Custom Domain: {self.config.custom_domain or 'none':<16} │
│                                     │
│  Storage: ████████░░ {{usage}}%     │
│  Status: [●] Bucket Active          │
└─────────────────────────────────────┘

BUCKET CONFIGURATION
────────────────────────────────────────
| Setting | Value |
|---------|-------|
| Name | {self.config.name} |
| Location Hint | {self.config.location_hint.value} |
| Public Access | {'yes' if self.config.enable_public_access else 'no'} |
| Custom Domain | {self.config.custom_domain or 'none'} |

CORS RULES
────────────────────────────────────────
{self._format_cors_rules()}

LIFECYCLE RULES
────────────────────────────────────────
{self._format_lifecycle_rules()}

IMPLEMENTATION CHECKLIST
────────────────────────────────────────
• [●/○] Bucket created
• [●/○] CORS configured
• [●/○] Worker binding added
• [●/○] Upload/download working
• [●/○] Public access configured

R2 Status: ● Storage Operational
'''

    def _format_cors_rules(self) -> str:
        """Format CORS rules for display."""
        if not self.config.cors_rules:
            return "No CORS rules configured"

        rules = []
        for i, rule in enumerate(self.config.cors_rules, 1):
            rules.append(f"Rule {i}:")
            rules.append(f"  Origins: {', '.join(rule.allowed_origins)}")
            rules.append(f"  Methods: {', '.join(m.value for m in rule.allowed_methods)}")
            rules.append(f"  Max Age: {rule.max_age_seconds}s")
        return '\n'.join(rules)

    def _format_lifecycle_rules(self) -> str:
        """Format lifecycle rules for display."""
        if not self.config.lifecycle_rules:
            return "No lifecycle rules configured"

        rules = []
        for rule in self.config.lifecycle_rules:
            prefix = f" (prefix: {rule.prefix})" if rule.prefix else ""
            rules.append(f"• {rule.id}: {rule.action.value} after {rule.days} days{prefix}")
        return '\n'.join(rules)


# ============================================================
# MAIN ENGINE
# ============================================================

class CloudflareR2Engine:
    """Main orchestrator for Cloudflare R2 storage solutions."""

    def __init__(self):
        self.bucket_configs: Dict[str, BucketConfig] = {}

    def create_bucket(self, config: BucketConfig) -> Dict[str, str]:
        """Create a new R2 bucket with all necessary configurations."""
        self.bucket_configs[config.name] = config

        bucket_manager = BucketManager(config)
        object_ops = ObjectOperationsGenerator(config.name)
        presigned_gen = PresignedURLGenerator(config.name)
        multipart_gen = MultipartUploadGenerator(config.name, MultipartConfig())
        reporter = R2Reporter(config)

        return {
            "wrangler_config": bucket_manager.generate_wrangler_config(),
            "creation_command": bucket_manager.generate_bucket_creation_command(),
            "cors_config": bucket_manager.generate_cors_config(),
            "lifecycle_config": bucket_manager.generate_lifecycle_config(),
            "env_types": bucket_manager.generate_env_types(),
            "upload_handler": object_ops.generate_upload_handler(),
            "download_handler": object_ops.generate_download_handler(),
            "delete_handler": object_ops.generate_delete_handler(),
            "list_handler": object_ops.generate_list_handler(),
            "presigned_url_handler": presigned_gen.generate_presigned_url_worker(),
            "client_upload": presigned_gen.generate_client_upload_code(),
            "multipart_handler": multipart_gen.generate_multipart_upload_worker(),
            "client_multipart": multipart_gen.generate_client_multipart_upload(),
            "public_access_worker": bucket_manager.generate_public_access_worker() if config.enable_public_access else None,
            "dashboard": reporter.generate_status_dashboard()
        }

    def generate_complete_worker(self, config: BucketConfig) -> str:
        """Generate a complete R2 Worker with all handlers."""
        binding = config.name.upper().replace('-', '_')

        return f'''// Complete R2 Worker for {config.name}
import {{ Hono }} from 'hono';
import {{ cors }} from 'hono/cors';

interface Env {{
  {binding}: R2Bucket;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
}}

const app = new Hono<{{ Bindings: Env }}>()

// CORS middleware
app.use('/*', cors({{
  origin: {json.dumps(config.cors_rules[0].allowed_origins if config.cors_rules else ['*'])},
  allowMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['ETag', 'Content-Length'],
  maxAge: 86400
}}))

// Health check
app.get('/', (c) => c.json({{ status: 'ok', bucket: '{config.name}' }}))

// List objects
app.get('/list', async (c) => {{
  const prefix = c.req.query('prefix') || '';
  const limit = parseInt(c.req.query('limit') || '100');
  const cursor = c.req.query('cursor');

  const result = await c.env.{binding}.list({{
    prefix,
    limit,
    cursor
  }});

  return c.json({{
    objects: result.objects.map(obj => ({{
      key: obj.key,
      size: obj.size,
      uploaded: obj.uploaded
    }})),
    truncated: result.truncated,
    cursor: result.cursor
  }});
}})

// Get object
app.get('/objects/*', async (c) => {{
  const key = c.req.path.replace('/objects/', '');
  const object = await c.env.{binding}.get(key);

  if (!object) {{
    return c.json({{ error: 'Not found' }}, 404);
  }}

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('cache-control', 'public, max-age=31536000');

  return new Response(object.body, {{ headers }});
}})

// Upload object
app.put('/objects/*', async (c) => {{
  const key = c.req.path.replace('/objects/', '');
  const contentType = c.req.header('content-type') || 'application/octet-stream';

  const object = await c.env.{binding}.put(key, c.req.raw.body, {{
    httpMetadata: {{
      contentType,
      cacheControl: 'public, max-age=31536000'
    }},
    customMetadata: {{
      uploadedAt: new Date().toISOString()
    }}
  }});

  return c.json({{
    key,
    etag: object.httpEtag,
    uploaded: new Date().toISOString()
  }}, 201);
}})

// Delete object
app.delete('/objects/*', async (c) => {{
  const key = c.req.path.replace('/objects/', '');
  await c.env.{binding}.delete(key);
  return c.body(null, 204);
}})

// Get object metadata
app.head('/objects/*', async (c) => {{
  const key = c.req.path.replace('/objects/', '');
  const object = await c.env.{binding}.head(key);

  if (!object) {{
    return c.body(null, 404);
  }}

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('content-length', object.size.toString());

  return c.body(null, 200, Object.fromEntries(headers));
}})

export default app;
'''

    def generate_image_cdn_worker(self, config: BucketConfig) -> str:
        """Generate an image CDN Worker with transformations."""
        image_gen = ImageProcessingGenerator(config.name)
        return image_gen.generate_image_transform_worker()

    def generate_file_browser_api(self, config: BucketConfig) -> str:
        """Generate a file browser API for R2."""
        binding = config.name.upper().replace('-', '_')

        return f'''// File Browser API for {config.name}
interface Env {{
  {binding}: R2Bucket;
}}

interface FileInfo {{
  name: string;
  key: string;
  type: 'file' | 'folder';
  size?: number;
  modified?: string;
  contentType?: string;
}}

export async function listDirectory(
  env: Env,
  path: string = ''
): Promise<{{ files: FileInfo[]; path: string }}> {{
  const prefix = path ? (path.endsWith('/') ? path : path + '/') : '';

  const result = await env.{binding}.list({{
    prefix,
    delimiter: '/'
  }});

  const files: FileInfo[] = [];

  // Add folders (common prefixes)
  for (const prefix of result.delimitedPrefixes || []) {{
    const name = prefix.slice(path.length).replace(/\\/$/, '').split('/').pop() || prefix;
    files.push({{
      name,
      key: prefix,
      type: 'folder'
    }});
  }}

  // Add files
  for (const obj of result.objects) {{
    // Skip the directory marker itself
    if (obj.key === prefix) continue;

    const name = obj.key.slice(prefix.length);
    // Skip if this is in a subdirectory
    if (name.includes('/')) continue;

    files.push({{
      name,
      key: obj.key,
      type: 'file',
      size: obj.size,
      modified: obj.uploaded.toISOString(),
      contentType: obj.httpMetadata?.contentType
    }});
  }}

  return {{ files, path }};
}}

// Move/rename object
export async function moveObject(
  env: Env,
  sourceKey: string,
  destKey: string
): Promise<void> {{
  const source = await env.{binding}.get(sourceKey);
  if (!source) throw new Error('Source not found');

  await env.{binding}.put(destKey, source.body, {{
    httpMetadata: source.httpMetadata,
    customMetadata: source.customMetadata
  }});

  await env.{binding}.delete(sourceKey);
}}

// Copy object
export async function copyObject(
  env: Env,
  sourceKey: string,
  destKey: string
): Promise<void> {{
  const source = await env.{binding}.get(sourceKey);
  if (!source) throw new Error('Source not found');

  await env.{binding}.put(destKey, source.body, {{
    httpMetadata: source.httpMetadata,
    customMetadata: {{
      ...source.customMetadata,
      copiedFrom: sourceKey,
      copiedAt: new Date().toISOString()
    }}
  }});
}}

// Get folder size
export async function getFolderSize(
  env: Env,
  prefix: string
): Promise<{{ totalSize: number; fileCount: number }}> {{
  let totalSize = 0;
  let fileCount = 0;
  let cursor: string | undefined;

  do {{
    const result = await env.{binding}.list({{
      prefix,
      cursor,
      limit: 1000
    }});

    for (const obj of result.objects) {{
      totalSize += obj.size;
      fileCount++;
    }}

    cursor = result.truncated ? result.cursor : undefined;
  }} while (cursor);

  return {{ totalSize, fileCount }};
}}
'''

    def demonstrate(self) -> str:
        """Generate demonstration of R2 capabilities."""
        # Create example buckets
        assets_bucket = BucketConfig.public_assets("my-assets", "assets.example.com")
        uploads_bucket = BucketConfig.user_uploads("user-uploads", ["https://example.com"], 30)
        backup_bucket = BucketConfig.backup_storage("backups", LocationHint.ENAM)

        demo_output = []
        demo_output.append("=" * 60)
        demo_output.append("CLOUDFLARE R2 ENGINE DEMONSTRATION")
        demo_output.append("=" * 60)

        # Assets bucket
        demo_output.append("\n### Public Assets Bucket ###")
        assets_result = self.create_bucket(assets_bucket)
        demo_output.append(f"Created: {assets_bucket.name}")
        demo_output.append(f"Wrangler Config:\n{assets_result['wrangler_config']}")

        # User uploads bucket
        demo_output.append("\n### User Uploads Bucket ###")
        uploads_result = self.create_bucket(uploads_bucket)
        demo_output.append(f"Created: {uploads_bucket.name}")
        demo_output.append(f"CORS Config:\n{uploads_result['cors_config']}")

        # Backup bucket
        demo_output.append("\n### Backup Storage Bucket ###")
        backup_result = self.create_bucket(backup_bucket)
        demo_output.append(f"Created: {backup_bucket.name}")
        demo_output.append(f"Lifecycle Config:\n{backup_result['lifecycle_config']}")

        # Complete Worker
        demo_output.append("\n### Complete R2 Worker ###")
        demo_output.append(self.generate_complete_worker(assets_bucket)[:1500] + "...")

        demo_output.append("\n" + "=" * 60)
        demo_output.append("R2 Engine demonstration complete!")
        demo_output.append("=" * 60)

        return '\n'.join(demo_output)


# ============================================================
# CLI INTERFACE
# ============================================================

def main():
    """CLI entry point for Cloudflare R2 Engine."""
    import argparse

    parser = argparse.ArgumentParser(
        description='CLOUDFLARE.R2.EXE - Object Storage Specialist',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  %(prog)s create my-bucket --public
  %(prog)s create user-uploads --cors "https://example.com" --lifecycle 30
  %(prog)s upload-handler my-bucket
  %(prog)s presigned my-bucket
  %(prog)s multipart my-bucket --part-size 100
  %(prog)s image-cdn my-bucket
  %(prog)s storage-classes
  %(prog)s locations
  %(prog)s demo
        '''
    )

    subparsers = parser.add_subparsers(dest='command', help='Available commands')

    # Create bucket command
    create_parser = subparsers.add_parser('create', help='Create R2 bucket configuration')
    create_parser.add_argument('name', help='Bucket name')
    create_parser.add_argument('--public', action='store_true', help='Enable public access')
    create_parser.add_argument('--location', choices=[l.value for l in LocationHint],
                               default='auto', help='Location hint')
    create_parser.add_argument('--cors', nargs='+', help='Allowed CORS origins')
    create_parser.add_argument('--lifecycle', type=int, help='Delete after N days')
    create_parser.add_argument('--domain', help='Custom domain')

    # Upload handler command
    upload_parser = subparsers.add_parser('upload-handler', help='Generate upload handler')
    upload_parser.add_argument('bucket', help='Bucket name')
    upload_parser.add_argument('--max-size', type=int, default=100, help='Max file size in MB')

    # Download handler command
    download_parser = subparsers.add_parser('download-handler', help='Generate download handler')
    download_parser.add_argument('bucket', help='Bucket name')

    # Presigned URL command
    presigned_parser = subparsers.add_parser('presigned', help='Generate presigned URL handler')
    presigned_parser.add_argument('bucket', help='Bucket name')
    presigned_parser.add_argument('--account-id', default='YOUR_ACCOUNT_ID', help='Account ID')

    # Multipart upload command
    multipart_parser = subparsers.add_parser('multipart', help='Generate multipart upload handler')
    multipart_parser.add_argument('bucket', help='Bucket name')
    multipart_parser.add_argument('--part-size', type=int, default=10, help='Part size in MB')

    # Image CDN command
    image_parser = subparsers.add_parser('image-cdn', help='Generate image CDN Worker')
    image_parser.add_argument('bucket', help='Bucket name')

    # Complete Worker command
    worker_parser = subparsers.add_parser('worker', help='Generate complete R2 Worker')
    worker_parser.add_argument('bucket', help='Bucket name')
    worker_parser.add_argument('--public', action='store_true', help='Enable public access')

    # Storage classes command
    subparsers.add_parser('storage-classes', help='List storage classes')

    # Locations command
    subparsers.add_parser('locations', help='List location hints')

    # Demo command
    subparsers.add_parser('demo', help='Run demonstration')

    args = parser.parse_args()
    engine = CloudflareR2Engine()

    if args.command == 'create':
        location = LocationHint(args.location)
        cors_rules = []
        if args.cors:
            cors_rules = [CORSRule.upload_enabled(args.cors)]

        lifecycle_rules = [LifecycleRule.cleanup_incomplete_uploads()]
        if args.lifecycle:
            lifecycle_rules.append(
                LifecycleRule.delete_after_days("auto-delete", args.lifecycle)
            )

        config = BucketConfig(
            name=args.name,
            location_hint=location,
            access_level=AccessLevel.PUBLIC_READ if args.public else AccessLevel.PRIVATE,
            cors_rules=cors_rules,
            lifecycle_rules=lifecycle_rules,
            custom_domain=args.domain,
            enable_public_access=args.public
        )

        result = engine.create_bucket(config)
        print(result['dashboard'])
        print("\n### Wrangler Config ###")
        print(result['wrangler_config'])
        print("\n### Creation Command ###")
        print(result['creation_command'])

    elif args.command == 'upload-handler':
        gen = ObjectOperationsGenerator(args.bucket)
        print(gen.generate_upload_handler())

    elif args.command == 'download-handler':
        gen = ObjectOperationsGenerator(args.bucket)
        print(gen.generate_download_handler())

    elif args.command == 'presigned':
        gen = PresignedURLGenerator(args.bucket, args.account_id)
        print(gen.generate_presigned_url_worker())
        print("\n### Client Upload Code ###")
        print(gen.generate_client_upload_code())

    elif args.command == 'multipart':
        config = MultipartConfig(part_size_mb=args.part_size)
        gen = MultipartUploadGenerator(args.bucket, config)
        print(gen.generate_multipart_upload_worker())
        print("\n### Client Multipart Upload ###")
        print(gen.generate_client_multipart_upload())

    elif args.command == 'image-cdn':
        gen = ImageProcessingGenerator(args.bucket)
        print(gen.generate_image_transform_worker())

    elif args.command == 'worker':
        config = BucketConfig(
            name=args.bucket,
            access_level=AccessLevel.PUBLIC_READ if args.public else AccessLevel.PRIVATE,
            cors_rules=[CORSRule.permissive()] if args.public else [],
            enable_public_access=args.public
        )
        print(engine.generate_complete_worker(config))

    elif args.command == 'storage-classes':
        print("\nR2 STORAGE CLASSES")
        print("=" * 50)
        for sc in StorageClass:
            print(f"\n{sc.value.upper()}")
            print(f"  Use Case: {sc.use_case}")
            print(f"  Cost: ${sc.storage_cost_per_gb}/GB/month")
            print(f"  Retrieval: {sc.retrieval_time}")
            print(f"  Min Duration: {sc.minimum_storage_duration} days")

    elif args.command == 'locations':
        print("\nR2 LOCATION HINTS")
        print("=" * 50)
        for loc in LocationHint:
            print(f"\n{loc.value.upper()}: {loc.region_name}")
            print(f"  Example Cities: {', '.join(loc.example_cities)}")

    elif args.command == 'demo':
        print(engine.demonstrate())

    else:
        parser.print_help()


if __name__ == '__main__':
    main()
```

---

## QUICK COMMANDS

- `/cloudflare-r2 create [bucket]` - Create R2 bucket
- `/cloudflare-r2 cors [bucket]` - Configure CORS rules
- `/cloudflare-r2 upload [pattern]` - Generate upload handler
- `/cloudflare-r2 presigned [bucket]` - Create presigned URL logic
- `/cloudflare-r2 public [bucket]` - Enable public access

$ARGUMENTS
