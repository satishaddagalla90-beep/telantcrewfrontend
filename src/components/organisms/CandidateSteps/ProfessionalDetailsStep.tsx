import React from 'react';
import ProfessionalDetailsForm from '../ProfessionalDetailsForm/ProfessionalDetailsForm';

// Props interface for step components
interface StepComponentProps {
    formData: any;
    onChange: (field: string, value: any) => void;
    errors: Record<string, string>;
    touched: Record<string, boolean>;
    onResumeParseAndPopulate?: (file: File, onChange: (field: string, value: any) => void) => Promise<void>;
    resumeUploadState?: { uploading: boolean; error: string | null };
}

const ProfessionalDetailsStep: React.FC<StepComponentProps> = ({
    formData,
    onChange,
    errors,
    touched,
    onResumeParseAndPopulate,
    resumeUploadState,
}) => {
    return (
        <ProfessionalDetailsForm
            formData={formData}
            onChange={onChange}
            errors={errors}
            touched={touched}
            onResumeParseAndPopulate={onResumeParseAndPopulate ?
                (file: File, onChange: (field: string, value: any) => void) => onResumeParseAndPopulate(file, onChange) :
                undefined
            }
            resumeUploadState={resumeUploadState}
        />
    );
};

export default ProfessionalDetailsStep;
