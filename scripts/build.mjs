import { build } from 'esbuild'
import { copyFileSync, mkdirSync } from 'node:fs'

const only = process.argv[2]
mkdirSync('dist', { recursive: true })

const node = { bundle: true, platform: 'node', format: 'cjs', target: 'node22', logLevel: 'warning' }

if (only === 'sim') {
  await build({ ...node, entryPoints: ['scripts/sim.ts'], outfile: 'dist/sim.js' })
} else {
  await Promise.all([
    build({ ...node, entryPoints: ['src/main/main.ts'], outfile: 'dist/main.js', external: ['electron'] }),
    build({ ...node, entryPoints: ['src/main/preload.ts'], outfile: 'dist/preload.js', external: ['electron'] }),
    build({
      bundle: true,
      platform: 'browser',
      format: 'iife',
      target: 'chrome130',
      entryPoints: ['src/renderer/main.ts'],
      outfile: 'dist/renderer.js',
      logLevel: 'warning',
    }),
  ])
  copyFileSync('src/renderer/index.html', 'dist/index.html')
  copyFileSync('assets/misaki_gothic.ttf', 'dist/misaki_gothic.ttf')
}
