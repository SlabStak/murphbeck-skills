# In-App Notifications

## Overview
Real-time in-app notification system with WebSocket delivery, notification center, read/unread tracking, and customizable notification types.

## Quick Start

```bash
npm install socket.io @prisma/client
```

## Full Implementation

### TypeScript Notification Service

```typescript
// notifications/in-app-service.ts
import { Server as SocketServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';

interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  actionUrl?: string;
  imageUrl?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  read: boolean;
  readAt?: Date;
  createdAt: Date;
  expiresAt?: Date;
  groupId?: string;
}

type NotificationType =
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'mention'
  | 'comment'
  | 'like'
  | 'follow'
  | 'share'
  | 'message'
  | 'order'
  | 'payment'
  | 'system'
  | 'custom';

interface NotificationTemplate {
  type: NotificationType;
  titleTemplate: string;
  messageTemplate: string;
  defaultPriority: Notification['priority'];
  icon?: string;
  color?: string;
}

interface NotificationPreferences {
  userId: string;
  enabled: boolean;
  types: Record<NotificationType, {
    enabled: boolean;
    channels: ('inApp' | 'email' | 'push' | 'sms')[];
  }>;
  quietHours?: {
    enabled: boolean;
    start: string; // HH:mm
    end: string;
    timezone: string;
  };
  soundEnabled: boolean;
}

interface CreateNotificationOptions {
  userId: string;
  type: NotificationType;
  title?: string;
  message?: string;
  data?: Record<string, any>;
  actionUrl?: string;
  imageUrl?: string;
  priority?: Notification['priority'];
  expiresAt?: Date;
  groupId?: string;
  templateVariables?: Record<string, string>;
}

interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
}

export class InAppNotificationService {
  private io: SocketServer;
  private notifications: Map<string, Notification> = new Map();
  private userNotifications: Map<string, Set<string>> = new Map();
  private userSockets: Map<string, Set<string>> = new Map();
  private preferences: Map<string, NotificationPreferences> = new Map();
  private templates: Map<NotificationType, NotificationTemplate> = new Map();

  constructor(httpServer: HttpServer) {
    this.io = new SocketServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || '*',
        methods: ['GET', 'POST']
      },
      path: '/notifications'
    });

    this.setupSocketHandlers();
    this.registerDefaultTemplates();
  }

  private setupSocketHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      const userId = socket.handshake.auth.userId;

      if (!userId) {
        socket.disconnect();
        return;
      }

      // Track user socket
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(socket.id);

      // Join user's room
      socket.join(`user:${userId}`);

      // Send unread count on connect
      socket.emit('notification:count', this.getUnreadCount(userId));

      // Handle events
      socket.on('notification:markRead', (notificationId: string) => {
        this.markAsRead(notificationId, userId);
      });

      socket.on('notification:markAllRead', () => {
        this.markAllAsRead(userId);
      });

      socket.on('notification:delete', (notificationId: string) => {
        this.deleteNotification(notificationId, userId);
      });

      socket.on('notification:subscribe', (types: NotificationType[]) => {
        types.forEach(type => socket.join(`type:${type}`));
      });

      socket.on('disconnect', () => {
        this.userSockets.get(userId)?.delete(socket.id);
        if (this.userSockets.get(userId)?.size === 0) {
          this.userSockets.delete(userId);
        }
      });
    });
  }

  private registerDefaultTemplates(): void {
    const defaults: NotificationTemplate[] = [
      {
        type: 'mention',
        titleTemplate: '{{actorName}} mentioned you',
        messageTemplate: '{{actorName}} mentioned you in {{context}}',
        defaultPriority: 'high',
        icon: '@',
        color: '#007bff'
      },
      {
        type: 'comment',
        titleTemplate: 'New comment',
        messageTemplate: '{{actorName}} commented on your {{itemType}}',
        defaultPriority: 'normal',
        icon: '💬',
        color: '#28a745'
      },
      {
        type: 'like',
        titleTemplate: '{{actorName}} liked your {{itemType}}',
        messageTemplate: '{{actorName}} liked your {{itemType}}',
        defaultPriority: 'low',
        icon: '❤️',
        color: '#dc3545'
      },
      {
        type: 'follow',
        titleTemplate: 'New follower',
        messageTemplate: '{{actorName}} started following you',
        defaultPriority: 'normal',
        icon: '👤',
        color: '#6f42c1'
      },
      {
        type: 'message',
        titleTemplate: 'New message from {{actorName}}',
        messageTemplate: '{{preview}}',
        defaultPriority: 'high',
        icon: '✉️',
        color: '#17a2b8'
      },
      {
        type: 'order',
        titleTemplate: 'Order {{orderId}} {{status}}',
        messageTemplate: 'Your order has been {{status}}',
        defaultPriority: 'normal',
        icon: '📦',
        color: '#ffc107'
      },
      {
        type: 'payment',
        titleTemplate: 'Payment {{status}}',
        messageTemplate: 'Your payment of {{amount}} was {{status}}',
        defaultPriority: 'high',
        icon: '💳',
        color: '#28a745'
      },
      {
        type: 'system',
        titleTemplate: 'System notification',
        messageTemplate: '{{message}}',
        defaultPriority: 'normal',
        icon: 'ℹ️',
        color: '#6c757d'
      }
    ];

    defaults.forEach(template => {
      this.templates.set(template.type, template);
    });
  }

  // Create and send notification
  async createNotification(options: CreateNotificationOptions): Promise<Notification | null> {
    // Check preferences
    const prefs = this.preferences.get(options.userId);
    if (prefs && !this.shouldSendNotification(prefs, options.type)) {
      return null;
    }

    const template = this.templates.get(options.type);
    let title = options.title || '';
    let message = options.message || '';

    // Apply template
    if (template && options.templateVariables) {
      title = title || this.applyTemplate(template.titleTemplate, options.templateVariables);
      message = message || this.applyTemplate(template.messageTemplate, options.templateVariables);
    }

    const notification: Notification = {
      id: this.generateId(),
      userId: options.userId,
      type: options.type,
      title,
      message,
      data: options.data,
      actionUrl: options.actionUrl,
      imageUrl: options.imageUrl,
      priority: options.priority || template?.defaultPriority || 'normal',
      read: false,
      createdAt: new Date(),
      expiresAt: options.expiresAt,
      groupId: options.groupId
    };

    // Store notification
    this.notifications.set(notification.id, notification);
    if (!this.userNotifications.has(options.userId)) {
      this.userNotifications.set(options.userId, new Set());
    }
    this.userNotifications.get(options.userId)!.add(notification.id);

    // Send real-time notification
    this.io.to(`user:${options.userId}`).emit('notification:new', notification);
    this.io.to(`user:${options.userId}`).emit('notification:count', this.getUnreadCount(options.userId));

    return notification;
  }

  // Create notifications for multiple users
  async createBulkNotifications(
    userIds: string[],
    options: Omit<CreateNotificationOptions, 'userId'>
  ): Promise<Notification[]> {
    const notifications: Notification[] = [];

    for (const userId of userIds) {
      const notification = await this.createNotification({ ...options, userId });
      if (notification) {
        notifications.push(notification);
      }
    }

    return notifications;
  }

  // Broadcast to all users
  async broadcastNotification(
    options: Omit<CreateNotificationOptions, 'userId'>
  ): Promise<void> {
    const notification = {
      id: this.generateId(),
      type: options.type,
      title: options.title || '',
      message: options.message || '',
      data: options.data,
      actionUrl: options.actionUrl,
      priority: options.priority || 'normal',
      read: false,
      createdAt: new Date()
    };

    this.io.emit('notification:broadcast', notification);
  }

  // Get user notifications
  getNotifications(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      unreadOnly?: boolean;
      types?: NotificationType[];
    }
  ): { notifications: Notification[]; total: number; unread: number } {
    const userNotifIds = this.userNotifications.get(userId) || new Set();
    let notifications: Notification[] = [];

    userNotifIds.forEach(id => {
      const notif = this.notifications.get(id);
      if (notif && (!notif.expiresAt || notif.expiresAt > new Date())) {
        notifications.push(notif);
      }
    });

    // Filter
    if (options?.unreadOnly) {
      notifications = notifications.filter(n => !n.read);
    }
    if (options?.types) {
      notifications = notifications.filter(n => options.types!.includes(n.type));
    }

    // Sort by date, priority
    notifications.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    const total = notifications.length;
    const unread = notifications.filter(n => !n.read).length;

    // Paginate
    if (options?.offset || options?.limit) {
      const start = options.offset || 0;
      const end = options.limit ? start + options.limit : undefined;
      notifications = notifications.slice(start, end);
    }

    return { notifications, total, unread };
  }

  // Mark as read
  markAsRead(notificationId: string, userId: string): boolean {
    const notification = this.notifications.get(notificationId);
    if (!notification || notification.userId !== userId) {
      return false;
    }

    notification.read = true;
    notification.readAt = new Date();

    this.io.to(`user:${userId}`).emit('notification:updated', notification);
    this.io.to(`user:${userId}`).emit('notification:count', this.getUnreadCount(userId));

    return true;
  }

  // Mark all as read
  markAllAsRead(userId: string): number {
    const userNotifIds = this.userNotifications.get(userId) || new Set();
    let count = 0;

    userNotifIds.forEach(id => {
      const notif = this.notifications.get(id);
      if (notif && !notif.read) {
        notif.read = true;
        notif.readAt = new Date();
        count++;
      }
    });

    this.io.to(`user:${userId}`).emit('notification:allRead');
    this.io.to(`user:${userId}`).emit('notification:count', 0);

    return count;
  }

  // Delete notification
  deleteNotification(notificationId: string, userId: string): boolean {
    const notification = this.notifications.get(notificationId);
    if (!notification || notification.userId !== userId) {
      return false;
    }

    this.notifications.delete(notificationId);
    this.userNotifications.get(userId)?.delete(notificationId);

    this.io.to(`user:${userId}`).emit('notification:deleted', notificationId);
    this.io.to(`user:${userId}`).emit('notification:count', this.getUnreadCount(userId));

    return true;
  }

  // Clear all notifications
  clearAllNotifications(userId: string): number {
    const userNotifIds = this.userNotifications.get(userId) || new Set();
    const count = userNotifIds.size;

    userNotifIds.forEach(id => {
      this.notifications.delete(id);
    });
    this.userNotifications.delete(userId);

    this.io.to(`user:${userId}`).emit('notification:cleared');
    this.io.to(`user:${userId}`).emit('notification:count', 0);

    return count;
  }

  // Get unread count
  getUnreadCount(userId: string): number {
    const userNotifIds = this.userNotifications.get(userId) || new Set();
    let count = 0;

    userNotifIds.forEach(id => {
      const notif = this.notifications.get(id);
      if (notif && !notif.read && (!notif.expiresAt || notif.expiresAt > new Date())) {
        count++;
      }
    });

    return count;
  }

  // Get statistics
  getStats(userId: string): NotificationStats {
    const userNotifIds = this.userNotifications.get(userId) || new Set();
    const byType: Record<string, number> = {};
    let total = 0;
    let unread = 0;

    userNotifIds.forEach(id => {
      const notif = this.notifications.get(id);
      if (notif) {
        total++;
        if (!notif.read) unread++;
        byType[notif.type] = (byType[notif.type] || 0) + 1;
      }
    });

    return { total, unread, byType: byType as Record<NotificationType, number> };
  }

  // Preferences management
  setPreferences(userId: string, preferences: Partial<NotificationPreferences>): void {
    const existing = this.preferences.get(userId) || this.getDefaultPreferences(userId);
    this.preferences.set(userId, { ...existing, ...preferences });
  }

  getPreferences(userId: string): NotificationPreferences {
    return this.preferences.get(userId) || this.getDefaultPreferences(userId);
  }

  private getDefaultPreferences(userId: string): NotificationPreferences {
    return {
      userId,
      enabled: true,
      types: {
        info: { enabled: true, channels: ['inApp'] },
        success: { enabled: true, channels: ['inApp'] },
        warning: { enabled: true, channels: ['inApp'] },
        error: { enabled: true, channels: ['inApp', 'email'] },
        mention: { enabled: true, channels: ['inApp', 'email', 'push'] },
        comment: { enabled: true, channels: ['inApp'] },
        like: { enabled: true, channels: ['inApp'] },
        follow: { enabled: true, channels: ['inApp'] },
        share: { enabled: true, channels: ['inApp'] },
        message: { enabled: true, channels: ['inApp', 'push'] },
        order: { enabled: true, channels: ['inApp', 'email'] },
        payment: { enabled: true, channels: ['inApp', 'email'] },
        system: { enabled: true, channels: ['inApp'] },
        custom: { enabled: true, channels: ['inApp'] }
      },
      soundEnabled: true
    };
  }

  private shouldSendNotification(prefs: NotificationPreferences, type: NotificationType): boolean {
    if (!prefs.enabled) return false;

    const typePrefs = prefs.types[type];
    if (!typePrefs?.enabled || !typePrefs.channels.includes('inApp')) {
      return false;
    }

    // Check quiet hours
    if (prefs.quietHours?.enabled) {
      const now = new Date();
      const [startHour, startMin] = prefs.quietHours.start.split(':').map(Number);
      const [endHour, endMin] = prefs.quietHours.end.split(':').map(Number);

      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      if (startMinutes <= endMinutes) {
        if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
          return false;
        }
      } else {
        if (currentMinutes >= startMinutes || currentMinutes < endMinutes) {
          return false;
        }
      }
    }

    return true;
  }

  private applyTemplate(template: string, variables: Record<string, string>): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return result;
  }

  private generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  // Check if user is online
  isUserOnline(userId: string): boolean {
    return (this.userSockets.get(userId)?.size || 0) > 0;
  }

  // Get online users
  getOnlineUsers(): string[] {
    return Array.from(this.userSockets.keys());
  }
}
```

