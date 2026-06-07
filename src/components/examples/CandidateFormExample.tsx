// Example usage of PersonalDetailsForm with candidate ID auto-generation

import React, { useState } from 'react';
import PersonalDetailsForm from '../organisms/PersonalDetailsForm/PersonalDetailsForm';

const ExampleCandidateForm = () => {
  const [formData, setFormData] = useState({
    candidate_id: '', // Will be auto-generated
    panNo: '',
    firstName: '',
    lastName: '',
    // ... other fields
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState({
    candidateId: false,
    panCheck: false,
    // ... other loading states
  });

  // Handle form field changes
  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle loading state changes
  const handleLoadingChange = (field: string, isLoading: boolean) => {
    setLoading(prev => ({
      ...prev,
      [field]: isLoading
    }));
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Candidate Registration</h1>
      
      <PersonalDetailsForm
        formData={formData}
        errors={errors}
        onChange={handleChange}
        loading={loading}
        onLoadingChange={handleLoadingChange}
        onPanValidationChange={(isValid: boolean, error?: string) => {
          console.log('PAN Validation:', { isValid, error });
        }}
      />
      
      {/* Display current form data for debugging */}
      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h3 className="font-bold mb-2">Current Form Data:</h3>
        <pre className="text-sm">
          {JSON.stringify(formData, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default ExampleCandidateForm;