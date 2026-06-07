import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSWR, API_ENDPOINTS, apiCall } from '../../../utils/api';
import {
  showSuccessToast,
  showErrorToast,
  showWarningToast,
} from '../../../utils/toast';
import { User, UserManagementResponse } from '../../../utils/api/types';
import Breadcrumb from '../../organisms/BreadCrumb';
import UserDetailHeader from './UserDetailHeader';
import Text from '../../atoms/Text';
import SearchBox from '../../atoms/SearchBox';
import Button from '../../atoms/Button';
import Icon from '../../atoms/Icon';
import Card from '../../molecules/Card';
import Checkbox from '../../atoms/Checkbox';
import Tabs from '../../atoms/Tabs/Tabs';
import Modal from '../../atoms/Modal/Modal';
import EnhancedInputField from '../../molecules/EnhancedInputField/EnhancedInputField';
import AsyncSelect, {
  AsyncSelectOption,
} from '../../atoms/AsyncSelect/AsyncSelect';
import SearchDropdown from '../../molecules/SearchDropdown/SearchDropdown';
import CountryStateCity from '../../molecules/CountryStateCity/CountryStateCity';
import AvatarUpload from '../../molecules/AvatarUpload/AvatarUpload';
import Avatar from '../../atoms/Avatar/Avatar';
import { usersAPI } from '../../../utils/api/UsersAPI';
import { useUserFieldValidation } from '../../../hooks/useUserFieldValidation';
import FileUploadService from '../../../services/fileUploadService';
import {
  useDropdownData,
  useDesignationsDropdown,
  useUserStatusOptions,
  useUserSearch,
  useUsersDropdown,
  useDepartmentsDropdown,
  useRolesDropdownSearchable,
  useRolesWithPermissions,
} from '../../../hooks/useDropdowns';
import { capitalizeAndSafe } from '../../../utils/textUtils';
import { usePermissions } from '../../../hooks/usePermissions';
import { useAuth } from '../../auth/AuthContext';
import { formatUIDate } from '../../../utils/dateFormat';

// Helper function to convert binary permissions to readable format
const convertPermissionsFromApi = (permissions: any) => {
  if (!permissions || typeof permissions !== 'object') return [];

  const moduleMap = {
    candidate: 'Candidate',
    client: 'Client',
    job: 'Job',
    supplier: 'Supplier',
    users: 'Users',
  };

  return Object.entries(permissions).map(([key, value]) => {
    const binaryString = value as string;
    const module = moduleMap[key as keyof typeof moduleMap] || key;

    // Handle cases where binary string might be shorter than 4 characters
    const paddedBinary = binaryString.padEnd(4, '0');

    return {
      module,
      create: paddedBinary[0] === '1',
      view: paddedBinary[1] === '1',
      edit: paddedBinary[2] === '1',
      delete: paddedBinary[3] === '1',
    };
  });
};

//

// Helper function to get user display name with proper capitalization
const getUserDisplayName = (user: any) => {
  if (!user) return 'Unknown User';
  return (
    capitalizeAndSafe(user.display_name) ||
    [user.first_name, user.middle_name, user.last_name]
      .filter((name: any) => name && name.toString().trim())
      .map((name: any) => capitalizeAndSafe(name.toString()))
      .join(' ') ||
    capitalizeAndSafe(user.username) ||
    'Unknown User'
  );
};

const formatDateForInput = (dateValue: any): string => {
  if (!dateValue) return '';
  
  try {
    // If it's already in ISO format string (YYYY-MM-DD), return as-is
    if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return dateValue;
    }
    
    // If it's a Date object or ISO string with time, convert to YYYY-MM-DD
    const date = new Date(dateValue);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  } catch (error) {
    console.error('Error formatting date:', error);
  }
  
  return '';
};

