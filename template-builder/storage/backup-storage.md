# Backup Storage

Production-ready backup storage patterns with automated backups, retention policies, and disaster recovery.

## Overview

Comprehensive backup strategies for databases, files, and application data with scheduling, versioning, incremental backups, and multi-destination support.

## Quick Start

```bash
npm install @aws-sdk/client-s3 node-cron archiver pg-dump-restore
pip install boto3 schedule python-dateutil
```

## TypeScript Implementation

### Backup Service

```typescript
// src/backup/backup-service.ts
import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import archiver from 'archiver';
import { createReadStream, createWriteStream } from 'fs';
import { mkdir, readdir, stat, unlink, rm } from 'fs/promises';
import path from 'path';
import { Readable, PassThrough } from 'stream';
import { exec } from 'child_process';
import { promisify } from 'util';
import cron from 'node-cron';

const execAsync = promisify(exec);

interface BackupConfig {
  provider: 's3' | 'local' | 'both';
  s3?: {
    bucket: string;
    region: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    prefix?: string;
  };
  local?: {
    path: string;
    maxBackups?: number;
  };
  encryption?: {
    enabled: boolean;
    key?: string;
  };
}

interface RetentionPolicy {
  daily: number;
  weekly: number;
  monthly: number;
  yearly: number;
}

interface BackupResult {
  id: string;
  type: string;
  size: number;
  location: string;
  createdAt: Date;
  checksum?: string;
}

interface BackupMetadata {
  id: string;
  type: string;
  source: string;
  createdAt: string;
  size: number;
  checksum: string;
  compressed: boolean;
  encrypted: boolean;
}

export class BackupService {
  private config: BackupConfig;
  private s3Client?: S3Client;
  private scheduledJobs: Map<string, cron.ScheduledTask> = new Map();

  constructor(config: BackupConfig) {
    this.config = config;

    if (config.provider === 's3' || config.provider === 'both') {
      this.s3Client = new S3Client({
        region: config.s3?.region || 'us-east-1',
        ...(config.s3?.accessKeyId && config.s3?.secretAccessKey && {
          credentials: {
            accessKeyId: config.s3.accessKeyId,
            secretAccessKey: config.s3.secretAccessKey,
          },
        }),
      });
    }
  }

  // Backup directory
  async backupDirectory(
    sourcePath: string,
    backupName: string,
    options?: { compress?: boolean; exclude?: string[] }
  ): Promise<BackupResult> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupId = `${backupName}-${timestamp}`;
    const filename = options?.compress ? `${backupId}.tar.gz` : backupId;

    if (options?.compress) {
      return this.createCompressedBackup(sourcePath, backupId, options.exclude);
    }

    // Copy directory structure
    const results: BackupResult[] = [];

    const walkDir = async (dir: string, prefix: string = ''): Promise<void> => {
      const entries = await readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.join(prefix, entry.name);

        if (options?.exclude?.some((pattern) => fullPath.includes(pattern))) {
          continue;
        }

        if (entry.isDirectory()) {
          await walkDir(fullPath, relativePath);
        } else {
          await this.uploadFile(fullPath, `${backupId}/${relativePath}`);
        }
      }
    };

    await walkDir(sourcePath);

    const stats = await stat(sourcePath);

    return {
      id: backupId,
      type: 'directory',
      size: stats.size,
      location: this.getBackupLocation(backupId),
      createdAt: new Date(),
    };
  }

  // Backup PostgreSQL database
  async backupPostgres(
    connectionString: string,
    backupName: string
  ): Promise<BackupResult> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupId = `${backupName}-${timestamp}`;
    const tempFile = `/tmp/${backupId}.sql.gz`;

    try {
      // Create compressed pg_dump
      await execAsync(
        `pg_dump "${connectionString}" | gzip > "${tempFile}"`,
        { maxBuffer: 1024 * 1024 * 100 }
      );

      const stats = await stat(tempFile);

      // Upload to storage
      await this.uploadFile(tempFile, `${backupId}.sql.gz`);

      return {
        id: backupId,
        type: 'postgres',
        size: stats.size,
        location: this.getBackupLocation(`${backupId}.sql.gz`),
        createdAt: new Date(),
      };
    } finally {
      // Cleanup temp file
      await unlink(tempFile).catch(() => {});
    }
  }

  // Backup MySQL database
  async backupMySQL(
    host: string,
    user: string,
    password: string,
    database: string,
    backupName: string
  ): Promise<BackupResult> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupId = `${backupName}-${timestamp}`;
    const tempFile = `/tmp/${backupId}.sql.gz`;

    try {
      await execAsync(
        `mysqldump -h "${host}" -u "${user}" -p"${password}" "${database}" | gzip > "${tempFile}"`,
        { maxBuffer: 1024 * 1024 * 100 }
      );

      const stats = await stat(tempFile);

      await this.uploadFile(tempFile, `${backupId}.sql.gz`);

      return {
        id: backupId,
        type: 'mysql',
        size: stats.size,
        location: this.getBackupLocation(`${backupId}.sql.gz`),
        createdAt: new Date(),
      };
    } finally {
      await unlink(tempFile).catch(() => {});
    }
  }

  // Backup MongoDB
  async backupMongoDB(
    connectionString: string,
    backupName: string
  ): Promise<BackupResult> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupId = `${backupName}-${timestamp}`;
    const tempDir = `/tmp/${backupId}`;
    const archivePath = `/tmp/${backupId}.archive`;

    try {
      await execAsync(
        `mongodump --uri="${connectionString}" --archive="${archivePath}" --gzip`,
        { maxBuffer: 1024 * 1024 * 100 }
      );

      const stats = await stat(archivePath);

      await this.uploadFile(archivePath, `${backupId}.archive`);

      return {
        id: backupId,
        type: 'mongodb',
        size: stats.size,
        location: this.getBackupLocation(`${backupId}.archive`),
        createdAt: new Date(),
      };
    } finally {
      await unlink(archivePath).catch(() => {});
      await rm(tempDir, { recursive: true }).catch(() => {});
    }
  }

  // Create compressed backup
  private async createCompressedBackup(
    sourcePath: string,
    backupId: string,
    exclude?: string[]
  ): Promise<BackupResult> {
    const passThrough = new PassThrough();

    const archive = archiver('tar', {
      gzip: true,
      gzipOptions: { level: 9 },
    });

    archive.pipe(passThrough);

    archive.directory(sourcePath, false, (entry) => {
      if (exclude?.some((pattern) => entry.name.includes(pattern))) {
        return false;
      }
      return entry;
    });

    archive.finalize();

    const filename = `${backupId}.tar.gz`;
    let size = 0;

    // Upload stream
    if (this.config.provider === 's3' || this.config.provider === 'both') {
      const upload = new Upload({
        client: this.s3Client!,
        params: {
          Bucket: this.config.s3!.bucket,
          Key: `${this.config.s3?.prefix || 'backups'}/${filename}`,
          Body: passThrough,
          ContentType: 'application/gzip',
        },
      });

      const result = await upload.done();
      size = archive.pointer();
    }

    // Also save locally if configured
    if (this.config.provider === 'local' || this.config.provider === 'both') {
      await this.saveLocally(passThrough, filename);
    }

    return {
      id: backupId,
      type: 'directory-compressed',
      size,
      location: this.getBackupLocation(filename),
      createdAt: new Date(),
    };
  }

  // Upload file to storage
  private async uploadFile(localPath: string, key: string): Promise<void> {
    const stream = createReadStream(localPath);

    if (this.config.provider === 's3' || this.config.provider === 'both') {
      const upload = new Upload({
        client: this.s3Client!,
        params: {
          Bucket: this.config.s3!.bucket,
          Key: `${this.config.s3?.prefix || 'backups'}/${key}`,
          Body: stream,
        },
      });

      await upload.done();
    }

    if (this.config.provider === 'local' || this.config.provider === 'both') {
      await this.saveLocally(createReadStream(localPath), key);
    }
  }

  // Save to local storage
  private async saveLocally(
    stream: Readable,
    filename: string
  ): Promise<void> {
    const localPath = this.config.local?.path || './backups';
    await mkdir(localPath, { recursive: true });

    const destPath = path.join(localPath, filename);
    const writeStream = createWriteStream(destPath);

    await new Promise<void>((resolve, reject) => {
      stream.pipe(writeStream);
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });
  }

  // List backups
  async listBackups(prefix?: string): Promise<BackupMetadata[]> {
    const backups: BackupMetadata[] = [];

    if (this.config.provider === 's3' || this.config.provider === 'both') {
      const s3Backups = await this.listS3Backups(prefix);
      backups.push(...s3Backups);
    }

    if (this.config.provider === 'local' || this.config.provider === 'both') {
      const localBackups = await this.listLocalBackups(prefix);
      backups.push(...localBackups);
    }

    // Deduplicate and sort by date
    const unique = new Map<string, BackupMetadata>();
    backups.forEach((b) => unique.set(b.id, b));

    return Array.from(unique.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  private async listS3Backups(prefix?: string): Promise<BackupMetadata[]> {
    const command = new ListObjectsV2Command({
      Bucket: this.config.s3!.bucket,
      Prefix: prefix
        ? `${this.config.s3?.prefix || 'backups'}/${prefix}`
        : this.config.s3?.prefix || 'backups',
    });

    const response = await this.s3Client!.send(command);

    return (response.Contents || []).map((obj) => ({
      id: path.basename(obj.Key || ''),
      type: this.inferBackupType(obj.Key || ''),
      source: 's3',
      createdAt: obj.LastModified?.toISOString() || new Date().toISOString(),
      size: obj.Size || 0,
      checksum: obj.ETag?.replace(/"/g, '') || '',
      compressed: obj.Key?.endsWith('.gz') || obj.Key?.endsWith('.archive') || false,
      encrypted: false,
    }));
  }

  private async listLocalBackups(prefix?: string): Promise<BackupMetadata[]> {
    const localPath = this.config.local?.path || './backups';

    try {
      const files = await readdir(localPath);
      const backups: BackupMetadata[] = [];

      for (const file of files) {
        if (prefix && !file.startsWith(prefix)) continue;

        const filePath = path.join(localPath, file);
        const stats = await stat(filePath);

        backups.push({
          id: file,
          type: this.inferBackupType(file),
          source: 'local',
          createdAt: stats.mtime.toISOString(),
          size: stats.size,
          checksum: '',
          compressed: file.endsWith('.gz') || file.endsWith('.archive'),
          encrypted: false,
        });
      }

      return backups;
    } catch {
      return [];
    }
  }

  // Apply retention policy
  async applyRetentionPolicy(
    backupPrefix: string,
    policy: RetentionPolicy
  ): Promise<{ deleted: string[]; kept: string[] }> {
    const backups = await this.listBackups(backupPrefix);
    const now = new Date();

    const toKeep = new Set<string>();
    const toDelete: string[] = [];

    // Categorize backups by age
    for (const backup of backups) {
      const age = now.getTime() - new Date(backup.createdAt).getTime();
      const days = age / (1000 * 60 * 60 * 24);
      const weeks = days / 7;
      const months = days / 30;
      const years = days / 365;

      // Keep based on retention policy
      if (days <= policy.daily) {
        toKeep.add(backup.id);
      } else if (weeks <= policy.weekly && this.isWeeklyBackup(backup.createdAt)) {
        toKeep.add(backup.id);
      } else if (months <= policy.monthly && this.isMonthlyBackup(backup.createdAt)) {
        toKeep.add(backup.id);
      } else if (years <= policy.yearly && this.isYearlyBackup(backup.createdAt)) {
        toKeep.add(backup.id);
      }
    }

    // Delete backups not in toKeep
    for (const backup of backups) {
      if (!toKeep.has(backup.id)) {
        await this.deleteBackup(backup.id);
        toDelete.push(backup.id);
      }
    }

    return {
      deleted: toDelete,
      kept: Array.from(toKeep),
    };
  }

  // Delete backup
  async deleteBackup(backupId: string): Promise<void> {
    if (this.config.provider === 's3' || this.config.provider === 'both') {
      const command = new DeleteObjectsCommand({
        Bucket: this.config.s3!.bucket,
        Delete: {
          Objects: [
            { Key: `${this.config.s3?.prefix || 'backups'}/${backupId}` },
          ],
        },
      });

      await this.s3Client!.send(command);
    }

    if (this.config.provider === 'local' || this.config.provider === 'both') {
      const localPath = path.join(
        this.config.local?.path || './backups',
        backupId
      );
      await unlink(localPath).catch(() => {});
    }
  }

  // Restore backup
  async restoreBackup(
    backupId: string,
    destinationPath: string
  ): Promise<void> {
    // Download from storage
    const tempPath = `/tmp/${backupId}`;

    if (this.config.provider === 's3' || this.config.provider === 'both') {
      const command = new GetObjectCommand({
        Bucket: this.config.s3!.bucket,
        Key: `${this.config.s3?.prefix || 'backups'}/${backupId}`,
      });

      const response = await this.s3Client!.send(command);
      const writeStream = createWriteStream(tempPath);

      await new Promise<void>((resolve, reject) => {
        (response.Body as Readable).pipe(writeStream);
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });
    } else {
      // Copy from local
      const sourcePath = path.join(
        this.config.local?.path || './backups',
        backupId
      );
      await execAsync(`cp "${sourcePath}" "${tempPath}"`);
    }

    // Decompress if needed
    if (backupId.endsWith('.tar.gz')) {
      await mkdir(destinationPath, { recursive: true });
      await execAsync(`tar -xzf "${tempPath}" -C "${destinationPath}"`);
    } else if (backupId.endsWith('.sql.gz')) {
      await execAsync(`gunzip -c "${tempPath}" > "${destinationPath}"`);
    } else {
      await execAsync(`cp "${tempPath}" "${destinationPath}"`);
    }

    // Cleanup
    await unlink(tempPath).catch(() => {});
  }

  // Schedule backup
  schedule(
    name: string,
    cronExpression: string,
    backupFn: () => Promise<BackupResult>
  ): void {
    const task = cron.schedule(cronExpression, async () => {
      try {
        console.log(`Starting scheduled backup: ${name}`);
        const result = await backupFn();
        console.log(`Backup completed: ${result.id} (${result.size} bytes)`);
      } catch (error) {
        console.error(`Backup failed: ${name}`, error);
      }
    });

    this.scheduledJobs.set(name, task);
  }

  // Cancel scheduled backup
  cancelSchedule(name: string): void {
    const task = this.scheduledJobs.get(name);
    if (task) {
      task.stop();
      this.scheduledJobs.delete(name);
    }
  }

  private inferBackupType(filename: string): string {
    if (filename.includes('.sql')) return 'database';
    if (filename.includes('.archive')) return 'mongodb';
    if (filename.endsWith('.tar.gz')) return 'directory';
    return 'file';
  }

  private getBackupLocation(key: string): string {
    if (this.config.provider === 's3' || this.config.provider === 'both') {
      return `s3://${this.config.s3!.bucket}/${this.config.s3?.prefix || 'backups'}/${key}`;
    }
    return path.join(this.config.local?.path || './backups', key);
  }

  private isWeeklyBackup(dateStr: string): boolean {
    const date = new Date(dateStr);
    return date.getDay() === 0; // Sunday
  }

  private isMonthlyBackup(dateStr: string): boolean {
    const date = new Date(dateStr);
    return date.getDate() === 1;
  }

  private isYearlyBackup(dateStr: string): boolean {
    const date = new Date(dateStr);
    return date.getMonth() === 0 && date.getDate() === 1;
  }
}

