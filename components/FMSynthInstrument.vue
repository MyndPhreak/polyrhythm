<template>
  <div class="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 shadow-strong p-6 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold text-white flex items-center space-x-3">
        <div class="w-8 h-8 bg-accent-500/20 rounded-lg flex items-center justify-center">
          <MusicalNoteIcon class="w-5 h-5 text-accent-400" />
        </div>
        <span>FM Synthesizer</span>
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

    <!-- Initialization Button -->
    <div v-if="!isInitialized" class="p-4 bg-info-500/10 border border-info-500/20 rounded-xl">
      <div class="flex items-center space-x-3 mb-3">
        <InformationCircleIcon class="w-5 h-5 text-info-400 flex-shrink-0" />
        <div class="text-info-200 text-sm">
          Click to initialize the FM Synthesizer
        </div>
      </div>
      <button
        @click="initializeSynth"
        :disabled="isInitializing"
        class="w-full px-4 py-3 bg-info-600 hover:bg-info-700 disabled:bg-info-800 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-info-500 focus:ring-offset-2 focus:ring-offset-secondary-900 shadow-medium hover:shadow-strong transform hover:scale-105 disabled:hover:scale-100"
      >
        <span v-if="!isInitializing" class="flex items-center justify-center space-x-2">
          <PlayIcon class="w-4 h-4" />
          <span>Initialize FM Synth</span>
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

    <!-- Synthesizer Controls -->
    <div v-if="isInitialized" class="space-y-6">
      <!-- Envelope Controls -->
      <div class="space-y-4">
        <h3 class="text-lg font-medium text-white flex items-center space-x-2">
          <AdjustmentsHorizontalIcon class="w-5 h-5 text-primary-400" />
          <span>Envelope</span>
        </h3>

        <!-- Attack Time -->
        <div class="space-y-3">
          <label class="block text-sm font-medium text-secondary-200" for="attack-time">
            Attack Time: <span class="text-primary-400 font-semibold">{{ parameters.attack.toFixed(3) }}s</span>
          </label>
          <input
            id="attack-time"
            type="range"
            min="0.01"
            max="2"
            step="0.01"
            v-model.number="parameters.attack"
            @input="updateAttack"
            class="w-full h-2 bg-secondary-700 rounded-lg appearance-none cursor-pointer slider-thumb focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-secondary-900 transition-all duration-200"
          />
          <div class="flex justify-between text-xs text-secondary-400">
            <span>0.01s</span>
            <span>2.00s</span>
          </div>
        </div>

        <!-- Release Time -->
        <div class="space-y-3">
          <label class="block text-sm font-medium text-secondary-200" for="release-time">
            Release Time: <span class="text-primary-400 font-semibold">{{ parameters.release.toFixed(3) }}s</span>
          </label>
          <input
            id="release-time"
            type="range"
            min="0.1"
            max="4"
            step="0.1"
            v-model.number="parameters.release"
            @input="updateRelease"
            class="w-full h-2 bg-secondary-700 rounded-lg appearance-none cursor-pointer slider-thumb focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-secondary-900 transition-all duration-200"
          />
          <div class="flex justify-between text-xs text-secondary-400">
            <span>0.1s</span>
            <span>4.0s</span>
          </div>
        </div>
      </div>

      <!-- Oscillator Controls -->
      <div class="space-y-4">
        <h3 class="text-lg font-medium text-white flex items-center space-x-2">
          <SpeakerWaveIcon class="w-5 h-5 text-accent-400" />
          <span>Oscillator</span>
        </h3>

        <!-- Oscillator Type -->
        <div class="space-y-3">
          <label class="block text-sm font-medium text-secondary-200" for="oscillator-type">
            Waveform Type
          </label>
          <div class="relative">
            <select
              id="oscillator-type"
              v-model="parameters.oscillatorType"
              @change="updateOscillatorType"
              class="w-full bg-secondary-700/50 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all duration-200 appearance-none cursor-pointer hover:bg-secondary-700/70"
            >
              <option value="sine">Sine Wave</option>
              <option value="square">Square Wave</option>
              <option value="triangle">Triangle Wave</option>
              <option value="sawtooth">Sawtooth Wave</option>
            </select>
            <ChevronDownIcon class="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <!-- Effects Controls -->
      <div class="space-y-4">
        <h3 class="text-lg font-medium text-white flex items-center space-x-2">
          <SparklesIcon class="w-5 h-5 text-success-400" />
          <span>Effects</span>
        </h3>

        <!-- Reverb Amount -->
        <div class="space-y-3">
          <label class="block text-sm font-medium text-secondary-200" for="reverb-amount">
            Reverb Amount: <span class="text-success-400 font-semibold">{{ (parameters.reverb * 100).toFixed(0) }}%</span>
          </label>
          <input
            id="reverb-amount"
            type="range"
            min="0"
            max="1"
            step="0.01"
            v-model.number="parameters.reverb"
            @input="updateReverb"
            class="w-full h-2 bg-secondary-700 rounded-lg appearance-none cursor-pointer slider-thumb focus:outline-none focus:ring-2 focus:ring-success-500 focus:ring-offset-2 focus:ring-offset-secondary-900 transition-all duration-200"
          />
          <div class="flex justify-between text-xs text-secondary-400">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      <!-- Test Controls -->
      <div class="space-y-4">
        <h3 class="text-lg font-medium text-white flex items-center space-x-2">
          <PlayIcon class="w-5 h-5 text-warning-400" />
          <span>Test Sounds</span>
        </h3>

        <div class="grid grid-cols-4 gap-3">
          <button
            v-for="note in testNotes"
            :key="note"
            @click="playTestNote(note)"
            class="group px-3 py-2 bg-warning-600/20 hover:bg-warning-600/40 border border-warning-500/30 hover:border-warning-400/50 text-warning-200 hover:text-white rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-warning-500 focus:ring-offset-2 focus:ring-offset-secondary-900 shadow-soft hover:shadow-medium transform hover:scale-105"
          >
            <div class="text-sm font-medium">{{ note }}</div>
          </button>
        </div>
      </div>

      <!-- Preset Controls -->
      <div class="space-y-4">
        <h3 class="text-lg font-medium text-white flex items-center space-x-2">
          <BookmarkIcon class="w-5 h-5 text-info-400" />
          <span>Presets</span>
        </h3>

        <div class="grid grid-cols-3 gap-3">
          <button
            @click="loadPreset('default')"
            class="px-4 py-2 bg-info-600 hover:bg-info-700 text-white rounded-lg transition-colors duration-200 text-sm"
          >
            Default
          </button>
          
          <button
            @click="loadPreset('bright')"
            class="px-4 py-2 bg-info-600 hover:bg-info-700 text-white rounded-lg transition-colors duration-200 text-sm"
          >
            Bright
          </button>
          
          <button
            @click="loadPreset('warm')"
            class="px-4 py-2 bg-info-600 hover:bg-info-700 text-white rounded-lg transition-colors duration-200 text-sm"
          >
            Warm
          </button>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <button
            @click="saveCurrentAsPreset"
            class="px-4 py-2 bg-secondary-600 hover:bg-secondary-700 text-white rounded-lg transition-colors duration-200 text-sm"
          >
            Save Current
          </button>
          
          <button
            @click="resetToDefault"
            class="px-4 py-2 bg-secondary-600 hover:bg-secondary-700 text-white rounded-lg transition-colors duration-200 text-sm"
          >
            Reset
          </button>
        </div>
      </div>

      <!-- Current Settings Display -->
      <div class="p-4 bg-secondary-800/50 rounded-xl border border-white/10">
        <h4 class="text-sm font-medium text-white mb-3">Current Settings</h4>
        <div class="grid grid-cols-2 gap-3 text-xs text-secondary-300">
          <div>Attack: <span class="text-primary-400">{{ parameters.attack.toFixed(3) }}s</span></div>
          <div>Release: <span class="text-primary-400">{{ parameters.release.toFixed(3) }}s</span></div>
          <div>Oscillator: <span class="text-accent-400">{{ parameters.oscillatorType }}</span></div>
          <div>Reverb: <span class="text-success-400">{{ (parameters.reverb * 100).toFixed(0) }}%</span></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { 
  MusicalNoteIcon, 
  PlayIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowPathIcon,
  AdjustmentsHorizontalIcon,
  SpeakerWaveIcon,
  SparklesIcon,
  BookmarkIcon,
  ChevronDownIcon
} from '@heroicons/vue/24/outline';

