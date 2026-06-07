import React, { useState } from 'react';
import FormWizardLayout from '../../templates/FormWizardLayout/FormWizardLayout';
import { FormWizardStep } from '../../templates/FormWizardLayout/FormWizardLayout';
import UserDetailsStep from './UserDetailsStep';
import PermissionsStep from './PermissionsStep';
import { apiCall, API_ENDPOINTS } from '../../../utils/api';
import {
  UserFormData,
  UserCreateRequest,
  UserCreateResponse,
} from '../../../types/user';
import FileUploadService from '../../../services/fileUploadService';
import { useNavigate } from 'react-router-dom';
import { showSuccessToast, showErrorToast } from '../../../utils/toast';
import { useAuth } from '../../auth/AuthContext';

// API Permission format - binary strings for CRUD operations
interface ApiPermissions {
  candidate: string; // "1111" for CRUD, "1000" for Create only, etc.
  client: string;
  job: string;
  supplier: string;
  users: string;
}

const initialFormData: UserFormData = {
  first_name: '',
  middle_name: '',
  last_name: '',
  username: '',
  phone_no: '',
  email: '',
  date_of_birth: '',
  date_of_joining: '',
  country: '',
  state: '',
  city: '',
  designation: '',
  department: [],
  reporting_to: [],
  role: [],
  display_name: '',
  user_picture: null,
  user_picture_preview: null,
  user_picture_url: null,
  user_status: '',
  permissions: {},
};

