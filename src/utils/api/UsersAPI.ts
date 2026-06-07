import { apiCall } from './useSWR';
import { API_ENDPOINTS } from './endpoints';

export interface UserSearchParams {
    email?: string;
    username?: string;
    phone_no?: string;
    excludeId?: string;
}

export interface DuplicateUser {
    _id: string;
    username: string;
    email: string;
    phone_no?: string;
    first_name: string;
    last_name: string;
    display_name?: string;
}

export interface CheckUserDuplicatesResponse {
    duplicates: DuplicateUser[];
    found: boolean;
}

// Users API utility functions
export const usersAPI = {
    /**
     * Check for duplicate users by email, username, or phone
     */
    checkDuplicates: async (params: UserSearchParams): Promise<CheckUserDuplicatesResponse> => {
        const response = await apiCall<CheckUserDuplicatesResponse>(API_ENDPOINTS.USERS.CHECK_DUPLICATES, {
            method: 'POST',
            body: JSON.stringify(params),
        });

        if (response.error) {
            throw new Error(response.error.message || 'Failed to check for duplicates');
        }

        return response.data || {
            duplicates: [],
            found: false,
        };
    },
    // Delete single user by ID
    deleteUser: async (userId: string): Promise<{ success: boolean; message: string }> => {
        try {
            const response = await apiCall<{ success: boolean; message: string }>(`/users/${userId}`, {
                method: 'DELETE',
            });
            if (response.error) {
                throw new Error(response.error.message);
            }
            return response.data!;
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    },

    // Delete multiple users using individual user deletion
    deleteUsers: async (ids: string[]): Promise<{ success: boolean; message: string; failed?: string[] }> => {
        try {
            // Helper function to delete individual user
            const deleteSingleUser = async (userId: string): Promise<{ success: boolean; message: string }> => {
                try {
                    const response = await apiCall<{ success: boolean; message: string }>(`/users/${userId}`, {
                        method: 'DELETE',
                    });
                    if (response.error) {
                        throw new Error(response.error.message);
                    }
                    return response.data!;
                } catch (error) {
                    console.error(`Error deleting user ${userId}:`, error);
                    throw error;
                }
            };

            const results = await Promise.allSettled(
                ids.map(id => deleteSingleUser(id))
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
                    message: `Successfully deleted ${successCount} user(s).`
                };
            } else if (successCount === 0) {
                return {
                    success: false,
                    message: `Failed to delete all ${ids.length} user(s).`,
                    failed: failedIds
                };
            } else {
                return {
                    success: true,
                    message: `Successfully deleted ${successCount} user(s). Failed to delete ${failedIds.length} user(s).`,
                    failed: failedIds
                };
            }
        } catch (error) {
            console.error('Error deleting users:', error);
            return {
                success: false,
                message: 'An unexpected error occurred while deleting users.',
            };
        }
    },

    // Update user by ID using PATCH API
    updateUser: async (userId: string, userData: any): Promise<{ success: boolean; message: string; user?: any }> => {
        try {
            const response = await apiCall<any>(`/users/${userId}`, {
                method: 'PATCH',
                body: JSON.stringify(userData),
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            
            if (response.error) {
                throw new Error(response.error.message);
            }
            
            // The API returns the updated user object directly
            const updatedUser = response.data;
            
            return {
                success: true,
                message: 'User updated successfully',
                user: updatedUser
            };
        } catch (error) {
            console.error('Error updating user:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Failed to update user',
            };
        }
    },
};
