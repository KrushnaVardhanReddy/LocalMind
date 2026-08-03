<script lang="ts">
    import ReceiptScanner from '$lib/components/plugins/finance/ReceiptScanner.svelte';
    import TransactionTable from '$lib/components/plugins/finance/TransactionTable.svelte';
</script>

<svelte:head>
    <title>Personal Finance & Tax | LocalMind</title>
</svelte:head>

<div class="h-full w-full bg-gray-100 overflow-y-auto p-8">
    <div class="max-w-7xl mx-auto flex flex-col gap-8">
        <header>
            <h1 class="text-3xl font-bold text-gray-900">Personal Finance & Tax Workspace</h1>
            <p class="mt-2 text-gray-600">
                Securely analyze your bank statements and extract data from receipts/tax documents.
                All processing happens locally on your device ensuring absolute privacy.
            </p>
        </header>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <!-- Left Column: Bank Statements -->
            <div class="flex flex-col gap-8">
                <TransactionTable />
            </div>

            <!-- Right Column: Receipt Scanner -->
            <div class="flex flex-col gap-8">
                <ReceiptScanner />
            </div>
        </div>
    </div>
</div>