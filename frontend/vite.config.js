import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Honour PORT when the environment supplies one, otherwise use Vite's default.
    port: Number(process.env.PORT) || 5173,
  },
});
