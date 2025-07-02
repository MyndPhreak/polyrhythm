<template>
  <div class="min-h-screen bg-gradient-to-br from-secondary-900 via-secondary-800 to-secondary-900">
    <!-- Background Pattern -->
    <div class="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.02%22%3E%3Ccircle cx=%2230%22 cy=%2230%22 r=%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50"></div>
    
    <!-- Error Boundary -->
    <Transition
      enter-active-class="transition-all duration-500 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition-all duration-300 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div v-if="globalError" class="min-h-screen flex items-center justify-center relative z-10">
        <div class="text-center p-8 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 shadow-strong max-w-md mx-4">
          <div class="w-16 h-16 mx-auto mb-6 bg-error-500/20 rounded-full flex items-center justify-center">
            <ExclamationTriangleIcon class="w-8 h-8 text-error-400" />
          </div>
          <h1 class="text-2xl font-bold mb-3 text-white">Application Error</h1>
          <p class="text-secondary-300 mb-6 leading-relaxed">{{ globalError }}</p>
          <button 
            @click="retryInitialization"
            class="group relative px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-secondary-900 shadow-medium hover:shadow-glow-primary transform hover:scale-105"
          >
            <span class="flex items-center space-x-2">
              <ArrowPathIcon class="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
              <span>Retry</span>
            </span>
          </button>
        </div>
      </div>
    </Transition>

    <!-- Main Application -->
    <Transition
      enter-active-class="transition-all duration-700 ease-out"
      enter-from-class="opacity-0 translate-y-8"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-300 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-8"
    >
      <div v-if="!globalError" class="relative z-10">
        <!-- Header -->
        <header class="pt-8 pb-12">
          <div class="container mx-auto px-4 text-center">
            <div class="animate-fade-in">
              <h1 class="text-5xl md:text-6xl font-bold bg-gradient-to-r from-white via-primary-200 to-accent-300 bg-clip-text text-transparent mb-4">
                Musical Polyrhythm Generator
              </h1>
              <p class="text-xl text-secondary-300 max-w-2xl mx-auto leading-relaxed">
                Create complex polyrhythmic patterns with musical scales, individual note assignment, and interactive audio visualization
              </p>
            </div>
          </div>
        </header>

        <!-- Main Content -->
        <main class="container mx-auto px-4 pb-8">
          <div class="grid grid-cols-1 xl:grid-cols-12 gap-8">
            <!-- Visualizer Section -->
            <section class="xl:col-span-8 space-y-6" aria-label="Musical rhythm visualization">
              <div class="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 shadow-strong p-6 animate-fade-in">
                <div class="flex items-center justify-between mb-6">
                  <h2 class="text-2xl font-semibold text-white flex items-center space-x-3">
                    <div class="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center">
                      <ChartBarIcon class="w-5 h-5 text-primary-400" />
                    </div>
                    <span>Musical Visualization</span>
                  </h2>
                  <div class="flex items-center space-x-2 text-sm text-secondary-400">
                    <div class="w-2 h-2 bg-success-400 rounded-full animate-pulse"></div>
                    <span>Live</span>
                  </div>
                </div>
                
                <ClientOnly>
                  <template #fallback>
                    <div class="h-[600px] bg-secondary-800/50 rounded-xl flex items-center justify-center">
                      <LoadingSpinner size="lg" />
                    </div>
                  </template>
                  <RhythmVisualizerMusical @node-hit="handleNodeHit" />
                </ClientOnly>
              </div>

              <!-- Playback Controls -->
              <div class="animate-fade-in" style="animation-delay: 0.2s">
                <ClientOnly>
                  <template #fallback>
                    <div class="h-32 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 animate-pulse"></div>
                  </template>
                  <PlaybackControls />
                </ClientOnly>
              </div>
            </section>

            <!-- Controls Panel -->
            <aside class="xl:col-span-4 space-y-6" aria-label="Control panel">
              <!-- FM Synthesizer Instrument -->
              <div class="animate-fade-in" style="animation-delay: 0.3s">
                <ClientOnly>
                  <template #fallback>
                    <div class="h-96 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 animate-pulse"></div>
                  </template>
                  <FMSynthInstrument />
                </ClientOnly>
              </div>

              <!-- Audio Controls V3 -->
              <div class="animate-fade-in" style="animation-delay: 0.4s">
                <ClientOnly>
                  <template #fallback>
                    <div class="h-96 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 animate-pulse"></div>
                  </template>
                  <AudioControlsV3 />
                </ClientOnly>
              </div>

              <!-- Musical Controls -->
              <div class="animate-fade-in" style="animation-delay: 0.5s">
                <ClientOnly>
                  <template #fallback>
                    <div class="h-96 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 animate-pulse"></div>
                  </template>
                  <MusicalControls />
                </ClientOnly>
              </div>

              <!-- Rhythm Controls -->
              <div class="sticky top-8 animate-fade-in" style="animation-delay: 0.6s">
                <ClientOnly>
                  <template #fallback>
                    <div class="h-96 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 animate-pulse"></div>
                  </template>
                  <ControlsPanel />
                </ClientOnly>
              </div>
            </aside>
          </div>
        </main>

        <!-- Footer -->
        <footer class="mt-16 pb-8">
          <div class="container mx-auto px-4 text-center">
            <div class="border-t border-white/10 pt-8">
              <p class="text-secondary-400 text-sm">
                Built with Vue 3, Nuxt 3, Musical Scales, and Advanced FM Synthesis
              </p>
            </div>
          </div>
        </footer>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onErrorCaptured } from 'vue';
