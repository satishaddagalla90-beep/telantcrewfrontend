import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../components/auth/AuthContext';
import { Net } from './net';
import { IRequest, IError, FetchState } from './types';

const getError = (error: any): IError | null => {
    if (!error) return null;
    const { status } = error;

    const message = error.message || error.data?.message || 'Something went wrong';

    switch (status) {
        case 400:
            return { status, message: message || "Bad Request" };
        case 401:
            return { status, message: message || "Unauthorized" };
        case 403:
            return { status, message: message || "Forbidden resource" };
        case 404:
            return { status, message: message || "Resource not found" };
        case 500:
            return { status, message: message || "Internal Server Error" };
        default:
            return { message: message || "Something went wrong", status };
    }
};

export function useAPI<DataType>(
    url: string | null,
    options: IRequest = {
        method: "GET",
        cacheTime: 3600000,
        enableCache: true,
        retries: 3,
    },
    baseURL: string = process.env.REACT_APP_BASE_URL || "https://tc-py-fastapi-to33v.ondigitalocean.app"
) {
    const { user, logout } = useAuth();
    const [data, setData] = useState<DataType | null>(null);
    const [error, setError] = useState<IError | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [isValidating, setIsValidating] = useState<boolean>(false); // Background refresh indicator

    // Stabilize options object to prevent unnecessary re-renders
    const stableOptions = useMemo(() => ({
        method: options.method || "GET",
        cacheTime: options.cacheTime || 3600000,
        enableCache: options.enableCache !== false,
        retries: options.retries || 3,
        ...options
    }), [options.method, options.cacheTime, options.enableCache, options.retries, JSON.stringify(options.body)]);

    const buildHeaders = useCallback((): RequestInit => {
        // For now, get token from localStorage until auth system is fully integrated
        // Get the token from localStorage (standard key used by Auth system)
        const authUser = localStorage.getItem('authUser');
        const token = authUser ? JSON.parse(authUser).token : null;

        return {
            headers: {
                "Content-Type": "application/json",
                ...(token && { Authorization: `Bearer ${token}` }),
            },
            method: stableOptions.method,
            ...(stableOptions.body && { body: typeof stableOptions.body === 'string' ? stableOptions.body : JSON.stringify(stableOptions.body) }),
        };
    }, [stableOptions.method, stableOptions.body]);

    const fetcher = useCallback(async (fetchUrl: string): Promise<DataType> => {
        setLoading(true);
        setError(null);

        try {
            const requestOptions = {
                ...stableOptions,
                ...buildHeaders(),
            };

            const result = await Net<DataType>(fetchUrl, requestOptions, baseURL);

            if (result.error) {
                const processedError = getError(result.error);
                setError(processedError);

                // Handle 401 errors by logging out
                if (result.error.status === 401) {
                    logout();
                }

                throw result.error;
            }

            setData(result.data);
            return result.data as DataType;
        } catch (err: any) {
            const processedError = getError(err);
            setError(processedError);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [baseURL, stableOptions, buildHeaders, logout]);

    const mutate = useCallback(async (newData?: DataType | Promise<DataType>) => {
        if (newData) {
            if (newData instanceof Promise) {
                const resolvedData = await newData;
                setData(resolvedData);
                return resolvedData;
            } else {
                setData(newData);
                return newData;
            }
        } else if (url) {
            // When called without data, bypass cache like refetch
            setLoading(true);
            setError(null);

            try {
                const requestOptions = {
                    ...stableOptions,
                    enableCache: false, // Bypass cache for mutate without data
                    ...buildHeaders(),
                };

                const result = await Net<DataType>(url, requestOptions, baseURL);

                if (result.error) {
                    const processedError = getError(result.error);
                    setError(processedError);

                    if (result.error.status === 401) {
                        logout();
                    }

                    throw result.error;
                }

                setData(result.data);
                return result.data as DataType;
            } catch (err: any) {
                const processedError = getError(err);
                setError(processedError);
                throw err;
            } finally {
                setLoading(false);
            }
        }
    }, [url, stableOptions, buildHeaders, baseURL, logout]);

    const refetch = useCallback(async (useValidatingState = false) => {
        if (url) {
            // Use isValidating for background refreshes, loading for initial fetches
            if (useValidatingState) {
                setIsValidating(true);
            } else {
                setLoading(true);
            }
            setError(null);

            try {
                // Force fresh API call by disabling cache
                const requestOptions = {
                    ...stableOptions,
                    enableCache: false, // Bypass cache for refetch
                    ...buildHeaders(),
                };

                const result = await Net<DataType>(url, requestOptions, baseURL);

                if (result.error) {
                    const processedError = getError(result.error);
                    setError(processedError);

                    if (result.error.status === 401) {
                        logout();
                    }

                    throw result.error;
                }

                setData(result.data);
                return result.data as DataType;
            } catch (err: any) {
                const processedError = getError(err);
                setError(processedError);
                throw err;
            } finally {
                if (useValidatingState) {
                    setIsValidating(false);
                } else {
                    setLoading(false);
                }
            }
        }
        return null;
    }, [url, stableOptions, buildHeaders, baseURL, logout]);

    useEffect(() => {
        if (url) {
            console.log('📡 useAPI fetching:', url);
            fetcher(url).catch(() => {
                // Error handling is done in fetcher
            });
        }
    }, [url, fetcher]);


    return {
        data,
        error,
        loading,
        mutate,
        refetch,
        isValidating, // True when background refresh is happening (shows cached data + spinner)
    };
}
