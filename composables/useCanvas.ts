import { ref, onMounted, onUnmounted } from 'vue';
import { CANVAS_CONSTANTS, ERROR_MESSAGES } from '~/constants';
import { useErrorHandler } from './useErrorHandler';

export function useCanvas() {
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const context = ref<CanvasRenderingContext2D | null>(null);
  const { handleError } = useErrorHandler();

  /**
   * Initializes canvas with proper pixel ratio handling
   */
  const initializeCanvas = () => {
    if (!canvasRef.value) return false;

    const canvas = canvasRef.value;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      handleError(ERROR_MESSAGES.CANVAS_CONTEXT_FAILED);
      return false;
    }

    context.value = ctx;
    resizeCanvas();
    return true;
  };

  /**
   * Handles canvas resize with device pixel ratio for crisp rendering
   */
  const resizeCanvas = () => {
    if (!canvasRef.value || !context.value) return;

    const canvas = canvasRef.value;
    const ctx = context.value;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Set actual size in memory (scaled to account for extra pixel density)
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    // Scale the drawing context so everything draws at the correct size
    ctx.scale(dpr, dpr);

    // Set display size (css pixels)
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
  };

  /**
   * Clears the entire canvas
   */
  const clearCanvas = () => {
    if (!canvasRef.value || !context.value) return;

    const canvas = canvasRef.value;
    const ctx = context.value;
    const dpr = window.devicePixelRatio || 1;

    // Clear using CSS dimensions to account for the DPR scaling
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
  };

  onMounted(() => {
    window.addEventListener('resize', resizeCanvas);
  });

  onUnmounted(() => {
    window.removeEventListener('resize', resizeCanvas);
  });

  return {
    canvasRef,
    context,
    initializeCanvas,
    resizeCanvas,
    clearCanvas
  };
}
