// Application constants
export const CANVAS_CONSTANTS = {
  NODE_RADIUS: 8,
  LINE_OPACITY: 0.2,
  HOVER_COLOR: '#64B5F6',
  DEFAULT_COLOR: '#FFFFFF',
  BACKGROUND_COLOR: '#1F2937',
  // Fixed: Restored proper animation speed - deltaTime is already in milliseconds
  ANIMATION_SPEED_MULTIPLIER: 0.001, // Restored to original value for proper movement
} as const;

export const AUDIO_CONSTANTS = {
  DEFAULT_NOTES: ['C4', 'E4', 'G4', 'B4', 'D5', 'F5', 'A5', 'C6'],
  DEFAULT_BASS_NOTES: ['C2', 'E2', 'G2', 'B2'],
  MAX_VOLUME: 1,
  MIN_VOLUME: 0,
  DEFAULT_MASTER_VOLUME: 0.8,
  DEFAULT_BACKGROUND_VOLUME: 0.5,
} as const;

export const VALIDATION_RULES = {
  NODE_COUNT: { min: 2, max: 16 },
  BASS_NODE_COUNT: { min: 1, max: 8 },
  BASE_SPEED: { min: 0.1, max: 2 },
  SPEED_RATIO: { min: 0.01, max: 0.5 },
  VOLUME: { min: 0, max: 1 },
  ATTACK: { min: 0.01, max: 1 },
  RELEASE: { min: 0.1, max: 2 },
  REVERB_WET: { min: 0, max: 1 },
} as const;

export const ERROR_MESSAGES = {
  CANVAS_CONTEXT_FAILED: 'Failed to get canvas 2D context',
  AUDIO_CONTEXT_FAILED: 'Failed to initialize audio context',
  INVALID_NODE_COUNT: 'Node count must be between 2 and 16',
  INVALID_SPEED: 'Speed must be between 0.1 and 2',
  COMPONENT_MOUNT_FAILED: 'Component failed to mount properly',
} as const;