# Astro Portfolio Template

## Overview
Modern portfolio and personal website built with Astro, featuring dynamic project galleries, blog integration, responsive design, dark mode, animations, and optimized performance with static generation.

## Quick Start
```bash
# Create new project
npm create astro@latest my-portfolio -- --template minimal

# Install dependencies
cd my-portfolio
npm install @astrojs/tailwind @astrojs/mdx @astrojs/sitemap @astrojs/image
npm install tailwindcss @tailwindcss/typography
npm install framer-motion gsap
npm install sharp

# Development
npm run dev

# Build
npm run build
npm run preview
```

## Project Structure
```
my-portfolio/
├── astro.config.mjs
├── tailwind.config.mjs
├── public/
│   ├── favicon.svg
│   ├── fonts/
│   │   ├── inter-var.woff2
│   │   └── fira-code.woff2
│   ├── images/
│   │   ├── avatar.jpg
│   │   └── og-image.png
│   └── resume.pdf
├── src/
│   ├── components/
│   │   ├── Header.astro
│   │   ├── Footer.astro
│   │   ├── Navigation.astro
│   │   ├── ThemeToggle.astro
│   │   ├── Hero.astro
│   │   ├── About.astro
│   │   ├── Skills.astro
│   │   ├── Experience.astro
│   │   ├── ProjectCard.astro
│   │   ├── ProjectGrid.astro
│   │   ├── BlogCard.astro
│   │   ├── Contact.astro
│   │   ├── SocialLinks.astro
│   │   ├── ScrollProgress.astro
│   │   ├── BackToTop.astro
│   │   ├── AnimatedText.astro
│   │   └── react/
│   │       ├── ContactForm.tsx
│   │       ├── ProjectFilter.tsx
│   │       └── CommandMenu.tsx
│   ├── content/
│   │   ├── config.ts
│   │   ├── projects/
│   │   │   ├── project-1.mdx
│   │   │   └── project-2.mdx
│   │   └── blog/
│   │       ├── first-post.mdx
│   │       └── second-post.mdx
│   ├── data/
│   │   ├── site.ts
│   │   ├── skills.ts
│   │   └── experience.ts
│   ├── layouts/
│   │   ├── BaseLayout.astro
│   │   ├── MarkdownLayout.astro
│   │   └── ProjectLayout.astro
│   ├── pages/
│   │   ├── index.astro
│   │   ├── about.astro
│   │   ├── projects/
│   │   │   ├── index.astro
│   │   │   └── [...slug].astro
│   │   ├── blog/
│   │   │   ├── index.astro
│   │   │   └── [...slug].astro
│   │   ├── contact.astro
│   │   ├── 404.astro
│   │   ├── rss.xml.js
│   │   └── og/[...route].ts
│   ├── styles/
│   │   ├── global.css
│   │   └── animations.css
│   └── utils/
│       ├── helpers.ts
│       ├── reading-time.ts
│       └── og-image.ts
└── package.json
```

## Astro Configuration
```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://yoursite.com',
  integrations: [
    tailwind({
      applyBaseStyles: false,
    }),
    mdx({
      syntaxHighlight: 'shiki',
      shikiConfig: {
        theme: 'github-dark',
        wrap: true,
      },
      gfm: true,
    }),
    sitemap({
      filter: (page) => !page.includes('/api/'),
    }),
    react(),
  ],
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
    },
  },
  prefetch: {
    prefetchAll: true,
  },
  vite: {
    optimizeDeps: {
      exclude: ['@resvg/resvg-js'],
    },
  },
});
```

