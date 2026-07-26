import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { 
  Shield, Copy, Check, MessageCircle, 
  Zap, Lock, Plane, Bot, Palette, Crown, Globe, 
  Wallet, Building2, Smartphone, ArrowRight, Star,
  Coins, Code, FileText, Users, Rocket, Timer, Sparkles,
  CreditCard, BadgeCheck, Clock, ChevronRight, Landmark,
  ShieldCheck, Verified, ArrowUpRight, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/components/AuthProvider";
import { 
  SUBSCRIPTION_TIERS, 
  CREDIT_PACKAGES, 
  PAY_PER_SOLUTIONS,
  API_PLANS,
  WHITELABEL_PLANS,
} from "@/lib/monetization";
import Navigation from "@/components/Navigation";
import { PaymentReceiptForm } from "@/components/payments/PaymentReceiptForm";
import { PaymentDetailsPanel } from "@/components/payments/PaymentDetailsPanel";
import { PaymentProofOptions } from "@/components/payments/PaymentProofOptions";
import { PaymentTrustSection } from "@/components/payments/PaymentTrustSection";
import { PaymentGuaranteeBar } from "@/components/payments/PaymentGuaranteeBar";
import { PaymentFounderCard } from "@/components/payments/PaymentFounderCard";
import { PaymentStatusPanel } from "@/components/payments/PaymentStatusPanel";
import { PaymentTrustFAQ } from "@/components/payments/PaymentTrustFAQ";
import { InternationalCardButton } from "@/components/payments/InternationalCardButton";
import SEOHead from "@/components/SEOHead";
import { PAGE_SEO } from "@/lib/seo";
import type { PaymentMethodId } from "@/lib/payments/paymentCredentials";
import { PKR_MONTHLY, type PaidPlanId } from "@/lib/payments/planPricing";

const VALID_PLAN_IDS = new Set(["free", "pro", "premium", "elite"]);

const FounderAccessPage = () => {
  const { userPlan, user } = useAuth();
  const [searchParams] = useSearchParams();
  const [selectedTier, setSelectedTier] = useState<string>("premium");

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
  const [activePaymentMethod, setActivePaymentMethod] = useState<PaymentMethodId>("bank");
  const [invoiceDraftId, setInvoiceDraftId] = useState<string | null>(null);

  useEffect(() => {
    setInvoiceDraftId(null);
  }, [selectedTier, activePaymentMethod]);

  const getTierIcon = (tierId: string) => {
    switch (tierId) {
      case 'free': return Zap;
      case 'pro': return Star;
      case 'premium': return Rocket;
      case 'elite': return Crown;
      default: return Zap;
    }
  };

  const getSelectedProduct = () => {
    const tier = SUBSCRIPTION_TIERS.find(t => t.id === selectedTier);
    if (tier) return { name: tier.name, price: tier.price, period: tier.period };
    
    const creditPkg = CREDIT_PACKAGES.find(p => `credits-${p.id}` === selectedTier);
    if (creditPkg) return { name: `${creditPkg.credits} Credits`, price: creditPkg.price, period: 'one-time' };
    
    const solution = PAY_PER_SOLUTIONS.find(s => `solution-${s.id}` === selectedTier);
    if (solution) return { name: solution.name, price: solution.priceRange, period: 'one-time' };
    
    const apiPlan = API_PLANS.find(p => `api-${p.id}` === selectedTier);
    if (apiPlan) return { name: apiPlan.name, price: apiPlan.price, period: '/month' };
    
    const wlPlan = WHITELABEL_PLANS.find(p => `wl-${p.id}` === selectedTier);
    if (wlPlan) return { name: wlPlan.name, price: wlPlan.price, period: wlPlan.period };
    
    return { name: 'Elite', price: 20, period: '/month' };
  };

  const selectedProduct = getSelectedProduct();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <SEOHead meta={PAGE_SEO.founderAccess} structuredData={undefined} />
      <Navigation />

      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.08),transparent_70%)]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(ellipse_at_center,hsl(var(--secondary)/0.05),transparent_70%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--border)/0.03)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border)/0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <div className="relative pt-20">
        <motion.div 
          className="container max-w-7xl mx-auto px-4 py-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          
          {/* Header */}
          <motion.div className="text-center mb-10" variants={itemVariants}>
            <motion.div 
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-[hsl(var(--border))] mb-5"
              whileHover={{ scale: 1.02 }}
            >
              <div className="w-2 h-2 rounded-full bg-[hsl(var(--success))] animate-pulse" />
              <span className="text-sm font-medium text-muted-foreground">Secure Checkout</span>
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight">
              Checkout
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              You will not be charged until your payment is verified. Choose a plan, pay with your preferred method, and upload proof — activation is sent by WhatsApp and email.
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="mb-8">
            <PaymentGuaranteeBar />
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="mb-8 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.6)] p-4 sm:p-5"
          >
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">How verification works</p>
            <ol className="grid sm:grid-cols-4 gap-3 text-xs text-muted-foreground">
              <li className="rounded-lg bg-[hsl(var(--muted)/0.35)] p-3">
                <span className="block font-semibold text-foreground mb-1">1. Generate invoice</span>
                Reveal exact transfer details and a unique payment reference.
              </li>
              <li className="rounded-lg bg-[hsl(var(--muted)/0.35)] p-3">
                <span className="block font-semibold text-foreground mb-1">2. Send payment</span>
                Use the exact amount via JazzCash, Easypaisa, bank, USDT, or Wise.
              </li>
              <li className="rounded-lg bg-[hsl(var(--muted)/0.35)] p-3">
                <span className="block font-semibold text-foreground mb-1">3. Upload receipt</span>
                Attach receipt screenshot with your reference.
              </li>
              <li className="rounded-lg bg-[hsl(var(--muted)/0.35)] p-3">
                <span className="block font-semibold text-foreground mb-1">4. Activate</span>
                Verified within 24h. If not, message us for a full refund within 7 days.
              </li>
            </ol>
          </motion.div>

          {/* Main Layout */}
          <div className="grid lg:grid-cols-5 gap-6">
            
            {/* Left Column - Plan Selection & Payment Methods */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* Plan Selection */}
              <motion.div variants={itemVariants}>
                <Card className="glass border-[hsl(var(--border))] overflow-hidden">
                  <CardHeader className="pb-3 border-b border-[hsl(var(--border))]">
                    <CardTitle className="text-base flex items-center gap-2 font-semibold">
                      <CreditCard className="w-4 h-4 text-primary" />
                      Choose Your Plan
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5">
                    <Tabs defaultValue="subscriptions">
                      <TabsList className="grid grid-cols-5 mb-5 bg-[hsl(var(--muted))] p-1 rounded-xl">
                        <TabsTrigger value="subscriptions" className="text-xs rounded-lg data-[state=active]:bg-[hsl(var(--card))] data-[state=active]:shadow-sm">Plans</TabsTrigger>
                        <TabsTrigger value="credits" className="text-xs rounded-lg data-[state=active]:bg-[hsl(var(--card))] data-[state=active]:shadow-sm">Credits</TabsTrigger>
                        <TabsTrigger value="solutions" className="text-xs rounded-lg data-[state=active]:bg-[hsl(var(--card))] data-[state=active]:shadow-sm">Solutions</TabsTrigger>
                        <TabsTrigger value="api" className="text-xs rounded-lg data-[state=active]:bg-[hsl(var(--card))] data-[state=active]:shadow-sm">API</TabsTrigger>
                        <TabsTrigger value="whitelabel" className="text-xs rounded-lg data-[state=active]:bg-[hsl(var(--card))] data-[state=active]:shadow-sm">License</TabsTrigger>
                      </TabsList>

                      {/* Subscriptions Tab */}
                      <TabsContent value="subscriptions" className="mt-0">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {SUBSCRIPTION_TIERS.filter(t => t.id !== 'free').map((tier) => {
                            const Icon = getTierIcon(tier.id);
                            const isSelected = selectedTier === tier.id;
                            const isElite = tier.id === 'elite';
                            
                            return (
                              <motion.div
                                key={tier.id}
                                whileHover={{ scale: 1.03, y: -2 }}
                                whileTap={{ scale: 0.97 }}
                                transition={{ duration: 0.2 }}
                              >
                                <div 
                                  className={`relative cursor-pointer rounded-xl p-4 text-center transition-all border-2 ${
                                    isSelected 
                                      ? 'border-primary bg-[hsl(var(--primary)/0.08)] shadow-[0_0_24px_hsl(var(--primary)/0.15)]' 
                                      : 'border-[hsl(var(--border))] hover:border-[hsl(var(--primary)/0.3)] bg-[hsl(var(--card))]'
                                  }`}
                                  onClick={() => setSelectedTier(tier.id)}
                                >
                                  {isElite && (
                                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                                      <Badge className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--secondary))] text-[hsl(var(--primary-foreground))] text-[10px] uppercase tracking-wider border-0 shadow-[var(--shadow-button)]">
                                        Popular
                                      </Badge>
                                    </div>
                                  )}
                                  <div className={`w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center transition-colors ${
                                    isSelected 
                                      ? 'bg-primary text-primary-foreground shadow-[var(--shadow-button)]' 
                                      : 'bg-[hsl(var(--muted))] text-muted-foreground'
                                  }`}>
                                    <Icon className="w-5 h-5" />
                                  </div>
                                  <h4 className="font-semibold text-sm">{tier.name}</h4>
                                  <div className="mt-1.5">
                                    <span className="text-2xl font-bold">${tier.price}</span>
                                    <span className="text-xs text-muted-foreground">{tier.period}</span>
                                    {(["pro", "premium", "elite"] as PaidPlanId[]).includes(tier.id as PaidPlanId) && (
                                      <p className="text-[10px] text-muted-foreground mt-1">
                                        ≈ Rs {PKR_MONTHLY[tier.id as PaidPlanId].toLocaleString()} PK
                                      </p>
                                    )}
                                  </div>
                                  {isSelected && (
                                    <motion.div 
                                      className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                    >
                                      <Check className="w-3 h-3 text-primary-foreground" />
                                    </motion.div>
                                  )}
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </TabsContent>

                      {/* Credits Tab */}
                      <TabsContent value="credits" className="mt-0">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {CREDIT_PACKAGES.map((pkg) => {
                            const isSelected = selectedTier === `credits-${pkg.id}`;
                            return (
                              <motion.div key={pkg.id} whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}>
                                <div 
                                  className={`cursor-pointer rounded-xl p-4 text-center transition-all border-2 relative ${
                                    isSelected ? 'border-primary bg-[hsl(var(--primary)/0.08)] shadow-[0_0_24px_hsl(var(--primary)/0.15)]' : 'border-[hsl(var(--border))] hover:border-[hsl(var(--primary)/0.3)] bg-[hsl(var(--card))]'
                                  }`}
                                  onClick={() => setSelectedTier(`credits-${pkg.id}`)}
                                >
                                  <Coins className={`w-7 h-7 mx-auto mb-2 ${isSelected ? 'text-primary' : 'text-[hsl(var(--warning))]'}`} />
                                  <h4 className="font-semibold text-sm">{pkg.name}</h4>
                                  <div className="text-2xl font-bold mt-1">{pkg.credits.toLocaleString()}</div>
                                  <p className="text-xs text-muted-foreground">credits</p>
                                  {pkg.bonus > 0 && (
                                    <Badge variant="outline" className="mt-2 text-[10px] text-[hsl(var(--success))] border-[hsl(var(--success)/0.3)]">
                                      +{pkg.bonus} bonus
                                    </Badge>
                                  )}
                                  <div className="text-lg font-bold mt-2">${pkg.price}</div>
                                  {isSelected && (
                                    <motion.div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                      <Check className="w-3 h-3 text-primary-foreground" />
                                    </motion.div>
                                  )}
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </TabsContent>

                      {/* Solutions Tab */}
                      <TabsContent value="solutions" className="mt-0">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {PAY_PER_SOLUTIONS.map((solution) => {
                            const isSelected = selectedTier === `solution-${solution.id}`;
                            return (
                              <motion.div key={solution.id} whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}>
                                <div 
                                  className={`cursor-pointer rounded-xl p-4 transition-all border-2 relative ${
                                    isSelected ? 'border-primary bg-[hsl(var(--primary)/0.08)]' : 'border-[hsl(var(--border))] hover:border-[hsl(var(--primary)/0.3)] bg-[hsl(var(--card))]'
                                  }`}
                                  onClick={() => setSelectedTier(`solution-${solution.id}`)}
                                >
                                  <span className="text-2xl">{solution.icon}</span>
                                  <h4 className="font-semibold mt-2">{solution.name}</h4>
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{solution.description}</p>
                                  <Badge variant="secondary" className="mt-3">{solution.priceRange}</Badge>
                                  {isSelected && (
                                    <motion.div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                      <Check className="w-3 h-3 text-primary-foreground" />
                                    </motion.div>
                                  )}
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </TabsContent>

                      {/* API Tab */}
                      <TabsContent value="api" className="mt-0">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {API_PLANS.map((plan) => {
                            const isSelected = selectedTier === `api-${plan.id}`;
                            return (
                              <motion.div key={plan.id} whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}>
                                <div 
                                  className={`cursor-pointer rounded-xl p-4 text-center transition-all border-2 relative ${
                                    isSelected ? 'border-primary bg-[hsl(var(--primary)/0.08)]' : 'border-[hsl(var(--border))] hover:border-[hsl(var(--primary)/0.3)] bg-[hsl(var(--card))]'
                                  }`}
                                  onClick={() => setSelectedTier(`api-${plan.id}`)}
                                >
                                  <Code className={`w-7 h-7 mx-auto mb-2 ${isSelected ? 'text-primary' : 'text-[hsl(var(--success))]'}`} />
                                  <h4 className="font-semibold">{plan.name}</h4>
                                  <div className="text-2xl font-bold mt-1">${plan.price}<span className="text-sm text-muted-foreground">/mo</span></div>
                                  <p className="text-xs text-muted-foreground mt-2">{plan.requestsPerMonth.toLocaleString()} req/mo</p>
                                  {isSelected && (
                                    <motion.div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                      <Check className="w-3 h-3 text-primary-foreground" />
                                    </motion.div>
                                  )}
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </TabsContent>

                      {/* White-Label Tab */}
                      <TabsContent value="whitelabel" className="mt-0">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {WHITELABEL_PLANS.map((plan) => {
                            const isSelected = selectedTier === `wl-${plan.id}`;
                            return (
                              <motion.div key={plan.id} whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}>
                                <div 
                                  className={`cursor-pointer rounded-xl p-4 text-center transition-all border-2 relative ${
                                    isSelected ? 'border-primary bg-[hsl(var(--primary)/0.08)]' : 'border-[hsl(var(--border))] hover:border-[hsl(var(--primary)/0.3)] bg-[hsl(var(--card))]'
                                  }`}
                                  onClick={() => setSelectedTier(`wl-${plan.id}`)}
                                >
                                  <Palette className={`w-7 h-7 mx-auto mb-2 ${isSelected ? 'text-primary' : 'text-[hsl(var(--secondary))]'}`} />
                                  <h4 className="font-semibold">{plan.name}</h4>
                                  <div className="text-2xl font-bold mt-1">${plan.price}<span className="text-sm text-muted-foreground">{plan.period}</span></div>
                                  {isSelected && (
                                    <motion.div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                      <Check className="w-3 h-3 text-primary-foreground" />
                                    </motion.div>
                                  )}
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Payment destination details */}
              <motion.div variants={itemVariants}>
                <Card className="glass border-[hsl(var(--border))] overflow-hidden">
                  <CardHeader className="pb-3 border-b border-[hsl(var(--border))]">
                    <CardTitle className="text-base flex items-center gap-2 font-semibold">
                      <Wallet className="w-4 h-4 text-primary" />
                      Send Payment To
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5">
                    <PaymentDetailsPanel
                      planKey={selectedTier}
                      selectedProductName={selectedProduct.name}
                      activePaymentMethod={activePaymentMethod}
                      onPaymentMethodChange={setActivePaymentMethod}
                      onInvoiceDraft={(draft) => setInvoiceDraftId(draft.invoiceId)}
                    />
                  </CardContent>
                </Card>
              </motion.div>

            </div>

            {/* Right Column - Order Summary (Sticky) */}
            <div className="lg:col-span-2">
              <motion.div
                variants={itemVariants}
                className="sticky top-24 space-y-4"
              >
                <Card className="border-2 border-[hsl(var(--border))] overflow-hidden bg-[hsl(var(--card))]">
                  {/* Header gradient strip */}
                  <div className="h-1 bg-gradient-to-r from-[hsl(var(--primary))] via-[hsl(var(--secondary))] to-[hsl(var(--accent))]" />
                  
                  <div className="p-5 border-b border-[hsl(var(--border))]">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      Order Summary
                    </h3>
                  </div>
                  
                  <CardContent className="p-5 space-y-5">
                    {/* Selected Plan */}
                    <motion.div 
                      className="p-4 rounded-xl bg-[hsl(var(--muted)/0.5)] border border-[hsl(var(--border))]"
                      layout
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{selectedProduct.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {selectedProduct.period === 'one-time' ? 'One-time purchase' : `Billed ${selectedProduct.period?.replace('/', '')}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <motion.p 
                            className="text-3xl font-bold gradient-text"
                            key={`${selectedProduct.price}`}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                          >
                            {typeof selectedProduct.price === 'number' ? `$${selectedProduct.price}` : selectedProduct.price}
                          </motion.p>
                        </div>
                      </div>
                    </motion.div>

                    <Separator className="bg-[hsl(var(--border))]" />

                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Order summary</h4>
                      <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.35)] p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-sm">{selectedProduct.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {selectedProduct.period === 'one-time' ? 'One-time purchase' : `Billed ${selectedProduct.period?.replace('/', '')}`}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold">{typeof selectedProduct.price === 'number' ? `$${selectedProduct.price}` : selectedProduct.price}</p>
                          </div>
                        </div>
                        <div className="mt-3 rounded-lg border border-[hsl(var(--border)/0.6)] bg-[hsl(var(--card)/0.5)] p-3">
                          <p className="text-[11px] text-muted-foreground font-medium mb-1">Estimated total</p>
                          <p className="text-xs text-muted-foreground">
                            {activePaymentMethod === 'mobile' || activePaymentMethod === 'bank'
                              ? `Rs ${PKR_MONTHLY[selectedTier as PaidPlanId].toLocaleString()} PKR via ${activePaymentMethod === 'mobile' ? 'mobile wallet' : 'bank transfer'}`
                              : activePaymentMethod === 'crypto'
                                ? `$${typeof selectedProduct.price === 'number' ? selectedProduct.price : '20'} USD via USDT`
                                : `$${typeof selectedProduct.price === 'number' ? selectedProduct.price : '20'} USD via wire`}
                          </p>
                        </div>
                      </div>
                    </div>

                    <Separator className="bg-[hsl(var(--border))]" />

                    <PaymentFounderCard planKey={selectedTier} />

                    <PaymentStatusPanel />

                    <InternationalCardButton planKey={selectedTier} />

                    <PaymentProofOptions
                      planKey={selectedTier}
                      currency={activePaymentMethod === "mobile" || activePaymentMethod === "bank" ? "PKR" : "USD"}
                      activePaymentMethod={activePaymentMethod}
                      userEmail={user?.email}
                      invoiceDraftId={invoiceDraftId}
                    />

                    <PaymentReceiptForm
                      planKey={selectedTier}
                      currency={activePaymentMethod === "mobile" || activePaymentMethod === "bank" ? "PKR" : "USD"}
                      invoiceDraftId={invoiceDraftId}
                      defaultMethod={
                        activePaymentMethod === "mobile"
                          ? "jazzcash"
                          : activePaymentMethod === "bank"
                            ? "bank_transfer"
                            : activePaymentMethod === "crypto"
                              ? "usdt"
                              : "wise"
                      }
                    />

                    <div className="rounded-lg border border-green-500/20 bg-green-500/5 px-3 py-2.5 text-xs text-center space-y-1">
                      <p className="font-semibold text-foreground">7-day refund promise</p>
                      <p className="text-muted-foreground">
                        If we cannot verify your payment within 24 hours, message us on WhatsApp — full refund within 7 days.
                      </p>
                    </div>

                    {/* Trust Badges */}
                    <div className="grid grid-cols-3 gap-2 pt-2">
                      {[
                        { icon: ShieldCheck, label: "Encrypted", color: "text-[hsl(var(--success))]" },
                        { icon: Clock, label: "24h support", color: "text-primary" },
                        { icon: Verified, label: "Founder-led", color: "text-[hsl(var(--warning))]" },
                      ].map((badge) => (
                        <div key={badge.label} className="text-center p-2.5 rounded-lg bg-[hsl(var(--muted)/0.3)] border border-[hsl(var(--border)/0.5)]">
                          <badge.icon className={`w-4 h-4 mx-auto mb-1 ${badge.color}`} />
                          <p className="text-[10px] text-muted-foreground font-medium">{badge.label}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Support Card */}
                <Card className="border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.2)]">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[hsl(var(--primary)/0.1)] border border-[hsl(var(--primary)/0.2)] flex items-center justify-center shrink-0">
                        <MessageCircle className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">Need Help?</h4>
                        <p className="text-xs text-muted-foreground">
                          WhatsApp support for instant help
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>

          <motion.div variants={itemVariants} className="mt-10">
            <PaymentTrustFAQ />
          </motion.div>

          <PaymentTrustSection />

          {/* Footer Trust Bar */}
          <motion.div 
            className="flex flex-wrap items-center justify-center gap-6 md:gap-8 mt-12 py-6 border-t border-[hsl(var(--border))]"
            variants={itemVariants}
          >
            {[
              { icon: Shield, label: "256-bit Encryption", color: "text-[hsl(var(--success))]" },
              { icon: Lock, label: "Privacy First", color: "text-primary" },
              { icon: BadgeCheck, label: "Verified Business", color: "text-[hsl(var(--warning))]" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-sm text-muted-foreground">
                <item.icon className={`w-4 h-4 ${item.color}`} />
                <span>{item.label}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

// Helper Components  
const StepItem = ({ number, title, description }: { number: number; title: string; description: string }) => (
  <div className="flex items-start gap-3">
    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-[hsl(var(--secondary))] text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 shadow-[0_0_12px_hsl(var(--primary)/0.3)]">
      {number}
    </div>
    <div>
      <p className="font-medium text-sm">{title}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  </div>
);

export default FounderAccessPage;
