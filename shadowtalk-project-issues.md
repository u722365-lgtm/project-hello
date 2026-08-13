# ShadowTalk AI — Project Issues Audit

**Repo:** `https://github.com/zain836/shadowtalk-ai-903ca615.git`
**Local clone:** `C:\Users\Hacker\AppData\Local\hermes\shadowtalk-ai`
**Audited by:** Hermes Agent static/structural review
**Date:** 2026-08-10

This is a findings-first audit, not a style review. It covers security, privacy, auth, data handling, architecture, reliability, legal/compliance, and developer experience. Where possible, the issue includes the likely blast radius and a recommended remediation.

---

## 1. CRITICAL — Security / Injection Risks

### 1.1 Unsafe `eval()` / `new Function()` usage in user-facing runtimes
**Locations:**
- `src/components/chat/CodeCanvas.tsx:47`
- `src/components/chat/CodePlayground.tsx:83`
- `src/components/chat/CodeWorkspace.tsx:107`
- `src/components/chat/LiveCodeArtifact.tsx:162`
- `src/components/chat/PersonalIDE.tsx:338`
- `src/components/chat/ShadowCowork.tsx:749`
- `src/hooks/useCodeSandbox.ts:234`
- `src/hooks/useOfflineCodeExecution.ts:96`
- `src/hooks/useOfflineMath.ts:104`

**Issue:** Multiple surfaces execute arbitrary code through `eval()` or `new Function()`. Even when input comes from the user’s own chat/artifacts, these runtimes can be fed untrusted content from shared missions, copied artifacts, or imported projects.

**Impact:** Arbitrary JavaScript execution in the user’s browser context; potential for token/session/localStorage exfiltration.

**Remediation:**
- Use WebContainers / iframe sandboxes with restricted capabilities.
- If `new Function()` is unavoidable, whitelist AST nodes and block `fetch`, `XMLHttpRequest`, `import`, `localStorage`, `document.cookie`, etc.
- Add CSP/reduce capabilities and document the trust model.

---

### 1.2 XSS-prone rendering paths
**Locations:**
- `src/components/chat/Artifacts.tsx:83` — `dangerouslySetInnerHTML` on SVG
- `src/components/chat/LiveCodeArtifact.tsx:126` — `output.innerHTML += ...`
- `src/components/chat/DocumentArtifact.tsx:134` — `innerHTML` from doc ref

**Issue:** The app already has secret-pattern scanners and a DOMPurify dependency, but these runtimes bypass sanitization in places.

**Remediation:**
- Apply DOMPurify consistently before any `dangerouslySetInnerHTML` / `innerHTML`.
- Prefer textContent or React-rendered trees.

---

### 1.3 Hardcoded/placeholder secrets and weak placeholder patterns
**Locations:**
- `src/components/chat/PersonalIDE.tsx:143` — `.env` fixture includes `JWT_SECRET=your-secret-key-here`
- `src/components/chat/APIMarketplace.tsx:76,92` — `Bearer YOUR_API_KEY`
- Multiple UI surfaces display redacted auth header placeholders like `Authorization: Bearer ***`

**Issue:** Even when labeled placeholder, these patterns can leak into shipped docs or copied snippets, and the `.env` fixture may normalize insecure defaults.

**Remediation:**
- Replace all placeholder secrets with clearly invalid tokens.
- Add a pre-commit/release check that rejects common placeholder secrets.

---

## 2. HIGH — Privacy / Data Handling

### 2.1 “Privacy by design” claim conflicts with actual cloud paths
**Locations:**
- `src/lib/privacy/deviceOnlyPledge.ts`
- `src/lib/inference/router.ts`
- `src/components/AuthProvider.tsx`
- README + marketing docs

**Issue:** The product advertises BYOK/offline privacy, but default behavior enables cloud inference/auth unless the user opts into device-only pledge. The router falls back to shared pool by default, and anonymous auth still creates server-side state.

**Impact:** User expectations vs reality mismatch; possible GDPR/FTC exposure.

**Remediation:**
- Make privacy modes explicit on first launch.
- Document what metadata/telemetry is stored server-side.
- Add verifiable no-egress mode for offline flows.

---

### 2.2 Browser-local secrets are not truly secure
**Locations:**
- `src/lib/byok/crypto.ts` / `src/lib/byok/client.ts`

