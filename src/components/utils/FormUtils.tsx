import React from 'react';
import FormField, { FormFieldProps } from '../atoms/FormField/FormField';
import SelectField, { SelectOption } from '../atoms/SelectField/SelectField';
import TextAreaField from '../molecules/TextAreaField/TextAreaField';

// Education type options
export const EDUCATION_TYPES: SelectOption[] = [
    { value: 'school', label: 'School' },
    { value: 'undergraduate', label: 'Undergraduate' },
    { value: 'postgraduate', label: 'Postgraduate' },
    { value: 'doctorate', label: 'Doctorate' }
];

// Skill expertise levels
export const SKILL_EXPERTISE_LEVELS: SelectOption[] = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
    { value: 'expert', label: 'Expert' }
];

// Notice periods
export const NOTICE_PERIODS: SelectOption[] = [
    { value: 'immediate', label: 'Immediate' },
    { value: '15days', label: '15 Days' },
    { value: '1month', label: '1 Month' },
    { value: '2months', label: '2 Months' },
    { value: '3months', label: '3 Months' }
];

// Job preferences
export const JOB_PREFERENCES: SelectOption[] = [
    { value: 'full-time', label: 'Full Time' },
    { value: 'part-time', label: 'Part Time' },
    { value: 'contract', label: 'Contract' },
    { value: 'freelance', label: 'Freelance' }
];

// Gender options
export const GENDER_OPTIONS: SelectOption[] = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' }
];

// Marital status options
export const MARITAL_STATUS_OPTIONS: SelectOption[] = [
    { value: 'single', label: 'Single' },
    { value: 'married', label: 'Married' },
    { value: 'divorced', label: 'Divorced' },
    { value: 'widowed', label: 'Widowed' }
];

/**
 * Reusable form utilities for consistent form field creation
 */
export class FormUtils {
    /**
     * Creates a standard text input field
     */
    static createTextField(
        label: string,
        value: string,
        onChange: (value: string) => void,
        options: Partial<FormFieldProps> = {}
    ) {
        return (
            <FormField
                label={label}
                type="text"
                value={value}
                onChange={onChange}
                {...options}
            />
        );
    }

    /**
     * Creates a number input field
     */
    static createNumberField(
        label: string,
        value: string,
        onChange: (value: string) => void,
        options: Partial<FormFieldProps> = {}
    ) {
        return (
            <FormField
                label={label}
                type="number"
                value={value}
                onChange={onChange}
                {...options}
            />
        );
    }

    /**
     * Creates an email input field
     */
    static createEmailField(
        label: string,
        value: string,
        onChange: (value: string) => void,
        options: Partial<FormFieldProps> = {}
    ) {
        return (
            <FormField
                label={label}
                type="email"
                value={value}
                onChange={onChange}
                {...options}
            />
        );
    }

    /**
     * Creates a select dropdown field
     */
    static createSelectField(
        label: string,
        value: string,
        onChange: (value: string) => void,
        options: SelectOption[],
        config: {
            placeholder?: string;
            required?: boolean;
            error?: string;
            className?: string;
        } = {}
    ) {
        return (
            <SelectField
                label={label}
                value={value}
                onChange={onChange}
                options={options}
                placeholder={config.placeholder}
                required={config.required}
                error={config.error}
                className={config.className}
            />
        );
    }

    /**
     * Creates a textarea field
     */
    static createTextAreaField(
        label: string,
        value: string,
        onChange: (value: string) => void,
        options: {
            rows?: number;
            maxLength?: number;
            showCharacterCount?: boolean;
            required?: boolean;
            error?: string;
            helpText?: string;
            placeholder?: string;
        } = {}
    ) {
        return (
            <TextAreaField
                label={label}
                value={value}
                onChange={onChange}
                rows={options.rows || 3}
                maxLength={options.maxLength}
                showCharacterCount={options.showCharacterCount}
                required={options.required}
                error={options.error}
                helpText={options.helpText}
                placeholder={options.placeholder}
                gridCols="col-span-6"
            />
        );
    }

    /**
     * Predefined education type selector
     */
    static educationTypeField(
        value: string,
        onChange: (value: string) => void,
        options: { required?: boolean; error?: string; } = {}
    ) {
        return this.createSelectField(
            'Education Type',
            value,
            onChange,
            EDUCATION_TYPES,
            {
                placeholder: 'Select type',
                required: options.required,
                error: options.error
            }
        );
    }

    /**
     * Predefined skill expertise selector
     */
    static skillExpertiseField(
        value: string,
        onChange: (value: string) => void,
        options: { required?: boolean; error?: string; } = {}
    ) {
        return this.createSelectField(
            'Expertise Level',
            value,
            onChange,
            SKILL_EXPERTISE_LEVELS,
            {
                required: options.required,
                error: options.error
            }
        );
    }

    /**
     * Predefined skill rating field (1-5)
     */
    static skillRatingField(
        value: string,
        onChange: (value: string) => void,
        options: { error?: string; } = {}
    ) {
        const handleChange = (newValue: string) => {
            // Allow empty value
            if (newValue === '') {
                onChange(newValue);
                return;
            }
            
            const numValue = parseInt(newValue, 10);
            
            // Enforce min/max bounds
            if (!isNaN(numValue)) {
                if (numValue < 1) {
                    onChange('1');
                } else if (numValue > 5) {
                    onChange('5');
                } else {
                    onChange(newValue);
                }
            }
        };
        
        return this.createNumberField(
            'Rating (1-5)',
            value,
            handleChange,
            {
                min: 1,
                max: 5,
                placeholder: 'e.g., 4',
                error: options.error
            }
        );
    }

    /**
     * Predefined experience field (1-50 years)
     */
    static experienceField(
        label: string,
        value: string,
        onChange: (value: string) => void,
        options: { error?: string; } = {}
    ) {
        const handleChange = (newValue: string) => {
            // Allow empty value
            if (newValue === '') {
                onChange(newValue);
                return;
            }
            
            const numValue = parseFloat(newValue);
            
            // Enforce min/max bounds
            if (!isNaN(numValue)) {
                if (numValue < 1) {
                    onChange('1');
                } else if (numValue > 50) {
                    onChange('50');
                } else {
                    onChange(newValue);
                }
            }
        };
        
        return this.createNumberField(
            label,
            value,
            handleChange,
            {
                min: 1,
                max: 50,
                step: 0.1,
                placeholder: 'e.g., 3.5',
                error: options.error
            }
        );
    }
}

export default FormUtils;
