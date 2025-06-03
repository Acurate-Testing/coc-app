import { useState, useCallback } from "react";

/**
 * Custom hook for managing loading states
 * @returns {Object} Loading state and handlers
 */
export const useLoadingState = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>("");

  /**
   * Wraps an async function with loading state
   * @param {Function} asyncFn - The async function to wrap
   * @param {string} message - Optional loading message
   * @returns {Promise} The result of the async function
   */
  const withLoading = useCallback(
    async <T>(
      asyncFn: () => Promise<T>,
      message: string = "Loading..."
    ): Promise<T> => {
      try {
        setIsLoading(true);
        setLoadingMessage(message);
        const result = await asyncFn();
        return result;
      } finally {
        setIsLoading(false);
        setLoadingMessage("");
      }
    },
    []
  );

  return {
    isLoading,
    loadingMessage,
    withLoading,
  };
}; 