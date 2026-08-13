# ShadowTalk AI — Fix Documentation

**Repo:** https://github.com/zain836/shadowtalk-ai-903ca615.git
**Local clone:** C:\Users\Hacker\AppData\Local\hermes\shadowtalk-ai
**Documentation generated:** 2026-08-10

This document provides actionable fixes for every issue identified in `shadowtalk-project-issues.md`. Fixes are ordered by priority. Where possible, code snippets are included.

---

## 1. CRITICAL — Code Execution / Injection Risks

### 1.1 Replace unsafe `eval()` / `new Function()` with sandboxed execution

**Affected files:**
- `src/components/chat/CodeCanvas.tsx`
- `src/components/chat/CodePlayground.tsx`
- `src/components/chat/CodeWorkspace.tsx`
- `src/components/chat/LiveCodeArtifact.tsx`
- `src/components/chat/PersonalIDE.tsx`
- `src/components/chat/ShadowCowork.tsx`
- `src/hooks/useCodeSandbox.ts`
- `src/hooks/useOfflineCodeExecution.ts`
- `src/hooks/useOfflineMath.ts`

**Recommended approach:**
1. Use `@webcontainer/api` for full Node.js sandboxing where possible.
2. For lightweight JS evaluation, create a restricted runner:
   - Whitelist AST node types
   - Block global access to `fetch`, `XMLHttpRequest`, `localStorage`, `document`, `window`, `process`, `import`
   - Timeout execution after 3-5 seconds
3. For math expressions, use a math parser instead of `new Function`.

**Example replacement for math evaluation:**

```ts
// Instead of: new Function(`"use strict"; return (${expr})`)()
import { Parser } from 'expr-eval';

export function safeEvaluateMath(expr: string): number {
  const parser = new Parser();
  const ast = parser.parse(expr);
  return ast.evaluate({});
}
```

**Example restricted runner pattern:**

```ts
// restricted-runner.ts
import { parse } from 'acorn';

const BLOCKED_GLOBALS = new Set([
  'fetch', 'XMLHttpRequest', 'localStorage', 'sessionStorage',
  'document', 'window', 'globalThis', 'process', 'require', 'import',
]);

export function createRestrictedRunner(code: string) {
  const ast = parse(code, { sourceType: 'script', ecmaVersion: 'latest' });
  // Walk AST and reject references to blocked globals
  // Return a function that only exposes whitelisted globals
}
```

**Migration steps:**
1. Add `expr-eval` or similar for math expressions.
2. Add `@webcontainer/api` for CodePlayground/CodeWorkspace.
3. For surfaces that must execute JS, create a shared `restricted-runner.ts`.
4. Update each affected component to use the new runner.
5. Add tests that verify blocked patterns throw/reject.

---

### 1.2 Sanitize all HTML/SVG rendering

**Affected files:**
- `src/components/chat/Artifacts.tsx`
- `src/components/chat/LiveCodeArtifact.tsx`
- `src/components/chat/DocumentArtifact.tsx`

**Fix:**

```tsx
import DOMPurify from 'dompurify';

// Before:
// <div dangerouslySetInnerHTML={{ __html: sanitizedSvg }} />

// After:
const cleanHtml = DOMPurify.sanitize(dirtyHtml, {
  ALLOWED_TAGS: ['svg', 'path', 'div', 'span', 'pre', 'code'],
  ALLOWED_ATTR: ['class', 'style'],
});
// Then render cleanHtml
```

**Steps:**
1. Audit all `dangerouslySetInnerHTML` and `innerHTML` assignments.
2. Wrap each with DOMPurify before rendering.
3. Prefer React-rendered trees for SVG artifacts.

---

### 1.3 Remove placeholder secrets

**Affected files:**
- `src/components/chat/PersonalIDE.tsx`
- `src/components/chat/APIMarketplace.tsx`

