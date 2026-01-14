# Digital Asset Management (DAM)

## Overview
Enterprise-grade digital asset management system for organizing, versioning, and distributing media assets with metadata, tagging, and access control.

## Quick Start

```bash
npm install uuid sharp mime-types better-sqlite3 lunr
```

## Full Implementation

### TypeScript DAM System

```typescript
// dam/types.ts
export interface Asset {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number;
  metadata: AssetMetadata;
  tags: string[];
  folderId: string | null;
  version: number;
  status: 'draft' | 'active' | 'archived';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssetMetadata {
  title?: string;
  description?: string;
  alt?: string;
  copyright?: string;
  author?: string;
  exif?: Record<string, any>;
  customFields: Record<string, string | number | boolean>;
}

export interface AssetVersion {
  id: string;
  assetId: string;
  version: number;
  filename: string;
  size: number;
  changes: string;
  createdBy: string;
  createdAt: Date;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  path: string;
  permissions: FolderPermission[];
  createdAt: Date;
}

export interface FolderPermission {
  userId?: string;
  groupId?: string;
  permission: 'view' | 'download' | 'edit' | 'admin';
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  assetIds: string[];
  isPublic: boolean;
  shareToken?: string;
  createdBy: string;
  createdAt: Date;
}

export interface AssetSearchOptions {
  query?: string;
  tags?: string[];
  mimeTypes?: string[];
  folderId?: string;
  status?: Asset['status'];
  dateRange?: { start: Date; end: Date };
  sizeRange?: { min: number; max: number };
  sortBy?: 'name' | 'date' | 'size' | 'relevance';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface Rendition {
  id: string;
  assetId: string;
  name: string;
  filename: string;
  mimeType: string;
  width?: number;
  height?: number;
  size: number;
  profile: string;
}
```

### DAM Core Service

