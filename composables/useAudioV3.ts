import { ref, onUnmounted, readonly } from 'vue';
import { useErrorHandler } from './useErrorHandler';
import { AUDIO_CONSTANTS } from '~/constants';

// Simple audio provider interface
interface SimpleAudioProvider {
  name: string;
  initialize(): Promise<boolean>;
  playNote(frequency: number, duration?: number): void;
  setVolume(volume: number): void;
  dispose(): void;
  isReady(): boolean;
  ensureContextRunning(): Promise<boolean>;
}

// Web Audio API Provider - Direct implementation without Tone.js
class DirectWebAudioProvider implements SimpleAudioProvider {
  name = 'DirectWebAudio';
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ready = false;

  async initialize(): Promise<boolean> {
    try {
      // Create audio context with minimal configuration
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Ensure context is running
      if (!(await this.ensureContextRunning())) {
        throw new Error('Failed to start audio context');
      }

      // Create master gain node
      this.masterGain = this.context.createGain();
      this.masterGain.connect(this.context.destination);
      this.masterGain.gain.value = 0.3; // Safe default volume

      this.ready = true;
      console.log('DirectWebAudio provider initialized successfully');
      return true;
    } catch (error) {
      console.warn('DirectWebAudio failed:', error);
      this.dispose();
      return false;
    }
  }

  async ensureContextRunning(): Promise<boolean> {
    if (!this.context) return false;

    try {
      if (this.context.state === 'suspended') {
        console.log('Resuming suspended DirectWebAudio context...');
        await this.context.resume();
      }

      // Wait for context to be running with timeout
      let attempts = 0;
      while (this.context.state !== 'running' && attempts < 20) {
        await new Promise(resolve => setTimeout(resolve, 50));
        if (this.context.state === 'suspended') {
          await this.context.resume();
        }
        attempts++;
      }

      const isRunning = this.context.state === 'running';
      if (!isRunning) {
        console.warn(`DirectWebAudio context failed to start. Final state: ${this.context.state}`);
      }
      return isRunning;
    } catch (error) {
      console.warn('Failed to ensure DirectWebAudio context running:', error);
      return false;
    }
  }

  playNote(frequency: number, duration: number = 0.2): void {
    if (!this.ready || !this.context || !this.masterGain) {
      console.warn('DirectWebAudio not ready for playback');
      return;
    }

    // Check context state synchronously
    if (this.context.state !== 'running') {
      console.warn('DirectWebAudio context not running');
      return;
    }

    try {
      const oscillator = this.context.createOscillator();
      const envelope = this.context.createGain();

      // Simple sine wave
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;

      // Simple envelope with proper timing
      const now = this.context.currentTime;
      envelope.gain.setValueAtTime(0, now);
      envelope.gain.linearRampToValueAtTime(0.3, now + 0.01);
      envelope.gain.exponentialRampToValueAtTime(0.001, now + duration);

      // Connect and play
      oscillator.connect(envelope);
      envelope.connect(this.masterGain);

      oscillator.start(now);
      oscillator.stop(now + duration);

      console.log(`DirectWebAudio played: ${frequency}Hz for ${duration}s`);
    } catch (error) {
      console.warn('Failed to play note with DirectWebAudio:', error);
    }
  }

  setVolume(volume: number): void {
    if (!this.ready || !this.masterGain || !this.context) return;

    try {
      const clampedVolume = Math.max(0, Math.min(1, volume));
      this.masterGain.gain.setTargetAtTime(clampedVolume * 0.3, this.context.currentTime, 0.1);
    } catch (error) {
      console.warn('Failed to set volume:', error);
    }
  }

  isReady(): boolean {
    return this.ready && this.context?.state === 'running';
  }

  dispose(): void {
    try {
      if (this.masterGain) {
        this.masterGain.disconnect();
        this.masterGain = null;
      }

      if (this.context && this.context.state !== 'closed') {
        this.context.close();
        this.context = null;
      }
    } catch (error) {
      console.warn('Error disposing DirectWebAudio:', error);
    }

    this.ready = false;
  }
}

// Improved Tone.js Provider with proper timing management
class ImprovedToneProvider implements SimpleAudioProvider {
  name = 'ImprovedTone';
  private synth: any = null;
  private reverb: any = null;
  private masterVolume: any = null;
  private Tone: any = null;
  private ready = false;
  private lastPlayTime = 0;
  private minInterval = 50; // Minimum 50ms between notes

