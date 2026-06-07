import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AuthApiService, { UserNotFoundError } from '../../../services/authService';
import { useAuth } from '../../auth/AuthContext';
import Icon from '../../atoms/Icon';
import Logo from '../../atoms/Logo';

const AuthCallback: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isUserNotFound, setIsUserNotFound] = useState(false);

    useEffect(() => {
        const handleAuthCallback = async () => {
            try {

                // Parse URL parameters
                const urlParams = new URLSearchParams(location.search);
                const accessToken = urlParams.get('access_token');
                const refreshToken = urlParams.get('refresh_token');
                const state = urlParams.get('state');
                const error = urlParams.get('error');
                const userEmail = urlParams.get('user_email');

                // Check if user is not in system
                if (urlParams.has('notInSystem') && userEmail) {
                    throw new Error(`User with email ${userEmail} is not registered in the system. Please contact your administrator to get access.`);
                }

                // Check for OAuth errors
                if (error) {
                    throw new Error(`Authentication failed: ${error}`);
                }

                // Verify state parameter for security
                const storedState = localStorage.getItem('authState');
                if (state && storedState && state !== storedState) {
                    throw new Error('Invalid state parameter. Possible CSRF attack.');
                }

                if (accessToken && refreshToken) {

                    // Handle successful authentication
                    await AuthApiService.handleAuthCallback(accessToken, refreshToken);


                    // Clean up state
                    localStorage.removeItem('authState');


                    // Redirect to home page (root path)
                    navigate('/', { replace: true });
                } else {
                    throw new Error('User doesn\'t exist, Please contact admin');
                }
            } catch (err) {
                console.error('Auth callback error:', err);

                if (err instanceof UserNotFoundError) {
                    setIsUserNotFound(true);
                }

                setError(err instanceof Error ? err.message : 'Authentication failed');
                setLoading(false);
            }
        };

        handleAuthCallback();
    }, [location, navigate]);

    const handleRetry = () => {
        // Clear any auth state when going back to login
        localStorage.removeItem('authState');
        navigate('/login', { replace: true });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="flex justify-center mb-6">
                        <div className="bg-white p-4 rounded-2xl shadow-lg">
                            <Logo src={'/logo_black.png'} alt="TalentCrew Logo" size="md" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
                        <div className="flex items-center justify-center mb-4">
                            <Icon name="loading" size={32} className="animate-spin text-blue-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            Processing Authentication...
                        </h2>
                        <p className="text-gray-600">
                            Please wait while we complete your sign-in process.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="flex justify-center mb-6">
                        <div className="bg-white p-4 rounded-2xl shadow-lg">
                            <Logo src={'/logo_black.png'} alt="TalentCrew Logo" size="md" />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
                        <div className="flex items-center justify-center mb-4">
                            <div className={`p-3 rounded-full ${isUserNotFound ? 'bg-yellow-100' : 'bg-red-100'}`}>
                                <Icon
                                    name={isUserNotFound ? "user" : "alert"}
                                    size={24}
                                    className={isUserNotFound ? "text-yellow-600" : "text-red-600"}
                                />
                            </div>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            {isUserNotFound ? 'Access Required' : 'Authentication Error'}
                        </h2>
                        <p className="text-gray-600 mb-6">
                            {error}
                        </p>
                        {isUserNotFound && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                                <div className="flex items-start">
                                    <Icon name="info" size={16} className="text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                                    <div className="text-sm text-yellow-700">
                                        <p className="font-medium mb-1">What to do next:</p>
                                        <ul className="list-disc list-inside space-y-1">
                                            <li>Contact your system administrator</li>
                                            <li>Request access to the TalentCrew platform</li>
                                            <li>Provide your email address for account setup</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}
                        <button
                            onClick={handleRetry}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                        >
                            {isUserNotFound ? 'Back to Login' : 'Try Again'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default AuthCallback;
