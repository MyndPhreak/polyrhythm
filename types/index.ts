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
  };
  envelope: {
    attack: number;
    decay: number;
    sustain: number;
    release: number;
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