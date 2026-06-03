import type { LucideIcon } from "lucide-react";
import { Crown, Rocket, Star, Zap } from "lucide-react";
import { PLAN_DETAILS } from "@/lib/stripe";
import {
  dailyPrice,
  getValueAnchorLine,
  RECOMMENDED_MONTHLY_PLAN,
} from "@/lib/conversionPsychology";

export type PricingPlanId = "free" | "pro" | "premium" | "elite";

export type PricingPlan = {
  id: PricingPlanId;
  name: string;
  price: string;
  priceValue: number;
  period: string;
  daily?: string;
  description: string;
  icon: LucideIcon;
  popular: boolean;
  recommended: boolean;
  features: readonly string[];
  comparison?: string;
  cta: string;
  variant: "outline" | "default" | "secondary";
};

export function buildMonthlyPlans(): PricingPlan[] {
  return [
    {
      id: "free",
      name: "Free",
      price: "$0",
      priceValue: 0,
      period: "",
      description: "Try everything — no card required",
      icon: Zap,
      popular: false,
      recommended: false,
      features: PLAN_DETAILS.free.features,
      comparison: PLAN_DETAILS.free.comparison,
      cta: "Start Free",
      variant: "outline",
    },
    {
      id: "pro",
      name: "Pro",
      price: `$${PLAN_DETAILS.pro.price}`,
      priceValue: PLAN_DETAILS.pro.price,
      period: "/mo",
      daily: dailyPrice(PLAN_DETAILS.pro.price),
      description: "Unlimited messages · daily drivers",
      icon: Star,
      popular: false,
      recommended: false,
      features: PLAN_DETAILS.pro.features,
      comparison: getValueAnchorLine("pro"),
      cta: `Start Pro — $${PLAN_DETAILS.pro.price}/mo`,
      variant: "outline",
    },
    {
      id: "premium",
      name: "Premium",
      price: `$${PLAN_DETAILS.premium.price}`,
      priceValue: PLAN_DETAILS.premium.price,
      period: "/mo",
      daily: dailyPrice(PLAN_DETAILS.premium.price),
      description: "Most teams pick this · full agent stack",
      icon: Rocket,
      popular: true,
      recommended: true,
      features: PLAN_DETAILS.premium.features,
      comparison: getValueAnchorLine("premium"),
      cta: `Go Premium — $${PLAN_DETAILS.premium.price}/mo`,
      variant: "default",
    },
    {
      id: "elite",
      name: "Elite",
      price: `$${PLAN_DETAILS.elite.price}`,
      priceValue: PLAN_DETAILS.elite.price,
      period: "/mo",
      daily: dailyPrice(PLAN_DETAILS.elite.price),
      description: "White-label · vault · phone support",
      icon: Crown,
      popular: false,
      recommended: false,
      features: PLAN_DETAILS.elite.features,
      comparison: getValueAnchorLine("elite"),
      cta: `Go Elite — $${PLAN_DETAILS.elite.price}/mo`,
      variant: "secondary",
    },
  ];
}

export const PRICING_COMPARE_ROWS = [
  { label: "ChatGPT Plus", price: "$20/mo", us: false },
  { label: "ChatGPT Pro", price: "$200/mo", us: false },
  { label: "ShadowTalk Premium", price: "$15/mo", us: true },
  { label: "ShadowTalk Elite", price: "$20/mo", us: true },
] as const;

export const PRICING_ADDONS = [
  { emoji: "📄", title: "Document Generation", desc: "Contracts, NDAs, forms", price: "$5–$50" },
  { emoji: "🔍", title: "Document Review", desc: "Risk & compliance analysis", price: "$10–$75" },
  { emoji: "🌍", title: "Workflow Report", desc: "Multi-jurisdiction guidance", price: "$50–$200" },
] as const;

export const RECOMMENDED_PLAN_ID = RECOMMENDED_MONTHLY_PLAN;
