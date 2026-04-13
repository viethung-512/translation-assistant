// Captures mic audio and emits PCM s16le 16kHz mono chunks (~100ms each).
// Uses AudioWorklet when available; falls back to ScriptProcessorNode.

export type AudioChunkHandler = (chunk: ArrayBuffer) => void;

const TARGET_SAMPLE_RATE = 16000;
const SCRIPT_PROCESSOR_CHUNK_SAMPLES = 1600; // 100ms at 16kHz

function float32ToInt16Buffer(input: Float32Array): ArrayBuffer {
  const int16 = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    int16[i] = Math.max(-32768, Math.min(32767, input[i] * 32768));
  }
  return int16.buffer;
}

export class AudioCapture {
  private context: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private workletNode: AudioWorkletNode | null = null;
  // Kept as EventTarget to avoid ScriptProcessorNode deprecation noise; cast on use
  private scriptProcessor: AudioNode | null = null;
  private readonly onChunk: AudioChunkHandler;

  constructor(onChunk: AudioChunkHandler) {
    this.onChunk = onChunk;
  }

  async start(): Promise<void> {
    // navigator.mediaDevices is absent in non-secure contexts (HTTP) or misconfigured WebViews.
    if (!navigator.mediaDevices) {
      throw new Error(
        'Microphone access is unavailable. The app must run in a secure context (HTTPS or native). Check that NSMicrophoneUsageDescription is set in Info.plist.'
      );
    }

    // Calling getUserMedia triggers the OS permission dialog when permission is not yet granted.
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: TARGET_SAMPLE_RATE,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
    } catch (err) {
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          throw new Error('Microphone permission was denied. Please allow microphone access in your device settings and try again.');
        }
        if (err.name === 'NotFoundError') {
          throw new Error('No microphone found on this device.');
        }
      }
      throw err;
    }

    this.context = new AudioContext({ sampleRate: TARGET_SAMPLE_RATE });
    const source = this.context.createMediaStreamSource(this.stream);

    if (this.context.audioWorklet) {
      await this.startWithWorklet(source);
    } else {
      this.startWithScriptProcessor(source);
    }
  }

  private async startWithWorklet(source: MediaStreamAudioSourceNode): Promise<void> {
    // Vite resolves new URL(..., import.meta.url) for worker-like modules
    const workerUrl = new URL('./pcm-worklet-processor.ts', import.meta.url);
    await this.context!.audioWorklet.addModule(workerUrl);

    this.workletNode = new AudioWorkletNode(this.context!, 'pcm-worklet-processor');
    this.workletNode.port.onmessage = (e: MessageEvent<ArrayBuffer>) => {
      this.onChunk(e.data);
    };
    source.connect(this.workletNode);
    this.workletNode.connect(this.context!.destination);
  }

  private startWithScriptProcessor(source: MediaStreamAudioSourceNode): void {
    // Deprecated but still supported on older WebViews
    const bufferSize = 4096;
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const processor = this.context!.createScriptProcessor(bufferSize, 1, 1);
    const pending: Int16Array[] = [];
    let sampleCount = 0;

    processor.onaudioprocess = (e: AudioProcessingEvent) => {
      const input = e.inputBuffer.getChannelData(0);
      const int16 = new Int16Array(input.length);
      for (let i = 0; i < input.length; i++) {
        int16[i] = Math.max(-32768, Math.min(32767, input[i] * 32768));
      }
      pending.push(int16);
      sampleCount += input.length;

      if (sampleCount >= SCRIPT_PROCESSOR_CHUNK_SAMPLES) {
        const merged = new Int16Array(sampleCount);
        let offset = 0;
        for (const chunk of pending) {
          merged.set(chunk, offset);
          offset += chunk.length;
        }
        this.onChunk(float32ToInt16Buffer(new Float32Array(merged)));
        pending.length = 0;
        sampleCount = 0;
      }
    };

    source.connect(processor);
    processor.connect(this.context!.destination);
    this.scriptProcessor = processor;
  }

  stop(): void {
    this.workletNode?.disconnect();
    this.workletNode = null;

    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor = null;
    }

    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;

    this.context?.close();
    this.context = null;
  }
}
