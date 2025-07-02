import { ref, reactive, onUnmounted, readonly } from 'vue';
import { useErrorHandler } from './useErrorHandler';

// Synthesizer parameter interface
export interface SynthParameters {
  attack: number;
  release: number;
  reverb: number;
  oscillatorType: 'sine' | 'square' | 'triangle' | 'sawtooth';
}

// Preset interface
export interface PresetData {
  name: string;
  parameters: SynthParameters;
}

// Default parameters
const DEFAULT_PARAMETERS: SynthParameters = {
  attack: 0.1,
  release: 0.5,
  reverb: 0.3,
  oscillatorType: 'sine'
};

// Built-in presets
const BUILT_IN_PRESETS: { [key: string]: PresetData } = {
  default: {
    name: 'Default',
    parameters: { attack: 0.1, release: 0.5, reverb: 0.3, oscillatorType: 'sine' }
  },
  bright: {
    name: 'Bright',
    parameters: { attack: 0.01, release: 0.2, reverb: 0.1, oscillatorType: 'square' }
  },
  warm: {
    name: 'Warm',
    parameters: { attack: 0.3, release: 1.5, reverb: 0.6, oscillatorType: 'triangle' }
  },
  percussive: {
    name: 'Percussive',
    parameters: { attack: 0.01, release: 0.1, reverb: 0.2, oscillatorType: 'sawtooth' }
  }
};

