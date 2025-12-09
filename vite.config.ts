import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// allow using process.env in this config without adding Node types to the project
// provide a narrow shape to avoid using `any` and satisfy eslint
declare const process: { env: { [key: string]: string | undefined } };

// https://vitejs.dev/config/
export default defineConfig({
  // When building for GitHub Pages (gh-pages), set a relative base so assets work
  // from the `gh-pages` branch. The deploy script below sets GH_PAGES=true.
  // Use an explicit string check to avoid surprising falsy values.
  base: process.env.GH_PAGES === 'true' ? './' : '/',
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  // Build additional HTML entry points (multi-page) so pages like login.html
  // and register.html are emitted to `dist/` and can be served directly by
  // Vercel or any static host.
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        login: 'login.html',
        register: 'register.html',
        student: 'student-dashboard.html',
        teacher: 'teacher-dashboard.html'
      }
    }
  }
});
