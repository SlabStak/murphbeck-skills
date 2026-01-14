# Push Notifications

## Overview
Cross-platform push notification service supporting Web Push, iOS APNs, Android FCM, and unified notification management with targeting and analytics.

## Quick Start

```bash
npm install web-push firebase-admin @parse/node-apn
```

## Full Implementation

### TypeScript Push Service

```typescript
// notifications/push-service.ts
import webPush, { PushSubscription, SendResult } from 'web-push';
import * as admin from 'firebase-admin';
import apn from '@parse/node-apn';

interface WebPushConfig {
  vapidPublicKey: string;
  vapidPrivateKey: string;
  subject: string;
}

interface FCMConfig {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

interface APNsConfig {
  keyId: string;
  teamId: string;
  key: string; // P8 key content
  production: boolean;
}

interface PushNotification {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: Record<string, any>;
  actions?: Array<{ action: string; title: string; icon?: string }>;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
  timestamp?: number;
}

interface DeviceToken {
  id: string;
  userId: string;
  platform: 'web' | 'ios' | 'android';
  token: string | PushSubscription;
  createdAt: Date;
  lastUsed?: Date;
  deviceInfo?: Record<string, any>;
}

interface SendOptions {
  ttl?: number; // Time to live in seconds
  priority?: 'high' | 'normal';
  collapseKey?: string;
  topic?: string; // iOS only
  sound?: string;
  badge?: number; // iOS only
}

export class PushNotificationService {
  private webPushEnabled: boolean = false;
  private fcmEnabled: boolean = false;
  private apnsEnabled: boolean = false;
  private apnsProvider?: apn.Provider;
  private tokens: Map<string, DeviceToken> = new Map();

  constructor(config: {
    webPush?: WebPushConfig;
    fcm?: FCMConfig;
    apns?: APNsConfig;
  }) {
    if (config.webPush) {
      webPush.setVapidDetails(
        config.webPush.subject,
        config.webPush.vapidPublicKey,
        config.webPush.vapidPrivateKey
      );
      this.webPushEnabled = true;
    }

    if (config.fcm) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: config.fcm.projectId,
          clientEmail: config.fcm.clientEmail,
          privateKey: config.fcm.privateKey
        })
      });
      this.fcmEnabled = true;
    }

    if (config.apns) {
      this.apnsProvider = new apn.Provider({
        token: {
          key: config.apns.key,
          keyId: config.apns.keyId,
          teamId: config.apns.teamId
        },
        production: config.apns.production
      });
      this.apnsEnabled = true;
    }
  }

  // Token management
  registerToken(token: Omit<DeviceToken, 'createdAt'>): void {
    this.tokens.set(token.id, {
      ...token,
      createdAt: new Date()
    });
  }

  unregisterToken(tokenId: string): void {
    this.tokens.delete(tokenId);
  }

  getTokensByUser(userId: string): DeviceToken[] {
    return Array.from(this.tokens.values()).filter(t => t.userId === userId);
  }

  getTokensByPlatform(platform: DeviceToken['platform']): DeviceToken[] {
    return Array.from(this.tokens.values()).filter(t => t.platform === platform);
  }

  // Send to single device
  async sendToDevice(
    token: DeviceToken,
    notification: PushNotification,
    options?: SendOptions
  ): Promise<{ success: boolean; error?: string }> {
    try {
      switch (token.platform) {
        case 'web':
          return this.sendWebPush(token.token as PushSubscription, notification, options);
        case 'android':
          return this.sendFCM(token.token as string, notification, options);
        case 'ios':
          return this.sendAPNs(token.token as string, notification, options);
        default:
          return { success: false, error: 'Unknown platform' };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Send to user (all devices)
  async sendToUser(
    userId: string,
    notification: PushNotification,
    options?: SendOptions
  ): Promise<Array<{ tokenId: string; success: boolean; error?: string }>> {
    const tokens = this.getTokensByUser(userId);
    const results = await Promise.all(
      tokens.map(async token => ({
        tokenId: token.id,
        ...(await this.sendToDevice(token, notification, options))
      }))
    );

    // Remove invalid tokens
    for (const result of results) {
      if (!result.success && this.isInvalidTokenError(result.error)) {
        this.unregisterToken(result.tokenId);
      }
    }

    return results;
  }

  // Send to multiple users
  async sendToUsers(
    userIds: string[],
    notification: PushNotification,
    options?: SendOptions
  ): Promise<Map<string, Array<{ tokenId: string; success: boolean; error?: string }>>> {
    const results = new Map();

    await Promise.all(
      userIds.map(async userId => {
        const userResults = await this.sendToUser(userId, notification, options);
        results.set(userId, userResults);
      })
    );

    return results;
  }

  // Send to topic (FCM only)
  async sendToTopic(
    topic: string,
    notification: PushNotification,
    options?: SendOptions
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.fcmEnabled) {
      return { success: false, error: 'FCM not configured' };
    }

    try {
      const message: admin.messaging.Message = {
        topic,
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.image
        },
        data: notification.data ? this.stringifyData(notification.data) : undefined,
        android: {
          priority: options?.priority === 'high' ? 'high' : 'normal',
          collapseKey: options?.collapseKey,
          ttl: options?.ttl ? options.ttl * 1000 : undefined,
          notification: {
            sound: options?.sound || 'default',
            icon: notification.icon,
            clickAction: notification.data?.clickAction
          }
        },
        apns: {
          headers: {
            'apns-priority': options?.priority === 'high' ? '10' : '5',
            'apns-collapse-id': options?.collapseKey
          },
          payload: {
            aps: {
              sound: options?.sound || 'default',
              badge: options?.badge
            }
          }
        }
      };

      const response = await admin.messaging().send(message);
      return { success: true, messageId: response };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Subscribe to topic (FCM)
  async subscribeToTopic(tokens: string[], topic: string): Promise<{
    successCount: number;
    failureCount: number;
    errors: string[];
  }> {
    if (!this.fcmEnabled) {
      throw new Error('FCM not configured');
    }

    const response = await admin.messaging().subscribeToTopic(tokens, topic);
    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
      errors: response.errors?.map(e => e.error.message) || []
    };
  }

  // Unsubscribe from topic (FCM)
  async unsubscribeFromTopic(tokens: string[], topic: string): Promise<{
    successCount: number;
    failureCount: number;
    errors: string[];
  }> {
    if (!this.fcmEnabled) {
      throw new Error('FCM not configured');
    }

    const response = await admin.messaging().unsubscribeFromTopic(tokens, topic);
    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
      errors: response.errors?.map(e => e.error.message) || []
    };
  }

  // Send batch (FCM - up to 500 messages)
  async sendBatch(
    messages: Array<{ token: string; notification: PushNotification; options?: SendOptions }>
  ): Promise<{
    successCount: number;
    failureCount: number;
    responses: Array<{ success: boolean; messageId?: string; error?: string }>
  }> {
    if (!this.fcmEnabled) {
      throw new Error('FCM not configured');
    }

    const fcmMessages: admin.messaging.Message[] = messages.map(({ token, notification, options }) => ({
      token,
      notification: {
        title: notification.title,
        body: notification.body,
        imageUrl: notification.image
      },
      data: notification.data ? this.stringifyData(notification.data) : undefined,
      android: {
        priority: options?.priority === 'high' ? 'high' : 'normal',
        collapseKey: options?.collapseKey
      }
    }));

    const response = await admin.messaging().sendEach(fcmMessages);
    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses: response.responses.map(r => ({
        success: r.success,
        messageId: r.messageId,
        error: r.error?.message
      }))
    };
  }

  // Platform-specific send methods
  private async sendWebPush(
    subscription: PushSubscription,
    notification: PushNotification,
    options?: SendOptions
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.webPushEnabled) {
      return { success: false, error: 'Web Push not configured' };
    }

    const payload = JSON.stringify({
      title: notification.title,
      body: notification.body,
      icon: notification.icon,
      badge: notification.badge,
      image: notification.image,
      data: notification.data,
      actions: notification.actions,
      tag: notification.tag,
      requireInteraction: notification.requireInteraction,
      silent: notification.silent,
      vibrate: notification.vibrate,
      timestamp: notification.timestamp
    });

    try {
      await webPush.sendNotification(subscription, payload, {
        TTL: options?.ttl || 86400,
        urgency: options?.priority === 'high' ? 'high' : 'normal'
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  private async sendFCM(
    token: string,
    notification: PushNotification,
    options?: SendOptions
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.fcmEnabled) {
      return { success: false, error: 'FCM not configured' };
    }

    const message: admin.messaging.Message = {
      token,
      notification: {
        title: notification.title,
        body: notification.body,
        imageUrl: notification.image
      },
      data: notification.data ? this.stringifyData(notification.data) : undefined,
      android: {
        priority: options?.priority === 'high' ? 'high' : 'normal',
        collapseKey: options?.collapseKey,
        ttl: options?.ttl ? options.ttl * 1000 : undefined,
        notification: {
          sound: options?.sound || 'default',
          icon: notification.icon,
          tag: notification.tag
        }
      }
    };

    try {
      const response = await admin.messaging().send(message);
      return { success: true, messageId: response };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  private async sendAPNs(
    deviceToken: string,
    notification: PushNotification,
    options?: SendOptions
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.apnsProvider) {
      return { success: false, error: 'APNs not configured' };
    }

    const note = new apn.Notification();
    note.alert = {
      title: notification.title,
      body: notification.body
    };
    note.topic = options?.topic || '';
    note.sound = options?.sound || 'default';
    note.badge = options?.badge;
    note.payload = notification.data || {};
    note.expiry = options?.ttl ? Math.floor(Date.now() / 1000) + options.ttl : 0;
    note.priority = options?.priority === 'high' ? 10 : 5;
    note.collapseId = options?.collapseKey;

    if (notification.image) {
      note.mutableContent = true;
      note.payload['media-url'] = notification.image;
    }

    try {
      const result = await this.apnsProvider.send(note, deviceToken);
      if (result.failed.length > 0) {
        return { success: false, error: result.failed[0].response?.reason };
      }
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  private stringifyData(data: Record<string, any>): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = typeof value === 'string' ? value : JSON.stringify(value);
    }
    return result;
  }

  private isInvalidTokenError(error?: string): boolean {
    if (!error) return false;
    const invalidErrors = [
      'InvalidRegistration',
      'NotRegistered',
      'Unregistered',
      'InvalidToken',
      'BadDeviceToken',
      'ExpiredToken',
      'gone'
    ];
    return invalidErrors.some(e => error.includes(e));
  }

  // Get VAPID public key for web push
  getVapidPublicKey(): string | null {
    return this.webPushEnabled ? process.env.VAPID_PUBLIC_KEY || null : null;
  }

  // Cleanup
  close(): void {
    if (this.apnsProvider) {
      this.apnsProvider.shutdown();
    }
  }
}
```

