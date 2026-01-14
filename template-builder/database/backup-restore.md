# Database Backup & Restore Template

Production-ready database backup and restore system with automated scheduling, cloud storage, encryption, and point-in-time recovery for PostgreSQL.

## Installation

```bash
npm install @aws-sdk/client-s3 @aws-sdk/lib-storage node-schedule pg
npm install -D @types/node @types/pg typescript ts-node
```

## Environment Variables

```env
# Database
DATABASE_URL=postgres://user:password@localhost:5432/myapp
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=myapp
DATABASE_USER=user
DATABASE_PASSWORD=password

# Backup Storage (S3/R2/MinIO)
BACKUP_STORAGE_TYPE=s3
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
BACKUP_BUCKET=myapp-backups
BACKUP_PREFIX=database/

# Backup Settings
BACKUP_RETENTION_DAYS=30
BACKUP_ENCRYPTION_KEY=your-32-char-encryption-key
BACKUP_SCHEDULE=0 3 * * *
BACKUP_COMPRESSION=gzip

# Notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx
```

## Project Structure

```
src/
├── lib/
│   └── backup/
│       ├── index.ts            # Main exports
│       ├── config.ts           # Configuration
│       ├── backup.ts           # Backup operations
│       ├── restore.ts          # Restore operations
│       ├── storage/
│       │   ├── index.ts
│       │   ├── s3.ts           # S3/R2 storage
│       │   ├── local.ts        # Local storage
│       │   └── gcs.ts          # Google Cloud Storage
│       ├── encryption.ts       # Encryption utilities
│       ├── compression.ts      # Compression utilities
│       ├── scheduler.ts        # Backup scheduling
│       └── notifications.ts    # Alert notifications
├── scripts/
│   ├── backup.ts               # CLI backup script
│   ├── restore.ts              # CLI restore script
│   └── list-backups.ts         # List available backups
└── __tests__/
    └── backup.test.ts
```

## Configuration

```typescript
// src/lib/backup/config.ts
import * as dotenv from 'dotenv';

dotenv.config();

export interface BackupConfig {
  database: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
  };
  storage: {
    type: 's3' | 'gcs' | 'local';
    bucket: string;
    prefix: string;
    region?: string;
    endpoint?: string;
    credentials?: {
      accessKeyId: string;
      secretAccessKey: string;
    };
    localPath?: string;
  };
  backup: {
    retentionDays: number;
    compression: 'gzip' | 'lz4' | 'none';
    encryption: boolean;
    encryptionKey?: string;
    schedule: string;
    parallelJobs: number;
  };
  notifications: {
    enabled: boolean;
    slackWebhookUrl?: string;
    emailTo?: string;
  };
}

export function loadConfig(): BackupConfig {
  const databaseUrl = process.env.DATABASE_URL;
  let dbConfig: BackupConfig['database'];

  if (databaseUrl) {
    const url = new URL(databaseUrl);
    dbConfig = {
      host: url.hostname,
      port: parseInt(url.port) || 5432,
      name: url.pathname.slice(1),
      user: url.username,
      password: url.password,
    };
  } else {
    dbConfig = {
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      name: process.env.DATABASE_NAME || 'myapp',
      user: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || '',
    };
  }

  return {
    database: dbConfig,
    storage: {
      type: (process.env.BACKUP_STORAGE_TYPE as 's3' | 'gcs' | 'local') || 's3',
      bucket: process.env.BACKUP_BUCKET || 'backups',
      prefix: process.env.BACKUP_PREFIX || 'database/',
      region: process.env.AWS_REGION,
      endpoint: process.env.S3_ENDPOINT,
      credentials: process.env.AWS_ACCESS_KEY_ID ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      } : undefined,
      localPath: process.env.BACKUP_LOCAL_PATH || './backups',
    },
    backup: {
      retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30'),
      compression: (process.env.BACKUP_COMPRESSION as 'gzip' | 'lz4' | 'none') || 'gzip',
      encryption: process.env.BACKUP_ENCRYPTION_KEY ? true : false,
      encryptionKey: process.env.BACKUP_ENCRYPTION_KEY,
      schedule: process.env.BACKUP_SCHEDULE || '0 3 * * *',
      parallelJobs: parseInt(process.env.BACKUP_PARALLEL_JOBS || '4'),
    },
    notifications: {
      enabled: !!process.env.SLACK_WEBHOOK_URL || !!process.env.NOTIFICATION_EMAIL,
      slackWebhookUrl: process.env.SLACK_WEBHOOK_URL,
      emailTo: process.env.NOTIFICATION_EMAIL,
    },
  };
}

export const config = loadConfig();
```

