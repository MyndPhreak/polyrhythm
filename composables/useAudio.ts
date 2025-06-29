import { ref, onUnmounted, readonly } from 'vue';
import { useErrorHandler } from './useErrorHandler';
import { AUDIO_CONSTANTS } from '~/constants';

export function useAudio() {
  const { handleError } = useErrorHandler();

  // Audio components
  const synth = ref<any | null>(null);
  const masterVolume = ref<any | null>(null);

  // State
  const isInitialized = ref(false);
  const isContextStarted = ref(false);
  const currentVolume = ref(AUDIO_CONSTANTS.DEFAULT_MASTER_VOLUME);
  const isInitializing = ref(false);

  // Tone.js reference
  let Tone: any = null;

  /**
   * Dynamically import Tone.js (client-side only)
   */
  const loadTone = async () => {
    if (!process.client) {
      throw new Error('Tone.js can only be loaded on the client-side');
    }

    if (!Tone) {
      Tone = await import('tone');
    }
    return Tone;
  };

  /**
   * Check if user interaction is required for audio context
   */
  const checkUserInteractionRequired = async (): Promise<boolean> => {
    if (!process.client) return false;

    try {
      await loadTone();
      return Tone.context.state === 'suspended';
    } catch (err) {
      console.warn('Could not check audio context state:', err);
      return true;
    }
  };

  /**
   * Initialize the audio context and start Tone.js with proper error handling
   */
  const startAudioContext = async (): Promise<boolean> => {
    try {
      if (!process.client) {
        console.warn('Audio context can only be started on the client-side');
        return false;
      }

      await loadTone();

      console.log('Current audio context state:', Tone.context.state);

      if (Tone.context.state === 'running') {
        isContextStarted.value = true;
        return true;
      }

      if (Tone.context.state === 'suspended') {
        console.log('Resuming suspended audio context...');
        await Tone.context.resume();
      }

      console.log('Starting Tone.js...');
      await Tone.start();

      // Wait for context to stabilize
      await new Promise(resolve => setTimeout(resolve, 300));

      if (Tone.context.state !== 'running') {
        await Tone.context.resume();
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      if (Tone.context.state === 'running') {
        console.log('Audio context started successfully');
        isContextStarted.value = true;
        return true;
      } else {
        throw new Error(`Audio context failed to start. State: ${Tone.context.state}`);
      }

    } catch (err) {
      const error = err as Error;
      console.error('Failed to start audio context:', error);
      handleError(error, 'Audio context startup');
      return false;
    }
  };

  /**
   * Safely dispose of an audio node
   */
  const safeDispose = (node: any, name: string) => {
    try {
      if (!node) return;

      if (typeof node.disconnect === 'function') {
        node.disconnect();
      }

      if (typeof node.dispose === 'function') {
        node.dispose();
      }

      console.log(`Successfully disposed ${name} node`);
    } catch (err) {
      console.warn(`Error disposing ${name}:`, err);
    }
  };

  /**
   * Create audio components with chunked, non-blocking approach
   */
  const createAudioComponents = async (): Promise<boolean> => {
    try {
      console.log('Creating basic synth...');
      
      // Use requestAnimationFrame to break up the work
      await new Promise(resolve => requestAnimationFrame(resolve));

      // Create simple synth with minimal configuration
      synth.value = new Tone.Synth({
        oscillator: { type: "sine" },
        envelope: { 
          attack: 0.1, 
          decay: 0.2, 
          sustain: 0.3, 
          release: 0.4 
        }
      });

      console.log('Synth created successfully');

      // Break up work with another frame
      await new Promise(resolve => requestAnimationFrame(resolve));

      console.log('Creating master volume...');
      masterVolume.value = new Tone.Volume(-6);
      console.log('Master volume created successfully');

      return true;
    } catch (err) {
      console.error('Error creating audio components:', err);
      throw err;
    }
  };

  /**
   * Connect audio chain with error handling and proper sequencing
   */
  const connectAudioChain = async (): Promise<boolean> => {
    try {
      console.log('Connecting audio chain...');
      
      // Ensure both components exist
      if (!synth.value || !masterVolume.value) {
        throw new Error('Audio components not created');
      }

      // Break up connection work
      await new Promise(resolve => requestAnimationFrame(resolve));

      // Connect synth to master volume
      synth.value.connect(masterVolume.value);
      console.log('Synth connected to master volume');

      await new Promise(resolve => requestAnimationFrame(resolve));

      // Connect master volume to destination
      masterVolume.value.toDestination();
      console.log('Master volume connected to destination');

      // Wait for connections to stabilize
      await new Promise(resolve => setTimeout(resolve, 100));

      return true;
    } catch (err) {
      console.error('Error connecting audio chain:', err);
      
      // Fallback: direct connection
      try {
        console.log('Attempting direct connection...');
        if (synth.value) {
          synth.value.toDestination();
          console.log('Direct connection successful');
          return true;
        } else {
          throw new Error('Synth not available for direct connection');
        }
      } catch (fallbackErr) {
        console.error('Direct connection also failed:', fallbackErr);
        throw fallbackErr;
      }
    }
  };

  /**
   * Apply initial settings from store to audio components
   */
  const applyInitialSettings = async (): Promise<void> => {
    try {
      console.log('Applying initial audio settings...');
      
      // Get audio store if available
      let audioStore = null;
      try {
        const { useAudioStore } = await import('~/stores/audioStore');
        audioStore = useAudioStore();
      } catch (err) {
        console.log('Audio store not available, using defaults');
      }

      // Apply master volume
      if (audioStore?.masterVolume !== undefined) {
        setVolume(audioStore.masterVolume);
        console.log('Applied master volume from store:', audioStore.masterVolume);
      } else {
        setVolume(AUDIO_CONSTANTS.DEFAULT_MASTER_VOLUME);
        console.log('Applied default master volume');
      }

      // Apply synth settings
      if (audioStore?.synthSettings) {
        updateSynthParams(audioStore.synthSettings);
        console.log('Applied synth settings from store');
      }

      console.log('Initial settings applied successfully');
    } catch (err) {
      console.warn('Error applying initial settings:', err);
      // Don't throw - this is not critical for basic functionality
    }
  };

  /**
   * Initialize the complete audio system with chunked processing
   */
  const initializeAudioSystem = async (): Promise<boolean> => {
    if (isInitializing.value) {
      console.log('Audio system initialization already in progress...');
      return false;
    }

    // Set up timeout protection
    let timeoutId: number | null = null;
    const timeoutPromise = new Promise<boolean>((_, reject) => {
      timeoutId = window.setTimeout(() => {
        reject(new Error('Audio system initialization timed out after 10 seconds'));
      }, 10000); // Increased timeout
    });

    try {
      isInitializing.value = true;
      console.log('Starting audio system initialization...');

      // Step 1: Start audio context
      console.log('Step 1: Starting audio context...');
      const contextStarted = await Promise.race([
        startAudioContext(),
        timeoutPromise
      ]);

      if (!contextStarted) {
        throw new Error('Failed to start audio context');
      }

      // Step 2: Create audio components (chunked)
      console.log('Step 2: Creating audio components...');
      const componentsCreated = await Promise.race([
        createAudioComponents(),
        timeoutPromise
      ]);

      if (!componentsCreated) {
        throw new Error('Failed to create audio components');
      }

      // Step 3: Connect audio chain (chunked)
      console.log('Step 3: Connecting audio chain...');
      const chainConnected = await Promise.race([
        connectAudioChain(),
        timeoutPromise
      ]);

      if (!chainConnected) {
        throw new Error('Failed to connect audio chain');
      }

      // Step 4: Apply initial settings from store
      console.log('Step 4: Applying initial settings...');
      await applyInitialSettings();

      console.log('Audio system initialized successfully');
      isInitialized.value = true;
      return true;

    } catch (err) {
      const error = err as Error;
      console.error('Audio system initialization failed:', error);

      // Clean up
      safeDispose(synth.value, 'synth');
      safeDispose(masterVolume.value, 'volume');
      synth.value = null;
      masterVolume.value = null;
      isInitialized.value = false;

      handleError(error, 'Failed to initialize audio system');
      return false;

    } finally {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
      isInitializing.value = false;
    }
  };

  /**
   * Trigger a note with specified frequency and duration
   */
  const triggerNote = (frequency: string | number, duration: string = "8n", velocity: number = 0.8): void => {
    try {
      if (!process.client || !synth.value || !isInitialized.value) {
        return;
      }

      if (Tone && Tone.context.state !== 'running') {
        console.warn('Audio context is not running');
        return;
      }

      const clampedVelocity = Math.max(0, Math.min(1, velocity));
      synth.value.triggerAttackRelease(frequency, duration, undefined, clampedVelocity);

    } catch (err) {
      console.warn('Failed to trigger note:', err);
    }
  };

  /**
   * Trigger attack only (for sustained notes)
   */
  const triggerAttack = (frequency: string | number, velocity: number = 0.8): void => {
    try {
      if (!process.client || !synth.value || !isInitialized.value) return;
      if (Tone && Tone.context.state !== 'running') return;

      const clampedVelocity = Math.max(0, Math.min(1, velocity));
      synth.value.triggerAttack(frequency, undefined, clampedVelocity);
    } catch (err) {
      console.warn('Failed to trigger attack:', err);
    }
  };

  /**
   * Trigger release for sustained notes
   */
  const triggerRelease = (): void => {
    try {
      if (!process.client || !synth.value || !isInitialized.value) return;
      if (Tone && Tone.context.state !== 'running') return;

      synth.value.triggerRelease();
    } catch (err) {
      console.warn('Failed to trigger release:', err);
    }
  };

  /**
   * Update master volume
   */
  const setVolume = (volume: number): void => {
    try {
      if (!process.client || !masterVolume.value) return;

      const clampedVolume = Math.max(0, Math.min(1, volume));
      const volumeDb = clampedVolume === 0 ? -Infinity : Tone.gainToDb(clampedVolume);

      masterVolume.value.volume.rampTo(volumeDb, 0.1);
      currentVolume.value = clampedVolume;
    } catch (err) {
      console.warn('Failed to set volume:', err);
    }
  };

  /**
   * Placeholder methods for API compatibility
   */
  const setReverbWet = (wetness: number): void => {
    console.log('Reverb is disabled in simplified audio system');
  };

  const setDelayWet = (wetness: number): void => {
    console.log('Delay is disabled in simplified audio system');
  };

  /**
   * Update synth parameters with proper oscillator type handling
   */
  const updateSynthParams = (params: any): void => {
    try {
      if (!process.client || !synth.value) return;

      // Handle envelope parameters
      const envelopeParams: any = {};
      if (params.attack !== undefined) envelopeParams.attack = params.attack;
      if (params.decay !== undefined) envelopeParams.decay = params.decay;
      if (params.sustain !== undefined) envelopeParams.sustain = params.sustain;
      if (params.release !== undefined) envelopeParams.release = params.release;

      if (Object.keys(envelopeParams).length > 0) {
        synth.value.envelope.set(envelopeParams);
      }

      // Handle oscillator type
      if (params.oscillatorType !== undefined) {
        synth.value.oscillator.type = params.oscillatorType;
      }

    } catch (err) {
      console.warn('Failed to update synth parameters:', err);
    }
  };

  /**
   * Dispose of all audio resources
   */
  const dispose = (): void => {
    try {
      if (!process.client) return;

      console.log('Disposing audio resources...');
      safeDispose(masterVolume.value, 'volume');
      safeDispose(synth.value, 'synth');
      
      masterVolume.value = null;
      synth.value = null;
      isInitialized.value = false;
      isContextStarted.value = false;
      
      console.log('Audio resources disposed');
    } catch (err) {
      console.warn('Error disposing audio resources:', err);
    }
  };

  /**
   * Get current audio context state
   */
  const getContextState = (): string => {
    if (!process.client || !Tone) {
      return 'unavailable';
    }
    return Tone.context.state;
  };

  // Cleanup on unmount
  onUnmounted(() => {
    dispose();
  });

  return {
    // State
    isInitialized: readonly(isInitialized),
    isContextStarted: readonly(isContextStarted),
    currentVolume: readonly(currentVolume),
    isInitializing: readonly(isInitializing),

    // Methods
    startAudioContext,
    initializeSynth: initializeAudioSystem, // Renamed for clarity
    initializeAudioSystem,
    triggerNote,
    triggerAttack,
    triggerRelease,
    setVolume,
    setReverbWet,
    setDelayWet,
    updateSynthParams,
    dispose,
    getContextState,
    checkUserInteractionRequired
  };
}