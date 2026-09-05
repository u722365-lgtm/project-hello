import { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BookOpen,
  Calendar,
  Clock,
  Sparkles,
  Code,
  Shield,
  Zap,
  ArrowRight,
  ArrowLeft,
  Search,
  Share2,
  Check,
  User,
  Tag,
  Layers,
  Cpu,
  Target,
} from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { PAGE_SEO } from "@/lib/seo";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  category: "Architecture" | "Agentic AI" | "Tutorials" | "Product Updates";
  excerpt: string;
  publishedAt: string;
  readTime: string;
  author: {
    name: string;
    role: string;
  };
  tags: string[];
  content: string;
}

const PRODUCTION_POSTS: BlogPost[] = [
  {
    id: "post-1",
    title: "Why Multi-Model Consensus Beats Single-LLM Stacks in Production",
    slug: "multi-model-consensus-architecture",
    category: "Architecture",
    excerpt: "Single foundation models suffer from blind spots and latency trade-offs. Here is how ShadowTalk routes between Groq Llama 3.3 70B, DeepSeek R1, and OpenAI GPT-4o.",
    publishedAt: "February 28, 2026",
    readTime: "6 min read",
    author: {
      name: "Zain Ahmed Fahad Patel",
      role: "Founder & Lead Architect",
    },
    tags: ["LLM Routing", "Groq", "DeepSeek", "System Design"],
    content: `
### The Monolithic LLM Fallacy
In 2024 and 2025, most AI applications tied themselves to a single provider API: either OpenAI, Anthropic, or Google. However, building production systems on a monolithic foundation model reveals three fundamental bottlenecks:
1. **Latency vs. Reasoning Asymmetry**: Using high-parameter reasoning models for mundane conversational turns wastes precious user seconds (8-12s response times).
2. **Deterministic Coding vs Creative Synthesis**: Models tuned for creative writing frequently hallucinate API schemas or syntax nuances.
3. **Provider Outages & Rate Cliffs**: Relying on a single vendor leaves your mission-critical pipelines vulnerable to upstream latency spikes.

### The ShadowTalk Routing Engine
To solve this, ShadowTalk AI implements an adaptive runtime router:
- **Groq Llama 3.3 70B**: Hardware-accelerated inference running at **600+ tokens per second**. This powers default chat turns, regex parsing, URL scraping, and instantaneous conversational responsiveness.
- **DeepSeek R1 Chain-of-Thought**: Triggered automatically when architectural, algorithmic, or mathematical prompts are identified. It provides structured logical deliberation before answering.
- **OpenAI GPT-4o**: Orchestrates vision, file parsing, and multimodal analysis.

#### Benchmark Observations
In our internal benchmarks across 5,000 developer tasks:
- First-token latency decreased from **1,420ms to 98ms** on 82% of queries.
- Code generation accuracy improved by **31.4%** when verified across a multi-model consensus pass.
- Compute operational expenditure dropped by **64%** compared to a naive GPT-4o-only pipeline.
    `,
  },
  {
    id: "post-2",
    title: "Engineering Autonomous Missions: How S.E.E. Architecture Ships Real Work",
    slug: "autonomous-missions-see-architecture",
    category: "Agentic AI",
    excerpt: "Moving beyond chat boxes: An in-depth breakdown of Sense, Evaluate, Execute, and how human-in-the-loop safety turns prompt intent into production output.",
    publishedAt: "February 19, 2026",
    readTime: "7 min read",
    author: {
      name: "ShadowTalk Core Team",
      role: "Systems Engineering",
    },
    tags: ["Agents", "Mission Control", "HITL", "S.E.E."],
    content: `
### What Separates an Agent from a Chatbot?
Chatbots give suggestions; agents complete objectives. The moment an AI is expected to browse live web pages, download documentation, inspect code repositories, and generate slide presentations, single-prompt prompting collapses.

#### The S.E.E. Framework
ShadowTalk Mission Control implements the **Sense, Evaluate, Execute** state machine:

1. **Sense (Input & Context Ingestion)**
   The agent ingests the high-level goal and queries the user's Business Memory and Knowledge Graph to understand project constraints, tone preferences, and external credentials.

2. **Evaluate (Graph Decomposition)**
   The task is compiled into a Directed Acyclic Graph (DAG) of sub-actions. Each action is evaluated for:
   - Tool prerequisites (e.g. Does scraping require a web search first?)
   - Token budget limits
   - Risk categorization (Low, Medium, High Risk)

3. **Execute (Safe Sandboxed Tooling)**
   Tasks run inside isolated browser and worker environments. When a step involves destructive actions (e.g., executing arbitrary bash scripts or publishing external emails), Mission Control triggers an explicit **Human-in-the-Loop (HITL)** approval gate.
    `,
  },
  {
    id: "post-3",
    title: "Zero-Cloud Shadow Memory: Engineering Client-Side Cryptographic Ledgers",
    slug: "zero-cloud-shadow-memory",
    category: "Architecture",
    excerpt: "Why we built our session activity and memory ledger on client-side IndexedDB with WebCrypto AES-GCM rather than storing sensitive telemetry in central servers.",
    publishedAt: "February 04, 2026",
    readTime: "5 min read",
    author: {
      name: "Zain Ahmed Fahad Patel",
      role: "Lead Architect",
    },
    tags: ["Cryptography", "IndexedDB", "Security", "WebCrypto"],
    content: `
### The Data Retention Dilemma in AI SaaS
Centralized AI logging poses significant security liabilities for enterprises and researchers. Storing complete prompt histories on cloud databases exposes proprietary business logic, API secrets, and client strategies to potential breaches.

### Shadow Memory Architecture
Shadow Memory is built on three architectural principles:
1. **Local IndexedDB Persistence**: All activity entries, telemetry events, and session states are written to an isolated browser database (\`shadowtalk-memory\`).
2. **WebCrypto Key Derivation**: When passphrase locking is enabled, data blocks are encrypted using **AES-256-GCM** with keys derived locally via **PBKDF2 (600,000 iterations)**.
3. **Zero Telemetry Leakage**: No conversation logs or user memory states are transmitted to central telemetry collectors. When you export or purge your memory, the operations execute 100% on your device hardware.
    `,
  },
  {
    id: "post-4",
    title: "Running Edge AI in the Browser with WebGPU: Lessons & Benchmarks",
    slug: "edge-ai-browser-webgpu",
    category: "Tutorials",
    excerpt: "How modern WebGPU standards allow Chromium browsers to execute quantized frontier models directly on consumer GPUs without cloud subscriptions.",
    publishedAt: "January 26, 2026",
    readTime: "6 min read",
    author: {
      name: "ShadowTalk Engineering",
      role: "Edge Runtime Team",
    },
    tags: ["WebGPU", "Edge AI", "Wasm", "Gemma"],
    content: `
### AI at the Browser Edge
Until recently, in-browser AI was limited to small text classifiers. With the stabilization of the **WebGPU** standard across Chrome and Edge, browsers can now leverage native GPU compute shaders via WebAssembly.

#### Implementation in ShadowTalk
ShadowTalk integrates an on-device engine that can download compact quantized models:
- **Tier-A Lightweight (~130MB)**: Near-instant load time for offline formatting and local text transformations.
- **Gemma / Qwen Quantized**: Capable of zero-egress conversational reasoning on modern laptops with dedicated graphics or Apple Silicon.

#### Key Engineering Takeaways
- Always implement streaming chunk decoders to avoid freezing the browser main thread.
- Memory allocation must be pre-allocated to prevent Out-Of-Memory (OOM) tab crashes.
- Seamless fallback to low-latency cloud endpoints ensures that users without compatible hardware never experience broken UI states.
    `,
  },
  {
    id: "post-5",
    title: "The 30+ Tool Graph: How Natural Language Triggers Complex Tool Chains",
    slug: "tool-graph-natural-language",
    category: "Product Updates",
    excerpt: "From deep research bibliographies to live browser code execution: Exploring the grammar and schema behind ShadowTalk's integrated tool orchestrator.",
    publishedAt: "January 14, 2026",
    readTime: "5 min read",
    author: {
      name: "ShadowTalk Core Team",
      role: "Product Engineering",
    },
    tags: ["Tool Orchestrator", "JSON Schema", "Integration"],
    content: `
### Designing Seamless Tool Calling
When tool calling was first introduced, users had to remember exact commands like \`/search\` or \`/eval\`. In ShadowTalk, the tool graph is natively woven into the language model's system context.

#### How It Works Under the Hood
1. **Semantic Intent Classification**: Incoming prompts are classified against a catalog of 30+ registered tool schemas.
2. **Parallel Parameter Extraction**: If a user asks: *"Research the top 3 competitors to Stripe in APAC, scrape their pricing pages, and create a slide outline"*, the tool orchestrator queues:
   - Web Search tool (3 concurrent queries)
   - URL Scraper tool (DOM extraction)
   - Presentation Builder tool (Slide markdown generator)
3. **Streaming Tool Responses**: As each tool returns output, it is fed back into the conversational context, allowing the model to summarize intermediate findings in real-time.
    `,
  },
  {
    id: "post-6",
    title: "Shipping Production AI at 17: Building ShadowTalk from Karachi",
    slug: "shipping-production-ai-karachi-founder",
    category: "Product Updates",
    excerpt: "The founder's perspective on building an autonomous AI workspace from Karachi, competing with Silicon Valley giants, and focusing on true execution.",
    publishedAt: "January 02, 2026",
    readTime: "4 min read",
    author: {
      name: "Zain Ahmed Fahad Patel",
      role: "Founder & Lead Architect",
    },
    tags: ["Founder Story", "Karachi", "Building in Public"],
    content: `
### Why I Built ShadowTalk AI
When I started building ShadowTalk in February 2024, the AI landscape was flooded with reskinned chat apps that did little more than forward text to a third-party API.

As a developer and builder in Karachi, Pakistan, I needed a tool that could actually **do work**:
- An assistant that doesn't just write code, but runs it in an isolated shell.
- A workspace that remembers project architecture without pasting prompts over and over.
- A platform that routes between lightning-fast inference and deep reasoning without costing $200/month.

Today, ShadowTalk AI powers thousands of creators, engineers, and researchers worldwide. We publish our changelogs, build in public, and continuously ship tools that finish the job.
    `,
  },
];

