# Next.js Blog Template

## Overview
Modern blog platform with MDX content, CMS integration, SEO optimization, and full content management.

## Quick Start

```bash
# Create project
npx create-next-app@latest my-blog --typescript --tailwind --eslint --app --src-dir

cd my-blog

# Install dependencies
npm install @next/mdx @mdx-js/loader @mdx-js/react
npm install contentlayer next-contentlayer date-fns
npm install rehype-pretty-code rehype-slug rehype-autolink-headings
npm install remark-gfm reading-time gray-matter
npm install @vercel/analytics next-sitemap
npm install lucide-react clsx tailwind-merge

# Dev dependencies
npm install -D @types/mdx shiki
```

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Homepage
│   ├── blog/
│   │   ├── page.tsx                # Blog listing
│   │   └── [slug]/page.tsx         # Blog post
│   ├── categories/
│   │   └── [slug]/page.tsx         # Category page
│   ├── tags/
│   │   └── [slug]/page.tsx         # Tag page
│   ├── authors/
│   │   └── [slug]/page.tsx         # Author page
│   ├── about/page.tsx              # About page
│   ├── feed.xml/route.ts           # RSS feed
│   ├── sitemap.ts                  # Sitemap
│   ├── robots.ts                   # Robots.txt
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── blog/
│   │   ├── PostCard.tsx
│   │   ├── PostHeader.tsx
│   │   ├── PostBody.tsx
│   │   ├── TableOfContents.tsx
│   │   ├── ShareButtons.tsx
│   │   └── RelatedPosts.tsx
│   ├── mdx/
│   │   ├── MDXComponents.tsx
│   │   ├── Callout.tsx
│   │   ├── CodeBlock.tsx
│   │   └── ImageZoom.tsx
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── Newsletter.tsx
│   └── ui/
├── content/
│   ├── posts/                      # Blog posts (MDX)
│   │   └── getting-started.mdx
│   └── authors/                    # Author profiles
│       └── default.mdx
├── lib/
│   ├── utils.ts
│   ├── posts.ts                    # Post utilities
│   └── constants.ts
└── styles/
    └── mdx.css
```

## Environment Variables

```bash
# .env.local
# Site Configuration
NEXT_PUBLIC_SITE_URL="https://yourblog.com"
NEXT_PUBLIC_SITE_NAME="My Blog"

# Analytics
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"

# Newsletter (optional)
CONVERTKIT_API_KEY="your-api-key"
CONVERTKIT_FORM_ID="your-form-id"

# Comments (optional)
NEXT_PUBLIC_GISCUS_REPO="username/repo"
NEXT_PUBLIC_GISCUS_REPO_ID="your-repo-id"
NEXT_PUBLIC_GISCUS_CATEGORY="Announcements"
NEXT_PUBLIC_GISCUS_CATEGORY_ID="your-category-id"

# CMS (optional - for headless CMS)
SANITY_PROJECT_ID="your-project-id"
SANITY_DATASET="production"
SANITY_API_TOKEN="your-api-token"
```

## Contentlayer Configuration

```typescript
// contentlayer.config.ts
import { defineDocumentType, makeSource } from 'contentlayer/source-files';
import rehypePrettyCode from 'rehype-pretty-code';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import remarkGfm from 'remark-gfm';
import readingTime from 'reading-time';

