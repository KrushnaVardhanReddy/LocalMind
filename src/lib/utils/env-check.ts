export function validateCrossOriginIsolation(): void {
	if (typeof window === 'undefined') return;

	if (!window.crossOriginIsolated) {
		const errorMessage = 'SharedArrayBuffer is unavailable. DuckDB multi-threading is disabled. Contact your hosting provider.';
		console.error(errorMessage);

		const banner = document.createElement('div');
		banner.style.position = 'fixed';
		banner.style.top = '0';
		banner.style.left = '0';
		banner.style.width = '100%';
		banner.style.backgroundColor = '#ef4444'; // tailwind red-500
		banner.style.color = '#ffffff';
		banner.style.textAlign = 'center';
		banner.style.padding = '0.75rem';
		banner.style.zIndex = '9999';
		banner.style.fontWeight = 'bold';
		banner.textContent = errorMessage;
		banner.id = 'coop-coep-error-banner';

		document.body.appendChild(banner);
	}
}
