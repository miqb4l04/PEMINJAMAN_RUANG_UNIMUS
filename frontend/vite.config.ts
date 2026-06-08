import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        // Tambahan alias untuk mempermudah import
        '@components': path.resolve(__dirname, './src/components'),
        '@pages': path.resolve(__dirname, './src/pages'),
        '@services': path.resolve(__dirname, './src/services'),
        '@contexts': path.resolve(__dirname, './src/contexts'),
        '@types': path.resolve(__dirname, './src/types'),
      },
    },
    server: {
      // PERBAIKAN 1: Ganti target proxy ke port 3001 (sesuai server.ts)
      // PERBAIKAN 2: Tambahkan fallback jika backend pake port lain
      proxy: {
        '/api': {
          target: process.env.VITE_API_URL || 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
          // PERBAIKAN 3: Tambahkan rewrite untuk menghindari double slash
          rewrite: (path) => path.replace(/^\/api/, '/api'),
          // PERBAIKAN 4: Handle error proxy agar tidak crash
          configure: (proxy, options) => {
            proxy.on('error', (err, req, res) => {
              console.log('Proxy error:', err);
              if (res && !res.headersSent) {
                res.writeHead(500, {
                  'Content-Type': 'application/json',
                });
                res.end(JSON.stringify({ 
                  error: 'Tidak dapat terhubung ke server backend',
                  details: err.message 
                }));
              }
            });
            proxy.on('proxyReq', (proxyReq, req, res) => {
              console.log(`[Proxy] ${req.method} ${req.url} -> ${options.target}${req.url}`);
            });
          },
        },
      },
      // PERBAIKAN 5: HMR configuration lebih baik
      hmr: {
        overlay: true,
        port: 5174, // Port berbeda untuk HMR
        // Jika disable HMR, pakai false
        ...(process.env.DISABLE_HMR === 'true' && { protocol: 'ws', host: 'localhost' }),
      },
      // PERBAIKAN 6: Port frontend
      port: 5173,
      // PERBAIKAN 7: Host agar bisa diakses dari network
      host: true,
      // PERBAIKAN 8: Disable file watching saat DISABLE_HMR true
      watch: process.env.DISABLE_HMR === 'true' ? null : {
        usePolling: true, // Untuk WSL atau environment tertentu
        interval: 1000,
      },
      // PERBAIKAN 9: Tambahkan CORS headers untuk development
      cors: true,
      // PERBAIKAN 10: Increase timeout untuk proxy
      proxyTimeout: 60000,
    },
    // PERBAIKAN 11: Build configuration
    build: {
      outDir: 'dist',
      sourcemap: true,
      // PERBAIKAN 12: Chunk size warning (optional)
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            // Pisahkan vendor chunks untuk performa lebih baik
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'ui-vendor': ['framer-motion', 'lucide-react'],
          },
        },
      },
    },
    // PERBAIKAN 13: Environment variables prefix
    envPrefix: 'VITE_',
  };
});