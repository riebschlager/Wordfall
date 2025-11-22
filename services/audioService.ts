
// Define a standard I-V-vi-IV progression in C Major
// Values are semitone offsets from Middle C (C4)
const CHORD_PROGRESSION = [
  [0, 4, 7, 12],     // I:  C Major (C, E, G, C)
  [7, 11, 14, 19],   // V:  G Major (G, B, D, G)
  [9, 12, 16, 21],   // vi: A Minor (A, C, E, A)
  [5, 9, 12, 17],    // IV: F Major (F, A, C, F)
];

const BASE_FREQUENCY = 261.63; // C4

export class AudioService {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  
  private currentChordIndex: number = 0;
  
  // Arpeggio State
  private arpeggioIndex: number = 0;
  private isArpeggioAscending: boolean = true;
  
  // Reverb Nodes
  private dryNode: GainNode | null = null;
  private wetNode: GainNode | null = null;
  private convolver: ConvolverNode | null = null;

  constructor() {
    // AudioContext is initialized on first user interaction to comply with browser policies
  }

  public init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Setup Reverb Architecture
      this.dryNode = this.ctx.createGain();
      this.wetNode = this.ctx.createGain();
      this.convolver = this.ctx.createConvolver();
      
      // Generate "Spacey" Impulse Response (3.0s decay)
      this.convolver.buffer = this.createImpulseResponse(3.0, 2.0); 
      
      // Mix Levels
      this.dryNode.gain.value = 0.7; // Direct sound
      this.wetNode.gain.value = 0.9; // High reverb level for atmosphere
      
      // Connections:
      // Source -> [Gain] -> dryNode -> Destination
      //                  -> convolver -> wetNode -> Destination
      this.dryNode.connect(this.ctx.destination);
      this.convolver.connect(this.wetNode);
      this.wetNode.connect(this.ctx.destination);
    }
    
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
  
  private createImpulseResponse(duration: number, decay: number): AudioBuffer {
    const sampleRate = this.ctx!.sampleRate;
    const length = sampleRate * duration;
    const impulse = this.ctx!.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
        const n = i / length;
        // Generate white noise
        const noise = (Math.random() * 2 - 1);
        // Apply exponential decay envelope
        const envelope = Math.pow(1 - n, decay);
        
        left[i] = noise * envelope;
        right[i] = noise * envelope;
    }
    return impulse;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (!muted && this.ctx?.state === 'suspended') {
        this.ctx.resume();
    }
  }

  // Advances to the next chord in the progression
  public changeScale() {
    this.currentChordIndex = (this.currentChordIndex + 1) % CHORD_PROGRESSION.length;
    // Reset arpeggio logic slightly or keep it flowing? 
    // Let's keep the flow but ensure index is valid for new array just in case
    this.arpeggioIndex = 0;
    this.isArpeggioAscending = true;
  }

  private getNoteFrequency(semitone: number, octaveShift: number = 0): number {
    // f = C4 * 2^(n/12)
    // Add octave shift (12 semitones per octave)
    const totalSemitones = semitone + (octaveShift * 12);
    return BASE_FREQUENCY * Math.pow(2, totalSemitones / 12);
  }

  public playTypingSound() {
    if (this.isMuted || !this.ctx) return;
    
    // Ensure reverb is ready, or init if somehow missed
    if (!this.dryNode || !this.convolver) {
        this.init();
        if (!this.dryNode) return;
    }

    const currentChord = CHORD_PROGRESSION[this.currentChordIndex];

    // --- Arpeggio Logic ---
    // 1. Get the current note
    const semitone = currentChord[this.arpeggioIndex];

    // 2. Advance the index for next time
    if (this.isArpeggioAscending) {
        this.arpeggioIndex++;
        if (this.arpeggioIndex >= currentChord.length) {
            // Reached top, go back to second to last
            this.arpeggioIndex = currentChord.length - 2;
            this.isArpeggioAscending = false;
        }
    } else {
        this.arpeggioIndex--;
        if (this.arpeggioIndex < 0) {
            // Reached bottom, go back to second note
            this.arpeggioIndex = 1;
            this.isArpeggioAscending = true;
        }
    }
    // ----------------------

    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.connect(gainNode);
    
    // Route to Reverb Mix Bus
    gainNode.connect(this.dryNode!);
    gainNode.connect(this.convolver!);

    // Typing: Triangle wave for clarity
    osc.type = 'triangle';
    
    // Use the determined semitone. 
    // Randomly shift down an octave occasionally for depth, but keep melody clear
    const octave = Math.random() > 0.8 ? -1 : 0;
    const freq = this.getNoteFrequency(semitone, octave); 
    
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    // Envelope
    const now = this.ctx.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.15, now + 0.01); // Quick attack
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.4); // Medium decay

    osc.start(now);
    osc.stop(now + 0.5);
  }

  public playCollisionSound() {
    if (this.isMuted || !this.ctx) return;
    if (!this.dryNode || !this.convolver) return;

    const currentChord = CHORD_PROGRESSION[this.currentChordIndex];
    // For collision, pick a random note from the chord to avoid locking to the typing arpeggio
    const semitone = currentChord[Math.floor(Math.random() * currentChord.length)];

    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.connect(gainNode);
    // Route to Reverb Mix Bus
    gainNode.connect(this.dryNode!);
    gainNode.connect(this.convolver!);

    // Collision: Sine wave for "glassy" sound
    osc.type = 'sine';
    // Shift up 1 octave for the chime effect
    const freq = this.getNoteFrequency(semitone, 1); 
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    // Envelope - very short and delicate
    const now = this.ctx.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    // Reduced volume by 50% (0.05 -> 0.01)
    gainNode.gain.linearRampToValueAtTime(0.01, now + 0.005); // Very fast attack
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.2); // Fast decay

    osc.start(now);
    osc.stop(now + 0.3);
  }
}