// Factory function
export function createBackupService(config: BackupConfig): BackupService {
  return new BackupService(config);
}
```

### Express Routes

```typescript
// src/routes/backup.ts
import { Router, Request, Response } from 'express';
import { createBackupService } from '../backup/backup-service';

const router = Router();

const backupService = createBackupService({
  provider: 'both',
  s3: {
    bucket: process.env.BACKUP_BUCKET || 'backups',
    region: process.env.AWS_REGION || 'us-east-1',
    prefix: 'app-backups',
  },
  local: {
    path: './backups',
    maxBackups: 10,
  },
});

// Backup directory
router.post('/directory', async (req: Request, res: Response) => {
  try {
    const { path: sourcePath, name, compress, exclude } = req.body;

    if (!sourcePath || !name) {
      return res.status(400).json({ error: 'path and name required' });
    }

    const result = await backupService.backupDirectory(sourcePath, name, {
      compress,
      exclude,
    });

    res.json(result);
  } catch (error) {
    console.error('Backup error:', error);
    res.status(500).json({ error: 'Backup failed' });
  }
});

// Backup PostgreSQL
router.post('/postgres', async (req: Request, res: Response) => {
  try {
    const { connectionString, name } = req.body;

    if (!connectionString || !name) {
      return res.status(400).json({ error: 'connectionString and name required' });
    }

    const result = await backupService.backupPostgres(connectionString, name);
    res.json(result);
  } catch (error) {
    console.error('Postgres backup error:', error);
    res.status(500).json({ error: 'Backup failed' });
  }
});

