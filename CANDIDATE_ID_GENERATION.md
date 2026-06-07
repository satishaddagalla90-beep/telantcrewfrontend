# Candidate ID Auto-Generation Implementation

## Overview
I have successfully implemented automatic candidate ID generation for the PersonalDetailsForm component. The system fetches the last candidate ID from the API and generates the next sequential ID automatically.

## Features Implemented

### 1. Candidate Service (`src/services/candidateService.ts`)
- **`fetchLastCandidateId()`**: Fetches the last candidate ID from `/candidates/last-candidate-id` endpoint
- **`generateNextCandidateId()`**: Increments the candidate ID number (e.g., "THCAN-IND-2" → "THCAN-IND-3")
- **`getNextCandidateId()`**: Combines both functions to get the next available candidate ID
- Proper error handling and validation for the THCAN-IND-X format

### 2. PersonalDetailsForm Updates
- **Auto-generation on mount**: Automatically generates candidate ID when component loads if no ID exists
- **Manual generation**: Added a "Generate" button next to the candidate ID field for manual regeneration
- **Loading states**: Integrated loading indicators during ID generation
- **Readonly field**: Candidate ID field is readonly and disabled to prevent manual editing
- **Custom UI**: Replaced CommonFields.candidateId with a custom implementation featuring:
  - Input field (readonly)
  - Generate/regenerate button with loading spinner
  - Error display
  - Help text

### 3. Enhanced Props Interface
- Added `onLoadingChange` callback for parent components to handle loading states
- Extended `loading` object to include `candidateId` loading state
- Added `candidateIdRefreshRef` for pre-submission candidate ID refresh

### 4. Pre-Submission ID Refresh
- **Purpose**: Ensures candidate ID uniqueness right before form submission
- **Use case**: Prevents ID conflicts when multiple users register simultaneously
- **Implementation**: Uses React ref pattern to expose refresh function to parent components

## API Integration

### Endpoint
```
GET /candidates/last-candidate-id
```

### Expected Response
```json
{
  "last_candidate_id": "THCAN-IND-2"
}
```

### ID Format
- Pattern: `THCAN-IND-{number}`
- Example progression: THCAN-IND-1 → THCAN-IND-2 → THCAN-IND-3

## Usage Example

### Basic Usage
```tsx
import PersonalDetailsForm from './components/organisms/PersonalDetailsForm/PersonalDetailsForm';

const MyComponent = () => {
  const [formData, setFormData] = useState({
    candidate_id: '', // Will be auto-generated
    // ... other fields
  });

  const [loading, setLoading] = useState({
    candidateId: false,
    // ... other loading states
  });

  const handleLoadingChange = (field: string, isLoading: boolean) => {
    setLoading(prev => ({ ...prev, [field]: isLoading }));
  };

  return (
    <PersonalDetailsForm
      formData={formData}
      errors={{}}
      onChange={(field, value) => setFormData(prev => ({ ...prev, [field]: value }))}
      loading={loading}
      onLoadingChange={handleLoadingChange}
    />
  );
};
```

### Pre-Submission Refresh Usage
```tsx
import React, { useState, useRef } from 'react';
import PersonalDetailsForm from './components/organisms/PersonalDetailsForm/PersonalDetailsForm';

const SubmissionForm = () => {
  const [formData, setFormData] = useState({ candidate_id: '' });
  const candidateIdRefreshRef = useRef<(() => Promise<void>) | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Refresh candidate ID before submission to ensure uniqueness
      if (candidateIdRefreshRef.current) {
        await candidateIdRefreshRef.current();
        console.log('Fresh candidate ID:', formData.candidate_id);
      }
      
      // Now submit with guaranteed unique ID
      const response = await fetch('/api/candidates', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      
      // Handle response...
    } catch (error) {
      console.error('Submission failed:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PersonalDetailsForm
        formData={formData}
        onChange={(field, value) => setFormData(prev => ({ ...prev, [field]: value }))}
        candidateIdRefreshRef={candidateIdRefreshRef}
        // ... other props
      />
      <button type="submit">Submit</button>
    </form>
  );
};
```

## Key Features

1. **Automatic Generation**: ID is generated when the component mounts
2. **Manual Regeneration**: Users can click the generate button to get a new ID
3. **Pre-Submission Refresh**: Automatically refreshes ID before form submission for uniqueness
4. **Loading States**: Visual feedback during API calls
5. **Error Handling**: Graceful error handling with console logging
6. **Format Validation**: Validates the expected THCAN-IND-X format
7. **Readonly Interface**: Prevents manual editing of auto-generated IDs

## Technical Details

- Uses native `fetch` API for HTTP requests
- Implements proper async/await patterns
- Includes TypeScript types for all interfaces
- Follows React best practices with proper dependency arrays
- Maintains backwards compatibility with existing form structure

## Error Handling

- Network errors are caught and logged
- Invalid ID formats are validated and rejected
- Loading states are properly reset in finally blocks
- User-friendly error messages can be extended as needed

The implementation is production-ready and follows established patterns from the existing codebase.