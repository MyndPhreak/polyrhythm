<template>
  <div class="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 shadow-strong p-6 space-y-8">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-semibold text-white flex items-center space-x-3">
        <div class="w-8 h-8 bg-accent-500/20 rounded-lg flex items-center justify-center">
          <Cog6ToothIcon class="w-5 h-5 text-accent-400" />
        </div>
        <span>Controls</span>
      </h2>
      <div class="flex items-center space-x-2">
        <div class="w-2 h-2 bg-success-400 rounded-full animate-pulse"></div>
        <span class="text-xs text-secondary-400">Active</span>
      </div>
    </div>

    <!-- Rhythm Controls -->
    <div class="space-y-6">
      <div class="border-b border-white/10 pb-6">
        <h3 class="text-lg font-medium text-white mb-4 flex items-center space-x-2">
          <MusicalNoteIcon class="w-5 h-5 text-primary-400" />
          <span>Rhythm Settings</span>
        </h3>

        <!-- Node Count -->
        <div class="space-y-3">
          <label class="block text-sm font-medium text-secondary-200" for="node-count">
            Node Count: <span class="text-primary-400 font-semibold">{{ nodeCount }}</span>
          </label>
          <div class="relative">
            <input
              id="node-count"
              type="range"
              min="2"
              max="16"
              step="1"
              v-model="nodeCount"
              class="w-full h-2 bg-secondary-700 rounded-lg appearance-none cursor-pointer slider-thumb focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-secondary-900 transition-all duration-200"
              :aria-describedby="nodeCountError ? 'node-count-error' : undefined"
            />
            <div class="flex justify-between text-xs text-secondary-400 mt-1">
              <span>2</span>
              <span>16</span>
            </div>
          </div>
          <Transition
            enter-active-class="transition-all duration-200 ease-out"
            enter-from-class="opacity-0 transform scale-95"
            enter-to-class="opacity-100 transform scale-100"
            leave-active-class="transition-all duration-150 ease-in"
            leave-from-class="opacity-100 transform scale-100"
            leave-to-class="opacity-0 transform scale-95"
          >
            <div v-if="nodeCountError" id="node-count-error" class="flex items-center space-x-2 text-error-400 text-xs bg-error-500/10 rounded-lg p-2">
              <ExclamationTriangleIcon class="w-4 h-4 flex-shrink-0" />
              <span>{{ nodeCountError }}</span>
            </div>
          </Transition>
        </div>

        <!-- Base Speed -->
        <div class="space-y-3">
          <label class="block text-sm font-medium text-secondary-200" for="base-speed">
            Base Speed: <span class="text-primary-400 font-semibold">{{ Number(baseSpeed).toFixed(2) }}x</span>
          </label>
          <div class="relative">
            <input
              id="base-speed"
              type="range"
              min="0.1"
              max="2"
              step="0.1"
              v-model="baseSpeed"
              class="w-full h-2 bg-secondary-700 rounded-lg appearance-none cursor-pointer slider-thumb focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-secondary-900 transition-all duration-200"
              :aria-describedby="baseSpeedError ? 'base-speed-error' : undefined"
            />
            <div class="flex justify-between text-xs text-secondary-400 mt-1">
              <span>0.1x</span>
              <span>2.0x</span>
            </div>
          </div>
          <Transition
            enter-active-class="transition-all duration-200 ease-out"
            enter-from-class="opacity-0 transform scale-95"
            enter-to-class="opacity-100 transform scale-100"
            leave-active-class="transition-all duration-150 ease-in"
            leave-from-class="opacity-100 transform scale-100"
            leave-to-class="opacity-0 transform scale-95"
          >
            <div v-if="baseSpeedError" id="base-speed-error" class="flex items-center space-x-2 text-error-400 text-xs bg-error-500/10 rounded-lg p-2">
              <ExclamationTriangleIcon class="w-4 h-4 flex-shrink-0" />
              <span>{{ baseSpeedError }}</span>
            </div>
          </Transition>
        </div>

        <!-- Speed Ratio -->
        <div class="space-y-3">
          <label class="block text-sm font-medium text-secondary-200" for="speed-ratio">
            Speed Ratio: <span class="text-primary-400 font-semibold">{{ Number(speedRatio).toFixed(2) }}</span>
          </label>
          <div class="relative">
            <input
              id="speed-ratio"
              type="range"
              min="0.01"
              max="0.5"
              step="0.01"
              v-model="speedRatio"
              class="w-full h-2 bg-secondary-700 rounded-lg appearance-none cursor-pointer slider-thumb focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-secondary-900 transition-all duration-200"
            />
            <div class="flex justify-between text-xs text-secondary-400 mt-1">
              <span>0.01</span>
              <span>0.50</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Sound Settings -->
      <div class="space-y-6">
        <h3 class="text-lg font-medium text-white flex items-center space-x-2">
          <SpeakerWaveIcon class="w-5 h-5 text-accent-400" />
          <span>Sound Settings</span>
        </h3>

        <!-- Oscillator Type -->
        <div class="space-y-3">
          <label class="block text-sm font-medium text-secondary-200" for="oscillator-type">
            Oscillator Type
          </label>
          <div class="relative">
            <select
              id="oscillator-type"
              v-model="localSynthSettings.oscillator.type"
              class="w-full bg-secondary-700/50 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 appearance-none cursor-pointer hover:bg-secondary-700/70"
            >
              <option value="sine">Sine Wave</option>
              <option value="triangle">Triangle Wave</option>
              <option value="sawtooth">Sawtooth Wave</option>
              <option value="square">Square Wave</option>
            </select>
            <ChevronDownIcon class="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-400 pointer-events-none" />
          </div>
        </div>

        <!-- Attack -->
        <div class="space-y-3">
          <label class="block text-sm font-medium text-secondary-200" for="attack">
            Attack: <span class="text-accent-400 font-semibold">{{ localSynthSettings.envelope.attack.toFixed(2) }}s</span>
          </label>
          <input
            id="attack"
            type="range"
            min="0.01"
            max="1"
            step="0.01"
            v-model.number="localSynthSettings.envelope.attack"
            class="w-full h-2 bg-secondary-700 rounded-lg appearance-none cursor-pointer slider-thumb focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 focus:ring-offset-secondary-900 transition-all duration-200"
          />
          <div class="flex justify-between text-xs text-secondary-400">
            <span>0.01s</span>
            <span>1.00s</span>
          </div>
        </div>

        <!-- Release -->
        <div class="space-y-3">
          <label class="block text-sm font-medium text-secondary-200" for="release">
            Release: <span class="text-accent-400 font-semibold">{{ localSynthSettings.envelope.release.toFixed(2) }}s</span>
          </label>
          <input
            id="release"
            type="range"
            min="0.1"
            max="2"
            step="0.1"
            v-model.number="localSynthSettings.envelope.release"
            class="w-full h-2 bg-secondary-700 rounded-lg appearance-none cursor-pointer slider-thumb focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 focus:ring-offset-secondary-900 transition-all duration-200"
          />
          <div class="flex justify-between text-xs text-secondary-400">
            <span>0.1s</span>
            <span>2.0s</span>
          </div>
        </div>

        <!-- Reverb -->
        <div class="space-y-3">
          <label class="block text-sm font-medium text-secondary-200" for="reverb">
            Reverb: <span class="text-accent-400 font-semibold">{{ Number(localReverbSettings.wet).toFixed(2) }}</span>
          </label>
          <input
            id="reverb"
            type="range"
            min="0"
            max="1"
            step="0.01"
            v-model.number="localReverbSettings.wet"
            class="w-full h-2 bg-secondary-700 rounded-lg appearance-none cursor-pointer slider-thumb focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 focus:ring-offset-secondary-900 transition-all duration-200"
          />
          <div class="flex justify-between text-xs text-secondary-400">
            <span>0.00</span>
            <span>1.00</span>
          </div>
        </div>

        <!-- Master Volume -->
        <div class="space-y-3">
          <label class="block text-sm font-medium text-secondary-200" for="master-volume">
            Master Volume: <span class="text-warning-400 font-semibold">{{ Number(masterVolume).toFixed(2) }}</span>
          </label>
          <input
            id="master-volume"
            type="range"
            min="0"
            max="1"
            step="0.01"
            v-model="masterVolume"
            class="w-full h-2 bg-secondary-700 rounded-lg appearance-none cursor-pointer slider-thumb focus:outline-none focus:ring-2 focus:ring-warning-500 focus:ring-offset-2 focus:ring-offset-secondary-900 transition-all duration-200"
            :aria-describedby="masterVolumeError ? 'master-volume-error' : undefined"
          />
          <div class="flex justify-between text-xs text-secondary-400">
            <span>0.00</span>
            <span>1.00</span>
          </div>
          <Transition
            enter-active-class="transition-all duration-200 ease-out"
            enter-from-class="opacity-0 transform scale-95"
            enter-to-class="opacity-100 transform scale-100"
            leave-active-class="transition-all duration-150 ease-in"
            leave-from-class="opacity-100 transform scale-100"
            leave-to-class="opacity-0 transform scale-95"
          >
            <div v-if="masterVolumeError" id="master-volume-error" class="flex items-center space-x-2 text-error-400 text-xs bg-error-500/10 rounded-lg p-2">
              <ExclamationTriangleIcon class="w-4 h-4 flex-shrink-0" />
              <span>{{ masterVolumeError }}</span>
            </div>
          </Transition>
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
      <div v-if="error?.hasError" class="p-4 bg-error-500/10 backdrop-blur-sm border border-error-500/20 rounded-xl">
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
import { ref, computed, watch, reactive } from 'vue';
import { 
  Cog6ToothIcon, 
  MusicalNoteIcon, 
  SpeakerWaveIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  ChevronDownIcon
} from '@heroicons/vue/24/outline';
import { useRhythmStore } from '~/stores/rhythmStore';
import { useAudioStore } from '~/stores/audioStore';
import { useErrorHandler } from '~/composables/useErrorHandler';
import { useAudioV3 } from '~/composables/useAudioV3';
import { validateNodeCount, validateSpeed, validateVolume } from '~/utils/validation';
import { debounce } from '~/utils/debounce';

