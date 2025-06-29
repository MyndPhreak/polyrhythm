import { ref, computed, onUnmounted, readonly } from 'vue';
import { useErrorHandler } from './useErrorHandler';
import { useAudioV3 } from './useAudioV3';

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

export function useMusicalAudio() {
  const { handleError } = useErrorHandler();
  const audioV3 = useAudioV3();

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
    
    console.log(`Assigned ${scaleType} scale in ${rootNote} to ${nodeConfigs.value.length} nodes`);
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
    
    console.log(`Set node ${nodeIndex} to ${note}${nodeConfigs.value[nodeIndex].octave}`);
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
  };

  /**
   * Trigger note for specific node
   */
  const triggerNodeNote = (nodeIndex: number, velocity: number = 0.8) => {
    if (nodeIndex < 0 || nodeIndex >= nodeConfigs.value.length) {
      console.warn(`Invalid node index: ${nodeIndex}`);
      return;
    }
    
    const config = nodeConfigs.value[nodeIndex];
    if (!config.enabled) return;
    
    try {
      const frequency = noteToFrequency(config.note, config.octave);
      const finalVolume = velocity * config.volume * settings.value.globalVolume;
      
      // Use the V3 audio system to play the note
      audioV3.triggerNote(frequency, config.duration, finalVolume);
      
      console.log(`Triggered node ${nodeIndex}: ${config.note}${config.octave} (${frequency.toFixed(2)}Hz)`);
    } catch (error) {
      console.warn(`Failed to trigger note for node ${nodeIndex}:`, error);
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
      
      console.log('Configuration imported successfully');
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
    
    // Audio system integration
    ...audioV3
  };
}