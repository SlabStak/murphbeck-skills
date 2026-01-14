# Security Testing Templates

Production-ready security testing patterns for vulnerability scanning, penetration testing, and OWASP compliance.

## Overview

- **SAST**: Static Application Security Testing
- **DAST**: Dynamic Application Security Testing
- **Dependency Scanning**: Vulnerability detection in dependencies
- **Penetration Testing**: Automated security assessments

## Quick Start

```bash
# Node.js security scanning
npm install -D snyk @snyk/protect
npm audit

# Python security scanning
pip install bandit safety pip-audit

# OWASP ZAP
docker pull owasp/zap2docker-stable

# Trivy container scanning
brew install trivy
```

## OWASP Top 10 Testing

```typescript
// tests/security/owasp-tests.ts
import request from 'supertest';
import { app } from '../../src/app';

describe('OWASP Top 10 Security Tests', () => {
  describe('A01: Broken Access Control', () => {
    it('prevents unauthorized access to admin endpoints', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(403);
    });

    it('prevents IDOR attacks', async () => {
      // User A trying to access User B's data
      const response = await request(app)
        .get('/api/users/user-b-id/private-data')
        .set('Authorization', 'Bearer user-a-token');

      expect(response.status).toBe(403);
    });

    it('enforces rate limiting', async () => {
      const requests = Array(100).fill(null).map(() =>
        request(app).get('/api/users')
      );

      const responses = await Promise.all(requests);
      const rateLimited = responses.filter(r => r.status === 429);

      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });

  describe('A02: Cryptographic Failures', () => {
    it('uses HTTPS for sensitive endpoints', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .set('X-Forwarded-Proto', 'http');

      // Should redirect to HTTPS or reject
      expect([301, 302, 403]).toContain(response.status);
    });

    it('sets secure cookie flags', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password' });

      const cookies = response.headers['set-cookie'];
      if (cookies) {
        cookies.forEach((cookie: string) => {
          if (cookie.includes('session')) {
            expect(cookie.toLowerCase()).toContain('secure');
            expect(cookie.toLowerCase()).toContain('httponly');
            expect(cookie.toLowerCase()).toContain('samesite');
          }
        });
      }
    });

    it('does not expose sensitive data in responses', async () => {
      const response = await request(app)
        .get('/api/users/user-123')
        .set('Authorization', 'Bearer admin-token');

      expect(response.body).not.toHaveProperty('password');
      expect(response.body).not.toHaveProperty('passwordHash');
      expect(response.body).not.toHaveProperty('ssn');
      expect(response.body).not.toHaveProperty('creditCard');
    });
  });

  describe('A03: Injection', () => {
    it('prevents SQL injection', async () => {
      const maliciousInputs = [
        "'; DROP TABLE users; --",
        "1 OR 1=1",
        "1; SELECT * FROM users",
        "admin'--",
      ];

      for (const input of maliciousInputs) {
        const response = await request(app)
          .get(`/api/users?search=${encodeURIComponent(input)}`);

        // Should either sanitize or reject
        expect(response.status).not.toBe(500);
        expect(response.text).not.toContain('syntax error');
        expect(response.text).not.toContain('SQL');
      }
    });

    it('prevents NoSQL injection', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: { $gt: '' },
          password: { $gt: '' },
        });

      expect(response.status).toBe(400);
    });

    it('prevents command injection', async () => {
      const maliciousInputs = [
        '; ls -la',
        '| cat /etc/passwd',
        '`whoami`',
        '$(cat /etc/passwd)',
      ];

      for (const input of maliciousInputs) {
        const response = await request(app)
          .post('/api/files/convert')
          .send({ filename: input });

        expect(response.status).toBe(400);
      }
    });
  });

  describe('A04: Insecure Design', () => {
    it('implements password strength requirements', async () => {
      const weakPasswords = ['123456', 'password', 'qwerty', 'abc'];

      for (const password of weakPasswords) {
        const response = await request(app)
          .post('/api/users')
          .send({
            email: 'test@example.com',
            name: 'Test User',
            password,
          });

        expect(response.status).toBe(400);
        expect(response.body.errors).toContainEqual(
          expect.objectContaining({ field: 'password' })
        );
      }
    });

    it('implements account lockout after failed attempts', async () => {
      // Attempt 10 failed logins
      for (let i = 0; i < 10; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({ email: 'test@example.com', password: 'wrong' });
      }

      // Next attempt should be blocked
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'correct' });

      expect(response.status).toBe(429);
    });
  });

  describe('A05: Security Misconfiguration', () => {
    it('does not expose stack traces', async () => {
      const response = await request(app)
        .get('/api/cause-error');

      expect(response.body).not.toHaveProperty('stack');
      expect(response.text).not.toContain('at Object.');
      expect(response.text).not.toContain('.js:');
    });

    it('sets security headers', async () => {
      const response = await request(app).get('/');

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBeDefined();
      expect(response.headers['x-xss-protection']).toBeDefined();
      expect(response.headers['strict-transport-security']).toBeDefined();
      expect(response.headers['content-security-policy']).toBeDefined();
    });

    it('disables server version headers', async () => {
      const response = await request(app).get('/');

      expect(response.headers['x-powered-by']).toBeUndefined();
      expect(response.headers['server']).not.toContain('Express');
    });
  });

  describe('A06: Vulnerable Components', () => {
    it('dependencies have no known vulnerabilities', async () => {
      // This test runs npm audit programmatically
      const { execSync } = require('child_process');

      try {
        execSync('npm audit --audit-level=high', {
          encoding: 'utf8',
          stdio: 'pipe',
        });
      } catch (error: any) {
        fail(`High severity vulnerabilities found: ${error.stdout}`);
      }
    });
  });

  describe('A07: Authentication Failures', () => {
    it('uses secure session tokens', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'SecureP@ss123' });

      const token = response.body.token;

      // Token should be sufficiently long and random
      expect(token.length).toBeGreaterThanOrEqual(32);
      expect(/^[a-zA-Z0-9._-]+$/.test(token)).toBe(true);
    });

    it('invalidates tokens on logout', async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'SecureP@ss123' });

      const token = loginResponse.body.token;

      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(401);
    });
  });

  describe('A08: Software and Data Integrity', () => {
    it('validates JWT signatures', async () => {
      const tamperedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiJ9.tampered';

      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${tamperedToken}`);

      expect(response.status).toBe(401);
    });

    it('validates webhook signatures', async () => {
      const response = await request(app)
        .post('/api/webhooks/stripe')
        .set('Stripe-Signature', 'invalid-signature')
        .send({ type: 'payment_intent.succeeded' });

      expect(response.status).toBe(400);
    });
  });

  describe('A09: Security Logging and Monitoring', () => {
    it('logs authentication failures', async () => {
      // This would check logs in practice
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'wrong' });

      expect(response.status).toBe(401);
      // In real test, verify log entry exists
    });
  });

  describe('A10: SSRF', () => {
    it('prevents SSRF attacks', async () => {
      const maliciousUrls = [
        'http://localhost/admin',
        'http://127.0.0.1/internal',
        'http://169.254.169.254/latest/meta-data/',
        'http://[::1]/admin',
        'file:///etc/passwd',
      ];

      for (const url of maliciousUrls) {
        const response = await request(app)
          .post('/api/fetch-url')
          .send({ url });

        expect([400, 403]).toContain(response.status);
      }
    });
  });
});
```

## Python Bandit Security Scanning

```python
# tests/security/test_bandit_compliance.py
"""Security tests using Bandit."""
import subprocess
import json
import pytest
from pathlib import Path


