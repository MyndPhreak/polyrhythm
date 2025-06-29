import { ref, onUnmounted, readonly } from 'vue';
import { useErrorHandler } from './useErrorHandler';
import { AUDIO_CONSTANTS } from '~/constants';

// Audio Provider Interface
interface AudioProvider {
  name: string;
  priority: number;
  isSupported(): boolean;
  initialize(): Promise<boolean>;
  triggerNote(note: string, duration: string, velocity: number): void;
  setVolume(volume: number): void;
  dispose(): void;
  getStatus(): 'idle' | 'initializing' | 'ready' | 'error';
}

// Tone.js Provider (Primary)
class ToneJSProvider implements AudioProvider {
  name = 'ToneJS';
  priority = 100;
  private synth: any = null;
  private masterVolume: any = null;
  private Tone: any = null;
  private status: 'idle' | 'initializing' | 'ready' | 'error' = 'idle';

  isSupported(): boolean {
    return typeof window !== 'undefined' && 'AudioContext' in window;
  }

  getStatus() {
    return this.status;
  }

  async initialize(): Promise<boolean> {
    if (this.status === 'ready') return true;
    if (this.status === 'initializing') return false;

    this.status = 'initializing';

    try {
      // Step 1: Load Tone.js with timeout
      await this.loadToneJS();
      
      // Step 2: Initialize audio context
      await this.initializeAudioContext();
      
      // Step 3: Create components progressively
      await this.createAudioComponents();
      
      // Step 4: Connect audio chain
      await this.connectAudioChain();
      
      this.status = 'ready';
      return true;
    } catch (error) {
      console.warn('ToneJS provider failed:', error);
      this.status = 'error';
      this.dispose();
      return false;
    }
  }

  private async loadToneJS(): Promise<void> {
    if (this.Tone) return;
    
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Tone.js load timeout')), 5000)
    );

    this.Tone = await Promise.race([
      import('tone'),
      timeoutPromise
    ]);
  }

  private async initializeAudioContext(): Promise<void> {
    if (this.Tone.context.state === 'running') return;

    if (this.Tone.context.state === 'suspended') {
      await this.Tone.context.resume();
    }

    await this.Tone.start();
    
    // Wait for context to stabilize
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (this.Tone.context.state !== 'running') {
      throw new Error('Audio context failed to start');
    }
  }

  private async createAudioComponents(): Promise<void> {
    // Create synth with minimal configuration
    this.synth = new this.Tone.Synth({
      oscillator: { type: "sine" },
      envelope: { attack: 0.1, decay: 0.2, sustain: 0.3, release: 0.4 }
    });

    // Create master volume
    this.masterVolume = new this.Tone.Volume(-6);
    
    // Allow time for component initialization
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  private async connectAudioChain(): Promise<void> {
    if (!this.synth || !this.masterVolume) {
      throw new Error('Audio components not created');
    }

    // Connect with error handling
    try {
      this.synth.connect(this.masterVolume);
      this.masterVolume.toDestination();
    } catch (error) {
      // Fallback: direct connection
      this.synth.toDestination();
    }
    
    // Stabilization delay
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  triggerNote(note: string, duration: string, velocity: number): void {
    if (this.status !== 'ready' || !this.synth) return;
    
    try {
      const clampedVelocity = Math.max(0, Math.min(1, velocity));
      this.synth.triggerAttackRelease(note, duration, undefined, clampedVelocity);
    } catch (error) {
      console.warn('Failed to trigger note:', error);
    }
  }

  setVolume(volume: number): void {
    if (this.status !== 'ready' || !this.masterVolume) return;
    
    try {
      const clampedVolume = Math.max(0, Math.min(1, volume));
      const volumeDb = clampedVolume === 0 ? -Infinity : this.Tone.gainToDb(clampedVolume);
      this.masterVolume.volume.rampTo(volumeDb, 0.1);
    } catch (error) {
      console.warn('Failed to set volume:', error);
    }
  }

  dispose(): void {
    try {
      if (this.masterVolume) {
        this.masterVolume.disconnect();
        this.masterVolume.dispose();
        this.masterVolume = null;
      }
      
      if (this.synth) {
        this.synth.disconnect();
        this.synth.dispose();
        this.synth = null;
      }
    } catch (error) {
      console.warn('Error disposing ToneJS provider:', error);
    }
    
    this.status = 'idle';
  }
}

// Web Audio API Provider (Fallback)
class WebAudioProvider implements AudioProvider {
  name = 'WebAudio';
  priority = 50;
  private context: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private status: 'idle' | 'initializing' | 'ready' | 'error' = 'idle';

  isSupported(): boolean {
    return typeof window !== 'undefined' && 'AudioContext' in window;
  }

  getStatus() {
    return this.status;
  }

  async initialize(): Promise<boolean> {
    if (this.status === 'ready') return true;
    if (this.status === 'initializing') return false;

    this.status = 'initializing';

    try {
      this.context = new AudioContext();
      
      if (this.context.state === 'suspended') {
        await this.context.resume();
      }
      
      this.gainNode = this.context.createGain();
      this.gainNode.connect(this.context.destination);
      this.gainNode.gain.value = 0.5;
      
      this.status = 'ready';
      return true;
    } catch (error) {
      console.warn('WebAudio provider failed:', error);
      this.status = 'error';
      this.dispose();
      return false;
    }
  }

  triggerNote(note: string, duration: string, velocity: number): void {
    if (this.status !== 'ready' || !this.context || !this.gainNode) return;
    
    try {
      const frequency = this.noteToFrequency(note);
      const oscillator = this.context.createOscillator();
      const envelope = this.context.createGain();
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      envelope.gain.setValueAtTime(0, this.context.currentTime);
      envelope.gain.linearRampToValueAtTime(velocity * 0.3, this.context.currentTime + 0.01);
      envelope.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.5);
      
      oscillator.connect(envelope);
      envelope.connect(this.gainNode);
      
      oscillator.start(this.context.currentTime);
      oscillator.stop(this.context.currentTime + 0.5);
    } catch (error) {
      console.warn('Failed to trigger note:', error);
    }
  }

  setVolume(volume: number): void {
    if (this.status !== 'ready' || !this.gainNode) return;
    
    try {
      const clampedVolume = Math.max(0, Math.min(1, volume));
      this.gainNode.gain.rampTo(clampedVolume * 0.5, 0.1);
    } catch (error) {
      console.warn('Failed to set volume:', error);
    }
  }

  private noteToFrequency(note: string): number {
    const noteMap: { [key: string]: number } = {
      'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23,
      'G4': 392.00, 'A4': 440.00, 'B4': 493.88, 'C5': 523.25
    };
    return noteMap[note] || 440;
  }

  dispose(): void {
    try {
      if (this.gainNode) {
        this.gainNode.disconnect();
        this.gainNode = null;
      }
      
      if (this.context && this.context.state !== 'closed') {
        this.context.close();
        this.context = null;
      }
    } catch (error) {
      console.warn('Error disposing WebAudio provider:', error);
    }
    
    this.status = 'idle';
  }
}

