import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// https://vitejs.dev/config/
export default defineConfig({
  // Jalur relatif: berjalan di akar domain maupun subfolder (mis. GitHub Pages /amanda/). Rute memakai hash (#), jadi tanpa fallback server.
  base: './',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id: string) => (id.includes('node_modules/@supabase') ? 'supabase' : id.includes('node_modules/lucide-react') ? 'ikon' : id.includes('node_modules/react') ? 'react' : undefined),
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
