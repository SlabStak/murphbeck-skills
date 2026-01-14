# Next.js Landing Page Template

## Overview
High-converting marketing landing page with A/B testing, analytics integration, animations, and lead capture.

## Quick Start

```bash
# Create project
npx create-next-app@latest my-landing --typescript --tailwind --eslint --app --src-dir

cd my-landing

# Install dependencies
npm install framer-motion @vercel/analytics @vercel/speed-insights
npm install react-intersection-observer react-hook-form @hookform/resolvers zod
npm install lucide-react clsx tailwind-merge class-variance-authority
npm install @radix-ui/react-dialog @radix-ui/react-accordion
npm install posthog-js @posthog/react

# Dev dependencies
npm install -D @types/node
```

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Main landing page
│   ├── pricing/page.tsx            # Pricing page
│   ├── about/page.tsx              # About page
│   ├── contact/page.tsx            # Contact page
│   ├── api/
│   │   ├── contact/route.ts        # Contact form handler
│   │   ├── newsletter/route.ts     # Newsletter signup
│   │   └── waitlist/route.ts       # Waitlist signup
│   ├── layout.tsx
│   ├── globals.css
│   ├── opengraph-image.tsx         # OG Image generation
│   └── sitemap.ts
├── components/
│   ├── sections/
│   │   ├── Hero.tsx
│   │   ├── Features.tsx
│   │   ├── HowItWorks.tsx
│   │   ├── Testimonials.tsx
│   │   ├── Pricing.tsx
│   │   ├── FAQ.tsx
│   │   ├── CTA.tsx
│   │   └── Footer.tsx
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Badge.tsx
│   │   ├── Card.tsx
│   │   └── Input.tsx
│   ├── layout/
│   │   ├── Header.tsx
│   │   └── MobileNav.tsx
│   ├── forms/
│   │   ├── ContactForm.tsx
│   │   ├── NewsletterForm.tsx
│   │   └── WaitlistForm.tsx
│   └── analytics/
│       ├── PostHogProvider.tsx
│       └── ABTest.tsx
├── lib/
│   ├── utils.ts
│   ├── constants.ts
│   └── analytics.ts
└── styles/
    └── animations.css
```

## Environment Variables

```bash
# .env.local
# Site
NEXT_PUBLIC_SITE_URL="https://yoursite.com"
NEXT_PUBLIC_SITE_NAME="Your Product"

# Analytics
NEXT_PUBLIC_POSTHOG_KEY="your-posthog-key"
NEXT_PUBLIC_POSTHOG_HOST="https://app.posthog.com"
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"

# Newsletter
CONVERTKIT_API_KEY="your-api-key"
CONVERTKIT_FORM_ID="your-form-id"

# Email
RESEND_API_KEY="re_..."
CONTACT_EMAIL="hello@yoursite.com"

# Payments (if pricing page)
STRIPE_SECRET_KEY="sk_..."
STRIPE_PUBLISHABLE_KEY="pk_..."
```

## Core Components

### Hero Section
```tsx
// src/components/sections/Hero.tsx
'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Play, Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { WaitlistForm } from '@/components/forms/WaitlistForm';

interface HeroProps {
  badge?: string;
  title: string;
  highlightedText?: string;
  description: string;
  primaryCTA?: { text: string; href: string };
  secondaryCTA?: { text: string; href: string };
  showWaitlist?: boolean;
  showSocialProof?: boolean;
  videoId?: string;
}