```typescript
// dam/dam-service.ts
import { v4 as uuidv4 } from 'uuid';
import * as sharp from 'sharp';
import * as mime from 'mime-types';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as lunr from 'lunr';
import {
  Asset,
  AssetVersion,
  Folder,
  Collection,
  AssetSearchOptions,
  Rendition,
  AssetMetadata
} from './types';

interface RenditionProfile {
  name: string;
  width?: number;
  height?: number;
  format?: 'jpeg' | 'png' | 'webp' | 'avif';
  quality?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

interface DAMConfig {
  storagePath: string;
  renditionProfiles: RenditionProfile[];
  maxFileSize: number;
  allowedMimeTypes: string[];
  extractMetadata: boolean;
  generateRenditions: boolean;
}

export class DigitalAssetManager {
  private config: DAMConfig;
  private assets: Map<string, Asset> = new Map();
  private versions: Map<string, AssetVersion[]> = new Map();
  private folders: Map<string, Folder> = new Map();
  private collections: Map<string, Collection> = new Map();
  private renditions: Map<string, Rendition[]> = new Map();
  private searchIndex: lunr.Index;

  constructor(config: Partial<DAMConfig> = {}) {
    this.config = {
      storagePath: config.storagePath || './dam-storage',
      maxFileSize: config.maxFileSize || 500 * 1024 * 1024, // 500MB
      allowedMimeTypes: config.allowedMimeTypes || [
        'image/*', 'video/*', 'audio/*',
        'application/pdf', 'application/zip'
      ],
      extractMetadata: config.extractMetadata ?? true,
      generateRenditions: config.generateRenditions ?? true,
      renditionProfiles: config.renditionProfiles || [
        { name: 'thumbnail', width: 150, height: 150, format: 'webp', quality: 80 },
        { name: 'preview', width: 800, height: 600, format: 'webp', quality: 85 },
        { name: 'web', width: 1920, height: 1080, format: 'webp', quality: 90 },
        { name: 'print', width: 3000, format: 'jpeg', quality: 95 }
      ]
    };

    this.initializeSearchIndex();
    this.initializeStorage();
  }

  private async initializeStorage(): Promise<void> {
    const dirs = ['assets', 'renditions', 'versions', 'temp'];
    for (const dir of dirs) {
      await fs.mkdir(path.join(this.config.storagePath, dir), { recursive: true });
    }
  }

  private initializeSearchIndex(): void {
    this.searchIndex = lunr(function() {
      this.ref('id');
      this.field('filename', { boost: 10 });
      this.field('title', { boost: 8 });
      this.field('description', { boost: 5 });
      this.field('tags', { boost: 7 });
      this.field('alt', { boost: 3 });
    });
  }

  private rebuildSearchIndex(): void {
    const builder = new lunr.Builder();
    builder.ref('id');
    builder.field('filename', { boost: 10 });
    builder.field('title', { boost: 8 });
    builder.field('description', { boost: 5 });
    builder.field('tags', { boost: 7 });
    builder.field('alt', { boost: 3 });

    for (const asset of this.assets.values()) {
      builder.add({
        id: asset.id,
        filename: asset.originalName,
        title: asset.metadata.title || '',
        description: asset.metadata.description || '',
        tags: asset.tags.join(' '),
        alt: asset.metadata.alt || ''
      });
    }

    this.searchIndex = builder.build();
  }

  // Asset Management
  async ingestAsset(
    filePath: string,
    metadata: Partial<AssetMetadata> = {},
    options: {
      folderId?: string;
      tags?: string[];
      createdBy: string;
    }
  ): Promise<Asset> {
    const stats = await fs.stat(filePath);

    if (stats.size > this.config.maxFileSize) {
      throw new Error(`File exceeds maximum size of ${this.config.maxFileSize} bytes`);
    }

    const originalName = path.basename(filePath);
    const mimeType = mime.lookup(originalName) || 'application/octet-stream';

    if (!this.isAllowedMimeType(mimeType)) {
      throw new Error(`File type ${mimeType} is not allowed`);
    }

    const id = uuidv4();
    const ext = path.extname(originalName);
    const filename = `${id}${ext}`;
    const destPath = path.join(this.config.storagePath, 'assets', filename);

    // Copy file to storage
    await fs.copyFile(filePath, destPath);

    // Extract metadata
    let extractedMeta: Partial<AssetMetadata> = {};
    let dimensions: { width?: number; height?: number } = {};

    if (this.config.extractMetadata && mimeType.startsWith('image/')) {
      const imageInfo = await sharp(destPath).metadata();
      dimensions = { width: imageInfo.width, height: imageInfo.height };

      if (imageInfo.exif) {
        extractedMeta.exif = this.parseExif(imageInfo.exif);
      }
    }

    const asset: Asset = {
      id,
      filename,
      originalName,
      mimeType,
      size: stats.size,
      ...dimensions,
      metadata: {
        ...extractedMeta,
        ...metadata,
        customFields: metadata.customFields || {}
      },
      tags: options.tags || [],
      folderId: options.folderId || null,
      version: 1,
      status: 'draft',
      createdBy: options.createdBy,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.assets.set(id, asset);
    this.versions.set(id, [{
      id: uuidv4(),
      assetId: id,
      version: 1,
      filename,
      size: stats.size,
      changes: 'Initial upload',
      createdBy: options.createdBy,
      createdAt: new Date()
    }]);

    // Generate renditions for images
    if (this.config.generateRenditions && mimeType.startsWith('image/')) {
      await this.generateRenditions(asset);
    }

    this.rebuildSearchIndex();
    return asset;
  }

  private isAllowedMimeType(mimeType: string): boolean {
    return this.config.allowedMimeTypes.some(pattern => {
      if (pattern.endsWith('/*')) {
        return mimeType.startsWith(pattern.slice(0, -1));
      }
      return mimeType === pattern;
    });
  }

  private parseExif(exifBuffer: Buffer): Record<string, any> {
    // Simplified EXIF parsing - in production use exif-parser
    return { raw: exifBuffer.toString('base64').slice(0, 100) };
  }

  async generateRenditions(asset: Asset): Promise<Rendition[]> {
    if (!asset.mimeType.startsWith('image/')) {
      return [];
    }

    const sourcePath = path.join(this.config.storagePath, 'assets', asset.filename);
    const generatedRenditions: Rendition[] = [];

    for (const profile of this.config.renditionProfiles) {
      try {
        const renditionId = uuidv4();
        const renditionFilename = `${asset.id}_${profile.name}.${profile.format || 'webp'}`;
        const renditionPath = path.join(this.config.storagePath, 'renditions', renditionFilename);

        let transformer = sharp(sourcePath);

        if (profile.width || profile.height) {
          transformer = transformer.resize(profile.width, profile.height, {
            fit: profile.fit || 'inside',
            withoutEnlargement: true
          });
        }

        switch (profile.format) {
          case 'jpeg':
            transformer = transformer.jpeg({ quality: profile.quality || 85 });
            break;
          case 'png':
            transformer = transformer.png({ quality: profile.quality || 85 });
            break;
          case 'avif':
            transformer = transformer.avif({ quality: profile.quality || 80 });
            break;
          default:
            transformer = transformer.webp({ quality: profile.quality || 85 });
        }

        const info = await transformer.toFile(renditionPath);

        const rendition: Rendition = {
          id: renditionId,
          assetId: asset.id,
          name: profile.name,
          filename: renditionFilename,
          mimeType: `image/${profile.format || 'webp'}`,
          width: info.width,
          height: info.height,
          size: info.size,
          profile: profile.name
        };

        generatedRenditions.push(rendition);
      } catch (error) {
        console.error(`Failed to generate ${profile.name} rendition:`, error);
      }
    }

    this.renditions.set(asset.id, generatedRenditions);
    return generatedRenditions;
  }

  async updateAsset(
    assetId: string,
    updates: {
      metadata?: Partial<AssetMetadata>;
      tags?: string[];
      status?: Asset['status'];
      folderId?: string | null;
    },
    userId: string
  ): Promise<Asset> {
    const asset = this.assets.get(assetId);
    if (!asset) {
      throw new Error('Asset not found');
    }

    if (updates.metadata) {
      asset.metadata = {
        ...asset.metadata,
        ...updates.metadata,
        customFields: {
          ...asset.metadata.customFields,
          ...(updates.metadata.customFields || {})
        }
      };
    }

    if (updates.tags !== undefined) {
      asset.tags = updates.tags;
    }

    if (updates.status !== undefined) {
      asset.status = updates.status;
    }

    if (updates.folderId !== undefined) {
      asset.folderId = updates.folderId;
    }

    asset.updatedAt = new Date();
    this.assets.set(assetId, asset);
    this.rebuildSearchIndex();

    return asset;
  }

  async replaceAssetFile(
    assetId: string,
    newFilePath: string,
    changes: string,
    userId: string
  ): Promise<Asset> {
    const asset = this.assets.get(assetId);
    if (!asset) {
      throw new Error('Asset not found');
    }

    const stats = await fs.stat(newFilePath);
    const ext = path.extname(newFilePath);
    const newVersion = asset.version + 1;
    const newFilename = `${assetId}_v${newVersion}${ext}`;

    // Archive current version
    const currentPath = path.join(this.config.storagePath, 'assets', asset.filename);
    const versionPath = path.join(this.config.storagePath, 'versions', asset.filename);
    await fs.rename(currentPath, versionPath);

    // Copy new file
    const destPath = path.join(this.config.storagePath, 'assets', newFilename);
    await fs.copyFile(newFilePath, destPath);

    // Update asset
    asset.filename = newFilename;
    asset.size = stats.size;
    asset.version = newVersion;
    asset.updatedAt = new Date();

    // Update dimensions for images
    if (asset.mimeType.startsWith('image/')) {
      const imageInfo = await sharp(destPath).metadata();
      asset.width = imageInfo.width;
      asset.height = imageInfo.height;
    }

    // Add version record
    const versions = this.versions.get(assetId) || [];
    versions.push({
      id: uuidv4(),
      assetId,
      version: newVersion,
      filename: newFilename,
      size: stats.size,
      changes,
      createdBy: userId,
      createdAt: new Date()
    });
    this.versions.set(assetId, versions);

    // Regenerate renditions
    if (this.config.generateRenditions && asset.mimeType.startsWith('image/')) {
      await this.generateRenditions(asset);
    }

    this.assets.set(assetId, asset);
    return asset;
  }

  async deleteAsset(assetId: string): Promise<void> {
    const asset = this.assets.get(assetId);
    if (!asset) {
      throw new Error('Asset not found');
    }

    // Delete main file
    const assetPath = path.join(this.config.storagePath, 'assets', asset.filename);
    await fs.unlink(assetPath).catch(() => {});

    // Delete renditions
    const renditions = this.renditions.get(assetId) || [];
    for (const rendition of renditions) {
      const renditionPath = path.join(this.config.storagePath, 'renditions', rendition.filename);
      await fs.unlink(renditionPath).catch(() => {});
    }

    // Delete versions
    const versions = this.versions.get(assetId) || [];
    for (const version of versions) {
      const versionPath = path.join(this.config.storagePath, 'versions', version.filename);
      await fs.unlink(versionPath).catch(() => {});
    }

    this.assets.delete(assetId);
    this.renditions.delete(assetId);
    this.versions.delete(assetId);
    this.rebuildSearchIndex();
  }

  getAsset(assetId: string): Asset | undefined {
    return this.assets.get(assetId);
  }

  getAssetVersions(assetId: string): AssetVersion[] {
    return this.versions.get(assetId) || [];
  }

  getAssetRenditions(assetId: string): Rendition[] {
    return this.renditions.get(assetId) || [];
  }

  async getAssetPath(assetId: string, rendition?: string): Promise<string> {
    const asset = this.assets.get(assetId);
    if (!asset) {
      throw new Error('Asset not found');
    }

    if (rendition) {
      const renditions = this.renditions.get(assetId) || [];
      const targetRendition = renditions.find(r => r.name === rendition);
      if (targetRendition) {
        return path.join(this.config.storagePath, 'renditions', targetRendition.filename);
      }
    }

    return path.join(this.config.storagePath, 'assets', asset.filename);
  }

  // Search
  searchAssets(options: AssetSearchOptions): { assets: Asset[]; total: number } {
    let results: Asset[] = Array.from(this.assets.values());

    // Full-text search
    if (options.query) {
      const searchResults = this.searchIndex.search(options.query);
      const matchedIds = new Set(searchResults.map(r => r.ref));
      results = results.filter(a => matchedIds.has(a.id));
    }

    // Filter by tags
    if (options.tags && options.tags.length > 0) {
      results = results.filter(a =>
        options.tags!.some(tag => a.tags.includes(tag))
      );
    }

    // Filter by mime types
    if (options.mimeTypes && options.mimeTypes.length > 0) {
      results = results.filter(a =>
        options.mimeTypes!.some(type => {
          if (type.endsWith('/*')) {
            return a.mimeType.startsWith(type.slice(0, -1));
          }
          return a.mimeType === type;
        })
      );
    }

    // Filter by folder
    if (options.folderId !== undefined) {
      results = results.filter(a => a.folderId === options.folderId);
    }

    // Filter by status
    if (options.status) {
      results = results.filter(a => a.status === options.status);
    }

    // Filter by date range
    if (options.dateRange) {
      results = results.filter(a => {
        const created = a.createdAt.getTime();
        return created >= options.dateRange!.start.getTime() &&
               created <= options.dateRange!.end.getTime();
      });
    }

    // Filter by size range
    if (options.sizeRange) {
      results = results.filter(a => {
        return a.size >= options.sizeRange!.min &&
               a.size <= options.sizeRange!.max;
      });
    }

    const total = results.length;

    // Sort
    const sortBy = options.sortBy || 'date';
    const sortOrder = options.sortOrder || 'desc';

    results.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.originalName.localeCompare(b.originalName);
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
        case 'date':
        default:
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    // Paginate
    const page = options.page || 1;
    const limit = options.limit || 50;
    const startIndex = (page - 1) * limit;
    results = results.slice(startIndex, startIndex + limit);

    return { assets: results, total };
  }

  // Folder Management
  createFolder(
    name: string,
    parentId: string | null = null,
    permissions: FolderPermission[] = []
  ): Folder {
    const id = uuidv4();
    const parentFolder = parentId ? this.folders.get(parentId) : null;
    const parentPath = parentFolder?.path || '';

    const folder: Folder = {
      id,
      name,
      parentId,
      path: `${parentPath}/${name}`,
      permissions,
      createdAt: new Date()
    };

    this.folders.set(id, folder);
    return folder;
  }

  getFolder(folderId: string): Folder | undefined {
    return this.folders.get(folderId);
  }

  getFolderContents(folderId: string | null): {
    folders: Folder[];
    assets: Asset[];
  } {
    const folders = Array.from(this.folders.values())
      .filter(f => f.parentId === folderId);

    const assets = Array.from(this.assets.values())
      .filter(a => a.folderId === folderId);

    return { folders, assets };
  }

  getFolderTree(folderId: string | null = null): any[] {
    const children = Array.from(this.folders.values())
      .filter(f => f.parentId === folderId);

    return children.map(folder => ({
      ...folder,
      children: this.getFolderTree(folder.id),
      assetCount: Array.from(this.assets.values())
        .filter(a => a.folderId === folder.id).length
    }));
  }

  deleteFolder(folderId: string, recursive: boolean = false): void {
    const folder = this.folders.get(folderId);
    if (!folder) {
      throw new Error('Folder not found');
    }

    const contents = this.getFolderContents(folderId);

    if (!recursive && (contents.folders.length > 0 || contents.assets.length > 0)) {
      throw new Error('Folder is not empty');
    }

    if (recursive) {
      // Delete subfolders
      for (const subfolder of contents.folders) {
        this.deleteFolder(subfolder.id, true);
      }
      // Move assets to root
      for (const asset of contents.assets) {
        asset.folderId = null;
        this.assets.set(asset.id, asset);
      }
    }

    this.folders.delete(folderId);
  }

  // Collection Management
  createCollection(
    name: string,
    description: string | undefined,
    assetIds: string[],
    createdBy: string,
    isPublic: boolean = false
  ): Collection {
    const id = uuidv4();
    const collection: Collection = {
      id,
      name,
      description,
      assetIds,
      isPublic,
      shareToken: isPublic ? uuidv4() : undefined,
      createdBy,
      createdAt: new Date()
    };

    this.collections.set(id, collection);
    return collection;
  }

  getCollection(collectionId: string): Collection | undefined {
    return this.collections.get(collectionId);
  }

  getCollectionByShareToken(shareToken: string): Collection | undefined {
    return Array.from(this.collections.values())
      .find(c => c.shareToken === shareToken && c.isPublic);
  }

  updateCollection(
    collectionId: string,
    updates: {
      name?: string;
      description?: string;
      assetIds?: string[];
      isPublic?: boolean;
    }
  ): Collection {
    const collection = this.collections.get(collectionId);
    if (!collection) {
      throw new Error('Collection not found');
    }

    if (updates.name !== undefined) collection.name = updates.name;
    if (updates.description !== undefined) collection.description = updates.description;
    if (updates.assetIds !== undefined) collection.assetIds = updates.assetIds;
    if (updates.isPublic !== undefined) {
      collection.isPublic = updates.isPublic;
      collection.shareToken = updates.isPublic ? uuidv4() : undefined;
    }

    this.collections.set(collectionId, collection);
    return collection;
  }

  addAssetsToCollection(collectionId: string, assetIds: string[]): Collection {
    const collection = this.collections.get(collectionId);
    if (!collection) {
      throw new Error('Collection not found');
    }

    const uniqueIds = new Set([...collection.assetIds, ...assetIds]);
    collection.assetIds = Array.from(uniqueIds);
    this.collections.set(collectionId, collection);
    return collection;
  }

  removeAssetsFromCollection(collectionId: string, assetIds: string[]): Collection {
    const collection = this.collections.get(collectionId);
    if (!collection) {
      throw new Error('Collection not found');
    }

    const removeSet = new Set(assetIds);
    collection.assetIds = collection.assetIds.filter(id => !removeSet.has(id));
    this.collections.set(collectionId, collection);
    return collection;
  }

  deleteCollection(collectionId: string): void {
    this.collections.delete(collectionId);
  }

  // Bulk Operations
  async bulkTag(assetIds: string[], tags: string[], operation: 'add' | 'remove' | 'set'): Promise<Asset[]> {
    const updated: Asset[] = [];

    for (const assetId of assetIds) {
      const asset = this.assets.get(assetId);
      if (!asset) continue;

      switch (operation) {
        case 'add':
          asset.tags = Array.from(new Set([...asset.tags, ...tags]));
          break;
        case 'remove':
          const removeSet = new Set(tags);
          asset.tags = asset.tags.filter(t => !removeSet.has(t));
          break;
        case 'set':
          asset.tags = tags;
          break;
      }

      asset.updatedAt = new Date();
      this.assets.set(assetId, asset);
      updated.push(asset);
    }

    this.rebuildSearchIndex();
    return updated;
  }

  async bulkMove(assetIds: string[], folderId: string | null): Promise<Asset[]> {
    const updated: Asset[] = [];

    for (const assetId of assetIds) {
      const asset = this.assets.get(assetId);
      if (!asset) continue;

      asset.folderId = folderId;
      asset.updatedAt = new Date();
      this.assets.set(assetId, asset);
      updated.push(asset);
    }

    return updated;
  }

  async bulkDelete(assetIds: string[]): Promise<void> {
    for (const assetId of assetIds) {
      await this.deleteAsset(assetId);
    }
  }

  // Statistics
  getStatistics(): {
    totalAssets: number;
    totalSize: number;
    byMimeType: Record<string, { count: number; size: number }>;
    byStatus: Record<string, number>;
    recentUploads: Asset[];
  } {
    const assets = Array.from(this.assets.values());

    const byMimeType: Record<string, { count: number; size: number }> = {};
    const byStatus: Record<string, number> = { draft: 0, active: 0, archived: 0 };
    let totalSize = 0;

    for (const asset of assets) {
      totalSize += asset.size;
      byStatus[asset.status]++;

      const category = asset.mimeType.split('/')[0];
      if (!byMimeType[category]) {
        byMimeType[category] = { count: 0, size: 0 };
      }
      byMimeType[category].count++;
      byMimeType[category].size += asset.size;
    }

    const recentUploads = assets
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10);

    return {
      totalAssets: assets.length,
      totalSize,
      byMimeType,
      byStatus,
      recentUploads
    };
  }
}
```