// Backup MongoDB
router.post('/mongodb', async (req: Request, res: Response) => {
  try {
    const { connectionString, name } = req.body;

    if (!connectionString || !name) {
      return res.status(400).json({ error: 'connectionString and name required' });
    }

    const result = await backupService.backupMongoDB(connectionString, name);
    res.json(result);
  } catch (error) {
    console.error('MongoDB backup error:', error);
    res.status(500).json({ error: 'Backup failed' });
  }
});

// List backups
router.get('/', async (req: Request, res: Response) => {
  try {
    const { prefix } = req.query;
    const backups = await backupService.listBackups(prefix as string);
    res.json({ backups });
  } catch (error) {
    console.error('List backups error:', error);
    res.status(500).json({ error: 'Failed to list backups' });
  }
});

// Delete backup
router.delete('/:backupId', async (req: Request, res: Response) => {
  try {
    const { backupId } = req.params;
    await backupService.deleteBackup(backupId);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete backup error:', error);
    res.status(500).json({ error: 'Failed to delete backup' });
  }
});

// Restore backup
router.post('/restore', async (req: Request, res: Response) => {
  try {
    const { backupId, destinationPath } = req.body;

    if (!backupId || !destinationPath) {
      return res.status(400).json({ error: 'backupId and destinationPath required' });
    }

    await backupService.restoreBackup(backupId, destinationPath);
    res.json({ success: true });
  } catch (error) {
    console.error('Restore error:', error);
    res.status(500).json({ error: 'Restore failed' });
  }
});

