import React, { useState, useEffect } from 'react';
import Button from '../../atoms/Button/Button';
import Card from '../../molecules/Card/Card';
import Modal from '../../atoms/Modal/Modal';
import Stepper, { StepperStep } from '../../molecules/Stepper/Stepper';

// Define the structure of a creation step
export interface CreationStep {
    id: string;
    title: string;
    icon: React.ReactNode;
    component: React.ComponentType<any>;
    validation?: (formData: any) => Record<string, string> | null;
    isOptional?: boolean;
}

// Props for the main template
interface CreationFlowTemplateProps {
    title: string;
    entityType: string;
    steps: CreationStep[];
    initialFormData: any;
    onSave: (formData: any) => Promise<boolean>;
    duplicateCheckConfig?: {
        fields: Array<{
            key: string;
            label: string;
            placeholder: string;
        }>;
        checkFunction: (data: any) => Promise<any[]>;
        resultColumns: Array<{
            key: string;
            label: string;
        }>;
    };
    onCancel?: () => void;
}

// Icons for navigation
const ChevronLeft = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="15,18 9,12 15,6"></polyline>
    </svg>
);

const ChevronRight = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="9,18 15,12 9,6"></polyline>
    </svg>
);

// Simple toast notification function
const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    console.log(`${type.toUpperCase()}: ${message}`);
    // You can replace this with your actual toast library
    // For example: toast.success(message) or toast.error(message)
};

