# File Upload Handling

Production-ready file upload handling with validation, streaming, multipart uploads, and progress tracking.

## Overview

Comprehensive file upload patterns for handling single files, multiple files, chunked uploads, and resumable uploads with proper validation and security.

## Quick Start

```bash
npm install multer busboy formidable express-fileupload
```

## TypeScript Implementation

### Multer Configuration

```typescript
// src/middleware/upload.ts
import multer, { FileFilterCallback, StorageEngine } from 'multer';
import { Request } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

// File validation config
interface FileValidationConfig {
  maxSize: number;
  allowedMimeTypes: string[];
  allowedExtensions: string[];
}

const imageValidation: FileValidationConfig = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
};

const documentValidation: FileValidationConfig = {
  maxSize: 50 * 1024 * 1024, // 50MB
  allowedMimeTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  allowedExtensions: ['.pdf', '.doc', '.docx', '.xls', '.xlsx'],
};

const videoValidation: FileValidationConfig = {
  maxSize: 500 * 1024 * 1024, // 500MB
  allowedMimeTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
  allowedExtensions: ['.mp4', '.webm', '.mov'],
};

// Custom storage engine
class SecureStorage implements StorageEngine {
  private destination: string;

  constructor(destination: string) {
    this.destination = destination;
  }

  async _handleFile(
    req: Request,
    file: Express.Multer.File,
    callback: (error?: any, info?: Partial<Express.Multer.File>) => void
  ): Promise<void> {
    try {
      // Ensure directory exists
      await fs.mkdir(this.destination, { recursive: true });

      // Generate secure filename
      const ext = path.extname(file.originalname).toLowerCase();
      const filename = `${uuidv4()}${ext}`;
      const filepath = path.join(this.destination, filename);

      // Create write stream with hash calculation
      const hash = crypto.createHash('sha256');
      const { createWriteStream } = await import('fs');
      const writeStream = createWriteStream(filepath);

      let size = 0;

      file.stream.on('data', (chunk: Buffer) => {
        hash.update(chunk);
        size += chunk.length;
      });

      file.stream.pipe(writeStream);

      writeStream.on('finish', () => {
        callback(null, {
          filename,
          path: filepath,
          size,
          destination: this.destination,
          // @ts-ignore - custom property
          hash: hash.digest('hex'),
        });
      });

      writeStream.on('error', callback);
    } catch (error) {
      callback(error);
    }
  }

  _removeFile(
    req: Request,
    file: Express.Multer.File,
    callback: (error: Error | null) => void
  ): void {
    fs.unlink(file.path).then(() => callback(null)).catch(callback);
  }
}

// File filter factory
function createFileFilter(config: FileValidationConfig): multer.Options['fileFilter'] {
  return (
    req: Request,
    file: Express.Multer.File,
    callback: FileFilterCallback
  ) => {
    const ext = path.extname(file.originalname).toLowerCase();

    if (!config.allowedMimeTypes.includes(file.mimetype)) {
      return callback(new Error(`Invalid file type: ${file.mimetype}`));
    }

    if (!config.allowedExtensions.includes(ext)) {
      return callback(new Error(`Invalid file extension: ${ext}`));
    }

    callback(null, true);
  };
}

// Multer instances for different file types
export const uploadImage = multer({
  storage: new SecureStorage('./uploads/images'),
  limits: { fileSize: imageValidation.maxSize },
  fileFilter: createFileFilter(imageValidation),
});

export const uploadDocument = multer({
  storage: new SecureStorage('./uploads/documents'),
  limits: { fileSize: documentValidation.maxSize },
  fileFilter: createFileFilter(documentValidation),
});

export const uploadVideo = multer({
  storage: new SecureStorage('./uploads/videos'),
  limits: { fileSize: videoValidation.maxSize },
  fileFilter: createFileFilter(videoValidation),
});

// Memory storage for processing
export const uploadToMemory = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

// Generic upload with custom config
export function createUploader(
  destination: string,
  config: FileValidationConfig
): multer.Multer {
  return multer({
    storage: new SecureStorage(destination),
    limits: { fileSize: config.maxSize },
    fileFilter: createFileFilter(config),
  });
}
```

### Streaming Upload with Busboy