class TestBanditSecurity:
    """Bandit security scan tests."""

    @pytest.fixture
    def bandit_results(self):
        """Run Bandit and return results."""
        result = subprocess.run(
            [
                "bandit",
                "-r", "app/",
                "-f", "json",
                "-ll",  # Only medium and high severity
            ],
            capture_output=True,
            text=True,
        )
        return json.loads(result.stdout) if result.stdout else {"results": []}

    def test_no_high_severity_issues(self, bandit_results):
        """Test for no high severity issues."""
        high_severity = [
            r for r in bandit_results["results"]
            if r["issue_severity"] == "HIGH"
        ]
        assert len(high_severity) == 0, (
            f"Found {len(high_severity)} high severity issues: "
            f"{[r['issue_text'] for r in high_severity]}"
        )

    def test_no_hardcoded_passwords(self, bandit_results):
        """Test for no hardcoded passwords."""
        password_issues = [
            r for r in bandit_results["results"]
            if "password" in r["test_id"].lower()
            or "hardcoded" in r["issue_text"].lower()
        ]
        assert len(password_issues) == 0

    def test_no_sql_injection_risks(self, bandit_results):
        """Test for SQL injection risks."""
        sql_issues = [
            r for r in bandit_results["results"]
            if "sql" in r["test_id"].lower()
        ]
        assert len(sql_issues) == 0

    def test_no_command_injection_risks(self, bandit_results):
        """Test for command injection risks."""
        cmd_issues = [
            r for r in bandit_results["results"]
            if any(
                test in r["test_id"]
                for test in ["B602", "B603", "B604", "B605", "B606", "B607"]
            )
        ]
        assert len(cmd_issues) == 0