## Content Configuration
```typescript
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const projectCollection = defineCollection({
  type: 'content',
  schema: ({ image }) => z.object({
    title: z.string(),
    description: z.string(),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
    publishDate: z.coerce.date(),
    updateDate: z.coerce.date().optional(),
    thumbnail: image(),
    images: z.array(image()).optional(),
    technologies: z.array(z.string()),
    category: z.enum(['web', 'mobile', 'design', 'other']),
    liveUrl: z.string().url().optional(),
    repoUrl: z.string().url().optional(),
    client: z.string().optional(),
    role: z.string().optional(),
    duration: z.string().optional(),
  }),
});

const blogCollection = defineCollection({
  type: 'content',
  schema: ({ image }) => z.object({
    title: z.string(),
    description: z.string(),
    draft: z.boolean().default(false),
    publishDate: z.coerce.date(),
    updateDate: z.coerce.date().optional(),
    thumbnail: image().optional(),
    tags: z.array(z.string()),
    canonicalUrl: z.string().url().optional(),
  }),
});

export const collections = {
  projects: projectCollection,
  blog: blogCollection,
};
```

## Site Data Configuration
```typescript
// src/data/site.ts
export const siteConfig = {
  name: 'John Doe',
  title: 'Full-Stack Developer',
  description: 'Passionate developer crafting beautiful, performant web experiences',
  siteUrl: 'https://johndoe.dev',
  email: 'hello@johndoe.dev',
  location: 'San Francisco, CA',
  avatar: '/images/avatar.jpg',
  resume: '/resume.pdf',

  social: {
    github: 'https://github.com/johndoe',
    twitter: 'https://twitter.com/johndoe',
    linkedin: 'https://linkedin.com/in/johndoe',
    dribbble: 'https://dribbble.com/johndoe',
    instagram: 'https://instagram.com/johndoe',
  },

  nav: [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'Projects', href: '/projects' },
    { label: 'Blog', href: '/blog' },
    { label: 'Contact', href: '/contact' },
  ],

  availability: {
    status: 'available', // 'available' | 'busy' | 'unavailable'
    message: 'Open to new opportunities',
  },
};

// src/data/skills.ts
export const skills = {
  languages: [
    { name: 'TypeScript', level: 95, icon: 'typescript' },
    { name: 'JavaScript', level: 95, icon: 'javascript' },
    { name: 'Python', level: 80, icon: 'python' },
    { name: 'Go', level: 70, icon: 'go' },
    { name: 'Rust', level: 60, icon: 'rust' },
  ],
  frontend: [
    { name: 'React', level: 95, icon: 'react' },
    { name: 'Next.js', level: 90, icon: 'nextjs' },
    { name: 'Astro', level: 90, icon: 'astro' },
    { name: 'Vue', level: 75, icon: 'vue' },
    { name: 'Svelte', level: 70, icon: 'svelte' },
  ],
  backend: [
    { name: 'Node.js', level: 90, icon: 'nodejs' },
    { name: 'PostgreSQL', level: 85, icon: 'postgresql' },
    { name: 'Redis', level: 80, icon: 'redis' },
    { name: 'GraphQL', level: 85, icon: 'graphql' },
  ],
  tools: [
    { name: 'Docker', level: 85, icon: 'docker' },
    { name: 'AWS', level: 80, icon: 'aws' },
    { name: 'Git', level: 95, icon: 'git' },
    { name: 'Figma', level: 75, icon: 'figma' },
  ],
};

// src/data/experience.ts
export interface Experience {
  company: string;
  role: string;
  period: string;
  current: boolean;
  description: string;
  achievements: string[];
  technologies: string[];
  logo?: string;
  url?: string;
}

export const experience: Experience[] = [
  {
    company: 'Tech Corp',
    role: 'Senior Full-Stack Developer',
    period: 'Jan 2022 - Present',
    current: true,
    description: 'Leading development of customer-facing products',
    achievements: [
      'Led redesign of main product, increasing conversions by 40%',
      'Built microservices architecture serving 1M+ requests/day',
      'Mentored team of 5 junior developers',
    ],
    technologies: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'AWS'],
    logo: '/images/logos/techcorp.svg',
    url: 'https://techcorp.com',
  },
  {
    company: 'Startup Inc',
    role: 'Full-Stack Developer',
    period: 'Jun 2019 - Dec 2021',
    current: false,
    description: 'Early engineer at fast-growing startup',
    achievements: [
      'Built core product features from 0 to 100k users',
      'Implemented real-time collaboration features',
      'Reduced page load times by 60%',
    ],
    technologies: ['JavaScript', 'Vue.js', 'Python', 'MongoDB', 'GCP'],
    logo: '/images/logos/startup.svg',
    url: 'https://startup.com',
  },
];
```

