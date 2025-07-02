import { ref, reactive, onUnmounted, readonly, watch } from 'vue';
import { useErrorHandler } from './useErrorHandler';

// Voice state interface
export interface Voice {
  id: number;
  isActive: boolean;
  frequency: number;
  velocity: number;
  startTime: number;
  duration: number;
  oscillator?: any;
  envelope?: any;
  modulator?: any;
  modulatorEnvelope?: any;
  panner?: any;
  voiceGain?: any;
}

// Polyphonic synthesizer parameters
export interface PolyphonicSynthParameters {
  maxVoices: number;
  attack: number;
  release: number;
  harmonicity: number;
  modulationIndex: number;
  oscillatorType: 'sine' | 'square' | 'triangle' | 'sawtooth';
  modulatorType: 'sine' | 'square' | 'triangle' | 'sawtooth';
  masterVolume: number;
  reverbAmount: number;
  voiceSpread: number; // Stereo spread for voices
}

// Default parameters
const DEFAULT_PARAMETERS: PolyphonicSynthParameters = {
  maxVoices: 16,
  attack: 0.1,
  release: 0.5,
  harmonicity: 3,
  modulationIndex: 10,
  oscillatorType: 'sine',
  modulatorType: 'square',
  masterVolume: 0.7,
  reverbAmount: 0.3,
  voiceSpread: 0.5
};

// Global singleton instance
let polyphonicSynthInstance: ReturnType<typeof createPolyphonicSynthInstance> | null = null;

/**
 * Create the Polyphonic FM Synth instance (internal function)
 */
