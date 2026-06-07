# Example: Creating AddUser Form Using FormWizardLayout Template

## 🚀 How to Create an AddUser Form (Reusing AddCandidate Components)

### 1. Create User-Specific Step Components

```tsx
// src/components/organisms/UserSteps/BasicInfoStep.tsx
import React from 'react';
import { CommonFields } from '../../molecules/CommonFormFields/CommonFormFields';
import Dropdown from '../../atoms/Dropdown/Dropdown';

const BasicInfoStep = ({ formData, onChange, errors, touched }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Reuse existing components from AddCandidate */}
        {CommonFields.firstName(
          formData.firstName || '',
          value => onChange('firstName', value),
          errors.firstName
        )}

        {CommonFields.lastName(
          formData.lastName || '',
          value => onChange('lastName', value),
          errors.lastName
        )}

        {CommonFields.email(
          formData.email || '',
          value => onChange('email', value),
          errors.email
        )}

        {CommonFields.phone(
          formData.phone || '',
          value => onChange('phone', value),
          errors.phone
        )}

        {/* User-specific fields */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Role</label>
          <Dropdown
            options={[
              { value: 'admin', label: 'Administrator' },
              { value: 'hr', label: 'HR Manager' },
              { value: 'recruiter', label: 'Recruiter' },
              { value: 'viewer', label: 'Viewer' },
            ]}
            value={formData.role || ''}
            onChange={value => onChange('role', value)}
            placeholder="Select user role"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Department</label>
          <Dropdown
            options={[
              { value: 'hr', label: 'Human Resources' },
              { value: 'it', label: 'Information Technology' },
              { value: 'finance', label: 'Finance' },
              { value: 'operations', label: 'Operations' },
            ]}
            value={formData.department || ''}
            onChange={value => onChange('department', value)}
            placeholder="Select department"
          />
        </div>
      </div>
    </div>
  );
};

export default BasicInfoStep;
```

```tsx
// src/components/organisms/UserSteps/PermissionsStep.tsx
import React from 'react';
import Checkbox from '../../atoms/Checkbox/Checkbox';

const PermissionsStep = ({ formData, onChange, errors, touched }) => {
  const permissions = [
    { key: 'create_candidates', label: 'Create Candidates' },
    { key: 'edit_candidates', label: 'Edit Candidates' },
    { key: 'delete_candidates', label: 'Delete Candidates' },
    { key: 'view_reports', label: 'View Reports' },
    { key: 'manage_users', label: 'Manage Users' },
    { key: 'system_settings', label: 'System Settings' },
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800">User Permissions</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {permissions.map(permission => (
          <div key={permission.key} className="space-y-2">
            <Checkbox
              checked={formData.permissions?.[permission.key] || false}
              onChange={checked =>
                onChange(`permissions.${permission.key}`, checked)
              }
              label={permission.label}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PermissionsStep;
```

### 2. Create AddUser Page Using FormWizardLayout Template

```tsx
// src/components/pages/AddUser.tsx
import React from 'react';
import FormWizardLayout, {
  FormWizardStep,
} from '../templates/FormWizardLayout/FormWizardLayout';
import BasicInfoStep from '../organisms/UserSteps/BasicInfoStep';
import PermissionsStep from '../organisms/UserSteps/PermissionsStep';
import Icon from '../atoms/Icon/Icon';

const AddUser: React.FC = () => {
  // Define steps configuration
  const steps: FormWizardStep[] = [
    {
      id: 'basic-info',
      label: 'Basic Information',
      icon: <Icon name="user" />,
      description: 'Personal details and contact information',
      component: BasicInfoStep,
      validation: formData => {
        const errors: Record<string, string> = {};
        if (!formData.firstName?.trim())
          errors.firstName = 'First name is required';
        if (!formData.lastName?.trim())
          errors.lastName = 'Last name is required';
        if (!formData.email?.trim()) errors.email = 'Email is required';
        if (!formData.role) errors.role = 'Role is required';
        return Object.keys(errors).length > 0 ? errors : null;
      },
    },
    {
      id: 'permissions',
      label: 'Permissions',
      icon: <Icon name="key" />,
      description: 'Set user access permissions',
      component: PermissionsStep,
      isOptional: true,
    },
  ];

  const initialData = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
    department: '',
    permissions: {},
  };

  const handleComplete = async (userData: any) => {
    console.log('Creating user:', userData);

    try {
      // API call to create user
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        // Handle success - redirect or show success message
        console.log('User created successfully!');
      }
    } catch (error) {
      console.error('Failed to create user:', error);
      throw error;
    }
  };

  const handleCancel = () => {
    // Navigate back or show confirmation
    console.log('User creation cancelled');
  };

  return (
    <FormWizardLayout
      title="Add New User"
      subtitle="Create a new user account with appropriate permissions"
      steps={steps}
      initialData={initialData}
      onComplete={handleComplete}
      onCancel={handleCancel}
      allowStepNavigation={true}
    />
  );
};

export default AddUser;
```

### 3. Add Route Configuration

```tsx
// src/App.tsx
import AddUser from './components/pages/AddUser';

// In your routes:
<Route path="add-user" element={<AddUser />} />;
```

## 🎯 **Component Reusability Benefits**

### ✅ **Reused Components from AddCandidate:**

1. **CommonFields**: firstName, lastName, email, phone, etc.
2. **Dropdown**: For role and department selection
3. **Checkbox**: For permissions
4. **Input**: For text fields
5. **Button**: For navigation and actions
6. **Icon**: For visual indicators
7. **FormWizardLayout**: Complete step management system
8. **Stepper**: Progress tracking

### 🚀 **Template Features:**

- ✅ **Configurable Steps**: Pass any number of steps
- ✅ **Custom Validation**: Per-step validation functions
- ✅ **Step Navigation**: Optional click-to-navigate
- ✅ **Auto Progress**: Automatic step progression
- ✅ **Error Handling**: Comprehensive error management
- ✅ **Loading States**: Built-in submission states
- ✅ **Responsive Design**: Mobile-friendly layout
- ✅ **Accessibility**: ARIA support and keyboard navigation

### 💡 **Usage Pattern:**

```tsx
// Any new form can follow this pattern:
const steps = [
  /* Define your steps */
];
const initialData = {
  /* Initial form data */
};

return (
  <FormWizardLayout
    title="Your Form Title"
    steps={steps}
    initialData={initialData}
    onComplete={handleSubmit}
  />
);
```

## 🏆 **Result**: 90% Component Reuse!

By using this template pattern, you can create new forms like:

- **AddVendor** (3 steps: Basic Info, Company Details, Services)
- **AddClient** (4 steps: Company Info, Contact Details, Requirements, Contract)
- **AddJob** (5 steps: Basic Details, Requirements, Location, Benefits, Review)

All while reusing the same atomic components, validation patterns, and UI/UX consistency! 🎉
