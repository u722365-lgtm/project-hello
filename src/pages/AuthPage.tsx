import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { isLocalFirst, signInWithRemoteProvider, signInWithLocalPreferredProvider } from "@/lib/remoteAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Eye, EyeOff, WifiOff, Wifi, Loader2, Shield, Zap, Lock, CheckCircle2, XCircle, AlertTriangle, Fingerprint, Smartphone, Mail, KeyRound } from "lucide-react";
import { useOfflineAuth } from "@/hooks/useOfflineAuth";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuthMotion } from "@/hooks/useAuthMotion";
import { GlassMonolithDesign } from "@/components/auth/designs/GlassMonolithDesign";
import { setStoredAuthDesignChoice } from "@/lib/authDesigns";
import { AuthModeTabs, type AuthTabKey } from "@/components/auth/AuthModeTabs";
import { AuthAnimatedField } from "@/components/auth/AuthAnimatedField";
import { AuthShimmerButton } from "@/components/auth/AuthShimmerButton";
import { clearExplicitSignOut, consumeReturnPath, isAnonymousUser } from "@/lib/persistentAuth";
import { isEnterpriseDeployment } from "@/hooks/useEnterpriseExperience";
import { ENTERPRISE_TENANTS, isEnterpriseEmail } from "@/lib/enterpriseTenants";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

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
  const enterpriseFlow =
    isEnterpriseDeployment() || searchParams.get("enterprise") === "1";
  const enterpriseTenant = ENTERPRISE_TENANTS[0];
  const [isLogin, setIsLogin] = useState(true);
  const [authMode, setAuthMode] = useState<'email' | 'phone' | 'magiclink'>('email');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rateLimitMsg, setRateLimitMsg] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const { isOffline, hasOfflineCredentials, saveCredentialsForOffline, verifyOfflineCredentials, getOfflineSession } = useOfflineAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const { checkLimit } = useRateLimiter(5, 60000);
  const authMotion = useAuthMotion();
  const { reduced, variants: authVariants, shouldAnimateAmbient } = authMotion;

  useEffect(() => {
    setStoredAuthDesignChoice("glass-monolith");
  }, []);

  const strength = getPasswordStrength(password);

  const authTabs = [
    { key: "email" as const, icon: <KeyRound className="h-3.5 w-3.5" />, label: "Email" },
    { key: "phone" as const, icon: <Smartphone className="h-3.5 w-3.5" />, label: "Phone OTP" },
    { key: "magiclink" as const, icon: <Mail className="h-3.5 w-3.5" />, label: "Magic Link" },
  ];

  const handleAuthTabChange = (key: AuthTabKey) => {
    setAuthMode(key);
    setRateLimitMsg("");
    setOtpSent(false);
    setMagicLinkSent(false);
  };

  useEffect(() => {
    if (enterpriseFlow) {
      setIsLogin(true);
      setAuthMode("magiclink");
    }
  }, [enterpriseFlow]);

  useEffect(() => {
    const checkUser = async () => {
      const offlineSession = getOfflineSession();
      if (offlineSession) { navigate('/chatbot'); return; }
      if (!isOffline) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && !isAnonymousUser(session)) {
          navigate(consumeReturnPath());
        }
      }
    };
    checkUser();
  }, [navigate, isOffline, getOfflineSession]);

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
        if (!isLogin) { toast({ title: "Offline", description: "You need to be online to create an account", variant: "destructive" }); return; }
        const result = await verifyOfflineCredentials(cleanEmail, cleanPassword);
        if (result.success) { toast({ title: "Success", description: "Logged in offline!" }); navigate('/chatbot'); }
        else { toast({ title: "Error", description: result.error, variant: "destructive" }); }
        return;
      }
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password: cleanPassword });
        if (error) throw error;
        if (data.user) await saveCredentialsForOffline(cleanEmail, cleanPassword, data.user.id);
        clearExplicitSignOut();
        toast({ title: "Success", description: "Logged in successfully!" });
        setLoading(false);
        await playWelcomeVoice(cleanEmail);
        navigate(consumeReturnPath());
      } else {
        const { data, error } = await supabase.auth.signUp({ email: cleanEmail, password: cleanPassword, options: { emailRedirectTo: `${window.location.origin}/` } });
        if (error) throw error;
        if (data.user && data.session) {
          await saveCredentialsForOffline(cleanEmail, cleanPassword, data.user.id);
          const { startSilentTierAInstall } = await import("@/lib/offline/tierAInstall");
          startSilentTierAInstall();
          clearExplicitSignOut();
          toast({ title: "Success", description: "Account created! Offline AI installs in the background." });
          setLoading(false);
          await playWelcomeVoice(cleanEmail);
          navigate(consumeReturnPath());
        } else {
          toast({ title: "Success", description: "Check your email to confirm!" });
        }
      }
    } catch (error: any) {
      toast({ title: "Authentication Failed", description: error.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const handleGoogleSignIn = async () => {
    if (isOffline) { toast({ title: "Offline", description: "Google sign-in requires internet connection", variant: "destructive" }); return; }
    setGoogleLoading(true);
    try {
      const result = isLocalFirst() ? await signInWithLocalPreferredProvider() : await signInWithRemoteProvider("google", { redirect_uri: window.location.origin });
      if ((result as any)?.error) toast({ title: "Error", description: (result as any).error?.message ?? (result as any).error, variant: "destructive" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to sign in with Google", variant: "destructive" });
    } finally { setGoogleLoading(false); }
  };

  const handleAppleSignIn = async () => {
    if (isOffline) { toast({ title: "Offline", description: "Apple sign-in requires internet connection", variant: "destructive" }); return; }
    setAppleLoading(true);
    try {
      const result = isLocalFirst() ? await signInWithLocalPreferredProvider() : await signInWithRemoteProvider("apple", { redirect_uri: window.location.origin });
      if ((result as any)?.error) toast({ title: "Error", description: (result as any).error?.message ?? (result as any).error, variant: "destructive" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to sign in with Apple", variant: "destructive" });
    } finally { setAppleLoading(false); }
  };

  const handleSendPhoneOTP = async () => {
    if (!phoneNumber || !/^\+\d{10,15}$/.test(phoneNumber)) {
      toast({ title: "Error", description: "Enter a valid phone number with country code (e.g. +1234567890)", variant: "destructive" });
      return;
    }
    const limit = checkLimit();
    if (!limit.allowed) {
      setRateLimitMsg(`Too many attempts. Try again in ${limit.waitSec}s`);
      return;
    }
    setLoading(true);
    try {
      const res = await supabase.functions.invoke('phone-otp', {
        body: { action: 'send', phone: phoneNumber },
      });
      if (res.error || res.data?.error) throw new Error(res.data?.error || 'Failed to send OTP');
      setOtpSent(true);
      toast({ title: "OTP Sent", description: "Check your phone for the verification code" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const handleVerifyPhoneOTP = async () => {
    if (!otpCode || otpCode.length !== 6) {
      toast({ title: "Error", description: "Enter the 6-digit code", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await supabase.functions.invoke('phone-otp', {
        body: { action: 'verify', phone: phoneNumber, code: otpCode },
      });
      if (res.error || res.data?.error) throw new Error(res.data?.error || 'Verification failed');
      if (res.data?.verified) {
        toast({ title: "Verified!", description: res.data.user_exists 
          ? "Phone verified! Sign in with your email to continue." 
          : "Phone verified! Create an account with your email." 
        });
        setAuthMode('email');
        setOtpSent(false);
        setOtpCode("");
      }
    } catch (error: any) {
      toast({ title: "Verification Failed", description: error.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = sanitizeInput(email);
    if (!cleanEmail) {
      toast({ title: "Error", description: "Enter your email address", variant: "destructive" });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      toast({ title: "Error", description: "Enter a valid email address", variant: "destructive" });
      return;
    }
    if (enterpriseFlow && !isEnterpriseEmail(cleanEmail)) {
      toast({
        title: "Use your work email",
        description: "Sign in with your official company email (e.g. you@shanfoods.com).",
        variant: "destructive",
      });
      return;
    }
    const limit = checkLimit();
    if (!limit.allowed) {
      setRateLimitMsg(`Too many attempts. Try again in ${limit.waitSec}s`);
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ 
        email: cleanEmail,
        options: { emailRedirectTo: `${window.location.origin}/chatbot` }
      });
      if (error) throw error;
      setMagicLinkSent(true);
      toast({ title: "Magic Link Sent", description: "Check your email for the sign-in link" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

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
                        ? "Sign in to your sovereign AI workspace"
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

            <AuthModeTabs
              tabs={authTabs}
              active={authMode}
              onChange={handleAuthTabChange}
              reduced={reduced}
            />

            {/* Email/Password Form */}
            <AnimatePresence mode="wait">
              {authMode === 'email' && (
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

                  <motion.div variants={authVariants.staggerItem} className="relative my-6">
                    <Separator className="bg-border/20" />
                    <motion.span
                      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card/80 backdrop-blur-sm px-3 text-[10px] text-muted-foreground uppercase tracking-wider"
                      animate={shouldAnimateAmbient ? { opacity: [0.6, 1, 0.6] } : undefined}
                      transition={{ duration: 2.5, repeat: Infinity }}
                    >
                      or
                    </motion.span>
                  </motion.div>

                  <div className="grid grid-cols-2 gap-3">
                    <motion.div variants={authVariants.oauthItem(0)} initial="hidden" animate="visible" whileHover={reduced ? undefined : { y: -2 }}>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 w-full gap-2 border-border/30 bg-muted/10 transition-shadow hover:border-primary/30 hover:bg-muted/20 hover:shadow-[0_8px_24px_hsl(var(--primary)/0.12)]"
                      onClick={handleGoogleSignIn}
                      disabled={googleLoading || isOffline}
                    >
                      {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                        <svg className="h-4 w-4" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                      )}
                      <span className="text-sm">Google</span>
                    </Button>
                    </motion.div>
                    <motion.div variants={authVariants.oauthItem(1)} initial="hidden" animate="visible" whileHover={reduced ? undefined : { y: -2 }}>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 w-full gap-2 border-border/30 bg-muted/10 transition-shadow hover:border-primary/30 hover:bg-muted/20 hover:shadow-[0_8px_24px_hsl(var(--primary)/0.12)]"
                      onClick={handleAppleSignIn}
                      disabled={appleLoading || isOffline}
                    >
                      {appleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                        </svg>
                      )}
                      <span className="text-sm">Apple</span>
                    </Button>
                    </motion.div>
                  </div>
                  </motion.div>
                </motion.form>
              )}

              {/* Phone OTP Form */}
              {authMode === 'phone' && (
                <motion.div
                  key="phone-form"
                  variants={authVariants.formSwap}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="space-y-4"
                >
                  {!otpSent ? (
                    <>
                      <AuthAnimatedField label="Phone Number" reduced={reduced}>
                        <Input
                          type="tel"
                          placeholder="+1234567890"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="bg-muted/20 border-border/50 h-11 focus:border-primary/50 transition-shadow focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.15)]"
                          maxLength={16}
                        />
                        <p className="text-[10px] text-muted-foreground mt-1.5">Include country code (e.g. +1 for US, +91 for India)</p>
                      </AuthAnimatedField>
                      <AuthShimmerButton
                        type="button"
                        reduced={reduced}
                        onClick={handleSendPhoneOTP}
                        disabled={loading || isOffline}
                      >
                        {loading ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending OTP...</>
                        ) : (
                          <><Smartphone className="h-4 w-4 mr-2" /> Send OTP Code</>
                        )}
                      </AuthShimmerButton>
                    </>
                  ) : (
                    <>
                      <div className="text-center space-y-3">
                        <motion.div
                          initial={{ scale: 0, rotate: -12 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={authMotion.springSnappy}
                          className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto"
                        >
                          <Smartphone className="h-7 w-7 text-primary" />
                        </motion.div>
                        <div>
                          <p className="text-sm font-medium text-foreground">Enter verification code</p>
                          <p className="text-xs text-muted-foreground mt-1">Sent to {phoneNumber}</p>
                        </div>
                      </div>
                      <div className="flex justify-center">
                        <InputOTP maxLength={6} value={otpCode} onChange={(value) => setOtpCode(value)}>
                          <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                          </InputOTPGroup>
                        </InputOTP>
                      </div>
                      <AuthShimmerButton
                        type="button"
                        reduced={reduced}
                        onClick={handleVerifyPhoneOTP}
                        disabled={loading || otpCode.length !== 6}
                      >
                        {loading ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Verifying...</>
                        ) : (
                          <><Shield className="h-4 w-4 mr-2" /> Verify Code</>
                        )}
                      </AuthShimmerButton>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          className="text-xs text-muted-foreground"
                          onClick={() => { setOtpSent(false); setOtpCode(""); }}
                        >
                          Change number
                        </Button>
                        <span className="text-muted-foreground/30">•</span>
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          className="text-xs text-primary"
                          onClick={handleSendPhoneOTP}
                          disabled={loading}
                        >
                          Resend code
                        </Button>
                      </div>
                    </>
                  )}
                </motion.div>
              )}

              {/* Magic Link Form */}
              {authMode === 'magiclink' && (
                <motion.form
                  key="magiclink-form"
                  variants={authVariants.formSwap}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  onSubmit={handleMagicLink}
                  className="space-y-4"
                >
                  {!magicLinkSent ? (
                    <>
                      <AuthAnimatedField label="Email Address" reduced={reduced}>
                        <Input
                          type="email"
                          placeholder={enterpriseFlow ? "you@shanfoods.com" : "you@example.com"}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="bg-muted/20 border-border/50 h-11 focus:border-primary/50 transition-shadow focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.15)]"
                          maxLength={255}
                          autoComplete="email"
                        />
                        <p className="text-[10px] text-muted-foreground mt-1.5">
                          {enterpriseFlow
                            ? "Use your official work email — we'll send a secure sign-in link"
                            : "We'll send a secure sign-in link to your inbox"}
                        </p>
                      </AuthAnimatedField>
                      <AuthShimmerButton type="submit" reduced={reduced} disabled={loading || isOffline}>
                        {loading ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending...</>
                        ) : (
                          <><Mail className="h-4 w-4 mr-2" /> Send Magic Link</>
                        )}
                      </AuthShimmerButton>
                    </>
                  ) : (
                    <div className="text-center space-y-4 py-4">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", damping: 12 }}
                        className="w-16 h-16 rounded-2xl bg-success/10 border border-success/20 flex items-center justify-center mx-auto"
                      >
                        <Mail className="h-8 w-8 text-success" />
                      </motion.div>
                      <div>
                        <p className="text-base font-semibold text-foreground">Check your email</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          We sent a sign-in link to <span className="text-foreground font-medium">{email}</span>
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">Didn't receive it? Check spam or</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => { setMagicLinkSent(false); }}
                        className="text-xs"
                      >
                        Try again
                      </Button>
                    </div>
                  )}
                </motion.form>
              )}
            </AnimatePresence>

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
                    ? "Offline Mode"
                    : hasOfflineCredentials
                      ? "Offline Ready"
                      : "Offline Not Set Up",
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
