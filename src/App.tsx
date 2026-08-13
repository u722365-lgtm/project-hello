import { useState, useCallback, useRef, type DragEvent } from "react";
import { scanCode, scanFiles, type ScanResult, type Vulnerability } from "./lib/security/ShadowScanEngine";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Info,
  Copy,
  Check,
  Zap,
  Upload,
  FileCode,
  XCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Bug,
  Key,
  Terminal,
} from "lucide-react";

// ─── Severity Config ────────────────────────────────────────────────────────────

const SEVERITY_CONFIG = {
  critical: { color: "text-red-400", bg: "bg-red-500/15 border-red-500/30", badge: "bg-red-500 text-white", icon: XCircle, label: "CRITICAL" },
  high: { color: "text-orange-400", bg: "bg-orange-500/15 border-orange-500/30", badge: "bg-orange-500 text-white", icon: AlertTriangle, label: "HIGH" },
  medium: { color: "text-yellow-400", bg: "bg-yellow-500/15 border-yellow-500/30", badge: "bg-yellow-500 text-white", icon: AlertCircle, label: "MEDIUM" },
  low: { color: "text-blue-400", bg: "bg-blue-500/15 border-blue-500/30", badge: "bg-blue-500 text-white", icon: Info, label: "LOW" },
  info: { color: "text-zinc-400", bg: "bg-zinc-500/15 border-zinc-500/30", badge: "bg-zinc-500 text-white", icon: Info, label: "INFO" },
} as const;

// ─── App ───────────────────────────────────────────────────────────────────────

