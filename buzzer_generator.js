class BuzzerGenerator {
  constructor(audioContext) {
    this.audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
  }

  async playBuzzer(frequency = 1000, duration = 400) {
    if (!this.audioContext) return Promise.resolve();

    return new Promise((resolve) => {
      const now = this.audioContext.currentTime;
      const end = now + (duration / 1000);

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.setValueAtTime(frequency, now);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, end);

      oscillator.start(now);
      oscillator.stop(end);

      setTimeout(resolve, duration);
    });
  }
}
