import { useState, useEffect, useCallback, useRef } from 'react';
import { clientsAPI } from '../utils/api/ClientsAPI';

// Helper for PAN format validation
const isPAN = (str: string) => {
    return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(str);
};

interface UseClientFieldValidationProps {
    value: string;
    type: 'pan';
    onChange: (value: string) => void;
    onValidationChange?: (isValid: boolean, error?: string) => void;
    excludeId?: string;
}

interface UseClientFieldValidationReturn {
    isValidating: boolean;
    error: string | null;
    isValid: boolean;
    handleChange: (newValue: string) => void;
}

export const useClientFieldValidation = ({
    value,
    type,
    onChange,
    onValidationChange,
    excludeId
}: UseClientFieldValidationProps): UseClientFieldValidationReturn => {
    const [isValidating, setIsValidating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isValid, setIsValid] = useState(false);

    const onValidationChangeRef = useRef(onValidationChange);

    useEffect(() => {
        onValidationChangeRef.current = onValidationChange;
    }, [onValidationChange]);

    useEffect(() => {
        if (!value) {
            setError(null);
            setIsValid(false);
        }
    }, [value]);

    const validateField = useCallback(async (fieldValue: string) => {
        if (!fieldValue) {
            setError(null);
            setIsValid(false);
            onValidationChangeRef.current?.(false);
            return;
        }

        // Check format
        let formatError = '';
        if (type === 'pan') {
            if (!isPAN(fieldValue)) {
                formatError = 'Invalid PAN format';
            }
        }

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
            if (type === 'pan') params.pan = fieldValue;
            if (excludeId) params.excludeId = excludeId;

            const response = await clientsAPI.checkDuplicates(params);

            // Check for duplicates excluding the current client if excludeId is provided
            let duplicates = response.duplicates || [];

            if (excludeId && duplicates.length > 0) {
                duplicates = duplicates.filter(d => {
                    // Check against both id types to ensure we exclude the current client
                    return d.id !== excludeId && d._id !== excludeId;
                });
            }

            const isDuplicate = duplicates.length > 0;

            if (isDuplicate) {
                const fieldName = type === 'pan' ? 'PAN Number' : 'Field';
                const duplicateError = `This ${fieldName} already exists.`;
                setError(duplicateError);
                setIsValid(false);
                onValidationChangeRef.current?.(false, duplicateError);
            } else {
                setError(null);
                setIsValid(true);
                onValidationChangeRef.current?.(true);
            }
        } catch (err: any) {
            const fieldName = type === 'pan' ? 'PAN Number' : 'Field';
            const apiError = `Error checking ${fieldName}. Please try again.`;
            setError(apiError);
            setIsValid(false);
            onValidationChangeRef.current?.(false, apiError);
        } finally {
            setIsValidating(false);
        }
    }, [type, excludeId]);

    useEffect(() => {
        const debounce = setTimeout(() => {
            if (value) {
                validateField(value);
            }
        }, 500);

        return () => clearTimeout(debounce);
    }, [value, validateField]);

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
