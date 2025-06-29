import { ref, onMounted, readonly } from 'vue';
import { useAudioV3 } from './useAudioV3';

// Global audio system singleton
let globalAudioInstance: ReturnType<typeof useAudioV3> | null = null;
let initializationPromise: Promise<boolean> | null = null;

/**
 * Global audio system that auto-initializes and provides a singleton instance
 * This ensures all components use the same audio system
 */
export function useGlobalAudio() {
  // Create or reuse the global audio instance
  if (!globalAudioInstance) {
    globalAudioInstance = useAudioV3();
  }

  const isAutoInitializing = ref(false);
  const autoInitError = ref<string>('');

  /**
   * Auto-initialize audio system with user interaction detection
   */
  const autoInitializeAudio = async (): Promise<boolean> => {
    // If already initialized, return success
    if (globalAudioInstance!.isInitialized.value) {
      console.log('Global audio: Already initialized');
      return true;
    }

    // If initialization is already in progress, wait for it
    if (initializationPromise) {
      console.log('Global audio: Initialization already in progress, waiting...');
      return await initializationPromise;
    }

    // Start initialization
    isAutoInitializing.value = true;
    autoInitError.value = '';
    
    console.log('Global audio: Starting auto-initialization...');

    initializationPromise = (async () => {
      try {
        // Try to initialize the audio system
        const success = await globalAudioInstance!.initializeAudioSystem();
        
        if (success) {
          console.log('Global audio: Auto-initialization successful');
          return true;
        } else {
          console.warn('Global audio: Auto-initialization failed, but this is expected until user interaction');
          return false;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        autoInitError.value = errorMessage;
        console.warn('Global audio: Auto-initialization error:', errorMessage);
        return false;
      } finally {
        isAutoInitializing.value = false;
        // Clear the promise so future calls can try again
        initializationPromise = null;
      }
    })();

    return await initializationPromise;
  };

  /**
   * Manual initialization (for user-triggered actions)
   */
  const manualInitializeAudio = async (): Promise<boolean> => {
    console.log('Global audio: Manual initialization requested');
    
    // Clear any previous auto-init promise
    initializationPromise = null;
    
    try {
      const success = await globalAudioInstance!.initializeAudioSystem();
      if (success) {
        console.log('Global audio: Manual initialization successful');
        autoInitError.value = '';
      }
      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      autoInitError.value = errorMessage;
      console.error('Global audio: Manual initialization failed:', errorMessage);
      return false;
    }
  };

  /**
   * Setup auto-initialization on user interaction
   */
  const setupAutoInit = () => {
    if (typeof window === 'undefined') return;

    // List of user interaction events that can start audio
    const userEvents = ['click', 'touchstart', 'keydown'];
    
    const handleUserInteraction = async () => {
      console.log('Global audio: User interaction detected, attempting auto-init...');
      
      const success = await autoInitializeAudio();
      
      if (success) {
        // Remove event listeners once successful
        userEvents.forEach(event => {
          document.removeEventListener(event, handleUserInteraction, { capture: true });
        });
        console.log('Global audio: Auto-init successful, removed event listeners');
      }
    };

    // Add event listeners for user interaction
    userEvents.forEach(event => {
      document.addEventListener(event, handleUserInteraction, { capture: true, once: false });
    });

    console.log('Global audio: Auto-init event listeners added');
  };

  // Setup auto-initialization on mount
  onMounted(() => {
    setupAutoInit();
  });

  return {
    // Expose all audio system methods and state
    ...globalAudioInstance!,
    
    // Auto-initialization state
    isAutoInitializing: readonly(isAutoInitializing),
    autoInitError: readonly(autoInitError),
    
    // Initialization methods
    autoInitializeAudio,
    manualInitializeAudio,
    
    // Convenience method for components that need to ensure audio is ready
    ensureAudioReady: async (): Promise<boolean> => {
      if (globalAudioInstance!.isInitialized.value) {
        return true;
      }
      return await manualInitializeAudio();
    }
  };
}