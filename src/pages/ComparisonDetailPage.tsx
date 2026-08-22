import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle2, Scale, Shield } from "lucide-react";
import { COMPARISON_PAGE_BY_SLUG, COMPARISON_PAGES } from "@/lib/comparisonPages";
import {
  getBreadcrumbSchema,
  getFAQSchema,
  getItemListSchema,
  getSoftwareApplicationSchema,
  getWebPageSchema,
} from "@/lib/seo";
import NotFound from "./NotFound";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.45 },
  }),
};

const ComparisonDetailPage = () => {
  const { slug } = useParams();
  const page = slug ? COMPARISON_PAGE_BY_SLUG[slug] : undefined;

  if (!page) return <NotFound />;

  const relatedPages = COMPARISON_PAGES.filter((item) => item.slug !== page.slug).map((item) => ({
    name: item.title,
    url: item.canonical,
    description: item.description,
  }));

  const structuredData = [
    getWebPageSchema({
      title: page.title,
      description: page.description,
      url: page.canonical,
      about: ["AI comparison", "AI workspace", page.competitor, "agentic AI", "AI"],
    }),
    getBreadcrumbSchema([
      { name: "Home", url: "https://www.shadowtalk-ai.com/home" },
      { name: "Comparisons", url: "https://www.shadowtalk-ai.com/competitive" },
      { name: page.title, url: page.canonical },
    ]),
    getFAQSchema(page.faq),
    getSoftwareApplicationSchema(),
    getItemListSchema(relatedPages),
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        meta={{
          title: page.title,
          description: page.description,
          canonical: page.canonical,
          keywords: [
            "ShadowTalk AI comparison",
            `ShadowTalk AI vs ${page.competitor}`,
            `${page.competitor} alternative`,
            "AI workspace comparison",
            "agentic AI",
          ],
        }}
        structuredData={structuredData}
      />
      <Navigation />

      <section className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-5xl">
          <Badge variant="outline" className="mb-4 border-primary/20 bg-primary/5">
            <Scale className="mr-1 h-3.5 w-3.5" />
            Structured comparison page
          </Badge>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold tracking-tight mb-5"
          >
            {page.title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="text-lg text-muted-foreground max-w-3xl"
          >
            {page.summary}
          </motion.p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild className="gap-2">
              <Link to="/chatbot">
                Try ShadowTalk Free <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/docs">Read architecture and docs</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="pb-12 px-4">
        <div className="container mx-auto max-w-5xl grid gap-6 md:grid-cols-[1.5fr_1fr]">
          <div className="rounded-2xl border border-border/50 bg-card/50 p-6">
            <h2 className="text-2xl font-semibold mb-5">Head-to-head comparison</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border/60">
                    <th className="py-3 pr-4 text-left text-muted-foreground">Category</th>
                    <th className="py-3 px-4 text-left">ShadowTalk AI</th>
                    <th className="py-3 pl-4 text-left text-muted-foreground">{page.competitor}</th>
                  </tr>
                </thead>
                <tbody>
                  {page.rows.map((row, index) => (
                    <motion.tr
                      key={row.category}
                      custom={index}
                      variants={fadeUp}
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true }}
                      className="border-b border-border/30 align-top"
                    >
                      <td className="py-4 pr-4 font-medium">{row.category}</td>
                      <td className="py-4 px-4 text-foreground">{row.shadowtalk}</td>
                      <td className="py-4 pl-4 text-muted-foreground">{row.competitor}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Why ShadowTalk wins</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-5">{page.bestFor}</p>
            <div className="space-y-4">
              {page.whyShadowTalkWins.map((point, index) => (
                <motion.div
                  key={point}
                  custom={index}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="flex items-start gap-3"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  <p className="text-sm leading-6">{point}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="pb-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="rounded-2xl border border-border/50 bg-card/40 p-6">
            <h2 className="text-2xl font-semibold mb-6">FAQ</h2>
            <div className="grid gap-5 md:grid-cols-2">
              {page.faq.map((item, index) => (
                <motion.div
                  key={item.question}
                  custom={index}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="rounded-xl border border-border/40 bg-background/60 p-5"
                >
                  <h3 className="font-semibold mb-2">{item.question}</h3>
                  <p className="text-sm text-muted-foreground leading-6">{item.answer}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="pb-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-2xl font-semibold mb-6">More comparison pages</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {relatedPages.map((item) => (
              <Link
                key={item.url}
                to={new URL(item.url).pathname}
                className="rounded-2xl border border-border/40 bg-card/40 p-6 transition-colors hover:border-primary/30 hover:bg-primary/5"
              >
                <h3 className="font-semibold mb-2">{item.name}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ComparisonDetailPage;
