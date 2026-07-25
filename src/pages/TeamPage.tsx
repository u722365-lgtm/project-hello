import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Github, Linkedin, Mail, Twitter, Sparkles, Shield, Brain, Rocket } from "lucide-react";
import { PAGE_SEO, getPersonSchema } from "@/lib/seo";
import founderAsset from "@/assets/founder-zain-ahmed.png.asset.json";
import ceoAsset from "@/assets/ceo-abdul-rauf.png.asset.json";
import cfoAsset from "@/assets/cfo-muhammad-umar.jpeg.asset.json";
const founderImage = founderAsset.url;
const ceoImage = ceoAsset.url;
const cfoImage = cfoAsset.url;

const ceo = {
  name: "Abdul Rauf",
  role: "Chief Executive Officer",
  location: "Karachi, Pakistan",
  image: ceoImage,
  tagline: "Leading ShadowTalk AI with vision, integrity, and an obsession for building products that respect the people who use them.",
  bio: [
    "Abdul Rauf is the Chief Executive Officer of ShadowTalk AI. He leads company strategy, operations, and partnerships — steering ShadowTalk's mission to put sovereign, private intelligence into the hands of every user.",
    "His focus is on turning bold engineering into a durable business: growing the team, forging enterprise partnerships, and making sure every decision reflects ShadowTalk's core values — Excellence, Innovation, and Integrity.",
  ],
  pillars: ["Vision", "Leadership", "Growth", "Impact"],
};

