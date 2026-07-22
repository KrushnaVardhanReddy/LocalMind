import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-auto';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
	build: {
		target: 'es2022'
	},
	worker: {
		format: 'es',
		plugins: () => [wasm(), topLevelAwait()]
	},
	plugins: [
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
				maximumFileSizeToCacheInBytes: 50 * 1024 * 1024, // 50 MiB to accommodate large WASM and Tesseract assets
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
	}
});
