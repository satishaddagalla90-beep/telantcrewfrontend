import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook to debounce a value
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds
 * @returns The debounced value
 */
export const useDebounce = <T>(value: T, delay: number): T => {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
};

/**
 * Custom hook to debounce a callback function
 * @param callback - The callback function to debounce
 * @param delay - The delay in milliseconds
 * @returns The debounced callback function
 */
export const useDebouncedCallback = <T extends (...args: any[]) => any>(
    callback: T,
    delay: number
): T => {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const debouncedCallback = useCallback(
        (...args: Parameters<T>) => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            timeoutRef.current = setTimeout(() => {
                callback(...args);
            }, delay);
        },
        [callback, delay]
    ) as T;

    // Clean up timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return debouncedCallback;
};

/**
 * Custom hook for debounced async search functionality
 * @param searchFunction - The async search function to debounce
 * @param delay - The delay in milliseconds (default: 300ms)
 * @returns Object with debouncedSearch function and loading state
 */
export const useDebouncedAsyncSearch = <T>(
    searchFunction: (value: string) => Promise<T>,
    delay: number = 300
) => {
    const [loading, setLoading] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const latestCallRef = useRef<number>(0);

    const debouncedSearch = useCallback(
        async (value: string): Promise<T | void> => {
            // Clear any existing timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            // Increment call counter to track latest call
            const currentCall = ++latestCallRef.current;

            return new Promise((resolve, reject) => {
                timeoutRef.current = setTimeout(async () => {
                    // Only proceed if this is still the latest call
                    if (currentCall !== latestCallRef.current) {
                        return;
                    }

                    setLoading(true);
                    try {
                        const result = await searchFunction(value);

                        // Check again if this is still the latest call before resolving
                        if (currentCall === latestCallRef.current) {
                            resolve(result);
                        }
                    } catch (error) {
                        // Check again if this is still the latest call before rejecting
                        if (currentCall === latestCallRef.current) {
                            reject(error);
                        }
                    } finally {
                        // Only set loading to false if this is still the latest call
                        if (currentCall === latestCallRef.current) {
                            setLoading(false);
                        }
                    }
                }, delay);
            });
        },
        [searchFunction, delay]
    );

    // Clean up timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return {
        debouncedSearch,
        loading
    };
};
