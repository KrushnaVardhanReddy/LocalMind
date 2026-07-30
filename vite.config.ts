import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-auto';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
import { VitePWA } from 'vite-plugin-pwa';
import { APP_VERSION } from './src/lib/config/app-version.js';

const CSP_HEADER = [
	"default-src 'self'",
	"script-src 'self' 'wasm-unsafe-eval'",
	"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
	"font-src 'self' https://fonts.gstatic.com",
	"img-src 'self' data: blob:",
	"connect-src 'self' https://api.openai.com https://api.anthropic.com https://generativelanguage.googleapis.com",
	"worker-src 'self' blob:",
	"child-src blob:",
	"frame-src 'none'",
	"object-src 'none'",
	"base-uri 'self'",
	"form-action 'self'",
	"upgrade-insecure-requests;"
].join('; ');

export default defineConfig({
	build: {
		target: 'es2022'
	},
	optimizeDeps: {
		exclude: ['opencascade.js']
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
			devOptions: {
				enabled: true
			},
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
				navigateFallback: null,
				maximumFileSizeToCacheInBytes: 100 * 1024 * 1024, // 50 MiB to accommodate large WASM and Tesseract assets
				cleanupOutdatedCaches: true,
				runtimeCaching: [
					{
						urlPattern: /\.wasm$/,
						handler: 'CacheFirst',
						options: {
							cacheName: `wasm-cache-${APP_VERSION}`,
							expiration: {
								maxEntries: 10,
								maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
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
			'Content-Security-Policy-Report-Only': `${CSP_HEADER}; report-uri /csp-report`,
			'Cross-Origin-Opener-Policy': 'same-origin',
			'Cross-Origin-Embedder-Policy': 'require-corp'
		}
	},
	preview: {
		headers: {
			'Content-Security-Policy': CSP_HEADER,
			'Cross-Origin-Opener-Policy': 'same-origin',
			'Cross-Origin-Embedder-Policy': 'require-corp'
		}
	}
});
