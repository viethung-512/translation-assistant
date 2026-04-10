// @ts-nocheck
// Runs inside AudioWorkletGlobalScope — no ES module imports allowed.
// Captures Float32 audio and emits Int16 (s16le) chunks at ~100ms intervals.

class PcmWorkletProcessor extends AudioWorkletProcessor {
  _buffer = [];
  _bufferSize = 0;
  // 100ms at 16kHz = 1600 samples
  _targetSamples = 1600;

  process(inputs) {
    const input = inputs[0]?.[0];
    if (!input) return true;

    this._buffer.push(new Float32Array(input));
    this._bufferSize += input.length;

    if (this._bufferSize >= this._targetSamples) {
      const merged = new Float32Array(this._bufferSize);
      let offset = 0;
      for (const chunk of this._buffer) {
        merged.set(chunk, offset);
        offset += chunk.length;
      }

      const int16 = new Int16Array(merged.length);
      for (let i = 0; i < merged.length; i++) {
        int16[i] = Math.max(-32768, Math.min(32767, merged[i] * 32768));
      }

      this.port.postMessage(int16.buffer, [int16.buffer]);
      this._buffer = [];
      this._bufferSize = 0;
    }

    return true;
  }
}

registerProcessor('pcm-worklet-processor', PcmWorkletProcessor);