const CATEGORIES = ["All", "Architecture", "Agentic AI", "Tutorials", "Product Updates"];

export const BlogPage = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const filteredPosts = useMemo(() => {
    return PRODUCTION_POSTS.filter((post) => {
      const matchesCat = activeCategory === "All" || post.category === activeCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        post.title.toLowerCase().includes(q) ||
        post.excerpt.toLowerCase().includes(q) ||
        post.tags.some((t) => t.toLowerCase().includes(q));
      return matchesCat && matchesQuery;
    });
  }, [activeCategory, searchQuery]);

  const featuredPost = filteredPosts[0] || PRODUCTION_POSTS[0];
  const gridPosts = filteredPosts.length > 1 ? filteredPosts.slice(1) : filteredPosts;

  const handleShare = (post: BlogPost, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/blog#${post.slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(post.slug);
    toast.success("Article link copied to clipboard!");
    setTimeout(() => setCopiedSlug(null), 2500);
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative selection:bg-primary/20">
      <SEOHead meta={PAGE_SEO.blog} />
      <Navigation />

      {/* Floating Back to Chatbot */}
      <div className="fixed bottom-6 left-6 z-40">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/chatbot")}
          className="gap-2 glass-strong border-border/50 hover:border-primary/40 shadow-lg backdrop-blur-xl"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Chatbot
        </Button>
      </div>

      {/* Hero Section */}
      <section className="pt-28 pb-14 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-dense opacity-20 pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-primary/10 rounded-full blur-[160px] pointer-events-none" />

        <div className="container mx-auto max-w-5xl text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Badge variant="outline" className="mb-4 glass-subtle border-primary/30 text-primary py-1 px-3">
              <BookOpen className="h-3.5 w-3.5 mr-1.5" />
              Engineering, Architecture & Systems Blog
            </Badge>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-4">
              ShadowTalk <span className="gradient-text">Engineering Blog</span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
              Technical deep dives on multi-model routing, agentic state machines, edge runtime benchmarks, 
              and the philosophy of autonomous software design.
            </p>

            {/* Search Input */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search articles, architectures, benchmarks, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 pr-4 py-5 text-sm bg-background/80 border-border/60 rounded-xl shadow-md"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground font-mono"
                >
                  Clear
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Category Tabs */}
      <section className="py-4 px-4 border-y border-border/40 bg-muted/5">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none justify-start sm:justify-center flex-wrap">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all border ${
                    isActive
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "glass-subtle text-muted-foreground hover:text-foreground border-border/50"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Hero Article */}
      {featuredPost && activeCategory === "All" && !searchQuery && (
        <section className="py-8 px-4">
          <div className="container mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card
                onClick={() => setSelectedPost(featuredPost)}
                className="glass-subtle border-primary/30 hover:border-primary/60 cursor-pointer transition-all duration-300 overflow-hidden group shadow-elevated bg-gradient-to-br from-primary/10 via-background to-secondary/5"
              >
                <div className="grid lg:grid-cols-12 gap-6 p-6 sm:p-8 items-center">
                  <div className="lg:col-span-8 space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-primary text-primary-foreground text-xs font-mono">
                        Featured Article
                      </Badge>
                      <Badge variant="outline" className="text-xs font-mono text-muted-foreground border-border/50">
                        {featuredPost.category}
                      </Badge>
                    </div>

                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground group-hover:text-primary transition-colors tracking-tight leading-tight">
                      {featuredPost.title}
                    </h2>

                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      {featuredPost.excerpt}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-2">
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-primary" />
                        <span className="font-medium text-foreground">{featuredPost.author.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{featuredPost.publishedAt}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{featuredPost.readTime}</span>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-4 flex flex-col items-start lg:items-end justify-between h-full gap-4">
                    <div className="flex flex-wrap gap-1.5">
                      {featuredPost.tags.map((t) => (
                        <span key={t} className="text-[10px] px-2.5 py-1 rounded-md bg-muted/60 text-muted-foreground font-mono">
                          #{t}
                        </span>
                      ))}
                    </div>
                    <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 shadow-md">
                      Read Complete Paper
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </section>
      )}

      {/* Grid of Articles */}
      <section className="py-8 pb-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg sm:text-xl font-bold tracking-tight">
              {activeCategory === "All" && !searchQuery ? "Recent Publications" : `Articles (${filteredPosts.length})`}
            </h3>
          </div>

          {filteredPosts.length === 0 ? (
            <div className="text-center py-16 glass-subtle rounded-2xl border border-border/50 p-8 max-w-md mx-auto">
              <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <h4 className="font-bold text-lg mb-1">No articles match your query</h4>
              <p className="text-xs text-muted-foreground mb-4">
                Try searching for another topic or reset the category filters.
              </p>
              <Button variant="outline" size="sm" onClick={() => { setSearchQuery(""); setActiveCategory("All"); }}>
                Reset Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(activeCategory === "All" && !searchQuery ? gridPosts : filteredPosts).map((post, idx) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05, duration: 0.4 }}
                >
                  <Card
                    onClick={() => setSelectedPost(post)}
                    className="glass-subtle border-border/50 hover:border-primary/40 cursor-pointer transition-all duration-300 h-full flex flex-col justify-between p-5 group hover:shadow-elevated"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <Badge variant="outline" className="text-[10px] uppercase font-mono tracking-wider text-primary border-primary/20">
                          {post.category}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground font-mono">{post.readTime}</span>
                      </div>

                      <h4 className="font-bold text-base text-foreground group-hover:text-primary transition-colors leading-snug mb-2">
                        {post.title}
                      </h4>

                      <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed mb-4">
                        {post.excerpt}
                      </p>
                    </div>

                    <div>
                      <div className="flex flex-wrap gap-1 mb-4">
                        {post.tags.map((tag) => (
                          <span key={tag} className="text-[10px] px-2 py-0.5 rounded bg-muted/40 text-muted-foreground font-mono">
                            #{tag}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/30">
                        <div className="flex items-center gap-1.5">
                          <User className="h-3 w-3 text-primary" />
                          <span className="truncate max-w-[130px]">{post.author.name}</span>
                        </div>
                        <button
                          onClick={(e) => handleShare(post, e)}
                          className="hover:text-primary transition-colors p-1"
                          title="Copy Link"
                        >
                          {copiedSlug === post.slug ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Share2 className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Article Reader Modal */}
      <Dialog open={!!selectedPost} onOpenChange={(open) => !open && setSelectedPost(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] p-0 overflow-hidden bg-popover border-border/60">
          {selectedPost && (
            <div className="flex flex-col h-full max-h-[85vh]">
              <DialogHeader className="p-6 pb-4 border-b border-border/40">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-[10px] uppercase font-mono text-primary border-primary/30">
                    {selectedPost.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono">{selectedPost.readTime}</span>
                  <span className="text-xs text-muted-foreground font-mono">· {selectedPost.publishedAt}</span>
                </div>
                <DialogTitle className="text-xl sm:text-2xl font-bold leading-snug">
                  {selectedPost.title}
                </DialogTitle>
                <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{selectedPost.author.name}</span>
                  <span>({selectedPost.author.role})</span>
                </div>
              </DialogHeader>

              <ScrollArea className="p-6 pt-4 flex-1">
                <div className="prose prose-invert prose-sm max-w-none space-y-4 text-foreground/90 leading-relaxed font-sans">
                  {selectedPost.content.split("\n\n").map((block, i) => {
                    const trimmed = block.trim();
                    if (trimmed.startsWith("### ")) {
                      return <h3 key={i} className="text-lg font-bold text-foreground mt-5 mb-2">{trimmed.replace("### ", "")}</h3>;
                    }
                    if (trimmed.startsWith("#### ")) {
                      return <h4 key={i} className="text-base font-semibold text-foreground mt-3 mb-1">{trimmed.replace("#### ", "")}</h4>;
                    }
                    if (trimmed.startsWith("- ")) {
                      return (
                        <ul key={i} className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-muted-foreground">
                          {trimmed.split("\n- ").map((item, j) => (
                            <li key={j}>{item.replace(/^- /, "")}</li>
                          ))}
                        </ul>
                      );
                    }
                    if (/^\d+\.\s/.test(trimmed)) {
                      return (
                        <ol key={i} className="list-decimal pl-5 space-y-1 text-xs sm:text-sm text-muted-foreground">
                          {trimmed.split(/\n\d+\.\s/).map((item, j) => (
                            <li key={j}>{item.replace(/^\d+\.\s/, "")}</li>
                          ))}
                        </ol>
                      );
                    }
                    return <p key={i} className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{trimmed}</p>;
                  })}
                </div>

                <div className="mt-8 pt-6 border-t border-border/40 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap gap-1.5">
                    {selectedPost.tags.map((t) => (
                      <Badge key={t} variant="secondary" className="text-[10px] font-mono">
                        #{t}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => handleShare(selectedPost, e)}
                      className="text-xs gap-1.5"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      Share Article
                    </Button>
                    <Button asChild size="sm" className="bg-primary text-primary-foreground text-xs">
                      <Link to="/chatbot">Execute in Chatbot &rarr;</Link>
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default BlogPage;