// Silent Provider (Always works)
class SilentProvider implements AudioProvider {
  name = 'Silent';
  priority = 1;
  private status: 'idle' | 'initializing' | 'ready' | 'error' = 'idle';

  isSupported(): boolean {
    return true;
  }

  getStatus() {
    return this.status;
  }

  async initialize(): Promise<boolean> {
    this.status = 'ready';
    return true;
  }

  triggerNote(note: string, duration: string, velocity: number): void {
    // Silent implementation - no audio output
  }

  setVolume(volume: number): void {
    // Silent implementation - no audio output
  }

  dispose(): void {
    this.status = 'idle';
  }
}

// Main Audio System
export function useAudioV2() {
  const { handleError } = useErrorHandler();

  // Audio providers in priority order
  const providers: AudioProvider[] = [
    new ToneJSProvider(),
    new WebAudioProvider(),
    new SilentProvider()
  ];

  // State
  const activeProvider = ref<AudioProvider | null>(null);
  const isInitialized = ref(false);
  const isInitializing = ref(false);
  const currentVolume = ref(AUDIO_CONSTANTS.DEFAULT_MASTER_VOLUME);
  const initializationError = ref<string>('');

  /**
   * Initialize audio system with fallback providers
   */
  const initializeAudioSystem = async (): Promise<boolean> => {
    if (isInitializing.value) return false;
    if (isInitialized.value && activeProvider.value) return true;

    isInitializing.value = true;
    initializationError.value = '';

    try {
      // Filter and sort providers by priority
      const availableProviders = providers
        .filter(provider => provider.isSupported())
        .sort((a, b) => b.priority - a.priority);

      console.log('Available audio providers:', availableProviders.map(p => p.name));

      // Try each provider with timeout
      for (const provider of availableProviders) {
        console.log(`Attempting to initialize ${provider.name} provider...`);
        
        try {
          const success = await Promise.race([
            provider.initialize(),
            new Promise<boolean>((_, reject) => 
              setTimeout(() => reject(new Error('Provider timeout')), 3000)
            )
          ]);

          if (success) {
            activeProvider.value = provider;
            isInitialized.value = true;
            console.log(`Successfully initialized ${provider.name} provider`);
            
            // Set initial volume
            provider.setVolume(currentVolume.value);
            
            return true;
          }
        } catch (error) {
          console.warn(`${provider.name} provider failed:`, error);
          provider.dispose();
          continue;
        }
      }

      throw new Error('All audio providers failed to initialize');

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
   * Trigger a note with the active provider
   */
  const triggerNote = (note: string, duration: string = "8n", velocity: number = 0.8): void => {
    if (!activeProvider.value || !isInitialized.value) return;
    activeProvider.value.triggerNote(note, duration, velocity);
  };

  /**
   * Set volume with the active provider
   */
  const setVolume = (volume: number): void => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    currentVolume.value = clampedVolume;
    
    if (activeProvider.value && isInitialized.value) {
      activeProvider.value.setVolume(clampedVolume);
    }
  };

  /**
   * Get current provider status
   */
  const getProviderStatus = () => {
    return {
      name: activeProvider.value?.name || 'None',
      status: activeProvider.value?.getStatus() || 'idle',
      isInitialized: isInitialized.value,
      isInitializing: isInitializing.value,
      error: initializationError.value
    };
  };

  /**
   * Restart audio system (recovery mechanism)
   */
  const restartAudioSystem = async (): Promise<boolean> => {
    console.log('Restarting audio system...');
    
    // Dispose current provider
    if (activeProvider.value) {
      activeProvider.value.dispose();
      activeProvider.value = null;
    }
    
    isInitialized.value = false;
    initializationError.value = '';
    
    // Reinitialize
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
    setReverbWet: () => {}, // Placeholder for compatibility
    setDelayWet: () => {}, // Placeholder for compatibility
    updateSynthParams: () => {}, // Placeholder for compatibility
    getContextState: () => activeProvider.value?.getStatus() || 'unavailable'
  };
}