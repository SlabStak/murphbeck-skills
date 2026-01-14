# CDN Integration

Production-ready Content Delivery Network integration with CloudFront, Cloudflare, and Fastly for global content delivery.

## Overview

CDN patterns for caching, purging, edge functions, and optimized content delivery across global points of presence.

## Quick Start

```bash
npm install @aws-sdk/client-cloudfront cloudflare
pip install boto3 cloudflare
```

## TypeScript Implementation

### CloudFront CDN Manager

```typescript
// src/cdn/cloudfront-manager.ts
import {
  CloudFrontClient,
  CreateInvalidationCommand,
  GetDistributionCommand,
  ListDistributionsCommand,
  CreateDistributionCommand,
  UpdateDistributionCommand,
  GetInvalidationCommand,
} from '@aws-sdk/client-cloudfront';
import { getSignedUrl } from '@aws-sdk/cloudfront-signer';

interface CloudFrontConfig {
  region: string;
  accessKeyId?: string;
  secretAccessKey?: string;
}

interface SignedUrlOptions {
  url: string;
  keyPairId: string;
  privateKey: string;
  dateLessThan?: Date;
  dateGreaterThan?: Date;
  ipAddress?: string;
}

interface SignedCookieOptions {
  url: string;
  keyPairId: string;
  privateKey: string;
  dateLessThan?: Date;
  policy?: string;
}

interface InvalidationResult {
  id: string;
  status: string;
  createTime?: Date;
}

interface DistributionInfo {
  id: string;
  domainName: string;
  status: string;
  enabled: boolean;
  origins: Array<{
    id: string;
    domainName: string;
  }>;
  aliases: string[];
}

export class CloudFrontManager {
  private client: CloudFrontClient;

  constructor(config: CloudFrontConfig) {
    this.client = new CloudFrontClient({
      region: config.region,
      ...(config.accessKeyId && config.secretAccessKey && {
        credentials: {
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey,
        },
      }),
    });
  }

  // Create cache invalidation
  async invalidate(
    distributionId: string,
    paths: string[]
  ): Promise<InvalidationResult> {
    // Ensure paths start with /
    const normalizedPaths = paths.map((p) =>
      p.startsWith('/') ? p : `/${p}`
    );

    const command = new CreateInvalidationCommand({
      DistributionId: distributionId,
      InvalidationBatch: {
        CallerReference: `invalidation-${Date.now()}`,
        Paths: {
          Quantity: normalizedPaths.length,
          Items: normalizedPaths,
        },
      },
    });

    const response = await this.client.send(command);

    return {
      id: response.Invalidation?.Id || '',
      status: response.Invalidation?.Status || '',
      createTime: response.Invalidation?.CreateTime,
    };
  }

  // Invalidate all content
  async invalidateAll(distributionId: string): Promise<InvalidationResult> {
    return this.invalidate(distributionId, ['/*']);
  }

  // Get invalidation status
  async getInvalidationStatus(
    distributionId: string,
    invalidationId: string
  ): Promise<InvalidationResult> {
    const command = new GetInvalidationCommand({
      DistributionId: distributionId,
      Id: invalidationId,
    });

    const response = await this.client.send(command);

    return {
      id: response.Invalidation?.Id || '',
      status: response.Invalidation?.Status || '',
      createTime: response.Invalidation?.CreateTime,
    };
  }

  // Get distribution info
  async getDistribution(distributionId: string): Promise<DistributionInfo> {
    const command = new GetDistributionCommand({
      Id: distributionId,
    });

    const response = await this.client.send(command);
    const dist = response.Distribution;

    return {
      id: dist?.Id || '',
      domainName: dist?.DomainName || '',
      status: dist?.Status || '',
      enabled: dist?.DistributionConfig?.Enabled || false,
      origins: (dist?.DistributionConfig?.Origins?.Items || []).map((o) => ({
        id: o.Id || '',
        domainName: o.DomainName || '',
      })),
      aliases: dist?.DistributionConfig?.Aliases?.Items || [],
    };
  }

  // List all distributions
  async listDistributions(): Promise<DistributionInfo[]> {
    const command = new ListDistributionsCommand({});
    const response = await this.client.send(command);

    return (response.DistributionList?.Items || []).map((dist) => ({
      id: dist.Id || '',
      domainName: dist.DomainName || '',
      status: dist.Status || '',
      enabled: dist.Enabled || false,
      origins: (dist.Origins?.Items || []).map((o) => ({
        id: o.Id || '',
        domainName: o.DomainName || '',
      })),
      aliases: dist.Aliases?.Items || [],
    }));
  }

  // Generate signed URL for private content
  generateSignedUrl(options: SignedUrlOptions): string {
    return getSignedUrl({
      url: options.url,
      keyPairId: options.keyPairId,
      privateKey: options.privateKey,
      dateLessThan: options.dateLessThan?.toISOString() ||
        new Date(Date.now() + 3600 * 1000).toISOString(),
      dateGreaterThan: options.dateGreaterThan?.toISOString(),
      ipAddress: options.ipAddress,
    });
  }

  // Generate signed cookies
  generateSignedCookies(options: SignedCookieOptions): {
    'CloudFront-Policy': string;
    'CloudFront-Signature': string;
    'CloudFront-Key-Pair-Id': string;
  } {
    // Build policy
    const policy = options.policy || JSON.stringify({
      Statement: [
        {
          Resource: options.url,
          Condition: {
            DateLessThan: {
              'AWS:EpochTime': Math.floor(
                (options.dateLessThan || new Date(Date.now() + 3600 * 1000)).getTime() / 1000
              ),
            },
          },
        },
      ],
    });

    const crypto = require('crypto');
    const signer = crypto.createSign('RSA-SHA1');
    signer.update(policy);
    const signature = signer.sign(options.privateKey, 'base64');

    // URL-safe base64
    const urlSafeBase64 = (str: string) =>
      str.replace(/\+/g, '-').replace(/=/g, '_').replace(/\//g, '~');

    return {
      'CloudFront-Policy': urlSafeBase64(Buffer.from(policy).toString('base64')),
      'CloudFront-Signature': urlSafeBase64(signature),
      'CloudFront-Key-Pair-Id': options.keyPairId,
    };
  }
}

// Factory function
export function createCloudFrontManager(config: CloudFrontConfig): CloudFrontManager {
  return new CloudFrontManager(config);
}
```