**Issue:** BYOK keys are stored in `localStorage` encrypted with a browser-derived key. This protects casual inspection but not a determined attacker with physical/remote access to the unlocked browser.

**Impact:** Stolen BYOK credentials can be used externally.

**Remediation:**
- Move secrets to OS-native credential stores where available.
- Add lock-screen / re-auth gating before decrypting keys.

---

### 2.3 Unverified Firebase config + missing secondary guards
**Locations:**
- `src/integrations/firebase/*`
- `src/components/AuthProvider.tsx`
- `firestore.rules`
- `storage.rules`

**Issue:** The app supports Firebase as a secondary backend with auth, Firestore, RTDB, Storage, and Messaging. Security rules are mostly reasonable, but:
- Public writeable surfaces exist (`feedback`, `newsletter_subscriptions`, `contact_messages`) without rate limits or CAPTCHA.
- Admin writes are trusted entirely to Firestore rules; no backend enforcement.
- Firebase config is purely client-side, so misconfiguration can silently route data to an attacker-controlled project.

**Remediation:**
- Add backend-side abuse protection for public write endpoints.
- Validate Firebase project ownership on first init and warn on mismatched domains.
- Add App Check / reCAPTCHA for public write collections.

---

### 2.4 Sensitive file ingestion without quarantine
**Location:** `src/components/chat/KnowledgeVault.tsx:138`

**Issue:** File upload accepts `.env`, `.gitignore`, `.dockerignore`, and other sensitive-looking extensions.

**Impact:** Users may ingest credential files into chat memory and remote sync inadvertently.

**Remediation:**
- Treat `.env`, id_rsa, pem, p12, kubeconfig as prohibited unless explicitly quarantined.

---

## 3. MEDIUM-HIGH — Auth / Access Control

### 3.1 Anonymous sign-in enabled by default
**Locations:**
- `src/components/AuthProvider.tsx`
- `README.md`
- `env.example`

**Issue:** Anonymous sign-in is encouraged to reduce friction, but this creates throwaway identities that can complicate abuse control and data deletion.

**Remediation:**
- Require email verification before enabling persistence.
- Add an explicit “guest mode” banner with data-retention notice.

---

### 3.2 Access-token handling is fragile
**Locations:**
- `src/components/AuthProvider.tsx:41-56`
- `src/lib/inference/router.ts`

**Issue:** Tokens are stored in localStorage and passed via `Authorization` headers or Supabase session objects. There is no visible token-refresh error boundary for shared-pool edge calls if the session expires mid-stream.

**Remediation:**
- Centralize auth state and add explicit 401/refresh handling for streaming calls.

---

## 4. MEDIUM — Architecture / Reliability

### 4.1 Monolithic client app with very wide route surface
**Locations:**
- `src/App.tsx`
- `src/pages/*`

**Issue:** A single shell loads many lazy routes, providers, engines, and global contexts. This increases bundle complexity and makes failures harder to isolate.

**Impact:** Slow initial hydration, harder debugging, higher chance of provider ordering bugs.

**Remediation:**
- Split auth-dependent shells from public marketing shells.
- Use route-level code splitting boundaries with explicit prefetch policies.

---

### 4.2 Multiple competing backend integrations
**Locations:**
- `src/integrations/firebase/*`
- `src/lib/api/*`
- `src/lib/byok/*`
- Supabase/Firebase references

**Issue:** The app uses Supabase as primary, Firebase as secondary, plus BYOK/WebLLM/local-first paths. These subsystems are not obviously coordinated, which raises inconsistency risk.

**Remediation:**
- Create a single backend abstraction with clear feature ownership per backend.
- Add integration tests proving parity for auth, messages, and storage.

---

### 4.3 Desktop/Ollama bundling scripts are environment-fragile
**Locations:**
- `scripts/stage-ollama-bundle.mjs`
- `electron/src/ollamaManager.ts`

**Issue:** Bundling and managing Ollama relies on platform-specific assumptions (`HOME`, binary discovery, paths). On Windows, `HOME` is not reliable; the script uses `process.env.HOME` directly.

**Impact:** Desktop bundling may fail silently or bundle the wrong binary.

**Remediation:**
- Use `app.getPath('home')` / `os.homedir()` consistently.
- Add validation logs + checksum verification for bundled binaries.

---