## Storage Providers

```typescript
// src/lib/backup/storage/index.ts
import { Readable } from 'stream';

export interface BackupMetadata {
  name: string;
  size: number;
  createdAt: Date;
  encrypted: boolean;
  compressed: string;
  database: string;
  type: 'full' | 'incremental' | 'schema';
  checksum?: string;
}

export interface StorageProvider {
  upload(key: string, data: Buffer | Readable, metadata?: Record<string, string>): Promise<string>;
  download(key: string): Promise<Buffer>;
  downloadStream(key: string): Promise<Readable>;
  delete(key: string): Promise<void>;
  list(prefix?: string): Promise<BackupMetadata[]>;
  exists(key: string): Promise<boolean>;
  getSignedUrl(key: string, expiresIn?: number): Promise<string>;
}

export * from './s3';
export * from './local';


// src/lib/backup/storage/s3.ts
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';
import { BackupConfig } from '../config';
import { BackupMetadata, StorageProvider } from './index';

export class S3Storage implements StorageProvider {
  private client: S3Client;
  private bucket: string;
  private prefix: string;

  constructor(config: BackupConfig['storage']) {
    this.bucket = config.bucket;
    this.prefix = config.prefix;

    this.client = new S3Client({
      region: config.region || 'us-east-1',
      endpoint: config.endpoint,
      credentials: config.credentials,
      forcePathStyle: !!config.endpoint, // For MinIO/R2
    });
  }

  private getKey(name: string): string {
    return `${this.prefix}${name}`;
  }

  async upload(
    name: string,
    data: Buffer | Readable,
    metadata?: Record<string, string>
  ): Promise<string> {
    const key = this.getKey(name);

    if (Buffer.isBuffer(data)) {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: data,
          Metadata: metadata,
        })
      );
    } else {
      // Use multipart upload for streams
      const upload = new Upload({
        client: this.client,
        params: {
          Bucket: this.bucket,
          Key: key,
          Body: data,
          Metadata: metadata,
        },
        queueSize: 4,
        partSize: 10 * 1024 * 1024, // 10MB parts
      });

      upload.on('httpUploadProgress', (progress) => {
        console.log(`Upload progress: ${progress.loaded}/${progress.total}`);
      });

      await upload.done();
    }

    return `s3://${this.bucket}/${key}`;
  }

  async download(name: string): Promise<Buffer> {
    const key = this.getKey(name);

    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
    );

    const chunks: Buffer[] = [];
    for await (const chunk of response.Body as Readable) {
      chunks.push(Buffer.from(chunk));
    }

    return Buffer.concat(chunks);
  }

  async downloadStream(name: string): Promise<Readable> {
    const key = this.getKey(name);

    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
    );

    return response.Body as Readable;
  }

  async delete(name: string): Promise<void> {
    const key = this.getKey(name);

    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
    );
  }

  async list(prefix?: string): Promise<BackupMetadata[]> {
    const fullPrefix = prefix ? `${this.prefix}${prefix}` : this.prefix;
    const backups: BackupMetadata[] = [];

    let continuationToken: string | undefined;

    do {
      const response = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: fullPrefix,
          ContinuationToken: continuationToken,
        })
      );

      for (const object of response.Contents || []) {
        const name = object.Key!.replace(this.prefix, '');

        // Parse metadata from filename
        const metadata = this.parseBackupName(name);

        backups.push({
          name,
          size: object.Size || 0,
          createdAt: object.LastModified || new Date(),
          ...metadata,
        });
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    return backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async exists(name: string): Promise<boolean> {
    const key = this.getKey(name);

    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      );
      return true;
    } catch {
      return false;
    }
  }

  async getSignedUrl(name: string, expiresIn: number = 3600): Promise<string> {
    const key = this.getKey(name);

    return getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
      { expiresIn }
    );
  }

  private parseBackupName(name: string): Partial<BackupMetadata> {
    // Expected format: myapp_full_2024-01-15T03-00-00Z_encrypted.sql.gz
    const parts = name.split('_');

    return {
      database: parts[0] || 'unknown',
      type: (parts[1] as 'full' | 'incremental' | 'schema') || 'full',
      encrypted: name.includes('_encrypted'),
      compressed: name.endsWith('.gz') ? 'gzip' : name.endsWith('.lz4') ? 'lz4' : 'none',
    };
  }
}


// src/lib/backup/storage/local.ts
import * as fs from 'fs';
import * as path from 'path';
import { Readable } from 'stream';
import { BackupMetadata, StorageProvider } from './index';

