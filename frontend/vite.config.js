import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    base: env.VITE_BASE_PATH || '/',
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: false,
      allowedHosts: ['.e2b.app', 'localhost', '127.0.0.1'],
      proxy: {
        '/api': {
          target: env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:5000',
          changeOrigin: true,
          configure(proxy) {
            // API calls are proxied server-to-server; they do not need browser CORS headers.
            proxy.on('proxyReq', proxyRequest => proxyRequest.removeHeader('origin'));
          }
        }
      }
    }
  };
});
