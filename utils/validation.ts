import type { ValidationResult } from '~/types';
import { VALIDATION_RULES } from '~/constants';

/**
 * Validates a numeric value against specified constraints
 */
export function validateNumericInput(
  value: number,
  min: number,
  max: number,
  fieldName: string
): ValidationResult {
  const numValue = Number(value);
  
  if (isNaN(numValue)) {
    return {
      isValid: false,
      value: min,
      error: `${fieldName} must be a valid number`
    };
  }
  
  const clampedValue = Math.max(min, Math.min(max, numValue));
  
  return {
    isValid: clampedValue === numValue,
    value: clampedValue,
    error: clampedValue !== numValue ? 
      `${fieldName} must be between ${min} and ${max}` : undefined
  };
}

/**
 * Validates node count input
 */
export function validateNodeCount(value: number): ValidationResult {
  return validateNumericInput(
    value,
    VALIDATION_RULES.NODE_COUNT.min,
    VALIDATION_RULES.NODE_COUNT.max,
    'Node count'
  );
}

/**
 * Validates speed input
 */
export function validateSpeed(value: number): ValidationResult {
  return validateNumericInput(
    value,
    VALIDATION_RULES.BASE_SPEED.min,
    VALIDATION_RULES.BASE_SPEED.max,
    'Speed'
  );
}

/**
 * Validates volume input
 */
export function validateVolume(value: number): ValidationResult {
  return validateNumericInput(
    value,
    VALIDATION_RULES.VOLUME.min,
    VALIDATION_RULES.VOLUME.max,
    'Volume'
  );
}