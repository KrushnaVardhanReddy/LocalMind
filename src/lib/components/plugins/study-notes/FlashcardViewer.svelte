<script lang="ts">
    import type { Flashcard } from './FlashcardGenerator';
    import { ChevronLeft, ChevronRight, Shuffle, Download } from 'lucide-svelte';

    interface Props {
        flashcards: Flashcard[];
    }

    let { flashcards = [] }: Props = $props();

    let currentIndex = $state(0);
    let isFlipped = $state(false);

    // Derived state for the current card
    let currentCard = $derived(flashcards[currentIndex] || { q: '', a: '' });
    let totalCards = $derived(flashcards.length);

    function nextCard() {
        if (currentIndex < totalCards - 1) {
            isFlipped = false;
            // Short delay to allow flip animation to reset before changing content
            setTimeout(() => {
                currentIndex++;
            }, 150);
        }
    }

    function prevCard() {
        if (currentIndex > 0) {
            isFlipped = false;
            setTimeout(() => {
                currentIndex--;
            }, 150);
        }
    }

    function shuffleCards() {
        // Implement Fisher-Yates shuffle directly on a copy and assign back
        // Need to communicate to parent to update the array if we want it to persist,
        // but for now, since we get it as a prop, we need to handle it locally or update the prop.
        // The simplest approach without Svelte 5 two-way binding complexity is to just randomize the current index.
        // For a full shuffle of the array:
        isFlipped = false;
        setTimeout(() => {
            for (let i = flashcards.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [flashcards[i], flashcards[j]] = [flashcards[j], flashcards[i]];
            }
            currentIndex = 0; // Reset to first card after shuffle
        }, 150);
    }

    function flipCard() {
        isFlipped = !isFlipped;
    }

    function exportToAnki() {
        if (flashcards.length === 0) return;

        let csvContent = "";

        flashcards.forEach(card => {
            // Escape quotes by doubling them, wrap fields in quotes
            const q = `"${card.q.replace(/"/g, '""')}"`;
            const a = `"${card.a.replace(/"/g, '""')}"`;
            csvContent += `${q},${a}\n`;
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'flashcards.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
</script>

<div class="flex flex-col items-center w-full max-w-2xl mx-auto p-4 gap-6">
    {#if flashcards.length > 0}
        <div class="w-full flex justify-between items-center px-4">
            <span class="text-sm font-medium text-slate-500">
                Card {currentIndex + 1} of {totalCards}
            </span>
            <div class="flex gap-2">
                <button
                    onclick={shuffleCards}
                    class="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                    title="Shuffle"
                >
                    <Shuffle size={18} />
                </button>
                <button
                    onclick={exportToAnki}
                    class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded transition-colors"
                    title="Export to Anki (CSV)"
                >
                    <Download size={16} />
                    Export
                </button>
            </div>
        </div>

        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
            class="scene w-full aspect-[3/2] cursor-pointer perspective-1000"
            onclick={flipCard}
        >
            <div class="card relative w-full h-full transition-transform duration-500 preserve-3d {isFlipped ? 'flipped' : ''}">

                <!-- Front (Question) -->
                <div class="absolute w-full h-full backface-hidden bg-white border border-slate-200 rounded-xl shadow-lg flex flex-col items-center justify-center p-8 text-center">
                    <span class="absolute top-4 left-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Question</span>
                    <h3 class="text-xl md:text-2xl font-semibold text-slate-800 leading-relaxed">
                        {currentCard.q}
                    </h3>
                    <p class="absolute bottom-4 text-xs text-slate-400">Click to flip</p>
                </div>

                <!-- Back (Answer) -->
                <div class="absolute w-full h-full backface-hidden bg-indigo-50 border border-indigo-100 rounded-xl shadow-lg flex flex-col items-center justify-center p-8 text-center rotate-y-180">
                    <span class="absolute top-4 left-4 text-xs font-bold text-indigo-400 uppercase tracking-wider">Answer</span>
                    <p class="text-lg md:text-xl text-slate-700 leading-relaxed overflow-y-auto max-h-[80%]">
                        {currentCard.a}
                    </p>
                </div>
            </div>
        </div>

        <div class="flex items-center gap-6 mt-2">
            <button
                onclick={prevCard}
                disabled={currentIndex === 0}
                class="p-3 bg-white border border-slate-200 rounded-full text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all active:scale-95"
            >
                <ChevronLeft size={24} />
            </button>

            <button
                onclick={nextCard}
                disabled={currentIndex === totalCards - 1}
                class="p-3 bg-white border border-slate-200 rounded-full text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all active:scale-95"
            >
                <ChevronRight size={24} />
            </button>
        </div>
    {:else}
        <div class="w-full aspect-[3/2] bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 p-8 text-center">
            Generate flashcards to start studying
        </div>
    {/if}
</div>

<style>
    .perspective-1000 {
        perspective: 1000px;
    }

    .preserve-3d {
        transform-style: preserve-3d;
    }

    .backface-hidden {
        backface-visibility: hidden;
    }

    .rotate-y-180 {
        transform: rotateY(180deg);
    }

    .flipped {
        transform: rotateY(180deg);
    }
</style>
