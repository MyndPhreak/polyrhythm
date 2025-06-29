<template>
  <svg 
    :class="class"
    :width="size" 
    :height="size" 
    viewBox="0 0 24 24" 
    fill="currentColor"
    :aria-hidden="true"
    class="transition-all duration-200"
  >
    <!-- Play Icon -->
    <path v-if="name === 'play'" d="M8 5v14l11-7z" class="drop-shadow-sm"/>
    
    <!-- Pause Icon -->
    <g v-else-if="name === 'pause'">
      <rect x="6" y="4" width="4" height="16" class="drop-shadow-sm"/>
      <rect x="14" y="4" width="4" height="16" class="drop-shadow-sm"/>
    </g>
    
    <!-- Reset Icon -->
    <path v-else-if="name === 'reset'" d="M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8c-.45-.83-.7-1.79-.7-2.8 0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z" class="drop-shadow-sm"/>
    
    <!-- Error Icon -->
    <path v-else-if="name === 'error'" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" class="drop-shadow-sm"/>
    
    <!-- Close Icon -->
    <path v-else-if="name === 'close'" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" class="drop-shadow-sm"/>
    
    <!-- Default fallback -->
    <circle v-else cx="12" cy="12" r="10" class="drop-shadow-sm"/>
  </svg>
</template>

<script setup lang="ts">
interface Props {
  name: 'play' | 'pause' | 'reset' | 'error' | 'close';
  size?: number | string;
  class?: string;
}

withDefaults(defineProps<Props>(), {
  size: 24,
  class: ''
});
</script>