import React from 'react';
import FileInput from '../../atoms/FileInput/FileInput';
import Label from '../../atoms/Label/Label';
import ErrorMessage from '../../atoms/ErrorMessage/ErrorMessage';

export interface FileInputFieldProps {
  /** Field label */
  label?: string;
  /** Change handler */
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Error message */
  error?: string;
  /** Help text */
  helpText?: string;
  /** Required field */
  required?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Accept file types */
  accept?: string;
  /** Multiple files */
  multiple?: boolean;
  /** Container class */
  className?: string;
  /** Spacing between elements */
  spacing?: 'sm' | 'md' | 'lg';
  /** Field name */
  name?: string;
  /** Field id */
  id?: string;
  /** Field size */
  size?: 'sm' | 'md' | 'lg';
  /** Grid column classes (for responsive layouts) */
  gridCols?: string;
  /** Custom button text */
  buttonText?: string;
  /** Show file names */
  showFileNames?: boolean;
  /** Max file size in MB */
  maxSize?: number;
  /** Allowed file types for validation */
  allowedTypes?: string[];
  /** Current file info for display */
  currentFile?: { name: string; size?: number };
  /** Upload state props */
  uploading?: boolean;
  uploadError?: string;
}

const FileInputField: React.FC<FileInputFieldProps> = ({
  label,
  onChange,
  error,
  helpText,
  required = false,
  disabled = false,
  accept,
  multiple = false,
  className = '',
  spacing = 'md',
  name,
  id,
  size = 'md',
  gridCols = 'col-span-3', // Default to 1/4 width for file inputs
  buttonText,
  showFileNames = true,
  maxSize,
  allowedTypes,
  currentFile,
  uploading = false,
  uploadError,
}) => {
  const spacingClasses = {
    sm: 'space-y-1',
    md: 'space-y-2',
    lg: 'space-y-3',
  };

  const inputId =
    id || name || `file-${Math.random().toString(36).substr(2, 9)}`;

  const handleError = (errorMessage: string) => {
    // Could emit this error to parent component or handle it internally
    console.error('File input error:', errorMessage);
  };

  return (
    <div className={`${gridCols} ${spacingClasses[spacing]} ${className}`}>
      {label && (
        <Label
          htmlFor={inputId}
          required={required}
          disabled={disabled}
          size={size === 'lg' ? 'base' : 'sm'}
        >
          {label}
        </Label>
      )}

      <FileInput
        id={inputId}
        name={name}
        onChange={onChange}
        accept={accept}
        multiple={multiple}
        required={required}
        disabled={disabled || uploading}
        size={size}
        variant={error || uploadError ? 'error' : 'default'}
        buttonText={uploading ? 'Uploading...' : buttonText}
        showFileNames={showFileNames}
        maxSize={maxSize}
        allowedTypes={allowedTypes}
        onError={handleError}
      />

      {currentFile && (
        <div className="mt-1 text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
          <span className="font-medium">Selected:</span> {currentFile.name}
          {currentFile.size && (
            <span className="ml-2 text-gray-500">
              ({(currentFile.size / 1024 / 1024).toFixed(2)} MB)
            </span>
          )}
        </div>
      )}

      {helpText && !error && (
        <p className="text-xs text-gray-500">{helpText}</p>
      )}

      <ErrorMessage message={error || uploadError} />
    </div>
  );
};

export default FileInputField;
