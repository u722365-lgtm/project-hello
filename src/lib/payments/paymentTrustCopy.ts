export const PAYMENT_GUARANTEES = [
  {
    id: "activation",
    title: "24-hour activation",
    description: "Receipt reviewed and plan upgraded within one business day — usually under 2 hours.",
  },
  {
    id: "refund",
    title: "7-day refund promise",
    description: "If we cannot activate your plan or you change your mind within 7 days, we refund you.",
  },
  {
    id: "founder",
    title: "Founder-verified",
    description: "Every payment is reviewed by Zain Ahmed Fahad Patel — not an anonymous bot.",
  },
  {
    id: "secure",
    title: "Receipts encrypted",
    description: "Screenshots upload to private storage. Bank details stay hidden until you generate an invoice.",
  },
] as const;

export const PAYMENT_VERIFICATION_FLOW = [
  {
    step: 1,
    title: "You pay & upload proof",
    description: "Transfer via bank, wallet, or crypto. Upload a screenshot or message us on WhatsApp.",
  },
  {
    step: 2,
    title: "We match your receipt",
    description: "Your payment is linked to your signed-in account and reference ID automatically.",
  },
  {
    step: 3,
    title: "Plan activates automatically",
    description: "Invoice is emailed to you and pinged to the founder on WhatsApp/Telegram. Your plan goes live instantly.",
  },
  {
    step: 4,
    title: "Start using ShadowTalk",
    description: "Open chat — your subscription tier updates in Profile within seconds.",
  },
] as const;

export const PAYMENT_TRUST_FAQ = [
  {
    question: "Is manual checkout safe?",
    answer:
      "Yes — it is how many Pakistan-based founders accept JazzCash, Easypaisa, and bank transfers before Stripe is fully wired. You pay to a verified business account, upload proof, and we activate only after human review. Card checkout is also available for international users when enabled.",
  },
  {
    question: "How do I know you received my payment?",
    answer:
      "After upload you see a reference ID on this page. Sign in to track status (pending → verified). We also message you on WhatsApp if you used that path.",
  },
  {
    question: "What if my plan is not activated?",
    answer:
      "Message us on WhatsApp with your receipt. If we cannot verify within 24 hours, or you request a refund within 7 days, we return your transfer.",
  },
  {
    question: "Who am I paying?",
    answer:
      "ShadowTalk AI — founded by Zain Ahmed Fahad Patel in Karachi, Pakistan. Public founder profile, LinkedIn, and product at shadowtalk-ai.com. You are not sending money to a random wallet with no name behind it.",
  },
] as const;

export const PAYMENT_SOCIAL_PROOF = {
  badge: "Trusted by 100+ founders",
  support: "Active support within 24 hours",
  verifiedLabel: "Verified business · Meezan Bank · JazzCash / Easypaisa",
} as const;
