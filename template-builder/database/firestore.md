# Google Cloud Firestore Template

## Overview

Complete Firestore setup with TypeScript, collections, subcollections, real-time listeners, transactions, security rules, and offline support for web and server applications.

## Installation

```bash
# Firebase SDK (Web/Node.js)
npm install firebase firebase-admin

# For Next.js with Firebase
npm install firebase firebase-admin

# Optional
npm install nanoid
```

## Environment Variables

```env
# Firebase Web SDK
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Or use service account file
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
```

## Project Structure

```
src/
├── lib/
│   └── firebase/
│       ├── client.ts
│       ├── admin.ts
│       ├── config.ts
│       └── types.ts
├── db/
│   ├── collections/
│   │   ├── users.ts
│   │   ├── posts.ts
│   │   └── comments.ts
│   ├── repositories/
│   │   ├── BaseRepository.ts
│   │   ├── UserRepository.ts
│   │   └── PostRepository.ts
│   └── converters/
│       └── index.ts
└── hooks/
    ├── useFirestore.ts
    └── useRealtimeDoc.ts
```

## Firebase Configuration

```typescript
// src/lib/firebase/config.ts
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

export const adminConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID!,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};
```

## Client-Side Firebase

```typescript
// src/lib/firebase/client.ts
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  Firestore,
  connectFirestoreEmulator,
  enableIndexedDbPersistence,
  enableMultiTabIndexedDbPersistence,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  CACHE_SIZE_UNLIMITED,
} from 'firebase/firestore';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import { getStorage, FirebaseStorage, connectStorageEmulator } from 'firebase/storage';
import { firebaseConfig } from './config';

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;
let storage: FirebaseStorage;

function initializeFirebaseClient() {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);

    // Initialize Firestore with persistence
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
        cacheSizeBytes: CACHE_SIZE_UNLIMITED,
      }),
    });

    auth = getAuth(app);
    storage = getStorage(app);

    // Connect to emulators in development
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      if (process.env.NEXT_PUBLIC_USE_EMULATORS === 'true') {
        connectFirestoreEmulator(db, 'localhost', 8080);
        connectAuthEmulator(auth, 'http://localhost:9099');
        connectStorageEmulator(storage, 'localhost', 9199);
      }
    }
  } else {
    app = getApps()[0];
    db = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app);
  }

  return { app, db, auth, storage };
}

// Initialize on import
const firebase = initializeFirebaseClient();

export const firebaseApp = firebase.app;
export const firestore = firebase.db;
export const firebaseAuth = firebase.auth;
export const firebaseStorage = firebase.storage;

export { app, db, auth, storage };
```

## Admin SDK (Server-Side)

```typescript
// src/lib/firebase/admin.ts
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getStorage, Storage } from 'firebase-admin/storage';
import { adminConfig } from './config';

let adminApp: App;
let adminDb: Firestore;
let adminAuth: Auth;
let adminStorage: Storage;

function initializeFirebaseAdmin() {
  if (getApps().length === 0) {
    adminApp = initializeApp({
      credential: cert({
        projectId: adminConfig.projectId,
        clientEmail: adminConfig.clientEmail,
        privateKey: adminConfig.privateKey,
      }),
    });
  } else {
    adminApp = getApps()[0];
  }

  adminDb = getFirestore(adminApp);
  adminAuth = getAuth(adminApp);
  adminStorage = getStorage(adminApp);

  // Enable Firestore settings
  adminDb.settings({
    ignoreUndefinedProperties: true,
  });

  return { adminApp, adminDb, adminAuth, adminStorage };
}

const admin = initializeFirebaseAdmin();

export const firestoreAdmin = admin.adminDb;
export const authAdmin = admin.adminAuth;
export const storageAdmin = admin.adminStorage;

export { adminApp, adminDb, adminAuth, adminStorage };
```

## Type Definitions

