# Cloudinary Media Management

Production-ready Cloudinary integration for image/video upload, transformation, and optimization.

## Overview

Cloudinary provides cloud-based image and video management with powerful transformation, optimization, and delivery capabilities.

## Quick Start

```bash
npm install cloudinary multer-storage-cloudinary
```

## TypeScript Implementation

### Cloudinary Client Configuration

```typescript
// src/storage/cloudinary-client.ts
import { v2 as cloudinary, UploadApiResponse, UploadApiOptions } from 'cloudinary';

interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

interface UploadOptions {
  folder?: string;
  publicId?: string;
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
  transformation?: TransformationOptions[];
  tags?: string[];
  context?: Record<string, string>;
  eager?: TransformationOptions[];
  eagerAsync?: boolean;
  format?: string;
  quality?: number | 'auto';
}

interface TransformationOptions {
  width?: number;
  height?: number;
  crop?: 'fill' | 'fit' | 'scale' | 'thumb' | 'crop' | 'pad';
  gravity?: 'auto' | 'face' | 'center' | 'north' | 'south' | 'east' | 'west';
  quality?: number | 'auto' | 'auto:low' | 'auto:eco' | 'auto:good' | 'auto:best';
  format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
  effect?: string;
  overlay?: string;
  angle?: number;
  radius?: number | 'max';
  border?: string;
  background?: string;
  aspectRatio?: string;
  fetchFormat?: 'auto';
  flags?: string[];
}

interface UploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  resourceType: string;
  createdAt: string;
  etag: string;
  eager?: Array<{
    url: string;
    secureUrl: string;
    width: number;
    height: number;
  }>;
}

interface SearchResult {
  resources: Array<{
    publicId: string;
    format: string;
    resourceType: string;
    type: string;
    url: string;
    secureUrl: string;
    width: number;
    height: number;
    bytes: number;
    createdAt: string;
    tags: string[];
    context?: Record<string, string>;
  }>;
  totalCount: number;
  nextCursor?: string;
}

export class CloudinaryStorage {
  constructor(config: CloudinaryConfig) {
    cloudinary.config({
      cloud_name: config.cloudName,
      api_key: config.apiKey,
      api_secret: config.apiSecret,
      secure: true,
    });
  }

  // Upload from buffer or URL
  async upload(
    source: Buffer | string,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    const uploadOptions: UploadApiOptions = {
      folder: options.folder,
      public_id: options.publicId,
      resource_type: options.resourceType || 'auto',
      tags: options.tags,
      context: options.context,
      eager: options.eager?.map(this.transformToCloudinary),
      eager_async: options.eagerAsync,
      format: options.format,
      quality: options.quality,
      transformation: options.transformation?.map(this.transformToCloudinary),
    };

    // Handle buffer upload
    const uploadSource = Buffer.isBuffer(source)
      ? `data:application/octet-stream;base64,${source.toString('base64')}`
      : source;

    const result = await cloudinary.uploader.upload(uploadSource, uploadOptions);

    return this.mapUploadResult(result);
  }

  // Upload from stream
  async uploadStream(
    stream: NodeJS.ReadableStream,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: options.folder,
          public_id: options.publicId,
          resource_type: options.resourceType || 'auto',
          tags: options.tags,
          eager: options.eager?.map(this.transformToCloudinary),
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(this.mapUploadResult(result!));
        }
      );

      stream.pipe(uploadStream);
    });
  }

  // Delete asset
  async delete(publicId: string, resourceType: string = 'image'): Promise<void> {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
  }

  // Delete multiple assets
  async deleteMany(
    publicIds: string[],
    resourceType: string = 'image'
  ): Promise<{ deleted: string[]; errors: string[] }> {
    const result = await cloudinary.api.delete_resources(publicIds, {
      resource_type: resourceType,
    });

    const deleted = Object.entries(result.deleted)
      .filter(([, status]) => status === 'deleted')
      .map(([id]) => id);

    const errors = Object.entries(result.deleted)
      .filter(([, status]) => status !== 'deleted')
      .map(([id]) => id);

    return { deleted, errors };
  }

  // Generate transformation URL
  url(
    publicId: string,
    transformations: TransformationOptions | TransformationOptions[] = {}
  ): string {
    const transforms = Array.isArray(transformations)
      ? transformations
      : [transformations];

    return cloudinary.url(publicId, {
      transformation: transforms.map(this.transformToCloudinary),
      secure: true,
    });
  }

  // Generate responsive image URLs
  responsiveUrls(
    publicId: string,
    widths: number[] = [320, 640, 960, 1280, 1920]
  ): Record<number, string> {
    const urls: Record<number, string> = {};

    for (const width of widths) {
      urls[width] = this.url(publicId, {
        width,
        crop: 'scale',
        quality: 'auto',
        format: 'auto',
      });
    }

    return urls;
  }

  // Generate srcset for responsive images
  srcset(
    publicId: string,
    widths: number[] = [320, 640, 960, 1280, 1920]
  ): string {
    const urls = this.responsiveUrls(publicId, widths);
    return Object.entries(urls)
      .map(([width, url]) => `${url} ${width}w`)
      .join(', ');
  }

  // Search assets
  async search(
    query: string,
    options: {
      maxResults?: number;
      nextCursor?: string;
      sortBy?: { field: string; direction: 'asc' | 'desc' }[];
    } = {}
  ): Promise<SearchResult> {
    let search = cloudinary.search.expression(query);

    if (options.maxResults) {
      search = search.max_results(options.maxResults);
    }

    if (options.nextCursor) {
      search = search.next_cursor(options.nextCursor);
    }

    if (options.sortBy) {
      for (const sort of options.sortBy) {
        search = search.sort_by(sort.field, sort.direction);
      }
    }

    const result = await search.execute();

    return {
      resources: result.resources.map((r: any) => ({
        publicId: r.public_id,
        format: r.format,
        resourceType: r.resource_type,
        type: r.type,
        url: r.url,
        secureUrl: r.secure_url,
        width: r.width,
        height: r.height,
        bytes: r.bytes,
        createdAt: r.created_at,
        tags: r.tags || [],
        context: r.context?.custom,
      })),
      totalCount: result.total_count,
      nextCursor: result.next_cursor,
    };
  }

  // Get asset details
  async getDetails(
    publicId: string,
    resourceType: string = 'image'
  ): Promise<{
    publicId: string;
    format: string;
    width: number;
    height: number;
    bytes: number;
    url: string;
    secureUrl: string;
    createdAt: string;
    tags: string[];
    context?: Record<string, string>;
  }> {
    const result = await cloudinary.api.resource(publicId, {
      resource_type: resourceType,
    });

    return {
      publicId: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      url: result.url,
      secureUrl: result.secure_url,
      createdAt: result.created_at,
      tags: result.tags || [],
      context: result.context?.custom,
    };
  }

  // Add tags to asset
  async addTags(publicId: string, tags: string[]): Promise<void> {
    await cloudinary.uploader.add_tag(tags.join(','), [publicId]);
  }

  // Remove tags from asset
  async removeTags(publicId: string, tags: string[]): Promise<void> {
    await cloudinary.uploader.remove_tag(tags.join(','), [publicId]);
  }

  // Create folder
  async createFolder(path: string): Promise<void> {
    await cloudinary.api.create_folder(path);
  }

  // List folders
  async listFolders(path?: string): Promise<string[]> {
    const result = path
      ? await cloudinary.api.sub_folders(path)
      : await cloudinary.api.root_folders();

    return result.folders.map((f: any) => f.path);
  }

  // Generate video thumbnail
  videoThumbnail(
    publicId: string,
    options: {
      width?: number;
      height?: number;
      startOffset?: string | number;
      format?: string;
    } = {}
  ): string {
    return cloudinary.url(publicId, {
      resource_type: 'video',
      transformation: [
        {
          width: options.width || 640,
          height: options.height || 360,
          crop: 'fill',
          start_offset: options.startOffset || 0,
        },
      ],
      format: options.format || 'jpg',
      secure: true,
    });
  }

  // Generate video preview (animated GIF)
  videoPreview(
    publicId: string,
    options: {
      width?: number;
      duration?: number;
      fps?: number;
    } = {}
  ): string {
    return cloudinary.url(publicId, {
      resource_type: 'video',
      transformation: [
        {
          width: options.width || 320,
          crop: 'scale',
          duration: options.duration || 5,
          fps: options.fps || 10,
        },
      ],
      format: 'gif',
      secure: true,
    });
  }

  private transformToCloudinary(t: TransformationOptions): Record<string, any> {
    return {
      width: t.width,
      height: t.height,
      crop: t.crop,
      gravity: t.gravity,
      quality: t.quality,
      format: t.format,
      effect: t.effect,
      overlay: t.overlay,
      angle: t.angle,
      radius: t.radius,
      border: t.border,
      background: t.background,
      aspect_ratio: t.aspectRatio,
      fetch_format: t.fetchFormat,
      flags: t.flags,
    };
  }

  private mapUploadResult(result: UploadApiResponse): UploadResult {
    return {
      publicId: result.public_id,
      url: result.url,
      secureUrl: result.secure_url,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      resourceType: result.resource_type,
      createdAt: result.created_at,
      etag: result.etag,
      eager: result.eager?.map((e: any) => ({
        url: e.url,
        secureUrl: e.secure_url,
        width: e.width,
        height: e.height,
      })),
    };
  }
}

// Factory function
export function createCloudinaryStorage(config: CloudinaryConfig): CloudinaryStorage {
  return new CloudinaryStorage(config);
}
```

