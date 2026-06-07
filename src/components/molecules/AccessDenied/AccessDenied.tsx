import React from 'react';
import Icon from '../../atoms/Icon/Icon';

interface AccessDeniedProps {
  message?: string;
  showIcon?: boolean;
  className?: string;
}

const AccessDenied: React.FC<AccessDeniedProps> = ({
  message = "You don't have permission to access this content.",
  showIcon = true,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center min-h-[400px] p-8 ${className}`}>
      {showIcon && (
        <div className="mb-4">
          <Icon 
            name="lock" 
            size={64} 
            className="text-gray-400" 
          />
        </div>
      )}
      <h3 className="text-xl font-semibold text-gray-700 mb-2">
        Access Denied
      </h3>
      <p className="text-gray-500 text-center max-w-md">
        {message}
      </p>
      <p className="text-sm text-gray-400 mt-2">
        Please contact your administrator if you believe this is an error.
      </p>
    </div>
  );
};

export default AccessDenied;