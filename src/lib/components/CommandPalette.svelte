<script lang="ts">
    import { onMount } from 'svelte';
    import { CommandRegistry, type Command } from '$lib/services/CommandRegistry';
    import { registeredFiles, savedQueries } from '$lib/stores/workspace.store';

    let isOpen = $state(false);
    let searchQuery = $state('');
    let selectedIndex = $state(0);
    let inputRef: HTMLInputElement | null = $state(null);
    let listRef: HTMLDivElement | null = $state(null);

    let dynamicCommands = $derived.by(() => {
        const commands: Command[] = [];

        $registeredFiles.forEach(file => {
            commands.push({
                id: `file-${file.id}`,
                label: file.file_name,
                category: 'recent',
                icon: '📄',
                action: () => {
                    console.log('Open recent file:', file.file_name);
                }
            });
        });

        $savedQueries.forEach(query => {
            commands.push({
                id: `query-${query.id}`,
                label: query.name,
                category: 'query',
                icon: '🔍',
                action: () => {
                     const event = new CustomEvent('load-saved-query', { detail: query });
                     window.dispatchEvent(event);
                }
            });
        });

        return commands;
    });

    let allCommands = $derived([
        ...CommandRegistry.getBuiltInCommands(),
        ...dynamicCommands
    ]);

    let filteredCommands = $derived.by(() => {
        if (!searchQuery.trim()) {
            return allCommands;
        }
        const lowerQuery = searchQuery.toLowerCase();
        return allCommands.filter(cmd => cmd.label.toLowerCase().includes(lowerQuery));
    });

    // Group commands by category for display
    let groupedCommands = $derived.by(() => {
        const groups: Record<string, Command[]> = {};
        for (const cmd of filteredCommands) {
            if (!groups[cmd.category]) {
                groups[cmd.category] = [];
            }
            groups[cmd.category].push(cmd);
        }
        return groups;
    });

    // Flatten for keyboard navigation
    let flattenedCommands = $derived.by(() => {
        const flattened: Command[] = [];
        const order = ['navigate', 'action', 'recent', 'query'];
        for (const cat of order) {
            if (groupedCommands[cat]) {
                flattened.push(...groupedCommands[cat]);
            }
        }
        return flattened;
    });

    // Keep selectedIndex in bounds when list changes
    $effect(() => {
        if (flattenedCommands.length > 0) {
            if (selectedIndex >= flattenedCommands.length) {
                selectedIndex = 0;
            }
        } else {
            selectedIndex = 0;
        }
    });

    function togglePalette(e: KeyboardEvent) {
        if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            isOpen = !isOpen;
            if (isOpen) {
                searchQuery = '';
                selectedIndex = 0;
                // Wait for render then focus
                setTimeout(() => inputRef?.focus(), 10);
            }
        } else if (e.key === 'Escape' && isOpen) {
            isOpen = false;
        }
    }

    onMount(() => {
        window.addEventListener('keydown', togglePalette);
        return () => window.removeEventListener('keydown', togglePalette);
    });

    function handleKeydown(e: KeyboardEvent) {
        if (!isOpen) return;

        const max = flattenedCommands.length;
        if (max === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedIndex = (selectedIndex + 1) % max;
            scrollToSelected();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedIndex = (selectedIndex - 1 + max) % max;
            scrollToSelected();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            executeSelected();
        }
    }

    function scrollToSelected() {
        if (!listRef) return;
        setTimeout(() => {
            const selectedItem = listRef?.querySelector('.selected-item') as HTMLElement;
            if (selectedItem) {
                selectedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        }, 0);
    }

    function executeSelected() {
        const cmd = flattenedCommands[selectedIndex];
        if (cmd) {
            cmd.action();
            isOpen = false;
        }
    }

    function executeCommand(cmd: Command) {
        cmd.action();
        isOpen = false;
    }

    function closeOnOutsideClick(e: MouseEvent) {
        if (isOpen && e.target === e.currentTarget) {
            isOpen = false;
        }
    }

    // A helper to escape HTML to prevent XSS
    function escapeHtml(unsafe: string) {
        return unsafe
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    }

    function highlightText(text: string, query: string) {
        if (!query) return escapeHtml(text);
        const lowerText = text.toLowerCase();
        const lowerQuery = query.toLowerCase();
        const index = lowerText.indexOf(lowerQuery);

        if (index === -1) return escapeHtml(text);

        const before = escapeHtml(text.substring(0, index));
        const match = escapeHtml(text.substring(index, index + query.length));
        const after = escapeHtml(text.substring(index + query.length));

        return `${before}<strong>${match}</strong>${after}`;
    }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-center items-start pt-[15vh] px-4"
        onclick={closeOnOutsideClick}
    >
        <div class="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col">
            <div class="flex items-center px-4 border-b border-gray-200 dark:border-gray-700">
                <span class="text-gray-400">🔍</span>
                <input
                    bind:this={inputRef}
                    bind:value={searchQuery}
                    type="text"
                    class="w-full bg-transparent px-4 py-4 text-lg outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder="Type a command or search..."
                    autocomplete="off"
                    spellcheck="false"
                />
                <button
                    class="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-1 rounded border border-gray-200 dark:border-gray-600 ml-2 shadow-sm font-mono"
                    onclick={() => isOpen = false}
                >
                    ESC
                </button>
            </div>

            <div
                bind:this={listRef}
                class="overflow-y-auto max-h-[60vh] py-2 bg-gray-50 dark:bg-gray-800/50"
            >
                {#if flattenedCommands.length === 0}
                    <div class="py-12 text-center text-gray-500 dark:text-gray-400">
                        No commands found.
                    </div>
                {:else}
                    {#each ['navigate', 'action', 'recent', 'query'] as category}
                        {#if groupedCommands[category]}
                            <div class="px-3 py-1.5 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mt-2 first:mt-0">
                                {category === 'navigate' ? 'Navigation' :
                                 category === 'action' ? 'Actions' :
                                 category === 'recent' ? 'Recent Files' : 'Saved Queries'}
                            </div>

                            <ul class="mb-2">
                                {#each groupedCommands[category] as cmd}
                                    {@const isSelected = flattenedCommands[selectedIndex] === cmd}
                                    <li>
                                        <button
                                            class="w-full text-left px-4 py-3 flex items-center justify-between transition-colors
                                                {isSelected ? 'bg-indigo-600 text-white selected-item' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50'}"
                                            onclick={() => executeCommand(cmd)}
                                            onmouseover={() => selectedIndex = flattenedCommands.indexOf(cmd)}
                                            onfocus={() => selectedIndex = flattenedCommands.indexOf(cmd)}
                                        >
                                            <div class="flex items-center gap-3">
                                                {#if cmd.icon}
                                                    <span>{cmd.icon}</span>
                                                {/if}
                                                <span class="font-medium">
                                                    {@html highlightText(cmd.label, searchQuery)}
                                                </span>
                                            </div>
                                            {#if cmd.shortcut}
                                                <kbd class="font-mono text-xs px-2 py-1 rounded
                                                    {isSelected ? 'bg-indigo-500/50 text-indigo-100 border-indigo-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600'}
                                                    border shadow-sm">
                                                    {cmd.shortcut}
                                                </kbd>
                                            {/if}
                                        </button>
                                    </li>
                                {/each}
                            </ul>
                        {/if}
                    {/each}
                {/if}
            </div>
        </div>
    </div>
{/if}