### Cloudflare CDN Manager

```typescript
// src/cdn/cloudflare-manager.ts
import Cloudflare from 'cloudflare';

interface CloudflareConfig {
  apiToken: string;
  accountId?: string;
}

interface ZoneInfo {
  id: string;
  name: string;
  status: string;
  paused: boolean;
  developmentMode: number;
}

interface PurgeResult {
  id: string;
  success: boolean;
}

interface CacheRuleConfig {
  name: string;
  expression: string;
  action: 'bypass_cache' | 'cache' | 'set_cache_settings';
  cacheSettings?: {
    ttl?: number;
    browserTTL?: number;
    cacheLevel?: 'bypass' | 'basic' | 'aggressive';
  };
}

export class CloudflareManager {
  private cf: Cloudflare;
  private accountId?: string;

  constructor(config: CloudflareConfig) {
    this.cf = new Cloudflare({
      apiToken: config.apiToken,
    });
    this.accountId = config.accountId;
  }

  // Get zone by name
  async getZoneByName(zoneName: string): Promise<ZoneInfo | null> {
    const zones = await this.cf.zones.list({ name: zoneName });

    if (zones.result.length === 0) return null;

    const zone = zones.result[0];
    return {
      id: zone.id,
      name: zone.name,
      status: zone.status,
      paused: zone.paused,
      developmentMode: zone.development_mode,
    };
  }

  // Purge specific URLs
  async purgeUrls(zoneId: string, urls: string[]): Promise<PurgeResult> {
    const response = await this.cf.cache.purge(zoneId, {
      files: urls,
    });

    return {
      id: response.id || '',
      success: true,
    };
  }

  // Purge by cache tags
  async purgeTags(zoneId: string, tags: string[]): Promise<PurgeResult> {
    const response = await this.cf.cache.purge(zoneId, {
      tags,
    });

    return {
      id: response.id || '',
      success: true,
    };
  }

  // Purge by prefix
  async purgePrefix(zoneId: string, prefixes: string[]): Promise<PurgeResult> {
    const response = await this.cf.cache.purge(zoneId, {
      prefixes,
    });

    return {
      id: response.id || '',
      success: true,
    };
  }

  // Purge everything
  async purgeAll(zoneId: string): Promise<PurgeResult> {
    const response = await this.cf.cache.purge(zoneId, {
      purge_everything: true,
    });

    return {
      id: response.id || '',
      success: true,
    };
  }

  // Enable/disable development mode
  async setDevelopmentMode(
    zoneId: string,
    enabled: boolean
  ): Promise<void> {
    await this.cf.zones.settings.edit(zoneId, 'development_mode', {
      value: enabled ? 'on' : 'off',
    });
  }

  // Get cache analytics
  async getCacheAnalytics(
    zoneId: string,
    since: Date,
    until: Date
  ): Promise<{
    requests: { cached: number; uncached: number };
    bandwidth: { cached: number; uncached: number };
    cacheRatio: number;
  }> {
    // Using GraphQL API for analytics
    const query = `
      query {
        viewer {
          zones(filter: {zoneTag: "${zoneId}"}) {
            httpRequests1dGroups(
              limit: 100
              filter: {
                date_geq: "${since.toISOString().split('T')[0]}"
                date_leq: "${until.toISOString().split('T')[0]}"
              }
            ) {
              sum {
                cachedRequests
                requests
                cachedBytes
                bytes
              }
            }
          }
        }
      }
    `;

    // Note: Actual implementation would use cf.graphql
    // This is a simplified placeholder
    return {
      requests: { cached: 0, uncached: 0 },
      bandwidth: { cached: 0, uncached: 0 },
      cacheRatio: 0,
    };
  }

  // Set cache TTL
  async setCacheTTL(zoneId: string, ttl: number): Promise<void> {
    await this.cf.zones.settings.edit(zoneId, 'browser_cache_ttl', {
      value: ttl,
    });
  }

  // Get zone settings
  async getZoneSettings(zoneId: string): Promise<Record<string, any>> {
    const settings = await this.cf.zones.settings.list(zoneId);
    const result: Record<string, any> = {};

    for (const setting of settings.result) {
      result[setting.id] = setting.value;
    }

    return result;
  }
}

// Factory function
export function createCloudflareManager(config: CloudflareConfig): CloudflareManager {
  return new CloudflareManager(config);
}
```

