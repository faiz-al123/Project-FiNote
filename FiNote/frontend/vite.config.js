import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Backend FiNote dipanggil langsung lewat VITE_API_BASE_URL (lihat src/api/client.js),
// jadi tidak perlu proxy. Port dikunci ke 5173 karena backend hanya mengizinkan
// CORS dari origin http://localhost:5173 (CORS_ORIGIN di backend/.env).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
  },
})