### 4.4 Missing CI enforcement for secrets/sanitizers
**Locations:**
- `.github/workflows/ci.yml`
- `.github/workflows/desktop-release.yml`
- `.github/MERGE_PR_16.sh`

**Issue:** CI has lint, build, test, and npm audit, but no secret-scanning, no SAST, and no branch-protection-style gating. Also, `.github/MERGE_PR_16.sh` is leftover operational debris.

**Remediation:**
- Add secret-scanning gating and remove merge helper scripts from repo.
- Fail security workflow on new high/critical advisories rather than `continue-on-error: true`.

---

## 5. MEDIUM — Compliance / Legal / Ethical Exposure

### 5.1 Cybersecurity/hacking training surface without clear guardrails
**Locations:**
- `src/components/cyber/*`
- `src/components/chat/ModeSelector.tsx:211`
- `src/components/chat/UncensoredArena.tsx`
- `src/components/chat/ShadowAgentPanel.tsx`

**Issue:** The app prominently includes ethical-hacking, penetration testing, exploit payload libraries, and “WAF bypass” references. Even if framed as educational, this raises abuse potential and potential platform-policy violations for app stores.

**Remediation:**
- Require explicit opt-in and age gate before accessing cyber modules.
- Remove or relocate payload library from shipped default UI.

---

### 5.2 Marketing claims that may be legally sensitive
**Locations:**
- `README.md`
- `src/components/chat/*BeaterIndicator.tsx`
- `src/pages/VsPage.tsx`

**Issue:** Multiple “beats Claude/GPT/Gemini” claims without documented benchmarks create misleading advertising risk.

**Remediation:**
- Convert claims to opinionated positioning or link to reproducible benchmarks.

---

### 5.3 Data residency / cross-border transfer opacity
**Locations:**
- `env.example`
- Supabase/Firebase configs

**Issue:** No documented data-residency controls. Cloud inference + auth + storage likely cross borders, but privacy policy wording is generic.

**Remediation:**
- Add explicit data-processing addendum for EU/UK/CA users.
- Document backend regions for Supabase/Firebase.

---

## 6. LOW-MEDIUM — Developer Experience / Maintainability

### 6.1 Tests exist but are thin for high-risk surfaces
**Locations:**
- `vitest.config.ts`
- `src/lib/*.test.ts`

**Issue:** There are tests, but there is no evidence of tests for auth flows, secret storage, router mode selection, or Firebase rule behavior.

**Remediation:**
- Add integration tests for auth/router/BYOK paths using memory/local mocks.
- Add Firestore rule tests with the Firebase emulator.

---

### 6.2 Legacy/dead code and artifacts
**Locations:**
- `.github/MERGE_PR_16.sh`
- `computer-frame.html`
- `NED-UNI-NIC-Submission/`
- `tmp/`, screenshot files in repo root
- `Detailed Documentation/` with PR-era writeups

**Issue:** The repo ships with operational scripts, old deliverables, temp artifacts, and academic submission material.

**Remediation:**
- Clean repo root and `.github/`.
- Move academic submissions to a separate docs/releases location or strip from main branch.

---

### 6.3 Windows support appears partial
**Locations:**
- `scripts/stage-ollama-bundle.mjs`
- desktop release workflow, Electron config

**Issue:** Windows paths, HOME usage, and shell assumptions are inconsistent.

**Remediation:**
- Add explicit Windows CI job.
- Use `path.join`, `os.homedir()`, and shell-aware spawning everywhere.

---

## 7. Summary by Priority

| Priority | Count | Themes |
|---|---|---|
| Critical | 1 | Code execution surfaces |
| High | 2 | Privacy claim mismatch, local secret storage limits |
| Medium-High | 2 | Auth flows, Firebase public-write abuse |
| Medium | 4 | Monolith, multi-backend inconsistency, desktop scripts, CI gaps |
| Low-Medium | 3 | Test coverage, repo cleanliness, Windows support |

---

## Recommended Immediate Actions
1. Audit all `eval/new Function/innerHTML` call sites and sandbox code execution.
2. Harden Firebase public-write endpoints with rate limiting / App Check.
3. Make privacy/cloud-egress behavior explicit in onboarding UI.
4. Strip `.github/MERGE_PR_16.sh` and temp artifacts from the repo.
5. Add a security CI job with secret scanning and SAST.
