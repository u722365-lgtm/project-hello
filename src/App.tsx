import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/components/AuthProvider";

const ChatbotPage = lazy(() => import("./pages/ChatbotPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));

function PageLoader() {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-zinc-950">
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<ChatbotPage />} />
              <Route path="/chatbot" element={<ChatbotPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