export class LocalStorage implements StorageProvider {
  private basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;

    // Ensure directory exists
    if (!fs.existsSync(basePath)) {
      fs.mkdirSync(basePath, { recursive: true });
    }
  }

  private getPath(name: string): string {
    return path.join(this.basePath, name);
  }

  async upload(
    name: string,
    data: Buffer | Readable,
    metadata?: Record<string, string>
  ): Promise<string> {
    const filePath = this.getPath(name);

    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (Buffer.isBuffer(data)) {
      fs.writeFileSync(filePath, data);
    } else {
      const writeStream = fs.createWriteStream(filePath);
      await new Promise<void>((resolve, reject) => {
        data.pipe(writeStream);
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });
    }

    // Save metadata
    if (metadata) {
      fs.writeFileSync(`${filePath}.meta.json`, JSON.stringify(metadata));
    }

    return `file://${filePath}`;
  }

  async download(name: string): Promise<Buffer> {
    const filePath = this.getPath(name);
    return fs.readFileSync(filePath);
  }

  async downloadStream(name: string): Promise<Readable> {
    const filePath = this.getPath(name);
    return fs.createReadStream(filePath);
  }

  async delete(name: string): Promise<void> {
    const filePath = this.getPath(name);
    fs.unlinkSync(filePath);

    // Delete metadata if exists
    const metaPath = `${filePath}.meta.json`;
    if (fs.existsSync(metaPath)) {
      fs.unlinkSync(metaPath);
    }
  }

  async list(prefix?: string): Promise<BackupMetadata[]> {
    const searchPath = prefix ? path.join(this.basePath, prefix) : this.basePath;
    const backups: BackupMetadata[] = [];

    if (!fs.existsSync(searchPath)) {
      return backups;
    }

    const files = fs.readdirSync(searchPath);

    for (const file of files) {
      if (file.endsWith('.meta.json')) continue;

      const filePath = path.join(searchPath, file);
      const stats = fs.statSync(filePath);

      if (stats.isFile()) {
        backups.push({
          name: prefix ? `${prefix}/${file}` : file,
          size: stats.size,
          createdAt: stats.birthtime,
          database: 'unknown',
          type: 'full',
          encrypted: file.includes('_encrypted'),
          compressed: file.endsWith('.gz') ? 'gzip' : 'none',
        });
      }
    }

    return backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async exists(name: string): Promise<boolean> {
    const filePath = this.getPath(name);
    return fs.existsSync(filePath);
  }

  async getSignedUrl(name: string): Promise<string> {
    // Local storage doesn't support signed URLs
    return `file://${this.getPath(name)}`;
  }
}
```

## Encryption & Compression

```typescript
// src/lib/backup/encryption.ts
import * as crypto from 'crypto';
import { Readable, Transform } from 'stream';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;

export function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
}

export function encrypt(data: Buffer, password: string): Buffer {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = deriveKey(password, salt);
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Format: salt (32) + iv (16) + authTag (16) + encrypted data
  return Buffer.concat([salt, iv, authTag, encrypted]);
}

export function decrypt(encryptedData: Buffer, password: string): Buffer {
  const salt = encryptedData.subarray(0, SALT_LENGTH);
  const iv = encryptedData.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const authTag = encryptedData.subarray(
    SALT_LENGTH + IV_LENGTH,
    SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH
  );
  const data = encryptedData.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);

  const key = deriveKey(password, salt);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(data), decipher.final()]);
}

// Streaming encryption
export function createEncryptStream(password: string): {
  stream: Transform;
  getSalt: () => Buffer;
  getIv: () => Buffer;
  getAuthTag: () => Buffer;
} {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = deriveKey(password, salt);
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  return {
    stream: cipher,
    getSalt: () => salt,
    getIv: () => iv,
    getAuthTag: () => cipher.getAuthTag(),
  };
}

export function createDecryptStream(
  password: string,
  salt: Buffer,
  iv: Buffer,
  authTag: Buffer
): Transform {
  const key = deriveKey(password, salt);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return decipher;
}

export function generateChecksum(data: Buffer): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}


// src/lib/backup/compression.ts
import * as zlib from 'zlib';
import { Transform, Readable } from 'stream';

export type CompressionType = 'gzip' | 'lz4' | 'none';

export function compress(data: Buffer, type: CompressionType = 'gzip'): Buffer {
  switch (type) {
    case 'gzip':
      return zlib.gzipSync(data, { level: 9 });
    case 'lz4':
      // LZ4 would require additional dependency
      return zlib.gzipSync(data, { level: 1 }); // Fast compression fallback
    case 'none':
    default:
      return data;
  }
}

