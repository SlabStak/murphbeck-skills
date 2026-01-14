# Multipart Uploads

Production-ready multipart upload implementation for handling large files with resumability and parallel uploads.

## Overview

Multipart uploads enable efficient transfer of large files by splitting them into smaller parts, uploading in parallel, and supporting resume on failure.

## Quick Start

```bash
npm install @aws-sdk/client-s3 @aws-sdk/lib-storage axios
```

## TypeScript Implementation

### Multipart Upload Service

```typescript
// src/storage/multipart-upload.ts
import {
  S3Client,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  ListPartsCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from 'stream';
import { createReadStream } from 'fs';
import { stat } from 'fs/promises';
import { EventEmitter } from 'events';

interface MultipartConfig {
  region: string;
  bucket: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  endpoint?: string;
}

interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  partSize?: number;
  queueSize?: number;
  tags?: Record<string, string>;
}

interface UploadProgress {
  uploadId: string;
  key: string;
  loaded: number;
  total: number;
  percentage: number;
  partsCompleted: number;
  totalParts: number;
}

interface UploadedPart {
  partNumber: number;
  etag: string;
  size: number;
}

interface UploadSession {
  uploadId: string;
  key: string;
  bucket: string;
  partSize: number;
  totalSize: number;
  uploadedParts: UploadedPart[];
  createdAt: Date;
  contentType?: string;
}

export class MultipartUploadService extends EventEmitter {
  private client: S3Client;
  private bucket: string;
  private sessions: Map<string, UploadSession> = new Map();

  constructor(config: MultipartConfig) {
    super();
    this.bucket = config.bucket;

    this.client = new S3Client({
      region: config.region,
      ...(config.accessKeyId && config.secretAccessKey && {
        credentials: {
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey,
        },
      }),
      ...(config.endpoint && {
        endpoint: config.endpoint,
        forcePathStyle: true,
      }),
    });
  }

  // High-level upload with automatic multipart
  async upload(
    key: string,
    body: Buffer | Readable,
    options: UploadOptions = {}
  ): Promise<{
    key: string;
    etag: string;
    location: string;
  }> {
    const upload = new Upload({
      client: this.client,
      params: {
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: options.contentType,
        Metadata: options.metadata,
        Tagging: options.tags
          ? Object.entries(options.tags)
              .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
              .join('&')
          : undefined,
      },
      partSize: options.partSize || 5 * 1024 * 1024,
      queueSize: options.queueSize || 4,
    });

    upload.on('httpUploadProgress', (progress) => {
      this.emit('progress', {
        key,
        loaded: progress.loaded || 0,
        total: progress.total || 0,
        percentage: progress.total
          ? Math.round(((progress.loaded || 0) / progress.total) * 100)
          : 0,
      });
    });

    const result = await upload.done();

    return {
      key,
      etag: result.ETag?.replace(/"/g, '') || '',
      location: result.Location || `https://${this.bucket}.s3.amazonaws.com/${key}`,
    };
  }

  // Upload local file
  async uploadFile(
    filePath: string,
    key: string,
    options: UploadOptions = {}
  ): Promise<{
    key: string;
    etag: string;
    location: string;
  }> {
    const fileStats = await stat(filePath);
    const stream = createReadStream(filePath);

    return this.upload(key, stream, {
      ...options,
      partSize: options.partSize || this.calculatePartSize(fileStats.size),
    });
  }

  // Start manual multipart upload session
  async startUpload(
    key: string,
    totalSize: number,
    options: UploadOptions = {}
  ): Promise<UploadSession> {
    const command = new CreateMultipartUploadCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: options.contentType,
      Metadata: options.metadata,
    });

    const response = await this.client.send(command);

    const partSize = options.partSize || this.calculatePartSize(totalSize);
    const session: UploadSession = {
      uploadId: response.UploadId!,
      key,
      bucket: this.bucket,
      partSize,
      totalSize,
      uploadedParts: [],
      createdAt: new Date(),
      contentType: options.contentType,
    };

    this.sessions.set(response.UploadId!, session);

    return session;
  }

  // Upload a single part
  async uploadPart(
    uploadId: string,
    partNumber: number,
    body: Buffer
  ): Promise<UploadedPart> {
    const session = this.sessions.get(uploadId);
    if (!session) {
      throw new Error('Upload session not found');
    }

    const command = new UploadPartCommand({
      Bucket: this.bucket,
      Key: session.key,
      UploadId: uploadId,
      PartNumber: partNumber,
      Body: body,
    });

    const response = await this.client.send(command);

    const part: UploadedPart = {
      partNumber,
      etag: response.ETag!.replace(/"/g, ''),
      size: body.length,
    };

    // Track uploaded part
    session.uploadedParts = session.uploadedParts.filter(
      (p) => p.partNumber !== partNumber
    );
    session.uploadedParts.push(part);
    session.uploadedParts.sort((a, b) => a.partNumber - b.partNumber);

    // Emit progress
    const loaded = session.uploadedParts.reduce((sum, p) => sum + p.size, 0);
    this.emit('progress', {
      uploadId,
      key: session.key,
      loaded,
      total: session.totalSize,
      percentage: Math.round((loaded / session.totalSize) * 100),
      partsCompleted: session.uploadedParts.length,
      totalParts: Math.ceil(session.totalSize / session.partSize),
    } as UploadProgress);

    return part;
  }

  // Complete multipart upload
  async completeUpload(uploadId: string): Promise<{
    key: string;
    etag: string;
    location: string;
  }> {
    const session = this.sessions.get(uploadId);
    if (!session) {
      throw new Error('Upload session not found');
    }

    const command = new CompleteMultipartUploadCommand({
      Bucket: this.bucket,
      Key: session.key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: session.uploadedParts.map((part) => ({
          PartNumber: part.partNumber,
          ETag: `"${part.etag}"`,
        })),
      },
    });

    const response = await this.client.send(command);

    // Cleanup session
    this.sessions.delete(uploadId);

    return {
      key: session.key,
      etag: response.ETag?.replace(/"/g, '') || '',
      location: response.Location || `https://${this.bucket}.s3.amazonaws.com/${session.key}`,
    };
  }

  // Abort multipart upload
  async abortUpload(uploadId: string): Promise<void> {
    const session = this.sessions.get(uploadId);
    if (!session) {
      throw new Error('Upload session not found');
    }

    const command = new AbortMultipartUploadCommand({
      Bucket: this.bucket,
      Key: session.key,
      UploadId: uploadId,
    });

    await this.client.send(command);

    // Cleanup session
    this.sessions.delete(uploadId);
  }

  // Get upload session status
  async getUploadStatus(uploadId: string): Promise<{
    session: UploadSession;
    uploadedParts: UploadedPart[];
    missingParts: number[];
  }> {
    const session = this.sessions.get(uploadId);
    if (!session) {
      throw new Error('Upload session not found');
    }

    // Also fetch from S3 to ensure consistency
    const command = new ListPartsCommand({
      Bucket: this.bucket,
      Key: session.key,
      UploadId: uploadId,
    });

    const response = await this.client.send(command);

    const s3Parts = (response.Parts || []).map((p) => ({
      partNumber: p.PartNumber!,
      etag: p.ETag!.replace(/"/g, ''),
      size: p.Size!,
    }));

    // Calculate missing parts
    const totalParts = Math.ceil(session.totalSize / session.partSize);
    const uploadedPartNumbers = new Set(s3Parts.map((p) => p.partNumber));
    const missingParts: number[] = [];

    for (let i = 1; i <= totalParts; i++) {
      if (!uploadedPartNumbers.has(i)) {
        missingParts.push(i);
      }
    }

    return {
      session,
      uploadedParts: s3Parts,
      missingParts,
    };
  }

  // Resume upload from session
  async resumeUpload(
    uploadId: string,
    key: string,
    totalSize: number,
    partSize?: number
  ): Promise<{
    session: UploadSession;
    missingParts: number[];
  }> {
    // List existing parts
    const command = new ListPartsCommand({
      Bucket: this.bucket,
      Key: key,
      UploadId: uploadId,
    });

    const response = await this.client.send(command);

    const uploadedParts = (response.Parts || []).map((p) => ({
      partNumber: p.PartNumber!,
      etag: p.ETag!.replace(/"/g, ''),
      size: p.Size!,
    }));

    const calculatedPartSize = partSize || this.calculatePartSize(totalSize);
    const session: UploadSession = {
      uploadId,
      key,
      bucket: this.bucket,
      partSize: calculatedPartSize,
      totalSize,
      uploadedParts,
      createdAt: new Date(),
    };

    this.sessions.set(uploadId, session);

    // Calculate missing parts
    const totalParts = Math.ceil(totalSize / calculatedPartSize);
    const uploadedPartNumbers = new Set(uploadedParts.map((p) => p.partNumber));
    const missingParts: number[] = [];

    for (let i = 1; i <= totalParts; i++) {
      if (!uploadedPartNumbers.has(i)) {
        missingParts.push(i);
      }
    }

    return { session, missingParts };
  }

  // Calculate optimal part size
  private calculatePartSize(totalSize: number): number {
    const minPartSize = 5 * 1024 * 1024; // 5MB minimum
    const maxParts = 10000;

    let partSize = Math.ceil(totalSize / maxParts);
    return Math.max(partSize, minPartSize);
  }
}

// Factory function
export function createMultipartUploadService(
  config: MultipartConfig
): MultipartUploadService {
  return new MultipartUploadService(config);
}
```

### Express Routes

```typescript
// src/routes/multipart.ts
import { Router, Request, Response } from 'express';
import { createMultipartUploadService } from '../storage/multipart-upload';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

const uploadService = createMultipartUploadService({
  region: process.env.AWS_REGION || 'us-east-1',
  bucket: process.env.S3_BUCKET || 'uploads',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

// Start multipart upload
router.post('/start', async (req: Request, res: Response) => {
  try {
    const { filename, totalSize, contentType, folder } = req.body;

    if (!filename || !totalSize) {
      return res.status(400).json({ error: 'filename and totalSize required' });
    }

    const ext = path.extname(filename);
    const key = folder
      ? `${folder}/${uuidv4()}${ext}`
      : `uploads/${uuidv4()}${ext}`;

    const session = await uploadService.startUpload(key, totalSize, {
      contentType,
    });

    res.json({
      uploadId: session.uploadId,
      key: session.key,
      partSize: session.partSize,
      totalParts: Math.ceil(totalSize / session.partSize),
    });
  } catch (error) {
    console.error('Start upload error:', error);
    res.status(500).json({ error: 'Failed to start upload' });
  }
});

// Upload part
router.post('/:uploadId/part/:partNumber', async (req: Request, res: Response) => {
  try {
    const { uploadId, partNumber } = req.params;

    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const body = Buffer.concat(chunks);

    const part = await uploadService.uploadPart(
      uploadId,
      parseInt(partNumber),
      body
    );

    res.json(part);
  } catch (error: any) {
    console.error('Upload part error:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      error: error.message,
    });
  }
});

// Complete upload
router.post('/:uploadId/complete', async (req: Request, res: Response) => {
  try {
    const { uploadId } = req.params;

    const result = await uploadService.completeUpload(uploadId);

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Complete upload error:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      error: error.message,
    });
  }
});

// Abort upload
router.delete('/:uploadId', async (req: Request, res: Response) => {
  try {
    const { uploadId } = req.params;

    await uploadService.abortUpload(uploadId);

    res.json({ success: true });
  } catch (error: any) {
    console.error('Abort upload error:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      error: error.message,
    });
  }
});

