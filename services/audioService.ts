
// Musical scales defined by semitone offsets
const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11, 12],
  minor: [0, 2, 3, 5, 7, 8, 10, 12],
  pentatonicMajor: [0, 2, 4, 7, 9, 12],
  pentatonicMinor: [0, 3, 5, 7, 10, 12],
  dorian: [0, 2, 3, 5, 7, 9, 10, 12],
  mixolydian: [0, 2, 4, 5, 7, 9, 10, 12],
  lydian: [0, 2, 4, 6, 7, 9, 11, 12],
};

const ROOT_FREQUENCIES = [
  196.00, // G3
  220.00, // A3
  246.94, // B3
  261.63, // C4
  293.66, // D4
  329.63, // E4
  349.23, // F4
];

export class AudioService {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private currentScale: number[] = SCALES.pentatonicMajor;
  private currentRoot: number = 261.63; // C4

  constructor() {
    // AudioContext is initialized on first user interaction to comply with browser policies
  }

  public init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (!muted && this.ctx?.state === 'suspended') {
        this.ctx.resume();
    }
  }

  public changeScale() {
    // Pick a random root note
    this.currentRoot = ROOT_FREQUENCIES[Math.floor(Math.random() * ROOT_FREQUENCIES.length)];
    
    // Pick a random scale type
    const scaleKeys = Object.keys(SCALES) as Array<keyof typeof SCALES>;
    const randomKey = scaleKeys[Math.floor(Math.random() * scaleKeys.length)];
    this.currentScale = SCALES[randomKey];
  }

  private getScaleFrequency(octaveOffset: number = 0): number {
    // Pick a random note from the current scale
    const semitone = this.currentScale[Math.floor(Math.random() * this.currentScale.length)];
    // Calculate frequency: f = root * 2^(n/12)
    return this.currentRoot * Math.pow(2, (semitone + (octaveOffset * 12)) / 12);
  }

  public playTypingSound() {
    if (this.isMuted || !this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    // Typing sound: Soft, slightly bell-like but short
    osc.type = 'triangle';
    const freq = this.getScaleFrequency(0); // Base octave
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    // Envelope
    const now = this.ctx.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.15, now + 0.01); // Attack
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3); // Decay

    osc.start(now);
    osc.stop(now + 0.4);
  }

  public playCollisionSound() {
    if (this.isMuted || !this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    // Collision sound: Softer, higher pitched "chime" or "glassy"
    osc.type = 'sine';
    const freq = this.getScaleFrequency(1); // One octave up
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    // Envelope - very short
    const now = this.ctx.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.05, now + 0.005); // Very fast attack
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15); // Fast decay

    osc.start(now);
    osc.stop(now + 0.2);
  }
}