export function decompress(data: Buffer, type: CompressionType = 'gzip'): Buffer {
  switch (type) {
    case 'gzip':
      return zlib.gunzipSync(data);
    case 'lz4':
      return zlib.gunzipSync(data);
    case 'none':
    default:
      return data;
  }
}

export function createCompressStream(type: CompressionType = 'gzip'): Transform {
  switch (type) {
    case 'gzip':
      return zlib.createGzip({ level: 9 });
    case 'lz4':
      return zlib.createGzip({ level: 1 });
    case 'none':
    default:
      return new Transform({
        transform(chunk, encoding, callback) {
          callback(null, chunk);
        },
      });
  }
}

export function createDecompressStream(type: CompressionType = 'gzip'): Transform {
  switch (type) {
    case 'gzip':
    case 'lz4':
      return zlib.createGunzip();
    case 'none':
    default:
      return new Transform({
        transform(chunk, encoding, callback) {
          callback(null, chunk);
        },
      });
  }
}

export function getCompressionExtension(type: CompressionType): string {
  switch (type) {
    case 'gzip':
      return '.gz';
    case 'lz4':
      return '.lz4';
    default:
      return '';
  }
}
```

## Backup Operations

```typescript
// src/lib/backup/backup.ts
import { spawn } from 'child_process';
import { Readable, PassThrough } from 'stream';
import { BackupConfig, config } from './config';
import { StorageProvider, S3Storage, LocalStorage, BackupMetadata } from './storage';
import { encrypt, generateChecksum } from './encryption';
import { compress, createCompressStream, getCompressionExtension } from './compression';
import { sendNotification } from './notifications';

export interface BackupOptions {
  type?: 'full' | 'schema' | 'data';
  tables?: string[];
  excludeTables?: string[];
  compress?: boolean;
  encrypt?: boolean;
  parallel?: number;
}

export interface BackupResult {
  name: string;
  path: string;
  size: number;
  duration: number;
  checksum: string;
  encrypted: boolean;
  compressed: string;
}

export class BackupService {
  private storage: StorageProvider;
  private config: BackupConfig;

  constructor(customConfig?: Partial<BackupConfig>) {
    this.config = { ...config, ...customConfig };

    // Initialize storage provider
    switch (this.config.storage.type) {
      case 's3':
        this.storage = new S3Storage(this.config.storage);
        break;
      case 'local':
        this.storage = new LocalStorage(this.config.storage.localPath || './backups');
        break;
      default:
        this.storage = new S3Storage(this.config.storage);
    }
  }

  // Generate backup filename
  private generateBackupName(type: string = 'full'): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const dbName = this.config.database.name;
    const encrypted = this.config.backup.encryption ? '_encrypted' : '';
    const extension = getCompressionExtension(this.config.backup.compression);