export function Hero({
  badge,
  title,
  highlightedText,
  description,
  primaryCTA,
  secondaryCTA,
  showWaitlist = false,
  showSocialProof = true,
  videoId,
}: HeroProps) {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 },
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-background pt-24 pb-16 md:pt-32 md:pb-24">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          {badge && (
            <motion.div {...fadeInUp}>
              <Badge variant="outline" className="mb-6">
                {badge}
              </Badge>
            </motion.div>
          )}

          <motion.h1
            className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {title}{' '}
            {highlightedText && (
              <span className="text-primary bg-primary/10 px-2 rounded-lg">
                {highlightedText}
              </span>
            )}
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {description}
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {showWaitlist ? (
              <WaitlistForm className="w-full max-w-md" />
            ) : (
              <>
                {primaryCTA && (
                  <Button size="lg" asChild>
                    <Link href={primaryCTA.href}>
                      {primaryCTA.text}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                )}
                {secondaryCTA && (
                  <Button variant="outline" size="lg" asChild>
                    <Link href={secondaryCTA.href}>
                      {videoId && <Play className="mr-2 h-4 w-4" />}
                      {secondaryCTA.text}
                    </Link>
                  </Button>
                )}
              </>
            )}
          </motion.div>

          {showSocialProof && (
            <motion.div
              className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
                <span className="ml-1">4.9/5</span>
              </div>
              <span className="hidden sm:inline">•</span>
              <span>Trusted by 10,000+ teams</span>
              <span className="hidden sm:inline">•</span>
              <span>No credit card required</span>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
```

### Features Section
```tsx
// src/components/sections/Features.tsx
'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface FeaturesProps {
  badge?: string;
  title: string;
  description?: string;
  features: Feature[];
  columns?: 2 | 3 | 4;
  variant?: 'cards' | 'grid' | 'list';
}

export function Features({
  badge,
  title,
  description,
  features,
  columns = 3,
  variant = 'cards',
}: FeaturesProps) {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <section className="py-16 md:py-24" id="features">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center mb-12">
          {badge && (
            <span className="text-primary font-semibold text-sm uppercase tracking-wider mb-2 block">
              {badge}
            </span>
          )}
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
          {description && (
            <p className="text-lg text-muted-foreground">{description}</p>
          )}
        </div>

        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className={cn(
            'grid gap-6',
            columns === 2 && 'md:grid-cols-2',
            columns === 3 && 'md:grid-cols-2 lg:grid-cols-3',
            columns === 4 && 'md:grid-cols-2 lg:grid-cols-4'
          )}
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;

            if (variant === 'cards') {
              return (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="group relative p-6 rounded-2xl border bg-card hover:shadow-lg transition-shadow"
                >
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </motion.div>
              );
            }

            return (
              <motion.div
                key={index}
                variants={itemVariants}
                className="flex gap-4"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
```

### Testimonials Section
```tsx
// src/components/sections/Testimonials.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Testimonial {
  content: string;
  author: {
    name: string;
    title: string;
    company: string;
    image?: string;
  };
  rating?: number;
}

interface TestimonialsProps {
  title?: string;
  description?: string;
  testimonials: Testimonial[];
  variant?: 'carousel' | 'grid' | 'featured';
}

export function Testimonials({
  title = 'What our customers say',
  description,
  testimonials,
  variant = 'carousel',
}: TestimonialsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prev = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  if (variant === 'grid') {
    return (
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
            {description && (
              <p className="text-lg text-muted-foreground">{description}</p>
            )}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="p-6 rounded-2xl border bg-card"
              >
                <Quote className="h-8 w-8 text-primary/20 mb-4" />
                <p className="text-muted-foreground mb-6">{testimonial.content}</p>
                <div className="flex items-center gap-4">
                  {testimonial.author.image && (
                    <Image
                      src={testimonial.author.image}
                      alt={testimonial.author.name}
                      width={48}
                      height={48}
                      className="rounded-full"
                    />
                  )}
                  <div>
                    <p className="font-semibold">{testimonial.author.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.author.title}, {testimonial.author.company}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Carousel variant
  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
            {description && (
              <p className="text-lg text-muted-foreground">{description}</p>
            )}
          </div>

          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="text-center"
              >
                <Quote className="h-12 w-12 text-primary/20 mx-auto mb-6" />
                <p className="text-xl md:text-2xl mb-8">
                  "{testimonials[currentIndex].content}"
                </p>
                <div className="flex flex-col items-center">
                  {testimonials[currentIndex].author.image && (
                    <Image
                      src={testimonials[currentIndex].author.image}
                      alt={testimonials[currentIndex].author.name}
                      width={64}
                      height={64}
                      className="rounded-full mb-4"
                    />
                  )}
                  <p className="font-semibold text-lg">
                    {testimonials[currentIndex].author.name}
                  </p>
                  <p className="text-muted-foreground">
                    {testimonials[currentIndex].author.title},{' '}
                    {testimonials[currentIndex].author.company}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-center gap-4 mt-8">
              <Button variant="outline" size="icon" onClick={prev}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`h-2 w-2 rounded-full transition-colors ${
                      index === currentIndex ? 'bg-primary' : 'bg-primary/20'
                    }`}
                  />
                ))}
              </div>
              <Button variant="outline" size="icon" onClick={next}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
```

### Pricing Section
```tsx
// src/components/sections/Pricing.tsx
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface PricingPlan {
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: { name: string; included: boolean }[];
  cta: string;
  popular?: boolean;
}

interface PricingProps {
  title?: string;
  description?: string;
  plans: PricingPlan[];
}

export function Pricing({
  title = 'Simple, transparent pricing',
  description = 'Choose the plan that works best for you.',
  plans,
}: PricingProps) {
  const [isYearly, setIsYearly] = useState(true);

  return (
    <section className="py-16 md:py-24" id="pricing">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
          <p className="text-lg text-muted-foreground mb-8">{description}</p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-4 p-1 rounded-lg bg-muted">
            <button
              onClick={() => setIsYearly(false)}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                !isYearly ? 'bg-background shadow text-foreground' : 'text-muted-foreground'
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                isYearly ? 'bg-background shadow text-foreground' : 'text-muted-foreground'
              )}
            >
              Yearly
              <span className="ml-1 text-xs text-primary">Save 20%</span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                'relative rounded-2xl border p-8',
                plan.popular
                  ? 'border-primary bg-primary/5 shadow-lg'
                  : 'bg-card'
              )}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                <p className="text-muted-foreground text-sm">{plan.description}</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold">
                  ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                </span>
                <span className="text-muted-foreground">
                  /{isYearly ? 'year' : 'month'}
                </span>
              </div>

              <Button
                className="w-full mb-6"
                variant={plan.popular ? 'default' : 'outline'}
              >
                {plan.cta}
              </Button>

              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature.name} className="flex items-center gap-3">
                    {feature.included ? (
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
                    )}
                    <span
                      className={cn(
                        'text-sm',
                        !feature.included && 'text-muted-foreground/50'
                      )}
                    >
                      {feature.name}
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