## Layout Components
```astro
---
// src/layouts/BaseLayout.astro
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
import ScrollProgress from '../components/ScrollProgress.astro';
import BackToTop from '../components/BackToTop.astro';
import { siteConfig } from '../data/site';
import '../styles/global.css';

interface Props {
  title?: string;
  description?: string;
  image?: string;
  article?: boolean;
  noIndex?: boolean;
}

const {
  title,
  description = siteConfig.description,
  image = '/images/og-image.png',
  article = false,
  noIndex = false,
} = Astro.props;

const pageTitle = title ? `${title} | ${siteConfig.name}` : `${siteConfig.name} - ${siteConfig.title}`;
const canonicalUrl = new URL(Astro.url.pathname, siteConfig.siteUrl);
const imageUrl = new URL(image, siteConfig.siteUrl);
---

<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="generator" content={Astro.generator} />

    <title>{pageTitle}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonicalUrl} />

    {noIndex && <meta name="robots" content="noindex, nofollow" />}

    <!-- Open Graph -->
    <meta property="og:type" content={article ? 'article' : 'website'} />
    <meta property="og:title" content={pageTitle} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={canonicalUrl} />
    <meta property="og:image" content={imageUrl} />
    <meta property="og:site_name" content={siteConfig.name} />

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={pageTitle} />
    <meta name="twitter:description" content={description} />
    <meta name="twitter:image" content={imageUrl} />

    <!-- Favicon -->
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />

    <!-- Fonts -->
    <link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossorigin />

    <!-- Theme -->
    <script is:inline>
      const theme = localStorage.getItem('theme') ||
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', theme === 'dark');
    </script>
  </head>
  <body class="bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 antialiased">
    <ScrollProgress />
    <Header />
    <main>
      <slot />
    </main>
    <Footer />
    <BackToTop />
  </body>
</html>
```

## Hero Component
```astro
---
// src/components/Hero.astro
import { Image } from 'astro:assets';
import { siteConfig } from '../data/site';
import SocialLinks from './SocialLinks.astro';
import AnimatedText from './AnimatedText.astro';
import avatarImage from '../assets/avatar.jpg';

interface Props {
  showAvatar?: boolean;
  showSocial?: boolean;
}

const { showAvatar = true, showSocial = true } = Astro.props;

const statusColors = {
  available: 'bg-green-500',
  busy: 'bg-yellow-500',
  unavailable: 'bg-red-500',
};
---

<section class="min-h-[90vh] flex items-center justify-center py-20">
  <div class="container mx-auto px-4">
    <div class="max-w-4xl mx-auto text-center">
      {showAvatar && (
        <div class="mb-8 relative inline-block">
          <Image
            src={avatarImage}
            alt={siteConfig.name}
            width={160}
            height={160}
            class="w-40 h-40 rounded-full object-cover border-4 border-white dark:border-gray-800 shadow-xl"
          />
          <span
            class={`absolute bottom-2 right-2 w-6 h-6 rounded-full border-4 border-white dark:border-gray-800 ${statusColors[siteConfig.availability.status]}`}
            title={siteConfig.availability.message}
          />
        </div>
      )}

      <AnimatedText
        tag="h1"
        class="text-5xl md:text-7xl font-bold mb-4"
        animation="fade-up"
      >
        Hi, I'm <span class="text-gradient">{siteConfig.name}</span>
      </AnimatedText>

      <AnimatedText
        tag="h2"
        class="text-2xl md:text-3xl text-gray-600 dark:text-gray-400 mb-6"
        animation="fade-up"
        delay={100}
      >
        {siteConfig.title}
      </AnimatedText>

      <AnimatedText
        tag="p"
        class="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8"
        animation="fade-up"
        delay={200}
      >
        {siteConfig.description}
      </AnimatedText>

      <div class="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
        <a
          href="/contact"
          class="px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full font-medium hover:opacity-90 transition-opacity"
        >
          Get in Touch
        </a>
        <a
          href="/projects"
          class="px-8 py-3 border-2 border-gray-900 dark:border-white rounded-full font-medium hover:bg-gray-900 hover:text-white dark:hover:bg-white dark:hover:text-gray-900 transition-colors"
        >
          View My Work
        </a>
      </div>

      {showSocial && <SocialLinks class="justify-center" />}
    </div>

    <!-- Scroll indicator -->
    <div class="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
      <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    </div>
  </div>
</section>

<style>
  .text-gradient {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
</style>
```