```typescript
// src/lib/firebase/types.ts
import { Timestamp, FieldValue } from 'firebase/firestore';

// Base document interface
export interface BaseDocument {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// User document
export interface UserDocument extends BaseDocument {
  email: string;
  displayName: string | null;
  photoURL: string | null;
  role: 'user' | 'admin' | 'moderator';
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  emailVerified: boolean;
  lastLoginAt: Timestamp | null;
  loginCount: number;
  metadata: Record<string, any>;
}

// User profile (subcollection)
export interface ProfileDocument extends BaseDocument {
  bio: string | null;
  website: string | null;
  location: string | null;
  dateOfBirth: Timestamp | null;
  phoneNumber: string | null;
  socialLinks: Record<string, string>;
  preferences: Record<string, any>;
}

// Post document
export interface PostDocument extends BaseDocument {
  authorId: string;
  authorRef: FirebaseFirestore.DocumentReference;
  categoryId: string | null;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featuredImage: string | null;
  status: 'draft' | 'published' | 'archived';
  publishedAt: Timestamp | null;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  tags: string[];
  metadata: Record<string, any>;
}

// Comment document (subcollection of posts)
export interface CommentDocument extends BaseDocument {
  postId: string;
  authorId: string;
  authorRef: FirebaseFirestore.DocumentReference;
  parentId: string | null;
  content: string;
  status: 'pending' | 'approved' | 'spam' | 'rejected';
  likeCount: number;
  replyCount: number;
}

// Category document
export interface CategoryDocument extends BaseDocument {
  parentId: string | null;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  sortOrder: number;
  postCount: number;
}

// Tag document
export interface TagDocument extends BaseDocument {
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  postCount: number;
}

// Like document (for tracking who liked what)
export interface LikeDocument extends BaseDocument {
  userId: string;
  targetType: 'post' | 'comment';
  targetId: string;
}

// Type helpers
export type CreateData<T extends BaseDocument> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateData<T extends BaseDocument> = Partial<Omit<T, 'id' | 'createdAt'>>;
```

## Firestore Converters

```typescript
// src/db/converters/index.ts
import {
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  DocumentData,
  Timestamp,
  serverTimestamp,
  SnapshotOptions,
} from 'firebase/firestore';
import type {
  BaseDocument,
  UserDocument,
  PostDocument,
  CommentDocument,
  CategoryDocument,
} from '@/lib/firebase/types';

// Generic converter factory
export function createConverter<T extends BaseDocument>(): FirestoreDataConverter<T> {
  return {
    toFirestore(data: T): DocumentData {
      const { id, ...docData } = data;
      return {
        ...docData,
        updatedAt: serverTimestamp(),
      };
    },
    fromFirestore(
      snapshot: QueryDocumentSnapshot<DocumentData>,
      options?: SnapshotOptions
    ): T {
      const data = snapshot.data(options);
      return {
        id: snapshot.id,
        ...data,
      } as T;
    },
  };
}

// Create converter for new documents
export function createDocConverter<T extends BaseDocument>(): FirestoreDataConverter<T> {
  return {
    toFirestore(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): DocumentData {
      return {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
    },
    fromFirestore(
      snapshot: QueryDocumentSnapshot<DocumentData>,
      options?: SnapshotOptions
    ): T {
      const data = snapshot.data(options);
      return {
        id: snapshot.id,
        ...data,
      } as T;
    },
  };
}

// Specific converters
export const userConverter = createConverter<UserDocument>();
export const postConverter = createConverter<PostDocument>();
export const commentConverter = createConverter<CommentDocument>();
export const categoryConverter = createConverter<CategoryDocument>();
```

## Collection References