```typescript
// src/middleware/streaming-upload.ts
import { Request, Response, NextFunction } from 'express';
import Busboy from 'busboy';
import { createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';

interface UploadedFile {
  fieldname: string;
  filename: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  path: string;
  size: number;
}

interface StreamUploadOptions {
  destination: string;
  maxFileSize?: number;
  maxFiles?: number;
  allowedMimeTypes?: string[];
  onProgress?: (progress: { filename: string; loaded: number; total?: number }) => void;
}

export class StreamingUploader extends EventEmitter {
  private options: Required<Omit<StreamUploadOptions, 'onProgress'>> &
    Pick<StreamUploadOptions, 'onProgress'>;

  constructor(options: StreamUploadOptions) {
    super();
    this.options = {
      destination: options.destination,
      maxFileSize: options.maxFileSize || 100 * 1024 * 1024,
      maxFiles: options.maxFiles || 10,
      allowedMimeTypes: options.allowedMimeTypes || [],
      onProgress: options.onProgress,
    };
  }

  middleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      if (!req.headers['content-type']?.includes('multipart/form-data')) {
        return next();
      }

      await mkdir(this.options.destination, { recursive: true });

      const busboy = Busboy({
        headers: req.headers,
        limits: {
          fileSize: this.options.maxFileSize,
          files: this.options.maxFiles,
        },
      });

      const files: UploadedFile[] = [];
      const fields: Record<string, string> = {};
      const uploadPromises: Promise<void>[] = [];

      busboy.on('file', (fieldname, file, info) => {
        const { filename: originalname, encoding, mimeType: mimetype } = info;

        // Validate mime type
        if (
          this.options.allowedMimeTypes.length > 0 &&
          !this.options.allowedMimeTypes.includes(mimetype)
        ) {
          file.resume(); // Drain the stream
          this.emit('error', new Error(`Invalid file type: ${mimetype}`));
          return;
        }

        const ext = path.extname(originalname);
        const filename = `${uuidv4()}${ext}`;
        const filepath = path.join(this.options.destination, filename);

        let size = 0;
        const writeStream = createWriteStream(filepath);

        const uploadPromise = new Promise<void>((resolve, reject) => {
          file.on('data', (chunk: Buffer) => {
            size += chunk.length;
            this.options.onProgress?.({
              filename: originalname,
              loaded: size,
            });
            this.emit('progress', { filename: originalname, loaded: size });
          });

          file.on('limit', () => {
            writeStream.destroy();
            reject(new Error(`File ${originalname} exceeds size limit`));
          });

          file.on('end', () => {
            files.push({
              fieldname,
              filename,
              originalname,
              encoding,
              mimetype,
              path: filepath,
              size,
            });
          });

          writeStream.on('finish', resolve);
          writeStream.on('error', reject);
        });

        file.pipe(writeStream);
        uploadPromises.push(uploadPromise);
      });

      busboy.on('field', (fieldname, value) => {
        fields[fieldname] = value;
      });

      busboy.on('finish', async () => {
        try {
          await Promise.all(uploadPromises);
          req.files = files as any;
          req.body = { ...req.body, ...fields };
          next();
        } catch (error) {
          next(error);
        }
      });

      busboy.on('error', next);

      req.pipe(busboy);
    };
  }
}

// Factory function
export function streamingUpload(options: StreamUploadOptions) {
  return new StreamingUploader(options).middleware();
}
```

### Chunked/Resumable Upload