class TestSecurityHeaders:
    """Test security headers."""

    @pytest.mark.asyncio
    async def test_security_headers(self, client):
        """Test that security headers are present."""
        response = await client.get("/")

        headers = response.headers
        assert "X-Content-Type-Options" in headers
        assert "X-Frame-Options" in headers
        assert "Content-Security-Policy" in headers
        assert "Strict-Transport-Security" in headers

    @pytest.mark.asyncio
    async def test_no_server_header(self, client):
        """Test that server header is not exposed."""
        response = await client.get("/")

        server = response.headers.get("Server", "")
        assert "Python" not in server
        assert "uvicorn" not in server.lower()


class TestInputValidation:
    """Test input validation security."""

    @pytest.mark.asyncio
    async def test_xss_prevention(self, client, auth_headers):
        """Test XSS prevention."""
        xss_payloads = [
            "<script>alert('xss')</script>",
            "javascript:alert('xss')",
            "<img src=x onerror=alert('xss')>",
            "<svg onload=alert('xss')>",
        ]

        for payload in xss_payloads:
            response = await client.post(
                "/api/comments",
                headers=auth_headers,
                json={"content": payload},
            )

            # Should sanitize or reject
            if response.status_code == 201:
                data = response.json()
                assert "<script>" not in data.get("content", "")
                assert "javascript:" not in data.get("content", "")
                assert "onerror=" not in data.get("content", "")

    @pytest.mark.asyncio
    async def test_path_traversal_prevention(self, client, auth_headers):
        """Test path traversal prevention."""
        payloads = [
            "../../../etc/passwd",
            "..\\..\\..\\windows\\system32\\config\\sam",
            "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd",
        ]

        for payload in payloads:
            response = await client.get(
                f"/api/files/{payload}",
                headers=auth_headers,
            )

            assert response.status_code in [400, 403, 404]
```

## OWASP ZAP Integration

```typescript
// tests/security/zap-scan.ts
import ZAPClient from 'zaproxy';

const zapOptions = {
  apiKey: process.env.ZAP_API_KEY || 'api-key',
  proxy: {
    host: 'localhost',
    port: 8080,
  },
};

const zap = new ZAPClient(zapOptions);
const targetUrl = process.env.TARGET_URL || 'http://localhost:3000';

