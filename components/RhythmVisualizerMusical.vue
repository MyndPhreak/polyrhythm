<template>
  <div class="relative w-full h-[600px] group">
    <!-- Debug info overlay -->
    <div class="absolute top-2 left-2 z-50 bg-black/80 text-white text-xs p-2 rounded">
      <div>Canvas: {{ canvasRef ? 'Found' : 'Missing' }}</div>
      <div>Context: {{ context ? 'Ready' : 'Not Ready' }}</div>
      <div>Animation: {{ animationId ? 'Running' : 'Stopped' }}</div>
      <div>Audio: {{ isInitialized ? 'Ready' : 'Not Ready' }}</div>
      <div>Size: {{ canvasWidth }}x{{ canvasHeight }}</div>
    </div>

    <canvas
      ref="canvasRef"
      :width="canvasWidth"
      :height="canvasHeight"
      class="w-full h-full border-2 border-red-500 rounded-lg bg-gray-900"
      style="display: block; min-height: 600px;"
    />
    
    <!-- Test pattern overlay to verify canvas positioning -->
    <div class="absolute inset-0 pointer-events-none border-4 border-blue-500 opacity-50"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useCanvas } from '~/composables/useCanvas'
import { useMusicalAudio } from '~/composables/useMusicalAudio'

interface Props {
  width?: number
  height?: number
  isPlaying?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  width: 800,
  height: 600,
  isPlaying: false
})

const canvasRef = ref<HTMLCanvasElement>()
const canvasWidth = ref(props.width)
const canvasHeight = ref(props.height)
const context = ref<CanvasRenderingContext2D | null>(null)

const { initializeCanvas, clearCanvas } = useCanvas()
const { isInitialized } = useMusicalAudio()

let animationId: number | null = null
let startTime = 0

// Debug logging
const logDebugInfo = () => {
  console.log('=== Canvas Debug Info ===')
  console.log('Canvas element:', canvasRef.value)
  console.log('Canvas dimensions:', canvasWidth.value, 'x', canvasHeight.value)
  console.log('Canvas context:', context.value)
  console.log('Animation ID:', animationId)
  console.log('Audio initialized:', isInitialized.value)
  
  if (canvasRef.value) {
    const rect = canvasRef.value.getBoundingClientRect()
    console.log('Canvas rect:', rect)
    console.log('Canvas style:', {
      display: canvasRef.value.style.display,
      visibility: canvasRef.value.style.visibility,
      width: canvasRef.value.style.width,
      height: canvasRef.value.style.height
    })
  }
}

const initializeCanvasWithDebug = async () => {
  console.log('Initializing canvas...')
  
  await nextTick()
  
  if (!canvasRef.value) {
    console.error('Canvas element not found!')
    return false
  }

  // Get 2D context directly
  const ctx = canvasRef.value.getContext('2d')
  if (!ctx) {
    console.error('Failed to get 2D context!')
    return false
  }

  context.value = ctx
  
  // Set canvas size explicitly
  canvasRef.value.width = canvasWidth.value
  canvasRef.value.height = canvasHeight.value
  
  // Draw test pattern to verify canvas is working
  ctx.fillStyle = '#1F2937'
  ctx.fillRect(0, 0, canvasWidth.value, canvasHeight.value)
  
  // Draw test circle
  ctx.fillStyle = '#10b981'
  ctx.beginPath()
  ctx.arc(canvasWidth.value / 2, canvasHeight.value / 2, 50, 0, Math.PI * 2)
  ctx.fill()
  
  // Draw test text
  ctx.fillStyle = '#ffffff'
  ctx.font = '20px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('Canvas Working!', canvasWidth.value / 2, canvasHeight.value / 2 + 80)
  
  console.log('Canvas initialized successfully!')
  logDebugInfo()
  return true
}

const animate = (timestamp: number) => {
  if (!canvasRef.value || !context.value) {
    console.warn('Animation called but canvas/context not ready')
    return
  }

  if (!startTime) startTime = timestamp
  const elapsed = timestamp - startTime

  // Clear canvas
  context.value.clearRect(0, 0, canvasWidth.value, canvasHeight.value)

  if (props.isPlaying && isInitialized.value) {
    // Draw musical rhythm visualization
    const ctx = context.value
    const centerX = canvasWidth.value / 2
    const centerY = canvasHeight.value / 2
    const radius = Math.min(centerX, centerY) * 0.8

    // Draw main circle
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    ctx.stroke()

    // Draw rotating elements based on time
    const rotationSpeed = 0.001
    const angle = elapsed * rotationSpeed

    for (let i = 0; i < 8; i++) {
      const elementAngle = angle + (i * Math.PI * 2) / 8
      const x = centerX + Math.cos(elementAngle) * radius * 0.7
      const y = centerY + Math.sin(elementAngle) * radius * 0.7

      // Draw circle using canvas API
      ctx.fillStyle = '#10b981'
      ctx.beginPath()
      ctx.arc(x, y, 8, 0, Math.PI * 2)
      ctx.fill()
    }

    // Draw connecting lines
    ctx.strokeStyle = '#6366f1'
    ctx.lineWidth = 1
    for (let i = 0; i < 4; i++) {
      const lineAngle = angle * 0.5 + (i * Math.PI) / 2
      const startX = centerX + Math.cos(lineAngle) * radius * 0.3
      const startY = centerY + Math.sin(lineAngle) * radius * 0.3
      const endX = centerX + Math.cos(lineAngle) * radius * 0.9
      const endY = centerY + Math.sin(lineAngle) * radius * 0.9

      // Draw line using canvas API
      ctx.beginPath()
      ctx.moveTo(startX, startY)
      ctx.lineTo(endX, endY)
      ctx.stroke()
    }
  } else {
    // Draw static state
    const ctx = context.value
    ctx.fillStyle = '#374151'
    ctx.fillRect(0, 0, canvasWidth.value, canvasHeight.value)
    
    ctx.fillStyle = '#9CA3AF'
    ctx.font = '16px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('Click play to start visualization', canvasWidth.value / 2, canvasHeight.value / 2)
  }

  animationId = requestAnimationFrame(animate)
}

onMounted(async () => {
  console.log('Component mounted, initializing...')
  
  // Wait for DOM to be ready
  await nextTick()
  
  const success = await initializeCanvasWithDebug()
  
  if (success) {
    animationId = requestAnimationFrame(animate)
  } else {
    console.error('Failed to initialize canvas!')
  }
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
})

watch(() => props.isPlaying, (newValue) => {
  console.log('Playing state changed:', newValue)
  if (newValue && !animationId) {
    startTime = 0
    animationId = requestAnimationFrame(animate)
  }
})

// Debug function for manual testing
if (typeof window !== 'undefined') {
  (window as any).debugCanvas = () => {
    logDebugInfo()
  }
}
</script>

<style scoped>
.rhythm-visualizer-musical {
  @apply w-full h-full flex items-center justify-center;
}
</style>