```typescript
// src/services/chunked-upload.ts
import { createWriteStream, createReadStream } from 'fs';
import { stat, mkdir, readdir, unlink, rename } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

interface ChunkInfo {
  uploadId: string;
  chunkNumber: number;
  totalChunks: number;
  chunkSize: number;
  totalSize: number;
  filename: string;
}

interface UploadSession {
  uploadId: string;
  filename: string;
  totalSize: number;
  totalChunks: number;
  uploadedChunks: number[];
  createdAt: Date;
  expiresAt: Date;
}

export class ChunkedUploadService {
  private uploadDir: string;
  private chunkDir: string;
  private sessions: Map<string, UploadSession> = new Map();
  private sessionTTL: number;

  constructor(
    uploadDir: string = './uploads',
    sessionTTL: number = 24 * 60 * 60 * 1000 // 24 hours
  ) {
    this.uploadDir = uploadDir;
    this.chunkDir = path.join(uploadDir, 'chunks');
    this.sessionTTL = sessionTTL;
  }

  async initialize(): Promise<void> {
    await mkdir(this.uploadDir, { recursive: true });
    await mkdir(this.chunkDir, { recursive: true });
  }

  // Start a new upload session
  async startUpload(
    filename: string,
    totalSize: number,
    totalChunks: number
  ): Promise<UploadSession> {
    const uploadId = uuidv4();
    const sessionDir = path.join(this.chunkDir, uploadId);
    await mkdir(sessionDir, { recursive: true });

    const session: UploadSession = {
      uploadId,
      filename,
      totalSize,
      totalChunks,
      uploadedChunks: [],
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + this.sessionTTL),
    };

    this.sessions.set(uploadId, session);

    return session;
  }

  // Upload a chunk
  async uploadChunk(
    uploadId: string,
    chunkNumber: number,
    data: Buffer
  ): Promise<{
    uploadedChunks: number[];
    completed: boolean;
    filepath?: string;
  }> {
    const session = this.sessions.get(uploadId);
    if (!session) {
      throw new Error('Upload session not found');
    }

    if (session.uploadedChunks.includes(chunkNumber)) {
      return {
        uploadedChunks: session.uploadedChunks,
        completed: false,
      };
    }

    // Write chunk
    const chunkPath = path.join(this.chunkDir, uploadId, `chunk_${chunkNumber}`);
    const writeStream = createWriteStream(chunkPath);

    await new Promise<void>((resolve, reject) => {
      writeStream.write(data, (err) => {
        if (err) reject(err);
        else {
          writeStream.end();
          resolve();
        }
      });
    });

    session.uploadedChunks.push(chunkNumber);
    session.uploadedChunks.sort((a, b) => a - b);

    // Check if upload is complete
    if (session.uploadedChunks.length === session.totalChunks) {
      const filepath = await this.assembleChunks(session);
      this.sessions.delete(uploadId);
      return {
        uploadedChunks: session.uploadedChunks,
        completed: true,
        filepath,
      };
    }

    return {
      uploadedChunks: session.uploadedChunks,
      completed: false,
    };
  }

  // Assemble chunks into final file
  private async assembleChunks(session: UploadSession): Promise<string> {
    const ext = path.extname(session.filename);
    const finalFilename = `${uuidv4()}${ext}`;
    const finalPath = path.join(this.uploadDir, finalFilename);

    const writeStream = createWriteStream(finalPath);

    for (let i = 0; i < session.totalChunks; i++) {
      const chunkPath = path.join(this.chunkDir, session.uploadId, `chunk_${i}`);
      const readStream = createReadStream(chunkPath);

      await new Promise<void>((resolve, reject) => {
        readStream.pipe(writeStream, { end: false });
        readStream.on('end', resolve);
        readStream.on('error', reject);
      });
    }

    writeStream.end();

    // Cleanup chunks
    await this.cleanupSession(session.uploadId);

    return finalPath;
  }

  // Get upload status
  getUploadStatus(uploadId: string): UploadSession | null {
    return this.sessions.get(uploadId) || null;
  }

  // Cancel upload
  async cancelUpload(uploadId: string): Promise<void> {
    await this.cleanupSession(uploadId);
    this.sessions.delete(uploadId);
  }

  // Cleanup session files
  private async cleanupSession(uploadId: string): Promise<void> {
    const sessionDir = path.join(this.chunkDir, uploadId);

    try {
      const files = await readdir(sessionDir);
      await Promise.all(
        files.map((file) => unlink(path.join(sessionDir, file)))
      );
      await unlink(sessionDir).catch(() => {});
    } catch (error) {
      // Directory may not exist
    }
  }

  // Cleanup expired sessions
  async cleanupExpired(): Promise<void> {
    const now = new Date();

    for (const [uploadId, session] of this.sessions) {
      if (session.expiresAt < now) {
        await this.cancelUpload(uploadId);
      }
    }
  }
}

// Express routes
import { Router, Request, Response } from 'express';

export function createChunkedUploadRouter(
  uploadService: ChunkedUploadService
): Router {
  const router = Router();

  // Start upload
  router.post('/upload/start', async (req: Request, res: Response) => {
    try {
      const { filename, totalSize, totalChunks } = req.body;

      if (!filename || !totalSize || !totalChunks) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const session = await uploadService.startUpload(
        filename,
        totalSize,
        totalChunks
      );

      res.json({
        uploadId: session.uploadId,
        expiresAt: session.expiresAt,
      });
    } catch (error) {
      console.error('Start upload error:', error);
      res.status(500).json({ error: 'Failed to start upload' });
    }
  });

  // Upload chunk
  router.post('/upload/:uploadId/chunk/:chunkNumber', async (req: Request, res: Response) => {
    try {
      const { uploadId, chunkNumber } = req.params;

      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      const data = Buffer.concat(chunks);

      const result = await uploadService.uploadChunk(
        uploadId,
        parseInt(chunkNumber),
        data
      );

      res.json(result);
    } catch (error: any) {
      console.error('Upload chunk error:', error);
      res.status(error.message.includes('not found') ? 404 : 500).json({
        error: error.message,
      });
    }
  });

  // Get status
  router.get('/upload/:uploadId/status', (req: Request, res: Response) => {
    const { uploadId } = req.params;
    const session = uploadService.getUploadStatus(uploadId);

    if (!session) {
      return res.status(404).json({ error: 'Upload not found' });
    }

    res.json({
      uploadId: session.uploadId,
      filename: session.filename,
      totalChunks: session.totalChunks,
      uploadedChunks: session.uploadedChunks,
      progress: (session.uploadedChunks.length / session.totalChunks) * 100,
      expiresAt: session.expiresAt,
    });
  });

  // Cancel upload
  router.delete('/upload/:uploadId', async (req: Request, res: Response) => {
    try {
      const { uploadId } = req.params;
      await uploadService.cancelUpload(uploadId);
      res.json({ success: true });
    } catch (error) {
      console.error('Cancel upload error:', error);
      res.status(500).json({ error: 'Failed to cancel upload' });
    }
  });

  return router;
}
```

