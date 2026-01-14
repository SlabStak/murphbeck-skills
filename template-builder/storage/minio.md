# MinIO Object Storage

Production-ready MinIO integration for self-hosted S3-compatible object storage.

## Overview

MinIO is a high-performance, S3-compatible object storage solution designed for private cloud, hybrid cloud, and multi-cloud deployments.

## Quick Start

```bash
# Start MinIO server
docker run -p 9000:9000 -p 9001:9001 \
  -e "MINIO_ROOT_USER=minioadmin" \
  -e "MINIO_ROOT_PASSWORD=minioadmin" \
  minio/minio server /data --console-address ":9001"

npm install minio
pip install minio
```

## TypeScript Implementation

### MinIO Client Configuration

```typescript
// src/storage/minio-client.ts
import { Client, BucketItem, ItemBucketMetadata, UploadedObjectInfo } from 'minio';
import { Readable } from 'stream';
import path from 'path';
import { createReadStream } from 'fs';
import { stat } from 'fs/promises';

interface MinioConfig {
  endPoint: string;
  port: number;
  useSSL: boolean;
  accessKey: string;
  secretKey: string;
  region?: string;
}

interface UploadOptions {
  bucket: string;
  contentType?: string;
  metadata?: Record<string, string>;
  tags?: Record<string, string>;
}

interface PresignedUrlOptions {
  bucket: string;
  expires?: number;
  responseContentType?: string;
  responseContentDisposition?: string;
}

interface MinioObject {
  name: string;
  size: number;
  lastModified: Date;
  etag: string;
  prefix?: string;
}

interface ListOptions {
  bucket: string;
  prefix?: string;
  recursive?: boolean;
  maxKeys?: number;
}

export class MinioStorage {
  private client: Client;
  private defaultBucket: string;

  constructor(config: MinioConfig, defaultBucket?: string) {
    this.client = new Client({
      endPoint: config.endPoint,
      port: config.port,
      useSSL: config.useSSL,
      accessKey: config.accessKey,
      secretKey: config.secretKey,
      region: config.region,
    });

    this.defaultBucket = defaultBucket || 'default';
  }

  // Ensure bucket exists
  async ensureBucket(bucket: string): Promise<void> {
    const exists = await this.client.bucketExists(bucket);
    if (!exists) {
      await this.client.makeBucket(bucket);
    }
  }

  // Upload from buffer
  async upload(
    objectName: string,
    data: Buffer | Readable,
    options: Partial<UploadOptions> = {}
  ): Promise<UploadedObjectInfo> {
    const bucket = options.bucket || this.defaultBucket;
    await this.ensureBucket(bucket);

    const metaData: ItemBucketMetadata = {
      'Content-Type': options.contentType || 'application/octet-stream',
      ...options.metadata,
    };

    if (Buffer.isBuffer(data)) {
      return this.client.putObject(bucket, objectName, data, data.length, metaData);
    } else {
      return this.client.putObject(bucket, objectName, data, undefined, metaData);
    }
  }

  // Upload from file
  async uploadFile(
    localPath: string,
    objectName?: string,
    options: Partial<UploadOptions> = {}
  ): Promise<UploadedObjectInfo> {
    const bucket = options.bucket || this.defaultBucket;
    await this.ensureBucket(bucket);

    const fileName = objectName || path.basename(localPath);
    const metaData: ItemBucketMetadata = {
      'Content-Type': options.contentType || 'application/octet-stream',
      ...options.metadata,
    };

    return this.client.fPutObject(bucket, fileName, localPath, metaData);
  }

  // Download as buffer
  async download(objectName: string, bucket?: string): Promise<Buffer> {
    const bucketName = bucket || this.defaultBucket;
    const chunks: Buffer[] = [];

    const stream = await this.client.getObject(bucketName, objectName);

    return new Promise((resolve, reject) => {
      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }

  // Download as stream
  downloadStream(objectName: string, bucket?: string): Promise<Readable> {
    const bucketName = bucket || this.defaultBucket;
    return this.client.getObject(bucketName, objectName);
  }

  // Download to file
  async downloadToFile(
    objectName: string,
    localPath: string,
    bucket?: string
  ): Promise<void> {
    const bucketName = bucket || this.defaultBucket;
    await this.client.fGetObject(bucketName, objectName, localPath);
  }

  // Delete object
  async delete(objectName: string, bucket?: string): Promise<void> {
    const bucketName = bucket || this.defaultBucket;
    await this.client.removeObject(bucketName, objectName);
  }

  // Delete multiple objects
  async deleteMany(
    objectNames: string[],
    bucket?: string
  ): Promise<void> {
    const bucketName = bucket || this.defaultBucket;
    await this.client.removeObjects(bucketName, objectNames);
  }

  // Check if object exists
  async exists(objectName: string, bucket?: string): Promise<boolean> {
    const bucketName = bucket || this.defaultBucket;
    try {
      await this.client.statObject(bucketName, objectName);
      return true;
    } catch (error: any) {
      if (error.code === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  // Get object metadata
  async getMetadata(objectName: string, bucket?: string): Promise<{
    size: number;
    etag: string;
    lastModified: Date;
    metaData: Record<string, string>;
    contentType?: string;
  }> {
    const bucketName = bucket || this.defaultBucket;
    const stat = await this.client.statObject(bucketName, objectName);

    return {
      size: stat.size,
      etag: stat.etag,
      lastModified: stat.lastModified,
      metaData: stat.metaData as Record<string, string>,
      contentType: stat.metaData?.['content-type'],
    };
  }

  // List objects
  async list(options: ListOptions): Promise<MinioObject[]> {
    const objects: MinioObject[] = [];
    const bucket = options.bucket || this.defaultBucket;

    const stream = this.client.listObjects(
      bucket,
      options.prefix || '',
      options.recursive ?? true
    );

    return new Promise((resolve, reject) => {
      stream.on('data', (obj: BucketItem) => {
        if (obj.name) {
          objects.push({
            name: obj.name,
            size: obj.size,
            lastModified: obj.lastModified,
            etag: obj.etag,
            prefix: obj.prefix,
          });
        }

        if (options.maxKeys && objects.length >= options.maxKeys) {
          stream.destroy();
          resolve(objects.slice(0, options.maxKeys));
        }
      });

      stream.on('end', () => resolve(objects));
      stream.on('error', reject);
    });
  }

  // List objects with versions
  async listVersions(
    objectName: string,
    bucket?: string
  ): Promise<Array<{
    versionId: string;
    lastModified: Date;
    size: number;
    isLatest: boolean;
  }>> {
    const bucketName = bucket || this.defaultBucket;
    const versions: any[] = [];

    const stream = this.client.listObjects(bucketName, objectName, false, {
      IncludeVersion: true,
    } as any);

    return new Promise((resolve, reject) => {
      stream.on('data', (obj: any) => {
        if (obj.name === objectName) {
          versions.push({
            versionId: obj.versionId,
            lastModified: obj.lastModified,
            size: obj.size,
            isLatest: obj.isLatest,
          });
        }
      });

      stream.on('end', () => resolve(versions));
      stream.on('error', reject);
    });
  }

  // Copy object
  async copy(
    sourceObject: string,
    destObject: string,
    sourceBucket?: string,
    destBucket?: string
  ): Promise<void> {
    const srcBucket = sourceBucket || this.defaultBucket;
    const dstBucket = destBucket || this.defaultBucket;

    await this.client.copyObject(
      dstBucket,
      destObject,
      `/${srcBucket}/${sourceObject}`,
      null as any
    );
  }

  // Move object
  async move(
    sourceObject: string,
    destObject: string,
    sourceBucket?: string,
    destBucket?: string
  ): Promise<void> {
    await this.copy(sourceObject, destObject, sourceBucket, destBucket);
    await this.delete(sourceObject, sourceBucket);
  }

  // Generate presigned URL for download
  async getPresignedDownloadUrl(
    objectName: string,
    options: Partial<PresignedUrlOptions> = {}
  ): Promise<string> {
    const bucket = options.bucket || this.defaultBucket;
    const expires = options.expires || 3600;

    const reqParams: Record<string, string> = {};
    if (options.responseContentType) {
      reqParams['response-content-type'] = options.responseContentType;
    }
    if (options.responseContentDisposition) {
      reqParams['response-content-disposition'] = options.responseContentDisposition;
    }

    return this.client.presignedGetObject(bucket, objectName, expires, reqParams);
  }

  // Generate presigned URL for upload
  async getPresignedUploadUrl(
    objectName: string,
    options: Partial<PresignedUrlOptions> = {}
  ): Promise<string> {
    const bucket = options.bucket || this.defaultBucket;
    const expires = options.expires || 3600;

    await this.ensureBucket(bucket);

    return this.client.presignedPutObject(bucket, objectName, expires);
  }

  // Create bucket
  async createBucket(bucket: string, region?: string): Promise<void> {
    await this.client.makeBucket(bucket, region || '');
  }

  // Delete bucket
  async deleteBucket(bucket: string): Promise<void> {
    await this.client.removeBucket(bucket);
  }

  // List buckets
  async listBuckets(): Promise<Array<{ name: string; creationDate: Date }>> {
    const buckets = await this.client.listBuckets();
    return buckets.map((b) => ({
      name: b.name,
      creationDate: b.creationDate,
    }));
  }

  // Set bucket policy
  async setBucketPolicy(bucket: string, policy: object): Promise<void> {
    await this.client.setBucketPolicy(bucket, JSON.stringify(policy));
  }

  // Get bucket policy
  async getBucketPolicy(bucket: string): Promise<object> {
    const policy = await this.client.getBucketPolicy(bucket);
    return JSON.parse(policy);
  }

  // Enable versioning
  async enableVersioning(bucket: string): Promise<void> {
    await this.client.setBucketVersioning(bucket, { Status: 'Enabled' });
  }

  // Get object with specific version
  async downloadVersion(
    objectName: string,
    versionId: string,
    bucket?: string
  ): Promise<Buffer> {
    const bucketName = bucket || this.defaultBucket;
    const chunks: Buffer[] = [];

    const stream = await this.client.getObject(bucketName, objectName, {
      versionId,
    } as any);

    return new Promise((resolve, reject) => {
      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }
}

// Factory function
export function createMinioStorage(
  config: MinioConfig,
  defaultBucket?: string
): MinioStorage {
  return new MinioStorage(config, defaultBucket);
}
```

