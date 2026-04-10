# Phase 03 — Audio Capture Layer

## Context Links
- Plan: `plans/260409-1858-ai-mobile-translator/plan.md`
- Brainstorm: `plans/reports/brainstorm-260409-1858-ai-mobile-translator.md`
- MDN AudioWorklet: https://developer.mozilla.org/en-US/docs/Web/API/AudioWorklet

## Overview
- **Priority:** P1
- **Status:** Complete
- **Effort:** 3h
- **Blocked by:** Phase 01
- **Description:** Implement browser-based audio capture using getUserMedia + AudioWorklet to produce PCM s16le 16kHz mono chunks for streaming. Includes ScriptProcessorNode fallback for older WebViews.

## Key Insights
- Soniox expects `s16le` (signed 16-bit little-endian PCM), 16kHz, mono
- AudioWorklet runs on a dedicated audio thread — avoids main thread jank
- `getUserMedia({ audio: { sampleRate: 16000, channelCount: 1 } })` is a hint, not guaranteed — must resample if browser returns different rate
- `AudioContext.sampleRate` reveals actual rate; use OfflineAudioContext to resample if needed
- Chunk size: ~100ms = 1600 samples at 16kHz — good balance of latency vs overhead
- Float32 → Int16 conversion: `Math.max(-32768, Math.min(32767, sample * 32768))`
- AudioWorklet file must be served as a separate JS module — use Vite `?url` import
- iOS WebView: `getUserMedia` works, but requires user gesture to create AudioContext (autoplay policy)
- ScriptProcessorNode fallback: deprecated but still supported; use `onaudioprocess`
- File must be under 200 lines → split worklet processor into separate file

## Requirements

### Functional
- Capture mic audio, convert to PCM s16le 16kHz mono chunks
- Emit ~100ms chunks as `Int16Array` / `ArrayBuffer`
- Support start/stop without page reload
- Fallback to ScriptProcessorNode if AudioWorklet unavailable

### Non-functional
- No audio leaks after stop (tracks stopped, context suspended)
- Works on iOS 14.3+, Android 9+, and desktop Chrome/Safari/Firefox

## Related Code Files

### Create
- `src/audio/pcm-worklet-processor.ts` — AudioWorklet processor (loaded as module URL)
- `src/audio/audio-capture.ts` — AudioCapture class (getUserMedia, worklet setup, start/stop)

## Implementation Steps

1. **Create `src/audio/pcm-worklet-processor.ts`** — runs inside AudioWorklet:
   ```typescript
   // Loaded as AudioWorkletProcessor — no imports allowed
   class PcmWorkletProcessor extends AudioWorkletProcessor {
     private buffer: Float32Array[] = [];
     private bufferSize = 0;
     private readonly targetChunkSamples: number;

     constructor() {
       super();
       // 100ms at 16kHz = 1600 samples (resample handled outside)
       this.targetChunkSamples = 1600;
     }

     process(inputs: Float32Array[][]): boolean {
       const input = inputs[0]?.[0];
       if (!input) return true;

       this.buffer.push(new Float32Array(input));
       this.bufferSize += input.length;

       if (this.bufferSize >= this.targetChunkSamples) {
         // merge buffer chunks, convert Float32 → Int16
         const merged = new Float32Array(this.bufferSize);
         let offset = 0;
         for (const chunk of this.buffer) {
           merged.set(chunk, offset);
           offset += chunk.length;
         }
         const int16 = new Int16Array(merged.length);
         for (let i = 0; i < merged.length; i++) {
           int16[i] = Math.max(-32768, Math.min(32767, merged[i] * 32768));
         }
         this.port.postMessage(int16.buffer, [int16.buffer]);
         this.buffer = [];
         this.bufferSize = 0;
       }
       return true;
     }
   }
   registerProcessor('pcm-worklet-processor', PcmWorkletProcessor);
   ```