```typescript
// src/db/collections/users.ts
import { collection, doc, CollectionReference, DocumentReference } from 'firebase/firestore';
import { firestore } from '@/lib/firebase/client';
import { userConverter } from '../converters';
import type { UserDocument, ProfileDocument } from '@/lib/firebase/types';

// Collection names
export const COLLECTIONS = {
  USERS: 'users',
  PROFILES: 'profiles',
  POSTS: 'posts',
  COMMENTS: 'comments',
  CATEGORIES: 'categories',
  TAGS: 'tags',
  LIKES: 'likes',
} as const;

// Users collection
export const usersCollection = collection(firestore, COLLECTIONS.USERS).withConverter(
  userConverter
) as CollectionReference<UserDocument>;

// User document reference
export const userDoc = (userId: string): DocumentReference<UserDocument> =>
  doc(firestore, COLLECTIONS.USERS, userId).withConverter(userConverter);

// User profile subcollection
export const userProfileCollection = (userId: string) =>
  collection(firestore, COLLECTIONS.USERS, userId, COLLECTIONS.PROFILES);

export const userProfileDoc = (userId: string) =>
  doc(firestore, COLLECTIONS.USERS, userId, COLLECTIONS.PROFILES, 'main');
```

```typescript
// src/db/collections/posts.ts
import { collection, doc, CollectionReference, DocumentReference } from 'firebase/firestore';
import { firestore } from '@/lib/firebase/client';
import { postConverter, commentConverter } from '../converters';
import type { PostDocument, CommentDocument } from '@/lib/firebase/types';
import { COLLECTIONS } from './users';

// Posts collection
export const postsCollection = collection(firestore, COLLECTIONS.POSTS).withConverter(
  postConverter
) as CollectionReference<PostDocument>;

// Post document reference
export const postDoc = (postId: string): DocumentReference<PostDocument> =>
  doc(firestore, COLLECTIONS.POSTS, postId).withConverter(postConverter);

// Comments subcollection
export const postCommentsCollection = (postId: string) =>
  collection(firestore, COLLECTIONS.POSTS, postId, COLLECTIONS.COMMENTS).withConverter(
    commentConverter
  ) as CollectionReference<CommentDocument>;

export const commentDoc = (postId: string, commentId: string) =>
  doc(firestore, COLLECTIONS.POSTS, postId, COLLECTIONS.COMMENTS, commentId).withConverter(
    commentConverter
  );
```

## Base Repository

