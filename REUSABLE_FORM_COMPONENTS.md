# Reusable Form Components

This document outlines the reusable form components created to maintain consistency and reduce code duplication across the application.

## Components

### 1. FormField (`/src/components/atoms/FormField/FormField.tsx`)

A versatile input field component that handles text, number, email, and other input types.

**Props:**

- `label: string` - Field label
- `type?: 'text' | 'email' | 'password' | 'tel' | 'url' | 'number' | 'search' | 'date'` - Input type
- `value: string` - Current value
- `onChange: (value: string) => void` - Change handler
- `placeholder?: string` - Placeholder text
- `required?: boolean` - Whether field is required
- `error?: string` - Error message to display
- `min?: string | number` - Min value (for numbers)
- `max?: string | number` - Max value (for numbers)
- `step?: string | number` - Step value (for numbers)
- `className?: string` - Custom CSS class

**Usage:**

```tsx
<FormField
  label="Full Name*"
  type="text"
  value={name}
  onChange={setName}
  placeholder="Enter your name"
  required
  error={errors.name}
/>
```

### 2. SelectField (`/src/components/atoms/SelectField/SelectField.tsx`)

A reusable dropdown/select component.

**Props:**

- `label: string` - Field label
- `value: string` - Selected value
- `onChange: (value: string) => void` - Change handler
- `options: SelectOption[]` - Array of options with {value, label}
- `placeholder?: string` - Placeholder option text
- `required?: boolean` - Whether field is required
- `error?: string` - Error message to display
- `className?: string` - Custom CSS class

**Usage:**

```tsx
<SelectField
  label="Gender*"
  value={gender}
  onChange={setGender}
  options={[
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
  ]}
  placeholder="Select gender"
  required
/>
```

### 3. FormUtils (`/src/components/utils/FormUtils.tsx`)

A utility class with predefined form fields and common field types.

**Static Methods:**

- `createTextField()` - Creates a text input field
- `createNumberField()` - Creates a number input field
- `createEmailField()` - Creates an email input field
- `createSelectField()` - Creates a select dropdown field
- `createTextAreaField()` - Creates a textarea field
- `educationTypeField()` - Predefined education type selector
- `skillExpertiseField()` - Predefined skill level selector
- `skillRatingField()` - Predefined skill rating field (1-5)
- `experienceField()` - Predefined experience field

**Usage:**

```tsx
// Simple text field
{
  FormUtils.createTextField('College Name*', college, setCollege, {
    placeholder: 'Enter college name',
    required: true,
  });
}

// Predefined education type field
{
  FormUtils.educationTypeField(educationType, setEducationType);
}

// Experience field with proper number validation
{
  FormUtils.experienceField(
    'Total Experience (Years)',
    experience,
    setExperience
  );
}
```

## Predefined Options

The FormUtils includes commonly used option sets:

- `EDUCATION_TYPES` - School, Undergraduate, Postgraduate, Doctorate
- `SKILL_EXPERTISE_LEVELS` - Beginner, Intermediate, Advanced, Expert
- `NOTICE_PERIODS` - Immediate, 15 Days, 1 Month, etc.
- `JOB_PREFERENCES` - Full Time, Part Time, Contract, Freelance
- `GENDER_OPTIONS` - Male, Female, Other
- `MARITAL_STATUS_OPTIONS` - Single, Married, Divorced, Widowed

## Benefits

1. **Consistency** - All forms use the same styling and behavior
2. **Maintainability** - Changes to form styles can be made in one place
3. **Reusability** - Components can be used across different forms
4. **Type Safety** - Full TypeScript support with proper types
5. **Error Handling** - Built-in error display and validation states
6. **Accessibility** - Proper labels and ARIA attributes
7. **DRY Principle** - Eliminates code duplication

## Migration from Direct HTML

Instead of:

```tsx
<div className="col-span-1">
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Education Type
  </label>
  <select
    value={educationType}
    onChange={e => setEducationType(e.target.value)}
    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    <option value="">Select type</option>
    <option value="school">School</option>
    <option value="undergraduate">Undergraduate</option>
    <option value="postgraduate">Postgraduate</option>
    <option value="doctorate">Doctorate</option>
  </select>
</div>
```

Use:

```tsx
{
  FormUtils.educationTypeField(educationType, setEducationType);
}
```

This approach provides better maintainability, consistency, and reduces the likelihood of errors.
