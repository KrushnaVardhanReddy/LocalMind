import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface AiSettings {
  aiEnabled: boolean;
  apiKey: string;
  endpoint: string;
  model: string;
}

const defaultSettings: AiSettings = {
  aiEnabled: false,
  apiKey: '',
  endpoint: 'https://api.openai.com/v1',
  model: 'gpt-4o-mini'
};

// Initialize store with default or localStorage values
const initialValue = browser && localStorage.getItem('aiSettings')
  ? { ...defaultSettings, ...JSON.parse(localStorage.getItem('aiSettings')!) }
  : defaultSettings;

export const aiSettings = writable<AiSettings>(initialValue);

// Subscribe to changes and update localStorage
if (browser) {
  aiSettings.subscribe(settings => {
    localStorage.setItem('aiSettings', JSON.stringify(settings));
  });
}
