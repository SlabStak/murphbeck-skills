# Knowledge Base Documentation Template

## Overview
Templates and tools for building searchable knowledge bases with FAQ sections, troubleshooting guides, and structured articles.

## Quick Start
```bash
npm install @algolia/autocomplete-js algoliasearch marked gray-matter
mkdir -p docs/knowledge-base/{articles,faq,troubleshooting}
```

## Knowledge Base Article Template

### article-template.md
```markdown
---
id: kb-0001
title: How to Configure Authentication
description: Step-by-step guide for setting up authentication in your application
category: Security
subcategory: Authentication
tags:
  - auth
  - security
  - setup
  - oauth
difficulty: intermediate
reading_time: 10
last_updated: 2024-01-15
author: docs-team
related:
  - kb-0002
  - kb-0003
---

# How to Configure Authentication

## Overview

This article explains how to configure authentication for your application, including OAuth2, JWT tokens, and session management.

## Prerequisites

Before you begin, ensure you have:

- [ ] Admin access to your account
- [ ] API credentials from your identity provider
- [ ] Basic understanding of OAuth2 flow

## Step-by-Step Guide

### Step 1: Create an Auth Provider

1. Navigate to **Settings > Security > Authentication**
2. Click **Add Provider**
3. Select your provider type:
   - OAuth2 (Google, GitHub, etc.)
   - SAML 2.0
   - LDAP
   - Custom JWT

![Add Provider Screenshot](/images/kb/add-provider.png)

### Step 2: Configure Provider Settings

Enter the following settings based on your provider:

| Setting | Description | Example |
|---------|-------------|---------|
| Client ID | OAuth client identifier | `abc123...` |
| Client Secret | OAuth client secret | `secret...` |
| Authorize URL | OAuth authorization endpoint | `https://provider.com/oauth/authorize` |
| Token URL | OAuth token endpoint | `https://provider.com/oauth/token` |
| Callback URL | Your callback URL | `https://yourapp.com/auth/callback` |

### Step 3: Configure Scopes

Select the scopes your application needs:

```yaml
scopes:
  - openid        # Required for OIDC
  - profile       # User profile information
  - email         # User email address
  - offline_access # Refresh tokens
```

### Step 4: Test the Configuration

1. Click **Test Connection**
2. A new window will open for authentication
3. Complete the login flow
4. Verify the test results:

```json
{
  "status": "success",
  "user": {
    "id": "user_123",
    "email": "test@example.com",
    "name": "Test User"
  }
}
```

### Step 5: Enable the Provider

1. Toggle **Enable Provider** to ON
2. Set the provider priority (if using multiple)
3. Click **Save Changes**

## Code Examples

### Backend Integration

```typescript
// Configure the auth provider
import { AuthProvider } from '@company/auth';

const authProvider = new AuthProvider({
  clientId: process.env.AUTH_CLIENT_ID,
  clientSecret: process.env.AUTH_CLIENT_SECRET,
  callbackUrl: 'https://yourapp.com/auth/callback',
  scopes: ['openid', 'profile', 'email']
});

// Handle callback
app.get('/auth/callback', async (req, res) => {
  const { code } = req.query;
  const tokens = await authProvider.exchangeCode(code);
  const user = await authProvider.getUserInfo(tokens.accessToken);

  // Create session
  req.session.user = user;
  res.redirect('/dashboard');
});
```

### Frontend Integration

```typescript
// Login button component
import { useAuth } from '@company/auth-react';

function LoginButton() {
  const { login, isLoading } = useAuth();

  return (
    <button onClick={() => login('google')} disabled={isLoading}>
      {isLoading ? 'Logging in...' : 'Login with Google'}
    </button>
  );
}
```

## Troubleshooting

### Common Issues

<details>
<summary><strong>Error: Invalid redirect URI</strong></summary>

This error occurs when the callback URL doesn't match the configured URL.

**Solution:**
1. Check the callback URL in your provider settings
2. Ensure it exactly matches (including trailing slash)
3. Verify the URL is added to allowed redirects in your provider's console

</details>

<details>
<summary><strong>Error: Invalid client credentials</strong></summary>

This error indicates incorrect client ID or secret.

**Solution:**
1. Regenerate your client credentials
2. Update the credentials in your application
3. Restart your application to apply changes

</details>

<details>
<summary><strong>Error: Scope not allowed</strong></summary>

Some scopes may require additional permissions.

