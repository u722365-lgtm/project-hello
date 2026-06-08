import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Eye, Palette, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { SEOHead } from "@/components/SEOHead";
import { AuthDesignMockForm } from "@/components/auth/AuthDesignMockForm";
import { AuthDesignShell } from "@/components/auth/designs/AuthDesignShell";
import {
  AUTH_DESIGNS,
  getStoredAuthDesignChoice,
  setStoredAuthDesignChoice,
  type AuthDesignId,
} from "@/lib/authDesigns";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function AuthDesignGalleryPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selected, setSelected] = useState<AuthDesignId | null>(getStoredAuthDesignChoice());

  const handleSelect = (id: AuthDesignId) => {
    setSelected(id);
    setStoredAuthDesignChoice(id);
    toast({
      title: "Design selected",
      description: `You picked "${AUTH_DESIGNS.find((d) => d.id === id)?.name}". Reply to approve and we'll ship it on /auth.`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        meta={{
          title: "Auth Page Designs — ShadowTalk",
          description: "Preview 6 new ShadowTalk auth page visual designs and pick your favorite.",
        }}
      />

      <div className="border-b border-border/40 bg-card/30 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-primary">
            <Palette className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-wider">Auth redesign</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Choose your sign-in experience</h1>
          <p className="max-w-2xl text-muted-foreground">
            Six visual directions for the new ShadowTalk auth page. Click <strong>Full preview</strong> to see
            each at full size, then <strong>Select this design</strong> on your favorite. Tell us which one
            to approve and we&apos;ll apply it to production.
          </p>
          {selected && (
            <Badge className="w-fit gap-1.5 bg-primary/15 text-primary border-primary/30">
              <Check className="h-3.5 w-3.5" />
              Current pick: {AUTH_DESIGNS.find((d) => d.id === selected)?.name}
            </Badge>
          )}
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 xl:grid-cols-3 sm:px-6 lg:px-8">
        {AUTH_DESIGNS.map((design, index) => (
          <motion.article
            key={design.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            className={cn(
              "group flex flex-col overflow-hidden rounded-2xl border bg-card/50 shadow-lg transition-shadow hover:shadow-xl",
              selected === design.id ? "border-primary ring-2 ring-primary/30" : "border-border/50",
            )}
          >
            <div className="relative aspect-[4/3] overflow-hidden border-b border-border/40 bg-black">
              <div className="absolute inset-0 origin-top-left scale-[0.42] sm:scale-[0.48]">
                <div className="h-[240%] w-[240%]">
                  <AuthDesignShell designId={design.id} compact>
                    <AuthDesignMockForm compact />
                  </AuthDesignShell>
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-3 left-3 flex gap-1.5">
                {design.palette.map((c) => (
                  <div
                    key={c}
                    className="h-4 w-4 rounded-full border border-white/20 shadow-sm"
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-3 p-5">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-lg font-bold">{design.name}</h2>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {design.mood}
                  </Badge>
                </div>
                <p className="mt-0.5 text-sm font-medium text-primary">{design.tagline}</p>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{design.description}</p>
              </div>

              <div className="mt-auto flex flex-wrap gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => navigate(`/auth/preview/${design.id}`)}
                >
                  <Eye className="h-3.5 w-3.5" />
                  Full preview
                </Button>
                <Button
                  size="sm"
                  className="gap-1.5"
                  variant={selected === design.id ? "secondary" : "default"}
                  onClick={() => handleSelect(design.id)}
                >
                  {selected === design.id ? (
                    <>
                      <Check className="h-3.5 w-3.5" /> Selected
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" /> Select this design
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.article>
        ))}
      </div>

      <div className="border-t border-border/40 bg-muted/20 py-8 text-center text-sm text-muted-foreground">
        <Button variant="link" onClick={() => navigate("/auth")}>
          View current production auth page →
        </Button>
      </div>
    </div>
  );
}
