# Presigned URLs

Production-ready presigned URL generation for secure, time-limited access to cloud storage objects.

## Overview

Presigned URLs provide temporary, secure access to private objects without requiring authentication credentials, supporting uploads, downloads, and access control across cloud providers.

## Quick Start

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner @google-cloud/storage @azure/storage-blob
```

## TypeScript Implementation

### Universal Presigned URL Service

```typescript
// src/storage/presigned-url-service.ts
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Storage } from '@google-cloud/storage';
import {
  BlobServiceClient,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  StorageSharedKeyCredential,
} from '@azure/storage-blob';

type Provider = 's3' | 'gcs' | 'azure' | 'minio';

interface PresignedUrlConfig {
  provider: Provider;
  bucket: string;
  // S3/MinIO config
  s3?: {
    region: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    endpoint?: string;
  };
  // GCS config
  gcs?: {
    projectId: string;
    keyFilename?: string;
  };
  // Azure config
  azure?: {
    connectionString?: string;
    accountName?: string;
    accountKey?: string;
  };
}

interface PresignedOptions {
  expiresIn?: number;
  contentType?: string;
  contentDisposition?: string;
  metadata?: Record<string, string>;
  conditions?: {
    contentLengthRange?: { min: number; max: number };
  };
}

interface PresignedUploadResult {
  url: string;
  fields?: Record<string, string>;
  method: 'PUT' | 'POST';
  expiresAt: Date;
}

interface PresignedDownloadResult {
  url: string;
  expiresAt: Date;
}

export class PresignedUrlService {
  private config: PresignedUrlConfig;
  private s3Client?: S3Client;
  private gcsStorage?: Storage;
  private azureCredential?: StorageSharedKeyCredential;
  private azureServiceClient?: BlobServiceClient;

  constructor(config: PresignedUrlConfig) {
    this.config = config;
    this.initializeClient();
  }

  private initializeClient(): void {
    switch (this.config.provider) {
      case 's3':
      case 'minio':
        this.s3Client = new S3Client({
          region: this.config.s3?.region || 'us-east-1',
          ...(this.config.s3?.accessKeyId && this.config.s3?.secretAccessKey && {
            credentials: {
              accessKeyId: this.config.s3.accessKeyId,
              secretAccessKey: this.config.s3.secretAccessKey,
            },
          }),
          ...(this.config.s3?.endpoint && {
            endpoint: this.config.s3.endpoint,
            forcePathStyle: true,
          }),
        });
        break;

      case 'gcs':
        this.gcsStorage = new Storage({
          projectId: this.config.gcs?.projectId,
          keyFilename: this.config.gcs?.keyFilename,
        });
        break;

      case 'azure':
        if (this.config.azure?.connectionString) {
          this.azureServiceClient = BlobServiceClient.fromConnectionString(
            this.config.azure.connectionString
          );
        } else if (this.config.azure?.accountName && this.config.azure?.accountKey) {
          this.azureCredential = new StorageSharedKeyCredential(
            this.config.azure.accountName,
            this.config.azure.accountKey
          );
          this.azureServiceClient = new BlobServiceClient(
            `https://${this.config.azure.accountName}.blob.core.windows.net`,
            this.azureCredential
          );
        }
        break;
    }
  }

  // Generate presigned URL for upload
  async getUploadUrl(
    key: string,
    options: PresignedOptions = {}
  ): Promise<PresignedUploadResult> {
    const expiresIn = options.expiresIn || 3600;
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    switch (this.config.provider) {
      case 's3':
      case 'minio':
        return this.getS3UploadUrl(key, options, expiresAt);
      case 'gcs':
        return this.getGCSUploadUrl(key, options, expiresAt);
      case 'azure':
        return this.getAzureUploadUrl(key, options, expiresAt);
      default:
        throw new Error(`Unsupported provider: ${this.config.provider}`);
    }
  }

  // Generate presigned URL for download
  async getDownloadUrl(
    key: string,
    options: PresignedOptions = {}
  ): Promise<PresignedDownloadResult> {
    const expiresIn = options.expiresIn || 3600;
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    switch (this.config.provider) {
      case 's3':
      case 'minio':
        return this.getS3DownloadUrl(key, options, expiresAt);
      case 'gcs':
        return this.getGCSDownloadUrl(key, options, expiresAt);
      case 'azure':
        return this.getAzureDownloadUrl(key, options, expiresAt);
      default:
        throw new Error(`Unsupported provider: ${this.config.provider}`);
    }
  }

