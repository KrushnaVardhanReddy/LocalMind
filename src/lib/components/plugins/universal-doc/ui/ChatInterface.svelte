<script lang="ts">
    import { Send, Bot, User, Loader2 } from 'lucide-svelte';
    import Button from './Button.svelte';
    import { marked } from 'marked';
    import DOMPurify from 'dompurify';

    interface Message {
        role: 'user' | 'assistant';
        content: string;
    }

    interface Props {
        messages: Message[];
        isGenerating: boolean;
        onSendMessage: (message: string) => void;
    }

    let { messages = [], isGenerating = false, onSendMessage }: Props = $props();

    let inputValue = $state('');
    let messagesContainer: HTMLDivElement | null = $state(null);

    function handleSubmit(e: Event) {
        e.preventDefault();
        if (inputValue.trim() && !isGenerating) {
            onSendMessage(inputValue.trim());
            inputValue = '';
        }
    }

    $effect(() => {
        // Auto-scroll to bottom when messages change
        if (messages.length && messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    });

    function renderMarkdown(content: string) {
        try {
            const rawHtml = marked.parse(content) as string;
            return DOMPurify.sanitize(rawHtml);
        } catch (e) {
            console.error("Markdown parsing error", e);
            return content;
        }
    }
</script>

<div class="flex flex-col h-full bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
    <div class="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50">
        <div class="flex items-center space-x-2">
            <Bot class="w-5 h-5 text-blue-500" />
            <h2 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Document Assistant</h2>
        </div>
    </div>

    <div
        bind:this={messagesContainer}
        class="flex-1 overflow-y-auto p-4 space-y-6 bg-zinc-50/50 dark:bg-zinc-900"
    >
        {#if messages.length === 0}
            <div class="h-full flex flex-col items-center justify-center text-zinc-500 space-y-4">
                <Bot class="w-12 h-12 opacity-20" />
                <p class="text-sm">Upload a document and ask me anything about it.</p>
            </div>
        {:else}
            {#each messages as msg}
                <div class="flex items-start gap-4 {msg.role === 'user' ? 'flex-row-reverse' : ''}">
                    <div class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center {msg.role === 'user' ? 'bg-zinc-200 dark:bg-zinc-800' : 'bg-blue-100 dark:bg-blue-900/30'}">
                        {#if msg.role === 'user'}
                            <User class="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                        {:else}
                            <Bot class="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        {/if}
                    </div>

                    <div class="flex-1 px-4 py-3 rounded-2xl text-sm max-w-[85%] shadow-sm
                        {msg.role === 'user'
                            ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900 rounded-tr-none'
                            : 'bg-white border border-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200 rounded-tl-none'}
                    ">
                        {#if msg.role === 'assistant'}
                            <div class="prose prose-sm prose-zinc dark:prose-invert max-w-none">
                                {@html renderMarkdown(msg.content)}
                            </div>
                        {:else}
                            <div class="whitespace-pre-wrap">{msg.content}</div>
                        {/if}
                    </div>
                </div>
            {/each}

            {#if isGenerating}
                <div class="flex items-start gap-4">
                     <div class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-900/30">
                        <Bot class="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div class="px-4 py-3 rounded-2xl text-sm bg-white border border-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200 rounded-tl-none shadow-sm flex items-center space-x-2">
                        <Loader2 class="w-4 h-4 animate-spin text-zinc-400" />
                        <span class="text-zinc-500">Thinking...</span>
                    </div>
                </div>
            {/if}
        {/if}
    </div>

    <div class="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
        <form onsubmit={handleSubmit} class="relative flex items-center">
            <input
                type="text"
                bind:value={inputValue}
                placeholder="Ask about the document..."
                disabled={isGenerating}
                class="w-full pl-4 pr-12 py-3 bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 transition-shadow outline-none dark:text-zinc-100 placeholder:text-zinc-400"
            />
            <Button
                type="submit"
                variant="ghost"
                disabled={!inputValue.trim() || isGenerating}
                class="absolute right-1 !w-10 !h-10 !p-0 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500"
            >
                <Send class="w-4 h-4" />
            </Button>
        </form>
    </div>
</div>