**Solution:**
1. Check which scopes are available for your app
2. Request additional permissions from your provider
3. Remove unnecessary scopes from your configuration

</details>

## Best Practices

- ✅ Always use HTTPS for callback URLs
- ✅ Store credentials in environment variables
- ✅ Implement token refresh before expiry
- ✅ Use PKCE for public clients
- ❌ Never expose client secrets in frontend code
- ❌ Don't store tokens in localStorage for sensitive apps

## Related Articles

- [Understanding OAuth2 Flow](/knowledge-base/kb-0002)
- [JWT Token Best Practices](/knowledge-base/kb-0003)
- [Implementing MFA](/knowledge-base/kb-0004)

## Still Need Help?

If you're still experiencing issues:

1. Check our [FAQ section](/faq)
2. Search the [community forum](https://community.example.com)
3. [Contact support](mailto:support@example.com)

---

**Was this article helpful?**

[👍 Yes](#) | [👎 No](#) | [💬 Suggest improvements](#)
```

## FAQ Template

### faq-template.md
```markdown
---
id: faq-auth
title: Authentication FAQ
category: Security
last_updated: 2024-01-15
---

# Authentication FAQ

## General Questions

### What authentication methods are supported?

We support the following authentication methods:

- **OAuth2/OIDC** - Google, GitHub, Microsoft, Okta
- **SAML 2.0** - Enterprise SSO providers
- **LDAP/Active Directory** - On-premise directories
- **Email/Password** - Traditional authentication
- **Magic Links** - Passwordless email login
- **API Keys** - For programmatic access

### Can I use multiple authentication providers?

Yes, you can configure multiple providers simultaneously. Users can choose their preferred method at login. You can also:

- Set a default provider
- Restrict access to specific providers per user group
- Link multiple providers to a single account

### How do I enable two-factor authentication (2FA)?

To enable 2FA:

1. Go to **Settings > Security > Two-Factor Authentication**
2. Choose your 2FA method:
   - Authenticator app (recommended)
   - SMS codes
   - Hardware security key
3. Follow the setup instructions
4. Save your backup codes

## Technical Questions

### How long do sessions last?

| Session Type | Default Duration | Configurable |
|-------------|------------------|--------------|
| Web session | 24 hours | Yes |
| API token | 1 hour | Yes |
| Refresh token | 7 days | Yes |
| Remember me | 30 days | Yes |

### What happens when a session expires?

When a session expires:

1. The user is redirected to the login page
2. A message indicates the session expired
3. After re-authentication, users return to their previous page

For API access:
1. The API returns a `401 Unauthorized` response
2. Use the refresh token to obtain a new access token
3. Retry the original request

### How do I rotate API keys?

```bash
# Generate new API key
curl -X POST https://api.example.com/v1/keys \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"name": "New Production Key"}'

# Revoke old API key
curl -X DELETE https://api.example.com/v1/keys/old_key_id \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## Troubleshooting

### Why am I getting "Invalid credentials" errors?

Common causes:

1. **Incorrect password** - Try resetting your password
2. **Account locked** - Contact support after multiple failed attempts
3. **Expired account** - Check with your administrator
4. **Wrong environment** - Verify you're logging into the correct environment

### Why can't I see certain features after logging in?

Access to features depends on:

1. **Role** - Your assigned role determines feature access
2. **Plan** - Some features require specific subscription plans
3. **Organization settings** - Admins can restrict features
4. **Feature flags** - Some features may be in beta

Contact your administrator to request access.

### How do I recover my account if I lose my 2FA device?

1. On the login page, click "Unable to use 2FA?"
2. Enter one of your backup codes
3. If you've lost backup codes, contact support with:
   - Your account email
   - Verification of account ownership
   - Government ID (for enterprise accounts)

Recovery typically takes 1-2 business days.
```

## Troubleshooting Guide Template

### troubleshooting-template.md
```markdown
---
id: ts-0001
title: API Connection Issues
category: Troubleshooting
symptoms:
  - Connection timeout
  - 502 Bad Gateway
  - Network unreachable
severity: high
last_updated: 2024-01-15
---

# Troubleshooting: API Connection Issues

## Symptoms

You may be experiencing this issue if you see:

- ❌ `Error: ECONNREFUSED` - Connection refused
- ❌ `Error: ETIMEDOUT` - Connection timed out
- ❌ `HTTP 502 Bad Gateway` - Server unreachable
- ❌ `HTTP 503 Service Unavailable` - Service down

## Quick Checks

Before diving into detailed troubleshooting:

- [ ] Check [status page](https://status.example.com) for known issues
- [ ] Verify your internet connection
- [ ] Try accessing from a different network
- [ ] Clear DNS cache: `sudo dscacheutil -flushcache`

## Diagnostic Steps

### Step 1: Test Connectivity

```bash
# Test basic connectivity
ping api.example.com

# Test HTTPS connectivity
curl -I https://api.example.com/health

# Check DNS resolution
nslookup api.example.com

# Test with verbose output
curl -v https://api.example.com/v1/status
```

**Expected output:**
```
HTTP/2 200
content-type: application/json
{"status": "healthy"}
```

### Step 2: Check Your Network

```bash
# Trace route to API
traceroute api.example.com

# Check for firewall blocks
sudo pfctl -sr | grep api.example.com

# Test from different DNS
nslookup api.example.com 8.8.8.8
```

### Step 3: Verify Credentials

```bash
# Test authentication
curl -X GET https://api.example.com/v1/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**If you get 401 Unauthorized:**
1. Regenerate your API token
2. Check token expiry
3. Verify token has required scopes

### Step 4: Check Rate Limits

```bash
# Check rate limit headers
curl -I https://api.example.com/v1/status

# Look for these headers:
# X-RateLimit-Limit: 1000
# X-RateLimit-Remaining: 999
# X-RateLimit-Reset: 1642089600
```

## Common Solutions

### Solution A: Firewall Configuration

If your organization uses a firewall, add these to your allowlist:

| Domain | Port | Protocol |
|--------|------|----------|
| `api.example.com` | 443 | HTTPS |
| `auth.example.com` | 443 | HTTPS |
| `cdn.example.com` | 443 | HTTPS |

IP ranges: `203.0.113.0/24`

### Solution B: Proxy Configuration

If you're behind a corporate proxy:

```bash
# Set proxy environment variables
export HTTPS_PROXY=http://proxy.company.com:8080
export NO_PROXY=localhost,127.0.0.1

# Or in your application
const client = new ApiClient({
  proxy: {
    host: 'proxy.company.com',
    port: 8080
  }
});
```

### Solution C: SSL Certificate Issues

If you see SSL/TLS errors:

```bash
# Update CA certificates
# macOS
brew install ca-certificates

# Ubuntu
sudo apt update && sudo apt install ca-certificates

# Verify certificate chain
openssl s_client -connect api.example.com:443 -showcerts
```

### Solution D: DNS Issues

If DNS resolution fails:

```bash
# Use alternative DNS
echo "nameserver 8.8.8.8" | sudo tee /etc/resolv.conf

# Or configure in your application
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
```

## Escalation Path

If the issue persists after trying all solutions:

1. **Collect Diagnostics**
   ```bash
   ./scripts/collect-diagnostics.sh > diagnostics.txt
   ```

2. **Open Support Ticket**
   - Include diagnostics file
   - Describe steps already taken
   - Provide timestamps of failed requests

3. **Emergency Contact**
   - For P1 issues: Call +1-800-XXX-XXXX
   - Slack: #support-emergency

## Related Issues

- [SSL Certificate Errors](/troubleshooting/ts-0002)
- [Rate Limiting](/troubleshooting/ts-0003)
- [Authentication Failures](/troubleshooting/ts-0004)
```

## Knowledge Base Search System

```typescript
// lib/knowledge-base.ts
import Fuse from 'fuse.js';
import matter from 'gray-matter';
import * as fs from 'fs';
import * as path from 'path';

interface Article {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
  path: string;
  lastUpdated: string;
}

interface SearchResult {
  article: Article;
  score: number;
  matches: Array<{
    key: string;
    value: string;
    indices: number[][];
  }>;
}

class KnowledgeBase {
  private articles: Article[] = [];
  private fuse: Fuse<Article>;

  constructor(articlesDir: string) {
    this.articles = this.loadArticles(articlesDir);
    this.fuse = new Fuse(this.articles, {
      keys: [
        { name: 'title', weight: 0.4 },
        { name: 'description', weight: 0.3 },
        { name: 'content', weight: 0.2 },
        { name: 'tags', weight: 0.1 }
      ],
      includeScore: true,
      includeMatches: true,
      threshold: 0.3,
      ignoreLocation: true,
      minMatchCharLength: 2
    });
  }

  private loadArticles(dir: string): Article[] {
    const articles: Article[] = [];
    const categories = fs.readdirSync(dir);

    for (const category of categories) {
      const categoryPath = path.join(dir, category);
      if (!fs.statSync(categoryPath).isDirectory()) continue;

      const files = fs.readdirSync(categoryPath)
        .filter(f => f.endsWith('.md'));

      for (const file of files) {
        const filePath = path.join(categoryPath, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const { data, content: body } = matter(content);

        articles.push({
          id: data.id || path.basename(file, '.md'),
          title: data.title || '',
          description: data.description || '',
          content: body,
          category: data.category || category,
          tags: data.tags || [],
          path: `/knowledge-base/${category}/${path.basename(file, '.md')}`,
          lastUpdated: data.last_updated || ''
        });
      }
    }

    return articles;
  }

  search(query: string, limit = 10): SearchResult[] {
    const results = this.fuse.search(query, { limit });
    return results.map(r => ({
      article: r.item,
      score: r.score || 0,
      matches: r.matches || []
    }));
  }

  getByCategory(category: string): Article[] {
    return this.articles.filter(a =>
      a.category.toLowerCase() === category.toLowerCase()
    );
  }

  getByTag(tag: string): Article[] {
    return this.articles.filter(a =>
      a.tags.some(t => t.toLowerCase() === tag.toLowerCase())
    );
  }

  getRelated(articleId: string, limit = 5): Article[] {
    const article = this.articles.find(a => a.id === articleId);
    if (!article) return [];

    // Search by tags and category
    const query = [...article.tags, article.category].join(' ');
    const results = this.search(query, limit + 1);

    return results
      .filter(r => r.article.id !== articleId)
      .slice(0, limit)
      .map(r => r.article);
  }

  getAllCategories(): string[] {
    return [...new Set(this.articles.map(a => a.category))];
  }

  getAllTags(): string[] {
    const tags = this.articles.flatMap(a => a.tags);
    return [...new Set(tags)];
  }
}

export { KnowledgeBase, Article, SearchResult };
```

## React Search Component

```tsx
// components/KBSearch.tsx
import { useState, useCallback, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  category: string;
  path: string;
}

export function KBSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/knowledge-base/search?q=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();
      setResults(data.results);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    search(debouncedQuery);
  }, [debouncedQuery, search]);

  return (
    <div className="kb-search">
      <div className="search-input-container">
        <input
          type="text"
          placeholder="Search knowledge base..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-input"
        />
        {isLoading && <span className="loading-indicator">...</span>}
      </div>

      {results.length > 0 && (
        <ul className="search-results">
          {results.map((result) => (
            <li key={result.id} className="search-result">
              <a href={result.path}>
                <span className="result-category">{result.category}</span>
                <h4 className="result-title">{result.title}</h4>
                <p className="result-description">{result.description}</p>
              </a>
            </li>
          ))}
        </ul>
      )}

      {query && results.length === 0 && !isLoading && (
        <div className="no-results">
          <p>No results found for "{query}"</p>
          <p>Try different keywords or browse categories</p>
        </div>
      )}
    </div>
  );
}
```

## CLAUDE.md Integration

```markdown
## Knowledge Base

### Article Types
- **How-to Guides** - Step-by-step instructions
- **FAQ** - Frequently asked questions
- **Troubleshooting** - Problem resolution
- **Reference** - Technical specifications

### Article Structure
1. Frontmatter with metadata
2. Overview/summary
3. Prerequisites
4. Step-by-step content
5. Code examples
6. Troubleshooting section
7. Related articles

### Search Configuration
- Fuse.js for client-side search
- Algolia for production scale
- Tags and categories for filtering

### Commands
- `npm run kb:build` - Build search index
- `npm run kb:validate` - Check articles
- `npm run kb:stats` - Coverage statistics
```

## AI Suggestions

1. **Auto-generate FAQ** - Create from support tickets
2. **Article suggestions** - Recommend related content
3. **Search optimization** - Improve result relevance
4. **Content gaps** - Identify missing topics
5. **Readability scoring** - Assess article quality
6. **Translation management** - Multi-language support
7. **Version tracking** - Track article changes
8. **Feedback analysis** - Improve from ratings
9. **Link validation** - Check for broken links
10. **Duplicate detection** - Find redundant content
