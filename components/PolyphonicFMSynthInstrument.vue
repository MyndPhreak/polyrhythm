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
          Click to initialize the Polyphonic FM Synthesizer (required for audio)
        </div>
      </div>
      <button
        @click="initializeSynth"
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
                @click="initializeSynth"
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

    <!-- Test Controls -->
    <div v-if="isInitialized" class="space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-medium text-white flex items-center space-x-2">
          <PlayIcon class="w-5 h-5 text-warning-400" />
          <span>Test Polyphony</span>
        </h3>
        <button
          @click="stopAllVoices"
          class="px-3 py-1 bg-error-600 hover:bg-error-700 text-white text-xs rounded-lg transition-colors duration-200"
        >
          Stop All
        </button>
      </div>

      <!-- Chord Test Buttons -->
      <div class="grid grid-cols-2 gap-3">
        <button
          @click="playChord(['C4', 'E4', 'G4'])"
          class="group px-4 py-3 bg-warning-600/20 hover:bg-warning-600/40 border border-warning-500/30 hover:border-warning-400/50 text-warning-200 hover:text-white rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-warning-500 focus:ring-offset-2 focus:ring-offset-secondary-900 shadow-soft hover:shadow-medium transform hover:scale-105 active:scale-95"
        >
          <div class="text-sm font-medium">C Major</div>
          <div class="text-xs text-warning-400 group-hover:text-warning-300">3 voices</div>
        </button>

        <button
          @click="playChord(['F4', 'A4', 'C5', 'E5'])"
          class="group px-4 py-3 bg-warning-600/20 hover:bg-warning-600/40 border border-warning-500/30 hover:border-warning-400/50 text-warning-200 hover:text-white rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-warning-500 focus:ring-offset-2 focus:ring-offset-secondary-900 shadow-soft hover:shadow-medium transform hover:scale-105 active:scale-95"
        >
          <div class="text-sm font-medium">F Major 7</div>
          <div class="text-xs text-warning-400 group-hover:text-warning-300">4 voices</div>
        </button>

        <button
          @click="playArpeggio()"
          class="group px-4 py-3 bg-warning-600/20 hover:bg-warning-600/40 border border-warning-500/30 hover:border-warning-400/50 text-warning-200 hover:text-white rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-warning-500 focus:ring-offset-2 focus:ring-offset-secondary-900 shadow-soft hover:shadow-medium transform hover:scale-105 active:scale-95"
        >
          <div class="text-sm font-medium">Arpeggio</div>
          <div class="text-xs text-warning-400 group-hover:text-warning-300">Sequential</div>
        </button>

        <button
          @click="playPolyphonicTest()"
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
            @click="playTestNote(note)"
            class="px-3 py-2 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 text-blue-200 hover:text-white rounded-lg transition-all duration-200 text-sm active:scale-95"
          >
            {{ note }}
          </button>
        </div>
      </div>
    </div>

    <!-- Current Settings Display -->
    <div v-if="isInitialized" class="p-4 bg-secondary-800/50 rounded-xl border border-white/10">
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
</template>

<script setup lang="ts">
import { computed } from 'vue';
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

/**
 * Initialize the Polyphonic FM Synthesizer
 */
const initializeSynth = async () => {
  console.log('Initializing polyphonic synth from component...');
  const result = await polyphonicSynth.initialize();
  console.log('Initialization result:', result);
};

/**
 * Play a chord (multiple notes simultaneously)
 */
const playChord = (notes: string[]) => {
  console.log(`Playing chord: ${notes.join(', ')}`);
  if (!isInitialized.value) {
    console.warn('Synth not initialized, cannot play chord');
    return;
  }

  notes.forEach((note, index) => {
    // Slight delay to demonstrate polyphony
    setTimeout(() => {
      console.log(`Triggering chord note: ${note}`);
      polyphonicSynth.triggerNote(note, 2.0, 0.6);
    }, index * 50);
  });
};

/**
 * Play an arpeggio (sequential notes)
 */
const playArpeggio = () => {
  const notes = ['C4', 'E4', 'G4', 'C5', 'G4', 'E4'];
  console.log(`Playing arpeggio: ${notes.join(', ')}`);
  
  if (!isInitialized.value) {
    console.warn('Synth not initialized, cannot play arpeggio');
    return;
  }

  notes.forEach((note, index) => {
    setTimeout(() => {
      console.log(`Triggering arpeggio note: ${note}`);
      polyphonicSynth.triggerNote(note, 0.8, 0.7);
    }, index * 200);
  });
};

/**
 * Play polyphonic test (many simultaneous voices)
 */
const playPolyphonicTest = () => {
  const notes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
  console.log(`Playing polyphonic test: ${notes.join(', ')}`);
  
  if (!isInitialized.value) {
    console.warn('Synth not initialized, cannot play polyphonic test');
    return;
  }

  notes.forEach((note, index) => {
    setTimeout(() => {
      console.log(`Triggering polyphonic test note: ${note}`);
      polyphonicSynth.triggerNote(note, 3.0, 0.5);
    }, index * 100);
  });
};

/**
 * Play a single test note
 */
const playTestNote = (note: string) => {
  console.log(`Playing test note: ${note}`);
  
  if (!isInitialized.value) {
    console.warn('Synth not initialized, cannot play test note');
    return;
  }

  polyphonicSynth.triggerNote(note, 1.0, 0.8);
};

/**
 * Stop all voices
 */
const stopAllVoices = () => {
  console.log('Stopping all voices...');
  polyphonicSynth.stopAllVoices();
};

/**
 * Clear error message
 */
const clearError = () => {
  polyphonicSynth.clearError();
};
</script>