  // S3/MinIO Implementation
  private async getS3UploadUrl(
    key: string,
    options: PresignedOptions,
    expiresAt: Date
  ): Promise<PresignedUploadResult> {
    const command = new PutObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
      ContentType: options.contentType,
      Metadata: options.metadata,
    });

    const url = await getSignedUrl(this.s3Client!, command, {
      expiresIn: options.expiresIn || 3600,
    });

    return {
      url,
      method: 'PUT',
      expiresAt,
    };
  }

  private async getS3DownloadUrl(
    key: string,
    options: PresignedOptions,
    expiresAt: Date
  ): Promise<PresignedDownloadResult> {
    const command = new GetObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
      ResponseContentType: options.contentType,
      ResponseContentDisposition: options.contentDisposition,
    });

    const url = await getSignedUrl(this.s3Client!, command, {
      expiresIn: options.expiresIn || 3600,
    });

    return { url, expiresAt };
  }

  // GCS Implementation
  private async getGCSUploadUrl(
    key: string,
    options: PresignedOptions,
    expiresAt: Date
  ): Promise<PresignedUploadResult> {
    const bucket = this.gcsStorage!.bucket(this.config.bucket);
    const file = bucket.file(key);

    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: expiresAt,
      contentType: options.contentType,
    });

    return {
      url,
      method: 'PUT',
      expiresAt,
    };
  }

  private async getGCSDownloadUrl(
    key: string,
    options: PresignedOptions,
    expiresAt: Date
  ): Promise<PresignedDownloadResult> {
    const bucket = this.gcsStorage!.bucket(this.config.bucket);
    const file = bucket.file(key);

    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: expiresAt,
      responseType: options.contentType,
      responseDisposition: options.contentDisposition,
    });

    return { url, expiresAt };
  }

  // Azure Implementation
  private async getAzureUploadUrl(
    key: string,
    options: PresignedOptions,
    expiresAt: Date
  ): Promise<PresignedUploadResult> {
    if (!this.azureCredential) {
      throw new Error('Azure credentials required for SAS generation');
    }

    const containerClient = this.azureServiceClient!.getContainerClient(
      this.config.bucket
    );
    const blobClient = containerClient.getBlockBlobClient(key);

    const sasToken = generateBlobSASQueryParameters(
      {
        containerName: this.config.bucket,
        blobName: key,
        permissions: BlobSASPermissions.parse('cw'),
        expiresOn: expiresAt,
        contentType: options.contentType,
      },
      this.azureCredential
    ).toString();

    return {
      url: `${blobClient.url}?${sasToken}`,
      method: 'PUT',
      expiresAt,
    };
  }

  private async getAzureDownloadUrl(
    key: string,
    options: PresignedOptions,
    expiresAt: Date
  ): Promise<PresignedDownloadResult> {
    if (!this.azureCredential) {
      throw new Error('Azure credentials required for SAS generation');
    }

    const containerClient = this.azureServiceClient!.getContainerClient(
      this.config.bucket
    );
    const blobClient = containerClient.getBlockBlobClient(key);

    const sasToken = generateBlobSASQueryParameters(
      {
        containerName: this.config.bucket,
        blobName: key,
        permissions: BlobSASPermissions.parse('r'),
        expiresOn: expiresAt,
        contentType: options.contentType,
        contentDisposition: options.contentDisposition,
      },
      this.azureCredential
    ).toString();

    return {
      url: `${blobClient.url}?${sasToken}`,
      expiresAt,
    };
  }

  // Generate presigned POST for browser uploads (S3 only)
  async getPresignedPost(
    key: string,
    options: PresignedOptions & {
      maxSize?: number;
      successRedirect?: string;
    } = {}
  ): Promise<{
    url: string;
    fields: Record<string, string>;
  }> {
    if (this.config.provider !== 's3') {
      throw new Error('Presigned POST only supported for S3');
    }

    const { createPresignedPost } = await import('@aws-sdk/s3-presigned-post');

    const { url, fields } = await createPresignedPost(this.s3Client!, {
      Bucket: this.config.bucket,
      Key: key,
      Conditions: [
        ['content-length-range', 0, options.maxSize || 10 * 1024 * 1024],
        ...(options.contentType ? [['eq', '$Content-Type', options.contentType]] : []),
      ],
      Fields: {
        'Content-Type': options.contentType || 'application/octet-stream',
        ...(options.successRedirect && {
          success_action_redirect: options.successRedirect,
        }),
      },
      Expires: options.expiresIn || 3600,
    });

    return { url, fields };
  }
}

