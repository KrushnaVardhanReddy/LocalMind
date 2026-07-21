# Task 5.5: PCAP Network Analyzer

## Objective
Implement a local PCAP file parser and visualizer that lets users analyze Wireshark packet captures entirely in the browser — identifying hosts, protocols, request/response flows, and anomalous traffic patterns — without uploading sensitive network data anywhere.

## Prerequisites
- Review `docs/specs/phase-4/01_devtools_engine_spec.md`.
- Phase 1 DuckDB worker must be complete — packet data is loaded into DuckDB for analysis.

## Implementation Steps

### 1. Install Dependencies
```bash
bun add pcap-parser
```

### 2. Create the PCAP Worker
- Create `src/lib/workers/pcap.worker.ts`.
- `loadPCAP(file: File)`: parse the PCAP binary using `pcap-parser` (streaming). Extract per-packet metadata:
  - Timestamp, source IP, destination IP, protocol (TCP/UDP/ICMP), length, payload length.
- Load extracted packet rows into a DuckDB in-memory table `packets`.
- Return summary: total packets, unique hosts, capture duration, top protocols.

### 3. Analysis Queries
Pre-build the following DuckDB queries as named views:
```sql
-- Top talkers (highest traffic by bytes)
CREATE VIEW top_talkers AS
  SELECT src_ip, dst_ip, SUM(length) as total_bytes, COUNT(*) as packet_count
  FROM packets GROUP BY src_ip, dst_ip ORDER BY total_bytes DESC LIMIT 20;

-- Protocol distribution
CREATE VIEW protocol_dist AS
  SELECT protocol, COUNT(*) as count FROM packets GROUP BY protocol;

-- Traffic timeline (packets per second)
CREATE VIEW traffic_timeline AS
  SELECT epoch(timestamp) as second, COUNT(*) as pps FROM packets GROUP BY second ORDER BY second;
```

### 4. Build the PCAP UI
- Create `src/routes/devtools/pcap/+page.svelte`.
- Privacy warning banner (persistent): "⚠️ PCAP files may contain sensitive data. LocalMind processes this file locally — nothing is uploaded."
- Summary cards: Total packets, Unique hosts, Capture duration, Top protocol.
- Visualization tabs:
  - **Traffic Timeline:** ECharts line chart of packets/second over time.
  - **Top Talkers:** Chord/Sankey chart of IP-to-IP traffic volumes.
  - **Protocol Breakdown:** Pie chart.
  - **Packet Table:** Paginated grid with all packets.
- SQL Query Panel: user can run custom DuckDB queries against the `packets` table.

### 5. Security Warnings
- If any packet contains HTTP traffic on port 80 with plaintext credential patterns (password=, token=): show a warning: "⚠️ Unencrypted credentials detected in this capture."

## Definition of Done
- Loading a 50MB PCAP file produces the traffic timeline chart within 10 seconds.
- Top talkers chart correctly identifies the highest-volume IP pairs.
- The SQL panel executes `SELECT * FROM top_talkers` and returns results.
- **No mocks.** Real PCAP parsing + real DuckDB analysis.
- Privacy warning banner is always visible on this page.
