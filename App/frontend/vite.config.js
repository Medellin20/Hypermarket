import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Redirige les appels API vers le backend Express en développement
      '/api': 'http://localhost:4000'
    }
  }
});