### Express Integration with Multer

```typescript
// src/routes/media.ts
import { Router, Request, Response } from 'express';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { v2 as cloudinary } from 'cloudinary';
import { createCloudinaryStorage } from '../storage/cloudinary-client';

const router = Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

const storage = createCloudinaryStorage({
  cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
  apiKey: process.env.CLOUDINARY_API_KEY!,
  apiSecret: process.env.CLOUDINARY_API_SECRET!,
});

// Multer storage for direct Cloudinary upload
const multerStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: 'uploads',
    resource_type: 'auto',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'webm'],
    transformation: file.mimetype.startsWith('image/')
      ? [{ width: 2000, height: 2000, crop: 'limit', quality: 'auto' }]
      : undefined,
  }),
});

const upload = multer({
  storage: multerStorage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
});

// Upload single image
router.post('/upload/image', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const file = req.file as Express.Multer.File & {
      path: string;
      filename: string;
    };

    res.json({
      success: true,
      image: {
        publicId: file.filename,
        url: file.path,
        // Generate responsive URLs
        responsive: {
          thumbnail: storage.url(file.filename, { width: 150, height: 150, crop: 'thumb' }),
          small: storage.url(file.filename, { width: 320, crop: 'scale' }),
          medium: storage.url(file.filename, { width: 640, crop: 'scale' }),
          large: storage.url(file.filename, { width: 1280, crop: 'scale' }),
        },
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Upload from URL
router.post('/upload/url', async (req: Request, res: Response) => {
  try {
    const { url, folder, transformations } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL required' });
    }

    const result = await storage.upload(url, {
      folder: folder || 'uploads',
      transformation: transformations,
    });

    res.json({
      success: true,
      image: {
        publicId: result.publicId,
        url: result.secureUrl,
        width: result.width,
        height: result.height,
      },
    });
  } catch (error) {
    console.error('URL upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Get transformation URL
router.post('/transform', async (req: Request, res: Response) => {
  try {
    const { publicId, transformations } = req.body;

    if (!publicId) {
      return res.status(400).json({ error: 'publicId required' });
    }

    const url = storage.url(publicId, transformations);

    res.json({ url });
  } catch (error) {
    console.error('Transform error:', error);
    res.status(500).json({ error: 'Transform failed' });
  }
});

// Delete media
router.delete('/media/:publicId', async (req: Request, res: Response) => {
  try {
    const { publicId } = req.params;
    const { resourceType } = req.query;

    await storage.delete(publicId, resourceType as string);

    res.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Delete failed' });
  }
});

// Search media
router.get('/media/search', async (req: Request, res: Response) => {
  try {
    const { query, maxResults, nextCursor } = req.query;

    const result = await storage.search(query as string, {
      maxResults: maxResults ? parseInt(maxResults as string) : 20,
      nextCursor: nextCursor as string,
    });

    res.json(result);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

export default router;
```

