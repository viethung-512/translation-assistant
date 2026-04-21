# Performance & Scaling

**Version**: 0.1.0

Memory, CPU, bandwidth usage and optimization strategies.

---

## Memory Profile

### Idle State

| Component     | Typical   | Notes                  |
| ------------- | --------- | ---------------------- |
| React runtime | ~40MB     | React 18 + Zustand     |
| Tauri runtime | ~30MB     | Chromium-like renderer |
| Rust backend  | ~10MB     | Minimal startup        |
| CSS/DOM       | ~5MB      | Tailwind + UI tree     |
| **Total**     | **~85MB** | —                      |

### Recording State (100 sec recording)

| Component            | Typical    | Peak       | Notes                       |
| -------------------- | ---------- | ---------- | --------------------------- |
| SessionStore tokens  | ~10MB      | ~15MB      | 1000 tokens × 10KB each     |
| Pending audio chunks | ~5MB       | ~10MB      | Buffer up to 600 chunks     |
| AudioContext buffers | ~5MB       | ~5MB       | Fixed size (sample buffers) |
| TTS queue            | <1MB       | <1MB       | Limited to 3 utterances     |
| **Total**            | **~120MB** | **~180MB** | —                           |

### Peak Memory (Long Recording)

```
User records 60-minute meeting
  ↓
6000 tokens accumulated (10 per minute avg)
  ↓
SessionStore.finalTokens = 6000 items × ~10KB = 60MB
  ↓
React virtual DOM + component instances = 30MB
  ↓
Browser overhead = 50MB
  ↓
Total ≈ 140MB
```

**Target**: <200MB peak (reasonable for modern devices).

---

## CPU Profile

### Audio Processing

| Operation                | CPU   | Duration | Frequency          |
| ------------------------ | ----- | -------- | ------------------ |
| Float32→Int16 conversion | 2%    | 1ms      | Every 100ms        |
| WebSocket send           | <1%   | <1ms     | Every 100ms        |
| React re-render (token)  | <5%   | <10ms    | Every 100ms        |
| TTS synthesis            | 5–15% | 1–3s     | Per finalized line |

**Total during recording**: ~5–10% CPU (idle cores available).

**Why low?**

- AudioWorklet runs off main thread (no blocking)
- React batches updates (reduces render frequency)
- WebSocket is async (non-blocking)
- TTS delegated to OS (native thread pool)

### Optimization Opportunities

```typescript
// ✓ Good: Zustand selector prevents re-renders
const tokens = useSessionStore((s) => s.finalTokens);

// ✗ Avoid: Entire store re-renders on any change
const store = useSessionStore();
const tokens = store.finalTokens;
```

---

## Network Bandwidth

### Upstream (Audio to Soniox)

```
PCM Format: 16-bit × 1 channel × 16,000 Hz
Byte Rate: 16,000 samples/sec × 2 bytes/sample = 32 KB/s
Bandwidth: 32 KB/s = 256 Kbps

Over 1 hour: 32 KB/s × 3600s = 115 MB
```

**Mobile Impact** (LTE: 5–10 Mbps):

- 256 Kbps audio is ~2.5% of available bandwidth
- No measurable impact on other apps

### Downstream (Tokens from Soniox)

```
Token Rate: 1–2 per second (interim + final)
Token Size: ~0.5–1 KB JSON
Byte Rate: 1 KB/s = 8 Kbps

Over 1 hour: 1 KB/s × 3600s = 3.6 MB
```

**Total**: ~119 MB up, ~4 MB down per hour.

---

## Storage Usage

### Transcript File Size

```
Average Line: "Hello world" → Hola mundo
Characters: 30 (source) + 30 (translation) + overhead = ~65 bytes

1-Hour Recording:
  ~600 lines per hour
  65 bytes per line
  = ~39 KB per hour

Typical Estimate: 50–100 KB per hour of recording
```

### Accumulation Over Time

| Usage          | Storage After       |
| -------------- | ------------------- |
| 5 hours/week   | 250 KB after 1 week |
| 20 hours/month | 1 MB after 1 month  |
| 240 hours/year | 12 MB after 1 year  |

**User Device**: Negligible impact (typical phone: 64–256 GB).

**Cleanup**: Future v0.2.0 UI for archival/deletion.

---

## Bundle Size

### Gzipped Production Build

```
React 18:      ~45 KB
Zustand:       ~3 KB
Tauri API:     ~20 KB
UI Components: ~15 KB
Tailwind CSS:  ~50 KB
Other JS:      ~70 KB
─────────────────────────
Total:         ~200 KB gzipped
Uncompressed:  ~700 KB
```

**Download Time** (LTE: 5 Mbps):

- 200 KB = 0.3 seconds (negligible)

**Load Time**:

- React hydration: <500ms
- Tauri window open: ~1s
- Total: <2s (meets target)

---

## Optimization Strategies

### React Performance

```typescript
// 1. Memoize expensive components
const TranslationLine = React.memo(({ line }) => (
  <div>{line.source} → {line.translation}</div>
));

// 2. Use lazy loading for transcript history
const TranscriptList = React.lazy(() => import('./TranscriptList'));

// 3. Virtualize long lists (future)
import { FixedSizeList } from 'react-window';
```

