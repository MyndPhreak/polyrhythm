import { ref } from 'vue';

interface ErrorState {
  hasError: boolean;
  message: string;
  timestamp: number;
}

export function useErrorHandler() {
  const error = ref<ErrorState | null>(null);

  /**
   * Handles and logs errors with user-friendly messages
   */
  const handleError = (err: Error | string, context?: string) => {
    const message = typeof err === 'string' ? err : err.message;
    const fullMessage = context ? `${context}: ${message}` : message;
    
    console.error('Application Error:', fullMessage, err);
    
    error.value = {
      hasError: true,
      message: fullMessage,
      timestamp: Date.now()
    };
  };

  /**
   * Clears the current error state
   */
  const clearError = () => {
    error.value = null;
  };

  /**
   * Wraps async operations with error handling
   */
  const withErrorHandling = async <T>(
    operation: () => Promise<T>,
    context?: string
  ): Promise<T | null> => {
    try {
      return await operation();
    } catch (err) {
      handleError(err as Error, context);
      return null;
    }
  };

  return {
    error: readonly(error),
    handleError,
    clearError,
    withErrorHandling
  };
}