import { expose } from 'comlink';
import pcapp from 'pcap-parser';
import { EventEmitter } from 'events';

import { PCAPWorkerContract } from '../contracts/pcap_contract';

class PcapStream extends EventEmitter {
    constructor(private file: File) {
        super();
        this.start();
    }

    pause() {
        // Implement pause if needed
    }

    resume() {
        // Implement resume if needed
    }

    async start() {
        try {
            const arrayBuffer = await this.file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            this.emit('data', buffer);
            this.emit('end');
        } catch (err) {
            this.emit('error', err);
        }
    }
}

class PCAPWorker implements PCAPWorkerContract {
    async loadPCAP(file: File): Promise<{ file: File, hasCredentials: boolean }> {
        return new Promise((resolve, reject) => {
            const stream = new PcapStream(file);
            const parser = pcapp.parse(stream);

            const packets: any[] = [];
            let hasCredentials = false;

            parser.on('packet', function(packet: any) {
                const header = packet.header;
                const data = packet.data;

                // Parse Ethernet header (14 bytes)
                if (data.length < 14) return;
                const ethertype = data.readUInt16BE(12);

                if (ethertype !== 0x0800) return; // Not IPv4

                // Parse IPv4 header
                if (data.length < 34) return;
                const ipHeaderLen = (data[14] & 0x0F) * 4;
                const totalLen = data.readUInt16BE(16);

                const srcIp = `${data[26]}.${data[27]}.${data[28]}.${data[29]}`;
                const dstIp = `${data[30]}.${data[31]}.${data[32]}.${data[33]}`;

                const protoCode = data[23];
                let protocol = 'Other';
                let srcPort = 0;
                let dstPort = 0;
                let payloadStart = 14 + ipHeaderLen;

                if (protoCode === 6) {
                    protocol = 'TCP';
                    if (data.length >= payloadStart + 20) {
                        srcPort = data.readUInt16BE(payloadStart);
                        dstPort = data.readUInt16BE(payloadStart + 2);
                        const tcpHeaderLen = ((data[payloadStart + 12] >> 4) & 0x0F) * 4;
                        payloadStart += tcpHeaderLen;
                    }
                } else if (protoCode === 17) {
                    protocol = 'UDP';
                    if (data.length >= payloadStart + 8) {
                        srcPort = data.readUInt16BE(payloadStart);
                        dstPort = data.readUInt16BE(payloadStart + 2);
                        payloadStart += 8;
                    }
                } else if (protoCode === 1) {
                    protocol = 'ICMP';
                }

                const payloadLen = totalLen - ipHeaderLen - (payloadStart - 14 - ipHeaderLen);

                // Check for HTTP plaintext credentials on port 80
                if (protocol === 'TCP' && (srcPort === 80 || dstPort === 80)) {
                    if (data.length > payloadStart) {
                        const payload = data.toString('utf8', payloadStart);
                        if (payload.includes('password=') || payload.includes('token=')) {
                            hasCredentials = true;
                        }
                    }
                }

                // Convert timestamp to proper string ISO format
                const date = new Date(header.timestampSeconds * 1000 + header.timestampMicroseconds / 1000);

                packets.push({
                    timestamp: date.toISOString(),
                    src_ip: srcIp,
                    dst_ip: dstIp,
                    protocol: protocol,
                    length: header.capturedLength,
                    payload_length: payloadLen > 0 ? payloadLen : 0
                });
            });

            parser.on('end', () => {
                const jsonStr = JSON.stringify(packets);
                const file = new File([jsonStr], 'packets.json', { type: 'application/json' });
                resolve({ file, hasCredentials });
            });

            parser.on('error', (err: Error) => {
                reject(err);
            });
        });
    }
}

expose(new PCAPWorker());