### Express CDN Routes

```typescript
// src/routes/cdn.ts
import { Router, Request, Response } from 'express';
import { createCloudFrontManager } from '../cdn/cloudfront-manager';
import { createCloudflareManager } from '../cdn/cloudflare-manager';

const router = Router();

const cloudfront = createCloudFrontManager({
  region: process.env.AWS_REGION || 'us-east-1',
});

const cloudflare = createCloudflareManager({
  apiToken: process.env.CLOUDFLARE_API_TOKEN || '',
});

// CloudFront: Invalidate paths
router.post('/cloudfront/:distributionId/invalidate', async (req: Request, res: Response) => {
  try {
    const { distributionId } = req.params;
    const { paths } = req.body;

    if (!paths || !Array.isArray(paths)) {
      return res.status(400).json({ error: 'paths array required' });
    }

    const result = await cloudfront.invalidate(distributionId, paths);
    res.json(result);
  } catch (error) {
    console.error('Invalidation error:', error);
    res.status(500).json({ error: 'Invalidation failed' });
  }
});

// CloudFront: Get invalidation status
router.get('/cloudfront/:distributionId/invalidations/:invalidationId', async (req: Request, res: Response) => {
  try {
    const { distributionId, invalidationId } = req.params;
    const result = await cloudfront.getInvalidationStatus(distributionId, invalidationId);
    res.json(result);
  } catch (error) {
    console.error('Get invalidation error:', error);
    res.status(500).json({ error: 'Failed to get invalidation status' });
  }
});

// CloudFront: Get distribution info
router.get('/cloudfront/:distributionId', async (req: Request, res: Response) => {
  try {
    const { distributionId } = req.params;
    const result = await cloudfront.getDistribution(distributionId);
    res.json(result);
  } catch (error) {
    console.error('Get distribution error:', error);
    res.status(500).json({ error: 'Failed to get distribution' });
  }
});

// CloudFront: Generate signed URL
router.post('/cloudfront/signed-url', async (req: Request, res: Response) => {
  try {
    const { url, keyPairId, privateKey, expiresIn } = req.body;

    if (!url || !keyPairId || !privateKey) {
      return res.status(400).json({ error: 'url, keyPairId, and privateKey required' });
    }

    const signedUrl = cloudfront.generateSignedUrl({
      url,
      keyPairId,
      privateKey,
      dateLessThan: new Date(Date.now() + (expiresIn || 3600) * 1000),
    });

    res.json({ signedUrl });
  } catch (error) {
    console.error('Signed URL error:', error);
    res.status(500).json({ error: 'Failed to generate signed URL' });
  }
});

// Cloudflare: Purge URLs
router.post('/cloudflare/:zoneId/purge/urls', async (req: Request, res: Response) => {
  try {
    const { zoneId } = req.params;
    const { urls } = req.body;

    if (!urls || !Array.isArray(urls)) {
      return res.status(400).json({ error: 'urls array required' });
    }

    const result = await cloudflare.purgeUrls(zoneId, urls);
    res.json(result);
  } catch (error) {
    console.error('Purge URLs error:', error);
    res.status(500).json({ error: 'Purge failed' });
  }
});

// Cloudflare: Purge by tags
router.post('/cloudflare/:zoneId/purge/tags', async (req: Request, res: Response) => {
  try {
    const { zoneId } = req.params;
    const { tags } = req.body;

    if (!tags || !Array.isArray(tags)) {
      return res.status(400).json({ error: 'tags array required' });
    }

    const result = await cloudflare.purgeTags(zoneId, tags);
    res.json(result);
  } catch (error) {
    console.error('Purge tags error:', error);
    res.status(500).json({ error: 'Purge failed' });
  }
});

// Cloudflare: Purge everything
router.post('/cloudflare/:zoneId/purge/all', async (req: Request, res: Response) => {
  try {
    const { zoneId } = req.params;
    const result = await cloudflare.purgeAll(zoneId);
    res.json(result);
  } catch (error) {
    console.error('Purge all error:', error);
    res.status(500).json({ error: 'Purge failed' });
  }
});

// Cloudflare: Development mode
router.post('/cloudflare/:zoneId/dev-mode', async (req: Request, res: Response) => {
  try {
    const { zoneId } = req.params;
    const { enabled } = req.body;

    await cloudflare.setDevelopmentMode(zoneId, enabled);
    res.json({ success: true, developmentMode: enabled });
  } catch (error) {
    console.error('Dev mode error:', error);
    res.status(500).json({ error: 'Failed to set development mode' });
  }
});

export default router;
```

