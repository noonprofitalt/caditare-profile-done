# Security Best Practices

## Overview
This document outlines security best practices implemented in the Internal Team Communication Module and guidelines for maintaining security.

---

## Input Validation & Sanitization

### Message Input
- **Max Length**: 10,000 characters
- **Sanitization**: Remove null bytes, trim whitespace
- **XSS Prevention**: HTML sanitized with DOMPurify
- **Implementation**: `sanitizeMessage()` in `utils/sanitization.ts`

### File Uploads
- **Max Size**: 10MB per file
- **Allowed Types**: Images, PDFs, documents
- **File Name Sanitization**: Remove path separators, special characters
- **Path Traversal Prevention**: `sanitizeFileName()` function
- **Malware Scanning**: Recommended for production

### URLs
- **Dangerous Protocols Blocked**: `javascript:`, `data:`, `vbscript:`, `file:`
- **Allowed Protocols**: `http:`, `https:`, `mailto:`, relative paths
- **Implementation**: `sanitizeUrl()` function

---

## Rate Limiting

### Endpoint Limits
| Endpoint | Limit | Window |
|----------|-------|--------|
| General API | 100 requests | 15 minutes |
| Authentication | 5 requests | 15 minutes |
| Messages | 60 messages | 1 minute |
| File Uploads | 10 uploads | 1 hour |
| Channel Creation | 10 channels | 1 hour |
| Search | 30 searches | 1 minute |

### Implementation
- Uses `express-rate-limit` middleware
- Rate limits by user ID (when authenticated) or IP address
- Returns `429 Too Many Requests` when exceeded

---

## Authentication & Authorization

### JWT Tokens
- **Storage**: HTTP-only cookies (recommended)
- **Expiration**: Configurable (default: 24 hours)
- **Refresh Tokens**: Implement for long-lived sessions

### Authorization Checks
- **Channel Access**: Verify user membership before allowing access
- **Message Editing**: Only message sender can edit
- **Message Deletion**: Only sender or admin can delete
- **File Access**: Verify user has access to parent message/channel

---

## SQL Injection Prevention

### Parameterized Queries
✅ **Always use parameterized queries**
```typescript
// GOOD
await query('SELECT * FROM users WHERE id = $1', [userId]);

// BAD - Never do this
await query(`SELECT * FROM users WHERE id = '${userId}'`);
```

### Search Query Sanitization
- Remove SQL special characters: `%`, `;`, `'`, `"`, `\`, `/`
- Limit query length to 200 characters
- Use `sanitizeSearchQuery()` function

---

## XSS Prevention

### HTML Sanitization
- **Library**: DOMPurify
- **Allowed Tags**: `b`, `i`, `em`, `strong`, `a`, `br`, `p`
- **Allowed Attributes**: `href`, `target`, `rel`
- **Data Attributes**: Blocked

### Content Security Policy (CSP)
Recommended CSP headers for production:
```
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' wss:;
```

---

## CSRF Protection

### Recommended Implementation
1. **SameSite Cookies**: Set `SameSite=Strict` or `SameSite=Lax`
2. **CSRF Tokens**: Use `csurf` middleware
3. **Double Submit Cookies**: Alternative to CSRF tokens

### Example
```typescript
import csrf from 'csurf';

const csrfProtection = csrf({ cookie: true });
app.use(csrfProtection);
```

---

## File Upload Security

### Validation
- ✅ Check file size before upload
- ✅ Validate MIME type
- ✅ Sanitize file names
- ✅ Generate unique file names (UUID)
- ✅ Store files outside web root

### Storage
- **Local Storage**: Use dedicated upload directory
- **Cloud Storage**: S3, Azure Blob, Google Cloud Storage
- **Access Control**: Require authentication for downloads

### Malware Scanning
Recommended for production:
- ClamAV (open source)
- VirusTotal API
- Cloud provider scanning (AWS S3, Azure)

---

## WebSocket Security

### Authentication
- Verify JWT token on connection
- Disconnect unauthorized sockets
- Re-verify periodically for long-lived connections

### Message Validation
- Validate all incoming socket messages
- Rate limit socket events
- Sanitize message content

### Room Authorization
- Verify user has access to channel before joining room
- Disconnect from rooms when permissions change

---

## Password Security

### Hashing
- **Algorithm**: bcrypt (recommended) or Argon2
- **Salt Rounds**: 10-12 for bcrypt
- **Never** store plain text passwords

### Password Requirements
- Minimum 8 characters
- Require mix of uppercase, lowercase, numbers
- Optional: Special characters
- Check against common password lists

---

## Security Headers

### Helmet.js Configuration
```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));
```

### Important Headers
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000`

---

## Logging & Monitoring

### Security Events to Log
- Failed login attempts
- Rate limit violations
- File upload attempts
- Permission denied errors
- Unusual activity patterns

### Sensitive Data
- ❌ Never log passwords
- ❌ Never log full credit card numbers
- ❌ Never log session tokens
- ✅ Log user IDs, timestamps, IP addresses
- ✅ Log error messages (sanitized)

---

## Environment Variables

### Sensitive Configuration
Store in `.env` file (never commit to git):
```
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
SESSION_SECRET=your-session-secret
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

### Production
- Use environment-specific configs
- Rotate secrets regularly
- Use secret management services (AWS Secrets Manager, Azure Key Vault)

---

## Regular Security Audits

### Automated Tools
```bash
# NPM audit
npm audit

# Dependency scanning
npm run test:security

# OWASP Dependency Check
dependency-check --scan ./
```

### Manual Reviews
- Code reviews for security issues
- Penetration testing
- Security-focused QA testing
- Third-party security audits

---

## Incident Response

### Security Incident Checklist
1. **Identify**: Detect and confirm the incident
2. **Contain**: Isolate affected systems
3. **Eradicate**: Remove the threat
4. **Recover**: Restore normal operations
5. **Learn**: Document and improve

### Contact Information
- Security team email: security@company.com
- Incident hotline: [phone number]
- On-call rotation: [link to schedule]

---

## Compliance

### Data Protection
- **GDPR**: Right to erasure, data portability
- **CCPA**: California Consumer Privacy Act
- **HIPAA**: If handling health information

### Data Retention
- Messages: Configurable retention period
- Files: Automatic cleanup after retention period
- Audit logs: Retain for compliance requirements

---

## Security Checklist for Deployment

- [ ] All dependencies updated to latest secure versions
- [ ] Environment variables configured
- [ ] HTTPS/TLS enabled
- [ ] Security headers configured (Helmet.js)
- [ ] Rate limiting active
- [ ] CSRF protection enabled
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention verified
- [ ] XSS prevention tested
- [ ] File upload restrictions enforced
- [ ] Authentication working correctly
- [ ] Authorization checks in place
- [ ] Logging and monitoring configured
- [ ] Backup and disaster recovery plan
- [ ] Security audit completed

---

## Resources

### Documentation
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheets](https://cheatsheetseries.owasp.org/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

### Tools
- [npm audit](https://docs.npmjs.com/cli/v8/commands/npm-audit)
- [Snyk](https://snyk.io/)
- [OWASP ZAP](https://www.zaproxy.org/)
- [Burp Suite](https://portswigger.net/burp)

---

**Last Updated**: 2026-02-16  
**Review Frequency**: Quarterly
