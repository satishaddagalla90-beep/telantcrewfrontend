import React, { useRef, useState } from 'react';
import Icon from '../../atoms/Icon';

export interface FileUploadProps {
  /** Field label */
  label?: string;
  /** Change handler */
  onChange?: (file: File | null) => void;
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
  /** Field name */
  name?: string;
  /** Field id */
  id?: string;
  /** Max file size in MB */
  maxSize?: number;
  /** Current file info for display */
  currentFile?: { name: string; url?: string };
  /** Upload state */
  uploading?: boolean;
  /** Show drag and drop area */
  dragDrop?: boolean;
  /** Button text */
  buttonText?: string;
  /** Show file preview */
  showPreview?: boolean;
  /** Custom class */
  className?: string;
  /** Allow file replacement */
  allowReplacement?: boolean;
  /** View current file callback */
  onViewFile?: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({
  label,
  onChange,
  error,
  helpText,
  required = false,
  disabled = false,
  accept,
  name,
  id,
  maxSize = 10,
  currentFile,
  uploading = false,
  dragDrop = true,
  buttonText,
  showPreview = true,
  className = '',
  allowReplacement = true,
  onViewFile,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string>('');

  const inputId = id || name || `file-upload-${Math.random().toString(36).substr(2, 9)}`;

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      return `File size must be less than ${maxSize}MB`;
    }

    // Check file type if accept is specified
    if (accept) {
      const allowedTypes = accept.split(',').map(t => t.trim());
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      const mimeType = file.type;
      
      const isAllowed = allowedTypes.some(type => {
        if (type.startsWith('.')) {
          return fileExtension === type.toLowerCase();
        }
        return mimeType.match(new RegExp(type.replace('*', '.*')));
      });

      if (!isAllowed) {
        return `Please upload a valid file type (${accept})`;
      }
    }

    return null;
  };

  const handleFileSelect = (file: File | null) => {
    if (!file) {
      setSelectedFile(null);
      setLocalError('');
      onChange?.(null);
      return;
    }

    const validationError = validateFile(file);
    if (validationError) {
      setLocalError(validationError);
      setSelectedFile(null);
      onChange?.(null);
      return;
    }

    setLocalError('');
    setSelectedFile(file);
    onChange?.(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleFileSelect(file);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const file = e.dataTransfer.files?.[0] || null;
    handleFileSelect(file);
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setLocalError('');
    onChange?.(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getAcceptText = () => {
    if (!accept) return 'Any file type';
    return accept.split(',').map(t => t.trim().toUpperCase()).join(', ');
  };

  const displayError = error || localError;
  // Only show currentFile if no selectedFile (fix for 'Replace' showing after removal)
  const hasCurrentFile = currentFile && !selectedFile;

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        disabled={disabled}
        required={required}
        name={name}
        id={inputId}
        onChange={handleFileInputChange}
        className="hidden"
      />

      {dragDrop && !hasCurrentFile ? (
        // Drag and drop area - compact single row
        <div className="space-y-2">
          {selectedFile ? (
            // File selected state - clean and simple
            <div
              className={`
                border-2 border-dashed rounded-lg p-3 transition-all
                flex items-center justify-between
                ${disabled ? 'bg-gray-50 opacity-60' : 'bg-blue-50'}
                border-blue-300
              `}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Icon name="file" size={20} className="text-blue-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-blue-900 truncate">{selectedFile.name}</p>
                  <p className="text-xs text-blue-700">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRemove}
                className="ml-3 text-blue-600 hover:text-red-600 flex-shrink-0 p-1"
                title="Remove file"
              >
                <Icon name="x" size={16} />
              </button>
            </div>
          ) : (
            // Empty state - drag & drop instruction
            <div
              onClick={handleClick}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                relative border-2 border-dashed rounded-lg p-3 cursor-pointer transition-all
                flex items-center justify-between
                ${disabled ? 'bg-gray-50 cursor-not-allowed opacity-60' : 'bg-white hover:bg-gray-50'}
                ${isDragging ? 'border-blue-500 bg-blue-50' : displayError ? 'border-red-300' : 'border-gray-300'}
              `}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Icon 
                  name="upload" 
                  size={18} 
                  className={`flex-shrink-0 ${isDragging ? 'text-blue-600' : displayError ? 'text-red-400' : 'text-gray-400'}`} 
                />
                <div className="min-w-0">
                  <p className="text-sm text-gray-700 whitespace-nowrap">
                    {uploading ? 'Uploading...' : buttonText || 'Drag & drop or click'}
                  </p>
                  {!uploading && (
                    <p className="text-xs text-gray-500">
                      {getAcceptText()} • {maxSize}MB
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          {selectedFile && onViewFile && (
            <button
              type="button"
              onClick={onViewFile}
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              View File
            </button>
          )}
        </div>
      ) : (
        // Simple button mode (or replacement mode)
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleClick}
            disabled={disabled || uploading}
            className={`
              w-full flex items-center justify-center gap-2 px-4 py-2.5 border rounded-md font-medium transition-colors
              ${disabled || uploading 
                ? 'bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
              }
              ${displayError ? 'border-red-300' : ''}
            `}
          >
            <Icon name="upload" size={16} />
            <span>
              {uploading 
                ? 'Uploading...' 
                : hasCurrentFile && allowReplacement
                  ? 'Replace Document'
                  : buttonText || 'Choose File'
              }
            </span>
          </button>

          {hasCurrentFile && onViewFile && (
            <button
              type="button"
              onClick={onViewFile}
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              View Current Document
            </button>
          )}

          {selectedFile && showPreview && (
            <div className="flex items-center justify-between text-sm bg-blue-50 px-3 py-2 rounded border border-blue-200">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Icon name="file" size={16} className="text-blue-500 flex-shrink-0" />
                <span className="truncate text-blue-900">{selectedFile.name}</span>
              </div>
              <button
                type="button"
                onClick={handleRemove}
                className="ml-2 text-blue-500 hover:text-red-600 flex-shrink-0"
                title="Remove file"
              >
                <Icon name="x" size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      {helpText && !displayError && (
        <p className="text-xs text-gray-500">{helpText}</p>
      )}

      {displayError && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <Icon name="alert-circle" size={14} />
          {displayError}
        </p>
      )}
    </div>
  );
};

export default FileUpload;