## Python Implementation

```python
# cdn/cloudfront_manager.py
import boto3
from botocore.signers import CloudFrontSigner
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding
from typing import Optional, List, Dict, Any
from dataclasses import dataclass
from datetime import datetime, timedelta
import base64
import json


@dataclass
class InvalidationResult:
    id: str
    status: str
    create_time: Optional[datetime] = None


@dataclass
class DistributionInfo:
    id: str
    domain_name: str
    status: str
    enabled: bool
    origins: List[Dict[str, str]]
    aliases: List[str]


class CloudFrontManager:
    def __init__(
        self,
        region: str = 'us-east-1',
        access_key_id: Optional[str] = None,
        secret_access_key: Optional[str] = None,
    ):
        session_kwargs = {}
        if access_key_id and secret_access_key:
            session_kwargs['aws_access_key_id'] = access_key_id
            session_kwargs['aws_secret_access_key'] = secret_access_key

        self.client = boto3.client(
            'cloudfront',
            region_name=region,
            **session_kwargs
        )

    def invalidate(
        self,
        distribution_id: str,
        paths: List[str]
    ) -> InvalidationResult:
        """Create cache invalidation."""
        # Normalize paths
        normalized_paths = [
            p if p.startswith('/') else f'/{p}'
            for p in paths
        ]

        response = self.client.create_invalidation(
            DistributionId=distribution_id,
            InvalidationBatch={
                'CallerReference': f'invalidation-{datetime.now().timestamp()}',
                'Paths': {
                    'Quantity': len(normalized_paths),
                    'Items': normalized_paths
                }
            }
        )

        invalidation = response.get('Invalidation', {})
        return InvalidationResult(
            id=invalidation.get('Id', ''),
            status=invalidation.get('Status', ''),
            create_time=invalidation.get('CreateTime')
        )

    def invalidate_all(self, distribution_id: str) -> InvalidationResult:
        """Invalidate all content."""
        return self.invalidate(distribution_id, ['/*'])

    def get_invalidation_status(
        self,
        distribution_id: str,
        invalidation_id: str
    ) -> InvalidationResult:
        """Get invalidation status."""
        response = self.client.get_invalidation(
            DistributionId=distribution_id,
            Id=invalidation_id
        )

        invalidation = response.get('Invalidation', {})
        return InvalidationResult(
            id=invalidation.get('Id', ''),
            status=invalidation.get('Status', ''),
            create_time=invalidation.get('CreateTime')
        )

    def get_distribution(self, distribution_id: str) -> DistributionInfo:
        """Get distribution info."""
        response = self.client.get_distribution(Id=distribution_id)
        dist = response.get('Distribution', {})
        config = dist.get('DistributionConfig', {})

        origins = [
            {'id': o.get('Id', ''), 'domain_name': o.get('DomainName', '')}
            for o in config.get('Origins', {}).get('Items', [])
        ]

        return DistributionInfo(
            id=dist.get('Id', ''),
            domain_name=dist.get('DomainName', ''),
            status=dist.get('Status', ''),
            enabled=config.get('Enabled', False),
            origins=origins,
            aliases=config.get('Aliases', {}).get('Items', [])
        )

    def list_distributions(self) -> List[DistributionInfo]:
        """List all distributions."""
        response = self.client.list_distributions()
        items = response.get('DistributionList', {}).get('Items', [])

        return [
            DistributionInfo(
                id=d.get('Id', ''),
                domain_name=d.get('DomainName', ''),
                status=d.get('Status', ''),
                enabled=d.get('Enabled', False),
                origins=[
                    {'id': o.get('Id', ''), 'domain_name': o.get('DomainName', '')}
                    for o in d.get('Origins', {}).get('Items', [])
                ],
                aliases=d.get('Aliases', {}).get('Items', [])
            )
            for d in items
        ]

    def generate_signed_url(
        self,
        url: str,
        key_pair_id: str,
        private_key: str,
        expires: Optional[datetime] = None,
    ) -> str:
        """Generate signed URL."""
        if not expires:
            expires = datetime.utcnow() + timedelta(hours=1)

        def rsa_signer(message):
            from cryptography.hazmat.primitives.serialization import load_pem_private_key
            key = load_pem_private_key(private_key.encode(), password=None)
            return key.sign(message, padding.PKCS1v15(), hashes.SHA1())

        signer = CloudFrontSigner(key_pair_id, rsa_signer)
        return signer.generate_presigned_url(url, date_less_than=expires)


# Cloudflare Manager
import cloudflare


class CloudflareManager:
    def __init__(self, api_token: str):
        self.cf = cloudflare.Cloudflare(api_token=api_token)

    def get_zone_by_name(self, zone_name: str) -> Optional[Dict[str, Any]]:
        """Get zone by name."""
        zones = self.cf.zones.list(name=zone_name)

        if not zones.result:
            return None

        zone = zones.result[0]
        return {
            'id': zone.id,
            'name': zone.name,
            'status': zone.status,
            'paused': zone.paused
        }

    def purge_urls(self, zone_id: str, urls: List[str]) -> Dict[str, Any]:
        """Purge specific URLs."""
        response = self.cf.cache.purge(zone_id, files=urls)
        return {'id': response.id, 'success': True}

    def purge_tags(self, zone_id: str, tags: List[str]) -> Dict[str, Any]:
        """Purge by cache tags."""
        response = self.cf.cache.purge(zone_id, tags=tags)
        return {'id': response.id, 'success': True}

    def purge_all(self, zone_id: str) -> Dict[str, Any]:
        """Purge everything."""
        response = self.cf.cache.purge(zone_id, purge_everything=True)
        return {'id': response.id, 'success': True}

    def set_development_mode(self, zone_id: str, enabled: bool) -> None:
        """Enable/disable development mode."""
        self.cf.zones.settings.edit(
            zone_id,
            'development_mode',
            value='on' if enabled else 'off'
        )


# FastAPI integration
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os

app = FastAPI()

cloudfront_mgr = CloudFrontManager()
cloudflare_mgr = CloudflareManager(
    api_token=os.environ.get('CLOUDFLARE_API_TOKEN', '')
)


class InvalidateRequest(BaseModel):
    paths: List[str]


class PurgeUrlsRequest(BaseModel):
    urls: List[str]


@app.post('/cloudfront/{distribution_id}/invalidate')
async def invalidate_cloudfront(distribution_id: str, request: InvalidateRequest):
    """Invalidate CloudFront cache."""
    result = cloudfront_mgr.invalidate(distribution_id, request.paths)
    return result.__dict__


@app.post('/cloudfront/{distribution_id}/invalidate-all')
async def invalidate_all_cloudfront(distribution_id: str):
    """Invalidate all CloudFront cache."""
    result = cloudfront_mgr.invalidate_all(distribution_id)
    return result.__dict__


@app.get('/cloudfront/{distribution_id}')
async def get_cloudfront_distribution(distribution_id: str):
    """Get CloudFront distribution info."""
    result = cloudfront_mgr.get_distribution(distribution_id)
    return result.__dict__


@app.post('/cloudflare/{zone_id}/purge/urls')
async def purge_cloudflare_urls(zone_id: str, request: PurgeUrlsRequest):
    """Purge Cloudflare cache by URLs."""
    return cloudflare_mgr.purge_urls(zone_id, request.urls)


@app.post('/cloudflare/{zone_id}/purge/all')
async def purge_all_cloudflare(zone_id: str):
    """Purge all Cloudflare cache."""
    return cloudflare_mgr.purge_all(zone_id)
```

