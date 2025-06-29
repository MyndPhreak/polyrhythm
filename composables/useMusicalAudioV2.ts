import { ref, computed, onUnmounted, readonly, watch } from 'vue';
import { useErrorHandler } from './useErrorHandler';
import { useGlobalAudio } from './useGlobalAudio';

// Musical scale definitions
export const MUSICAL_SCALES = {
  chromatic: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
  major: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
  minor: ['C', 'D', 'Eb', 'F', 'G', 'Ab', 'Bb'],
  pentatonic: ['C', 'D', 'E', 'G', 'A'],
  dorian: ['C', 'D', 'Eb', 'F', 'G', 'A', 'Bb'],
  mixolydian: ['C', 'D', 'E', 'F', 'G', 'A', 'Bb'],
  blues: ['C', 'Eb', 'F', 'F#', 'G', 'Bb']
} as const;

export type ScaleType = keyof typeof MUSICAL_SCALES;

// Note to frequency mapping (A4 = 440Hz)
const NOTE_FREQUENCIES: { [key: string]: number } = {
  'C': 261.63, 'C#': 277.18, 'Db': 277.18,
  'D': 293.66, 'D#': 311.13, 'Eb': 311.13,
  'E': 329.63,
  'F': 349.23, 'F#': 369.99, 'Gb': 369.99,
  'G': 392.00, 'G#': 415.30, 'Ab': 415.30,
  'A': 440.00, 'A#': 466.16, 'Bb': 466.16,
  'B': 493.88
};

// Node audio configuration
export interface NodeAudioConfig {
  note: string;
  octave: number;
  volume: number;
  duration: number;
  enabled: boolean;
}

// Musical audio settings
export interface MusicalAudioSettings {
  rootNote: string;
  scaleType: ScaleType;
  octaveRange: { min: number; max: number };
  globalVolume: number;
  noteDuration: number;
  autoAssignScale: boolean;
}