**Fix:**
- Replace `JWT_SECRET=your-secret-key-here` with `JWT_SECRET=change-me-in-production`
- Replace `Bearer YOUR_API_KEY` with `Bearer sk-***`
- Add a CI check that rejects any string matching common placeholder patterns

**Example CI check (add to `.github/workflows/ci.yml`):**

```yaml
- name: Reject placeholder secrets
  run: |
    if git grep -nE "your-secret-key-here|YOUR_API_KEY|sk-xxx|change-me" -- '*.ts' '*.tsx' '*.json'; then
      echo "Placeholder secrets found"
      exit 1
    fi
```

---

## 2. HIGH — Privacy / Data Handling

### 2.1 Make privacy/cloud behavior explicit

**Affected files:**
- `src/lib/privacy/deviceOnlyPledge.ts`
- `src/components/OnboardingFlow.tsx`
- `src/App.tsx`

**Fix:**
1. Show a clear first-run consent dialog explaining:
   - What data is sent to cloud
   - What stays on-device
   - How to switch modes later
2. Default to `local-only` with interim cloud only after explicit consent.
3. Add a persistent indicator in the UI showing current mode.

**Example consent dialog additions:**

```tsx
// In OnboardingFlow or App.tsx
const [privacyMode, setPrivacyMode] = useState<'local-only' | 'auto' | 'cloud'>('local-only');

<Dialog open={showPrivacyDialog} onOpenChange={setShowPrivacyDialog}>
  <DialogContent>
    <DialogTitle>Choose your privacy mode</DialogTitle>
    <RadioGroup value={privacyMode} onValueChange={setPrivacyMode}>
      <RadioItem value="local-only">Local only — data never leaves this device</RadioItem>
      <RadioItem value="auto">Auto — cloud while local model loads, then on-device</RadioItem>
      <RadioItem value="cloud">Cloud AI — uses shared pool / BYOK</RadioItem>
    </RadioGroup>
  </DialogContent>
</Dialog>
```

---

### 2.2 Harden BYOK storage

**Affected files:**
- `src/lib/byok/crypto.ts`
- `src/lib/byok/client.ts`

**Fix:**
1. Add a user presence check before decrypting keys:
   - Prompt for password/biometrics if available
   - Require re-auth after 15 minutes of inactivity
2. Add a lock screen component that gates BYOK usage.
3. Document that browser-local encryption is not equivalent to a hardware key store.

---

### 2.3 Add Firebase abuse protection

**Affected files:**
- `firestore.rules`
- `storage.rules`
- Backend edge functions (Supabase)

**Fix:**
1. Add App Check to Firebase:
```js
// firebase.js
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
initializeAppCheck(app, { provider: new ReCaptchaV3Provider('public-key'), isTokenAutoRefreshEnabled: true });
```
2. Add rate limiting on public write collections via a lightweight Cloud Function.
3. Add CAPTCHA to public forms (`feedback`, `newsletter_subscriptions`).

---

### 2.4 Block sensitive file ingestion

**Affected files:**
- `src/components/chat/KnowledgeVault.tsx`

**Fix:**

```ts
const BLOCKED_EXTENSIONS = new Set([
  '.env', '.pem', '.p12', '.pfx', '.key', '.id_rsa',
  '.kubeconfig', '.dockercfg', '.npmrc', '.netrc',
]);

function isBlockedFile(name: string): boolean {
  const ext = '.' + name.split('.').pop()?.toLowerCase();
  return BLOCKED_EXTENSIONS.has(ext);
}

// In upload handler:
if (isBlockedFile(file.name)) {
  toast.error('This file type is blocked for security reasons');
  return;
}
```

---

## 3. MEDIUM-HIGH — Auth / Access Control

### 3.1 Add explicit guest mode + data retention notice

**Affected files:**
- `src/components/AuthProvider.tsx`
- `src/components/OnboardingFlow.tsx`
- `README.md`

