import React from 'react';
import Icon, { IconName } from '../../atoms/Icon';
import ErrorMessage from '../../atoms/ErrorMessage/ErrorMessage';

export interface AvatarUploadProps {
  label?: string;
  value?: File | null;
  preview?: string;
  onChange: (file: File | null) => void;
  error?: string;
  required?: boolean;
  accept?: string;
  maxSize?: number; // in MB
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  fallbackIcon?: IconName;
  showFileName?: boolean;
  // Upload state props
  uploading?: boolean;
  uploadError?: string;
  // Validation error callback
  onValidationError?: (error: string) => void;
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({
  label = 'Upload Picture',
  value,
  preview,
  onChange,
  error,
  required = false,
  accept = '.jpg,.jpeg,.png,.gif',
  maxSize = 5,
  disabled = false,
  className = '',
  size = 'md',
  fallbackIcon = 'user',
  showFileName = true,
  uploading = false,
  uploadError,
  onValidationError,
}) => {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  };

  const iconSizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size
      if (file.size > maxSize * 1024 * 1024) {
        const errorMessage = `File size exceeds ${maxSize}MB limit. Selected file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`;
        console.error(errorMessage);
        // Report validation error to parent instead of showing alert
        onValidationError?.(errorMessage);
        // Clear the input
        e.target.value = '';
        return;
      }
      onChange(file);
    } else {
      onChange(null);
    }
  };

  const handleRemoveFile = () => {
    onChange(null);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="flex items-center space-x-4">
        {/* Avatar Preview */}
        <div
          className={`${sizeClasses[size]} bg-gray-100 rounded-full flex items-center justify-center border-2 border-dashed border-gray-300 ${disabled ? 'opacity-50' : ''}`}
        >
          {preview ? (
            <img
              src={preview}
              alt="Preview"
              className={`${sizeClasses[size]} object-cover rounded-full`}
            />
          ) : (
            <Icon
              name={fallbackIcon}
              className={`${iconSizeClasses[size]} text-gray-400`}
            />
          )}
        </div>

        {/* Upload Controls */}
        <div className="flex flex-col space-y-2">
          {/* Upload Button */}
          <label
            className={`inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ${disabled || uploading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
          >
            <Icon
              name={uploading ? 'loading' : 'upload'}
              className={`mr-2 h-4 w-4 ${uploading ? 'animate-spin' : ''}`}
            />
            {uploading ? 'Uploading...' : 'Choose File'}
            <input
              type="file"
              className="hidden"
              accept={accept}
              onChange={handleFileChange}
              disabled={disabled || uploading}
            />
          </label>


        </div>
      </div>

      {/* File Name Display */}
      {showFileName && value && (
        <p className="text-xs text-gray-500">
          {value.name} ({(value.size / 1024 / 1024).toFixed(2)} MB)
        </p>
      )}

      {/* Error Message */}
      {(error || uploadError) && (
        <ErrorMessage
          message={error || uploadError}
          variant="error"
          size="sm"
        />
      )}

      {/* Help Text */}
      <p className="text-xs text-gray-500">
        Accepted formats: {accept}. Max size: {maxSize}MB
      </p>
    </div>
  );
};

export default AvatarUpload;
