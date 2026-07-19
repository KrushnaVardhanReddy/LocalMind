# Phase 5: UI-Worker Contract (Intelligence Workspace)

This contract defines communication for the local WebGPU LLM worker.

## 1. Actions and Payloads

### 1.1 Model Loading
**Action**: `LOAD_LLM_MODEL`
**Payload**:
```typescript
interface LoadModelPayload {
  modelId: string; // e.g., 'Phi-3-mini-4k-instruct-q4f16_1-MLC'
}
```
**Response Data**:
```typescript
interface LoadModelResponse {
  progress: number;
  statusText: string;
  isReady: boolean;
}
```

### 1.2 Chat Generation
**Action**: `GENERATE_CHAT`
**Payload**:
```typescript
interface GenerateChatPayload {
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
  temperature?: number;
}
```
**Response Data**:
*(Streamed response)*
```typescript
interface GenerateChatChunk {
  delta: string; // The newly generated text chunk
  isFinished: boolean;
  totalTokens?: number;
}
```
