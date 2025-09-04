import { defineConfig } from 'vite'
import { loadEnv } from 'vite'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GOOGLE_CLIENT_ID': JSON.stringify("701163436416-qhftqh81nol5a4sd2loo3dfhr8hg9ul6.apps.googleusercontent.com"),
    }
  }
})