// Factory function
export function createPresignedUrlService(
  config: PresignedUrlConfig
): PresignedUrlService {
  return new PresignedUrlService(config);
}
```

### Express Routes

```typescript
// src/routes/presigned.ts
import { Router, Request, Response } from 'express';
import { createPresignedUrlService } from '../storage/presigned-url-service';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

const router = Router();

// Create service based on environment
const presignedService = createPresignedUrlService({
  provider: (process.env.STORAGE_PROVIDER as any) || 's3',
  bucket: process.env.STORAGE_BUCKET || 'uploads',
  s3: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    endpoint: process.env.S3_ENDPOINT,
  },
  gcs: {
    projectId: process.env.GCP_PROJECT_ID || '',
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  },
  azure: {
    connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
  },
});

// Get presigned upload URL
router.post('/upload', async (req: Request, res: Response) => {
  try {
    const { filename, contentType, expiresIn, folder } = req.body;

    if (!filename) {
      return res.status(400).json({ error: 'filename required' });
    }

    const ext = path.extname(filename);
    const key = folder
      ? `${folder}/${uuidv4()}${ext}`
      : `uploads/${uuidv4()}${ext}`;

    const result = await presignedService.getUploadUrl(key, {
      contentType,
      expiresIn: expiresIn || 3600,
    });

    res.json({
      ...result,
      key,
      originalFilename: filename,
    });
  } catch (error) {
    console.error('Presigned upload URL error:', error);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
});

// Get presigned download URL
router.post('/download', async (req: Request, res: Response) => {
  try {
    const { key, expiresIn, contentDisposition, contentType } = req.body;

    if (!key) {
      return res.status(400).json({ error: 'key required' });
    }

    const result = await presignedService.getDownloadUrl(key, {
      expiresIn: expiresIn || 3600,
      contentDisposition,
      contentType,
    });

    res.json(result);
  } catch (error) {
    console.error('Presigned download URL error:', error);
    res.status(500).json({ error: 'Failed to generate download URL' });
  }
});

// Get presigned POST (for browser form uploads)
router.post('/upload/form', async (req: Request, res: Response) => {
  try {
    const { filename, contentType, maxSize, folder } = req.body;

    if (!filename) {
      return res.status(400).json({ error: 'filename required' });
    }

    const ext = path.extname(filename);
    const key = folder
      ? `${folder}/${uuidv4()}${ext}`
      : `uploads/${uuidv4()}${ext}`;

    const result = await presignedService.getPresignedPost(key, {
      contentType,
      maxSize: maxSize || 10 * 1024 * 1024,
    });

    res.json({
      ...result,
      key,
    });
  } catch (error) {
    console.error('Presigned POST error:', error);
    res.status(500).json({ error: 'Failed to generate presigned POST' });
  }
});

// Batch generate presigned URLs
router.post('/batch/upload', async (req: Request, res: Response) => {
  try {
    const { files, folder, expiresIn } = req.body;

    if (!files || !Array.isArray(files)) {
      return res.status(400).json({ error: 'files array required' });
    }

    const results = await Promise.all(
      files.map(async (file: { filename: string; contentType?: string }) => {
        const ext = path.extname(file.filename);
        const key = folder
          ? `${folder}/${uuidv4()}${ext}`
          : `uploads/${uuidv4()}${ext}`;

        const result = await presignedService.getUploadUrl(key, {
          contentType: file.contentType,
          expiresIn: expiresIn || 3600,
        });

        return {
          ...result,
          key,
          originalFilename: file.filename,
        };
      })
    );

    res.json({ urls: results });
  } catch (error) {
    console.error('Batch presigned URL error:', error);
    res.status(500).json({ error: 'Failed to generate URLs' });
  }
});

// Batch generate download URLs
router.post('/batch/download', async (req: Request, res: Response) => {
  try {
    const { keys, expiresIn } = req.body;

    if (!keys || !Array.isArray(keys)) {
      return res.status(400).json({ error: 'keys array required' });
    }

    const results = await Promise.all(
      keys.map(async (key: string) => {
        const result = await presignedService.getDownloadUrl(key, {
          expiresIn: expiresIn || 3600,
        });

        return { key, ...result };
      })
    );

    res.json({ urls: results });
  } catch (error) {
    console.error('Batch download URL error:', error);
    res.status(500).json({ error: 'Failed to generate URLs' });
  }
});

export default router;
```

### React Hook for Presigned Uploads

```typescript
// hooks/usePresignedUpload.ts
import { useState, useCallback } from 'react';

interface PresignedUploadResult {
  key: string;
  url: string;
}

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface UsePresignedUploadOptions {
  apiEndpoint: string;
  folder?: string;
  onProgress?: (progress: UploadProgress) => void;
  onSuccess?: (result: PresignedUploadResult) => void;
  onError?: (error: Error) => void;
}

export function usePresignedUpload(options: UsePresignedUploadOptions) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (file: File): Promise<PresignedUploadResult> => {
    setUploading(true);
    setError(null);
    setProgress(null);

    try {
      // Get presigned URL
      const presignedRes = await fetch(`${options.apiEndpoint}/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          folder: options.folder,
        }),
      });

      if (!presignedRes.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { url, key, method } = await presignedRes.json();

      // Upload file directly to storage
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const prog = {
              loaded: e.loaded,
              total: e.total,
              percentage: Math.round((e.loaded / e.total) * 100),
            };
            setProgress(prog);
            options.onProgress?.(prog);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed: ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => reject(new Error('Upload failed')));

        xhr.open(method || 'PUT', url);
        if (file.type) {
          xhr.setRequestHeader('Content-Type', file.type);
        }
        xhr.send(file);
      });

      const result = { key, url: url.split('?')[0] };
      options.onSuccess?.(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
      options.onError?.(err instanceof Error ? err : new Error(message));
      throw err;
    } finally {
      setUploading(false);
    }
  }, [options]);

  const uploadMultiple = useCallback(async (files: File[]): Promise<PresignedUploadResult[]> => {
    const results: PresignedUploadResult[] = [];

    for (const file of files) {
      const result = await upload(file);
      results.push(result);
    }

    return results;
  }, [upload]);

  return {
    upload,
    uploadMultiple,
    uploading,
    progress,
    error,
  };
}

// Form-based upload component (for S3 POST)
export function PresignedFormUpload({
  apiEndpoint,
  folder,
  onSuccess,
  accept,
}: {
  apiEndpoint: string;
  folder?: string;
  onSuccess: (key: string) => void;
  accept?: string;
}) {
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploading(true);

    const form = e.currentTarget;
    const fileInput = form.querySelector('input[type="file"]') as HTMLInputElement;
    const file = fileInput.files?.[0];

    if (!file) return;

    try {
      // Get presigned POST data
      const presignedRes = await fetch(`${apiEndpoint}/upload/form`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          folder,
        }),
      });

      const { url, fields, key } = await presignedRes.json();

      // Create form data with presigned fields
      const formData = new FormData();
      Object.entries(fields).forEach(([k, v]) => {
        formData.append(k, v as string);
      });
      formData.append('file', file);

      // Submit to S3
      await fetch(url, {
        method: 'POST',
        body: formData,
      });

      onSuccess(key);
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="file" accept={accept} disabled={uploading} />
      <button type="submit" disabled={uploading}>
        {uploading ? 'Uploading...' : 'Upload'}
      </button>
    </form>
  );
}
```

## Python Implementation

```python
# storage/presigned_service.py
import boto3
from botocore.config import Config
from google.cloud import storage as gcs
from azure.storage.blob import (
    BlobServiceClient,
    generate_blob_sas,
    BlobSasPermissions,
)
from typing import Optional, Dict, Any, Literal
from dataclasses import dataclass
from datetime import datetime, timedelta
import uuid
from pathlib import Path


Provider = Literal['s3', 'gcs', 'azure', 'minio']


@dataclass
class PresignedUploadResult:
    url: str
    method: str
    expires_at: datetime
    fields: Optional[Dict[str, str]] = None


@dataclass
class PresignedDownloadResult:
    url: str
    expires_at: datetime


class PresignedUrlService:
    def __init__(
        self,
        provider: Provider,
        bucket: str,
        # S3/MinIO config
        region: str = 'us-east-1',
        access_key_id: Optional[str] = None,
        secret_access_key: Optional[str] = None,
        endpoint_url: Optional[str] = None,
        # GCS config
        gcs_project_id: Optional[str] = None,
        gcs_credentials_path: Optional[str] = None,
        # Azure config
        azure_connection_string: Optional[str] = None,
        azure_account_name: Optional[str] = None,
        azure_account_key: Optional[str] = None,
    ):
        self.provider = provider
        self.bucket = bucket

        if provider in ('s3', 'minio'):
            config = Config(signature_version='s3v4')
            client_kwargs = {'region_name': region, 'config': config}

            if access_key_id and secret_access_key:
                client_kwargs['aws_access_key_id'] = access_key_id
                client_kwargs['aws_secret_access_key'] = secret_access_key

            if endpoint_url:
                client_kwargs['endpoint_url'] = endpoint_url

            self.s3_client = boto3.client('s3', **client_kwargs)

        elif provider == 'gcs':
            if gcs_credentials_path:
                self.gcs_client = gcs.Client.from_service_account_json(
                    gcs_credentials_path
                )
            else:
                self.gcs_client = gcs.Client(project=gcs_project_id)
            self.gcs_bucket = self.gcs_client.bucket(bucket)

        elif provider == 'azure':
            self.azure_account_name = azure_account_name
            self.azure_account_key = azure_account_key

            if azure_connection_string:
                self.azure_client = BlobServiceClient.from_connection_string(
                    azure_connection_string
                )
            else:
                self.azure_client = BlobServiceClient(
                    account_url=f'https://{azure_account_name}.blob.core.windows.net',
                    credential=azure_account_key
                )

    def get_upload_url(
        self,
        key: str,
        content_type: Optional[str] = None,
        expires_in: int = 3600,
    ) -> PresignedUploadResult:
        """Generate presigned URL for upload."""
        expires_at = datetime.utcnow() + timedelta(seconds=expires_in)

        if self.provider in ('s3', 'minio'):
            return self._s3_upload_url(key, content_type, expires_in, expires_at)
        elif self.provider == 'gcs':
            return self._gcs_upload_url(key, content_type, expires_at)
        elif self.provider == 'azure':
            return self._azure_upload_url(key, content_type, expires_at)

        raise ValueError(f'Unsupported provider: {self.provider}')

    def get_download_url(
        self,
        key: str,
        expires_in: int = 3600,
        content_disposition: Optional[str] = None,
    ) -> PresignedDownloadResult:
        """Generate presigned URL for download."""
        expires_at = datetime.utcnow() + timedelta(seconds=expires_in)

        if self.provider in ('s3', 'minio'):
            return self._s3_download_url(key, expires_in, content_disposition, expires_at)
        elif self.provider == 'gcs':
            return self._gcs_download_url(key, content_disposition, expires_at)
        elif self.provider == 'azure':
            return self._azure_download_url(key, content_disposition, expires_at)

        raise ValueError(f'Unsupported provider: {self.provider}')

    # S3 implementation
    def _s3_upload_url(
        self,
        key: str,
        content_type: Optional[str],
        expires_in: int,
        expires_at: datetime,
    ) -> PresignedUploadResult:
        params = {'Bucket': self.bucket, 'Key': key}
        if content_type:
            params['ContentType'] = content_type

        url = self.s3_client.generate_presigned_url(
            'put_object',
            Params=params,
            ExpiresIn=expires_in
        )

        return PresignedUploadResult(
            url=url,
            method='PUT',
            expires_at=expires_at
        )

    def _s3_download_url(
        self,
        key: str,
        expires_in: int,
        content_disposition: Optional[str],
        expires_at: datetime,
    ) -> PresignedDownloadResult:
        params = {'Bucket': self.bucket, 'Key': key}
        if content_disposition:
            params['ResponseContentDisposition'] = content_disposition

        url = self.s3_client.generate_presigned_url(
            'get_object',
            Params=params,
            ExpiresIn=expires_in
        )

        return PresignedDownloadResult(url=url, expires_at=expires_at)

    # GCS implementation
    def _gcs_upload_url(
        self,
        key: str,
        content_type: Optional[str],
        expires_at: datetime,
    ) -> PresignedUploadResult:
        blob = self.gcs_bucket.blob(key)

        url = blob.generate_signed_url(
            version='v4',
            expiration=expires_at,
            method='PUT',
            content_type=content_type
        )

        return PresignedUploadResult(
            url=url,
            method='PUT',
            expires_at=expires_at
        )

    def _gcs_download_url(
        self,
        key: str,
        content_disposition: Optional[str],
        expires_at: datetime,
    ) -> PresignedDownloadResult:
        blob = self.gcs_bucket.blob(key)

        url = blob.generate_signed_url(
            version='v4',
            expiration=expires_at,
            method='GET',
            response_disposition=content_disposition
        )

        return PresignedDownloadResult(url=url, expires_at=expires_at)

    # Azure implementation
    def _azure_upload_url(
        self,
        key: str,
        content_type: Optional[str],
        expires_at: datetime,
    ) -> PresignedUploadResult:
        sas_token = generate_blob_sas(
            account_name=self.azure_account_name,
            container_name=self.bucket,
            blob_name=key,
            account_key=self.azure_account_key,
            permission=BlobSasPermissions(write=True, create=True),
            expiry=expires_at,
            content_type=content_type
        )

        url = f'https://{self.azure_account_name}.blob.core.windows.net/{self.bucket}/{key}?{sas_token}'

        return PresignedUploadResult(
            url=url,
            method='PUT',
            expires_at=expires_at
        )

    def _azure_download_url(
        self,
        key: str,
        content_disposition: Optional[str],
        expires_at: datetime,
    ) -> PresignedDownloadResult:
        sas_token = generate_blob_sas(
            account_name=self.azure_account_name,
            container_name=self.bucket,
            blob_name=key,
            account_key=self.azure_account_key,
            permission=BlobSasPermissions(read=True),
            expiry=expires_at,
            content_disposition=content_disposition
        )

        url = f'https://{self.azure_account_name}.blob.core.windows.net/{self.bucket}/{key}?{sas_token}'

        return PresignedDownloadResult(url=url, expires_at=expires_at)


# FastAPI integration
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os

app = FastAPI()

presigned_service = PresignedUrlService(
    provider=os.environ.get('STORAGE_PROVIDER', 's3'),
    bucket=os.environ.get('STORAGE_BUCKET', 'uploads'),
    region=os.environ.get('AWS_REGION', 'us-east-1'),
    access_key_id=os.environ.get('AWS_ACCESS_KEY_ID'),
    secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY'),
)


class UploadRequest(BaseModel):
    filename: str
    content_type: Optional[str] = None
    folder: Optional[str] = None
    expires_in: int = 3600


class DownloadRequest(BaseModel):
    key: str
    expires_in: int = 3600
    content_disposition: Optional[str] = None


@app.post('/presigned/upload')
async def get_upload_url(request: UploadRequest):
    """Get presigned URL for upload."""
    ext = Path(request.filename).suffix
    folder = request.folder or 'uploads'
    key = f'{folder}/{uuid.uuid4()}{ext}'

    result = presigned_service.get_upload_url(
        key=key,
        content_type=request.content_type,
        expires_in=request.expires_in
    )

    return {
        'url': result.url,
        'method': result.method,
        'key': key,
        'expires_at': result.expires_at.isoformat()
    }


@app.post('/presigned/download')
async def get_download_url(request: DownloadRequest):
    """Get presigned URL for download."""
    result = presigned_service.get_download_url(
        key=request.key,
        expires_in=request.expires_in,
        content_disposition=request.content_disposition
    )

    return {
        'url': result.url,
        'expires_at': result.expires_at.isoformat()
    }
```

## CLAUDE.md Integration

```markdown
## Presigned URL Commands

### Upload URLs
- "create presigned upload URL" - Generate upload URL
- "get presigned POST" - Form-based upload credentials
- "batch presigned uploads" - Multiple upload URLs

### Download URLs
- "create presigned download URL" - Generate download URL
- "batch presigned downloads" - Multiple download URLs
- "set download disposition" - Force download vs inline

### Configuration
- "set URL expiration" - Configure validity period
- "add content type restriction" - Limit file types
- "set size limit" - Max upload size
```

## AI Suggestions

1. **"Implement URL caching"** - Cache generated URLs briefly
2. **"Add IP restriction"** - Limit URL to specific IPs
3. **"Implement one-time URLs"** - Single-use download links
4. **"Add URL analytics"** - Track URL usage
5. **"Implement progressive uploads"** - Chunked presigned URLs
6. **"Add watermarking on download"** - Dynamic watermarks
7. **"Implement URL shortening"** - Shorter presigned URLs
8. **"Add callback notifications"** - Webhook on upload complete
9. **"Implement access logging"** - Audit trail for URLs
10. **"Add geographic restrictions"** - Region-based access