### Express Integration

```typescript
// src/routes/minio-storage.ts
import { Router, Request, Response } from 'express';
import multer from 'multer';
import { createMinioStorage } from '../storage/minio-client';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

const minio = createMinioStorage(
  {
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000'),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
  },
  process.env.MINIO_BUCKET || 'uploads'
);

const upload = multer({ storage: multer.memoryStorage() });

// Upload file
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const ext = path.extname(req.file.originalname);
    const objectName = `${uuidv4()}${ext}`;

    await minio.upload(objectName, req.file.buffer, {
      contentType: req.file.mimetype,
      metadata: {
        'x-amz-meta-original-name': req.file.originalname,
      },
    });

    res.json({
      success: true,
      file: {
        name: objectName,
        originalName: req.file.originalname,
        size: req.file.size,
        contentType: req.file.mimetype,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Get presigned upload URL
router.post('/upload/presigned', async (req: Request, res: Response) => {
  try {
    const { filename, contentType } = req.body;

    if (!filename) {
      return res.status(400).json({ error: 'filename required' });
    }

    const ext = path.extname(filename);
    const objectName = `${uuidv4()}${ext}`;

    const url = await minio.getPresignedUploadUrl(objectName, {
      expires: 3600,
    });

    res.json({
      url,
      objectName,
      expiresIn: 3600,
    });
  } catch (error) {
    console.error('Presigned URL error:', error);
    res.status(500).json({ error: 'Failed to generate URL' });
  }
});

// Get presigned download URL
router.get('/download/:objectName', async (req: Request, res: Response) => {
  try {
    const { objectName } = req.params;

    const exists = await minio.exists(objectName);
    if (!exists) {
      return res.status(404).json({ error: 'File not found' });
    }

    const url = await minio.getPresignedDownloadUrl(objectName, {
      expires: 3600,
    });

    res.json({ url, expiresIn: 3600 });
  } catch (error) {
    console.error('Download URL error:', error);
    res.status(500).json({ error: 'Failed to generate URL' });
  }
});

// Direct download
router.get('/stream/:objectName', async (req: Request, res: Response) => {
  try {
    const { objectName } = req.params;

    const exists = await minio.exists(objectName);
    if (!exists) {
      return res.status(404).json({ error: 'File not found' });
    }

    const metadata = await minio.getMetadata(objectName);
    const stream = await minio.downloadStream(objectName);

    res.setHeader('Content-Type', metadata.contentType || 'application/octet-stream');
    res.setHeader('Content-Length', metadata.size);

    stream.pipe(res);
  } catch (error) {
    console.error('Stream error:', error);
    res.status(500).json({ error: 'Stream failed' });
  }
});

// Delete file
router.delete('/files/:objectName', async (req: Request, res: Response) => {
  try {
    const { objectName } = req.params;
    await minio.delete(objectName);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Delete failed' });
  }
});

// List files
router.get('/files', async (req: Request, res: Response) => {
  try {
    const { prefix, maxKeys, bucket } = req.query;

    const objects = await minio.list({
      bucket: bucket as string,
      prefix: prefix as string,
      maxKeys: maxKeys ? parseInt(maxKeys as string) : 100,
    });

    res.json({ objects });
  } catch (error) {
    console.error('List error:', error);
    res.status(500).json({ error: 'List failed' });
  }
});

// Get file metadata
router.get('/metadata/:objectName', async (req: Request, res: Response) => {
  try {
    const { objectName } = req.params;
    const metadata = await minio.getMetadata(objectName);
    res.json(metadata);
  } catch (error) {
    console.error('Metadata error:', error);
    res.status(500).json({ error: 'Failed to get metadata' });
  }
});

// List buckets
router.get('/buckets', async (req: Request, res: Response) => {
  try {
    const buckets = await minio.listBuckets();
    res.json({ buckets });
  } catch (error) {
    console.error('List buckets error:', error);
    res.status(500).json({ error: 'Failed to list buckets' });
  }
});

// Create bucket
router.post('/buckets', async (req: Request, res: Response) => {
  try {
    const { name, region } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'name required' });
    }

    await minio.createBucket(name, region);
    res.json({ success: true, bucket: name });
  } catch (error) {
    console.error('Create bucket error:', error);
    res.status(500).json({ error: 'Failed to create bucket' });
  }
});

export default router;
```

