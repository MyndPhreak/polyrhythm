<template>
  <div class="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 shadow-strong p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-semibold text-white flex items-center space-x-3">
        <div class="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center">
          <PlayIcon v-if="!rhythmStore.isPlaying" class="w-5 h-5 text-primary-400" />
          <PauseIcon v-else class="w-5 h-5 text-primary-400" />
        </div>
        <span>Playback</span>
      </h2>
      <div class="flex items-center space-x-2 text-sm">
        <div 
          class="w-2 h-2 rounded-full transition-colors duration-200"
          :class="rhythmStore.isPlaying ? 'bg-success-400 animate-pulse' : 'bg-secondary-500'"
        ></div>
        <span class="text-secondary-400">
          {{ rhythmStore.isPlaying ? 'Playing' : 'Stopped' }}
        </span>
      </div>
    </div>

    <!-- Main Controls -->
    <div class="flex items-center justify-center space-x-6 mb-8">
      <!-- Play/Pause Button -->
      <button
        @click="togglePlayback"
        :disabled="isLoading"
        :aria-label="rhythmStore.isPlaying ? 'Pause' : 'Play'"
        class="group relative flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 disabled:from-secondary-600 disabled:to-secondary-700 disabled:cursor-not-allowed rounded-full transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-primary-500/30 focus:ring-offset-2 focus:ring-offset-secondary-900 shadow-medium hover:shadow-glow-primary transform hover:scale-105 disabled:hover:scale-100"
      >
        <Transition
          enter-active-class="transition-all duration-200 ease-out"
          enter-from-class="opacity-0 scale-75 rotate-90"
          enter-to-class="opacity-100 scale-100 rotate-0"
          leave-active-class="transition-all duration-150 ease-in"
          leave-from-class="opacity-100 scale-100 rotate-0"
          leave-to-class="opacity-0 scale-75 rotate-90"
          mode="out-in"
        >
          <PlayIcon 
            v-if="!rhythmStore.isPlaying" 
            key="play"
            class="w-8 h-8 text-white ml-1 drop-shadow-sm"
          />
          <PauseIcon 
            v-else 
            key="pause"
            class="w-8 h-8 text-white drop-shadow-sm"
          />
        </Transition>
        
        <!-- Loading overlay -->
        <Transition
          enter-active-class="transition-opacity duration-200"
          enter-from-class="opacity-0"
          enter-to-class="opacity-100"
          leave-active-class="transition-opacity duration-150"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full backdrop-blur-sm">
            <LoadingSpinner size="sm" color="white" />
          </div>
        </Transition>
      </button>

      <!-- Reset Button -->
      <button
        @click="resetPlayback"
        :disabled="isLoading"
        aria-label="Reset"
        class="group flex items-center justify-center w-14 h-14 bg-secondary-600/50 hover:bg-secondary-500/50 disabled:bg-secondary-700/50 disabled:cursor-not-allowed rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-secondary-500/50 focus:ring-offset-2 focus:ring-offset-secondary-900 shadow-soft hover:shadow-medium transform hover:scale-105 disabled:hover:scale-100 backdrop-blur-sm border border-white/10"
      >
        <ArrowPathIcon class="w-6 h-6 text-secondary-200 group-hover:text-white transition-colors duration-200 group-hover:rotate-180 transform transition-transform duration-300" />
      </button>
    </div>

    <!-- Info Display -->
    <div class="grid grid-cols-2 gap-6 mb-6">
      <!-- Tempo Display -->
      <div class="text-center p-4 bg-white/5 rounded-xl border border-white/10">
        <div class="text-sm text-secondary-400 mb-1">Tempo</div>
        <div class="text-2xl font-mono font-semibold text-white">
          {{ (rhythmStore.baseSpeed * 60).toFixed(0) }}
        </div>
        <div class="text-xs text-secondary-500">BPM</div>
      </div>

      <!-- Time Display -->
      <div class="text-center p-4 bg-white/5 rounded-xl border border-white/10">
        <div class="text-sm text-secondary-400 mb-1">Time</div>
        <div class="text-2xl font-mono font-semibold text-white">
          {{ formatTime(rhythmStore.currentTime) }}
        </div>
        <div class="text-xs text-secondary-500">MM:SS</div>
      </div>
    </div>

    <!-- Progress Bar -->
    <div class="space-y-2">
      <div class="flex justify-between text-xs text-secondary-400">
        <span>Progress</span>
        <span>{{ progressPercentage.toFixed(1) }}%</span>
      </div>
      <div class="relative w-full bg-secondary-700/50 rounded-full h-3 overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-r from-secondary-700/30 to-secondary-600/30"></div>
        <div 
          class="relative h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all duration-100 ease-out shadow-glow-primary"
          :style="{ width: progressPercentage + '%' }"
        >
          <div class="absolute inset-0 bg-white/20 rounded-full animate-pulse"></div>
        </div>
      </div>
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
      <div v-if="error?.hasError" class="mt-6 p-4 bg-error-500/10 backdrop-blur-sm border border-error-500/20 rounded-xl">
        <div class="flex items-start space-x-3">
          <ExclamationTriangleIcon class="w-5 h-5 text-error-400 flex-shrink-0 mt-0.5" />
          <div class="flex-1 min-w-0">
            <p class="text-error-200 text-sm leading-relaxed">{{ error.message }}</p>
          </div>
          <button 
            @click="clearError"
            class="text-error-400 hover:text-error-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-error-500 focus:ring-offset-2 focus:ring-offset-secondary-900 rounded-lg p-1"
            aria-label="Clear error"
          >
            <XMarkIcon class="w-4 h-4" />
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { 
  PlayIcon, 
  PauseIcon, 
  ArrowPathIcon,
  ExclamationTriangleIcon,
  XMarkIcon
} from '@heroicons/vue/24/solid';
import { useRhythmStore } from '~/stores/rhythmStore';
import { useErrorHandler } from '~/composables/useErrorHandler';