const rhythmStore = useRhythmStore();
const audioStore = useAudioStore();
const { error, handleError, clearError } = useErrorHandler();
const { updateSynthParams, setVolume } = useAudioV3();

// Local reactive state for controls
const nodeCount = ref(rhythmStore.nodeCount);
const baseSpeed = ref(rhythmStore.baseSpeed);
const speedRatio = ref(rhythmStore.speedRatio);
const masterVolume = ref(audioStore.masterVolume);

// Local copies of complex objects to avoid direct mutation
const localSynthSettings = reactive({
  oscillator: { ...audioStore.synthSettings.oscillator },
  envelope: { ...audioStore.synthSettings.envelope }
});

const localReverbSettings = reactive({
  ...audioStore.reverbSettings
});

// Validation error states
const nodeCountError = ref<string>('');
const baseSpeedError = ref<string>('');
const masterVolumeError = ref<string>('');

// Debounced update functions to prevent excessive store updates
const debouncedUpdateNodeCount = debounce((value: number) => {
  const validation = validateNodeCount(value);
  nodeCountError.value = validation.error || '';

  try {
    rhythmStore.setNodeCount(validation.value);
  } catch (err) {
    handleError(err as Error, 'Failed to update node count');
  }
}, 300);

const debouncedUpdateBaseSpeed = debounce((value: number) => {
  const validation = validateSpeed(value);
  baseSpeedError.value = validation.error || '';

  try {
    rhythmStore.setBaseSpeed(validation.value);
  } catch (err) {
    handleError(err as Error, 'Failed to update base speed');
  }
}, 300);