## Python Implementation

```python
# storage/minio_client.py
from minio import Minio
from minio.error import S3Error
from typing import Optional, List, Dict, Any, BinaryIO, Union
from dataclasses import dataclass
from datetime import timedelta
from pathlib import Path
from io import BytesIO
import uuid


@dataclass
class MinioObject:
    name: str
    size: int
    last_modified: Any
    etag: str
    is_dir: bool = False


@dataclass
class UploadResult:
    object_name: str
    etag: str
    version_id: Optional[str] = None


class MinioStorage:
    def __init__(
        self,
        endpoint: str,
        access_key: str,
        secret_key: str,
        secure: bool = False,
        default_bucket: str = 'default'
    ):
        self.client = Minio(
            endpoint,
            access_key=access_key,
            secret_key=secret_key,
            secure=secure
        )
        self.default_bucket = default_bucket

    def ensure_bucket(self, bucket: str) -> None:
        """Ensure bucket exists."""
        if not self.client.bucket_exists(bucket):
            self.client.make_bucket(bucket)

    def upload(
        self,
        object_name: str,
        data: Union[bytes, BinaryIO],
        bucket: Optional[str] = None,
        content_type: str = 'application/octet-stream',
        metadata: Optional[Dict[str, str]] = None,
    ) -> UploadResult:
        """Upload data to MinIO."""
        bucket = bucket or self.default_bucket
        self.ensure_bucket(bucket)

        if isinstance(data, bytes):
            data_stream = BytesIO(data)
            size = len(data)
        else:
            data.seek(0, 2)  # Seek to end
            size = data.tell()
            data.seek(0)  # Seek back to start
            data_stream = data

        result = self.client.put_object(
            bucket,
            object_name,
            data_stream,
            size,
            content_type=content_type,
            metadata=metadata
        )

        return UploadResult(
            object_name=result.object_name,
            etag=result.etag,
            version_id=result.version_id
        )

    def upload_file(
        self,
        local_path: str,
        object_name: Optional[str] = None,
        bucket: Optional[str] = None,
        content_type: str = 'application/octet-stream',
        metadata: Optional[Dict[str, str]] = None,
    ) -> UploadResult:
        """Upload file from local path."""
        bucket = bucket or self.default_bucket
        self.ensure_bucket(bucket)

        if not object_name:
            object_name = Path(local_path).name

        result = self.client.fput_object(
            bucket,
            object_name,
            local_path,
            content_type=content_type,
            metadata=metadata
        )

        return UploadResult(
            object_name=result.object_name,
            etag=result.etag,
            version_id=result.version_id
        )

    def download(
        self,
        object_name: str,
        bucket: Optional[str] = None,
    ) -> bytes:
        """Download object as bytes."""
        bucket = bucket or self.default_bucket

        response = self.client.get_object(bucket, object_name)
        try:
            return response.read()
        finally:
            response.close()
            response.release_conn()

    def download_to_file(
        self,
        object_name: str,
        local_path: str,
        bucket: Optional[str] = None,
    ) -> None:
        """Download object to local file."""
        bucket = bucket or self.default_bucket
        self.client.fget_object(bucket, object_name, local_path)

    def delete(
        self,
        object_name: str,
        bucket: Optional[str] = None,
    ) -> None:
        """Delete object."""
        bucket = bucket or self.default_bucket
        self.client.remove_object(bucket, object_name)

    def delete_many(
        self,
        object_names: List[str],
        bucket: Optional[str] = None,
    ) -> None:
        """Delete multiple objects."""
        bucket = bucket or self.default_bucket
        from minio.deleteobjects import DeleteObject

        delete_objects = [DeleteObject(name) for name in object_names]
        errors = self.client.remove_objects(bucket, delete_objects)

        for error in errors:
            print(f'Delete error: {error}')

    def exists(
        self,
        object_name: str,
        bucket: Optional[str] = None,
    ) -> bool:
        """Check if object exists."""
        bucket = bucket or self.default_bucket
        try:
            self.client.stat_object(bucket, object_name)
            return True
        except S3Error as e:
            if e.code == 'NoSuchKey':
                return False
            raise

    def get_metadata(
        self,
        object_name: str,
        bucket: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Get object metadata."""
        bucket = bucket or self.default_bucket
        stat = self.client.stat_object(bucket, object_name)

        return {
            'size': stat.size,
            'etag': stat.etag,
            'last_modified': stat.last_modified,
            'content_type': stat.content_type,
            'metadata': stat.metadata,
            'version_id': stat.version_id,
        }

    def list_objects(
        self,
        bucket: Optional[str] = None,
        prefix: Optional[str] = None,
        recursive: bool = True,
    ) -> List[MinioObject]:
        """List objects in bucket."""
        bucket = bucket or self.default_bucket
        objects = []

        for obj in self.client.list_objects(bucket, prefix=prefix, recursive=recursive):
            objects.append(MinioObject(
                name=obj.object_name,
                size=obj.size or 0,
                last_modified=obj.last_modified,
                etag=obj.etag or '',
                is_dir=obj.is_dir
            ))

        return objects

    def copy(
        self,
        source_object: str,
        dest_object: str,
        source_bucket: Optional[str] = None,
        dest_bucket: Optional[str] = None,
    ) -> None:
        """Copy object."""
        source_bucket = source_bucket or self.default_bucket
        dest_bucket = dest_bucket or self.default_bucket

        from minio.commonconfig import CopySource

        self.client.copy_object(
            dest_bucket,
            dest_object,
            CopySource(source_bucket, source_object)
        )

    def move(
        self,
        source_object: str,
        dest_object: str,
        source_bucket: Optional[str] = None,
        dest_bucket: Optional[str] = None,
    ) -> None:
        """Move object."""
        self.copy(source_object, dest_object, source_bucket, dest_bucket)
        self.delete(source_object, source_bucket)

    def get_presigned_download_url(
        self,
        object_name: str,
        bucket: Optional[str] = None,
        expires: int = 3600,
    ) -> str:
        """Generate presigned URL for download."""
        bucket = bucket or self.default_bucket
        return self.client.presigned_get_object(
            bucket,
            object_name,
            expires=timedelta(seconds=expires)
        )

    def get_presigned_upload_url(
        self,
        object_name: str,
        bucket: Optional[str] = None,
        expires: int = 3600,
    ) -> str:
        """Generate presigned URL for upload."""
        bucket = bucket or self.default_bucket
        self.ensure_bucket(bucket)
        return self.client.presigned_put_object(
            bucket,
            object_name,
            expires=timedelta(seconds=expires)
        )

    def list_buckets(self) -> List[Dict[str, Any]]:
        """List all buckets."""
        buckets = self.client.list_buckets()
        return [
            {
                'name': b.name,
                'creation_date': b.creation_date
            }
            for b in buckets
        ]

    def create_bucket(self, bucket: str) -> None:
        """Create bucket."""
        self.client.make_bucket(bucket)

    def delete_bucket(self, bucket: str) -> None:
        """Delete bucket."""
        self.client.remove_bucket(bucket)


# FastAPI integration
from fastapi import FastAPI, UploadFile, File, HTTPException, Query
import os

app = FastAPI()

minio = MinioStorage(
    endpoint=os.environ.get('MINIO_ENDPOINT', 'localhost:9000'),
    access_key=os.environ.get('MINIO_ACCESS_KEY', 'minioadmin'),
    secret_key=os.environ.get('MINIO_SECRET_KEY', 'minioadmin'),
    secure=os.environ.get('MINIO_SECURE', 'false').lower() == 'true',
    default_bucket=os.environ.get('MINIO_BUCKET', 'uploads')
)


@app.post('/upload')
async def upload_file(file: UploadFile = File(...)):
    """Upload file."""
    content = await file.read()
    ext = Path(file.filename).suffix
    object_name = f'{uuid.uuid4()}{ext}'

    result = minio.upload(
        object_name,
        content,
        content_type=file.content_type
    )

    return {
        'object_name': result.object_name,
        'etag': result.etag,
        'original_name': file.filename,
        'size': len(content)
    }


@app.post('/upload/presigned')
async def get_presigned_upload_url(filename: str):
    """Get presigned URL for upload."""
    ext = Path(filename).suffix
    object_name = f'{uuid.uuid4()}{ext}'

    url = minio.get_presigned_upload_url(object_name, expires=3600)

    return {'url': url, 'object_name': object_name}


@app.get('/download/{object_name:path}')
async def get_presigned_download_url(object_name: str):
    """Get presigned URL for download."""
    if not minio.exists(object_name):
        raise HTTPException(status_code=404, detail='File not found')

    url = minio.get_presigned_download_url(object_name, expires=3600)
    return {'url': url}


@app.delete('/files/{object_name:path}')
async def delete_file(object_name: str):
    """Delete file."""
    minio.delete(object_name)
    return {'success': True}


@app.get('/files')
async def list_files(
    prefix: Optional[str] = Query(None),
    bucket: Optional[str] = Query(None),
):
    """List files."""
    objects = minio.list_objects(
        bucket=bucket,
        prefix=prefix
    )

    return {
        'objects': [
            {
                'name': obj.name,
                'size': obj.size,
                'last_modified': str(obj.last_modified),
                'etag': obj.etag
            }
            for obj in objects
        ]
    }
```