### React Image Component

```typescript
// components/CloudinaryImage.tsx
import React, { useState, useMemo } from 'react';

interface CloudinaryImageProps {
  publicId: string;
  cloudName: string;
  alt: string;
  width?: number;
  height?: number;
  crop?: 'fill' | 'fit' | 'scale' | 'thumb' | 'crop' | 'pad';
  gravity?: 'auto' | 'face' | 'center';
  quality?: 'auto' | number;
  format?: 'auto' | 'webp' | 'avif';
  loading?: 'lazy' | 'eager';
  placeholder?: 'blur' | 'color' | 'none';
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}

function buildCloudinaryUrl(
  cloudName: string,
  publicId: string,
  transformations: Record<string, any>
): string {
  const transforms: string[] = [];

  if (transformations.width) transforms.push(`w_${transformations.width}`);
  if (transformations.height) transforms.push(`h_${transformations.height}`);
  if (transformations.crop) transforms.push(`c_${transformations.crop}`);
  if (transformations.gravity) transforms.push(`g_${transformations.gravity}`);
  if (transformations.quality) transforms.push(`q_${transformations.quality}`);
  if (transformations.format) transforms.push(`f_${transformations.format}`);
  if (transformations.effect) transforms.push(`e_${transformations.effect}`);
  if (transformations.dpr) transforms.push(`dpr_${transformations.dpr}`);

  const transformString = transforms.length > 0 ? transforms.join(',') + '/' : '';

  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformString}${publicId}`;
}

