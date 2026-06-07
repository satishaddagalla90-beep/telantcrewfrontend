import { useAuth } from '../../components/auth/AuthContext';
import { Net } from './net';
import { IRequest, ApiResponse } from './types';

function buildHeaders(
    token?: string,
    injectAuth: boolean = true,
    isFormData: boolean = false
): Record<string, string> {
    const headers: Record<string, string> = {};
    
    // Only set Content-Type for non-FormData requests
    if (!isFormData) {
        headers["Content-Type"] = "application/json";
    }
    
    if (injectAuth && token) {
        headers.Authorization = `Bearer ${token}`;
    }
    
    return headers;
}

function dispatchLoader(status: boolean) {
    // You can implement a global loader here
    window.dispatchEvent(new CustomEvent("loaderEvent", { detail: { status } }));
}

function dispatchToaster(
    type: "error" | "success",
    message: string,
    duration = 5000
) {
    // You can implement a global toaster here
    window.dispatchEvent(
        new CustomEvent("toasterEvents", {
            detail: {
                type,
                message,
                ...(type === "error" && { duration, dismissible: true }),
            },
        })
    );
}

export const NetWrapper = async <T>(
    url: string,
    options: IRequest = {
        method: "GET",
        cacheTime: 3600000,
        enableCache: true,
        retries: 3,
    },
    injectAuth = true,
    base: string = process.env.REACT_APP_BASE_URL || "https://tc-py-fastapi-to33v.ondigitalocean.app"
): Promise<ApiResponse<T>> => {
   const authUser = localStorage.getItem('authUser');
    const token = authUser ? JSON.parse(authUser).token : null;

    // Check if the body is FormData
    const isFormData = options.body instanceof FormData;

    if (!options.headers) {
        options.headers = buildHeaders(token, injectAuth, isFormData);
    }

    // Only stringify body if it's not FormData and not GET request
    if (options.method !== "GET" && options.body && typeof options.body === 'object' && !isFormData) {
        options.body = JSON.stringify(options.body);
    }

    dispatchLoader(true);

    const { data, error, status } = await Net<T>(url, options, base);
    const showToaster = options.showToaster ?? true;

    if (error && showToaster) {
        dispatchToaster("error", error.message || "An error occurred");
    } else if (data && (data as any).message && showToaster) {
        dispatchToaster("success", (data as any).message || "Success", 2000);
    }

    dispatchLoader(false);

    return { data, error, status };
};
