# Multi-Skill Workflow Recipes

## Combining Skills for Complex Development Tasks

---

## Table of Contents

1. [Introduction](#introduction)
2. [Full-Stack Application Development](#full-stack-application-development)
3. [Mobile App Launch](#mobile-app-launch)
4. [SaaS Product Pipeline](#saas-product-pipeline)
5. [E-commerce Store Setup](#e-commerce-store-setup)
6. [API Development Workflow](#api-development-workflow)
7. [DevOps Pipeline Setup](#devops-pipeline-setup)
8. [Marketing Campaign Launch](#marketing-campaign-launch)
9. [Issue Tracking Integration](#issue-tracking-integration)
10. [Monitoring & Observability Stack](#monitoring-observability-stack)

---

## Introduction

### What Are Multi-Skill Workflows?

Multi-skill workflows combine multiple Murphbeck skills to accomplish complex tasks that span multiple domains. By chaining skills together, you can:

- Build complete applications from scratch
- Set up full DevOps pipelines
- Launch marketing campaigns
- Integrate multiple services

### Workflow Notation

```
/skill1 → /skill2 → /skill3
    ↓         ↓         ↓
 [Output] [Output] [Output]
```

### Best Practices

1. **Plan the workflow first** - Identify all skills needed
2. **Follow dependency order** - Some skills depend on others
3. **Save outputs** - Each skill's output may be needed later
4. **Verify each step** - Test before moving to next skill

---

## Full-Stack Application Development

### Recipe: Next.js SaaS Application

**Skills Used:**
- `/blueprint` - Architecture design
- `/api-design` - API specification
- `/supabase-architect` - Database setup
- `/sentry-integration` - Error monitoring
- `/google-analytics` - Usage tracking
- `/github-actions` - CI/CD pipeline
- `/deploy-vercel` - Production deployment

### Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS SAAS WORKFLOW                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Step 1: Architecture                                           │
│  /blueprint saas app with auth, billing, dashboard              │
│  Output: Project structure, component hierarchy                 │
│          ↓                                                      │
│  Step 2: API Design                                             │
│  /api-design REST API for user, subscription, analytics         │
│  Output: OpenAPI spec, endpoint documentation                   │
│          ↓                                                      │
│  Step 3: Database                                               │
│  /supabase-architect users, subscriptions, analytics tables     │
│  Output: Schema, RLS policies, Edge Functions                   │
│          ↓                                                      │
│  Step 4: Error Monitoring                                       │
│  /sentry-integration setup nextjs                               │
│  Output: Sentry config, error boundaries                        │
│          ↓                                                      │
│  Step 5: Analytics                                              │
│  /google-analytics setup                                        │
│  Output: GTM container, data layer, events                      │
│          ↓                                                      │
│  Step 6: CI/CD                                                  │
│  /github-actions create ci                                      │
│  Output: Workflows for test, build, deploy                      │
│          ↓                                                      │
│  Step 7: Deploy                                                 │
│  /deploy-vercel production                                      │
│  Output: Live application URL                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Detailed Steps

**Step 1: Architecture Design**
```
/blueprint create a SaaS application with:
- User authentication (email, OAuth)
- Subscription billing (Stripe)
- Admin dashboard
- User dashboard
- API for integrations
- Multi-tenant data isolation
```

**Step 2: API Specification**
```
/api-design create REST API with endpoints:
- POST /auth/signup
- POST /auth/login
- GET /users/me
- POST /subscriptions
- GET /analytics/dashboard
- CRUD for resources
```

**Step 3: Database Setup**
```
/supabase-architect design schema for:
- users table with profile
- organizations (multi-tenant)
- subscriptions with Stripe sync
- audit_logs for compliance
- Enable RLS for tenant isolation
```

**Step 4: Error Monitoring**
```
/sentry-integration setup nextjs
- Configure client and server
- Add error boundaries
- Set up source maps
- Configure release tracking
```

**Step 5: Analytics Integration**
```
/google-analytics setup
- Create GTM container
- Configure data layer
- Set up conversion tracking
- Add user identification
```

**Step 6: CI/CD Pipeline**
```
/github-actions create ci
- Lint and type check
- Run tests
- Build application
- Deploy to staging/production
```

**Step 7: Production Deployment**
```
/deploy-vercel production
- Configure environment variables
- Set up custom domain
- Enable edge functions
- Configure caching
```

---

## Mobile App Launch

### Recipe: Cross-Platform Mobile App

**Skills Used:**
- `/flutter-builder` OR `/react-native` - Mobile development
- `/supabase-architect` - Backend
- `/sentry-integration` - Error monitoring
- `/google-analytics` - Analytics
- `/github-actions` - CI/CD

### Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    MOBILE APP WORKFLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Step 1: Mobile Framework                                       │
│  /flutter-builder create app with auth, home, profile           │
│          ↓                                                      │
│  Step 2: Backend Setup                                          │
│  /supabase-architect mobile backend with realtime               │
│          ↓                                                      │
│  Step 3: Error Tracking                                         │
│  /sentry-integration setup react-native                         │
│          ↓                                                      │
│  Step 4: Analytics                                              │
│  /google-analytics setup firebase                               │
│          ↓                                                      │
│  Step 5: CI/CD                                                  │
│  /github-actions create mobile-ci                               │
│  Output: EAS Build or Fastlane workflows                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Flutter Path

```
/flutter-builder create e-commerce app with:
- Authentication screens
- Product listing with search
- Shopping cart with persistence
- Checkout flow
- Order history
- Push notifications
```

### React Native Path

```
/react-native create fitness tracking app with:
- Onboarding flow
- Workout tracking
- Progress charts
- Social features
- Apple Health integration
- Offline support
```

---

## SaaS Product Pipeline

### Recipe: Complete SaaS Launch

**Skills Used:**
- `/blueprint` - Architecture
- `/api-design` - API specification
- `/supabase-architect` - Database
- `/sentry-integration` - Monitoring
- `/google-analytics` - Analytics
- `/jira-integration` OR `/linear-integration` - Issue tracking
- `/github-actions` - CI/CD
- `/social-media-master` - Marketing
- `/pricing-calc` - Pricing strategy

### Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    SAAS LAUNCH PIPELINE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PHASE 1: PLANNING                                              │
│  ├── /blueprint architecture                                    │
│  ├── /pricing-calc strategy                                     │
│  └── /mvp-scope features                                        │
│                     ↓                                           │
│  PHASE 2: DEVELOPMENT                                           │
│  ├── /api-design specification                                  │
│  ├── /supabase-architect database                               │
│  ├── /linear-integration project tracking                       │
│  └── /github-actions ci-cd                                      │
│                     ↓                                           │
│  PHASE 3: QUALITY                                               │
│  ├── /sentry-integration monitoring                             │
│  ├── /google-analytics tracking                                 │
│  └── /test-gen test coverage                                    │
│                     ↓                                           │
│  PHASE 4: LAUNCH                                                │
│  ├── /deploy-vercel production                                  │
│  ├── /social-media-master campaign                              │
│  └── /adscail-campaign-builder ads                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## E-commerce Store Setup

### Recipe: Complete E-commerce Platform

**Skills Used:**
- `/blueprint` - Store architecture
- `/supabase-architect` - Product catalog, orders
- `/google-analytics` - E-commerce tracking
- `/sentry-integration` - Error monitoring
- `/product-listing` - Product optimization
- `/checkout-optimizer` - Conversion optimization

### Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    E-COMMERCE WORKFLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Step 1: Store Architecture                                     │
│  /blueprint e-commerce with products, cart, checkout            │
│          ↓                                                      │
│  Step 2: Database Design                                        │
│  /supabase-architect products, orders, customers, inventory     │
│          ↓                                                      │
│  Step 3: Product Catalog                                        │
│  /product-listing optimize for SEO and conversions              │
│          ↓                                                      │
│  Step 4: Analytics                                              │
│  /google-analytics ecommerce                                    │
│  - Enhanced e-commerce events                                   │
│  - Product impressions                                          │
│  - Cart abandonment tracking                                    │
│          ↓                                                      │
│  Step 5: Checkout Optimization                                  │
│  /checkout-optimizer analyze and improve                        │
│          ↓                                                      │
│  Step 6: Error Monitoring                                       │
│  /sentry-integration setup                                      │
│  - Payment error tracking                                       │
│  - Checkout flow monitoring                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### E-commerce Analytics Setup

```
/google-analytics ecommerce

Events to configure:
- view_item_list (category pages)
- view_item (product pages)
- add_to_cart
- remove_from_cart
- view_cart
- begin_checkout
- add_shipping_info
- add_payment_info
- purchase
- refund
```

---

## API Development Workflow

### Recipe: Production-Ready API

**Skills Used:**
- `/api-design` - API specification
- `/supabase-architect` OR `/kubernetes-architect` - Infrastructure
- `/github-actions` - CI/CD
- `/sentry-integration` - Error monitoring
- `/docker-compose` - Containerization

### Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    API DEVELOPMENT WORKFLOW                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Step 1: API Design                                             │
│  /api-design create REST/GraphQL specification                  │
│  Output: OpenAPI spec, types, validation                        │
│          ↓                                                      │
│  Step 2: Database Layer                                         │
│  /supabase-architect design data model                          │
│  Output: Schema, migrations, RLS                                │
│          ↓                                                      │
│  Step 3: Containerization                                       │
│  /docker-compose create production setup                        │
│  Output: Dockerfile, docker-compose.yml                         │
│          ↓                                                      │
│  Step 4: Error Monitoring                                       │
│  /sentry-integration setup node                                 │
│  Output: Sentry config, error handlers                          │
│          ↓                                                      │
│  Step 5: CI/CD                                                  │
│  /github-actions create api-pipeline                            │
│  Output: Test, build, deploy workflows                          │
│          ↓                                                      │
│  Step 6: Infrastructure (if needed)                             │
│  /kubernetes-architect deploy to k8s                            │
│  Output: Deployments, services, ingress                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## DevOps Pipeline Setup

### Recipe: Complete CI/CD Infrastructure

**Skills Used:**
- `/github-actions` - CI/CD workflows
- `/docker-compose` - Containerization
- `/kubernetes-architect` - Orchestration
- `/sentry-integration` - Release tracking
- `/gcp-architect` OR `/azure-architect` - Cloud infrastructure

### Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEVOPS PIPELINE WORKFLOW                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  STAGE 1: CONTAINERIZATION                                      │
│  /docker-compose create production                              │
│  - Multi-stage Dockerfile                                       │
│  - docker-compose for local dev                                 │
│          ↓                                                      │
│  STAGE 2: CI/CD WORKFLOWS                                       │
│  /github-actions create complete                                │
│  - PR validation                                                │
│  - Build and test                                               │
│  - Security scanning                                            │
│  - Deploy to environments                                       │
│          ↓                                                      │
│  STAGE 3: CLOUD INFRASTRUCTURE                                  │
│  /gcp-architect OR /azure-architect                             │
│  - Compute resources                                            │
│  - Database                                                     │
│  - Networking                                                   │
│  - IAM/RBAC                                                     │
│          ↓                                                      │
│  STAGE 4: KUBERNETES (if needed)                                │
│  /kubernetes-architect deploy                                   │
│  - Deployments                                                  │
│  - Services                                                     │
│  - Ingress                                                      │
│  - HPA                                                          │
│          ↓                                                      │
│  STAGE 5: MONITORING                                            │
│  /sentry-integration setup                                      │
│  - Error tracking                                               │
│  - Performance monitoring                                       │
│  - Release tracking                                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Environment Strategy

```
┌──────────┬─────────────┬──────────────┬─────────────┐
│ Branch   │ Environment │ Trigger      │ Approval    │
├──────────┼─────────────┼──────────────┼─────────────┤
│ feature  │ preview     │ PR opened    │ None        │
│ develop  │ staging     │ PR merged    │ None        │
│ main     │ production  │ Release tag  │ Required    │
└──────────┴─────────────┴──────────────┴─────────────┘
```

---

## Marketing Campaign Launch

### Recipe: Product Launch Campaign

**Skills Used:**
- `/social-media-master` - Social strategy
- `/social-create` - Content creation
- `/social-calendar` - Content scheduling
- `/adscail-campaign-builder` - Paid ads
- `/google-analytics` - Campaign tracking
- `/newsletter` - Email marketing

### Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    MARKETING CAMPAIGN WORKFLOW                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PHASE 1: STRATEGY                                              │
│  /social-media-master plan campaign                             │
│  Output: Content pillars, audience, messaging                   │
│          ↓                                                      │
│  PHASE 2: CONTENT CREATION                                      │
│  /social-create generate posts                                  │
│  Output: Posts for each platform                                │
│          ↓                                                      │
│  PHASE 3: SCHEDULING                                            │
│  /social-calendar plan 4-week calendar                          │
│  Output: Publishing schedule                                    │
│          ↓                                                      │
│  PHASE 4: PAID ADVERTISING                                      │
│  /adscail-campaign-builder create campaign                      │
│  Output: Ad copy, targeting, budgets                            │
│          ↓                                                      │
│  PHASE 5: EMAIL MARKETING                                       │
│  /newsletter create launch sequence                             │
│  Output: Email templates, automation                            │
│          ↓                                                      │
│  PHASE 6: TRACKING                                              │
│  /google-analytics configure campaign tracking                  │
│  Output: UTM templates, conversion goals                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Issue Tracking Integration

### Recipe: Development Workflow with Issue Tracking

**Skills Used:**
- `/jira-integration` OR `/linear-integration` - Issue tracking
- `/github-actions` - CI/CD with issue sync
- `/slack-message` - Team notifications

### Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    ISSUE TRACKING WORKFLOW                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Step 1: Project Setup                                          │
│  /linear-integration setup                                      │
│  OR /jira-integration setup                                     │
│          ↓                                                      │
│  Step 2: GitHub Integration                                     │
│  /github-actions create with issue sync                         │
│  - Extract issue ID from branch                                 │
│  - Update issue on PR events                                    │
│  - Move to Done on merge                                        │
│          ↓                                                      │
│  Step 3: Slack Notifications                                    │
│  /slack-message configure                                       │
│  - New issue notifications                                      │
│  - Sprint updates                                               │
│  - Deployment notifications                                     │
│          ↓                                                      │
│  Step 4: Automation Rules                                       │
│  /linear-integration automation                                 │
│  OR /jira-integration automation                                │
│  - Auto-assign by component                                     │
│  - SLA monitoring                                               │
│  - Triage rules                                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Branch Naming Convention

```
feature/ENG-123-add-user-auth
bugfix/ENG-456-fix-login-error
hotfix/ENG-789-security-patch
```

### Automation Flow

```
1. Developer creates branch: feature/ENG-123-...
2. GitHub Action extracts ENG-123
3. Linear/Jira issue moved to "In Progress"
4. Developer opens PR
5. Issue moved to "In Review"
6. PR merged
7. Issue moved to "Done"
8. Slack notification sent
```

---

## Monitoring & Observability Stack

### Recipe: Complete Observability Setup

**Skills Used:**
- `/sentry-integration` - Error tracking
- `/google-analytics` - User analytics
- `/github-actions` - Release tracking

### Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    OBSERVABILITY WORKFLOW                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  LAYER 1: ERROR TRACKING                                        │
│  /sentry-integration setup                                      │
│  - Exception capture                                            │
│  - Performance monitoring                                       │
│  - Session replay                                               │
│  - Release tracking                                             │
│          ↓                                                      │
│  LAYER 2: USER ANALYTICS                                        │
│  /google-analytics setup                                        │
│  - Page views                                                   │
│  - User journeys                                                │
│  - Conversion funnels                                           │
│  - Custom events                                                │
│          ↓                                                      │
│  LAYER 3: CI/CD INTEGRATION                                     │
│  /github-actions with monitoring                                │
│  - Sentry release creation                                      │
│  - Source map upload                                            │
│  - Deployment markers                                           │
│          ↓                                                      │
│  LAYER 4: ALERTING                                              │
│  - Error spike alerts                                           │
│  - Performance regression alerts                                │
│  - Deployment notifications                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Monitoring Dashboard Setup

```
/sentry-integration setup
/google-analytics setup

Combined metrics to track:
├── Error rate (Sentry)
├── Error trends by release (Sentry)
├── Page load performance (Sentry + GA)
├── User sessions (GA)
├── Conversion rate (GA)
├── User segments with errors (Sentry + GA)
└── Revenue impact of errors (GA e-commerce + Sentry)
```

---

## Quick Reference: Skill Combinations

| Goal | Skills to Combine |
|------|-------------------|
| Web App | blueprint → api-design → supabase → sentry → github-actions → deploy |
| Mobile App | flutter/react-native → supabase → sentry → github-actions |
| API | api-design → supabase → docker → github-actions → kubernetes |
| Marketing | social-master → social-create → social-calendar → adscail → analytics |
| DevOps | docker → github-actions → gcp/azure → kubernetes → sentry |
| E-commerce | blueprint → supabase → analytics → product-listing → checkout |
| Tracking | linear/jira → github-actions → slack → sentry |

---

## Workflow Cheat Sheet

```
WEB APP:        /blueprint → /supabase-architect → /github-actions → /sentry-integration → /deploy-vercel
MOBILE APP:     /flutter-builder → /supabase-architect → /sentry-integration → /github-actions
API:            /api-design → /docker-compose → /github-actions → /kubernetes-architect
SAAS:           /blueprint → /pricing-calc → /supabase-architect → /github-actions → /social-media-master
E-COMMERCE:     /blueprint → /supabase-architect → /google-analytics ecommerce → /checkout-optimizer
DEVOPS:         /docker-compose → /github-actions → /gcp-architect → /sentry-integration
MARKETING:      /social-media-master → /social-create → /adscail-campaign-builder → /google-analytics
ISSUE TRACKING: /linear-integration → /github-actions → /slack-message
MONITORING:     /sentry-integration → /google-analytics → /github-actions
```

---

*Use these recipes as starting points and customize based on your specific requirements.*
