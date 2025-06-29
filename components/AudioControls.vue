<template>
  <div class="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 shadow-strong p-6 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold text-white flex items-center space-x-3">
        <div class="w-8 h-8 bg-accent-500/20 rounded-lg flex items-center justify-center">
          <SpeakerWaveIcon class="w-5 h-5 text-accent-400" />
        </div>
        <span>Audio System</span>
      </h2>
      <div class="flex items-center space-x-2 text-sm">
        <div 
          class="w-2 h-2 rounded-full transition-colors duration-200"
          :class="getStatusIndicatorClass()"
        ></div>
        <span class="text-secondary-400">
          {{ getStatusText() }}
        </span>
      </div>
    </div>

    <!-- Audio Context Control -->
    <div v-if="!isContextStarted" class="p-4 bg-warning-500/10 border border-warning-500/20 rounded-xl">
      <div class="flex items-center space-x-3 mb-3">
        <ExclamationTriangleIcon class="w-5 h-5 text-warning-400 flex-shrink-0" />
        <div class="text-warning-200 text-sm">
          Audio context needs to be started by user interaction
        </div>
      </div>
      <button
        @click="startAudio"
        :disabled="isStarting"
        class="w-full px-4 py-3 bg-warning-600 hover:bg-warning-700 disabled:bg-warning-800 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-warning-500 focus:ring-offset-2 focus:ring-offset-secondary-900 shadow-medium hover:shadow-strong transform hover:scale-105 disabled:hover:scale-100"
      >
        <span v-if="!isStarting" class="flex items-center justify-center space-x-2">
          <PlayIcon class="w-4 h-4" />
          <span>Start Audio System</span>
        </span>
        <span v-else class="flex items-center justify-center space-x-2">
          <LoadingSpinner size="sm" color="white" />
          <span>{{ initializationStep }}</span>
        </span>
      </button>
    </div>

    <!-- Initialization Error Display -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 transform scale-95 translate-y-2"
      enter-to-class="opacity-100 transform scale-100 translate-y-0"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 transform scale-100 translate-y-0"
      leave-to-class="opacity-0 transform scale-95 translate-y-2"
    >
      <div v-if="initializationError" class="p-4 bg-error-500/10 backdrop-blur-sm border border-error-500/20 rounded-xl">
        <div class="flex items-start space-x-3">
          <ExclamationTriangleIcon class="w-5 h-5 text-error-400 flex-shrink-0 mt-0.5" />
          <div class="flex-1 min-w-0">
            <p class="text-error-200 text-sm leading-relaxed mb-2">{{ initializationError }}</p>
            <div class="text-xs text-error-300 space-y-1">
              <p><strong>Troubleshooting tips:</strong></p>
              <ul class="list-disc list-inside space-y-1 ml-2">
                <li>Try refreshing the page and clicking the button again</li>
                <li>Check if audio is working in other browser tabs</li>
                <li>Ensure your browser allows audio playback</li>
                <li>Try using headphones or different audio output</li>
              </ul>
            </div>
          </div>
          <button 
            @click="clearInitializationError"
            class="text-error-400 hover:text-error-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-error-500 focus:ring-offset-2 focus:ring-offset-secondary-900 rounded-lg p-1"
            aria-label="Clear error"
          >
            <XMarkIcon class="w-4 h-4" />
          </button>
        </div>
      </div>
    </Transition>

    <!-- Test Controls -->
    <div v-if="isInitialized" class="space-y-4">
      <h3 class="text-lg font-medium text-white flex items-center space-x-2">
        <MusicalNoteIcon class="w-5 h-5 text-primary-400" />
        <span>Test Sounds</span>
      </h3>

      <div class="grid grid-cols-2 gap-3">
        <button
          v-for="(note, index) in testNotes"
          :key="note"
          @click="playTestNote(note)"
          class="group px-4 py-3 bg-primary-600/20 hover:bg-primary-600/40 border border-primary-500/30 hover:border-primary-400/50 text-primary-200 hover:text-white rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-secondary-900 shadow-soft hover:shadow-medium transform hover:scale-105"
        >
          <div class="text-sm font-medium">{{ note }}</div>
          <div class="text-xs text-primary-400 group-hover:text-primary-300">
            Node {{ index + 1 }}
          </div>
        </button>
      </div>
    </div>

    <!-- Volume Control -->
    <div v-if="isInitialized" class="space-y-3">
      <label class="block text-sm font-medium text-secondary-200" for="audio-volume">
        Master Volume: <span class="text-accent-400 font-semibold">{{ (currentVolume * 100).toFixed(0) }}%</span>
      </label>
      <input
        id="audio-volume"
        type="range"
        min="0"
        max="1"
        step="0.01"
        :value="currentVolume"
        @input="handleVolumeChange"
        class="w-full h-2 bg-secondary-700 rounded-lg appearance-none cursor-pointer slider-thumb focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 focus:ring-offset-secondary-900 transition-all duration-200"
      />
      <div class="flex justify-between text-xs text-secondary-400">
        <span>0%</span>
        <span>100%</span>
      </div>
    </div>

    <!-- Note: Effects have been disabled to prevent browser freezing -->
    <div v-if="isInitialized" class="space-y-4">
      <div class="p-3 bg-info-500/10 border border-info-500/20 rounded-xl">
        <div class="flex items-center space-x-3">
          <InformationCircleIcon class="w-5 h-5 text-info-400 flex-shrink-0" />
          <div class="text-info-200 text-sm">
            Effects (reverb and delay) have been disabled to improve stability and prevent browser freezing.
          </div>
        </div>
      </div>

      <!-- Minimal Audio System Notice -->
      <div v-if="isUsingMinimalAudio" class="p-3 bg-warning-500/10 border border-warning-500/20 rounded-xl">
        <div class="flex items-center space-x-3">
          <ExclamationTriangleIcon class="w-5 h-5 text-warning-400 flex-shrink-0" />
          <div class="text-warning-200 text-sm">
            <p class="font-medium mb-1">Using Minimal Audio System</p>
            <p>The standard audio system couldn't be initialized, so a simplified fallback is being used. Audio quality may be limited, but the visualizer will still work properly.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Synth Parameters -->
    <div v-if="isInitialized" class="space-y-4">
      <h3 class="text-lg font-medium text-white">Synth Settings</h3>

      <div class="p-3 bg-info-500/10 border border-info-500/20 rounded-xl mb-4">
        <div class="flex items-center space-x-3">
          <InformationCircleIcon class="w-5 h-5 text-info-400 flex-shrink-0" />
          <div class="text-info-200 text-sm">
            Advanced FM synthesis parameters have been disabled to improve stability. Basic envelope controls are still available.
          </div>
        </div>
      </div>

      <!-- Envelope Controls could be added here in the future -->
    </div>

    <!-- Audio Context Info -->
    <div v-if="isInitialized" class="p-3 bg-secondary-800/50 rounded-xl border border-white/10">
      <div class="text-xs text-secondary-400 space-y-1">
        <div>Context State: <span class="text-success-400">{{ contextState }}</span></div>
        <div>Sample Rate: <span class="text-primary-400">{{ sampleRate }} Hz</span></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { 
  SpeakerWaveIcon, 
  MusicalNoteIcon,
  PlayIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  InformationCircleIcon
} from '@heroicons/vue/24/outline';
import { useAudio } from '~/composables/useAudio';
import { AUDIO_CONSTANTS } from '~/constants';