export const Post = defineDocumentType(() => ({
  name: 'Post',
  filePathPattern: 'posts/**/*.mdx',
  contentType: 'mdx',
  fields: {
    title: {
      type: 'string',
      required: true,
    },
    description: {
      type: 'string',
      required: true,
    },
    date: {
      type: 'date',
      required: true,
    },
    updatedDate: {
      type: 'date',
    },
    published: {
      type: 'boolean',
      default: true,
    },
    featured: {
      type: 'boolean',
      default: false,
    },
    image: {
      type: 'string',
    },
    author: {
      type: 'string',
      default: 'default',
    },
    category: {
      type: 'string',
      required: true,
    },
    tags: {
      type: 'list',
      of: { type: 'string' },
      default: [],
    },
    toc: {
      type: 'boolean',
      default: true,
    },
  },
  computedFields: {
    slug: {
      type: 'string',
      resolve: (post) => post._raw.flattenedPath.replace('posts/', ''),
    },
    url: {
      type: 'string',
      resolve: (post) => `/blog/${post._raw.flattenedPath.replace('posts/', '')}`,
    },
    readingTime: {
      type: 'json',
      resolve: (post) => readingTime(post.body.raw),
    },
    wordCount: {
      type: 'number',
      resolve: (post) => post.body.raw.split(/\s+/g).length,
    },
    headings: {
      type: 'json',
      resolve: async (post) => {
        const headingRegex = /^(#{2,3})\s+(.+)$/gm;
        const headings: { level: number; text: string; slug: string }[] = [];
        let match;

        while ((match = headingRegex.exec(post.body.raw)) !== null) {
          const level = match[1].length;
          const text = match[2].trim();
          const slug = text
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
          headings.push({ level, text, slug });
        }

        return headings;
      },
    },
  },
}));

export const Author = defineDocumentType(() => ({
  name: 'Author',
  filePathPattern: 'authors/**/*.mdx',
  contentType: 'mdx',
  fields: {
    name: {
      type: 'string',
      required: true,
    },
    avatar: {
      type: 'string',
    },
    bio: {
      type: 'string',
    },
    twitter: {
      type: 'string',
    },
    github: {
      type: 'string',
    },
    linkedin: {
      type: 'string',
    },
    website: {
      type: 'string',
    },
  },
  computedFields: {
    slug: {
      type: 'string',
      resolve: (author) => author._raw.flattenedPath.replace('authors/', ''),
    },
  },
}));

export default makeSource({
  contentDirPath: 'content',
  documentTypes: [Post, Author],
  mdx: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      rehypeSlug,
      [
        rehypePrettyCode,
        {
          theme: 'github-dark',
          onVisitLine(node: any) {
            if (node.children.length === 0) {
              node.children = [{ type: 'text', value: ' ' }];
            }
          },
          onVisitHighlightedLine(node: any) {
            node.properties.className.push('line--highlighted');
          },
          onVisitHighlightedWord(node: any) {
            node.properties.className = ['word--highlighted'];
          },
        },
      ],
      [
        rehypeAutolinkHeadings,
        {
          properties: {
            className: ['anchor'],
            ariaLabel: 'Link to section',
          },
        },
      ],
    ],
  },
});
```

## Core Components

### Blog Post Page
```tsx
// src/app/blog/[slug]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { format } from 'date-fns';
import { allPosts, allAuthors } from 'contentlayer/generated';
import { getMDXComponent } from 'next-contentlayer/hooks';
import { PostHeader } from '@/components/blog/PostHeader';
import { TableOfContents } from '@/components/blog/TableOfContents';
import { ShareButtons } from '@/components/blog/ShareButtons';
import { RelatedPosts } from '@/components/blog/RelatedPosts';
import { MDXComponents } from '@/components/mdx/MDXComponents';
import { Comments } from '@/components/blog/Comments';

interface PageProps {
  params: { slug: string };
}

export async function generateStaticParams() {
  return allPosts
    .filter((post) => post.published)
    .map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const post = allPosts.find((post) => post.slug === params.slug);

  if (!post) return {};

  const ogImage = post.image || '/og-default.png';

  return {
    title: post.title,
    description: post.description,
    authors: [{ name: post.author }],
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      modifiedTime: post.updatedDate,
      authors: [post.author],
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: [ogImage],
    },
  };
}

