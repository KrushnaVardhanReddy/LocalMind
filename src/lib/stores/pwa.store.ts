import { writable } from 'svelte/store';

export const deferredPrompt = writable<any>(null);

if (typeof window !== 'undefined') {
	window.addEventListener('beforeinstallprompt', (e) => {
		// Prevent the mini-infobar from appearing on mobile
		e.preventDefault();
		// Stash the event so it can be triggered later.
		deferredPrompt.set(e);
	});
}
