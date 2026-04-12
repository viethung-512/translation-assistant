# Audio Pipeline

**Version**: 0.1.0

Audio capture, PCM processing, and streaming to Soniox.

---

## Audio Capture Flow

```
User grants permission
  ↓
navigator.mediaDevices.getUserMedia({ audio: true })
  ↓
Creates AudioContext (48kHz sample rate, browser default)
  ↓
Loads AudioWorklet module
  ↓
Creates AudioWorkletNode
  ↓
Connects: MediaStreamAudioSource → AudioWorkletNode → destination
  ↓
Microphone streams to AudioWorklet processor
```

**Implementation** (`audio-capture.ts`):

```typescript
async start(onChunk: (chunk: Int16Array) => void): Promise<void> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const context = new (window.AudioContext || window.webkitAudioContext)();
  
  await context.audioWorklet.addModule('/pcm-worklet-processor.js');
  const processor = new AudioWorkletNode(context, 'pcm-processor');
  
  processor.port.onmessage = (event) => {
    const { pcmChunk } = event.data;
    onChunk(pcmChunk); // Send to Soniox
  };
  
  const source = context.createMediaStreamAudioSource(stream);
  source.connect(processor).connect(context.destination);
}
```

---

## PCM Format Conversion

AudioWorklet converts browser's native Float32 audio to signed 16-bit PCM for Soniox.

**Target Format**:
- Sample rate: 16kHz (resampled from 48kHz)
- Bit depth: 16-bit signed integer
- Channels: Mono
- Chunk size: 100ms (~1600 samples)

**Conversion Logic** (`pcm-worklet-processor.ts`):

```typescript
class PCMProcessor extends AudioWorkletProcessor {
  process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Record<string, Float32Array>
  ) {
    const float32 = inputs[0][0];
    const int16 = new Int16Array(float32.length);

    // Convert Float32 [-1.0, 1.0] to Int16 [-32768, 32767]
    for (let i = 0; i < float32.length; i++) {
      let s = Math.max(-1, Math.min(1, float32[i]));
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }

    this.port.postMessage({ pcmChunk: int16 });
    return true; // Keep processor alive
  }
}

registerProcessor('pcm-processor', PCMProcessor);
```

---

## Chunk Timing

100ms chunks balance latency vs CPU:

```
Time    Samples @ 16kHz    Bytes
0ms     0
100ms   1,600              3,200 (16-bit = 2 bytes per sample)
200ms   3,200              6,400
...
```

**Benefits**:
- 100ms latency acceptable for real-time (user doesn't perceive lag)
- 1600 samples manageable in single WebSocket frame
- ~3200 bytes/chunk = 32KB/s upstream bandwidth

---

## TTS Output

Soniox translation triggers text-to-speech via Web Speech API.

**Flow**:
```
onFinalToken(source, translation)
  ↓
if (outputMode === 'tts') {
  TTSService.enqueue(translation)
}
  ↓
TTSService checks if already speaking
  ↓
If not speaking: new SpeechSynthesisUtterance(translation)
                 synth.speak(utterance)
  ↓
utterance.onend → dequeue next if available
  ↓
Repeat until queue empty
```

**Implementation** (`tts-service.ts`):

```typescript
export class TTSService {
  private synth = window.speechSynthesis;
  private queue: string[] = [];
  private maxQueueSize = 3;
  private isSpeaking = false;
  
  enqueue(text: string): void {
    if (this.queue.length < this.maxQueueSize) {
      this.queue.push(text);
      if (!this.isSpeaking) this.playNext();
    }
  }
  
  private playNext(): void {
    if (this.queue.length === 0) {
      this.isSpeaking = false;
      return;
    }
    
    const text = this.queue.shift()!;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => this.playNext();
    
    this.isSpeaking = true;
    this.synth.speak(utterance);
  }
}
```

**Queue Limit** (3 utterances): Prevents memory overflow and ensures responsive playback.

---

## Error Handling

| Error | Cause | Recovery |
|-------|-------|----------|
| NotAllowedError | Mic permission denied | Show error banner; user must grant permission |
| NotFoundError | No mic available | Show error banner; user must connect device |
| AbortError | Permission revoked mid-stream | Auto-stop recording; show error |
| AudioContext creation fails | Browser audio API unavailable | Fall back to ScriptProcessorNode |

---

## Performance Notes

| Component | CPU | Duration | Notes |
|-----------|-----|----------|-------|
| Float32→Int16 conversion | 2% | 1ms per chunk | AudioWorklet thread (non-blocking) |
| WebSocket send | <1% | <1ms | Non-blocking |
| React render (token) | <5% | <10ms | Main thread, once per 100ms |
| TTS synthesis | 5–15% | 1–3s | Platform-dependent (native OS) |

AudioWorklet prevents main thread blocking; TTS uses native OS resource pool.

---

## References

- [System Architecture Overview](./overview.md)
- [Soniox Provider](./soniox-provider.md)
- [Connection Resilience](./connection-resilience.md)