export function CloudinaryImage({
  publicId,
  cloudName,
  alt,
  width,
  height,
  crop = 'fill',
  gravity = 'auto',
  quality = 'auto',
  format = 'auto',
  loading = 'lazy',
  placeholder = 'blur',
  className,
  onLoad,
  onError,
}: CloudinaryImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const mainUrl = useMemo(() => {
    return buildCloudinaryUrl(cloudName, publicId, {
      width,
      height,
      crop,
      gravity,
      quality,
      format,
    });
  }, [cloudName, publicId, width, height, crop, gravity, quality, format]);

  const placeholderUrl = useMemo(() => {
    if (placeholder === 'none') return undefined;

    return buildCloudinaryUrl(cloudName, publicId, {
      width: 20,
      height: height ? Math.round(20 * (height / (width || 1))) : undefined,
      crop,
      quality: 30,
      effect: placeholder === 'blur' ? 'blur:1000' : undefined,
    });
  }, [cloudName, publicId, width, height, crop, placeholder]);

  const srcSet = useMemo(() => {
    if (!width) return undefined;

    const widths = [0.5, 1, 1.5, 2].map((multiplier) =>
      Math.round(width * multiplier)
    );

    return widths
      .map((w) => {
        const url = buildCloudinaryUrl(cloudName, publicId, {
          width: w,
          height: height ? Math.round(height * (w / width)) : undefined,
          crop,
          gravity,
          quality,
          format,
        });
        return `${url} ${w}w`;
      })
      .join(', ');
  }, [cloudName, publicId, width, height, crop, gravity, quality, format]);

  const handleLoad = () => {
    setLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setError(true);
    onError?.();
  };

  if (error) {
    return (
      <div
        className={`image-error ${className || ''}`}
        style={{ width, height, backgroundColor: '#f0f0f0' }}
      >
        <span>Failed to load image</span>
      </div>
    );
  }

  return (
    <div
      className={`image-wrapper ${className || ''}`}
      style={{
        position: 'relative',
        width,
        height,
        overflow: 'hidden',
      }}
    >
      {placeholder !== 'none' && !loaded && placeholderUrl && (
        <img
          src={placeholderUrl}
          alt=""
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'blur(10px)',
            transform: 'scale(1.1)',
          }}
          aria-hidden="true"
        />
      )}

      <img
        src={mainUrl}
        srcSet={srcSet}
        sizes={width ? `${width}px` : undefined}
        alt={alt}
        loading={loading}
        onLoad={handleLoad}
        onError={handleError}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out',
        }}
      />
    </div>
  );
}

