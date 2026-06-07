import React, { useState, ReactNode } from 'react';
import Stepper, { StepperStep } from '../../molecules/Stepper/Stepper';
import Button from '../../atoms/Button/Button';
import Icon from '../../atoms/Icon/Icon';
import { showSuccessToast } from '../../../utils/toast';
import ConfirmationModal from '../../molecules/ConfirmationModal/ConfirmationModal';
import { useUnsavedChangesWarning } from '../../../hooks/useUnsavedChangesWarning';

export interface FormWizardStep {
  id: string;
  label: string;
  icon?: ReactNode;
  description?: string;
  component: React.ComponentType<any>;
  validation?: (formData: any) => Record<string, string> | null;
  isOptional?: boolean;
  resetFields?: string[] | ((formData: any) => Partial<any>); // Fields to reset or function returning reset data
}

export interface FormWizardLayoutProps {
  title: string;
  subtitle?: string;
  steps: FormWizardStep[];
  initialData?: any;
  onComplete?: (data: any) => Promise<void>;
  onCancel?: () => void;
  className?: string;
  allowStepNavigation?: boolean;
  showResetButton?: boolean; // Option to show/hide reset button
  showSaveAsDraft?: boolean; // Option to show/hide save as draft button
  onSaveAsDraft?: (data: any) => Promise<void>; // Custom save as draft handler
  stepProps?: any; // Additional props to pass to step components
  onDiscardDraft?: () => void; // Callback to clear draft when leaving with unsaved changes
  banner?: React.ReactNode; // Optional banner to display at the top of the card
  showCustomHeader?: boolean; // Option to hide/show the default centered header
}