```typescript
// src/db/repositories/BaseRepository.ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  endBefore,
  limitToLast,
  DocumentReference,
  CollectionReference,
  QueryConstraint,
  QueryDocumentSnapshot,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  writeBatch,
  runTransaction,
  Firestore,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import type { BaseDocument, CreateData, UpdateData } from '@/lib/firebase/types';

export interface PaginationOptions {
  limit?: number;
  startAfterDoc?: QueryDocumentSnapshot;
  endBeforeDoc?: QueryDocumentSnapshot;
  orderByField?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  lastDoc: QueryDocumentSnapshot | null;
  firstDoc: QueryDocumentSnapshot | null;
  hasMore: boolean;
}

export abstract class BaseRepository<T extends BaseDocument> {
  protected db: Firestore;
  protected collectionRef: CollectionReference<T>;
  protected collectionName: string;

  constructor(db: Firestore, collectionRef: CollectionReference<T>, collectionName: string) {
    this.db = db;
    this.collectionRef = collectionRef;
    this.collectionName = collectionName;
  }

  // Get document by ID
  async findById(id: string): Promise<T | null> {
    const docRef = doc(this.collectionRef, id);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? snapshot.data() : null;
  }

  // Get all documents
  async findAll(constraints: QueryConstraint[] = []): Promise<T[]> {
    const q = query(this.collectionRef, ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data());
  }

  // Get documents with pagination
  async findPaginated(
    options: PaginationOptions = {},
    constraints: QueryConstraint[] = []
  ): Promise<PaginatedResult<T>> {
    const {
      limit: pageLimit = 20,
      startAfterDoc,
      endBeforeDoc,
      orderByField = 'createdAt',
      orderDirection = 'desc',
    } = options;

    const queryConstraints: QueryConstraint[] = [
      ...constraints,
      orderBy(orderByField, orderDirection),
    ];

    if (startAfterDoc) {
      queryConstraints.push(startAfter(startAfterDoc));
    }

    if (endBeforeDoc) {
      queryConstraints.push(endBefore(endBeforeDoc));
      queryConstraints.push(limitToLast(pageLimit + 1));
    } else {
      queryConstraints.push(limit(pageLimit + 1));
    }

    const q = query(this.collectionRef, ...queryConstraints);
    const snapshot = await getDocs(q);

    const hasMore = snapshot.docs.length > pageLimit;
    const docs = hasMore ? snapshot.docs.slice(0, -1) : snapshot.docs;

    return {
      data: docs.map((doc) => doc.data()),
      lastDoc: docs[docs.length - 1] || null,
      firstDoc: docs[0] || null,
      hasMore,
    };
  }

  // Create document with auto-generated ID
  async create(data: CreateData<T>): Promise<T> {
    const docRef = doc(this.collectionRef);
    const docData = {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    } as any;

    await setDoc(docRef, docData);

    // Fetch the created document to get server timestamps
    const created = await getDoc(docRef);
    return created.data()!;
  }

  // Create document with specific ID
  async createWithId(id: string, data: CreateData<T>): Promise<T> {
    const docRef = doc(this.collectionRef, id);
    const docData = {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    } as any;

    await setDoc(docRef, docData);

    const created = await getDoc(docRef);
    return created.data()!;
  }

  // Update document
  async update(id: string, data: UpdateData<T>): Promise<T | null> {
    const docRef = doc(this.collectionRef, id);

    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    } as any);

    const updated = await getDoc(docRef);
    return updated.exists() ? updated.data() : null;
  }

  // Delete document
  async delete(id: string): Promise<boolean> {
    const docRef = doc(this.collectionRef, id);
    await deleteDoc(docRef);
    return true;
  }

  // Increment field
  async incrementField(id: string, field: keyof T, amount: number = 1): Promise<void> {
    const docRef = doc(this.collectionRef, id);
    await updateDoc(docRef, {
      [field]: increment(amount),
      updatedAt: serverTimestamp(),
    } as any);
  }

  // Add to array field
  async addToArray(id: string, field: keyof T, value: any): Promise<void> {
    const docRef = doc(this.collectionRef, id);
    await updateDoc(docRef, {
      [field]: arrayUnion(value),
      updatedAt: serverTimestamp(),
    } as any);
  }

  // Remove from array field
  async removeFromArray(id: string, field: keyof T, value: any): Promise<void> {
    const docRef = doc(this.collectionRef, id);
    await updateDoc(docRef, {
      [field]: arrayRemove(value),
      updatedAt: serverTimestamp(),
    } as any);
  }

  // Batch operations
  async batchCreate(items: CreateData<T>[]): Promise<void> {
    const batch = writeBatch(this.db);

    for (const item of items) {
      const docRef = doc(this.collectionRef);
      batch.set(docRef, {
        ...item,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      } as any);
    }

    await batch.commit();
  }

  async batchUpdate(updates: Array<{ id: string; data: UpdateData<T> }>): Promise<void> {
    const batch = writeBatch(this.db);

    for (const { id, data } of updates) {
      const docRef = doc(this.collectionRef, id);
      batch.update(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      } as any);
    }

    await batch.commit();
  }

  async batchDelete(ids: string[]): Promise<void> {
    const batch = writeBatch(this.db);

    for (const id of ids) {
      const docRef = doc(this.collectionRef, id);
      batch.delete(docRef);
    }

    await batch.commit();
  }

  // Transaction
  async runTransaction<R>(
    callback: (transaction: any) => Promise<R>
  ): Promise<R> {
    return runTransaction(this.db, callback);
  }

  // Real-time listener
  subscribe(
    id: string,
    callback: (data: T | null) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    const docRef = doc(this.collectionRef, id);
    return onSnapshot(
      docRef,
      (snapshot) => {
        callback(snapshot.exists() ? snapshot.data() : null);
      },
      onError
    );
  }

  // Real-time collection listener
  subscribeToQuery(
    constraints: QueryConstraint[],
    callback: (data: T[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    const q = query(this.collectionRef, ...constraints);
    return onSnapshot(
      q,
      (snapshot) => {
        callback(snapshot.docs.map((doc) => doc.data()));
      },
      onError
    );
  }
}
```

