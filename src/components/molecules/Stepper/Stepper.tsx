import React from 'react';
import './Stepper.css';

export interface StepperStep {
    label: string;
    icon?: React.ReactNode;
    description?: string;
}

export interface StepperProps {
    steps: StepperStep[];
    currentStep: number;
    className?: string;
    onStepClick?: (stepIndex: number) => void;
    allowClickableSteps?: boolean;
    variant?: 'default' | 'compact';
}

const Stepper: React.FC<StepperProps> = ({
    steps,
    currentStep,
    className = '',
    onStepClick,
    allowClickableSteps = false,
    variant = 'default'
}) => {
    const getStepStatus = (stepIndex: number) => {
        if (stepIndex < currentStep - 1) return 'completed';
        if (stepIndex === currentStep - 1) return 'active';
        return 'pending';
    };

    const handleStepClick = (stepIndex: number) => {
        if (allowClickableSteps && onStepClick) {
            onStepClick(stepIndex);
        }
    };

    return (
        <div className={`stepper-container ${variant === 'compact' ? 'stepper-compact' : ''} ${className}`}>
            {steps.map((step, index) => {
                const status = getStepStatus(index);
                const isClickable = allowClickableSteps && onStepClick;

                return (
                    <div
                        key={index}
                        className={`step-item step-item--${status} ${isClickable ? 'step-item--clickable' : ''}`}
                        onClick={() => isClickable && handleStepClick(index)}
                        role={isClickable ? 'button' : undefined}
                        tabIndex={isClickable ? 0 : undefined}
                        onKeyDown={(e) => {
                            if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
                                e.preventDefault();
                                handleStepClick(index);
                            }
                        }}
                    >
                        <div className="step-icon">
                            {status === 'completed' ? (
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            ) : step.icon ? (
                                step.icon
                            ) : (
                                <span className="step-number">{index + 1}</span>
                            )}
                        </div>

                        <div className="step-label">{step.label}</div>

                        {step.description && (
                            <div className="step-description">{step.description}</div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default Stepper;