### Express API Routes

```typescript
// routes/notifications.ts
import { Router, Request, Response } from 'express';
import { InAppNotificationService } from '../notifications/in-app-service';

export function createNotificationRoutes(notificationService: InAppNotificationService): Router {
  const router = Router();

  // Get notifications
  router.get('/', (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { limit, offset, unreadOnly, types } = req.query;

    const result = notificationService.getNotifications(userId, {
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
      unreadOnly: unreadOnly === 'true',
      types: types ? (types as string).split(',') as any : undefined
    });

    res.json(result);
  });

  // Get unread count
  router.get('/count', (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const count = notificationService.getUnreadCount(userId);
    res.json({ count });
  });

  // Get statistics
  router.get('/stats', (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const stats = notificationService.getStats(userId);
    res.json(stats);
  });

  // Mark as read
  router.post('/:id/read', (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const success = notificationService.markAsRead(req.params.id, userId);
    res.json({ success });
  });

  // Mark all as read
  router.post('/read-all', (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const count = notificationService.markAllAsRead(userId);
    res.json({ success: true, count });
  });

  // Delete notification
  router.delete('/:id', (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const success = notificationService.deleteNotification(req.params.id, userId);
    res.json({ success });
  });

  // Clear all
  router.delete('/', (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const count = notificationService.clearAllNotifications(userId);
    res.json({ success: true, count });
  });

  // Get preferences
  router.get('/preferences', (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const preferences = notificationService.getPreferences(userId);
    res.json(preferences);
  });

  // Update preferences
  router.put('/preferences', (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    notificationService.setPreferences(userId, req.body);
    res.json({ success: true });
  });

  // Create notification (admin/internal)
  router.post('/', (req: Request, res: Response) => {
    const { userId, type, title, message, data, actionUrl, priority } = req.body;

    notificationService.createNotification({
      userId,
      type,
      title,
      message,
      data,
      actionUrl,
      priority
    }).then(notification => {
      res.json({ success: true, notification });
    }).catch(error => {
      res.status(500).json({ error: error.message });
    });
  });

  // Broadcast notification (admin)
  router.post('/broadcast', (req: Request, res: Response) => {
    const { type, title, message, data, actionUrl, priority } = req.body;

    notificationService.broadcastNotification({
      type,
      title,
      message,
      data,
      actionUrl,
      priority
    }).then(() => {
      res.json({ success: true });
    }).catch(error => {
      res.status(500).json({ error: error.message });
    });
  });

  return router;
}
```