const FormWizardLayout: React.FC<FormWizardLayoutProps> = ({
  title,
  subtitle,
  steps,
  initialData = {},
  onComplete,
  onCancel,
  className = '',
  allowStepNavigation = false,
  showResetButton = true,
  showSaveAsDraft = false,
  onSaveAsDraft,
  stepProps = {},
  onDiscardDraft,
  banner,
  showCustomHeader = true,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(new Set([0])); // Track visited steps, start with step 0
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigationBlockerEnabledRef = React.useRef(true);

  // Check for unsaved changes
  const isDirty = React.useMemo(() => {
    return JSON.stringify(formData) !== JSON.stringify(initialData);
  }, [formData, initialData]);

  const { showModal, confirmNavigation, cancelNavigation } = useUnsavedChangesWarning(
    isDirty,
    navigationBlockerEnabledRef
  );

  const handleConfirmNavigation = () => {
    if (onDiscardDraft) {
      onDiscardDraft();
    }
    confirmNavigation();
  };
  // Clear errors whenever the current step changes
  React.useEffect(() => {
    setErrors({});
  }, [currentStep]);

  // Check if a step has validation errors (for visited required steps)
  const getStepValidationStatus = (
    stepIndex: number
  ): 'valid' | 'invalid' | 'unvisited' => {
    const step = steps[stepIndex];

    // Skip validation check for optional or unvisited steps
    if (step.isOptional || !visitedSteps.has(stepIndex)) {
      return 'unvisited';
    }

    if (step.validation) {
      const stepErrors = step.validation(formData);
      return stepErrors && Object.keys(stepErrors).length > 0
        ? 'invalid'
        : 'valid';
    }

    return 'valid';
  };

  // Convert steps to stepper format
  const stepperSteps: StepperStep[] = steps.map((step, index) => ({
    label: step.label,
    icon: step.icon,
    description: step.description,
  }));

  const currentStepData = steps[currentStep];

  const handleFieldChange = (fieldOrUpdates: string | any, value?: any) => {
    // Support both formats:
    // 1. onChange(field, value) - two parameters
    // 2. onChange({ field: value, ... }) - object parameter
    let updates: any;

    if (typeof fieldOrUpdates === 'string') {
      // Format 1: onChange('field', value)
      updates = { [fieldOrUpdates]: value };
    } else {
      // Format 2: onChange({ field: value, ... })
      updates = fieldOrUpdates;
    }

    setFormData((prev: any) => ({
      ...prev,
      ...updates,
    }));

    // Clear errors for updated fields
    const updatedFields = Object.keys(updates);
    setErrors((prev: Record<string, string>) => {
      const newErrors = { ...prev };
      updatedFields.forEach(field => {
        delete newErrors[field];
      });
      return newErrors;
    });

    // Mark fields as touched
    setTouched((prev: Record<string, boolean>) => ({
      ...prev,
      ...updatedFields.reduce((acc, field) => ({ ...acc, [field]: true }), {}),
    }));
  };

  const validateCurrentStep = (): boolean => {
    console.log('=== FormWizardLayout validateCurrentStep ===');
    console.log('Current step index:', currentStep);
    console.log('Current step data:', steps[currentStep]);

    const step = steps[currentStep];

    // Skip validation for optional steps entirely - they should never block progression
    if (step.isOptional) {
      console.log('Skipping validation for optional step');
      setErrors({});
      return true;
    }

    if (step.validation) {
      const stepErrors = step.validation(formData);

      if (stepErrors && Object.keys(stepErrors).length > 0) {
        // Only set errors for the current step, clear any previous errors
        setErrors(stepErrors);
        return false;
      }
    } else {
      console.log('No validation function for this step');
    }

    // Clear errors when validation passes or no validation exists
    setErrors({});
    return true;
  };

  const validateAllRequiredSteps = (): {
    isValid: boolean;
    firstErrorStep?: number;
  } => {
    console.log('=== FormWizardLayout validateAllRequiredSteps ===');

    // Only validate required steps that have been visited
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];

      // Skip optional steps and unvisited steps
      if (step.isOptional || !visitedSteps.has(i)) {
        console.log(
          `Skipping step ${i}: ${step.isOptional ? 'optional' : 'unvisited'}`
        );
        continue;
      }

      if (step.validation) {
        const stepErrors = step.validation(formData);
        if (stepErrors && Object.keys(stepErrors).length > 0) {
          console.log(`Validation failed for step ${i}:`, stepErrors);
          return { isValid: false, firstErrorStep: i };
        }
      }
    }

    return { isValid: true };
  };

  const handleNext = () => {
    // Clear any existing errors before proceeding
    setErrors({});

    // Check if current step has custom navigation (e.g., Education & Skills step or Employment & Projects step)
    const currentStepData = steps[currentStep];
    const educationTabNavigation = formData._educationSkillsTabNavigation;
    const employmentTabNavigation = formData._employmentProjectsTabNavigation;
    const documentsTabNavigation =
      formData[`_${currentStepData.id}TabNavigation`];

    if (currentStepData.id === 'education-skills' && educationTabNavigation) {
      // Use the step's custom navigation logic
      const shouldProceedToNextStep = educationTabNavigation.handleNext();
      if (!shouldProceedToNextStep) {
        // Don't proceed to next wizard step yet (tab navigation handled internally)
        return;
      }
    } else if (
      currentStepData.id === 'employment-projects' &&
      employmentTabNavigation
    ) {
      // Use the step's custom navigation logic
      const shouldProceedToNextStep = employmentTabNavigation.handleNext();
      if (!shouldProceedToNextStep) {
        // Don't proceed to next wizard step yet (tab navigation handled internally)
        return;
      }
    } else if (
      currentStepData.id === 'documents-others' &&
      documentsTabNavigation
    ) {
      // Use the step's custom navigation logic
      const shouldProceedToNextStep = documentsTabNavigation.handleNext();
      if (!shouldProceedToNextStep) {
        // Don't proceed to next wizard step yet (tab navigation handled internally)
        return;
      }
    }

    // Standard validation
    if (!validateCurrentStep()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Check if the current step has custom navigation logic
    const stepNavKey = `_${steps[currentStep].id}TabNavigation`;
    const stepNavData = formData[stepNavKey];

    if (stepNavData && stepNavData.handleNext) {
      const shouldProceed = stepNavData.handleNext();
      if (!shouldProceed) {
        return; // Stay on current step, let the component handle internal navigation
      }
    }

    if (currentStep < steps.length - 1) {
      console.log('Moving to next step');
      const nextStep = currentStep + 1;

      // Clear errors when moving to next step
      setErrors({});
      // Mark next step as visited
      setVisitedSteps(prev => {
        const newVisited = new Set(prev);
        newVisited.add(nextStep);
        return newVisited;
      });
      setCurrentStep(nextStep);
    } else {
      console.log('Last step reached, calling handleSubmit');
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    // Clear any existing errors before proceeding
    setErrors({});

    // Check if current step has custom navigation (e.g., Education & Skills step or Employment & Projects step)
    const currentStepData = steps[currentStep];
    const educationTabNavigation = formData._educationSkillsTabNavigation;
    const employmentTabNavigation = formData._employmentProjectsTabNavigation;
    const documentsTabNavigation =
      formData[`_${currentStepData.id}TabNavigation`];

    if (currentStepData.id === 'education-skills' && educationTabNavigation) {
      // Use the step's custom navigation logic
      const shouldGoToPreviousStep = educationTabNavigation.handlePrevious();
      if (!shouldGoToPreviousStep) {
        // Don't go to previous wizard step yet (tab navigation handled internally)
        return;
      }
    } else if (
      currentStepData.id === 'employment-projects' &&
      employmentTabNavigation
    ) {
      // Use the step's custom navigation logic
      const shouldGoToPreviousStep = employmentTabNavigation.handlePrevious();
      if (!shouldGoToPreviousStep) {
        // Don't go to previous wizard step yet (tab navigation handled internally)
        return;
      }
    } else if (
      currentStepData.id === 'documents-others' &&
      documentsTabNavigation
    ) {
      // Use the step's custom navigation logic
      const shouldGoToPreviousStep = documentsTabNavigation.handlePrevious();
      if (!shouldGoToPreviousStep) {
        // Don't go to previous wizard step yet (tab navigation handled internally)
        return;
      }
    }

    // Check if the current step has generic custom navigation logic
    const stepNavKey = `_${steps[currentStep].id}TabNavigation`;
    const stepNavData = formData[stepNavKey];

    if (stepNavData && stepNavData.handlePrevious) {
      const shouldProceed = stepNavData.handlePrevious();
      if (!shouldProceed) {
        return; // Stay on current step, let the component handle internal navigation
      }
    }

    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      // Clear errors when moving to previous step
      setErrors({});
      setCurrentStep(prevStep);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    if (allowStepNavigation && stepIndex <= currentStep) {
      // Clear errors when navigating directly to a step
      setErrors({});
      // Mark step as visited if not already
      setVisitedSteps(prev => {
        const newVisited = new Set(prev);
        newVisited.add(stepIndex);
        return newVisited;
      });
      setCurrentStep(stepIndex);
    }
  };

  const handleSubmit = async () => {
    if (!onComplete) return;

    // Validate all required steps before final submission
    const validationResult = validateAllRequiredSteps();
    if (
      !validationResult.isValid &&
      validationResult.firstErrorStep !== undefined
    ) {
      console.log(
        'Validation failed, navigating to first error step:',
        validationResult.firstErrorStep
      );

      // Navigate to the first step with errors
      setCurrentStep(validationResult.firstErrorStep);

      // Re-run validation for that step to show errors
      const step = steps[validationResult.firstErrorStep];
      if (step.validation) {
        const stepErrors = step.validation(formData);
        if (stepErrors) {
          setErrors(stepErrors);
        }
      }

      // Scroll to top to show errors
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    navigationBlockerEnabledRef.current = false;
    try {
      console.log('Calling onComplete with form data...');
      await onComplete(formData);
      console.log('onComplete call successful');
      // Success: keep blocker disabled so navigate() goes through
    } catch (error) {
      console.error('Form submission error:', error);
      // Re-enable blocker only on error (user stays on the form)
      navigationBlockerEnabledRef.current = true;
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    const StepComponent = currentStepData.component;

    // For optional steps, don't pass errors unless the step has been visited and validated
    const shouldShowErrors =
      !currentStepData.isOptional || visitedSteps.has(currentStep);
    const currentErrors = shouldShowErrors ? errors : {};
    const currentTouched = shouldShowErrors ? touched : {};
    const stepSpecificProps = stepProps[currentStepData.id] || {};

    return (
      <StepComponent
        formData={formData}
        onChange={handleFieldChange}
        errors={currentErrors}
        touched={currentTouched}
        onNext={handleNext}
        onPrevious={handlePrevious}
        currentStep={currentStep}
        totalSteps={steps.length}
        {...stepSpecificProps}
      />
    );
  };

  const handleResetCurrentStep = () => {
    const step = steps[currentStep];

    if (step.resetFields) {
      let resetData: Partial<any> = {};

      if (typeof step.resetFields === 'function') {
        // If resetFields is a function, call it with current form data
        resetData = step.resetFields(formData);
      } else if (Array.isArray(step.resetFields)) {
        // If resetFields is an array of field names, reset those fields
        step.resetFields.forEach(field => {
          resetData[field] = getDefaultValueForField(field);
        });
      }

      setFormData((prev: any) => ({ ...prev, ...resetData }));

      // Clear errors for reset fields
      const fieldsToReset =
        typeof step.resetFields === 'function'
          ? Object.keys(resetData)
          : step.resetFields;

      setErrors((prev: Record<string, string>) => {
        const newErrors = { ...prev };
        fieldsToReset.forEach(field => {
          delete newErrors[field];
        });
        return newErrors;
      });
    }
  };

  const getDefaultValueForField = (fieldName: string): any => {
    // Return appropriate default values based on field name patterns
    if (fieldName.includes('Date') || fieldName.endsWith('_date')) {
      return '';
    }
    if (fieldName.includes('email') || fieldName.endsWith('_email')) {
      return '';
    }
    if (fieldName.includes('phone') || fieldName.endsWith('_phone')) {
      return '';
    }
    if (
      fieldName.includes('contacts') ||
      fieldName.includes('documents') ||
      fieldName.includes('contracts')
    ) {
      return [];
    }
    if (fieldName.includes('id') || fieldName.endsWith('_id')) {
      return '';
    }
    // Default to empty string for most fields
    return '';
  };

  const handleSaveAsDraft = async () => {
    if (onSaveAsDraft) {
      try {
        await onSaveAsDraft(formData);
      } catch (error) {
        console.error('Save as draft error:', error);
      }
    } else {
      // Default behavior - could save to localStorage or show notification
      localStorage.setItem(
        `draft_${title.toLowerCase().replace(/\s+/g, '_')}`,
        JSON.stringify(formData)
      );
      showSuccessToast('Saved as draft!');
    }
  };

  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  // Helper function to get Next button text
  const getNextButtonText = () => {
    if (isSubmitting) return 'Submitting...';
    if (isLastStep) return 'Submit';

    // Always return "Next" for all non-final steps
    return 'Next';
  };

  // Enhanced helper function to get button content with icon
  const getButtonContent = () => {
    // Check if we're on the last step with custom tab navigation
    if (isLastStep) {
      const stepNavKey = `_${steps[currentStep].id}TabNavigation`;
      const stepNavData = formData[stepNavKey];

      // If step has tab navigation, only show Submit when on the final tab
      if (stepNavData && stepNavData.activeTab) {
        // For documents-others step, only show Submit when on 'others' tab
        if (steps[currentStep].id === 'documents-others') {
          return stepNavData.activeTab === 'others' ? (
            <>
              Submit
              <Icon name="check" className="w-4 h-4 ml-2" />
            </>
          ) : (
            <>
              Next
              <Icon name="caret-right" className="w-4 h-4 ml-2" />
            </>
          );
        }
        // For education-skills step, only show Submit when on 'skills' tab
        else if (steps[currentStep].id === 'education-skills') {
          return stepNavData.activeTab === 'skills' ? (
            <>
              Submit
              <Icon name="check" className="w-4 h-4 ml-2" />
            </>
          ) : (
            <>
              Next
              <Icon name="caret-right" className="w-4 h-4 ml-2" />
            </>
          );
        }
        // For employment-projects step, only show Submit when on 'certifications' tab
        else if (steps[currentStep].id === 'employment-projects') {
          return stepNavData.activeTab === 'certifications' ? (
            <>
              Submit
              <Icon name="check" className="w-4 h-4 ml-2" />
            </>
          ) : (
            <>
              Next
              <Icon name="caret-right" className="w-4 h-4 ml-2" />
            </>
          );
        }
      }

      // Default behavior for last step without tab navigation
      return (
        <>
          Submit
          <Icon name="check" className="w-4 h-4 ml-2" />
        </>
      );
    } else {
      // Not the last step, always show Next
      return (
        <>
          Next
          <Icon name="caret-right" className="w-4 h-4 ml-2" />
        </>
      );
    }
  };

  return (
    <div className={`h-full bg-gray-50 py-8 overflow-y-auto ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        {showCustomHeader && (
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
            {subtitle && <p className="mt-2 text-lg text-gray-600">{subtitle}</p>}
          </div>
        )}

        {/* Progress Stepper */}
        <Stepper
          steps={stepperSteps}
          currentStep={currentStep + 1}
          className="mb-8"
          allowClickableSteps={allowStepNavigation}
          onStepClick={handleStepClick}
        />

        {/* Common Step Actions */}
        {(showResetButton || showSaveAsDraft) && (
          <div className="flex gap-2 justify-end mb-6">
            {showResetButton && steps[currentStep].resetFields && (
              <button
                type="button"
                className="border border-gray-400 text-gray-700 px-4 py-2 rounded font-semibold hover:bg-gray-100"
                onClick={handleResetCurrentStep}
              >
                Reset
              </button>
            )}
            {/* {showSaveAsDraft && (
              <button
                type="button"
                className="border border-yellow-400 bg-yellow-400 text-white px-4 py-2 rounded font-semibold hover:bg-yellow-500"
                onClick={handleSaveAsDraft}
              >
                Save as Draft
              </button>
            )} */}
          </div>
        )}
        {/* Step Content */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          {/* Optional Banner */}
          {banner && <div className="border-b border-gray-100">{banner}</div>}

          {/* Validation Errors Display */}
          {Object.keys(errors).length > 0 && (
            <div className="px-6 py-4 bg-red-50 border-b border-red-200">
              <div className="flex items-start">
                <Icon
                  name="alert"
                  className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0"
                />
                <div>
                  <h4 className="text-sm font-medium text-red-800 mb-2">
                    Please fix the following errors before proceeding:
                  </h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    {Object.entries(errors).map(([field, error]) => (
                      <li key={field} className="flex items-center">
                        <span className="w-2 h-2 bg-red-400 rounded-full mr-2 flex-shrink-0"></span>
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="px-6 py-8">{renderStepContent()}</div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mt-8">
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={isFirstStep && (() => {
                const stepNavKey = `_${steps[currentStep].id}TabNavigation`;
                const stepNavData = formData[stepNavKey];
                // If we have nav data and explicitly NOT on first sub tab, we can go back
                if (stepNavData && stepNavData.isFirstSubTab === false) {
                  return false;
                }
                return true;
              })()}
              className="flex items-center"
            >
              <Icon name="caret-left" className="w-4 h-4 mr-2" />
              Previous
            </Button>

            {onCancel && (
              <Button
                variant="outline"
                onClick={onCancel}
                className="flex items-center text-red-600 border-red-300 hover:bg-red-50"
              >
                <Icon name="close" className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            )}
          </div>

          <Button
            onClick={handleNext}
            disabled={isSubmitting}
            className="flex items-center"
          >
            {isSubmitting ? (
              <>
                <Icon name="loading" className="w-4 h-4 mr-2 animate-spin" />
                {getNextButtonText()}
              </>
            ) : (
              getButtonContent()
            )}
          </Button>
        </div>

        {/* Progress Information */}
        <div className="flex justify-center mt-6">
          <div className="text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-full">
            Step {currentStep + 1} of {steps.length}: {currentStepData.label}
            {currentStepData.isOptional && (
              <span className="ml-2 text-xs text-gray-400">(Optional)</span>
            )}
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showModal}
        onClose={cancelNavigation}
        onConfirm={handleConfirmNavigation}
        title="Unsaved Changes"
        message="You have unsaved changes. Are you sure you want to leave this page? Your changes will be lost."
        confirmText="Yes, Leave"
        cancelText="No, Stay"
        variant="warning"
      />
    </div >
  );
};

export default FormWizardLayout;
