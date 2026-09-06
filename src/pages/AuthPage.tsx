import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { saveLocalUser } from "@/lib/persistentAuth";
import { clearExplicitSignOut, consumeReturnPath, hasExplicitSignOut } from "@/lib/persistentAuth";
import { backend, isConfigured } from "@/integrations/local/client";
import { useAuth } from "@/components/AuthProvider";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Eye, EyeOff, WifiOff, Wifi, Loader2, Shield, Zap, Lock, CheckCircle2, XCircle, AlertTriangle, Fingerprint } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuthMotion } from "@/hooks/useAuthMotion";
import { GlassMonolithDesign } from "@/components/auth/designs/GlassMonolithDesign";
import { setStoredAuthDesignChoice } from "@/lib/authDesigns";
import { AuthAnimatedField } from "@/components/auth/AuthAnimatedField";
import { AuthShimmerButton } from "@/components/auth/AuthShimmerButton";
import { isEnterpriseDeployment } from "@/hooks/useEnterpriseExperience";
import { ENTERPRISE_TENANTS, isEnterpriseEmail } from "@/lib/enterpriseTenants";
// Phone OTP and Magic Link removed — email + Google + Apple only

// Rate limiter
const useRateLimiter = (maxAttempts = 5, windowMs = 60000) => {
  const attemptsRef = useRef<number[]>([]);

  const checkLimit = useCallback(() => {
    const now = Date.now();
    attemptsRef.current = attemptsRef.current.filter(t => now - t < windowMs);
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

// Password strength checker
const getPasswordStrength = (pw: string) => {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 2) return { label: "Weak", color: "bg-destructive", textColor: "text-destructive", pct: 25 };
  if (score <= 3) return { label: "Fair", color: "bg-warning", textColor: "text-warning", pct: 50 };
  if (score <= 4) return { label: "Good", color: "bg-primary", textColor: "text-primary", pct: 75 };
  return { label: "Strong", color: "bg-success", textColor: "text-success", pct: 100 };
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

  useEffect(() => {
    if (user) {
      navigate('/chatbot', { replace: true });
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
  }, [searchParams]);
  const enterpriseFlow =
    isEnterpriseDeployment() || searchParams.get("enterprise") === "1";
  const enterpriseTenant = ENTERPRISE_TENANTS[0];
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rateLimitMsg, setRateLimitMsg] = useState("");

  const isOffline = false;
  const hasOfflineCredentials = false;
  const saveCredentialsForOffline = () => {};
  const verifyOfflineCredentials = () => {};
  const getOfflineSession = () => null;
  // OAuth removed — local-only auth
  const { checkLimit } = useRateLimiter(5, 60000);
  const authMotion = useAuthMotion();
  const { reduced, variants: authVariants, shouldAnimateAmbient } = authMotion;

  useEffect(() => {
    setStoredAuthDesignChoice("glass-monolith");
  }, []);

  const strength = getPasswordStrength(password);





  const sanitizeInput = (input: string) => input.trim().slice(0, 255);

  const playWelcomeVoice = useCallback(async (userName: string) => {
    const displayName = userName.split("@")[0];
    const welcomeMessages = [
      `Welcome back, ${displayName}. Your secure workspace is ready.`,
      `Hello ${displayName}. All systems encrypted and operational.`,
      `${displayName}, welcome to ShadowTalk. Your data fortress awaits.`,
    ];
    const msg = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];

    try {
      const { fetchElevenLabsSpeech, playElevenLabsAudio } = await import(
        "@/lib/elevenlabsTts"
      );
      const result = await fetchElevenLabsSpeech({
        text: msg,
        voiceId: "onwK4e9ZLuTAKqWW03F9",
      });

      if (result.ok && result.audio) {
        await playElevenLabsAudio(result.audio, 0.8);
      } else if (result.error) {
        console.warn("Voice welcome skipped:", result.error);
      }
    } catch (err) {
      console.error("Voice welcome error:", err);
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

    // Email validation
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
      toast({ title: "Weak Password", description: "Please use a stronger password with mixed characters", variant: "destructive" });
      return;
    }

    // Rate limiting
    const limit = checkLimit();
    if (!limit.allowed) {
      setRateLimitMsg(`Too many attempts. Try again in ${limit.waitSec}s`);
      toast({ title: "Rate Limited", description: `Too many attempts. Wait ${limit.waitSec} seconds.`, variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      if (isOffline) {
        toast({ title: "You're offline", description: "Sign-in needs an internet connection.", variant: "destructive" });
        return;
      }

      // ---- Supabase Cloud auth (email + password) ----
      if (isLogin) {
        const { data, error } = await backend.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPassword,
        });
        if (error) throw error;
        saveLocalUser(cleanEmail, data.user?.id);
        clearExplicitSignOut();
        toast({ title: "Success", description: "Logged in successfully!" });
        setLoading(false);
        await playWelcomeVoice(cleanEmail);
        navigate('/chatbot', { replace: true });
      } else {
        const { data, error } = await backend.auth.signUp({
          email: cleanEmail,
          password: cleanPassword,
        });
        if (error) throw error;
        saveLocalUser(cleanEmail, data.user?.id);
        clearExplicitSignOut();
        toast({ title: "Success", description: "Account created successfully!" });
        setLoading(false);
        await playWelcomeVoice(cleanEmail);
        navigate('/chatbot', { replace: true });
      }
    } catch (error: any) {
      toast({ title: "Authentication Failed", description: error?.message || 'Unknown error', variant: "destructive" });
    } finally { setLoading(false); }
  };


  // Cloud OAuth handler (Google and Apple only)
  const handleFirebaseOAuth = async (provider: 'google' | 'apple') => {
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
        saveLocalUser(data.user.email || '', data.user.id);
        clearExplicitSignOut();
        toast({ title: 'Success', description: 'Logged in successfully!' });
        await playWelcomeVoice(data.user.email || 'User');
        navigate('/chatbot', { replace: true });
      }
    } catch (err: any) {
      toast({ title: 'Authentication Failed', description: err?.message || 'Unknown error', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const showFirebaseOAuth = true;

  const oauthButtons = [
    {
      id: 'google' as const,
      label: 'Google',
      icon: (
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
      ),
    },
    {
      id: 'apple' as const,
      label: 'Apple',
      icon: (
        <svg className="h-4 w-4 shrink-0 fill-current" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.38c.62-.75 1.04-1.8 0.92-2.85-.9.04-1.99.6-2.64 1.35-.57.65-1.07 1.72-.94 2.74 1.01.08 2.04-.5 2.66-1.24z" />
        </svg>
      ),
    },
  ];

  return (
    <GlassMonolithDesign showBack onBack={() => navigate("/")} backLabel="Back to Home">
      <motion.div
        className="w-full"
        variants={authVariants.pageEnter}
        initial="hidden"
        animate="visible"
      >
            {/* Header */}
            <motion.div
              className="mb-8"
              variants={authVariants.headerStagger}
              initial="hidden"
              animate="visible"
            >
              <div className="mb-4 flex items-center gap-3">
                <motion.div
                  variants={authVariants.headerItem}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-gradient-to-br from-primary/20 to-secondary/20"
                  animate={
                    shouldAnimateAmbient
                      ? {
                          boxShadow: [
                            "0 0 0px hsl(var(--primary) / 0)",
                            "0 0 24px hsl(var(--primary) / 0.25)",
                            "0 0 0px hsl(var(--primary) / 0)",
                          ],
                          rotate: [0, 3, -3, 0],
                        }
                      : undefined
                  }
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Lock className="h-5 w-5 text-primary" />
                </motion.div>
                <motion.div variants={authVariants.headerItem} className="flex items-center gap-2">
                  {isOffline ? (
                    <Badge variant="secondary" className="gap-1 border-warning/20 bg-warning/10 text-[10px] text-warning">
                      <WifiOff className="h-3 w-3" /> Offline
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1 border-success/20 bg-success/10 text-[10px] text-success">
                      <motion.span
                        animate={shouldAnimateAmbient ? { scale: [1, 1.15, 1] } : undefined}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="inline-flex"
                      >
                        <Wifi className="h-3 w-3" />
                      </motion.span>{" "}
                      Secure
                    </Badge>
                  )}
                </motion.div>
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={isLogin ? "login-title" : "signup-title"}
                  variants={authVariants.titleSwap}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <h1 className="text-3xl font-bold text-foreground tracking-tight">
                    {enterpriseFlow
                      ? enterpriseTenant.welcomeTitle
                      : isLogin
                        ? "Welcome Back"
                        : "Create Account"}
                  </h1>
                  <p className="text-muted-foreground text-sm mt-1.5">
                    {enterpriseFlow
                      ? enterpriseTenant.signInHint
                      : isLogin
                        ? "Sign in to your AI workspace"
                        : "Set up your zero-knowledge account"}
                  </p>
                </motion.div>
              </AnimatePresence>
            </motion.div>

            {/* Rate limit warning */}
            <AnimatePresence>
              {rateLimitMsg && (
                <motion.div
                  initial={{ opacity: 0, height: 0, x: -8 }}
                  animate={{ opacity: 1, height: "auto", x: 0 }}
                  exit={{ opacity: 0, height: 0, x: 8 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3"
                >
                  <motion.div
                    animate={shouldAnimateAmbient ? { rotate: [0, -8, 8, 0] } : undefined}
                    transition={{ duration: 0.5, repeat: 3 }}
                  >
                    <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
                  </motion.div>
                  <span className="text-xs text-destructive">{rateLimitMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email/Password Form */}
              <motion.form
                  key="email-form"
                  variants={authVariants.formSwap}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  onSubmit={handleAuth}
                  className="space-y-4"
                >
                  <motion.div variants={authVariants.staggerList} initial="hidden" animate="visible" className="space-y-4">
                  <motion.div variants={authVariants.staggerItem}>
                  <AuthAnimatedField label="Email" reduced={reduced}>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-muted/20 border-border/50 h-11 focus:border-primary/50 transition-shadow focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.15)]"
                      disabled={isOffline && !isLogin}
                      maxLength={255}
                      autoComplete="email"
                    />
                  </AuthAnimatedField>
                  </motion.div>

                  <motion.div variants={authVariants.staggerItem}>
                  <AuthAnimatedField label="Password" reduced={reduced}>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-muted/20 border-border/50 h-11 pr-10 focus:border-primary/50 transition-shadow focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.15)]"
                        disabled={isOffline && !isLogin}
                        maxLength={128}
                        autoComplete={isLogin ? "current-password" : "new-password"}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </AuthAnimatedField>

                    {/* Password strength (signup only) */}
                    <AnimatePresence>
                      {!isLogin && password.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-2 space-y-2"
                        >
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                              <motion.div
                                className={cn("h-full rounded-full", strength.color)}
                                initial={{ width: 0 }}
                                animate={{ width: `${strength.pct}%` }}
                                transition={{ duration: 0.3 }}
                              />
                            </div>
                            <span className={cn("text-[10px] font-mono", strength.textColor)}>{strength.label}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-1">
                            {passwordRules.map((rule) => (
                              <div key={rule.label} className="flex items-center gap-1">
                                {rule.test(password) ? (
                                  <CheckCircle2 className="h-3 w-3 text-success shrink-0" />
                                ) : (
                                  <XCircle className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                                )}
                                <span className={cn(
                                  "text-[10px]",
                                  rule.test(password) ? "text-success" : "text-muted-foreground/50"
                                )}>{rule.label}</span>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Confirm password (signup) */}
                  <AnimatePresence>
                    {!isLogin && (
                      <motion.div
                        variants={authVariants.staggerItem}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <AuthAnimatedField label="Confirm Password" reduced={reduced}>
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="••••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={cn(
                              "bg-muted/20 border-border/50 h-11 pr-10 focus:border-primary/50 transition-shadow focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.15)]",
                              confirmPassword && confirmPassword !== password && "border-destructive/50"
                            )}
                            disabled={isOffline}
                            maxLength={128}
                            autoComplete="new-password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                        {confirmPassword && confirmPassword !== password && (
                          <p className="text-[10px] text-destructive mt-1">Passwords do not match</p>
                        )}
                        </AuthAnimatedField>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.div variants={authVariants.staggerItem}>
                  <AuthShimmerButton
                    type="submit"
                    reduced={reduced}
                    disabled={loading || (isOffline && !isLogin) || (isOffline && isLogin && !hasOfflineCredentials)}
                  >
                    {loading ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Authenticating...</>
                    ) : (
                      <><Shield className="h-4 w-4 mr-2" /> {isLogin ? (isOffline ? "Sign In Offline" : "Sign In Securely") : "Create Account"}</>
                    )}
                  </AuthShimmerButton>
                  </motion.div>

                  </motion.div>
                </motion.form>

            {/* Social OAuth buttons */}
            {showFirebaseOAuth && (
              <motion.div
                className="mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="relative flex items-center justify-center my-4">
                  <Separator className="absolute w-full" />
                  <span className="relative bg-background px-3 text-[10px] text-muted-foreground uppercase tracking-wider">or continue with</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {oauthButtons.map((btn) => (
                    <Button
                      key={btn.id}
                      type="button"
                      variant="outline"
                      className="h-11 gap-2.5 border-border/50 bg-muted/20 hover:bg-muted/40 text-sm font-medium hover:border-primary/40 transition-all shadow-sm cursor-pointer"
                      disabled={loading}
                      onClick={() => handleFirebaseOAuth(btn.id)}
                    >
                      {btn.icon}
                      <span>{btn.label}</span>
                    </Button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Toggle */}
            <motion.div
              className="mt-6 text-center"
              whileHover={reduced ? undefined : { scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
            >
              <Button
                variant="link"
                onClick={() => { setIsLogin(!isLogin); setRateLimitMsg(""); }}
                className="text-primary text-sm"
                disabled={isOffline && !isLogin}
              >
                {isLogin ? "Don't have an account? Create one" : "Already have an account? Sign in"}
              </Button>
            </motion.div>

            {/* Security footer */}
            <motion.div
              className="mt-8 flex flex-wrap items-center justify-center gap-4 text-[10px] text-muted-foreground"
              initial="hidden"
              animate="visible"
            >
              {[
                { icon: <Shield className="h-3 w-3 text-success" />, label: "E2E Encrypted" },
                { icon: <Fingerprint className="h-3 w-3 text-primary" />, label: "2FA Ready" },
                {
                  icon: isOffline ? (
                    <WifiOff className="h-3 w-3 text-warning" />
                  ) : (
                    <Zap className={cn("h-3 w-3", hasOfflineCredentials && "text-success")} />
                  ),
                  label: isOffline
                    ? "Mode"
                    : hasOfflineCredentials
                      ? "Ready"
                      : "Not Set Up",
                  className: isOffline
                    ? "text-warning"
                    : hasOfflineCredentials
                      ? "text-success"
                      : undefined,
                },
              ].map((badge, index) => (
                <motion.span
                  key={badge.label}
                  variants={authVariants.securityBadge(index)}
                  initial="hidden"
                  animate="visible"
                  whileHover={reduced ? undefined : { scale: 1.06, y: -1 }}
                  className={cn("flex items-center gap-1", badge.className)}
                >
                  {badge.icon} {badge.label}
                </motion.span>
              ))}
            </motion.div>
      </motion.div>
    </GlassMonolithDesign>
  );
};

export default AuthPage;
