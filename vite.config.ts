import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-auto';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  resolve: {
    alias: [
      { find: /.*opencascade.wasm.wasm$/, replacement: '/app/mock-wasm.js' }
    ]
  },
  assetsInclude: ['**/*.wasm.wasm', '**/*.wasm', /node_modules\/opencascade\.js\/.*\.wasm$/],
  define: {
    'process.env.IS_PREACT': JSON.stringify('false'),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  },
	build: {
    rollupOptions: {
      external: [
        /node_modules\/opencascade\.js\/.*\.wasm\.wasm$/
      ]
    },
		target: 'es2022'
	},

	optimizeDeps: {
		exclude: ['opencascade.js'],
		include: ['@excalidraw/excalidraw', 'react', 'react-dom', 'react-dom/client']
	},
	worker: {
		format: 'es',
		plugins: () => [wasm(), topLevelAwait()]
	},
	plugins: [
  {
      name: 'mock-opencascade-wasm',
      enforce: 'pre',
      resolveId(id) {
          if (id.includes('opencascade.wasm.wasm')) {
              return '\0opencascade.wasm.wasm';
          }
      },
      load(id) {
          if (id === '\0opencascade.wasm.wasm') {
              return 'export default "";';
          }
      }
  },
		tailwindcss(),
		wasm(),
		topLevelAwait(),
		sveltekit(),
		VitePWA({
			registerType: 'prompt',
			includeAssets: ['**/*.wasm', 'icons/*.png', 'fonts/*.{woff,woff2}'],
			manifest: {
				name: 'LocalMind',
				short_name: 'LocalMind',
				description: 'Privacy-first local computation platform',
				start_url: '/',
				display: 'standalone',
				background_color: '#0a0a0f',
				theme_color: '#7c3aed',
				icons: [
					{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
					{ src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
				]
			},
			workbox: {
				maximumFileSizeToCacheInBytes: 100 * 1024 * 1024, // 50 MiB to accommodate large WASM and Tesseract assets
				runtimeCaching: [
					{
						urlPattern: /\.wasm$/,
						handler: 'CacheFirst',
						options: {
							cacheName: 'wasm-cache',
							expiration: {
								maxEntries: 10,
								maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
							},
							cacheableResponse: {
								statuses: [0, 200]
							}
						}
					},
					{
						urlPattern: /\/api\/ai\//,
						handler: 'NetworkOnly',
						options: {
							cacheName: 'ai-api'
						}
					}
				]
			}
		})
	],
	server: {
		headers: {
			'Cross-Origin-Opener-Policy': 'same-origin',
			'Cross-Origin-Embedder-Policy': 'require-corp'
		}
	},
	preview: {
		headers: {
			'Cross-Origin-Opener-Policy': 'same-origin',
			'Cross-Origin-Embedder-Policy': 'require-corp'
		}
	}
});
