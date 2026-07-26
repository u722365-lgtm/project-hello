import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import {
  ShieldCheck, Lock, BadgeCheck, MessageCircle, Check,
  CreditCard, Wallet, Clock, Copy, ArrowRight, Star, Crown, Rocket
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/components/AuthProvider";
import {
  SUBSCRIPTION_TIERS, CREDIT_PACKAGES, PAY_PER_SOLUTIONS, API_PLANS, WHITELABEL_PLANS,
} from "@/lib/monetization";
import Navigation from "@/components/Navigation";
import { PaymentDetailsPanel } from "@/components/payments/PaymentDetailsPanel";
import { PaymentProofOptions } from "@/components/payments/PaymentProofOptions";
import { PaymentGuaranteeBar } from "@/components/payments/PaymentGuaranteeBar";
import { PaymentFounderCard } from "@/components/payments/PaymentFounderCard";
import { PaymentStatusPanel } from "@/components/payments/PaymentStatusPanel";
import { PaymentTrustFAQ } from "@/components/payments/PaymentTrustFAQ";
import { CheckoutConfirmation } from "@/components/payments/CheckoutConfirmation";
import { InternationalCardButton } from "@/components/payments/InternationalCardButton";
import { PKR_MONTHLY, type PaidPlanId } from "@/lib/payments/planPricing";
import SEOHead from "@/components/SEOHead";
import { PAGE_SEO } from "@/lib/seo";

const VALID_PLAN_IDS = new Set(["free", "pro", "premium", "elite"]);

type CheckoutStep = "plan" | "payment" | "proof" | "submitted";

const FounderAccessPage = () => {
  const [searchParams] = useSearchParams();
  const [selectedTier, setSelectedTier] = useState<string>("premium");
  const [activePaymentMethod, setActivePaymentMethod] = useState<string>("bank");
  const [invoiceDraftId, setInvoiceDraftId] = useState<string | null>(null);
  const [step, setStep] = useState<CheckoutStep>("plan");
  const [submitted, setSubmitted] = useState(false);
  const [txRef, setTxRef] = useState("");
  const [phone, setPhone] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const plan = searchParams.get("plan")?.toLowerCase();
    if (plan === "lifetime") {
      setSelectedTier("elite");
      return;
    }
    if (plan && VALID_PLAN_IDS.has(plan)) {
      setSelectedTier(plan);
    }
  }, [searchParams]);

  useEffect(() => {
    setInvoiceDraftId(null);
    setSubmitted(false);
    setStep("plan");
  }, [selectedTier, activePaymentMethod]);

  const selectedProduct = useMemo(() => {
    const tier = SUBSCRIPTION_TIERS.find(t => t.id === selectedTier);
    if (tier) return { name: tier.name, price: tier.price, period: tier.period };
    if (selectedTier.startsWith("credits-")) {
      const pkg = CREDIT_PACKAGES.find(p => `credits-${p.id}` === selectedTier);
      if (pkg) return { name: `${pkg.credits} Credits`, price: pkg.price, period: "one-time" };
    }
    if (selectedTier.startsWith("solution-")) {
      const s = PAY_PER_SOLUTIONS.find(sol => `solution-${sol.id}` === selectedTier);
      if (s) return { name: s.name, price: s.priceRange, period: "one-time" };
    }
    if (selectedTier.startsWith("api-")) {
      const p = API_PLANS.find(ap => `api-${ap.id}` === selectedTier);
      if (p) return { name: p.name, price: p.price, period: "/month" };
    }
    if (selectedTier.startsWith("wl-")) {
      const p = WHITELABEL_PLANS.find(wp => `wl-${wp.id}` === selectedTier);
      if (p) return { name: p.name, price: p.price, period: p.period };
    }
    return { name: "Elite", price: 20, period: "/month" };
  }, [selectedTier]);

  const isSubscription = ["pro", "premium", "elite"].includes(selectedTier);
  const pkrEstimate = isSubscription ? PKR_MONTHLY[selectedTier as PaidPlanId] : 0;
  const invoiceNumber = invoiceDraftId ? invoiceDraftId.split("/")[0] : null;
  const canSubmit = txRef.trim().length > 0 && file !== null;
  const stepIndex = step === "plan" ? 1 : step === "payment" ? 2 : step === "proof" ? 3 : 4;

  return (
    <div className="min-h-screen bg-background relative">
      <SEOHead meta={PAGE_SEO.founderAccess} structuredData={undefined} />
      <Navigation />

      <div className="relative pt-20 pb-16">
        <div className="container max-w-3xl mx-auto px-4">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <Badge variant="secondary" className="gap-1.5 text-xs"><ShieldCheck className="h-3.5 w-3.5" />Verified checkout</Badge>
            <Badge variant="secondary" className="gap-1.5 text-xs"><Clock className="h-3.5 w-3.5" />24h activation</Badge>
            <Badge variant="secondary" className="gap-1.5 text-xs"><Lock className="h-3.5 w-3.5" />Refund guarantee</Badge>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Checkout</h1>
            <p className="text-muted-foreground mt-2">You are not charged until payment is verified. Choose your plan and preferred payment method.</p>
          </div>

          <Card className="mb-6 border-[hsl(var(--border))] bg-[hsl(var(--card)/0.6)]">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {["Plan", "Payment", "Proof", "Verified"].map((label, i) => (
                  <div key={label} className="flex items-center gap-2 flex-1">
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold border ${i + 1 <= stepIndex ? "bg-primary text-primary-foreground border-primary" : "bg-background border-[hsl(var(--border))]"}`}>{i + 1}</div>
                    <span className={`${i + 1 === stepIndex ? "font-semibold text-foreground" : ""}`}>{label}</span>
                    {i < 3 && <Separator className="flex-1 bg-[hsl(var(--border))]" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-[hsl(var(--border))] bg-[hsl(var(--card)/0.6)]">
              <CardHeader className="pb-3 border-b border-[hsl(var(--border))]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-semibold">Order</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">{selectedProduct.name} · {selectedProduct.period === "one-time" ? "One-time purchase" : selectedProduct.period}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-3xl font-bold leading-none">{selectedProduct.price === 0 ? "Free" : `$${selectedProduct.price}`}</p>
                    {selectedProduct.period && <p className="text-[11px] text-muted-foreground mt-1">{selectedProduct.period === "one-time" ? "One-time purchase" : selectedProduct.period}</p>}
                    {pkrEstimate > 0 && <p className="text-[11px] text-muted-foreground mt-1">≈ Rs {pkrEstimate.toLocaleString()} PK</p>}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-5">
                <Tabs defaultValue="subscriptions">
                  <TabsList className="grid grid-cols-5 mb-5 bg-[hsl(var(--muted))] p-1 rounded-xl">
                    <TabsTrigger value="subscriptions" className="text-xs rounded-lg" onClick={() => setSelectedTier("premium")}>Plans</TabsTrigger>
                    <TabsTrigger value="credits" className="text-xs rounded-lg">Credits</TabsTrigger>
                    <TabsTrigger value="solutions" className="text-xs rounded-lg">Solutions</TabsTrigger>
                    <TabsTrigger value="api" className="text-xs rounded-lg">API</TabsTrigger>
                    <TabsTrigger value="whitelabel" className="text-xs rounded-lg">License</TabsTrigger>
                  </TabsList>
                  <TabsContent value="subscriptions" className="mt-0">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {SUBSCRIPTION_TIERS.filter(t => t.id !== "free").map((tier) => {
                        const isSelected = selectedTier === tier.id;
                        const icon = tier.id === "pro" ? Star : tier.id === "premium" ? Rocket : Crown;
                        return (
                          <button
                            key={tier.id}
                            type="button"
                            onClick={() => { setSelectedTier(tier.id); setStep("plan"); }}
                            className={`rounded-xl p-4 text-left border-2 transition-all ${isSelected ? "border-primary bg-primary/10" : "border-[hsl(var(--border))]"}`}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${isSelected ? "bg-primary text-primary-foreground" : "bg-[hsl(var(--muted))]"}`}>
                                <icon className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-semibold text-sm">{tier.name}</p>
                                <p className="text-[10px] text-muted-foreground">{tier.period}</p>
                              </div>
                            </div>
                            <p className="text-xl font-bold">${tier.price}</p>
                            {(["pro", "premium", "elite"] as PaidPlanId[]).includes(tier.id as PaidPlanId) && (
                              <p className="text-[10px] text-muted-foreground mt-1">≈ Rs {PKR_MONTHLY[tier.id as PaidPlanId].toLocaleString()} PK</p>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <CheckoutConfirmation
              planName={selectedProduct.name}
              invoiceNumber={invoiceNumber}
              receiptSubmitted={submitted}
              paymentStatus={submitted ? "pending" : undefined}
            />

            <Card className="border-[hsl(var(--border))] bg-[hsl(var(--card)/0.6)]">
              <CardHeader className="pb-3 border-b border-[hsl(var(--border))]">
                <CardTitle className="text-base font-semibold">Payment method</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">Choose your preferred payment method.</p>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <PaymentDetailsPanel
                  planKey={selectedTier}
                  selectedProductName={selectedProduct.name}
                  activePaymentMethod={activePaymentMethod as any}
                  onPaymentMethodChange={(id) => setActivePaymentMethod(id)}
                  onInvoiceDraft={(draft) => { setInvoiceDraftId(draft.invoiceNumber); setStep("payment"); }}
                />
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => setStep("proof")} disabled={!invoiceDraftId}>Continue to upload proof</Button>
                  <InternationalCardButton planKey={selectedTier} />
                </div>
              </CardContent>
            </Card>

            <AnimatePresence>
              {step === "proof" && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 0 }} className="space-y-4">
                  <Card className="border-[hsl(var(--border))] bg-[hsl(var(--card)/0.6)]">
                    <CardHeader className="pb-3 border-b border-[hsl(var(--border))]">
                      <CardTitle className="text-base font-semibold">Confirm payment</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">Submit your receipt and transaction reference. Not verified within 24h? Message us for a full refund within 7 days.</p>
                    </CardHeader>
                    <CardContent className="p-5 space-y-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Amount</Label>
                          <Input value={file ? amount : ""} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder={`${activePaymentMethod === "mobile" || activePaymentMethod === "bank" ? `Rs ${pkrEstimate}` : `$${selectedProduct.price}`}`} />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Transaction ID / reference</Label>
                          <Input value={txRef} onChange={(e) => setTxRef(e.target.value)} placeholder="e.g. TID123456789" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Receipt screenshot</Label>
                        <Input type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                        {file && <p className="text-xs text-muted-foreground">{file.name}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Your phone (optional)</Label>
                        <Input placeholder="03XX XXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button onClick={() => setSubmitted(true)} disabled={submitting || !canSubmit}>{submitting ? "Submitting…" : "Confirm & submit receipt"}</Button>
                        <Button variant="outline" asChild><a href="https://wa.me/923211798561" target="_blank" rel="noopener noreferrer"><MessageCircle className="h-4 w-4 text-[#25D366]" /> WhatsApp support</a></Button>
                      </div>
                    </CardContent>
                  </Card>

                  <PaymentProofOptions
                    planKey={selectedTier}
                    currency={activePaymentMethod === "mobile" || activePaymentMethod === "bank" ? "PKR" : "USD"}
                    activePaymentMethod={activePaymentMethod as any}
                    userEmail={null}
                    invoiceDraftId={invoiceDraftId}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {submitted && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 0 }} className="space-y-4">
                  <Card className="border-green-500/30 bg-green-500/5">
                    <CardContent className="p-6 flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-600 shrink-0" />
                      <div>
                        <p className="font-semibold text-sm">Receipt submitted</p>
                        <p className="text-xs text-muted-foreground mt-1">We verify within 24h. If not, message us on WhatsApp for a full refund within 7 days.</p>
                      </div>
                    </CardContent>
                  </Card>
                  <PaymentStatusPanel />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-4">
              <PaymentFounderCard planKey={selectedTier} />
              <PaymentTrustFAQ />
              <PaymentGuaranteeBar />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FounderAccessPage;
