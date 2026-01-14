# Azure Blob Storage

Production-ready Azure Blob Storage integration with uploads, downloads, SAS tokens, and lifecycle management.

## Overview

Azure Blob Storage provides massively scalable object storage for unstructured data with tiered storage options and geo-redundancy.

## Quick Start

```bash
npm install @azure/storage-blob
pip install azure-storage-blob
```

## TypeScript Implementation

### Azure Blob Client Configuration

```typescript
// src/storage/azure-blob-client.ts
import {
  BlobServiceClient,
  ContainerClient,
  BlockBlobClient,
  BlobSASPermissions,
  generateBlobSASQueryParameters,
  StorageSharedKeyCredential,
  ContainerSASPermissions,
  BlobHTTPHeaders,
} from '@azure/storage-blob';
import { Readable } from 'stream';

interface AzureBlobConfig {
  connectionString?: string;
  accountName?: string;
  accountKey?: string;
  sasToken?: string;
  container: string;
}

interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  tags?: Record<string, string>;
  tier?: 'Hot' | 'Cool' | 'Archive';
  cacheControl?: string;
  contentDisposition?: string;
}

interface SASOptions {
  permissions?: string;
  expiresIn?: number;
  contentType?: string;
  contentDisposition?: string;
}

interface BlobInfo {
  name: string;
  size: number;
  lastModified: Date;
  contentType?: string;
  etag?: string;
  tier?: string;
  metadata?: Record<string, string>;
  tags?: Record<string, string>;
}

interface ListOptions {
  prefix?: string;
  maxPageSize?: number;
  includeMetadata?: boolean;
  includeTags?: boolean;
}

interface ListResult {
  blobs: BlobInfo[];
  continuationToken?: string;
}

export class AzureBlobStorage {
  private blobServiceClient: BlobServiceClient;
  private containerClient: ContainerClient;
  private containerName: string;
  private credential?: StorageSharedKeyCredential;
  private accountName?: string;

  constructor(config: AzureBlobConfig) {
    this.containerName = config.container;

    if (config.connectionString) {
      this.blobServiceClient = BlobServiceClient.fromConnectionString(
        config.connectionString
      );
      // Parse account name from connection string
      const match = config.connectionString.match(/AccountName=([^;]+)/);
      this.accountName = match?.[1];
    } else if (config.accountName && config.accountKey) {
      this.accountName = config.accountName;
      this.credential = new StorageSharedKeyCredential(
        config.accountName,
        config.accountKey
      );
      this.blobServiceClient = new BlobServiceClient(
        `https://${config.accountName}.blob.core.windows.net`,
        this.credential
      );
    } else if (config.accountName && config.sasToken) {
      this.accountName = config.accountName;
      this.blobServiceClient = new BlobServiceClient(
        `https://${config.accountName}.blob.core.windows.net${config.sasToken}`
      );
    } else {
      throw new Error('Invalid Azure Blob configuration');
    }

    this.containerClient = this.blobServiceClient.getContainerClient(config.container);
  }

  // Ensure container exists
  async ensureContainer(): Promise<void> {
    await this.containerClient.createIfNotExists();
  }

  // Upload from buffer
  async upload(
    blobName: string,
    data: Buffer | Readable | string,
    options: UploadOptions = {}
  ): Promise<{
    url: string;
    etag?: string;
    lastModified?: Date;
  }> {
    await this.ensureContainer();

    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

    const blobHTTPHeaders: BlobHTTPHeaders = {
      blobContentType: options.contentType,
      blobCacheControl: options.cacheControl,
      blobContentDisposition: options.contentDisposition,
    };

    if (Buffer.isBuffer(data)) {
      const response = await blockBlobClient.uploadData(data, {
        blobHTTPHeaders,
        metadata: options.metadata,
        tags: options.tags,
        tier: options.tier,
      });

      return {
        url: blockBlobClient.url,
        etag: response.etag,
        lastModified: response.lastModified,
      };
    } else if (typeof data === 'string') {
      const response = await blockBlobClient.upload(data, data.length, {
        blobHTTPHeaders,
        metadata: options.metadata,
        tags: options.tags,
        tier: options.tier,
      });

      return {
        url: blockBlobClient.url,
        etag: response.etag,
        lastModified: response.lastModified,
      };
    } else {
      // Stream upload
      const response = await blockBlobClient.uploadStream(data, 4 * 1024 * 1024, 5, {
        blobHTTPHeaders,
        metadata: options.metadata,
        tags: options.tags,
        tier: options.tier,
      });

      return {
        url: blockBlobClient.url,
        etag: response.etag,
        lastModified: response.lastModified,
      };
    }
  }

  // Upload from file
  async uploadFile(
    localPath: string,
    blobName: string,
    options: UploadOptions = {}
  ): Promise<{
    url: string;
    etag?: string;
    lastModified?: Date;
  }> {
    await this.ensureContainer();

    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

    const response = await blockBlobClient.uploadFile(localPath, {
      blobHTTPHeaders: {
        blobContentType: options.contentType,
        blobCacheControl: options.cacheControl,
        blobContentDisposition: options.contentDisposition,
      },
      metadata: options.metadata,
      tags: options.tags,
      tier: options.tier,
    });

    return {
      url: blockBlobClient.url,
      etag: response.etag,
      lastModified: response.lastModified,
    };
  }

  // Download as buffer
  async download(blobName: string): Promise<Buffer> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    return blockBlobClient.downloadToBuffer();
  }

  // Download as stream
  async downloadStream(blobName: string): Promise<NodeJS.ReadableStream> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    const response = await blockBlobClient.download();
    return response.readableStreamBody!;
  }

  // Download to file
  async downloadToFile(blobName: string, localPath: string): Promise<void> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.downloadToFile(localPath);
  }

  // Delete blob
  async delete(blobName: string): Promise<void> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.delete();
  }

  // Delete multiple blobs
  async deleteMany(blobNames: string[]): Promise<{
    deleted: string[];
    errors: Array<{ name: string; error: string }>;
  }> {
    const deleted: string[] = [];
    const errors: Array<{ name: string; error: string }> = [];

    await Promise.all(
      blobNames.map(async (name) => {
        try {
          await this.delete(name);
          deleted.push(name);
        } catch (error: any) {
          errors.push({ name, error: error.message });
        }
      })
    );

    return { deleted, errors };
  }

  // Check if blob exists
  async exists(blobName: string): Promise<boolean> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    return blockBlobClient.exists();
  }

  // Get blob properties
  async getProperties(blobName: string): Promise<BlobInfo> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    const props = await blockBlobClient.getProperties();

    return {
      name: blobName,
      size: props.contentLength || 0,
      lastModified: props.lastModified || new Date(),
      contentType: props.contentType,
      etag: props.etag,
      tier: props.accessTier,
      metadata: props.metadata,
    };
  }

  // Set blob metadata
  async setMetadata(
    blobName: string,
    metadata: Record<string, string>
  ): Promise<void> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.setMetadata(metadata);
  }

  // Set blob tags
  async setTags(
    blobName: string,
    tags: Record<string, string>
  ): Promise<void> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.setTags(tags);
  }

  // List blobs
  async list(options: ListOptions = {}): Promise<ListResult> {
    const blobs: BlobInfo[] = [];

    const listOptions: any = {
      prefix: options.prefix,
      includeMetadata: options.includeMetadata,
      includeTags: options.includeTags,
    };

    const iter = this.containerClient.listBlobsFlat(listOptions);

    let count = 0;
    const maxItems = options.maxPageSize || 100;

    for await (const blob of iter) {
      if (count >= maxItems) break;

      blobs.push({
        name: blob.name,
        size: blob.properties.contentLength || 0,
        lastModified: blob.properties.lastModified || new Date(),
        contentType: blob.properties.contentType,
        etag: blob.properties.etag,
        tier: blob.properties.accessTier,
        metadata: blob.metadata,
        tags: blob.tags,
      });

      count++;
    }

    return { blobs };
  }

  // List all blobs
  async listAll(prefix?: string): Promise<BlobInfo[]> {
    const blobs: BlobInfo[] = [];

    for await (const blob of this.containerClient.listBlobsFlat({ prefix })) {
      blobs.push({
        name: blob.name,
        size: blob.properties.contentLength || 0,
        lastModified: blob.properties.lastModified || new Date(),
        contentType: blob.properties.contentType,
        etag: blob.properties.etag,
        tier: blob.properties.accessTier,
      });
    }

    return blobs;
  }

  // Copy blob
  async copy(sourceBlobName: string, destBlobName: string): Promise<void> {
    const sourceClient = this.containerClient.getBlockBlobClient(sourceBlobName);
    const destClient = this.containerClient.getBlockBlobClient(destBlobName);

    await destClient.beginCopyFromURL(sourceClient.url);
  }

  // Move blob
  async move(sourceBlobName: string, destBlobName: string): Promise<void> {
    await this.copy(sourceBlobName, destBlobName);
    await this.delete(sourceBlobName);
  }

  // Generate SAS URL for download
  generateDownloadSAS(blobName: string, options: SASOptions = {}): string {
    if (!this.credential || !this.accountName) {
      throw new Error('Account credentials required for SAS generation');
    }

    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    const expiresOn = new Date(Date.now() + (options.expiresIn || 3600) * 1000);

    const sasToken = generateBlobSASQueryParameters(
      {
        containerName: this.containerName,
        blobName,
        permissions: BlobSASPermissions.parse(options.permissions || 'r'),
        expiresOn,
        contentType: options.contentType,
        contentDisposition: options.contentDisposition,
      },
      this.credential
    ).toString();

    return `${blockBlobClient.url}?${sasToken}`;
  }

  // Generate SAS URL for upload
  generateUploadSAS(blobName: string, options: SASOptions = {}): string {
    if (!this.credential || !this.accountName) {
      throw new Error('Account credentials required for SAS generation');
    }

    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    const expiresOn = new Date(Date.now() + (options.expiresIn || 3600) * 1000);

    const sasToken = generateBlobSASQueryParameters(
      {
        containerName: this.containerName,
        blobName,
        permissions: BlobSASPermissions.parse(options.permissions || 'cw'),
        expiresOn,
        contentType: options.contentType,
      },
      this.credential
    ).toString();

    return `${blockBlobClient.url}?${sasToken}`;
  }

  // Set blob tier
  async setTier(blobName: string, tier: 'Hot' | 'Cool' | 'Archive'): Promise<void> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.setAccessTier(tier);
  }

  // Create snapshot
  async createSnapshot(blobName: string): Promise<string> {
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
    const response = await blockBlobClient.createSnapshot();
    return response.snapshot!;
  }
}