### React Upload Components

```typescript
// components/FileUploader.tsx
import React, { useState, useRef, useCallback } from 'react';

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface UploadedFile {
  filename: string;
  originalName: string;
  size: number;
  url: string;
}

interface UseFileUploadOptions {
  endpoint: string;
  maxSize?: number;
  accept?: string[];
  onSuccess?: (file: UploadedFile) => void;
  onError?: (error: Error) => void;
}

export function useFileUpload(options: UseFileUploadOptions) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const upload = useCallback(async (file: File): Promise<UploadedFile> => {
    // Validate size
    if (options.maxSize && file.size > options.maxSize) {
      throw new Error(`File too large. Max size: ${Math.round(options.maxSize / 1024 / 1024)}MB`);
    }

    // Validate type
    if (options.accept && options.accept.length > 0) {
      const allowed = options.accept.some((type) => {
        if (type.startsWith('.')) {
          return file.name.toLowerCase().endsWith(type);
        }
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.replace('/*', '/'));
        }
        return file.type === type;
      });

      if (!allowed) {
        throw new Error('File type not allowed');
      }
    }

    setUploading(true);
    setError(null);
    setProgress({ loaded: 0, total: file.size, percentage: 0 });

    abortControllerRef.current = new AbortController();

    try {
      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();

      const uploadPromise = new Promise<UploadedFile>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            setProgress({
              loaded: e.loaded,
              total: e.total,
              percentage: Math.round((e.loaded / e.total) * 100),
            });
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const response = JSON.parse(xhr.responseText);
            const uploadedFile: UploadedFile = {
              filename: response.file?.filename || response.filename,
              originalName: file.name,
              size: file.size,
              url: response.file?.url || response.url,
            };
            options.onSuccess?.(uploadedFile);
            resolve(uploadedFile);
          } else {
            const error = new Error(xhr.responseText || 'Upload failed');
            options.onError?.(error);
            reject(error);
          }
        });

        xhr.addEventListener('error', () => {
          const error = new Error('Upload failed');
          options.onError?.(error);
          reject(error);
        });

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload cancelled'));
        });
      });

      xhr.open('POST', options.endpoint);
      xhr.send(formData);

      // Handle abort signal
      abortControllerRef.current.signal.addEventListener('abort', () => {
        xhr.abort();
      });

      return await uploadPromise;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
      throw err;
    } finally {
      setUploading(false);
      abortControllerRef.current = null;
    }
  }, [options]);

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  return { upload, cancel, uploading, progress, error };
}

// Chunked upload hook
export function useChunkedUpload(options: {
  endpoint: string;
  chunkSize?: number;
  onSuccess?: (filepath: string) => void;
  onError?: (error: Error) => void;
}) {
  const chunkSize = options.chunkSize || 5 * 1024 * 1024; // 5MB default
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (file: File): Promise<string> => {
    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      const totalChunks = Math.ceil(file.size / chunkSize);

      // Start upload session
      const startRes = await fetch(`${options.endpoint}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          totalSize: file.size,
          totalChunks,
        }),
      });

      if (!startRes.ok) {
        throw new Error('Failed to start upload');
      }

      const { uploadId } = await startRes.json();

      // Upload chunks
      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);

        const chunkRes = await fetch(
          `${options.endpoint}/${uploadId}/chunk/${i}`,
          {
            method: 'POST',
            body: chunk,
          }
        );

        if (!chunkRes.ok) {
          throw new Error(`Failed to upload chunk ${i}`);
        }

        const result = await chunkRes.json();
        setProgress(((i + 1) / totalChunks) * 100);

        if (result.completed) {
          options.onSuccess?.(result.filepath);
          return result.filepath;
        }
      }

      throw new Error('Upload did not complete');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
      options.onError?.(err instanceof Error ? err : new Error(message));
      throw err;
    } finally {
      setUploading(false);
    }
  }, [options, chunkSize]);

  return { upload, uploading, progress, error };
}

