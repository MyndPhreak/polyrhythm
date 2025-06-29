import { defineStore } from 'pinia';
import type { AudioState, SynthSettings, EffectSettings } from '~/types';
import { AUDIO_CONSTANTS } from '~/constants';
import { validateVolume } from '~/utils/validation';

export const useAudioStore = defineStore('audio', {
  state: (): AudioState => ({
    nodeNotes: [...AUDIO_CONSTANTS.DEFAULT_NOTES],
    bassNodeNotes: [...AUDIO_CONSTANTS.DEFAULT_BASS_NOTES],
    synthSettings: {
      oscillator: {
        type: 'sine'
      },
      envelope: {
        attack: 0.01,
        decay: 0.1,
        sustain: 0.3,
        release: 1
      }
    },
    bassSynthSettings: {
      oscillator: {
        type: 'triangle'
      },
      envelope: {
        attack: 0.02,
        decay: 0.2,
        sustain: 0.5,
        release: 1.5
      }
    },
    reverbSettings: {
      wet: 0.5,
      decay: 2.5
    },
    delaySettings: {
      wet: 0.3,
      decay: 0.5
    },
    backgroundVolume: AUDIO_CONSTANTS.DEFAULT_BACKGROUND_VOLUME,
    masterVolume: AUDIO_CONSTANTS.DEFAULT_MASTER_VOLUME
  }),

  getters: {
    /**
     * Get note for specific node index
     */
    getNodeNote: (state) => (index: number): string => {
      return state.nodeNotes[index % state.nodeNotes.length];
    },

    /**
     * Get bass note for specific node index
     */
    getBassNodeNote: (state) => (index: number): string => {
      return state.bassNodeNotes[index % state.bassNodeNotes.length];
    }
  },

  actions: {
    /**
     * Update note for specific node with validation
     */
    updateNodeNote(index: number, note: string) {
      if (index >= 0 && index < this.nodeNotes.length && note.trim()) {
        this.nodeNotes[index] = note.trim();
      }
    },

    /**
     * Update bass note for specific node with validation
     */
    updateBassNodeNote(index: number, note: string) {
      if (index >= 0 && index < this.bassNodeNotes.length && note.trim()) {
        this.bassNodeNotes[index] = note.trim();
      }
    },

    /**
     * Update synth settings with validation
     */
    updateSynthSettings(settings: Partial<SynthSettings>) {
      this.synthSettings = { 
        ...this.synthSettings, 
        ...this.validateSynthSettings(settings) 
      };
    },

    /**
     * Update bass synth settings with validation
     */
    updateBassSynthSettings(settings: Partial<SynthSettings>) {
      this.bassSynthSettings = { 
        ...this.bassSynthSettings, 
        ...this.validateSynthSettings(settings) 
      };
    },

    /**
     * Update master volume with validation
     */
    updateMasterVolume(volume: number) {
      const validation = validateVolume(volume);
      this.masterVolume = validation.value;
      
      if (!validation.isValid && validation.error) {
        console.warn(validation.error);
      }
    },

    /**
     * Update background volume with validation
     */
    updateBackgroundVolume(volume: number) {
      const validation = validateVolume(volume);
      this.backgroundVolume = validation.value;
      
      if (!validation.isValid && validation.error) {
        console.warn(validation.error);
      }
    },

    /**
     * Validate synth settings
     */
    validateSynthSettings(settings: Partial<SynthSettings>): Partial<SynthSettings> {
      const validated: Partial<SynthSettings> = {};
      
      if (settings.oscillator?.type) {
        const validTypes = ['sine', 'triangle', 'sawtooth', 'square'];
        if (validTypes.includes(settings.oscillator.type)) {
          validated.oscillator = { type: settings.oscillator.type };
        }
      }
      
      if (settings.envelope) {
        validated.envelope = {
          attack: Math.max(0.01, Math.min(1, settings.envelope.attack || 0.01)),
          decay: Math.max(0.01, Math.min(2, settings.envelope.decay || 0.1)),
          sustain: Math.max(0, Math.min(1, settings.envelope.sustain || 0.3)),
          release: Math.max(0.1, Math.min(2, settings.envelope.release || 1))
        };
      }
      
      return validated;
    }
  }
});