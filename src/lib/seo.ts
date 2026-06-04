 // SEO utilities and structured data helpers
 
/** Google/Bing search snippet — keep ≤160 characters (conversion-focused) */
export const SITE_SEARCH_DESCRIPTION =
  'Stop juggling AI tabs. ShadowTalk finishes the job—agentic chat, missions, 30+ tools, voice & code, desktop app. Free start, no card. Your old stack will feel slow.';

/** Link previews (X, LinkedIn, Discord) — curiosity-led */
export const SITE_SOCIAL_DESCRIPTION =
  'Why are builders switching to ShadowTalk? One workspace for agents, code, research & voice—free, no card. Open it once and tab-hopping feels ancient.';

export interface PageMeta {
  title: string;
  description: string;
  /** Overrides og/twitter description when set (defaults to `description`) */
  socialDescription?: string;
   keywords?: string[];
   canonical?: string;
   ogImage?: string;
   ogType?: 'website' | 'article' | 'product';
   twitterCard?: 'summary' | 'summary_large_image';
   noIndex?: boolean;
 }
 
// Generate meta tags for a page
export function generateMetaTags(meta: PageMeta): Record<string, string> {
  const baseUrl = 'https://www.shadowtalk-ai.com';
  // Use our own branded OG image (sits in /public). Falls back gracefully if missing.
  const defaultImage = `${baseUrl}/og-image.png`;
  const brand = 'ShadowTalk AI';
  // Avoid double-branding the title if it already contains the brand name.
  const fullTitle = meta.title.toLowerCase().includes('shadowtalk')
    ? meta.title
    : `${meta.title} | ${brand}`;

  const social = (meta.socialDescription ?? meta.description).slice(0, 160);

  return {
    title: fullTitle,
    description: meta.description.slice(0, 160),
    keywords: meta.keywords?.join(', ') || '',
    canonical: meta.canonical || baseUrl,
    'og:title': fullTitle,
    'og:description': social,
    'og:image': meta.ogImage || defaultImage,
    'og:type': meta.ogType || 'website',
    'og:url': meta.canonical || baseUrl,
    'twitter:card': meta.twitterCard || 'summary_large_image',
    'twitter:title': fullTitle,
    'twitter:description': social,
    'twitter:image': meta.ogImage || defaultImage,
    robots: meta.noIndex ? 'noindex, nofollow' : 'index, follow',
  };
}

 
 // Structured data for Organization
 export function getOrganizationSchema() {
   return {
     '@context': 'https://schema.org',
     '@type': 'Organization',
     name: 'ShadowTalk AI',
      url: 'https://www.shadowtalk-ai.com',
      logo: 'https://www.shadowtalk-ai.com/pwa-512x512.png',
     sameAs: [
       'https://twitter.com/ShadowTalkAI',
     ],
     contactPoint: {
       '@type': 'ContactPoint',
       contactType: 'customer support',
       availableLanguage: ['English'],
     },
   };
 }
 
 // Structured data for FAQ page
 export function getFAQSchema(faqs: Array<{ question: string; answer: string }>) {
   return {
     '@context': 'https://schema.org',
     '@type': 'FAQPage',
     mainEntity: faqs.map((faq) => ({
       '@type': 'Question',
       name: faq.question,
       acceptedAnswer: {
         '@type': 'Answer',
         text: faq.answer,
       },
     })),
   };
 }
 
 // Structured data for Product (Pricing)
 export function getProductSchema(product: {
   name: string;
   description: string;
   price: number;
   currency?: string;
 }) {
   return {
     '@context': 'https://schema.org',
     '@type': 'Product',
     name: product.name,
     description: product.description,
     offers: {
       '@type': 'Offer',
       price: product.price,
       priceCurrency: product.currency || 'USD',
       availability: 'https://schema.org/InStock',
     },
   };
 }
 
 // Structured data for Breadcrumbs
 export function getBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
   return {
     '@context': 'https://schema.org',
     '@type': 'BreadcrumbList',
     itemListElement: items.map((item, index) => ({
       '@type': 'ListItem',
       position: index + 1,
       name: item.name,
       item: item.url,
     })),
   };
 }
 
 // Page-specific SEO configurations
