import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, Phone, CheckCircle2, Loader2, Send,
  Unlink, RefreshCw, Shield, ExternalLink, Copy, Check, QrCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { backend } from "@/integrations/local/client";
import { useToast } from "@/hooks/use-toast";
import {
  startWhatsAppQrSession,
  refreshWhatsAppQr,
  pollWhatsAppQrStatus,
  unlinkWhatsAppQr,
} from "@/lib/whatsappQr";

interface WhatsAppLink {
  id: string;
  phone_number: string;
  is_verified: boolean;
  is_active: boolean;
  last_message_at: string | null;
  message_count: number;
  created_at: string;
  connection_type?: string;
  qr_status?: string | null;
}

type Step = "idle" | "qr" | "phone" | "code" | "linked";

const POLL_MS = 2500;

export const WhatsAppConnect = () => {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("idle");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [link, setLink] = useState<WhatsAppLink | null>(null);
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [qrStatus, setQrStatus] = useState<string>("pending");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const WHATSAPP_BOT_NUMBER = import.meta.env.VITE_TWILIO_WHATSAPP_NUMBER || "+14155238886";

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const fetchLink = useCallback(async () => {
    const { data: { user } } = await backend.auth.getUser();
    if (!user) return;

    const { data } = await backend
      .from("whatsapp_links")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (data) {
      const row = data as WhatsAppLink;
      setLink(row);
      if (row.is_verified) {
        setStep("linked");
      } else if (row.connection_type === "qr") {
        setStep("qr");
        setQrStatus(row.qr_status ?? "pending");
      } else {
        setStep("code");
        setPhoneNumber(row.phone_number);
      }
    }
  }, []);

  useEffect(() => {
    fetchLink();
    return () => stopPolling();
  }, [fetchLink, stopPolling]);

  const callWebhook = async (action: string, extraParams: Record<string, string> = {}) => {
    const { data: { user } } = await backend.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data: { session } } = await backend.auth.getSession();

    const response = await fetch(
      '',
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ action, userId: user.id, ...extraParams }),
      },
    );

    return response.json();
  };

  const beginQrPolling = useCallback(() => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      const result = await pollWhatsAppQrStatus();
      if (result.status) setQrStatus(result.status);
      if (result.status === "connected" || result.phoneNumber) {
        stopPolling();
        await fetchLink();
        setStep("linked");
        toast({
          title: "WhatsApp connected!",
          description: result.phoneNumber
            ? `Linked to ${result.phoneNumber}`
            : "Your WhatsApp is now connected to ShadowTalk",
        });
      }
    }, POLL_MS);
  }, [fetchLink, stopPolling, toast]);

  // Resume QR session after page refresh
  useEffect(() => {
    if (step !== "qr" || qrDataUrl) return;
    void (async () => {
      const result = await refreshWhatsAppQr();
      if (result.qrDataUrl) setQrDataUrl(result.qrDataUrl);
      if (result.pairingCode) setPairingCode(result.pairingCode);
      beginQrPolling();
    })();
  }, [step, qrDataUrl, beginQrPolling]);

  const handleStartQr = async () => {
    setIsLoading(true);
    setQrDataUrl(null);
    setPairingCode(null);
    try {
      const result = await startWhatsAppQrSession();
      if (result.error) {
        toast({
          title: result.configured === false ? "QR connect not configured" : "Could not start QR session",
          description: result.error,
          variant: "destructive",
        });
        return;
      }
      setQrDataUrl(result.qrDataUrl ?? null);
      setPairingCode(result.pairingCode ?? null);
      setQrStatus(result.status ?? "pending");
      setStep("qr");
      beginQrPolling();
    } catch {
      toast({ title: "Failed to start QR session", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshQr = async () => {
    setIsLoading(true);
    try {
      const result = await refreshWhatsAppQr();
      if (result.error) {
        toast({ title: "Could not refresh QR", description: result.error, variant: "destructive" });
        return;
      }
      setQrDataUrl(result.qrDataUrl ?? null);
      setPairingCode(result.pairingCode ?? null);
      setQrStatus("pending");
      beginQrPolling();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendCode = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast({ title: "Enter a valid phone number", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const formatted = phoneNumber.startsWith("+") ? phoneNumber : `+${phoneNumber}`;
      const result = await callWebhook("link", { phoneNumber: formatted });

      if (result.error) {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      } else {
        setStep("code");
        toast({ title: "Code sent!", description: "Check your WhatsApp for the verification code" });
      }
    } catch {
      toast({ title: "Failed to send code", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
      toast({ title: "Enter the 6-digit code", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const formatted = phoneNumber.startsWith("+") ? phoneNumber : `+${phoneNumber}`;
      const result = await callWebhook("verify", { phoneNumber: formatted, code: verificationCode });

      if (result.error) {
        toast({ title: "Verification failed", description: result.error, variant: "destructive" });
      } else {
        setStep("linked");
        await fetchLink();
        toast({ title: "WhatsApp linked!", description: "You can now chat with ShadowTalk via WhatsApp" });
      }
    } catch {
      toast({ title: "Verification failed", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlink = async () => {
    setIsLoading(true);
    stopPolling();
    try {
      if (link?.connection_type === "qr") {
        await unlinkWhatsAppQr();
      } else {
        await callWebhook("unlink", { phoneNumber: link?.phone_number || "" });
      }
      setLink(null);
      setStep("idle");
      setPhoneNumber("");
      setVerificationCode("");
      setQrDataUrl(null);
      toast({ title: "WhatsApp unlinked" });
    } catch {
      toast({ title: "Failed to unlink", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const copyNumber = () => {
    navigator.clipboard.writeText(WHATSAPP_BOT_NUMBER);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openWhatsApp = () => {
    window.open(`https://wa.me/${WHATSAPP_BOT_NUMBER.replace("+", "")}?text=Hi%20ShadowTalk`, "_blank");
  };

  return (
    <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-green-500/5">
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold flex items-center gap-2">
              WhatsApp
              {step === "linked" && (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px]">
                  Connected
                </Badge>
              )}
            </h4>
            <p className="text-xs text-muted-foreground">Chat with ShadowTalk AI from your WhatsApp</p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              <p className="text-sm text-muted-foreground">
                Connect your personal WhatsApp by scanning a QR code (like WhatsApp Web), or link via phone verification.
              </p>

              <Button
                onClick={handleStartQr}
                disabled={isLoading}
                className="w-full gap-2 bg-green-600 hover:bg-green-700 h-11"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
                Scan QR Code to Connect
              </Button>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep("phone")} className="flex-1 gap-2">
                  <Phone className="h-4 w-4" />
                  Link with phone code
                </Button>
                <Button variant="outline" onClick={openWhatsApp} className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Open Chat
                </Button>
              </div>

              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                <span className="text-xs text-muted-foreground flex-1">
                  Twilio bot: <span className="font-mono font-medium text-foreground">{WHATSAPP_BOT_NUMBER}</span>
                </span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyNumber}>
                  {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
            </motion.div>
          )}

          {step === "qr" && (
            <motion.div
              key="qr"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="text-sm text-muted-foreground space-y-2">
                <p className="font-medium text-foreground">Link your WhatsApp</p>
                <ol className="list-decimal list-inside text-xs space-y-1">
                  <li>Open WhatsApp on your phone</li>
                  <li>Tap <strong>Settings → Linked devices → Link a device</strong></li>
                  <li>Scan this QR code</li>
                </ol>
              </div>

              <div className="flex flex-col items-center gap-3">
                <div className="w-56 h-56 rounded-xl border border-border/60 bg-white flex items-center justify-center overflow-hidden">
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="WhatsApp QR code" className="w-full h-full object-contain" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span className="text-xs">Generating QR…</span>
                    </div>
                  )}
                </div>

                {pairingCode && (
                  <p className="text-xs text-muted-foreground">
                    Or enter pairing code: <span className="font-mono font-bold text-foreground">{pairingCode}</span>
                  </p>
                )}

                <Badge variant="secondary" className="text-[10px]">
                  {qrStatus === "scanned" ? "QR scanned — finishing connection…" : "Waiting for scan…"}
                </Badge>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { stopPolling(); setStep("idle"); }} className="flex-1">
                  Back
                </Button>
                <Button
                  variant="outline"
                  onClick={handleRefreshQr}
                  disabled={isLoading}
                  className="flex-1 gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                  New QR
                </Button>
              </div>
            </motion.div>
          )}

          {step === "phone" && (
            <motion.div
              key="phone"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              <p className="text-sm text-muted-foreground">
                Enter your WhatsApp phone number with country code (e.g., +923001234567)
              </p>
              <Input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+923001234567"
                className="font-mono"
              />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep("idle")} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={handleSendCode}
                  disabled={isLoading || phoneNumber.length < 10}
                  className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Send Code
                </Button>
              </div>
            </motion.div>
          )}

          {step === "code" && (
            <motion.div
              key="code"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              <p className="text-sm text-muted-foreground">
                Enter the 6-digit code sent to your WhatsApp ({phoneNumber})
              </p>
              <Input
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                className="font-mono text-center text-lg tracking-[0.5em]"
                maxLength={6}
              />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep("phone")} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={handleVerify}
                  disabled={isLoading || verificationCode.length !== 6}
                  className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Verify
                </Button>
              </div>
              <Button
                variant="link"
                size="sm"
                className="w-full text-xs"
                onClick={handleSendCode}
                disabled={isLoading}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Resend code
              </Button>
            </motion.div>
          )}

          {step === "linked" && link && (
            <motion.div
              key="linked"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-green-400">
                    Linked to {link.phone_number.startsWith("+qr-") ? "your WhatsApp" : link.phone_number}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {link.connection_type === "qr" ? "QR connection" : "Phone verification"}
                    {" · "}
                    {link.message_count} messages
                    {link.last_message_at ? ` · Last: ${new Date(link.last_message_at).toLocaleDateString()}` : ""}
                  </p>
                </div>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p className="flex items-center gap-1">
                  <Shield className="h-3 w-3" /> Commands: /help, /search, /status
                </p>
                <p>Message ShadowTalk from WhatsApp — AI replies in your chat</p>
              </div>

              <div className="flex gap-2">
                {link.connection_type !== "qr" && (
                  <Button variant="outline" onClick={openWhatsApp} className="flex-1 gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Open Chat
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={handleUnlink}
                  disabled={isLoading}
                  className="flex-1 gap-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <Unlink className="h-4 w-4" />
                  Unlink
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};