## User Repository

```typescript
// src/db/repositories/UserRepository.ts
import {
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  increment,
} from 'firebase/firestore';
import { firestore } from '@/lib/firebase/client';
import { BaseRepository, PaginatedResult, PaginationOptions } from './BaseRepository';
import { usersCollection, userDoc, userProfileDoc } from '../collections/users';
import type {
  UserDocument,
  ProfileDocument,
  CreateData,
  UpdateData,
} from '@/lib/firebase/types';

export interface UserFilters {
  role?: UserDocument['role'];
  status?: UserDocument['status'];
  emailVerified?: boolean;
}

export interface UserWithProfile extends UserDocument {
  profile?: ProfileDocument;
}

export class UserRepository extends BaseRepository<UserDocument> {
  constructor() {
    super(firestore, usersCollection, 'users');
  }

  // Create user with profile
  async createUser(
    userId: string,
    data: {
      email: string;
      displayName?: string;
      photoURL?: string;
    }
  ): Promise<UserDocument> {
    const user = await this.createWithId(userId, {
      email: data.email.toLowerCase(),
      displayName: data.displayName || null,
      photoURL: data.photoURL || null,
      role: 'user',
      status: 'pending',
      emailVerified: false,
      lastLoginAt: null,
      loginCount: 0,
      metadata: {},
    });

    // Create profile subcollection document
    const profileRef = userProfileDoc(userId);
    await setDoc(profileRef, {
      bio: null,
      website: null,
      location: null,
      dateOfBirth: null,
      phoneNumber: null,
      socialLinks: {},
      preferences: {},
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return user;
  }

  // Find user by email
  async findByEmail(email: string): Promise<UserDocument | null> {
    const q = query(
      this.collectionRef,
      where('email', '==', email.toLowerCase()),
      limit(1)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs[0]?.data() || null;
  }

  // Find user with profile
  async findWithProfile(userId: string): Promise<UserWithProfile | null> {
    const user = await this.findById(userId);
    if (!user) return null;

    const profileRef = userProfileDoc(userId);
    const profileSnapshot = await getDocs(
      query(profileRef.parent!, limit(1))
    );
    const profile = profileSnapshot.docs[0]?.data() as ProfileDocument | undefined;

    return { ...user, profile };
  }

  // Update profile
  async updateProfile(
    userId: string,
    data: UpdateData<ProfileDocument>
  ): Promise<void> {
    const profileRef = userProfileDoc(userId);
    await updateDoc(profileRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  }

  // Update last login
  async updateLastLogin(userId: string): Promise<void> {
    await this.update(userId, {
      lastLoginAt: Timestamp.now(),
    } as UpdateData<UserDocument>);
    await this.incrementField(userId, 'loginCount');
  }

  // Verify email
  async verifyEmail(userId: string): Promise<void> {
    await this.update(userId, {
      emailVerified: true,
      status: 'active',
    } as UpdateData<UserDocument>);
  }

  // Find users with filters
  async findWithFilters(
    filters: UserFilters,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<UserDocument>> {
    const constraints = [];

    if (filters.role) {
      constraints.push(where('role', '==', filters.role));
    }

    if (filters.status) {
      constraints.push(where('status', '==', filters.status));
    }

    if (filters.emailVerified !== undefined) {
      constraints.push(where('emailVerified', '==', filters.emailVerified));
    }

    return this.findPaginated(pagination, constraints);
  }

  // Get user stats
  async getStats(): Promise<{
    total: number;
    active: number;
    pending: number;
    byRole: Record<string, number>;
  }> {
    const allUsers = await this.findAll();

    const stats = {
      total: allUsers.length,
      active: 0,
      pending: 0,
      byRole: {} as Record<string, number>,
    };

    for (const user of allUsers) {
      if (user.status === 'active') stats.active++;
      if (user.status === 'pending') stats.pending++;

      stats.byRole[user.role] = (stats.byRole[user.role] || 0) + 1;
    }

    return stats;
  }
}

export const userRepository = new UserRepository();
```

