import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, useSpring } from "framer-motion";
import {
  MapPin,
  Sparkles,
  Shield,
  ExternalLink,
  Mail,
  ArrowRight,
  ArrowLeft,
  Quote,
  CheckCircle2,
  Award,
  BookOpen,
  Cpu,
  Layers,
  Globe,
  Code2,
  Copy,
  Check,
  MessageSquare,
  Rocket,
  Linkedin,
  Instagram,
  Star,
  BadgeCheck,
  ChevronDown,
  Terminal,
  Brain,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { PAGE_SEO, getPersonSchema, getFAQSchema, getSpeakableSchema } from "@/lib/seo";
import {
  FOUNDER_CANONICAL,
  FOUNDER_FULL_NAME,
  FOUNDER_CITATION,
  FOUNDER_SOCIAL_PROFILES,
  FOUNDER_NOT_THE_SAME_AS,
} from "@/lib/founderIdentity";
import { FOUNDER_STORY_CHAPTERS } from "@/lib/aboutFounderStory";
import zainImage from "@/assets/zain-ahmed.png";
import { toast } from "sonner";

// Additional FAQ tailored specifically for the Founder Page
const FOUNDER_FAQS = [
  {
    q: "Who is the founder of ShadowTalk AI?",
    a: "ShadowTalk AI was founded and solely architected by Zain Ahmed Fahad Patel (also known publicly as Zain Ahmed), an AI solutions engineer from Karachi, Pakistan. He founded the platform in February 2024 at age 17.",
  },
  {
    q: "What is Zain's background and education?",
    a: "Zain Ahmed is a first-year computing student in Karachi, mentored under the Governor Sindh IT Initiative (GIAIC) by renowned tech educator Sir Zia Khan in Generative and Agentic AI. He builds production-grade software directly from scratch.",
  },
  {
    q: "Why was ShadowTalk AI created?",
    a: "Frustrated by Big Tech AI systems that hoard user thoughts and require constant subscription lock-in to foreign servers, Zain set out to build sovereign AI — where the browser itself becomes a high-performance, private computing node with local memory, on-device models, and autonomous multi-step execution.",
  },
  {
    q: "How does Zain's work differ from others with the same name?",
    a: "Zain Ahmed Fahad Patel is the AI solutions engineer and tech founder behind ShadowTalk AI. He is distinct from Zain Ahmad (the streetwear designer and co-founder of Rastah) and Zain Ahmed (the theatre artistic director at NAPA Karachi).",
  },
  {
    q: "How can I contact or collaborate with Zain Ahmed?",
    a: "You can reach Zain directly on LinkedIn (Zain Ahmed Fahad Patel), Instagram (@shadowtalk_ai & @onlyz_ain1), or via email at shadowtalk68@gmail.com for partnerships, enterprise deployments, or press interviews.",
  },
];

const ARCHITECTURAL_PILLARS = [
  {
    icon: Cpu,
    title: "Sovereign Local-First Engine",
    description:
      "Engineered on-device WebGPU model pipelines (~130MB footprint) that run client-side without sending prompts to centralized third-party servers.",
    tag: "Offline Stack",
  },
  {
    icon: Terminal,
    title: "In-Browser WebContainer Shell",
    description:
      "Integrated full Node.js terminal environments directly inside the browser so developers can execute code, test packages, and run scripts in real-time.",
    tag: "Computer Mode",
  },
  {
    icon: Layers,
    title: "S.E.E. Agentic Runtime",
    description:
      "Developed the Shadow Execution Engine — multi-agent autonomous Mission Control capable of orchestrating 30+ tools to complete end-to-end objectives.",
    tag: "Autonomous Agents",
  },
  {
    icon: Brain,
    title: "Zero-Cloud Memory Ledger",
    description:
      "Designed a client-side IndexedDB cryptographic journal that remembers developer workflows and sessions without indexing them on cloud databanks.",
    tag: "Shadow Memory",
  },
];

const FounderPage = () => {
  const navigate = useNavigate();
  const [copiedCitation, setCopiedCitation] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  // 3D Card tilt effect on hover
  const portraitRef = useRef<HTMLDivElement>(null);
  const [spot, setSpot] = useState({ x: 300, y: 200 });
  const rotateX = useSpring(0, { stiffness: 160, damping: 22 });
  const rotateY = useSpring(0, { stiffness: 160, damping: 22 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const el = portraitRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    rotateY.set(x * 12);
    rotateX.set(-y * 12);
    setSpot({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  const copyCitation = () => {
    navigator.clipboard.writeText(FOUNDER_CITATION);
    setCopiedCitation(true);
    toast.success("Citation copied to clipboard!");
    setTimeout(() => setCopiedCitation(false), 2500);
  };

  const structuredData = [
    getPersonSchema(),
    getFAQSchema(FOUNDER_FAQS.map((f) => ({ question: f.q, answer: f.a }))),
    getSpeakableSchema(["#founder-headline", "#founder-bio", "[data-speakable]"]),
  ];

  return (
    <div className="min-h-screen bg-background text-foreground relative selection:bg-primary/30 selection:text-primary-foreground">
      <SEOHead meta={PAGE_SEO.founder} structuredData={structuredData} />
      <Navigation />

      {/* Floating Quick Action */}
      <div className="fixed bottom-6 left-6 z-40 hidden sm:block">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/chatbot")}
          className="gap-2 glass-strong border-border/50 hover:border-primary/40 shadow-xl backdrop-blur-xl"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Chatbot
        </Button>
      </div>

      {/* Hero Section */}
      <section className="relative pt-28 pb-20 md:pt-36 md:pb-28 px-4 overflow-hidden border-b border-border/40">
        {/* Background ambient lighting */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[min(100%,800px)] h-[400px] rounded-full bg-primary/10 blur-[130px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-80 h-80 rounded-full bg-accent/8 blur-[100px] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))] pointer-events-none" />

        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            {/* Left Column: Bio & Intro */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-7 flex flex-col justify-center"
            >
              {/* Badges Bar */}
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <Badge
                  variant="outline"
                  className="gap-1.5 py-1 px-3 bg-primary/10 border-primary/30 text-primary text-xs font-semibold rounded-full shadow-sm"
                >
                  <BadgeCheck className="h-3.5 w-3.5 text-primary" />
                  Official Founder &amp; Lead Architect
                </Badge>
                <Badge
                  variant="secondary"
                  className="gap-1.5 py-1 px-3 text-muted-foreground text-xs rounded-full border border-border/50"
                >
                  <MapPin className="h-3.5 w-3.5 text-accent" />
                  Karachi, Pakistan 🇵🇰
                </Badge>
                <Badge
                  variant="secondary"
                  className="gap-1.5 py-1 px-3 text-muted-foreground text-xs rounded-full border border-border/50"
                >
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  Age 17 · Founded Feb 2024
                </Badge>
              </div>

              {/* Main Headline */}
              <h1
                id="founder-headline"
                className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-4 text-foreground"
              >
                {FOUNDER_FULL_NAME}
              </h1>

              <p className="text-xl sm:text-2xl font-semibold text-muted-foreground/90 mb-6 flex items-center gap-2">
                <span>also known as <strong className="text-foreground">{FOUNDER_CANONICAL.shortName}</strong></span>
                <span className="text-primary/70">·</span>
                <span className="text-primary font-medium">{FOUNDER_CANONICAL.jobTitle}</span>
              </p>

              <div
                id="founder-bio"
                className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-8 space-y-4"
              >
                <p>
                  At seventeen in Karachi, Zain Ahmed asked the fundamental question Big Tech refuses to answer:{" "}
                  <strong className="text-foreground font-semibold">what happens to your thoughts when you pour them into AI?</strong>
                </p>
                <p>
                  Trained in Generative and Agentic AI under the mentorship of{" "}
                  <span className="text-foreground font-medium">Sir Zia Khan</span> through the{" "}
                  <span className="text-foreground font-medium">Governor Sindh IT Initiative (GIAIC)</span>, Zain single-handedly
                  architected <strong className="text-foreground">ShadowTalk AI</strong> from scratch — uniting on-device
                  inference, WebContainer terminal execution, and autonomous multi-agent pipelines into one sovereign workspace.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3.5 mb-8">
                <Button
                  size="lg"
                  className="btn-glow gap-2 shadow-lg shadow-primary/20 px-6 font-semibold"
                  onClick={() => navigate("/chatbot")}
                >
                  <MessageSquare className="h-4 w-4" />
                  Try ShadowTalk AI
                  <ArrowRight className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  className="gap-2 border-border/70 hover:border-primary/50 hover:bg-muted/40 font-medium"
                  asChild
                >
                  <a
                    href={FOUNDER_SOCIAL_PROFILES.linkedin.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Linkedin className="h-4 w-4 text-[#0077b5]" />
                    LinkedIn
                    <ExternalLink className="h-3 w-3 opacity-60" />
                  </a>
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  className="gap-2 border-border/70 hover:border-primary/50 hover:bg-muted/40 font-medium"
                  asChild
                >
                  <a
                    href={FOUNDER_SOCIAL_PROFILES.instagram.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Instagram className="h-4 w-4 text-[#e1306c]" />
                    Instagram
                    <ExternalLink className="h-3 w-3 opacity-60" />
                  </a>
                </Button>

                <Button
                  variant="ghost"
                  size="lg"
                  className="gap-2 text-muted-foreground hover:text-foreground font-medium"
                  asChild
                >
                  <a href={`mailto:${FOUNDER_CANONICAL.email}`}>
                    <Mail className="h-4 w-4 text-primary" />
                    Direct Email
                  </a>
                </Button>
              </div>

              {/* Quick Citation Bar */}
              <div className="p-3.5 rounded-xl glass-subtle border border-border/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Quote className="h-4 w-4 text-primary/80 shrink-0" />
                  <span>
                    <strong>Canonical Citation:</strong> {FOUNDER_CITATION}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyCitation}
                  className="h-7 text-xs gap-1.5 hover:bg-primary/10 hover:text-primary shrink-0"
                >
                  {copiedCitation ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-success" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Citation</span>
                    </>
                  )}
                </Button>
              </div>
            </motion.div>

            {/* Right Column: Interactive 3D Founder Portrait */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.75, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-5 flex justify-center"
            >
              <div
                ref={portraitRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{ perspective: 1000 }}
                className="relative w-full max-w-[390px] aspect-[4/5] rounded-3xl p-1 group"
              >
                {/* Glow ring */}
                <div className="absolute -inset-1 rounded-[28px] bg-gradient-to-r from-primary/30 via-accent/30 to-primary/30 blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-500" />

                <motion.div
                  style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
                  className="relative w-full h-full rounded-2xl overflow-hidden border border-primary/30 bg-card shadow-2xl"
                >
                  <img
                    src={zainImage}
                    alt={`${FOUNDER_FULL_NAME} — Founder of ShadowTalk AI`}
                    className="w-full h-full object-cover object-top scale-[1.02] group-hover:scale-105 transition-transform duration-700 ease-out"
                  />

                  {/* Gradient overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent pointer-events-none" />

                  {/* Top Floating Badge */}
                  <div className="absolute top-4 left-4 right-4 flex justify-between items-center pointer-events-none">
                    <span className="glass-strong border border-white/10 rounded-full px-3 py-1 text-xs font-medium text-white flex items-center gap-1.5 shadow-lg">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Actively Shipping · Karachi
                    </span>
                    <span className="glass-strong border border-white/10 rounded-full px-2.5 py-1 text-[11px] font-bold text-amber-300 flex items-center gap-1">
                      <Star className="h-3 w-3 fill-amber-300 text-amber-300" />
                      100% Solo Built
                    </span>
                  </div>

                  {/* Bottom Status Card */}
                  <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute bottom-5 left-5 right-5 glass-strong border border-border/50 rounded-xl p-4 shadow-xl backdrop-blur-xl"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                        Lead Architect
                      </span>
                      <span className="text-[11px] font-medium text-primary">Karachi, PK</span>
                    </div>
                    <p className="text-sm font-bold text-foreground">
                      &ldquo;The shadow founder doesn&apos;t wait for permission.&rdquo;
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Building sovereign intelligence you own, not rent.
                    </p>
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Key Stats Ribbon */}
      <section className="py-12 px-4 border-b border-border/40 bg-muted/20">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="p-5 rounded-2xl glass-subtle border border-border/40 text-center">
              <div className="text-3xl sm:text-4xl font-black text-primary mb-1 tracking-tight">Age 17</div>
              <p className="text-xs sm:text-sm font-medium text-foreground">Solo Founder &amp; Architect</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Built entire product independently</p>
            </div>
            <div className="p-5 rounded-2xl glass-subtle border border-border/40 text-center">
              <div className="text-3xl sm:text-4xl font-black text-primary mb-1 tracking-tight">100%</div>
              <p className="text-xs sm:text-sm font-medium text-foreground">Sovereign Architecture</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">On-device WebGPU &amp; zero-cloud ledger</p>
            </div>
            <div className="p-5 rounded-2xl glass-subtle border border-border/40 text-center">
              <div className="text-3xl sm:text-4xl font-black text-primary mb-1 tracking-tight">GIAIC</div>
              <p className="text-xs sm:text-sm font-medium text-foreground">Governor Sindh IT Initiative</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Mentored by Sir Zia Khan</p>
            </div>
            <div className="p-5 rounded-2xl glass-subtle border border-border/40 text-center">
              <div className="text-3xl sm:text-4xl font-black text-primary mb-1 tracking-tight">#1 Rank</div>
              <p className="text-xs sm:text-sm font-medium text-foreground">Global Google Authority</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Over 40% organic US &amp; EU adoption</p>
            </div>
          </div>
        </div>
      </section>

      {/* The Founder's Journey — 6 Chronological Chapters */}
      <section className="py-24 px-4 relative overflow-hidden" id="story">
        <div className="container mx-auto max-w-4xl relative z-10">
          <div className="text-center mb-16 md:mb-20">
            <Badge variant="outline" className="mb-4 px-4 py-1.5 border-primary/30 text-primary text-xs font-semibold rounded-full">
              <BookOpen className="h-3.5 w-3.5 mr-1.5" />
              The Chronicles
            </Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
              The Founder&apos;s Odyssey
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              How a teenager in Karachi wrote thousands of lines of TypeScript and WebAssembly alone at night while the tech world said to wait.
            </p>
          </div>

          <div className="space-y-12 md:space-y-16">
            {FOUNDER_STORY_CHAPTERS.map((chapter, index) => (
              <motion.article
                key={chapter.id}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.08 }}
                className="relative"
              >
                <div className="flex gap-5 sm:gap-7">
                  {/* Step indicator column */}
                  <div className="flex flex-col items-center shrink-0">
                    <span className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl bg-primary/10 text-sm sm:text-base font-bold text-primary border border-primary/30 shadow-md">
                      0{index + 1}
                    </span>
                    {index < FOUNDER_STORY_CHAPTERS.length - 1 && (
                      <div className="w-0.5 flex-1 min-h-[4rem] my-2 bg-gradient-to-b from-primary/40 to-transparent" />
                    )}
                  </div>

                  {/* Chapter content card */}
                  <div className="flex-1 min-w-0 pb-4">
                    <div className="glass-subtle border border-border/50 rounded-2xl p-6 sm:p-8 hover:border-primary/30 transition-colors">
                      <h3 className="text-xl sm:text-2xl font-bold tracking-tight mb-3 text-foreground">
                        {chapter.title}
                      </h3>
                      <div className="space-y-3.5 text-muted-foreground text-sm sm:text-base leading-relaxed">
                        {chapter.body.map((paragraph, pIdx) => (
                          <p key={pIdx}>{paragraph}</p>
                        ))}
                      </div>

                      {chapter.pullQuote && (
                        <blockquote className="mt-5 p-4 sm:p-5 rounded-xl bg-primary/5 border-l-4 border-primary text-foreground font-medium text-base sm:text-lg italic not-italic relative">
                          <Quote className="h-4 w-4 text-primary mb-1.5 opacity-80" />
                          <p>&ldquo;{chapter.pullQuote}&rdquo;</p>
                          {chapter.pullQuoteAuthor && (
                            <footer className="mt-2 text-xs sm:text-sm text-muted-foreground not-italic font-normal">
                              — {chapter.pullQuoteAuthor}
                            </footer>
                          )}
                        </blockquote>
                      )}
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* Engineering Innovations Zain Built */}
      <section className="py-20 px-4 border-t border-border/40 bg-muted/10">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-3 px-3.5 py-1 border-primary/30 text-primary text-xs font-semibold rounded-full">
              <Code2 className="h-3.5 w-3.5 mr-1.5" />
              Technical Blueprint
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
              What Zain Architected
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
              ShadowTalk is not a generic ChatGPT wrapper. Every system below was custom-coded to ensure resilience, sovereignty, and real agentic execution.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {ARCHITECTURAL_PILLARS.map((pillar, i) => (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="glass-subtle border border-border/50 hover:border-primary/40 rounded-2xl p-6 sm:p-8 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-primary group-hover:scale-110 transition-transform">
                    <pillar.icon className="h-6 w-6" />
                  </div>
                  <Badge variant="secondary" className="text-xs font-mono">
                    {pillar.tag}
                  </Badge>
                </div>
                <h3 className="text-xl font-bold mb-2 text-foreground group-hover:text-primary transition-colors">
                  {pillar.title}
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {pillar.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Search Disambiguation & Entity Authority Card */}
      <section className="py-16 px-4 border-t border-border/40">
        <div className="container mx-auto max-w-4xl">
          <div className="glass-strong border border-border/60 rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center gap-2 mb-4 text-xs font-semibold text-primary uppercase tracking-wider">
              <Award className="h-4 w-4" />
              <span>Search Disambiguation &amp; Entity Clarity</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-bold mb-4">
              Zain Ahmed Fahad Patel vs Namesakes
            </h3>

            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-6">
              Because &ldquo;Zain Ahmed&rdquo; is a common name across Pakistan, journalists, search engines, and AI models
              should cite <strong className="text-foreground">{FOUNDER_FULL_NAME}</strong> to avoid cross-attributing
              ShadowTalk AI to unrelated individuals:
            </p>

            <div className="space-y-3 mb-6">
              {FOUNDER_NOT_THE_SAME_AS.map((item) => (
                <div
                  key={item.name}
                  className="p-4 rounded-xl bg-background/60 border border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm"
                >
                  <div>
                    <span className="font-semibold text-foreground">{item.name}</span>
                    <span className="text-muted-foreground ml-2">({item.domain})</span>
                    <p className="text-xs text-muted-foreground/80 mt-0.5">{item.note}</p>
                  </div>
                  <Badge variant="outline" className="w-fit shrink-0 text-xs border-amber-500/40 text-amber-400">
                    Not ShadowTalk Founder
                  </Badge>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-xs sm:text-sm text-foreground flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                <span>
                  <strong>Sole Official Attribution:</strong> {FOUNDER_FULL_NAME} (Karachi, Pakistan)
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={copyCitation}
                className="text-xs gap-1.5 shrink-0"
              >
                {copiedCitation ? "Citation Copied" : "Copy Official Citation"}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Co-Founder Section on Founder Page */}
      <section className="py-16 px-4 border-t border-border/40">
        <div className="container mx-auto max-w-4xl">
          <div className="glass-strong border border-accent/30 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center gap-8">
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl overflow-hidden border-2 border-accent/40 shrink-0 shadow-lg relative group">
              <img
                src="/fatima-cofounder.jpg"
                alt="Fatima (Sadaf Tayyaba) — Co-Founder of ShadowTalk AI"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="flex-1 text-center md:text-left">
              <Badge variant="outline" className="mb-2 border-accent/40 text-accent text-xs font-semibold">
                Co-Founder &amp; Second Developer
              </Badge>
              <h3 className="text-2xl sm:text-3xl font-extrabold mb-2 text-foreground">
                Fatima (Sadaf Tayyaba)
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                The second developer behind ShadowTalk AI. Fatima co-architected the client-side memory ledger,
                120fps UI state machine, and offline resilience pipeline alongside Zain Ahmed.
              </p>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <Button size="sm" className="btn-glow gap-1.5 font-semibold" onClick={() => navigate("/fatima")}>
                  Meet Co-Founder Fatima <ArrowRight className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href="mailto:sadaftayyaba655@gmail.com">
                    <Mail className="h-3.5 w-3.5 mr-1 text-accent" />
                    sadaftayyaba655@gmail.com
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Founder FAQ Accordion */}
      <section className="py-20 px-4 border-t border-border/40">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-3 px-3 py-1 border-primary/30 text-primary text-xs font-semibold rounded-full">
              Frequently Asked Questions
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
              About Zain Ahmed
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Verified answers for press, investors, developers, and users.
            </p>
          </div>

          <div className="space-y-4">
            {FOUNDER_FAQS.map((faq, index) => {
              const isOpen = expandedFaq === index;
              return (
                <div
                  key={faq.q}
                  className="rounded-2xl border border-border/50 glass-subtle overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setExpandedFaq(isOpen ? null : index)}
                    className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 font-semibold text-base sm:text-lg text-foreground hover:text-primary transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`h-5 w-5 text-muted-foreground shrink-0 transition-transform duration-300 ${
                        isOpen ? "rotate-180 text-primary" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-muted-foreground text-sm sm:text-base leading-relaxed border-t border-border/30">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final Call to Action Card */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="relative rounded-3xl p-8 sm:p-14 overflow-hidden border border-primary/30 bg-gradient-to-b from-primary/10 via-background to-background text-center shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(120,119,198,0.25),transparent_70%)] pointer-events-none" />

            <Badge variant="secondary" className="mb-4 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider">
              Get In Touch
            </Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 tracking-tight text-foreground">
              Connect With The Builder
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto mb-8 leading-relaxed">
              Whether you are an engineer who wants to contribute, an enterprise looking to deploy sovereign AI, or a builder with ambitious ideas — Zain reads every message.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Button
                size="lg"
                className="btn-glow gap-2 px-7 font-bold shadow-lg shadow-primary/25"
                onClick={() => navigate("/chatbot")}
              >
                <Rocket className="h-4 w-4" />
                Launch ShadowTalk AI
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="gap-2 border-border/70 hover:border-primary/50 font-medium"
                asChild
              >
                <a
                  href={FOUNDER_SOCIAL_PROFILES.linkedin.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Linkedin className="h-4 w-4 text-[#0077b5]" />
                  LinkedIn Profile
                  <ExternalLink className="h-3 w-3 opacity-60" />
                </a>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="gap-2 border-border/70 hover:border-primary/50 font-medium"
                asChild
              >
                <a href={`mailto:${FOUNDER_CANONICAL.email}`}>
                  <Mail className="h-4 w-4 text-primary" />
                  {FOUNDER_CANONICAL.email}
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FounderPage;