### React Notification Components

```tsx
// hooks/useNotifications.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  actionUrl?: string;
  imageUrl?: string;
  priority: string;
  read: boolean;
  createdAt: string;
}

interface UseNotificationsOptions {
  userId: string;
  serverUrl?: string;
  onNewNotification?: (notification: Notification) => void;
}

export function useNotifications({
  userId,
  serverUrl = '',
  onNewNotification
}: UseNotificationsOptions) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Connect to WebSocket
    const socket = io(serverUrl, {
      path: '/notifications',
      auth: { userId }
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('notification:new', (notification: Notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      onNewNotification?.(notification);
    });

    socket.on('notification:count', (count: number) => {
      setUnreadCount(count);
    });

    socket.on('notification:updated', (notification: Notification) => {
      setNotifications(prev =>
        prev.map(n => n.id === notification.id ? notification : n)
      );
    });

    socket.on('notification:deleted', (notificationId: string) => {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    });

    socket.on('notification:allRead', () => {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    });

    socket.on('notification:cleared', () => {
      setNotifications([]);
    });

    // Load initial notifications
    fetchNotifications();

    return () => {
      socket.disconnect();
    };
  }, [userId, serverUrl]);

  const fetchNotifications = useCallback(async (options?: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
  }) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (options?.limit) params.set('limit', options.limit.toString());
      if (options?.offset) params.set('offset', options.offset.toString());
      if (options?.unreadOnly) params.set('unreadOnly', 'true');

      const response = await fetch(`/api/notifications?${params}`);
      const data = await response.json();

      if (options?.offset) {
        setNotifications(prev => [...prev, ...data.notifications]);
      } else {
        setNotifications(data.notifications);
      }
      setUnreadCount(data.unread);
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (notificationId: string) => {
    socketRef.current?.emit('notification:markRead', notificationId);

    // Optimistic update
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(async () => {
    socketRef.current?.emit('notification:markAllRead');

    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const deleteNotification = useCallback(async (notificationId: string) => {
    socketRef.current?.emit('notification:delete', notificationId);

    // Optimistic update
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  const clearAll = useCallback(async () => {
    await fetch('/api/notifications', { method: 'DELETE' });
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  return {
    notifications,
    unreadCount,
    connected,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll
  };
}
```

