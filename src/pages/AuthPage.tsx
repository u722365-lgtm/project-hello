import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { saveLocalUser, clearExplicitSignOut, consumeReturnPath } from "@/lib/persistentAuth";
import { backend } from "@/integrations/local/client";
import { useAuth } from "@/components/AuthProvider";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import {
  Eye,
  EyeOff,
  Loader2,
  Shield,
  Zap,
  Lock,
  Mail,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Fingerprint,
  ArrowLeft,
  Sparkles,
  Bot,
  ShieldCheck,
  KeyRound,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import ChatbotLogo from "@/components/ChatbotLogo";
import { isEnterpriseDeployment } from "@/hooks/useEnterpriseExperience";
import { ENTERPRISE_TENANTS } from "@/lib/enterpriseTenants";
import { setStoredAuthDesignChoice } from "@/lib/authDesigns";

// Rate limiter hook
const useRateLimiter = (maxAttempts = 5, windowMs = 60000) => {
  const attemptsRef = useRef<number[]>([]);

  const checkLimit = useCallback(() => {
    const now = Date.now();
    attemptsRef.current = attemptsRef.current.filter((t) => now - t < windowMs);
    if (attemptsRef.current.length >= maxAttempts) {
      const oldest = attemptsRef.current[0];
      const waitSec = Math.ceil((windowMs - (now - oldest)) / 1000);
      return { allowed: false, waitSec };
    }
    attemptsRef.current.push(now);
    return { allowed: true, waitSec: 0 };
  }, [maxAttempts, windowMs]);

  return { checkLimit };
};

// Password strength calculator
const getPasswordStrength = (pw: string) => {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 2) return { label: "Weak", color: "bg-destructive", textColor: "text-destructive", pct: 25 };
  if (score <= 3) return { label: "Fair", color: "bg-amber-500", textColor: "text-amber-400", pct: 50 };
  if (score <= 4) return { label: "Good", color: "bg-cyan-500", textColor: "text-cyan-400", pct: 75 };
  return { label: "Strong", color: "bg-emerald-500", textColor: "text-emerald-400", pct: 100 };
};

const passwordRules = [
  { test: (p: string) => p.length >= 8, label: "At least 8 characters" },
  { test: (p: string) => /[A-Z]/.test(p), label: "One uppercase letter" },
  { test: (p: string) => /[a-z]/.test(p), label: "One lowercase letter" },
  { test: (p: string) => /[0-9]/.test(p), label: "One number" },
  { test: (p: string) => /[^A-Za-z0-9]/.test(p), label: "One special character" },
];

const AuthPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rateLimitMsg, setRateLimitMsg] = useState("");

  const enterpriseFlow = isEnterpriseDeployment() || searchParams.get("enterprise") === "1";
  const enterpriseTenant = ENTERPRISE_TENANTS[0];

  const { checkLimit } = useRateLimiter(5, 60000);
  const strength = getPasswordStrength(password);

  useEffect(() => {
    setStoredAuthDesignChoice("split-luxury");
  }, []);

  useEffect(() => {
    if (user) {
      const returnPath = consumeReturnPath() || "/chatbot";
      navigate(returnPath, { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    const oauthError = searchParams.get("error");
    const oauthErrorMessage = searchParams.get("message");
    if (oauthError) {
      toast({
        title: "OAuth failed",
        description: oauthErrorMessage || oauthError,
        variant: "destructive",
      });
    }
  }, [searchParams, toast]);

  const sanitizeInput = (input: string) => input.trim().slice(0, 255);

  const playWelcomeVoice = useCallback(async (userName: string) => {
    const displayName = userName.split("@")[0];
    const welcomeMessages = [
      `Welcome back, ${displayName}. Your secure workspace is ready.`,
      `Hello ${displayName}. All systems encrypted and operational.`,
      `${displayName}, welcome to ShadowTalk. Your sovereign fortress awaits.`,
    ];
    const msg = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];

    try {
      const { fetchElevenLabsSpeech, playElevenLabsAudio } = await import("@/lib/elevenlabsTts");
      const result = await fetchElevenLabsSpeech({
        text: msg,
        voiceId: "onwK4e9ZLuTAKqWW03F9",
      });

      if (result.ok && result.audio) {
        await playElevenLabsAudio(result.audio, 0.8);
      }
    } catch (err) {
      console.warn("Voice welcome skipped:", err);
    }
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setRateLimitMsg("");

    const cleanEmail = sanitizeInput(email);
    const cleanPassword = password;

    if (!cleanEmail || !cleanPassword) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      toast({ title: "Error", description: "Please enter a valid email address", variant: "destructive" });
      return;
    }

    if (!isLogin && cleanPassword !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }

    if (!isLogin && strength.pct < 50) {
      toast({
        title: "Weak Password",
        description: "Please use a stronger password with mixed characters",
        variant: "destructive",
      });
      return;
    }

    const limit = checkLimit();
    if (!limit.allowed) {
      setRateLimitMsg(`Too many attempts. Try again in ${limit.waitSec}s`);
      toast({
        title: "Rate Limited",
        description: `Too many attempts. Wait ${limit.waitSec} seconds.`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const { data, error } = await backend.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPassword,
        });
        if (error) throw error;
        saveLocalUser(cleanEmail, data.user?.id);
        clearExplicitSignOut();
        toast({ title: "Welcome back!", description: "Logged in securely to ShadowTalk AI." });
        setLoading(false);
        await playWelcomeVoice(cleanEmail);
        const returnPath = consumeReturnPath() || "/chatbot";
        navigate(returnPath, { replace: true });
      } else {
        const { data, error } = await backend.auth.signUp({
          email: cleanEmail,
          password: cleanPassword,
        });
        if (error) throw error;
        saveLocalUser(cleanEmail, data.user?.id);
        clearExplicitSignOut();
        toast({ title: "Account Created!", description: "Welcome to your sovereign AI fortress." });
        setLoading(false);
        await playWelcomeVoice(cleanEmail);
        const returnPath = consumeReturnPath() || "/chatbot";
        navigate(returnPath, { replace: true });
      }
    } catch (error: any) {
      toast({
        title: "Authentication Failed",
        description: error?.message || "Invalid credentials or network issue",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFirebaseOAuth = async (provider: "google" | "apple") => {
    setLoading(true);
    try {
      const { data, error } = await backend.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/chatbot`,
        },
      });
      if (error) throw error;
      if (data?.user) {
        saveLocalUser(data.user.email || "", data.user.id);
        clearExplicitSignOut();
        toast({ title: "Success", description: "Logged in via Single Sign-On!" });
        await playWelcomeVoice(data.user.email || "User");
        navigate("/chatbot", { replace: true });
      }
    } catch (err: any) {
      toast({
        title: "Authentication Failed",
        description: err?.message || "OAuth sign-in cancelled or failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#05070d] text-slate-100 flex flex-col lg:flex-row relative overflow-x-hidden font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Ambient background glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 -left-32 w-[550px] h-[550px] bg-cyan-500/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 -right-32 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[160px]" />
        <div className="absolute -bottom-32 left-1/3 w-[500px] h-[500px] bg-pink-500/10 rounded-full blur-[140px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] opacity-35" />
      </div>

      {/* ========================================================= */}
      {/* LEFT PANE: Ambient Feature & Brand Showcase (Desktop/Tablet) */}
      {/* ========================================================= */}
      <div className="relative z-10 lg:w-[48%] xl:w-[45%] flex flex-col justify-between p-6 sm:p-10 lg:p-14 border-b lg:border-b-0 lg:border-r border-white/10 bg-slate-950/40 backdrop-blur-xl">
        {/* Top Branding */}
        <div>
          <div className="flex items-center justify-between">
            <Link to="/" className="inline-flex items-center gap-3 select-none group">
              <div className="h-10 w-10 rounded-2xl bg-slate-900 border border-white/15 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                <ChatbotLogo size={22} />
              </div>
              <div>
                <span className="text-base font-bold tracking-widest text-white uppercase font-sans">
                  ShadowTalk
                </span>
                <span className="block text-[10px] font-mono text-cyan-400 font-semibold tracking-wider uppercase">
                  Sovereign AI Engine
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-[11px] font-mono text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Operational</span>
            </div>
          </div>

          {/* Hero Pitch */}
          <div className="mt-12 sm:mt-16 lg:mt-20 max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Next-Gen Sovereign Intelligence</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Intelligence without{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">
                surveillance.
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-400 mt-4 leading-relaxed">
              Multi-model autonomous reasoning, 30+ native tools, and 100% on-device WebGPU privacy designed for builders who demand sovereignty.
            </p>
          </div>

          {/* 3 Interactive Feature Showcase Cards */}
          <div className="mt-8 sm:mt-10 space-y-3.5 max-w-lg">
            {/* Card 1 */}
            <div className="p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.08] hover:border-cyan-500/30 transition-all flex items-start gap-3.5 group">
              <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 shrink-0 group-hover:scale-105 transition-transform">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs sm:text-sm font-semibold text-white">Multi-Model Reasoning Engine</h3>
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-500/20 shrink-0">
                    30+ Tools
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Chains Gemini, Claude, Llama & DeepSeek with autonomous browser and bash tools.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.08] hover:border-purple-500/30 transition-all flex items-start gap-3.5 group">
              <div className="p-2.5 rounded-xl bg-purple-950/80 border border-purple-500/30 text-purple-400 shrink-0 group-hover:scale-105 transition-transform">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs sm:text-sm font-semibold text-white">Zero-Telemetry WebGPU Vault</h3>
                  <span className="text-[10px] font-mono text-purple-400 bg-purple-950/50 px-2 py-0.5 rounded border border-purple-500/20 shrink-0">
                    100% Local
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Private offline model execution with client-side AES-256 encrypted memory ledgers.
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.08] hover:border-pink-500/30 transition-all flex items-start gap-3.5 group">
              <div className="p-2.5 rounded-xl bg-pink-950/80 border border-pink-500/30 text-pink-400 shrink-0 group-hover:scale-105 transition-transform">
                <Zap className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs sm:text-sm font-semibold text-white">120fps Real-Time Workspaces</h3>
                  <span className="text-[10px] font-mono text-pink-400 bg-pink-950/50 px-2 py-0.5 rounded border border-pink-500/20 shrink-0">
                    Ultra-Fast
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Mission control, code playgrounds, deep research synthesis, and live voice loop.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Attribution */}
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
          <p className="flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-cyan-400" />
            <span>Encrypted sovereign memory architecture</span>
          </p>
          <span className="text-[11px] font-mono text-slate-500">
            Engineered by Zain Ahmed & Fatima
          </span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* RIGHT PANE: Sovereign Auth Form (Centered, High-Impact)    */}
      {/* ========================================================= */}
      <div className="relative z-10 flex-1 flex flex-col justify-center items-center p-4 sm:p-8 lg:p-12 min-h-[600px]">
        {/* Top Utility Nav */}
        <div className="w-full max-w-md flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-full bg-slate-900/60 hover:bg-slate-800 border border-white/10 cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Home</span>
          </button>

          <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-cyan-400 px-2.5 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/20">
            <Shield className="h-3 w-3" />
            <span>TLS 1.3 Verified</span>
          </div>
        </div>

        {/* Main Frosted Glass Monolith Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="w-full max-w-md rounded-3xl border border-white/15 bg-slate-900/80 backdrop-blur-2xl p-6 sm:p-8 shadow-[0_25px_70px_rgba(0,0,0,0.8)] relative overflow-hidden"
        >
          {/* Subtle Specular Top Highlight */}
          <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent pointer-events-none" />

          {/* Segmented Pill Tab Switcher: Sign In vs Create Account */}
          <div className="p-1 rounded-2xl bg-slate-950/80 border border-white/10 grid grid-cols-2 gap-1 mb-6 relative">
            <button
              type="button"
              onClick={() => {
                setIsLogin(true);
                setRateLimitMsg("");
              }}
              className={`relative py-2.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer text-center select-none ${
                isLogin ? "text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {isLogin && (
                <motion.div
                  layoutId="auth-tab-pill"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/20 via-purple-500/25 to-pink-500/20 border border-white/20 shadow-sm"
                  transition={{ type: "spring", stiffness: 450, damping: 35 }}
                />
              )}
              <span className="relative z-10">Sign In</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsLogin(false);
                setRateLimitMsg("");
              }}
              className={`relative py-2.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer text-center select-none ${
                !isLogin ? "text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {!isLogin && (
                <motion.div
                  layoutId="auth-tab-pill"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/20 via-purple-500/25 to-pink-500/20 border border-white/20 shadow-sm"
                  transition={{ type: "spring", stiffness: 450, damping: 35 }}
                />
              )}
              <span className="relative z-10">Create Account</span>
            </button>
          </div>

          {/* Title Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {enterpriseFlow
                ? enterpriseTenant.welcomeTitle
                : isLogin
                ? "Welcome Back"
                : "Create Sovereign Account"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {enterpriseFlow
                ? enterpriseTenant.signInHint
                : isLogin
                ? "Sign in to access your sovereign agentic workspace."
                : "Get started with zero-knowledge private intelligence."}
            </p>
          </div>

          {/* One-Tap OAuth Buttons (Google and Apple Only) */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {/* Google */}
            <button
              type="button"
              disabled={loading}
              onClick={() => handleFirebaseOAuth("google")}
              className="h-11 px-4 rounded-xl bg-slate-950/70 hover:bg-slate-800 border border-white/10 hover:border-cyan-500/40 text-xs sm:text-sm font-medium text-slate-200 hover:text-white flex items-center justify-center gap-2.5 transition-all shadow-sm active:scale-[0.98] cursor-pointer"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Google</span>
            </button>

            {/* Apple */}
            <button
              type="button"
              disabled={loading}
              onClick={() => handleFirebaseOAuth("apple")}
              className="h-11 px-4 rounded-xl bg-slate-950/70 hover:bg-slate-800 border border-white/10 hover:border-purple-500/40 text-xs sm:text-sm font-medium text-slate-200 hover:text-white flex items-center justify-center gap-2.5 transition-all shadow-sm active:scale-[0.98] cursor-pointer"
            >
              <svg className="h-4 w-4 shrink-0 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.38c.62-.75 1.04-1.8 0.92-2.85-.9.04-1.99.6-2.64 1.35-.57.65-1.07 1.72-.94 2.74 1.01.08 2.04-.5 2.66-1.24z" />
              </svg>
              <span>Apple</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-5">
            <div className="w-full border-t border-white/10" />
            <span className="relative bg-slate-900/95 px-3 text-[10px] text-slate-400 uppercase tracking-widest font-mono">
              or continue with email
            </span>
          </div>

          {/* Rate Limit Alert */}
          <AnimatePresence>
            {rateLimitMsg && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-3 rounded-xl bg-destructive/15 border border-destructive/30 flex items-center gap-2 text-xs text-destructive"
              >
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{rateLimitMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleAuth} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                <Input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 pl-10 bg-slate-950/60 border-white/15 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-sm text-white placeholder:text-slate-500 rounded-xl"
                  maxLength={255}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Password
                </label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => toast({ title: "Password Reset", description: "Enter your email to receive a secure recovery link." })}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 pl-10 pr-10 bg-slate-950/60 border-white/15 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-sm text-white placeholder:text-slate-500 rounded-xl"
                  maxLength={128}
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Password Strength (Sign Up Only) */}
              {!isLogin && password.length > 0 && (
                <div className="mt-2.5 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Password strength:</span>
                    <span className={cn("font-semibold", strength.textColor)}>{strength.label}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={cn("h-full transition-all duration-300 rounded-full", strength.color)}
                      style={{ width: `${strength.pct}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-1 pt-1 text-[10px]">
                    {passwordRules.map((rule) => {
                      const passed = rule.test(password);
                      return (
                        <div key={rule.label} className="flex items-center gap-1.5">
                          {passed ? (
                            <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                          ) : (
                            <XCircle className="h-3 w-3 text-slate-600 shrink-0" />
                          )}
                          <span className={passed ? "text-emerald-400" : "text-slate-500"}>
                            {rule.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password (Sign Up Only) */}
            {!isLogin && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={cn(
                      "h-11 pl-10 pr-10 bg-slate-950/60 border-white/15 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-sm text-white placeholder:text-slate-500 rounded-xl",
                      confirmPassword && confirmPassword !== password && "border-destructive/60"
                    )}
                    maxLength={128}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmPassword && confirmPassword !== password && (
                  <p className="text-[11px] text-destructive mt-1">Passwords do not match</p>
                )}
              </div>
            )}

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 mt-2 rounded-xl bg-gradient-to-r from-cyan-500 via-purple-600 to-pink-600 hover:from-cyan-400 hover:to-pink-500 text-white font-semibold text-sm shadow-[0_0_25px_rgba(6,182,212,0.35)] flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : isLogin ? (
                <>
                  <Lock className="h-4 w-4" />
                  <span>Sign In to Workspace</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Create Account & Launch</span>
                </>
              )}
            </button>
          </form>

          {/* Bottom Security Trust Chips */}
          <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span className="flex items-center gap-1 text-emerald-400">
              <Shield className="h-3 w-3" />
              <span>E2E Encrypted</span>
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1 text-cyan-400">
              <Zap className="h-3 w-3" />
              <span>Zero Cloud Logs</span>
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1 text-purple-400">
              <Fingerprint className="h-3 w-3" />
              <span>2FA Ready</span>
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthPage;
