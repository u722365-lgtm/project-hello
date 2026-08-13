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

// ─── Supabase-Specific Patterns (Vibe-Coder Specials) ──────────────────────────

const VIBECODER_PATTERNS: SASTPattern[] = [
  { pattern: /SUPABASE_SERVICE_ROLE_KEY|service_role/g, severity: 'critical', title: 'Supabase Service Role Key Exposed', category: 'Secrets', cweId: 'CWE-798', description: 'The Supabase service role key bypasses ALL Row Level Security policies. If exposed in frontend code, anyone can read/modify/delete all data in your database.', remediation: 'Move this key to a server-side environment variable or Supabase Edge Function. Never use it in client-side code.' },
  { pattern: /createClient\s*\([^)]*['"][^'"]*service_role['"]/g, severity: 'critical', title: 'Supabase Client Initialized with Service Role', category: 'Access Control', cweId: 'CWE-250', description: 'Creating a Supabase client with the service role key in browser code gives full admin access to anyone who opens DevTools.', remediation: 'Use the anon key for client-side code. Create a separate server-side Supabase client for admin operations.' },
  { pattern: /\.from\s*\(\s*['"][^'"]+['"]\s*\).*\.select/g, severity: 'info', title: 'Supabase Query Detected', category: 'Access Control', cweId: 'CWE-285', description: 'Supabase query found — verify RLS is enabled on this table.', remediation: 'Run: ALTER TABLE your_table ENABLE ROW LEVEL SECURITY; and create appropriate policies.' },
  { pattern: /NEXT_PUBLIC_SUPABASE_URL|VITE_SUPABASE_URL|EXPO_PUBLIC_SUPABASE_URL/g, severity: 'low', title: 'Supabase URL in Public Env', category: 'Configuration', cweId: 'CWE-200', description: 'Supabase URL is public by design, but verify your RLS policies protect all tables.', remediation: 'Ensure Row Level Security is enabled on every table. Test with anon key that no unauthorized data is accessible.' },
  { pattern: /import\.meta\.env\.(?:VITE|NEXT_PUBLIC|EXPO_PUBLIC).*(?:SECRET|PRIVATE|ADMIN|MASTER)/gi, severity: 'critical', title: 'Secret in Public Env Variable', category: 'Secrets', cweId: 'CWE-798', description: 'Environment variables prefixed with VITE_, NEXT_PUBLIC_, or EXPO_PUBLIC_ are bundled into frontend JavaScript and visible to anyone.', remediation: 'Remove the public prefix or move this secret to a backend API route or Edge Function.' },
];

// ─── All patterns combined ───────────────────────────────────────────────────

const ALL_SAST_PATTERNS = [...SAST_PATTERNS, ...VIBECODER_PATTERNS];

// ─── Scoring Logic ─────────────────────────────────────────────────────────────

function calculateRiskScore(vulns: Vulnerability[]): number {
  if (vulns.length === 0) return 0;
  let score = 0;
  for (const v of vulns) {
    switch (v.severity) {
      case 'critical': score += 25; break;
      case 'high': score += 15; break;
      case 'medium': score += 8; break;
      case 'low': score += 3; break;
      case 'info': score += 1; break;
    }
  }
  return Math.min(100, score);
}

function generateSummary(vulns: Vulnerability[]): string {
  const critical = vulns.filter(v => v.severity === 'critical').length;
  const high = vulns.filter(v => v.severity === 'high').length;
  const secrets = vulns.filter(v => v.isSecret).length;
  const parts: string[] = [];
  if (secrets > 0) parts.push(`${secrets} exposed secret${secrets > 1 ? 's' : ''}`);
  if (critical > 0) parts.push(`${critical} critical vulnerability${critical > 1 ? 'ies' : 'y'}`);
  if (high > 0) parts.push(`${high} high-severity issue${high > 1 ? 's' : ''}`);
  if (parts.length === 0) return 'No significant issues found. Code looks clean.';
  return `Found ${vulns.length} issue${vulns.length > 1 ? 's' : ''}: ${parts.join(', ')}.`;
}

// ─── Core Scan Functions ──────────────────────────────────────────────────────

function findLineNumber(content: string, matchIndex: number): number {
  return (content.substring(0, matchIndex).match(/\n/g) || []).length + 1;
}

function detectSecrets(code: string, filename: string): Vulnerability[] {
  const results: Vulnerability[] = [];
  const lines = code.split('\n');

  for (const secretPattern of SECRET_PATTERNS) {
    // Reset regex state
    const regex = new RegExp(secretPattern.pattern.source, secretPattern.pattern.flags);
    let match: RegExpExecArray | null;

    while ((match = regex.exec(code)) !== null) {
      const lineNum = findLineNumber(code, match.index);
      const envName = secretPattern.name.toUpperCase().replace(/\s+/g, '_');

      results.push({
        id: `secret-${filename}-${secretPattern.name}-${match.index}`,
        severity: secretPattern.severity,
        title: `Exposed ${secretPattern.name}`,
        description: `A ${secretPattern.name} was found hardcoded at line ${lineNum}. This credential is visible in your codebase and could be extracted by anyone with access.`,
        location: `${filename}:${lineNum}`,
        category: 'Secrets',
        cweId: 'CWE-798',
        cvssScore: secretPattern.severity === 'critical' ? 9.1 : secretPattern.severity === 'high' ? 7.5 : 5.0,
        remediation: `Remove the hardcoded secret. Use environment variables or a secrets manager. Rotate this credential immediately — it may already be compromised.`,
        codefix: `// Move to .env file:\n${envName}=your_value_here\n\n// Access via:\nconst ${envName.toLowerCase()} = process.env.${envName};`,
        isSecret: true,
      });
    }
  }

  return results;
}