// Tone.js types and interfaces
interface SynthParameters {
  attack: number;
  release: number;
  reverb: number;
  oscillatorType: 'sine' | 'square' | 'triangle' | 'sawtooth';
}

interface PresetData {
  name: string;
  parameters: SynthParameters;
}

// Component state
const isInitialized = ref(false);
const isInitializing = ref(false);
const error = ref<string>('');

// Tone.js instances
let Tone: any = null;
let fmSynth: any = null;
let reverb: any = null;
let masterVolume: any = null;

// Default parameters
const defaultParameters: SynthParameters = {
  attack: 0.1,
  release: 0.5,
  reverb: 0.3,
  oscillatorType: 'sine'
};

// Reactive parameters
const parameters = reactive<SynthParameters>({ ...defaultParameters });

// Test notes
const testNotes = ['C4', 'E4', 'G4', 'C5'];

// Presets
const presets: { [key: string]: PresetData } = {
  default: {
    name: 'Default',
    parameters: { attack: 0.1, release: 0.5, reverb: 0.3, oscillatorType: 'sine' }
  },
  bright: {
    name: 'Bright',
    parameters: { attack: 0.01, release: 0.2, reverb: 0.1, oscillatorType: 'square' }
  },
  warm: {
    name: 'Warm',
    parameters: { attack: 0.3, release: 1.5, reverb: 0.6, oscillatorType: 'triangle' }
  }
};

