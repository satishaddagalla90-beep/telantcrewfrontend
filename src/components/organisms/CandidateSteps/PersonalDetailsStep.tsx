import React from 'react';
import PersonalDetailsForm from '../PersonalDetailsForm/PersonalDetailsForm';

// Props interface for step components
interface StepComponentProps {
    formData: any;
    onChange: (field: string, value: any) => void;
    errors: Record<string, string>;
    touched: Record<string, boolean>;
    onFileUpload?: {
        candidatePicture?: (file: File | null, onChange: (field: string, value: any) => void) => void;
        resume?: (file: File | null, onChange: (field: string, value: any) => void) => void;
        documents?: (files: File[], documentInfo: any, onChange: (field: string, value: any) => void, currentDocuments: any[]) => void;
    };
    avatarUploadState?: { uploading: boolean; error: string | null };
}

const PersonalDetailsStep: React.FC<StepComponentProps> = ({
    formData,
    onChange,
    errors,
    touched,
    onFileUpload,
    avatarUploadState,
}) => {
    return (
        <PersonalDetailsForm
            formData={formData}
            onChange={onChange}
            errors={errors}
            loading={{}}
            onCandidatePictureUpload={onFileUpload?.candidatePicture ?
                (file: File | null) => onFileUpload.candidatePicture!(file, onChange) :
                undefined
            }
            avatarUploadState={avatarUploadState}
        />
    );
};

export default PersonalDetailsStep;
