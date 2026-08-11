import { defineConfig } from 'vite';
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/supabase/vite";


// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';

  return {
    server: {
      host: "::",
      port: 8080,
      headers: {
        "Cache-Control": "no-store",
        "Cross-Origin-Opener-Policy": "same-origin",
        "Cross-Origin-Embedder-Policy": "credentialless",
      },
    },
    preview: {
      headers: {
        "Cross-Origin-Opener-Policy": "same-origin",
        "Cross-Origin-Embedder-Policy": "credentialless",
      },
    },
    // NOTE: Do NOT hardcode VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY here.
    // They are read from .env automatically by Vite.
    // The old VITE_API_BASE_URL / VITE_API_KEY overrides were removed — use the new names.
     build: {
       // Production optimizations
       target: 'es2020',
       minify: isProduction ? 'esbuild' : false,
       sourcemap: isProduction ? 'hidden' : true,
       rollupOptions: {
         input: {
           main: path.resolve(__dirname, "index.html"),
           "computer-frame": path.resolve(__dirname, "computer-frame.html"),
         },
         output: {
           // Chunk splitting for better caching
           manualChunks: {
             // NOTE: Do NOT split react/react-dom — causes duplicate React instances
             'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tabs'],
             'query-vendor': ['@tanstack/react-query'],
             'chart-vendor': ['recharts'],
             'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
             // Feature chunks
             'monaco': ['@monaco-editor/react'],
           },
           // Asset naming for long-term caching
           assetFileNames: (assetInfo) => {
             const info = assetInfo.name?.split('.') || [];
             const ext = info[info.length - 1];
             if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
               return `assets/images/[name]-[hash][extname]`;
             }
             if (/woff2?|eot|ttf|otf/i.test(ext)) {
               return `assets/fonts/[name]-[hash][extname]`;
             }
             return `assets/[name]-[hash][extname]`;
           },
           chunkFileNames: 'assets/js/[name]-[hash].js',
           entryFileNames: 'assets/js/[name]-[hash].js',
         },
       },
       // Performance hints
       chunkSizeWarningLimit: 1000,
     },
    plugins: [
      react(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: [
          "favicon.ico",
          "robots.txt",
          "apple-touch-icon.png",
          "llms.txt",
          "llms-full.txt",
          "shadowtalk.json",
          "facts.html",
          "aeo-answers.html",
          "aeo-answers.json",
          "aeo.txt",
          "zain-ahmed-fahad-patel.html",
          "zain-ahmed-fahad-patel.json",
          "zain-ahmed-fahad-patel.txt",
          "zain-ahmed.html",
          "zain-ahmed.json",
          "zain-ahmed.txt",
          "founder-zain-ahmed.html",
          "og-image.svg",
          "google-aeo.txt",
          "google-seo-hub.html",
          "feed.xml",
          "embed/shadowtalk-badge.js",
        ],
        manifest: {
          name: "ShadowTalk AI",
          short_name: "ShadowTalk",
          description: "Advanced AI chatbot with multimodal capabilities",
          theme_color: "#050508",
          background_color: "#050508",
          display: "standalone",
          orientation: "portrait",
          scope: "/",
          start_url: "/",
          icons: [
            {
              src: "/pwa-192x192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any maskable"
            },
            {
              src: "/pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable"
            }
          ],
          categories: ["productivity", "utilities", "business"],
          shortcuts: [
            {
              name: "New Chat",
              short_name: "Chat",
              description: "Start a new conversation",
              url: "/chatbot",
              icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }]
            }
          ]
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
          maximumFileSizeToCacheInBytes: 50 * 1024 * 1024,
          navigateFallbackDenylist: [/^\/~oauth/],
            runtimeCaching: [
              {
                urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                handler: "CacheFirst",
                options: {
                  cacheName: "google-fonts-cache",
                  expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 * 365
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
                }
              },
              {
                urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                handler: "CacheFirst",
                options: {
                  cacheName: "gstatic-fonts-cache",
                  expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 * 365
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
                }
              },
              // ShadowTalk backend caching removed
            ]
        },
        devOptions: {
          enabled: false,
        },
      })
    ].filter(Boolean),
    resolve: {
      // Single React instance — prevents "Cannot read properties of null (reading 'useState')"
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "react-router-dom",
        "framer-motion",
      ],
      alias: {
        "@": path.resolve(__dirname, "./src"),
        react: path.resolve(__dirname, "node_modules/react"),
        "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
        "react/jsx-runtime": path.resolve(__dirname, "node_modules/react/jsx-runtime.js"),
        "react/jsx-dev-runtime": path.resolve(__dirname, "node_modules/react/jsx-dev-runtime.js"),
      },
    },
    optimizeDeps: {
      // Fresh dep graph on each dev server start — avoids mixed ?v= chunk hashes
      force: mode === "development",
      exclude: ["@ffmpeg/ffmpeg", "@ffmpeg/util"],
      include: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "react-dom/client",
        "react-router-dom",
        "framer-motion",
        "@tanstack/react-query",
        "react-helmet-async",
      ],
    },
  };
});