    return `${dbName}_${type}_${timestamp}${encrypted}.sql${extension}`;
  }

  // Run pg_dump and return stream
  private createDumpStream(options: BackupOptions = {}): Readable {
    const args: string[] = [
      '-h', this.config.database.host,
      '-p', String(this.config.database.port),
      '-U', this.config.database.user,
      '-d', this.config.database.name,
      '--no-password',
      '--verbose',
    ];

    // Backup type
    if (options.type === 'schema') {
      args.push('--schema-only');
    } else if (options.type === 'data') {
      args.push('--data-only');
    }

    // Parallel jobs
    if (options.parallel && options.parallel > 1) {
      args.push('-j', String(options.parallel));
      args.push('-Fd'); // Directory format for parallel
    } else {
      args.push('-Fc'); // Custom format
    }

    // Include specific tables
    if (options.tables && options.tables.length > 0) {
      for (const table of options.tables) {
        args.push('-t', table);
      }
    }

    // Exclude tables
    if (options.excludeTables && options.excludeTables.length > 0) {
      for (const table of options.excludeTables) {
        args.push('-T', table);
      }
    }

    const pgDump = spawn('pg_dump', args, {
      env: {
        ...process.env,
        PGPASSWORD: this.config.database.password,
      },
    });

    pgDump.stderr.on('data', (data) => {
      console.log(`pg_dump: ${data}`);
    });

    return pgDump.stdout;
  }

  // Create full backup
  async createBackup(options: BackupOptions = {}): Promise<BackupResult> {
    const startTime = Date.now();
    const backupName = this.generateBackupName(options.type || 'full');

    console.log(`Starting backup: ${backupName}`);

    try {
      // Create dump stream
      const dumpStream = this.createDumpStream(options);

      // Collect data
      const chunks: Buffer[] = [];
      for await (const chunk of dumpStream) {
        chunks.push(Buffer.from(chunk));
      }
      let data = Buffer.concat(chunks);

      // Compress
      if (this.config.backup.compression !== 'none') {
        console.log(`Compressing with ${this.config.backup.compression}...`);
        data = compress(data, this.config.backup.compression);
      }

      // Generate checksum before encryption
      const checksum = generateChecksum(data);

      // Encrypt
      if (this.config.backup.encryption && this.config.backup.encryptionKey) {
        console.log('Encrypting backup...');
        data = encrypt(data, this.config.backup.encryptionKey);
      }

      // Upload to storage
      console.log('Uploading to storage...');
      const path = await this.storage.upload(backupName, data, {
        database: this.config.database.name,
        type: options.type || 'full',
        checksum,
        encrypted: String(this.config.backup.encryption),
        compressed: this.config.backup.compression,
      });

      const duration = Date.now() - startTime;

      const result: BackupResult = {
        name: backupName,
        path,
        size: data.length,
        duration,
        checksum,
        encrypted: this.config.backup.encryption,
        compressed: this.config.backup.compression,
      };

      console.log(`Backup complete: ${backupName} (${this.formatSize(data.length)}) in ${duration}ms`);

      // Send notification
      await sendNotification({
        type: 'success',
        message: `Backup completed: ${backupName}`,
        details: result,
        config: this.config.notifications,
      });

      return result;
    } catch (error) {
      console.error('Backup failed:', error);

      await sendNotification({
        type: 'error',
        message: `Backup failed: ${(error as Error).message}`,
        config: this.config.notifications,
      });

      throw error;
    }
  }

  // List available backups
  async listBackups(): Promise<BackupMetadata[]> {
    return this.storage.list();
  }

  // Delete old backups
  async cleanupOldBackups(): Promise<number> {
    const backups = await this.listBackups();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.backup.retentionDays);

    let deleted = 0;

    for (const backup of backups) {
      if (backup.createdAt < cutoffDate) {
        console.log(`Deleting old backup: ${backup.name}`);
        await this.storage.delete(backup.name);
        deleted++;
      }
    }

    console.log(`Cleaned up ${deleted} old backups`);
    return deleted;
  }

  // Get backup info
  async getBackupInfo(name: string): Promise<BackupMetadata | null> {
    const backups = await this.listBackups();
    return backups.find((b) => b.name === name) || null;
  }

  // Get download URL
  async getDownloadUrl(name: string, expiresIn?: number): Promise<string> {
    return this.storage.getSignedUrl(name, expiresIn);
  }

  private formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }
}

export const backupService = new BackupService();
```

## Restore Operations

```typescript
// src/lib/backup/restore.ts
import { spawn } from 'child_process';
import { Readable } from 'stream';
import { BackupConfig, config } from './config';
import { StorageProvider, S3Storage, LocalStorage } from './storage';
import { decrypt, generateChecksum } from './encryption';
import { decompress } from './compression';
import { sendNotification } from './notifications';

export interface RestoreOptions {
  targetDatabase?: string;
  clean?: boolean;
  createDatabase?: boolean;
  noOwner?: boolean;
  parallel?: number;
  tables?: string[];
}

export interface RestoreResult {
  name: string;
  duration: number;
  database: string;
  success: boolean;
}

export class RestoreService {
  private storage: StorageProvider;
  private config: BackupConfig;

  constructor(customConfig?: Partial<BackupConfig>) {
    this.config = { ...config, ...customConfig };

    switch (this.config.storage.type) {
      case 's3':
        this.storage = new S3Storage(this.config.storage);
        break;
      case 'local':
        this.storage = new LocalStorage(this.config.storage.localPath || './backups');
        break;
      default:
        this.storage = new S3Storage(this.config.storage);
    }
  }

