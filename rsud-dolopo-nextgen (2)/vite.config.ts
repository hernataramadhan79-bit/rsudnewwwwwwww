import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Cast process to any to avoid TypeScript errors if @types/node isn't perfectly loaded
  const cwd = (process as any).cwd();
  const env = loadEnv(mode, cwd, '');
  
  return {
    plugins: [react()],
    define: {
      // Define process.env global to be accessible in browser code
      // This is crucial for the Supabase and Gemini clients to work after build
      'process.env': {
         API_KEY: env.API_KEY,
         VITE_SUPABASE_URL: env.VITE_SUPABASE_URL,
         VITE_SUPABASE_ANON_KEY: env.VITE_SUPABASE_ANON_KEY
      }
    }
  };
});