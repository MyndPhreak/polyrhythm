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

// Helper function to validate and parse settings from localStorage
function validateSettings(savedSettings: any): MusicalAudioSettings {
  if (!savedSettings || typeof savedSettings !== 'object') {
    return DEFAULT_SETTINGS;
  }

  return {
    rootNote: typeof savedSettings.rootNote === 'string' ? savedSettings.rootNote : DEFAULT_SETTINGS.rootNote,
    scaleType: typeof savedSettings.scaleType === 'string' ? savedSettings.scaleType : DEFAULT_SETTINGS.scaleType,
    octaveRange: {
      min: typeof savedSettings.octaveRange?.min === 'number' ? savedSettings.octaveRange.min : 
           (typeof savedSettings.octaveRange?.min === 'string' ? parseInt(savedSettings.octaveRange.min, 10) : DEFAULT_SETTINGS.octaveRange.min),
      max: typeof savedSettings.octaveRange?.max === 'number' ? savedSettings.octaveRange.max : 
           (typeof savedSettings.octaveRange?.max === 'string' ? parseInt(savedSettings.octaveRange.max, 10) : DEFAULT_SETTINGS.octaveRange.max)
    },
    globalVolume: typeof savedSettings.globalVolume === 'number' ? savedSettings.globalVolume : 
                  (typeof savedSettings.globalVolume === 'string' ? parseFloat(savedSettings.globalVolume) : DEFAULT_SETTINGS.globalVolume),
    noteDuration: typeof savedSettings.noteDuration === 'number' ? savedSettings.noteDuration : 
                  (typeof savedSettings.noteDuration === 'string' ? parseFloat(savedSettings.noteDuration) : DEFAULT_SETTINGS.noteDuration),
    autoAssignScale: typeof savedSettings.autoAssignScale === 'boolean' ? savedSettings.autoAssignScale : DEFAULT_SETTINGS.autoAssignScale
  };
}

// Helper function to validate and parse node configs from localStorage
function validateNodeConfigs(savedNodeConfigs: any): NodeAudioConfig[] {
  if (!Array.isArray(savedNodeConfigs)) {
    return [];
  }

  return savedNodeConfigs.map((config: any) => ({
    note: typeof config.note === 'string' ? config.note : 'C',
    octave: typeof config.octave === 'number' ? config.octave : 
            (typeof config.octave === 'string' ? parseInt(config.octave, 10) : 4),
    volume: typeof config.volume === 'number' ? config.volume : 
            (typeof config.volume === 'string' ? parseFloat(config.volume) : 1.0),
    duration: typeof config.duration === 'number' ? config.duration : 
              (typeof config.duration === 'string' ? parseFloat(config.duration) : 0.2),
    enabled: typeof config.enabled === 'boolean' ? config.enabled : true
  }));
}

export const useMusicalStore = defineStore('musical', {
  state: (): MusicalState => {
    // Try to load settings from localStorage with validation
    let settings = DEFAULT_SETTINGS;
    let nodeConfigs: NodeAudioConfig[] = [];

    try {
      const savedSettings = localStorage.getItem('musicalSettings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        settings = validateSettings(parsedSettings);
      }
    } catch (error) {
      console.warn('Failed to load musical settings from localStorage:', error);
      settings = DEFAULT_SETTINGS;
    }

    try {
      const savedNodeConfigs = localStorage.getItem('musicalNodeConfigs');
      if (savedNodeConfigs) {
        const parsedNodeConfigs = JSON.parse(savedNodeConfigs);
        nodeConfigs = validateNodeConfigs(parsedNodeConfigs);
      }
    } catch (error) {
      console.warn('Failed to load musical node configs from localStorage:', error);
      nodeConfigs = [];
    }
    
    return {
      settings,
      nodeConfigs
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