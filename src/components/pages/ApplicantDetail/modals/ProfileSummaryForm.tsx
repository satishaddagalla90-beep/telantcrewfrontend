import React, { useImperativeHandle, forwardRef, useState, useEffect, useCallback } from 'react';
import TextArea from '../../../atoms/TextArea';

interface ProfileSummaryFormProps {
    initialData: { profileSummary: string; };
    onDataChange: (data: any) => void;
    onValidationChange?: (isValid: boolean) => void;
}

const ProfileSummaryFormInner = (props: ProfileSummaryFormProps, ref: React.Ref<any>) => {
    const { initialData, onDataChange, onValidationChange } = props;
    const [data, setData] = useState(initialData);
    const [validationError, setValidationError] = useState<string>('');

    useEffect(() => {
        onDataChange(data);
    }, [data, onDataChange]);

    // Validation function
    const validateProfileSummary = useCallback((value: string) => {
        let error = '';
        if (value.length > 2000) {
            error = 'Profile summary cannot exceed 2000 characters';
        } else if (value.length === 0) {
            error = 'Profile summary is required';
        } else if (value.length < 50) {
            error = 'Profile summary must be at least 50 characters';
        }
        return error;
    }, []);

    useImperativeHandle(ref, () => ({
        validateAllFields: () => {
            const error = validateProfileSummary(data.profileSummary);
            setValidationError(error);
            return !error;
        }
    }));

    // Trigger validation when error changes
    useEffect(() => {
        const isValid = validationError === '';
        onValidationChange?.(isValid);
    }, [validationError, onValidationChange]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        let value = e.target.value;
        if (value.length > 2000) {
            value = value.slice(0, 2000);
        }
        setData({ ...data, profileSummary: value });

        // Validate on change
        const error = validateProfileSummary(value);
        setValidationError(error);
    }, [data, validateProfileSummary]);

    // Validate on mount and when initialData changes
    useEffect(() => {
        const error = validateProfileSummary(data.profileSummary);
        setValidationError(error);
    }, [data.profileSummary, validateProfileSummary]);

    return (
        <div className="p-6 space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profile Summary *
                </label>
                <TextArea
                    value={data.profileSummary}
                    onChange={handleChange}
                    rows={6}
                    placeholder="Enter profile summary (minimum 50 characters)..."
                    className={`w-full ${validationError ? 'border-red-500' : ''}`}
                />
                {validationError && (
                    <p className="mt-1 text-sm text-red-600">{validationError}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                    {data.profileSummary.length}/2000 characters
                </p>
            </div>
        </div>
    );
};

export const ProfileSummaryForm = forwardRef(ProfileSummaryFormInner);