```tsx
// components/NotificationCenter.tsx
import React, { useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';

interface NotificationCenterProps {
  userId: string;
}

export function NotificationCenter({ userId }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    connected,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    fetchNotifications
  } = useNotifications({
    userId,
    onNewNotification: (notification) => {
      // Show toast notification
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: notification.imageUrl
        });
      }
    }
  });

  const handleNotificationClick = (notification: any) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
    setIsOpen(false);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      mention: '@',
      comment: '💬',
      like: '❤️',
      follow: '👤',
      message: '✉️',
      order: '📦',
      payment: '💳',
      system: 'ℹ️',
      warning: '⚠️',
      error: '❌',
      success: '✅'
    };
    return icons[type] || '🔔';
  };

  return (
    <div className="notification-center">
      {/* Bell Icon */}
      <button
        className="notification-bell"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            <div className="notification-actions">
              {unreadCount > 0 && (
                <button onClick={markAllAsRead}>Mark all read</button>
              )}
              {notifications.length > 0 && (
                <button onClick={clearAll}>Clear all</button>
              )}
            </div>
          </div>

          <div className="notification-list">
            {loading && notifications.length === 0 ? (
              <div className="notification-loading">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">
                No notifications yet
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`notification-item ${notification.read ? 'read' : 'unread'} priority-${notification.priority}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-icon">
                    {notification.imageUrl ? (
                      <img src={notification.imageUrl} alt="" />
                    ) : (
                      <span>{getTypeIcon(notification.type)}</span>
                    )}
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">{notification.title}</div>
                    <div className="notification-message">{notification.message}</div>
                    <div className="notification-time">
                      {formatTime(notification.createdAt)}
                    </div>
                  </div>
                  <button
                    className="notification-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification.id);
                    }}
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <button
              className="notification-load-more"
              onClick={() => fetchNotifications({ offset: notifications.length })}
            >
              Load more
            </button>
          )}

          <div className={`notification-status ${connected ? 'connected' : 'disconnected'}`}>
            {connected ? 'Live updates enabled' : 'Reconnecting...'}
          </div>
        </div>
      )}
    </div>
  );
}
```

## Python Implementation

```python
# notifications/in_app_service.py
import asyncio
from datetime import datetime
from typing import Dict, List, Optional, Any, Set
from dataclasses import dataclass, field, asdict
import socketio

