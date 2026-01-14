# Google Cloud Storage

Production-ready Google Cloud Storage integration with uploads, downloads, signed URLs, and lifecycle management.

## Overview

Google Cloud Storage provides unified object storage with global edge caching, strong consistency, and integration with Google Cloud services.

## Quick Start

```bash
npm install @google-cloud/storage
pip install google-cloud-storage
```

## TypeScript Implementation

### GCS Client Configuration

```typescript
// src/storage/gcs-client.ts
import { Storage, Bucket, File, GetSignedUrlConfig } from '@google-cloud/storage';
import { Readable } from 'stream';

interface GCSConfig {
  projectId: string;
  bucket: string;
  keyFilename?: string;
  credentials?: {
    client_email: string;
    private_key: string;
  };
}

interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  public?: boolean;
  cacheControl?: string;
  contentDisposition?: string;
  gzip?: boolean;
  resumable?: boolean;
}

interface SignedUrlOptions {
  action: 'read' | 'write' | 'delete' | 'resumable';
  expires: number;
  contentType?: string;
  responseContentType?: string;
  responseContentDisposition?: string;
}

interface GCSObject {
  name: string;
  size: number;
  updated: Date;
  contentType?: string;
  metadata?: Record<string, string>;
  generation: string;
  md5Hash?: string;
}

interface ListOptions {
  prefix?: string;
  maxResults?: number;
  pageToken?: string;
  delimiter?: string;
  autoPaginate?: boolean;
}

interface ListResult {
  objects: GCSObject[];
  prefixes: string[];
  nextPageToken?: string;
}

export class GCSStorage {
  private storage: Storage;
  private bucket: Bucket;
  private bucketName: string;

  constructor(config: GCSConfig) {
    this.bucketName = config.bucket;

    const storageConfig: any = {
      projectId: config.projectId,
    };

    if (config.keyFilename) {
      storageConfig.keyFilename = config.keyFilename;
    } else if (config.credentials) {
      storageConfig.credentials = config.credentials;
    }

    this.storage = new Storage(storageConfig);
    this.bucket = this.storage.bucket(config.bucket);
  }

  // Upload file from buffer or stream
  async upload(
    path: string,
    data: Buffer | Readable | string,
    options: UploadOptions = {}
  ): Promise<{
    name: string;
    url: string;
    generation: string;
  }> {
    const file = this.bucket.file(path);

    const writeOptions: any = {
      contentType: options.contentType,
      metadata: {
        metadata: options.metadata,
        cacheControl: options.cacheControl,
        contentDisposition: options.contentDisposition,
      },
      gzip: options.gzip,
      resumable: options.resumable ?? true,
      public: options.public,
    };

    if (Buffer.isBuffer(data) || typeof data === 'string') {
      await file.save(data, writeOptions);
    } else {
      // Stream upload
      await new Promise<void>((resolve, reject) => {
        const writeStream = file.createWriteStream(writeOptions);
        data.pipe(writeStream);
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });
    }

    const [metadata] = await file.getMetadata();

    return {
      name: path,
      url: options.public
        ? `https://storage.googleapis.com/${this.bucketName}/${path}`
        : `gs://${this.bucketName}/${path}`,
      generation: metadata.generation?.toString() || '',
    };
  }

  // Upload from local file
  async uploadFile(
    localPath: string,
    destPath: string,
    options: UploadOptions = {}
  ): Promise<{
    name: string;
    url: string;
    generation: string;
  }> {
    await this.bucket.upload(localPath, {
      destination: destPath,
      metadata: {
        contentType: options.contentType,
        metadata: options.metadata,
        cacheControl: options.cacheControl,
      },
      gzip: options.gzip,
      resumable: options.resumable ?? true,
      public: options.public,
    });

    const [metadata] = await this.bucket.file(destPath).getMetadata();

    return {
      name: destPath,
      url: options.public
        ? `https://storage.googleapis.com/${this.bucketName}/${destPath}`
        : `gs://${this.bucketName}/${destPath}`,
      generation: metadata.generation?.toString() || '',
    };
  }

  // Download file
  async download(path: string): Promise<Buffer> {
    const [data] = await this.bucket.file(path).download();
    return data;
  }

  // Download as stream
  downloadStream(path: string): Readable {
    return this.bucket.file(path).createReadStream();
  }

  // Download to local file
  async downloadToFile(path: string, localPath: string): Promise<void> {
    await this.bucket.file(path).download({ destination: localPath });
  }

  // Delete file
  async delete(path: string): Promise<void> {
    await this.bucket.file(path).delete();
  }

  // Delete multiple files
  async deleteMany(paths: string[]): Promise<{
    deleted: string[];
    errors: Array<{ path: string; error: string }>;
  }> {
    const deleted: string[] = [];
    const errors: Array<{ path: string; error: string }> = [];

    await Promise.all(
      paths.map(async (path) => {
        try {
          await this.delete(path);
          deleted.push(path);
        } catch (error: any) {
          errors.push({ path, error: error.message });
        }
      })
    );

    return { deleted, errors };
  }

  // Check if file exists
  async exists(path: string): Promise<boolean> {
    const [exists] = await this.bucket.file(path).exists();
    return exists;
  }

  // Get file metadata
  async getMetadata(path: string): Promise<GCSObject> {
    const [metadata] = await this.bucket.file(path).getMetadata();

    return {
      name: metadata.name || path,
      size: parseInt(metadata.size?.toString() || '0'),
      updated: new Date(metadata.updated || Date.now()),
      contentType: metadata.contentType,
      metadata: metadata.metadata as Record<string, string>,
      generation: metadata.generation?.toString() || '',
      md5Hash: metadata.md5Hash,
    };
  }

  // Update file metadata
  async setMetadata(
    path: string,
    metadata: {
      contentType?: string;
      cacheControl?: string;
      contentDisposition?: string;
      customMetadata?: Record<string, string>;
    }
  ): Promise<void> {
    await this.bucket.file(path).setMetadata({
      contentType: metadata.contentType,
      cacheControl: metadata.cacheControl,
      contentDisposition: metadata.contentDisposition,
      metadata: metadata.customMetadata,
    });
  }

  // List files
  async list(options: ListOptions = {}): Promise<ListResult> {
    const [files, , apiResponse] = await this.bucket.getFiles({
      prefix: options.prefix,
      maxResults: options.maxResults,
      pageToken: options.pageToken,
      delimiter: options.delimiter,
      autoPaginate: false,
    });

    const objects: GCSObject[] = files.map((file) => ({
      name: file.name,
      size: parseInt(file.metadata.size?.toString() || '0'),
      updated: new Date(file.metadata.updated || Date.now()),
      contentType: file.metadata.contentType,
      metadata: file.metadata.metadata as Record<string, string>,
      generation: file.metadata.generation?.toString() || '',
      md5Hash: file.metadata.md5Hash,
    }));

    return {
      objects,
      prefixes: (apiResponse as any)?.prefixes || [],
      nextPageToken: (apiResponse as any)?.nextPageToken,
    };
  }

  // List all files (handles pagination)
  async listAll(prefix?: string): Promise<GCSObject[]> {
    const objects: GCSObject[] = [];
    let pageToken: string | undefined;

    do {
      const result = await this.list({ prefix, pageToken });
      objects.push(...result.objects);
      pageToken = result.nextPageToken;
    } while (pageToken);

    return objects;
  }

  // Copy file
  async copy(sourcePath: string, destPath: string): Promise<void> {
    await this.bucket.file(sourcePath).copy(this.bucket.file(destPath));
  }

  // Move file
  async move(sourcePath: string, destPath: string): Promise<void> {
    await this.bucket.file(sourcePath).move(destPath);
  }

  // Generate signed URL for reading
  async getSignedReadUrl(
    path: string,
    options: { expires?: number; responseContentType?: string } = {}
  ): Promise<string> {
    const [url] = await this.bucket.file(path).getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + (options.expires || 3600) * 1000,
      responseType: options.responseContentType,
    });

    return url;
  }

  // Generate signed URL for writing
  async getSignedUploadUrl(
    path: string,
    options: { expires?: number; contentType?: string } = {}
  ): Promise<string> {
    const [url] = await this.bucket.file(path).getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + (options.expires || 3600) * 1000,
      contentType: options.contentType,
    });

    return url;
  }

  // Generate resumable upload URL
  async getResumableUploadUrl(
    path: string,
    options: { contentType?: string } = {}
  ): Promise<string> {
    const [url] = await this.bucket.file(path).createResumableUpload({
      metadata: {
        contentType: options.contentType,
      },
    });

    return url;
  }

  // Make file public
  async makePublic(path: string): Promise<string> {
    await this.bucket.file(path).makePublic();
    return `https://storage.googleapis.com/${this.bucketName}/${path}`;
  }

  // Make file private
  async makePrivate(path: string): Promise<void> {
    await this.bucket.file(path).makePrivate();
  }

  // Get public URL (only works if file is public)
  getPublicUrl(path: string): string {
    return `https://storage.googleapis.com/${this.bucketName}/${path}`;
  }

  // Compose multiple files into one
  async compose(sources: string[], destination: string): Promise<void> {
    const sourceFiles = sources.map((s) => this.bucket.file(s));
    await this.bucket.combine(sourceFiles, destination);
  }
}