/**
 * Initialize the FM Synthesizer
 */
const initializeSynth = async () => {
  if (isInitializing.value) return;
  
  isInitializing.value = true;
  error.value = '';

  try {
    console.log('Initializing FM Synthesizer...');

    // Load Tone.js with timeout
    const loadPromise = import('tone');
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Tone.js load timeout')), 5000)
    );

    Tone = await Promise.race([loadPromise, timeoutPromise]);
    console.log('Tone.js loaded successfully');

    // Start audio context
    if (Tone.context.state !== 'running') {
      await Tone.start();
      console.log('Tone.js context started');
    }

    // Create master volume control
    masterVolume = new Tone.Volume(-6).toDestination();

    // Create reverb effect
    reverb = new Tone.Reverb({
      decay: 2.5,
      wet: parameters.reverb
    }).connect(masterVolume);

    // Wait for reverb to generate its impulse response
    await reverb.generate();

    // Create FM Synthesizer with default parameters
    fmSynth = new Tone.FMSynth({
      harmonicity: 3,
      modulationIndex: 10,
      oscillator: { 
        type: parameters.oscillatorType 
      },
      envelope: { 
        attack: parameters.attack, 
        decay: 0.1, 
        sustain: 0.3, 
        release: parameters.release 
      },
      modulation: { 
        type: 'square' 
      },
      modulationEnvelope: { 
        attack: 0.02, 
        decay: 0.1, 
        sustain: 0.3, 
        release: 0.2 
      }
    });

    // Connect synth through effects chain
    fmSynth.connect(reverb);

    isInitialized.value = true;
    console.log('FM Synthesizer initialized successfully');

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    error.value = `Failed to initialize FM Synthesizer: ${errorMessage}`;
    console.error('FM Synthesizer initialization failed:', err);
    
    // Cleanup on error
    disposeSynth();
  } finally {
    isInitializing.value = false;
  }
};

/**
 * Update attack parameter
 */
const updateAttack = () => {
  if (!fmSynth || !isInitialized.value) return;
  
  try {
    const clampedAttack = Math.max(0.01, Math.min(2, parameters.attack));
    fmSynth.envelope.attack = clampedAttack;
    console.log(`Updated attack to: ${clampedAttack}s`);
  } catch (err) {
    console.warn('Failed to update attack:', err);
  }
};

/**
 * Update release parameter
 */
const updateRelease = () => {
  if (!fmSynth || !isInitialized.value) return;
  
  try {
    const clampedRelease = Math.max(0.1, Math.min(4, parameters.release));
    fmSynth.envelope.release = clampedRelease;
    console.log(`Updated release to: ${clampedRelease}s`);
  } catch (err) {
    console.warn('Failed to update release:', err);
  }
};

