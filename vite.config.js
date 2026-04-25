import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiKey = env.ANTHROPIC_API_KEY

  return defineConfig({
    plugins: [react()],
    server: {
      proxy: apiKey
        ? {
            '/api/anthropic': {
              target: 'https://api.anthropic.com',
              changeOrigin: true,
              rewrite: (path) => path.replace(/^\/api\/anthropic/, '/v1/messages'),
              headers: {
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
              },
            },
          }
        : undefined,
    },
  })
}
