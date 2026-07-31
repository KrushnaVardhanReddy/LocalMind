import { goto } from '$app/navigation';

export interface Command {
    id: string;
    label: string;
    category: 'navigate' | 'action' | 'recent' | 'query';
    icon?: string;
    shortcut?: string;
    action: () => void;
}

export class CommandRegistry {
    static getBuiltInCommands(): Command[] {
        return [
            {
                id: 'nav-home',
                label: 'Go Home',
                category: 'navigate',
                action: () => goto('/')
            },
            {
                id: 'nav-analytics',
                label: 'Go to Analytics',
                category: 'navigate',
                action: () => goto('/analytics')
            },
            {
                id: 'nav-docs',
                label: 'Go to Docs',
                category: 'navigate',
                action: () => goto('/docs')
            },
            {
                id: 'nav-devtools',
                label: 'Go to DevTools',
                category: 'navigate',
                action: () => goto('/devtools')
            },
            {
                id: 'nav-media',
                label: 'Go to Media',
                category: 'navigate',
                action: () => goto('/media')
            },
            {
                id: 'nav-ai-chat',
                label: 'Go to AI Chat',
                category: 'navigate',
                action: () => goto('/intelligence/chat')
            },
            {
                id: 'action-open-file',
                label: 'Open File',
                category: 'action',
                action: async () => {
                    try {
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        const [fileHandle] = await window.showOpenFilePicker();
                        const file = await fileHandle.getFile();
                        // You could trigger a global event or store action here if needed
                        console.log('Opened file:', file.name);
                    } catch (err) {
                        // User cancelled
                    }
                }
            },
            {
                id: 'action-new-sql',
                label: 'New SQL Query',
                category: 'action',
                action: () => {
                    goto('/analytics').then(() => {
                        setTimeout(() => {
                            const event = new CustomEvent('focus-sql-editor');
                            window.dispatchEvent(event);
                        }, 100);
                    });
                }
            },
            {
                id: 'action-export-html',
                label: 'Export as HTML Report',
                category: 'action',
                action: () => {
                     const event = new CustomEvent('export-html-report');
                     window.dispatchEvent(event);
                }
            },
            {
                id: 'action-toggle-theme',
                label: 'Toggle Dark Mode',
                category: 'action',
                action: () => {
                    document.documentElement.classList.toggle('dark');
                }
            }
        ];
    }
}
