import { ref, reactive, onUnmounted, readonly, watch } from 'vue';
import { useErrorHandler } from './useErrorHandler';

// Synthesizer parameter interface
export interface SynthParameters {
  attack: number;
  release: number;
  reverb: number;
  oscillatorType: 'sine' | 'square' | 'triangle' | 'sawtooth';
  harmonicity: number;
  modulationIndex: number;
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
  oscillatorType: 'sine',
  harmonicity: 3,
  modulationIndex: 10
};

// Global singleton instance
let globalFMSynthInstance: ReturnType<typeof createFMSynthInstance> | null = null;

/**
 * Create the FM Synth instance (internal function)
 */
function createFMSynthInstance() {
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

  // Load saved parameters from localStorage
  const loadSavedParameters = () => {
    try {
      const saved = localStorage.getItem('globalFMSynthParameters');
      if (saved) {
        const savedParams = JSON.parse(saved);
        Object.assign(parameters, savedParams);
        console.log('Loaded saved FM synth parameters:', savedParams);
      }
    } catch (err) {
      console.warn('Failed to load saved parameters:', err);
    }
  };

  // Save parameters to localStorage
  const saveParameters = () => {
    try {
      localStorage.setItem('globalFMSynthParameters', JSON.stringify(parameters));
      console.log('Saved FM synth parameters to localStorage');
    } catch (err) {
      console.warn('Failed to save parameters:', err);
    }
  };

  // Watch for parameter changes and save them
  watch(parameters, saveParameters, { deep: true });

  /**
   * Initialize the FM Synthesizer
   */
  const initialize = async (): Promise<boolean> => {
    if (isInitializing.value) return false;
    if (isInitialized.value) return true;

    isInitializing.value = true;
    error.value = '';

    try {
      console.log('Initializing Global FM Synthesizer...');

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
        harmonicity: parameters.harmonicity,
        modulationIndex: parameters.modulationIndex,
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
      console.log('Global FM Synthesizer initialized successfully');
      return true;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      error.value = `Failed to initialize FM Synthesizer: ${errorMessage}`;
      console.error('Global FM Synthesizer initialization failed:', err);
      handleError(err as Error, 'Global FM Synthesizer initialization');
      
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
        console.log(`Updated global attack to: ${clampedValue}s`);
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
        console.log(`Updated global release to: ${clampedValue}s`);
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
        console.log(`Updated global oscillator type to: ${type}`);
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
        console.log(`Updated global reverb to: ${clampedValue}`);
      } catch (err) {
        console.warn('Failed to update reverb:', err);
      }
    }
  };

  /**
   * Update harmonicity parameter
   */
  const updateHarmonicity = (value: number) => {
    const clampedValue = Math.max(0.1, Math.min(10, value));
    parameters.harmonicity = clampedValue;
    
    if (fmSynth && isInitialized.value) {
      try {
        fmSynth.harmonicity.value = clampedValue;
        console.log(`Updated global harmonicity to: ${clampedValue}`);
      } catch (err) {
        console.warn('Failed to update harmonicity:', err);
      }
    }
  };

  /**
   * Update modulation index parameter
   */
  const updateModulationIndex = (value: number) => {
    const clampedValue = Math.max(0, Math.min(50, value));
    parameters.modulationIndex = clampedValue;
    
    if (fmSynth && isInitialized.value) {
      try {
        fmSynth.modulationIndex.value = clampedValue;
        console.log(`Updated global modulation index to: ${clampedValue}`);
      } catch (err) {
        console.warn('Failed to update modulation index:', err);
      }
    }
  };

  /**
   * Trigger a note
   */
  const triggerNote = (note: string | number, duration: string = '8n', velocity: number = 0.8): void => {
    if (!fmSynth || !isInitialized.value) {
      console.warn('Global FM Synthesizer not ready');
      return;
    }
    
    try {
      const clampedVelocity = Math.max(0, Math.min(1, velocity));
      fmSynth.triggerAttackRelease(note, duration, undefined, clampedVelocity);
      // console.log(`Global FM Synth triggered note: ${note} for ${duration} at velocity ${clampedVelocity}`);
    } catch (err) {
      console.warn('Failed to trigger note:', err);
    }
  };

  /**
   * Set all parameters at once
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
    if (newParams.harmonicity !== undefined) {
      updateHarmonicity(newParams.harmonicity);
    }
    if (newParams.modulationIndex !== undefined) {
      updateModulationIndex(newParams.modulationIndex);
    }
  };

  /**
   * Get current parameters
   */
  const getCurrentParameters = (): SynthParameters => {
    return { ...parameters };
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
      console.warn('Error disposing Global FM Synthesizer:', err);
    }
    
    isInitialized.value = false;
    Tone = null;
  };

  // Load saved parameters on creation
  loadSavedParameters();

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
    updateHarmonicity,
    updateModulationIndex,
    setParameters,
    getCurrentParameters,
    clearError,
    dispose
  };
}

/**
 * Global FM Synthesizer composable - provides singleton access
 */
export function useGlobalFMSynth() {
  // Create singleton instance if it doesn't exist
  if (!globalFMSynthInstance) {
    globalFMSynthInstance = createFMSynthInstance();
  }

  return globalFMSynthInstance;
}

/**
 * Auto-initialize the global FM synth on user interaction
 */
export function setupGlobalFMSynthAutoInit() {
  if (typeof window === 'undefined') return;

  const globalSynth = useGlobalFMSynth();
  
  // List of user interaction events that can start audio
  const userEvents = ['click', 'touchstart', 'keydown'];
  
  const handleUserInteraction = async () => {
    if (!globalSynth.isInitialized.value && !globalSynth.isInitializing.value) {
      console.log('Global FM Synth: User interaction detected, attempting auto-init...');
      
      const success = await globalSynth.initialize();
      
      if (success) {
        // Remove event listeners once successful
        userEvents.forEach(event => {
          document.removeEventListener(event, handleUserInteraction, { capture: true });
        });
        console.log('Global FM Synth: Auto-init successful, removed event listeners');
      }
    }
  };

  // Add event listeners for user interaction
  userEvents.forEach(event => {
    document.addEventListener(event, handleUserInteraction, { capture: true, once: false });
  });

  console.log('Global FM Synth: Auto-init event listeners added');
}