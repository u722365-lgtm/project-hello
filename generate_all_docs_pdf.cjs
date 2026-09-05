const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

// Common CSS Styles for all volumes
const commonCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

  @page {
    size: A4;
    margin: 14mm 15mm 14mm 15mm;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #1e293b;
    background: #ffffff;
    line-height: 1.58;
    font-size: 10pt;
  }

  .cover-page {
    height: 100vh;
    min-height: 250mm;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    page-break-after: always;
    background: linear-gradient(145deg, #090d16 0%, #0f172a 50%, #1e1b4b 100%);
    color: #ffffff;
    padding: 32mm 22mm 22mm 22mm;
    position: relative;
    overflow: hidden;
  }

  .cover-page::before {
    content: "";
    position: absolute;
    top: -10%;
    right: -10%;
    width: 420px;
    height: 420px;
    background: radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, rgba(6, 182, 212, 0.05) 60%, transparent 80%);
    border-radius: 50%;
  }

  .cover-badge {
    display: inline-block;
    padding: 5px 12px;
    background: rgba(99, 102, 241, 0.2);
    border: 1px solid rgba(129, 140, 248, 0.4);
    border-radius: 16px;
    font-size: 8pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: #a5b4fc;
    margin-bottom: 20px;
  }

  .cover-vol {
    font-size: 12pt;
    font-weight: 700;
    color: #38bdf8;
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-bottom: 8px;
  }

  .cover-title {
    font-size: 28pt;
    font-weight: 800;
    line-height: 1.15;
    letter-spacing: -0.6px;
    background: linear-gradient(120deg, #ffffff 30%, #a5b4fc 70%, #38bdf8 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 14px;
  }

  .cover-subtitle {
    font-size: 12.5pt;
    color: #cbd5e1;
    font-weight: 400;
    max-width: 580px;
    line-height: 1.5;
    margin-bottom: 24px;
  }

  .cover-meta-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    border-top: 1px solid rgba(255, 255, 255, 0.12);
    padding-top: 20px;
  }

  .meta-item { display: flex; flex-direction: column; }
  .meta-label {
    font-size: 7pt;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #94a3b8;
    font-weight: 600;
    margin-bottom: 3px;
  }
  .meta-value { font-size: 9.5pt; font-weight: 600; color: #f8fafc; }

  .cover-footer {
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding-top: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 8pt;
    color: #94a3b8;
  }

  .section-break { page-break-before: always; }
  .avoid-break { page-break-inside: avoid; }

  h1, h2, h3, h4 { color: #0f172a; font-weight: 700; letter-spacing: -0.3px; }
  h1 {
    font-size: 16pt;
    border-bottom: 2px solid #e2e8f0;
    padding-bottom: 6px;
    margin-top: 18px;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .chapter-num {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    background: #4f46e5;
    color: #ffffff;
    border-radius: 5px;
    font-size: 9.5pt;
    font-weight: 800;
  }

  h2 { font-size: 12pt; margin-top: 14px; margin-bottom: 8px; color: #1e293b; }
  h3 { font-size: 10.5pt; margin-top: 10px; margin-bottom: 4px; color: #334155; }
  p { margin-bottom: 8px; color: #334155; text-align: justify; font-size: 9.5pt; }
  ul, ol { margin-left: 20px; margin-bottom: 10px; color: #334155; font-size: 9.5pt; }
  li { margin-bottom: 4px; }
  strong { color: #0f172a; font-weight: 600; }

  .card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 10px 14px;
    margin: 10px 0 12px 0;
  }
  .card-accent { background: #faf5ff; border: 1px solid #e9d5ff; border-left: 4px solid #9333ea; }
  .card-indigo { background: #eef2ff; border: 1px solid #c7d2fe; border-left: 4px solid #4f46e5; }
  .card-emerald { background: #ecfdf5; border: 1px solid #a7f3d0; border-left: 4px solid #10b981; }
  .card-amber { background: #fffbeb; border: 1px solid #fde68a; border-left: 4px solid #f59e0b; }

  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 10px 0; }
  .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin: 10px 0; }

  .stat-box {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 10px;
    text-align: center;
  }
  .stat-number { font-size: 15pt; font-weight: 800; color: #4f46e5; line-height: 1.1; }
  .stat-label {
    font-size: 7.5pt;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-top: 3px;
  }

  table { width: 100%; border-collapse: collapse; margin: 10px 0 14px 0; font-size: 8.5pt; }
  th {
    background: #0f172a;
    color: #ffffff;
    font-weight: 600;
    text-align: left;
    padding: 7px 9px;
    border: 1px solid #0f172a;
  }
  td { padding: 6px 9px; border: 1px solid #e2e8f0; color: #334155; vertical-align: top; }
  tr:nth-child(even) td { background: #f8fafc; }

  .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 7pt; font-weight: 600; }
  .badge-green { background: #dcfce7; color: #15803d; }
  .badge-blue { background: #dbeafe; color: #1d4ed8; }
  .badge-purple { background: #f3e8ff; color: #7e22ce; }
  .badge-amber { background: #fef3c7; color: #b45309; }

  code {
    font-family: 'JetBrains Mono', Consolas, monospace;
    font-size: 8pt;
    background: #f1f5f9;
    color: #0f172a;
    padding: 1px 4px;
    border-radius: 3px;
    border: 1px solid #e2e8f0;
  }

  pre {
    background: #0f172a;
    color: #e2e8f0;
    padding: 10px 12px;
    border-radius: 5px;
    font-family: 'JetBrains Mono', Consolas, monospace;
    font-size: 7.5pt;
    line-height: 1.4;
    overflow-x: auto;
    margin: 8px 0 12px 0;
  }

  .doc-footer {
    margin-top: 24px;
    text-align: center;
    border-top: 1px solid #e2e8f0;
    padding-top: 12px;
    font-size: 7.5pt;
    color: #64748b;
  }
`;

// ============================================================================
// VOLUME 1: Architecture & System Foundations
// ============================================================================
const vol1HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>ShadowTalk AI Documentation — Volume 1: Architecture & System Foundations</title>
  <style>${commonCSS}</style>
</head>
<body>
  <div class="cover-page">
    <div>
      <div class="cover-badge">Technical Manual &bull; Volume 1</div>
      <div class="cover-vol">System Foundations</div>
      <h1 class="cover-title">ShadowTalk AI<br>Architecture Blueprint</h1>
      <p class="cover-subtitle">Complete engineering specification: Component hierarchy, lifecycle state management, dual-backend hybrid model, and hardware performance profiling.</p>
    </div>
    <div>
      <div class="cover-meta-grid">
        <div class="meta-item"><span class="meta-label">Founder &amp; Architect</span><span class="meta-value">Zain Ahmed Fahad Patel</span></div>
        <div class="meta-item"><span class="meta-label">Engine Version</span><span class="meta-value">v3.0.0 (Agentic Workspace)</span></div>
        <div class="meta-item"><span class="meta-label">Framework</span><span class="meta-value">React 18 + Vite 5.4 + SWC</span></div>
        <div class="meta-item"><span class="meta-label">Type System</span><span class="meta-value">TypeScript 5.8 Strict (0 Errors)</span></div>
      </div>
      <div class="cover-footer">
        <span>Volume 1 of 4 &bull; ShadowTalk AI Documentation Suite</span>
        <span>September 2026</span>
      </div>
    </div>
  </div>

  <div class="page">
    <h1><span class="chapter-num">1</span> Philosophy, Vision &amp; Evolution</h1>
    <p>Modern knowledge workers and developers suffer from severe cognitive fragmentation across disparate AI interfaces. Writing prompts in one tab, debugging code in an isolated playground, researching in a search engine, and managing documents in an external cloud produces friction and context loss. <strong>ShadowTalk AI</strong> solves this by synthesizing conversational intelligence, autonomous agents, in-browser code execution, and persistent memory into a single workspace.</p>

    <div class="grid-3 avoid-break">
      <div class="stat-box">
        <div class="stat-number">DreamState</div>
        <div class="stat-label">Background Agent</div>
        <p style="font-size: 8pt; color: #475569; margin-top: 4px;">Executes long-horizon multi-turn tasks while the user is disconnected.</p>
      </div>
      <div class="stat-box">
        <div class="stat-number">Omniscience</div>
        <div class="stat-label">Context Memory</div>
        <p style="font-size: 8pt; color: #475569; margin-top: 4px;">Connects facts across sessions and attached documents via adaptive vector graphs.</p>
      </div>
      <div class="stat-box">
        <div class="stat-number">Shadow Twin</div>
        <div class="stat-label">Digital Persona</div>
        <p style="font-size: 8pt; color: #475569; margin-top: 4px;">Reflects user operational style, tone, and logic with public shareable links.</p>
      </div>
    </div>

    <h2>The v3.0.0 Architecture Consolidation</h2>
    <p>In version 3.0.0, the repository underwent a major architectural pivot. Over 40 disparate legacy standalone pages were consolidated directly into the unified <code>/chatbot</code> canvas and modal command decks. This drastically reduced the routing footprint, accelerated code-splitting, and focused the application on agentic autonomy.</p>

    <h1><span class="chapter-num">2</span> Application Lifecycle &amp; Component Hierarchy</h1>
    <p>The application entry point is <code>src/main.tsx</code>, which boots critical polyfills, error interceptors, and device performance profiling before mounting the React tree:</p>

    <div class="card card-indigo avoid-break">
      <h3>Root Boot Sequence</h3>
      <ol>
        <li><strong>UUID Polyfill:</strong> Ensures <code>crypto.randomUUID</code> is defined even in unauthenticated LAN/IP testing contexts.</li>
        <li><strong>Global Error Interception:</strong> Registers <code>setupGlobalErrorHandling()</code> to catch unhandled promise rejections and operational API errors.</li>
        <li><strong>Hardware Tier Detection:</strong> Invokes <code>applyPerfProfile()</code> synchronously before CSS paints to calibrate performance tier attributes.</li>
        <li><strong>Chunk Recovery:</strong> Installs <code>installViteChunkRecovery()</code> to automatically refresh stale dynamic import hashes after production deployments.</li>
        <li><strong>Idle Warmup:</strong> Defers non-critical WebGPU probing and service worker registration using <code>window.requestIdleCallback</code>.</li>
      </ol>
    </div>

    <h2>Global Provider Hierarchy</h2>
    <p>The provider tree wrapped in <code>src/App.tsx</code> guarantees end-to-end security, state coordination, and theming:</p>
    <pre>
&lt;ErrorBoundary&gt;
  &lt;QueryClientProvider client={queryClient}&gt;
    &lt;ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark"&gt;
      &lt;TooltipProvider&gt;
        &lt;AuthProvider&gt;
          &lt;StealthKillSwitchProvider&gt;
            &lt;SecurityProvider&gt;
              &lt;ShadowMemoryProvider&gt;
                &lt;AutoImproveProvider&gt;
                  &lt;ThemeTemplateProvider&gt;
                    &lt;CommandPaletteContext.Provider&gt;
                      &lt;BrowserRouter&gt;
                        &lt;SiteMotionProvider&gt;
                          &lt;SitePageShell&gt;
                            &lt;AnimatedRoutes /&gt;
                          &lt;/SitePageShell&gt;
                        &lt;/SiteMotionProvider&gt;
                      &lt;/BrowserRouter&gt;
                    &lt;/CommandPaletteContext.Provider&gt;
                  &lt;/ThemeTemplateProvider&gt;
                &lt;/AutoImproveProvider&gt;
              &lt;/ShadowMemoryProvider&gt;
            &lt;/SecurityProvider&gt;
          &lt;/StealthKillSwitchProvider&gt;
        &lt;/AuthProvider&gt;
      &lt;/TooltipProvider&gt;
    &lt;/ThemeProvider&gt;
  &lt;/QueryClientProvider&gt;
&lt;/ErrorBoundary&gt;
    </pre>
  </div>

  <div class="page section-break">
    <h1><span class="chapter-num">3</span> Dual-Backend Hybrid Storage Architecture</h1>
    <p>ShadowTalk AI employs a dual-tier storage strategy designed to function seamlessly in both 100% offline air-gapped environments and fully connected cloud environments:</p>

    <table class="avoid-break">
      <thead>
        <tr>
          <th>Storage Tier</th>
          <th>Underlying Technology</th>
          <th>Scope &amp; Responsibility</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Local-First Layer</strong></td>
          <td>IndexedDB (<code>idb</code>), LocalStorage, Web Crypto API</td>
          <td>Encrypted personal vault, adaptive turn memories, BYOK API keys, and guest conversation caches. Operates with zero network dependency.</td>
        </tr>
        <tr>
          <td><strong>Cloud Persistence</strong></td>
          <td>Firebase Firestore, Firebase Auth, Cloud Functions v2, Storage</td>
          <td>Multi-device sync, verified user roles, audit trails, and shared LLM proxy quotas.</td>
        </tr>
      </tbody>
    </table>

    <h2>The Supabase PostgREST Adapter Layer</h2>
    <p>To avoid rewriting database queries across hundreds of components during backend migrations, ShadowTalk implements a transparent adapter in <code>src/integrations/firebase/adapter.ts</code> and <code>firestore.ts</code>:</p>

    <div class="card card-emerald avoid-break">
      <h3>Adapter Mechanics</h3>
      <p style="font-size: 9pt;">When components invoke <code>backend.from('conversations').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(20)</code>:</p>
      <ul>
        <li>The query builder translates SQL-like clauses into Firestore <code>query()</code>, <code>where()</code>, <code>orderBy()</code>, and <code>limit()</code> constraints.</li>
        <li>For operators unsupported natively in Firestore (e.g. <code>ilike</code>, arbitrary nested <code>is</code> nulls, complex OR groups), the adapter fetches matching document candidates and applies an in-memory post-filter via <code>matchesLocal()</code>.</li>
        <li>Timestamps formatted as Firestore <code>Timestamp</code> objects are automatically normalized into ISO-8601 strings, maintaining signature parity.</li>
      </ul>
    </div>

    <h1><span class="chapter-num">4</span> Hardware Performance &amp; Low-End Degradation</h1>
    <p>Ensuring smooth 60 FPS operation across mobile devices, low-cost Chromebooks, and high-end workstations is handled by <code>src/lib/perf/devicePerfTier.ts</code>:</p>

    <div class="grid-2 avoid-break">
      <div class="card card-amber">
        <h4 style="color: #b45309;">Tier Detection Factors</h4>
        <ul>
          <li><strong>VRAM &amp; Max Buffer Size:</strong> Probed via WebGPU adapter limits.</li>
          <li><strong>Logical Cores:</strong> <code>navigator.hardwareConcurrency</code>.</li>
          <li><strong>Device Memory:</strong> <code>navigator.deviceMemory</code> (GB).</li>
          <li><strong>Power Preference:</strong> Battery status API integration.</li>
        </ul>
      </div>
      <div class="card card-indigo">
        <h4 style="color: #3730a3;">Automated Degraded Modes</h4>
        <ul>
          <li><strong>Tier 0 (Low-End):</strong> Disables Three.js 3D canvas, turns off backdrop-filter blurs, simplifies spring transitions to standard CSS fades.</li>
          <li><strong>Tier 1 (Standard):</strong> Enables subtle motion, standard shadows.</li>
          <li><strong>Tier 2 (High-End):</strong> Full WebGL/Three.js pulse orbs, ambient canvas glow, real-time particle rendering.</li>
        </ul>
      </div>
    </div>

    <div class="doc-footer">
      ShadowTalk AI Architectural Manual &bull; Volume 1: System Foundations &bull; Author: Zain Ahmed Fahad Patel
    </div>
  </div>
</body>
</html>`;

// ============================================================================
// VOLUME 2: AI Engines & Agentic Ecosystem
// ============================================================================
const vol2HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>ShadowTalk AI Documentation — Volume 2: AI Engines & Agentic Ecosystem</title>
  <style>${commonCSS}</style>
</head>
<body>
  <div class="cover-page">
    <div>
      <div class="cover-badge">Technical Manual &bull; Volume 2</div>
      <div class="cover-vol">Intelligence &amp; Execution</div>
      <h1 class="cover-title">ShadowTalk AI<br>AI Engines &amp; Agentic Tools</h1>
      <p class="cover-subtitle">Deep dive into the Turbo Engine complexity routing, sovereign on-device WebGPU runtimes, 30+ native tools, cognitive loops, and adaptive memory.</p>
    </div>
    <div>
      <div class="cover-meta-grid">
        <div class="meta-item"><span class="meta-label">Routing Engine</span><span class="meta-value">Turbo Engine (Groq + OpenAI + Claude)</span></div>
        <div class="meta-item"><span class="meta-label">On-Device AI</span><span class="meta-value">WebGPU + WebLLM Quantized Gemma</span></div>
        <div class="meta-item"><span class="meta-label">Tool Registry</span><span class="meta-value">30+ Autonomous Tool Handlers</span></div>
        <div class="meta-item"><span class="meta-label">Memory Architecture</span><span class="meta-value">IndexedDB Vectorized Adaptive Memory</span></div>
      </div>
      <div class="cover-footer">
        <span>Volume 2 of 4 &bull; ShadowTalk AI Documentation Suite</span>
        <span>September 2026</span>
      </div>
    </div>
  </div>

  <div class="page">
    <h1><span class="chapter-num">1</span> The Turbo Engine: Dynamic Model Routing</h1>
    <p>Dispatching every user inquiry to heavy frontier models introduces unnecessary token expenditure and unacceptable latency for simple greetings. Conversely, routing complex system design questions to lightweight models leads to reasoning failures. ShadowTalk solves this through the <strong>Turbo Engine</strong> in <code>src/lib/turbo/</code>.</p>

    <div class="card card-indigo avoid-break">
      <h3>Heuristic Complexity Scoring (analyzeComplexity)</h3>
      <p>Every message array is evaluated before dispatch based on semantic keywords and character payload volume:</p>
      <ul>
        <li><strong>Low Complexity:</strong> Matches common greetings (<code>hi</code>, <code>hello</code>, <code>thanks</code>), formatting instructions (<code>tldr</code>, <code>fix typo</code>), or prompt lengths under 100 characters. Automatically routed to <strong>Groq</strong> (<code>llama-3.1-8b-instant</code>), achieving token generation speeds exceeding 300 tokens/sec.</li>
        <li><strong>Medium Complexity:</strong> General conversational turns, creative synthesis, and standard queries routed to <strong>Groq</strong> (<code>llama-3.3-70b-versatile</code>).</li>
        <li><strong>High Complexity:</strong> Triggered by architectural terms (<code>refactor</code>, <code>architect</code>, <code>security</code>, <code>typescript</code>, <code>sql</code>, <code>synthesize</code>) or contexts exceeding 4,000 characters. Escalated to <strong>OpenAI</strong> (<code>gpt-4o</code>) or <strong>Anthropic</strong> (<code>claude-3-5-sonnet</code>).</li>
      </ul>
    </div>

    <h2>Sovereign &amp; On-Device Inference</h2>
    <p>ShadowTalk provides full support for air-gapped and zero-leak operations:</p>
    <ul>
      <li><strong>WebGPU Local Runtime:</strong> <code>src/lib/webgpuRuntime.ts</code> probes device VRAM. On compatible GPUs, models like Gemma-2B run client-side using WebAssembly and WebGPU compute shaders via <code>@mlc-ai/web-llm</code>.</li>
      <li><strong>Ollama Desktop Bridge:</strong> When running locally, ShadowTalk communicates with local daemon endpoints on <code>http://localhost:11434</code> without passing data to external servers.</li>
      <li><strong>BYOK (Bring Your Own Key):</strong> Stored strictly in local encrypted storage, authorizing direct edge client-to-provider streaming.</li>
    </ul>

    <h1><span class="chapter-num">2</span> The 30+ Native Tool Registry</h1>
    <p>The tool orchestration pipeline (<code>src/hooks/useToolOrchestrator.ts</code> and <code>executeShadowTool.ts</code>) provides conversational execution of native actions:</p>

    <table class="avoid-break">
      <thead>
        <tr>
          <th>Tool Identifier</th>
          <th>Target Handler</th>
          <th>Capability Description</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>web_search</code></td>
          <td>Cloud Function <code>web-search</code></td>
          <td>Queries live web indexes, retrieves snippets, and synthesizes multi-source citations.</td>
        </tr>
        <tr>
          <td><code>deep_research</code></td>
          <td>Turbo Engine Prompt Graph</td>
          <td>Executes multi-step recursive web research, formulating follow-up queries and final reports.</td>
        </tr>
        <tr>
          <td><code>image_generator</code></td>
          <td>Pollinations / Flux API</td>
          <td>Generates photorealistic images with custom seeds, aspect ratios, and styles.</td>
        </tr>
        <tr>
          <td><code>image_decoder</code></td>
          <td>Multimodal Vision Bridge</td>
          <td>Performs OCR, document inspection, and diagram reasoning on base64 image attachments.</td>
        </tr>
        <tr>
          <td><code>shadow_browser</code></td>
          <td>Firecrawl Scraping Gateway</td>
          <td>Fetches live JS-rendered URLs, stripping ads and converting DOM to clean Markdown.</td>
        </tr>
        <tr>
          <td><code>code_executor</code></td>
          <td>WebContainer Node.js Engine</td>
          <td>Spawns processes, executes scripts in sandboxed WebAssembly, and streams terminal output.</td>
        </tr>
        <tr>
          <td><code>presentation_builder</code></td>
          <td>Client <code>pptxgenjs</code> Pipeline</td>
          <td>Creates PowerPoint slides, bullet points, styling, and exports directly to <code>.pptx</code>.</td>
        </tr>
        <tr>
          <td><code>database_query</code></td>
          <td>Backend Function <code>postgres-query</code></td>
          <td>Runs schema inspection and sanitized SQL read queries, formatting rows into JSON tables.</td>
        </tr>
        <tr>
          <td><code>shadowspectre</code></td>
          <td>Cyber Defense Agent</td>
          <td>Performs vulnerability assessments, security header audits, and exploit path validation.</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="page section-break">
    <h1><span class="chapter-num">3</span> Cognitive Loops &amp; Swarm Consensus</h1>
    <p>Beyond single-turn tool calls, ShadowTalk implements multi-step autonomous cognitive loops:</p>

    <div class="card card-accent avoid-break">
      <h3>The Cognitive Loop Framework (CognitiveLoopPanel.tsx)</h3>
      <p>When activated, the agent enters an autonomous 4-stage execution cycle:</p>
      <ol>
        <li><strong>Plan:</strong> Breaks high-level user directives into structured, ordered sub-tasks.</li>
        <li><strong>Execute:</strong> Sequentially dispatches sub-tasks to tools or reasoning models.</li>
        <li><strong>Reflect:</strong> Evaluates tool execution output against the original user criteria. If an error or partial result occurs, the agent self-corrects.</li>
        <li><strong>Synthesize:</strong> Blends all sub-task artifacts into an exhaustive final output.</li>
      </ol>
    </div>

    <h2>Multi-Model Consensus (useMultiModelConsensus.ts)</h2>
    <p>For high-stakes decision making, ShadowTalk broadcasts the identical prompt simultaneously across three distinct model families (e.g. Groq Llama-3.3, OpenAI GPT-4o, and Google Gemini 2.0). The responses are analyzed for semantic convergence, surfacing agreements, edge-case discrepancies, and a calculated confidence rating.</p>

    <h1><span class="chapter-num">4</span> Adaptive Memory Engine</h1>
    <p>Persistent user context is managed by <code>src/lib/memory/adaptiveMemory.ts</code>. Unlike dumb chat transcripts, Adaptive Memory scores and categorizes high-signal statements:</p>

    <div class="grid-2 avoid-break">
      <div class="card card-emerald">
        <h4 style="color: #065f46;">Turn Scoring Heuristics</h4>
        <ul>
          <li><strong>Identity Signals:</strong> Statements matching <code>my name is</code>, <code>i am</code>, <code>i build</code> gain +0.40 confidence.</li>
          <li><strong>Preference Signals:</strong> Matches on <code>i prefer</code>, <code>always</code>, <code>never</code> gain +0.35 confidence.</li>
          <li><strong>Decision Signals:</strong> Matches on <code>we decided</code>, <code>going with</code> gain +0.30 confidence.</li>
          <li><strong>Task Signals:</strong> Matches on <code>build</code>, <code>ship</code>, <code>deploy</code> gain +0.20 confidence.</li>
        </ul>
      </div>
      <div class="card card-indigo">
        <h4 style="color: #3730a3;">IndexedDB Storage Schema</h4>
        <ul>
          <li><strong>Store Name:</strong> <code>facts</code> in database <code>shadowtalk_memory_db</code>.</li>
          <li><strong>Indexes:</strong> Indexed on <code>by-confidence</code> and <code>by-lastUsedAt</code>.</li>
          <li><strong>Auto-Pruning:</strong> When facts exceed capacity, least-recently-used (LRU) low-confidence facts are purged to avoid context bloat.</li>
        </ul>
      </div>
    </div>

    <div class="doc-footer">
      ShadowTalk AI Architectural Manual &bull; Volume 2: AI Engines &amp; Tools &bull; Author: Zain Ahmed Fahad Patel
    </div>
  </div>
</body>
</html>`;

// ============================================================================
// VOLUME 3: Developer Studio & Security Vault
// ============================================================================
const vol3HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>ShadowTalk AI Documentation — Volume 3: Developer Studio & Security Vault</title>
  <style>${commonCSS}</style>
</head>
<body>
  <div class="cover-page">
    <div>
      <div class="cover-badge">Technical Manual &bull; Volume 3</div>
      <div class="cover-vol">Developer &amp; Security</div>
      <h1 class="cover-title">ShadowTalk AI<br>Developer Studio &amp; Security Vault</h1>
      <p class="cover-subtitle">In-browser virtual Node.js OS via StackBlitz WebContainer, Monaco Editor, PBKDF2 + AES-GCM encryption, Stealth Network Guard, and Cloud Security Rules.</p>
    </div>
    <div>
      <div class="cover-meta-grid">
        <div class="meta-item"><span class="meta-label">Virtual Runtime</span><span class="meta-value">StackBlitz @webcontainer/api</span></div>
        <div class="meta-item"><span class="meta-label">Code Editor</span><span class="meta-value">Monaco Editor (VS Code Engine)</span></div>
        <div class="meta-item"><span class="meta-label">Cryptographic Standard</span><span class="meta-value">AES-256-GCM + PBKDF2 (100k iters)</span></div>
        <div class="meta-item"><span class="meta-label">Network Guard</span><span class="meta-value">Active Fetch/XHR Interceptor</span></div>
      </div>
      <div class="cover-footer">
        <span>Volume 3 of 4 &bull; ShadowTalk AI Documentation Suite</span>
        <span>September 2026</span>
      </div>
    </div>
  </div>

  <div class="page">
    <h1><span class="chapter-num">1</span> Personal IDE &amp; WebContainer Runtime</h1>
    <p>ShadowTalk features a complete in-browser software development suite (<code>src/components/chat/PersonalIDE.tsx</code>, 103 KB) and <code>src/lib/webcontainer/engine.ts</code>. Developers can write, compile, run, and preview full-stack Node.js projects without installing local runtimes:</p>

    <div class="card card-indigo avoid-break">
      <h3>WebContainer Virtual Operating System</h3>
      <p>Using WebAssembly and browser <code>SharedArrayBuffer</code> primitives, StackBlitz WebContainer boots a headless Node.js virtual kernel directly in browser memory:</p>
      <ul>
        <li><strong>File System Tree:</strong> The workspace converts project <code>FileNode[]</code> structures into a hierarchical <code>FileSystemTree</code> mounted via <code>instance.mount(tree)</code>.</li>
        <li><strong>Command Execution:</strong> Spawns processes (e.g. <code>npm install</code>, <code>node index.js</code>) via <code>instance.spawn()</code>, streaming stdout and stderr to a terminal interface.</li>
        <li><strong>Live Dev Server Preview:</strong> Detects open server ports (e.g. port 3000 or 5173) and displays an embedded, hot-reloading iframe preview inside the workspace canvas.</li>
      </ul>
    </div>

    <h2>Monaco Editor Integration</h2>
    <p>The code editor leverages Microsoft's Monaco Editor engine with support for multi-tab navigation, syntax highlighting, diff viewing, line bookmarking, and automatic formatting across TypeScript, JavaScript, Python, HTML, CSS, SQL, and JSON.</p>

    <h1><span class="chapter-num">2</span> End-to-End Cryptography (E2EE)</h1>
    <p>User privacy in ShadowTalk is enforced at the mathematical level via <code>src/lib/e2e-encryption.ts</code> using standard Web Crypto API primitives:</p>

    <div class="grid-2 avoid-break">
      <div class="card card-emerald">
        <h4 style="color: #065f46;">Key Derivation (PBKDF2)</h4>
        <p style="font-size: 8.5pt;">The user's master vault password never leaves the device. Keys are derived using PBKDF2 with <strong>100,000 iterations</strong> of SHA-256 and a cryptographically secure 16-byte random salt generated via <code>crypto.getRandomValues()</code>.</p>
      </div>
      <div class="card card-emerald">
        <h4 style="color: #065f46;">Authenticated Encryption (AES-GCM)</h4>
        <p style="font-size: 8.5pt;">Plaintext payloads are encrypted with <strong>AES-256-GCM</strong> using a unique 12-byte initialization vector (IV) per message. The ciphertext and authentication tag ensure tamper detection and confidentiality on cloud servers.</p>
      </div>
    </div>

    <h1><span class="chapter-num">3</span> Stealth Kill Switch &amp; Network Guard</h1>
    <p>For sensitive operational security (OPSEC), ShadowTalk includes an active network kill switch in <code>src/lib/stealthNetworkGuard.ts</code>:</p>

    <div class="card card-amber avoid-break">
      <h3>Active Network Monkey-Patching</h3>
      <p style="font-size: 9pt;">When Stealth Mode is engaged via <code>StealthKillSwitchContext.tsx</code>:</p>
      <ul>
        <li><code>window.fetch</code> and <code>XMLHttpRequest.prototype.open</code> are dynamically overridden.</li>
        <li>Outgoing URLs are checked against a strict whitelist allowing only <code>blob:</code>, <code>data:</code>, and verified local origins (<code>localhost</code>, <code>127.0.0.1</code>).</li>
        <li>Any outbound telemetry, cloud sync, or external API call is immediately terminated, triggering a blocked request counter in the UI.</li>
      </ul>
    </div>
  </div>

  <div class="page section-break">
    <h1><span class="chapter-num">4</span> Biometric Authentication &amp; Threat Intelligence</h1>
    <p>Access control to encrypted local vaults is secured via modern web authentication standards:</p>
    <ul>
      <li><strong>WebAuthn Biometrics (useBiometricAuth.ts):</strong> Integrates platform authenticators (Face ID, Touch ID, Windows Hello) to unlock local AES keys without retyping master passwords.</li>
      <li><strong>ShadowSpectre Cyber Suite:</strong> Implemented in <code>src/lib/cyber/shadowspectre/</code>. Includes specialized security reasoning personas capable of parsing vulnerability reports, auditing HTTP response headers, triaging CVE alerts, and validating defensive network policies.</li>
    </ul>

    <h1><span class="chapter-num">5</span> Cloud Security Rules &amp; Access Controls</h1>
    <p>Cloud persistence in Firebase is fortified through declarative rules enforced at the database kernel level:</p>

    <div class="card avoid-break">
      <h3>Firestore Security Rules (firestore.rules)</h3>
      <pre>
service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() { return request.auth != null; }
    function isAdmin() {
      return signedIn() &amp;&amp;
        exists(/databases/$(database)/documents/user_roles/$(request.auth.uid)) &amp;&amp;
        get(/databases/$(database)/documents/user_roles/$(request.auth.uid)).data.role == 'admin';
    }
    function ownsExisting() { return signedIn() &amp;&amp; resource.data.user_id == request.auth.uid; }
    function ownsIncoming() { return signedIn() &amp;&amp; request.resource.data.user_id == request.auth.uid; }

    // User Roles: Admin managed only
    match /user_roles/{uid} {
      allow read: if signedIn() &amp;&amp; (request.auth.uid == uid || isAdmin());
      allow write: if isAdmin();
    }

    // Default per-user isolation
    match /{collection}/{doc} {
      allow read: if ownsExisting() || isAdmin();
      allow create: if ownsIncoming();
      allow update, delete: if (ownsExisting() &amp;&amp; ownsIncoming()) || isAdmin();
    }
  }
}
      </pre>
    </div>

    <h2>Cloud Storage Security Rules (storage.rules)</h2>
    <p>File uploads are restricted to <code>/users/{uid}/*</code> folders. Uploads enforce ownership verification (<code>request.auth.uid == uid</code>), maximum payload caps of 50 MB, and explicit MIME-type filtering to prevent executable payload uploads.</p>

    <div class="doc-footer">
      ShadowTalk AI Architectural Manual &bull; Volume 3: Developer &amp; Security &bull; Author: Zain Ahmed Fahad Patel
    </div>
  </div>
</body>
</html>`;

// ============================================================================
// VOLUME 4: Enterprise SaaS, Operations & Complete File Dictionary
// ============================================================================
const vol4HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>ShadowTalk AI Documentation — Volume 4: Enterprise SaaS & File Dictionary</title>
  <style>${commonCSS}</style>
</head>
<body>
  <div class="cover-page">
    <div>
      <div class="cover-badge">Technical Manual &bull; Volume 4</div>
      <div class="cover-vol">Operations &amp; Codebase Index</div>
      <h1 class="cover-title">ShadowTalk AI<br>Enterprise SaaS &amp; File Dictionary</h1>
      <p class="cover-subtitle">Complete monetization architecture, Stripe integration, white-label tenanting, exhaustive directory catalog, and deployment runbook.</p>
    </div>
    <div>
      <div class="cover-meta-grid">
        <div class="meta-item"><span class="meta-label">Payment Engine</span><span class="meta-value">Stripe Subscriptions + Portals</span></div>
        <div class="meta-item"><span class="meta-label">Enterprise Multi-Tenancy</span><span class="meta-value">White-Label Domains &amp; Assets</span></div>
        <div class="meta-item"><span class="meta-label">Distribution Channels</span><span class="meta-value">PWA + Capacitor iOS/Android + Electron</span></div>
        <div class="meta-item"><span class="meta-label">Codebase Scope</span><span class="meta-value">119 Core Modules &bull; 123 Chat Components</span></div>
      </div>
      <div class="cover-footer">
        <span>Volume 4 of 4 &bull; ShadowTalk AI Documentation Suite</span>
        <span>September 2026</span>
      </div>
    </div>
  </div>

  <div class="page">
    <h1><span class="chapter-num">1</span> SaaS Monetization &amp; Token Economics</h1>
    <p>ShadowTalk incorporates an enterprise-ready monetization infrastructure spanning monthly recurring subscriptions, micro-transaction token billing, and add-on services (<code>src/lib/pricingCatalog.ts</code> and <code>src/lib/stripe.ts</code>):</p>

    <table class="avoid-break">
      <thead>
        <tr>
          <th>Plan Tier</th>
          <th>Pricing</th>
          <th>Daily Allowances</th>
          <th>Feature Entitlements</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Free Tier</strong></td>
          <td>$0 / month</td>
          <td>50 messages / day, 3 deep research, 5 images</td>
          <td>Standard Groq access, local WebGPU inference, community support.</td>
        </tr>
        <tr>
          <td><strong>Pro Tier</strong></td>
          <td>$10 / month</td>
          <td>Unlimited messages, 20 deep research, 20 images</td>
          <td>Turbo Engine auto-routing, full code executor, priority queue.</td>
        </tr>
        <tr>
          <td><strong>Premium Tier</strong></td>
          <td>$15 / month</td>
          <td>Unlimited messages, 50 deep research, 50 images</td>
          <td>All agents, Cognitive Loop, multi-model consensus, voice copilot.</td>
        </tr>
        <tr>
          <td><strong>Elite Tier</strong></td>
          <td>$20 / month</td>
          <td>Unlimited everything (fair-use capped)</td>
          <td>White-label branding, stealth vault, dedicated tenant SLA, phone support.</td>
        </tr>
      </tbody>
    </table>

    <div class="card card-accent avoid-break">
      <h3>Shadow Credits Micro-Billing (useShadowCredits.ts)</h3>
      <p style="font-size: 9pt;">To support pay-per-use workflows without forced recurring subscriptions, users can purchase credit packs. High-compute operations dynamically deduct credits: Image Generation (2 credits), Deep Research Synthesis (5 credits), Voice Copilot Session (1 credit/minute).</p>
    </div>

    <h1><span class="chapter-num">2</span> Enterprise Tenancy &amp; Viral Growth</h1>
    <p>The workspace includes enterprise customization and community virality hooks:</p>
    <ul>
      <li><strong>White-Label Branding (WhiteLabelBranding.tsx):</strong> Allows enterprise customers to override application logos, navigation titles, primary theme colors, and custom subdomains.</li>
      <li><strong>Viral Referral Engine (ReferralProgram.tsx):</strong> Captures query parameters via <code>useReferralTracking.ts</code>, tracks conversion funnels, and automatically grants free tier upgrades upon successful friend activations.</li>
      <li><strong>Ethical Behavioral Intelligence (useProactiveAI.ts):</strong> Evaluates visitor hesitation, dwell time, and interaction frequency to offer contextual guidance while adhering to strict privacy guardrails (<code>PROACTIVE_ETHICS</code>).</li>
    </ul>

    <h1><span class="chapter-num">3</span> Exhaustive Codebase Directory Dictionary</h1>
    <p>A structured index of the primary repository directories and architectural responsibilities:</p>

    <table class="avoid-break">
      <thead>
        <tr>
          <th>Directory Path</th>
          <th>Key Sub-Modules</th>
          <th>Functional Domain</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>src/components/chat/</code></td>
          <td><code>PersonalIDE.tsx</code>, <code>ShadowBrowser.tsx</code>, <code>CognitiveLoopPanel.tsx</code></td>
          <td>Primary interactive chat canvas, modal panels, code canvases, and tool inspectors.</td>
        </tr>
        <tr>
          <td><code>src/lib/turbo/</code></td>
          <td><code>turboEngine.ts</code>, <code>modelRouter.ts</code>, <code>turboProviders.ts</code></td>
          <td>Intelligent complexity routing algorithm and multi-provider streaming client.</td>
        </tr>
        <tr>
          <td><code>src/lib/memory/</code></td>
          <td><code>adaptiveMemory.ts</code>, <code>promptInjector.ts</code></td>
          <td>IndexedDB vectorized turn-scoring and contextual prompt memory injection.</td>
        </tr>
        <tr>
          <td><code>src/lib/cyber/</code></td>
          <td><code>shadowspectre/</code> (client, prompts, router, scope)</td>
          <td>Autonomous security evaluation, vulnerability scanning, and threat intelligence.</td>
        </tr>
        <tr>
          <td><code>src/integrations/firebase/</code></td>
          <td><code>adapter.ts</code>, <code>firestore.ts</code>, <code>auth.ts</code>, <code>storage.ts</code></td>
          <td>PostgREST query adapter, authentication wrappers, and Firestore synchronization.</td>
        </tr>
        <tr>
          <td><code>functions/src/</code></td>
          <td><code>index.ts</code> (shared pool, audio mock, drive)</td>
          <td>Firebase Cloud Functions v2 handling server-side secrets and rate-limited fallbacks.</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="page section-break">
    <h1><span class="chapter-num">4</span> Build, Testing &amp; Deployment Runbook</h1>
    <p>Standard operating procedures for compiling, testing, and distributing ShadowTalk AI:</p>

    <div class="card card-indigo avoid-break">
      <h3>Verification Commands</h3>
      <pre>
# 1. Static Type Checking (Clean: 0 errors)
npx tsc --noEmit

# 2. Automated Test Suite (29/31 suites passing)
npm test

# 3. Production Vite Compilation
npm run build
      </pre>
    </div>

    <h2>Deployment Environments</h2>
    <ul>
      <li><strong>Firebase Web Hosting:</strong> Deployed via <code>firebase deploy --only hosting</code>. Configured with strict security headers (nosniff, strict-origin-when-cross-origin).</li>
      <li><strong>PWA Service Worker:</strong> Generated via <code>vite-plugin-pwa</code> with Workbox precaching 218 static assets for instant offline launches.</li>
      <li><strong>Mobile Packaging (Capacitor):</strong> <code>capacitor.config.ts</code> defines native application IDs (<code>com.shadowtalk.ai</code>), splash screen durations, dark status bar tokens, and keyboard resize behaviors for iOS and Android builds.</li>
    </ul>

    <div class="card card-emerald avoid-break">
      <h4 style="color: #065f46; margin-bottom: 4px;">Audited Project Health Summary</h4>
      <p style="font-size: 8.5pt;">The project demonstrates exceptional engineering discipline: 100% clean TypeScript compilation with zero type errors, robust code splitting across vendor libraries, complete cryptographic isolation for sensitive data, and seamless fallback to on-device sovereign WebGPU execution.</p>
    </div>

    <div class="doc-footer">
      ShadowTalk AI Architectural Manual &bull; Volume 4: Operations &amp; File Dictionary &bull; Author: Zain Ahmed Fahad Patel
    </div>
  </div>
</body>
</html>`;

// ============================================================================
// MASTER COMBINED MANUAL
// ============================================================================
const masterHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>ShadowTalk AI — Master System Documentation & Complete Engineering Handbook</title>
  <style>
    ${commonCSS}
    .volume-header-page {
      height: 100vh;
      min-height: 250mm;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      page-break-before: always;
      page-break-after: always;
      background: #0f172a;
      color: #ffffff;
      padding: 30mm;
    }
    .vol-num-badge {
      font-size: 13pt;
      font-weight: 800;
      color: #38bdf8;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 12px;
    }
    .vol-big-title {
      font-size: 26pt;
      font-weight: 800;
      line-height: 1.2;
      margin-bottom: 16px;
      color: #ffffff;
    }
    .vol-desc {
      font-size: 12pt;
      color: #94a3b8;
      max-width: 500px;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <!-- MASTER COVER -->
  <div class="cover-page">
    <div>
      <div class="cover-badge">Complete Engineering Handbook</div>
      <div class="cover-vol">Master Edition</div>
      <h1 class="cover-title">ShadowTalk AI<br>Master System Documentation</h1>
      <p class="cover-subtitle">The definitive encyclopedic guide: System architecture, Turbo Engine heuristics, 30+ native tools, Personal IDE, cryptographic privacy, and complete codebase dictionary.</p>
    </div>
    <div>
      <div class="cover-meta-grid">
        <div class="meta-item"><span class="meta-label">Founder &amp; Lead Architect</span><span class="meta-value">Zain Ahmed Fahad Patel (Karachi, PK)</span></div>
        <div class="meta-item"><span class="meta-label">Architecture Version</span><span class="meta-value">v3.0.0 (Unified Agentic Pivot)</span></div>
        <div class="meta-item"><span class="meta-label">Compilation Status</span><span class="meta-value">TypeScript Strict (0 Errors)</span></div>
        <div class="meta-item"><span class="meta-label">Production Build Status</span><span class="meta-value">Vite PWA (100% Passed)</span></div>
      </div>
      <div class="cover-footer">
        <span>Confidential &bull; Master Unified Edition</span>
        <span>September 2026</span>
      </div>
    </div>
  </div>

  <!-- TABLE OF CONTENTS -->
  <div class="page">
    <h1>Table of Contents</h1>
    <table class="avoid-break" style="margin-top: 14px;">
      <thead><tr><th>Volume</th><th>Topic Area</th><th>Core Subjects</th></tr></thead>
      <tbody>
        <tr><td><strong>Volume 1</strong></td><td><strong>Architecture &amp; Foundations</strong></td><td>Vision, Component Lifecycle, Hybrid Storage, Hardware Tiers</td></tr>
        <tr><td><strong>Volume 2</strong></td><td><strong>AI Engines &amp; Agentic Tools</strong></td><td>Turbo Engine, Complexity Routing, WebGPU, 30+ Tools, Memory</td></tr>
        <tr><td><strong>Volume 3</strong></td><td><strong>Developer Studio &amp; Security</strong></td><td>Personal IDE, WebContainer Node OS, PBKDF2/AES-GCM, Stealth Guard</td></tr>
        <tr><td><strong>Volume 4</strong></td><td><strong>Enterprise SaaS &amp; File Index</strong></td><td>Stripe, Shadow Credits, Tenancy, Full File Dictionary, Runbook</td></tr>
      </tbody>
    </table>
  </div>

  <!-- VOLUME 1 CONTENT -->
  <div class="volume-header-page">
    <div class="vol-num-badge">Volume 1</div>
    <div class="vol-big-title">Architecture &amp; System Foundations</div>
    <div class="vol-desc">Component hierarchy, lifecycle management, dual-backend hybrid model, and hardware performance profiling.</div>
  </div>
  ${vol1HTML.split('<!-- SECTION 1 -->')[1] || vol1HTML.split('<div class="page">')[1]}

  <!-- VOLUME 2 CONTENT -->
  <div class="volume-header-page">
    <div class="vol-num-badge">Volume 2</div>
    <div class="vol-big-title">AI Engines &amp; Agentic Ecosystem</div>
    <div class="vol-desc">Turbo Engine complexity routing, sovereign on-device WebGPU runtimes, 30+ native tools, cognitive loops, and adaptive memory.</div>
  </div>
  ${vol2HTML.split('<div class="page">')[1]}

  <!-- VOLUME 3 CONTENT -->
  <div class="volume-header-page">
    <div class="vol-num-badge">Volume 3</div>
    <div class="vol-big-title">Developer Studio &amp; Security Vault</div>
    <div class="vol-desc">In-browser virtual Node.js OS via StackBlitz WebContainer, Monaco Editor, PBKDF2 + AES-GCM encryption, and Stealth Network Guard.</div>
  </div>
  ${vol3HTML.split('<div class="page">')[1]}

  <!-- VOLUME 4 CONTENT -->
  <div class="volume-header-page">
    <div class="vol-num-badge">Volume 4</div>
    <div class="vol-big-title">Enterprise SaaS &amp; File Dictionary</div>
    <div class="vol-desc">Monetization architecture, Stripe integration, white-label tenanting, exhaustive directory catalog, and deployment runbook.</div>
  </div>
  ${vol4HTML.split('<div class="page">')[1]}
</body>
</html>`;

const documents = [
  { name: 'ShadowTalk_AI_Volume_1_Architecture_and_Foundations.pdf', html: vol1HTML },
  { name: 'ShadowTalk_AI_Volume_2_AI_Engines_and_Agentic_Tools.pdf', html: vol2HTML },
  { name: 'ShadowTalk_AI_Volume_3_Developer_Studio_and_Security_Vault.pdf', html: vol3HTML },
  { name: 'ShadowTalk_AI_Volume_4_Enterprise_SaaS_and_File_Dictionary.pdf', html: vol4HTML },
  { name: 'ShadowTalk_AI_Master_System_Documentation.pdf', html: masterHTML }
];

async function generateAllPDFs() {
  console.log('Launching Puppeteer to generate documentation suite...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  for (const doc of documents) {
    const outputPath = path.resolve(__dirname, doc.name);
    console.log('Generating: ' + doc.name + '...');
    const page = await browser.newPage();
    await page.setContent(doc.html, { waitUntil: 'networkidle0' });
    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' }
    });
    await page.close();
    const stats = fs.statSync(outputPath);
    console.log('✔ Created ' + doc.name + ' (' + (stats.size / 1024).toFixed(1) + ' KB)');
  }

  await browser.close();
  console.log('All documentation PDFs generated successfully!');
}

generateAllPDFs().catch(err => {
  console.error('Failed to generate documentation PDFs:', err);
  process.exit(1);
});