  async initialize(): Promise<boolean> {
    try {
      // Load Tone.js with timeout
      const loadPromise = import('tone');
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Tone.js load timeout')), 3000)
      );

      this.Tone = await Promise.race([loadPromise, timeoutPromise]);
      console.log('Tone.js loaded successfully');

      // Ensure context is running
      if (!(await this.ensureContextRunning())) {
        throw new Error('Failed to start Tone.js context');
      }

      // Create effects chain and synth with error handling
      try {
        // Create master volume control
        this.masterVolume = new this.Tone.Volume(-10).toDestination();

        // Create reverb effect
        this.reverb = new this.Tone.Reverb({
          decay: 2.5,
          wet: 0.5
        }).connect(this.masterVolume);

        // Create the synthesizer with default settings
        this.synth = new this.Tone.Synth({
          oscillator: { type: 'sine' },
          envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.2 }
        });

        // Connect synth through effects chain
        this.synth.connect(this.reverb);
        console.log('Tone.js synth and effects chain created and connected');
      } catch (synthError) {
        console.warn('Failed to create Tone.js synth:', synthError);
        throw synthError;
      }

      this.ready = true;
      console.log('ImprovedTone provider initialized successfully');
      return true;
    } catch (error) {
      console.warn('ImprovedTone failed:', error);
      this.dispose();
      return false;
    }
  }

  async ensureContextRunning(): Promise<boolean> {
    if (!this.Tone) return false;

    try {
      console.log(`Current Tone.js context state: ${this.Tone.context.state}`);

      if (this.Tone.context.state === 'suspended') {
        console.log('Resuming suspended Tone.js context...');
        await this.Tone.context.resume();
      }

      if (this.Tone.context.state !== 'running') {
        console.log('Starting Tone.js context...');
        await this.Tone.start();
      }

      // Wait for context to be running with timeout
      let attempts = 0;
      while (this.Tone.context.state !== 'running' && attempts < 20) {
        await new Promise(resolve => setTimeout(resolve, 50));
        if (this.Tone.context.state === 'suspended') {
          await this.Tone.context.resume();
        }
        attempts++;
      }

      const isRunning = this.Tone.context.state === 'running';
      console.log(`Tone.js context final state: ${this.Tone.context.state}, isRunning: ${isRunning}`);

      if (!isRunning) {
        console.warn(`Tone.js context failed to start. Final state: ${this.Tone.context.state}`);
      }
      return isRunning;
    } catch (error) {
      console.warn('Failed to ensure Tone.js context running:', error);
      return false;
    }
  }

  playNote(frequency: number, duration: number = 0.2): void {
    if (!this.ready || !this.synth || !this.Tone) {
      console.warn('ImprovedTone not ready for playback');
      return;
    }

    // Check context state synchronously
    if (this.Tone.context.state !== 'running') {
      console.warn('Tone.js context not running');
      return;
    }

    // Implement timing throttle to prevent overlapping notes
    const now = Date.now();
    if (now - this.lastPlayTime < this.minInterval) {
      console.log('Skipping note due to timing throttle');
      return;
    }
    this.lastPlayTime = now;

    try {
      // Double-check synth is still valid
      if (!this.synth || typeof this.synth.triggerAttackRelease !== 'function') {
        console.warn('Tone.js synth is invalid, skipping note');
        return;
      }

      // Use immediate timing to avoid scheduling conflicts
      this.synth.triggerAttackRelease(frequency, duration);
      console.log(`ImprovedTone played: ${frequency}Hz for ${duration}s`);
    } catch (error) {
      console.warn('Failed to play note with Tone.js:', error);

      // Don't try to recreate synth during playback - just log the error
      // Synth recreation should happen during initialization only
    }
  }

  setVolume(volume: number): void {
    if (!this.ready || !this.synth || !this.Tone) return;

    try {
      const clampedVolume = Math.max(0, Math.min(1, volume));
      this.synth.volume.value = this.Tone.gainToDb(clampedVolume);
    } catch (error) {
      console.warn('Failed to set volume:', error);
    }
  }

  isReady(): boolean {
    return this.ready && this.Tone?.context?.state === 'running' && this.synth !== null;
  }

  updateSynthParams(settings: any): void {
    if (!this.ready || !this.synth || !this.Tone || !this.reverb) {
      console.warn('ImprovedTone not ready for synth parameter updates');
      return;
    }

    try {
      // Update oscillator type
      if (settings.oscillator?.type) {
        this.synth.oscillator.type = settings.oscillator.type;
        console.log(`Updated oscillator type to: ${settings.oscillator.type}`);
      }

      // Update envelope settings
      if (settings.envelope) {
        const envelope = settings.envelope;

        if (typeof envelope.attack === 'number') {
          this.synth.envelope.attack = envelope.attack;
        }

        if (typeof envelope.decay === 'number') {
          this.synth.envelope.decay = envelope.decay;
        }

        if (typeof envelope.sustain === 'number') {
          this.synth.envelope.sustain = envelope.sustain;
        }

        if (typeof envelope.release === 'number') {
          this.synth.envelope.release = envelope.release;
        }

        console.log('Updated envelope settings:', envelope);
      }

      // Update reverb settings if provided
      if (settings.reverb && this.reverb) {
        if (typeof settings.reverb.wet === 'number') {
          this.reverb.wet.value = settings.reverb.wet;
        }

        if (typeof settings.reverb.decay === 'number') {
          // Need to rebuild reverb when decay changes
          const currentWet = this.reverb.wet.value;
          this.reverb.dispose();
          this.reverb = new this.Tone.Reverb({
            decay: settings.reverb.decay,
            wet: currentWet
          }).connect(this.masterVolume);
          this.synth.connect(this.reverb);
        }

        console.log('Updated reverb settings:', settings.reverb);
      }
    } catch (error) {
      console.warn('Failed to update synth parameters:', error);
    }
  }

  dispose(): void {
    try {
      if (this.synth) {
        this.synth.dispose();
        this.synth = null;
      }

      if (this.reverb) {
        this.reverb.dispose();
        this.reverb = null;
      }

      if (this.masterVolume) {
        this.masterVolume.dispose();
        this.masterVolume = null;
      }
    } catch (error) {
      console.warn('Error disposing ImprovedTone:', error);
    }

    this.ready = false;
  }
}