**Fix:**
1. Rename “anonymous auth” to “guest mode” in UI.
2. Show a one-time notice: “Guest sessions are temporary. Sign in to preserve data.”
3. Add a data-deletion endpoint or instructions.

---

### 3.2 Centralize auth state + add refresh handling

**Affected files:**
- `src/components/AuthProvider.tsx`
- `src/lib/inference/router.ts`

**Fix:**
1. Create `src/lib/auth/session.ts` that wraps Supabase/Firebase auth state.
2. Add a 401 interceptor for streaming requests:
```ts
async function withAuthRefresh<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (isUnauthorized(err)) {
      await refreshSession();
      return await fn();
    }
    throw err;
  }
}
```

---

## 4. MEDIUM — Architecture / Reliability

### 4.1 Split app shells

**Affected files:**
- `src/App.tsx`
- `src/components/AuthProvider.tsx`

**Fix:**
1. Create `src/shells/PublicShell.tsx` for marketing/docs routes.
2. Create `src/shells/WorkspaceShell.tsx` for `/chatbot`, `/ide`, `/mission/*`.
3. Move boot screen, providers, and engines into `WorkspaceShell`.
4. This reduces hydration cost for public routes and isolates failure domains.

---

### 4.2 Unify backend abstraction

**Affected files:**
- `src/integrations/firebase/*`
- `src/lib/api/*`
- `src/lib/byok/*`

**Fix:**
1. Create `src/lib/backend/interface.ts`:
```ts
export interface Backend {
  auth: AuthBackend;
  messages: MessageBackend;
  files: FileBackend;
  users: UserBackend;
}
```
2. Implement `SupabaseBackend` and `FirebaseBackend` behind this interface.
3. Route all data access through the interface; remove direct Firebase calls from chat components.

---

### 4.3 Fix desktop/Ollama bundling for Windows

**Affected files:**
- `scripts/stage-ollama-bundle.mjs`
- `electron/src/ollamaManager.ts`

**Fix:**
1. Replace `process.env.HOME` with `os.homedir()`:
```ts
import { homedir } from 'node:os';
const home = homedir();
```
2. Add Windows path normalization:
```ts
import { join } from 'node:path';
const ollamaPath = join(home, '.ollama', 'bin', 'ollama.exe');
```
3. Add SHA256 verification after download:
```ts
import { createHash } from 'node:crypto';
const hash = createHash('sha256').update(data).digest('hex');
if (hash !== expectedHash) throw new Error('Ollama bundle checksum mismatch');
```

---

### 4.4 Harden CI

**Affected files:**
- `.github/workflows/ci.yml`
- `.github/workflows/desktop-release.yml`

**Fix:**
1. Remove `.github/MERGE_PR_16.sh` — it is operational debris.
2. Add secret scanning:
```yaml
- name: Secret scanning
  uses: trufflesecurity/trufflehog@main
  with:
    path: ./
    base: ${{ github.event.repository.default_branch }}
    head: HEAD
```
3. Change `npm audit` to fail on high/critical:
```yaml
- name: Run npm audit
  run: npm audit --audit-level=high
  # Remove continue-on-error
```
4. Add Windows CI job for desktop builds.

---

## 5. MEDIUM — Compliance / Legal / Ethical

### 5.1 Add age gate + opt-in for cyber modules

**Affected files:**
- `src/components/cyber/*`
- `src/components/chat/ModeSelector.tsx`
- `src/components/chat/UncensoredArena.tsx`

**Fix:**
1. Add a runtime check:
```tsx
const [cyberAccess, setCyberAccess] = useState(() => {
  const stored = localStorage.getItem('cyber_access_acknowledged');
  return stored === 'true';
});

if (!cyberAccess) {
  return <CyberConsentDialog onAccept={() => setCyberAccess(true)} />;
}
```
2. Add age gate: “You must be 18+ to use ethical hacking training tools.”
3. Move exploit payload library behind explicit consent.

---

### 5.2 Soften marketing claims