/**
 * Update oscillator type
 */
const updateOscillatorType = () => {
  if (!fmSynth || !isInitialized.value) return;
  
  try {
    fmSynth.oscillator.type = parameters.oscillatorType;
    console.log(`Updated oscillator type to: ${parameters.oscillatorType}`);
  } catch (err) {
    console.warn('Failed to update oscillator type:', err);
  }
};

/**
 * Update reverb amount
 */
const updateReverb = () => {
  if (!reverb || !isInitialized.value) return;
  
  try {
    const clampedReverb = Math.max(0, Math.min(1, parameters.reverb));
    reverb.wet.value = clampedReverb;
    console.log(`Updated reverb to: ${clampedReverb}`);
  } catch (err) {
    console.warn('Failed to update reverb:', err);
  }
};

/**
 * Play a test note
 */
const playTestNote = (note: string) => {
  if (!fmSynth || !isInitialized.value) return;
  
  try {
    fmSynth.triggerAttackRelease(note, '8n');
    console.log(`Played test note: ${note}`);
  } catch (err) {
    console.warn('Failed to play test note:', err);
  }
};

/**
 * Load a preset
 */
const loadPreset = (presetName: string) => {
  const preset = presets[presetName];
  if (!preset) {
    console.warn(`Preset not found: ${presetName}`);
    return;
  }

  // Update parameters
  Object.assign(parameters, preset.parameters);

  // Apply to synth if initialized
  if (isInitialized.value) {
    updateAttack();
    updateRelease();
    updateOscillatorType();
    updateReverb();
  }

  console.log(`Loaded preset: ${preset.name}`);
};

/**
 * Save current settings as preset
 */
const saveCurrentAsPreset = () => {
  const presetData = {
    name: 'Custom',
    parameters: { ...parameters }
  };

  // Save to localStorage
  localStorage.setItem('fmSynthCustomPreset', JSON.stringify(presetData));
  console.log('Saved current settings as custom preset');
};

/**
 * Reset to default parameters
 */
const resetToDefault = () => {
  loadPreset('default');
  console.log('Reset to default parameters');
};

/**
 * Clear error message
 */
const clearError = () => {
  error.value = '';
};

/**
 * Dispose of all Tone.js resources
 */
const disposeSynth = () => {
  try {
    if (fmSynth) {
      fmSynth.dispose();
      fmSynth = null;
    }
    
    if (reverb) {
      reverb.dispose();
      reverb = null;
    }
    
    if (masterVolume) {
      masterVolume.dispose();
      masterVolume = null;
    }
  } catch (err) {
    console.warn('Error disposing FM Synthesizer:', err);
  }
  
  isInitialized.value = false;
};

/**
 * Public API for external use
 */
const triggerNote = (note: string | number, duration: string = '8n', velocity: number = 0.8) => {
  if (!fmSynth || !isInitialized.value) {
    console.warn('FM Synthesizer not ready');
    return;
  }
  
  try {
    fmSynth.triggerAttackRelease(note, duration, undefined, velocity);
  } catch (err) {
    console.warn('Failed to trigger note:', err);
  }
};

/**
 * Get current parameters
 */
const getCurrentParameters = (): SynthParameters => {
  return { ...parameters };
};

/**
 * Set parameters programmatically
 */
const setParameters = (newParams: Partial<SynthParameters>) => {
  Object.assign(parameters, newParams);
  
  if (isInitialized.value) {
    updateAttack();
    updateRelease();
    updateOscillatorType();
    updateReverb();
  }
};

// Load custom preset on mount if available
onMounted(() => {
  try {
    const savedPreset = localStorage.getItem('fmSynthCustomPreset');
    if (savedPreset) {
      const presetData = JSON.parse(savedPreset);
      presets.custom = presetData;
    }
  } catch (err) {
    console.warn('Failed to load custom preset:', err);
  }
});

// Cleanup on unmount
onUnmounted(() => {
  disposeSynth();
});

// Expose public API
defineExpose({
  initializeSynth,
  triggerNote,
  getCurrentParameters,
  setParameters,
  loadPreset,
  resetToDefault,
  isInitialized,
  isInitializing
});
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