import path from 'path';
import fs from 'fs';
import zlib from 'zlib';
import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Writes ffmpeg-core.wasm.br and .gz next to the 32 MB wasm in dist/ so
// server/index.js can send them as-is instead of gzipping it per request.
const precompressFfmpegWasm = (): Plugin => ({
  name: 'precompress-ffmpeg-wasm',
  apply: 'build',
  closeBundle() {
    const wasm = path.resolve(__dirname, 'dist/ffmpeg/ffmpeg-core.wasm');
    if (!fs.existsSync(wasm)) return;
    const data = fs.readFileSync(wasm);
    // Brotli quality 9: 8.4 MB in about 2 s. Quality 11 saves another 1 MB but takes a minute.
    fs.writeFileSync(`${wasm}.br`, zlib.brotliCompressSync(data, {
      params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 9, [zlib.constants.BROTLI_PARAM_SIZE_HINT]: data.length },
    }));
    fs.writeFileSync(`${wasm}.gz`, zlib.gzipSync(data, { level: 9 }));
  },
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
      },
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
        }
      }
    },
    plugins: [react(), precompressFfmpegWasm()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    optimizeDeps: {
      exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util']
    },
    build: {
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          passes: 2,
        },
        format: {
          comments: false,
        },
      },
      cssMinify: true,
    }
  };
});
