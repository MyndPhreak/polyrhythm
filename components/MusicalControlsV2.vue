<template>
  <div class="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 shadow-strong p-6 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold text-white flex items-center space-x-3">
        <div class="w-8 h-8 bg-accent-500/20 rounded-lg flex items-center justify-center">
          <MusicalNoteIcon class="w-5 h-5 text-accent-400" />
        </div>
        <span>Musical Controls</span>
      </h2>
      <div class="flex items-center space-x-2">
        <div 
          class="w-2 h-2 rounded-full transition-colors duration-200"
          :class="getAudioStatusClass()"
        ></div>
        <span class="text-xs text-secondary-400">
          {{ getAudioStatusText() }}
        </span>
        <button
          @click="showAdvanced = !showAdvanced"
          class="px-3 py-1 text-xs bg-secondary-600 hover:bg-secondary-500 text-white rounded-lg transition-colors duration-200"
        >
          {{ showAdvanced ? 'Simple' : 'Advanced' }}
        </button>
      </div>
    </div>

    <!-- Audio System Status -->
    <div v-if="!isInitialized" class="p-4 bg-info-500/10 border border-info-500/20 rounded-xl">
      <div class="flex items-center space-x-3 mb-3">
        <InformationCircleIcon class="w-5 h-5 text-info-400 flex-shrink-0" />
        <div class="text-info-200 text-sm">
          <span v-if="isInitializing">Audio system is initializing...</span>
          <span v-else>Audio system will initialize automatically on first interaction, or click to start manually.</span>
        </div>
      </div>
      <button
        v-if="!isInitializing"
        @click="initializeAudioSystem"
        class="px-4 py-2 bg-info-600 hover:bg-info-700 text-white rounded-lg transition-colors duration-200 text-sm"
      >
        Start Audio System
      </button>
      <div v-else class="flex items-center space-x-2 text-info-200 text-sm">
        <LoadingSpinner size="sm" color="white" />
        <span>Initializing audio system...</span>
      </div>
    </div>

    <!-- Error Display -->
    <div v-if="initializationError" class="p-4 bg-error-500/10 border border-error-500/20 rounded-xl">
      <div class="flex items-center space-x-3 mb-3">
        <ExclamationTriangleIcon class="w-5 h-5 text-error-400 flex-shrink-0" />
        <div class="text-error-200 text-sm">
          {{ initializationError }}
        </div>
      </div>
      <button
        @click="initializeAudioSystem"
        class="px-4 py-2 bg-error-600 hover:bg-error-700 text-white rounded-lg transition-colors duration-200 text-sm"
      >
        Retry
      </button>
    </div>

    <!-- Scale Settings -->
    <div class="space-y-4">
      <h3 class="text-lg font-medium text-white">Scale Settings</h3>
      
      <div class="grid grid-cols-2 gap-4">
        <!-- Root Note -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-secondary-200">
            Root Note
          </label>
          <select
            v-model="localSettings.rootNote"
            @change="updateMusicalSettings"
            class="w-full bg-secondary-700/50 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200"
          >
            <option v-for="note in availableNotes" :key="note" :value="note">
              {{ note }}
            </option>
          </select>
        </div>

        <!-- Scale Type -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-secondary-200">
            Scale Type
          </label>
          <select
            v-model="localSettings.scaleType"
            @change="updateMusicalSettings"
            class="w-full bg-secondary-700/50 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200"
          >
            <option v-for="scale in availableScales" :key="scale" :value="scale">
              {{ formatScaleName(scale) }}
            </option>
          </select>
        </div>
      </div>

      <!-- Auto-assign toggle -->
      <div class="flex items-center space-x-3">
        <input
          id="auto-assign"
          type="checkbox"
          v-model="localSettings.autoAssignScale"
          @change="updateMusicalSettings"
          class="w-4 h-4 text-primary-600 bg-secondary-700 border-secondary-600 rounded focus:ring-primary-500 focus:ring-2"
        />
        <label for="auto-assign" class="text-sm text-secondary-200">
          Auto-assign scale to nodes
        </label>
      </div>

      <!-- Scale Preview -->
      <div class="p-3 bg-secondary-800/50 rounded-xl">
        <div class="text-xs text-secondary-400 mb-2">Current Scale Notes:</div>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="note in currentScaleNotes"
            :key="note"
            class="px-2 py-1 bg-primary-600/20 text-primary-300 rounded-lg text-xs font-mono"
          >
            {{ note }}
          </span>
        </div>
      </div>
    </div>

    <!-- Test Tone -->
    <div class="space-y-3">
      <h3 class="text-lg font-medium text-white">Test Tone</h3>
      <button
        @click="playTestTone"
        :disabled="isInitializing"
        class="w-full px-4 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-secondary-600 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-medium hover:shadow-strong transform hover:scale-105 disabled:hover:scale-100"
      >
        <span v-if="!isInitializing" class="flex items-center justify-center space-x-2">
          <MusicalNoteIcon class="w-4 h-4" />
          <span>Play Test Tone ({{ localSettings.rootNote }}4)</span>
        </span>
        <span v-else class="flex items-center justify-center space-x-2">
          <LoadingSpinner size="sm" color="white" />
          <span>Initializing Audio...</span>
        </span>
      </button>
    </div>

    <!-- Global Settings -->
    <div class="space-y-4">
      <h3 class="text-lg font-medium text-white">Global Settings</h3>
      
      <!-- Global Volume -->
      <div class="space-y-2">
        <label class="block text-sm font-medium text-secondary-200">
          Global Volume: <span class="text-accent-400 font-semibold">{{ (localSettings.globalVolume * 100).toFixed(0) }}%</span>
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          v-model="localSettings.globalVolume"
          @input="updateMusicalSettings"
          class="w-full h-2 bg-secondary-700 rounded-lg appearance-none cursor-pointer slider-thumb"
        />
      </div>

      <!-- Note Duration -->
      <div class="space-y-2">
        <label class="block text-sm font-medium text-secondary-200">
          Note Duration: <span class="text-accent-400 font-semibold">{{ localSettings.noteDuration.toFixed(2) }}s</span>
        </label>
        <input
          type="range"
          min="0.05"
          max="2"
          step="0.05"
          v-model="localSettings.noteDuration"
          @input="updateMusicalSettings"
          class="w-full h-2 bg-secondary-700 rounded-lg appearance-none cursor-pointer slider-thumb"
        />
      </div>

      <!-- Octave Range -->
      <div v-if="showAdvanced" class="grid grid-cols-2 gap-4">
        <div class="space-y-2">
          <label class="block text-sm font-medium text-secondary-200">
            Min Octave: {{ localSettings.octaveRange.min }}
          </label>
          <input
            type="range"
            min="1"
            max="7"
            step="1"
            v-model="localSettings.octaveRange.min"
            @input="updateMusicalSettings"
            class="w-full h-2 bg-secondary-700 rounded-lg appearance-none cursor-pointer slider-thumb"
          />
        </div>
        <div class="space-y-2">
          <label class="block text-sm font-medium text-secondary-200">
            Max Octave: {{ localSettings.octaveRange.max }}
          </label>
          <input
            type="range"
            min="2"
            max="8"
            step="1"
            v-model="localSettings.octaveRange.max"
            @input="updateMusicalSettings"
            class="w-full h-2 bg-secondary-700 rounded-lg appearance-none cursor-pointer slider-thumb"
          />
        </div>
      </div>
    </div>

    <!-- Node Configuration -->
    <div v-if="showAdvanced" class="space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-medium text-white">Individual Nodes</h3>
        <button
          @click="testAllNodes"
          :disabled="isInitializing"
          class="px-3 py-1 bg-primary-600 hover:bg-primary-700 disabled:bg-secondary-600 disabled:cursor-not-allowed text-white text-xs rounded-lg transition-colors duration-200"
        >
          Test All
        </button>
      </div>

      <div class="max-h-64 overflow-y-auto space-y-3 pr-2">
        <div
          v-for="(config, index) in nodeConfigs"
          :key="index"
          class="p-3 bg-secondary-800/30 rounded-xl border border-white/5"
        >
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center space-x-2">
              <span class="text-sm font-medium text-white">Node {{ index + 1 }}</span>
              <button
                @click="toggleNode(index)"
                :class="[
                  'w-4 h-4 rounded-full transition-colors duration-200',
                  config.enabled ? 'bg-success-500' : 'bg-secondary-600'
                ]"
              ></button>
            </div>
            <button
              @click="testSingleNode(index)"
              :disabled="isInitializing"
              class="px-2 py-1 bg-primary-600/20 hover:bg-primary-600/40 disabled:bg-secondary-600/20 disabled:cursor-not-allowed text-primary-300 disabled:text-secondary-500 text-xs rounded transition-colors duration-200"
            >
              Test
            </button>
          </div>

          <div class="grid grid-cols-3 gap-2 text-xs">
            <!-- Note Selection -->
            <select
              :value="config.note"
              @change="setNodeNote(index, ($event.target as HTMLSelectElement).value)"
              :disabled="!config.enabled"
              class="bg-secondary-700/50 border border-white/10 rounded px-2 py-1 text-white text-xs disabled:opacity-50"
            >
              <option v-for="note in availableNotes" :key="note" :value="note">
                {{ note }}
              </option>
            </select>

            <!-- Octave Selection -->
            <select
              :value="config.octave"
              @change="setNodeOctave(index, parseInt(($event.target as HTMLSelectElement).value))"
              :disabled="!config.enabled"
              class="bg-secondary-700/50 border border-white/10 rounded px-2 py-1 text-white text-xs disabled:opacity-50"
            >
              <option v-for="octave in [1,2,3,4,5,6,7,8]" :key="octave" :value="octave">
                {{ octave }}
              </option>
            </select>

            <!-- Volume -->
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              :value="config.volume"
              @input="setNodeVolume(index, parseFloat(($event.target as HTMLInputElement).value))"
              :disabled="!config.enabled"
              class="w-full h-1 bg-secondary-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
            />
          </div>

          <div class="mt-2 text-xs text-secondary-400">
            {{ getNodeDisplayNote(index) }} ({{ getNodeFrequency(index).toFixed(1) }}Hz)
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="space-y-3">
      <h3 class="text-lg font-medium text-white">Quick Actions</h3>
      
      <div class="grid grid-cols-2 gap-3">
        <button
          @click="assignScale(localSettings.scaleType, localSettings.rootNote)"
          class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-colors duration-200 text-sm"
        >
          Apply Scale
        </button>
        
        <button
          @click="randomizeNodes"
          class="px-4 py-2 bg-accent-600 hover:bg-accent-700 text-white rounded-xl transition-colors duration-200 text-sm"
        >
          Randomize
        </button>
      </div>
    </div>

    <!-- Configuration Export/Import -->
    <div v-if="showAdvanced" class="space-y-3">
      <h3 class="text-lg font-medium text-white">Configuration</h3>
      
      <div class="grid grid-cols-2 gap-3">
        <button
          @click="exportConfig"
          class="px-4 py-2 bg-secondary-600 hover:bg-secondary-700 text-white rounded-xl transition-colors duration-200 text-sm"
        >
          Export
        </button>
        
        <label class="px-4 py-2 bg-secondary-600 hover:bg-secondary-700 text-white rounded-xl transition-colors duration-200 text-sm cursor-pointer text-center">
          Import
          <input
            type="file"
            accept=".json"
            @change="importConfig"
            class="hidden"
          />
        </label>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue';
