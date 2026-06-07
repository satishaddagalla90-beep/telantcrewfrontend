import React, { useEffect, useState } from 'react';
import CommonFields, { generateDisplayName } from '../../molecules/CommonFormFields/CommonFormFields';
import SearchDropdown from '../../molecules/SearchDropdown/SearchDropdown';
import AvatarUpload from '../../molecules/AvatarUpload/AvatarUpload';
import FormField from '../../atoms/FormField/FormField';
import CountryStateCity from '../../molecules/CountryStateCity/CountryStateCity';
import { useUserFieldValidation } from '../../../hooks/useUserFieldValidation';
import { UserFormData } from '../../../types/user';
import {
    useDropdownData,
    useLocationsDropdown,
    useUsersDropdown,
    useUserStatusOptions,
    useRolesWithPermissions,
    useRolesDropdownSearchable,
    useDesignationsDropdown,
    useDepartmentsDropdown,
} from '../../../hooks/useDropdowns';

interface UserDetailsStepProps {
    formData: UserFormData;
    onChange: (field: string, value: any) => void;
    errors?: Record<string, string>;
    touched?: Record<string, boolean>;
}

const UserDetailsStep: React.FC<UserDetailsStepProps> = ({
    formData,
    onChange,
    errors = {},
    touched = {},
}) => {
    const { options: designationOptions, loading: designationLoading, error: designationError, search: searchDesignation } = useDesignationsDropdown();
    const { options: departmentOptions, loading: departmentLoading, error: departmentError, search: searchDepartment } = useDepartmentsDropdown();
    const { options: reportingToOptions, loading: reportingToLoading, error: reportingToError, search: searchUsers } = useUsersDropdown();
    const { options: roleOptions, loading: roleLoading, error: roleError, search: searchRole } = useRolesDropdownSearchable();
    const userStatusOptions = useUserStatusOptions();

    useEffect(() => {
        const handleRoleAdded = () => {
            // approximate refresh by searching empty string (resets list)
            searchRole('');
        };

        // Listen for the custom event
        window.addEventListener('roleAdded', handleRoleAdded);

        // Cleanup listener on component unmount
        return () => {
            window.removeEventListener('roleAdded', handleRoleAdded);
        };
    }, [searchRole]);

    useEffect(() => {
        const displayName = generateDisplayName(
            formData.first_name,
            formData.middle_name,
            formData.last_name
        );

        if (displayName && displayName !== formData.display_name) {
            onChange('display_name', displayName);
        }
    }, [formData.first_name, formData.middle_name, formData.last_name, formData.display_name]);

    // Phone number validation state
    const [phoneError, setPhoneError] = useState<string>('');

    // Use hook for username/Employee ID validation
    const {
        isValidating: usernameValidating,
        error: usernameError,
        isValid: usernameIsValid,
        handleChange: handleUsernameChange
    } = useUserFieldValidation({
        value: formData.username || '',
        type: 'username',
        onChange: (value: string) => onChange('username', value),
        onValidationChange: (isValid, error) => {
            // Pass validation errors to parent form
            if (!isValid && error) {
                onChange('_usernameValidationError', error);
            } else {
                onChange('_usernameValidationError', null);
            }
        }
    });

    // Use hook for email validation
    const {
        isValidating: emailValidating,
        error: emailError,
        isValid: emailIsValid,
        handleChange: handleEmailChange
    } = useUserFieldValidation({
        value: formData.email || '',
        type: 'email',
        onChange: (value: string) => onChange('email', value),
        onValidationChange: (isValid, error) => {
            // Pass validation errors to parent form
            if (!isValid && error) {
                onChange('_emailValidationError', error);
            } else {
                onChange('_emailValidationError', null);
            }
        }
    });

    // Real-time phone number validation
    const validatePhoneNumber = (value: string): string => {
        if (!value.trim()) {
            return 'Phone number is required';
        }

        const cleanPhone = value.replace(/\D/g, '');

        // Check if original value contains non-digits
        if (value !== cleanPhone) {
            return 'Phone number must contain only digits';
        }

        if (cleanPhone.length < 10) {
            return 'Phone number must be exactly 10 digits';
        }

        if (cleanPhone.length > 10) {
            return 'Phone number must be exactly 10 digits';
        }

        return '';
    };

    // Handle phone number input with real-time validation
    const handlePhoneChange = (value: string) => {
        // Only allow digits and enforce 10-digit limit
        const cleanValue = value.replace(/\D/g, '').slice(0, 10);

        // Update form data with cleaned value
        onChange('phone_no', cleanValue);

        // Real-time validation
        let error = '';
        if (!cleanValue.trim()) {
            error = 'Phone number is required';
        } else if (/\D/.test(value)) {
            error = 'Phone number must contain only digits';
        } else if (cleanValue.length < 10) {
            error = 'Phone number must be exactly 10 digits';
        }
        // If cleanValue.length === 10, error remains empty (valid)

        setPhoneError(error);
    };

    // Handle avatar file change
    const handleAvatarChange = (file: File | null) => {
        onChange('user_picture', file);
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                onChange('user_picture_preview', event.target?.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            onChange('user_picture_preview', null);
        }
    };
    console.log('Rendering UserDetailsStep', designationOptions);
    return (
        <div className="space-y-6">
            {/* First Row: EmployeeID/UserName, First Name, Middle Name */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="col-span-1">
                    <FormField
                        label="Employee ID"
                        type="text"
                        value={formData.username || ''}
                        onChange={(value: string) => handleUsernameChange(value)}
                        error={usernameError || errors.username}
                        required={true}
                        placeholder="Enter employee ID"
                    />
                    {usernameValidating && (
                        <div className="mt-1 text-xs text-blue-600 flex items-center gap-1">
                            <div className="animate-spin w-3 h-3 border border-blue-300 border-t-transparent rounded-full"></div>
                            Checking availability...
                        </div>
                    )}
                    {usernameIsValid && !usernameValidating && (
                        <div className="mt-1 text-xs text-green-600 flex items-center gap-1">
                            <span>✓</span>
                            Employee ID is available
                        </div>
                    )}
                </div>

                {CommonFields.firstName(
                    formData.first_name || '',
                    (value: string) => onChange('first_name', value),
                    errors.first_name
                )}

                {CommonFields.middleName(
                    formData.middle_name || '',
                    (value: string) => onChange('middle_name', value),
                    errors.middle_name
                )}
            </div>

            {/* Second Row: Last Name, Display Name, Avatar Upload */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {CommonFields.lastName(
                    formData.last_name || '',
                    (value: string) => onChange('last_name', value),
                    errors.last_name
                )}

                {CommonFields.displayName(
                    formData.display_name || '',
                    (value: string) => onChange('display_name', value),
                    errors.display_name
                )}

                <div className="col-span-1">
                    <AvatarUpload
                        label="User Picture"
                        value={formData.user_picture}
                        preview={formData.user_picture_preview || undefined}
                        onChange={handleAvatarChange}
                        error={errors.user_picture}
                        accept=".jpg,.jpeg,.png,.gif"
                        maxSize={5}
                        size="md"
                        fallbackIcon="user"
                    />
                </div>
            </div>

            {/* Third Row: Phone Number, Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                    label="Phone Number"
                    type="tel"
                    value={formData.phone_no || ''}
                    onChange={handlePhoneChange}
                    error={phoneError || errors.phone_no}
                    required={true}
                    placeholder="Enter 10-digit phone number"
                />

                <div className="col-span-1">
                    <FormField
                        label="Email ID"
                        type="email"
                        value={formData.email || ''}
                        onChange={(value: string) => handleEmailChange(value)}
                        error={emailError || errors.email}
                        required={true}
                        placeholder="Enter email address"
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

            {/* Fourth Row: Date of Birth & Date of Joining */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                    label="Date of Birth"
                    type="date"
                    value={formData.date_of_birth || ''}
                    onChange={(value: string) => onChange('date_of_birth', value)}
                    error={errors.date_of_birth}
                    required={true}
                    placeholder="Select date of birth"
                />

                <FormField
                    label="Date of Joining"
                    type="date"
                    value={formData.date_of_joining || ''}
                    onChange={(value: string) => onChange('date_of_joining', value)}
                    error={errors.date_of_joining}
                    required={true}
                    placeholder="Select date of joining"
                />
            </div>

            {/* Location Section */}
            <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-900">Current Location</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <CountryStateCity
                        type="country"
                        label="Country"
                        value={formData.country || ''}
                        onChange={(value) => {
                            onChange('country', value);
                            // Reset state and city when country changes
                            onChange('state', '');
                            onChange('city', '');
                        }}
                        error={errors.country}
                        required={true}
                        placeholder="Select Country"
                    />

                    <CountryStateCity
                        type="state"
                        label="State"
                        value={formData.state || ''}
                        onChange={(value) => {
                            onChange('state', value);
                            // Reset city when state changes
                            onChange('city', '');
                        }}
                        country={formData.country}
                        error={errors.state}
                        required={true}
                        disabled={!formData.country}
                        placeholder="Select State"
                    />

                    <CountryStateCity
                        type="city"
                        label="City"
                        value={formData.city || ''}
                        onChange={(value) => onChange('city', value)}
                        country={formData.country}
                        state={formData.state}
                        error={errors.city}
                        required={true}
                        disabled={!formData.country || !formData.state}
                        placeholder="Select City"
                    />
                </div>
            </div>

            {/* Fourth Row: Designation, Department, Reporting To */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SearchDropdown
                    label="Designation"
                    value={formData.designation || ''}
                    onChange={(option: any) => onChange('designation', option?.value || '')}
                    options={designationOptions}
                    loading={designationLoading}
                    error={designationError || errors.designation}
                    placeholder="Select designation"
                    required={true}
                    showAddButton={true}
                    dropdownType="Designation"
                    dropdownLabel="Designation"
                    isSearchable={true}
                    onInputChange={(input) => searchDesignation(input)}
                />

                <SearchDropdown
                    label="Department"
                    value={formData.department}
                    onChange={(options: any) => {
                        const optionsArray = Array.isArray(options) ? options : options ? [options] : [];
                        onChange('department', optionsArray.map((opt: any) => opt.value));
                    }}
                    options={departmentOptions}
                    loading={departmentLoading}
                    error={departmentError || errors.department}
                    placeholder="Select department"
                    required={true}
                    isMulti={true}
                    showAddButton={true}
                    dropdownType="Department"
                    dropdownLabel="Department"
                    isSearchable={true}
                    onInputChange={(input) => searchDepartment(input)}
                />

                <SearchDropdown
                    label="Reporting To"
                    value={formData.reporting_to}
                    onChange={(options: any) => {
                        const optionsArray = Array.isArray(options) ? options : options ? [options] : [];
                        // Use value (which is Name now) to match UserDetail.tsx behavior
                        onChange('reporting_to', optionsArray.map((opt: any) => opt.value));
                    }}
                    options={reportingToOptions}
                    loading={reportingToLoading}
                    error={reportingToError || errors.reporting_to}
                    placeholder="Type to search for manager"
                    required={true}
                    isMulti={true}
                    isSearchable={true}
                    onInputChange={(input) => searchUsers(input)}
                />
            </div>

            {/* Fifth Row: User Status, Role */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SearchDropdown
                    label="User Status"
                    value={formData.user_status || ''}
                    onChange={(option: any) => onChange('user_status', option?.label || '')}
                    options={userStatusOptions}
                    placeholder="Select user status"
                    required={true}
                    error={errors.user_status}
                />

                <SearchDropdown
                    label="Roles"
                    value={Array.isArray(formData.role) ? formData.role : []}
                    onChange={(options: any) => {
                        const optionsArray = Array.isArray(options) ? options : options ? [options] : [];
                        onChange('role', optionsArray.map((opt: any) => opt.value));
                    }}
                    options={roleOptions}
                    isMulti={true}
                    loading={roleLoading}
                    error={roleError || errors.role}
                    placeholder="Select role"
                    required={true}
                    showAddButton={true}
                    dropdownType="Roles"
                    dropdownLabel="Roles"
                    isSearchable={true}
                    onInputChange={(input) => searchRole(input)}
                />
            </div>
        </div>
    );
};

export default UserDetailsStep;