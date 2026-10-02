import { writeFile } from 'node:fs/promises'
import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import vueDevTools from 'vite-plugin-vue-devtools'

// Dev only: the trail editor on the home page (TrailEditor.vue) saves its
// tweaks here, into src/content/trailTweaks.json.
function trailTweaksEndpoint() {
  const file = fileURLToPath(new URL('./src/content/trailTweaks.json', import.meta.url))
  return {
    name: 'trail-tweaks-endpoint',
    apply: 'serve',
    // The editor already shows what it saved: no hot update (it would remount the page).
    handleHotUpdate({ file: changed }) {
      if (changed === file) return []
    },
    configureServer(server) {
      server.middlewares.use('/__dev/trail-tweaks', (req, res) => {
        if (req.method !== 'POST') return ((res.statusCode = 405), res.end())
        let body = ''
        req.on('data', (chunk) => (body += chunk))
        req.on('end', async () => {
          try {
            const { move = {}, handle = {}, add = [], remove = [] } = JSON.parse(body)
            const json = JSON.stringify({ move, handle, add, remove })
            const { format } = await import('prettier')
            await writeFile(file, await format(json, { parser: 'json' }))
            res.end('ok')
          } catch (e) {
            res.statusCode = 400
            res.end(String(e))
          }
        })
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss(), vueDevTools(), trailTweaksEndpoint()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // Pure modules shared with Cloud Functions (validation rules, school years).
      '@shared': fileURLToPath(new URL('./functions/src/shared', import.meta.url)),
    },
  },
  server: {
    host: true, // access page on LAN
  },
})
