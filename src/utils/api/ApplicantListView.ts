import { apiCall } from './useSWR';
import { CandidateData } from '../../types/candidate';

// Candidate API Response Types
export interface CandidateAPIResponse {
    page: number;
    limit: number;
    total_candidates: number;
    total_pages: number;
    candidates: CandidateData[];
}

// API functions
export const applicantListAPI = {
    // Fetch candidates with pagination and filters
    fetchApplicants: async (
        page: number = 1,
        limit: number = 10,
        filters: Record<string, string | null> = {}
    ): Promise<CandidateAPIResponse> => {
        try {
            // Build query parameters
            const params = new URLSearchParams();
            params.append('page', page.toString());
            params.append('limit', limit.toString());

            // Add filter parameters
            Object.entries(filters).forEach(([key, value]) => {
                if (value && value.trim()) {
                    switch (key) {
                        case 'search':
                            params.append('search', value);
                            break;
                        case 'panNumber':
                            params.append('pan_number', value);
                            break;
                        case 'email':
                            params.append('email', value);
                            break;
                        case 'phone':
                            params.append('phone', value);
                            break;
                        // Add other filters as needed
                        default:
                            // For any additional filters, use the key as-is
                            params.append(key, value);
                    }
                }
            });

            const url = `/candidates/?${params.toString()}`;
            const response = await apiCall<CandidateAPIResponse>(url, {
                method: 'GET',
            });
            if (response.error) {
                throw new Error(response.error.message);
            }
            return response.data!;
        } catch (error) {
            console.error('Error fetching applicants:', error);
            throw error;
        }
    },

    // Fetch single applicant by ID
    fetchApplicantById: async (id: string): Promise<CandidateData> => {
        try {
            const response = await apiCall<CandidateData>(`/candidates/${id}`, {
                method: 'GET',
            });
            if (response.error) {
                throw new Error(response.error.message);
            }
            return response.data!;
        } catch (error) {
            console.error('Error fetching applicant:', error);
            throw error;
        }
    },

    // Delete single candidate by ID
    deleteCandidate: async (candidateId: string): Promise<{ success: boolean; message: string; }> => {
        try {
            const response = await apiCall<{ success: boolean; message: string; }>(`/candidates/${candidateId}`, {
                method: 'DELETE',
            });
            if (response.error) {
                throw new Error(response.error.message);
            }
            return response.data!;
        } catch (error) {
            console.error('Error deleting candidate:', error);
            throw error;
        }
    },

    // Delete multiple applicants using individual candidate deletion
    deleteApplicants: async (ids: string[]): Promise<{ success: boolean; message: string; failed?: string[]; }> => {
        try {
            // Helper function to delete individual candidate
            const deleteSingleCandidate = async (candidateId: string): Promise<{ success: boolean; message: string; }> => {
                try {
                    const response = await apiCall<{ success: boolean; message: string; }>(`/candidates/${candidateId}`, {
                        method: 'DELETE',
                    });
                    if (response.error) {
                        throw new Error(response.error.message);
                    }
                    return response.data!;
                } catch (error) {
                    console.error(`Error deleting candidate ${candidateId}:`, error);
                    throw error;
                }
            };

            const results = await Promise.allSettled(
                ids.map(id => deleteSingleCandidate(id))
            );

            const successCount = results.filter(result => result.status === 'fulfilled').length;
            const failedIds: string[] = [];

            results.forEach((result, index) => {
                if (result.status === 'rejected') {
                    failedIds.push(ids[index]);
                }
            });

            if (failedIds.length === 0) {
                return {
                    success: true,
                    message: `Successfully deleted ${successCount} candidate(s).`
                };
            } else if (successCount === 0) {
                return {
                    success: false,
                    message: `Failed to delete all ${ids.length} candidate(s).`,
                    failed: failedIds
                };
            } else {
                return {
                    success: true,
                    message: `Successfully deleted ${successCount} candidate(s). Failed to delete ${failedIds.length} candidate(s).`,
                    failed: failedIds
                };
            }
        } catch (error) {
            console.error('Error deleting applicants:', error);
            return {
                success: false,
                message: 'An unexpected error occurred while deleting candidates.',
            };
        }
    },
};