function createPolyphonicSynthInstance() {
  const { handleError } = useErrorHandler();

  // State
  const isInitialized = ref(false);
  const isInitializing = ref(false);
  const error = ref<string>('');
  const parameters = reactive<PolyphonicSynthParameters>({ ...DEFAULT_PARAMETERS });

  // Voice management
  const voices = ref<Voice[]>([]);
  const activeVoiceCount = ref(0);
  const voiceIdCounter = ref(0);

  // Tone.js instances
  let Tone: any = null;
  let masterVolume: any = null;
  let reverb: any = null;
  let context: AudioContext | null = null;

  // Voice cleanup tracking
  const voiceCleanupTimeouts = new Map<number, number>();

  // Load saved parameters from localStorage
  const loadSavedParameters = () => {
    try {
      const saved = localStorage.getItem('polyphonicFMSynthParameters');
      if (saved) {
        const savedParams = JSON.parse(saved);
        Object.assign(parameters, savedParams);
        console.log('Loaded saved polyphonic FM synth parameters:', savedParams);
      }
    } catch (err) {
      console.warn('Failed to load saved polyphonic parameters:', err);
    }
  };

  // Save parameters to localStorage
  const saveParameters = () => {
    try {
      localStorage.setItem('polyphonicFMSynthParameters', JSON.stringify(parameters));
      console.log('Saved polyphonic FM synth parameters to localStorage');
    } catch (err) {
      console.warn('Failed to save polyphonic parameters:', err);
    }
  };

  // Watch for parameter changes and save them
  watch(parameters, saveParameters, { deep: true });

  /**
   * Initialize the Polyphonic FM Synthesizer with improved error handling
   */
  const initialize = async (): Promise<boolean> => {
    if (isInitializing.value) {
      console.log('Polyphonic synth already initializing, waiting...');
      return false;
    }
    if (isInitialized.value) {
      console.log('Polyphonic synth already initialized');
      return true;
    }

    isInitializing.value = true;
    error.value = '';

    try {
      console.log('Starting Polyphonic FM Synthesizer initialization...');

      // Load Tone.js with timeout and better error handling
      try {
        const loadPromise = import('tone');
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Tone.js load timeout after 10 seconds')), 10000)
        );

        Tone = await Promise.race([loadPromise, timeoutPromise]);
        console.log('Tone.js loaded successfully for polyphonic synth');
      } catch (loadError) {
        throw new Error(`Failed to load Tone.js: ${loadError.message}`);
      }

      // Get audio context and ensure it's running
      context = Tone.context;
      console.log(`Initial Tone.js context state: ${context.state}`);

      // Start audio context with user interaction handling
      if (context.state !== 'running') {
        console.log('Starting Tone.js context...');
        try {
          await Tone.start();
          console.log('Tone.js started successfully');
        } catch (startError) {
          console.warn('Tone.start() failed, trying context.resume():', startError);
          if (context.state === 'suspended') {
            await context.resume();
          }
        }
      }

      // Wait for context to be running with multiple attempts
      let attempts = 0;
      const maxAttempts = 20;
      while (context.state !== 'running' && attempts < maxAttempts) {
        console.log(`Waiting for context to be running... attempt ${attempts + 1}/${maxAttempts}, current state: ${context.state}`);
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (context.state === 'suspended') {
          try {
            await context.resume();
          } catch (resumeError) {
            console.warn('Context resume failed:', resumeError);
          }
        }
        attempts++;
      }

      if (context.state !== 'running') {
        throw new Error(`Audio context failed to start after ${maxAttempts} attempts. Final state: ${context.state}`);
      }

      console.log('Audio context is now running, creating audio components...');

      // Create master volume control with proper scaling - separate from connection
      masterVolume = new Tone.Volume(Tone.gainToDb(parameters.masterVolume * 0.5));
      console.log('Master volume created');

      // Create reverb effect - separate from connection
      reverb = new Tone.Reverb({
        decay: 2.5,
        wet: parameters.reverbAmount
      });
      console.log('Reverb created');

      console.log('Generating reverb impulse response...');
      // Wait for reverb to generate its impulse response
      await reverb.generate();
      console.log('Reverb impulse response generated');

      // Now connect the audio nodes after both are fully created
      console.log('Connecting audio nodes...');
      reverb.connect(masterVolume);
      masterVolume.toDestination();
      console.log('Audio nodes connected successfully');

      // Initialize voice pool
      initializeVoicePool();

      isInitialized.value = true;
      console.log('Polyphonic FM Synthesizer initialized successfully!');
      return true;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      error.value = `Failed to initialize Polyphonic FM Synthesizer: ${errorMessage}`;
      console.error('Polyphonic FM Synthesizer initialization failed:', err);
      handleError(err as Error, 'Polyphonic FM Synthesizer initialization');
      
      // Cleanup on error
      dispose();
      return false;
    } finally {
      isInitializing.value = false;
    }
  };

  /**
   * Initialize voice pool
   */
  const initializeVoicePool = () => {
    voices.value = [];
    for (let i = 0; i < parameters.maxVoices; i++) {
      voices.value.push({
        id: i,
        isActive: false,
        frequency: 440,
        velocity: 0,
        startTime: 0,
        duration: 0
      });
    }
    console.log(`Initialized voice pool with ${parameters.maxVoices} voices`);
  };

  /**
   * Find an available voice or steal the oldest one
   */
  const allocateVoice = (): Voice | null => {
    // First, try to find an inactive voice
    let availableVoice = voices.value.find(voice => !voice.isActive);
    
    if (!availableVoice) {
      // If no inactive voice, steal the oldest active voice
      let oldestVoice = voices.value[0];
      let oldestTime = oldestVoice.startTime;
      
      for (const voice of voices.value) {
        if (voice.isActive && voice.startTime < oldestTime) {
          oldestVoice = voice;
          oldestTime = voice.startTime;
        }
      }
      
      // Stop the oldest voice
      if (oldestVoice.isActive) {
        stopVoice(oldestVoice);
      }
      
      availableVoice = oldestVoice;
    }

    return availableVoice;
  };

  /**
   * Create FM synthesis components for a voice with improved audio mixing
   */
  const createVoiceComponents = (voice: Voice) => {
    if (!Tone || !context) {
      console.error('Tone.js or context not available for voice creation');
      return;
    }

    try {
      console.log(`Creating voice components for voice ${voice.id} at ${voice.frequency}Hz`);

      // Calculate stereo position based on voice ID for better separation
      const panPosition = (voice.id / (parameters.maxVoices - 1) - 0.5) * parameters.voiceSpread;

      // Create carrier oscillator
      voice.oscillator = new Tone.Oscillator({
        frequency: voice.frequency,
        type: parameters.oscillatorType
      });

      // Create modulator oscillator
      voice.modulator = new Tone.Oscillator({
        frequency: voice.frequency * parameters.harmonicity,
        type: parameters.modulatorType
      });

      // Create carrier envelope with proper gain scaling to prevent clipping
      voice.envelope = new Tone.Gain(0);

      // Create modulator envelope
      voice.modulatorEnvelope = new Tone.Gain(0);

      // Create panner for stereo spread
      voice.panner = new Tone.Panner(panPosition);

      // Create a gain node for voice-level volume control to prevent clipping
      voice.voiceGain = new Tone.Gain(voice.velocity * 0.2); // Scale down to prevent clipping

      // Connect modulator through its envelope to carrier frequency
      voice.modulator.connect(voice.modulatorEnvelope);
      voice.modulatorEnvelope.connect(voice.oscillator.frequency);

      // Connect carrier through envelope, voice gain, panner to reverb
      voice.oscillator.connect(voice.envelope);
      voice.envelope.connect(voice.voiceGain);
      voice.voiceGain.connect(voice.panner);
      voice.panner.connect(reverb);

      // Start oscillators
      voice.oscillator.start();
      voice.modulator.start();

      console.log(`Voice components created successfully for voice ${voice.id}`);

    } catch (err) {
      console.error('Failed to create voice components:', err);
      throw err;
    }
  };

  /**
   * Apply envelope to a voice with improved timing
   */
  const applyEnvelope = (voice: Voice) => {
    if (!voice.envelope || !voice.modulatorEnvelope || !context) {
      console.error('Voice envelope components not available');
      return;
    }

    const now = context.currentTime;
    const attackTime = parameters.attack;
    const releaseTime = parameters.release;
    const sustainLevel = voice.velocity * 0.3; // Scale down to prevent clipping
    const modulationAmount = parameters.modulationIndex * voice.velocity * 0.2; // Scale down modulation

    try {
      console.log(`Applying envelope to voice ${voice.id}: attack=${attackTime}s, release=${releaseTime}s`);

      // Carrier envelope with smooth curves
      voice.envelope.gain.setValueAtTime(0, now);
      voice.envelope.gain.linearRampToValueAtTime(sustainLevel, now + attackTime);
      voice.envelope.gain.setValueAtTime(sustainLevel, now + voice.duration - releaseTime);
      voice.envelope.gain.exponentialRampToValueAtTime(0.001, now + voice.duration);

      // Modulator envelope
      voice.modulatorEnvelope.gain.setValueAtTime(0, now);
      voice.modulatorEnvelope.gain.linearRampToValueAtTime(modulationAmount, now + attackTime);
      voice.modulatorEnvelope.gain.setValueAtTime(modulationAmount, now + voice.duration - releaseTime);
      voice.modulatorEnvelope.gain.exponentialRampToValueAtTime(0.001, now + voice.duration);

      console.log(`Envelope applied successfully to voice ${voice.id}`);

    } catch (err) {
      console.error('Failed to apply envelope:', err);
    }
  };

  /**
   * Stop a voice and clean up its components
   */
  const stopVoice = (voice: Voice) => {
    if (!voice.isActive) return;

    try {
      console.log(`Stopping voice ${voice.id}...`);

      // Clear any existing cleanup timeout
      const existingTimeout = voiceCleanupTimeouts.get(voice.id);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
        voiceCleanupTimeouts.delete(voice.id);
      }

      if (voice.oscillator) {
        voice.oscillator.stop();
        voice.oscillator.dispose();
        voice.oscillator = undefined;
      }

      if (voice.modulator) {
        voice.modulator.stop();
        voice.modulator.dispose();
        voice.modulator = undefined;
      }

      if (voice.envelope) {
        voice.envelope.dispose();
        voice.envelope = undefined;
      }

      if (voice.modulatorEnvelope) {
        voice.modulatorEnvelope.dispose();
        voice.modulatorEnvelope = undefined;
      }

      if (voice.panner) {
        voice.panner.dispose();
        voice.panner = undefined;
      }

      if (voice.voiceGain) {
        voice.voiceGain.dispose();
        voice.voiceGain = undefined;
      }

      voice.isActive = false;
      activeVoiceCount.value = Math.max(0, activeVoiceCount.value - 1);

      console.log(`Voice ${voice.id} stopped successfully, active voices: ${activeVoiceCount.value}`);

    } catch (err) {
      console.error('Failed to stop voice:', err);
    }
  };

  /**
   * Trigger a note with polyphonic capability and improved audio mixing
   */
  const triggerNote = (frequency: number | string, duration: number = 0.5, velocity: number = 0.8): void => {
    console.log(`Polyphonic synth: triggerNote called with frequency=${frequency}, duration=${duration}, velocity=${velocity}`);

    if (!isInitialized.value || !context) {
      console.warn('Polyphonic FM Synthesizer not ready - initialized:', isInitialized.value, 'context:', !!context);
      return;
    }

    try {
      // Convert note to frequency if needed
      const freq = typeof frequency === 'string' ? noteToFrequency(frequency) : frequency;
      const clampedVelocity = Math.max(0, Math.min(1, velocity));
      const clampedDuration = Math.max(0.1, duration);

      console.log(`Processing note: ${freq.toFixed(1)}Hz for ${clampedDuration}s at velocity ${clampedVelocity}`);

      // Allocate a voice
      const voice = allocateVoice();
      if (!voice) {
        console.warn('No voice available for note');
        return;
      }

      // Configure voice
      voice.frequency = freq;
      voice.velocity = clampedVelocity;
      voice.duration = clampedDuration;
      voice.startTime = context.currentTime;
      voice.isActive = true;
      voice.id = voiceIdCounter.value++;

      activeVoiceCount.value++;

      console.log(`Allocated voice ${voice.id}, active voices: ${activeVoiceCount.value}`);

      // Create audio components for this voice
      createVoiceComponents(voice);

      // Apply envelope
      applyEnvelope(voice);

      // Schedule voice cleanup with proper timing
      const cleanupTimeout = setTimeout(() => {
        stopVoice(voice);
        voiceCleanupTimeouts.delete(voice.id);
      }, clampedDuration * 1000 + 100); // Add 100ms buffer

      voiceCleanupTimeouts.set(voice.id, cleanupTimeout);

      console.log(`Polyphonic FM Synth triggered successfully: ${freq.toFixed(1)}Hz, voice ${voice.id}, active voices: ${activeVoiceCount.value}`);

    } catch (err) {
      console.error('Failed to trigger polyphonic note:', err);
    }
  };

  /**
   * Convert note name to frequency
   */
  const noteToFrequency = (note: string): number => {
    const noteMap: { [key: string]: number } = {
      'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13,
      'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00,
      'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
      'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46,
      'G5': 783.99, 'A5': 880.00, 'B5': 987.77, 'C6': 1046.50
    };
    return noteMap[note] || 440;
  };

  /**
   * Update master volume with proper scaling
   */
  const updateMasterVolume = (volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    parameters.masterVolume = clampedVolume;
    
    if (masterVolume && isInitialized.value && Tone) {
      try {
        // Scale volume to prevent clipping with multiple voices
        const scaledVolume = clampedVolume * 0.5; // Reduce overall volume for polyphonic mixing
        masterVolume.volume.value = Tone.gainToDb(scaledVolume);
        console.log(`Updated polyphonic master volume to: ${clampedVolume} (scaled: ${scaledVolume})`);
      } catch (err) {
        console.warn('Failed to update master volume:', err);
      }
    }
  };

  /**
   * Update reverb amount
   */
  const updateReverbAmount = (amount: number) => {
    const clampedAmount = Math.max(0, Math.min(1, amount));
    parameters.reverbAmount = clampedAmount;
    
    if (reverb && isInitialized.value) {
      try {
        reverb.wet.value = clampedAmount;
        console.log(`Updated polyphonic reverb amount to: ${clampedAmount}`);
      } catch (err) {
        console.warn('Failed to update reverb amount:', err);
      }
    }
  };

  /**
   * Update attack time
   */
  const updateAttack = (attack: number) => {
    const clampedAttack = Math.max(0.01, Math.min(2, attack));
    parameters.attack = clampedAttack;
    console.log(`Updated polyphonic attack to: ${clampedAttack}s`);
  };

  /**
   * Update release time
   */
  const updateRelease = (release: number) => {
    const clampedRelease = Math.max(0.1, Math.min(4, release));
    parameters.release = clampedRelease;
    console.log(`Updated polyphonic release to: ${clampedRelease}s`);
  };

  /**
   * Update harmonicity
   */
  const updateHarmonicity = (harmonicity: number) => {
    const clampedHarmonicity = Math.max(0.1, Math.min(10, harmonicity));
    parameters.harmonicity = clampedHarmonicity;
    console.log(`Updated polyphonic harmonicity to: ${clampedHarmonicity}`);
  };

  /**
   * Update modulation index
   */
  const updateModulationIndex = (index: number) => {
    const clampedIndex = Math.max(0, Math.min(50, index));
    parameters.modulationIndex = clampedIndex;
    console.log(`Updated polyphonic modulation index to: ${clampedIndex}`);
  };

  /**
   * Update oscillator type
   */
  const updateOscillatorType = (type: PolyphonicSynthParameters['oscillatorType']) => {
    parameters.oscillatorType = type;
    console.log(`Updated polyphonic oscillator type to: ${type}`);
  };

  /**
   * Update voice spread (stereo width)
   */
  const updateVoiceSpread = (spread: number) => {
    const clampedSpread = Math.max(0, Math.min(1, spread));
    parameters.voiceSpread = clampedSpread;
    console.log(`Updated polyphonic voice spread to: ${clampedSpread}`);
  };

  /**
   * Stop all active voices
   */
  const stopAllVoices = () => {
    console.log('Stopping all polyphonic voices...');
    
    // Clear all cleanup timeouts
    voiceCleanupTimeouts.forEach((timeout) => {
      clearTimeout(timeout);
    });
    voiceCleanupTimeouts.clear();

    // Stop all voices
    voices.value.forEach(voice => {
      if (voice.isActive) {
        stopVoice(voice);
      }
    });
    
    activeVoiceCount.value = 0;
    console.log('Stopped all polyphonic voices');
  };

  /**
   * Get voice statistics
   */
  const getVoiceStats = () => {
    return {
      maxVoices: parameters.maxVoices,
      activeVoices: activeVoiceCount.value,
      availableVoices: parameters.maxVoices - activeVoiceCount.value
    };
  };

  /**
   * Set all parameters at once
   */
  const setParameters = (newParams: Partial<PolyphonicSynthParameters>): void => {
    if (newParams.attack !== undefined) {
      updateAttack(newParams.attack);
    }
    if (newParams.release !== undefined) {
      updateRelease(newParams.release);
    }
    if (newParams.harmonicity !== undefined) {
      updateHarmonicity(newParams.harmonicity);
    }
    if (newParams.modulationIndex !== undefined) {
      updateModulationIndex(newParams.modulationIndex);
    }
    if (newParams.oscillatorType !== undefined) {
      updateOscillatorType(newParams.oscillatorType);
    }
    if (newParams.masterVolume !== undefined) {
      updateMasterVolume(newParams.masterVolume);
    }
    if (newParams.reverbAmount !== undefined) {
      updateReverbAmount(newParams.reverbAmount);
    }
    if (newParams.voiceSpread !== undefined) {
      updateVoiceSpread(newParams.voiceSpread);
    }
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
      // Stop all voices and clear timeouts
      stopAllVoices();

      if (reverb) {
        reverb.dispose();
        reverb = null;
      }
      
      if (masterVolume) {
        masterVolume.dispose();
        masterVolume = null;
      }
    } catch (err) {
      console.warn('Error disposing Polyphonic FM Synthesizer:', err);
    }
    
    isInitialized.value = false;
    context = null;
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
    activeVoiceCount: readonly(activeVoiceCount),

    // Methods
    initialize,
    triggerNote,
    updateAttack,
    updateRelease,
    updateHarmonicity,
    updateModulationIndex,
    updateOscillatorType,
    updateMasterVolume,
    updateReverbAmount,
    updateVoiceSpread,
    setParameters,
    stopAllVoices,
    getVoiceStats,
    clearError,
    dispose
  };
}

