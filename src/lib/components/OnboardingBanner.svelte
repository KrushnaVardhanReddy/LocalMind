<script lang="ts">
    let { onApplyDemo, onDismiss } = $props<{
        onApplyDemo: () => void;
        onDismiss: () => void;
    }>();
</script>

<div class="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-4 flex items-center justify-between shadow-sm animate-fade-in">
    <div>
        <h3 class="text-lg font-bold text-indigo-900 mb-1">Welcome to LocalMind Analytics! 👋</h3>
        <p class="text-sm text-indigo-800">
            Drop any CSV, Excel, or JSON file to get started — or explore the sample dataset below.
        </p>
    </div>
    <div class="flex gap-3">
        <button
            onclick={onApplyDemo}
            class="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded shadow hover:bg-indigo-700 transition"
        >
            View Demo
        </button>
        <button
            onclick={onDismiss}
            class="px-4 py-2 bg-white text-indigo-700 border border-indigo-300 text-sm font-semibold rounded hover:bg-indigo-50 transition"
        >
            Dismiss
        </button>
    </div>
</div>

<style>
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in {
        animation: fadeIn 0.3s ease-out forwards;
    }
</style>
