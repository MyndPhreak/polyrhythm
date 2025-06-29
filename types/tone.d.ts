// Type definitions for Tone.js
// This is a simplified version for our specific usage

declare module 'tone' {
  // Main Tone namespace
  export const context: AudioContext;
  export const destination: AudioDestinationNode;
  export function start(): Promise<void>;
  export function now(): number;
  export function getTransport(): Transport;
  export function getDestination(): any;
  export function gainToDb(gain: number): number;
  export function dbToGain(db: number): number;

  // Base audio node
  export class ToneAudioNode {
    connect(destination: any): this;
    disconnect(): this;
    dispose(): this;
    toDestination(): this;
    chain(...nodes: any[]): this;
  }

  // Effects and Processing
  export class Effect extends ToneAudioNode {
    wet: Signal<"normalRange">;
  }

  export class Reverb extends Effect {
    constructor(options?: ReverbOptions);
    decay: number;
    preDelay: number;
    generate(): Promise<this>;
  }

  export class Delay extends Effect {
    constructor(delayTime?: number);
    delayTime: Signal<"time">;
  }

  export class FeedbackDelay extends Delay {
    constructor(options?: DelayOptions);
    feedback: Signal<"normalRange">;
  }

  export class Volume extends ToneAudioNode {
    constructor(volume?: number);
    volume: Signal<"decibels">;
  }

  // Sources
  export class Synth extends ToneAudioNode {
    constructor(options?: SynthOptions);
    oscillator: OscillatorNode & { type: string };
    envelope: EnvelopeNode;
    volume: Signal<"decibels">;
    triggerAttack(note: string | number, time?: number, velocity?: number): this;
    triggerRelease(time?: number): this;
    triggerAttackRelease(note: string | number, duration: number, time?: number, velocity?: number): this;
    setNote(note: string | number, time?: number): this;
  }

  export class FMSynth extends Synth {
    constructor(options?: FMSynthOptions);
    modulationIndex: Signal<"positive">;
    harmonicity: Signal<"positive">;
    modulationEnvelope: EnvelopeNode;
  }

  // Signal control
  export class Signal<T extends string = any> {
    value: number;
    units: T;
    setValueAtTime(value: number, time: number): this;
    linearRampToValueAtTime(value: number, time: number): this;
    exponentialRampToValueAtTime(value: number, time: number): this;
    rampTo(value: number, rampTime: number, startTime?: number): this;
    setTargetAtTime(value: number, startTime: number, timeConstant: number): this;
  }

  export interface EnvelopeNode {
    attack: number;
    decay: number;
    sustain: number;
    release: number;
    attackCurve: string;
    releaseCurve: string;
    decayCurve: string;
  }

  // Interfaces for options
  export interface SynthOptions {
    oscillator?: OscillatorOptions;
    envelope?: EnvelopeOptions;
  }

  export interface FMSynthOptions extends SynthOptions {
    modulation?: OscillatorOptions;
    modulationEnvelope?: EnvelopeOptions;
    modulationIndex?: number;
    harmonicity?: number;
  }

  export interface OscillatorOptions {
    type?: 'sine' | 'square' | 'triangle' | 'sawtooth' | string;
    frequency?: number;
    detune?: number;
    phase?: number;
  }

  export interface EnvelopeOptions {
    attack?: number;
    decay?: number;
    sustain?: number;
    release?: number;
    attackCurve?: string;
    decayCurve?: string;
    releaseCurve?: string;
  }

  export interface ReverbOptions {
    decay?: number;
    preDelay?: number;
    wet?: number;
  }

  export interface DelayOptions {
    delayTime?: number;
    maxDelay?: number;
    feedback?: number;
    wet?: number;
  }
}