### Express API Routes

```typescript
// routes/dam.ts
import { Router, Request, Response } from 'express';
import multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { DigitalAssetManager } from '../dam/dam-service';

const router = Router();
const dam = new DigitalAssetManager({
  storagePath: process.env.DAM_STORAGE_PATH || './dam-storage'
});

const upload = multer({ dest: 'temp/' });

// Ingest asset
router.post('/assets', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const asset = await dam.ingestAsset(
      req.file.path,
      {
        title: req.body.title,
        description: req.body.description,
        alt: req.body.alt,
        copyright: req.body.copyright
      },
      {
        folderId: req.body.folderId || null,
        tags: req.body.tags ? JSON.parse(req.body.tags) : [],
        createdBy: req.user?.id || 'anonymous'
      }
    );

    // Cleanup temp file
    fs.unlinkSync(req.file.path);

    res.status(201).json(asset);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get asset
router.get('/assets/:id', (req: Request, res: Response) => {
  const asset = dam.getAsset(req.params.id);
  if (!asset) {
    return res.status(404).json({ error: 'Asset not found' });
  }
  res.json(asset);
});

// Download asset
router.get('/assets/:id/download', async (req: Request, res: Response) => {
  try {
    const rendition = req.query.rendition as string | undefined;
    const filePath = await dam.getAssetPath(req.params.id, rendition);
    const asset = dam.getAsset(req.params.id)!;

    res.download(filePath, asset.originalName);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

// Stream asset
router.get('/assets/:id/stream', async (req: Request, res: Response) => {
  try {
    const rendition = req.query.rendition as string | undefined;
    const filePath = await dam.getAssetPath(req.params.id, rendition);
    const asset = dam.getAsset(req.params.id)!;

    res.setHeader('Content-Type', asset.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${asset.originalName}"`);

    fs.createReadStream(filePath).pipe(res);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