const UserDetailPage: React.FC = () => {
  const { id: userId } = useParams<{ id: string }>();

  // Get current user from auth context
  const { user: currentUser } = useAuth();

  // Permission hooks to check user access
  const { canCreateUsers, canUpdateUsers } = usePermissions();

  const [activeTab, setActiveTab] = useState('permissions');
  const [searchAssignUsers, setSearchAssignUsers] = useState('');
  const [searchActivateUsers, setSearchActivateUsers] = useState('');
  const [selectedAssignUser, setSelectedAssignUser] = useState<string | null>(
    null
  );

  // State for selected user's data and permissions
  const [selectedUserData, setSelectedUserData] = useState<User | null>(null);
  const [selectedUserPermissions, setSelectedUserPermissions] = useState<any[]>(
    []
  );
  const [isLoadingUserData, setIsLoadingUserData] = useState(false);
  const [isSavingSelectedUserPermissions, setIsSavingSelectedUserPermissions] =
    useState(false);

  // Dynamic user search hook
  const {
    users: searchedUsers,
    loading: searchLoading,
    error: searchError,
    searchUsers,
    clearSearch,
  } = useUserSearch();

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    display_name: '',
    username: '',
    status: '',
    designation: '',

    phone_no: '',
    email: '',
    avatar: null as File | null,
    avatar_removed: false,
    avatar_url: null as string | null,
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // Upload states for user avatar
  const [uploadStates, setUploadStates] = useState({
    avatar: { uploading: false, error: null as string | null },
  });

  // Secure photo URL for the detail header
  const [photoViewUrl, setPhotoViewUrl] = useState<string | undefined>(undefined);

  // User Info edit modal state
  const [showUserInfoModal, setShowUserInfoModal] = useState(false);
  const [userInfoFormData, setUserInfoFormData] = useState({
    department: [] as string[],
    country: '',
    state: '',
    city: '',
    existingLocation: '', // Store original location for reference
    reporting_to: [] as (string | any)[], // Support both IDs (strings) and Option Objects
    role: [] as string[],
    phone_no: '',
    email: '',
    date_of_birth: '', // Date of Birth field
    date_of_joining: '', // Date of Joining field
  });
  const [isUpdatingUserInfo, setIsUpdatingUserInfo] = useState(false);
  const [userInfoFormErrors, setUserInfoFormErrors] = useState<{
    [key: string]: string;
  }>({});

  // Email validation hook for User Info modal
  const {
    isValidating: emailValidating,
    error: emailValidationError,
    isValid: emailIsValid,
    handleChange: handleEmailChange
  } = useUserFieldValidation({
    value: userInfoFormData.email || '',
    type: 'email',
    onChange: (value: string) => setUserInfoFormData(prev => ({ ...prev, email: value })),
    onValidationChange: (isValid, error) => {
      // Pass validation errors to form errors
      if (!isValid && error) {
        setUserInfoFormErrors(prev => ({ ...prev, email: error }));
      } else {
        setUserInfoFormErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.email;
          return newErrors;
        });
      }
    },
    excludeId: userId // Exclude current user from duplicate check
  });

  // Permissions edit state
  const [isEditingPermissions, setIsEditingPermissions] = useState(false);
  const [editablePermissions, setEditablePermissions] = useState<any[]>([]);
  const [isUpdatingPermissions, setIsUpdatingPermissions] = useState(false);

  // Activate/Deactivate edit state
  const [isEditingUsers, setIsEditingUsers] = useState(false);
  const [isUpdatingUsers, setIsUpdatingUsers] = useState(false);
  const [pendingStatusChanges, setPendingStatusChanges] = useState<{
    [key: string]: string;
  }>({});

  // Dropdown hooks for edit modal

  // --- Form validation state ---
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // --- Field validation function ---
  const validateField = (field: string, value: any) => {
    let error = '';
    switch (field) {
      case 'first_name':
        if (!value || !value.trim()) {
          error = 'First name is required.';
        }
        break;
      case 'last_name':
        if (!value || !value.trim()) {
          error = 'Last name is required.';
        }
        break;
      case 'middle_name':
        // Middle name is optional - no validation error
        break;
      case 'display_name':
        if (!value || !value.trim()) {
          error = 'Display name is required.';
        }
        break;
      case 'username':
        if (!value || !value.trim()) {
          error = 'Employee ID is required.';
        }
        break;
      case 'status':
        if (!value || !value.trim()) {
          error = 'Status is required.';
        }
        break;
      case 'designation':
        if (!value || !value.trim()) {
          error = 'Designation is required.';
        }
        break;

      case 'email':
        if (!value || !value.trim()) {
          error = 'Email is required.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = 'Please enter a valid email address.';
        }
        break;
      case 'phone_no':
        if (!value || !value.trim()) {
          error = 'Phone number is required.';
        } else if (!/^[0-9]{10}$/.test(value)) {
          error = 'Phone number must be exactly 10 digits.';
        }
        break;
      case 'avatar':
        if (!value) {
          error = 'User picture is required.';
        }
        break;
      default:
        break;
    }
    setFormErrors(prev => ({ ...prev, [field]: error }));
    return error;
  };

  // --- Validate all required fields ---
  const validateAllFields = () => {
    const requiredFields = [
      'first_name',
      'last_name',
      'display_name',
      'username',
      'status',
      'designation',

      'email',
      'phone_no',
    ];

    let hasErrors = false;
    const newErrors: { [key: string]: string } = {};

    requiredFields.forEach(field => {
      const value = editFormData[field as keyof typeof editFormData];
      const error = validateField(field, value);
      if (error) {
        hasErrors = true;
        newErrors[field] = error;
      }
    });

    // Check if avatar is required (only for new users, not editing existing)
    // if (!editFormData.avatar_url && !editFormData.avatar) {
    //   const error = 'User picture is required.';
    //   newErrors.avatar = error;
    //   hasErrors = true;
    // }

    return !hasErrors;
  };

  // --- User Info Field validation function ---
  const validateUserInfoField = (field: string, value: any) => {
    let error = '';
    switch (field) {
      case 'department':
        if (!value || (Array.isArray(value) && value.length === 0)) {
          error = 'At least one department is required.';
        }
        break;
      case 'reporting_to':
        if (!value || (Array.isArray(value) && value.length === 0)) {
          error = 'At least one reporting manager is required.';
        }
        break;
      case 'phone_no': {
        const clean = (value || '').replace(/\D/g, '');
        if (!clean) {
          error = 'Phone number is required.';
        } else if (clean.length !== 10) {
          error = 'Phone number must be 10 digits.';
        }
        break;
      }
      case 'email': {
        if (!value) {
          error = 'Email is required.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = 'Enter a valid email address.';
        }
        break;
      }
      case 'role':
        if (!value || (Array.isArray(value) && value.length === 0)) {
          error = 'At least one role is required.';
        }
        break;
      default:
        break;
    }
    setUserInfoFormErrors(prev => ({ ...prev, [field]: error }));
    return error;
  };

  // --- Validate all User Info required fields ---
  const validateAllUserInfoFields = () => {
    const requiredFields = ['department', 'reporting_to', 'phone_no', 'email', 'role', 'date_of_birth', 'date_of_joining'];

    let hasErrors = false;
    const newErrors: { [key: string]: string } = {};

    requiredFields.forEach(field => {
      const value = userInfoFormData[field as keyof typeof userInfoFormData];
      
      // Date fields validation
      if (field === 'date_of_birth' || field === 'date_of_joining') {
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          hasErrors = true;
          const fieldLabel = field === 'date_of_birth' ? 'Date of Birth' : 'Date of Joining';
          newErrors[field] = `${fieldLabel} is required`;
        } else {
          newErrors[field] = '';
        }
      } else {
        const error = validateUserInfoField(field, value);
        if (error) {
          hasErrors = true;
          newErrors[field] = error;
        }
      }
    });

    // Check for email duplicate error from validation hook
    if (emailValidationError) {
      hasErrors = true;
      newErrors.email = emailValidationError;
    }

    // Update error state to display messages
    setUserInfoFormErrors(newErrors);

    return !hasErrors;
  };

  const { options: designationOptions, loading: designationLoading, search: searchDesignation } =
    useDesignationsDropdown();

  const userStatusOptions = useUserStatusOptions();
  // Dropdown hooks for user info modal
  const { options: departmentOptions, loading: departmentLoading, search: searchDepartments } =
    useDepartmentsDropdown();
  const { options: roleDropdownOptions, loading: roleLoading, search: searchRoles } =
    useRolesDropdownSearchable();
  const { roles: rolesWithPermissions } = useRolesWithPermissions();
  const {
    options: reportingToOptions,
    loading: reportingToLoading,
    search: searchReportingUsers,
  } = useUsersDropdown();

  // Convert dropdown options to AsyncSelectOption format
  const designationAsyncOptions: AsyncSelectOption[] = designationOptions.map(
    option => ({
      value: option.value,
      label: option.label,
    })
  );

  const statusAsyncOptions: AsyncSelectOption[] = userStatusOptions.map(
    option => ({
      value: option.value,
      label: option.label,
    })
  );

  // Auto-generate display name when first_name, middle_name, or last_name changes
  useEffect(() => {
    const { first_name, middle_name, last_name } = editFormData;
    // Combine first_name, middle_name, and last_name (filter out empty values)
    const displayName = [first_name, middle_name, last_name]
      .filter(name => name && name.trim())
      .join(' ')
      .trim();

    if (displayName && displayName !== editFormData.display_name) {
      setEditFormData(prev => ({
        ...prev,
        display_name: displayName,
      }));
    }
  }, [
    editFormData,
  ]);

  // Helper functions to convert between string values and AsyncSelectOption format
  const getStatusOptionFromValue = (
    value: string
  ): AsyncSelectOption | null => {
    return statusAsyncOptions.find(option => option.value === value) || null;
  };

  const getDesignationOptionFromValue = (
    value: string
  ): AsyncSelectOption | null => {
    // Since we store designation by label (name), match by label
    const found = designationAsyncOptions.find(option => option.label === value);
    if (found) return found;

    // If not found (e.g. newly added), return valid option object so it displays
    if (value) {
      return { value, label: value };
    }
    return null;
  };

  // Fetch user data from API
  const {
    data: userData,
    error: userError,
    loading: userLoading,
  } = useSWR<User>(
    userId
      ? `${API_ENDPOINTS.USERS.GET(userId)}${currentUser?.id ? `?viewer_id=${currentUser.id}` : ''}`
      : null
  );

  // Fetch all users to resolve reporting_to IDs to names
  const {
    data: allUsersData,
    error: allUsersError,
    loading: allUsersLoading,
  } = useSWR<{ users: User[] }>(
    API_ENDPOINTS.USERS.LIST + '?limit=1000' // Fetch all users to create ID mapping
  );

  // Instead of trying to fetch from a potentially non-existent assign-permissions endpoint,
  // we'll use the search functionality and all users data for the assign permissions tab
  // This aligns with the UI transformation requirement from the project memories

  // No need for separate assignedUsersData since we'll use the search results
  // const {
  //   data: assignedUsersData,
  //   error: assignedUsersError,
  //   loading: assignedUsersLoading,
  // } = useSWR<AssignedUsersResponse>(
  //   userId ? API_ENDPOINTS.USERS.ASSIGN_PERMISSIONS(userId) : null
  // );

  // Get current user's ID for API filtering (reporting_to expects user ID)
  const currentUserId = userData ? userData.id : undefined;

  // (Removed unused userIdToNameMap)

  useEffect(() => {
    if (
      showUserInfoModal &&
      userData
    ) {
      // Convert reporting_to objects to the format expected by the dropdown
      let reportingToValues: (string | any)[] = [];

      if (Array.isArray(userData.reporting_to)) {
        reportingToValues = userData.reporting_to
          .map((item: any) => {
            // Handle object format (Backend response)
            if (typeof item === 'object' && item !== null) {
              const id = item.id;
              // Construct name
              const name = [item.first_name, item.last_name].filter(Boolean).join(' ').trim();
              const detail = item.detail && !item.detail.includes('User not found') ? item.detail : null;
              const label = item.designation ? `${name} (${item.designation})` : (name || detail || id);

              if (id) {
                // Store full object details for backend requirement
                return {
                  value: id,
                  label,
                  id,
                  email: item.email,
                  first_name: item.first_name,
                  last_name: item.last_name,
                  department: item.department || [],
                  designation: item.designation || ''
                };
              }
            }
            // Handle string format
            return typeof item === 'string' ? item : null;
          })
          .filter(Boolean);
      } else if (userData.reporting_to) {
        // Handle single value case
        reportingToValues = [userData.reporting_to];
      }

      // Update the form data to ensure reporting_to has the correct format
      setUserInfoFormData(prev => ({
        ...prev,
        reporting_to: reportingToValues,
      }));
    }
  }, [showUserInfoModal, userData]);

  // Helper function to resolve reporting_to names
  // Handles both string arrays and object arrays with id/detail fields
  const resolveReportingToNames = (reportingToData: any[]): string => {
    if (!reportingToData || reportingToData.length === 0) {
      return 'No Manager';
    }

    // Process each item in the array
    const names = reportingToData
      .map((item: any) => {
        // Handle string format (already formatted from DB or raw string)
        if (typeof item === 'string' && item.trim()) {
          return item;
        }

        // Handle object format
        if (typeof item === 'object' && item !== null) {
          // Try to construct full name first
          const fullName = [item.first_name, item.last_name]
            .filter(Boolean)
            .join(' ')
            .trim();

          if (fullName) {
            // Add designation if available
            return item.designation ? `${fullName} (${item.designation})` : fullName;
          }

          // Fallback to detail if available and not "User not found"
          if (item.detail && !item.detail.includes('User not found')) {
            return item.detail;
          }

          // Last resort: ID
          return item.id || null;
        }

        return null;
      })
      .filter(Boolean);

    return names.length > 0 ? names.join(', ') : 'No Manager';
  };

  // Fetch users who report to current user using API filtering (by user ID)
  const userManagementUrl = currentUserId
    ? `${API_ENDPOINTS.USERS.LIST}?reporting_to=${encodeURIComponent(currentUserId)}`
    : null;

  const {
    data: userManagementData,
    error: userManagementError,
    loading: userManagementLoading,
  } = useSWR<UserManagementResponse>(userManagementUrl);

  // Fetch secure photo URL for user header
  useEffect(() => {
    const fetchPhotoUrl = async () => {
      const picturePath = userData?.avatar?.file_url;
      if (picturePath) {
        try {
          const secureUrl = await FileUploadService.getFileViewUrl(picturePath);
          setPhotoViewUrl(secureUrl);
        } catch (error) {
          console.error('Error fetching secure user photo URL:', error);
          setPhotoViewUrl(undefined);
        }
      } else {
        setPhotoViewUrl(undefined);
      }
    };

    fetchPhotoUrl();
  }, [userData?.avatar?.file_url]);

  // Loading state
  if (userLoading || allUsersLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Icon name="loading" className="w-8 h-8 animate-spin mx-auto mb-2" />
          <Text>Loading user details...</Text>
        </div>
      </div>
    );
  }

  // Error state
  if (userError || !userData || allUsersError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Icon name="alert" className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <Text className="text-red-600">
            {userError?.message || allUsersError?.message || 'User not found'}
          </Text>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => window.history.back()}
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // Calculate Last Viewed By
  const lastViewedEntry = userData.last_viewed?.[0];
  const lastViewedBy = (() => {
    const by = lastViewedEntry?.last_viewed_by;
    if (!by) return 'System';
    if (typeof by === 'object') {
      // Use display_name if available, otherwise construct from names, otherwise username/email/id
      if (by.display_name) return by.display_name;

      return (
        by.username ||
        by.email ||
        by.id ||
        'System'
      );
    }
    return String(by);
  })();
  const lastViewedOn = lastViewedEntry?.last_viewed_on
    ? new Date(lastViewedEntry.last_viewed_on).toLocaleDateString()
    : undefined;

  // Event handlers
  const handleEditUser = () => {
    if (!canUpdateUsers) {
      showWarningToast("You don't have permission to edit user details.");
      return;
    }

    if (userData) {
      setEditFormData({
        first_name: userData.first_name || '',
        middle_name: userData.middle_name || '',
        last_name: userData.last_name || '',
        display_name: userData.display_name || '',
        username: userData.username || '',
        status: userData.status || '',
        designation: userData.designation || '',

        phone_no: userData.phone_no ? String(userData.phone_no) : '',
        email: userData.email || '',
        avatar: null,
        avatar_removed: false,
        avatar_url: null,
      });
      setShowEditModal(true);
    }
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditFormData({
      first_name: '',
      middle_name: '',
      last_name: '',
      display_name: '',
      username: '',
      status: '',
      designation: '',

      phone_no: '',
      email: '',
      avatar: null,
      avatar_removed: false,
      avatar_url: null,
    });
  };

  // Immediate avatar upload handler (like Add User)
  const handleUserAvatarUpload = async (file: File | null) => {
    if (!file) {
      // Clear everything when file is removed
      setEditFormData(prev => ({
        ...prev,
        avatar: null,
        avatar_url: null,
        avatar_removed: true,
      }));
      setUploadStates(prev => ({
        ...prev,
        avatar: { uploading: false, error: null },
      }));
      return;
    }

    // Set uploading state
    setUploadStates(prev => ({
      ...prev,
      avatar: { uploading: true, error: null },
    }));

    try {
      // Validate file
      const validation = FileUploadService.validateFile(file, {
        maxSize: 5,
        allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      });

      if (!validation.valid) {
        throw new Error(validation.error || 'Invalid image file');
      }

      // Upload to server immediately using candidate avatar endpoint (same for users)
      const uploadResponse =
        await FileUploadService.uploadCandidateAvatar(file);
      console.log('User avatar uploaded successfully:', uploadResponse);

      // Update form with uploaded URL
      setEditFormData(prev => ({
        ...prev,
        avatar: file,
        avatar_url: uploadResponse.file_url,
        avatar_removed: false,
      }));

      // Clear uploading state
      setUploadStates(prev => ({
        ...prev,
        avatar: { uploading: false, error: null },
      }));

      console.log(
        'User avatar upload completed, URL stored:',
        uploadResponse.file_url
      );
    } catch (error) {
      console.error('User avatar upload failed:', error);
      const errorMsg = error instanceof Error ? error.message : 'Upload failed';

      setUploadStates(prev => ({
        ...prev,
        avatar: { uploading: false, error: errorMsg },
      }));

      // Clear form data on error
      setEditFormData(prev => ({
        ...prev,
        avatar: null,
        avatar_url: null,
        avatar_removed: false,
      }));
    }
  };

  const handleEditFormChange = (field: string, value: any) => {
    // Don't allow changes if user doesn't have update permission
    if (!canUpdateUsers) {
      return;
    }

    if (field === 'avatar' && value instanceof File) {
      // Only call upload handler for actual File objects (user selections)
      handleUserAvatarUpload(value);
    } else {
      // For all other cases (strings, null values, etc.), just update data
      setEditFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleUpdateUser = async () => {
    if (!userId || !canUpdateUsers) {
      if (!canUpdateUsers) {
        showWarningToast("You don't have permission to update user details.");
      }
      return;
    }

    // Validate all required fields before saving
    const isValid = validateAllFields();
    if (!isValid) {
      showWarningToast('Please fix all validation errors before saving.');
      return;
    }

    try {
      setIsUpdating(true);
      // Create update data without file-related fields
      const { avatar, avatar_removed, avatar_url, ...formData } = editFormData;

      // Create the API update payload with proper types
      const updateData: any = {
        ...formData,
        phone_no: formData.phone_no ? Number(formData.phone_no) : undefined,
        updated_by: currentUser?.display_name || currentUser?.first_name || 'Unknown',
      };

      // Include avatar URL if uploaded
      if (avatar_url) {
        updateData.avatar = { file_url: avatar_url };
      } else if (avatar_removed) {
        updateData.avatar = null;
      }

      // Update user data (avatar is already uploaded)
      await usersAPI.updateUser(userId, updateData);

      setShowEditModal(false);
      // Refresh the user data
      window.location.reload();
    } catch (error) {
      console.error('Error updating user:', error);
      showErrorToast('Failed to update user. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  // User Info edit functions
  const handleEditUserInfo = () => {
    if (!canUpdateUsers) {
      showWarningToast("You don't have permission to edit user information.");
      return;
    }

    if (userData) {
      // Try to parse existing location data in format "City, State, Country"
      const existingLocation = Array.isArray(userData.location)
        ? userData.location[0] || ''
        : userData.location || '';

      // Parse the existing location to extract country, state, and city
      let country = '';
      let state = '';
      let city = '';

      if (existingLocation) {
        const parts = existingLocation.split(',').map((part: string) => part.trim());
        if (parts.length === 3) {
          city = parts[0];
          state = parts[1];
          country = parts[2];
        }
      }

      setUserInfoFormData({
        department: Array.isArray(userData.department)
          ? userData.department
          : userData.department
            ? [userData.department]
            : [],
        country: country,
        state: state,
        city: city,
        existingLocation: existingLocation, // Store the original location for reference
        reporting_to: (() => {
          if (Array.isArray(userData.reporting_to)) {
            return userData.reporting_to
              .map((item: any) => {
                // If it's an object with user details, extract the ID or construct a unique identifier
                if (typeof item === 'object' && item !== null) {
                  // Prefer id if available
                  if (item.id) {
                    return item.id;
                  }
                  // Fallback to constructing from first_name + last_name
                  if (item.first_name || item.last_name) {
                    return [item.first_name, item.last_name]
                      .filter(Boolean)
                      .join(' ');
                  }
                  // Last fallback to email
                  if (item.email) {
                    return item.email;
                  }
                }
                // If it's a string, use as-is
                return typeof item === 'string' ? item : '';
              })
              .filter(Boolean);
          } else if (userData.reporting_to) {
            // Handle single value case
            return [userData.reporting_to];
          }
          return [];
        })(),
        phone_no: userData.phone_no ? String(userData.phone_no) : '',
        email: userData.email || '',
        date_of_birth: formatDateForInput((userData as any).date_of_birth),
        date_of_joining: formatDateForInput((userData as any).date_of_joining),
        role: Array.isArray(userData.role)
          ? userData.role
          : userData.role
            ? [userData.role]
            : [],
      });
      setShowUserInfoModal(true);
    }
  };

  const handleCloseUserInfoModal = () => {
    setShowUserInfoModal(false);
    setUserInfoFormData({
      department: [],
      country: '',
      state: '',
      city: '',
      existingLocation: '',
      reporting_to: [],
      phone_no: '',
      email: '',
      date_of_birth: '',
      date_of_joining: '',
      role: [],
    });
  };

  const handleUserInfoFormChange = (field: string, value: any) => {
    setUserInfoFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleUpdateUserInfo = async () => {
    if (!userId || !canUpdateUsers) {
      if (!canUpdateUsers) {
        showWarningToast(
          "You don't have permission to update user information."
        );
      }
      return;
    }

    // Validate all required fields before saving
    const isValid = validateAllUserInfoFields();
    if (!isValid) {
      showWarningToast('Please fix all validation errors before saving.');
      return;
    }

    try {
      setIsUpdatingUserInfo(true);

      // Prepare update data to match API format
      let locationString = userInfoFormData.existingLocation;

      // If all location fields are filled, create new location string
      if (userInfoFormData.country && userInfoFormData.state && userInfoFormData.city) {
        locationString = `${userInfoFormData.city}, ${userInfoFormData.state}, ${userInfoFormData.country}`;
      }

      const updateData: any = {
        department: userInfoFormData.department,
        // Use new location format if all fields are selected, otherwise keep existing
        location: locationString,
        // Ensure reporting_to sends full object details as backend expects
        // "Self-heal" logic: If we have a legacy item (Name as ID), try to find the real user in allUsersData
        reporting_to: Array.isArray(userInfoFormData.reporting_to)
          ? userInfoFormData.reporting_to.map(val => {
            // If it's a legacy object ("User not found" or ID=Name)
            if (typeof val === 'object' && val !== null) {
              const isLegacy = (val.detail && val.detail.includes('User not found')) || (val.id && val.id.includes(' '));

              if (isLegacy && allUsersData?.users) {
                // Try to find the user by Name (which is stored in val.id for legacy items)
                // Or constructs it from first/last if available
                const searchName = val.id || [val.first_name, val.last_name].join(' ').trim();

                const foundUser = allUsersData.users.find(u => {
                  const uName = [u.first_name, u.last_name].filter(Boolean).join(' ').toLowerCase();
                  const targetName = searchName.toLowerCase();
                  // Simple loose match: name contains the search name or vice versa
                  // Note: We need to be careful not to match incorrectly, but legacy IDs are usually full names
                  // e.g. "Shreyansh Kumar Sharma (TAG)"
                  // We strip the role part usually found in parens? 
                  // Actually, let's just try to match the base name parts.
                  return uName.includes(targetName) || targetName.includes(uName);
                });

                if (foundUser) {
                  return {
                    id: foundUser.id,
                    email: foundUser.email,
                    first_name: foundUser.first_name,
                    last_name: foundUser.last_name,
                    department: foundUser.department || [],
                    designation: foundUser.designation
                  };
                }
              }

              return {
                id: val.value || val.id,
                email: val.email || '',
                first_name: val.first_name || '',
                last_name: val.last_name || '',
                department: val.department || [],
                designation: val.designation || ''
              };
            }
            return { id: val };
          })
          : [],
        phone_no: userInfoFormData.phone_no,
        email: userInfoFormData.email,
        date_of_birth: userInfoFormData.date_of_birth,
        date_of_joining: userInfoFormData.date_of_joining,
        role: userInfoFormData.role,
        updated_by: currentUser?.display_name || currentUser?.first_name || 'Unknown',
        // Include permissions based on selected role(s)
        permission: (() => {
          if (userInfoFormData.role && userInfoFormData.role.length > 0 && rolesWithPermissions?.length) {
            const selectedRoles = userInfoFormData.role;
            const mergedPermissions: Record<string, string> = {};

            selectedRoles.forEach(roleName => {
              // Try to find in search results first (might have more recent data)
              const roleInOptions = roleDropdownOptions.find(opt => opt.label === roleName);
              const roleInPermissions = rolesWithPermissions?.find(r => r.name === roleName);
              
              // Use casting to bypass TS property check for DropdownOption
              const permissions = (roleInOptions as any)?.permissions || roleInPermissions?.permissions;

              if (permissions) {
                Object.keys(permissions).forEach(module => {
                  const key = module; // Keep as string for indexing
                  const currentBin = (mergedPermissions as any)[key] || '0000';
                  const newBin = (permissions as any)[key] || '0000';
                  // Binary OR merge
                  let resultBin = '';
                  for (let i = 0; i < 4; i++) {
                    const currentBit = currentBin[i] || '0';
                    const newBit = newBin[i] || '0';
                    resultBin += (currentBit === '1' || newBit === '1') ? '1' : '0';
                  }
                  (mergedPermissions as any)[key] = resultBin;
                });
              }
            });
            return Object.keys(mergedPermissions).length > 0 ? mergedPermissions : undefined;
          }
          return undefined;
        })(),
      };

      // Only include fields that have values
      Object.keys(updateData).forEach(key => {
        if (
          updateData[key] === '' ||
          updateData[key] === null ||
          updateData[key] === undefined ||
          (Array.isArray(updateData[key]) && updateData[key].length === 0)
        ) {
          delete updateData[key];
        }
      });

      console.log('Updating user info with data:', updateData);

      const result = await usersAPI.updateUser(userId, updateData);

      if (result.success) {
        showSuccessToast('User information updated successfully!');
        setShowUserInfoModal(false);
        // Refresh the page to get updated data
        window.location.reload();
      } else {
        showErrorToast(result.message || 'Failed to update user information');
      }
    } catch (error) {
      console.error('Error updating user info:', error);
      showErrorToast('Failed to update user info. Please try again.');
    } finally {
      setIsUpdatingUserInfo(false);
    }
  };

  // (Removed unused handleDownloadProfile)

  const handlePermissionChange = async (
    userId: string,
    permission: string,
    checked: boolean
  ) => {
    // Update local state immediately for better UX
    const [module, action] = permission.split('_');
    const moduleKey = module.charAt(0).toUpperCase() + module.slice(1);

    setSelectedUserPermissions(prev =>
      prev.map(perm => {
        if (perm.module === moduleKey) {
          return {
            ...perm,
            [action]: checked,
          };
        }
        return perm;
      })
    );

    // TODO: Implement API call to update permissions on the server
    try {
      console.log(`Permission change: ${userId} - ${permission} = ${checked}`);
      // Example API call structure:
      // await apiCall(`/users/${userId}/permissions`, {
      //     method: 'PATCH',
      //     body: JSON.stringify({ [permission]: checked })
      // });
      // Then refetch the permissions data
    } catch (error) {
      console.error('Error updating permission:', error);
      // Revert the local state change on error
      setSelectedUserPermissions(prev =>
        prev.map(perm => {
          if (perm.module === moduleKey) {
            return {
              ...perm,
              [action]: !checked, // Revert to previous state
            };
          }
          return perm;
        })
      );
    }
  };

  // (Removed unused handleStatusToggle)

  // Permissions editing handlers
  const handleEditPermissions = () => {
    if (!canUpdateUsers) {
      showWarningToast("You don't have permission to edit user permissions.");
      return;
    }

    setEditablePermissions([...userPermissions]);
    setIsEditingPermissions(true);
  };

  const handleCancelEditPermissions = () => {
    setIsEditingPermissions(false);
    setEditablePermissions([]);
  };

  const handlePermissionToggle = (
    moduleIndex: number,
    permissionType: string
  ) => {
    setEditablePermissions(prev =>
      prev.map((permission, index) =>
        index === moduleIndex
          ? { ...permission, [permissionType]: !permission[permissionType] }
          : permission
      )
    );
  };

  const handleSavePermissions = async () => {
    if (!userData || !userId) return;

    setIsUpdatingPermissions(true);
    try {
      // Convert permissions back to binary format for API
      const permissionObject: any = {};
      editablePermissions.forEach(permission => {
        const module = permission.module.toLowerCase();
        const binaryString =
          (permission.create ? '1' : '0') +
          (permission.view ? '1' : '0') +
          (permission.edit ? '1' : '0') +
          (permission.delete ? '1' : '0');
        permissionObject[module] = binaryString;
      });

      console.log('Updating user permissions with data:', {
        permission: permissionObject,
      });

      const result = await usersAPI.updateUser(userId, {
        permission: permissionObject,
        updated_by: currentUser?.display_name || currentUser?.first_name || 'Unknown',
      });

      if (result.success) {
        showSuccessToast('Permissions updated successfully!');
        // Reset editing state
        setIsEditingPermissions(false);
        setEditablePermissions([]);
        // Refresh the page to get updated data
        window.location.reload();
      } else {
        showErrorToast(result.message || 'Failed to update permissions');
      }
    } catch (error) {
      console.error('Error updating permissions:', error);
      showErrorToast('Failed to update permissions. Please try again.');
    } finally {
      setIsUpdatingPermissions(false);
    }
  };

  // Function to save selected user's permissions (same logic as My Permissions)
  const handleSaveSelectedUserPermissions = async () => {
    if (!selectedUserData || !selectedAssignUser) return;

    setIsSavingSelectedUserPermissions(true);
    try {
      // Convert permissions back to binary format for API (same as My Permissions logic)
      const permissionObject: any = {};
      selectedUserPermissions.forEach(permission => {
        const module = permission.module.toLowerCase();
        const binaryString =
          (permission.create ? '1' : '0') +
          (permission.view ? '1' : '0') +
          (permission.edit ? '1' : '0') +
          (permission.delete ? '1' : '0');
        permissionObject[module] = binaryString;
      });

      console.log('Updating selected user permissions with data:', {
        permission: permissionObject,
      });

      const result = await usersAPI.updateUser(selectedAssignUser, {
        permission: permissionObject,
        updated_by: currentUser?.display_name || currentUser?.first_name || 'Unknown',
      });

      if (result.success) {
        console.log('Permissions updated successfully, refreshing page');

        // Show success message
        showSuccessToast(
          `Permissions updated successfully for ${getUserDisplayName(selectedUserData)}!`
        );

        // Refresh the entire page to ensure all states are updated
        window.location.reload();
      } else {
        showErrorToast(result.message || 'Failed to update permissions');
      }
    } catch (error) {
      console.error('Error updating selected user permissions:', error);
      showErrorToast('Failed to update permissions. Please try again.');
    } finally {
      setIsSavingSelectedUserPermissions(false);
    }
  };

  // Users editing handlers
  const handleEditUsers = () => {
    if (!canUpdateUsers) {
      showWarningToast("You don't have permission to edit users.");
      return;
    }

    setIsEditingUsers(true);
    setPendingStatusChanges({});
  };

  const handleCancelEditUsers = () => {
    setIsEditingUsers(false);
    setPendingStatusChanges({});
  };

  const handleUserStatusToggle = (userId: string, newStatus: boolean) => {
    const status = newStatus ? 'Active' : 'Inactive';
    setPendingStatusChanges(prev => ({
      ...prev,
      [userId]: status,
    }));
  };

  const handleSaveUsers = async () => {
    setIsUpdatingUsers(true);
    try {
      // Apply all pending status changes
      const updatePromises = Object.entries(pendingStatusChanges).map(
        async ([userId, status]) => {
          const result = await usersAPI.updateUser(userId, {
            status,
            updated_by: currentUser?.display_name || currentUser?.first_name || 'Unknown',
          });
          if (!result.success) {
            console.error(`Failed to update user ${userId}: ${result.message}`);
          }
          return result;
        }
      );

      const results = await Promise.all(updatePromises);

      const failedUpdates = results.filter(result => !result.success);

      if (failedUpdates.length === 0) {
        showSuccessToast('All user status updates completed successfully!');
        // Reset editing state
        setIsEditingUsers(false);
        setPendingStatusChanges({});
        // Refresh the page to get updated data
        window.location.reload();
      } else {
        showWarningToast(
          `Some updates failed. ${results.length - failedUpdates.length} succeeded, ${failedUpdates.length} failed.`
        );
      }

      console.log('User status update results:', results);
    } catch (error) {
      console.error('Error saving user updates:', error);
      showErrorToast('Failed to save user updates. Please try again.');
    } finally {
      setIsUpdatingUsers(false);
    }
  };

  // Get data with fallbacks and convert permissions from API response
  const userPermissions = userData?.permission
    ? convertPermissionsFromApi(userData.permission)
    : [];
  // For assign permissions, we'll use the search results instead of a separate API endpoint
  const assignedUsers = searchedUsers.length > 0 ? searchedUsers : [];
  const userManagementUsers = userManagementData?.users || [];

  // Debug: Check what the API returned
  console.log('=== USER MANAGEMENT DEBUG ===');
  console.log('Search results for assign permissions:', assignedUsers);
  console.log(
    'Users reporting to current user (from API):',
    userManagementUsers
  );
  console.log('Reporting users count:', userManagementUsers.length);
  console.log('Current user ID:', currentUserId);
  console.log('User management URL:', userManagementUrl);

  // Handle search input changes
  const handleSearchAssignUsers = (value: string) => {
    setSearchAssignUsers(value);
    if (value.trim()) {
      searchUsers(value);
    } else {
      clearSearch();
      setSelectedAssignUser(null);
      setSelectedUserData(null);
      setSelectedUserPermissions([]);
      setIsLoadingUserData(false);
    }
  };

  // Function to check if a user is within the current user's reporting hierarchy
  // Simplified: reporting_to contains pre-formatted strings like "Asif Akbar (Director)"
  // We use partial name matching as a fallback for formatting inconsistencies
  const isUserInReportingHierarchy = (userId: string): boolean => {
    if (!allUsersData?.users || !currentUserId || !userData) return false;

    // Get all users for easier lookup
    const allUsers = allUsersData.users;
    const targetUser = allUsers.find(
      user => user.id === userId || user._id === userId
    );

    if (!targetUser || !targetUser.reporting_to) return false;

    const currentUserDisplayName = getUserDisplayName(userData);

    // Check if user reports directly to current user
    const reportsDirectlyToMe = targetUser.reporting_to.some(
      (reportingItem: any) => {
        // Handle both string and object formats
        let reportingItemId = '';

        // If it's a string, use it directly
        if (typeof reportingItem === 'string') {
          reportingItemId = reportingItem;
        }
        // If it's an object with id and detail fields
        else if (typeof reportingItem === 'object' && reportingItem !== null && reportingItem.id) {
          reportingItemId = reportingItem.id;
        }
        // If it's neither a string nor a valid object, skip
        else {
          return false;
        }

        // Try exact match first
        if (reportingItemId === currentUserFormattedName) {
          return true;
        }
        // Fallback: partial match with display name
        if (
          reportingItemId.toLowerCase().includes(currentUserDisplayName.toLowerCase())
        ) {
          return true;
        }
        return false;
      }
    );

    if (reportsDirectlyToMe) {
      console.log(
        `User ${userId} reports directly to current user: ${currentUserFormattedName}`
      );
      return true;
    }

    // Check if user reports to someone who reports to current user (indirect reports)
    for (const managerItem of targetUser.reporting_to) {
      // Handle both string and object formats
      let managerName = '';

      // If it's a string, use it directly
      if (typeof managerItem === 'string') {
        managerName = managerItem;
      }
      // If it's an object with id and detail fields
      else if (typeof managerItem === 'object' && managerItem !== null && (managerItem as any).id) {
        managerName = (managerItem as any).id;
      }
      // If it's neither a string nor a valid object, skip
      else {
        continue;
      }

      // Find manager in all users and check if they report to current user
      const manager = allUsers.find(u => {
        const managerDisplayName = getUserDisplayName(u);
        // Check if this user's name matches the manager name
        return (
          managerName.toLowerCase().includes(managerDisplayName.toLowerCase()) ||
          managerDisplayName.toLowerCase().includes(managerName.toLowerCase())
        );
      });

      if (manager && manager.reporting_to) {
        const managerReportsToMe = manager.reporting_to.some(
          (item: any) => {
            // Handle both string and object formats
            let itemId = '';

            // If it's a string, use it directly
            if (typeof item === 'string') {
              itemId = item;
            }
            // If it's an object with id and detail fields
            else if (typeof item === 'object' && item !== null && (item as any).id) {
              itemId = (item as any).id;
            }
            // If it's neither a string nor a valid object, skip
            else {
              return false;
            }

            // Try exact match first
            if (itemId === currentUserFormattedName) {
              return true;
            }
            // Fallback: partial match with display name
            if (
              itemId.toLowerCase().includes(currentUserDisplayName.toLowerCase())
            ) {
              return true;
            }
            return false;
          }
        );

        if (managerReportsToMe) {
          console.log(
            `User ${userId} reports to ${managerName} who reports to current user`
          );
          return true;
        }
      }
    }

    console.log(`User ${userId} is not in reporting hierarchy`);
    return false;
  };

  // Function to fetch selected user's data and permissions
  const fetchSelectedUserData = async (userId: string) => {
    setIsLoadingUserData(true);
    try {
      console.log('Fetching user data for ID:', userId);

      // Use the existing useSWR infrastructure instead of custom fetch
      const response = await apiCall<User>(API_ENDPOINTS.USERS.GET(userId));

      if (response.data) {
        console.log('Successfully fetched user data:', response.data);
        setSelectedUserData(response.data);

        // Convert permissions to the format needed for checkboxes
        if (response.data.permission) {
          console.log('User permissions found:', response.data.permission);
          const permissions = convertPermissionsFromApi(
            response.data.permission
          );
          console.log('Converted permissions:', permissions);
          setSelectedUserPermissions(permissions);
        } else {
          console.log('No permissions found for user, setting defaults');
          // If no permissions, set default empty permissions
          const defaultPermissions = [
            'Candidate',
            'Client',
            'Job',
            'Supplier',
            'Users',
          ].map(module => ({
            module,
            create: false,
            view: false,
            edit: false,
            delete: false,
          }));
          setSelectedUserPermissions(defaultPermissions);
        }
      } else {
        console.error('No data received from API');
        setSelectedUserData(null);
        // Set default permissions even when no data
        const defaultPermissions = [
          'Candidate',
          'Client',
          'Job',
          'Supplier',
          'Users',
        ].map(module => ({
          module,
          create: false,
          view: false,
          edit: false,
          delete: false,
        }));
        setSelectedUserPermissions(defaultPermissions);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setSelectedUserData(null);

      // Always set default permissions to prevent infinite loading
      const defaultPermissions = [
        'Candidate',
        'Client',
        'Job',
        'Supplier',
        'Users',
      ].map(module => ({
        module,
        create: false,
        view: false,
        edit: false,
        delete: false,
      }));
      setSelectedUserPermissions(defaultPermissions);
    } finally {
      setIsLoadingUserData(false);
    }
  };

  // Build current user's formatted name with designation for matching
  // Format: "FirstName LastName (Designation)" e.g., "Asif Akbar (Director)"
  // We'll use this for display purposes, but verify with ID-based matching
  const getCurrentUserFormattedName = (): string => {
    if (!userData) return '';
    const displayName = getUserDisplayName(userData);
    const designation = capitalizeAndSafe(userData.designation) || '';
    return designation ? `${displayName} (${designation})` : displayName;
  };

  const currentUserFormattedName = getCurrentUserFormattedName();

  // Use dynamic search results with hierarchical filtering
  // Only show users who report to current user OR users who report to current user's direct reports
  const displayUsers = searchAssignUsers.trim()
    ? searchedUsers.filter(user => isUserInReportingHierarchy(user.id))
    : [];

  // Instead of using the simplified UserManagement API, use the full users list and filter locally
  // This gives us access to display_name, first_name, middle_name, last_name
  // reporting_to array can contain either pre-formatted strings like "Asif Akbar (Director)" 
  // or objects with id/detail fields like {"id": "rajjyyy vrvr (Director)", "detail": "User not found"}
  // We match by comparing formatted names AND verify by checking if the current user ID appears when we build formatted names from all users
  const usersWhoReportToMe =
    allUsersData?.users?.filter(user => {
      if (!user.reporting_to || !currentUserId) return false;

      // Check if current user's formatted name is in the reporting_to array
      return user.reporting_to.some((reportingItem: any) => {
        // Handle both string and object formats
        let reportingItemId = '';

        // If it's a string, use it directly
        if (typeof reportingItem === 'string') {
          reportingItemId = reportingItem;
        }
        // If it's an object with id and detail fields
        else if (typeof reportingItem === 'object' && reportingItem !== null && reportingItem.id) {
          reportingItemId = reportingItem.id;
        }
        // If it's neither a string nor a valid object, skip
        else {
          return false;
        }

        // Direct string match with formatted name
        if (reportingItemId === currentUserFormattedName) {
          console.log(
            `Match found: "${reportingItemId}" === "${currentUserFormattedName}"`
          );
          return true;
        }

        // Fallback: Check if the reporting item contains the current user's display name
        // This handles cases where formatting might be slightly different
        const currentDisplayName = getUserDisplayName(userData);
        if (
          reportingItemId.toLowerCase().includes(currentDisplayName.toLowerCase())
        ) {
          console.log(
            `Partial match found: "${reportingItemId}" contains "${currentDisplayName}"`
          );
          return true;
        }

        return false;
      });
    }) || [];

  // Apply search filter to the full user objects
  const filteredActivateUsers = usersWhoReportToMe.filter(user => {
    // Now we have full User objects, so we can use getUserDisplayName
    const userName = getUserDisplayName(user);

    console.log('Processing user for filter:', {
      userId: user.id,
      userName: userName,
      userStatus: user.status,
      searchTerm: searchActivateUsers,
    });

    // If no search term, show all users
    if (!searchActivateUsers.trim()) {
      return true;
    }

    // If search term exists, filter by name
    return userName.toLowerCase().includes(searchActivateUsers.toLowerCase());
  });

  // Additional debug logs for filtered results
  console.log('Filtered activate users:', filteredActivateUsers);
  console.log('Search activate users term:', searchActivateUsers);



  // Format user data for display
  const displayData = {
    display_name: getUserDisplayName(userData),
    employee_id: userData.username || userData.id,
    designation: capitalizeAndSafe(userData.designation) || 'No Designation',
    status: capitalizeAndSafe(userData.status),
    role: Array.isArray(userData.role)
      ? userData.role.map(r => capitalizeAndSafe(r)).join(', ')
      : capitalizeAndSafe(userData.role?.[0]) || 'No Role',
    phone: userData.phone_no?.toString() || 'No Phone',
    email: userData.email || 'No Email',
    date_of_birth: (userData as any).date_of_birth ? formatUIDate((userData as any).date_of_birth) : 'N/A',
    date_of_joining: (userData as any).date_of_joining ? formatUIDate((userData as any).date_of_joining) : 'N/A',
    location: userData.location
      ? userData.location
        .replace(/\//g, ', ')
        .split(', ')
        .map(loc => capitalizeAndSafe(loc.trim()))
        .join(', ')
      : 'No Location',
    department: Array.isArray(userData.department)
      ? userData.department.map(d => capitalizeAndSafe(d)).join(', ')
      : capitalizeAndSafe(userData.department?.[0]) || 'No Department',
    reporting_to: resolveReportingToNames(userData.reporting_to || []),
    join_date: formatUIDate(userData.created),
    user_picture: userData.avatar?.file_url || undefined,
    last_viewed_by: lastViewedBy || 'System',
    last_viewed_date: lastViewedOn,
    updated_by: userData.updated_by || userData.created_by,
    updated: userData.updated,
  };

  const tabs = [
    { id: 'permissions', label: 'My Permissions' },
    { id: 'assign', label: 'Assign Permission' },
    { id: 'activate', label: 'Activate/Deactivate User' },
  ];

  return (
    <div className="h-full bg-gray-50 overflow-y-auto">
      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <Breadcrumb
          items={[
            { label: 'Home', path: '/' },
            { label: 'Users', path: '/users' },
            {
              label: `${displayData.display_name} (${displayData.employee_id})`,
              active: true,
            },
          ]}
          additionalInfo={
            userData?.created_by || userData?.created
              ? `Created By ${userData.created_by || 'Unknown'}${userData.created ? ` | Created on ${formatUIDate(userData.created)}` : ''}`
              : undefined
          }
        />
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-6 max-w-screen-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - 8/12 width */}
          <div className="lg:col-span-8 space-y-6">
            {/* Header */}
            <div className="space-y-4">
              <UserDetailHeader
                name={displayData.display_name}
                code={displayData.employee_id}
                designation={displayData.designation}
                status={userData.status}
                photo={photoViewUrl || displayData.user_picture}
                auditInfo={{
                  lastViewedBy: displayData.last_viewed_by,
                  lastViewedOn: displayData.last_viewed_date,
                  lastUpdatedBy: displayData.updated_by,
                  lastUpdatedOn: formatUIDate(displayData.updated),
                  createdBy: userData?.created_by,
                  createdOn: userData?.created
                    ? formatUIDate(userData.created)
                    : undefined,
                }}
                onEdit={handleEditUser}
                canEdit={canUpdateUsers}
              />
            </div>

            {/* Tabs Content */}
            <div className="bg-white rounded-lg shadow-sm">
              <Tabs
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                className="px-6 pt-6"
                variant="underline"
              />

              <div className="p-6">
                {/* My Permissions Tab */}
                {activeTab === 'permissions' && (
                  <Card>
                    <div className="pb-2 flex justify-between items-center">
                      <Text
                        variant="h3"
                        className="text-lg font-medium flex items-center gap-2"
                      >
                        <Icon name="key" className="w-5 h-5 text-blue-600" />
                        My Permissions
                      </Text>
                      <div className="flex gap-2">
                        {isEditingPermissions ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleCancelEditPermissions}
                              disabled={isUpdatingPermissions}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleSavePermissions}
                              loading={isUpdatingPermissions}
                            >
                              Save Changes
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleEditPermissions}
                            className="flex items-center gap-2"
                            disabled={!canUpdateUsers}
                            title={
                              !canUpdateUsers
                                ? "You don't have permission to edit user permissions"
                                : 'Edit Permissions'
                            }
                          >
                            <Icon name="edit" className="w-4 h-4" />
                            Edit Permissions
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="text-left p-3 font-medium">
                              Modules
                            </th>
                            <th className="text-center p-3 font-medium">
                              Create
                            </th>
                            <th className="text-center p-3 font-medium">
                              View
                            </th>
                            <th className="text-center p-3 font-medium">
                              Edit
                            </th>
                            <th className="text-center p-3 font-medium">
                              Delete
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {(isEditingPermissions
                            ? editablePermissions
                            : userPermissions
                          ).length > 0 ? (
                            (isEditingPermissions
                              ? editablePermissions
                              : userPermissions
                            ).map((permission, index) => (
                              <tr
                                key={permission.module}
                                className="border-b border-gray-100"
                              >
                                <td className="p-3 font-medium">
                                  {permission.module}
                                </td>
                                <td className="p-3 text-center">
                                  <Checkbox
                                    checked={permission.create}
                                    onChange={
                                      isEditingPermissions
                                        ? () =>
                                          handlePermissionToggle(
                                            index,
                                            'create'
                                          )
                                        : undefined
                                    }
                                    className={
                                      isEditingPermissions
                                        ? ''
                                        : 'opacity-50 pointer-events-none'
                                    }
                                  />
                                </td>
                                <td className="p-3 text-center">
                                  <Checkbox
                                    checked={permission.view}
                                    onChange={
                                      isEditingPermissions
                                        ? () =>
                                          handlePermissionToggle(
                                            index,
                                            'view'
                                          )
                                        : undefined
                                    }
                                    className={
                                      isEditingPermissions
                                        ? ''
                                        : 'opacity-50 pointer-events-none'
                                    }
                                  />
                                </td>
                                <td className="p-3 text-center">
                                  <Checkbox
                                    checked={permission.edit}
                                    onChange={
                                      isEditingPermissions
                                        ? () =>
                                          handlePermissionToggle(
                                            index,
                                            'edit'
                                          )
                                        : undefined
                                    }
                                    className={
                                      isEditingPermissions
                                        ? ''
                                        : 'opacity-50 pointer-events-none'
                                    }
                                  />
                                </td>
                                <td className="p-3 text-center">
                                  <Checkbox
                                    checked={permission.delete}
                                    onChange={
                                      isEditingPermissions
                                        ? () =>
                                          handlePermissionToggle(
                                            index,
                                            'delete'
                                          )
                                        : undefined
                                    }
                                    className={
                                      isEditingPermissions
                                        ? ''
                                        : 'opacity-50 pointer-events-none'
                                    }
                                  />
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan={5}
                                className="text-center py-6 text-gray-500"
                              >
                                No permissions assigned to this user
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                )}

                {/* Assign Permission Tab */}
                {activeTab === 'assign' && (
                  <Card>
                    <div className="pb-2 flex flex-row items-center justify-between">
                      <Text
                        variant="h3"
                        className="text-lg font-medium flex items-center gap-2"
                      >
                        <Icon name="user" className="w-5 h-5 text-blue-600" />
                        Assign Permission
                      </Text>
                      <div className="flex items-center gap-2">
                        <div className="relative w-[250px]">
                          <Icon
                            name="search"
                            className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"
                          />
                          <SearchBox
                            placeholder="Search users in your reporting hierarchy..."
                            value={searchAssignUsers}
                            onChange={handleSearchAssignUsers}
                            className="pl-9"
                          />
                          {searchAssignUsers && (
                            <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                              {searchLoading ? (
                                <div className="px-3 py-2 text-gray-500">
                                  Searching...
                                </div>
                              ) : searchError ? (
                                <div className="px-3 py-2 text-red-500">
                                  Error: {searchError}
                                </div>
                              ) : displayUsers.length > 0 ? (
                                displayUsers.map(user => (
                                  <div
                                    key={user.id}
                                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                    onClick={async () => {
                                      setSelectedAssignUser(user.id);
                                      setSearchAssignUsers(''); // Clear search to close dropdown
                                      clearSearch(); // Clear search results
                                      await fetchSelectedUserData(user.id); // Fetch user's data and permissions
                                    }}
                                  >
                                    <div className="font-medium">
                                      {user.name}
                                    </div>
                                    {user.email && (
                                      <div className="text-sm text-gray-500">
                                        {user.email}
                                      </div>
                                    )}
                                  </div>
                                ))
                              ) : searchAssignUsers.trim() ? (
                                <div className="px-3 py-2 text-gray-500">
                                  No users found in your reporting hierarchy
                                </div>
                              ) : (
                                <div className="px-3 py-2 text-gray-500">
                                  Start typing to search users...
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          className="gap-1"
                          disabled={
                            !canCreateUsers || isSavingSelectedUserPermissions
                          }
                          title={
                            !canCreateUsers
                              ? "You don't have permission to add users"
                              : selectedAssignUser
                                ? isSavingSelectedUserPermissions
                                  ? 'Saving Permissions...'
                                  : 'Save Permissions'
                                : 'Add User'
                          }
                          onClick={
                            selectedAssignUser
                              ? handleSaveSelectedUserPermissions
                              : undefined
                          }
                          loading={
                            selectedAssignUser
                              ? isSavingSelectedUserPermissions
                              : false
                          }
                        >
                          <Icon
                            name={selectedAssignUser ? 'check' : 'plus'}
                            className="w-4 h-4"
                          />
                          {selectedAssignUser
                            ? isSavingSelectedUserPermissions
                              ? 'Saving...'
                              : 'Save Permissions'
                            : 'Add User'}
                        </Button>
                      </div>
                    </div>
                    {searchLoading && searchAssignUsers ? (
                      <div className="flex items-center justify-center py-8">
                        <Text>Searching users...</Text>
                      </div>
                    ) : searchError ? (
                      <div className="flex items-center justify-center py-8">
                        <Text className="text-red-600">
                          Error searching users: {searchError}
                        </Text>
                      </div>
                    ) : (
                      <>
                        {selectedAssignUser ? (
                          <>
                            {/* User Information Header */}
                            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                              <Text className="font-medium text-blue-800">
                                Managing permissions for:{' '}
                                {selectedUserData
                                  ? getUserDisplayName(selectedUserData)
                                  : 'Loading user...'}
                              </Text>
                            </div>

                            {/* Permissions Table - Same format as My Permissions */}
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead>
                                  <tr className="bg-gray-50">
                                    <th className="text-left p-3 font-medium">
                                      Modules
                                    </th>
                                    <th className="text-center p-3 font-medium">
                                      Create
                                    </th>
                                    <th className="text-center p-3 font-medium">
                                      View
                                    </th>
                                    <th className="text-center p-3 font-medium">
                                      Edit
                                    </th>
                                    <th className="text-center p-3 font-medium">
                                      Delete
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {/* Standard modules like My Permissions */}
                                  {selectedUserPermissions.length > 0 ? (
                                    selectedUserPermissions.map(
                                      (permission, moduleIndex) => {
                                        return (
                                          <tr
                                            key={permission.module}
                                            className="border-b border-gray-100"
                                          >
                                            <td className="p-3 font-medium">
                                              {permission.module}
                                            </td>
                                            <td className="p-3 text-center">
                                              <Checkbox
                                                checked={permission.create}
                                                onChange={checked =>
                                                  handlePermissionChange(
                                                    selectedAssignUser!,
                                                    `${permission.module.toLowerCase()}_create`,
                                                    checked
                                                  )
                                                }
                                              />
                                            </td>
                                            <td className="p-3 text-center">
                                              <Checkbox
                                                checked={permission.view}
                                                onChange={checked =>
                                                  handlePermissionChange(
                                                    selectedAssignUser!,
                                                    `${permission.module.toLowerCase()}_view`,
                                                    checked
                                                  )
                                                }
                                              />
                                            </td>
                                            <td className="p-3 text-center">
                                              <Checkbox
                                                checked={permission.edit}
                                                onChange={checked =>
                                                  handlePermissionChange(
                                                    selectedAssignUser!,
                                                    `${permission.module.toLowerCase()}_edit`,
                                                    checked
                                                  )
                                                }
                                              />
                                            </td>
                                            <td className="p-3 text-center">
                                              <Checkbox
                                                checked={permission.delete}
                                                onChange={checked =>
                                                  handlePermissionChange(
                                                    selectedAssignUser!,
                                                    `${permission.module.toLowerCase()}_delete`,
                                                    checked
                                                  )
                                                }
                                              />
                                            </td>
                                          </tr>
                                        );
                                      }
                                    )
                                  ) : selectedAssignUser &&
                                    isLoadingUserData ? (
                                    <tr>
                                      <td
                                        colSpan={5}
                                        className="text-center py-6 text-gray-500"
                                      >
                                        Loading user permissions...
                                      </td>
                                    </tr>
                                  ) : null}
                                </tbody>
                              </table>
                            </div>
                          </>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="bg-gray-50">
                                  <th className="text-left p-3 font-medium">
                                    Modules
                                  </th>
                                  <th className="text-center p-3 font-medium">
                                    Create
                                  </th>
                                  <th className="text-center p-3 font-medium">
                                    View
                                  </th>
                                  <th className="text-center p-3 font-medium">
                                    Edit
                                  </th>
                                  <th className="text-center p-3 font-medium">
                                    Delete
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td
                                    colSpan={5}
                                    className="text-center py-6 text-gray-500"
                                  >
                                    Search and select a user from your reporting
                                    hierarchy to manage their permissions.
                                    <br />
                                    <small className="text-xs text-gray-400">
                                      You can manage permissions for users who
                                      report to you and users who report to your
                                      direct reports.
                                    </small>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        )}
                        {selectedAssignUser && (
                          <div className="flex justify-end mt-4">
                            {/* Save button removed - now handled by top-right button */}
                          </div>
                        )}
                      </>
                    )}
                  </Card>
                )}

                {/* Activate/Deactivate Tab */}
                {activeTab === 'activate' && (
                  <Card>
                    <div className="pb-2 flex flex-row items-center justify-between">
                      <Text
                        variant="h3"
                        className="text-lg font-medium flex items-center gap-2"
                      >
                        <Icon name="key" className="w-5 h-5 text-blue-600" />
                        Activate/Deactivate User
                      </Text>
                      <div className="flex items-center gap-2">
                        <div className="relative w-[250px]">
                          <Icon
                            name="search"
                            className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"
                          />
                          <SearchBox
                            placeholder="Search users..."
                            value={searchActivateUsers}
                            onChange={setSearchActivateUsers}
                            className="pl-9"
                          />
                          {searchActivateUsers && (
                            <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                              {filteredActivateUsers.length > 0 ? (
                                filteredActivateUsers.map(user => (
                                  <div
                                    key={user.id}
                                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                    onClick={() => {
                                      setSearchActivateUsers(
                                        getUserDisplayName(user)
                                      );
                                    }}
                                  >
                                    {getUserDisplayName(user)}
                                  </div>
                                ))
                              ) : (
                                <div className="px-3 py-2 text-gray-500">
                                  No users found
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {isEditingUsers ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCancelEditUsers}
                                disabled={isUpdatingUsers}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                onClick={handleSaveUsers}
                                loading={isUpdatingUsers}
                              >
                                Save Changes
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleEditUsers}
                              className="flex items-center gap-2"
                              disabled={!canUpdateUsers}
                              title={
                                !canUpdateUsers
                                  ? "You don't have permission to edit users"
                                  : 'Edit Users'
                              }
                            >
                              <Icon name="edit" className="w-4 h-4" />
                              Edit Users
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                    {userManagementLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Text>Loading user management data...</Text>
                      </div>
                    ) : userManagementError ? (
                      <div className="flex items-center justify-center py-8">
                        <Text className="text-red-600">
                          Failed to load user management data
                        </Text>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Main User Section */}
                        <div>
                          <div className="flex items-center justify-between py-4 border-b border-gray-200">
                            <Text
                              variant="h4"
                              className="font-medium text-gray-700"
                            >
                              MAIN USER
                            </Text>
                            <Text
                              variant="h4"
                              className="font-medium text-gray-700"
                            >
                              STATUS
                            </Text>
                          </div>
                          <div className="flex items-center justify-between py-4">
                            <div className="flex items-center gap-3">
                              <Avatar
                                src={photoViewUrl || userData?.avatar?.file_url}
                                alt={displayData.display_name}
                                size="sm"
                              />
                              <Text className="font-medium">
                                {displayData.display_name}
                              </Text>
                            </div>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={
                                  isEditingUsers
                                    ? () =>
                                      handleUserStatusToggle(
                                        userData.id,
                                        (pendingStatusChanges[userData.id] ||
                                          userData.status) !== 'Active'
                                      )
                                    : undefined
                                }
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${(pendingStatusChanges[userData.id] ||
                                  userData.status) === 'Active'
                                  ? 'bg-blue-600'
                                  : 'bg-gray-300'
                                  } ${!isEditingUsers ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                role="switch"
                                aria-checked={
                                  (pendingStatusChanges[userData.id] ||
                                    userData.status) === 'Active'
                                }
                                disabled={!isEditingUsers}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${(pendingStatusChanges[userData.id] ||
                                    userData.status) === 'Active'
                                    ? 'translate-x-6'
                                    : 'translate-x-1'
                                    }`}
                                />
                              </button>
                              <span
                                className={`text-sm font-medium ${(pendingStatusChanges[userData.id] ||
                                  userData.status) === 'Active'
                                  ? 'text-green-600'
                                  : 'text-gray-500'
                                  }`}
                              >
                                {pendingStatusChanges[userData.id] ||
                                  userData.status}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* His Users Section */}
                        {filteredActivateUsers.length > 0 && (
                          <div>
                            <div className="flex items-center justify-between py-4 border-b border-gray-200">
                              <Text
                                variant="h4"
                                className="font-medium text-gray-700"
                              >
                                HIS USERS
                              </Text>
                              <Text
                                variant="h4"
                                className="font-medium text-gray-700"
                              >
                                STATUS
                              </Text>
                            </div>
                            <div className="space-y-2">
                              {filteredActivateUsers.map(user => {
                                // Now using full User objects with proper display names
                                const userId = user.id;
                                const userName = getUserDisplayName(user);
                                const userStatus = user.status || 'Active';

                                return (
                                  <div
                                    key={userId}
                                    className="flex items-center justify-between py-3"
                                  >
                                    <Text className="font-medium">
                                      {userName}
                                    </Text>
                                    <div className="flex items-center gap-3">
                                      <button
                                        onClick={
                                          isEditingUsers
                                            ? () =>
                                              handleUserStatusToggle(
                                                userId,
                                                (pendingStatusChanges[
                                                  userId
                                                ] || userStatus) !== 'Active'
                                              )
                                            : undefined
                                        }
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${(pendingStatusChanges[userId] ||
                                          userStatus) === 'Active'
                                          ? 'bg-blue-600'
                                          : 'bg-gray-300'
                                          } ${!isEditingUsers ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                        role="switch"
                                        aria-checked={
                                          (pendingStatusChanges[userId] ||
                                            userStatus) === 'Active'
                                        }
                                        disabled={!isEditingUsers}
                                      >
                                        <span
                                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${(pendingStatusChanges[userId] ||
                                            userStatus) === 'Active'
                                            ? 'translate-x-6'
                                            : 'translate-x-1'
                                            }`}
                                        />
                                      </button>
                                      <span
                                        className={`text-sm font-medium min-w-[60px] ${(pendingStatusChanges[userId] ||
                                          userStatus) === 'Active'
                                          ? 'text-green-600'
                                          : 'text-gray-500'
                                          }`}
                                      >
                                        {pendingStatusChanges[userId] ||
                                          userStatus}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {filteredActivateUsers.length === 0 && (
                          <div className="text-center py-8">
                            <Text className="text-gray-500">
                              No users found reporting to this user
                            </Text>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - 4/12 width */}
          <div className="lg:col-span-4 space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {/* User Information Card */}
              <Card
                title="User Information"
                className="w-full text-left relative"
              >
                {/* Edit button positioned absolutely - Only show if user has update permission */}
                {canUpdateUsers && (
                  <div className="absolute top-4 right-4">
                    <Button
                      variant="ghost"
                      iconOnly
                      onClick={handleEditUserInfo}
                      title="Edit User Information"
                    >
                      <Icon name="edit" size={16} />
                    </Button>
                  </div>
                )}
                <div className="mb-2">
                  <span className="text-gray-600">Phone:</span>{' '}
                  <span className="font-bold">{displayData.phone}</span>
                </div>
                <hr className="my-2" />
                <div className="mb-2">
                  <span className="text-gray-600">Email ID:</span>{' '}
                  <span className="font-bold">{displayData.email}</span>
                </div>
                <hr className="my-2" />
                <div className="mb-2">
                  <span className="text-gray-600">Date of Birth:</span>{' '}
                  <span className="font-bold">{displayData.date_of_birth || 'N/A'}</span>
                </div>
                <hr className="my-2" />
                <div className="mb-2">
                  <span className="text-gray-600">Date of Joining:</span>{' '}
                  <span className="font-bold">{displayData.date_of_joining || displayData.join_date || 'N/A'}</span>
                </div>
                <hr className="my-2" />
                <div className="mb-2">
                  <span className="text-gray-600">Location:</span>{' '}
                  <span className="font-bold">{displayData.location}</span>
                </div>
                <hr className="my-2" />
                <div className="mb-2">
                  <span className="text-gray-600">Department:</span>{' '}
                  <span className="font-bold">{displayData.department}</span>
                </div>
                <hr className="my-2" />
                <div className="mb-2">
                  <span className="text-gray-600">Role:</span>{' '}
                  <span className="font-bold">{displayData.role}</span>
                </div>
                <hr className="my-2" />
                <div className="mb-2">
                  <span className="text-gray-600">Reporting To:</span>{' '}
                  <span className="font-bold">{displayData.reporting_to}</span>
                </div>
              </Card>

              {/* Activity Log Card */}
              {/* <Card>
                <div className="pb-2">
                  <Text
                    variant="h3"
                    className="text-lg font-medium flex items-center gap-2"
                  >
                    <Icon name="history" className="w-5 h-5 text-blue-600" />
                    Activity Log
                  </Text>
                </div>
                {activityLogsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Text>Loading activity logs...</Text>
                  </div>
                ) : activityLogsError ? (
                  <div className="flex items-center justify-center py-8">
                    <Text className="text-red-600">
                      Failed to load activity logs
                    </Text>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      {activityLogs.map(log => (
                        <div key={log.id} className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <Text className="text-sm font-medium">
                                {log.action}
                              </Text>
                              <Text className="text-xs text-gray-500 mt-1">
                                {log.description}
                              </Text>
                            </div>
                            <Badge
                              variant="secondary"
                              size="sm"
                              className={`text-xs ${log.type === 'Permission'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : log.type === 'Activation'
                                    ? 'bg-green-50 text-green-700 border-green-200'
                                    : log.type === 'Deactivation'
                                      ? 'bg-red-50 text-red-700 border-red-200'
                                      : 'bg-purple-50 text-purple-700 border-purple-200'
                                }`}
                            >
                              {log.type}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                            <span>{log.timestamp}</span>
                            <span>•</span>
                            <span>{log.user}</span>
                          </div>
                        </div>
                      ))}
                      {activityLogs.length === 0 && (
                        <div className="text-center py-6 text-gray-500">
                          <Text>No activity logs found</Text>
                        </div>
                      )}
                    </div>

                    {activityLogs.length > 0 && (
                      <div className="flex justify-center">
                        <Button variant="outline" size="sm" className="text-xs">
                          View All Activities
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </Card> */}
            </div>
          </div>
        </div>
      </div>

      {/* Edit User Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        title="Edit User Details"
        size="lg"
        className="max-h-[90vh] overflow-y-auto"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={handleCloseEditModal}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleUpdateUser}
              disabled={
                isUpdating || !canUpdateUsers || uploadStates.avatar.uploading
              }
              title={
                !canUpdateUsers
                  ? "You don't have permission to update user details"
                  : uploadStates.avatar.uploading
                    ? 'Please wait for upload to complete'
                    : 'Save Changes'
              }
            >
              {isUpdating
                ? 'Saving...'
                : uploadStates.avatar.uploading
                  ? 'Uploading...'
                  : 'Save Changes'}
            </Button>
          </div>
        }
      >
        {/* --- Enhanced Required Form with Live Validation --- */}
        <div className="space-y-6">
          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <EnhancedInputField
              label={'First Name'}
              value={editFormData.first_name}
              onChange={value => {
                handleEditFormChange('first_name', value);
                validateField('first_name', value);
              }}
              required
              type="text"
              placeholder="Enter first name"
              error={formErrors.first_name}
            />
            <EnhancedInputField
              label={'Middle Name'}
              value={editFormData.middle_name}
              onChange={value => {
                handleEditFormChange('middle_name', value);
                validateField('middle_name', value);
              }}
              type="text"
              placeholder="Enter middle name (optional)"
              error={formErrors.middle_name}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <EnhancedInputField
              label={'Last Name '}
              value={editFormData.last_name}
              onChange={value => {
                handleEditFormChange('last_name', value);
                validateField('last_name', value);
              }}
              required
              type="text"
              placeholder="Enter last name"
              error={formErrors.last_name}
            />
            <EnhancedInputField
              label={'Display Name'}
              value={editFormData.display_name}
              onChange={() => { }} // Read-only, auto-generated
              type="text"
              placeholder="Auto-generated from first, middle and last name"
              disabled
              error={formErrors.display_name}
            />
          </div>

          {/* Employee Details */}
          <div className="grid grid-cols-2 gap-4">
            <EnhancedInputField
              label={'Employee ID'}
              value={editFormData.username}
              onChange={() => { }} // Read-only, system allocated
              type="text"
              placeholder="System allocated employee ID"
              disabled
              required
              error={formErrors.username}
            />
            <AsyncSelect
              label={'Status'}
              value={getStatusOptionFromValue(editFormData.status)}
              onChange={option => {
                handleEditFormChange('status', option?.value || '');
                validateField('status', option?.value || '');
              }}
              required
              onInputChange={() => { }} // No search functionality needed for status
              options={statusAsyncOptions}
              placeholder="Select status"
            />
            {formErrors.status && (
              <div className="text-red-500 text-xs mt-1">
                {formErrors.status}
              </div>
            )}
          </div>

          {/* Designation */}
          <div className="grid grid-cols-1 gap-4">
            <AsyncSelect
              label={'Designation'}
              value={getDesignationOptionFromValue(editFormData.designation)}
              onChange={option => {
                // Store by 'name' (label) instead of 'id' (value)
                handleEditFormChange('designation', option?.label || '');
                validateField('designation', option?.label || '');
              }}
              required
              onInputChange={(val) => searchDesignation(val)}
              options={designationAsyncOptions}
              placeholder="Select designation"
              isLoading={designationLoading}
              showAddButton={true}
              dropdownType="Designation"
              dropdownLabel="Designation"
            />
            {formErrors.designation && (
              <div className="text-red-500 text-xs mt-1">
                {formErrors.designation}
              </div>
            )}
          </div>

          {/* User Picture */}
          <div>
            <AvatarUpload
              label={'User Picture'}
              preview={
                editFormData.avatar_removed
                  ? undefined
                  : editFormData.avatar
                    ? URL.createObjectURL(editFormData.avatar)
                    : photoViewUrl || userData?.avatar?.file_url
              }
              value={editFormData.avatar}
              onChange={(file: File | null) => {
                handleEditFormChange('avatar', file);
                validateField('avatar', file);
              }}
              size="lg"
              accept=".jpg,.jpeg,.png,.gif"
              maxSize={5}
              showFileName={true}
              uploading={uploadStates.avatar.uploading}
              uploadError={uploadStates.avatar.error || undefined}
              required
              error={formErrors.avatar}
            />
          </div>
        </div>
      </Modal>

      {/* User Information Edit Modal */}
      <Modal
        isOpen={showUserInfoModal}
        onClose={handleCloseUserInfoModal}
        title="Edit User Information"
        size="lg"
        className="max-h-[90vh] overflow-y-auto"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={handleCloseUserInfoModal}
              disabled={isUpdatingUserInfo}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleUpdateUserInfo}
              disabled={isUpdatingUserInfo || !canUpdateUsers}
              title={
                !canUpdateUsers
                  ? "You don't have permission to update user information"
                  : 'Save Changes'
              }
            >
              {isUpdatingUserInfo ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Phone / Email / DOJ / Date of Birth */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <EnhancedInputField
              label="Phone"
              type="tel"
              value={userInfoFormData.phone_no}
              onChange={(val: string) => {
                const cleaned = val.replace(/\D/g, '').slice(0, 10);
                handleUserInfoFormChange('phone_no', cleaned);
                validateUserInfoField('phone_no', cleaned);
              }}
              required
              placeholder="Enter 10-digit phone"
              error={userInfoFormErrors.phone_no}
              maxLength={10}
            />
            <div>
              <EnhancedInputField
                label="Email ID"
                type="email"
                value={userInfoFormData.email}
                onChange={(val: string) => handleEmailChange(val)}
                required
                placeholder="Enter email"
                error={emailValidationError || userInfoFormErrors.email}
              />
              {emailValidating && (
                <div className="mt-1 text-xs text-blue-600 flex items-center gap-1">
                  <div className="animate-spin w-3 h-3 border border-blue-300 border-t-transparent rounded-full"></div>
                  Checking availability...
                </div>
              )}
              {emailIsValid && !emailValidating && (
                <div className="mt-1 text-xs text-green-600 flex items-center gap-1">
                  <span>✓</span>
                  Email is available
                </div>
              )}
            </div>
          </div>

          {/* Date of Birth and Date of Joining */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <EnhancedInputField
              label="Date of Birth"
              type="date"
              value={userInfoFormData.date_of_birth || ''}
              onChange={(val: string) => {
                handleUserInfoFormChange('date_of_birth', val);
                // Clear error when user fills the field
                if (val && val.trim()) {
                  setUserInfoFormErrors(prev => ({ ...prev, date_of_birth: '' }));
                }
              }}
              placeholder="Select date of birth"
              required
              error={userInfoFormErrors.date_of_birth}
            />
            <EnhancedInputField
              label="Date of Joining"
              type="date"
              value={userInfoFormData.date_of_joining || ''}
              onChange={(val: string) => {
                handleUserInfoFormChange('date_of_joining', val);
                // Clear error when user fills the field
                if (val && val.trim()) {
                  setUserInfoFormErrors(prev => ({ ...prev, date_of_joining: '' }));
                }
              }}
              placeholder="Select date of joining"
              required
              error={userInfoFormErrors.date_of_joining}
            />
          </div>

          {/* Department and Location */}
          {/* Role */}
          <div className="grid grid-cols-1 gap-4">
            <SearchDropdown
              label={'Role'}
              value={userInfoFormData.role}
              onChange={(options: any) => {
                const optionsArray = Array.isArray(options)
                  ? options
                  : options
                    ? [options]
                    : [];
                const val = optionsArray.map((opt: any) => opt.label);
                handleUserInfoFormChange('role', val);
                validateUserInfoField('role', val);
              }}
              required
              options={roleDropdownOptions}
              placeholder="Select role(s)"
              isMulti={true}
              loading={roleLoading}
              error={userInfoFormErrors.role}
              showAddButton={true}
              dropdownType="Roles"
              dropdownLabel="Roles"
              isSearchable={true}
              onInputChange={(input) => searchRoles(input)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <SearchDropdown
              label="Department"
              value={userInfoFormData.department}
              onChange={(options: any) => {
                const optionsArray = Array.isArray(options)
                  ? options
                  : options
                    ? [options]
                    : [];
                const val = optionsArray.map((opt: any) => opt.label);
                handleUserInfoFormChange('department', val);
                validateUserInfoField('department', val);
              }}
              required
              options={departmentOptions}
              placeholder="Select department(s)"
              isMulti={true}
              loading={departmentLoading}
              error={userInfoFormErrors.department}
              showAddButton={true}
              dropdownType="Department"
              dropdownLabel="Department"
              isSearchable={true}
              onInputChange={(input) => searchDepartments(input)}
            />
          </div>

          {/* Location Fields - Country, State, City */}
          <div className="space-y-4">

            <div className="grid grid-cols-3 gap-4">
              <CountryStateCity
                type="country"
                label="Country"
                value={userInfoFormData.country}
                onChange={value => {
                  handleUserInfoFormChange('country', value);
                  // Reset state and city when country changes
                  handleUserInfoFormChange('state', '');
                  handleUserInfoFormChange('city', '');
                }}
                placeholder="Select country"
                required={true}
              />
              <CountryStateCity
                type="state"
                label="State"
                value={userInfoFormData.state}
                onChange={value => {
                  handleUserInfoFormChange('state', value);
                  // Reset city when state changes
                  handleUserInfoFormChange('city', '');
                }}
                country={userInfoFormData.country}
                placeholder="Select state"
                required={true}
                disabled={!userInfoFormData.country}
              />
              <CountryStateCity
                type="city"
                label="City"
                value={userInfoFormData.city}
                onChange={value => handleUserInfoFormChange('city', value)}
                country={userInfoFormData.country}
                state={userInfoFormData.state}
                placeholder="Select city"
                required={true}
                disabled={!userInfoFormData.country || !userInfoFormData.state}
              />
            </div>
          </div>

          {/* Reporting To */}
          <div className="grid grid-cols-1 gap-4">
            <SearchDropdown
              label="Reporting To"
              value={userInfoFormData.reporting_to}
              onChange={(options: any) => {
                const optionsArray = Array.isArray(options)
                  ? options
                  : options
                    ? [options]
                    : [];
                // Save full option objects to preserve details (email, etc.) for backend
                handleUserInfoFormChange('reporting_to', optionsArray);
                validateUserInfoField('reporting_to', optionsArray);
              }}
              required
              options={reportingToOptions}
              placeholder="Select manager(s)"
              isMulti={true}
              isSearchable={true}
              onInputChange={(input) => searchReportingUsers(input)}
              loading={reportingToLoading}
              error={userInfoFormErrors.reporting_to}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserDetailPage;
