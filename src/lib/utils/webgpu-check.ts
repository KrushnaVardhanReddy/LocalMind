export function checkWebGPUSupport(): { supported: boolean; reason?: string } {
    if (!navigator.gpu) {
        return {
            supported: false,
            reason: 'WebGPU is not supported in this browser. Use Chrome 113+ or Edge 113+.'
        };
    }
    return { supported: true };
}