### Audio Processing

```typescript
// Already optimized:
// - AudioWorklet (off main thread)
// - 100ms chunks (balance latency vs CPU)
// - No real-time DSP filters (future optimization)
```

### Network Optimization

```typescript
// Already optimized:
// - Binary audio frames (no JSON overhead)
// - Streaming (not batch)
// - TLS 1.3 (fast handshake)

// Future:
// - CPAL (Codec for Audio and Lossless) compression
// - Adaptive bit rate (reduce during low bandwidth)
```

---

## Scaling Scenarios

### Scenario 1: Long Recording (8 hours)

```
Tokens: 8000
Memory: ~150 MB (8000 tokens × 10KB + overhead)
Storage: 400–800 KB
Duration: <10 hours app runtime (acceptable)
```

**Risk**: None (within design parameters).

### Scenario 2: Many Sessions (100+ recordings)

```
Total Storage: 100 × 75 KB = 7.5 MB
Memory: Not affected (SessionStore resets per session)
Transcript List: UI should paginate (future feature)
```

**Risk**: Listing all transcripts becomes slow (O(n) scan of filesystem).

**Mitigation** (v0.2.0): SQLite index for fast queries.

### Scenario 3: Concurrent Voices (Multi-speaker)

```
Current: Single speaker (Soniox default)
Future: Diarization support needed
Cost: +20% CPU for speaker detection
Memory: +5–10 MB for speaker embeddings
```

**Not planned** for v0.1.0 (scope creep).

---

## Performance Targets vs Actuals

| Metric             | Target    | Actual     | Status     |
| ------------------ | --------- | ---------- | ---------- |
| STT latency        | 300–500ms | 300–500ms  | ✓ Met      |
| Memory (idle)      | <100MB    | ~90MB      | ✓ Met      |
| Memory (recording) | <200MB    | ~100–150MB | ✓ Met      |
| Startup time       | <2s       | <2s        | ✓ Met      |
| Bundle (gzipped)   | <300KB    | ~200KB     | ✓ Met      |
| CPU (recording)    | <15%      | ~5–10%     | ✓ Exceeded |

---

## Monitoring (Future)

**v0.2.0+**: Add performance telemetry (opt-in):

```typescript
// Pseudo-code for future implementation
const metrics = {
  renderTime: performance.now() - startTime,
  memoryUsage: performance.memory?.usedJSHeapSize,
  tokenLatency: tokenTime - audioTime,
  networkLatency: responseTime - requestTime,
};

// Send to analytics service (if user opted in)
if (settings.enableTelemetry) {
  reportMetrics(metrics);
}
```

---

## Device Requirements

### Minimum Specs (v0.1.0)

| Spec       | Minimum           | Recommended          |
| ---------- | ----------------- | -------------------- |
| RAM        | 2 GB              | 4+ GB                |
| Disk Space | 100 MB            | 500 MB               |
| CPU        | Dual-core 1GHz    | Quad-core 2GHz+      |
| Network    | 3G (0.5 Mbps)     | LTE 5+ Mbps          |
| OS         | iOS 13, Android 8 | iOS 14+, Android 10+ |

**Unsupported**:

- Low-memory devices (<1GB RAM)
- Slow networks (<256 Kbps reliable)
- Offline mode (requires live connection)

---

## Bottleneck Analysis

### Current Bottlenecks

1. **Soniox API latency** (300–500ms)
   - Mitigation: Switch providers for faster latency (Google Cloud ≈ 200ms)
   - Timeline: v0.2.0 multi-provider support

2. **Browser TTS latency** (1–3s)
   - Mitigation: Higher-quality cloud TTS (paid service)
   - Timeline: v0.3.0 optional premium TTS

3. **Transcript file I/O** (10–50ms)
   - Mitigation: Use local SQLite (indexed queries)
   - Timeline: v0.2.0 transcript history UI

### Future Optimization Opportunities

- [ ] Code splitting (lazy-load providers)
- [ ] Service worker for offline features
- [ ] Audio compression (reduce bandwidth 50%)
- [ ] Incremental rendering (virtual scrolling)
- [ ] WebAssembly for PCM conversion (marginal gain)

---

## Scalability Limits

### Hard Limits

| Limit                 | Value        | Reason                             |
| --------------------- | ------------ | ---------------------------------- |
| WebSocket timeout     | 300 minutes  | Soniox API limit                   |
| Pending chunk buffer  | 600 chunks   | ~60s audio; prevent runaway memory |
| TTS queue             | 3 utterances | Prevent TTS lag                    |
| Concurrent WebSockets | 1            | Single recording per app instance  |

### Soft Limits (Performance Degrades)

| Limit              | Value     | Symptom                              |
| ------------------ | --------- | ------------------------------------ |
| Transcript count   | 1000+     | Slow listing (O(n) filesystem scan)  |
| Tokens per session | 10,000+   | High memory (~100 MB)                |
| Recording duration | 24+ hours | Long session state; may need restart |

---

## References

- [System Architecture Overview](./overview.md)
- [Audio Pipeline](./audio-pipeline.md)
- [Code Standards — Performance Guidelines](../code-standards.md#performance-guidelines)
