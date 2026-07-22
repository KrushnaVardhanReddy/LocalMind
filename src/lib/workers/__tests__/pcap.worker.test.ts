import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import pcapp from 'pcap-parser';
import { EventEmitter } from 'events';
import { expose } from 'comlink';

vi.mock('comlink', () => ({
    expose: vi.fn(),
}));

describe('PCAP Worker', () => {
    let pcapWorkerModule: any;
    let service: any;

    beforeEach(async () => {
        vi.clearAllMocks();
        pcapWorkerModule = await import('../pcap.worker');
        const exposeMock = (await import('comlink')).expose as any;
        expect(exposeMock).toHaveBeenCalled();
        service = exposeMock.mock.calls[0][0];
    });

    afterEach(() => {
        vi.resetModules();
    });

    it('should correctly parse mocked PCAP data and flag credentials', async () => {
        // Construct a mock file
        const mockFile = new File(['dummy_content'], 'test.pcap', { type: 'application/octet-stream' });

        // Mock pcap-parser
        const mockParser = new EventEmitter();
        vi.spyOn(pcapp, 'parse').mockReturnValue(mockParser as any);

        // Run loadPCAP but don't await immediately, we need to emit events
        const promise = service.loadPCAP(mockFile);

        // Give time for loadPCAP to set up events
        await new Promise(r => setTimeout(r, 10));

        // Mock data buffer (Ethernet + IPv4 + TCP payload)
        const mockBuffer = Buffer.alloc(100);

        // Ethernet Header
        mockBuffer.writeUInt16BE(0x0800, 12); // IPv4 Ethertype

        // IPv4 Header
        mockBuffer[14] = 0x45; // Version 4, IHL 5 (20 bytes)
        mockBuffer.writeUInt16BE(40, 16); // Total length: 20 IP + 20 TCP
        mockBuffer[23] = 6; // Protocol TCP
        mockBuffer[26] = 192; mockBuffer[27] = 168; mockBuffer[28] = 1; mockBuffer[29] = 1; // Src IP
        mockBuffer[30] = 10; mockBuffer[31] = 0; mockBuffer[32] = 0; mockBuffer[33] = 1; // Dst IP

        // TCP Header
        mockBuffer.writeUInt16BE(12345, 34); // Src Port
        mockBuffer.writeUInt16BE(80, 36); // Dst Port (HTTP)
        mockBuffer[46] = (5 << 4); // Data offset (20 bytes)

        // Payload (starting at 14 + 20 + 20 = 54)
        mockBuffer.write("username=admin&password=secret123", 54);
        // Fix total length to include payload
        mockBuffer.writeUInt16BE(20 + 20 + 33, 16);

        // Emit packet
        mockParser.emit('packet', {
            header: {
                timestampSeconds: 1620000000,
                timestampMicroseconds: 0,
                capturedLength: 100,
                originalLength: 100
            },
            data: mockBuffer
        });

        // Emit end
        mockParser.emit('end');

        const result = await promise;

        expect(result.hasCredentials).toBe(true);
        expect(result.file).toBeInstanceOf(File);
        expect(result.file.name).toBe('packets.json');

        const text = await result.file.text();
        const packets = JSON.parse(text);

        expect(packets.length).toBe(1);
        expect(packets[0].src_ip).toBe('192.168.1.1');
        expect(packets[0].dst_ip).toBe('10.0.0.1');
        expect(packets[0].protocol).toBe('TCP');
        expect(packets[0].payload_length).toBe(33);
        expect(packets[0].timestamp).toBe('2021-05-03T00:00:00.000Z');
    });
});