// Gallery component with lightbox
export function CloudinaryGallery({
  images,
  cloudName,
  columns = 3,
}: {
  images: Array<{ publicId: string; alt: string }>;
  cloudName: string;
  columns?: number;
}) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  return (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: '1rem',
        }}
      >
        {images.map((image, index) => (
          <button
            key={image.publicId}
            onClick={() => setSelectedIndex(index)}
            style={{
              border: 'none',
              padding: 0,
              cursor: 'pointer',
            }}
          >
            <CloudinaryImage
              publicId={image.publicId}
              cloudName={cloudName}
              alt={image.alt}
              width={300}
              height={300}
              crop="fill"
            />
          </button>
        ))}
      </div>

      {selectedIndex !== null && (
        <div
          className="lightbox"
          onClick={() => setSelectedIndex(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <CloudinaryImage
            publicId={images[selectedIndex].publicId}
            cloudName={cloudName}
            alt={images[selectedIndex].alt}
            width={1200}
            crop="fit"
            quality="auto"
          />
        </div>
      )}
    </>
  );
}
```

## Python Implementation

```python
# storage/cloudinary_client.py
import cloudinary
import cloudinary.uploader
import cloudinary.api
from cloudinary.utils import cloudinary_url
from typing import Optional, List, Dict, Any, BinaryIO
from dataclasses import dataclass
import base64


@dataclass
class UploadResult:
    public_id: str
    url: str
    secure_url: str
    format: str
    width: int
    height: int
    bytes: int
    resource_type: str
    created_at: str


@dataclass
class Transformation:
    width: Optional[int] = None
    height: Optional[int] = None
    crop: Optional[str] = None
    gravity: Optional[str] = None
    quality: Optional[str] = None
    format: Optional[str] = None
    effect: Optional[str] = None