// Get upload status
router.get('/:uploadId/status', async (req: Request, res: Response) => {
  try {
    const { uploadId } = req.params;

    const status = await uploadService.getUploadStatus(uploadId);

    res.json({
      uploadId,
      key: status.session.key,
      totalSize: status.session.totalSize,
      uploadedParts: status.uploadedParts.length,
      totalParts: Math.ceil(status.session.totalSize / status.session.partSize),
      missingParts: status.missingParts,
      percentage: Math.round(
        (status.uploadedParts.reduce((sum, p) => sum + p.size, 0) /
          status.session.totalSize) *
          100
      ),
    });
  } catch (error: any) {
    console.error('Get status error:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      error: error.message,
    });
  }
});

// Resume upload
router.post('/:uploadId/resume', async (req: Request, res: Response) => {
  try {
    const { uploadId } = req.params;
    const { key, totalSize, partSize } = req.body;

    if (!key || !totalSize) {
      return res.status(400).json({ error: 'key and totalSize required' });
    }

    const { session, missingParts } = await uploadService.resumeUpload(
      uploadId,
      key,
      totalSize,
      partSize
    );

    res.json({
      uploadId,
      key: session.key,
      partSize: session.partSize,
      uploadedParts: session.uploadedParts.length,
      missingParts,
    });
  } catch (error) {
    console.error('Resume upload error:', error);
    res.status(500).json({ error: 'Failed to resume upload' });
  }
});