### Express API Routes

```typescript
// routes/push.ts
import { Router, Request, Response } from 'express';
import { PushNotificationService } from '../notifications/push-service';

const router = Router();

const pushService = new PushNotificationService({
  webPush: process.env.VAPID_PUBLIC_KEY ? {
    vapidPublicKey: process.env.VAPID_PUBLIC_KEY,
    vapidPrivateKey: process.env.VAPID_PRIVATE_KEY!,
    subject: process.env.VAPID_SUBJECT || 'mailto:admin@example.com'
  } : undefined,
  fcm: process.env.FCM_PROJECT_ID ? {
    projectId: process.env.FCM_PROJECT_ID,
    clientEmail: process.env.FCM_CLIENT_EMAIL!,
    privateKey: process.env.FCM_PRIVATE_KEY!.replace(/\\n/g, '\n')
  } : undefined,
  apns: process.env.APNS_KEY_ID ? {
    keyId: process.env.APNS_KEY_ID,
    teamId: process.env.APNS_TEAM_ID!,
    key: process.env.APNS_KEY!,
    production: process.env.NODE_ENV === 'production'
  } : undefined
});

// Get VAPID public key for web push subscription
router.get('/vapid-key', (req: Request, res: Response) => {
  const key = pushService.getVapidPublicKey();
  if (!key) {
    return res.status(404).json({ error: 'Web Push not configured' });
  }
  res.json({ publicKey: key });
});

// Register device token
router.post('/tokens', (req: Request, res: Response) => {
  try {
    const { id, userId, platform, token, deviceInfo } = req.body;
    pushService.registerToken({ id, userId, platform, token, deviceInfo });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Unregister device token
router.delete('/tokens/:id', (req: Request, res: Response) => {
  pushService.unregisterToken(req.params.id);
  res.json({ success: true });
});

// Send to specific device
router.post('/send/device', async (req: Request, res: Response) => {
  try {
    const { token, notification, options } = req.body;
    const result = await pushService.sendToDevice(token, notification, options);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Send to user (all devices)
router.post('/send/user', async (req: Request, res: Response) => {
  try {
    const { userId, notification, options } = req.body;
    const results = await pushService.sendToUser(userId, notification, options);
    res.json({ results });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Send to multiple users
router.post('/send/users', async (req: Request, res: Response) => {
  try {
    const { userIds, notification, options } = req.body;
    const results = await pushService.sendToUsers(userIds, notification, options);
    res.json({ results: Object.fromEntries(results) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Send to topic
router.post('/send/topic', async (req: Request, res: Response) => {
  try {
    const { topic, notification, options } = req.body;
    const result = await pushService.sendToTopic(topic, notification, options);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Subscribe to topic
router.post('/topics/:topic/subscribe', async (req: Request, res: Response) => {
  try {
    const { tokens } = req.body;
    const result = await pushService.subscribeToTopic(tokens, req.params.topic);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Unsubscribe from topic
router.post('/topics/:topic/unsubscribe', async (req: Request, res: Response) => {
  try {
    const { tokens } = req.body;
    const result = await pushService.unsubscribeFromTopic(tokens, req.params.topic);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Send batch
router.post('/send/batch', async (req: Request, res: Response) => {
  try {
    const { messages } = req.body;
    const result = await pushService.sendBatch(messages);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

### React Web Push Hook

```tsx
// hooks/usePushNotifications.ts
import { useState, useCallback, useEffect } from 'react';

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export function usePushNotifications(userId: string) {
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [supported, setSupported] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSupported('serviceWorker' in navigator && 'PushManager' in window);
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }

    // Check existing subscription
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.pushManager.getSubscription().then(sub => {
          if (sub) {
            setSubscription(formatSubscription(sub));
          }
        });
      });
    }
  }, []);

  const formatSubscription = (sub: globalThis.PushSubscription): PushSubscription => {
    const json = sub.toJSON();
    return {
      endpoint: json.endpoint!,
      keys: {
        p256dh: json.keys!.p256dh,
        auth: json.keys!.auth
      }
    };
  };

  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!supported) {
      throw new Error('Push notifications not supported');
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }, [supported]);

  const subscribe = useCallback(async (): Promise<PushSubscription | null> => {
    if (!supported) {
      throw new Error('Push notifications not supported');
    }

    setLoading(true);
    try {
      // Request permission if needed
      if (permission !== 'granted') {
        const result = await requestPermission();
        if (result !== 'granted') {
          throw new Error('Permission denied');
        }
      }

      // Get VAPID key
      const vapidResponse = await fetch('/api/push/vapid-key');
      const { publicKey } = await vapidResponse.json();

      // Register service worker
      const registration = await navigator.serviceWorker.ready;

      // Subscribe
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });

      const formattedSub = formatSubscription(sub);
      setSubscription(formattedSub);

      // Register with backend
      await fetch('/api/push/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: `web-${Date.now()}`,
          userId,
          platform: 'web',
          token: formattedSub
        })
      });

      return formattedSub;
    } finally {
      setLoading(false);
    }
  }, [supported, permission, userId, requestPermission]);

  const unsubscribe = useCallback(async (): Promise<void> => {
    if (!subscription) return;

    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();

      if (sub) {
        await sub.unsubscribe();
      }

      // Unregister from backend
      await fetch(`/api/push/tokens/web-${userId}`, {
        method: 'DELETE'
      });

      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, [subscription, userId]);

  return {
    subscription,
    permission,
    supported,
    loading,
    requestPermission,
    subscribe,
    unsubscribe,
    isSubscribed: !!subscription
  };
}