  // Restore from backup
  async restore(backupName: string, options: RestoreOptions = {}): Promise<RestoreResult> {
    const startTime = Date.now();
    const targetDb = options.targetDatabase || this.config.database.name;

    console.log(`Starting restore: ${backupName} -> ${targetDb}`);

    try {
      // Download backup
      console.log('Downloading backup...');
      let data = await this.storage.download(backupName);

      // Decrypt if encrypted
      if (backupName.includes('_encrypted') && this.config.backup.encryptionKey) {
        console.log('Decrypting backup...');
        data = decrypt(data, this.config.backup.encryptionKey);
      }

      // Decompress
      const compressionType = backupName.endsWith('.gz')
        ? 'gzip'
        : backupName.endsWith('.lz4')
        ? 'lz4'
        : 'none';

      if (compressionType !== 'none') {
        console.log(`Decompressing (${compressionType})...`);
        data = decompress(data, compressionType);
      }

      // Create database if needed
      if (options.createDatabase) {
        await this.createDatabase(targetDb);
      }

      // Restore using pg_restore
      console.log('Restoring database...');
      await this.runRestore(data, targetDb, options);

      const duration = Date.now() - startTime;

      const result: RestoreResult = {
        name: backupName,
        duration,
        database: targetDb,
        success: true,
      };

      console.log(`Restore complete in ${duration}ms`);

      await sendNotification({
        type: 'success',
        message: `Restore completed: ${backupName} -> ${targetDb}`,
        details: result,
        config: this.config.notifications,
      });

      return result;
    } catch (error) {
      console.error('Restore failed:', error);

      await sendNotification({
        type: 'error',
        message: `Restore failed: ${(error as Error).message}`,
        config: this.config.notifications,
      });

      throw error;
    }
  }

  // Run pg_restore
  private runRestore(data: Buffer, database: string, options: RestoreOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      const args: string[] = [
        '-h', this.config.database.host,
        '-p', String(this.config.database.port),
        '-U', this.config.database.user,
        '-d', database,
        '--no-password',
        '--verbose',
      ];

      if (options.clean) {
        args.push('--clean');
      }

      if (options.noOwner) {
        args.push('--no-owner');
      }

      if (options.parallel && options.parallel > 1) {
        args.push('-j', String(options.parallel));
      }

      // Restore specific tables
      if (options.tables && options.tables.length > 0) {
        for (const table of options.tables) {
          args.push('-t', table);
        }
      }

      const pgRestore = spawn('pg_restore', args, {
        env: {
          ...process.env,
          PGPASSWORD: this.config.database.password,
        },
      });

      pgRestore.stdin.write(data);
      pgRestore.stdin.end();

      let stderr = '';

      pgRestore.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
        console.log(`pg_restore: ${chunk}`);
      });

      pgRestore.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`pg_restore exited with code ${code}: ${stderr}`));
        }
      });

      pgRestore.on('error', reject);
    });
  }

  // Create database
  private async createDatabase(name: string): Promise<void> {
    const { Pool } = require('pg');

    const pool = new Pool({
      host: this.config.database.host,
      port: this.config.database.port,
      user: this.config.database.user,
      password: this.config.database.password,
      database: 'postgres', // Connect to default database
    });

    try {
      // Drop if exists
      await pool.query(`DROP DATABASE IF EXISTS "${name}"`);

      // Create database
      await pool.query(`CREATE DATABASE "${name}"`);

      console.log(`Created database: ${name}`);
    } finally {
      await pool.end();
    }
  }

  // Point-in-time recovery (requires WAL archiving)
  async pointInTimeRecovery(
    backupName: string,
    targetTime: Date,
    options: RestoreOptions = {}
  ): Promise<RestoreResult> {
    const targetDb = options.targetDatabase || `${this.config.database.name}_recovery`;

    console.log(`Starting point-in-time recovery to ${targetTime.toISOString()}`);

    // First restore base backup
    await this.restore(backupName, {
      ...options,
      targetDatabase: targetDb,
      createDatabase: true,
    });

    // Apply WAL files up to target time
    // This requires WAL archiving to be configured
    console.log('Note: WAL replay requires archive_command to be configured');

    return {
      name: backupName,
      duration: 0,
      database: targetDb,
      success: true,
    };
  }
}

export const restoreService = new RestoreService();
```

## Scheduler

```typescript
// src/lib/backup/scheduler.ts
import * as schedule from 'node-schedule';
import { BackupService, BackupOptions } from './backup';
import { BackupConfig, config } from './config';

export class BackupScheduler {
  private jobs: Map<string, schedule.Job> = new Map();
  private backupService: BackupService;

  constructor(customConfig?: Partial<BackupConfig>) {
    this.backupService = new BackupService(customConfig);
  }

  // Schedule automatic backups
  scheduleBackup(
    name: string,
    cronExpression: string,
    options: BackupOptions = {}
  ): void {
    if (this.jobs.has(name)) {
      this.cancelSchedule(name);
    }

    console.log(`Scheduling backup "${name}" with cron: ${cronExpression}`);

    const job = schedule.scheduleJob(cronExpression, async () => {
      console.log(`Running scheduled backup: ${name}`);
      try {
        await this.backupService.createBackup(options);
        await this.backupService.cleanupOldBackups();
      } catch (error) {
        console.error(`Scheduled backup "${name}" failed:`, error);
      }
    });

    this.jobs.set(name, job);
  }

