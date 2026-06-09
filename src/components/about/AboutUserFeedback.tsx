import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquareQuote, Star, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { ABOUT_USER_FEEDBACK } from "@/lib/aboutUserFeedback";

const sourceColors: Record<string, string> = {
  WhatsApp: "bg-green-500/10 text-green-600 border-green-500/30",
  "In-app": "bg-primary/10 text-primary border-primary/30",
  "AI community": "bg-accent/10 text-accent border-accent/30",
  "Engineer review": "bg-secondary/10 text-secondary border-secondary/30",
};

const AboutUserFeedback = () => {
  return (
    <section className="py-20 px-4" id="user-feedback">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-14">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 200 }}
            className="inline-flex items-center gap-2 glass-subtle rounded-full px-5 py-2 mb-6"
          >
            <MessageSquareQuote className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground font-medium">Real User Feedback</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold mb-3 tracking-tight"
          >
            What people say after trying ShadowTalk
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground max-w-2xl mx-auto"
          >
            Not marketing copy — actual messages from users, builders, and an AI engineer who tested the product.
          </motion.p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {ABOUT_USER_FEEDBACK.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              whileHover={{ y: -4, transition: { type: "spring", stiffness: 400 } }}
              className={i === 0 ? "md:col-span-2" : ""}
            >
              <Card className="h-full border-border/50 hover:border-primary/25 transition-all hover:shadow-[0_8px_30px_-12px_hsl(var(--primary)/0.12)] group">
                <CardContent className="p-6 md:p-7">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-primary/10 shrink-0">
                        <item.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{item.author}</p>
                        <p className="text-xs text-muted-foreground">{item.role}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <Badge variant="outline" className={`text-[10px] ${sourceColors[item.source] ?? ""}`}>
                        {item.source}
                      </Badge>
                      {item.rating != null && (
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: item.rating }).map((_, s) => (
                            <Star key={s} className="h-3.5 w-3.5 fill-warning text-warning" />
                          ))}
                          <span className="text-xs font-bold ml-1">{item.rating}/5</span>
                          {item.rating === 5 && <Heart className="h-3.5 w-3.5 text-red-500 ml-1 fill-red-500" />}
                        </div>
                      )}
                    </div>
                  </div>

                  <blockquote className="text-sm md:text-base text-foreground/90 leading-relaxed border-l-2 border-primary/30 pl-4 mb-3">
                    &ldquo;{item.quote}&rdquo;
                  </blockquote>

                  {item.quoteUr && (
                    <p className="text-sm text-muted-foreground italic mb-3 pl-4">&ldquo;{item.quoteUr}&rdquo;</p>
                  )}

                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/40">
                    {item.highlight && (
                      <Badge variant="secondary" className="text-[10px] font-normal">
                        {item.highlight}
                      </Badge>
                    )}
                    {item.date && <span className="text-[10px] text-muted-foreground ml-auto">{item.date}</span>}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-xs text-muted-foreground mt-8"
        >
          Feedback collected via WhatsApp, in-app support, and AI builder communities. Names used with permission or
          lightly anonymized where requested.
        </motion.p>
      </div>
    </section>
  );
};

export default AboutUserFeedback;
