export class AppError extends Error {
  solution: string;
  moduleTrace: string;

  constructor(message: string, solution: string, moduleTrace: string) {
    super(message);
    this.name = 'AppError';
    this.solution = solution;
    this.moduleTrace = moduleTrace;
  }
}

/**
 * Retries an async function up to maxRetries times before throwing.
 */
export const withRetry = async <T>(
  fn: () => Promise<T>,
  moduleTrace: string,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> => {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (error: any) {
      attempt++;
      if (attempt >= maxRetries) {
        // If it's already an AppError, rethrow it, else wrap it
        if (error instanceof AppError) throw error;
        
        throw new AppError(
          error.message || 'An unexpected error occurred.',
          'Please check your internet connection or contact technical support.',
          moduleTrace
        );
      }
      // Wait before retrying (exponential backoff could be added here)
      await new Promise(res => setTimeout(res, delayMs * attempt));
    }
  }
  throw new Error('Unreachable code');
};

/**
 * Helper to wrap UI errors for toast notifications
 *
 * The internal `moduleTrace` (which can leak internal module names) is
 * intentionally excluded from the user-facing string — it is still attached
 * to the AppError instance for dev-time inspection.
 */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof AppError) {
    if (typeof console !== 'undefined' && console.debug) {
      console.debug('[AppError moduleTrace]', error.moduleTrace);
    }
    return `Error: ${error.message}\nSolution: ${error.solution}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unknown error occurred.';
};