### FAQ Section
```tsx
// src/components/sections/FAQ.tsx
'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/Accordion';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQProps {
  title?: string;
  description?: string;
  faqs: FAQItem[];
}

export function FAQ({
  title = 'Frequently asked questions',
  description,
  faqs,
}: FAQProps) {
  return (
    <section className="py-16 md:py-24" id="faq">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
          {description && (
            <p className="text-lg text-muted-foreground">{description}</p>
          )}
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border rounded-lg px-6"
              >
                <AccordionTrigger className="text-left hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
```

## A/B Testing Integration

```tsx
// src/components/analytics/ABTest.tsx
'use client';

import { useEffect, useState } from 'react';
import { usePostHog } from 'posthog-js/react';

interface ABTestProps {
  experimentKey: string;
  variants: Record<string, React.ReactNode>;
  fallback?: React.ReactNode;
}

export function ABTest({ experimentKey, variants, fallback }: ABTestProps) {
  const posthog = usePostHog();
  const [variant, setVariant] = useState<string | null>(null);

  useEffect(() => {
    if (posthog) {
      const featureFlag = posthog.getFeatureFlag(experimentKey);
      if (typeof featureFlag === 'string') {
        setVariant(featureFlag);
      }
    }
  }, [posthog, experimentKey]);

  if (!variant) {
    return <>{fallback || variants.control}</>;
  }

  return <>{variants[variant] || variants.control}</>;
}

// Usage example
export function HeroABTest() {
  return (
    <ABTest
      experimentKey="hero-variant"
      variants={{
        control: (
          <Hero
            title="Build faster"
            primaryCTA={{ text: 'Get Started', href: '/signup' }}
          />
        ),
        variant_a: (
          <Hero
            title="Ship faster"
            primaryCTA={{ text: 'Start Free Trial', href: '/signup' }}
          />
        ),
        variant_b: (
          <Hero
            title="Launch faster"
            showWaitlist={true}
          />
        ),
      }}
    />
  );
}
```

### PostHog Provider
```tsx
// src/components/analytics/PostHogProvider.tsx
'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useEffect } from 'react';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
        capture_pageview: false, // Disable automatic pageview capture
        capture_pageleave: true,
      });
    }
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}

// Page view tracking hook
export function usePageView() {
  useEffect(() => {
    posthog.capture('$pageview');
  }, []);
}

// Event tracking
export function trackEvent(event: string, properties?: Record<string, any>) {
  posthog.capture(event, properties);
}

// User identification
export function identifyUser(userId: string, properties?: Record<string, any>) {
  posthog.identify(userId, properties);
}
```