// Factory function
export function createGCSStorage(config: GCSConfig): GCSStorage {
  return new GCSStorage(config);
}
```

### Express Integration

```typescript
// src/routes/gcs-storage.ts
import { Router, Request, Response } from 'express';
import multer from 'multer';
import { createGCSStorage } from '../storage/gcs-client';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

const gcs = createGCSStorage({
  projectId: process.env.GCP_PROJECT_ID!,
  bucket: process.env.GCS_BUCKET!,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
});

// Upload file
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const ext = path.extname(req.file.originalname);
    const destPath = `uploads/${uuidv4()}${ext}`;

    const result = await gcs.upload(destPath, req.file.buffer, {
      contentType: req.file.mimetype,
      metadata: {
        originalName: req.file.originalname,
        uploadedBy: req.user?.id || 'anonymous',
      },
    });

    res.json({
      success: true,
      file: {
        name: result.name,
        url: result.url,
        originalName: req.file.originalname,
        size: req.file.size,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Upload with presigned URL
router.post('/upload/presigned', async (req: Request, res: Response) => {
  try {
    const { filename, contentType } = req.body;

    if (!filename || !contentType) {
      return res.status(400).json({ error: 'filename and contentType required' });
    }

    const ext = path.extname(filename);
    const destPath = `uploads/${uuidv4()}${ext}`;

    const url = await gcs.getSignedUploadUrl(destPath, {
      contentType,
      expires: 3600,
    });

    res.json({
      url,
      path: destPath,
      expiresIn: 3600,
    });
  } catch (error) {
    console.error('Presigned URL error:', error);
    res.status(500).json({ error: 'Failed to generate URL' });
  }
});

// Get presigned download URL
router.get('/download/:path(*)', async (req: Request, res: Response) => {
  try {
    const { path: filePath } = req.params;

    const exists = await gcs.exists(filePath);
    if (!exists) {
      return res.status(404).json({ error: 'File not found' });
    }

    const url = await gcs.getSignedReadUrl(filePath, { expires: 3600 });

    res.json({ url, expiresIn: 3600 });
  } catch (error) {
    console.error('Download URL error:', error);
    res.status(500).json({ error: 'Failed to generate URL' });
  }
});

// Delete file
router.delete('/files/:path(*)', async (req: Request, res: Response) => {
  try {
    const { path: filePath } = req.params;
    await gcs.delete(filePath);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Delete failed' });
  }
});

// List files
router.get('/files', async (req: Request, res: Response) => {
  try {
    const { prefix, maxResults, pageToken } = req.query;

    const result = await gcs.list({
      prefix: prefix as string,
      maxResults: maxResults ? parseInt(maxResults as string) : 100,
      pageToken: pageToken as string,
    });

    res.json(result);
  } catch (error) {
    console.error('List error:', error);
    res.status(500).json({ error: 'List failed' });
  }
});

// Get file metadata
router.get('/metadata/:path(*)', async (req: Request, res: Response) => {
  try {
    const { path: filePath } = req.params;
    const metadata = await gcs.getMetadata(filePath);
    res.json(metadata);
  } catch (error) {
    console.error('Metadata error:', error);
    res.status(500).json({ error: 'Failed to get metadata' });
  }
});

// Copy file
router.post('/copy', async (req: Request, res: Response) => {
  try {
    const { source, destination } = req.body;

    if (!source || !destination) {
      return res.status(400).json({ error: 'source and destination required' });
    }

    await gcs.copy(source, destination);
    res.json({ success: true, destination });
  } catch (error) {
    console.error('Copy error:', error);
    res.status(500).json({ error: 'Copy failed' });
  }
});

// Make file public
router.post('/public/:path(*)', async (req: Request, res: Response) => {
  try {
    const { path: filePath } = req.params;
    const url = await gcs.makePublic(filePath);
    res.json({ success: true, url });
  } catch (error) {
    console.error('Public error:', error);
    res.status(500).json({ error: 'Failed to make public' });
  }
});

export default router;
```

## Python Implementation

```python
# storage/gcs_client.py
from google.cloud import storage
from google.cloud.storage import Blob, Bucket
from google.oauth2 import service_account
from typing import Optional, List, Dict, Any, BinaryIO, Union
from dataclasses import dataclass
from datetime import datetime, timedelta
from pathlib import Path
import uuid


@dataclass
class GCSObject:
    name: str
    size: int
    updated: datetime
    content_type: Optional[str]
    metadata: Optional[Dict[str, str]]
    generation: str
    md5_hash: Optional[str]


@dataclass
class UploadResult:
    name: str
    url: str
    generation: str


class GCSStorage:
    def __init__(
        self,
        project_id: str,
        bucket_name: str,
        credentials_path: Optional[str] = None,
        credentials_dict: Optional[Dict[str, Any]] = None,
    ):
        self.bucket_name = bucket_name

        if credentials_path:
            credentials = service_account.Credentials.from_service_account_file(
                credentials_path
            )
            self.client = storage.Client(
                project=project_id,
                credentials=credentials
            )
        elif credentials_dict:
            credentials = service_account.Credentials.from_service_account_info(
                credentials_dict
            )
            self.client = storage.Client(
                project=project_id,
                credentials=credentials
            )
        else:
            self.client = storage.Client(project=project_id)

        self.bucket = self.client.bucket(bucket_name)

    def upload(
        self,
        path: str,
        data: Union[bytes, BinaryIO, str],
        content_type: Optional[str] = None,
        metadata: Optional[Dict[str, str]] = None,
        public: bool = False,
    ) -> UploadResult:
        """Upload data to GCS."""
        blob = self.bucket.blob(path)

        if metadata:
            blob.metadata = metadata

        if isinstance(data, bytes):
            blob.upload_from_string(data, content_type=content_type)
        elif isinstance(data, str):
            blob.upload_from_string(data.encode(), content_type=content_type)
        else:
            blob.upload_from_file(data, content_type=content_type)

        if public:
            blob.make_public()

        return UploadResult(
            name=path,
            url=blob.public_url if public else f'gs://{self.bucket_name}/{path}',
            generation=str(blob.generation)
        )

    def upload_file(
        self,
        local_path: str,
        dest_path: str,
        content_type: Optional[str] = None,
        metadata: Optional[Dict[str, str]] = None,
        public: bool = False,
    ) -> UploadResult:
        """Upload local file to GCS."""
        blob = self.bucket.blob(dest_path)

        if metadata:
            blob.metadata = metadata

        blob.upload_from_filename(local_path, content_type=content_type)

        if public:
            blob.make_public()

        return UploadResult(
            name=dest_path,
            url=blob.public_url if public else f'gs://{self.bucket_name}/{dest_path}',
            generation=str(blob.generation)
        )

    def download(self, path: str) -> bytes:
        """Download file as bytes."""
        blob = self.bucket.blob(path)
        return blob.download_as_bytes()

    def download_to_file(self, path: str, local_path: str) -> None:
        """Download file to local filesystem."""
        blob = self.bucket.blob(path)
        blob.download_to_filename(local_path)

    def delete(self, path: str) -> None:
        """Delete file."""
        blob = self.bucket.blob(path)
        blob.delete()

    def delete_many(self, paths: List[str]) -> Dict[str, List[str]]:
        """Delete multiple files."""
        deleted = []
        errors = []

        for path in paths:
            try:
                self.delete(path)
                deleted.append(path)
            except Exception as e:
                errors.append(path)

        return {'deleted': deleted, 'errors': errors}

    def exists(self, path: str) -> bool:
        """Check if file exists."""
        blob = self.bucket.blob(path)
        return blob.exists()

    def get_metadata(self, path: str) -> GCSObject:
        """Get file metadata."""
        blob = self.bucket.blob(path)
        blob.reload()

        return GCSObject(
            name=blob.name,
            size=blob.size or 0,
            updated=blob.updated or datetime.now(),
            content_type=blob.content_type,
            metadata=blob.metadata,
            generation=str(blob.generation),
            md5_hash=blob.md5_hash
        )

    def set_metadata(
        self,
        path: str,
        content_type: Optional[str] = None,
        cache_control: Optional[str] = None,
        metadata: Optional[Dict[str, str]] = None,
    ) -> None:
        """Update file metadata."""
        blob = self.bucket.blob(path)
        blob.reload()

        if content_type:
            blob.content_type = content_type
        if cache_control:
            blob.cache_control = cache_control
        if metadata:
            blob.metadata = metadata

        blob.patch()

    def list_objects(
        self,
        prefix: Optional[str] = None,
        max_results: Optional[int] = None,
        delimiter: Optional[str] = None,
    ) -> Dict[str, Any]:
        """List objects in bucket."""
        blobs = self.client.list_blobs(
            self.bucket_name,
            prefix=prefix,
            max_results=max_results,
            delimiter=delimiter
        )

        objects = []
        prefixes = []

        for blob in blobs:
            objects.append(GCSObject(
                name=blob.name,
                size=blob.size or 0,
                updated=blob.updated or datetime.now(),
                content_type=blob.content_type,
                metadata=blob.metadata,
                generation=str(blob.generation),
                md5_hash=blob.md5_hash
            ))

        if hasattr(blobs, 'prefixes'):
            prefixes = list(blobs.prefixes)

        return {
            'objects': objects,
            'prefixes': prefixes
        }

    def list_all(self, prefix: Optional[str] = None) -> List[GCSObject]:
        """List all objects (handles pagination)."""
        result = self.list_objects(prefix=prefix)
        return result['objects']

    def copy(self, source_path: str, dest_path: str) -> None:
        """Copy file."""
        source_blob = self.bucket.blob(source_path)
        self.bucket.copy_blob(source_blob, self.bucket, dest_path)

    def move(self, source_path: str, dest_path: str) -> None:
        """Move file."""
        self.copy(source_path, dest_path)
        self.delete(source_path)

    def generate_signed_read_url(
        self,
        path: str,
        expires_in: int = 3600,
    ) -> str:
        """Generate signed URL for reading."""
        blob = self.bucket.blob(path)

        return blob.generate_signed_url(
            version='v4',
            expiration=timedelta(seconds=expires_in),
            method='GET'
        )

    def generate_signed_upload_url(
        self,
        path: str,
        content_type: Optional[str] = None,
        expires_in: int = 3600,
    ) -> str:
        """Generate signed URL for uploading."""
        blob = self.bucket.blob(path)

        return blob.generate_signed_url(
            version='v4',
            expiration=timedelta(seconds=expires_in),
            method='PUT',
            content_type=content_type
        )

    def make_public(self, path: str) -> str:
        """Make file public."""
        blob = self.bucket.blob(path)
        blob.make_public()
        return blob.public_url

    def make_private(self, path: str) -> None:
        """Make file private."""
        blob = self.bucket.blob(path)
        blob.make_private()

    def get_public_url(self, path: str) -> str:
        """Get public URL."""
        return f'https://storage.googleapis.com/{self.bucket_name}/{path}'


# FastAPI integration
from fastapi import FastAPI, UploadFile, File, HTTPException, Query
import os

app = FastAPI()

gcs = GCSStorage(
    project_id=os.environ.get('GCP_PROJECT_ID', ''),
    bucket_name=os.environ.get('GCS_BUCKET', ''),
    credentials_path=os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')
)


@app.post('/upload')
async def upload_file(file: UploadFile = File(...)):
    """Upload file."""
    content = await file.read()
    ext = Path(file.filename).suffix
    dest_path = f'uploads/{uuid.uuid4()}{ext}'

    result = gcs.upload(
        dest_path,
        content,
        content_type=file.content_type
    )

    return {
        'name': result.name,
        'url': result.url,
        'original_name': file.filename,
        'size': len(content)
    }


@app.post('/upload/presigned')
async def get_presigned_upload_url(
    filename: str,
    content_type: str,
):
    """Get presigned URL for upload."""
    ext = Path(filename).suffix
    dest_path = f'uploads/{uuid.uuid4()}{ext}'

    url = gcs.generate_signed_upload_url(
        dest_path,
        content_type=content_type,
        expires_in=3600
    )

    return {'url': url, 'path': dest_path}


@app.get('/download/{path:path}')
async def get_presigned_download_url(path: str):
    """Get presigned URL for download."""
    if not gcs.exists(path):
        raise HTTPException(status_code=404, detail='File not found')

    url = gcs.generate_signed_read_url(path, expires_in=3600)
    return {'url': url}


@app.delete('/files/{path:path}')
async def delete_file(path: str):
    """Delete file."""
    gcs.delete(path)
    return {'success': True}


@app.get('/files')
async def list_files(
    prefix: Optional[str] = Query(None),
    max_results: int = Query(100),
):
    """List files."""
    result = gcs.list_objects(
        prefix=prefix,
        max_results=max_results
    )

    return {
        'objects': [
            {
                'name': obj.name,
                'size': obj.size,
                'updated': obj.updated.isoformat(),
                'content_type': obj.content_type
            }
            for obj in result['objects']
        ],
        'prefixes': result['prefixes']
    }
```

## CLAUDE.md Integration

```markdown
## Google Cloud Storage Commands

### Upload Operations
- "upload to GCS" - Upload file to bucket
- "create signed upload URL" - Generate upload URL
- "upload folder to GCS" - Batch upload

### Download Operations
- "download from GCS" - Download file
- "create signed download URL" - Generate download URL
- "stream from GCS" - Stream large files

### Management Operations
- "list GCS objects" - List bucket contents
- "delete GCS file" - Remove file
- "copy GCS object" - Copy within bucket
- "move GCS object" - Move/rename file

### Access Control
- "make GCS file public" - Enable public access
- "make GCS file private" - Revoke public access
- "set GCS metadata" - Update file metadata
```

## AI Suggestions

1. **"Implement resumable uploads"** - Handle large file uploads reliably
2. **"Add Object Lifecycle Management"** - Auto-archive or delete old files
3. **"Implement Object Versioning"** - Track file changes over time
4. **"Add Cloud CDN integration"** - Global content delivery
5. **"Implement IAM policies"** - Fine-grained access control
6. **"Add Pub/Sub notifications"** - Trigger on storage events
7. **"Implement Nearline/Coldline storage"** - Cost optimization for archives
8. **"Add Customer-managed encryption keys"** - CMEK for compliance
9. **"Implement signed URLs with conditions"** - IP/header restrictions
10. **"Add storage transfer service"** - Cross-cloud data migration