2. **Create `src/audio/audio-capture.ts`** — AudioCapture service:
   ```typescript
   export type AudioChunkHandler = (chunk: ArrayBuffer) => void;

   export class AudioCapture {
     private context: AudioContext | null = null;
     private stream: MediaStream | null = null;
     private workletNode: AudioWorkletNode | null = null;
     private onChunk: AudioChunkHandler;

     constructor(onChunk: AudioChunkHandler) {
       this.onChunk = onChunk;
     }

     async start(): Promise<void> {
       this.stream = await navigator.mediaDevices.getUserMedia({
         audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true }
       });
       this.context = new AudioContext({ sampleRate: 16000 });
       const source = this.context.createMediaStreamSource(this.stream);

       if (this.context.audioWorklet) {
         await this.startWithWorklet(source);
       } else {
         this.startWithScriptProcessor(source);
       }
     }

     private async startWithWorklet(source: MediaStreamAudioSourceNode): Promise<void> {
       // Import worklet as URL via Vite: ?url suffix
       const workerUrl = new URL('./pcm-worklet-processor.ts', import.meta.url);
       await this.context!.audioWorklet.addModule(workerUrl);
       this.workletNode = new AudioWorkletNode(this.context!, 'pcm-worklet-processor');
       this.workletNode.port.onmessage = (e) => this.onChunk(e.data);
       source.connect(this.workletNode);
       this.workletNode.connect(this.context!.destination);
     }

     private startWithScriptProcessor(source: MediaStreamAudioSourceNode): void {
       // Fallback: ScriptProcessorNode (deprecated, still functional)
       const bufferSize = 4096;
       const processor = this.context!.createScriptProcessor(bufferSize, 1, 1);
       const int16Buffer: Int16Array[] = [];
       let sampleCount = 0;

       processor.onaudioprocess = (e) => {
         const input = e.inputBuffer.getChannelData(0);
         const int16 = new Int16Array(input.length);
         for (let i = 0; i < input.length; i++) {
           int16[i] = Math.max(-32768, Math.min(32767, input[i] * 32768));
         }
         int16Buffer.push(int16);
         sampleCount += input.length;
         if (sampleCount >= 1600) {
           const merged = new Int16Array(sampleCount);
           let offset = 0;
           for (const chunk of int16Buffer) { merged.set(chunk, offset); offset += chunk.length; }
           this.onChunk(merged.buffer);
           int16Buffer.length = 0;
           sampleCount = 0;
         }
       };
       source.connect(processor);
       processor.connect(this.context!.destination);
     }

     stop(): void {
       this.workletNode?.disconnect();
       this.workletNode = null;
       this.stream?.getTracks().forEach(t => t.stop());
       this.stream = null;
       this.context?.close();
       this.context = null;
     }
   }
   ```

3. **Vite config** — ensure `?url` imports work for worklet module:
   ```ts
   // vite.config.ts — already works by default with Vite 5+
   // The `new URL('./pcm-worklet-processor.ts', import.meta.url)` pattern is natively supported
   ```

4. **Verify:** Write a quick test in browser console:
   - Instantiate `AudioCapture` with `console.log` as handler
   - Call `.start()`, speak, confirm `ArrayBuffer` chunks arrive in console
   - Call `.stop()`, confirm no further chunks

## Todo List

- [x] Create `src/audio/pcm-worklet-processor.ts` (AudioWorklet processor, Float32→Int16)
- [x] Create `src/audio/audio-capture.ts` (AudioCapture class, worklet + fallback)
- [x] Verify Vite resolves worklet URL correctly
- [x] Manual test: capture chunks in browser console

## Success Criteria

- `AudioCapture.start()` resolves without error on desktop Chrome
- PCM chunks arrive as `ArrayBuffer` at ~10/sec (100ms each)
- `AudioCapture.stop()` cleanly releases mic (browser mic indicator disappears)
- No console errors on iOS Safari simulator

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| Browser sampleRate hint ignored (e.g., returns 44100) | Check `context.sampleRate` after creation; if wrong, use OfflineAudioContext to resample (add to audio-capture.ts) |
| iOS requires user gesture for AudioContext | `start()` must be called from button click handler — document in hook usage |
| Vite `?url` worklet bundling issue | Test with `new URL(...)` pattern; fallback to explicit asset copy in vite config |

## Security Considerations
- Mic access prompt shown by browser/OS — no special handling needed
- Audio data never stored raw to disk — only processed chunks sent to Soniox

## Next Steps
→ Phase 04: Soniox provider consumes chunks from AudioCapture
→ Phase 05: SessionStore wires up chunk pipeline
