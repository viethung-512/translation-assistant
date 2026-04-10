// Web Speech API queue wrapper.
// Drops utterances when queue exceeds MAX_QUEUE_SIZE to prevent audio falling behind translation.

const MAX_QUEUE_SIZE = 3;

export class TtsService {
  private enabled = true;
  private pendingCount = 0;

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) this.stop();
  }

  speak(text: string, lang: string): void {
    if (!this.enabled || !text.trim()) return;
    if (this.pendingCount >= MAX_QUEUE_SIZE) return; // drop stale utterance

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.voice = this.findVoice(lang);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    this.pendingCount++;
    utterance.onend = () => {
      this.pendingCount = Math.max(0, this.pendingCount - 1);
    };
    utterance.onerror = () => {
      this.pendingCount = Math.max(0, this.pendingCount - 1);
    };

    window.speechSynthesis.speak(utterance);
  }

  stop(): void {
    window.speechSynthesis.cancel();
    this.pendingCount = 0;
  }

  private findVoice(lang: string): SpeechSynthesisVoice | null {
    const voices = window.speechSynthesis.getVoices();
    const prefix = lang.split('-')[0];
    return (
      voices.find((v) => v.lang === lang) ??
      voices.find((v) => v.lang.startsWith(prefix)) ??
      null
    );
  }
}
