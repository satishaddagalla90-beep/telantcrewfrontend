import React, { createContext, useContext, useEffect, useState } from 'react';
import AuthApiService, { UserData } from '../../services/authService';

interface AuthContextType {
    user: UserData | null;
    loading: boolean;
    login: () => void;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode; }> = ({ children }) => {
    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            const accessToken = localStorage.getItem('accessToken');

            if (accessToken) {
                try {
                    const userData = await AuthApiService.getCurrentUser();
                    if (userData) {
                        setUser(userData);
                    } else {
                        // Invalid token, clear storage
                        AuthApiService.clearTokens();
                    }
                } catch (error) {
                    console.error('Auth initialization failed:', error);
                    AuthApiService.clearTokens();
                }
            }

            setLoading(false);
        };

        initAuth();
    }, []);

    const login = () => {
        AuthApiService.initiateGoogleLogin();
    };

    const logout = () => {
        setUser(null);
        AuthApiService.logout();
    };

    const value = {
        user,
        login,
        logout,
        loading,
        isAuthenticated: !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