export default router;
```

### React Multipart Upload Hook

```typescript
// hooks/useMultipartUpload.ts
import { useState, useCallback, useRef } from 'react';

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  partsCompleted: number;
  totalParts: number;
  speed: number;
  remainingTime: number;
}

interface MultipartUploadOptions {
  apiEndpoint: string;
  partSize?: number;
  concurrency?: number;
  retries?: number;
  onProgress?: (progress: UploadProgress) => void;
  onSuccess?: (result: { key: string; url: string }) => void;
  onError?: (error: Error) => void;
}

interface UploadState {
  uploadId: string | null;
  key: string | null;
  status: 'idle' | 'uploading' | 'paused' | 'completed' | 'error';
  progress: UploadProgress | null;
  error: string | null;
}

export function useMultipartUpload(options: MultipartUploadOptions) {
  const [state, setState] = useState<UploadState>({
    uploadId: null,
    key: null,
    status: 'idle',
    progress: null,
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const pausedRef = useRef(false);
  const startTimeRef = useRef<number>(0);
  const uploadedBytesRef = useRef<number>(0);

  const upload = useCallback(async (file: File) => {
    const partSize = options.partSize || 5 * 1024 * 1024;
    const concurrency = options.concurrency || 4;
    const maxRetries = options.retries || 3;

    abortControllerRef.current = new AbortController();
    pausedRef.current = false;
    startTimeRef.current = Date.now();
    uploadedBytesRef.current = 0;

    setState((s) => ({ ...s, status: 'uploading', error: null }));

    try {
      // Start multipart upload
      const startRes = await fetch(`${options.apiEndpoint}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          totalSize: file.size,
          contentType: file.type,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!startRes.ok) {
        throw new Error('Failed to start upload');
      }

      const { uploadId, key, partSize: serverPartSize, totalParts } = await startRes.json();

      setState((s) => ({ ...s, uploadId, key }));

      const actualPartSize = serverPartSize || partSize;
      const parts: Array<{ partNumber: number; etag: string }> = [];

      // Upload parts with concurrency
      const uploadPart = async (partNumber: number, retryCount = 0): Promise<void> => {
        // Check if paused
        while (pausedRef.current) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        const start = (partNumber - 1) * actualPartSize;
        const end = Math.min(start + actualPartSize, file.size);
        const chunk = file.slice(start, end);

        try {
          const res = await fetch(
            `${options.apiEndpoint}/${uploadId}/part/${partNumber}`,
            {
              method: 'POST',
              body: chunk,
              signal: abortControllerRef.current!.signal,
            }
          );

          if (!res.ok) {
            throw new Error(`Part ${partNumber} upload failed`);
          }

          const { partNumber: pn, etag } = await res.json();
          parts.push({ partNumber: pn, etag });

          // Update progress
          uploadedBytesRef.current += chunk.size;
          const elapsed = (Date.now() - startTimeRef.current) / 1000;
          const speed = uploadedBytesRef.current / elapsed;
          const remaining = file.size - uploadedBytesRef.current;
          const remainingTime = remaining / speed;

          const progress: UploadProgress = {
            loaded: uploadedBytesRef.current,
            total: file.size,
            percentage: Math.round((uploadedBytesRef.current / file.size) * 100),
            partsCompleted: parts.length,
            totalParts,
            speed,
            remainingTime,
          };

          setState((s) => ({ ...s, progress }));
          options.onProgress?.(progress);
        } catch (error) {
          if (retryCount < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)));
            return uploadPart(partNumber, retryCount + 1);
          }
          throw error;
        }
      };

      // Process parts with concurrency limit
      const partNumbers = Array.from({ length: totalParts }, (_, i) => i + 1);
      const queue = [...partNumbers];
      const active: Promise<void>[] = [];

      while (queue.length > 0 || active.length > 0) {
        while (active.length < concurrency && queue.length > 0) {
          const partNumber = queue.shift()!;
          const promise = uploadPart(partNumber).then(() => {
            active.splice(active.indexOf(promise), 1);
          });
          active.push(promise);
        }

        if (active.length > 0) {
          await Promise.race(active);
        }
      }

      // Complete upload
      const completeRes = await fetch(`${options.apiEndpoint}/${uploadId}/complete`, {
        method: 'POST',
        signal: abortControllerRef.current.signal,
      });

      if (!completeRes.ok) {
        throw new Error('Failed to complete upload');
      }

      const result = await completeRes.json();

      setState((s) => ({
        ...s,
        status: 'completed',
        progress: {
          ...s.progress!,
          percentage: 100,
          partsCompleted: totalParts,
        },
      }));

      options.onSuccess?.(result);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed';

      if (error instanceof Error && error.name === 'AbortError') {
        setState((s) => ({ ...s, status: 'idle', error: 'Upload cancelled' }));
      } else {
        setState((s) => ({ ...s, status: 'error', error: message }));
        options.onError?.(error instanceof Error ? error : new Error(message));
      }

      throw error;
    }
  }, [options]);

  const pause = useCallback(() => {
    pausedRef.current = true;
    setState((s) => ({ ...s, status: 'paused' }));
  }, []);

  const resume = useCallback(() => {
    pausedRef.current = false;
    setState((s) => ({ ...s, status: 'uploading' }));
  }, []);

  const cancel = useCallback(async () => {
    abortControllerRef.current?.abort();

    if (state.uploadId) {
      try {
        await fetch(`${options.apiEndpoint}/${state.uploadId}`, {
          method: 'DELETE',
        });
      } catch {
        // Ignore cleanup errors
      }
    }

    setState({
      uploadId: null,
      key: null,
      status: 'idle',
      progress: null,
      error: null,
    });
  }, [options.apiEndpoint, state.uploadId]);

  return {
    upload,
    pause,
    resume,
    cancel,
    ...state,
  };
}

// Multipart upload component
export function MultipartUploader({
  apiEndpoint,
  onSuccess,
  maxSize = 5 * 1024 * 1024 * 1024, // 5GB default
}: {
  apiEndpoint: string;
  onSuccess?: (result: { key: string; url: string }) => void;
  maxSize?: number;
}) {
  const { upload, pause, resume, cancel, status, progress, error } =
    useMultipartUpload({
      apiEndpoint,
      onSuccess,
    });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxSize) {
      alert(`File too large. Max size: ${Math.round(maxSize / 1024 / 1024 / 1024)}GB`);
      return;
    }

    try {
      await upload(file);
    } catch {
      // Error handled in hook
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`;
  };

  return (
    <div className="multipart-uploader">
      <input
        type="file"
        onChange={handleFileChange}
        disabled={status === 'uploading' || status === 'paused'}
      />

      {progress && (
        <div className="progress-info">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>

          <div className="progress-details">
            <span>{progress.percentage}%</span>
            <span>
              {formatBytes(progress.loaded)} / {formatBytes(progress.total)}
            </span>
            <span>{formatBytes(progress.speed)}/s</span>
            <span>~{formatTime(progress.remainingTime)} remaining</span>
            <span>
              Part {progress.partsCompleted} / {progress.totalParts}
            </span>
          </div>
        </div>
      )}

      <div className="controls">
        {status === 'uploading' && (
          <button onClick={pause}>Pause</button>
        )}
        {status === 'paused' && (
          <button onClick={resume}>Resume</button>
        )}
        {(status === 'uploading' || status === 'paused') && (
          <button onClick={cancel}>Cancel</button>
        )}
      </div>

      {error && <div className="error">{error}</div>}
      {status === 'completed' && <div className="success">Upload complete!</div>}
    </div>
  );
}
```

## Python Implementation

```python
# storage/multipart_upload.py
import boto3
from botocore.config import Config
from typing import Optional, List, Dict, Any, BinaryIO, Callable
from dataclasses import dataclass, field
from datetime import datetime
import math
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed


@dataclass
class UploadedPart:
    part_number: int
    etag: str
    size: int


@dataclass
class UploadSession:
    upload_id: str
    key: str
    bucket: str
    part_size: int
    total_size: int
    uploaded_parts: List[UploadedPart] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)


@dataclass
class UploadProgress:
    loaded: int
    total: int
    percentage: float
    parts_completed: int
    total_parts: int


class MultipartUploadService:
    def __init__(
        self,
        bucket: str,
        region: str = 'us-east-1',
        access_key_id: Optional[str] = None,
        secret_access_key: Optional[str] = None,
        endpoint_url: Optional[str] = None,
    ):
        self.bucket = bucket
        self.sessions: Dict[str, UploadSession] = {}

        config = Config(
            retries={'max_attempts': 3, 'mode': 'adaptive'},
            max_pool_connections=50
        )

        client_kwargs = {'region_name': region, 'config': config}

        if access_key_id and secret_access_key:
            client_kwargs['aws_access_key_id'] = access_key_id
            client_kwargs['aws_secret_access_key'] = secret_access_key

        if endpoint_url:
            client_kwargs['endpoint_url'] = endpoint_url

        self.client = boto3.client('s3', **client_kwargs)
        self._lock = threading.Lock()

    def start_upload(
        self,
        key: str,
        total_size: int,
        content_type: Optional[str] = None,
        metadata: Optional[Dict[str, str]] = None,
    ) -> UploadSession:
        """Start multipart upload session."""
        response = self.client.create_multipart_upload(
            Bucket=self.bucket,
            Key=key,
            ContentType=content_type or 'application/octet-stream',
            Metadata=metadata or {}
        )

        part_size = self._calculate_part_size(total_size)
        session = UploadSession(
            upload_id=response['UploadId'],
            key=key,
            bucket=self.bucket,
            part_size=part_size,
            total_size=total_size
        )

        with self._lock:
            self.sessions[response['UploadId']] = session

        return session

    def upload_part(
        self,
        upload_id: str,
        part_number: int,
        body: bytes,
    ) -> UploadedPart:
        """Upload a single part."""
        with self._lock:
            session = self.sessions.get(upload_id)
            if not session:
                raise ValueError('Upload session not found')

        response = self.client.upload_part(
            Bucket=self.bucket,
            Key=session.key,
            UploadId=upload_id,
            PartNumber=part_number,
            Body=body
        )

        part = UploadedPart(
            part_number=part_number,
            etag=response['ETag'].strip('"'),
            size=len(body)
        )

        with self._lock:
            session.uploaded_parts = [
                p for p in session.uploaded_parts
                if p.part_number != part_number
            ]
            session.uploaded_parts.append(part)
            session.uploaded_parts.sort(key=lambda p: p.part_number)

        return part

    def complete_upload(self, upload_id: str) -> Dict[str, str]:
        """Complete multipart upload."""
        with self._lock:
            session = self.sessions.get(upload_id)
            if not session:
                raise ValueError('Upload session not found')

        response = self.client.complete_multipart_upload(
            Bucket=self.bucket,
            Key=session.key,
            UploadId=upload_id,
            MultipartUpload={
                'Parts': [
                    {'PartNumber': p.part_number, 'ETag': f'"{p.etag}"'}
                    for p in session.uploaded_parts
                ]
            }
        )

        with self._lock:
            del self.sessions[upload_id]

        return {
            'key': session.key,
            'etag': response.get('ETag', '').strip('"'),
            'location': response.get('Location', '')
        }

    def abort_upload(self, upload_id: str) -> None:
        """Abort multipart upload."""
        with self._lock:
            session = self.sessions.get(upload_id)
            if not session:
                raise ValueError('Upload session not found')

        self.client.abort_multipart_upload(
            Bucket=self.bucket,
            Key=session.key,
            UploadId=upload_id
        )

        with self._lock:
            del self.sessions[upload_id]

    def upload_file(
        self,
        file_path: str,
        key: str,
        content_type: Optional[str] = None,
        concurrency: int = 4,
        progress_callback: Optional[Callable[[UploadProgress], None]] = None,
    ) -> Dict[str, str]:
        """Upload file with automatic multipart."""
        import os
        total_size = os.path.getsize(file_path)

        session = self.start_upload(key, total_size, content_type)
        total_parts = math.ceil(total_size / session.part_size)

        uploaded_bytes = 0
        lock = threading.Lock()

        def upload_chunk(part_number: int) -> UploadedPart:
            nonlocal uploaded_bytes

            start = (part_number - 1) * session.part_size
            end = min(start + session.part_size, total_size)

            with open(file_path, 'rb') as f:
                f.seek(start)
                data = f.read(end - start)

            part = self.upload_part(session.upload_id, part_number, data)

            with lock:
                uploaded_bytes += part.size
                if progress_callback:
                    progress_callback(UploadProgress(
                        loaded=uploaded_bytes,
                        total=total_size,
                        percentage=round((uploaded_bytes / total_size) * 100, 1),
                        parts_completed=len(session.uploaded_parts),
                        total_parts=total_parts
                    ))

            return part

        with ThreadPoolExecutor(max_workers=concurrency) as executor:
            futures = [
                executor.submit(upload_chunk, i)
                for i in range(1, total_parts + 1)
            ]

            for future in as_completed(futures):
                future.result()  # Raise any exceptions

        return self.complete_upload(session.upload_id)

    def _calculate_part_size(self, total_size: int) -> int:
        """Calculate optimal part size."""
        min_part_size = 5 * 1024 * 1024  # 5MB
        max_parts = 10000

        part_size = math.ceil(total_size / max_parts)
        return max(part_size, min_part_size)


# FastAPI integration
from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
import os
import uuid

app = FastAPI()

upload_service = MultipartUploadService(
    bucket=os.environ.get('S3_BUCKET', 'uploads'),
    region=os.environ.get('AWS_REGION', 'us-east-1')
)


class StartUploadRequest(BaseModel):
    filename: str
    total_size: int
    content_type: Optional[str] = None
    folder: Optional[str] = None


@app.post('/multipart/start')
async def start_upload(request: StartUploadRequest):
    """Start multipart upload."""
    from pathlib import Path

    ext = Path(request.filename).suffix
    folder = request.folder or 'uploads'
    key = f'{folder}/{uuid.uuid4()}{ext}'

    session = upload_service.start_upload(
        key=key,
        total_size=request.total_size,
        content_type=request.content_type
    )

    total_parts = math.ceil(request.total_size / session.part_size)

    return {
        'upload_id': session.upload_id,
        'key': session.key,
        'part_size': session.part_size,
        'total_parts': total_parts
    }


@app.post('/multipart/{upload_id}/part/{part_number}')
async def upload_part(upload_id: str, part_number: int, request: Request):
    """Upload a part."""
    body = await request.body()

    try:
        part = upload_service.upload_part(upload_id, part_number, body)
        return {
            'part_number': part.part_number,
            'etag': part.etag,
            'size': part.size
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.post('/multipart/{upload_id}/complete')
async def complete_upload(upload_id: str):
    """Complete multipart upload."""
    try:
        result = upload_service.complete_upload(upload_id)
        return {'success': True, **result}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.delete('/multipart/{upload_id}')
async def abort_upload(upload_id: str):
    """Abort multipart upload."""
    try:
        upload_service.abort_upload(upload_id)
        return {'success': True}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
```

## CLAUDE.md Integration

```markdown
## Multipart Upload Commands

### Upload Operations
- "start multipart upload" - Initialize upload session
- "upload part" - Upload file chunk
- "complete multipart upload" - Finalize upload

### Management
- "get upload status" - Check progress
- "abort upload" - Cancel in-progress upload
- "resume upload" - Continue interrupted upload

### Configuration
- "set part size" - Configure chunk size
- "set concurrency" - Parallel upload limit
- "set retry policy" - Failure handling
```

## AI Suggestions

1. **"Implement checksum verification"** - MD5/SHA256 for each part
2. **"Add upload persistence"** - Save session to DB for recovery
3. **"Implement bandwidth throttling"** - Rate limit uploads
4. **"Add encryption support"** - Client-side encryption
5. **"Implement copy with multipart"** - Large file copying
6. **"Add progress webhooks"** - Server-side progress notifications
7. **"Implement automatic retry"** - Exponential backoff
8. **"Add compression before upload"** - Reduce transfer size
9. **"Implement parallel downloads"** - Multipart GET
10. **"Add upload analytics"** - Track success rates and speeds
