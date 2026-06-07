# Validation Implementation Plan

## Goal
Add proper inline field validation with:
- Live error messages that only show AFTER user touches a field
- Save button disabled when form has validation errors
- Replace alert() calls with proper field-mapped errors

## Implementation for Each Component

### 1. Add Touched State Tracking
```typescript
const [educationTouched, setEducationTouched] = useState<
  Record<string, Record<string, boolean>>
>({});
```

### 2. Add Mark-as-Touched Functions
```typescript
const markEducationFieldTouched = (formId: string, field: keyof Education) => {
  setEducationTouched(prev => ({
    ...prev,
    [formId]: {
      ...prev[formId],
      [field]: true,
    },
  }));
};
```

### 3. Update onChange Handlers
Call `markFieldTouched()` when user changes a field

### 4. Add Two-Tier Validation Functions

**Internal validation (for Save button):**
```typescript
const validateEducationField = (form: Education, field: keyof Education): string => {
  // Returns error without checking touched state
}
```

**Display validation (for field error props):**
```typescript
const getEducationFieldError = (formId: string, field: keyof Education): string => {
  const isTouched = educationTouched[formId]?.[field];
  if (!isTouched) return ''; // KEY: Only show if touched

  return validateEducationField(form, field);
}
```

### 5. Wire Up Error Props
Add `error={getEducationFieldError(formId, field)}` to each field

### 6. Update Save Button
```typescript
disabled={isSaving[formId] || hasFormErrors(formId)}
```

## Files to Update
1. EducationSkillsStep.tsx
2. EmploymentProjectsStep.tsx
3. DocumentsOthersStep.tsx