const CreationFlowTemplate: React.FC<CreationFlowTemplateProps> = ({
    title,
    entityType,
    steps,
    initialFormData,
    onSave,
    duplicateCheckConfig,
    onCancel
}) => {
    // State management
    const [activeStep, setActiveStep] = useState(0);
    const [formData, setFormData] = useState(initialFormData);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Duplicate check modal state
    const [showDuplicateModal, setShowDuplicateModal] = useState(false);
    const [duplicateCheckData, setDuplicateCheckData] = useState<any>({});
    const [duplicateResults, setDuplicateResults] = useState<any[]>([]);
    const [checkingDuplicates, setCheckingDuplicates] = useState(false);

    // Initialize form data when initial data changes
    useEffect(() => {
        setFormData(initialFormData);
    }, [initialFormData]);

    // Form field handlers
    const handleFieldChange = (fieldName: string, value: any) => {
        setFormData((prev: any) => ({
            ...prev,
            [fieldName]: value
        }));

        // Clear error when field is modified
        if (errors[fieldName]) {
            setErrors((prev: Record<string, string>) => {
                const newErrors = { ...prev };
                delete newErrors[fieldName];
                return newErrors;
            });
        }

        // Mark field as touched
        setTouched((prev: Record<string, boolean>) => ({
            ...prev,
            [fieldName]: true
        }));
    };

    // Validate current step
    const validateCurrentStep = () => {
        const currentStep = steps[activeStep];
        if (currentStep.validation) {
            const stepErrors = currentStep.validation(formData);
            setErrors(stepErrors || {});
            return !stepErrors;
        }
        return true;
    };

    // Handle step navigation
    const handleNext = () => {
        if (validateCurrentStep()) {
            if (activeStep < steps.length - 1) {
                setActiveStep(activeStep + 1);
            }
        } else {
            showToast('Please fill in all required fields before proceeding.', 'error');
        }
    };

    const handlePrevious = () => {
        if (activeStep > 0) {
            setActiveStep(activeStep - 1);
        }
    };

    // Handle form submission
    const handleSubmit = async () => {
        // Validate all steps
        let hasErrors = false;
        const allErrors: Record<string, string> = {};

        steps.forEach(step => {
            if (step.validation) {
                const stepErrors = step.validation(formData);
                if (stepErrors) {
                    Object.assign(allErrors, stepErrors);
                    hasErrors = true;
                }
            }
        });

        if (hasErrors) {
            setErrors(allErrors);
            showToast('Please fill in all required fields marked with *', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            const success = await onSave(formData);
            if (success) {
                showToast(`${entityType} has been created successfully.`, 'success');
            } else {
                showToast(`Failed to create ${entityType}. Please try again.`, 'error');
            }
        } catch (error) {
            showToast(`Failed to create ${entityType}. Please try again.`, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Duplicate check handlers
    const handleDuplicateCheck = async () => {
        if (!duplicateCheckConfig) return;

        setCheckingDuplicates(true);
        try {
            const results = await duplicateCheckConfig.checkFunction(duplicateCheckData);
            setDuplicateResults(results);

            if (results.length === 0) {
                showToast('No duplicates found. You can proceed.', 'success');
                setShowDuplicateModal(false);
            }
        } catch (error) {
            showToast('Failed to check for duplicates', 'error');
        } finally {
            setCheckingDuplicates(false);
        }
    };

    const openDuplicateCheckModal = () => {
        if (duplicateCheckConfig) {
            const initialCheckData: any = {};
            duplicateCheckConfig.fields.forEach(field => {
                initialCheckData[field.key] = '';
            });
            setDuplicateCheckData(initialCheckData);
            setDuplicateResults([]);
            setShowDuplicateModal(true);
        }
    };

    // Render step indicator
    const renderStepIndicator = () => {
        const stepperSteps: StepperStep[] = steps.map(step => ({
            label: step.title,
            icon: step.icon,
            description: step.isOptional ? 'Optional' : undefined
        }));

        return (
            <Stepper
                steps={stepperSteps}
                currentStep={activeStep + 1}
                className="mb-6"
                allowClickableSteps={true}
                onStepClick={(stepIndex) => {
                    // Only allow going back or to completed steps
                    if (stepIndex <= activeStep) {
                        setActiveStep(stepIndex);
                    }
                }}
            />
        );
    };

    // Render current step content
    const renderStepContent = () => {
        const currentStep = steps[activeStep];
        const StepComponent = currentStep.component;

        return (
            <StepComponent
                formData={formData}
                onChange={handleFieldChange}
                errors={errors}
                touched={touched}
            />
        );
    };

    // Render navigation buttons
    const renderNavigation = () => (
        <div className="flex justify-between mt-8">
            <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={activeStep === 0}
                className="flex items-center"
            >
                <ChevronLeft size={16} /> Previous
            </Button>

            <div className="flex gap-3">
                {duplicateCheckConfig && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={openDuplicateCheckModal}
                    >
                        Check Duplicates
                    </Button>
                )}

                {activeStep < steps.length - 1 ? (
                    <Button
                        type="button"
                        variant="primary"
                        onClick={handleNext}
                        className="flex items-center"
                    >
                        Next {activeStep < steps.length - 1 && <ChevronRight size={16} />}
                    </Button>
                ) : (
                    <Button
                        type="button"
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Creating...' : `Create ${entityType}`}
                    </Button>
                )}
            </div>
        </div>
    );

    // Render duplicate check modal
    const renderDuplicateModal = () => {
        if (!duplicateCheckConfig) return null;

        return (
            <Modal
                isOpen={showDuplicateModal}
                onClose={() => setShowDuplicateModal(false)}
                title="Check for Duplicates"
                size="lg"
            >
                <div className="space-y-4">
                    <p className="text-gray-600">
                        Enter information to check if a {entityType.toLowerCase()} with similar details already exists:
                    </p>

                    {duplicateCheckConfig.fields.map(field => (
                        <div key={field.key}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {field.label}
                            </label>
                            <input
                                type="text"
                                value={duplicateCheckData[field.key] || ''}
                                onChange={(e) => setDuplicateCheckData((prev: any) => ({
                                    ...prev,
                                    [field.key]: e.target.value
                                }))}
                                placeholder={field.placeholder}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    ))}

                    <div className="flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowDuplicateModal(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="primary"
                            onClick={handleDuplicateCheck}
                            disabled={checkingDuplicates}
                        >
                            {checkingDuplicates ? 'Checking...' : 'Check Duplicates'}
                        </Button>
                    </div>

                    {duplicateResults.length > 0 && (
                        <div className="mt-6">
                            <h4 className="text-lg font-medium text-red-600 mb-3">
                                Potential Duplicates Found
                            </h4>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            {duplicateCheckConfig.resultColumns.map(column => (
                                                <th
                                                    key={column.key}
                                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                >
                                                    {column.label}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {duplicateResults.map((result, index) => (
                                            <tr key={index}>
                                                {duplicateCheckConfig.resultColumns.map(column => (
                                                    <td
                                                        key={column.key}
                                                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                                                    >
                                                        {result[column.key]}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
        );
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
                <p className="text-gray-600">
                    Complete all required steps to create a new {entityType.toLowerCase()}.
                </p>
            </div>

            <Card className="p-6">
                {renderStepIndicator()}

                <div className="min-h-[400px]">
                    {renderStepContent()}
                </div>

                {renderNavigation()}
            </Card>

            {renderDuplicateModal()}
        </div>
    );
};

export default CreationFlowTemplate;
