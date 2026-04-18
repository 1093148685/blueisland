import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5170',
        changeOrigin: true,
      },
      '/assets': {
        target: 'http://localhost:5170',
        changeOrigin: true,
      },
    },
  },
  define: {
    __firebase_config: JSON.stringify({
      apiKey: process.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
      authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_PROJECT.firebaseapp.com",
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
      storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "YOUR_PROJECT.appspot.com",
      messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_SENDER_ID",
      appId: process.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID"
    }),
    __app_id: JSON.stringify(process.env.VITE_APP_ID || "blue-island-v2-upgraded"),
    __initial_auth_token: JSON.stringify(process.env.VITE_INITIAL_AUTH_TOKEN || null),
  },
})
