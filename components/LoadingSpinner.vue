<template>
  <div class="flex items-center justify-center" :class="containerClass">
    <div class="relative">
      <!-- Outer ring -->
      <div 
        class="animate-spin rounded-full border-2 border-transparent"
        :class="[
          sizeClasses.outer,
          `border-t-${color}-400 border-r-${color}-400`
        ]"
      ></div>
      
      <!-- Inner ring -->
      <div 
        class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-spin rounded-full border-2 border-transparent"
        :class="[
          sizeClasses.inner,
          `border-b-${color}-300 border-l-${color}-300`
        ]"
        style="animation-direction: reverse; animation-duration: 0.8s;"
      ></div>
      
      <!-- Center dot -->
      <div 
        class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full animate-pulse"
        :class="[
          sizeClasses.dot,
          `bg-${color}-500`
        ]"
      ></div>
    </div>
    
    <!-- Loading text -->
    <span v-if="showText" :class="textClass" class="ml-3 animate-pulse">
      {{ text }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'accent' | 'white';
  showText?: boolean;
  text?: string;
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  color: 'primary',
  showText: false,
  text: 'Loading...'
});

const sizeClasses = computed(() => {
  const sizes = {
    sm: {
      outer: 'w-4 h-4',
      inner: 'w-2 h-2',
      dot: 'w-1 h-1'
    },
    md: {
      outer: 'w-8 h-8',
      inner: 'w-4 h-4',
      dot: 'w-2 h-2'
    },
    lg: {
      outer: 'w-12 h-12',
      inner: 'w-6 h-6',
      dot: 'w-3 h-3'
    },
    xl: {
      outer: 'w-16 h-16',
      inner: 'w-8 h-8',
      dot: 'w-4 h-4'
    }
  };
  return sizes[props.size];
});

const containerClass = computed(() => {
  return props.size === 'xl' ? 'p-8' : props.size === 'lg' ? 'p-4' : 'p-2';
});

const textClass = computed(() => {
  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  };
  
  const textColors = {
    primary: 'text-primary-400',
    secondary: 'text-secondary-400',
    accent: 'text-accent-400',
    white: 'text-white'
  };
  
  return `${textSizes[props.size]} ${textColors[props.color]} font-medium`;
});
</script>