## React CDN Helper

```typescript
// hooks/useCDN.ts
import { useState, useCallback } from 'react';

interface CDNConfig {
  baseUrl: string;
  defaultFormat?: 'auto' | 'webp' | 'avif';
  defaultQuality?: number;
}

interface ImageOptions {
  width?: number;
  height?: number;
  format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
  quality?: number;
  fit?: 'cover' | 'contain' | 'fill';
}

export function useCDN(config: CDNConfig) {
  // Build optimized image URL
  const buildImageUrl = useCallback((
    path: string,
    options: ImageOptions = {}
  ): string => {
    const params = new URLSearchParams();

    if (options.width) params.set('w', options.width.toString());
    if (options.height) params.set('h', options.height.toString());
    if (options.format) params.set('f', options.format);
    if (options.quality) params.set('q', options.quality.toString());
    if (options.fit) params.set('fit', options.fit);

    const queryString = params.toString();
    const url = `${config.baseUrl}/${path}`;

    return queryString ? `${url}?${queryString}` : url;
  }, [config.baseUrl]);

  // Build srcset for responsive images
  const buildSrcSet = useCallback((
    path: string,
    widths: number[] = [320, 640, 960, 1280, 1920],
    options: Omit<ImageOptions, 'width'> = {}
  ): string => {
    return widths
      .map((width) => {
        const url = buildImageUrl(path, { ...options, width });
        return `${url} ${width}w`;
      })
      .join(', ');
  }, [buildImageUrl]);

  return {
    buildImageUrl,
    buildSrcSet,
    baseUrl: config.baseUrl,
  };
}

// CDN Image component
interface CDNImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
  className?: string;
}

export function CDNImage({
  src,
  alt,
  width,
  height,
  sizes = '100vw',
  priority = false,
  className,
}: CDNImageProps) {
  const cdn = useCDN({
    baseUrl: process.env.NEXT_PUBLIC_CDN_URL || '',
  });

  const srcSet = cdn.buildSrcSet(src, [320, 640, 960, 1280, 1920], {
    format: 'auto',
    quality: 80,
  });

  return (
    <img
      src={cdn.buildImageUrl(src, { width, height })}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      className={className}
    />
  );
}
```

## CLAUDE.md Integration

```markdown
## CDN Commands

### Cache Invalidation
- "invalidate CDN cache" - Clear specific paths
- "purge all cache" - Clear entire CDN
- "purge by tag" - Tag-based invalidation

### Configuration
- "enable dev mode" - Bypass cache for development
- "set cache TTL" - Configure caching duration
- "check cache status" - Verify cache state

### Security
- "generate signed URL" - Create restricted access URL
- "set signed cookies" - Cookie-based access control

### Analytics
- "get cache hit ratio" - Check CDN performance
- "view bandwidth usage" - Monitor data transfer
```

## AI Suggestions

1. **"Implement edge functions"** - Cloudflare Workers / Lambda@Edge
2. **"Add image optimization"** - On-the-fly image transforms
3. **"Implement A/B testing at edge"** - Traffic splitting
4. **"Add geo-routing"** - Location-based content
5. **"Implement bot protection"** - Rate limiting at edge
6. **"Add real user monitoring"** - Performance analytics
7. **"Implement stale-while-revalidate"** - Better cache strategy
8. **"Add WebSocket support"** - Real-time through CDN
9. **"Implement video streaming optimization"** - HLS/DASH at edge
10. **"Add custom error pages"** - Branded error responses
