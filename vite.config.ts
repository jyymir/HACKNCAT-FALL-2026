import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { geminiProxy } from './server/geminiProxy';

export default defineConfig(({ mode }) => {
  // '' prefix = load ALL vars (incl. GEMINI_API_KEY) for the server only.
  // Only VITE_-prefixed vars are ever exposed to the browser, and we define none.
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), geminiProxy(env)],
  };
});