function detectSASTPatterns(code: string, filename: string): Vulnerability[] {
  const results: Vulnerability[] = [];
  const seen = new Set<string>();

  for (const sast of ALL_SAST_PATTERNS) {
    const regex = new RegExp(sast.pattern.source, sast.pattern.flags);
    let match: RegExpExecArray | null;

    while ((match = regex.exec(code)) !== null) {
      const lineNum = findLineNumber(code, match.index);
      const vulnId = `sast-${filename}-${sast.cweId}-${lineNum}`;

      if (seen.has(vulnId)) continue;
      seen.add(vulnId);

      const truncatedMatch = match[0].length > 60
        ? match[0].substring(0, 60) + '...'
        : match[0];

      results.push({
        id: vulnId,
        severity: sast.severity,
        title: sast.title,
        description: `${sast.description}. Found: "${truncatedMatch}"`,
        location: `${filename}:${lineNum}`,
        category: sast.category,
        cweId: sast.cweId,
        cvssScore: sast.severity === 'critical' ? 9.0 : sast.severity === 'high' ? 7.0 : sast.severity === 'medium' ? 5.0 : sast.severity === 'low' ? 3.0 : 1.0,
        remediation: sast.remediation,
        codefix: generateCodeFix(sast, match[0], lineNum),
      });
    }
  }

  return results;
}

function generateCodeFix(sast: SASTPattern, _match: string, _lineNum: number): string {
  switch (sast.category) {
    case 'Injection':
      if (sast.title.includes('SQL')) return '-- Use parameterized queries:\n-- Instead of: `SELECT * FROM users WHERE id = ${userId}`\n-- Use:      `SELECT * FROM users WHERE id = $1`  [userId]';
      if (sast.title.includes('eval')) return '// Instead of: eval(userInput)\n// Use: JSON.parse(userInput) or a safe expression evaluator';
      return '// Validate and sanitize all user inputs before use';
    case 'XSS':
      return '// Install DOMPurify: npm install dompurify\nimport DOMPurify from "dompurify";\nconst clean = DOMPurify.sanitize(userHTML);';
    case 'Secrets':
      return '// Move to .env file:\nMY_SECRET=your_value_here\n\n// Access via: process.env.MY_SECRET';
    case 'Cryptography':
      return '// Use crypto.getRandomValues() or bcrypt:\nimport { randomBytes, scryptSync } from "crypto";\nconst salt = randomBytes(16);\nconst key = scryptSync(password, salt, 64);';
    case 'Container':
      if (sast.title.includes('Root')) return '# Add to Dockerfile:\nRUN useradd -m appuser\nUSER appuser';
      return '# Pin to specific version:\n# FROM node:18-alpine@sha256:abc123...';
    case 'Access Control':
      return '-- Enable Row Level Security in Supabase:\nALTER TABLE your_table ENABLE ROW LEVEL SECURITY;\n\nCREATE POLICY "Users see own data" ON your_table\n  FOR ALL USING (auth.uid() = user_id);';
    default:
      return sast.remediation;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Scan a single code string (pasted or from file upload).
 * Returns results instantly — zero network calls.
 */
export function scanCode(code: string, filename: string = 'input'): ScanResult {
  const start = performance.now();

  const secrets = detectSecrets(code, filename);
  const sastVulns = detectSASTPatterns(code, filename);

  // Deduplicate by title+location
  const seen = new Set<string>();
  const allVulns = [...secrets, ...sastVulns].filter(v => {
    const key = `${v.title}-${v.location}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort: critical first, then high, medium, low, info
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
  allVulns.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  const scanTimeMs = performance.now() - start;

  return {
    vulnerabilities: allVulns,
    riskScore: calculateRiskScore(allVulns),
    summary: generateSummary(allVulns),
    scanTimeMs,
  };
}

/**
 * Scan multiple files (for drag-and-drop project uploads).
 */
export function scanFiles(files: Array<{ name: string; content: string }>): ScanResult {
  const start = performance.now();
  let allVulns: Vulnerability[] = [];

  for (const file of files) {
    const secrets = detectSecrets(file.content, file.name);
    const sastVulns = detectSASTPatterns(file.content, file.name);
    allVulns.push(...secrets, ...sastVulns);
  }

  // Deduplicate
  const seen = new Set<string>();
  allVulns = allVulns.filter(v => {
    const key = `${v.title}-${v.location}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
  allVulns.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  const scanTimeMs = performance.now() - start;

  return {
    vulnerabilities: allVulns,
    riskScore: calculateRiskScore(allVulns),
    summary: generateSummary(allVulns),
    scanTimeMs,
  };
}