## Project Components
```astro
---
// src/components/ProjectCard.astro
import { Image } from 'astro:assets';
import type { CollectionEntry } from 'astro:content';

interface Props {
  project: CollectionEntry<'projects'>;
  featured?: boolean;
}

const { project, featured = false } = Astro.props;
const { title, description, thumbnail, technologies, category, liveUrl, repoUrl } = project.data;
---

<article
  class:list={[
    'group relative bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300',
    featured && 'md:col-span-2 md:row-span-2',
  ]}
>
  <a href={`/projects/${project.slug}`} class="block">
    <div class="relative overflow-hidden aspect-video">
      <Image
        src={thumbnail}
        alt={title}
        width={featured ? 1200 : 600}
        height={featured ? 675 : 338}
        class="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <!-- Category badge -->
      <span class="absolute top-4 left-4 px-3 py-1 bg-white/90 dark:bg-gray-900/90 text-sm font-medium rounded-full capitalize">
        {category}
      </span>
    </div>

    <div class="p-6">
      <h3 class:list={[
        'font-bold mb-2 group-hover:text-primary-600 transition-colors',
        featured ? 'text-2xl' : 'text-xl',
      ]}>
        {title}
      </h3>

      <p class="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
        {description}
      </p>

      <div class="flex flex-wrap gap-2 mb-4">
        {technologies.slice(0, 4).map((tech) => (
          <span class="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-xs font-medium rounded">
            {tech}
          </span>
        ))}
        {technologies.length > 4 && (
          <span class="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-xs font-medium rounded">
            +{technologies.length - 4}
          </span>
        )}
      </div>
    </div>
  </a>

  <!-- External links -->
  <div class="absolute bottom-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
    {liveUrl && (
      <a
        href={liveUrl}
        target="_blank"
        rel="noopener noreferrer"
        class="p-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full hover:scale-110 transition-transform"
        title="View live site"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    )}
    {repoUrl && (
      <a
        href={repoUrl}
        target="_blank"
        rel="noopener noreferrer"
        class="p-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full hover:scale-110 transition-transform"
        title="View source code"
      >
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
      </a>
    )}
  </div>
</article>
```

## Skills Section
```astro
---
// src/components/Skills.astro
import { skills } from '../data/skills';

interface Props {
  showLevel?: boolean;
}

const { showLevel = true } = Astro.props;

const categories = [
  { key: 'languages', title: 'Languages' },
  { key: 'frontend', title: 'Frontend' },
  { key: 'backend', title: 'Backend' },
  { key: 'tools', title: 'Tools & Platforms' },
];
---

<section class="py-20" id="skills">
  <div class="container mx-auto px-4">
    <h2 class="text-3xl md:text-4xl font-bold text-center mb-12">
      Skills & Technologies
    </h2>

    <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
      {categories.map(({ key, title }) => (
        <div class="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg">
          <h3 class="text-xl font-bold mb-6">{title}</h3>
          <div class="space-y-4">
            {skills[key].map((skill) => (
              <div class="skill-item">
                <div class="flex items-center justify-between mb-1">
                  <span class="font-medium">{skill.name}</span>
                  {showLevel && (
                    <span class="text-sm text-gray-500">{skill.level}%</span>
                  )}
                </div>
                {showLevel && (
                  <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      class="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full skill-bar"
                      style={`width: ${skill.level}%`}
                      data-level={skill.level}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
</section>

<script>
  // Animate skill bars on scroll
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const bars = entry.target.querySelectorAll('.skill-bar');
          bars.forEach((bar) => {
            const level = bar.getAttribute('data-level');
            bar.style.width = '0%';
            setTimeout(() => {
              bar.style.transition = 'width 1s ease-out';
              bar.style.width = `${level}%`;
            }, 100);
          });
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  document.querySelectorAll('#skills').forEach((el) => observer.observe(el));
</script>
```

