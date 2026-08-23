import { cerebro } from "./cerebroEngine";
import { AppError } from "@/utils/resilience";

/**
 * Legacy wrapper for the high-availability Cerebro AI Engine.
 * Provides backward compatibility while enabling massive scalability.
 */
export const getAIResponse = async (query: string, context: any): Promise<string> => {
  try {
    const result = await cerebro.generateResponse(query, context);
    return result.text;
  } catch (error: any) {
    throw new AppError(
      error.message || "AI Service Unavailable",
      "The neural engine is currently re-balancing or has exhausted all available nodes. Please try again in 60 seconds.",
      "geminiService.getAIResponse"
    );
  }
};

/**
 * Dev-only mock. The previous `simulateAIResponse` export was a 1-line alias
 * to `getAIResponse` and served no purpose — callers should just use
 * `getAIResponse` directly. This stub is kept behind a DEV guard for tests
 * that want to bypass the live API.
 */
export const simulateAIResponseDev = async (query: string, context: any): Promise<string> => {
  if (!import.meta.env.DEV) {
    throw new Error('simulateAIResponseDev is dev-only');
  }
  return getAIResponse(query, context);
};
