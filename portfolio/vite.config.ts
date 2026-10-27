import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

const COUNTER_NS = 'swaraj-portfolio'
const COUNTER_KEY = 'visits'

/** Dev-only mirror of /api/visits (Vercel serverless in production). */
function visitsApiPlugin(): Plugin {
  return {
    name: 'visits-api',
    configureServer(server) {
      server.middlewares.use('/api/visits', async (req, res, next) => {
        if (req.method !== 'GET') {
          res.statusCode = 405
          res.end('Method not allowed')
          return
        }

        try {
          const url = new URL(req.url ?? '', 'http://localhost')
          const hit = url.searchParams.get('hit') === '1'
          const endpoint = hit ? 'hit' : 'get'
          const upstream = await fetch(
            `https://abacus.jasoncameron.dev/${endpoint}/${COUNTER_NS}/${COUNTER_KEY}`,
            { cache: 'no-store' },
          )
          if (!upstream.ok) {
            res.statusCode = 502
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Counter unavailable' }))
            return
          }
          const data = (await upstream.json()) as { value?: number }
          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Cache-Control', 'no-store')
          res.end(JSON.stringify({ count: Number(data.value) || 0 }))
        } catch {
          next()
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), visitsApiPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(rootDir, './src'),
    },
  },
})