## Contact Form (React Island)
```typescript
// src/components/react/ContactForm.tsx
import { useState, type FormEvent } from 'react';

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface FormErrors {
  [key: string]: string;
}

export default function ContactForm() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setStatus('loading');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to send message');

      setStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      setStatus('error');
    }
  };

  const inputClasses = (field: keyof FormData) => `
    w-full px-4 py-3 rounded-lg border-2 transition-colors
    ${errors[field]
      ? 'border-red-500 focus:border-red-500'
      : 'border-gray-200 dark:border-gray-700 focus:border-primary-500'}
    bg-white dark:bg-gray-800
    focus:outline-none focus:ring-0
  `;

  if (status === 'success') {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 mb-4">
          <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold mb-2">Message Sent!</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Thank you for reaching out. I'll get back to you soon!
        </p>
        <button
          onClick={() => setStatus('idle')}
          className="text-primary-600 hover:underline"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2">
            Name
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={inputClasses('name')}
            placeholder="John Doe"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-500">{errors.name}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className={inputClasses('email')}
            placeholder="john@example.com"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-500">{errors.email}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="subject" className="block text-sm font-medium mb-2">
          Subject
        </label>
        <input
          type="text"
          id="subject"
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          className={inputClasses('subject')}
          placeholder="Project Inquiry"
        />
        {errors.subject && (
          <p className="mt-1 text-sm text-red-500">{errors.subject}</p>
        )}
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium mb-2">
          Message
        </label>
        <textarea
          id="message"
          rows={6}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          className={inputClasses('message')}
          placeholder="Tell me about your project..."
        />
        {errors.message && (
          <p className="mt-1 text-sm text-red-500">{errors.message}</p>
        )}
      </div>

      {status === 'error' && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
          Something went wrong. Please try again later.
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {status === 'loading' ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  );
}
```

## Project Filter Component
```typescript
// src/components/react/ProjectFilter.tsx
import { useState, useMemo } from 'react';
import type { CollectionEntry } from 'astro:content';

interface Props {
  projects: CollectionEntry<'projects'>[];
}

type Category = 'all' | 'web' | 'mobile' | 'design' | 'other';

export default function ProjectFilter({ projects }: Props) {
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories: { value: Category; label: string }[] = [
    { value: 'all', label: 'All Projects' },
    { value: 'web', label: 'Web' },
    { value: 'mobile', label: 'Mobile' },
    { value: 'design', label: 'Design' },
    { value: 'other', label: 'Other' },
  ];

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesCategory = activeCategory === 'all' || project.data.category === activeCategory;
      const matchesSearch = searchQuery === '' ||
        project.data.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.data.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.data.technologies.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesCategory && matchesSearch;
    });
  }, [projects, activeCategory, searchQuery]);

  return (
    <div>
      {/* Search and Filter Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 pl-12 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-primary-500 focus:outline-none"
          />
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          {categories.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setActiveCategory(value)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                activeCategory === value
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500 mb-6">
        Showing {filteredProjects.length} of {projects.length} projects
      </p>

      {/* Project Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <a
            key={project.slug}
            href={`/projects/${project.slug}`}
            className="group block bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all"
          >
            <div className="aspect-video overflow-hidden">
              <img
                src={project.data.thumbnail.src}
                alt={project.data.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-6">
              <span className="text-xs font-medium uppercase tracking-wider text-primary-600">
                {project.data.category}
              </span>
              <h3 className="text-xl font-bold mt-1 mb-2 group-hover:text-primary-600 transition-colors">
                {project.data.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 line-clamp-2">
                {project.data.description}
              </p>
            </div>
          </a>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No projects found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}
```

