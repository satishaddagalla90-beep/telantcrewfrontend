import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import Logo from '../atoms/Logo';
import Icon from '../atoms/Icon';

const ProtectedLayout: React.FC = () => {
    const { user, loading, isAuthenticated } = useAuth();
    const location = useLocation();

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
                            Loading...
                        </h2>
                        <p className="text-gray-600">
                            Please wait while we load your account.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <Outlet />;
};

export default ProtectedLayout;