// Helper function
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}
```

### Service Worker for Web Push

```javascript
// public/sw.js
self.addEventListener('push', function(event) {
  if (!event.data) return;

  const data = event.data.json();

  const options = {
    body: data.body,
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/badge-72.png',
    image: data.image,
    data: data.data,
    actions: data.actions,
    tag: data.tag,
    requireInteraction: data.requireInteraction,
    silent: data.silent,
    vibrate: data.vibrate || [200, 100, 200],
    timestamp: data.timestamp || Date.now()
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const data = event.notification.data || {};
  let url = data.url || '/';

  // Handle action clicks
  if (event.action) {
    const action = event.notification.actions?.find(a => a.action === event.action);
    if (action && data.actionUrls?.[event.action]) {
      url = data.actionUrls[event.action];
    }
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // Focus existing window if possible
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

self.addEventListener('notificationclose', function(event) {
  // Track notification dismissal
  const data = event.notification.data || {};
  if (data.trackingId) {
    fetch('/api/push/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'dismissed',
        trackingId: data.trackingId
      })
    }).catch(() => {});
  }
});
```

## Python Implementation

```python
# notifications/push_service.py
import json
from typing import Optional, List, Dict, Any
from dataclasses import dataclass
from pywebpush import webpush, WebPushException
import firebase_admin
from firebase_admin import credentials, messaging

@dataclass
class PushNotification:
    title: str
    body: str
    icon: Optional[str] = None
    image: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    tag: Optional[str] = None
    priority: str = 'normal'

@dataclass
class DeviceToken:
    id: str
    user_id: str
    platform: str  # 'web', 'ios', 'android'
    token: Any  # string or dict for web push
    device_info: Optional[Dict] = None


class PushNotificationService:
    def __init__(
        self,
        vapid_private_key: Optional[str] = None,
        vapid_public_key: Optional[str] = None,
        vapid_subject: Optional[str] = None,
        fcm_credentials_path: Optional[str] = None
    ):
        self.vapid_private_key = vapid_private_key
        self.vapid_public_key = vapid_public_key
        self.vapid_subject = vapid_subject
        self.fcm_enabled = False

        if fcm_credentials_path:
            cred = credentials.Certificate(fcm_credentials_path)
            firebase_admin.initialize_app(cred)
            self.fcm_enabled = True

        self.tokens: Dict[str, DeviceToken] = {}

    def register_token(self, token: DeviceToken):
        self.tokens[token.id] = token

    def unregister_token(self, token_id: str):
        self.tokens.pop(token_id, None)

    def get_tokens_by_user(self, user_id: str) -> List[DeviceToken]:
        return [t for t in self.tokens.values() if t.user_id == user_id]

    async def send_to_device(
        self,
        token: DeviceToken,
        notification: PushNotification,
        ttl: int = 86400
    ) -> Dict[str, Any]:
        if token.platform == 'web':
            return self._send_web_push(token.token, notification, ttl)
        elif token.platform in ('android', 'ios'):
            return self._send_fcm(token.token, notification, token.platform, ttl)
        else:
            return {'success': False, 'error': 'Unknown platform'}

    async def send_to_user(
        self,
        user_id: str,
        notification: PushNotification,
        ttl: int = 86400
    ) -> List[Dict]:
        tokens = self.get_tokens_by_user(user_id)
        results = []

        for token in tokens:
            result = await self.send_to_device(token, notification, ttl)
            results.append({
                'token_id': token.id,
                **result
            })

        return results

    def _send_web_push(
        self,
        subscription: Dict,
        notification: PushNotification,
        ttl: int
    ) -> Dict[str, Any]:
        if not self.vapid_private_key:
            return {'success': False, 'error': 'Web Push not configured'}

        payload = json.dumps({
            'title': notification.title,
            'body': notification.body,
            'icon': notification.icon,
            'image': notification.image,
            'data': notification.data,
            'tag': notification.tag
        })

        try:
            webpush(
                subscription_info=subscription,
                data=payload,
                vapid_private_key=self.vapid_private_key,
                vapid_claims={
                    'sub': self.vapid_subject
                },
                ttl=ttl
            )
            return {'success': True}
        except WebPushException as e:
            return {'success': False, 'error': str(e)}

    def _send_fcm(
        self,
        token: str,
        notification: PushNotification,
        platform: str,
        ttl: int
    ) -> Dict[str, Any]:
        if not self.fcm_enabled:
            return {'success': False, 'error': 'FCM not configured'}

        android_config = None
        apns_config = None

        if platform == 'android':
            android_config = messaging.AndroidConfig(
                priority='high' if notification.priority == 'high' else 'normal',
                ttl=ttl,
                notification=messaging.AndroidNotification(
                    title=notification.title,
                    body=notification.body,
                    icon=notification.icon,
                    tag=notification.tag
                )
            )
        elif platform == 'ios':
            apns_config = messaging.APNSConfig(
                headers={
                    'apns-priority': '10' if notification.priority == 'high' else '5'
                },
                payload=messaging.APNSPayload(
                    aps=messaging.Aps(
                        alert=messaging.ApsAlert(
                            title=notification.title,
                            body=notification.body
                        ),
                        sound='default'
                    )
                )
            )

        message = messaging.Message(
            token=token,
            notification=messaging.Notification(
                title=notification.title,
                body=notification.body,
                image=notification.image
            ),
            data={k: str(v) for k, v in (notification.data or {}).items()},
            android=android_config,
            apns=apns_config
        )

        try:
            response = messaging.send(message)
            return {'success': True, 'message_id': response}
        except Exception as e:
            return {'success': False, 'error': str(e)}

    def send_to_topic(
        self,
        topic: str,
        notification: PushNotification
    ) -> Dict[str, Any]:
        if not self.fcm_enabled:
            return {'success': False, 'error': 'FCM not configured'}

        message = messaging.Message(
            topic=topic,
            notification=messaging.Notification(
                title=notification.title,
                body=notification.body,
                image=notification.image
            ),
            data={k: str(v) for k, v in (notification.data or {}).items()}
        )

        try:
            response = messaging.send(message)
            return {'success': True, 'message_id': response}
        except Exception as e:
            return {'success': False, 'error': str(e)}

    def subscribe_to_topic(self, tokens: List[str], topic: str) -> Dict:
        if not self.fcm_enabled:
            raise ValueError('FCM not configured')

        response = messaging.subscribe_to_topic(tokens, topic)
        return {
            'success_count': response.success_count,
            'failure_count': response.failure_count
        }

    def unsubscribe_from_topic(self, tokens: List[str], topic: str) -> Dict:
        if not self.fcm_enabled:
            raise ValueError('FCM not configured')

        response = messaging.unsubscribe_from_topic(tokens, topic)
        return {
            'success_count': response.success_count,
            'failure_count': response.failure_count
        }
```

### FastAPI Routes

```python
# routes/push_routes.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os

from notifications.push_service import PushNotificationService, PushNotification, DeviceToken

router = APIRouter(prefix="/api/push", tags=["Push"])

push_service = PushNotificationService(
    vapid_private_key=os.environ.get('VAPID_PRIVATE_KEY'),
    vapid_public_key=os.environ.get('VAPID_PUBLIC_KEY'),
    vapid_subject=os.environ.get('VAPID_SUBJECT'),
    fcm_credentials_path=os.environ.get('FCM_CREDENTIALS_PATH')
)


class TokenRequest(BaseModel):
    id: str
    user_id: str
    platform: str
    token: Any
    device_info: Optional[Dict] = None


class NotificationRequest(BaseModel):
    title: str
    body: str
    icon: Optional[str] = None
    image: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    tag: Optional[str] = None
    priority: str = 'normal'


class SendToUserRequest(BaseModel):
    user_id: str
    notification: NotificationRequest
    ttl: int = 86400


class SendToTopicRequest(BaseModel):
    topic: str
    notification: NotificationRequest


@router.get("/vapid-key")
async def get_vapid_key():
    key = os.environ.get('VAPID_PUBLIC_KEY')
    if not key:
        raise HTTPException(status_code=404, detail="Web Push not configured")
    return {"publicKey": key}


@router.post("/tokens")
async def register_token(request: TokenRequest):
    token = DeviceToken(
        id=request.id,
        user_id=request.user_id,
        platform=request.platform,
        token=request.token,
        device_info=request.device_info
    )
    push_service.register_token(token)
    return {"success": True}


@router.delete("/tokens/{token_id}")
async def unregister_token(token_id: str):
    push_service.unregister_token(token_id)
    return {"success": True}


@router.post("/send/user")
async def send_to_user(request: SendToUserRequest):
    notification = PushNotification(
        title=request.notification.title,
        body=request.notification.body,
        icon=request.notification.icon,
        image=request.notification.image,
        data=request.notification.data,
        tag=request.notification.tag,
        priority=request.notification.priority
    )

    results = await push_service.send_to_user(
        request.user_id,
        notification,
        request.ttl
    )
    return {"results": results}


@router.post("/send/topic")
async def send_to_topic(request: SendToTopicRequest):
    notification = PushNotification(
        title=request.notification.title,
        body=request.notification.body,
        icon=request.notification.icon,
        image=request.notification.image,
        data=request.notification.data,
        tag=request.notification.tag,
        priority=request.notification.priority
    )

    result = push_service.send_to_topic(request.topic, notification)
    return result


@router.post("/topics/{topic}/subscribe")
async def subscribe_to_topic(topic: str, tokens: List[str]):
    try:
        result = push_service.subscribe_to_topic(tokens, topic)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/topics/{topic}/unsubscribe")
async def unsubscribe_from_topic(topic: str, tokens: List[str]):
    try:
        result = push_service.unsubscribe_from_topic(tokens, topic)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

## CLAUDE.md Integration

```markdown
## Push Notifications

### Platform Setup
Web Push: Set VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT
FCM (Android): Set FCM_PROJECT_ID, FCM_CLIENT_EMAIL, FCM_PRIVATE_KEY
APNs (iOS): Set APNS_KEY_ID, APNS_TEAM_ID, APNS_KEY

### Token Management
- Register: `POST /api/push/tokens` with id, userId, platform, token
- Unregister: `DELETE /api/push/tokens/{id}`

### Send Notifications
- To user (all devices): `POST /api/push/send/user`
- To topic: `POST /api/push/send/topic`
- Batch (FCM): `POST /api/push/send/batch`

### Topic Subscriptions
- Subscribe: `POST /api/push/topics/{topic}/subscribe`
- Unsubscribe: `POST /api/push/topics/{topic}/unsubscribe`

### Notification Payload
```json
{
  "title": "New Message",
  "body": "You have a new message",
  "icon": "/icon.png",
  "image": "/hero.jpg",
  "data": { "url": "/messages/123" },
  "actions": [{ "action": "view", "title": "View" }],
  "tag": "message-123",
  "requireInteraction": true
}
```

### Web Push Service Worker
Register sw.js at site root for notification handling
Handle: push event, notificationclick, notificationclose
```

## AI Suggestions

1. **Implement notification scheduling** - Schedule notifications for future delivery
2. **Add rich media support** - Support images, videos in notifications
3. **Build notification analytics** - Track delivery, opens, clicks, dismissals
4. **Create segmentation** - Target notifications by user attributes
5. **Implement A/B testing** - Test notification content and timing
6. **Add rate limiting** - Prevent notification spam per user
7. **Build notification center** - In-app notification history
8. **Create silent pushes** - Background data sync without user notification
9. **Implement geofencing** - Location-based notifications
10. **Add notification preferences** - User opt-in/out per notification type
