import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  // When building for GitHub Pages (CI), set a relative base so assets work
  // from the `gh-pages` branch. The workflow below sets GH_PAGES=true.
  base: process.env.GH_PAGES ? './' : '/',
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
