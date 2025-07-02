<template>
  <div class="rhythm-visualizer-musical">
    <canvas
      ref="canvasRef"
      :width="canvasWidth"
      :height="canvasHeight"
      class="w-full h-full border border-gray-300 rounded-lg"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useCanvas } from '~/composables/useCanvas'
import { useMusicalAudio } from '~/composables/useMusicalAudio'

interface Props {
  width?: number
  height?: number
  isPlaying?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  width: 800,
  height: 400,
  isPlaying: false
})

const canvasRef = ref<HTMLCanvasElement>()
const canvasWidth = ref(props.width)
const canvasHeight = ref(props.height)

const { initializeCanvas, clearCanvas } = useCanvas()
const { audioContext, isInitialized } = useMusicalAudio()

let animationId: number | null = null
let startTime = 0

const animate = (timestamp: number) => {
  if (!canvasRef.value) return

  if (!startTime) startTime = timestamp
  const elapsed = timestamp - startTime

  clearCanvas(canvasRef.value)

  if (props.isPlaying && isInitialized.value) {
    // Draw musical rhythm visualization
    const ctx = canvasRef.value.getContext('2d')
    if (ctx) {
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
    }
  }

  animationId = requestAnimationFrame(animate)
}

onMounted(() => {
  if (canvasRef.value) {
    initializeCanvas()
    animationId = requestAnimationFrame(animate)
  }
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
})

watch(() => props.isPlaying, (newValue) => {
  if (newValue && !animationId) {
    startTime = 0
    animationId = requestAnimationFrame(animate)
  }
})
</script>

<style scoped>
.rhythm-visualizer-musical {
  @apply w-full h-full flex items-center justify-center;
}
</style>