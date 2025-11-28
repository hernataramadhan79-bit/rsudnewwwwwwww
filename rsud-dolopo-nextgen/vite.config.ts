import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Define process.env global to be accessible in browser
      'process.env': {
         API_KEY: env.API_KEY,
         VITE_SUPABASE_URL: env.VITE_SUPABASE_URL,
         VITE_SUPABASE_ANON_KEY: env.VITE_SUPABASE_ANON_KEY
      }
    }
  };
});