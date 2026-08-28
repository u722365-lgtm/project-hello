import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Rocket, Code, PenTool, Database, 
  BrainCircuit, Shield, Globe, Sparkles 
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface CinematicOnboardingProps {
  onComplete: (profile: string) => void;
}

const roles = [
  { id: "developer", label: "Developer", icon: Code, description: "Code generation, debugging, architecture" },
  { id: "writer", label: "Writer", icon: PenTool, description: "Drafting, editing, content creation" },
  { id: "researcher", label: "Researcher", icon: Database, description: "Deep research, data analysis" },
  { id: "strategist", label: "Strategist", icon: BrainCircuit, description: "Business planning, ideation" },
];

const features = [
  { icon: Globe, label: "ShadowBrowser", description: "Browse the web securely with AI assistance." },
  { icon: Shield, label: "Stealth Vault", description: "End-to-end encrypted notes and memories." },
  { icon: Sparkles, label: "Mission Control", description: "Autonomous multi-agent workflows." }
];

export function CinematicOnboarding({ onComplete }: CinematicOnboardingProps) {
  const [step, setStep] = useState(0);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    if (step === 2) {
      const interval = setInterval(() => {
        setActiveFeature((prev) => (prev + 1) % features.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [step]);

  const handleNext = () => setStep((s) => Math.min(s + 1, 3));
  const handleBack = () => setStep((s) => Math.max(s - 1, 0));

  const handleComplete = () => {
    onComplete(selectedRole || "general");
  };

  const slideVariants = {
    initial: { opacity: 0, x: 50, scale: 0.95 },
    animate: { opacity: 1, x: 0, scale: 1 },
    exit: { opacity: 0, x: -50, scale: 0.95 }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-3xl overflow-hidden">
      
      {/* Dynamic Background Glow based on step */}
      <motion.div 
        className="absolute w-[800px] h-[800px] rounded-full blur-[120px] opacity-20 pointer-events-none"
        animate={{
          background: step === 0 
            ? "radial-gradient(circle, rgba(56,189,248,0.8) 0%, rgba(0,0,0,0) 70%)"
            : step === 1 
            ? "radial-gradient(circle, rgba(168,85,247,0.8) 0%, rgba(0,0,0,0) 70%)"
            : step === 2 
            ? "radial-gradient(circle, rgba(236,72,153,0.8) 0%, rgba(0,0,0,0) 70%)"
            : "radial-gradient(circle, rgba(16,185,129,0.8) 0%, rgba(0,0,0,0) 70%)",
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative w-full max-w-2xl bg-card/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 sm:p-12 shadow-2xl overflow-hidden">
        <AnimatePresence mode="wait">
          
          {/* STEP 0: THE HOOK */}
          {step === 0 && (
            <motion.div 
              key="step0"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex flex-col items-center text-center space-y-8"
            >
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-32 h-32 rounded-full border-[1px] border-primary/30 flex items-center justify-center relative shadow-[0_0_40px_rgba(56,189,248,0.2)]"
              >
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary to-blue-600 flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                {/* Orbital rings */}
                <div className="absolute inset-[-10px] rounded-full border border-dashed border-primary/20" />
                <div className="absolute inset-[-20px] rounded-full border border-dashed border-primary/10" />
              </motion.div>
              
              <div className="space-y-3">
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/50 bg-clip-text text-transparent">
                  Meet ShadowTalk.
                </h1>
                <p className="text-lg text-muted-foreground max-w-md mx-auto">
                  The most advanced, private, and agentic AI workspace ever built.
                </p>
              </div>

              <Button size="lg" className="w-full sm:w-auto h-12 px-8 rounded-full text-base" onClick={handleNext}>
                Begin Setup <Rocket className="ml-2 w-4 h-4" />
              </Button>
            </motion.div>
          )}

          {/* STEP 1: PERSONALIZATION */}
          {step === 1 && (
            <motion.div 
              key="step1"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.4 }}
              className="space-y-8"
            >
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold">What's your primary focus?</h2>
                <p className="text-muted-foreground">We'll tailor the neural OS to your workflow.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {roles.map((role) => {
                  const Icon = role.icon;
                  const isSelected = selectedRole === role.id;
                  return (
                    <motion.button
                      key={role.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedRole(role.id)}
                      className={`relative p-5 rounded-2xl border text-left transition-all ${
                        isSelected 
                          ? "bg-primary/10 border-primary shadow-[0_0_20px_rgba(168,85,247,0.15)]" 
                          : "bg-background/50 border-white/5 hover:border-white/20 hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <h3 className="font-semibold text-lg">{role.label}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">{role.description}</p>
                    </motion.button>
                  );
                })}
              </div>

              <div className="flex justify-between items-center pt-4">
                <Button variant="ghost" onClick={handleBack}>Back</Button>
                <Button size="lg" className="rounded-full px-8" onClick={handleNext} disabled={!selectedRole}>
                  Continue
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: POWER FEATURES */}
          {step === 2 && (
            <motion.div 
              key="step2"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.4 }}
              className="space-y-8"
            >
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold">Built for Domination</h2>
                <p className="text-muted-foreground">Unlock capabilities no other platform offers.</p>
              </div>

              <div className="relative h-48 bg-black/20 rounded-2xl border border-white/5 p-6 flex items-center justify-center overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeFeature}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col items-center text-center space-y-4"
                  >
                    {(() => {
                      const Feature = features[activeFeature];
                      const Icon = Feature.icon;
                      return (
                        <>
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/30 flex items-center justify-center">
                            <Icon className="w-8 h-8 text-pink-400" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-foreground">{Feature.label}</h3>
                            <p className="text-muted-foreground mt-1">{Feature.description}</p>
                          </div>
                        </>
                      );
                    })()}
                  </motion.div>
                </AnimatePresence>
                
                {/* Indicators */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {features.map((_, idx) => (
                    <div 
                      key={idx} 
                      className={`h-1.5 rounded-full transition-all duration-300 ${idx === activeFeature ? "w-6 bg-pink-500" : "w-1.5 bg-white/20"}`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4">
                <Button variant="ghost" onClick={handleBack}>Back</Button>
                <Button size="lg" className="rounded-full px-8" onClick={handleNext}>
                  Next
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: LIFT OFF */}
          {step === 3 && (
            <motion.div 
              key="step3"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center text-center space-y-8 py-8"
            >
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="w-24 h-24 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.3)]"
              >
                <Rocket className="w-10 h-10 text-emerald-400" />
              </motion.div>
              
              <div className="space-y-3">
                <h2 className="text-4xl font-bold bg-gradient-to-br from-emerald-400 to-emerald-700 bg-clip-text text-transparent">
                  System Ready.
                </h2>
                <p className="text-lg text-muted-foreground max-w-md mx-auto">
                  Your personalized instance is online and heavily fortified.
                </p>
              </div>

              <Button size="lg" className="w-full sm:w-auto h-14 px-10 rounded-full text-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all hover:scale-105" onClick={handleComplete}>
                Initialize Workspace
              </Button>
            </motion.div>
          )}

        </AnimatePresence>

        {/* Progress Bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
          <motion.div 
            className="h-full bg-primary"
            initial={{ width: "25%" }}
            animate={{ width: `${((step + 1) / 4) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>
    </div>
  );
}