const {
  isInitialized,
  isContextStarted,
  isInitializing,
  currentVolume,
  initializeAudioSystem,
  triggerNote,
  setVolume,
  setReverbWet,
  setDelayWet,
  updateSynthParams,
  getContextState
} = useAudio();

// Define emits
const emit = defineEmits<{
  (e: 'audio-init-failed'): void;
}>();

// Component state
const isStarting = ref(false);
const initializationError = ref<string>('');
const initializationStep = ref('Starting...');
// Note: Effects and advanced synth parameters have been disabled in the simplified audio system
const reverbWet = ref(0.3); // Kept for API compatibility
const delayWet = ref(0.2);  // Kept for API compatibility

// Test notes for demonstration
const testNotes = AUDIO_CONSTANTS.DEFAULT_NOTES.slice(0, 8);

// Computed properties
const contextState = computed(() => getContextState());
const sampleRate = computed(() => {
  if (typeof window !== 'undefined' && window.AudioContext) {
    try {
      const ctx = new AudioContext();
      const rate = ctx.sampleRate;
      ctx.close();
      return rate;
    } catch (err) {
      console.warn('Could not get sample rate:', err);
    }
  }
  return 44100;
});

// Check if using minimal audio system
const isUsingMinimalAudio = computed(() => {
  return typeof window !== 'undefined' && (window as any)._usingMinimalAudioSystem === true;
});

