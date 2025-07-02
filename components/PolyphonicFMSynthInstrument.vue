<template>
  <div class="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 shadow-strong p-6 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold text-white flex items-center space-x-3">
        <div class="w-8 h-8 bg-accent-500/20 rounded-lg flex items-center justify-center">
          <MusicalNoteIcon class="w-5 h-5 text-accent-400" />
        </div>
        <span>Polyphonic FM Synthesizer</span>
      </h2>
      <div class="flex items-center space-x-2">
        <div 
          class="w-2 h-2 rounded-full transition-colors duration-200"
          :class="isInitialized ? 'bg-success-400 animate-pulse' : 'bg-error-400'"
        ></div>
        <span class="text-xs text-secondary-400">
          {{ isInitialized ? 'Ready' : 'Not Ready' }}
        </span>
      </div>
    </div>

    <!-- Debug Info -->
    <div class="p-3 bg-black/20 rounded-lg text-xs text-white space-y-1">
      <div>Synth Status: {{ isInitialized ? 'Initialized' : 'Not Initialized' }}</div>
      <div>Initializing: {{ isInitializing ? 'Yes' : 'No' }}</div>
      <div>Error: {{ error || 'None' }}</div>
      <div>Active Voices: {{ voiceStats.activeVoices }} / {{ voiceStats.maxVoices }}</div>
      <button 
        @click="debugPolyphonicSynth" 
        class="px-2 py-1 bg-blue-600 rounded text-white text-xs"
      >
        Debug Synth
      </button>
    </div>

    <!-- Voice Status -->
    <div class="p-4 bg-secondary-800/50 rounded-xl border border-white/10">
      <div class="text-sm space-y-2">
        <div class="flex justify-between">
          <span class="text-secondary-400">Active Voices:</span>
          <span class="text-success-400 font-medium">{{ voiceStats.activeVoices }} / {{ voiceStats.maxVoices }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-secondary-400">Available:</span>
          <span class="text-primary-400 font-medium">{{ voiceStats.availableVoices }}</span>
        </div>
        <!-- Voice activity bar -->
        <div class="w-full bg-secondary-700 rounded-full h-2 mt-2">
          <div 
            class="bg-gradient-to-r from-success-500 to-warning-500 h-2 rounded-full transition-all duration-300"
            :style="{ width: (voiceStats.activeVoices / voiceStats.maxVoices * 100) + '%' }"
          ></div>
        </div>
      </div>
    </div>

    <!-- Initialization Button -->
    <div v-if="!isInitialized" class="p-4 bg-info-500/10 border border-info-500/20 rounded-xl">
      <div class="flex items-center space-x-3 mb-3">
        <InformationCircleIcon class="w-5 h-5 text-info-400 flex-shrink-0" />
        <div class="text-info-200 text-sm">
          Click to initialize the Polyphonic FM Synthesizer
        </div>
      </div>
      <button
        @click="initializeSynthWithDebug"
        :disabled="isInitializing"
        class="w-full px-4 py-3 bg-info-600 hover:bg-info-700 disabled:bg-info-800 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-info-500 focus:ring-offset-2 focus:ring-offset-secondary-900 shadow-medium hover:shadow-strong transform hover:scale-105 disabled:hover:scale-100"
      >
        <span v-if="!isInitializing" class="flex items-center justify-center space-x-2">
          <PlayIcon class="w-4 h-4" />
          <span>Initialize Polyphonic Synth</span>
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
      <div v-if="error" class="p-4 bg-error-500/10 backdrop-blur-sm border border-error-500/20 rounded-xl">
        <div class="flex items-start space-x-3">
          <ExclamationTriangleIcon class="w-5 h-5 text-error-400 flex-shrink-0 mt-0.5" />
          <div class="flex-1 min-w-0">
            <p class="text-error-200 text-sm leading-relaxed mb-3">{{ error }}</p>
            <div class="flex space-x-2">
              <button 
                @click="initializeSynthWithDebug"
                :disabled="isInitializing"
                class="px-3 py-2 bg-error-600 hover:bg-error-700 disabled:bg-error-800 text-white text-xs rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-error-500"
              >
                <span class="flex items-center space-x-1">
                  <ArrowPathIcon class="w-3 h-3" />
                  <span>Retry</span>
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

    <!-- Synthesizer Controls -->
    <div v-if="isInitialized" class="space-y-6">
      <!-- Test Controls with Debug -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-medium text-white flex items-center space-x-2">
            <PlayIcon class="w-5 h-5 text-warning-400" />
            <span>Test Polyphony</span>
          </h3>
          <button
            @click="stopAllVoicesWithDebug"
            class="px-3 py-1 bg-error-600 hover:bg-error-700 text-white text-xs rounded-lg transition-colors duration-200"
          >
            Stop All
          </button>
        </div>

        <!-- Chord Test Buttons with Debug -->
        <div class="grid grid-cols-2 gap-3">
          <button
            @click="playChordWithDebug(['C4', 'E4', 'G4'])"
            @mousedown="handleButtonPress('C Major')"
            @mouseup="handleButtonRelease('C Major')"
            class="group px-4 py-3 bg-warning-600/20 hover:bg-warning-600/40 border border-warning-500/30 hover:border-warning-400/50 text-warning-200 hover:text-white rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-warning-500 focus:ring-offset-2 focus:ring-offset-secondary-900 shadow-soft hover:shadow-medium transform hover:scale-105 active:scale-95"
          >
            <div class="text-sm font-medium">C Major</div>
            <div class="text-xs text-warning-400 group-hover:text-warning-300">3 voices</div>
          </button>

          <button
            @click="playChordWithDebug(['F4', 'A4', 'C5', 'E5'])"
            @mousedown="handleButtonPress('F Major 7')"
            @mouseup="handleButtonRelease('F Major 7')"
            class="group px-4 py-3 bg-warning-600/20 hover:bg-warning-600/40 border border-warning-500/30 hover:border-warning-400/50 text-warning-200 hover:text-white rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-warning-500 focus:ring-offset-2 focus:ring-offset-secondary-900 shadow-soft hover:shadow-medium transform hover:scale-105 active:scale-95"
          >
            <div class="text-sm font-medium">F Major 7</div>
            <div class="text-xs text-warning-400 group-hover:text-warning-300">4 voices</div>
          </button>

          <button
            @click="playArpeggioWithDebug()"
            @mousedown="handleButtonPress('Arpeggio')"
            @mouseup="handleButtonRelease('Arpeggio')"
            class="group px-4 py-3 bg-warning-600/20 hover:bg-warning-600/40 border border-warning-500/30 hover:border-warning-400/50 text-warning-200 hover:text-white rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-warning-500 focus:ring-offset-2 focus:ring-offset-secondary-900 shadow-soft hover:shadow-medium transform hover:scale-105 active:scale-95"
          >
            <div class="text-sm font-medium">Arpeggio</div>
            <div class="text-xs text-warning-400 group-hover:text-warning-300">Sequential</div>
          </button>

          <button
            @click="playPolyphonicTestWithDebug()"
            @mousedown="handleButtonPress('Poly Test')"
            @mouseup="handleButtonRelease('Poly Test')"
            class="group px-4 py-3 bg-warning-600/20 hover:bg-warning-600/40 border border-warning-500/30 hover:border-warning-400/50 text-warning-200 hover:text-white rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-warning-500 focus:ring-offset-2 focus:ring-offset-secondary-900 shadow-soft hover:shadow-medium transform hover:scale-105 active:scale-95"
          >
            <div class="text-sm font-medium">Poly Test</div>
            <div class="text-xs text-warning-400 group-hover:text-warning-300">8 voices</div>
          </button>
        </div>

        <!-- Single Note Test -->
        <div class="mt-4">
          <h4 class="text-sm font-medium text-white mb-2">Single Note Test</h4>
          <div class="grid grid-cols-4 gap-2">
            <button
              v-for="note in ['C4', 'E4', 'G4', 'C5']"
              :key="note"
              @click="playTestNoteWithDebug(note)"
              @mousedown="handleButtonPress(note)"
              @mouseup="handleButtonRelease(note)"
              class="px-3 py-2 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 text-blue-200 hover:text-white rounded-lg transition-all duration-200 text-sm active:scale-95"
            >
              {{ note }}
            </button>
          </div>
        </div>
      </div>

      <!-- Rest of the controls... -->
      <div class="p-4 bg-secondary-800/50 rounded-xl border border-white/10">
        <h4 class="text-sm font-medium text-white mb-3">Current Settings</h4>
        <div class="grid grid-cols-2 gap-3 text-xs text-secondary-300">
          <div>Attack: <span class="text-primary-400">{{ parameters.attack.toFixed(3) }}s</span></div>
          <div>Release: <span class="text-primary-400">{{ parameters.release.toFixed(3) }}s</span></div>
          <div>Harmonicity: <span class="text-accent-400">{{ parameters.harmonicity.toFixed(2) }}</span></div>
          <div>Mod Index: <span class="text-accent-400">{{ parameters.modulationIndex.toFixed(1) }}</span></div>
          <div>Oscillator: <span class="text-accent-400">{{ parameters.oscillatorType }}</span></div>
          <div>Reverb: <span class="text-success-400">{{ (parameters.reverbAmount * 100).toFixed(0) }}%</span></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { 
  MusicalNoteIcon, 
  PlayIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowPathIcon
} from '@heroicons/vue/24/outline';
import { usePolyphonicFMSynth } from '~/composables/usePolyphonicFMSynth';

// Use the polyphonic FM synth instance
const polyphonicSynth = usePolyphonicFMSynth();

// Computed properties from polyphonic synth
const isInitialized = computed(() => polyphonicSynth.isInitialized.value);
const isInitializing = computed(() => polyphonicSynth.isInitializing.value);
const error = computed(() => polyphonicSynth.error.value);
const parameters = computed(() => polyphonicSynth.parameters);
const activeVoiceCount = computed(() => polyphonicSynth.activeVoiceCount.value);

// Voice statistics
const voiceStats = computed(() => polyphonicSynth.getVoiceStats());

// Debug state
const lastButtonPress = ref<string>('');
const buttonPressCount = ref(0);

/**
 * Debug function for polyphonic synth
 */
const debugPolyphonicSynth = () => {
  console.log('=== Polyphonic Synth Debug ===');
  console.log('Initialized:', isInitialized.value);
  console.log('Initializing:', isInitializing.value);
  console.log('Error:', error.value);
  console.log('Parameters:', parameters.value);
  console.log('Voice Stats:', voiceStats.value);
  console.log('Active Voice Count:', activeVoiceCount.value);
  console.log('Button Press Count:', buttonPressCount.value);
  console.log('Last Button Press:', lastButtonPress.value);
  
  // Test if the synth object exists
  console.log('Polyphonic Synth Object:', polyphonicSynth);
  console.log('Trigger Note Function:', typeof polyphonicSynth.triggerNote);
};

/**
 * Initialize with debug logging
 */
const initializeSynthWithDebug = async () => {
  console.log('Initializing polyphonic synth with debug...');
  try {
    const result = await polyphonicSynth.initialize();
    console.log('Initialization result:', result);
    if (result) {
      console.log('Polyphonic synth initialized successfully!');
    } else {
      console.error('Polyphonic synth initialization failed!');
    }
  } catch (err) {
    console.error('Error during initialization:', err);
  }
};

/**
 * Handle button press for debugging
 */
const handleButtonPress = (buttonName: string) => {
  console.log(`Button pressed: ${buttonName}`);
  lastButtonPress.value = buttonName;
  buttonPressCount.value++;
};

/**
 * Handle button release for debugging
 */
const handleButtonRelease = (buttonName: string) => {
  console.log(`Button released: ${buttonName}`);
};

/**
 * Play a chord with debug logging
 */
const playChordWithDebug = (notes: string[]) => {
  console.log(`Playing chord with debug: ${notes.join(', ')}`);
  console.log('Synth ready:', isInitialized.value);
  
  if (!isInitialized.value) {
    console.error('Synth not initialized, cannot play chord');
    return;
  }

  try {
    notes.forEach((note, index) => {
      console.log(`Triggering note ${note} with delay ${index * 50}ms`);
      setTimeout(() => {
        polyphonicSynth.triggerNote(note, 2.0, 0.6);
        console.log(`Note ${note} triggered successfully`);
      }, index * 50);
    });
  } catch (err) {
    console.error('Error playing chord:', err);
  }
};

/**
 * Play an arpeggio with debug logging
 */
const playArpeggioWithDebug = () => {
  const notes = ['C4', 'E4', 'G4', 'C5', 'G4', 'E4'];
  console.log(`Playing arpeggio with debug: ${notes.join(', ')}`);
  
  if (!isInitialized.value) {
    console.error('Synth not initialized, cannot play arpeggio');
    return;
  }

  try {
    notes.forEach((note, index) => {
      setTimeout(() => {
        console.log(`Arpeggio note ${note} at ${index * 200}ms`);
        polyphonicSynth.triggerNote(note, 0.8, 0.7);
      }, index * 200);
    });
  } catch (err) {
    console.error('Error playing arpeggio:', err);
  }
};

/**
 * Play polyphonic test with debug logging
 */
const playPolyphonicTestWithDebug = () => {
  const notes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
  console.log(`Playing polyphonic test with debug: ${notes.join(', ')}`);
  
  if (!isInitialized.value) {
    console.error('Synth not initialized, cannot play polyphonic test');
    return;
  }

  try {
    notes.forEach((note, index) => {
      setTimeout(() => {
        console.log(`Polyphonic test note ${note} at ${index * 100}ms`);
        polyphonicSynth.triggerNote(note, 3.0, 0.5);
      }, index * 100);
    });
  } catch (err) {
    console.error('Error playing polyphonic test:', err);
  }
};

/**
 * Play test note with debug logging
 */
const playTestNoteWithDebug = (note: string) => {
  console.log(`Playing test note with debug: ${note}`);
  
  if (!isInitialized.value) {
    console.error('Synth not initialized, cannot play test note');
    return;
  }

  try {
    polyphonicSynth.triggerNote(note, 1.0, 0.8);
    console.log(`Test note ${note} triggered successfully`);
  } catch (err) {
    console.error('Error playing test note:', err);
  }
};

/**
 * Stop all voices with debug logging
 */
const stopAllVoicesWithDebug = () => {
  console.log('Stopping all voices with debug...');
  try {
    polyphonicSynth.stopAllVoices();
    console.log('All voices stopped successfully');
  } catch (err) {
    console.error('Error stopping voices:', err);
  }
};

/**
 * Clear error message
 */
const clearError = () => {
  polyphonicSynth.clearError();
};

// Make debug function available globally
if (typeof window !== 'undefined') {
  (window as any).debugPolyphonicSynth = debugPolyphonicSynth;
}
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