class CloudinaryStorage:
    def __init__(
        self,
        cloud_name: str,
        api_key: str,
        api_secret: str,
    ):
        cloudinary.config(
            cloud_name=cloud_name,
            api_key=api_key,
            api_secret=api_secret,
            secure=True
        )

    def upload(
        self,
        source: bytes | str | BinaryIO,
        folder: Optional[str] = None,
        public_id: Optional[str] = None,
        resource_type: str = 'auto',
        transformation: Optional[Dict[str, Any]] = None,
        tags: Optional[List[str]] = None,
    ) -> UploadResult:
        """Upload file from bytes, URL, or file object."""
        options = {
            'folder': folder,
            'public_id': public_id,
            'resource_type': resource_type,
            'tags': tags,
        }

        if transformation:
            options['transformation'] = transformation

        # Handle bytes
        if isinstance(source, bytes):
            source = f'data:application/octet-stream;base64,{base64.b64encode(source).decode()}'

        result = cloudinary.uploader.upload(source, **options)

        return UploadResult(
            public_id=result['public_id'],
            url=result['url'],
            secure_url=result['secure_url'],
            format=result['format'],
            width=result.get('width', 0),
            height=result.get('height', 0),
            bytes=result['bytes'],
            resource_type=result['resource_type'],
            created_at=result['created_at']
        )

    def delete(self, public_id: str, resource_type: str = 'image') -> bool:
        """Delete an asset."""
        result = cloudinary.uploader.destroy(
            public_id,
            resource_type=resource_type
        )
        return result.get('result') == 'ok'

    def delete_many(
        self,
        public_ids: List[str],
        resource_type: str = 'image'
    ) -> Dict[str, List[str]]:
        """Delete multiple assets."""
        result = cloudinary.api.delete_resources(
            public_ids,
            resource_type=resource_type
        )

        deleted = [k for k, v in result['deleted'].items() if v == 'deleted']
        errors = [k for k, v in result['deleted'].items() if v != 'deleted']

        return {'deleted': deleted, 'errors': errors}

    def url(
        self,
        public_id: str,
        transformation: Optional[Transformation] = None,
        **kwargs
    ) -> str:
        """Generate URL with transformations."""
        options = {'secure': True}

        if transformation:
            options['transformation'] = [
                {k: v for k, v in {
                    'width': transformation.width,
                    'height': transformation.height,
                    'crop': transformation.crop,
                    'gravity': transformation.gravity,
                    'quality': transformation.quality,
                    'format': transformation.format,
                    'effect': transformation.effect,
                }.items() if v is not None}
            ]

        options.update(kwargs)
        url, _ = cloudinary_url(public_id, **options)
        return url

    def responsive_urls(
        self,
        public_id: str,
        widths: List[int] = [320, 640, 960, 1280, 1920]
    ) -> Dict[int, str]:
        """Generate responsive image URLs."""
        return {
            width: self.url(
                public_id,
                transformation=Transformation(
                    width=width,
                    crop='scale',
                    quality='auto',
                    format='auto'
                )
            )
            for width in widths
        }

    def search(
        self,
        query: str,
        max_results: int = 20,
        next_cursor: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Search assets."""
        search = cloudinary.Search().expression(query)

        if max_results:
            search = search.max_results(max_results)

        if next_cursor:
            search = search.next_cursor(next_cursor)

        result = search.execute()

        return {
            'resources': [
                {
                    'public_id': r['public_id'],
                    'format': r['format'],
                    'url': r['secure_url'],
                    'width': r.get('width'),
                    'height': r.get('height'),
                    'bytes': r['bytes'],
                    'created_at': r['created_at'],
                    'tags': r.get('tags', []),
                }
                for r in result.get('resources', [])
            ],
            'total_count': result.get('total_count', 0),
            'next_cursor': result.get('next_cursor'),
        }

    def get_details(
        self,
        public_id: str,
        resource_type: str = 'image'
    ) -> Dict[str, Any]:
        """Get asset details."""
        result = cloudinary.api.resource(
            public_id,
            resource_type=resource_type
        )

        return {
            'public_id': result['public_id'],
            'format': result['format'],
            'width': result.get('width'),
            'height': result.get('height'),
            'bytes': result['bytes'],
            'url': result['secure_url'],
            'created_at': result['created_at'],
            'tags': result.get('tags', []),
        }


# FastAPI integration
from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel

app = FastAPI()
storage = CloudinaryStorage(
    cloud_name='your-cloud',
    api_key='your-key',
    api_secret='your-secret'
)


class TransformRequest(BaseModel):
    public_id: str
    width: Optional[int] = None
    height: Optional[int] = None
    crop: Optional[str] = None
    quality: Optional[str] = 'auto'


@app.post('/upload')
async def upload_image(file: UploadFile = File(...)):
    """Upload an image."""
    content = await file.read()

    result = storage.upload(
        content,
        folder='uploads',
        resource_type='auto'
    )

    return {
        'public_id': result.public_id,
        'url': result.secure_url,
        'width': result.width,
        'height': result.height,
    }


@app.post('/transform')
async def transform_image(request: TransformRequest):
    """Get transformed image URL."""
    url = storage.url(
        request.public_id,
        transformation=Transformation(
            width=request.width,
            height=request.height,
            crop=request.crop,
            quality=request.quality
        )
    )

    return {'url': url}


@app.get('/responsive/{public_id:path}')
async def get_responsive_urls(public_id: str):
    """Get responsive image URLs."""
    return storage.responsive_urls(public_id)


@app.delete('/media/{public_id:path}')
async def delete_media(public_id: str, resource_type: str = 'image'):
    """Delete a media asset."""
    success = storage.delete(public_id, resource_type)

    if not success:
        raise HTTPException(status_code=404, detail='Asset not found')

    return {'success': True}
```

## CLAUDE.md Integration

```markdown
## Cloudinary Media Commands

### Upload Operations
- "upload image to Cloudinary" - Upload image file
- "upload from URL" - Import from external URL
- "upload video" - Upload video file

### Transformation Operations
- "resize image" - Change image dimensions
- "crop to face" - Smart face detection crop
- "optimize image" - Auto quality/format
- "generate thumbnail" - Create thumbnails

### Video Operations
- "create video thumbnail" - Extract frame
- "generate video preview" - Create GIF preview
- "optimize video" - Compress and format

### Management
- "search media assets" - Find by tags/context
- "delete media" - Remove asset
- "list media in folder" - Browse folder contents
```

## AI Suggestions

1. **"Implement face detection cropping"** - Auto-crop around detected faces
2. **"Add image background removal"** - Use AI to remove backgrounds
3. **"Implement video transcoding"** - Convert video formats automatically
4. **"Add watermark overlay"** - Apply watermarks to images/videos
5. **"Implement image moderation"** - Auto-detect inappropriate content
6. **"Add text overlay generation"** - Dynamic text on images
7. **"Implement color palette extraction"** - Get dominant colors from images
8. **"Add image comparison"** - Generate diff views
9. **"Implement progressive JPEG loading"** - Better perceived performance
10. **"Add WebP/AVIF auto-conversion"** - Next-gen format delivery