/**
 * Get status indicator class based on current state
 */
const getStatusIndicatorClass = () => {
  if (isInitializing.value) {
    return 'bg-warning-400 animate-pulse';
  } else if (isInitialized.value) {
    // If using minimal audio system, show warning color instead of success
    if (isUsingMinimalAudio.value) {
      return 'bg-warning-400 animate-pulse';
    }
    return 'bg-success-400 animate-pulse';
  } else if (initializationError.value) {
    return 'bg-error-400';
  } else {
    return 'bg-secondary-500';
  }
};

/**
 * Get status text based on current state
 */
const getStatusText = () => {
  if (isInitializing.value) {
    return 'Initializing';
  } else if (isInitialized.value) {
    // If using minimal audio system, show "Limited" status
    if (isUsingMinimalAudio.value) {
      return 'Ready (Limited)';
    }
    return 'Ready';
  } else if (initializationError.value) {
    return 'Error';
  } else {
    return 'Not Started';
  }
};

/**
 * Start audio system with detailed progress tracking and improved error handling
 */
const startAudio = async () => {
  isStarting.value = true;
  initializationError.value = '';

  // Set up UI timeouts to provide feedback and prevent indefinite hanging
  let uiTimeoutIds: number[] = [];
  let hardTimeoutId: number | null = null;

  // Create a promise that will reject after a hard timeout
  const hardTimeoutPromise = new Promise<void>((_, reject) => {
    hardTimeoutId = window.setTimeout(() => {
      reject(new Error('Audio initialization force-terminated after 20 seconds to prevent browser freezing'));
    }, 20000); // 20 second hard timeout
  });

  try {
    // Start with UI updates
    initializationStep.value = 'Starting audio context...';
    await new Promise(resolve => setTimeout(resolve, 100)); // Brief delay for UI update

    // Set progressive UI timeouts to show increasingly detailed messages
    uiTimeoutIds.push(window.setTimeout(() => {
      if (isStarting.value) {
        initializationStep.value = 'Still initializing... (this may take a moment)';
      }
    }, 3000));

    uiTimeoutIds.push(window.setTimeout(() => {
      if (isStarting.value) {
        initializationStep.value = 'Creating audio components... (taking longer than usual)';
      }
    }, 7000));

    uiTimeoutIds.push(window.setTimeout(() => {
      if (isStarting.value) {
        initializationStep.value = 'Waiting for audio system... (browser may be busy)';
      }
    }, 12000));

    uiTimeoutIds.push(window.setTimeout(() => {
      if (isStarting.value) {
        initializationStep.value = 'Almost there... (finalizing audio setup)';
      }
    }, 16000));

    // Start the initialization with a race against the hard timeout
    initializationStep.value = 'Initializing synth...';
    await Promise.race([
      initializeAudioSystem(),
      hardTimeoutPromise
    ]);

    initializationStep.value = 'Complete!';

  } catch (err) {
    const error = err as Error;
    console.error('Audio initialization error:', error);

    // Provide user-friendly error messages
    if (error.message.includes('force-terminated')) {
      // Special case for our hard timeout
      initializationError.value = 'Audio initialization was stopped to prevent browser freezing. Your browser may have compatibility issues with the audio system. Try using a different browser or disabling audio.';
      console.warn('Audio initialization was force-terminated due to taking too long');
    } else if (error.message.includes('InvalidStateError')) {
      initializationError.value = 'Audio system is in an invalid state. This usually happens when the browser\'s audio context is blocked or corrupted.';
    } else if (error.message.includes('NotAllowedError')) {
      initializationError.value = 'Audio access was denied by the browser. Please check your browser settings and allow audio playback.';
    } else if (error.message.includes('context state')) {
      initializationError.value = 'Audio context failed to start properly. Try refreshing the page and trying again.';
    } else if (error.message.includes('Audio chain connection timed out')) {
      initializationError.value = 'Audio connection process timed out. This may be due to browser performance issues. The visualizer will still work, but audio may be unavailable.';
    } else if (error.message.includes('timed out')) {
      initializationError.value = 'Audio initialization timed out. This could be due to browser restrictions or performance issues. Please try refreshing the page.';
    } else if (error.message.includes('Failed to connect')) {
      initializationError.value = 'Failed to connect audio components. Your browser may have restrictions on audio processing. Try using a different browser or refreshing the page.';
    } else if (error.message.includes('Reverb initialization timed out')) {
      initializationError.value = 'Audio effects initialization timed out. The visualizer will still work, but audio may be limited or unavailable.';
    } else {
      initializationError.value = error.message || 'An unknown error occurred during audio initialization.';
    }

    // Even if audio fails, we should still allow the visualizer to work
    // Emit an event that the app can listen to, to enable visualization-only mode
    emit('audio-init-failed');

  } finally {
    // Clear all UI timeouts
    uiTimeoutIds.forEach(id => {
      window.clearTimeout(id);
    });

    // Clear hard timeout if it exists
    if (hardTimeoutId !== null) {
      window.clearTimeout(hardTimeoutId);
    }

    isStarting.value = false;

    // Check if minimal audio system is being used
    if (isUsingMinimalAudio.value) {
      // If minimal audio system is being used, clear any error message
      // since the system is technically working, just in a limited capacity
      initializationError.value = '';

      // Show a success message but indicate limited functionality
      initializationStep.value = 'Ready (Limited)';

      // Log for debugging
      console.log('Using minimal audio system - limited functionality available');
    } else {
      // Only reset the step if we're not showing an error
      if (!initializationError.value) {
        initializationStep.value = 'Starting...';
      }
    }
  }
};

