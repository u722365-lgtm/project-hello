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
    },
    build: {
      target: 'es2020',
      minify: isProduction ? 'esbuild' : false,
      sourcemap: isProduction ? 'hidden' : true,
      chunkSizeWarningLimit: 500,
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