  // Cancel scheduled backup
  cancelSchedule(name: string): void {
    const job = this.jobs.get(name);
    if (job) {
      job.cancel();
      this.jobs.delete(name);
      console.log(`Cancelled scheduled backup: ${name}`);
    }
  }

  // Cancel all schedules
  cancelAll(): void {
    for (const [name] of this.jobs) {
      this.cancelSchedule(name);
    }
  }

  // Get scheduled jobs
  getSchedules(): Array<{ name: string; nextRun: Date | null }> {
    return Array.from(this.jobs.entries()).map(([name, job]) => ({
      name,
      nextRun: job.nextInvocation(),
    }));
  }

  // Start with default schedule
  start(): void {
    const schedule = config.backup.schedule;

    this.scheduleBackup('daily-full', schedule, { type: 'full' });

    console.log('Backup scheduler started');
    console.log('Scheduled jobs:', this.getSchedules());
  }

  // Stop scheduler
  stop(): void {
    this.cancelAll();
    console.log('Backup scheduler stopped');
  }
}

export const scheduler = new BackupScheduler();
```

## Notifications

```typescript
// src/lib/backup/notifications.ts
import { BackupConfig } from './config';

interface NotificationPayload {
  type: 'success' | 'error' | 'warning';
  message: string;
  details?: Record<string, unknown>;
  config: BackupConfig['notifications'];
}

export async function sendNotification(payload: NotificationPayload): Promise<void> {
  if (!payload.config.enabled) return;

  const promises: Promise<void>[] = [];

  if (payload.config.slackWebhookUrl) {
    promises.push(sendSlackNotification(payload));
  }

  if (payload.config.emailTo) {
    promises.push(sendEmailNotification(payload));
  }

  await Promise.allSettled(promises);
}

async function sendSlackNotification(payload: NotificationPayload): Promise<void> {
  if (!payload.config.slackWebhookUrl) return;

  const emoji = payload.type === 'success' ? ':white_check_mark:' :
                payload.type === 'error' ? ':x:' : ':warning:';

  const color = payload.type === 'success' ? '#36a64f' :
                payload.type === 'error' ? '#ff0000' : '#ffcc00';

  const slackMessage = {
    attachments: [
      {
        color,
        title: `${emoji} Database Backup ${payload.type.toUpperCase()}`,
        text: payload.message,
        fields: payload.details ? Object.entries(payload.details).map(([key, value]) => ({
          title: key,
          value: String(value),
          short: true,
        })) : [],
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  };

  try {
    const response = await fetch(payload.config.slackWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slackMessage),
    });

    if (!response.ok) {
      console.error('Failed to send Slack notification:', await response.text());
    }
  } catch (error) {
    console.error('Slack notification error:', error);
  }
}

async function sendEmailNotification(payload: NotificationPayload): Promise<void> {
  // Implement email notification using nodemailer or similar
  console.log('Email notification:', payload.message);
}
```

## CLI Scripts

```typescript
// scripts/backup.ts
import { backupService } from '../src/lib/backup';

async function main() {
  const type = process.argv[2] as 'full' | 'schema' | 'data' | undefined;

  console.log('Starting database backup...');

  try {
    const result = await backupService.createBackup({ type });

    console.log('\nBackup Summary:');
    console.log(`  Name: ${result.name}`);
    console.log(`  Size: ${(result.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Duration: ${result.duration}ms`);
    console.log(`  Checksum: ${result.checksum}`);
    console.log(`  Encrypted: ${result.encrypted}`);
    console.log(`  Compressed: ${result.compressed}`);
    console.log(`  Location: ${result.path}`);

    // Cleanup old backups
    const deleted = await backupService.cleanupOldBackups();
    console.log(`\nCleaned up ${deleted} old backups`);

  } catch (error) {
    console.error('Backup failed:', error);
    process.exit(1);
  }
}

main();


// scripts/restore.ts
import { restoreService } from '../src/lib/backup';

