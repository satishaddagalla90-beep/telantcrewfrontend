import React, { useState, useEffect } from 'react';
import CommonFields, {
  CheckboxField,
  generateDisplayName,
} from '../../molecules/CommonFormFields/CommonFormFields';
import AvatarUpload from '../../molecules/AvatarUpload/AvatarUpload';
import PanFieldWithValidation from '../../molecules/PanFieldWithValidation';
import ContactFieldWithValidation from '../../molecules/ContactFieldWithValidation/ContactFieldWithValidation';
import ErrorMessage from '../../atoms/ErrorMessage/ErrorMessage';
import { getLastCandidateId } from '../../../services/candidateService';
import FileUploadService from '../../../services/fileUploadService';

export interface PersonalDetailsFormProps {
  formData: {
    // Personal Details Only
    candidate_id?: string;
    panNo?: string;
    dob?: string;
    candidatePicture?: File | null;
    candidatePicturePreview?: string;
    candidatePictureUrl?: string | null;
    firstName?: string;
    middleName?: string;
    lastName?: string;
    displayName?: string;
    phone?: string;
    alternatePhone?: string;
    email?: string;
    alternateEmail?: string;
    currentAddress?: string;
    maritalStatus?: string;
    gender?: string;
    permanentAddress?: string;
    current_city?: string;
    permanent_city?: string;
    current_state?: string;
    permanent_state?: string;
    currentPostalCode?: string;
    permanentPostalCode?: string;
    sameAsCurrentAddress?: boolean;

    // Country-State-City fields for current address
    currentCountry?: string;
    currentState?: string;
    currentCity?: string;

    // Country-State-City fields for permanent address
    permanentCountry?: string;
    permanentState?: string;
    permanentCity?: string;

    // Job Link (passed from navigation)
    applied_job_id?: string;
    applied_job_name?: string;
    applied_job_title?: string;
  };
  errors: Record<string, string>;
  onChange: (field: string, value: any) => void;
  loading?: {
    panCheck?: boolean;
    cities?: boolean;
    states?: boolean;
    candidatePicture?: boolean;
    candidateId?: boolean;
  };
  /** Callback when PAN validation state changes */
  onPanValidationChange?: (isValid: boolean, error?: string) => void;
  /** Whether the form should be disabled (e.g., when PAN is invalid) */
  isFormDisabled?: boolean;
  /** Custom candidate picture upload handler */
  onCandidatePictureUpload?: (file: File | null) => void;
  /** Avatar upload state */
  avatarUploadState?: { uploading: boolean; error: string | null };
  /** Callback to handle loading state changes */
  onLoadingChange?: (field: string, isLoading: boolean) => void;
  /** Ref to access candidate ID refresh function for pre-submission */
  candidateIdRefreshRef?: React.MutableRefObject<(() => Promise<void>) | null>;
}

