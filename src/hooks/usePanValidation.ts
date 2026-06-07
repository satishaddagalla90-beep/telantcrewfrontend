import { useState, useEffect, useCallback, useRef } from 'react';
import { ValidationPatterns } from '../components/molecules/CommonFormFields/CommonFormFields';
import { candidatesAPI } from '../utils/api/CandidatesAPI';

interface UsePanValidationProps {
    value: string;
    onChange: (value: string) => void;
    onValidationChange?: (isValid: boolean, error?: string) => void;
}

interface UsePanValidationReturn {
    isValidating: boolean;
    error: string | null;
    isValid: boolean;
    handleChange: (newValue: string) => void;
}

export const usePanValidation = ({
    value,
    onChange,
    onValidationChange
}: UsePanValidationProps): UsePanValidationReturn => {
    const [isValidating, setIsValidating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isValid, setIsValid] = useState(false);

    // Use ref to avoid recreating validatePan when onValidationChange changes
    const onValidationChangeRef = useRef(onValidationChange);

    // Update ref when callback changes
    useEffect(() => {
        onValidationChangeRef.current = onValidationChange;
    }, [onValidationChange]);

    // Initialize validation state on mount
    useEffect(() => {
        if (!value) {
            onValidationChangeRef.current?.(false, 'PAN number is required');
        }
    }, []);

    // Debounced validation function
    const validatePan = useCallback(async (panValue: string) => {
        if (!panValue) {
            setError(null);
            setIsValid(false);
            onValidationChangeRef.current?.(false);
            return;
        }

        // First check format
        const formatError = ValidationPatterns.pan(panValue);
        if (formatError) {
            setError(formatError);
            setIsValid(false);
            onValidationChangeRef.current?.(false, formatError);
            return;
        }

        // Only make API call if PAN is complete (10 characters)
        if (panValue.length !== 10) {
            setError(null);
            setIsValid(false);
            onValidationChangeRef.current?.(false, 'PAN must be 10 characters');
            return;
        }

        // If format is valid and complete, check for duplicates
        setIsValidating(true);
        setError(null);

        try {
            const isDuplicate = await candidatesAPI.checkPanExists(panValue);

            console.log('PAN Duplicate Check Result:', { panValue, isDuplicate }); // Debug log

            if (isDuplicate) {
                const duplicateError = 'This PAN number already exists in the system';
                setError(duplicateError);
                setIsValid(false);
                onValidationChangeRef.current?.(false, duplicateError);
                console.log('PAN Validation: INVALID - Duplicate found'); // Debug log
            } else {
                setError(null);
                setIsValid(true);
                onValidationChangeRef.current?.(true);
                console.log('PAN Validation: VALID - Unique PAN'); // Debug log
            }
        } catch (err: any) {
            const apiError = 'Error checking PAN number. Please try again.';
            setError(apiError);
            setIsValid(false);
            onValidationChangeRef.current?.(false, apiError);
        } finally {
            setIsValidating(false);
        }
    }, []); // Removed onValidationChange dependency

    // Debounce effect
    useEffect(() => {
        const timer = setTimeout(() => {
            validatePan(value);
        }, 1000); // 1000ms debounce (increased from 500ms)

        return () => clearTimeout(timer);
    }, [value, validatePan]);

    const handleChange = useCallback((newValue: string) => {
        // Format the value (uppercase, alphanumeric only)
        const formattedValue = newValue
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '')
            .slice(0, 10);

        onChange(formattedValue);

        // Reset validation state while typing
        if (formattedValue !== value) {
            setIsValid(false);
            if (formattedValue.length < 10) {
                setError(null);
            }
        }
    }, [onChange, value]);

    return {
        isValidating,
        error,
        isValid,
        handleChange
    };
};