import { 
  ExclamationTriangleIcon, 
  ArrowPathIcon, 
  ChartBarIcon 
} from '@heroicons/vue/24/outline';
import { useRhythmStore } from '~/stores/rhythmStore';
import { useErrorHandler } from '~/composables/useErrorHandler';
import { setupGlobalFMSynthAutoInit } from '~/composables/useGlobalFMSynth';
import type { NodeHitEvent } from '~/types';

// Set page metadata
useHead({
  title: 'Musical Polyrhythm Generator - Interactive Music Creation with FM Synthesis',
  meta: [
    { name: 'description', content: 'Create and visualize complex polyrhythmic patterns with musical scales, FM synthesis, and interactive audio visualization' },
    { name: 'keywords', content: 'polyrhythm, music, rhythm, generator, visualization, audio, synthesis, musical scales, notes, interactive, FM synthesis' },
    { name: 'theme-color', content: '#1e293b' }
  ],
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap' }
  ]
});

const rhythmStore = useRhythmStore();
const { handleError } = useErrorHandler();

const globalError = ref<string>('');
const isInitialized = ref(false);

/**
 * Handle node hit events from the visualizer
 */
const handleNodeHit = (event: NodeHitEvent) => {
  try {
    // Log the event for debugging
    // console.log('Musical node hit:', event);
    
    // Audio is now handled directly in the RhythmVisualizerMusical component using global FM synth
    // This event can be used for additional visual effects or analytics
  } catch (err) {
    handleError(err as Error, 'Failed to handle musical node hit');
  }
};

/**
 * Initialize the application
 */
const initializeApplication = async () => {
  try {
    globalError.value = '';
    
    // Initialize stores
    rhythmStore.initialize();
    
    // Setup global FM synth auto-initialization
    setupGlobalFMSynthAutoInit();
    
    isInitialized.value = true;
  } catch (err) {
    const error = err as Error;
    globalError.value = error.message || 'Failed to initialize application';
    handleError(error, 'Application initialization');
  }
};

/**
 * Retry initialization after error
 */
const retryInitialization = () => {
  initializeApplication();
};

// Global error handler
onErrorCaptured((err: Error) => {
  globalError.value = err.message || 'An unexpected error occurred';
  handleError(err, 'Global error boundary');
  return false; // Prevent error from propagating
});

// Initialize on mount
onMounted(() => {
  initializeApplication();
});
</script>