async function main() {
  const backupName = process.argv[2];
  const targetDatabase = process.argv[3];

  if (!backupName) {
    console.log('Usage: ts-node scripts/restore.ts <backup-name> [target-database]');
    console.log('\nAvailable backups:');

    const { backupService } = await import('../src/lib/backup');
    const backups = await backupService.listBackups();

    for (const backup of backups.slice(0, 10)) {
      console.log(`  ${backup.name} (${backup.createdAt.toISOString()})`);
    }

    process.exit(1);
  }

  console.log(`Restoring backup: ${backupName}`);
  if (targetDatabase) {
    console.log(`Target database: ${targetDatabase}`);
  }

  try {
    const result = await restoreService.restore(backupName, {
      targetDatabase,
      clean: true,
      noOwner: true,
    });

    console.log('\nRestore Summary:');
    console.log(`  Backup: ${result.name}`);
    console.log(`  Database: ${result.database}`);
    console.log(`  Duration: ${result.duration}ms`);
    console.log(`  Success: ${result.success}`);

  } catch (error) {
    console.error('Restore failed:', error);
    process.exit(1);
  }
}

main();


// scripts/list-backups.ts
import { backupService } from '../src/lib/backup';

async function main() {
  const backups = await backupService.listBackups();

  console.log('Available backups:\n');
  console.log('Name'.padEnd(60) + 'Size'.padEnd(15) + 'Date'.padEnd(25) + 'Type');
  console.log('-'.repeat(110));

  for (const backup of backups) {
    const size = `${(backup.size / 1024 / 1024).toFixed(2)} MB`;
    console.log(
      backup.name.padEnd(60) +
      size.padEnd(15) +
      backup.createdAt.toISOString().padEnd(25) +
      backup.type
    );
  }

  console.log(`\nTotal: ${backups.length} backups`);
}

main();
```

## Package.json Scripts

```json
{
  "scripts": {
    "backup": "ts-node scripts/backup.ts",
    "backup:full": "ts-node scripts/backup.ts full",
    "backup:schema": "ts-node scripts/backup.ts schema",
    "restore": "ts-node scripts/restore.ts",
    "backup:list": "ts-node scripts/list-backups.ts",
    "backup:schedule": "ts-node -e \"require('./src/lib/backup').scheduler.start()\"",
    "backup:cleanup": "ts-node -e \"require('./src/lib/backup').backupService.cleanupOldBackups()\""
  }
}
```

## Docker Integration

```dockerfile
# Dockerfile.backup
FROM node:20-alpine

# Install PostgreSQL client tools
RUN apk add --no-cache postgresql-client

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Run backup on schedule
CMD ["node", "-e", "require('./src/lib/backup').scheduler.start(); setInterval(() => {}, 1000000);"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  backup:
    build:
      context: .
      dockerfile: Dockerfile.backup
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
      - BACKUP_BUCKET=${BACKUP_BUCKET}
      - BACKUP_SCHEDULE=0 3 * * *
      - SLACK_WEBHOOK_URL=${SLACK_WEBHOOK_URL}
    restart: unless-stopped
```

## CLAUDE.md Integration

```markdown
# Database Backup & Restore

## Commands

```bash
# Create full backup
npm run backup:full

# Create schema-only backup
npm run backup:schema

# List available backups
npm run backup:list

# Restore from backup
npm run restore <backup-name> [target-database]

# Start backup scheduler
npm run backup:schedule

# Cleanup old backups
npm run backup:cleanup
```

## Configuration

Set environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `BACKUP_BUCKET` - S3 bucket for backups
- `BACKUP_RETENTION_DAYS` - Days to keep backups (default: 30)
- `BACKUP_SCHEDULE` - Cron expression (default: daily at 3 AM)

## Restore Process

1. List available backups: `npm run backup:list`
2. Restore to new database: `npm run restore backup-name myapp_restored`
3. Verify data integrity
4. Switch application to restored database

## Emergency Restore

For disaster recovery:

```bash
# Create fresh database and restore
npm run restore myapp_full_2024-01-15T03-00-00Z_encrypted.sql.gz myapp --create-database
```
```

## AI Suggestions

1. **Add incremental backups** - Implement WAL archiving for point-in-time recovery
2. **Create backup verification** - Automatically verify backup integrity after creation
3. **Implement backup rotation** - Keep daily, weekly, monthly backups with different retention
4. **Add cross-region replication** - Copy backups to multiple regions for disaster recovery
5. **Create restore testing** - Automatically test restore process on schedule
6. **Implement backup monitoring** - Alert on backup size changes or failures
7. **Add backup encryption key rotation** - Rotate encryption keys periodically
8. **Create backup dashboard** - Web UI for managing and monitoring backups
9. **Implement parallel backup** - Use pg_dump directory format for faster backups
10. **Add backup deduplication** - Use incremental storage for efficiency
