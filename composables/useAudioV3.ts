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
      
      // Resume if suspended
      if (this.context.state === 'suspended') {
        await this.context.resume();
      }
      
      // Wait for context to be running
      let attempts = 0;
      while (this.context.state !== 'running' && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        if (this.context.state === 'suspended') {
          await this.context.resume();
        }
        attempts++;
      }
      
      if (this.context.state !== 'running') {
        throw new Error(`Audio context failed to start. State: ${this.context.state}`);
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

  playNote(frequency: number, duration: number = 0.2): void {
    if (!this.ready || !this.context || !this.masterGain) {
      console.warn('DirectWebAudio not ready for playback');
      return;
    }
    
    // Check context state before playing
    if (this.context.state !== 'running') {
      console.warn('Audio context not running, attempting to resume...');
      this.context.resume().then(() => {
        // Retry playing the note after resuming
        if (this.context?.state === 'running') {
          this.playNoteInternal(frequency, duration);
        }
      }).catch(err => {
        console.warn('Failed to resume audio context:', err);
      });
      return;
    }
    
    this.playNoteInternal(frequency, duration);
  }

  private playNoteInternal(frequency: number, duration: number): void {
    if (!this.context || !this.masterGain) return;
    
    try {
      const oscillator = this.context.createOscillator();
      const envelope = this.context.createGain();
      
      // Simple sine wave
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      
      // Simple envelope
      const now = this.context.currentTime;
      envelope.gain.setValueAtTime(0, now);
      envelope.gain.linearRampToValueAtTime(0.3, now + 0.01);
      envelope.gain.exponentialRampToValueAtTime(0.001, now + duration);
      
      // Connect and play
      oscillator.connect(envelope);
      envelope.connect(this.masterGain);
      
      oscillator.start(now);
      oscillator.stop(now + duration);
      
    } catch (error) {
      console.warn('Failed to play note internally:', error);
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

// Minimal Tone.js Provider - Only basic functionality
class MinimalToneProvider implements SimpleAudioProvider {
  name = 'MinimalTone';
  private synth: any = null;
  private Tone: any = null;
  private ready = false;

  async initialize(): Promise<boolean> {
    try {
      // Load Tone.js with timeout
      const loadPromise = import('tone');
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Tone.js load timeout')), 3000)
      );
      
      this.Tone = await Promise.race([loadPromise, timeoutPromise]);
      
      // Start audio context
      if (this.Tone.context.state !== 'running') {
        await this.Tone.start();
      }
      
      // Wait for context to be running
      let attempts = 0;
      while (this.Tone.context.state !== 'running' && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        if (this.Tone.context.state === 'suspended') {
          await this.Tone.context.resume();
        }
        attempts++;
      }
      
      if (this.Tone.context.state !== 'running') {
        throw new Error(`Tone.js context failed to start. State: ${this.Tone.context.state}`);
      }
      
      // Create minimal synth
      this.synth = new this.Tone.Synth({
        oscillator: { type: 'sine' },
        envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.2 }
      }).toDestination();
      
      this.ready = true;
      console.log('MinimalTone provider initialized successfully');
      return true;
    } catch (error) {
      console.warn('MinimalTone failed:', error);
      this.dispose();
      return false;
    }
  }

  playNote(frequency: number, duration: number = 0.2): void {
    if (!this.ready || !this.synth || !this.Tone) {
      console.warn('MinimalTone not ready for playback');
      return;
    }
    
    // Check context state before playing
    if (this.Tone.context.state !== 'running') {
      console.warn('Tone.js context not running, attempting to resume...');
      this.Tone.context.resume().then(() => {
        // Retry playing the note after resuming
        if (this.Tone.context.state === 'running') {
          this.playNoteInternal(frequency, duration);
        }
      }).catch((err: any) => {
        console.warn('Failed to resume Tone.js context:', err);
      });
      return;
    }
    
    this.playNoteInternal(frequency, duration);
  }

  private playNoteInternal(frequency: number, duration: number): void {
    if (!this.synth) return;
    
    try {
      this.synth.triggerAttackRelease(frequency, duration);
    } catch (error) {
      console.warn('Failed to play note with Tone.js:', error);
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
    return this.ready && this.Tone?.context?.state === 'running';
  }

  dispose(): void {
    try {
      if (this.synth) {
        this.synth.dispose();
        this.synth = null;
      }
    } catch (error) {
      console.warn('Error disposing MinimalTone:', error);
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

  // Available providers in order of preference
  const providers: SimpleAudioProvider[] = [
    new MinimalToneProvider(),
    new DirectWebAudioProvider(),
    new SilentProvider()
  ];

  // State
  const activeProvider = ref<SimpleAudioProvider | null>(null);
  const isInitialized = ref(false);
  const isInitializing = ref(false);
  const currentVolume = ref(AUDIO_CONSTANTS.DEFAULT_MASTER_VOLUME);
  const initializationError = ref<string>('');

  /**
   * Initialize audio system with progressive fallback
   */
  const initializeAudioSystem = async (): Promise<boolean> => {
    if (isInitializing.value) return false;
    if (isInitialized.value && activeProvider.value?.isReady()) return true;

    isInitializing.value = true;
    initializationError.value = '';

    try {
      console.log('Starting simplified audio system...');

      // Try each provider with short timeout
      for (const provider of providers) {
        console.log(`Trying ${provider.name} provider...`);
        
        try {
          const initPromise = provider.initialize();
          const timeoutPromise = new Promise<boolean>((_, reject) => 
            setTimeout(() => reject(new Error('Provider timeout')), 3000)
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
   * Play a note by name or frequency
   */
  const triggerNote = (note: string | number, duration: string = "8n", velocity: number = 0.8): void => {
    if (!activeProvider.value?.isReady()) {
      console.warn('Audio provider not ready for playback');
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
    updateSynthParams: () => {}, // Placeholder
    getContextState: () => activeProvider.value?.isReady() ? 'running' : 'suspended'
  };
}