async function runSecurityScan(): Promise<void> {
  console.log('Starting OWASP ZAP security scan...');

  // Spider the application
  console.log('Spidering target...');
  const spiderScanId = await zap.spider.scan(targetUrl);
  await waitForSpider(spiderScanId);

  // Active scan
  console.log('Running active scan...');
  const activeScanId = await zap.ascan.scan(targetUrl);
  await waitForActiveScan(activeScanId);

  // Get alerts
  const alerts = await zap.core.alerts({ baseurl: targetUrl });

  // Categorize by risk
  const high = alerts.filter((a: any) => a.risk === 'High');
  const medium = alerts.filter((a: any) => a.risk === 'Medium');
  const low = alerts.filter((a: any) => a.risk === 'Low');

  console.log(`\nScan Results:`);
  console.log(`High: ${high.length}, Medium: ${medium.length}, Low: ${low.length}`);

  // Fail on high severity
  if (high.length > 0) {
    console.error('\nHigh severity vulnerabilities found:');
    high.forEach((alert: any) => {
      console.error(`- ${alert.name}: ${alert.url}`);
      console.error(`  ${alert.description}`);
    });
    process.exit(1);
  }

  // Generate report
  const htmlReport = await zap.core.htmlreport();
  require('fs').writeFileSync('./reports/zap-report.html', htmlReport);
  console.log('\nReport saved to ./reports/zap-report.html');
}

async function waitForSpider(scanId: string): Promise<void> {
  let status = '0';
  while (status !== '100') {
    await sleep(1000);
    status = await zap.spider.status(scanId);
  }
}

async function waitForActiveScan(scanId: string): Promise<void> {
  let status = '0';
  while (status !== '100') {
    await sleep(5000);
    status = await zap.ascan.status(scanId);
    console.log(`Active scan progress: ${status}%`);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

runSecurityScan().catch(console.error);
```

## Trivy Container Scanning

```yaml
# .github/workflows/security.yml
name: Security Scanning

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  dependency-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run npm audit
        run: npm audit --audit-level=high

      - name: Run Snyk
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

  sast-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Semgrep
        uses: returntocorp/semgrep-action@v1
        with:
          config: >-
            p/security-audit
            p/owasp-top-ten

  container-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build image
        run: docker build -t myapp:${{ github.sha }} .

      - name: Run Trivy
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'myapp:${{ github.sha }}'
          format: 'table'
          exit-code: '1'
          ignore-unfixed: true
          severity: 'CRITICAL,HIGH'

  dast-scan:
    runs-on: ubuntu-latest
    services:
      app:
        image: myapp:latest
        ports:
          - 3000:3000
    steps:
      - name: Run ZAP Baseline Scan
        uses: zaproxy/action-baseline@v0.9.0
        with:
          target: 'http://localhost:3000'
          fail_action: true
```

## CLAUDE.md Integration

```markdown
# Security Testing

## Commands
- `npm audit` - Scan dependencies
- `bandit -r app/` - Python SAST
- `trivy image myapp:latest` - Container scan
- `zap-cli quick-scan http://localhost:3000` - DAST scan

## OWASP Top 10
1. Broken Access Control
2. Cryptographic Failures
3. Injection
4. Insecure Design
5. Security Misconfiguration
6. Vulnerable Components
7. Authentication Failures
8. Data Integrity
9. Security Logging
10. SSRF

## Security Checklist
- [ ] Input validation
- [ ] Output encoding
- [ ] Authentication
- [ ] Authorization
- [ ] Session management
- [ ] Cryptography
- [ ] Error handling
- [ ] Logging
```

## AI Suggestions

1. **Fuzzing integration** - Integrate AFL/libFuzzer
2. **Secret scanning** - Detect leaked credentials
3. **SBOM generation** - Software bill of materials
4. **License compliance** - Check dependency licenses
5. **Security dashboards** - Centralized vulnerability tracking
6. **Remediation guidance** - Auto-suggest fixes
7. **Security baselines** - Compare against security baselines
8. **Compliance mapping** - Map to compliance frameworks
9. **Threat modeling** - Automated threat analysis
10. **Security regression** - Prevent fixed issues from returning
