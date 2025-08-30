import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Optimize chunks for better caching and reduced critical path
    rollupOptions: {
      output: {
        // More granular chunk separation for better loading
        manualChunks: (id) => {
          // Core React libraries
          if (id.includes('react') || id.includes('react-dom')) {
            return 'react-vendor';
          }
          
          // Supabase - critical for app functionality
          if (id.includes('@supabase/supabase-js')) {
            return 'supabase';
          }
          
          // UI library components - can be loaded later
          if (id.includes('@radix-ui') || id.includes('lucide-react')) {
            return 'ui-components';
          }
          
          // Form and validation libraries
          if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('zod')) {
            return 'form-libs';
          }
          
          // Utility libraries
          if (id.includes('date-fns') || id.includes('clsx') || id.includes('tailwind-merge')) {
            return 'utils';
          }
          
          // Analytics and non-critical features
          if (id.includes('analytics') || id.includes('html2canvas') || id.includes('jspdf')) {
            return 'features';
          }
          
          // Large libraries that can be deferred
          if (id.includes('dompurify') || id.includes('recharts')) {
            return 'heavy-libs';
          }
          
          // Default vendor chunk for remaining node_modules
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
        // Ensure consistent file names with content hashes for caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // Optimize asset handling
    assetsInlineLimit: 4096, // Inline small assets to reduce requests
    cssCodeSplit: true, // Split CSS for better caching
    sourcemap: false, // Reduce build size in production
    // Target modern browsers for smaller bundles
    target: 'es2020',
    // Minimize chunks to reduce parsing time
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console logs in production
        drop_debugger: true,
      },
    },
  },
  // Add cache headers for development server (helps with local development)
  preview: {
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  },
}));
