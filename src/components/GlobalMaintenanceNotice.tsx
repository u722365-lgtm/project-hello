import { motion, AnimatePresence } from "framer-motion";
import { Wrench, X, AlertTriangle, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "shadowtalk_maintenance_notice_seen";

const GlobalMaintenanceNotice = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only show once per session
    if (sessionStorage.getItem(STORAGE_KEY)) return;
    // Small delay so the page loads first
    const t = setTimeout(() => setShow(true), 1200);
    return () => clearTimeout(t);
  }, []);

  const handleClose = () => {
    setShow(false);
    sessionStorage.setItem(STORAGE_KEY, "1");
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-md"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            className="bg-background border border-border rounded-2xl p-7 mx-4 max-w-sm w-full shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Icon */}
            <div className="flex justify-center mb-5">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/20">
                  <Wrench className="h-8 w-8 text-amber-400" />
                </div>
                <motion.div
                  className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center shadow-lg"
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 2 }}
                >
                  <AlertTriangle className="h-3.5 w-3.5 text-white" />
                </motion.div>
              </div>
            </div>

            {/* Text */}
            <div className="text-center space-y-3">
              <h2 className="text-lg font-bold text-foreground flex items-center justify-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                Important Notice
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We're making <span className="text-foreground font-semibold">huge changes</span> to ShadowTalk right now. Some features may not work properly while we upgrade things.
              </p>
              <div className="pt-1">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Maintenance in Progress
                </div>
              </div>
            </div>

            {/* Action */}
            <Button className="w-full mt-6" onClick={handleClose}>
              I Understand
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GlobalMaintenanceNotice;