**Affected files:**
- `README.md`
- `src/components/chat/*BeaterIndicator.tsx`
- `src/pages/VsPage.tsx`

**Fix:**
1. Replace “beats Claude/GPT/Gemini” with “designed to compete with” or “alternative to.”
2. Add a benchmarks page with reproducible test data.
3. Ensure all claims comply with FTC guidelines for comparative advertising.

---

### 5.3 Document data residency

**Affected files:**
- `README.md`
- `src/pages/PrivacyPolicyPage.tsx`
- `src/pages/TermsOfServicePage.tsx`

**Fix:**
1. Add a data-processing table:
   - Supabase region
   - Firebase region
   - Edge function region
   - Whether data is processed outside user’s country
2. Add GDPR/CCPA rights pages with deletion flows.

---

## 6. LOW-MEDIUM — Developer Experience / Maintainability

### 6.1 Add targeted tests

**New files:**
- `src/lib/auth/session.test.ts`
- `src/lib/inference/router.test.ts`
- `src/lib/byok/crypto.test.ts`

**Test examples:**

```ts
// router.test.ts
describe('InferenceRouter', () => {
  it('prefers WebLLM when model is loaded', async () => {
    vi.spyOn(webLlmModule, 'isModelLoaded').mockReturnValue(true);
    const mode = await detectMode({ model: WEBLLM_MODELS[0].id });
    expect(mode).toBe('webllm');
  });

  it('falls back to shared pool when WebLLM fails', async () => {
    vi.spyOn(webLlmModule, 'isModelLoaded').mockReturnValue(false);
    const mode = await detectMode({ model: WEBLLM_MODELS[0].id });
    expect(mode).toBe('shared-pool');
  });
});
```

---

### 6.2 Clean repo artifacts

**Actions:**
1. Delete `.github/MERGE_PR_16.sh`
2. Move `NED-UNI-NIC-Submission/` to `docs/submissions/` or strip from main
3. Remove `tmp/`, `-tmp-*.png` from repo root
4. Archive `Detailed Documentation/` to `docs/engineering/` if still relevant

```bash
git rm .github/MERGE_PR_16.sh
git mv NED-UNI-NIC-Submission docs/submissions/  # optional
rm -rf tmp/ -tmp-*.png
```

---

### 6.3 Add Windows CI

**New file:** `.github/workflows/windows.yml`

```yaml
name: Windows CI

on: [push, pull_request]

jobs:
  build:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run build
      - run: npm test
```

---

## 7. Implementation Order

| Week | Focus | Deliverable |
|---|---|---|
| 1 | Critical fixes | Sandboxed code execution, HTML sanitization, placeholder secrets removed |
| 2 | Privacy hardening | Explicit privacy mode UI, BYOK re-auth, sensitive file block |
| 3 | Auth/reliability | Unified session handling, app shell split, router tests |
| 4 | CI/compliance | Secret scanning, age gate, marketing claims softened, Windows CI |
| 5 | Cleanup | Repo artifacts removed, documentation updated, Firestore rule tests |

---

## 8. How to Verify Fixes

1. **Code execution:** Run each affected component and verify `eval`/`new Function` patterns are gone or sandboxed.
2. **XSS:** Run `npm run test` and add a new test that attempts to inject `<img onerror=alert(1)>` through artifacts.
3. **Privacy:** Launch fresh browser, verify privacy dialog appears, verify no network calls until consent.
4. **Auth:** Test 401 refresh flow by expiring a token mid-stream.
5. **CI:** Verify `trufflehog` or equivalent runs on PR and blocks on findings.
6. **Windows:** Verify desktop build succeeds on `windows-latest`.

---

## 9. Notes
- All fixes should be done incrementally with feature flags where possible.
- The cyber/hacking surfaces are high-risk for app store approval; consider shipping them as an optional plugin rather than core UI.
- BYOK and local-first paths should be tested on low-end hardware to ensure performance does not regress.
