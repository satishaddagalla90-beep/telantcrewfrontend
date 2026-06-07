# Job Preference Dropdown Implementation

## Overview
Successfully added a new "Job Preference" dropdown field to the ProfessionalDetailsForm that fetches data from the `/candidates/dropdowns/Job_Type` API endpoint.

## Changes Made

### 1. API Integration (`src/utils/api/dropdowns.ts`)
- Added `fetchJobType()` function to fetch from `/candidates/dropdowns/Job_Type`
- Added export for the new function
- Uses the existing `fetchCandidateDropdown` pattern

### 2. Hook Integration (`src/hooks/useDropdowns.ts`)
- Added `'jobType'` to the dropdown types in `useDropdownData` hook
- Added case handling for `'jobType'` in the switch statement
- Follows the same pattern as other dropdown types

### 3. Form Component (`ProfessionalDetailsForm.tsx`)
- Added Job_Type dropdown API integration using `useDropdownData('jobType')`
- Created `jobTypeSelectOptions` with placeholder
- Added the dropdown field in the UI after the "Shifts" dropdown
- Reorganized the grid layout to accommodate the new field:
  - Row 3: Job Open Type, Shifts, Job Preference, (empty space)
  - Row 4: (empty), (empty), Career Break, Differently Abled
  - Row 5: (empty), (empty), Career Break Type, Differently Abled Type

### 4. Form Data Structure
- Added `job_type?: string` to `ProfessionalDetailsFormProps.formData`
- Added `job_type: string` to `CandidateFormData` interface
- Added `job_type: string` to `CandidateCreateRequest` interface
- Added initial value `job_type: ''` in the form initialization

### 5. API Submission Mapping (`AddCandidate.tsx`)
- Added mapping: `job_type: extractValue(formData.job_type || '')`
- Ensures the field is properly included in the API payload

## Field Details

### UI Implementation
```tsx
{/* Job Preference (Job Type) - dynamic dropdown with API options */}
<EnhancedInputField
  label="Job Preference"
  value={formData.job_type || ''}
  onChange={(value: string) => onChange('job_type', value)}
  error={errors.job_type || jobTypeError || undefined}
  type="select"
  options={jobTypeSelectOptions}
  gridCols="col-span-1"
  disabled={jobTypeLoading}
/>
```

### API Endpoint
- **URL**: `/candidates/dropdowns/Job_Type`
- **Method**: GET
- **Response Format**:
```json
{
  "dropdown_type": "Job_Type",
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 3,
    "pages": 1
  },
  "data": [
    "Freelancer",
    "PartTime",
    "FullTime"
  ]
}
```

### Form Flow
1. **Load**: Automatically fetches Job_Type options when form loads
2. **Select**: User can select from dropdown options (Freelancer, PartTime, FullTime)
3. **Submit**: Value is included in the candidate creation API call
4. **Storage**: Stored as `job_type` field in the database

## Layout Changes
- **Previous**: 4-column grid with Job Open Type, Shifts, Career Break, Differently Abled
- **Updated**: 
  - Job Open Type, Shifts, Job Preference, (empty)
  - Career Break and Differently Abled moved to the next row for better layout

## Features
- ✅ Dynamic loading from API
- ✅ Loading states and error handling
- ✅ Proper form validation integration
- ✅ Consistent with existing dropdown patterns
- ✅ Complete data flow from UI to database
- ✅ Responsive grid layout

The Job Preference dropdown is now fully integrated and functional, following the same patterns as other dropdown fields in the application.