import { useAPI } from './useAPI';
import { NetWrapper } from './netWrapper';
import { IRequest } from './types';

// Hook for SWR-like functionality
export const useSWR = <T>(
    path: string | null,
    options?: IRequest
) => {
    const { data, error, loading, mutate, refetch, isValidating } = useAPI<T>(
        path,
        options
    );

    return {
        data,
        error,
        loading,
        mutate,
        refetch,
        isValidating,
    };
};

// Direct API caller (for mutations, one-time calls)
export const apiCall = async <T>(
    path: string,
    options?: IRequest,
    injectAuth = true
) => {
    return NetWrapper<T>(path, options, injectAuth);
};
