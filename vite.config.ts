import { defineConfig } from 'vite';
import react from "@vitejs/plugin-react-swc";
import path from "path";

// ShadowScan MVP — Lean build config (original backed up as vite.config.ts.full-backup)
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';

  return {
    server: {
      host: "::",
      port: 8080,
      headers: {
        "Cross-Origin-Embedder-Policy": "require-corp",
        "Cross-Origin-Opener-Policy": "same-origin",
      },
    },
    build: {
      target: 'es2020',
      minify: isProduction ? 'esbuild' : false,
      sourcemap: isProduction ? 'hidden' : true,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage', 'firebase/analytics', 'firebase/remote-config'],
            'vendor-ui': ['lucide-react', 'framer-motion', '@radix-ui/react-dialog', '@radix-ui/react-toast', 'sonner'],
            'vendor-query': ['@tanstack/react-query'],
          }
        }
      }
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
