import { IRequest, FetchState } from './types';

const cacheMap = new Map();
const inFlightMap = new Map<string, Promise<FetchState<any>>>();

const extractErrorMessage = (result: any, res: Response) => {
    return typeof result == "string"
        ? result
        : result?.message ||
        result?.detail ||
        (typeof result?.data === "string"
            ? result?.data
            : result.error &&
                result.error.message &&
                typeof result.error.message === "string"
                ? result.error.message
                : null) ||
        res.statusText;
};

export function Cache<T = any>(cacheTimeInSecs = 3600000) {
    function getCache(key: string): T {
        return cacheMap.get(key);
    }

    function setCache(key: string, value: T) {
        cacheMap.set(key, value);

        setTimeout(() => {
            cacheMap.delete(key);
        }, cacheTimeInSecs);
    }
    return { getCache, setCache };
}

export async function Net<T>(
    url: string,
    options: IRequest = {
        method: "GET",
        cacheTime: 3600000,
        enableCache: true,
        retries: 3,
    },
    base = ""
): Promise<FetchState<T>> {
    const cache = Cache(options.cacheTime);

    const serializeRequestBody = (requestOptions: IRequest) => {
        if (!requestOptions.body) return "";
        if (typeof requestOptions.body === "string") return requestOptions.body;
        try {
            return JSON.stringify(requestOptions.body);
        } catch {
            return "";
        }
    };

    const getRequestKey = (requestUrl: string, requestOptions: IRequest, requestBase: string) => {
        const method = (requestOptions.method || "GET").toUpperCase();
        const body = method === "GET" ? "" : serializeRequestBody(requestOptions);
        return `${method}:${requestBase}${requestUrl}:${body}`;
    };

    const invoke = async (url: string, options: IRequest): Promise<FetchState<T>> => {
        if (
            options.enableCache &&
            options.method?.toLowerCase() === "get" &&
            cache.getCache(url)
        ) {
            return cache.getCache(url);
        } else {
            const shouldDedupe = options.method?.toLowerCase() === "get";
            const requestKey = shouldDedupe ? getRequestKey(url, options, base) : "";

            if (shouldDedupe) {
                const inFlight = inFlightMap.get(requestKey) as Promise<FetchState<T>> | undefined;
                if (inFlight) {
                    return inFlight;
                }
            }

            try {
                const fetchPromise = (async () => {
                    try {
                        const res = await fetch(base + url, options);
                        const contentType = res.headers.get("content-type");

                        const result = contentType?.toLowerCase().includes("text/plain")
                            ? await res.text()
                            : await res.json();

                        if (res.status === 401 || res.status === 403) {
                            return {
                                data: null,
                                status: res.status,
                                error: {
                                    data: result,
                                    message: extractErrorMessage(result, res),
                                    status: res.status,
                                },
                                refetch: () => invoke(url, options),
                            };
                        }

                        if (res.status >= 500 && res.status <= 599) {
                            return {
                                data: null,
                                status: res.status,
                                error: {
                                    data: result,
                                    message: extractErrorMessage(result, res),
                                    status: res.status,
                                },
                                refetch: () => invoke(url, options),
                            };
                        }

                        if (res.ok) {
                            const responseData = {
                                data: result,
                                status: res.status,
                                error: null,
                                refetch: () => invoke(url, options),
                            };

                            if (options.method?.toLowerCase() === "get") {
                                cache.setCache(url, responseData);
                            }
                            return responseData;
                        }

                        return {
                            data: null,
                            status: res.status,
                            error: {
                                data: result,
                                message: extractErrorMessage(result, res),
                                status: res.status,
                            },
                            refetch: () => invoke(url, options),
                        };
                    } catch (e: any) {
                        return {
                            data: null,
                            status: 0,
                            error: { data: e, message: e.message || "Network error", status: 0 },
                            refetch: () => invoke(url, options),
                        };
                    }
                })();

                if (shouldDedupe) {
                    inFlightMap.set(requestKey, fetchPromise);
                    fetchPromise.finally(() => {
                        inFlightMap.delete(requestKey);
                    });
                }

                return fetchPromise;
            } catch (e: any) {
                return {
                    data: null,
                    status: 0,
                    error: { data: e, message: e.message || "Network error", status: 0 },
                    refetch: () => invoke(url, options),
                };
            }
        }
    };

  return invoke(url, options);
}

/**
 * Clears the entire Net utility cache.
 * Useful for ensuring cross-page consistency after data mutations.
 */
export function clearNetCache() {
    cacheMap.clear();
}
