<template>
  <div class="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 shadow-strong p-6 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold text-white flex items-center space-x-3">
        <div class="w-8 h-8 bg-accent-500/20 rounded-lg flex items-center justify-center">
          <SpeakerWaveIcon class="w-5 h-5 text-accent-400" />
        </div>
        <span>Audio System V3</span>
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

    <!-- Provider Status -->
    <div class="p-4 bg-secondary-800/50 rounded-xl border border-white/10">
      <div class="text-sm space-y-2">
        <div class="flex justify-between">
          <span class="text-secondary-400">Active Provider:</span>
          <span class="text-primary-400 font-medium">{{ providerStatus.name }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-secondary-400">Status:</span>
          <span :class="getProviderStatusClass()">{{ providerStatus.status }}</span>
        </div>
      </div>
    </div>

    <!-- Audio Context Control -->
    <div v-if="!isInitialized" class="p-4 bg-info-500/10 border border-info-500/20 rounded-xl">
      <div class="flex items-center space-x-3 mb-3">
        <InformationCircleIcon class="w-5 h-5 text-info-400 flex-shrink-0" />
        <div class="text-info-200 text-sm">
          Click to start the simplified audio system
        </div>
      </div>
      <button
        @click="startAudio"
        :disabled="isInitializing"
        class="w-full px-4 py-3 bg-info-600 hover:bg-info-700 disabled:bg-info-800 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-info-500 focus:ring-offset-2 focus:ring-offset-secondary-900 shadow-medium hover:shadow-strong transform hover:scale-105 disabled:hover:scale-100"
      >
        <span v-if="!isInitializing" class="flex items-center justify-center space-x-2">
          <PlayIcon class="w-4 h-4" />
          <span>Start Audio System</span>
        </span>
        <span v-else class="flex items-center justify-center space-x-2">
          <LoadingSpinner size="sm" color="white" />
          <span>Initializing...</span>
        </span>
      </button>
    </div>

    <!-- Error Display -->
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
            <p class="text-error-200 text-sm leading-relaxed mb-3">{{ initializationError }}</p>
            <div class="flex space-x-2">
              <button 
                @click="restartAudio"
                :disabled="isInitializing"
                class="px-3 py-2 bg-error-600 hover:bg-error-700 disabled:bg-error-800 text-white text-xs rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-error-500"
              >
                <span class="flex items-center space-x-1">
                  <ArrowPathIcon class="w-3 h-3" />
                  <span>Restart</span>
                </span>
              </button>
              <button 
                @click="clearError"
                class="px-3 py-2 bg-secondary-600 hover:bg-secondary-700 text-white text-xs rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-secondary-500"
              >
                Dismiss
              </button>
            </div>
          </div>
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

    <!-- System Info -->
    <div v-if="isInitialized" class="p-3 bg-secondary-800/50 rounded-xl border border-white/10">
      <div class="text-xs text-secondary-400 space-y-1">
        <div>Provider: <span class="text-success-400">{{ providerStatus.name }}</span></div>
        <div>Status: <span class="text-primary-400">{{ providerStatus.status }}</span></div>
        <div class="text-warning-300 text-xs mt-2">
          Simplified audio system - Basic functionality only
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { 
  SpeakerWaveIcon, 
  MusicalNoteIcon,
  PlayIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowPathIcon
} from '@heroicons/vue/24/outline';
import { useAudioV3 } from '~/composables/useAudioV3';
import { AUDIO_CONSTANTS } from '~/constants';

const {
  isInitialized,
  isInitializing,
  currentVolume,
  initializationError,
  initializeAudioSystem,
  triggerNote,
  setVolume,
  getProviderStatus,
  restartAudioSystem
} = useAudioV3();

// Test notes for demonstration
const testNotes = AUDIO_CONSTANTS.DEFAULT_NOTES.slice(0, 8);

// Provider status
const providerStatus = computed(() => getProviderStatus());

/**
 * Get status indicator class based on current state
 */
const getStatusIndicatorClass = () => {
  if (isInitializing.value) {
    return 'bg-warning-400 animate-pulse';
  } else if (isInitialized.value) {
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
    return 'Ready';
  } else if (initializationError.value) {
    return 'Error';
  } else {
    return 'Not Started';
  }
};

/**
 * Get provider status class
 */
const getProviderStatusClass = () => {
  const status = providerStatus.value.status;
  if (status.includes('ready')) return 'text-success-400';
  if (status.includes('not ready')) return 'text-warning-400';
  return 'text-secondary-400';
};

/**
 * Start audio system
 */
const startAudio = async () => {
  try {
    await initializeAudioSystem();
  } catch (err) {
    console.error('Failed to start audio system:', err);
  }
};

/**
 * Restart audio system
 */
const restartAudio = async () => {
  try {
    await restartAudioSystem();
  } catch (err) {
    console.error('Failed to restart audio system:', err);
  }
};

/**
 * Clear error
 */
const clearError = () => {
  // Error clearing is handled internally by the composable
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