const AddUser: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const existingDraft = (() => {
    try {
      const draft = localStorage.getItem('user_draft');
      return draft ? JSON.parse(draft) : null;
    } catch {
      return null;
    }
  })();

  const [formData, setFormData] = useState<UserFormData>(
    existingDraft || initialFormData
  );

  // Validation functions
  const validateUserDetails = (data: UserFormData): Record<string, string> => {
    console.log('=== Validating User Details ===');
    console.log('Data to validate:', data);

    const errors: Record<string, string> = {};

    // Include real-time validation errors from hooks
    if ((data as any)._usernameValidationError) {
      errors.username = (data as any)._usernameValidationError;
    }

    if ((data as any)._emailValidationError) {
      errors.email = (data as any)._emailValidationError;
    }

    if (!data.first_name?.trim()) {
      errors.first_name = 'First name is required';
    }

    if (!data.last_name?.trim()) {
      errors.last_name = 'Last name is required';
    }

    if (!data.username?.trim()) {
      errors.username = 'Employee ID is required';
    } else if (data.username.length < 3) {
      errors.username = 'Employee ID must be at least 3 characters';
    }

    if (!data.email?.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!data.phone_no?.trim()) {
      errors.phone_no = 'Phone number is required';
    } else {
      const cleanPhone = data.phone_no.replace(/\D/g, '');
      if (!/^\d+$/.test(cleanPhone)) {
        errors.phone_no = 'Phone number must contain only digits';
      } else if (cleanPhone.length !== 10) {
        errors.phone_no = 'Phone number must be exactly 10 digits';
      }
    }

    if (!data.date_of_birth?.trim()) {
      errors.date_of_birth = 'Date of Birth is required';
    }

    if (!data.date_of_joining?.trim()) {
      errors.date_of_joining = 'Date of Joining is required';
    }

    if (!data.country?.trim()) {
      errors.country = 'Country is required';
    }

    if (!data.state?.trim()) {
      errors.state = 'State is required';
    }

    if (!data.city?.trim()) {
      errors.city = 'City is required';
    }

    if (!data.designation?.trim()) {
      errors.designation = 'Designation is required';
    }

    if (!Array.isArray(data.department) || data.department.length === 0) {
      errors.department = 'Department is required';
    }

    if (!Array.isArray(data.reporting_to) || data.reporting_to.length === 0) {
      errors.reporting_to = 'Reporting To (Manager) is required';
    }

    if (!Array.isArray(data.role) || data.role.length === 0) {
      errors.role = 'Role is required';
    }

    console.log('Validation errors:', errors);
    return errors;
  };

  const validatePermissions = (data: UserFormData): Record<string, string> => {
    console.log('=== Validating Permissions ===');
    console.log('Permissions data:', data.permissions);

    const errors: Record<string, string> = {};

    // Check if at least one permission is granted
    const hasAnyPermission = Object.values(data.permissions || {}).some(
      actions => Array.isArray(actions) && actions.length > 0
    );

    if (!hasAnyPermission) {
      errors.permissions = 'At least one permission must be granted';
    }

    console.log('Permissions validation errors:', errors);
    return errors;
  };

  const steps: FormWizardStep[] = [
    {
      id: 'user-details',
      label: 'User Details',
      description: 'Basic user information and contact details',
      component: UserDetailsStep,
      resetFields: (formData: UserFormData) => ({
        first_name: '',
        middle_name: '',
        last_name: '',
        username: '',
        phone_no: '',
        email: '',
        country: '',
        state: '',
        city: '',
        designation: '',
        department: [],
        reporting_to: [],
        role: [],
        display_name: '',
        user_status: '',
      }),
      validation: validateUserDetails,
    },
    {
      id: 'permissions',
      label: 'Permissions',
      description: 'User access rights and permissions',
      component: PermissionsStep,
      resetFields: (formData: UserFormData) => ({
        permissions: {},
      }),
      validation: validatePermissions,
    },
  ];

  const updateFormData = (updates: Partial<UserFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  // Handle avatar upload immediately when file is selected
  const handleAvatarUpload = async (file: File | null) => {
    if (!file) {
      updateFormData({
        user_picture: null,
        user_picture_preview: null,
        user_picture_url: null,
      });
      return;
    }

    try {
      // Set the file and preview immediately
      updateFormData({ user_picture: file });

      // Generate preview
      const reader = new FileReader();
      reader.onload = event => {
        updateFormData({
          user_picture_preview: event.target?.result as string,
        });
      };
      reader.readAsDataURL(file);

      // Upload the file immediately
      console.log('Uploading user avatar...');
      const uploadResult = await FileUploadService.uploadCandidateAvatar(file);

      // Store the uploaded URL
      updateFormData({ user_picture_url: uploadResult.file_url });
      console.log('Avatar uploaded successfully:', uploadResult.file_url);
    } catch (error) {
      console.error('Avatar upload failed:', error);
      showErrorToast('Failed to upload avatar. Please try again.');

      // Clear the file on upload failure
      updateFormData({
        user_picture: null,
        user_picture_preview: null,
        user_picture_url: null,
      });
    }
  };

  // Convert UI permissions to API binary format
  const convertPermissionsToApi = (permissions: {
    [module: string]: string[];
  }): ApiPermissions => {
    const moduleMap: { [key: string]: keyof ApiPermissions } = {
      Candidate: 'candidate',
      Client: 'client',
      Job: 'job',
      Supplier: 'supplier',
      Users: 'users', // Note: UI shows "Users" and API expects "users"
    };

    const actionMap = {
      Create: 0,
      View: 1,
      Edit: 2,
      Delete: 3,
    };

    const result: ApiPermissions = {
      candidate: '0000',
      client: '0000',
      job: '0000',
      supplier: '0000',
      users: '0000',
    };

    // Convert each module's permissions to binary string
    Object.entries(permissions).forEach(([module, actions]) => {
      const apiModule = moduleMap[module];
      if (apiModule) {
        let binaryString = '0000';
        const binaryArray = binaryString.split('');

        actions.forEach(action => {
          const index = actionMap[action as keyof typeof actionMap];
          if (index !== undefined) {
            binaryArray[index] = '1';
          }
        });

        result[apiModule] = binaryArray.join('');
      }
    });

    return result;
  };

  const handleComplete = async (finalData: UserFormData) => {
    console.log('=== Add User Form Submission ===');
    console.log('Final form data received:', finalData);
    console.log('Form data keys:', Object.keys(finalData));
    console.log('Form data values:', Object.values(finalData));

    try {
      // Convert permissions to object format (not JSON string)
      console.log('Converting permissions:', finalData.permissions);
      const permissionsObject = convertPermissionsToApi(finalData.permissions);
      console.log('Converted permissions object:', permissionsObject);

      // Combine country, state, and city for API location field
      const location = [finalData.city, finalData.state, finalData.country]
        .filter(Boolean)
        .join(', ');

      console.log('Reporting to field contains:', finalData.reporting_to);
      console.log(
        'Reporting to field type:',
        typeof finalData.reporting_to,
        'Array:',
        Array.isArray(finalData.reporting_to)
      );

      // Prepare API payload matching exact API specification
      const userPayload: UserCreateRequest = {
        email: finalData.email,
        username: finalData.username,
        first_name: finalData.first_name,
        last_name: finalData.last_name,
        middle_name: finalData.middle_name || '',
        phone_no: finalData.phone_no,
        date_of_birth: finalData.date_of_birth,
        date_of_joining: finalData.date_of_joining,
        display_name: finalData.display_name,
        department: finalData.department,
        designation: finalData.designation,
        location: location,
        reporting_to: finalData.reporting_to,
        role: finalData.role,
        status: finalData.user_status || 'Active',
        emailVisibility: true,
        permission: permissionsObject,
        created_by: currentUser?.display_name || currentUser?.first_name || 'Unknown',
        updated_by: currentUser?.display_name || currentUser?.first_name || 'Unknown',
      } as any;

      // Create FormData for multipart/form-data request
      const formData = new FormData();

      // Add user data as JSON string
      const userJsonString = JSON.stringify(userPayload);
      formData.append('user', userJsonString);

      // Add avatar file if present
      if (finalData.user_picture) {
        console.log('Adding file to FormData:', finalData.user_picture);
        formData.append('file', finalData.user_picture);
      }

      const response = await apiCall<UserCreateResponse>(
        API_ENDPOINTS.USERS.CREATE,
        {
          method: 'POST',
          body: formData,
          // Don't set Content-Type for FormData, let browser set it with boundary
        }
      );

      if (response.error) {
        throw new Error(response.error.message || 'Failed to create user');
      }

      console.log('User created successfully:', response.data);

      localStorage.removeItem('user_draft');
      showSuccessToast('User created successfully!');

      // Navigate to users list with state to trigger refresh
      navigate('/users', {
        state: { refresh: true, timestamp: Date.now() },
        replace: true,
      });
    } catch (error) {
      console.error('Error creating user:', error);

      if (error instanceof Error && error.message.includes('avatar upload')) {
        showErrorToast(
          'Failed to create user: Avatar upload failed. Please try again or proceed without an avatar.'
        );
      } else {
        showErrorToast(
          `Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }
  };

  const handleSaveAsDraft = async (draftData: UserFormData) => {
    try {
      // Save draft to localStorage
      localStorage.setItem('user_draft', JSON.stringify(draftData));
      showSuccessToast('User data saved as draft!');
    } catch (error) {
      console.error('Error saving draft:', error);
      showErrorToast('Failed to save draft. Please try again.');
    }
  };

  const handleCancel = () => {
    navigate('/users');
  };

  return (
    <FormWizardLayout
      title="Add New User"
      subtitle="Create a new user account with proper permissions"
      steps={steps}
      initialData={formData}
      onComplete={handleComplete}
      onCancel={handleCancel}
      showResetButton={true}
      showSaveAsDraft={true}
      onSaveAsDraft={handleSaveAsDraft}
      allowStepNavigation={true}
      onDiscardDraft={() => localStorage.removeItem('user_draft')}
    />
  );
};

export default AddUser;
