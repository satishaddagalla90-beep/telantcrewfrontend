import React from 'react';
import './Timeline.css';

export interface TimelineStep {
  label: string;
  icon?: React.ReactNode;
  description?: string;
}

export interface TimelineProps {
  steps: TimelineStep[];
  currentStep: number;
  variant?: 'default' | 'compact' | 'vertical';
  showDescription?: boolean;
  className?: string;
  onStepClick?: (stepIndex: number) => void;
  allowClickableSteps?: boolean;
}

const Timeline: React.FC<TimelineProps> = ({
  steps,
  currentStep,
  variant = 'default',
  showDescription = false,
  className = '',
  onStepClick,
  allowClickableSteps = false
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

  const baseClasses = 'timeline-container';
  const variantClasses = {
    default: 'timeline-horizontal',
    compact: 'timeline-horizontal timeline-compact',
    vertical: 'timeline-vertical'
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {steps.map((step, index) => {
        const status = getStepStatus(index);
        const isClickable = allowClickableSteps && onStepClick;

        return (
          <div
            key={index}
            className={`timeline-step timeline-step--${status} ${isClickable ? 'timeline-step--clickable' : ''}`}
            onClick={() => handleStepClick(index)}
            role={isClickable ? 'button' : undefined}
            tabIndex={isClickable ? 0 : undefined}
            onKeyDown={(e) => {
              if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                handleStepClick(index);
              }
            }}
          >
            <div className="timeline-step__icon">
              {status === 'completed' ? (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : step.icon ? (
                step.icon
              ) : (
                <span className="timeline-step__number">{index + 1}</span>
              )}
            </div>

            <div className="timeline-step__content">
              <div className="timeline-step__label">{step.label}</div>
              {showDescription && step.description && (
                <div className="timeline-step__description">{step.description}</div>
              )}
            </div>

            {index < steps.length - 1 && variant !== 'vertical' && (
              <div className="timeline-step__connector" />
            )}

            {variant === 'vertical' && index < steps.length - 1 && (
              <div className="timeline-step__connector timeline-step__connector--vertical" />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Timeline;