@dataclass
class Notification:
    id: str
    user_id: str
    type: str
    title: str
    message: str
    data: Optional[Dict[str, Any]] = None
    action_url: Optional[str] = None
    image_url: Optional[str] = None
    priority: str = 'normal'
    read: bool = False
    read_at: Optional[datetime] = None
    created_at: datetime = field(default_factory=datetime.now)

class InAppNotificationService:
    def __init__(self):
        self.sio = socketio.AsyncServer(
            async_mode='asgi',
            cors_allowed_origins='*'
        )
        self.notifications: Dict[str, Notification] = {}
        self.user_notifications: Dict[str, Set[str]] = {}
        self.user_sockets: Dict[str, Set[str]] = {}

        self._setup_handlers()

    def _setup_handlers(self):
        @self.sio.event
        async def connect(sid, environ, auth):
            user_id = auth.get('userId') if auth else None
            if not user_id:
                return False

            if user_id not in self.user_sockets:
                self.user_sockets[user_id] = set()
            self.user_sockets[user_id].add(sid)

            await self.sio.enter_room(sid, f'user:{user_id}')
            await self.sio.emit('notification:count', self.get_unread_count(user_id), room=sid)
            return True

        @self.sio.event
        async def disconnect(sid):
            for user_id, sockets in self.user_sockets.items():
                if sid in sockets:
                    sockets.discard(sid)
                    break

        @self.sio.event
        async def notification_mark_read(sid, notification_id):
            for user_id, sockets in self.user_sockets.items():
                if sid in sockets:
                    self.mark_as_read(notification_id, user_id)
                    break

    async def create_notification(
        self,
        user_id: str,
        type: str,
        title: str,
        message: str,
        data: Optional[Dict] = None,
        action_url: Optional[str] = None,
        priority: str = 'normal'
    ) -> Notification:
        notification = Notification(
            id=f'notif_{datetime.now().timestamp()}_{user_id[:8]}',
            user_id=user_id,
            type=type,
            title=title,
            message=message,
            data=data,
            action_url=action_url,
            priority=priority
        )

        self.notifications[notification.id] = notification
        if user_id not in self.user_notifications:
            self.user_notifications[user_id] = set()
        self.user_notifications[user_id].add(notification.id)

        await self.sio.emit('notification:new', asdict(notification), room=f'user:{user_id}')
        await self.sio.emit('notification:count', self.get_unread_count(user_id), room=f'user:{user_id}')

        return notification

    def get_notifications(
        self,
        user_id: str,
        limit: int = 50,
        offset: int = 0,
        unread_only: bool = False
    ) -> Dict[str, Any]:
        notif_ids = self.user_notifications.get(user_id, set())
        notifications = [self.notifications[nid] for nid in notif_ids if nid in self.notifications]

        if unread_only:
            notifications = [n for n in notifications if not n.read]

        notifications.sort(key=lambda n: n.created_at, reverse=True)
        total = len(notifications)
        unread = sum(1 for n in notifications if not n.read)

        notifications = notifications[offset:offset + limit]

        return {
            'notifications': [asdict(n) for n in notifications],
            'total': total,
            'unread': unread
        }

    def mark_as_read(self, notification_id: str, user_id: str) -> bool:
        notification = self.notifications.get(notification_id)
        if not notification or notification.user_id != user_id:
            return False

        notification.read = True
        notification.read_at = datetime.now()
        return True

    def get_unread_count(self, user_id: str) -> int:
        notif_ids = self.user_notifications.get(user_id, set())
        return sum(1 for nid in notif_ids if nid in self.notifications and not self.notifications[nid].read)

    def get_app(self):
        return socketio.ASGIApp(self.sio)
