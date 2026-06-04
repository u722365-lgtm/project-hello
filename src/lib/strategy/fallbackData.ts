import type { BusinessIdea, ResearchData, StrategyResult } from "@/lib/strategy/types";

export function generateFallbackResearch(idea: BusinessIdea): ResearchData {
  return {
    competitors: [
      { name: `${idea.industry} Leader Co.`, marketShare: 35, pricing: "Premium" },
      { name: `Local ${idea.industry} Services`, marketShare: 25, pricing: "Mid-range" },
      { name: "Regional Startup", marketShare: 15, pricing: "Budget" },
      { name: "Other Players", marketShare: 25, pricing: "Various" },
    ],
    regulations: [
      `${idea.industry} licensing requirements in ${idea.location}`,
      "Business registration and tax compliance",
      "Employment regulations and labor laws",
      "Consumer protection regulations",
      "Environmental compliance standards",
    ],
    marketTrends: [
      `Growing demand for ${idea.industry.toLowerCase()} services`,
      "Digital transformation acceleration",
      "Sustainability focus in business operations",
      "Hybrid service delivery models",
      "AI and automation integration",
    ],
    costs: [
      { item: "Initial Setup & Registration", cost: 5000 },
      { item: "Equipment & Technology", cost: 15000 },
      { item: "Marketing & Branding", cost: 8000 },
      { item: "Operational Expenses (3 months)", cost: 12000 },
      { item: "Contingency Fund", cost: 10000 },
    ],
    opportunities: [
      "Underserved market segments",
      "Technology adoption gaps",
      "Partnership opportunities with local businesses",
      "Government incentives for new businesses",
    ],
    threats: [
      "Economic uncertainty",
      "Established competitor response",
      "Regulatory changes",
      "Supply chain vulnerabilities",
    ],
    sources: [
      {
        title: "Estimated industry baseline (no live sources)",
        url: "",
        verified: false,
      },
    ],
  };
}

export function generateFallbackAnalysis(
  idea: BusinessIdea,
  research: ResearchData,
): StrategyResult {
  const baseRevenue = 10000;
  const growthRate = 1.15;

  return {
    executiveSummary: `${idea.name} is a ${idea.industry} opportunity in ${idea.location}. This report used estimated data because live research steps did not complete — regenerate for web-backed sources.`,
    research,
    swot: {
      strengths: [
        "Focused value proposition",
        "Lean operational structure",
        "Technology-enabled delivery",
        "Adaptable business model",
        "Local market knowledge potential",
      ],
      weaknesses: [
        "Limited initial capital vs incumbents",
        "Brand awareness must be built",
        "Small initial team capacity",
        "Limited geographic coverage at launch",
      ],
      opportunities: research.opportunities.slice(0, 5),
      threats: research.threats.slice(0, 5),
    },
    financialProjections: Array.from({ length: 12 }, (_, i) => {
      const revenue = Math.round(baseRevenue * Math.pow(growthRate, i));
      const expenses = Math.round(revenue * (0.7 - i * 0.01));
      return {
        month: `Month ${i + 1}`,
        revenue,
        expenses,
        profit: revenue - expenses,
      };
    }),
    recommendations: [
      "Validate demand with 10–20 customer interviews in the target location",
      "Build a minimal digital presence before scaling paid acquisition",
      "Track unit economics weekly for the first 90 days",
      "Secure partnerships with complementary local businesses",
      "Re-run Strategy Agent with live research when connectivity allows",
    ],
    riskAssessment:
      "Primary risks include competition, cash runway, and regulatory compliance in the target market. Maintain 6+ months of operating reserves and review regulations quarterly.",
    implementationPlan: [
      "Week 1–2: Legal entity and licenses",
      "Week 3–4: Banking and core tooling",
      "Month 2: Pilot with early customers",
      "Month 3: Marketing launch",
      "Month 4–6: Iterate on feedback and unit economics",
      "Month 7–12: Scale proven channels",
    ],
  };
}