## Dynamic OG Image Generation
```typescript
// src/pages/og/[...route].ts
import { ImageResponse } from '@vercel/og';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ params, request }) => {
  const url = new URL(request.url);
  const title = url.searchParams.get('title') || 'John Doe';
  const subtitle = url.searchParams.get('subtitle') || 'Portfolio';

  const html = {
    type: 'div',
    props: {
      style: {
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0f172a',
        backgroundImage: 'radial-gradient(circle at 25% 25%, #1e293b 0%, transparent 50%), radial-gradient(circle at 75% 75%, #312e81 0%, transparent 50%)',
      },
      children: [
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            },
            children: [
              {
                type: 'h1',
                props: {
                  style: {
                    fontSize: '72px',
                    fontWeight: 'bold',
                    color: 'white',
                    marginBottom: '16px',
                    textAlign: 'center',
                    maxWidth: '900px',
                  },
                  children: title,
                },
              },
              {
                type: 'p',
                props: {
                  style: {
                    fontSize: '32px',
                    color: '#94a3b8',
                  },
                  children: subtitle,
                },
              },
            ],
          },
        },
      ],
    },
  };

  return new ImageResponse(html, {
    width: 1200,
    height: 630,
  });
};

export const prerender = false;
```

## Global Styles
```css
/* src/styles/global.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  @font-face {
    font-family: 'Inter';
    font-style: normal;
    font-weight: 100 900;
    font-display: swap;
    src: url('/fonts/inter-var.woff2') format('woff2');
  }

  html {
    font-family: 'Inter', system-ui, sans-serif;
    scroll-behavior: smooth;
  }

  ::selection {
    background-color: theme('colors.primary.500');
    color: white;
  }
}

@layer components {
  .container {
    @apply max-w-7xl mx-auto;
  }

  .prose-custom {
    @apply prose dark:prose-invert max-w-none;
    @apply prose-headings:font-bold prose-headings:tracking-tight;
    @apply prose-a:text-primary-600 prose-a:no-underline hover:prose-a:underline;
    @apply prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:rounded prose-code:px-1.5 prose-code:py-0.5;
    @apply prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-800;
  }

  .card {
    @apply bg-white dark:bg-gray-900 rounded-2xl shadow-lg hover:shadow-xl transition-shadow;
  }

  .btn-primary {
    @apply px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full font-medium;
    @apply hover:opacity-90 transition-opacity;
  }

  .btn-secondary {
    @apply px-6 py-3 border-2 border-gray-900 dark:border-white rounded-full font-medium;
    @apply hover:bg-gray-900 hover:text-white dark:hover:bg-white dark:hover:text-gray-900 transition-colors;
  }
}

@layer utilities {
  .text-gradient {
    @apply bg-clip-text text-transparent;
    background-image: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  .animate-fade-up {
    animation: fadeUp 0.6s ease-out forwards;
    opacity: 0;
  }

  @keyframes fadeUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-slide-in {
    animation: slideIn 0.4s ease-out forwards;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
}
```

## RSS Feed
```javascript
// src/pages/rss.xml.js
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { siteConfig } from '../data/site';

export async function GET(context) {
  const posts = await getCollection('blog', ({ data }) => !data.draft);

  return rss({
    title: siteConfig.name,
    description: siteConfig.description,
    site: context.site,
    items: posts
      .sort((a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf())
      .map((post) => ({
        title: post.data.title,
        pubDate: post.data.publishDate,
        description: post.data.description,
        link: `/blog/${post.slug}/`,
      })),
    customData: `<language>en-us</language>`,
  });
}
```

