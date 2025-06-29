import { defineStore } from 'pinia';
import type { RhythmState } from '~/types';
import { validateNodeCount, validateSpeed } from '~/utils/validation';

export const useRhythmStore = defineStore('rhythm', {
  state: (): RhythmState => ({
    nodeCount: 8,
    bassNodeCount: 4,
    baseSpeed: 1,
    speedRatio: 0.1,
    isPlaying: false,
    currentTime: 0,
    loopDuration: 0,
    randomSeed: 0,
    lowestSegment: 1,
    highestSegment: 8,
    layers: 3,
    randomOffset: 0.2
  }),

  getters: {
    /**
     * Calculate speed for a specific node index
     */
    getNodeSpeed: (state) => (index: number): number => {
      return state.baseSpeed * (1 + index * state.speedRatio);
    },

    /**
     * Get total duration for one complete cycle
     */
    getCycleDuration: (state): number => {
      // Calculate LCM of all node periods for complete cycle
      const periods = Array.from({ length: state.nodeCount }, (_, i) => 
        2 / state.getNodeSpeed(i)
      );
      return periods.reduce((lcm, period) => 
        (lcm * period) / gcd(lcm, period)
      );
    }
  },

  actions: {
    /**
     * Initialize store with random seed
     */
    initialize() {
      this.randomSeed = Math.random();
    },

    /**
     * Set node count with validation
     */
    setNodeCount(count: number) {
      const validation = validateNodeCount(count);
      this.nodeCount = validation.value;
      
      if (!validation.isValid && validation.error) {
        console.warn(validation.error);
      }
    },

    /**
     * Set bass node count with validation
     */
    setBassNodeCount(count: number) {
      const clampedCount = Math.max(1, Math.min(8, Number(count)));
      this.bassNodeCount = clampedCount;
    },

    /**
     * Set base speed with validation
     */
    setBaseSpeed(speed: number) {
      const validation = validateSpeed(speed);
      this.baseSpeed = validation.value;
      
      if (!validation.isValid && validation.error) {
        console.warn(validation.error);
      }
    },

    /**
     * Set speed ratio with validation
     */
    setSpeedRatio(ratio: number) {
      const clampedRatio = Math.max(0.01, Math.min(0.5, Number(ratio)));
      this.speedRatio = clampedRatio;
    },

    /**
     * Toggle playback state
     */
    togglePlayback() {
      this.isPlaying = !this.isPlaying;
    },

    /**
     * Update current time
     */
    updateTime(time: number) {
      this.currentTime = time;
    },

    /**
     * Reset all nodes to initial state
     */
    reset() {
      this.isPlaying = false;
      this.currentTime = 0;
      this.initialize();
    }
  }
});

/**
 * Helper function to calculate GCD for LCM calculation
 */
function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}