## Docker Compose Setup

```yaml
# docker-compose.yml
version: '3.8'

services:
  minio:
    image: minio/minio
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    command: server /data --console-address ":9001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3

  createbuckets:
    image: minio/mc
    depends_on:
      - minio
    entrypoint: >
      /bin/sh -c "
      /usr/bin/mc config host add myminio http://minio:9000 minioadmin minioadmin;
      /usr/bin/mc mb myminio/uploads;
      /usr/bin/mc policy set download myminio/uploads;
      exit 0;
      "

volumes:
  minio_data:
```

## CLAUDE.md Integration

```markdown
## MinIO Storage Commands

### Upload Operations
- "upload to MinIO" - Upload file to bucket
- "create presigned upload URL" - Generate upload URL
- "upload folder" - Batch upload directory

### Download Operations
- "download from MinIO" - Download file
- "create presigned download URL" - Generate download URL
- "stream from MinIO" - Stream large files

### Management
- "list MinIO objects" - List bucket contents
- "delete MinIO file" - Remove file
- "copy MinIO object" - Copy within/between buckets
- "create MinIO bucket" - New bucket

### Administration
- "list MinIO buckets" - Show all buckets
- "set bucket policy" - Configure access
- "enable versioning" - Turn on object versioning
```

## AI Suggestions

1. **"Implement S3 lifecycle policies"** - Auto-expire old objects
2. **"Add bucket replication"** - Cross-site replication
3. **"Implement server-side encryption"** - SSE-S3 or SSE-KMS
4. **"Add bucket notifications"** - Webhook on events
5. **"Implement object locking"** - WORM compliance
6. **"Add distributed mode"** - Multi-node setup
7. **"Implement erasure coding"** - Data protection
8. **"Add Kubernetes operator"** - K8s native deployment
9. **"Implement tiered storage"** - Hot/warm/cold tiers
10. **"Add audit logging"** - Access log analysis