// Update asset metadata
router.patch('/assets/:id', async (req: Request, res: Response) => {
  try {
    const asset = await dam.updateAsset(
      req.params.id,
      {
        metadata: req.body.metadata,
        tags: req.body.tags,
        status: req.body.status,
        folderId: req.body.folderId
      },
      req.user?.id || 'anonymous'
    );
    res.json(asset);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Replace asset file
router.put('/assets/:id/file', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const asset = await dam.replaceAssetFile(
      req.params.id,
      req.file.path,
      req.body.changes || 'File replaced',
      req.user?.id || 'anonymous'
    );

    fs.unlinkSync(req.file.path);
    res.json(asset);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete asset
router.delete('/assets/:id', async (req: Request, res: Response) => {
  try {
    await dam.deleteAsset(req.params.id);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get asset versions
router.get('/assets/:id/versions', (req: Request, res: Response) => {
  const versions = dam.getAssetVersions(req.params.id);
  res.json(versions);
});

// Get asset renditions
router.get('/assets/:id/renditions', (req: Request, res: Response) => {
  const renditions = dam.getAssetRenditions(req.params.id);
  res.json(renditions);
});

// Search assets
router.get('/assets', (req: Request, res: Response) => {
  const { assets, total } = dam.searchAssets({
    query: req.query.q as string,
    tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
    mimeTypes: req.query.types ? (req.query.types as string).split(',') : undefined,
    folderId: req.query.folderId as string,
    status: req.query.status as any,
    sortBy: req.query.sortBy as any,
    sortOrder: req.query.sortOrder as any,
    page: req.query.page ? parseInt(req.query.page as string) : undefined,
    limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
  });

  res.json({ assets, total, page: req.query.page || 1 });
});

// Bulk operations
router.post('/assets/bulk/tag', async (req: Request, res: Response) => {
  try {
    const { assetIds, tags, operation } = req.body;
    const updated = await dam.bulkTag(assetIds, tags, operation);
    res.json({ updated: updated.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/assets/bulk/move', async (req: Request, res: Response) => {
  try {
    const { assetIds, folderId } = req.body;
    const updated = await dam.bulkMove(assetIds, folderId);
    res.json({ updated: updated.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/assets/bulk/delete', async (req: Request, res: Response) => {
  try {
    const { assetIds } = req.body;
    await dam.bulkDelete(assetIds);
    res.json({ deleted: assetIds.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Folder endpoints
router.post('/folders', (req: Request, res: Response) => {
  const folder = dam.createFolder(
    req.body.name,
    req.body.parentId || null,
    req.body.permissions || []
  );
  res.status(201).json(folder);
});

router.get('/folders/:id', (req: Request, res: Response) => {
  const folder = dam.getFolder(req.params.id);
  if (!folder) {
    return res.status(404).json({ error: 'Folder not found' });
  }
  res.json(folder);
});

router.get('/folders/:id/contents', (req: Request, res: Response) => {
  const folderId = req.params.id === 'root' ? null : req.params.id;
  const contents = dam.getFolderContents(folderId);
  res.json(contents);
});

router.get('/folders/tree', (req: Request, res: Response) => {
  const tree = dam.getFolderTree();
  res.json(tree);
});

router.delete('/folders/:id', (req: Request, res: Response) => {
  try {
    const recursive = req.query.recursive === 'true';
    dam.deleteFolder(req.params.id, recursive);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Collection endpoints
router.post('/collections', (req: Request, res: Response) => {
  const collection = dam.createCollection(
    req.body.name,
    req.body.description,
    req.body.assetIds || [],
    req.user?.id || 'anonymous',
    req.body.isPublic || false
  );
  res.status(201).json(collection);
});

router.get('/collections/:id', (req: Request, res: Response) => {
  const collection = dam.getCollection(req.params.id);
  if (!collection) {
    return res.status(404).json({ error: 'Collection not found' });
  }
  res.json(collection);
});

router.get('/collections/share/:token', (req: Request, res: Response) => {
  const collection = dam.getCollectionByShareToken(req.params.token);
  if (!collection) {
    return res.status(404).json({ error: 'Collection not found' });
  }
  res.json(collection);
});

router.patch('/collections/:id', (req: Request, res: Response) => {
  try {
    const collection = dam.updateCollection(req.params.id, req.body);
    res.json(collection);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/collections/:id/assets', (req: Request, res: Response) => {
  try {
    const collection = dam.addAssetsToCollection(req.params.id, req.body.assetIds);
    res.json(collection);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/collections/:id/assets', (req: Request, res: Response) => {
  try {
    const collection = dam.removeAssetsFromCollection(req.params.id, req.body.assetIds);
    res.json(collection);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/collections/:id', (req: Request, res: Response) => {
  dam.deleteCollection(req.params.id);
  res.status(204).send();
});

// Statistics
router.get('/statistics', (req: Request, res: Response) => {
  const stats = dam.getStatistics();
  res.json(stats);
});

export default router;
```

### React DAM Components

```tsx
// components/dam/AssetBrowser.tsx
import React, { useState, useCallback, useMemo } from 'react';

interface Asset {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  metadata: {
    title?: string;
    description?: string;
  };
  tags: string[];
  status: 'draft' | 'active' | 'archived';
  createdAt: string;
}

interface Folder {
  id: string;
  name: string;
  path: string;
}

interface AssetBrowserProps {
  onSelect?: (assets: Asset[]) => void;
  multiSelect?: boolean;
  allowedTypes?: string[];
}

export function AssetBrowser({
  onSelect,
  multiSelect = false,
  allowedTypes
}: AssetBrowserProps) {
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<Folder[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('date');
  const [loading, setLoading] = useState(false);

  const loadContents = useCallback(async (folderId: string | null) => {
    setLoading(true);
    try {
      const folderPath = folderId || 'root';
      const response = await fetch(`/api/dam/folders/${folderPath}/contents`);
      const data = await response.json();

      setFolders(data.folders);
      setAssets(allowedTypes
        ? data.assets.filter((a: Asset) =>
            allowedTypes.some(t => a.mimeType.startsWith(t.replace('/*', ''))))
        : data.assets
      );
      setCurrentFolder(folderId);
    } catch (error) {
      console.error('Failed to load contents:', error);
    } finally {
      setLoading(false);
    }
  }, [allowedTypes]);

  const navigateToFolder = useCallback((folder: Folder | null) => {
    if (folder) {
      setBreadcrumbs(prev => [...prev, folder]);
    } else {
      setBreadcrumbs([]);
    }
    loadContents(folder?.id || null);
    setSelectedAssets(new Set());
  }, [loadContents]);

  const navigateToBreadcrumb = useCallback((index: number) => {
    if (index < 0) {
      setBreadcrumbs([]);
      loadContents(null);
    } else {
      const folder = breadcrumbs[index];
      setBreadcrumbs(prev => prev.slice(0, index + 1));
      loadContents(folder.id);
    }
    setSelectedAssets(new Set());
  }, [breadcrumbs, loadContents]);

  const toggleAssetSelection = useCallback((assetId: string) => {
    setSelectedAssets(prev => {
      const next = new Set(prev);
      if (next.has(assetId)) {
        next.delete(assetId);
      } else {
        if (!multiSelect) {
          next.clear();
        }
        next.add(assetId);
      }
      return next;
    });
  }, [multiSelect]);

  const handleConfirmSelection = useCallback(() => {
    const selected = assets.filter(a => selectedAssets.has(a.id));
    onSelect?.(selected);
  }, [assets, selectedAssets, onSelect]);

  const filteredAssets = useMemo(() => {
    let result = [...assets];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(a =>
        a.originalName.toLowerCase().includes(query) ||
        a.metadata.title?.toLowerCase().includes(query) ||
        a.tags.some(t => t.toLowerCase().includes(query))
      );
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.originalName.localeCompare(b.originalName);
        case 'size':
          return b.size - a.size;
        case 'date':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return result;
  }, [assets, searchQuery, sortBy]);

  const formatSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const getThumbnailUrl = (asset: Asset) => {
    if (asset.mimeType.startsWith('image/')) {
      return `/api/dam/assets/${asset.id}/stream?rendition=thumbnail`;
    }
    // Return type-specific icon
    if (asset.mimeType.startsWith('video/')) return '/icons/video.svg';
    if (asset.mimeType.startsWith('audio/')) return '/icons/audio.svg';
    if (asset.mimeType === 'application/pdf') return '/icons/pdf.svg';
    return '/icons/file.svg';
  };

  React.useEffect(() => {
    loadContents(null);
  }, [loadContents]);

  return (
    <div className="asset-browser">
      {/* Toolbar */}
      <div className="toolbar">
        <div className="breadcrumbs">
          <button onClick={() => navigateToBreadcrumb(-1)}>Home</button>
          {breadcrumbs.map((folder, index) => (
            <React.Fragment key={folder.id}>
              <span>/</span>
              <button onClick={() => navigateToBreadcrumb(index)}>
                {folder.name}
              </button>
            </React.Fragment>
          ))}
        </div>

        <div className="controls">
          <input
            type="search"
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
            <option value="date">Date</option>
            <option value="name">Name</option>
            <option value="size">Size</option>
          </select>

          <button
            className={viewMode === 'grid' ? 'active' : ''}
            onClick={() => setViewMode('grid')}
          >
            Grid
          </button>
          <button
            className={viewMode === 'list' ? 'active' : ''}
            onClick={() => setViewMode('list')}
          >
            List
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className={`content ${viewMode}`}>
          {/* Folders */}
          {folders.map(folder => (
            <div
              key={folder.id}
              className="folder-item"
              onDoubleClick={() => navigateToFolder(folder)}
            >
              <div className="folder-icon">📁</div>
              <div className="folder-name">{folder.name}</div>
            </div>
          ))}

          {/* Assets */}
          {filteredAssets.map(asset => (
            <div
              key={asset.id}
              className={`asset-item ${selectedAssets.has(asset.id) ? 'selected' : ''}`}
              onClick={() => toggleAssetSelection(asset.id)}
              onDoubleClick={() => {
                setSelectedAssets(new Set([asset.id]));
                onSelect?.([asset]);
              }}
            >
              <div className="asset-thumbnail">
                <img src={getThumbnailUrl(asset)} alt={asset.originalName} />
                {asset.status !== 'active' && (
                  <span className={`status-badge ${asset.status}`}>
                    {asset.status}
                  </span>
                )}
              </div>
              <div className="asset-info">
                <div className="asset-name" title={asset.originalName}>
                  {asset.metadata.title || asset.originalName}
                </div>
                <div className="asset-meta">
                  {formatSize(asset.size)}
                  {viewMode === 'list' && (
                    <>
                      <span className="separator">•</span>
                      {new Date(asset.createdAt).toLocaleDateString()}
                    </>
                  )}
                </div>
                {asset.tags.length > 0 && viewMode === 'list' && (
                  <div className="asset-tags">
                    {asset.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {folders.length === 0 && filteredAssets.length === 0 && (
            <div className="empty-state">
              {searchQuery ? 'No matching assets found' : 'This folder is empty'}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      {selectedAssets.size > 0 && onSelect && (
        <div className="footer">
          <span>{selectedAssets.size} asset(s) selected</span>
          <button onClick={handleConfirmSelection} className="primary">
            Select
          </button>
        </div>
      )}
    </div>
  );
}
```

### React Asset Upload Component

```tsx
// components/dam/AssetUploader.tsx
import React, { useState, useCallback } from 'react';

interface UploadedAsset {
  id: string;
  originalName: string;
  mimeType: string;
}

interface AssetUploaderProps {
  folderId?: string;
  onUpload?: (assets: UploadedAsset[]) => void;
  allowedTypes?: string[];
  maxFileSize?: number;
}

export function AssetUploader({
  folderId,
  onUpload,
  allowedTypes = ['image/*', 'video/*', 'audio/*', 'application/pdf'],
  maxFileSize = 100 * 1024 * 1024 // 100MB
}: AssetUploaderProps) {
  const [uploads, setUploads] = useState<Map<string, {
    file: File;
    progress: number;
    status: 'pending' | 'uploading' | 'complete' | 'error';
    error?: string;
    asset?: UploadedAsset;
    title: string;
    tags: string[];
  }>>(new Map());
  const [dragActive, setDragActive] = useState(false);

  const validateFile = useCallback((file: File): string | null => {
    if (file.size > maxFileSize) {
      return `File too large (max ${maxFileSize / 1024 / 1024}MB)`;
    }

    const typeAllowed = allowedTypes.some(pattern => {
      if (pattern.endsWith('/*')) {
        return file.type.startsWith(pattern.slice(0, -1));
      }
      return file.type === pattern;
    });

    if (!typeAllowed) {
      return 'File type not allowed';
    }

    return null;
  }, [maxFileSize, allowedTypes]);

  const addFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);

    setUploads(prev => {
      const next = new Map(prev);

      for (const file of fileArray) {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const error = validateFile(file);

        next.set(id, {
          file,
          progress: 0,
          status: error ? 'error' : 'pending',
          error: error || undefined,
          title: file.name.replace(/\.[^/.]+$/, ''),
          tags: []
        });
      }

      return next;
    });
  }, [validateFile]);

  const updateUpload = useCallback((id: string, updates: Partial<{
    title: string;
    tags: string[];
  }>) => {
    setUploads(prev => {
      const next = new Map(prev);
      const upload = next.get(id);
      if (upload) {
        next.set(id, { ...upload, ...updates });
      }
      return next;
    });
  }, []);

  const removeUpload = useCallback((id: string) => {
    setUploads(prev => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const uploadFile = useCallback(async (id: string) => {
    const upload = uploads.get(id);
    if (!upload || upload.status !== 'pending') return;

    setUploads(prev => {
      const next = new Map(prev);
      next.set(id, { ...upload, status: 'uploading', progress: 0 });
      return next;
    });

    try {
      const formData = new FormData();
      formData.append('file', upload.file);
      formData.append('title', upload.title);
      formData.append('tags', JSON.stringify(upload.tags));
      if (folderId) {
        formData.append('folderId', folderId);
      }

      const xhr = new XMLHttpRequest();

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploads(prev => {
            const next = new Map(prev);
            const current = next.get(id);
            if (current) {
              next.set(id, { ...current, progress });
            }
            return next;
          });
        }
      };

      const response = await new Promise<UploadedAsset>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(xhr.statusText));
          }
        };
        xhr.onerror = () => reject(new Error('Upload failed'));
        xhr.open('POST', '/api/dam/assets');
        xhr.send(formData);
      });

      setUploads(prev => {
        const next = new Map(prev);
        const current = next.get(id);
        if (current) {
          next.set(id, {
            ...current,
            status: 'complete',
            progress: 100,
            asset: response
          });
        }
        return next;
      });
    } catch (error: any) {
      setUploads(prev => {
        const next = new Map(prev);
        const current = next.get(id);
        if (current) {
          next.set(id, {
            ...current,
            status: 'error',
            error: error.message
          });
        }
        return next;
      });
    }
  }, [uploads, folderId]);

  const uploadAll = useCallback(async () => {
    const pendingUploads = Array.from(uploads.entries())
      .filter(([_, u]) => u.status === 'pending');

    await Promise.all(pendingUploads.map(([id]) => uploadFile(id)));

    const completed = Array.from(uploads.values())
      .filter(u => u.status === 'complete' && u.asset)
      .map(u => u.asset!);

    if (completed.length > 0) {
      onUpload?.(completed);
    }
  }, [uploads, uploadFile, onUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  }, [addFiles]);

  const pendingCount = Array.from(uploads.values())
    .filter(u => u.status === 'pending').length;

  return (
    <div className="asset-uploader">
      {/* Drop Zone */}
      <div
        className={`drop-zone ${dragActive ? 'active' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          accept={allowedTypes.join(',')}
          onChange={(e) => e.target.files && addFiles(e.target.files)}
          style={{ display: 'none' }}
          id="file-input"
        />
        <label htmlFor="file-input">
          <div className="drop-zone-content">
            <span className="icon">📤</span>
            <p>Drag files here or click to browse</p>
            <p className="hint">
              Max size: {maxFileSize / 1024 / 1024}MB
            </p>
          </div>
        </label>
      </div>

      {/* Upload Queue */}
      {uploads.size > 0 && (
        <div className="upload-queue">
          <div className="queue-header">
            <h3>Upload Queue ({uploads.size})</h3>
            {pendingCount > 0 && (
              <button onClick={uploadAll} className="primary">
                Upload All ({pendingCount})
              </button>
            )}
          </div>

          <div className="queue-items">
            {Array.from(uploads.entries()).map(([id, upload]) => (
              <div key={id} className={`queue-item ${upload.status}`}>
                <div className="item-preview">
                  {upload.file.type.startsWith('image/') ? (
                    <img
                      src={URL.createObjectURL(upload.file)}
                      alt={upload.file.name}
                    />
                  ) : (
                    <span className="file-icon">📄</span>
                  )}
                </div>

                <div className="item-details">
                  {upload.status === 'pending' ? (
                    <input
                      type="text"
                      value={upload.title}
                      onChange={(e) => updateUpload(id, { title: e.target.value })}
                      placeholder="Title"
                    />
                  ) : (
                    <span className="title">{upload.title}</span>
                  )}

                  <div className="meta">
                    <span>{upload.file.name}</span>
                    <span>•</span>
                    <span>{(upload.file.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>

                  {upload.status === 'uploading' && (
                    <div className="progress-bar">
                      <div
                        className="progress"
                        style={{ width: `${upload.progress}%` }}
                      />
                    </div>
                  )}

                  {upload.status === 'error' && (
                    <span className="error">{upload.error}</span>
                  )}

                  {upload.status === 'complete' && (
                    <span className="success">Uploaded successfully</span>
                  )}
                </div>

                <div className="item-actions">
                  {upload.status === 'pending' && (
                    <>
                      <button onClick={() => uploadFile(id)}>Upload</button>
                      <button onClick={() => removeUpload(id)}>Remove</button>
                    </>
                  )}
                  {upload.status === 'error' && (
                    <button onClick={() => removeUpload(id)}>Remove</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

## Python Implementation

```python
# dam/dam_service.py
import os
import uuid
import json
import shutil
from datetime import datetime
from pathlib import Path
from typing import Optional, List, Dict, Any
from dataclasses import dataclass, field, asdict
from PIL import Image
import mimetypes

@dataclass
class AssetMetadata:
    title: Optional[str] = None
    description: Optional[str] = None
    alt: Optional[str] = None
    copyright: Optional[str] = None
    author: Optional[str] = None
    exif: Optional[Dict[str, Any]] = None
    custom_fields: Dict[str, Any] = field(default_factory=dict)

@dataclass
class Asset:
    id: str
    filename: str
    original_name: str
    mime_type: str
    size: int
    width: Optional[int] = None
    height: Optional[int] = None
    duration: Optional[float] = None
    metadata: AssetMetadata = field(default_factory=AssetMetadata)
    tags: List[str] = field(default_factory=list)
    folder_id: Optional[str] = None
    version: int = 1
    status: str = 'draft'  # draft, active, archived
    created_by: str = ''
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)

@dataclass
class Folder:
    id: str
    name: str
    parent_id: Optional[str]
    path: str
    created_at: datetime = field(default_factory=datetime.now)

@dataclass
class Collection:
    id: str
    name: str
    description: Optional[str]
    asset_ids: List[str]
    is_public: bool
    share_token: Optional[str]
    created_by: str
    created_at: datetime = field(default_factory=datetime.now)

@dataclass
class Rendition:
    id: str
    asset_id: str
    name: str
    filename: str
    mime_type: str
    width: Optional[int]
    height: Optional[int]
    size: int
    profile: str


class DigitalAssetManager:
    def __init__(
        self,
        storage_path: str = './dam-storage',
        max_file_size: int = 500 * 1024 * 1024,
        allowed_mime_types: Optional[List[str]] = None,
        rendition_profiles: Optional[List[Dict]] = None
    ):
        self.storage_path = Path(storage_path)
        self.max_file_size = max_file_size
        self.allowed_mime_types = allowed_mime_types or [
            'image/*', 'video/*', 'audio/*',
            'application/pdf', 'application/zip'
        ]
        self.rendition_profiles = rendition_profiles or [
            {'name': 'thumbnail', 'width': 150, 'height': 150, 'format': 'webp', 'quality': 80},
            {'name': 'preview', 'width': 800, 'height': 600, 'format': 'webp', 'quality': 85},
            {'name': 'web', 'width': 1920, 'height': 1080, 'format': 'webp', 'quality': 90},
        ]

        self.assets: Dict[str, Asset] = {}
        self.folders: Dict[str, Folder] = {}
        self.collections: Dict[str, Collection] = {}
        self.renditions: Dict[str, List[Rendition]] = {}

        self._initialize_storage()

    def _initialize_storage(self):
        for dir_name in ['assets', 'renditions', 'versions', 'temp']:
            (self.storage_path / dir_name).mkdir(parents=True, exist_ok=True)

    def _is_allowed_mime_type(self, mime_type: str) -> bool:
        for pattern in self.allowed_mime_types:
            if pattern.endswith('/*'):
                if mime_type.startswith(pattern[:-1]):
                    return True
            elif mime_type == pattern:
                return True
        return False

    def ingest_asset(
        self,
        file_path: str,
        metadata: Optional[Dict] = None,
        folder_id: Optional[str] = None,
        tags: Optional[List[str]] = None,
        created_by: str = 'anonymous'
    ) -> Asset:
        file_path = Path(file_path)

        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")

        file_size = file_path.stat().st_size
        if file_size > self.max_file_size:
            raise ValueError(f"File exceeds maximum size of {self.max_file_size} bytes")

        original_name = file_path.name
        mime_type, _ = mimetypes.guess_type(original_name)
        mime_type = mime_type or 'application/octet-stream'

        if not self._is_allowed_mime_type(mime_type):
            raise ValueError(f"File type {mime_type} is not allowed")

        asset_id = str(uuid.uuid4())
        ext = file_path.suffix
        filename = f"{asset_id}{ext}"
        dest_path = self.storage_path / 'assets' / filename

        shutil.copy2(file_path, dest_path)

        width, height = None, None
        if mime_type.startswith('image/'):
            try:
                with Image.open(dest_path) as img:
                    width, height = img.size
            except Exception:
                pass

        asset_metadata = AssetMetadata(
            title=metadata.get('title') if metadata else None,
            description=metadata.get('description') if metadata else None,
            alt=metadata.get('alt') if metadata else None,
            copyright=metadata.get('copyright') if metadata else None,
            author=metadata.get('author') if metadata else None,
            custom_fields=metadata.get('custom_fields', {}) if metadata else {}
        )

        asset = Asset(
            id=asset_id,
            filename=filename,
            original_name=original_name,
            mime_type=mime_type,
            size=file_size,
            width=width,
            height=height,
            metadata=asset_metadata,
            tags=tags or [],
            folder_id=folder_id,
            created_by=created_by
        )

        self.assets[asset_id] = asset

        if mime_type.startswith('image/'):
            self._generate_renditions(asset)

        return asset

    def _generate_renditions(self, asset: Asset) -> List[Rendition]:
        if not asset.mime_type.startswith('image/'):
            return []

        source_path = self.storage_path / 'assets' / asset.filename
        generated = []

        for profile in self.rendition_profiles:
            try:
                rendition_id = str(uuid.uuid4())
                format_ext = profile.get('format', 'webp')
                rendition_filename = f"{asset.id}_{profile['name']}.{format_ext}"
                rendition_path = self.storage_path / 'renditions' / rendition_filename

                with Image.open(source_path) as img:
                    if img.mode in ('RGBA', 'P'):
                        img = img.convert('RGB')

                    width = profile.get('width')
                    height = profile.get('height')

                    if width or height:
                        img.thumbnail((width or 9999, height or 9999), Image.Resampling.LANCZOS)

                    save_kwargs = {'quality': profile.get('quality', 85)}
                    if format_ext == 'webp':
                        img.save(rendition_path, 'WEBP', **save_kwargs)
                    elif format_ext == 'jpeg':
                        img.save(rendition_path, 'JPEG', **save_kwargs)
                    else:
                        img.save(rendition_path, format_ext.upper(), **save_kwargs)

                    rendition = Rendition(
                        id=rendition_id,
                        asset_id=asset.id,
                        name=profile['name'],
                        filename=rendition_filename,
                        mime_type=f"image/{format_ext}",
                        width=img.width,
                        height=img.height,
                        size=rendition_path.stat().st_size,
                        profile=profile['name']
                    )
                    generated.append(rendition)
            except Exception as e:
                print(f"Failed to generate {profile['name']} rendition: {e}")

        self.renditions[asset.id] = generated
        return generated

    def get_asset(self, asset_id: str) -> Optional[Asset]:
        return self.assets.get(asset_id)

    def get_asset_path(self, asset_id: str, rendition: Optional[str] = None) -> Path:
        asset = self.assets.get(asset_id)
        if not asset:
            raise ValueError("Asset not found")

        if rendition:
            asset_renditions = self.renditions.get(asset_id, [])
            for r in asset_renditions:
                if r.name == rendition:
                    return self.storage_path / 'renditions' / r.filename

        return self.storage_path / 'assets' / asset.filename

    def update_asset(
        self,
        asset_id: str,
        metadata: Optional[Dict] = None,
        tags: Optional[List[str]] = None,
        status: Optional[str] = None,
        folder_id: Optional[str] = None
    ) -> Asset:
        asset = self.assets.get(asset_id)
        if not asset:
            raise ValueError("Asset not found")

        if metadata:
            asset.metadata.title = metadata.get('title', asset.metadata.title)
            asset.metadata.description = metadata.get('description', asset.metadata.description)
            asset.metadata.alt = metadata.get('alt', asset.metadata.alt)
            asset.metadata.copyright = metadata.get('copyright', asset.metadata.copyright)
            if 'custom_fields' in metadata:
                asset.metadata.custom_fields.update(metadata['custom_fields'])

        if tags is not None:
            asset.tags = tags

        if status is not None:
            asset.status = status

        if folder_id is not None:
            asset.folder_id = folder_id

        asset.updated_at = datetime.now()
        return asset

    def delete_asset(self, asset_id: str):
        asset = self.assets.get(asset_id)
        if not asset:
            raise ValueError("Asset not found")

        asset_path = self.storage_path / 'assets' / asset.filename
        if asset_path.exists():
            asset_path.unlink()

        for rendition in self.renditions.get(asset_id, []):
            rendition_path = self.storage_path / 'renditions' / rendition.filename
            if rendition_path.exists():
                rendition_path.unlink()

        del self.assets[asset_id]
        self.renditions.pop(asset_id, None)

    def search_assets(
        self,
        query: Optional[str] = None,
        tags: Optional[List[str]] = None,
        mime_types: Optional[List[str]] = None,
        folder_id: Optional[str] = None,
        status: Optional[str] = None,
        sort_by: str = 'date',
        sort_order: str = 'desc',
        page: int = 1,
        limit: int = 50
    ) -> Dict[str, Any]:
        results = list(self.assets.values())

        if query:
            query_lower = query.lower()
            results = [
                a for a in results
                if query_lower in a.original_name.lower()
                or (a.metadata.title and query_lower in a.metadata.title.lower())
                or (a.metadata.description and query_lower in a.metadata.description.lower())
                or any(query_lower in tag.lower() for tag in a.tags)
            ]

        if tags:
            results = [a for a in results if any(t in a.tags for t in tags)]

        if mime_types:
            def matches_type(asset_type: str) -> bool:
                for pattern in mime_types:
                    if pattern.endswith('/*'):
                        if asset_type.startswith(pattern[:-1]):
                            return True
                    elif asset_type == pattern:
                        return True
                return False
            results = [a for a in results if matches_type(a.mime_type)]

        if folder_id is not None:
            results = [a for a in results if a.folder_id == folder_id]

        if status:
            results = [a for a in results if a.status == status]

        total = len(results)

        if sort_by == 'name':
            results.sort(key=lambda a: a.original_name, reverse=(sort_order == 'desc'))
        elif sort_by == 'size':
            results.sort(key=lambda a: a.size, reverse=(sort_order == 'desc'))
        else:
            results.sort(key=lambda a: a.created_at, reverse=(sort_order == 'desc'))

        start = (page - 1) * limit
        results = results[start:start + limit]

        return {
            'assets': results,
            'total': total,
            'page': page,
            'limit': limit
        }

    def create_folder(
        self,
        name: str,
        parent_id: Optional[str] = None
    ) -> Folder:
        folder_id = str(uuid.uuid4())
        parent = self.folders.get(parent_id) if parent_id else None
        parent_path = parent.path if parent else ''

        folder = Folder(
            id=folder_id,
            name=name,
            parent_id=parent_id,
            path=f"{parent_path}/{name}"
        )

        self.folders[folder_id] = folder
        return folder

    def get_folder_contents(self, folder_id: Optional[str]) -> Dict[str, Any]:
        folders = [f for f in self.folders.values() if f.parent_id == folder_id]
        assets = [a for a in self.assets.values() if a.folder_id == folder_id]

        return {
            'folders': folders,
            'assets': assets
        }

    def create_collection(
        self,
        name: str,
        description: Optional[str],
        asset_ids: List[str],
        created_by: str,
        is_public: bool = False
    ) -> Collection:
        collection_id = str(uuid.uuid4())

        collection = Collection(
            id=collection_id,
            name=name,
            description=description,
            asset_ids=asset_ids,
            is_public=is_public,
            share_token=str(uuid.uuid4()) if is_public else None,
            created_by=created_by
        )

        self.collections[collection_id] = collection
        return collection

    def get_statistics(self) -> Dict[str, Any]:
        assets = list(self.assets.values())

        by_mime_type: Dict[str, Dict[str, int]] = {}
        by_status = {'draft': 0, 'active': 0, 'archived': 0}
        total_size = 0

        for asset in assets:
            total_size += asset.size
            by_status[asset.status] = by_status.get(asset.status, 0) + 1

            category = asset.mime_type.split('/')[0]
            if category not in by_mime_type:
                by_mime_type[category] = {'count': 0, 'size': 0}
            by_mime_type[category]['count'] += 1
            by_mime_type[category]['size'] += asset.size

        recent = sorted(assets, key=lambda a: a.created_at, reverse=True)[:10]

        return {
            'total_assets': len(assets),
            'total_size': total_size,
            'by_mime_type': by_mime_type,
            'by_status': by_status,
            'recent_uploads': recent
        }
```

### FastAPI Routes

```python
# routes/dam_routes.py
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query
from fastapi.responses import FileResponse, StreamingResponse
from typing import Optional, List
import tempfile
import os

from dam.dam_service import DigitalAssetManager

router = APIRouter(prefix="/api/dam", tags=["DAM"])
dam = DigitalAssetManager()


@router.post("/assets")
async def ingest_asset(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),
    folder_id: Optional[str] = Form(None)
):
    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        metadata = {}
        if title:
            metadata['title'] = title
        if description:
            metadata['description'] = description

        tag_list = tags.split(',') if tags else []

        asset = dam.ingest_asset(
            tmp_path,
            metadata=metadata,
            folder_id=folder_id,
            tags=tag_list,
            created_by='api_user'
        )

        return asset
    finally:
        os.unlink(tmp_path)


@router.get("/assets/{asset_id}")
async def get_asset(asset_id: str):
    asset = dam.get_asset(asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset


@router.get("/assets/{asset_id}/download")
async def download_asset(asset_id: str, rendition: Optional[str] = None):
    try:
        file_path = dam.get_asset_path(asset_id, rendition)
        asset = dam.get_asset(asset_id)
        return FileResponse(
            file_path,
            filename=asset.original_name,
            media_type=asset.mime_type
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/assets")
async def search_assets(
    q: Optional[str] = None,
    tags: Optional[str] = None,
    types: Optional[str] = None,
    folder_id: Optional[str] = None,
    status: Optional[str] = None,
    sort_by: str = 'date',
    sort_order: str = 'desc',
    page: int = 1,
    limit: int = 50
):
    return dam.search_assets(
        query=q,
        tags=tags.split(',') if tags else None,
        mime_types=types.split(',') if types else None,
        folder_id=folder_id,
        status=status,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        limit=limit
    )


@router.delete("/assets/{asset_id}")
async def delete_asset(asset_id: str):
    try:
        dam.delete_asset(asset_id)
        return {"status": "deleted"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/folders")
async def create_folder(name: str, parent_id: Optional[str] = None):
    folder = dam.create_folder(name, parent_id)
    return folder


@router.get("/folders/{folder_id}/contents")
async def get_folder_contents(folder_id: str):
    fid = None if folder_id == 'root' else folder_id
    return dam.get_folder_contents(fid)


@router.post("/collections")
async def create_collection(
    name: str,
    description: Optional[str] = None,
    asset_ids: List[str] = [],
    is_public: bool = False
):
    collection = dam.create_collection(
        name, description, asset_ids, 'api_user', is_public
    )
    return collection


@router.get("/statistics")
async def get_statistics():
    return dam.get_statistics()
```

## CLAUDE.md Integration

```markdown
## Digital Asset Management

### Asset Operations
- Ingest: `POST /api/dam/assets` with multipart form
- Search: `GET /api/dam/assets?q=keyword&tags=tag1,tag2&types=image/*`
- Download: `GET /api/dam/assets/{id}/download?rendition=thumbnail`
- Stream: `GET /api/dam/assets/{id}/stream?rendition=preview`

### Folder Structure
- Create: `POST /api/dam/folders?name=Marketing&parent_id=...`
- Browse: `GET /api/dam/folders/{id}/contents`
- Tree: `GET /api/dam/folders/tree`

### Collections
- Create: `POST /api/dam/collections` with name, asset_ids
- Share: Public collections get `share_token` for external access
- Manage: Add/remove assets from collections

### Rendition Profiles
Default profiles: thumbnail (150px), preview (800px), web (1920px)
Custom profiles in config: `{ name, width, height, format, quality }`

### Bulk Operations
- Tag: `POST /api/dam/assets/bulk/tag` - add/remove/set tags
- Move: `POST /api/dam/assets/bulk/move` - move to folder
- Delete: `POST /api/dam/assets/bulk/delete` - bulk delete
```

## AI Suggestions

1. **Implement AI-powered tagging** - Auto-tag assets using vision models
2. **Add duplicate detection** - Use perceptual hashing for image deduplication
3. **Build smart search** - Vector embeddings for semantic asset search
4. **Create usage analytics** - Track asset downloads, views, and shares
5. **Add watermarking** - Automatic watermark application for downloads
6. **Implement approval workflows** - Review process for publishing assets
7. **Build brand portal** - Public-facing asset distribution portal
8. **Add format conversion** - On-demand conversion between formats
9. **Create asset lineage** - Track derivative assets and versions
10. **Implement rights management** - License tracking and expiration alerts
