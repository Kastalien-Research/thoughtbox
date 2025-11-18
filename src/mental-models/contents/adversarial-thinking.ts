export const ADVERSARIAL_THINKING_CONTENT = `# Adversarial Thinking

Adopt an attacker's mindset to identify vulnerabilities and failure modes.

## When to Use
- Building security-sensitive systems
- Designing systems with untrusted input
- Evaluating robustness of a solution
- Before deployment/release

## Process

### Step 1: Define What "Winning" Means for an Attacker
What would an adversary want to achieve?
- Steal data
- Deny service
- Gain unauthorized access
- Corrupt data
- Abuse resources

### Step 2: Enumerate Attack Surfaces
Where can an attacker interact with your system?
- User inputs (forms, APIs, file uploads)
- Authentication/authorization boundaries
- External dependencies
- Network boundaries
- Error messages and logs

### Step 3: For Each Surface, Ask Attacker Questions
- "How can I give unexpected input here?"
- "What if I do this 1 million times?"
- "What if I do these two things simultaneously?"
- "What assumptions can I violate?"
- "What's the worst thing I can do if I compromise this?"

### Step 4: Identify Trust Boundaries
Where does your system transition from trusted to untrusted?
- User input is never trusted
- External API responses are not trusted
- Data from database may be corrupted
- Your own old code may have saved bad data

### Step 5: Design Defenses
For each vulnerability:
- Can we prevent it? (validation, sanitization)
- Can we detect it? (monitoring, alerting)
- Can we limit damage? (principle of least privilege)

## Key Principle
Think like a lazy, clever attacker: find the easiest path to maximum damage.

## Common Attack Patterns to Consider

**Input-based:**
- SQL injection: \`'; DROP TABLE users;--\`
- XSS: \`<script>steal(cookies)</script>\`
- Path traversal: \`../../etc/passwd\`
- Command injection: \`; rm -rf /\`

**Resource-based:**
- Denial of service: flood requests
- Resource exhaustion: huge uploads, memory bombs
- Rate limit bypass: distributed sources

**Logic-based:**
- Race conditions: concurrent operations
- TOCTOU: time-of-check to time-of-use
- Integer overflow: huge numbers wrap around
- Default credentials: admin/admin

**Authentication/Authorization:**
- Credential stuffing: known leaked passwords
- Session fixation: force known session ID
- Privilege escalation: access other users' data
- JWT manipulation: change claims

## Example Application

**System:** API endpoint for user profile updates

**Attack surface analysis:**

| Input | Attack | Defense |
|-------|--------|---------|
| name field | XSS via script tags | Sanitize, encode output |
| email field | SSRF via mailto: | Validate email format |
| avatar URL | SSRF, file inclusion | Allowlist domains, fetch and re-host |
| user_id param | IDOR (other user's profile) | Verify ownership |
| Request body | Huge payload DoS | Size limits |
| Request rate | Brute force | Rate limiting |

**Trust boundary violations:**
- User-supplied data goes to database → sanitize
- Database data rendered in HTML → encode
- User claims ownership of resource → verify server-side

## Adversarial Questions Checklist
- [ ] What if this input is 1GB?
- [ ] What if this input is empty/null?
- [ ] What if this number is negative? Max int?
- [ ] What if this request happens 1000x/second?
- [ ] What if two users do this simultaneously?
- [ ] What if the attacker knows our implementation?
- [ ] What if a previous version saved bad data?

## Anti-patterns
- Only considering external attackers (insiders exist)
- Assuming inputs are well-formed
- Security by obscurity
- Trusting client-side validation
- Testing only happy paths
`;