// Factory function
export function createAzureBlobStorage(config: AzureBlobConfig): AzureBlobStorage {
  return new AzureBlobStorage(config);
}
```

### Express Integration

```typescript
// src/routes/azure-blob.ts
import { Router, Request, Response } from 'express';
import multer from 'multer';
import { createAzureBlobStorage } from '../storage/azure-blob-client';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

const azureBlob = createAzureBlobStorage({
  connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
  container: process.env.AZURE_STORAGE_CONTAINER || 'uploads',
});

const upload = multer({ storage: multer.memoryStorage() });

// Upload file
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const ext = path.extname(req.file.originalname);
    const blobName = `${uuidv4()}${ext}`;

    const result = await azureBlob.upload(blobName, req.file.buffer, {
      contentType: req.file.mimetype,
      metadata: {
        originalName: req.file.originalname,
        uploadedBy: req.user?.id || 'anonymous',
      },
    });

    res.json({
      success: true,
      blob: {
        name: blobName,
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

// Get SAS URL for upload
router.post('/upload/sas', async (req: Request, res: Response) => {
  try {
    const { filename, contentType } = req.body;

    if (!filename) {
      return res.status(400).json({ error: 'filename required' });
    }

    const ext = path.extname(filename);
    const blobName = `${uuidv4()}${ext}`;

    const sasUrl = azureBlob.generateUploadSAS(blobName, {
      expiresIn: 3600,
      contentType,
    });

    res.json({
      sasUrl,
      blobName,
      expiresIn: 3600,
    });
  } catch (error) {
    console.error('SAS generation error:', error);
    res.status(500).json({ error: 'Failed to generate SAS URL' });
  }
});

// Get SAS URL for download
router.get('/download/:blobName(*)', async (req: Request, res: Response) => {
  try {
    const { blobName } = req.params;

    const exists = await azureBlob.exists(blobName);
    if (!exists) {
      return res.status(404).json({ error: 'Blob not found' });
    }

    const sasUrl = azureBlob.generateDownloadSAS(blobName, {
      expiresIn: 3600,
    });

    res.json({ sasUrl, expiresIn: 3600 });
  } catch (error) {
    console.error('Download SAS error:', error);
    res.status(500).json({ error: 'Failed to generate SAS URL' });
  }
});

// Delete blob
router.delete('/blobs/:blobName(*)', async (req: Request, res: Response) => {
  try {
    const { blobName } = req.params;
    await azureBlob.delete(blobName);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Delete failed' });
  }
});

// List blobs
router.get('/blobs', async (req: Request, res: Response) => {
  try {
    const { prefix, maxPageSize } = req.query;

    const result = await azureBlob.list({
      prefix: prefix as string,
      maxPageSize: maxPageSize ? parseInt(maxPageSize as string) : 100,
    });

    res.json(result);
  } catch (error) {
    console.error('List error:', error);
    res.status(500).json({ error: 'List failed' });
  }
});

// Get blob properties
router.get('/blobs/:blobName(*)/properties', async (req: Request, res: Response) => {
  try {
    const { blobName } = req.params;
    const properties = await azureBlob.getProperties(blobName);
    res.json(properties);
  } catch (error) {
    console.error('Properties error:', error);
    res.status(500).json({ error: 'Failed to get properties' });
  }
});

// Set blob tier
router.put('/blobs/:blobName(*)/tier', async (req: Request, res: Response) => {
  try {
    const { blobName } = req.params;
    const { tier } = req.body;

    if (!['Hot', 'Cool', 'Archive'].includes(tier)) {
      return res.status(400).json({ error: 'Invalid tier' });
    }

    await azureBlob.setTier(blobName, tier);
    res.json({ success: true, tier });
  } catch (error) {
    console.error('Set tier error:', error);
    res.status(500).json({ error: 'Failed to set tier' });
  }
});

export default router;
```

## Python Implementation

```python
# storage/azure_blob_client.py
from azure.storage.blob import (
    BlobServiceClient,
    ContainerClient,
    BlobClient,
    generate_blob_sas,
    BlobSasPermissions,
    ContentSettings,
)
from azure.core.exceptions import ResourceNotFoundError
from typing import Optional, List, Dict, Any, BinaryIO, Union
from dataclasses import dataclass
from datetime import datetime, timedelta
from pathlib import Path
import uuid


@dataclass
class BlobInfo:
    name: str
    size: int
    last_modified: datetime
    content_type: Optional[str]
    etag: Optional[str]
    tier: Optional[str]
    metadata: Optional[Dict[str, str]]


@dataclass
class UploadResult:
    url: str
    etag: str
    last_modified: datetime


class AzureBlobStorage:
    def __init__(
        self,
        connection_string: Optional[str] = None,
        account_name: Optional[str] = None,
        account_key: Optional[str] = None,
        container_name: str = 'default',
    ):
        self.container_name = container_name

        if connection_string:
            self.blob_service_client = BlobServiceClient.from_connection_string(
                connection_string
            )
            # Parse account info
            parts = dict(x.split('=', 1) for x in connection_string.split(';') if '=' in x)
            self.account_name = parts.get('AccountName')
            self.account_key = parts.get('AccountKey')
        elif account_name and account_key:
            self.account_name = account_name
            self.account_key = account_key
            self.blob_service_client = BlobServiceClient(
                account_url=f'https://{account_name}.blob.core.windows.net',
                credential=account_key
            )
        else:
            raise ValueError('Either connection_string or account credentials required')

        self.container_client = self.blob_service_client.get_container_client(
            container_name
        )

    def ensure_container(self) -> None:
        """Ensure container exists."""
        try:
            self.container_client.create_container()
        except Exception:
            pass  # Container may already exist

    def upload(
        self,
        blob_name: str,
        data: Union[bytes, BinaryIO],
        content_type: Optional[str] = None,
        metadata: Optional[Dict[str, str]] = None,
        tier: Optional[str] = None,
    ) -> UploadResult:
        """Upload data to blob."""
        self.ensure_container()

        blob_client = self.container_client.get_blob_client(blob_name)

        content_settings = ContentSettings(content_type=content_type) if content_type else None

        response = blob_client.upload_blob(
            data,
            overwrite=True,
            content_settings=content_settings,
            metadata=metadata,
            standard_blob_tier=tier
        )

        return UploadResult(
            url=blob_client.url,
            etag=response.get('etag', ''),
            last_modified=response.get('last_modified', datetime.now())
        )

    def upload_file(
        self,
        local_path: str,
        blob_name: Optional[str] = None,
        content_type: Optional[str] = None,
        metadata: Optional[Dict[str, str]] = None,
    ) -> UploadResult:
        """Upload file from local path."""
        self.ensure_container()

        if not blob_name:
            blob_name = Path(local_path).name

        blob_client = self.container_client.get_blob_client(blob_name)
        content_settings = ContentSettings(content_type=content_type) if content_type else None

        with open(local_path, 'rb') as f:
            response = blob_client.upload_blob(
                f,
                overwrite=True,
                content_settings=content_settings,
                metadata=metadata
            )

        return UploadResult(
            url=blob_client.url,
            etag=response.get('etag', ''),
            last_modified=response.get('last_modified', datetime.now())
        )

    def download(self, blob_name: str) -> bytes:
        """Download blob as bytes."""
        blob_client = self.container_client.get_blob_client(blob_name)
        return blob_client.download_blob().readall()

    def download_to_file(self, blob_name: str, local_path: str) -> None:
        """Download blob to local file."""
        blob_client = self.container_client.get_blob_client(blob_name)
        with open(local_path, 'wb') as f:
            stream = blob_client.download_blob()
            stream.readinto(f)

    def delete(self, blob_name: str) -> None:
        """Delete blob."""
        blob_client = self.container_client.get_blob_client(blob_name)
        blob_client.delete_blob()

    def delete_many(self, blob_names: List[str]) -> Dict[str, List[str]]:
        """Delete multiple blobs."""
        deleted = []
        errors = []

        for name in blob_names:
            try:
                self.delete(name)
                deleted.append(name)
            except Exception as e:
                errors.append(name)

        return {'deleted': deleted, 'errors': errors}

    def exists(self, blob_name: str) -> bool:
        """Check if blob exists."""
        blob_client = self.container_client.get_blob_client(blob_name)
        return blob_client.exists()

    def get_properties(self, blob_name: str) -> BlobInfo:
        """Get blob properties."""
        blob_client = self.container_client.get_blob_client(blob_name)
        props = blob_client.get_blob_properties()

        return BlobInfo(
            name=blob_name,
            size=props.size,
            last_modified=props.last_modified,
            content_type=props.content_settings.content_type if props.content_settings else None,
            etag=props.etag,
            tier=props.blob_tier,
            metadata=props.metadata
        )

    def set_metadata(
        self,
        blob_name: str,
        metadata: Dict[str, str]
    ) -> None:
        """Set blob metadata."""
        blob_client = self.container_client.get_blob_client(blob_name)
        blob_client.set_blob_metadata(metadata)

    def list_blobs(
        self,
        prefix: Optional[str] = None,
        max_results: Optional[int] = None,
    ) -> List[BlobInfo]:
        """List blobs in container."""
        blobs = []

        blob_iter = self.container_client.list_blobs(name_starts_with=prefix)

        for blob in blob_iter:
            blobs.append(BlobInfo(
                name=blob.name,
                size=blob.size,
                last_modified=blob.last_modified,
                content_type=blob.content_settings.content_type if blob.content_settings else None,
                etag=blob.etag,
                tier=blob.blob_tier,
                metadata=blob.metadata
            ))

            if max_results and len(blobs) >= max_results:
                break

        return blobs

    def copy(self, source_blob: str, dest_blob: str) -> None:
        """Copy blob."""
        source_client = self.container_client.get_blob_client(source_blob)
        dest_client = self.container_client.get_blob_client(dest_blob)
        dest_client.start_copy_from_url(source_client.url)

    def move(self, source_blob: str, dest_blob: str) -> None:
        """Move blob."""
        self.copy(source_blob, dest_blob)
        self.delete(source_blob)

    def generate_download_sas(
        self,
        blob_name: str,
        expires_in: int = 3600,
    ) -> str:
        """Generate SAS URL for download."""
        sas_token = generate_blob_sas(
            account_name=self.account_name,
            container_name=self.container_name,
            blob_name=blob_name,
            account_key=self.account_key,
            permission=BlobSasPermissions(read=True),
            expiry=datetime.utcnow() + timedelta(seconds=expires_in)
        )

        return f'https://{self.account_name}.blob.core.windows.net/{self.container_name}/{blob_name}?{sas_token}'

    def generate_upload_sas(
        self,
        blob_name: str,
        expires_in: int = 3600,
    ) -> str:
        """Generate SAS URL for upload."""
        sas_token = generate_blob_sas(
            account_name=self.account_name,
            container_name=self.container_name,
            blob_name=blob_name,
            account_key=self.account_key,
            permission=BlobSasPermissions(write=True, create=True),
            expiry=datetime.utcnow() + timedelta(seconds=expires_in)
        )

        return f'https://{self.account_name}.blob.core.windows.net/{self.container_name}/{blob_name}?{sas_token}'

    def set_tier(self, blob_name: str, tier: str) -> None:
        """Set blob access tier."""
        blob_client = self.container_client.get_blob_client(blob_name)
        blob_client.set_standard_blob_tier(tier)


# FastAPI integration
from fastapi import FastAPI, UploadFile, File, HTTPException, Query
import os

app = FastAPI()

azure_blob = AzureBlobStorage(
    connection_string=os.environ.get('AZURE_STORAGE_CONNECTION_STRING'),
    container_name=os.environ.get('AZURE_STORAGE_CONTAINER', 'uploads')
)


@app.post('/upload')
async def upload_file(file: UploadFile = File(...)):
    """Upload file."""
    content = await file.read()
    ext = Path(file.filename).suffix
    blob_name = f'{uuid.uuid4()}{ext}'

    result = azure_blob.upload(
        blob_name,
        content,
        content_type=file.content_type
    )

    return {
        'url': result.url,
        'blob_name': blob_name,
        'original_name': file.filename,
        'size': len(content)
    }


@app.post('/upload/sas')
async def get_upload_sas(filename: str):
    """Get SAS URL for upload."""
    ext = Path(filename).suffix
    blob_name = f'{uuid.uuid4()}{ext}'

    sas_url = azure_blob.generate_upload_sas(blob_name, expires_in=3600)

    return {'sas_url': sas_url, 'blob_name': blob_name}


@app.get('/download/{blob_name:path}')
async def get_download_sas(blob_name: str):
    """Get SAS URL for download."""
    if not azure_blob.exists(blob_name):
        raise HTTPException(status_code=404, detail='Blob not found')

    sas_url = azure_blob.generate_download_sas(blob_name, expires_in=3600)
    return {'sas_url': sas_url}


@app.delete('/blobs/{blob_name:path}')
async def delete_blob(blob_name: str):
    """Delete blob."""
    azure_blob.delete(blob_name)
    return {'success': True}


@app.get('/blobs')
async def list_blobs(
    prefix: Optional[str] = Query(None),
    max_results: int = Query(100),
):
    """List blobs."""
    blobs = azure_blob.list_blobs(prefix=prefix, max_results=max_results)

    return {
        'blobs': [
            {
                'name': b.name,
                'size': b.size,
                'last_modified': b.last_modified.isoformat(),
                'content_type': b.content_type,
                'tier': b.tier
            }
            for b in blobs
        ]
    }
```

## CLAUDE.md Integration

```markdown
## Azure Blob Storage Commands

### Upload Operations
- "upload to Azure Blob" - Upload file to container
- "create SAS upload URL" - Generate upload token
- "set blob metadata" - Update blob properties

### Download Operations
- "download from Azure Blob" - Download file
- "create SAS download URL" - Generate download token
- "stream blob content" - Stream large files

### Management
- "list blobs" - List container contents
- "delete blob" - Remove file
- "copy blob" - Duplicate blob
- "move blob" - Rename/relocate blob

### Tiering
- "set blob tier" - Change to Hot/Cool/Archive
- "get blob properties" - Check current tier
```

## AI Suggestions

1. **"Implement soft delete"** - Enable blob recovery
2. **"Add immutable storage"** - WORM compliance
3. **"Implement blob versioning"** - Track changes
4. **"Add lifecycle management"** - Auto-tier old blobs
5. **"Implement geo-redundancy"** - Cross-region replication
6. **"Add customer-managed keys"** - CMK encryption
7. **"Implement blob indexing"** - Tag-based search
8. **"Add private endpoints"** - VNet integration
9. **"Implement change feed"** - Track blob changes
10. **"Add static website hosting"** - Direct blob serving