/**
 * Clear initialization error
 */
const clearInitializationError = () => {
  initializationError.value = '';
};

/**
 * Play a test note
 */
const playTestNote = (note: string) => {
  try {
    triggerNote(note, "8n", 0.7);
  } catch (err) {
    console.error('Failed to play test note:', err);
  }
};

/**
 * Handle volume change
 */
const handleVolumeChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  setVolume(parseFloat(target.value));
};

/**
 * Handle reverb change
 */
const handleReverbChange = () => {
  setReverbWet(reverbWet.value);
};

/**
 * Handle delay change
 */
const handleDelayChange = () => {
  setDelayWet(delayWet.value);
};

// Note: handleHarmonicityChange and handleModulationIndexChange methods have been removed
// as they are no longer needed in the simplified audio system
</script>

<style scoped>
/* Custom slider styles */
.slider-thumb::-webkit-slider-thumb {
  appearance: none;
  height: 20px;
  width: 20px;
  border-radius: 50%;
  background: linear-gradient(135deg, #d946ef, #a21caf);
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
}

.slider-thumb::-webkit-slider-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(217, 70, 239, 0.4);
}

.slider-thumb::-moz-range-thumb {
  height: 20px;
  width: 20px;
  border-radius: 50%;
  background: linear-gradient(135deg, #d946ef, #a21caf);
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
}

.slider-thumb::-moz-range-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(217, 70, 239, 0.4);
}
</style>