## Lead Capture Forms

### Waitlist Form
```tsx
// src/components/forms/WaitlistForm.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { trackEvent } from '@/components/analytics/PostHogProvider';
import { cn } from '@/lib/utils';

const waitlistSchema = z.object({
  email: z.string().email('Please enter a valid email'),
});

type WaitlistFormData = z.infer<typeof waitlistSchema>;

interface WaitlistFormProps {
  className?: string;
  buttonText?: string;
  successMessage?: string;
}

export function WaitlistForm({
  className,
  buttonText = 'Join Waitlist',
  successMessage = "You're on the list!",
}: WaitlistFormProps) {
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<WaitlistFormData>({
    resolver: zodResolver(waitlistSchema),
  });

  const onSubmit = async (data: WaitlistFormData) => {
    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to join waitlist');

      trackEvent('waitlist_signup', { email: data.email });
      setIsSubmitted(true);
    } catch (error) {
      console.error('Waitlist error:', error);
    }
  };

  if (isSubmitted) {
    return (
      <div className={cn('flex items-center gap-2 text-primary', className)}>
        <CheckCircle className="h-5 w-5" />
        <span className="font-medium">{successMessage}</span>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn('flex flex-col sm:flex-row gap-3', className)}
    >
      <div className="flex-1">
        <Input
          type="email"
          placeholder="Enter your email"
          {...register('email')}
          className={errors.email ? 'border-red-500' : ''}
        />
        {errors.email && (
          <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
        )}
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          buttonText
        )}
      </Button>
    </form>
  );
}
```

## SEO & Metadata

### OG Image Generation
```tsx
// src/app/opengraph-image.tsx
import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Your Product Name';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 64,
          background: 'linear-gradient(to bottom right, #1a1a2e, #16213e)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
        }}
      >
        <div style={{ fontSize: 80, fontWeight: 'bold', marginBottom: 20 }}>
          Your Product
        </div>
        <div style={{ fontSize: 36, opacity: 0.8 }}>
          Build faster. Ship smarter.
        </div>
      </div>
    ),
    { ...size }
  );
}
```

### Sitemap
```typescript
// src/app/sitemap.ts
import { MetadataRoute } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yoursite.com';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];
}
```

## CLAUDE.md Integration

```markdown
# Landing Page

## Key Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production

## Sections
- Hero: `src/components/sections/Hero.tsx`
- Features: `src/components/sections/Features.tsx`
- Pricing: `src/components/sections/Pricing.tsx`
- Testimonials: `src/components/sections/Testimonials.tsx`
- FAQ: `src/components/sections/FAQ.tsx`
- CTA: `src/components/sections/CTA.tsx`

## A/B Testing
- Provider: `src/components/analytics/PostHogProvider.tsx`
- Component: `src/components/analytics/ABTest.tsx`
- Dashboard: https://app.posthog.com

## Lead Capture
- Waitlist: POST `/api/waitlist`
- Newsletter: POST `/api/newsletter`
- Contact: POST `/api/contact`

## Analytics Events
- `waitlist_signup` - User joins waitlist
- `newsletter_signup` - Newsletter subscription
- `pricing_click` - CTA click on pricing
- `feature_view` - Feature section viewed
```

## AI Suggestions

1. **Dynamic Hero Optimization** - Use ML to personalize hero copy based on traffic source and user behavior
2. **Smart Testimonial Selection** - Display testimonials most relevant to visitor's industry/role
3. **Conversion Prediction** - ML model to identify high-intent visitors for targeted messaging
4. **Copy A/B Generation** - AI-generated headline variants for automatic testing
5. **Heatmap Analysis** - Integrate AI-powered attention prediction for layout optimization
6. **Exit Intent Detection** - Smart popups with personalized offers based on user journey
7. **Social Proof Timing** - Display testimonials and stats at optimal scroll positions
8. **Form Field Optimization** - AI analysis to minimize form friction and maximize conversions
9. **Chatbot Integration** - AI assistant to answer questions and guide to conversion
10. **Pricing Psychology** - Dynamic pricing display based on user behavior patterns
