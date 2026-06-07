import React, { useState, useEffect } from 'react';
import EditModal from '../../../molecules/EditModal/EditModal';
import FileInput from '../../../atoms/FileInput';
import { uploadJobDocument } from '../../../../services/jobService';
import FileUploadService from '../../../../services/fileUploadService';

// Form state - only job description related fields
interface JobDescriptionFormState {
  job_description: string;
  pdf_upload: string;
}

// Props interface - simplified to only description fields
interface JobDescriptionData {
  job_description?: string;
  pdf_upload?: string;
}

interface EditJobDescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobDescription: JobDescriptionData;
  onSave: (data: Partial<JobDescriptionData>) => Promise<void>;
  isLoading?: boolean;
}

const EditJobDescriptionModal: React.FC<EditJobDescriptionModalProps> = ({
  isOpen,
  onClose,
  jobDescription,
  onSave,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<JobDescriptionFormState>({
    job_description: '',
    pdf_upload: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Populate form when modal opens or data changes
  useEffect(() => {
    if (isOpen && jobDescription) {
      setFormData({
        job_description: jobDescription.job_description || '',
        pdf_upload: jobDescription.pdf_upload || '',
      });
      setErrors({});
      setUploadError(null);
      setUploadSuccess(false);
    }
  }, [isOpen, jobDescription]);

  const handleChange = (field: keyof JobDescriptionFormState, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handlePdfUpload = async (file: File | null) => {
    if (!file) {
      handleChange('pdf_upload', '');
      setUploadSuccess(false);
      return;
    }

    setUploadingPdf(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      const fileUrl = await uploadJobDocument(file);
      console.log('Upload successful, file URL:', fileUrl);
      handleChange('pdf_upload', fileUrl);
      setUploadSuccess(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload document';
      console.error('Upload failed:', errorMessage);
      setUploadError(errorMessage);
      handleChange('pdf_upload', '');
    } finally {
      setUploadingPdf(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Job description required
    if (!formData.job_description?.trim()) {
      newErrors.job_description = 'Job description is required';
    } else if (formData.job_description.trim().length < 50) {
      newErrors.job_description = 'Job description must be at least 50 characters';
    } else if (formData.job_description.trim().length > 5000) {
      newErrors.job_description = 'Job description must not exceed 5000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      const dataToSave = {
        job_description: formData.job_description,
        pdf_upload: formData.pdf_upload,
      };

      // Log the data being saved for debugging
      console.log('Saving job description data:', dataToSave);
      await onSave(dataToSave);
      onClose();
    } catch (error) {
      console.error('Failed to save job description:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isSaving && !uploadingPdf) {
      setErrors({});
      setUploadError(null);
      setUploadSuccess(false);
      onClose();
    }
  };

  return (
    <EditModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Edit Job Description"
      isLoading={isSaving || isLoading || uploadingPdf}
      onSave={handleSave}
      size="lg"
    >
      <div className="space-y-6">
        {/* Job Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Job Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.job_description}
            onChange={(e) => handleChange('job_description', e.target.value)}
            placeholder="Enter detailed job description (minimum 50 characters)"
            rows={8}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.job_description ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.job_description && (
            <p className="mt-1 text-sm text-red-600">{errors.job_description}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            {formData.job_description.length} / 5000 characters
            {formData.job_description.length < 50 && formData.job_description.length > 0 && (
              <span className="text-amber-600 ml-2">
                ({50 - formData.job_description.length} more needed)
              </span>
            )}
          </p>
        </div>

        {/* PDF Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            PDF Upload
          </label>
          
          {/* Show current file if exists */}
          {formData.pdf_upload && !uploadSuccess && (
            <div className="mb-2 p-2 bg-gray-50 rounded-md border border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"/>
                </svg>
                <span className="text-sm text-gray-600 truncate max-w-xs">
                  Current PDF uploaded
                </span>
              </div>
              <button
                type="button"
                onClick={() => FileUploadService.openFile(formData.pdf_upload)}
                className="text-blue-600 hover:underline text-sm font-medium"
              >
                View
              </button>
            </div>
          )}

          <FileInput
            accept=".pdf"
            onChange={e => {
              const file = e.target.files?.[0] || null;
              handlePdfUpload(file);
            }}
            buttonText="Choose PDF File"
            showFileNames={true}
            disabled={uploadingPdf}
          />
          <p className="mt-1 text-sm text-gray-500">
            Upload job description document (PDF format only, optional)
          </p>

          {/* Upload Status Messages */}
          {uploadingPdf && (
            <div className="mt-2 flex items-center text-sm text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              Uploading document...
            </div>
          )}

          {uploadSuccess && !uploadingPdf && (
            <div className="mt-2 flex items-center text-sm text-green-600">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
              </svg>
              Document uploaded successfully
            </div>
          )}

          {uploadError && (
            <div className="mt-2 flex items-center text-sm text-red-600">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
              </svg>
              {uploadError}
            </div>
          )}
        </div>
      </div>
    </EditModal>
  );
};

export default EditJobDescriptionModal;
