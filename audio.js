/**
 * Audio Engine using Web Audio API for CS-style sound effects
 * Zero external audio files required!
 */
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = localStorage.getItem('lunchbox_muted') === 'true';
    this.lastTickTime = 0;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    localStorage.setItem('lunchbox_muted', this.isMuted);
    return this.isMuted;
  }

  // Realistic CS case opening tick
  playTick(pitchModifier = 1) {
    if (this.isMuted) return;
    this.init();
    const now = this.ctx.currentTime;
    if (now - this.lastTickTime < 0.035) return; // Debounce fast ticks
    this.lastTickTime = now;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(420 * pitchModifier, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.04);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.Q.setValueAtTime(3, now);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.045);
  }

  // Sound when rolling starts
  playRollStart() {
    if (this.isMuted) return;
    this.init();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(500, now + 0.25);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0.4, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  // Win fanfare based on rarity
  playWin(rarity) {
    if (this.isMuted) return;
    this.init();
    const now = this.ctx.currentTime;

    const chords = {
      consumer: [261.63, 329.63], // C4, E4
      industrial: [261.63, 329.63, 392.00], // C4, E4, G4
      milspec: [329.63, 392.00, 523.25, 659.25], // E4, G4, C5, E5
      restricted: [261.63, 329.63, 392.00, 523.25, 659.25, 783.99], // C-maj fanfare
      classified: [220.00, 277.18, 329.63, 440.00, 554.37, 659.25, 880.00] // Epic major 7th shimmer
    };

    const notes = chords[rarity] || chords.milspec;
    const isEpic = rarity === 'classified' || rarity === 'restricted';
    const duration = isEpic ? 1.6 : 0.8;

    notes.forEach((freq, idx) => {
      const noteDelay = idx * 0.055;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = isEpic ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(freq, now + noteDelay);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(isEpic ? 3500 : 2000, now + noteDelay);

      const vol = isEpic ? 0.15 : 0.2;
      gain.gain.setValueAtTime(0.001, now + noteDelay);
      gain.gain.linearRampToValueAtTime(vol, now + noteDelay + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + noteDelay + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + noteDelay);
      osc.stop(now + noteDelay + duration + 0.1);
    });
  }
}

window.soundEngine = new SoundEngine();