// Drag and drop component
export function FileDropzone({
  onFiles,
  accept,
  multiple = false,
  maxSize,
  children,
  className,
}: {
  onFiles: (files: File[]) => void;
  accept?: string[];
  multiple?: boolean;
  maxSize?: number;
  children?: React.ReactNode;
  className?: string;
}) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter((file) => {
      if (maxSize && file.size > maxSize) return false;
      if (accept) {
        return accept.some((type) => {
          if (type.startsWith('.')) return file.name.endsWith(type);
          if (type.endsWith('/*')) return file.type.startsWith(type.replace('/*', ''));
          return file.type === type;
        });
      }
      return true;
    });

    if (validFiles.length > 0) {
      onFiles(multiple ? validFiles : [validFiles[0]]);
    }
  }, [accept, maxSize, multiple, onFiles]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onFiles(files);
    }
  }, [onFiles]);

  return (
    <div
      className={`dropzone ${dragActive ? 'active' : ''} ${className || ''}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept?.join(',')}
        multiple={multiple}
        onChange={handleChange}
        style={{ display: 'none' }}
      />
      {children || (
        <p>
          {dragActive
            ? 'Drop files here'
            : 'Drag files here or click to select'}
        </p>
      )}
    </div>
  );
}
```

## Python Implementation

```python
# upload/file_handler.py
from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List
import aiofiles
import hashlib
import uuid
from pathlib import Path
from datetime import datetime, timedelta
import mimetypes


class FileValidation:
    def __init__(
        self,
        max_size: int = 10 * 1024 * 1024,
        allowed_types: Optional[List[str]] = None,
        allowed_extensions: Optional[List[str]] = None,
    ):
        self.max_size = max_size
        self.allowed_types = allowed_types or []
        self.allowed_extensions = allowed_extensions or []

    def validate(self, file: UploadFile) -> None:
        # Check size (need to read file to get actual size)
        if self.allowed_types and file.content_type not in self.allowed_types:
            raise HTTPException(
                status_code=400,
                detail=f'Invalid file type: {file.content_type}'
            )

        if self.allowed_extensions:
            ext = Path(file.filename).suffix.lower()
            if ext not in self.allowed_extensions:
                raise HTTPException(
                    status_code=400,
                    detail=f'Invalid file extension: {ext}'
                )


IMAGE_VALIDATION = FileValidation(
    max_size=10 * 1024 * 1024,
    allowed_types=['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowed_extensions=['.jpg', '.jpeg', '.png', '.gif', '.webp']
)

DOCUMENT_VALIDATION = FileValidation(
    max_size=50 * 1024 * 1024,
    allowed_types=['application/pdf', 'application/msword'],
    allowed_extensions=['.pdf', '.doc', '.docx']
)


class UploadResult(BaseModel):
    filename: str
    original_name: str
    size: int
    content_type: str
    path: str
    hash: str


class FileUploadService:
    def __init__(self, upload_dir: str = './uploads'):
        self.upload_dir = Path(upload_dir)
        self.upload_dir.mkdir(parents=True, exist_ok=True)

    async def save_file(
        self,
        file: UploadFile,
        validation: Optional[FileValidation] = None,
        subfolder: Optional[str] = None,
    ) -> UploadResult:
        if validation:
            validation.validate(file)

        # Determine destination
        dest_dir = self.upload_dir / subfolder if subfolder else self.upload_dir
        dest_dir.mkdir(parents=True, exist_ok=True)

        # Generate secure filename
        ext = Path(file.filename).suffix
        filename = f'{uuid.uuid4()}{ext}'
        filepath = dest_dir / filename

        # Save with hash calculation
        hash_obj = hashlib.sha256()
        size = 0

        async with aiofiles.open(filepath, 'wb') as f:
            while chunk := await file.read(8192):
                hash_obj.update(chunk)
                size += len(chunk)
                await f.write(chunk)

        # Check size after reading
        if validation and size > validation.max_size:
            filepath.unlink()  # Delete file
            raise HTTPException(
                status_code=400,
                detail=f'File too large. Max size: {validation.max_size}'
            )

        return UploadResult(
            filename=filename,
            original_name=file.filename,
            size=size,
            content_type=file.content_type,
            path=str(filepath),
            hash=hash_obj.hexdigest()
        )

    async def save_multiple(
        self,
        files: List[UploadFile],
        validation: Optional[FileValidation] = None,
        subfolder: Optional[str] = None,
    ) -> List[UploadResult]:
        results = []
        for file in files:
            result = await self.save_file(file, validation, subfolder)
            results.append(result)
        return results

    def delete_file(self, filepath: str) -> bool:
        path = Path(filepath)
        if path.exists() and path.is_file():
            path.unlink()
            return True
        return False


# Chunked upload service
class ChunkUploadSession(BaseModel):
    upload_id: str
    filename: str
    total_size: int
    total_chunks: int
    uploaded_chunks: List[int] = []
    created_at: datetime
    expires_at: datetime


class ChunkedUploadService:
    def __init__(
        self,
        upload_dir: str = './uploads',
        chunk_dir: str = './uploads/chunks',
        session_ttl: int = 86400,  # 24 hours
    ):
        self.upload_dir = Path(upload_dir)
        self.chunk_dir = Path(chunk_dir)
        self.session_ttl = session_ttl
        self.sessions: dict[str, ChunkUploadSession] = {}

        self.upload_dir.mkdir(parents=True, exist_ok=True)
        self.chunk_dir.mkdir(parents=True, exist_ok=True)

    def start_upload(
        self,
        filename: str,
        total_size: int,
        total_chunks: int,
    ) -> ChunkUploadSession:
        upload_id = str(uuid.uuid4())
        session_dir = self.chunk_dir / upload_id
        session_dir.mkdir(parents=True, exist_ok=True)

        session = ChunkUploadSession(
            upload_id=upload_id,
            filename=filename,
            total_size=total_size,
            total_chunks=total_chunks,
            uploaded_chunks=[],
            created_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(seconds=self.session_ttl)
        )

        self.sessions[upload_id] = session
        return session

    async def upload_chunk(
        self,
        upload_id: str,
        chunk_number: int,
        data: bytes,
    ) -> dict:
        session = self.sessions.get(upload_id)
        if not session:
            raise HTTPException(status_code=404, detail='Upload session not found')

        if chunk_number in session.uploaded_chunks:
            return {
                'uploaded_chunks': session.uploaded_chunks,
                'completed': False
            }

        # Write chunk
        chunk_path = self.chunk_dir / upload_id / f'chunk_{chunk_number}'
        async with aiofiles.open(chunk_path, 'wb') as f:
            await f.write(data)

        session.uploaded_chunks.append(chunk_number)
        session.uploaded_chunks.sort()

        # Check completion
        if len(session.uploaded_chunks) == session.total_chunks:
            filepath = await self._assemble_chunks(session)
            del self.sessions[upload_id]
            return {
                'uploaded_chunks': session.uploaded_chunks,
                'completed': True,
                'filepath': str(filepath)
            }

        return {
            'uploaded_chunks': session.uploaded_chunks,
            'completed': False
        }

    async def _assemble_chunks(self, session: ChunkUploadSession) -> Path:
        ext = Path(session.filename).suffix
        final_filename = f'{uuid.uuid4()}{ext}'
        final_path = self.upload_dir / final_filename

        async with aiofiles.open(final_path, 'wb') as out_file:
            for i in range(session.total_chunks):
                chunk_path = self.chunk_dir / session.upload_id / f'chunk_{i}'
                async with aiofiles.open(chunk_path, 'rb') as chunk_file:
                    content = await chunk_file.read()
                    await out_file.write(content)

        # Cleanup chunks
        await self._cleanup_session(session.upload_id)

        return final_path

    async def _cleanup_session(self, upload_id: str) -> None:
        session_dir = self.chunk_dir / upload_id
        if session_dir.exists():
            for chunk in session_dir.iterdir():
                chunk.unlink()
            session_dir.rmdir()


# FastAPI routes
app = FastAPI()
upload_service = FileUploadService()
chunked_service = ChunkedUploadService()


@app.post('/upload')
async def upload_file(file: UploadFile = File(...)):
    result = await upload_service.save_file(file)
    return result


@app.post('/upload/image')
async def upload_image(file: UploadFile = File(...)):
    result = await upload_service.save_file(
        file,
        validation=IMAGE_VALIDATION,
        subfolder='images'
    )
    return result


@app.post('/upload/multiple')
async def upload_multiple(files: List[UploadFile] = File(...)):
    results = await upload_service.save_multiple(files)
    return {'files': results}


@app.post('/upload/chunked/start')
async def start_chunked_upload(
    filename: str,
    total_size: int,
    total_chunks: int,
):
    session = chunked_service.start_upload(filename, total_size, total_chunks)
    return {
        'upload_id': session.upload_id,
        'expires_at': session.expires_at.isoformat()
    }


@app.post('/upload/chunked/{upload_id}/chunk/{chunk_number}')
async def upload_chunk(upload_id: str, chunk_number: int, file: UploadFile = File(...)):
    data = await file.read()
    result = await chunked_service.upload_chunk(upload_id, chunk_number, data)
    return result
```

## CLAUDE.md Integration

```markdown
## File Upload Commands

### Upload Operations
- "handle file upload" - Process uploaded file
- "validate file type" - Check mime type/extension
- "save uploaded file" - Store with secure filename

### Chunked Uploads
- "implement resumable upload" - Handle large file chunks
- "assemble file chunks" - Combine uploaded chunks
- "track upload progress" - Monitor chunk completion

### Validation
- "validate file size" - Check against limits
- "scan for malware" - Security validation
- "verify file integrity" - Hash verification

### Cleanup
- "cleanup temp files" - Remove incomplete uploads
- "expire upload sessions" - Handle timeouts
```

## AI Suggestions

1. **"Add virus scanning integration"** - ClamAV or cloud-based scanning
2. **"Implement image validation"** - Verify image headers match extension
3. **"Add upload quotas"** - Per-user storage limits
4. **"Implement deduplication"** - Hash-based duplicate detection
5. **"Add upload encryption"** - Encrypt files at rest
6. **"Implement bandwidth throttling"** - Rate limit uploads
7. **"Add upload webhooks"** - Notify on completion
8. **"Implement parallel chunk upload"** - Upload multiple chunks simultaneously
9. **"Add upload preview generation"** - Create thumbnails during upload
10. **"Implement upload resume from URL"** - Resume interrupted browser uploads
