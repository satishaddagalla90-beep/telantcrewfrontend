import { apiCall } from './useSWR';
import { API_ENDPOINTS } from './endpoints';

export interface ClientSearchParams {
    pan?: string;
    email?: string;
    phone?: string;
    excludeId?: string;
}

export interface DuplicateClient {
    _id?: string;
    id?: string;
    client_name: string;
    financial_details?: {
        pan: string;
    };
    pan?: string; // Keep for backward compatibility if needed
    contacts?: Array<{
        email: string;
        phone_no: string;
    }>;
}

export interface CheckClientDuplicatesResponse {
    duplicates: DuplicateClient[];
    found: boolean;
}

export const clientsAPI = {
    /**
     * Check for duplicate clients by PAN, Email or Phone
     */
    checkDuplicates: async (params: ClientSearchParams): Promise<CheckClientDuplicatesResponse> => {
        // Construct body based on available parameters
        const body: Record<string, string> = {};
        if (params.pan) body.pan = params.pan;
        if (params.email) body.email = params.email;
        if (params.phone) body.phone_no = params.phone;

        const response = await apiCall<CheckClientDuplicatesResponse>(API_ENDPOINTS.CLIENTS.CHECK_DUPLICATES, {
            method: 'POST',
            body: JSON.stringify(body),
        });

        if (response.error) {
            throw new Error(response.error.message || 'Failed to check for duplicates');
        }

        const data: any = response.data;
        if (!data) {
            return { duplicates: [], found: false };
        }

        // Scenario 1: Standard format { duplicates: [...] }
        if (data.duplicates && Array.isArray(data.duplicates)) {
            return {
                duplicates: data.duplicates,
                found: data.duplicates.length > 0
            };
        }

        // Scenario 2: Array response [ ... ]
        if (Array.isArray(data)) {
            return {
                duplicates: data,
                found: data.length > 0
            };
        }

        // Scenario 3: Single object response (as seen in some screenshots)
        if (data._id || data.id || data.client_name) {
            return {
                duplicates: [data],
                found: true
            };
        }

        return {
            duplicates: [],
            found: false,
        };
    },
};