// Apply retention policy
router.post('/retention', async (req: Request, res: Response) => {
  try {
    const { prefix, policy } = req.body;

    if (!prefix || !policy) {
      return res.status(400).json({ error: 'prefix and policy required' });
    }

    const result = await backupService.applyRetentionPolicy(prefix, policy);
    res.json(result);
  } catch (error) {
    console.error('Retention policy error:', error);
    res.status(500).json({ error: 'Failed to apply retention policy' });
  }
});

export default router;
```

## Python Implementation

```python
# backup/backup_service.py
import boto3
from botocore.config import Config
from typing import Optional, List, Dict, Any
from dataclasses import dataclass
from datetime import datetime, timedelta
import subprocess
import os
import shutil
import tarfile
import gzip
import schedule
import time
import threading
from pathlib import Path


@dataclass
class BackupResult:
    id: str
    type: str
    size: int
    location: str
    created_at: datetime


@dataclass
class BackupMetadata:
    id: str
    type: str
    source: str
    created_at: datetime
    size: int
    compressed: bool


@dataclass
class RetentionPolicy:
    daily: int = 7
    weekly: int = 4
    monthly: int = 12
    yearly: int = 3


class BackupService:
    def __init__(
        self,
        bucket: Optional[str] = None,
        local_path: str = './backups',
        region: str = 'us-east-1',
        prefix: str = 'backups',
    ):
        self.bucket = bucket
        self.local_path = Path(local_path)
        self.prefix = prefix

        if bucket:
            config = Config(retries={'max_attempts': 3})
            self.s3_client = boto3.client('s3', region_name=region, config=config)

        self.local_path.mkdir(parents=True, exist_ok=True)
        self._scheduled_jobs: Dict[str, bool] = {}

    def backup_directory(
        self,
        source_path: str,
        backup_name: str,
        compress: bool = True,
        exclude: Optional[List[str]] = None,
    ) -> BackupResult:
        """Backup directory with optional compression."""
        timestamp = datetime.now().strftime('%Y%m%d-%H%M%S')
        backup_id = f'{backup_name}-{timestamp}'

        if compress:
            archive_path = self.local_path / f'{backup_id}.tar.gz'

            with tarfile.open(archive_path, 'w:gz') as tar:
                for root, dirs, files in os.walk(source_path):
                    # Apply exclusions
                    if exclude:
                        dirs[:] = [d for d in dirs if d not in exclude]
                        files = [f for f in files if f not in exclude]

                    for file in files:
                        file_path = os.path.join(root, file)
                        arcname = os.path.relpath(file_path, source_path)
                        tar.add(file_path, arcname=arcname)

            size = archive_path.stat().st_size

            # Upload to S3 if configured
            if self.bucket:
                self._upload_to_s3(str(archive_path), f'{backup_id}.tar.gz')

            return BackupResult(
                id=backup_id,
                type='directory',
                size=size,
                location=str(archive_path),
                created_at=datetime.now()
            )
        else:
            # Copy without compression
            dest_path = self.local_path / backup_id
            shutil.copytree(source_path, dest_path, ignore=shutil.ignore_patterns(*exclude) if exclude else None)

            size = sum(f.stat().st_size for f in dest_path.rglob('*') if f.is_file())

            return BackupResult(
                id=backup_id,
                type='directory',
                size=size,
                location=str(dest_path),
                created_at=datetime.now()
            )

    def backup_postgres(
        self,
        connection_string: str,
        backup_name: str,
    ) -> BackupResult:
        """Backup PostgreSQL database."""
        timestamp = datetime.now().strftime('%Y%m%d-%H%M%S')
        backup_id = f'{backup_name}-{timestamp}'
        backup_path = self.local_path / f'{backup_id}.sql.gz'

        # Run pg_dump with compression
        cmd = f'pg_dump "{connection_string}" | gzip > "{backup_path}"'
        subprocess.run(cmd, shell=True, check=True)

        size = backup_path.stat().st_size

        if self.bucket:
            self._upload_to_s3(str(backup_path), f'{backup_id}.sql.gz')

        return BackupResult(
            id=backup_id,
            type='postgres',
            size=size,
            location=str(backup_path),
            created_at=datetime.now()
        )

    def backup_mysql(
        self,
        host: str,
        user: str,
        password: str,
        database: str,
        backup_name: str,
    ) -> BackupResult:
        """Backup MySQL database."""
        timestamp = datetime.now().strftime('%Y%m%d-%H%M%S')
        backup_id = f'{backup_name}-{timestamp}'
        backup_path = self.local_path / f'{backup_id}.sql.gz'

        cmd = f'mysqldump -h "{host}" -u "{user}" -p"{password}" "{database}" | gzip > "{backup_path}"'
        subprocess.run(cmd, shell=True, check=True)

        size = backup_path.stat().st_size

        if self.bucket:
            self._upload_to_s3(str(backup_path), f'{backup_id}.sql.gz')

        return BackupResult(
            id=backup_id,
            type='mysql',
            size=size,
            location=str(backup_path),
            created_at=datetime.now()
        )

    def backup_mongodb(
        self,
        connection_string: str,
        backup_name: str,
    ) -> BackupResult:
        """Backup MongoDB database."""
        timestamp = datetime.now().strftime('%Y%m%d-%H%M%S')
        backup_id = f'{backup_name}-{timestamp}'
        backup_path = self.local_path / f'{backup_id}.archive'

        cmd = f'mongodump --uri="{connection_string}" --archive="{backup_path}" --gzip'
        subprocess.run(cmd, shell=True, check=True)

        size = backup_path.stat().st_size

        if self.bucket:
            self._upload_to_s3(str(backup_path), f'{backup_id}.archive')

        return BackupResult(
            id=backup_id,
            type='mongodb',
            size=size,
            location=str(backup_path),
            created_at=datetime.now()
        )

    def list_backups(self, prefix: Optional[str] = None) -> List[BackupMetadata]:
        """List all backups."""
        backups = []

        # List local backups
        for item in self.local_path.iterdir():
            if prefix and not item.name.startswith(prefix):
                continue

            backups.append(BackupMetadata(
                id=item.name,
                type=self._infer_type(item.name),
                source='local',
                created_at=datetime.fromtimestamp(item.stat().st_mtime),
                size=item.stat().st_size if item.is_file() else 0,
                compressed=item.suffix in ('.gz', '.archive')
            ))

        # List S3 backups
        if self.bucket:
            s3_prefix = f'{self.prefix}/{prefix}' if prefix else self.prefix
            response = self.s3_client.list_objects_v2(
                Bucket=self.bucket,
                Prefix=s3_prefix
            )

            for obj in response.get('Contents', []):
                key = obj['Key'].split('/')[-1]
                backups.append(BackupMetadata(
                    id=key,
                    type=self._infer_type(key),
                    source='s3',
                    created_at=obj['LastModified'],
                    size=obj['Size'],
                    compressed=key.endswith('.gz') or key.endswith('.archive')
                ))

        return sorted(backups, key=lambda b: b.created_at, reverse=True)

    def delete_backup(self, backup_id: str) -> None:
        """Delete a backup."""
        # Delete local
        local_path = self.local_path / backup_id
        if local_path.exists():
            if local_path.is_dir():
                shutil.rmtree(local_path)
            else:
                local_path.unlink()

        # Delete from S3
        if self.bucket:
            self.s3_client.delete_object(
                Bucket=self.bucket,
                Key=f'{self.prefix}/{backup_id}'
            )

    def restore_backup(self, backup_id: str, destination: str) -> None:
        """Restore a backup."""
        # Find backup
        local_path = self.local_path / backup_id

        if not local_path.exists() and self.bucket:
            # Download from S3
            self.s3_client.download_file(
                self.bucket,
                f'{self.prefix}/{backup_id}',
                str(local_path)
            )

        # Restore based on type
        if backup_id.endswith('.tar.gz'):
            with tarfile.open(local_path, 'r:gz') as tar:
                tar.extractall(destination)
        elif backup_id.endswith('.sql.gz'):
            with gzip.open(local_path, 'rb') as f_in:
                with open(destination, 'wb') as f_out:
                    shutil.copyfileobj(f_in, f_out)
        else:
            shutil.copy2(local_path, destination)

    def apply_retention_policy(
        self,
        prefix: str,
        policy: RetentionPolicy
    ) -> Dict[str, List[str]]:
        """Apply retention policy to backups."""
        backups = self.list_backups(prefix)
        now = datetime.now()

        to_keep = set()
        to_delete = []

        for backup in backups:
            age = now - backup.created_at
            days = age.days

            if days <= policy.daily:
                to_keep.add(backup.id)
            elif days <= policy.weekly * 7 and backup.created_at.weekday() == 6:
                to_keep.add(backup.id)
            elif days <= policy.monthly * 30 and backup.created_at.day == 1:
                to_keep.add(backup.id)
            elif days <= policy.yearly * 365 and backup.created_at.timetuple().tm_yday == 1:
                to_keep.add(backup.id)

        for backup in backups:
            if backup.id not in to_keep:
                self.delete_backup(backup.id)
                to_delete.append(backup.id)

        return {'kept': list(to_keep), 'deleted': to_delete}

    def schedule_backup(
        self,
        name: str,
        cron_expression: str,
        backup_fn,
    ) -> None:
        """Schedule recurring backup."""
        # Parse simple cron (hour, minute)
        parts = cron_expression.split()
        if len(parts) >= 2:
            minute, hour = parts[0], parts[1]
            schedule.every().day.at(f'{hour}:{minute}').do(backup_fn).tag(name)

        self._scheduled_jobs[name] = True

    def _upload_to_s3(self, local_path: str, key: str) -> None:
        """Upload file to S3."""
        self.s3_client.upload_file(
            local_path,
            self.bucket,
            f'{self.prefix}/{key}'
        )

    def _infer_type(self, filename: str) -> str:
        """Infer backup type from filename."""
        if '.sql' in filename:
            return 'database'
        if '.archive' in filename:
            return 'mongodb'
        if filename.endswith('.tar.gz'):
            return 'directory'
        return 'file'


