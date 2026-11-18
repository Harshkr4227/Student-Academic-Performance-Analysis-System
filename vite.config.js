import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  server: {
    port: 5173,
    open: '/pages/index.html'
  },
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        main: resolve(__dirname, 'pages/index.html'),
        register: resolve(__dirname, 'pages/register.html'),
        login: resolve(__dirname, 'pages/login.html'),
        student: resolve(__dirname, 'pages/student-dashboard.html'),
        teacher: resolve(__dirname, 'pages/teacher-dashboard.html')
      }
    }
  }
});