import { 
  MusicalNoteIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon 
} from '@heroicons/vue/24/outline';
import { useMusicalAudioV2, type MusicalAudioSettings, type ScaleType } from '~/composables/useMusicalAudioV2';
import { debounce } from '~/utils/debounce';

const {
  settings,
  nodeConfigs,
  availableNotes,
  availableScales,
  currentScaleNotes,
  assignScale,
  setNodeNote,
  setNodeVolume,
  setNodeDuration,
  toggleNode,
  triggerNodeNote,
  updateSettings,
  getNodeDisplayNote,
  getNodeFrequency,
  exportConfiguration,
  importConfiguration,
  noteToFrequency,
  isInitialized,
  isInitializing,
  initializationError,
  initializeAudioSystem
} = useMusicalAudioV2();

// Local state
const showAdvanced = ref(false);
const localSettings = reactive<MusicalAudioSettings>({ ...settings.value });

// Computed properties for status
const getAudioStatusClass = () => {
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

const getAudioStatusText = () => {
  if (isInitializing.value) {
    return 'Initializing';
  } else if (isInitialized.value) {
    return 'Audio Ready';
  } else if (initializationError.value) {
    return 'Audio Error';
  } else {
    return 'Audio Not Started';
  }
};

// Debounced update function
const debouncedUpdate = debounce(() => {
  updateSettings(localSettings);
}, 300);

/**
 * Update musical settings
 */
const updateMusicalSettings = () => {
  debouncedUpdate();
};

/**
 * Set node octave
 */
const setNodeOctave = (nodeIndex: number, octave: number) => {
  const config = nodeConfigs.value[nodeIndex];
  if (config) {
    setNodeNote(nodeIndex, config.note, octave);
  }
};

/**
 * Format scale name for display
 */
const formatScaleName = (scale: ScaleType): string => {
  return scale.charAt(0).toUpperCase() + scale.slice(1);
};

/**
 * Play a test tone using the root note
 */
const playTestTone = async () => {
  console.log('Musical controls V2: Playing test tone');
  
  try {
    // Use the first node but set it to the root note temporarily for testing
    const originalNote = nodeConfigs.value[0]?.note;
    const originalOctave = nodeConfigs.value[0]?.octave;
    
    if (nodeConfigs.value[0]) {
      setNodeNote(0, localSettings.rootNote, 4);
      await triggerNodeNote(0, 0.8);
      
      // Restore original note after a delay
      setTimeout(() => {
        if (originalNote && originalOctave) {
          setNodeNote(0, originalNote, originalOctave);
        }
      }, 100);
    }
  } catch (error) {
    console.error('Musical controls V2: Failed to play test tone:', error);
  }
};

/**
 * Test a single node
 */
const testSingleNode = async (nodeIndex: number) => {
  console.log(`Musical controls V2: Testing single node ${nodeIndex}`);
  await triggerNodeNote(nodeIndex, 0.8);
};

/**
 * Test all enabled nodes
 */
const testAllNodes = async () => {
  console.log('Musical controls V2: Testing all nodes');
  for (let i = 0; i < nodeConfigs.value.length; i++) {
    const config = nodeConfigs.value[i];
    if (config.enabled) {
      setTimeout(() => triggerNodeNote(i), i * 100);
    }
  }
};

/**
 * Randomize node assignments
 */
const randomizeNodes = () => {
  const notes = availableNotes.value;
  const octaves = [3, 4, 5, 6];
  
  nodeConfigs.value.forEach((_, index) => {
    const randomNote = notes[Math.floor(Math.random() * notes.length)];
    const randomOctave = octaves[Math.floor(Math.random() * octaves.length)];
    setNodeNote(index, randomNote, randomOctave);
  });
};

/**
 * Export configuration
 */
const exportConfig = () => {
  const config = exportConfiguration();
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = 'musical-config.json';
  a.click();
  
  URL.revokeObjectURL(url);
};

/**
 * Import configuration
 */
const importConfig = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const config = JSON.parse(e.target?.result as string);
      importConfiguration(config);
      
      // Update local settings
      Object.assign(localSettings, config.settings || {});
    } catch (error) {
      console.error('Failed to import configuration:', error);
    }
  };
  reader.readAsText(file);
};

// Watch for external settings changes
watch(settings, (newSettings) => {
  Object.assign(localSettings, newSettings);
}, { deep: true });

// Debug logging for state changes
watch(isInitialized, (newValue) => {
  console.log(`MusicalControlsV2: isInitialized changed to ${newValue}`);
}, { immediate: true });
</script>

<style scoped>
/* Custom slider styles */
.slider-thumb::-webkit-slider-thumb {
  appearance: none;
  height: 16px;
  width: 16px;
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
  height: 16px;
  width: 16px;
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

/* Custom scrollbar */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}
</style>