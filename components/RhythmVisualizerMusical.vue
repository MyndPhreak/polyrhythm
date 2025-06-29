<template>
  <div class="relative w-full h-[600px] group">
    <canvas
      ref="canvasRef"
      class="w-full h-full bg-gradient-to-br from-secondary-800/50 to-secondary-900/50 rounded-xl cursor-crosshair border border-white/10 shadow-soft backdrop-blur-sm transition-all duration-300 group-hover:shadow-medium"
      @mousemove="handleMouseMove"
      @mouseleave="handleMouseLeave"
      @click="handleCanvasClick"
      :aria-label="`Musical rhythm visualizer with ${rhythmStore.nodeCount} nodes`"
      role="img"
    />

    <!-- Enhanced Tooltip with Musical Info -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 transform scale-95 translate-y-2"
      enter-to-class="opacity-100 transform scale-100 translate-y-0"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100 transform scale-100 translate-y-0"
      leave-to-class="opacity-0 transform scale-95 translate-y-2"
    >
      <div 
        v-if="hoveredNode !== null" 
        class="absolute px-4 py-3 bg-black/90 backdrop-blur-sm rounded-xl text-sm pointer-events-none z-20 border border-white/20 shadow-strong"
        :style="{ 
          left: tooltipX + 'px', 
          top: tooltipY + 'px',
          transform: 'translate(-50%, calc(-100% - 12px))'
        }"
      >
        <div class="text-white space-y-1">
          <div class="font-semibold text-primary-300">Node {{ hoveredNode + 1 }}</div>
          <div class="text-secondary-300 text-xs">
            Speed: <span class="text-accent-400 font-mono">{{ nodeSpeed(hoveredNode).toFixed(2) }}x</span>
          </div>
          <div class="text-secondary-300 text-xs">
            Note: <span class="text-success-400 font-mono">{{ getNodeDisplayNote(hoveredNode) }}</span>
          </div>
          <div class="text-secondary-300 text-xs">
            Freq: <span class="text-warning-400 font-mono">{{ getNodeFrequency(hoveredNode).toFixed(1) }}Hz</span>
          </div>
          <div class="text-secondary-300 text-xs">
            Volume: <span class="text-info-400 font-mono">{{ (getNodeVolume(hoveredNode) * 100).toFixed(0) }}%</span>
          </div>
          <div class="text-secondary-300 text-xs">
            Status: <span :class="getNodeStatusClass(hoveredNode)">{{ getNodeStatus(hoveredNode) }}</span>
          </div>
        </div>
        <!-- Tooltip arrow -->
        <div class="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/90"></div>
      </div>
    </Transition>

    <!-- Loading State -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div 
        v-if="isLoading" 
        class="absolute inset-0 flex items-center justify-center bg-secondary-800/75 backdrop-blur-sm rounded-xl border border-white/10"
      >
        <div class="text-center space-y-4">
          <LoadingSpinner size="lg" color="primary" />
          <div class="text-white text-lg font-medium">Initializing Musical Visualizer</div>
          <div class="text-secondary-400 text-sm">Setting up canvas and musical nodes...</div>
        </div>
      </div>
    </Transition>

    <!-- Error State -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div 
        v-if="error?.hasError" 
        class="absolute inset-0 flex items-center justify-center bg-error-900/75 backdrop-blur-sm rounded-xl border border-error-500/20"
      >
        <div class="text-center text-white space-y-4 p-8">
          <div class="w-16 h-16 mx-auto bg-error-500/20 rounded-full flex items-center justify-center">
            <ExclamationTriangleIcon class="w-8 h-8 text-error-400" />
          </div>
          <div class="space-y-2">
            <div class="text-xl font-semibold">Musical Visualization Error</div>
            <div class="text-sm text-error-200 max-w-md">{{ error.message }}</div>
          </div>
          <button 
            @click="initializeVisualization"
            class="px-6 py-3 bg-error-600 hover:bg-error-700 text-white rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-error-500 focus:ring-offset-2 focus:ring-offset-error-900 shadow-medium hover:shadow-strong transform hover:scale-105"
          >
            <span class="flex items-center space-x-2">
              <ArrowPathIcon class="w-4 h-4" />
              <span>Retry</span>
            </span>
          </button>
        </div>
      </div>
    </Transition>

    <!-- Performance and Musical Info -->
    <div class="absolute top-4 right-4 space-y-2">
      <!-- Performance Indicator -->
      <div class="flex items-center space-x-2 text-xs text-secondary-400 bg-black/20 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10">
        <div 
          class="w-2 h-2 rounded-full transition-colors duration-200"
          :class="animationFrameId ? 'bg-success-400 animate-pulse' : 'bg-secondary-500'"
        ></div>
        <span>{{ animationFrameId ? 'Active' : 'Idle' }}</span>
      </div>
      
      <!-- Musical Info -->
      <div class="text-xs text-secondary-400 bg-black/20 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10">
        <div>Scale: <span class="text-primary-400">{{ currentScaleInfo }}</span></div>
        <div>Nodes: <span class="text-accent-400">{{ nodeCount }}</span></div>
        <div>Audio: <span :class="audioInitialized ? 'text-success-400' : 'text-warning-400'">
          {{ audioInitialized ? 'Ready' : 'Not Ready' }}
        </span></div>
      </div>
    </div>

    <!-- Click to Test Node -->
    <div 
      v-if="hoveredNode !== null"
      class="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-xs text-secondary-400 bg-black/20 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10"
    >
      Click to test note • {{ audioInitialized ? 'Audio Ready' : 'Audio Not Ready' }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/vue/24/outline';
import { useRhythmStore } from '~/stores/rhythmStore';
import { useCanvas } from '~/composables/useCanvas';
import { useErrorHandler } from '~/composables/useErrorHandler';
import { useMusicalAudio } from '~/composables/useMusicalAudio';
import { CANVAS_CONSTANTS } from '~/constants';
import type { CanvasNode, NodeHitEvent } from '~/types';

const rhythmStore = useRhythmStore();
const { canvasRef, context, initializeCanvas, clearCanvas } = useCanvas();
const { error, handleError, clearError } = useErrorHandler();
const {
  settings,
  nodeConfigs,
  currentScaleNotes,
  triggerNodeNote,
  getNodeDisplayNote,
  getNodeFrequency,
  initializeNodes,
  isInitialized: audioInitialized
} = useMusicalAudio();

// Component state
const isLoading = ref(true);
const animationFrameId = ref<number>(0);
const lastTime = ref<number>(0);
const hoveredNode = ref<number | null>(null);
const tooltipX = ref(0);
const tooltipY = ref(0);
const isDirty = ref(true);

// Node state with precise tracking
const nodes = ref<CanvasNode[]>([]);
const initialNodeStates = ref<CanvasNode[]>([]);

// Define emits
const emit = defineEmits<{
  (e: 'node-hit', payload: NodeHitEvent): void;
}>();

// Computed properties
const nodeCount = computed(() => rhythmStore.nodeCount);
const currentScaleInfo = computed(() => 
  `${settings.value.rootNote} ${settings.value.scaleType}`
);

/**
 * Calculate speed for each node
 */
const nodeSpeed = (index: number): number => {
  return rhythmStore.getNodeSpeed(index);
};

/**
 * Get node volume
 */
const getNodeVolume = (index: number): number => {
  return nodeConfigs.value[index]?.volume || 1.0;
};

/**
 * Get node status for tooltip
 */
const getNodeStatus = (index: number): string => {
  const config = nodeConfigs.value[index];
  if (!config) return 'Not configured';
  if (!config.enabled) return 'Disabled';
  if (!audioInitialized.value) return 'Audio not ready';
  return 'Ready';
};

/**
 * Get node status class for tooltip
 */
const getNodeStatusClass = (index: number): string => {
  const status = getNodeStatus(index);
  switch (status) {
    case 'Ready': return 'text-success-400';
    case 'Disabled': return 'text-warning-400';
    case 'Audio not ready': return 'text-warning-400';
    default: return 'text-error-400';
  }
};

/**
 * Initialize nodes with default positions and velocities
 */
const initializeVisualizationNodes = () => {
  const nodeCount = rhythmStore.nodeCount;
  
  // Initialize musical audio nodes
  initializeNodes(nodeCount);
  
  const newNodes: CanvasNode[] = [];
  const newInitialStates: CanvasNode[] = [];

  for (let i = 0; i < nodeCount; i++) {
    const nodeState: CanvasNode = {
      position: 0.5, // Start in middle (normalized 0-1)
      velocity: 1,   // Start moving up
      speed: nodeSpeed(i),
      color: CANVAS_CONSTANTS.DEFAULT_COLOR
    };

    // Create deep copies to avoid reference issues
    newNodes.push({ ...nodeState });
    newInitialStates.push({ ...nodeState });
  }

  nodes.value = newNodes;
  initialNodeStates.value = newInitialStates;
  isDirty.value = true;
};

/**
 * Reset nodes to their exact initial state
 */
const resetNodes = () => {
  nodes.value = initialNodeStates.value.map((initialState, index) => ({
    ...initialState,
    speed: nodeSpeed(index) // Update speed in case settings changed
  }));
  isDirty.value = true;
};

/**
 * Initialize the visualization
 */
const initializeVisualization = async () => {
  try {
    isLoading.value = true;
    clearError();

    await nextTick();

    if (!initializeCanvas()) {
      throw new Error('Failed to initialize canvas');
    }

    initializeVisualizationNodes();

    if (rhythmStore.isPlaying) {
      startAnimation();
    }

    isLoading.value = false;
  } catch (err) {
    handleError(err as Error, 'Musical visualization initialization');
    isLoading.value = false;
  }
};

/**
 * Start animation loop
 */
const startAnimation = () => {
  if (animationFrameId.value) return;

  lastTime.value = performance.now();
  animationFrameId.value = requestAnimationFrame(animate);
};

/**
 * Stop animation loop
 */
const stopAnimation = () => {
  if (animationFrameId.value) {
    cancelAnimationFrame(animationFrameId.value);
    animationFrameId.value = 0;
  }
};

/**
 * Trigger musical note with enhanced logging and error handling
 */
const triggerMusicalNote = (nodeIndex: number, velocity: number = 0.8) => {
  console.log(`Visualizer: Attempting to trigger note for node ${nodeIndex}`);
  console.log(`Audio initialized: ${audioInitialized.value}`);
  console.log(`Node config:`, nodeConfigs.value[nodeIndex]);
  
  if (!audioInitialized.value) {
    console.warn(`Visualizer: Audio system not initialized, cannot play note for node ${nodeIndex}`);
    return;
  }
  
  const config = nodeConfigs.value[nodeIndex];
  if (!config) {
    console.warn(`Visualizer: No configuration found for node ${nodeIndex}`);
    return;
  }
  
  if (!config.enabled) {
    console.log(`Visualizer: Node ${nodeIndex} is disabled, skipping`);
    return;
  }
  
  try {
    console.log(`Visualizer: Triggering note ${config.note}${config.octave} for node ${nodeIndex}`);
    triggerNodeNote(nodeIndex, velocity);
    console.log(`Visualizer: Successfully triggered note for node ${nodeIndex}`);
  } catch (err) {
    console.error(`Visualizer: Failed to trigger note for node ${nodeIndex}:`, err);
  }
};

/**
 * Main animation loop with musical audio integration
 */
const animate = (timestamp: number) => {
  if (!context.value || !canvasRef.value) return;

  const deltaTime = timestamp - lastTime.value;
  lastTime.value = timestamp;

  let hasChanges = false;

  // Update node positions with precise calculations
  for (let i = 0; i < nodes.value.length; i++) {
    const node = nodes.value[i];
    const oldPosition = node.position;

    // Calculate position change
    const positionDelta = node.velocity * node.speed * deltaTime * CANVAS_CONSTANTS.ANIMATION_SPEED_MULTIPLIER;
    let newPosition = node.position + positionDelta;

    // Precise boundary checking and bounce logic
    if (newPosition >= 1.0) {
      // Calculate exact bounce position to prevent overshoot
      const overshoot = newPosition - 1.0;
      newPosition = 1.0 - overshoot; // Reflect the overshoot
      node.position = Math.max(0, Math.min(1, newPosition)); // Clamp to valid range
      node.velocity = -1; // Reverse direction
      hasChanges = true;

      // Trigger musical note for top boundary hit
      triggerMusicalNote(i, 0.8);

      // Emit hit event for top boundary
      emit('node-hit', { 
        index: i, 
        type: 'main', 
        timestamp: performance.now() 
      });
    } else if (newPosition <= 0.0) {
      // Calculate exact bounce position to prevent overshoot
      const undershoot = Math.abs(newPosition);
      newPosition = undershoot; // Reflect the undershoot
      node.position = Math.max(0, Math.min(1, newPosition)); // Clamp to valid range
      node.velocity = 1; // Reverse direction
      hasChanges = true;

      // Trigger musical note for bottom boundary hit
      triggerMusicalNote(i, 0.6);

      // Emit hit event for bottom boundary
      emit('node-hit', { 
        index: i, 
        type: 'main', 
        timestamp: performance.now() 
      });
    } else {
      // Normal position update
      node.position = newPosition;
    }

    // Check if position changed significantly to trigger redraw
    if (Math.abs(node.position - oldPosition) > 0.0001) {
      hasChanges = true;
    }
  }

  // Only redraw if there are changes or if dirty flag is set
  if (hasChanges || isDirty.value) {
    drawNodes();
    isDirty.value = false;
  }

  // Continue animation if playing
  if (rhythmStore.isPlaying) {
    animationFrameId.value = requestAnimationFrame(animate);
  }
};

/**
 * Draw all nodes and lines with musical visualization enhancements
 */
const drawNodes = () => {
  if (!context.value || !canvasRef.value) return;

  const canvas = canvasRef.value;
  const ctx = context.value;

  // Clear canvas
  clearCanvas();

  const nodeWidth = canvas.width / (nodes.value.length + 1);

  // Draw background grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 10; i++) {
    const y = (canvas.height / 10) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // Draw nodes and lines with musical enhancements
  for (let i = 0; i < nodes.value.length; i++) {
    const node = nodes.value[i];
    const nodeConfig = nodeConfigs.value[i];
    const x = nodeWidth * (i + 1);
    // Precise Y calculation: invert position since canvas Y increases downward
    const y = canvas.height * (1 - node.position);

    // Draw vertical line with gradient based on node volume
    const volumeIntensity = nodeConfig?.volume || 1.0;
    const gradient = ctx.createLinearGradient(x, 0, x, canvas.height);
    gradient.addColorStop(0, `rgba(59, 130, 246, ${0.3 * volumeIntensity})`);
    gradient.addColorStop(0.5, `rgba(59, 130, 246, ${0.1 * volumeIntensity})`);
    gradient.addColorStop(1, `rgba(59, 130, 246, ${0.3 * volumeIntensity})`);

    ctx.beginPath();
    ctx.strokeStyle = gradient;
    ctx.lineWidth = nodeConfig?.enabled ? 2 : 1;
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();

    // Draw node with enhanced visuals
    const isHovered = i === hoveredNode.value;
    const isActive = Math.abs(node.velocity) > 0.5;
    const isEnabled = nodeConfig?.enabled !== false;

    // Skip visual effects for disabled nodes
    if (!isEnabled) {
      // Draw disabled node
      ctx.beginPath();
      ctx.fillStyle = 'rgba(100, 100, 100, 0.3)';
      ctx.arc(x, y, CANVAS_CONSTANTS.NODE_RADIUS * 0.7, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }

    // Outer glow for active nodes
    if (isActive || isHovered) {
      ctx.beginPath();
      const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, CANVAS_CONSTANTS.NODE_RADIUS + 8);
      glowGradient.addColorStop(0, isHovered ? 'rgba(217, 70, 239, 0.6)' : 'rgba(59, 130, 246, 0.4)');
      glowGradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
      ctx.fillStyle = glowGradient;
      ctx.arc(x, y, CANVAS_CONSTANTS.NODE_RADIUS + 8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Main node with color based on musical note
    ctx.beginPath();
    const nodeGradient = ctx.createRadialGradient(x - 2, y - 2, 0, x, y, CANVAS_CONSTANTS.NODE_RADIUS);
    
    if (isHovered) {
      nodeGradient.addColorStop(0, '#f0abfc');
      nodeGradient.addColorStop(1, '#d946ef');
    } else {
      // Color based on note position in scale
      const noteIndex = currentScaleNotes.value.indexOf(nodeConfig?.note || 'C');
      const hue = noteIndex >= 0 ? (noteIndex / currentScaleNotes.value.length) * 360 : 0;
      nodeGradient.addColorStop(0, `hsl(${hue}, 70%, 80%)`);
      nodeGradient.addColorStop(1, `hsl(${hue}, 70%, 60%)`);
    }
    
    ctx.fillStyle = nodeGradient;
    ctx.arc(x, y, CANVAS_CONSTANTS.NODE_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    // Node border
    ctx.beginPath();
    ctx.strokeStyle = isHovered ? 'rgba(217, 70, 239, 0.8)' : 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.arc(x, y, CANVAS_CONSTANTS.NODE_RADIUS, 0, Math.PI * 2);
    ctx.stroke();

    // Volume indicator (inner circle)
    if (nodeConfig) {
      ctx.beginPath();
      ctx.fillStyle = `rgba(255, 255, 255, ${nodeConfig.volume * 0.8})`;
      ctx.arc(x, y, CANVAS_CONSTANTS.NODE_RADIUS * nodeConfig.volume * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Audio status indicator (small dot)
    ctx.beginPath();
    ctx.fillStyle = audioInitialized.value ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)';
    ctx.arc(x + CANVAS_CONSTANTS.NODE_RADIUS - 3, y - CANVAS_CONSTANTS.NODE_RADIUS + 3, 2, 0, Math.PI * 2);
    ctx.fill();

    // Note label
    if (nodeConfig && isHovered) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(getNodeDisplayNote(i), x, y - CANVAS_CONSTANTS.NODE_RADIUS - 8);
    }
  }
};

/**
 * Handle mouse movement for tooltips and interaction
 */
const handleMouseMove = (event: MouseEvent) => {
  if (!canvasRef.value) return;

  const canvas = canvasRef.value;
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  // Find closest node
  const nodeWidth = canvas.width / (nodes.value.length + 1);
  const nodeIndex = Math.round(x / nodeWidth) - 1;

  if (nodeIndex >= 0 && nodeIndex < nodes.value.length) {
    const nodeX = nodeWidth * (nodeIndex + 1);
    const nodeY = canvas.height * (1 - nodes.value[nodeIndex].position);
    const distance = Math.sqrt((x - nodeX) ** 2 + (y - nodeY) ** 2);

    if (distance <= CANVAS_CONSTANTS.NODE_RADIUS + 15) {
      hoveredNode.value = nodeIndex;
      tooltipX.value = event.clientX - rect.left;
      tooltipY.value = event.clientY - rect.top;
      isDirty.value = true;
      return;
    }
  }

  if (hoveredNode.value !== null) {
    hoveredNode.value = null;
    isDirty.value = true;
  }
};

/**
 * Handle mouse leave
 */
const handleMouseLeave = () => {
  if (hoveredNode.value !== null) {
    hoveredNode.value = null;
    isDirty.value = true;
  }
};

/**
 * Handle canvas click to test notes
 */
const handleCanvasClick = (event: MouseEvent) => {
  if (hoveredNode.value !== null) {
    console.log(`Canvas clicked on node ${hoveredNode.value}`);
    triggerMusicalNote(hoveredNode.value, 0.8);
  }
};

// Watch for changes in playing state
watch(() => rhythmStore.isPlaying, (isPlaying) => {
  if (isPlaying) {
    startAnimation();
  } else {
    stopAnimation();
  }
});

// Watch for changes in node count
watch(() => rhythmStore.nodeCount, () => {
  initializeVisualizationNodes();
  if (!rhythmStore.isPlaying) {
    drawNodes();
  }
});

// Watch for changes in speed settings
watch([() => rhythmStore.baseSpeed, () => rhythmStore.speedRatio], () => {
  // Update node speeds in both current and initial states
  for (let i = 0; i < nodes.value.length; i++) {
    const newSpeed = nodeSpeed(i);
    nodes.value[i].speed = newSpeed;
    if (i < initialNodeStates.value.length) {
      initialNodeStates.value[i].speed = newSpeed;
    }
  }
  isDirty.value = true;
});

// Watch for musical settings changes
watch([settings, nodeConfigs], () => {
  isDirty.value = true;
  if (!rhythmStore.isPlaying) {
    drawNodes();
  }
}, { deep: true });

// Watch for reset events from the rhythm store
watch(() => rhythmStore.currentTime, (newTime, oldTime) => {
  // Detect reset when currentTime goes from positive to 0
  if (oldValue > 0 && newTime === 0) {
    resetNodes();
    if (!rhythmStore.isPlaying) {
      drawNodes();
    }
  }
});

// Watch for audio initialization changes
watch(audioInitialized, (newValue) => {
  console.log(`Visualizer: Audio initialized changed to ${newValue}`);
  isDirty.value = true;
  if (!rhythmStore.isPlaying) {
    drawNodes();
  }
}, { immediate: true });

// Initialize
onMounted(() => {
  initializeVisualization();
});

onUnmounted(() => {
  stopAnimation();
});
</script>