## Testing
```typescript
// tests/e2e/portfolio.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Portfolio', () => {
  test('homepage loads correctly', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('h1')).toContainText("Hi, I'm");
    await expect(page.locator('nav')).toBeVisible();
  });

  test('navigation works', async ({ page }) => {
    await page.goto('/');

    await page.click('nav >> text=Projects');
    await expect(page).toHaveURL('/projects');

    await page.click('nav >> text=Blog');
    await expect(page).toHaveURL('/blog');

    await page.click('nav >> text=Contact');
    await expect(page).toHaveURL('/contact');
  });

  test('project filtering works', async ({ page }) => {
    await page.goto('/projects');

    // Click a category filter
    await page.click('text=Web');

    // Verify only web projects are shown
    const projects = page.locator('[data-category]');
    await expect(projects.first()).toHaveAttribute('data-category', 'web');
  });

  test('contact form validation', async ({ page }) => {
    await page.goto('/contact');

    await page.click('button[type="submit"]');

    await expect(page.locator('text=Name is required')).toBeVisible();
    await expect(page.locator('text=Email is required')).toBeVisible();
  });

  test('dark mode toggle', async ({ page }) => {
    await page.goto('/');

    const html = page.locator('html');
    const themeToggle = page.locator('[data-theme-toggle]');

    // Initial state (follows system preference)
    const initialDark = await html.evaluate(el => el.classList.contains('dark'));

    // Toggle theme
    await themeToggle.click();

    // Verify class changed
    const afterToggle = await html.evaluate(el => el.classList.contains('dark'));
    expect(afterToggle).not.toBe(initialDark);
  });
});

// tests/e2e/seo.spec.ts
import { test, expect } from '@playwright/test';

test.describe('SEO', () => {
  test('has proper meta tags', async ({ page }) => {
    await page.goto('/');

    const title = await page.title();
    expect(title).toContain('John Doe');

    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description).toBeTruthy();

    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
    expect(ogTitle).toBeTruthy();
  });

  test('has sitemap', async ({ page }) => {
    const response = await page.goto('/sitemap-index.xml');
    expect(response?.status()).toBe(200);
  });

  test('has rss feed', async ({ page }) => {
    const response = await page.goto('/rss.xml');
    expect(response?.status()).toBe(200);
    expect(response?.headers()['content-type']).toContain('xml');
  });
});
```

## CLAUDE.md Integration
```markdown
# Portfolio Site

## Project Type
Astro static portfolio site with React islands for interactivity.

## Key Directories
- `src/content/` - MDX projects and blog posts
- `src/components/` - Astro and React components
- `src/data/` - Site configuration and data
- `src/layouts/` - Page layouts

## Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run astro sync` - Sync content collections

## Content Management
- Add projects in `src/content/projects/`
- Add blog posts in `src/content/blog/`
- Update site config in `src/data/site.ts`

## Component Patterns
- Use Astro components for static content
- Use React components (`client:visible`) for interactive elements
- Keep React islands small and focused

## Styling
- TailwindCSS for all styling
- Dark mode via `dark:` variants
- Custom animations in `global.css`

## Performance Targets
- Lighthouse score > 95 all categories
- First Contentful Paint < 1s
- Cumulative Layout Shift < 0.1
```

## AI Suggestions

1. **Case study generator** - Auto-generate detailed case study pages from project data with metrics, process documentation, and results
2. **Analytics dashboard** - Add simple analytics tracking for portfolio views, project clicks, and contact form submissions
3. **Resume/CV generator** - Generate downloadable PDF resume from experience and skills data
4. **Testimonials carousel** - Add client testimonials with dynamic carousel and star ratings
5. **Project timeline visualization** - Visual timeline showing project history and milestones
6. **Blog reading progress** - Add reading progress indicator and estimated time for blog posts
7. **Image optimization pipeline** - Automatic image resizing, WebP conversion, and blur placeholders
8. **Keyboard navigation** - Full keyboard accessibility with visible focus states and skip links
9. **Internationalization** - Multi-language support with locale-specific content and routing
10. **Animation system** - Scroll-triggered animations using Intersection Observer with reduced motion support
