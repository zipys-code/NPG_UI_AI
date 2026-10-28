import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: './',
  server: {
    host: "::",
    port: 8081, // מותאם לפורט שבו את משתמשת בדפדפן
    hmr: {
      overlay: false,
    },
    // הגדרת הפרוקסי לעקיפת CORS
    proxy: {
      '/api': {
        target: 'http://localhost:8085',
        changeOrigin: true,
        secure: false,
        // מסיר את המילה /api לפני שהבקשה נשלחת ל-Tibco
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  plugins: [
    react(),
    mode === "development" && componentTagger()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));