// Silent Provider - Always works as fallback
class SilentProvider implements SimpleAudioProvider {
  name = 'Silent';
  private ready = false;

  async initialize(): Promise<boolean> {
    this.ready = true;
    console.log('Silent provider initialized (no audio output)');
    return true;
  }

  async ensureContextRunning(): Promise<boolean> {
    return this.ready;
  }

  playNote(frequency: number, duration?: number): void {
    // Silent - no audio output
    console.log(`Silent provider: would play ${frequency}Hz for ${duration}s`);
  }

  setVolume(volume: number): void {
    // Silent - no audio output
    console.log(`Silent provider: would set volume to ${volume}`);
  }

  isReady(): boolean {
    return this.ready;
  }

  dispose(): void {
    this.ready = false;
  }
}

// Note to frequency conversion
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

// Main composable
export function useAudioV3() {
  const { handleError } = useErrorHandler();

  // Available providers in order of preference (DirectWebAudio first for reliability)
  const providers: SimpleAudioProvider[] = [
    new DirectWebAudioProvider(),
    new ImprovedToneProvider(),
    new SilentProvider()
  ];

  // State
  const activeProvider = ref<SimpleAudioProvider | null>(null);
  const isInitialized = ref(false);
  const isInitializing = ref(false);
  const currentVolume = ref(AUDIO_CONSTANTS.DEFAULT_MASTER_VOLUME);
  const initializationError = ref<string>('');

  // Flag to track if auto-initialization has been attempted
  const autoInitAttempted = ref(false);

  /**
   * Initialize audio system with progressive fallback
   */
  const initializeAudioSystem = async (): Promise<boolean> => {
    if (isInitializing.value) return false;
    if (isInitialized.value && activeProvider.value?.isReady()) return true;

    isInitializing.value = true;
    initializationError.value = '';

    try {
      console.log('Starting improved audio system V3...');

      // Try each provider with short timeout
      for (const provider of providers) {
        console.log(`Trying ${provider.name} provider...`);

        try {
          const initPromise = provider.initialize();
          const timeoutPromise = new Promise<boolean>((_, reject) => 
            setTimeout(() => reject(new Error('Provider timeout')), 5000)
          );

          const success = await Promise.race([initPromise, timeoutPromise]);

          if (success && provider.isReady()) {
            activeProvider.value = provider;
            isInitialized.value = true;

            // Set initial volume
            provider.setVolume(currentVolume.value);

            console.log(`Successfully initialized ${provider.name} provider`);
            return true;
          }
        } catch (error) {
          console.warn(`${provider.name} provider failed:`, error);
          provider.dispose();
          continue;
        }
      }

      throw new Error('All audio providers failed');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      initializationError.value = errorMessage;
      handleError(error as Error, 'Audio system initialization');
      return false;
    } finally {
      isInitializing.value = false;
    }
  };

  /**
   * Play a note by name or frequency with improved error handling
   */
  const triggerNote = async (note: string | number, duration: string = "8n", velocity: number = 0.8): Promise<void> => {
    // Try to initialize audio system if not already initialized
    if (!isInitialized.value && !isInitializing.value) {
      console.log('Audio not initialized, attempting initialization before playing note...');
      const success = await initializeAudioSystem();
      if (!success) {
        console.warn('Failed to initialize audio system for note playback');
        return;
      }
    }

    if (!activeProvider.value) {
      console.warn('No audio provider available');
      return;
    }

    // Check if provider is ready synchronously
    if (!activeProvider.value.isReady()) {
      console.warn('Audio provider not ready');
      return;
    }

    try {
      const frequency = typeof note === 'string' ? noteToFrequency(note) : note;
      const durationSeconds = duration === "8n" ? 0.2 : duration === "16n" ? 0.1 : 0.2;

      console.log(`Playing note: ${note} (${frequency}Hz) for ${durationSeconds}s`);
      activeProvider.value.playNote(frequency, durationSeconds);
    } catch (error) {
      console.warn('Failed to trigger note:', error);
    }
  };

  /**
   * Set master volume
   */
  const setVolume = (volume: number): void => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    currentVolume.value = clampedVolume;

    if (activeProvider.value?.isReady()) {
      activeProvider.value.setVolume(clampedVolume);
    }
  };

  /**
   * Get provider status
   */
  const getProviderStatus = () => {
    return {
      name: activeProvider.value?.name || 'None',
      status: activeProvider.value?.isReady() ? 'ready' : 'not ready',
      isInitialized: isInitialized.value,
      isInitializing: isInitializing.value,
      error: initializationError.value
    };
  };

  /**
   * Restart audio system
   */
  const restartAudioSystem = async (): Promise<boolean> => {
    console.log('Restarting audio system...');

    if (activeProvider.value) {
      activeProvider.value.dispose();
      activeProvider.value = null;
    }

    isInitialized.value = false;
    initializationError.value = '';

    return await initializeAudioSystem();
  };

  /**
   * Dispose all resources
   */
  const dispose = (): void => {
    if (activeProvider.value) {
      activeProvider.value.dispose();
      activeProvider.value = null;
    }

    isInitialized.value = false;
    isInitializing.value = false;
    initializationError.value = '';
  };

  // Cleanup on unmount
  onUnmounted(() => {
    dispose();
  });

  // Auto-initialize the audio system when the composable is first used
  // This is done asynchronously to avoid blocking the UI
  if (!autoInitAttempted.value && !isInitialized.value && !isInitializing.value) {
    autoInitAttempted.value = true;
    console.log('Auto-initializing audio system...');
    // Use setTimeout to defer initialization until after component setup
    setTimeout(() => {
      initializeAudioSystem().then(success => {
        console.log(`Auto-initialization ${success ? 'succeeded' : 'failed'}`);
      }).catch(err => {
        console.warn('Auto-initialization error:', err);
      });
    }, 100);
  }

  return {
    // State
    isInitialized: readonly(isInitialized),
    isInitializing: readonly(isInitializing),
    currentVolume: readonly(currentVolume),
    initializationError: readonly(initializationError),

    // Methods
    initializeAudioSystem,
    triggerNote,
    setVolume,
    getProviderStatus,
    restartAudioSystem,
    dispose,

    // Legacy compatibility
    isContextStarted: readonly(isInitialized),
    startAudioContext: initializeAudioSystem,
    setReverbWet: () => {}, // Placeholder
    setDelayWet: () => {}, // Placeholder
      updateSynthParams: (settings: any) => {
        // Only ImprovedToneProvider supports synth parameters
        const provider = activeProvider.value;
        if (provider && provider.name === 'ImprovedTone' && (provider as any).updateSynthParams) {
          try {
            (provider as any).updateSynthParams(settings);
          } catch (error) {
            handleError('Failed to update synth parameters', error);
          }
        } else {
          console.log('Current provider does not support synth parameter updates');
        }
      },
    getContextState: () => activeProvider.value?.isReady() ? 'running' : 'suspended'
  };
}
