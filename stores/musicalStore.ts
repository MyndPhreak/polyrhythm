import { defineStore } from 'pinia';
import type { MusicalAudioSettings, NodeAudioConfig, ScaleType } from '~/composables/useMusicalAudio';

// Define the state interface for the musical store
interface MusicalState {
  settings: MusicalAudioSettings;
  nodeConfigs: NodeAudioConfig[];
}

// Define the default settings
const DEFAULT_SETTINGS: MusicalAudioSettings = {
  rootNote: 'C',
  scaleType: 'major',
  octaveRange: { min: 3, max: 6 },
  globalVolume: 0.7,
  noteDuration: 0.2,
  autoAssignScale: true
};

export const useMusicalStore = defineStore('musical', {
  state: (): MusicalState => {
    // Try to load settings from localStorage
    const savedSettings = localStorage.getItem('musicalSettings');
    const savedNodeConfigs = localStorage.getItem('musicalNodeConfigs');
    
    return {
      settings: savedSettings ? JSON.parse(savedSettings) : DEFAULT_SETTINGS,
      nodeConfigs: savedNodeConfigs ? JSON.parse(savedNodeConfigs) : []
    };
  },

  getters: {
    /**
     * Get current scale notes
     */
    currentScaleNotes: (state) => {
      // This is just a placeholder - the actual implementation will be in useMusicalAudio.ts
      return [];
    }
  },

  actions: {
    /**
     * Update musical settings
     */
    updateSettings(newSettings: Partial<MusicalAudioSettings>) {
      this.settings = { ...this.settings, ...newSettings };
      
      // Save to localStorage
      localStorage.setItem('musicalSettings', JSON.stringify(this.settings));
      
      console.log('Musical store: Settings updated and saved to localStorage', this.settings);
    },

    /**
     * Update node configurations
     */
    updateNodeConfigs(newConfigs: NodeAudioConfig[]) {
      this.nodeConfigs = newConfigs;
      
      // Save to localStorage
      localStorage.setItem('musicalNodeConfigs', JSON.stringify(this.nodeConfigs));
      
      console.log('Musical store: Node configs updated and saved to localStorage', this.nodeConfigs.length);
    },

    /**
     * Update a single node configuration
     */
    updateNodeConfig(index: number, config: Partial<NodeAudioConfig>) {
      if (index >= 0 && index < this.nodeConfigs.length) {
        this.nodeConfigs[index] = { ...this.nodeConfigs[index], ...config };
        
        // Save to localStorage
        localStorage.setItem('musicalNodeConfigs', JSON.stringify(this.nodeConfigs));
        
        // console.log(`Musical store: Node ${index} config updated and saved to localStorage`);
      }
    },

    /**
     * Initialize node configurations
     */
    initializeNodeConfigs(count: number, defaultConfig: Partial<NodeAudioConfig> = {}) {
      // Create default configurations for each node
      const newConfigs: NodeAudioConfig[] = [];
      for (let i = 0; i < count; i++) {
        newConfigs.push({
          note: 'C',
          octave: 4,
          volume: 1.0,
          duration: this.settings.noteDuration,
          enabled: true,
          ...defaultConfig
        });
      }
      
      this.nodeConfigs = newConfigs;
      
      // Save to localStorage
      localStorage.setItem('musicalNodeConfigs', JSON.stringify(this.nodeConfigs));
      
      console.log(`Musical store: Initialized ${count} node configs and saved to localStorage`);
    },

    /**
     * Clear all saved data
     */
    clearSavedData() {
      localStorage.removeItem('musicalSettings');
      localStorage.removeItem('musicalNodeConfigs');
      
      // Reset to defaults
      this.settings = DEFAULT_SETTINGS;
      this.nodeConfigs = [];
      
      console.log('Musical store: Cleared all saved data');
    }
  }
});