export const PersonalDetailsForm: React.FC<PersonalDetailsFormProps> = ({
  formData,
  errors,
  onChange,
  loading = {},
  onPanValidationChange,
  isFormDisabled = false,
  onCandidatePictureUpload,
  avatarUploadState,
  onLoadingChange,
  candidateIdRefreshRef,
}) => {
  const [isPanValid, setIsPanValid] = useState(false);
  const [candidateIdGenerated, setCandidateIdGenerated] = useState(false);

  // Auto-generate candidate ID on component mount if not already present
  useEffect(() => {
    const generateCandidateId = async () => {
      // Only generate if no candidate ID exists and not already generated
      if (!formData.candidate_id && !candidateIdGenerated) {
        try {
          onLoadingChange?.('candidateId', true);
          const lastId = await getLastCandidateId();
          onChange('candidate_id', lastId);
          setCandidateIdGenerated(true);
        } catch (error) {
          console.error('Failed to fetch candidate ID:', error);
          // Optionally handle error - could show an error message or retry button
        } finally {
          onLoadingChange?.('candidateId', false);
        }
      }
    };

    generateCandidateId();
  }, [formData.candidate_id, candidateIdGenerated, onChange, onLoadingChange]);

  // Handle PAN validation state changes
  const handlePanValidationChange = (isValid: boolean, error?: string) => {
    console.log('PersonalDetailsForm - PAN Validation State:', {
      isValid,
      error,
    }); // Debug log
    setIsPanValid(isValid);
    onPanValidationChange?.(isValid, error);
  };

  // Ensure initial validation state is communicated to parent
  useEffect(() => {
    // If no PAN number or PAN is invalid, notify parent
    if (!formData.panNo) {
      onPanValidationChange?.(false, 'PAN number is required');
    }
  }, [formData.panNo]);

  // Auto-generate display name from first, middle, and last names
  useEffect(() => {
    const displayName = generateDisplayName(
      formData.firstName,
      formData.middleName,
      formData.lastName
    );

    if (displayName && displayName !== formData.displayName) {
      onChange('displayName', displayName);
    }
  }, [
    formData.firstName,
    formData.middleName,
    formData.lastName,
    formData.displayName,
    onChange,
  ]);

  // Sync secure preview when candidatePictureUrl changes (e.g. after upload or from backend)
  useEffect(() => {
    const fetchSecurePreview = async () => {
      const url = formData.candidatePictureUrl;
      const preview = formData.candidatePicturePreview;

      // If we have a URL but preview is missing or is the same as the raw path
      if (url && (!preview || preview === url)) {
        // Only fetch for remote paths (not data URLs or blobs)
        if (typeof url === 'string' && !url.startsWith('data:') && !url.startsWith('blob:')) {
          try {
            const secureUrl = await FileUploadService.getFileViewUrl(url);
            onChange('candidatePicturePreview', secureUrl);
          } catch (error) {
            console.error('Error fetching secure candidate photo URL:', error);
          }
        }
      }
    };

    fetchSecurePreview();
  }, [formData.candidatePictureUrl, formData.candidatePicturePreview, onChange]);

  // Helper function to capitalize names (first letter uppercase, rest lowercase)
  const capitalizeName = (name: string): string => {
    if (!name) return '';
    return name
      .trim()
      .split(' ')
      .map(word => {
        if (!word) return '';
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  };

  // Determine if non-PAN fields should be disabled
  const shouldDisableField = (fieldName: string) => {
    // Don't disable PAN field itself
    if (fieldName === 'panNo') return isFormDisabled;

    // Disable other fields if PAN is not valid or form is explicitly disabled
    return !isPanValid || isFormDisabled;
  };

  // Handle file change for candidate photo
  const handlePhotoChange = (file: File | null) => {
    if (onCandidatePictureUpload) {
      // Use custom upload handler from parent
      onCandidatePictureUpload(file);
    } else {
      // Fallback to default behavior
      if (file) {
        const reader = new FileReader();
        reader.onload = event => {
          onChange('candidatePicturePreview', event.target?.result);
          onChange('candidatePicture', file);
        };
        reader.readAsDataURL(file);
      } else {
        onChange('candidatePicturePreview', '');
        onChange('candidatePicture', null);
      }
    }
  };

  // Handle same as current address checkbox
  const handleSameAsCurrentAddress = (checked: boolean) => {
    onChange('sameAsCurrentAddress', checked);

    if (checked) {
      // Copy current address to permanent address
      onChange('permanentAddress', formData.currentAddress);
      onChange('permanentCountry', formData.currentCountry);
      onChange('permanentState', formData.currentState);
      onChange('permanentCity', formData.currentCity);
      onChange('permanentPostalCode', formData.currentPostalCode);
    } else {
      // Reset permanent address fields when unchecked
      onChange('permanentAddress', '');
      onChange('permanentCountry', '');
      onChange('permanentState', '');
      onChange('permanentCity', '');
      onChange('permanentPostalCode', '');
    }
  };

  // Handle manual candidate ID generation
  const handleGenerateCandidateId = async () => {
    try {
      onLoadingChange?.('candidateId', true);
      const lastId = await getLastCandidateId();
      onChange('candidate_id', lastId);
      setCandidateIdGenerated(true);
    } catch (error) {
      console.error('Failed to fetch candidate ID:', error);
      // You could add error handling here, e.g., show a toast notification
    } finally {
      onLoadingChange?.('candidateId', false);
    }
  };

  // Pre-submit candidate ID refresh - to be called before form submission
  const refreshCandidateIdForSubmission = async (): Promise<void> => {
    try {
      onLoadingChange?.('candidateId', true);
      const lastId = await getLastCandidateId();
      onChange('candidate_id', lastId);
      console.log('Candidate ID refreshed for submission:', lastId);
    } catch (error) {
      console.error('Failed to refresh candidate ID for submission:', error);
      throw error; // Re-throw so parent can handle the error
    } finally {
      onLoadingChange?.('candidateId', false);
    }
  };

  // Register the pre-submit refresh function with parent component
  useEffect(() => {
    if (candidateIdRefreshRef) {
      candidateIdRefreshRef.current = refreshCandidateIdForSubmission;
    }
  }, [candidateIdRefreshRef]);

  return (
    <div className="space-y-6">
      {/* Linked Job Context Banner */}
      {formData.applied_job_name && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md shadow-sm mb-6 animate-fadeIn">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                Adding candidate for Job: <span className="font-bold">{formData.applied_job_name}</span>
                {formData.applied_job_title && (
                  <> - <span className="italic">{formData.applied_job_title}</span></>
                )}
              </p>
            </div>
          </div>
        </div>
      )}


      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Basic Information
        </h3>

        {/* First Row: Applicant ID, PAN No, Date of Birth, Applicant Picture */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Applicant ID with Generate Button */}
          <div className="col-span-1">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Applicant ID
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={formData.candidate_id || ''}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
                  readOnly
                  disabled
                  placeholder="Auto-generated ID"
                />
                <button
                  type="button"
                  onClick={handleGenerateCandidateId}
                  disabled={loading?.candidateId}
                  className="flex items-center justify-center w-10 h-[42px] bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded border"
                  title="Refresh Candidate ID"
                >
                  {loading?.candidateId ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  )}
                </button>
              </div>
              {errors.candidate_id && (
                <ErrorMessage message={errors.candidate_id} variant="error" size="sm" />
              )}
              <p className="mt-1 text-xs text-gray-500">
                Auto-generated unique identifier
              </p>
            </div>
          </div>

          {/* PAN Number with live validation */}
          <PanFieldWithValidation
            value={formData.panNo || ''}
            onChange={(value: string) => onChange('panNo', value)}
            onValidationChange={handlePanValidationChange}
            disabled={isFormDisabled}
          />

          {/* Date of Birth */}
          {CommonFields.dateOfBirth(
            formData.dob || '',
            (value: string) => onChange('dob', value),
            errors.dob
          )}

          {/* Applicant Picture Upload - Using AvatarUpload Component */}
          <div className="col-span-1">
            <AvatarUpload
              label="Applicant Picture"
              value={formData.candidatePicture}
              preview={formData.candidatePicturePreview}
              onChange={handlePhotoChange}
              error={errors.candidatePicture}
              accept=".jpg,.jpeg,.png,.gif"
              maxSize={5}
              size="md"
              fallbackIcon="user"
              disabled={avatarUploadState?.uploading || false}
            />
            {/* Upload Status */}
            {avatarUploadState?.uploading && (
              <div className="mt-2 flex items-center text-sm text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                Uploading image...
              </div>
            )}
            {formData.candidatePictureUrl && !avatarUploadState?.uploading && (
              <div className="mt-2 flex items-center text-sm text-green-600">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  ></path>
                </svg>
                Image uploaded successfully
              </div>
            )}
            {avatarUploadState?.error && (
              <div className="mt-2 flex items-center text-sm text-red-600">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  ></path>
                </svg>
                {avatarUploadState.error}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Second Row: First Name, Middle Name, Last Name, Display Name */}
      <div
        className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative ${(formData.panNo && !isPanValid) ? 'pointer-events-none opacity-50' : ''
          }`}
      >
        {/* First Name */}
        {CommonFields.firstName(
          formData.firstName || '',
          (value: string) => onChange('firstName', capitalizeName(value)),
          errors.firstName
        )}

        {/* Middle Name */}
        {CommonFields.middleName(
          formData.middleName || '',
          (value: string) => onChange('middleName', capitalizeName(value)),
          errors.middleName
        )}

        {/* Last Name */}
        {CommonFields.lastName(
          formData.lastName || '',
          (value: string) => onChange('lastName', capitalizeName(value)),
          errors.lastName
        )}

        {/* Display Name - Auto-generated */}
        {CommonFields.displayName(
          formData.displayName || '',
          (value: string) => onChange('displayName', value),
          errors.displayName
        )}
      </div>

      {/* Third Row: Phone Numbers and Email Addresses */}
      <div
        className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative ${(formData.panNo && !isPanValid) ? 'pointer-events-none opacity-50' : ''
          }`}
      >
        {/* Phone Number */}
        <ContactFieldWithValidation
          value={formData.phone || ''}
          type="phone"
          onChange={(value: string) => onChange('phone', value)}
          onValidationChange={(isValid, error) => {
            // Set or clear internal error flag for validation blocking
            if (!isValid && error) {
              onChange('_phoneError', error);
            } else {
              onChange('_phoneError', null);
            }
          }}
          disabled={isFormDisabled}
        />

        {/* Alternate Phone */}
        {CommonFields.alternatePhone(
          formData.alternatePhone || '',
          (value: string) => onChange('alternatePhone', value),
          errors.alternatePhone
        )}

        {/* Email */}
        <ContactFieldWithValidation
          value={formData.email || ''}
          type="email"
          onChange={(value: string) => onChange('email', value)}
          onValidationChange={(isValid, error) => {
            // Set or clear internal error flag for validation blocking
            if (!isValid && error) {
              onChange('_emailError', error);
            } else {
              onChange('_emailError', null);
            }
          }}
          disabled={isFormDisabled}
        />

        {/* Alternate Email */}
        {CommonFields.alternateEmail(
          formData.alternateEmail || '',
          (value: string) => onChange('alternateEmail', value),
          errors.alternateEmail
        )}
      </div>

      {/* Fourth Row: Gender and Marital Status (Full Width) */}
      <div
        className={`grid grid-cols-1 md:grid-cols-2 gap-6 relative ${(formData.panNo && !isPanValid) ? 'pointer-events-none opacity-50' : ''
          }`}
      >
        {/* Gender */}
        <div className="col-span-1">
          {CommonFields.gender(
            formData.gender || '',
            (value: string) => onChange('gender', value),
            errors.gender
          )}
        </div>

        {/* Marital Status */}
        <div className="col-span-1">
          {CommonFields.maritalStatus(
            formData.maritalStatus || '',
            (value: string) => onChange('maritalStatus', value),
            errors.maritalStatus
          )}
        </div>
      </div>

      {/* Current Address Section */}
      <div
        className={`space-y-4 relative ${(formData.panNo && !isPanValid) ? 'pointer-events-none opacity-50' : ''
          }`}
      >
        <h3 className="text-lg font-semibold text-gray-900">Current Address</h3>

        {/* First Row: Address Field (Full Width) */}
        <div className="grid grid-cols-1 gap-6">
          {/* Current Address */}
          {CommonFields.currentAddress(
            formData.currentAddress || '',
            (value: string) => onChange('currentAddress', value),
            errors.currentAddress
          )}
        </div>

        {/* Second Row: Country + State */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current Country */}
          {CommonFields.currentCountry(
            formData.currentCountry || '',
            (value: string) => onChange('currentCountry', value),
            errors.currentCountry
          )}

          {/* Current State */}
          {CommonFields.currentState(
            formData.currentState || '',
            (value: string) => onChange('currentState', value),
            errors.currentState,
            formData.currentCountry
          )}
        </div>

        {/* Third Row: City + Postal Code */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current City */}
          {CommonFields.currentCity(
            formData.currentCity || '',
            (value: string) => onChange('currentCity', value),
            errors.currentCity,
            formData.currentCountry,
            formData.currentState
          )}

          {/* Current Postal Code */}
          {CommonFields.currentPostalCode(
            formData.currentPostalCode || '',
            (value: string) => onChange('currentPostalCode', value),
            errors.currentPostalCode
          )}
        </div>
      </div>

      {/* Permanent Address Section */}
      <div
        className={`space-y-4 relative ${(formData.panNo && !isPanValid) ? 'pointer-events-none opacity-50' : ''
          }`}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Permanent Address
          </h3>
          <CheckboxField
            label="Same as Current Address"
            id="same-address"
            checked={formData.sameAsCurrentAddress || false}
            onChange={handleSameAsCurrentAddress}
            gridCols=""
            helpText=""
          />
        </div>

        {/* First Row: Address Field (Full Width) */}
        <div className="grid grid-cols-1 gap-6">
          {/* Permanent Address */}
          {CommonFields.permanentAddress(
            formData.permanentAddress || '',
            (value: string) => onChange('permanentAddress', value),
            errors.permanentAddress,
            formData.sameAsCurrentAddress
          )}
        </div>

        {/* Second Row: Country + State */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Permanent Country */}
          {CommonFields.permanentCountry(
            formData.permanentCountry || '',
            (value: string) => onChange('permanentCountry', value),
            errors.permanentCountry,
            formData.sameAsCurrentAddress
          )}

          {/* Permanent State */}
          {CommonFields.permanentState(
            formData.permanentState || '',
            (value: string) => onChange('permanentState', value),
            errors.permanentState,
            formData.permanentCountry,
            formData.sameAsCurrentAddress
          )}
        </div>

        {/* Third Row: City + Postal Code */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Permanent City */}
          {CommonFields.permanentCity(
            formData.permanentCity || '',
            (value: string) => onChange('permanentCity', value),
            errors.permanentCity,
            formData.permanentCountry,
            formData.permanentState,
            formData.sameAsCurrentAddress
          )}

          {/* Permanent Postal Code */}
          {CommonFields.permanentPostalCode(
            formData.permanentPostalCode || '',
            (value: string) => onChange('permanentPostalCode', value),
            errors.permanentPostalCode,
            formData.sameAsCurrentAddress
          )}
        </div>
      </div>
    </div>
  );
};

export default PersonalDetailsForm;