# FastAPI integration
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()
backup_service = BackupService(
    bucket=os.environ.get('BACKUP_BUCKET'),
    local_path='./backups'
)


class DirectoryBackupRequest(BaseModel):
    path: str
    name: str
    compress: bool = True
    exclude: Optional[List[str]] = None


class PostgresBackupRequest(BaseModel):
    connection_string: str
    name: str


@app.post('/backup/directory')
async def backup_directory(request: DirectoryBackupRequest):
    result = backup_service.backup_directory(
        request.path,
        request.name,
        request.compress,
        request.exclude
    )
    return result.__dict__


@app.post('/backup/postgres')
async def backup_postgres(request: PostgresBackupRequest):
    result = backup_service.backup_postgres(
        request.connection_string,
        request.name
    )
    return result.__dict__


@app.get('/backups')
async def list_backups(prefix: Optional[str] = None):
    backups = backup_service.list_backups(prefix)
    return {'backups': [b.__dict__ for b in backups]}


@app.delete('/backup/{backup_id}')
async def delete_backup(backup_id: str):
    backup_service.delete_backup(backup_id)
    return {'success': True}
```

## CLAUDE.md Integration

```markdown
## Backup Commands

### Create Backups
- "backup directory" - Archive folder with compression
- "backup database" - PostgreSQL/MySQL/MongoDB dump
- "backup files" - Copy files to backup location

### Manage Backups
- "list backups" - Show available backups
- "delete old backups" - Apply retention policy
- "restore backup" - Recover from backup

### Scheduling
- "schedule daily backup" - Set up recurring backup
- "cancel scheduled backup" - Remove backup schedule
- "view backup schedule" - List scheduled jobs

### Retention
- "apply retention policy" - Clean old backups
- "configure retention" - Set daily/weekly/monthly limits
```

## AI Suggestions

1. **"Implement incremental backups"** - Only backup changed files
2. **"Add backup encryption"** - AES-256 encryption at rest
3. **"Implement point-in-time recovery"** - Database PITR
4. **"Add backup verification"** - Checksum validation
5. **"Implement cross-region replication"** - Geo-redundancy
6. **"Add backup notifications"** - Email/Slack alerts
7. **"Implement backup compression levels"** - Configurable compression
8. **"Add backup deduplication"** - Storage optimization
9. **"Implement disaster recovery testing"** - Automated restore tests
10. **"Add backup monitoring dashboard"** - Status visualization
