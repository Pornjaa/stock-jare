import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // การตั้งค่า base: '' หรือ './' จะช่วยให้ไฟล์ index.html หาไฟล์ js/css เจอไม่ว่าจะ deploy อยู่ที่ path ไหน
  base: '', 
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    strictPort: true,
  }
});