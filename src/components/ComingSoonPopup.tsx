import { motion, AnimatePresence } from "framer-motion";
import { Construction, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ComingSoonPopupProps {
  feature: string;
  description: string;
  onClose: () => void;
}

const ComingSoonPopup = ({ feature, description, onClose }: ComingSoonPopupProps) => {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          className="bg-background border border-border rounded-2xl p-8 mx-4 max-w-md w-full shadow-2xl relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Icon */}
          <div className="flex justify-center mb-5">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border border-primary/20">
                <Construction className="h-8 w-8 text-primary" />
              </div>
              <motion.div
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500/90 flex items-center justify-center"
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Sparkles className="h-3 w-3 text-white" />
              </motion.div>
            </div>
          </div>

          {/* Text */}
          <div className="text-center space-y-3">
            <h2 className="text-xl font-bold text-foreground">Coming Soon</h2>
            <p className="text-sm font-semibold text-primary">{feature}</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
            <div className="pt-2">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary font-medium">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Under Development
              </div>
            </div>
          </div>

          {/* Action */}
          <Button className="w-full mt-6" onClick={onClose}>
            Got it
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ComingSoonPopup;