export function useMusicalAudioV2() {
  const { handleError } = useErrorHandler();
  
  // Get the global audio system instance
  const globalAudio = useGlobalAudio();

  // Musical settings
  const settings = ref<MusicalAudioSettings>({
    rootNote: 'C',
    scaleType: 'major',
    octaveRange: { min: 3, max: 6 },
    globalVolume: 0.7,
    noteDuration: 0.2,
    autoAssignScale: true
  });

  // Node configurations
  const nodeConfigs = ref<NodeAudioConfig[]>([]);
  const nodeCount = ref(8);

  // Use the global audio system's state
  const isInitialized = computed(() => globalAudio.isInitialized.value);
  const isInitializing = computed(() => globalAudio.isInitializing.value || globalAudio.isAutoInitializing.value);
  const currentVolume = computed(() => globalAudio.currentVolume.value);
  const initializationError = computed(() => globalAudio.initializationError.value || globalAudio.autoInitError.value);

  /**
   * Initialize node configurations
   */
  const initializeNodes = (count: number) => {
    nodeCount.value = count;
    
    // Create default configurations for each node
    const newConfigs: NodeAudioConfig[] = [];
    for (let i = 0; i < count; i++) {
      newConfigs.push({
        note: 'C',
        octave: 4,
        volume: 1.0,
        duration: settings.value.noteDuration,
        enabled: true
      });
    }
    
    nodeConfigs.value = newConfigs;
    
    // Auto-assign scale if enabled
    if (settings.value.autoAssignScale) {
      assignScale(settings.value.scaleType, settings.value.rootNote);
    }
    
    console.log(`Musical audio V2: Initialized ${count} nodes`);
  };

  /**
   * Convert note name to frequency with octave
   */
  const noteToFrequency = (note: string, octave: number): number => {
    const baseFreq = NOTE_FREQUENCIES[note];
    if (!baseFreq) {
      console.warn(`Unknown note: ${note}, using C4`);
      return 261.63;
    }
    
    // Calculate frequency for the given octave (C4 = octave 4)
    const octaveMultiplier = Math.pow(2, octave - 4);
    return baseFreq * octaveMultiplier;
  };

  /**
   * Transpose a note by semitones
   */
  const transposeNote = (note: string, semitones: number): string => {
    const chromatic = MUSICAL_SCALES.chromatic;
    const noteIndex = chromatic.indexOf(note);
    
    if (noteIndex === -1) {
      console.warn(`Unknown note for transposition: ${note}`);
      return note;
    }
    
    const newIndex = (noteIndex + semitones + chromatic.length) % chromatic.length;
    return chromatic[newIndex];
  };

  /**
   * Get scale notes starting from root note
   */
  const getScaleNotes = (scaleType: ScaleType, rootNote: string): string[] => {
    const scalePattern = MUSICAL_SCALES[scaleType];
    const rootIndex = MUSICAL_SCALES.chromatic.indexOf(rootNote);
    
    if (rootIndex === -1) {
      console.warn(`Unknown root note: ${rootNote}, using C`);
      return MUSICAL_SCALES[scaleType];
    }
    
    // Transpose each note in the scale
    return scalePattern.map(note => {
      const noteIndex = MUSICAL_SCALES.chromatic.indexOf(note);
      const transposedIndex = (noteIndex + rootIndex) % MUSICAL_SCALES.chromatic.length;
      return MUSICAL_SCALES.chromatic[transposedIndex];
    });
  };

  /**
   * Assign scale to nodes automatically
   */
  const assignScale = (scaleType: ScaleType, rootNote: string = settings.value.rootNote) => {
    if (nodeConfigs.value.length === 0) return;
    
    const scaleNotes = getScaleNotes(scaleType, rootNote);
    const { min: minOctave, max: maxOctave } = settings.value.octaveRange;
    const octaveSpan = maxOctave - minOctave + 1;
    
    // Distribute notes across nodes
    for (let i = 0; i < nodeConfigs.value.length; i++) {
      const noteIndex = i % scaleNotes.length;
      const octaveOffset = Math.floor(i / scaleNotes.length) % octaveSpan;
      
      nodeConfigs.value[i].note = scaleNotes[noteIndex];
      nodeConfigs.value[i].octave = minOctave + octaveOffset;
    }
    
    console.log(`Musical audio V2: Assigned ${scaleType} scale in ${rootNote} to ${nodeConfigs.value.length} nodes`);
  };

  /**
   * Set note for specific node
   */
  const setNodeNote = (nodeIndex: number, note: string, octave?: number) => {
    if (nodeIndex < 0 || nodeIndex >= nodeConfigs.value.length) {
      console.warn(`Invalid node index: ${nodeIndex}`);
      return;
    }
    
    nodeConfigs.value[nodeIndex].note = note;
    if (octave !== undefined) {
      nodeConfigs.value[nodeIndex].octave = octave;
    }
    
    console.log(`Musical audio V2: Set node ${nodeIndex} to ${note}${nodeConfigs.value[nodeIndex].octave}`);
  };

  /**
   * Set volume for specific node
   */
  const setNodeVolume = (nodeIndex: number, volume: number) => {
    if (nodeIndex < 0 || nodeIndex >= nodeConfigs.value.length) {
      console.warn(`Invalid node index: ${nodeIndex}`);
      return;
    }
    
    const clampedVolume = Math.max(0, Math.min(1, volume));
    nodeConfigs.value[nodeIndex].volume = clampedVolume;
  };

  /**
   * Set duration for specific node
   */
  const setNodeDuration = (nodeIndex: number, duration: number) => {
    if (nodeIndex < 0 || nodeIndex >= nodeConfigs.value.length) {
      console.warn(`Invalid node index: ${nodeIndex}`);
      return;
    }
    
    const clampedDuration = Math.max(0.05, Math.min(2, duration));
    nodeConfigs.value[nodeIndex].duration = clampedDuration;
  };

  /**
   * Toggle node enabled state
   */
  const toggleNode = (nodeIndex: number) => {
    if (nodeIndex < 0 || nodeIndex >= nodeConfigs.value.length) {
      console.warn(`Invalid node index: ${nodeIndex}`);
      return;
    }
    
    nodeConfigs.value[nodeIndex].enabled = !nodeConfigs.value[nodeIndex].enabled;
    console.log(`Musical audio V2: Node ${nodeIndex} ${nodeConfigs.value[nodeIndex].enabled ? 'enabled' : 'disabled'}`);
  };

  /**
   * Trigger note for specific node with auto-initialization
   */
  const triggerNodeNote = async (nodeIndex: number, velocity: number = 0.8) => {
    console.log(`Musical audio V2: triggerNodeNote called for node ${nodeIndex}, velocity ${velocity}`);
    
    if (nodeIndex < 0 || nodeIndex >= nodeConfigs.value.length) {
      console.warn(`Musical audio V2: Invalid node index: ${nodeIndex}`);
      return;
    }
    
    const config = nodeConfigs.value[nodeIndex];
    if (!config) {
      console.warn(`Musical audio V2: No config found for node ${nodeIndex}`);
      return;
    }
    
    if (!config.enabled) {
      console.log(`Musical audio V2: Node ${nodeIndex} is disabled, skipping`);
      return;
    }
    
    // Ensure audio is ready
    const audioReady = await globalAudio.ensureAudioReady();
    if (!audioReady) {
      console.warn(`Musical audio V2: Audio system not ready, cannot play note for node ${nodeIndex}`);
      return;
    }
    
    try {
      const frequency = noteToFrequency(config.note, config.octave);
      const finalVolume = velocity * config.volume * settings.value.globalVolume;
      
      console.log(`Musical audio V2: Playing ${config.note}${config.octave} (${frequency.toFixed(2)}Hz) at ${(finalVolume * 100).toFixed(0)}% volume`);
      
      // Use the global audio system to play the note
      globalAudio.triggerNote(frequency, config.duration, finalVolume);
      
      console.log(`Musical audio V2: Successfully triggered node ${nodeIndex}: ${config.note}${config.octave}`);
    } catch (error) {
      console.error(`Musical audio V2: Failed to trigger note for node ${nodeIndex}:`, error);
      handleError(error as Error, `Failed to play note for node ${nodeIndex}`);
    }
  };

  /**
   * Update musical settings
   */
  const updateSettings = (newSettings: Partial<MusicalAudioSettings>) => {
    const oldScaleType = settings.value.scaleType;
    const oldRootNote = settings.value.rootNote;
    
    Object.assign(settings.value, newSettings);
    
    // Re-assign scale if scale type or root note changed and auto-assign is enabled
    if (settings.value.autoAssignScale && 
        (newSettings.scaleType !== oldScaleType || newSettings.rootNote !== oldRootNote)) {
      assignScale(settings.value.scaleType, settings.value.rootNote);
    }
    
    // Update all node durations if global duration changed
    if (newSettings.noteDuration !== undefined) {
      nodeConfigs.value.forEach(config => {
        config.duration = newSettings.noteDuration!;
      });
    }
    
    console.log('Musical audio V2: Settings updated', newSettings);
  };

  /**
   * Get note name with octave for display
   */
  const getNodeDisplayNote = (nodeIndex: number): string => {
    if (nodeIndex < 0 || nodeIndex >= nodeConfigs.value.length) {
      return 'C4';
    }
    
    const config = nodeConfigs.value[nodeIndex];
    return `${config.note}${config.octave}`;
  };

  /**
   * Get frequency for node
   */
  const getNodeFrequency = (nodeIndex: number): number => {
    if (nodeIndex < 0 || nodeIndex >= nodeConfigs.value.length) {
      return 261.63; // C4
    }
    
    const config = nodeConfigs.value[nodeIndex];
    return noteToFrequency(config.note, config.octave);
  };

  /**
   * Export current configuration
   */
  const exportConfiguration = () => {
    return {
      settings: { ...settings.value },
      nodeConfigs: nodeConfigs.value.map(config => ({ ...config }))
    };
  };

  /**
   * Import configuration
   */
  const importConfiguration = (config: any) => {
    try {
      if (config.settings) {
        updateSettings(config.settings);
      }
      
      if (config.nodeConfigs && Array.isArray(config.nodeConfigs)) {
        nodeConfigs.value = config.nodeConfigs.map(nodeConfig => ({
          note: nodeConfig.note || 'C',
          octave: nodeConfig.octave || 4,
          volume: nodeConfig.volume || 1.0,
          duration: nodeConfig.duration || 0.2,
          enabled: nodeConfig.enabled !== false
        }));
      }
      
      console.log('Musical audio V2: Configuration imported successfully');
    } catch (error) {
      handleError(error as Error, 'Failed to import configuration');
    }
  };

  // Computed properties
  const availableNotes = computed(() => MUSICAL_SCALES.chromatic);
  const availableScales = computed(() => Object.keys(MUSICAL_SCALES) as ScaleType[]);
  const currentScaleNotes = computed(() => 
    getScaleNotes(settings.value.scaleType, settings.value.rootNote)
  );

  // Initialize with default node count
  initializeNodes(8);

  // Watch for audio system initialization changes and log them
  watch(isInitialized, (newValue, oldValue) => {
    console.log(`Musical audio V2: Global audio system initialization changed from ${oldValue} to ${newValue}`);
    if (newValue) {
      console.log('Musical audio V2: Global audio system is now available');
    } else {
      console.log('Musical audio V2: Global audio system is not available');
    }
  }, { immediate: true });

  return {
    // State
    settings: readonly(settings),
    nodeConfigs: readonly(nodeConfigs),
    nodeCount: readonly(nodeCount),
    
    // Computed
    availableNotes,
    availableScales,
    currentScaleNotes,
    
    // Methods
    initializeNodes,
    assignScale,
    setNodeNote,
    setNodeVolume,
    setNodeDuration,
    toggleNode,
    triggerNodeNote,
    updateSettings,
    getNodeDisplayNote,
    getNodeFrequency,
    noteToFrequency,
    transposeNote,
    getScaleNotes,
    exportConfiguration,
    importConfiguration,
    
    // Audio system integration - use global audio state
    isInitialized,
    isInitializing,
    currentVolume,
    initializationError,
    
    // Global audio methods
    initializeAudioSystem: globalAudio.manualInitializeAudio,
    setVolume: globalAudio.setVolume,
    getProviderStatus: globalAudio.getProviderStatus,
    restartAudioSystem: globalAudio.restartAudioSystem,
    dispose: globalAudio.dispose,
    ensureAudioReady: globalAudio.ensureAudioReady,
    
    // Legacy compatibility
    isContextStarted: isInitialized,
    startAudioContext: globalAudio.manualInitializeAudio,
    setReverbWet: globalAudio.setReverbWet,
    setDelayWet: globalAudio.setDelayWet,
    updateSynthParams: globalAudio.updateSynthParams,
    getContextState: globalAudio.getContextState
  };
}