function App() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedVuln, setExpandedVuln] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Scan Handler ──────────────────────────────────────────────────────────

  const handleScan = useCallback(() => {
    if (!code.trim()) return;
    setIsScanning(true);
    // Use requestAnimationFrame so the UI updates before the synchronous scan
    requestAnimationFrame(() => {
      const scanResult = scanCode(code.trim(), uploadedFileName || "input");
      setResult(scanResult);
      setIsScanning(false);
    });
  }, [code, uploadedFileName]);

  // ─── File Upload ───────────────────────────────────────────────────────────

  const handleFileRead = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        setCode(text);
        setUploadedFileName(file.name);
        setResult(null);
      }
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.size <= 500_000) handleFileRead(file);
  }, [handleFileRead]);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileRead(file);
  }, [handleFileRead]);

  // ─── Clipboard ─────────────────────────────────────────────────────────────

  const handleCopyFix = useCallback(async (vuln: Vulnerability) => {
    try {
      await navigator.clipboard.writeText(vuln.codefix);
      setCopiedId(vuln.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = vuln.codefix;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopiedId(vuln.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }, []);

  const handleCopyReport = useCallback(async () => {
    if (!result) return;
    const lines = result.vulnerabilities.map(v =>
      `[${v.severity.toUpperCase()}] ${v.title}\n  Location: ${v.location}\n  Fix: ${v.remediation}`
    );
    const text = `ShadowScan Security Audit\nScore: ${result.riskScore}/100\n${result.summary}\n\n${lines.join("\n\n")}\n\nScanned with ShadowScan by ShadowTalk AI`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId("report");
      setTimeout(() => setCopiedId(null), 2000);
    } catch { /* ignore */ }
  }, [result]);

  // ─── Share on X ───────────────────────────────────────────────────────────

  const handleShareX = useCallback(() => {
    if (!result) return;
    const crit = result.vulnerabilities.filter(v => v.severity === "critical").length;
    const high = result.vulnerabilities.filter(v => v.severity === "high").length;
    const text = crit > 0 || high > 0
      ? `Just scanned my code with ShadowScan and found ${result.vulnerabilities.length} security issues (${crit} critical, ${high} high). Score: ${result.riskScore}/100.\n\nPaste your code and find secrets, SQL injection, XSS, and more in <2 seconds.`
      : `My code passed ShadowScan with a score of ${result.riskScore}/100. Clean!`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank");
  }, [result]);

  // ─── Clear ─────────────────────────────────────────────────────────────────

  const handleClear = useCallback(() => {
    setCode("");
    setResult(null);
    setUploadedFileName(null);
    setCopiedId(null);
    setExpandedVuln(null);
    textareaRef.current?.focus();
  }, []);

  // ─── Severity Counts ────────────────────────────────────────────────────────

  const counts = result
    ? {
        critical: result.vulnerabilities.filter(v => v.severity === "critical").length,
        high: result.vulnerabilities.filter(v => v.severity === "high").length,
        medium: result.vulnerabilities.filter(v => v.severity === "medium").length,
        low: result.vulnerabilities.filter(v => v.severity === "low").length,
        info: result.vulnerabilities.filter(v => v.severity === "info").length,
      }
    : null;

  const riskColor = result
    ? result.riskScore >= 60 ? "text-red-400"
    : result.riskScore >= 30 ? "text-orange-400"
    : "text-emerald-400"
    : "";

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[hsl(240,12%,3%)] text-[hsl(0,0%,96%)] font-sans antialiased">
      {/* Background Grid */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(hsl(195,100%,55%) 1px, transparent 1px), linear-gradient(90deg, hsl(195,100%,55%) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, hsl(195,100%,55% / 0.06), transparent 70%)' }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* ─── Header ─────────────────────────────────────────────────────── */}
        <header className="mb-8 sm:mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-[hsl(195,100%,55% / 0.12)] border border-[hsl(195,100%,55% / 0.2)]">
              <Shield className="w-6 h-6 text-[hsl(195,100%,55%)]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                ShadowScan
              </h1>
              <p className="text-xs sm:text-sm text-[hsl(240,5%,58%)]">
                by ShadowTalk AI
              </p>
            </div>
          </div>
          <p className="text-sm sm:text-base text-[hsl(240,5%,65%)] max-w-2xl leading-relaxed">
            1-Click Security Audit for Vibe-Coded Apps. Paste your code or drop a file
            — we detect <strong className="text-[hsl(0,0%,96%)]">exposed secrets, injection flaws, XSS, SSRF, weak crypto</strong>, and more.
            100% client-side. Zero data leaves your browser.
          </p>
        </header>

        {/* ─── Input Area ────────────────────────────────────────────────── */}
        <section className="mb-6">
          <div
            className={`relative rounded-xl border transition-all duration-200 ${
              isDragging
                ? "border-[hsl(195,100%,55%)] bg-[hsl(195,100%,55% / 0.05)]"
                : "border-[hsl(240,6%,14%)] bg-[hsl(240,10%,5%)]"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {uploadedFileName && (
              <div className="flex items-center gap-2 px-4 py-2 border-b border-[hsl(240,6%,14%)] text-xs text-[hsl(240,5%,58%)]">
                <FileCode className="w-3.5 h-3.5 text-[hsl(195,100%,55%)]" />
                <span className="font-mono">{uploadedFileName}</span>
                <button onClick={() => { setUploadedFileName(null); setCode(""); setResult(null); }}
                  className="ml-auto hover:text-[hsl(0,0%,96%)] transition-colors">
                  <XCircle className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <textarea
              ref={textareaRef}
              value={code}
              onChange={e => { setCode(e.target.value); setResult(null); }}
              placeholder={`// Paste your code here...\n// Or drag & drop a file\n\n// Example — try this:\nconst supabase = createClient(\n  "https://your-project.supabase.co",\n  process.env.SUPABASE_SERVICE_ROLE_KEY  // DANGER!\n);\n\nconst apiKey = "sk-ant-api03-abc123secretkey";\n\nfetch("/api/user/" + params.id);\n`}
              className="w-full min-h-[200px] sm:min-h-[240px] p-4 bg-transparent text-sm font-mono text-[hsl(0,0%,96%)] placeholder:text-[hsl(240,5%,40%)] resize-y focus:outline-none"
              spellCheck={false}
            />

            {/* Drag Overlay */}
            {isDragging && (
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-[hsl(195,100%,55% / 0.08)] border-2 border-dashed border-[hsl(195,100%,55% / 0.4)]">
                <div className="flex items-center gap-2 text-[hsl(195,100%,55%)] font-medium">
                  <Upload className="w-5 h-5" />
                  Drop file to scan
                </div>
              </div>
            )}
          </div>

          {/* Actions Row */}
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <button
              onClick={handleScan}
              disabled={!code.trim() || isScanning}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: code.trim() && !isScanning
                  ? "linear-gradient(135deg, hsl(195,100%,45%), hsl(195,100%,55%))"
                  : "hsl(240,6%,14%)",
                boxShadow: code.trim() && !isScanning
                  ? "0 4px 24px hsl(195,100%,55% / 0.4), 0 0 0 1px hsl(195,100%,55% / 0.2)"
                  : "none",
                color: code.trim() && !isScanning ? "hsl(240,12%,3%)" : "hsl(240,5%,58%)",
              }}
            >
              <Zap className="w-4 h-4" />
              {isScanning ? "Scanning..." : "Scan Code"}
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-[hsl(240,5%,65%)] border border-[hsl(240,6%,14%)] hover:border-[hsl(240,5%,30%)] hover:text-[hsl(0,0%,96%)] transition-all duration-200"
            >
              <Upload className="w-4 h-4" />
              Upload File
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".js,.jsx,.ts,.tsx,.py,.java,.go,.rb,.php,.sql,.html,.css,.json,.yaml,.yml,.env,.sh,.md"
              onChange={handleFileInput}
            />

            {(code.trim() || result) && (
              <button
                onClick={handleClear}
                className="ml-auto text-xs text-[hsl(240,5%,40%)] hover:text-[hsl(0,0%,96%)] transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </section>

        {/* ─── Results ──────────────────────────────────────────────────── */}
        {result && (
          <section className="space-y-5 animate-in fade-in duration-300">
            {/* Score + Summary Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl bg-[hsl(240,10%,5%)] border border-[hsl(240,6%,14%)]">
              <div className="flex items-center gap-3">
                <div className={`text-3xl sm:text-4xl font-black tabular-nums ${riskColor}`}>
                  {result.riskScore}
                </div>
                <div className="text-xs text-[hsl(240,5%,50%)] leading-tight">
                  <div>/ 100</div>
                  <div className="font-mono flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" />
                    {result.scanTimeMs.toFixed(0)}ms
                  </div>
                </div>
              </div>

              <div className="flex-1">
                <p className="text-sm leading-relaxed">{result.summary}</p>
              </div>
            </div>

            {/* Severity Badges */}
            {counts && (
              <div className="flex flex-wrap gap-2">
                {Object.entries(counts).filter(([, c]) => c > 0).map(([sev, c]) => {
                  const cfg = SEVERITY_CONFIG[sev as keyof typeof SEVERITY_CONFIG];
                  return (
                    <span key={sev} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${cfg.badge}`}>
                      <cfg.icon className="w-3.5 h-3.5" />
                      {c} {cfg.label}
                    </span>
                  );
                })}
                {result.vulnerabilities.length === 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    CLEAN
                  </span>
                )}
              </div>
            )}

            {/* Vulnerability List */}
            {result.vulnerabilities.length > 0 && (
              <div className="space-y-2">
                {result.vulnerabilities.map(vuln => {
                  const cfg = SEVERITY_CONFIG[vuln.severity];
                  const isExpanded = expandedVuln === vuln.id;
                  const isCopied = copiedId === vuln.id;

                  return (
                    <div
                      key={vuln.id}
                      className={`rounded-lg border transition-all duration-200 ${cfg.bg}`}
                    >
                      {/* Summary Row */}
                      <button
                        onClick={() => setExpandedVuln(isExpanded ? null : vuln.id)}
                        className="w-full flex items-start gap-3 p-3 sm:p-4 text-left"
                      >
                        <cfg.icon className={`w-5 h-5 mt-0.5 shrink-0 ${cfg.color}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs font-bold uppercase tracking-wide ${cfg.color}`}>
                              {cfg.label}
                            </span>
                            <span className="text-sm font-semibold text-[hsl(0,0%,96%)] truncate">
                              {vuln.title}
                            </span>
                          </div>
                          <p className="text-xs text-[hsl(240,5%,55%)] font-mono mt-0.5">
                            {vuln.location}
                            {vuln.cweId && (
                              <span className="ml-2 text-[hsl(240,5%,40%)]">{vuln.cweId}</span>
                            )}
                          </p>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-[hsl(240,5%,40%)] shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-[hsl(240,5%,40%)] shrink-0" />
                        )}
                      </button>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="px-3 sm:px-4 pb-4 pt-0 space-y-3 border-t border-[hsl(240,6%,14%)] mt-0 ml-8">
                          <p className="text-sm text-[hsl(240,5%,65%)] leading-relaxed pt-3">
                            {vuln.description}
                          </p>

                          <div>
                            <div className="text-xs font-bold uppercase tracking-wide text-[hsl(240,5%,50%)] mb-1.5">
                              Remediation
                            </div>
                            <p className="text-sm text-[hsl(240,5%,70%)]">
                              {vuln.remediation}
                            </p>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="text-xs font-bold uppercase tracking-wide text-[hsl(240,5%,50%)]">
                                Code Fix
                              </div>
                              <button
                                onClick={() => handleCopyFix(vuln)}
                                className="flex items-center gap-1.5 text-xs font-medium text-[hsl(195,100%,55%)] hover:text-[hsl(195,100%,65%)] transition-colors"
                              >
                                {isCopied ? (
                                  <>
                                    <Check className="w-3 h-3" />
                                    Copied
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    Copy Fix
                                  </>
                                )}
                              </button>
                            </div>
                            <pre className="text-xs font-mono bg-[hsl(240,12%,3%)] border border-[hsl(240,6%,14%)] rounded-lg p-3 overflow-x-auto text-[hsl(240,5%,65%)] whitespace-pre-wrap">
                              {vuln.codefix}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Action Bar */}
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={handleShareX}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-[hsl(240,6%,14%)] text-[hsl(240,5%,65%)] hover:border-[hsl(240,5%,30%)] hover:text-[hsl(0,0%,96%)] transition-all"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                Share on X
              </button>

              <button
                onClick={handleCopyReport}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-[hsl(240,6%,14%)] text-[hsl(240,5%,65%)] hover:border-[hsl(240,5%,30%)] hover:text-[hsl(0,0%,96%)] transition-all"
              >
                {copiedId === "report" ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Full Report
                  </>
                )}
              </button>
            </div>
          </section>
        )}

        {/* ─── Empty State (no result yet) ──────────────────────────────── */}
        {!result && !isScanning && (
          <section className="text-center py-12 sm:py-16">
            <div className="flex justify-center gap-8 mb-8 opacity-30">
              <Key className="w-8 h-8" />
              <Bug className="w-8 h-8" />
              <Terminal className="w-8 h-8" />
            </div>
            <p className="text-sm text-[hsl(240,5%,40%)]">
              Detects 23 secret patterns + 35 SAST patterns across 15 vulnerability categories
            </p>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-3 text-xs text-[hsl(240,5%,35%)]">
              <span>AWS Keys</span>
              <span>·</span>
              <span>OpenAI / Anthropic</span>
              <span>·</span>
              <span>Supabase RLS</span>
              <span>·</span>
              <span>SQL Injection</span>
              <span>·</span>
              <span>XSS</span>
              <span>·</span>
              <span>SSRF</span>
              <span>·</span>
              <span>JWT Attacks</span>
              <span>·</span>
              <span>Prototype Pollution</span>
              <span>·</span>
              <span>Path Traversal</span>
            </div>
          </section>
        )}

        {/* ─── Footer ──────────────────────────────────────────────────── */}
        <footer className="mt-16 pt-6 border-t border-[hsl(240,6%,14%)] text-center">
          <p className="text-xs text-[hsl(240,5%,35%)]">
            ShadowScan by{" "}
            <a
              href="https://shadowtalk.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[hsl(195,100%,55%)] hover:underline"
            >
              ShadowTalk AI
            </a>{" "}
            — 100% client-side scanning. Your code never leaves your browser.
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
