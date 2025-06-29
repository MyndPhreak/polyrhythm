<template>
  <div class="relative w-full h-[600px] group">
    <canvas
      ref="canvasRef"
      class="w-full h-full bg-gradient-to-br from-secondary-800/50 to-secondary-900/50 rounded-xl cursor-crosshair border border-white/10 shadow-soft backdrop-blur-sm transition-all duration-300 group-hover:shadow-medium"
      @mousemove="handleMouseMove"
      @mouseleave="handleMouseLeave"
      :aria-label="`Rhythm visualizer with ${rhythmStore.nodeCount} nodes`"
      role="img"
    />

    <!-- Tooltip -->
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
            Note: <span class="text-success-400 font-mono">{{ audioStore.getNodeNote(hoveredNode) }}</span>
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
          <div class="text-white text-lg font-medium">Initializing Visualizer</div>
          <div class="text-secondary-400 text-sm">Setting up canvas and nodes...</div>
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
            <div class="text-xl font-semibold">Visualization Error</div>
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

    <!-- Performance Indicator -->
    <div class="absolute top-4 right-4 flex items-center space-x-2 text-xs text-secondary-400 bg-black/20 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10">
      <div 
        class="w-2 h-2 rounded-full transition-colors duration-200"
        :class="animationFrameId ? 'bg-success-400 animate-pulse' : 'bg-secondary-500'"
      ></div>
      <span>{{ animationFrameId ? 'Active' : 'Idle' }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/vue/24/outline';
import { useRhythmStore } from '~/stores/rhythmStore';
import { useAudioStore } from '~/stores/audioStore';
import { useCanvas } from '~/composables/useCanvas';
import { useErrorHandler } from '~/composables/useErrorHandler';
import { useAudio } from '~/composables/useAudio';
import { CANVAS_CONSTANTS } from '~/constants';
import type { CanvasNode, NodeHitEvent } from '~/types';

const rhythmStore = useRhythmStore();
const audioStore = useAudioStore();
const { canvasRef, context, initializeCanvas, clearCanvas } = useCanvas();
const { error, handleError, clearError } = useErrorHandler();
const { triggerNote, isInitialized: audioInitialized } = useAudio();

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

/**
 * Calculate speed for each node
 */
const nodeSpeed = (index: number): number => {
  return rhythmStore.getNodeSpeed(index);
};

/**
 * Initialize nodes with default positions and velocities
 * Fixed: Store initial states for proper reset functionality
 */
const initializeNodes = () => {
  const nodeCount = rhythmStore.nodeCount;
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
 * Fixed: Proper deep copy reset to eliminate position drift
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

    initializeNodes();

    if (rhythmStore.isPlaying) {
      startAnimation();
    }

    isLoading.value = false;
  } catch (err) {
    handleError(err as Error, 'Visualization initialization');
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
 * Main animation loop with precise position calculations and audio integration
 * Fixed: Proper speed calculation and boundary handling with audio triggers
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

    // Calculate position change - Fixed: Use proper speed multiplier
    // Speed is already factored into node.speed, deltaTime is in milliseconds
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

      // Trigger audio for top boundary hit (if audio is available)
      if (audioInitialized.value) {
        try {
          const note = audioStore.getNodeNote(i);
          triggerNote(note, "16n", 0.6);
        } catch (err) {
          // Silently handle audio errors to prevent visualization from breaking
          console.warn('Failed to trigger note:', err);
        }
      }

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

      // Trigger audio for bottom boundary hit (if audio is available)
      if (audioInitialized.value) {
        try {
          const note = audioStore.getNodeNote(i);
          triggerNote(note, "16n", 0.6);
        } catch (err) {
          // Silently handle audio errors to prevent visualization from breaking
          console.warn('Failed to trigger note:', err);
        }
      }

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
 * Draw all nodes and lines with improved precision and visual effects
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

  // Draw nodes and lines
  for (let i = 0; i < nodes.value.length; i++) {
    const node = nodes.value[i];
    const x = nodeWidth * (i + 1);
    // Precise Y calculation: invert position since canvas Y increases downward
    const y = canvas.height * (1 - node.position);

    // Draw vertical line with gradient
    const gradient = ctx.createLinearGradient(x, 0, x, canvas.height);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
    gradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.1)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.3)');

    ctx.beginPath();
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();

    // Draw node with enhanced visuals
    const isHovered = i === hoveredNode.value;
    const isActive = Math.abs(node.velocity) > 0.5;

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

    // Main node
    ctx.beginPath();
    const nodeGradient = ctx.createRadialGradient(x - 2, y - 2, 0, x, y, CANVAS_CONSTANTS.NODE_RADIUS);
    if (isHovered) {
      nodeGradient.addColorStop(0, '#f0abfc');
      nodeGradient.addColorStop(1, '#d946ef');
    } else {
      nodeGradient.addColorStop(0, '#ffffff');
      nodeGradient.addColorStop(1, '#94a3b8');
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

    // Speed indicator (small dot)
    const speedIntensity = (node.speed - 1) / 2; // Normalize speed to 0-1
    ctx.beginPath();
    ctx.fillStyle = `rgba(34, 197, 94, ${0.3 + speedIntensity * 0.7})`;
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
  }
};

/**
 * Handle mouse movement for tooltips
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
  initializeNodes();
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

// Watch for reset events from the rhythm store
watch(() => rhythmStore.currentTime, (newTime, oldTime) => {
  // Detect reset when currentTime goes from positive to 0
  if (oldTime > 0 && newTime === 0) {
    resetNodes();
    if (!rhythmStore.isPlaying) {
      drawNodes();
    }
  }
});

// Lifecycle hooks
onMounted(() => {
  initializeVisualization();
});

onUnmounted(() => {
  stopAnimation();
});
</script>
