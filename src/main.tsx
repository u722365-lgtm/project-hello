import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import { initPerformanceMonitoring, deferNonCritical } from "./lib/performance";
import { configureTransformersEnv, warmWebGPUProbe } from "./lib/webgpuRuntime";
import { warmHardwareProfile, prewarmFastestLocalPath } from "./lib/hardwareIntelligence";
import { installViteChunkRecovery, clearViteChunkRecoveryFlag } from "./lib/viteChunkRecovery";
import { applyAnonymousAutonomousDefaults } from "./lib/anonymousAutonomousMode";
import { applyPerfProfile } from "./lib/perf/devicePerfTier";

// Detect device perf tier ASAP so CSS degrades heavy effects on low-end hardware.
applyPerfProfile();
 
installViteChunkRecovery();

// Initialize performance monitoring
initPerformanceMonitoring();

applyAnonymousAutonomousDefaults();
 
// Report errors to console in production
if (import.meta.env.PROD) {
  window.addEventListener('error', (event) => {
    console.error('[Global Error]', event.error);
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    console.error('[Unhandled Promise Rejection]', event.reason);
  });
}
 
// Warm WebGPU + configure on-device inference runtimes (idle, non-blocking)
deferNonCritical(() => {
  void configureTransformersEnv();
  warmWebGPUProbe();
  warmHardwareProfile();
  prewarmFastestLocalPath();
});

// Defer non-critical initialization
deferNonCritical(() => {
  // Register service worker for PWA
  if ("serviceWorker" in navigator && import.meta.env.PROD) {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('[SW] Registration failed:', err);
    });
  }
});
 
const container = document.getElementById("root");

if (!container) {
  throw new Error("Root element not found. Check your index.html.");
}

createRoot(container).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>
);

clearViteChunkRecoveryFlag();
