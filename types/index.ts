// Core TypeScript interfaces and types
export interface RhythmState {
  nodeCount: number;
  bassNodeCount: number;
  baseSpeed: number;
  speedRatio: number;
  isPlaying: boolean;
  currentTime: number;
  loopDuration: number;
  randomSeed: number;
  lowestSegment: number;
  highestSegment: number;
  layers: number;
  randomOffset: number;
}

export interface SynthSettings {
  oscillator: {
    type: 'sine' | 'triangle' | 'sawtooth' | 'square';
    // Can be extended with more oscillator options if needed
  };
  envelope: {
    attack: number;   // Time in seconds for initial ramp up
    decay: number;    // Time in seconds from attack peak to sustain level
    sustain: number;  // Level (0-1) to sustain while note is held
    release: number;  // Time in seconds for release after note is released
  };
}

export interface EffectSettings {
  wet: number;
  decay: number;
}

export interface AudioState {
  nodeNotes: string[];
  bassNodeNotes: string[];
  synthSettings: SynthSettings;
  bassSynthSettings: SynthSettings;
  reverbSettings: EffectSettings;
  delaySettings: EffectSettings;
  backgroundVolume: number;
  masterVolume: number;
}

export interface NodeHitEvent {
  index: number;
  type: 'main' | 'bass';
  timestamp: number;
}

export interface CanvasNode {
  position: number;
  velocity: number;
  speed: number;
  color: string;
}

export interface ValidationResult {
  isValid: boolean;
  value: number;
  error?: string;
}