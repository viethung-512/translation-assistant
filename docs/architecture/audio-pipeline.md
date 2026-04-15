# Audio Pipeline

**Version**: 0.2.0 (SDK Migration)  
**Last Updated**: April 2026

Audio capture, PCM processing, and streaming to Soniox via @soniox/react SDK.

---

## Audio Capture Flow

**Pre-v0.2.0 (Custom Implementation)**:
```
User grants permission
  ↓
navigator.mediaDevices.getUserMedia({ audio: true })
  ↓
Creates AudioContext (48kHz sample rate)
  ↓
Loads AudioWorklet module
  ↓
Creates AudioWorkletNode
  ↓
Connects: MediaStreamAudioSource → AudioWorkletNode → destination
  ↓
Microphone streams to AudioWorklet processor
```

**Current (SDK-Managed)**:
```
useMicrophonePermission hook checks permission status
  ↓
User clicks Record → useRecording hook activated
  ↓
SDK requests mic permission via browser
  ↓
navigator.mediaDevices.getUserMedia({ audio: true }) called by SDK
  ↓
SDK internally:
  ├─ Creates AudioContext
  ├─ Captures microphone stream
  └─ Encodes to PCM 16kHz mono
  ↓
Microphone audio streams to Soniox API
```

**Key Change**: Audio capture now fully managed by @soniox/react SDK. No custom AudioCapture class or AudioWorklet processor needed.

---

## PCM Format (Handled by SDK)

SDK internally converts browser's native Float32 audio to signed 16-bit PCM for Soniox.

**Target Format**:
- Sample rate: 16kHz (resampled from 48kHz by SDK)
- Bit depth: 16-bit signed integer
- Channels: Mono
- Chunk size: Optimal for Soniox (SDK manages)

**Previous Custom Implementation** (`pcm-worklet-processor.ts`):
```typescript
// REMOVED in v0.2.0
// Conversion logic now handled by @soniox/react SDK internally
class PCMProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    const float32 = inputs[0][0];
    const int16 = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++) {
      let s = Math.max(-1, Math.min(1, float32[i]));
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    this.port.postMessage({ pcmChunk: int16 });
    return true;
  }
}
```

---

## Chunk Timing

SDK internally optimizes chunk timing for latency vs bandwidth. Previously 100ms chunks; SDK may vary based on network conditions.

**Benefits**:
- Latency balanced automatically by SDK
- Bandwidth efficient (SDK optimizes)
- No manual chunk size tuning needed
- Built-in adaptive buffering during reconnects

---

## TTS Output

Soniox translation triggers text-to-speech via Web Speech API.

**Flow**:
```
SDK fires onResult callback with final translation
  ↓
useTranslationSession handler processes result
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
| SDK connection error | Network issue / API unreachable | SDK auto-reconnects with backoff |

---

## Performance Notes

| Component | CPU | Duration | Notes |
|-----------|-----|----------|-------|
| SDK audio capture | 1–3% | Continuous | Offloaded from main thread |
| SDK PCM encoding | 1–2% | Per chunk | Optimized implementation |
| WebSocket send | <1% | <1ms | Non-blocking |
| React render (token) | <5% | <10ms | Main thread, once per token |
| TTS synthesis | 5–15% | 1–3s | Platform-dependent (native OS) |

SDK's optimized audio processing prevents main thread blocking.

---

## Removed Components (v0.1.0)

### AudioCapture Class
- Managed mic permission & AudioContext creation
- Created AudioWorklet with custom PCM processor
- Now: SDK handles all audio capture internally

### PCMWorklet Processor
- Converted Float32 to Int16 PCM
- Now: SDK performs encoding internally

### use-microphone-permission Hook
- Custom permission request + state tracking
- Now: `useMicrophonePermission` from @soniox/react SDK

---

## SDK Configuration (useRecording)

useTranslationSession configures the SDK hook:

```typescript
const recording = useRecording({
  model: 'stt-rt-v4',
  language_hints: [sourceLanguage],
  language_hints_strict: true,
  translation: { type: 'one_way', target_language: targetLanguage },
  apiKey: async () => {
    const stored = await getApiKey();
    const mem = useSettingsStore.getState().apiKey;
    const key = mem || stored;
    if (!key) throw new Error('API key not configured...');
    return key;
  },
  onResult: (result) => {
    // Handle interim/final transcription + translation
  },
  onError: (err) => {
    // Handle errors
  },
});
```

---

## Microphone Permission Flow

```
App mounts
  ↓
useMicrophonePermission({ autoCheck: true })
  ├─ Checks if permission already granted
  └─ Updates permissionStatus ('granted'|'denied'|'prompt')
  ↓
User clicks Record
  ↓
If permissionStatus === 'denied':
  Show error → user must enable in system settings
  ↓
Else (granted or prompt):
  useRecording starts
  ├─ SDK requests mic access (if needed)
  └─ Captures audio & sends to Soniox
```

**iOS-Specific**: `NSMicrophoneUsageDescription` in Info.plist; SDK respects system permission state.

---

## References

- [System Architecture Overview](./overview.md)
- [State Management](./state-management.md)
- [Connection Resilience](./connection-resilience.md)
- [@soniox/react SDK](https://github.com/soniox/soniox-sdk-js)