```

## CLAUDE.md Integration

```markdown
## In-App Notifications

### WebSocket Connection
Connect with Socket.io: `io('/notifications', { auth: { userId } })`

### Real-time Events
- `notification:new` - New notification received
- `notification:count` - Unread count updated
- `notification:updated` - Notification modified
- `notification:deleted` - Notification removed

### API Endpoints
- GET `/api/notifications` - List notifications
- POST `/api/notifications/:id/read` - Mark as read
- POST `/api/notifications/read-all` - Mark all read
- DELETE `/api/notifications/:id` - Delete one
- DELETE `/api/notifications` - Clear all

### Notification Types
info, success, warning, error, mention, comment, like, follow, share, message, order, payment, system

### Preferences
- Enable/disable by type
- Channel selection (inApp, email, push, sms)
- Quiet hours configuration

### React Integration
Use `useNotifications` hook for automatic WebSocket handling
`NotificationCenter` component for dropdown UI
```

## AI Suggestions

1. **Add notification grouping** - Group similar notifications together
2. **Implement notification stacking** - Stack multiple toasts
3. **Build notification center page** - Full-page notification history
4. **Add notification search** - Search through past notifications
5. **Implement snooze** - Snooze notifications for later
6. **Create notification templates** - Admin-defined templates
7. **Add rich notifications** - Support images, buttons, progress
8. **Build notification analytics** - Track engagement metrics
9. **Implement priority queuing** - Process urgent notifications first
10. **Add notification expiry** - Auto-remove old notifications