export function useFMSynth() {
  const { handleError } = useErrorHandler();

  // State
  const isInitialized = ref(false);
  const isInitializing = ref(false);
  const error = ref<string>('');
  const parameters = reactive<SynthParameters>({ ...DEFAULT_PARAMETERS });

  // Tone.js instances
  let Tone: any = null;
  let fmSynth: any = null;
  let reverb: any = null;
  let masterVolume: any = null;

  /**
   * Initialize the FM Synthesizer
   */
  const initialize = async (): Promise<boolean> => {
    if (isInitializing.value) return false;
    if (isInitialized.value) return true;

    isInitializing.value = true;
    error.value = '';

    try {
      console.log('Initializing FM Synthesizer...');

      // Load Tone.js with timeout
      const loadPromise = import('tone');
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Tone.js load timeout')), 5000)
      );

      Tone = await Promise.race([loadPromise, timeoutPromise]);
      console.log('Tone.js loaded successfully');

      // Ensure audio context is running
      if (Tone.context.state !== 'running') {
        await Tone.start();
        console.log('Tone.js context started');
      }

      // Create master volume control
      masterVolume = new Tone.Volume(-6).toDestination();

      // Create reverb effect
      reverb = new Tone.Reverb({
        decay: 2.5,
        wet: parameters.reverb
      }).connect(masterVolume);

      // Wait for reverb to generate its impulse response
      await reverb.generate();

      // Create FM Synthesizer with current parameters
      fmSynth = new Tone.FMSynth({
        harmonicity: 3,
        modulationIndex: 10,
        oscillator: { 
          type: parameters.oscillatorType 
        },
        envelope: { 
          attack: parameters.attack, 
          decay: 0.1, 
          sustain: 0.3, 
          release: parameters.release 
        },
        modulation: { 
          type: 'square' 
        },
        modulationEnvelope: { 
          attack: 0.02, 
          decay: 0.1, 
          sustain: 0.3, 
          release: 0.2 
        }
      });

      // Connect synth through effects chain
      fmSynth.connect(reverb);

      isInitialized.value = true;
      console.log('FM Synthesizer initialized successfully');
      return true;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      error.value = `Failed to initialize FM Synthesizer: ${errorMessage}`;
      console.error('FM Synthesizer initialization failed:', err);
      handleError(err as Error, 'FM Synthesizer initialization');
      
      // Cleanup on error
      dispose();
      return false;
    } finally {
      isInitializing.value = false;
    }
  };

  /**
   * Update attack parameter with validation
   */
  const updateAttack = (value: number) => {
    const clampedValue = Math.max(0.01, Math.min(2, value));
    parameters.attack = clampedValue;
    
    if (fmSynth && isInitialized.value) {
      try {
        fmSynth.envelope.attack = clampedValue;
        console.log(`Updated attack to: ${clampedValue}s`);
      } catch (err) {
        console.warn('Failed to update attack:', err);
      }
    }
  };

  /**
   * Update release parameter with validation
   */
  const updateRelease = (value: number) => {
    const clampedValue = Math.max(0.1, Math.min(4, value));
    parameters.release = clampedValue;
    
    if (fmSynth && isInitialized.value) {
      try {
        fmSynth.envelope.release = clampedValue;
        console.log(`Updated release to: ${clampedValue}s`);
      } catch (err) {
        console.warn('Failed to update release:', err);
      }
    }
  };

  /**
   * Update oscillator type
   */
  const updateOscillatorType = (type: SynthParameters['oscillatorType']) => {
    parameters.oscillatorType = type;
    
    if (fmSynth && isInitialized.value) {
      try {
        fmSynth.oscillator.type = type;
        console.log(`Updated oscillator type to: ${type}`);
      } catch (err) {
        console.warn('Failed to update oscillator type:', err);
      }
    }
  };

  /**
   * Update reverb amount with validation
   */
  const updateReverb = (value: number) => {
    const clampedValue = Math.max(0, Math.min(1, value));
    parameters.reverb = clampedValue;
    
    if (reverb && isInitialized.value) {
      try {
        reverb.wet.value = clampedValue;
        console.log(`Updated reverb to: ${clampedValue}`);
      } catch (err) {
        console.warn('Failed to update reverb:', err);
      }
    }
  };

  /**
   * Trigger a note
   */
  const triggerNote = (note: string | number, duration: string = '8n', velocity: number = 0.8): void => {
    if (!fmSynth || !isInitialized.value) {
      console.warn('FM Synthesizer not ready');
      return;
    }
    
    try {
      const clampedVelocity = Math.max(0, Math.min(1, velocity));
      fmSynth.triggerAttackRelease(note, duration, undefined, clampedVelocity);
      console.log(`Triggered note: ${note} for ${duration} at velocity ${clampedVelocity}`);
    } catch (err) {
      console.warn('Failed to trigger note:', err);
    }
  };

  /**
   * Load a preset
   */
  const loadPreset = (presetName: string): boolean => {
    const preset = BUILT_IN_PRESETS[presetName];
    if (!preset) {
      console.warn(`Preset not found: ${presetName}`);
      return false;
    }

    // Update parameters
    Object.assign(parameters, preset.parameters);

    // Apply to synth if initialized
    if (isInitialized.value) {
      updateAttack(parameters.attack);
      updateRelease(parameters.release);
      updateOscillatorType(parameters.oscillatorType);
      updateReverb(parameters.reverb);
    }

    console.log(`Loaded preset: ${preset.name}`);
    return true;
  };

  /**
   * Save current settings as custom preset
   */
  const saveCustomPreset = (name: string = 'Custom'): void => {
    const presetData: PresetData = {
      name,
      parameters: { ...parameters }
    };

    try {
      localStorage.setItem('fmSynthCustomPreset', JSON.stringify(presetData));
      console.log(`Saved custom preset: ${name}`);
    } catch (err) {
      console.warn('Failed to save custom preset:', err);
    }
  };

  /**
   * Load custom preset from localStorage
   */
  const loadCustomPreset = (): boolean => {
    try {
      const savedPreset = localStorage.getItem('fmSynthCustomPreset');
      if (!savedPreset) return false;

      const presetData: PresetData = JSON.parse(savedPreset);
      
      // Update parameters
      Object.assign(parameters, presetData.parameters);

      // Apply to synth if initialized
      if (isInitialized.value) {
        updateAttack(parameters.attack);
        updateRelease(parameters.release);
        updateOscillatorType(parameters.oscillatorType);
        updateReverb(parameters.reverb);
      }

      console.log(`Loaded custom preset: ${presetData.name}`);
      return true;
    } catch (err) {
      console.warn('Failed to load custom preset:', err);
      return false;
    }
  };

  /**
   * Reset to default parameters
   */
  const resetToDefault = (): void => {
    loadPreset('default');
  };

  /**
   * Get current parameters
   */
  const getCurrentParameters = (): SynthParameters => {
    return { ...parameters };
  };

  /**
   * Set parameters programmatically
   */
  const setParameters = (newParams: Partial<SynthParameters>): void => {
    if (newParams.attack !== undefined) {
      updateAttack(newParams.attack);
    }
    if (newParams.release !== undefined) {
      updateRelease(newParams.release);
    }
    if (newParams.oscillatorType !== undefined) {
      updateOscillatorType(newParams.oscillatorType);
    }
    if (newParams.reverb !== undefined) {
      updateReverb(newParams.reverb);
    }
  };

  /**
   * Get available presets
   */
  const getAvailablePresets = (): string[] => {
    return Object.keys(BUILT_IN_PRESETS);
  };

  /**
   * Clear error message
   */
  const clearError = (): void => {
    error.value = '';
  };

  /**
   * Dispose of all resources
   */
  const dispose = (): void => {
    try {
      if (fmSynth) {
        fmSynth.dispose();
        fmSynth = null;
      }
      
      if (reverb) {
        reverb.dispose();
        reverb = null;
      }
      
      if (masterVolume) {
        masterVolume.dispose();
        masterVolume = null;
      }
    } catch (err) {
      console.warn('Error disposing FM Synthesizer:', err);
    }
    
    isInitialized.value = false;
    Tone = null;
  };

  // Cleanup on unmount
  onUnmounted(() => {
    dispose();
  });

  return {
    // State
    isInitialized: readonly(isInitialized),
    isInitializing: readonly(isInitializing),
    error: readonly(error),
    parameters: readonly(parameters),

    // Methods
    initialize,
    triggerNote,
    updateAttack,
    updateRelease,
    updateOscillatorType,
    updateReverb,
    loadPreset,
    saveCustomPreset,
    loadCustomPreset,
    resetToDefault,
    getCurrentParameters,
    setParameters,
    getAvailablePresets,
    clearError,
    dispose
  };
}