const cfo = {
  name: "Muhammad Umar",
  role: "Chief Financial Officer",
  location: "Karachi, Pakistan",
  image: cfoImage,
  tagline: "Financial strategy, discipline, and growth — building ShadowTalk into a company that lasts.",
  bio: [
    "Muhammad Umar is the Chief Financial Officer of ShadowTalk AI. He owns the company's financial strategy, capital planning, and operational discipline — making sure ShadowTalk's growth is sustainable, transparent, and built on solid fundamentals.",
    "He partners with the CEO and Founder to translate ShadowTalk's mission into a durable business model: pricing, unit economics, investor relations, and the quiet financial rigor that lets a bold product survive contact with reality.",
  ],
  pillars: ["Financial Strategy", "Discipline", "Growth", "Governance"],
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

const founder = {
  name: "Zain Ahmed",
  role: "Founder & Chief Architect",
  location: "Karachi, Pakistan",
  image: founderImage,
  tagline: "Building the world's most private, sovereign AI — one that belongs to the user, not the cloud.",
  bio: [
    "Zain Ahmed is the founder and sole architect of ShadowTalk AI. He designed and engineered the entire platform end-to-end — from the local-first cognitive engine and offline model runtime to the multi-agent orchestration layer, security suite, and sovereign OS design system.",
    "His mission is simple but radical: give every person a genuinely private, genuinely intelligent AI that runs on their own device — no surveillance, no data harvesting, no lock-in. ShadowTalk is the answer to a decade of AI that treats users as the product.",
    "He works obsessively on the intersection of privacy engineering, on-device machine learning, and agentic autonomy. Every line of ShadowTalk is written with one question: does this respect the user?",
  ],
  focus: [
    { icon: Brain, label: "Cognitive Systems", desc: "Multi-agent orchestration & local RAG" },
    { icon: Shield, label: "Privacy Engineering", desc: "Zero-knowledge vault & client-side encryption" },
    { icon: Rocket, label: "Product & Architecture", desc: "End-to-end platform design" },
    { icon: Sparkles, label: "AI Research", desc: "On-device inference & model routing" },
  ],
  socials: [
    { icon: Mail, label: "Email", href: "mailto:zaim98269@gmail.com" },
    { icon: Github, label: "GitHub", href: "https://github.com" },
    { icon: Linkedin, label: "LinkedIn", href: "https://linkedin.com" },
    { icon: Twitter, label: "X", href: "https://x.com" },
  ],
};

const TeamPage = () => {
  const navigate = useNavigate();
  const seo = PAGE_SEO.about ?? {
    title: "The Team — ShadowTalk AI",
    description: "Meet Zain Ahmed, founder and architect of ShadowTalk AI.",
    canonical: "https://shadowtalk-ai.com/team",
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        meta={{ ...seo, title: "Team — ShadowTalk AI", canonical: "https://shadowtalk-ai.com/team" }}
        structuredData={[getPersonSchema()]}
      />
      <Navigation />

      <main className="relative pt-24 pb-24 overflow-hidden">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-primary/10 blur-[160px]" />
        </div>

        <div className="container max-w-6xl mx-auto px-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-8 -ml-3 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>

          {/* Header */}
          <motion.header
            initial="hidden"
            animate="show"
            variants={fadeUp}
            className="text-center mb-16"
          >
            <Badge variant="secondary" className="mb-4">The Team</Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
              The people behind ShadowTalk
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A small, uncompromising team building sovereign AI for the rest of us.
            </p>
          </motion.header>

          {/* CEO — hero card */}
          <motion.section
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={fadeUp}
            className="mb-16"
          >
            <Card className="overflow-hidden border-border/60 bg-card/40 backdrop-blur-xl">
              <div className="grid md:grid-cols-5 gap-0">
                <div className="md:col-span-2 relative bg-gradient-to-br from-amber-500/10 via-background to-background">
                  <div className="aspect-square md:aspect-auto md:h-full relative">
                    <img
                      src={ceo.image}
                      alt={`${ceo.name} — CEO of ShadowTalk AI`}
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="eager"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-background/30" />
                  </div>
                </div>
                <div className="md:col-span-3 p-8 md:p-12">
                  <Badge className="mb-4 bg-amber-500/15 text-amber-500 hover:bg-amber-500/20 border-amber-500/20">
                    CEO
                  </Badge>
                  <h2 className="text-3xl md:text-4xl font-bold mb-2">{ceo.name}</h2>
                  <p className="text-amber-500 font-medium mb-1">{ceo.role}</p>
                  <p className="text-sm text-muted-foreground mb-6">{ceo.location}</p>
                  <blockquote className="border-l-2 border-amber-500/50 pl-4 italic text-foreground/90 mb-6">
                    “{ceo.tagline}”
                  </blockquote>
                  <div className="space-y-4 text-muted-foreground leading-relaxed prose-p:my-3">
                    {ceo.bio.map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-8">
                    {ceo.pillars.map((p) => (
                      <Badge key={p} variant="outline" className="border-amber-500/30 text-foreground/80">
                        {p}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </motion.section>

          {/* Founder — hero card */}

          <motion.section
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={fadeUp}
            className="mb-20"
          >
            <Card className="overflow-hidden border-border/60 bg-card/40 backdrop-blur-xl">
              <div className="grid md:grid-cols-5 gap-0">
                {/* Image */}
                <div className="md:col-span-2 relative bg-gradient-to-br from-primary/20 via-background to-background">
                  <div className="aspect-square md:aspect-auto md:h-full relative">
                    <img
                      src={founder.image}
                      alt={`${founder.name} — Founder of ShadowTalk AI`}
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="eager"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-background/30" />
                  </div>
                </div>

                {/* Content */}
                <div className="md:col-span-3 p-8 md:p-12">
                  <Badge className="mb-4 bg-primary/15 text-primary hover:bg-primary/20 border-primary/20">
                    Founder
                  </Badge>
                  <h2 className="text-3xl md:text-4xl font-bold mb-2">{founder.name}</h2>
                  <p className="text-primary font-medium mb-1">{founder.role}</p>
                  <p className="text-sm text-muted-foreground mb-6">{founder.location}</p>

                  <blockquote className="border-l-2 border-primary/50 pl-4 italic text-foreground/90 mb-6">
                    “{founder.tagline}”
                  </blockquote>

                  <div className="space-y-4 text-muted-foreground leading-relaxed prose-p:my-3">
                    {founder.bio.map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>

                  {/* Socials */}
                  <div className="flex flex-wrap gap-2 mt-8">
                    {founder.socials.map((s) => (
                      <Button
                        key={s.label}
                        variant="outline"
                        size="sm"
                        asChild
                        className="gap-2"
                      >
                        <a href={s.href} target="_blank" rel="noopener noreferrer">
                          <s.icon className="h-4 w-4" />
                          {s.label}
                        </a>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </motion.section>

          {/* Focus areas */}
          <motion.section
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={fadeUp}
            className="mb-20"
          >
            <h3 className="text-2xl md:text-3xl font-bold mb-2 text-center">What Zain works on</h3>
            <p className="text-muted-foreground text-center mb-10">
              Every part of ShadowTalk — designed, engineered, and shipped in-house.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {founder.focus.map((f) => (
                <Card
                  key={f.label}
                  className="p-6 bg-card/40 backdrop-blur-xl border-border/60 hover:border-primary/40 transition-colors"
                >
                  <div className="h-10 w-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center mb-4">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h4 className="font-semibold mb-1">{f.label}</h4>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </Card>
              ))}
            </div>
          </motion.section>

          {/* Join CTA */}
          <motion.section
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={fadeUp}
          >
            <Card className="p-8 md:p-12 text-center bg-gradient-to-br from-primary/10 via-card/40 to-card/40 backdrop-blur-xl border-primary/20">
              <h3 className="text-2xl md:text-3xl font-bold mb-3">Want to build with us?</h3>
              <p className="text-muted-foreground max-w-xl mx-auto mb-6">
                ShadowTalk is growing. If you care about privacy, on-device AI, or agentic systems — we'd love to hear from you.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Button onClick={() => navigate("/careers")}>See open roles</Button>
                <Button variant="outline" onClick={() => navigate("/contact")}>
                  Get in touch
                </Button>
              </div>
            </Card>
          </motion.section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TeamPage;
