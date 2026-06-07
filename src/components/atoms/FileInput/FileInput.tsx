import React, { forwardRef, useRef, useState } from 'react';
import Button from '../Button/Button';

export interface FileInputProps {
    /** Accept file types */
    accept?: string;
    /** Multiple files */
    multiple?: boolean;
    /** Disabled state */
    disabled?: boolean;
    /** Required field */
    required?: boolean;
    /** File input name */
    name?: string;
    /** File input id */
    id?: string;
    /** Change handler */
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    /** File input size */
    size?: 'sm' | 'md' | 'lg';
    /** File input variant */
    variant?: 'default' | 'error' | 'success';
    /** Additional CSS classes */
    className?: string;
    /** Custom button text */
    buttonText?: string;
    /** Show file names */
    showFileNames?: boolean;
    /** Max file size in MB */
    maxSize?: number;
    /** Allowed file types for validation */
    allowedTypes?: string[];
    /** Error callback */
    onError?: (error: string) => void;
}

const FileInput = forwardRef<HTMLInputElement, FileInputProps>(({
    accept,
    multiple = false,
    disabled = false,
    required = false,
    name,
    id,
    onChange,
    size = 'md',
    variant = 'default',
    className = '',
    buttonText = 'Choose File',
    showFileNames = true,
    maxSize,
    allowedTypes,
    onError
}, ref) => {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const internalRef = useRef<HTMLInputElement>(null);
    const inputRef = ref || internalRef;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        let hasError = false;

        // Validate file size
        if (maxSize) {
            const oversizedFiles = files.filter(file => file.size > maxSize * 1024 * 1024);
            if (oversizedFiles.length > 0) {
                onError?.(`File size must be less than ${maxSize}MB`);
                hasError = true;
            }
        }

        // Validate file types
        if (allowedTypes) {
            const invalidFiles = files.filter(file => {
                const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
                return !allowedTypes.includes(fileExtension);
            });
            if (invalidFiles.length > 0) {
                onError?.(`Only ${allowedTypes.join(', ')} files are allowed`);
                hasError = true;
            }
        }

        if (!hasError) {
            setSelectedFiles(files);
            onChange?.(e);
        } else {
            // Clear the input
            if (inputRef && 'current' in inputRef && inputRef.current) {
                inputRef.current.value = '';
            }
        }
    };

    const handleButtonClick = () => {
        if (inputRef && 'current' in inputRef && inputRef.current) {
            inputRef.current.click();
        }
    };

    const variantClasses = {
        default: 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
        error: 'border-red-300 focus:border-red-500 focus:ring-red-500',
        success: 'border-green-300 focus:border-green-500 focus:ring-green-500'
    };

    return (
        <div className={`space-y-2 ${className}`}>
            <input
                ref={inputRef}
                type="file"
                accept={accept}
                multiple={multiple}
                disabled={disabled}
                required={required}
                name={name}
                id={id}
                onChange={handleFileChange}
                className="hidden"
            />

            <div className={`
                w-full border rounded-md shadow-sm transition-colors
                ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white cursor-pointer hover:bg-gray-50'}
                ${variantClasses[variant]}
            `}>
                <Button
                    type="button"
                    variant="ghost"
                    size={size}
                    disabled={disabled}
                    onClick={handleButtonClick}
                    className="w-full justify-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    {buttonText}
                </Button>
            </div>

            {showFileNames && selectedFiles.length > 0 && (
                <div className="space-y-1">
                    {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="truncate flex-1" title={file.name}>
                                {file.name}
                            </span>
                            <span className="ml-2 text-xs text-gray-400">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
});

FileInput.displayName = 'FileInput';

export default FileInput;
