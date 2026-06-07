# Modular Creation Flow Template System

This document explains the new modular creation flow template system that allows you to easily create standardized forms for different entity types (Candidates, Clients, Vendors, etc.) with consistent UI, validation, and duplicate checking.

## Overview

The system consists of:

1. **CreationFlowTemplate**: A reusable template component
2. **Entity Configuration Files**: Define steps, validation, and initial data for each entity type
3. **Step Components**: Individual form sections that can be reused across entities
4. **Page Components**: Final pages that combine everything together

## File Structure

```
src/
├── components/
│   ├── templates/
│   │   └── CreationFlowTemplate/
│   │       ├── CreationFlowTemplate.tsx    # Main template
│   │       └── index.ts
│   ├── organisms/
│   │   ├── CandidateSteps/
│   │   │   ├── PersonalDetailsStep.tsx     # Candidate personal info step
│   │   │   └── ProfessionalDetailsStep.tsx # Candidate professional info step
│   │   ├── CandidateCreationConfig.tsx     # Candidate configuration
│   │   └── ClientCreationConfig.tsx        # Client configuration
│   └── ...existing atomic components
└── pages/
    ├── AddCandidate.tsx                    # Candidate creation page
    └── AddClient.tsx                       # Client creation page
```

## How to Use

### 1. Creating a New Entity Type

To add a new entity type (e.g., Vendor), follow these steps:

#### Step 1: Create Step Components

```tsx
// src/components/organisms/VendorSteps/BasicInfoStep.tsx
import React from 'react';
import FormField from '../../../molecules/FormField';
import { StepComponentProps } from '../../CreationFlowTemplate';

const VendorBasicInfoStep: React.FC<StepComponentProps> = ({
  formData,
  onFormDataChange,
  errors,
  touched,
  onFieldTouch,
}) => {
  const handleInputChange = (field: string, value: any) => {
    onFormDataChange(field, value);
    onFieldTouch(field);
  };

  return (
    <div className="space-y-6">
      <FormField
        label="Vendor Name*"
        error={
          errors.vendorName && touched.vendorName
            ? errors.vendorName
            : undefined
        }
        inputProps={{
          value: formData.vendorName || '',
          onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
            handleInputChange('vendorName', e.target.value),
          placeholder: 'Enter vendor name',
        }}
      />
      {/* Add more fields as needed */}
    </div>
  );
};

export default VendorBasicInfoStep;
```

#### Step 2: Create Configuration File

```tsx
// src/components/organisms/VendorCreationConfig.tsx
import React from 'react';
import { CreationStep } from '../templates/CreationFlowTemplate';
import VendorBasicInfoStep from './VendorSteps/BasicInfoStep';

// Icons (using SVG)
const VendorIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
    />
  </svg>
);

// Validation function
const validateVendorInfo = (formData: any) => {
  const errors: Record<string, string> = {};

  if (!formData.vendorName?.trim()) {
    errors.vendorName = 'Vendor name is required';
  }

  return Object.keys(errors).length > 0 ? errors : null;
};

export const vendorSteps: CreationStep[] = [
  {
    id: 'basic-info',
    title: 'Vendor Information',
    icon: <VendorIcon />,
    component: VendorBasicInfoStep,
    validation: validateVendorInfo,
  },
];

export const initialVendorFormData = {
  vendorId: `VENDOR-${Math.floor(10000 + Math.random() * 90000)}`,
  vendorName: '',
  contactPerson: '',
  email: '',
  phone: '',
};

export const vendorDuplicateCheckConfig = {
  fields: [
    {
      key: 'vendorName',
      label: 'Vendor Name',
      placeholder: 'Enter vendor name',
    },
    { key: 'email', label: 'Email', placeholder: 'Enter email address' },
  ],
  checkFunction: async (data: any) => {
    // Your duplicate check API call
    return [];
  },
  resultColumns: [
    { key: 'id', label: 'Vendor ID' },
    { key: 'vendorName', label: 'Vendor Name' },
  ],
};
```

#### Step 3: Create Page Component

