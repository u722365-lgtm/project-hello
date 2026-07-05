import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import {
  Gift,
  Star,
  ExternalLink,
  Share2,
  Twitter,
  Linkedin,
  MessageSquare,
  Award,
  Sparkles,
} from "lucide-react";

/**
 * Growth Amplifier — one landing section that consolidates:
 *  - Option C: social share prompts (Reddit / LinkedIn / X)
 *  - Option D: review-platform outbound CTAs (G2 / Capterra / Product Hunt)
 *  - Option E: referral program entry point
 *
 * Written to feel native to the ShadowTalk landing (glassmorphism, brand tokens).
 * No fake numbers — copy is honest ("Be one of the first to leave a review").
 */

const SITE = "https://www.shadowtalk-ai.com";
const SHARE_TEXT = "ShadowTalk AI runs an offline model on-device so my chats stay private — free, no login required.";

const reviewPlatforms = [
  {
    name: "Product Hunt",
    tag: "Launch day",
    href: "https://www.producthunt.com/",
    accent: "from-orange-500/20 to-red-500/10",
  },
  {
    name: "G2",
    tag: "Verified reviews",
    href: "https://www.g2.com/",
    accent: "from-red-500/20 to-pink-500/10",
  },
  {
    name: "Capterra",
    tag: "Business software",
    href: "https://www.capterra.com/",
    accent: "from-blue-500/20 to-cyan-500/10",
  },
];

const openShare = (platform: "x" | "linkedin" | "reddit") => {
  const url = encodeURIComponent(SITE);
  const text = encodeURIComponent(SHARE_TEXT);
  const urls = {
    x: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
    reddit: `https://www.reddit.com/submit?url=${url}&title=${text}`,
  } as const;
  window.open(urls[platform], "_blank", "noopener,noreferrer,width=640,height=640");
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const GrowthAmplifier = () => {
  return (
    <section id="grow-with-us" className="py-20 px-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[160px]" />
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[140px]" />
      </div>

      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 glass-subtle border-primary/20">
            <Sparkles className="h-3 w-3 mr-1" /> Grow with us
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
            Help ShadowTalk <span className="gradient-text">reach more people</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Founder-led and community-powered. Share a link, leave an honest review, or bring a friend — every action helps.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {/* Referral */}
          <motion.div custom={0} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <Card className="card-glass p-6 h-full flex flex-col border-primary/20 bg-gradient-to-br from-primary/10 via-transparent to-transparent">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-primary/15">
                  <Gift className="h-5 w-5 text-primary" />
                </div>
                <Badge className="bg-primary/10 text-primary border-primary/20">Referral</Badge>
              </div>
              <h3 className="font-bold text-lg mb-2">Share ShadowTalk, earn Pro credits</h3>
              <p className="text-sm text-muted-foreground mb-4 flex-1">
                Send friends a unique link. When they sign up, you both get bonus Pro credits — no cap, no expiry.
              </p>
              <Button asChild size="sm" className="btn-glow w-full">
                <Link to="/referral">
                  Get your referral link
                </Link>
              </Button>
            </Card>
          </motion.div>

          {/* Review platforms */}
          <motion.div custom={1} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <Card className="card-glass p-6 h-full flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-yellow-500/15">
                  <Star className="h-5 w-5 text-yellow-500" />
                </div>
                <Badge variant="outline" className="border-border/50">Reviews</Badge>
              </div>
              <h3 className="font-bold text-lg mb-2">Leave an honest review</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Be one of the first to review ShadowTalk. Real feedback shapes the roadmap.
              </p>
              <div className="space-y-2 mt-auto">
                {reviewPlatforms.map((p) => (
                  <a
                    key={p.name}
                    href={p.href}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className={`group flex items-center justify-between gap-3 p-2.5 rounded-lg border border-border/40 bg-gradient-to-r ${p.accent} hover:border-primary/40 transition-all`}
                  >
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-foreground/80" />
                      <div>
                        <div className="text-sm font-medium leading-tight">{p.name}</div>
                        <div className="text-[10px] text-muted-foreground">{p.tag}</div>
                      </div>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </a>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Social share */}
          <motion.div custom={2} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <Card className="card-glass p-6 h-full flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-secondary/15">
                  <Share2 className="h-5 w-5 text-secondary" />
                </div>
                <Badge variant="outline" className="border-border/50">Share</Badge>
              </div>
              <h3 className="font-bold text-lg mb-2">Post about ShadowTalk</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Genuine use cases beat ads. Share a workflow, a screenshot, or a template.
              </p>
              <div className="grid grid-cols-1 gap-2 mt-auto">
                <Button size="sm" variant="outline" onClick={() => openShare("linkedin")} className="justify-start">
                  <Linkedin className="h-4 w-4 mr-2" /> Share on LinkedIn
                </Button>
                <Button size="sm" variant="outline" onClick={() => openShare("x")} className="justify-start">
                  <Twitter className="h-4 w-4 mr-2" /> Post on X (Twitter)
                </Button>
                <Button size="sm" variant="outline" onClick={() => openShare("reddit")} className="justify-start">
                  <MessageSquare className="h-4 w-4 mr-2" /> Post to Reddit
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>

        <div className="mt-10 text-center">
          <Button asChild variant="ghost" size="sm">
            <Link to="/blog">
              Read the blog for how-to guides & comparisons →
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default GrowthAmplifier;
