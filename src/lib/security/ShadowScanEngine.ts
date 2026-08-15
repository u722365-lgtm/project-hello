/**
 * ShadowScanEngine — 100% Client-Side Security Scanner
 * Extracted from ShadowTalk AI's AdvancedSecurityAuditPanel (HSCA v2.0)
 *
 * 23 secret detection patterns + 30+ SAST patterns
 * Zero API calls. Zero dependencies. Pure regex + logic.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ScanResult {
  vulnerabilities: Vulnerability[];
  riskScore: number;
  summary: string;
  scanTimeMs: number;
}

export interface Vulnerability {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  location: string;
  category: string;
  cweId: string;
  cvssScore: number;
  remediation: string;
  codefix: string;
  isSecret?: boolean;
  isDependency?: boolean;
}

interface SecretPattern {
  name: string;
  pattern: RegExp;
  severity: 'critical' | 'high' | 'medium';
}

interface SASTPattern {
  pattern: RegExp;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  category: string;
  cweId: string;
  description: string;
  remediation: string;
}

// ─── 23 Secret Detection Patterns ─────────────────────────────────────────────

const SECRET_PATTERNS: SecretPattern[] = [
  { name: 'AWS Access Key', pattern: /AKIA[0-9A-Z]{16}/g, severity: 'critical' },
  { name: 'AWS Secret Key', pattern: /[A-Za-z0-9/+=]{40}/g, severity: 'critical' },
  { name: 'GitHub Token', pattern: /ghp_[A-Za-z0-9]{36}/g, severity: 'critical' },
  { name: 'GitHub OAuth', pattern: /gho_[A-Za-z0-9]{36}/g, severity: 'high' },
  { name: 'Private Key', pattern: /-----BEGIN (RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g, severity: 'critical' },
  { name: 'Stripe Secret Key', pattern: /sk_live_[A-Za-z0-9]{24,}/g, severity: 'critical' },
  { name: 'Stripe Publishable', pattern: /pk_live_[A-Za-z0-9]{24,}/g, severity: 'medium' },
  { name: 'Google API Key', pattern: /AIza[0-9A-Za-z-_]{35}/g, severity: 'high' },
  { name: 'Slack Token', pattern: /xox[baprs]-[0-9A-Za-z]{10,}/g, severity: 'high' },
  { name: 'Discord Token', pattern: /[MN][A-Za-z\d]{23,}\.[\w-]{6}\.[\w-]{27}/g, severity: 'critical' },
  { name: 'JWT Token', pattern: /eyJ[A-Za-z0-9-_]+\.eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_.+/=]*/g, severity: 'high' },
  { name: 'Generic API Key', pattern: /api[_-]?key['\"]?\s*[:=]\s*['\"][A-Za-z0-9-_]{16,}['\"]/gi, severity: 'high' },
  { name: 'Generic Secret', pattern: /secret['\"]?\s*[:=]\s*['\"][A-Za-z0-9-_]{16,}['\"]/gi, severity: 'high' },
  { name: 'Password in Code', pattern: /password['\"]?\s*[:=]\s*['\"][^'"]{8,}['\"]/gi, severity: 'critical' },
  { name: 'Database URL', pattern: /(postgres|mysql|mongodb|redis):\/\/[^\s'"]+/gi, severity: 'critical' },
  { name: 'Bearer Token', pattern: /Bearer\s+[A-Za-z0-9-_.]+/g, severity: 'high' },
  { name: 'Firebase Config', pattern: /apiKey:\s*['\"][A-Za-z0-9-_]+['\"]/g, severity: 'high' },
  { name: 'OpenAI Key', pattern: /sk-[A-Za-z0-9]{48}/g, severity: 'critical' },
  { name: 'Anthropic Key', pattern: /sk-ant-[A-Za-z0-9-_]{40,}/g, severity: 'critical' },
  { name: 'Twilio Token', pattern: /SK[a-f0-9]{32}/g, severity: 'high' },
  { name: 'SendGrid Key', pattern: /SG\.[A-Za-z0-9-_]{22}\.[A-Za-z0-9-_]{43}/g, severity: 'critical' },
  { name: 'Mailchimp Key', pattern: /[a-f0-9]{32}-us\d{1,2}/g, severity: 'high' },
  { name: 'Heroku Key', pattern: /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/g, severity: 'medium' },
];

// ─── 30+ SAST Patterns ───────────────────────────────────────────────────────

const SAST_PATTERNS: SASTPattern[] = [
  // Injection
  { pattern: /eval\s*\(/g, severity: 'critical', title: 'eval() Code Injection', category: 'Injection', cweId: 'CWE-94', description: 'Use of eval() can execute arbitrary code', remediation: 'Replace eval() with safer alternatives like JSON.parse() or Function constructors with validated input' },
  { pattern: /new\s+Function\s*\(/g, severity: 'high', title: 'Dynamic Function Creation', category: 'Injection', cweId: 'CWE-94', description: 'Dynamic function creation from strings', remediation: 'Avoid creating functions from strings. Use predefined functions instead.' },
  { pattern: /child_process|exec\s*\(|execSync|spawn\s*\(/g, severity: 'critical', title: 'Command Injection Risk', category: 'Injection', cweId: 'CWE-78', description: 'Shell command execution detected', remediation: 'Use parameterized commands. Validate and sanitize all inputs before shell execution.' },
  { pattern: /\$\{.*\}.*(?:SELECT|INSERT|UPDATE|DELETE|FROM|WHERE)/gi, severity: 'critical', title: 'SQL Injection', category: 'SQL Injection', cweId: 'CWE-89', description: 'String interpolation in SQL query', remediation: 'Use parameterized queries or prepared statements.' },

  // XSS
  { pattern: /dangerouslySetInnerHTML/g, severity: 'high', title: 'XSS via dangerouslySetInnerHTML', category: 'XSS', cweId: 'CWE-79', description: 'Renders raw HTML without sanitization', remediation: 'Use DOMPurify to sanitize HTML before rendering.' },
  { pattern: /\.innerHTML\s*=/g, severity: 'high', title: 'XSS via innerHTML', category: 'XSS', cweId: 'CWE-79', description: 'Direct innerHTML assignment', remediation: 'Use textContent or a sanitization library.' },
  { pattern: /document\.write\s*\(/g, severity: 'high', title: 'XSS via document.write', category: 'XSS', cweId: 'CWE-79', description: 'document.write can inject arbitrary HTML', remediation: 'Use DOM manipulation methods instead.' },

  // SSRF
  { pattern: /fetch\s*\(\s*(?:req\.|request\.|params\.|query\.|body\.)/g, severity: 'high', title: 'Potential SSRF', category: 'SSRF', cweId: 'CWE-918', description: 'User-controlled URL in fetch request', remediation: 'Validate URLs against an allowlist. Block internal/private IP ranges.' },
  { pattern: /axios\s*\.\s*(?:get|post|put)\s*\(\s*(?:req\.|request\.|params\.|query\.)/g, severity: 'high', title: 'SSRF via Axios', category: 'SSRF', cweId: 'CWE-918', description: 'User-controlled URL in Axios request', remediation: 'Validate and sanitize URLs. Use URL allowlists.' },
  { pattern: /http\.request\s*\(\s*(?:req\.|options)/g, severity: 'high', title: 'SSRF via http.request', category: 'SSRF', cweId: 'CWE-918', description: 'User input flows into HTTP request', remediation: 'Validate target URLs and block internal addresses.' },

  // CSRF
  { pattern: /SameSite\s*[:=]\s*['"]?None['"]?/gi, severity: 'medium', title: 'CSRF - SameSite None Cookie', category: 'CSRF', cweId: 'CWE-352', description: 'Cookie with SameSite=None allows cross-origin requests', remediation: 'Set SameSite=Strict or Lax unless cross-origin is required.' },

  // Deserialization
  { pattern: /JSON\.parse\s*\(\s*(?:req\.|request\.|body|params|query)/g, severity: 'medium', title: 'Insecure Deserialization', category: 'Deserialization', cweId: 'CWE-502', description: 'Parsing user-controlled JSON without validation', remediation: 'Validate JSON structure with a schema validator like Zod before processing.' },
  { pattern: /pickle\.loads|yaml\.load\s*\(/g, severity: 'critical', title: 'Unsafe Deserialization', category: 'Deserialization', cweId: 'CWE-502', description: 'Unsafe deserialization can lead to RCE', remediation: 'Use safe loaders (yaml.safe_load) and avoid pickle with untrusted data.' },
  { pattern: /unserialize|__wakeup|__destruct/g, severity: 'critical', title: 'PHP Object Injection', category: 'Deserialization', cweId: 'CWE-502', description: 'PHP deserialization vulnerability', remediation: 'Avoid unserialize() with user input. Use JSON instead.' },

  // IDOR / Access Control
  { pattern: /params\.id|req\.params\.id|query\.id/g, severity: 'medium', title: 'Potential IDOR', category: 'IDOR', cweId: 'CWE-639', description: 'Direct object reference via user-controlled ID', remediation: 'Verify object ownership before returning data. Check auth.uid() matches resource owner.' },

  // Path Traversal
  { pattern: /\.\.\/|\.\.\\|path\.join\([^)]*req\./g, severity: 'high', title: 'Path Traversal', category: 'Path Traversal', cweId: 'CWE-22', description: 'User input in file path operations', remediation: 'Use path.basename() and validate against allowed directories.' },

  // Cryptography
  { pattern: /MD5|SHA1(?!\d)|createHash\s*\(\s*['"]md5|['"]sha1/gi, severity: 'medium', title: 'Weak Cryptographic Hash', category: 'Cryptography', cweId: 'CWE-328', description: 'Using deprecated hash algorithm', remediation: 'Use SHA-256 or bcrypt for passwords.' },
  { pattern: /Math\.random\s*\(/g, severity: 'medium', title: 'Insecure Random', category: 'Cryptography', cweId: 'CWE-330', description: 'Math.random() is not cryptographically secure', remediation: 'Use crypto.getRandomValues() for security-sensitive operations.' },
  { pattern: /ECB|DES(?!C)|RC4/gi, severity: 'high', title: 'Weak Cipher', category: 'Cryptography', cweId: 'CWE-327', description: 'Using weak or deprecated cipher', remediation: 'Use AES-256-GCM or ChaCha20-Poly1305.' },

  // Auth
  { pattern: /verify_jwt\s*=\s*false/g, severity: 'high', title: 'JWT Verification Disabled', category: 'Authentication', cweId: 'CWE-287', description: 'JWT verification is disabled', remediation: 'Enable JWT verification or validate tokens in code.' },
  { pattern: /algorithm\s*[:=]\s*['"]none['"]|alg.*none/gi, severity: 'critical', title: 'JWT None Algorithm', category: 'Authentication', cweId: 'CWE-347', description: 'JWT accepts "none" algorithm', remediation: 'Explicitly set allowed algorithms. Reject "none".' },

  // Prototype Pollution
  { pattern: /Object\.assign\s*\([^,]+,\s*(?:req\.body|req\.query|req\.params)/g, severity: 'high', title: 'Prototype Pollution', category: 'Prototype Pollution', cweId: 'CWE-1321', description: 'Merging user input into objects', remediation: 'Validate object keys. Use Object.create(null) for dictionaries.' },
  { pattern: /\[['"]__proto__['"]\]|\.__proto__/g, severity: 'critical', title: 'Direct __proto__ Access', category: 'Prototype Pollution', cweId: 'CWE-1321', description: 'Direct prototype chain manipulation', remediation: 'Block __proto__, constructor, and prototype keys in user input.' },

  // Open Redirect
  { pattern: /redirect\s*\(\s*(?:req\.|request\.|query\.|params\.)/g, severity: 'medium', title: 'Open Redirect', category: 'Open Redirect', cweId: 'CWE-601', description: 'User-controlled redirect destination', remediation: 'Validate redirect URLs against an allowlist of trusted domains.' },
  { pattern: /window\.location\s*=\s*(?!['"])/g, severity: 'medium', title: 'Client-Side Open Redirect', category: 'Open Redirect', cweId: 'CWE-601', description: 'Dynamic window.location assignment', remediation: 'Validate URLs before redirecting.' },

  // Container/Docker
  { pattern: /FROM\s+.*:latest/g, severity: 'medium', title: 'Unpinned Docker Image', category: 'Container', cweId: 'CWE-1104', description: 'Using :latest tag in Dockerfile', remediation: 'Pin Docker images to specific version digests.' },
  { pattern: /USER\s+root|--privileged/g, severity: 'high', title: 'Container Running as Root', category: 'Container', cweId: 'CWE-250', description: 'Container runs with root privileges', remediation: 'Use a non-root user in Dockerfile.' },

  // Security Headers
  { pattern: /Access-Control-Allow-Origin.*\*/g, severity: 'medium', title: 'Permissive CORS', category: 'Configuration', cweId: 'CWE-942', description: 'CORS allows all origins', remediation: 'Restrict CORS to specific trusted domains.' },

  // Logging
  { pattern: /console\.log\s*\(.*(?:password|secret|token|key|auth)/gi, severity: 'medium', title: 'Sensitive Data in Logs', category: 'Data Exposure', cweId: 'CWE-532', description: 'Logging potentially sensitive information', remediation: 'Remove sensitive data from log statements.' },

  // Race Conditions
  { pattern: /async.*\bdelete\b.*\binsert\b|check.*then.*update/gi, severity: 'medium', title: 'Potential Race Condition', category: 'Race Condition', cweId: 'CWE-367', description: 'Non-atomic check-then-act pattern', remediation: 'Use database transactions or atomic operations.' },
];