## Post Repository

```typescript
// src/db/repositories/PostRepository.ts
import {
  query,
  where,
  orderBy,
  getDocs,
  doc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { firestore } from '@/lib/firebase/client';
import { BaseRepository, PaginatedResult, PaginationOptions } from './BaseRepository';
import { postsCollection, postDoc, postCommentsCollection } from '../collections/posts';
import type {
  PostDocument,
  CommentDocument,
  CreateData,
  UpdateData,
} from '@/lib/firebase/types';

export interface PostFilters {
  authorId?: string;
  categoryId?: string;
  status?: PostDocument['status'];
  tags?: string[];
}

export class PostRepository extends BaseRepository<PostDocument> {
  constructor() {
    super(firestore, postsCollection, 'posts');
  }

  // Generate slug from title
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .substring(0, 100);
  }

  // Create post
  async createPost(data: {
    authorId: string;
    title: string;
    content: string;
    excerpt?: string;
    categoryId?: string;
    tags?: string[];
    featuredImage?: string;
    status?: PostDocument['status'];
  }): Promise<PostDocument> {
    const slug = this.generateSlug(data.title);
    const authorRef = doc(firestore, 'users', data.authorId);

    return this.create({
      authorId: data.authorId,
      authorRef: authorRef as any,
      categoryId: data.categoryId || null,
      title: data.title,
      slug,
      excerpt: data.excerpt || null,
      content: data.content,
      featuredImage: data.featuredImage || null,
      status: data.status || 'draft',
      publishedAt: null,
      viewCount: 0,
      likeCount: 0,
      commentCount: 0,
      tags: data.tags || [],
      metadata: {},
    });
  }

  // Find post by slug
  async findBySlug(slug: string): Promise<PostDocument | null> {
    const q = query(this.collectionRef, where('slug', '==', slug));
    const snapshot = await getDocs(q);
    return snapshot.docs[0]?.data() || null;
  }

  // Find posts by author
  async findByAuthor(
    authorId: string,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<PostDocument>> {
    return this.findPaginated(pagination, [
      where('authorId', '==', authorId),
    ]);
  }

  // Find published posts
  async findPublished(
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<PostDocument>> {
    return this.findPaginated(
      { ...pagination, orderByField: 'publishedAt' },
      [where('status', '==', 'published')]
    );
  }

  // Find posts by tag
  async findByTag(
    tag: string,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<PostDocument>> {
    return this.findPaginated(pagination, [
      where('tags', 'array-contains', tag),
      where('status', '==', 'published'),
    ]);
  }

  // Publish post
  async publish(postId: string): Promise<PostDocument | null> {
    return this.update(postId, {
      status: 'published',
      publishedAt: Timestamp.now(),
    } as UpdateData<PostDocument>);
  }

  // Archive post
  async archive(postId: string): Promise<PostDocument | null> {
    return this.update(postId, {
      status: 'archived',
    } as UpdateData<PostDocument>);
  }

  // Increment view count
  async incrementViews(postId: string): Promise<void> {
    await this.incrementField(postId, 'viewCount');
  }

  // Add comment
  async addComment(
    postId: string,
    data: {
      authorId: string;
      content: string;
      parentId?: string;
    }
  ): Promise<CommentDocument> {
    const commentsRef = postCommentsCollection(postId);
    const commentDoc = doc(commentsRef);
    const authorRef = doc(firestore, 'users', data.authorId);

    const comment = {
      postId,
      authorId: data.authorId,
      authorRef: authorRef as any,
      parentId: data.parentId || null,
      content: data.content,
      status: 'pending' as const,
      likeCount: 0,
      replyCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(commentDoc, comment);

    // Increment comment count
    await this.incrementField(postId, 'commentCount');

    return { id: commentDoc.id, ...comment } as any;
  }

  // Get comments for post
  async getComments(
    postId: string,
    status: CommentDocument['status'] = 'approved'
  ): Promise<CommentDocument[]> {
    const commentsRef = postCommentsCollection(postId);
    const q = query(
      commentsRef,
      where('status', '==', status),
      orderBy('createdAt', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data());
  }
}

export const postRepository = new PostRepository();
```

