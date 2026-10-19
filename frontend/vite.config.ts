import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(() => {
  // The proxy target is read from the real process environment so it works in
  // Docker (where docker-compose sets VITE_API_PROXY). The config file runs in
  // Node, so process.env has the container env. Defaults to the indexer's host
  // port for local non-docker dev. VITE_API_PROXY is NOT exposed to the client
  // (only the proxy behaviour uses it server-side).
  const apiProxyTarget = process.env.VITE_API_PROXY || 'http://localhost:3001'

  return {
    plugins: [react()],
    server: {
      host: true,
      proxy: {
        // Proxy /api to the indexer so the browser only talks to the Vite
        // dev server (no CORS). Override the target via VITE_API_PROXY.
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
    },
  }
})
