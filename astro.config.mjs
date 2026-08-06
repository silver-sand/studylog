import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import node from '@astrojs/node';
import vercel from '@astrojs/vercel';

// Local dev/build stays on the Node standalone adapter; Vercel builds use
// the Vercel adapter (set by the platform's VERCEL=1 env var).
const adapter = process.env.VERCEL ? vercel() : node({ mode: 'standalone' });

export default defineConfig({
  output: 'server',
  adapter,
  integrations: [tailwind()],
  vite: {
    resolve: {
      alias: {
        '@': '/src',
      },
    },
    optimizeDeps: {
      extensions: ['.js', '.ts', '.jsx', '.tsx'],
    },
    // sql.js loads its WASM from node_modules at runtime; never bundle it
    // into the Vercel function (it's a prod dependency, present in node_modules).
    ssr: {
      external: ['sql.js'],
    },
  },
});