## React Hooks

```typescript
// src/hooks/useFirestore.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  DocumentReference,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import type { BaseDocument } from '@/lib/firebase/types';

// Hook for real-time document subscription
export function useDocument<T extends BaseDocument>(
  docRef: DocumentReference<T> | null
): {
  data: T | null;
  loading: boolean;
  error: Error | null;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!docRef) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        setData(snapshot.exists() ? snapshot.data() : null);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [docRef?.path]);

  return { data, loading, error };
}

// Hook for real-time collection subscription
export function useCollection<T extends BaseDocument>(
  query: any | null
): {
  data: T[];
  loading: boolean;
  error: Error | null;
} {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!query) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = onSnapshot(
      query,
      (snapshot: any) => {
        setData(snapshot.docs.map((doc: any) => doc.data()));
        setLoading(false);
        setError(null);
      },
      (err: Error) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [query]);

  return { data, loading, error };
}
```

```typescript
// src/hooks/useUser.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { userDoc } from '@/db/collections/users';
import { userRepository, UserWithProfile } from '@/db/repositories/UserRepository';
import { useDocument } from './useFirestore';
import type { UserDocument } from '@/lib/firebase/types';

export function useUser(userId: string | null) {
  const docRef = userId ? userDoc(userId) : null;
  const { data: user, loading, error } = useDocument<UserDocument>(docRef);

  return { user, loading, error };
}

export function useUserWithProfile(userId: string | null) {
  const [user, setUser] = useState<UserWithProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setUser(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    userRepository
      .findWithProfile(userId)
      .then((data) => {
        setUser(data);
        setError(null);
      })
      .catch((err) => {
        setError(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [userId]);

  const update = useCallback(
    async (updates: Partial<UserDocument>) => {
      if (!userId) return;
      await userRepository.update(userId, updates);
      const updated = await userRepository.findWithProfile(userId);
      setUser(updated);
    },
    [userId]
  );

  return { user, loading, error, update };
}
```

## Security Rules

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    function isAdmin() {
      return isAuthenticated() &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    function isModerator() {
      return isAuthenticated() &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'moderator'];
    }

    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isOwner(userId);
      allow update: if isOwner(userId) || isAdmin();
      allow delete: if isAdmin();

      // User profiles subcollection
      match /profiles/{profileId} {
        allow read: if isAuthenticated();
        allow write: if isOwner(userId);
      }
    }

    // Posts collection
    match /posts/{postId} {
      allow read: if resource.data.status == 'published' ||
                    isOwner(resource.data.authorId) ||
                    isModerator();
      allow create: if isAuthenticated() &&
                      request.resource.data.authorId == request.auth.uid;
      allow update: if isOwner(resource.data.authorId) || isModerator();
      allow delete: if isOwner(resource.data.authorId) || isAdmin();

      // Comments subcollection
      match /comments/{commentId} {
        allow read: if resource.data.status == 'approved' ||
                      isOwner(resource.data.authorId) ||
                      isModerator();
        allow create: if isAuthenticated() &&
                        request.resource.data.authorId == request.auth.uid;
        allow update: if isOwner(resource.data.authorId) || isModerator();
        allow delete: if isOwner(resource.data.authorId) || isAdmin();
      }
    }

    // Categories collection
    match /categories/{categoryId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Tags collection
    match /tags/{tagId} {
      allow read: if true;
      allow write: if isModerator();
    }

    // Likes collection
    match /likes/{likeId} {
      allow read: if true;
      allow create: if isAuthenticated() &&
                      request.resource.data.userId == request.auth.uid;
      allow delete: if isOwner(resource.data.userId);
    }
  }
}
```

## Next.js Server Actions

```typescript
// src/app/actions/firestore-users.ts
'use server';

import { revalidatePath } from 'next/cache';
import { firestoreAdmin } from '@/lib/firebase/admin';
import { z } from 'zod';