const rhythmStore = useRhythmStore();
const { error, handleError, clearError } = useErrorHandler();

const isLoading = ref(false);
const startTime = ref(0);
const animationFrameId = ref<number>(0);

/**
 * Calculate progress percentage for progress bar
 */
const progressPercentage = computed(() => {
  const cycleDuration = rhythmStore.getCycleDuration;
  if (cycleDuration === 0) return 0;
  return (rhythmStore.currentTime % cycleDuration) / cycleDuration * 100;
});

/**
 * Toggle playback state with error handling
 */
const togglePlayback = async () => {
  try {
    isLoading.value = true;
    
    if (rhythmStore.isPlaying) {
      stopTimeTracking();
    } else {
      startTimeTracking();
    }
    
    rhythmStore.togglePlayback();
  } catch (err) {
    handleError(err as Error, 'Failed to toggle playback');
  } finally {
    isLoading.value = false;
  }
};

/**
 * Reset playback to initial state
 */
const resetPlayback = () => {
  try {
    stopTimeTracking();
    rhythmStore.reset();
    clearError();
  } catch (err) {
    handleError(err as Error, 'Failed to reset playback');
  }
};

/**
 * Start tracking playback time
 */
const startTimeTracking = () => {
  startTime.value = performance.now();
  updateTime();
};

/**
 * Stop tracking playback time
 */
const stopTimeTracking = () => {
  if (animationFrameId.value) {
    cancelAnimationFrame(animationFrameId.value);
    animationFrameId.value = 0;
  }
};

/**
 * Update current time during playback
 */
const updateTime = () => {
  if (rhythmStore.isPlaying) {
    const currentTime = (performance.now() - startTime.value) / 1000;
    rhythmStore.updateTime(currentTime);
    animationFrameId.value = requestAnimationFrame(updateTime);
  }
};

/**
 * Format time for display (MM:SS)
 */
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Watch for external playback state changes
watch(() => rhythmStore.isPlaying, (isPlaying) => {
  if (isPlaying && animationFrameId.value === 0) {
    startTimeTracking();
  } else if (!isPlaying) {
    stopTimeTracking();
  }
});

onMounted(() => {
  if (rhythmStore.isPlaying) {
    startTimeTracking();
  }
});

onUnmounted(() => {
  stopTimeTracking();
});
</script>