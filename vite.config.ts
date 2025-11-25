import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  root: '.', // your actual root folder
  base: '/', // absolute paths from root for GitHub Pages
  plugins: [react(), visualizer({ filename: 'dist/report.html', open: true })],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        sourcemapExcludeSources: true,
        manualChunks: {
          vendor: [
            "react",
            "react-dom",
            "react-router-dom",
            "thirdweb",
            "gsap"
          ],
        },
      },
    },
  },
});
