// Authentication API Service
const API_BASE_URL = 'https://tc-py-fastapi-to33v.ondigitalocean.app';

// Custom error class for user status validation
class UserStatusError extends Error {
    constructor(message: string, public status: string) {
        super(message);
        this.name = 'UserStatusError';
    }
}

// Custom error class for user not found scenarios
class UserNotFoundError extends Error {
    constructor(message: string, public email: string) {
        super(message);
        this.name = 'UserNotFoundError';
    }
}

interface AuthTokens {
    access_token: string;
    refresh_token: string;
}

interface AvatarObject {
    file_url: string;
    file_name: string;
    file_type: string;
    file_category: string;
    uploaded_at: string;
    status: string;
    code: number;
}

interface UserData {
    _id: string;
    id?: string;
    email: string;
    username?: string;
    first_name: string;
    last_name: string;
    middle_name?: string;
    phone_no?: string;
    display_name: string;
    department?: string[];
    designation?: string;
    location?: string;
    reporting_to?: any[];
    role?: string[];
    avatar?: string | AvatarObject;
    organization?: string;
    status: string; // Status field to track user's active/inactive state
    emailVisibility?: boolean;
    created?: string;
    updated?: string;
    permission?: {
        candidate: string;
        client: string;
        job: string;
        supplier: string;
        users: string;
    };
    additionalProp1?: any;
    passwordConfirm?: any;
}

class AuthApiService {
    static getAuthHeaders() {
        const token = localStorage.getItem('accessToken');
        return {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        };
    }

    static async refreshToken(): Promise<AuthTokens> {
        const refreshToken = localStorage.getItem('refreshToken');

        if (!refreshToken) {
            throw new Error('No refresh token available');
        }

        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken })
        });

        if (!response.ok) {
            throw new Error('Token refresh failed');
        }

        const data = await response.json();
        localStorage.setItem('accessToken', data.access_token);
        localStorage.setItem('refreshToken', data.refresh_token);
        const authUser = localStorage.getItem('authUser');
        if (authUser) {
            try {
                const parsed = JSON.parse(authUser);
                parsed.token = data.access_token;
                localStorage.setItem('authUser', JSON.stringify(parsed));
            } catch (e) {
                console.error('Failed to update authUser after token refresh', e);
            }
        }

        return data;
    }

    static async getCurrentUser(): Promise<UserData | null> {
        try {

            const response = await fetch(`${API_BASE_URL}/auth/get-user`, {
                headers: this.getAuthHeaders()
            });



            if (response.status === 401) {

                try {
                    await this.refreshToken();
                    // Retry with new token
                    return this.getCurrentUser();
                } catch (refreshError) {
                    console.error('Token refresh failed:', refreshError);
                    this.clearTokens();
                    return null;
                }
            }

            if (!response.ok) {
                console.error('AuthService - getCurrentUser failed:', response.status, response.statusText);
                throw new Error(`Failed to fetch user data: ${response.statusText}`);
            }

            const userData = await response.json();

            // Check user status - if user becomes inactive, logout immediately
            if (userData && userData.status?.toLowerCase() !== 'active') {
                console.warn('User status is not active:', userData.status);
                this.clearTokens();
                throw new UserStatusError(
                    'Your account has been deactivated. Please contact admin for assistance.',
                    userData.status
                );
            }

            return userData;
        } catch (error) {
            console.error('Error fetching user:', error);
            throw error;
        }
    }

    static initiateGoogleLogin(): void {
        // Add some state for security
        const state = Math.random().toString(36).substring(2, 15);
        localStorage.setItem('authState', state);

        // Redirect to backend OAuth endpoint
        window.location.href = `${API_BASE_URL}/auth/google?state=${state}`;
    }

    static handleUserNotInSystem(email: string): never {
        throw new UserNotFoundError(
            `User with email ${email} is not registered in the system. Please contact your administrator to get access.`,
            email
        );
    }

    static async handleAuthCallback(accessToken: string, refreshToken: string): Promise<UserData> {

        // Store tokens
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);


        // Fetch user data

        const userData = await this.getCurrentUser();

        if (!userData) {
            throw new Error('Failed to fetch user data after authentication');
        }

        // Check user status - only allow active users to login
        if (userData.status?.toLowerCase() !== 'active') {
            // Clear tokens for inactive users
            this.clearTokens();
            throw new UserStatusError(
                'Please contact admin, you don\'t have permission to login',
                userData.status
            );
        }

        // Store user data in old authUser format for compatibility with user's preferred logic
        localStorage.setItem('authUser', JSON.stringify({
            token: accessToken,
            user: userData
        }));
        return userData;
    }

    static clearTokens(): void {


        // Remove all authentication-related items from localStorage
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('authState');
        localStorage.removeItem('authUser');

        // Clear any other auth-related data that might be stored
        // (add more items here if you store additional auth data)


    }

    static logout(): void {
        // Clear all authentication data
        this.clearTokens();

        // Force redirect to login page

        window.location.href = '/login';
    }

    static isAuthenticated(): boolean {
        return !!localStorage.getItem('accessToken');
    }

    // Debug method to check authentication state
    static getAuthenticationState(): {
        hasAccessToken: boolean;
        hasRefreshToken: boolean;
        hasAuthState: boolean;
        isAuthenticated: boolean;
    } {
        return {
            hasAccessToken: !!localStorage.getItem('accessToken'),
            hasRefreshToken: !!localStorage.getItem('refreshToken'),
            hasAuthState: !!localStorage.getItem('authState'),
            isAuthenticated: this.isAuthenticated()
        };
    }
}

export default AuthApiService;
export type { UserData, AuthTokens };
export { UserStatusError, UserNotFoundError };