const debouncedUpdateSpeedRatio = debounce((value: number) => {
  try {
    rhythmStore.setSpeedRatio(value);
  } catch (err) {
    handleError(err as Error, 'Failed to update speed ratio');
  }
}, 300);

const debouncedUpdateMasterVolume = debounce((value: number) => {
  const validation = validateVolume(value);
  masterVolumeError.value = validation.error || '';

  try {
    audioStore.updateMasterVolume(validation.value);
    setVolume(validation.value);
  } catch (err) {
    handleError(err as Error, 'Failed to update master volume');
  }
}, 300);

const debouncedUpdateSynthSettings = debounce(() => {
  try {
    audioStore.updateSynthSettings(localSynthSettings);
    updateSynthParams({
      oscillator: localSynthSettings.oscillator,
      envelope: localSynthSettings.envelope,
      reverb: localReverbSettings
    });
  } catch (err) {
    handleError(err as Error, 'Failed to update synth settings');
  }
}, 300);

const debouncedUpdateReverbSettings = debounce(() => {
  try {
    audioStore.$patch({ reverbSettings: localReverbSettings });
    updateSynthParams({
      oscillator: localSynthSettings.oscillator,
      envelope: localSynthSettings.envelope,
      reverb: localReverbSettings
    });
  } catch (err) {
    handleError(err as Error, 'Failed to update reverb settings');
  }
}, 300);

// Watch for local changes and update stores
watch(nodeCount, debouncedUpdateNodeCount);
watch(baseSpeed, debouncedUpdateBaseSpeed);
watch(speedRatio, debouncedUpdateSpeedRatio);
watch(masterVolume, debouncedUpdateMasterVolume);

// Watch for complex object changes
watch(localSynthSettings, debouncedUpdateSynthSettings, { deep: true });
watch(localReverbSettings, debouncedUpdateReverbSettings, { deep: true });

// Watch for store changes to update local state (avoid infinite loops)
watch(() => rhythmStore.nodeCount, (newValue) => {
  if (newValue !== nodeCount.value) {
    nodeCount.value = newValue;
  }
});

watch(() => rhythmStore.baseSpeed, (newValue) => {
  if (Math.abs(newValue - baseSpeed.value) > 0.01) {
    baseSpeed.value = newValue;
  }
});

watch(() => rhythmStore.speedRatio, (newValue) => {
  if (Math.abs(newValue - speedRatio.value) > 0.001) {
    speedRatio.value = newValue;
  }
});

watch(() => audioStore.masterVolume, (newValue) => {
  if (Math.abs(newValue - masterVolume.value) > 0.01) {
    masterVolume.value = newValue;
  }
});

// Watch for store changes to update local complex objects
watch(() => audioStore.synthSettings, (newValue) => {
  Object.assign(localSynthSettings.oscillator, newValue.oscillator);
  Object.assign(localSynthSettings.envelope, newValue.envelope);
}, { deep: true });

watch(() => audioStore.reverbSettings, (newValue) => {
  Object.assign(localReverbSettings, newValue);
}, { deep: true });
</script>

<style scoped>
/* Custom slider styles */
.slider-thumb::-webkit-slider-thumb {
  appearance: none;
  height: 20px;
  width: 20px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
}

.slider-thumb::-webkit-slider-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.slider-thumb::-moz-range-thumb {
  height: 20px;
  width: 20px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
}

.slider-thumb::-moz-range-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}
</style>