export default function PostPage({ params }: PageProps) {
  const post = allPosts.find((post) => post.slug === params.slug && post.published);

  if (!post) {
    notFound();
  }

  const author = allAuthors.find((a) => a.slug === post.author);
  const MDXContent = getMDXComponent(post.body.code);

  // Get related posts
  const relatedPosts = allPosts
    .filter(
      (p) =>
        p.slug !== post.slug &&
        p.published &&
        (p.category === post.category ||
          p.tags.some((tag) => post.tags.includes(tag)))
    )
    .slice(0, 3);

  return (
    <article className="container max-w-4xl py-10">
      <PostHeader post={post} author={author} />

      {post.image && (
        <div className="relative aspect-video overflow-hidden rounded-lg mb-8">
          <Image
            src={post.image}
            alt={post.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      <div className="flex gap-8">
        <div className="flex-1 min-w-0">
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <MDXContent components={MDXComponents} />
          </div>

          <hr className="my-8" />

          <ShareButtons post={post} />

          {relatedPosts.length > 0 && (
            <RelatedPosts posts={relatedPosts} />
          )}

          <Comments />
        </div>

        {post.toc && post.headings.length > 0 && (
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24">
              <TableOfContents headings={post.headings} />
            </div>
          </aside>
        )}
      </div>
    </article>
  );
}
```

### Post Card Component
```tsx
// src/components/blog/PostCard.tsx
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { Clock, Calendar, ArrowRight } from 'lucide-react';
import { Post } from 'contentlayer/generated';
import { cn } from '@/lib/utils';

interface PostCardProps {
  post: Post;
  featured?: boolean;
}

export function PostCard({ post, featured = false }: PostCardProps) {
  return (
    <article
      className={cn(
        'group relative flex flex-col',
        featured && 'md:flex-row md:gap-8'
      )}
    >
      {post.image && (
        <Link
          href={post.url}
          className={cn(
            'relative overflow-hidden rounded-lg bg-muted',
            featured ? 'md:w-1/2 aspect-video md:aspect-[4/3]' : 'aspect-video'
          )}
        >
          <Image
            src={post.image}
            alt={post.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes={featured ? '50vw' : '(min-width: 768px) 33vw, 100vw'}
          />
        </Link>
      )}

      <div className={cn('flex flex-col', featured ? 'md:w-1/2 py-4' : 'mt-4')}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link
            href={`/categories/${post.category.toLowerCase()}`}
            className="text-primary hover:underline font-medium"
          >
            {post.category}
          </Link>
          <span>•</span>
          <time dateTime={post.date} className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {format(new Date(post.date), 'MMM d, yyyy')}
          </time>
        </div>

        <Link href={post.url}>
          <h2
            className={cn(
              'font-bold leading-tight group-hover:text-primary transition-colors',
              featured ? 'text-2xl md:text-3xl' : 'text-xl'
            )}
          >
            {post.title}
          </h2>
        </Link>

        <p
          className={cn(
            'text-muted-foreground mt-2',
            featured ? 'text-base line-clamp-3' : 'text-sm line-clamp-2'
          )}
        >
          {post.description}
        </p>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {post.readingTime.text}
          </div>

          <Link
            href={post.url}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Read more
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
```

### Table of Contents
```tsx
// src/components/blog/TableOfContents.tsx
'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface Heading {
  level: number;
  text: string;
  slug: string;
}

interface TableOfContentsProps {
  headings: Heading[];
}

export function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-100px 0px -80% 0px' }
    );

    headings.forEach((heading) => {
      const element = document.getElementById(heading.slug);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [headings]);

  return (
    <nav className="space-y-2">
      <h3 className="text-sm font-semibold mb-4">On this page</h3>
      <ul className="space-y-2 text-sm">
        {headings.map((heading) => (
          <li
            key={heading.slug}
            style={{ paddingLeft: `${(heading.level - 2) * 12}px` }}
          >
            <a
              href={`#${heading.slug}`}
              className={cn(
                'block py-1 text-muted-foreground hover:text-foreground transition-colors',
                activeId === heading.slug && 'text-primary font-medium'
              )}
              onClick={(e) => {
                e.preventDefault();
                document
                  .getElementById(heading.slug)
                  ?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
```

### MDX Components
```tsx
// src/components/mdx/MDXComponents.tsx
import Image from 'next/image';
import Link from 'next/link';
import { Callout } from './Callout';
import { CodeBlock } from './CodeBlock';
import { cn } from '@/lib/utils';

export const MDXComponents = {
  h2: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2
      className={cn(
        'mt-12 scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight first:mt-0',
        className
      )}
      {...props}
    />
  ),
  h3: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3
      className={cn(
        'mt-8 scroll-m-20 text-xl font-semibold tracking-tight',
        className
      )}
      {...props}
    />
  ),
  a: ({ href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
    if (href?.startsWith('/')) {
      return <Link href={href} {...props} />;
    }
    if (href?.startsWith('#')) {
      return <a href={href} {...props} />;
    }
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      />
    );
  },
  img: ({ src, alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <figure className="my-8">
      <div className="relative aspect-video overflow-hidden rounded-lg">
        <Image
          src={src || ''}
          alt={alt || ''}
          fill
          className="object-cover"
        />
      </div>
      {alt && (
        <figcaption className="mt-2 text-center text-sm text-muted-foreground">
          {alt}
        </figcaption>
      )}
    </figure>
  ),
  pre: ({ children, ...props }: React.HTMLAttributes<HTMLPreElement>) => (
    <CodeBlock {...props}>{children}</CodeBlock>
  ),
  code: ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <code
      className={cn(
        'relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm',
        className
      )}
      {...props}
    />
  ),
  table: ({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
    <div className="my-6 w-full overflow-y-auto">
      <table
        className={cn('w-full border-collapse text-sm', className)}
        {...props}
      />
    </div>
  ),
  blockquote: ({
    className,
    ...props
  }: React.BlockquoteHTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      className={cn(
        'mt-6 border-l-4 border-primary pl-6 italic text-muted-foreground',
        className
      )}
      {...props}
    />
  ),
  Callout,
  Image: ({ src, alt, caption }: { src: string; alt: string; caption?: string }) => (
    <figure className="my-8">
      <div className="relative aspect-video overflow-hidden rounded-lg">
        <Image src={src} alt={alt} fill className="object-cover" />
      </div>
      {caption && (
        <figcaption className="mt-2 text-center text-sm text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  ),
  Video: ({ src, title }: { src: string; title?: string }) => (
    <div className="my-8 aspect-video">
      <iframe
        src={src}
        title={title}
        className="h-full w-full rounded-lg"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  ),
};
```

### Callout Component
```tsx
// src/components/mdx/Callout.tsx
import { AlertCircle, AlertTriangle, CheckCircle, Info, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

type CalloutType = 'info' | 'warning' | 'error' | 'success' | 'tip';

interface CalloutProps {
  type?: CalloutType;
  title?: string;
  children: React.ReactNode;
}

const icons = {
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
  success: CheckCircle,
  tip: Lightbulb,
};

const styles = {
  info: 'border-blue-500 bg-blue-50 dark:bg-blue-950',
  warning: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950',
  error: 'border-red-500 bg-red-50 dark:bg-red-950',
  success: 'border-green-500 bg-green-50 dark:bg-green-950',
  tip: 'border-purple-500 bg-purple-50 dark:bg-purple-950',
};

export function Callout({ type = 'info', title, children }: CalloutProps) {
  const Icon = icons[type];

  return (
    <div
      className={cn(
        'my-6 flex gap-4 rounded-lg border-l-4 p-4',
        styles[type]
      )}
    >
      <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        {title && <p className="font-semibold mb-1">{title}</p>}
        <div className="text-sm [&>p]:mb-0">{children}</div>
      </div>
    </div>
  );
}
```

## RSS Feed

```typescript
// src/app/feed.xml/route.ts
import { allPosts } from 'contentlayer/generated';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yourblog.com';
const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'My Blog';

export async function GET() {
  const posts = allPosts
    .filter((post) => post.published)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${siteName}</title>
    <link>${siteUrl}</link>
    <description>Latest posts from ${siteName}</description>
    <language>en-us</language>
    <lastBuildDate>${new Date(posts[0]?.date || Date.now()).toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    ${posts
      .map(
        (post) => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${siteUrl}${post.url}</link>
      <guid isPermaLink="true">${siteUrl}${post.url}</guid>
      <description><![CDATA[${post.description}]]></description>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <category>${post.category}</category>
      ${post.tags.map((tag) => `<category>${tag}</category>`).join('\n      ')}
    </item>`
      )
      .join('')}
  </channel>
</rss>`;

  return new Response(feed, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate',
    },
  });
}
```

## Sitemap

```typescript
// src/app/sitemap.ts
import { MetadataRoute } from 'next';
import { allPosts } from 'contentlayer/generated';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yourblog.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = allPosts
    .filter((post) => post.published)
    .map((post) => ({
      url: `${siteUrl}${post.url}`,
      lastModified: post.updatedDate || post.date,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

  // Get unique categories
  const categories = [...new Set(allPosts.map((post) => post.category))].map(
    (category) => ({
      url: `${siteUrl}/categories/${category.toLowerCase()}`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    })
  );

  // Get unique tags
  const tags = [...new Set(allPosts.flatMap((post) => post.tags))].map(
    (tag) => ({
      url: `${siteUrl}/tags/${tag.toLowerCase()}`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'weekly' as const,
      priority: 0.3,
    })
  );

  return [
    {
      url: siteUrl,
      lastModified: new Date().toISOString(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${siteUrl}/blog`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    ...posts,
    ...categories,
    ...tags,
  ];
}
```

## Example Post

```mdx
---
title: "Getting Started with Next.js 14"
description: "A comprehensive guide to building modern web applications with Next.js 14, covering App Router, Server Components, and more."
date: 2024-01-15
category: "Web Development"
tags: ["nextjs", "react", "typescript"]
image: "/images/posts/nextjs-14.jpg"
author: "default"
featured: true
---

Next.js 14 represents a significant evolution in React framework development. In this guide, we'll explore the key features and best practices.

## What's New in Next.js 14

The latest version brings several exciting features:

- **Turbopack** - Faster development builds
- **Server Actions** - Simplified data mutations
- **Partial Prerendering** - Better performance

<Callout type="tip" title="Pro Tip">
  Use the App Router for new projects to take advantage of React Server Components.
</Callout>

## Setting Up Your Project

Let's start by creating a new Next.js project:

```bash
npx create-next-app@latest my-app --typescript
```

This will create a new project with TypeScript support out of the box.

## Server Components

Server Components are the default in the App Router:

```tsx
// This component runs on the server
export default async function Page() {
  const data = await fetchData();

  return (
    <main>
      <h1>{data.title}</h1>
    </main>
  );
}
```

<Callout type="warning">
  Remember that Server Components cannot use hooks like `useState` or `useEffect`.
</Callout>

## Conclusion

Next.js 14 provides a powerful foundation for building modern web applications. Start experimenting with these features today!
```

## Testing

```typescript
// __tests__/blog.test.ts
import { allPosts, allAuthors } from 'contentlayer/generated';

describe('Blog Content', () => {
  it('should have at least one published post', () => {
    const publishedPosts = allPosts.filter((post) => post.published);
    expect(publishedPosts.length).toBeGreaterThan(0);
  });

  it('should have valid slugs for all posts', () => {
    allPosts.forEach((post) => {
      expect(post.slug).toBeDefined();
      expect(post.slug).not.toContain(' ');
    });
  });

  it('should have required fields', () => {
    allPosts.forEach((post) => {
      expect(post.title).toBeDefined();
      expect(post.description).toBeDefined();
      expect(post.date).toBeDefined();
      expect(post.category).toBeDefined();
    });
  });

  it('should have at least one author', () => {
    expect(allAuthors.length).toBeGreaterThan(0);
  });

  it('should have valid reading time', () => {
    allPosts.forEach((post) => {
      expect(post.readingTime).toBeDefined();
      expect(post.readingTime.minutes).toBeGreaterThan(0);
    });
  });
});
```

## CLAUDE.md Integration

```markdown
# Blog Site

## Content Management
- Posts: `content/posts/` (MDX files)
- Authors: `content/authors/` (MDX files)

## Key Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run contentlayer` - Regenerate content

## Creating Posts
1. Add MDX file to `content/posts/`
2. Include required frontmatter (title, description, date, category)
3. Content will be automatically indexed

## Frontmatter Fields
- `title` (required): Post title
- `description` (required): Meta description
- `date` (required): Publication date (YYYY-MM-DD)
- `category` (required): Primary category
- `tags`: Array of tags
- `image`: Featured image path
- `featured`: Boolean for homepage feature
- `published`: Boolean (default: true)

## MDX Components
- `<Callout type="info|warning|error|success|tip">`
- `<Image src="" alt="" caption="" />`
- `<Video src="" title="" />`

## URLs
- Posts: `/blog/[slug]`
- Categories: `/categories/[slug]`
- Tags: `/tags/[slug]`
- RSS: `/feed.xml`
```

## AI Suggestions

1. **AI-Generated Summaries** - Auto-generate post excerpts and social media descriptions using LLM
2. **Smart Content Recommendations** - ML-based related posts based on content similarity, not just tags
3. **Reading Analytics** - Track scroll depth, time on page, and engagement to optimize content
4. **Automated SEO Optimization** - AI suggestions for title tags, meta descriptions, and keyword placement
5. **Content Calendar Integration** - AI-powered scheduling based on historical engagement data
6. **Image Alt Text Generation** - Automatic alt text generation for accessibility
7. **Translation Pipeline** - Auto-translate posts to multiple languages with human review workflow
8. **Comment Moderation** - AI-powered spam detection and sentiment analysis
9. **Voice Narration** - Auto-generate audio versions of posts using text-to-speech
10. **Content Performance Prediction** - Predict post engagement before publishing based on historical data