```tsx
// src/pages/AddVendor.tsx
import React from 'react';
import CreationFlowTemplate from '../components/templates/CreationFlowTemplate';
import {
  vendorSteps,
  initialVendorFormData,
  vendorDuplicateCheckConfig,
} from '../components/organisms/VendorCreationConfig';

const AddVendor: React.FC = () => {
  const handleSubmit = async (formData: any) => {
    // Your API call to create vendor
    console.log('Creating vendor:', formData);
  };

  const handleCancel = () => {
    window.history.back();
  };

  return (
    <CreationFlowTemplate
      entityType="Vendor"
      title="Add New Vendor"
      steps={vendorSteps}
      initialFormData={initialVendorFormData}
      duplicateCheckConfig={vendorDuplicateCheckConfig}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      navigationItems={[
        { label: 'Home', href: '#', isActive: false },
        { label: 'Vendors', href: '#', isActive: true },
      ]}
      logoSrc="/path/to/logo.png"
    />
  );
};

export default AddVendor;
```

### 2. Available Template Props

```tsx
interface CreationFlowTemplateProps {
  entityType: string; // e.g., "Candidate", "Client", "Vendor"
  title: string; // Page title
  steps: CreationStep[]; // Array of step configurations
  initialFormData: any; // Initial form state
  duplicateCheckConfig?: DuplicateCheckConfig; // Optional duplicate checking
  showInitialDuplicateCheck?: boolean; // Show duplicate modal on load
  onSubmit: (formData: any) => Promise<void>;
  onCancel: () => void;
  onReset?: () => void;
  navigationItems?: NavigationItem[]; // Header navigation
  logoSrc?: string; // Logo URL
}
```

### 3. Step Component Interface

Every step component must implement:

```tsx
interface StepComponentProps {
  formData: any; // Current form data
  onFormDataChange: (field: string, value: any) => void;
  errors: Record<string, string>; // Validation errors
  touched: Record<string, boolean>; // Fields that have been touched
  onFieldTouch: (field: string) => void;
}
```

### 4. Validation Functions

```tsx
const validateStep = (formData: any): Record<string, string> | null => {
  const errors: Record<string, string> = {};

  // Add your validation logic
  if (!formData.requiredField?.trim()) {
    errors.requiredField = 'This field is required';
  }

  return Object.keys(errors).length > 0 ? errors : null;
};
```

## Features

### ✅ Standardized UI

- Consistent header with navigation
- Step indicator with progress tracking
- Standardized card layout
- Consistent button placement

### ✅ Form Management

- Automatic form state management
- Field validation with error display
- Touch state tracking
- Form reset functionality

### ✅ Duplicate Checking

- Configurable duplicate check fields
- Async duplicate detection
- Results display with action buttons
- Modal-based interface

### ✅ Validation System

- Step-by-step validation
- Real-time error display
- Touch-based error showing
- Form submission blocking on errors

### ✅ Navigation

- Step-by-step progression
- Click-to-navigate (with validation)
- Previous/Next buttons
- Auto-scroll on step change

### ✅ Accessibility

- Proper form labels
- Keyboard navigation support
- Screen reader friendly
- Focus management

## Examples

### Candidate Creation

- **Steps**: Personal Details, Professional Details, Education & Skills, Employment & Projects, Documents & Others
- **Validation**: Required fields, email format, PAN format
- **Duplicate Check**: PAN, Phone, Email

### Client Creation

- **Steps**: Company Information, Contacts & Requirements
- **Validation**: Required company details, email format
- **Duplicate Check**: Company name, Email, Phone

## Best Practices

1. **Keep Steps Focused**: Each step should handle a logical group of related fields
2. **Reuse Components**: Use existing atomic components (FormField, Input, etc.)
3. **Proper Validation**: Validate both on field level and step level
4. **Error Handling**: Show clear, actionable error messages
5. **Loading States**: Handle submission loading states properly
6. **Accessibility**: Use proper labels, IDs, and ARIA attributes

## Future Enhancements

- [ ] File upload support in steps
- [ ] Dynamic field addition (like employment history)
- [ ] Step-specific custom layouts
- [ ] Auto-save functionality
- [ ] Form data persistence
- [ ] Multi-language support
- [ ] Custom validation rules
- [ ] Conditional step display

This modular system makes it easy to create consistent, maintainable creation flows for any entity type in your application.