/**
 * Polyphonic FM Synthesizer composable - provides singleton access
 */
export function usePolyphonicFMSynth() {
  // Create singleton instance if it doesn't exist
  if (!polyphonicSynthInstance) {
    polyphonicSynthInstance = createPolyphonicSynthInstance();
  }

  return polyphonicSynthInstance;
}

/**
 * Auto-initialize the polyphonic FM synth on user interaction
 */
export function setupPolyphonicFMSynthAutoInit() {
  if (typeof window === 'undefined') return;

  const polyphonicSynth = usePolyphonicFMSynth();
  
  // List of user interaction events that can start audio
  const userEvents = ['click', 'touchstart', 'keydown'];
  
  const handleUserInteraction = async () => {
    if (!polyphonicSynth.isInitialized.value && !polyphonicSynth.isInitializing.value) {
      console.log('Polyphonic FM Synth: User interaction detected, attempting auto-init...');
      
      const success = await polyphonicSynth.initialize();
      
      if (success) {
        // Remove event listeners once successful
        userEvents.forEach(event => {
          document.removeEventListener(event, handleUserInteraction, { capture: true });
        });
        console.log('Polyphonic FM Synth: Auto-init successful, removed event listeners');
      }
    }
  };

  // Add event listeners for user interaction
  userEvents.forEach(event => {
    document.addEventListener(event, handleUserInteraction, { capture: true, once: false });
  });

  console.log('Polyphonic FM Synth: Auto-init event listeners added');
}