const UpdateUserSchema = z.object({
  displayName: z.string().optional(),
  status: z.enum(['active', 'inactive', 'suspended', 'pending']).optional(),
  role: z.enum(['user', 'admin', 'moderator']).optional(),
});

export async function getUserById(userId: string) {
  const doc = await firestoreAdmin.collection('users').doc(userId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

export async function updateUser(userId: string, data: z.infer<typeof UpdateUserSchema>) {
  const validated = UpdateUserSchema.parse(data);

  await firestoreAdmin.collection('users').doc(userId).update({
    ...validated,
    updatedAt: firestoreAdmin.FieldValue.serverTimestamp(),
  });

  revalidatePath('/admin/users');
  return { success: true };
}

export async function deleteUser(userId: string) {
  // Soft delete by updating status
  await firestoreAdmin.collection('users').doc(userId).update({
    status: 'inactive',
    deletedAt: firestoreAdmin.FieldValue.serverTimestamp(),
    updatedAt: firestoreAdmin.FieldValue.serverTimestamp(),
  });

  revalidatePath('/admin/users');
  return { success: true };
}
```

## Testing

```typescript
// src/db/__tests__/UserRepository.test.ts
import { userRepository } from '../repositories/UserRepository';
import { firestore } from '@/lib/firebase/client';
import { doc, deleteDoc } from 'firebase/firestore';

describe('UserRepository', () => {
  const testUserId = `test-user-${Date.now()}`;
  const testEmail = `test-${Date.now()}@example.com`;

  afterAll(async () => {
    // Cleanup
    try {
      await deleteDoc(doc(firestore, 'users', testUserId));
    } catch (e) {
      // Ignore
    }
  });

  describe('createUser', () => {
    it('should create a user with profile', async () => {
      const user = await userRepository.createUser(testUserId, {
        email: testEmail,
        displayName: 'Test User',
      });

      expect(user.id).toBe(testUserId);
      expect(user.email).toBe(testEmail.toLowerCase());
      expect(user.status).toBe('pending');
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const user = await userRepository.findByEmail(testEmail);
      expect(user?.id).toBe(testUserId);
    });

    it('should return null for non-existent email', async () => {
      const user = await userRepository.findByEmail('nonexistent@example.com');
      expect(user).toBeNull();
    });
  });

  describe('findWithProfile', () => {
    it('should return user with profile', async () => {
      const user = await userRepository.findWithProfile(testUserId);

      expect(user?.id).toBe(testUserId);
      expect(user?.profile).toBeDefined();
    });
  });
});
```

## CLAUDE.md Integration

```markdown
## Database - Google Cloud Firestore

### Setup
- Configure Firebase project in console
- Add environment variables for web SDK and admin SDK
- Run `firebase emulators:start` for local development

### Patterns
- Document-based with subcollections (users -> profiles, posts -> comments)
- Real-time subscriptions via onSnapshot
- Server timestamps for createdAt/updatedAt
- Soft delete via status field

### Key Files
- `src/lib/firebase/client.ts` - Client-side Firebase initialization
- `src/lib/firebase/admin.ts` - Server-side Admin SDK
- `src/db/repositories/` - Repository pattern implementations
- `firestore.rules` - Security rules

### Collections
- `users` - User accounts with profiles subcollection
- `posts` - Blog posts with comments subcollection
- `categories` - Post categories (hierarchical)
- `tags` - Post tags
```

## AI Suggestions

1. **Implement composite indexes** - Pre-create indexes for complex queries
2. **Add offline data sync** - Enhanced offline support with sync conflict resolution
3. **Create backup automation** - Scheduled exports to Cloud Storage
4. **Implement full-text search** - Algolia or Typesense integration
5. **Add field-level encryption** - Encrypt sensitive data before storage
6. **Create data migration tools** - Scripts for schema evolution
7. **Implement rate limiting** - Firestore security rules with rate limits
8. **Add analytics events** - Track document operations for analytics
9. **Create audit logging** - Cloud Functions for change tracking
10. **Implement sharding for counters** - Distributed counters for high-write scenarios
