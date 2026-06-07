import { useState, useEffect, useCallback, useRef } from 'react';
import { ValidationPatterns } from '../components/molecules/CommonFormFields/CommonFormFields';
import { candidatesAPI } from '../utils/api/CandidatesAPI';

interface UseContactValidationProps {
    value: string;
    type: 'email' | 'phone';
    onChange: (value: string) => void;
    onValidationChange?: (isValid: boolean, error?: string) => void;
    excludeId?: string; // ID of the candidate to exclude from duplicate checks
}

interface UseContactValidationReturn {
    isValidating: boolean;
    error: string | null;
    isValid: boolean;
    handleChange: (newValue: string) => void;
}

export const useContactValidation = ({
    value,
    type,
    onChange,
    onValidationChange,
    excludeId
}: UseContactValidationProps): UseContactValidationReturn => {
    const [isValidating, setIsValidating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isValid, setIsValid] = useState(false);

    const onValidationChangeRef = useRef(onValidationChange);

    useEffect(() => {
        onValidationChangeRef.current = onValidationChange;
    }, [onValidationChange]);

    useEffect(() => {
        if (!value) {
            onValidationChangeRef.current?.(false, `${type === 'email' ? 'Email' : 'Phone'} is required`);
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
        const formatError = type === 'email'
            ? ValidationPatterns.email(contactValue)
            : ValidationPatterns.phone(contactValue);

        if (formatError) {
            setError(formatError);
            setIsValid(false);
            onValidationChangeRef.current?.(false, formatError);
            return;
        }

        setIsValidating(true);
        setError(null);

        try {
            // Use checkDuplicates which is the dedicated endpoint for validation
            const params: any = {};
            if (type === 'email') params.email = contactValue;
            if (type === 'phone') params.phone = parseInt(contactValue, 10);

            const response = await candidatesAPI.checkDuplicates(params);

            // Check for duplicates excluding the current candidate if excludeId is provided
            let duplicates = response.duplicates || [];

            if (excludeId && duplicates.length > 0) {
                duplicates = duplicates.filter((d: any) =>
                    d.candidate_id !== excludeId &&
                    d._id !== excludeId &&
                    d.id !== excludeId
                );
            }

            const isDuplicate = duplicates.length > 0;

            if (isDuplicate) {
                const duplicateError = `This ${type} already exists in the system`;
                setError(duplicateError);
                setIsValid(false);
                onValidationChangeRef.current?.(false, duplicateError);
            } else {
                setError(null);
                setIsValid(true);
                onValidationChangeRef.current?.(true);
            }
        } catch (err: any) {
            // If the error seems to be a network/server error but not a duplicate confirmation, we might want to be careful.
            // But usually for validation, prompts are better.
            const apiError = `Error checking ${type}. Please try again.`;
            setError(apiError);
            setIsValid(false);
            onValidationChangeRef.current?.(false, apiError);
        } finally {
            setIsValidating(false);
        }
    }, [type, excludeId]);

    useEffect(() => {
        const timer = setTimeout(() => {
            validateContact(value);
        }, 1000);

        return () => clearTimeout(timer);
    }, [value, validateContact]);

    const handleChange = useCallback((newValue: string) => {
        onChange(newValue);
        if (newValue !== value) {
            setIsValid(false);
            setError(null);
        }
    }, [onChange, value]);

    return {
        isValidating,
        error,
        isValid,
        handleChange
    };
};
