"use client";

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../atoms/Button/Button";
import Card from "../../molecules/Card/Card";
import Logo from "../../atoms/Logo/Logo";
import Icon from "../../atoms/Icon/Icon";
import { useAuth } from "../../auth/AuthContext";

const ORG_NAME = "TalentCrew";

const Login: React.FC = () => {
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const { login, isAuthenticated, loading } = useAuth();
    const navigate = useNavigate();

    // Redirect to home if already authenticated
    useEffect(() => {
        if (!loading && isAuthenticated) {
            navigate('/', { replace: true });
        }
    }, [isAuthenticated, loading, navigate]);

    // Show loading if still checking authentication
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="flex justify-center mb-6">
                        <div className="bg-white p-4 rounded-2xl shadow-lg">
                            <Logo src={'/logo_black.png'} alt={`${ORG_NAME} Logo`} size="md" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
                        <div className="flex items-center justify-center mb-4">
                            <Icon name="loading" size={32} className="animate-spin text-blue-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            Checking Authentication...
                        </h2>
                        <p className="text-gray-600">
                            Please wait while we verify your login status.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setErrors({});

        try {
            // Initiate Google OAuth flow
            login();
        } catch (error) {
            console.error('Login failed:', error);
            setErrors({
                general: "Unable to connect to Google Workspace. Please try again."
            });
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo and Header */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-6">
                        <div className="bg-white p-4 rounded-2xl shadow-lg">
                            <Logo src={'/logo_black.png'} alt={`${ORG_NAME} Logo`} size="md" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to {ORG_NAME}</h1>
                    <p className="text-gray-600">Sign in with your Google Workspace account</p>
                </div>

                {/* Login Form */}
                <Card variant="elevated" className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                    <div className="space-y-6">
                        {/* General Error */}
                        {errors.general && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-700">
                                <Icon name="alert" size={18} className="flex-shrink-0" />
                                <span className="text-sm">{errors.general}</span>
                            </div>
                        )}

                        {/* Organization Info */}
                        <div className="text-center py-4">
                            <div className="bg-blue-50 rounded-lg p-4 mb-4">
                                <h3 className="font-medium text-gray-900 mb-1">{ORG_NAME} Organization</h3>
                                <p className="text-sm text-gray-600">Sign in with your Google Workspace account</p>
                            </div>
                        </div>

                        {/* Google Workspace SSO Button */}
                        <Button
                            type="button"
                            variant="outline"
                            size="lg"
                            onClick={handleGoogleLogin}
                            className="w-full h-14 bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 hover:border-gray-300 font-medium text-base flex items-center justify-center gap-3 shadow-sm"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <Icon name="loading" size={20} className="animate-spin" />
                                    Redirecting to Google...
                                </div>
                            ) : (
                                <>
                                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    Continue with Google Workspace
                                </>
                            )}
                        </Button>

                        {/* Help Text */}
                        <div className="text-center">
                            <p className="text-sm text-gray-500">
                                Use your organization email address to sign in
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Footer */}
                <div className="text-center mt-8 text-sm text-gray-500">
                    <p>© 2025 TalentCrew. All rights reserved.</p>
                    <div className="flex justify-center gap-4 mt-2">
                        <a href="#" className="hover:text-gray-700">
                            Privacy Policy
                        </a>
                        <a href="#" className="hover:text-gray-700">
                            Terms of Service
                        </a>
                        <a href="#" className="hover:text-gray-700">
                            Support
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
