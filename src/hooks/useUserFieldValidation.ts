import { useState, useEffect, useCallback, useRef } from 'react';
import { ValidationPatterns } from '../components/molecules/CommonFormFields/CommonFormFields';
import { usersAPI } from '../utils/api/UsersAPI';

interface UseUserFieldValidationProps {
    value: string;
    type: 'email' | 'username' | 'phone';
    onChange: (value: string) => void;
    onValidationChange?: (isValid: boolean, error?: string) => void;
    excludeId?: string;
}

interface UseUserFieldValidationReturn {
    isValidating: boolean;
    error: string | null;
    isValid: boolean;
    handleChange: (newValue: string) => void;
}

export const useUserFieldValidation = ({
    value,
    type,
    onChange,
    onValidationChange,
    excludeId
}: UseUserFieldValidationProps): UseUserFieldValidationReturn => {
    const [isValidating, setIsValidating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isValid, setIsValid] = useState(false);

    const onValidationChangeRef = useRef(onValidationChange);

    useEffect(() => {
        onValidationChangeRef.current = onValidationChange;
    }, [onValidationChange]);

    useEffect(() => {
        if (!value) {
            const fieldName = type === 'email' ? 'Email' : type === 'username' ? 'Employee ID' : 'Phone';
            onValidationChangeRef.current?.(false, `${fieldName} is required`);
        }
    }, [type]);

    const validateContact = useCallback(async (contactValue: string) => {
        if (!contactValue) {
            setError(null);
            setIsValid(false);
            onValidationChangeRef.current?.(false);
            return;
        }

        // Check format
        let formatError = '';
        if (type === 'email') {
            formatError = ValidationPatterns.email(contactValue) || '';
        } else if (type === 'phone') {
            formatError = ValidationPatterns.phone(contactValue) || '';
        }
        // username/employee ID doesn't need format validation

        if (formatError) {
            setError(formatError);
            setIsValid(false);
            onValidationChangeRef.current?.(false, formatError);
            return;
        }

        setIsValidating(true);
        setError(null);

        try {
            // Use checkDuplicates API for validation
            const params: any = {};
            if (type === 'email') params.email = contactValue;
            if (type === 'username') params.username = contactValue;
            if (type === 'phone') params.phone_no = contactValue;
            if (excludeId) params.excludeId = excludeId;

            const response = await usersAPI.checkDuplicates(params);

            // Check for duplicates excluding the current user if excludeId is provided
            let duplicates = response.duplicates || [];

            if (excludeId && duplicates.length > 0) {
                duplicates = duplicates.filter(d =>
                    d._id !== excludeId && d.username !== excludeId && d.email !== excludeId
                );
            }

            const isDuplicate = duplicates.length > 0;

            if (isDuplicate) {
                const fieldName = type === 'email' ? 'Email' : type === 'username' ? 'Employee ID' : 'Phone';
                const duplicateError = `This ${fieldName.toLowerCase()} already exists in the system`;
                setError(duplicateError);
                setIsValid(false);
                onValidationChangeRef.current?.(false, duplicateError);
            } else {
                setError(null);
                setIsValid(true);
                onValidationChangeRef.current?.(true);
            }
        } catch (err: any) {
            const fieldName = type === 'email' ? 'Email' : type === 'username' ? 'Employee ID' : 'Phone';
            const apiError = `Error checking ${fieldName.toLowerCase()}. Please try again.`;
            setError(apiError);
            setIsValid(false);
            onValidationChangeRef.current?.(false, apiError);
        } finally {
            setIsValidating(false);
        }
    }, [type, excludeId]);

    useEffect(() => {
        const debounce = setTimeout(() => {
            validateContact(value);
        }, 500);

        return () => clearTimeout(debounce);
    }, [value, validateContact]);

    const handleChange = useCallback((newValue: string) => {
        onChange(newValue);
    }, [onChange]);

    return {
        isValidating,
        error,
        isValid,
        handleChange,
    };
};
