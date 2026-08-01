import type { Component } from 'svelte';
import DemoPanel from './panels/DemoPanel.svelte';

export const InspectorRegistry: Record<string, Component<any>> = {
    'DemoPanel': DemoPanel
};
