import build from '@hono/vite-build/cloudflare-pages'
import devServer from '@hono/vite-dev-server'
import adapter from '@hono/vite-dev-server/cloudflare'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    build(),
    devServer({
      adapter,
      entry: 'src/index.tsx'
    })
  ],
  // Stamped into the bundle so an always-open Scale House tab can tell when a
  // newer build has been deployed and reload itself at a quiet moment.
  define: {
    __BUILD_ID__: JSON.stringify(new Date().toISOString().replace(/[-:]/g, '').slice(0, 15))
  },
  build: {
    outDir: 'dist'
  }
})