export const PAGE_SEO: Record<string, PageMeta> = {
  home: {
    title: 'Think AI. Think ShadowTalk. — Agentic AI Workspace',
    description: SITE_SEARCH_DESCRIPTION,
    socialDescription: SITE_SOCIAL_DESCRIPTION,
    keywords: ['ShadowTalk', 'agentic AI', 'AI agents', 'AI workspace', 'Mission Control', 'AI automation', 'GPT alternative', 'privacy AI'],
    canonical: 'https://www.shadowtalk-ai.com/home',
  },
  pricing: {
    title: 'Pricing — Free to Start, Cancel Anytime',
    description: 'ShadowTalk pricing: Free tier with stated daily limits. Pro $5/mo, Premium $15/mo, Elite $20/mo. Cancel anytime, 30-day money-back, data handling disclosed upfront.',
    keywords: ['AI pricing', 'chatbot subscription', 'AI plans'],
    canonical: 'https://www.shadowtalk-ai.com/pricing',
  },
  chatbot: {
    title: 'ShadowTalk AI — Try Chat Free',
    description: SITE_SEARCH_DESCRIPTION,
    socialDescription: SITE_SOCIAL_DESCRIPTION,
    keywords: ['ShadowTalk', 'AI chat', 'chatbot', 'AI assistant', 'agentic AI'],
    canonical: 'https://www.shadowtalk-ai.com/',
  },
  docs: {
    title: 'Documentation',
    description: 'Learn how to use ShadowTalk AI effectively. Guides, tutorials, and API documentation.',
    keywords: ['documentation', 'guides', 'tutorials', 'API docs'],
    canonical: 'https://www.shadowtalk-ai.com/docs',
  },
  about: {
    title: 'About Us',
    description: 'Learn about ShadowTalk AI, our mission, and the team behind the next-generation AI assistant.',
    keywords: ['about', 'team', 'mission', 'AI company'],
    canonical: 'https://www.shadowtalk-ai.com/about',
  },
  contact: {
    title: 'Contact Us',
    description: 'Get in touch with the ShadowTalk AI team. We are here to help with questions, feedback, and support.',
    keywords: ['contact', 'support', 'help', 'feedback'],
    canonical: 'https://www.shadowtalk-ai.com/contact',
  },
  privacy: {
    title: 'Privacy Policy',
    description: 'Read our privacy policy to understand how ShadowTalk AI collects, uses, and protects your data.',
    keywords: ['privacy policy', 'data protection', 'GDPR'],
    canonical: 'https://www.shadowtalk-ai.com/privacy',
  },
  terms: {
    title: 'Terms of Service',
    description: 'Read our terms of service to understand the rules and guidelines for using ShadowTalk AI.',
    keywords: ['terms of service', 'terms and conditions', 'legal'],
    canonical: 'https://www.shadowtalk-ai.com/terms',
  },
  execute: {
    title: 'Shadow Execution - Autonomous AI Workspace',
    description:
      'One autonomous engine for missions, strategy reports, and research briefs — live web tools, saved history, PDF export.',
    keywords: ['autonomous AI', 'mission control', 'strategy agent', 'business intelligence', 'S.E.E.'],
    canonical: 'https://www.shadowtalk-ai.com/execute',
  },
  strategy: {
    title: 'Strategy Agent - AI Business Intelligence',
    description: 'Get AI-powered business strategy analysis, market research, and competitive intelligence with ShadowTalk Strategy Agent.',
    keywords: ['AI strategy', 'business intelligence', 'market research', 'competitive analysis'],
    canonical: 'https://www.shadowtalk-ai.com/execute?mode=strategy_report',
  },
  workspace: {
    title: 'AI Workspace - Collaborative Intelligence',
    description: 'Your AI-powered workspace for team collaboration, document editing, and intelligent project management.',
    keywords: ['AI workspace', 'collaboration', 'team productivity', 'project management'],
    canonical: 'https://www.shadowtalk-ai.com/workspace',
  },
  ide: {
    title: 'Code IDE - In-Browser Editor',
    description:
      'Monaco-powered IDE inside ShadowTalk: multi-file projects, live HTML preview, templates, console, and AI-assisted coding.',
    keywords: ['browser IDE', 'online code editor', 'Monaco editor', 'AI coding'],
    canonical: 'https://www.shadowtalk-ai.com/ide',
  },
  marketplace: {
    title: 'Agent Marketplace',
    description: 'Browse and install specialized AI agents for your workflow. Extend ShadowTalk AI with community-built tools.',
    keywords: ['AI marketplace', 'AI agents', 'plugins', 'extensions'],
    canonical: 'https://www.shadowtalk-ai.com/marketplace',
  },
  missioncontrol: {
    title: 'Mission Control - Autonomous Agent Dashboard',
    description: 'Launch and monitor autonomous AI missions. Let ShadowTalk AI handle complex multi-step tasks automatically.',
    keywords: ['autonomous AI', 'mission control', 'AI automation', 'task management'],
    canonical: 'https://www.shadowtalk-ai.com/missioncontrol',
  },
  presentations: {
    title: 'AI Presentation Builder',
    description: 'Create stunning presentations with AI. Auto-generate slides, content, and designs from your prompts.',
    keywords: ['AI presentations', 'slide builder', 'deck generator', 'AI slides'],
    canonical: 'https://www.shadowtalk-ai.com/presentations',
  },
  developers: {
    title: 'Developer Tools & API',
    description: 'Build with ShadowTalk AI. API documentation, SDKs, webhooks, and developer resources.',
    keywords: ['developer tools', 'API', 'SDK', 'developer resources'],
    canonical: 'https://www.shadowtalk-ai.com/developers',
  },
  api: {
    title: 'API Management',
    description: 'Manage your ShadowTalk AI API keys, monitor usage, and access integration documentation.',
    keywords: ['API keys', 'API management', 'integration', 'developer'],
    canonical: 'https://www.shadowtalk-ai.com/api',
  },
  blog: {
    title: 'Blog',
    description: 'Latest news, updates, and insights from the ShadowTalk AI team. AI trends, product updates, and tutorials.',
    keywords: ['AI blog', 'AI news', 'product updates', 'tutorials'],
    canonical: 'https://www.shadowtalk-ai.com/blog',
  },
  faq: {
    title: 'Frequently Asked Questions',
    description: 'Find answers to common questions about ShadowTalk AI features, pricing, privacy, and more.',
    keywords: ['FAQ', 'help', 'questions', 'support'],
    canonical: 'https://www.shadowtalk-ai.com/faq',
  },
  help: {
    title: 'Help Center',
    description: 'Get help with ShadowTalk AI. Guides, tutorials, troubleshooting, and support resources.',
    keywords: ['help center', 'support', 'guides', 'troubleshooting'],
    canonical: 'https://www.shadowtalk-ai.com/help',
  },
  careers: {
    title: 'Careers',
    description: 'Join the ShadowTalk AI team. View open positions and help build the future of AI.',
    keywords: ['careers', 'jobs', 'hiring', 'AI jobs'],
    canonical: 'https://www.shadowtalk-ai.com/careers',
  },
  billing: {
    title: 'Billing & Subscription',
    description: 'Manage your ShadowTalk AI subscription, billing, and payment methods.',
    keywords: ['billing', 'subscription', 'payment', 'plans'],
    canonical: 'https://www.shadowtalk-ai.com/billing',
  },
  enterprise: {
    title: 'Enterprise Settings',
    description: 'Configure enterprise SSO, security policies, and workspace management for your organization.',
    keywords: ['enterprise', 'SSO', 'security', 'workspace management'],
    canonical: 'https://www.shadowtalk-ai.com/enterprise',
  },
  privacyScore: {
    title: 'Privacy Score',
    description: 'Check your privacy score and get recommendations to improve your digital security posture.',
    keywords: ['privacy score', 'security', 'data protection', 'privacy audit'],
    canonical: 'https://www.shadowtalk-ai.com/privacy-score',
  },
  founderAccess: {
    title: 'Founder Access Program',
    description: 'Exclusive early access program for founders. Get premium features and direct support.',
    keywords: ['founder access', 'early access', 'exclusive', 'premium'],
    canonical: 'https://www.shadowtalk-ai.com/founder-access',
  },
  cookies: {
    title: 'Cookie Policy',
    description: 'Learn about how ShadowTalk AI uses cookies and tracking technologies.',
    keywords: ['cookie policy', 'cookies', 'tracking'],
    canonical: 'https://www.shadowtalk-ai.com/cookies',
  },
  gdpr: {
    title: 'GDPR Compliance',
    description: 'Learn about our GDPR compliance practices and your data rights as a user.',
    keywords: ['GDPR', 'data rights', 'compliance', 'data protection'],
    canonical: 'https://www.shadowtalk-ai.com/gdpr',
  },
};