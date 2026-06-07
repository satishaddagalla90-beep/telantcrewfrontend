import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import FormWizardLayout, {
  FormWizardStep,
} from '../templates/FormWizardLayout/FormWizardLayout';
import PersonalDetailsStep from '../organisms/CandidateSteps/PersonalDetailsStep';
import ProfessionalDetailsStep from '../organisms/CandidateSteps/ProfessionalDetailsStep';
import EducationSkillsStep from '../organisms/CandidateSteps/EducationSkillsStep';
import EmploymentProjectsStep from '../organisms/CandidateSteps/EmploymentProjectsStep';
import DocumentsOthersStep from '../organisms/CandidateSteps/DocumentsOthersStep';
import Icon from '../atoms/Icon/Icon';
import { apiCall, API_ENDPOINTS } from '../../utils/api';
import {
  CandidateFormData,
  CandidateCreateRequest,
  CandidateCreateResponse,
  CandidateDocument,
} from '../../types/candidate';
import FileUploadService from '../../services/fileUploadService';
import { ValidationPatterns } from '../molecules/CommonFormFields/CommonFormFields';
import { useAuth } from '../auth/AuthContext';
import { createDisplayName } from '../../utils';
import { showSuccessToast, showErrorToast } from '../../utils/toast';
import {
  transformSkillForAPI,
  transformEducationForAPI,
  transformEmploymentForAPI,
  transformProjectForAPI,
  transformCertificationForAPI,
  transformDocumentForAPI,
  parseMonthYearToDate,
} from '../../utils/apiDataTransform';
import { parseResume } from '../../utils/resumeParser';

import { dropdownAPI } from '../../utils/api/dropdowns';

// Cache for static dropdown data to avoid repeated API calls
let staticDropdownsCache: any = null;
let staticDropdownsLoading = false;
let staticDropdownsPromise: Promise<any> | null = null;

// Helper function to get static dropdown data with caching
const getStaticDropdowns = async () => {
  // Return cached data if available
  if (staticDropdownsCache) {
    return staticDropdownsCache;
  }

  // If already loading, return the existing promise
  if (staticDropdownsLoading && staticDropdownsPromise) {
    return staticDropdownsPromise;
  }

  // Load the data
  staticDropdownsLoading = true;
  staticDropdownsPromise = dropdownAPI.fetchStaticDropdowns()
    .then(response => {
      staticDropdownsCache = response?.static_dropdowns || {};
      staticDropdownsLoading = false;
      return staticDropdownsCache;
    })
    .catch(error => {
      console.error('Error fetching static dropdowns:', error);
      staticDropdownsLoading = false;
      staticDropdownsPromise = null;
      return {};
    });

  return staticDropdownsPromise;
};

// Helper function to convert ID to name using static dropdown data
const getIdToName = (dropdownData: any[] | undefined, id: string): string => {
  if (!dropdownData || !id) return id; // Return id as fallback

  const item = dropdownData.find(item => item.id === id);
  return item ? item.name : id; // Return name if found, otherwise return id
};

const AddCandidate: React.FC = () => {
  // Auth context for getting current user info
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { jobId, job_id, job_title } = location.state || {};

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // File upload states - clean and simple
  const [uploadStates, setUploadStates] = useState({
    avatar: { uploading: false, error: null as string | null },
    resume: { uploading: false, error: null as string | null },
    documents: { uploading: false, error: null as string | null },
  });

  // 1. AVATAR UPLOAD - Immediate upload when user selects avatar
  const handleAvatarUpload = async (
    file: File | null,
    onChange: (field: string, value: any) => void
  ) => {
    if (!file) {
      // Clear everything when file is removed
      onChange('candidatePicture', null);
      onChange('candidatePicturePreview', null);
      onChange('candidatePictureUrl', null);
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

      // Upload to server immediately
      const uploadResponse =
        await FileUploadService.uploadCandidateAvatar(file);
      console.log('Avatar uploaded successfully:', uploadResponse);

      // Get secure view URL for the preview
      const secureUrl = await FileUploadService.getFileViewUrl(uploadResponse.file_url);

      // Update form with uploaded URL and preview
      onChange('candidatePictureUrl', uploadResponse.file_url);
      onChange('candidatePicturePreview', secureUrl);
      onChange('candidatePicture', file); // Keep file reference for form

      // Clear uploading state
      setUploadStates(prev => ({
        ...prev,
        avatar: { uploading: false, error: null },
      }));

      console.log(
        'Avatar upload completed, URL stored:',
        uploadResponse.file_url
      );
    } catch (error) {
      console.error('Avatar upload failed:', error);
      const errorMsg = error instanceof Error ? error.message : 'Upload failed';

      setUploadStates(prev => ({
        ...prev,
        avatar: { uploading: false, error: errorMsg },
      }));

      // Clear form data on error
      onChange('candidatePicture', null);
      onChange('candidatePicturePreview', null);
      onChange('candidatePictureUrl', null);

      showErrorToast(`Avatar upload failed: ${errorMsg}`);
    }
  };

  // 2. RESUME UPLOAD - Immediate upload when user selects resume
  const handleResumeUpload = async (
    file: File | null,
    onChange: (field: string, value: any) => void
  ) => {
    console.log('=== Resume Upload Started ===');

    if (!file) {
      // Clear everything when file is removed
      onChange('resume', null);
      onChange('resumeUrl', null);
      setUploadStates(prev => ({
        ...prev,
        resume: { uploading: false, error: null },
      }));
      return;
    }

    // Set uploading state
    setUploadStates(prev => ({
      ...prev,
      resume: { uploading: true, error: null },
    }));

    try {
      // Validate file
      const validation = FileUploadService.validateFile(file, {
        maxSize: 10,
        allowedTypes: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
      });

      if (!validation.valid) {
        throw new Error(validation.error || 'Invalid resume file');
      }

      // Upload to server immediately
      const uploadResponse = await FileUploadService.uploadResume(file);
      console.log('Resume uploaded successfully:', uploadResponse);

      // Update form with uploaded URL
      onChange('resumeUrl', uploadResponse.file_url);
      onChange('resume', file); // Keep file reference for form

      // Clear uploading state
      setUploadStates(prev => ({
        ...prev,
        resume: { uploading: false, error: null },
      }));

      console.log(
        'Resume upload completed, URL stored:',
        uploadResponse.file_url
      );
    } catch (error) {
      console.error('Resume upload failed:', error);
      const errorMsg = error instanceof Error ? error.message : 'Upload failed';

      setUploadStates(prev => ({
        ...prev,
        resume: { uploading: false, error: errorMsg },
      }));

      // Clear form data on error
      onChange('resume', null);
      onChange('resumeUrl', null);

      showErrorToast(`Resume upload failed: ${errorMsg}`);
    }
  };

  // 3. DOCUMENT UPLOAD - Immediate upload and add to documents array
  const handleDocumentUpload = async (
    files: File[],
    documentInfo: {
      document_name: string;
      document_number: string;
      document_date: string;
      expiry_date: string;
    },
    onChange: (field: string, value: any) => void,
    currentDocuments: CandidateDocument[]
  ) => {
    console.log('=== Document Upload Started ===');
    console.log('Files to upload:', files);
    console.log('Document info:', documentInfo);
    console.log('Current documents array:', currentDocuments);

    if (!files || files.length === 0) return;

    // Set uploading state
    setUploadStates(prev => ({
      ...prev,
      documents: { uploading: true, error: null },
    }));

    try {
      // Upload documents to server immediately with metadata
      const uploadResponses = await FileUploadService.uploadCandidateDocuments(
        files,
        documentInfo
      );
      console.log('Documents uploaded successfully:', uploadResponses);

      // Create document objects for each uploaded file
      const newDocuments: CandidateDocument[] = uploadResponses.map(
        (response, index) => ({
          id: `doc_${Date.now()}_${index}`,
          document_name: documentInfo.document_name,
          document_number: documentInfo.document_number,
          document_date: documentInfo.document_date,
          expiry_date: documentInfo.expiry_date,
          document_url: response.file_url,
        })
      );

      console.log('New documents created:', newDocuments);

      // Add to existing documents array
      const updatedDocuments = [...currentDocuments, ...newDocuments];
      console.log('Updated documents array:', updatedDocuments);

      onChange('documents', updatedDocuments);

      // Clear uploading state
      setUploadStates(prev => ({
        ...prev,
        documents: { uploading: false, error: null },
      }));

      console.log('Document upload completed successfully');
    } catch (error) {
      console.error('Document upload failed:', error);
      const errorMsg = error instanceof Error ? error.message : 'Upload failed';

      setUploadStates(prev => ({
        ...prev,
        documents: { uploading: false, error: errorMsg },
      }));

      showErrorToast(`Document upload failed: ${errorMsg}`);
    }
  };

  // 4. RESUME PARSE - Parse uploaded resume and auto-populate form fields
  const handleResumeParseAndPopulate = async (
    file: File,
    onChange: (field: string, value: any) => void,
    parseOnlyTextCV: boolean = false
  ) => {
    console.log('=== Resume Parse Started ===');

    // Set uploading state for resume
    setUploadStates(prev => ({
      ...prev,
      resume: { uploading: true, error: null },
    }));

    try {
      // First, upload the resume file to server
      const uploadResponse = await FileUploadService.uploadResume(file);
      console.log('Resume uploaded successfully:', uploadResponse);

      // Set resume file and URL in form
      onChange('resume', file);
      onChange('resumeUrl', uploadResponse.file_url);

      // Parse the resume
      const parsedData = await parseResume(file);
      console.log('Resume parsed successfully:', parsedData);

      if (parsedData?.textCV) {
        onChange('textCV', parsedData.textCV);
      }

      if (parseOnlyTextCV) {
        setUploadStates(prev => ({
          ...prev,
          resume: { uploading: false, error: null },
        }));
        // showSuccessToast('Resume uploaded and parsed successfully!');
        return;
      }

      // Auto-populate personal details (with null checks if parseOnlyTextCV not true)
      if (parsedData?.firstName) onChange('firstName', parsedData.firstName);
      if (parsedData?.middleName) onChange('middleName', parsedData.middleName);
      if (parsedData?.lastName) onChange('lastName', parsedData.lastName);
      if (parsedData?.email) onChange('email', parsedData.email);
      if (parsedData?.phone) onChange('phone', parsedData.phone);
      if (parsedData?.location) onChange('location', parsedData.location);
      if (parsedData?.linkedin_profile)
        onChange('linkedin_profile', parsedData.linkedin_profile);
      if (parsedData?.github_profile)
        onChange('github_profile', parsedData.github_profile);
      if (parsedData?.profile_summary)
        onChange('profile_summary', parsedData.profile_summary);

      // Auto-populate skills - First 5 as primarySkills, rest as additionalSkills (both comma-separated)
      // skillMetrics is left for manual entry by user
      if (parsedData?.skills && Array.isArray(parsedData.skills) && parsedData.skills.length > 0) {
        // Filter out any null/undefined skills first
        const validSkills = parsedData.skills.filter(
          (s): s is { skill: string; rating: number } =>
            s != null && typeof s.skill === 'string' && s.skill.trim() !== ''
        );

        if (validSkills.length > 0) {
          // Take first 5 skills as primary skills (comma-separated string)
          const primarySkillsArray = validSkills
            .slice(0, Math.min(5, validSkills.length))
            .map(s => s.skill)
            .filter(Boolean);

          if (primarySkillsArray.length > 0) {
            const primarySkillsString = primarySkillsArray.join(', ');
            onChange('primarySkills', primarySkillsString);
          }

          // Rest of the skills go to additional skills (comma-separated)
          if (validSkills.length > 5) {
            const additionalSkillsArray = validSkills
              .slice(5)
              .map(s => s.skill)
              .filter(Boolean); // Remove any empty strings
            if (additionalSkillsArray.length > 0) {
              const additionalSkillsString = additionalSkillsArray.join(', ');
              onChange('additionalSkills', additionalSkillsString);
            }
          }
        }
      }


      // Auto-populate work experience
      if (parsedData?.workExperience && Array.isArray(parsedData.workExperience) && parsedData.workExperience.length > 0) {
        // Filter out null entries first
        const validWorkExperience = parsedData.workExperience.filter(
          work => work != null
        );

        if (validWorkExperience.length > 0) {
          // Process work entries - try to extract company from descriptions if missing
          const processedWorkExperience = validWorkExperience.map(work => {
            let company = work?.company || '';
            let jobTitle = work?.jobTitle || '';
            let descriptions = [...(work?.descriptions || [])];

            // If company is empty but we have descriptions, check if last description contains job title
            // Pattern: "Co-Founder & Software Engineer" at end of descriptions
            if (!company && descriptions.length > 0) {
              const lastDesc = descriptions[descriptions.length - 1] || '';
              // Check if last line looks like a job title (contains common title words)
              const titlePattern = /^(Co-Founder|Founder|CEO|CTO|CFO|COO|VP|Director|Manager|Lead|Senior|Junior|Staff|Principal)?\s*[&,]?\s*(Software|Full[\s-]?Stack|Frontend|Backend|DevOps|Data|ML|AI|Product|Project|Engineering|Technical)?\s*(Engineer|Developer|Architect|Manager|Designer|Analyst|Consultant|Specialist|Intern)?$/i;
              if (titlePattern.test(lastDesc.trim())) {
                // This looks like a job title, use it if we don't have one
                if (!jobTitle) {
                  jobTitle = lastDesc.trim();
                }
                // Remove from descriptions
                descriptions = descriptions.slice(0, -1);
              }
            }

            // If still no company, try to find it in descriptions or use a placeholder
            // Some resumes put company name in the first description line
            if (!company && descriptions.length > 0) {
              const firstDesc = descriptions[0] || '';
              // Check if first description looks like a company name (short, no verbs)
              if (firstDesc.length < 50 && !/^(led|built|developed|designed|created|implemented|managed)/i.test(firstDesc)) {
                // Could be company name, but don't assume - leave empty for user to fill
              }
            }

            return {
              company,
              jobTitle,
              date: work?.date || '',
              descriptions,
            };
          });

          // Now create employment entries - allow entries with jobTitle OR date (company can be filled by user)
          const employment = processedWorkExperience
            .filter(work => work?.jobTitle || work?.date) // Keep if has job title OR date
            .map((work, index) => {
              // Parse date range: "Jul 2021 - Present" or "Jan 2020 - Dec 2021"
              let fromDate = '';
              let toDate = '';
              let isCurrentJob = false;

              if (work?.date) {
                // Handle various date separators: " - ", " – ", " to "
                const dateParts = work.date.split(/\s*[-–]\s*|\s+to\s+/i).map(d => d?.trim() || '');
                const rawFromDate = dateParts[0] || '';
                // Convert to YYYY-MM-DD format
                fromDate = parseMonthYearToDate(rawFromDate);

                if (dateParts.length > 1) {
                  const endPart = dateParts[1] || '';
                  // Check if it's "Present" or "Current"
                  if (
                    endPart.toLowerCase() === 'present' ||
                    endPart.toLowerCase() === 'current'
                  ) {
                    isCurrentJob = true;
                    toDate = '';
                  } else {
                    // Convert to YYYY-MM-DD format
                    toDate = parseMonthYearToDate(endPart);
                    isCurrentJob = false;
                  }
                }
              }

              return {
                id: `emp_${Date.now()}_${index}`,
                organizationName: work?.company || '', // Can be empty, user will fill
                jobType: '', // Will be filled by user
                payrollOrganization: '',
                designation: work?.jobTitle || '',
                location: '',
                fromDate,
                toDate,
                isCurrentJob,
                description: (work?.descriptions || []).filter(Boolean).join('\n'),
              };
            });

          if (employment.length > 0) {
            onChange('employmentHistory', employment);
          }
        }
      }

      // Clear uploading state
      setUploadStates(prev => ({
        ...prev,
        resume: { uploading: false, error: null },
      }));

      showSuccessToast('Resume parsed successfully! Form fields have been auto-populated.');
      console.log('Resume parse and populate completed');
    } catch (error) {
      console.error('Resume parse failed:', error);
      const errorMsg =
        error instanceof Error ? error.message : 'Resume parsing failed';

      setUploadStates(prev => ({
        ...prev,
        resume: { uploading: false, error: errorMsg },
      }));

      // Clear form data on error
      onChange('resume', null);
      onChange('resumeUrl', null);

      showErrorToast(`Failed to parse resume: ${errorMsg}`);
    }
  };

  // Define form steps using FormWizardLayout
  const steps: FormWizardStep[] = [
    {
      id: 'personal-details',
      label: 'Personal Details',
      icon: <Icon name="user" />,
      description: 'Basic information and contact details',
      component: PersonalDetailsStep,
      validation: formData => {
        const errors: Record<string, string> = {};

        // Basic required fields
        if (!formData.firstName?.trim())
          errors.firstName = 'First name is required';
        if (!formData.lastName?.trim())
          errors.lastName = 'Last name is required';
        if (!formData.email?.trim()) errors.email = 'Email is required';
        if (!formData.phone?.trim()) errors.phone = 'Phone number is required';
        if (!formData.dob) errors.dob = 'Date of birth is required';
        if (!formData.panNo?.trim()) errors.panNo = 'PAN number is required';

        // Gender and marital status
        if (!formData.gender?.trim()) errors.gender = 'Gender is required';
        if (!formData.maritalStatus?.trim())
          errors.maritalStatus = 'Marital status is required';

        // Address required fields
        // if (!formData.currentCountry?.trim())
        //   errors.currentCountry = 'Current country is required';
        // if (!formData.currentAddress?.trim())
        //   errors.currentAddress = 'Current address is required';
        // if (!formData.currentState?.trim())
        //   errors.currentState = 'Current state is required';
        // if (!formData.currentCity?.trim())
        //   errors.currentCity = 'Current city is required';
        // if (!formData.currentPostalCode?.trim())
        //   errors.currentPostalCode = 'Current postal code is required';

        // Additional validations
        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
          errors.email = 'Please enter a valid email address';
        }
        if (formData.phone && formData.phone.replace(/\D/g, '').length !== 10) {
          errors.phone = 'Phone number must be exactly 10 digits';
        }
        if (formData.panNo && formData.panNo.length !== 10) {
          errors.panNo = 'PAN number must be exactly 10 characters';
        }

        // Duplicate checks (blocking)
        if (formData._phoneError) {
          errors.phone = formData._phoneError;
        }
        if (formData._emailError) {
          errors.email = formData._emailError;
        }

        // Permanent Address required fields
        // if (!formData.permanentAddress?.trim())
        //   errors.permanentAddress = 'Permanent address is required';
        // if (!formData.permanentCountry?.trim())
        //   errors.permanentCountry = 'Permanent country is required';
        // if (!formData.permanentState?.trim())
        //   errors.permanentState = 'Permanent state is required';
        // if (!formData.permanentCity?.trim())
        //   errors.permanentCity = 'Permanent city is required';
        // if (!formData.permanentPostalCode?.trim())
        //   errors.permanentPostalCode = 'Permanent postal code is required';

        return Object.keys(errors).length > 0 ? errors : null;
      },
    },
    {
      id: 'professional-details',
      label: 'Professional Details',
      icon: <Icon name="briefcase" />,
      description: 'Experience and career information',
      component: ProfessionalDetailsStep,
      validation: formData => {
        const errors: Record<string, string> = {};

        // Required fields
        if (!formData.total_experience?.trim())
          errors.total_experience = 'Total experience is required';
        if (!formData.relevantExperience?.trim())
          errors.relevantExperience = 'Relevant experience is required';
        if (!formData.current_ctc?.trim())
          errors.current_ctc = 'Current CTC is required';
        if (!formData.expected_ctc?.trim())
          errors.expected_ctc = 'Expected CTC is required';
        if (!formData.location?.trim())
          errors.location = 'Current location is required';
        if (
          !formData.preffered_location ||
          (Array.isArray(formData.preffered_location) &&
            formData.preffered_location.length === 0)
        )
          errors.preffered_location = 'Preferred location is required';
        if (!formData.notice_period?.trim())
          errors.notice_period = 'Notice period is required';

        // Preferred job - handle array
        if (!formData.preferred_job || (Array.isArray(formData.preferred_job) && formData.preferred_job.length === 0) || (typeof formData.preferred_job === 'string' && !formData.preferred_job.trim()))
          errors.preferred_job = 'Preferred job is required';

        // Job open type - handle array
        if (!formData.job_open_type || (Array.isArray(formData.job_open_type) && formData.job_open_type.length === 0) || (typeof formData.job_open_type === 'string' && !formData.job_open_type.trim()))
          errors.job_open_type = 'Job open type is required';

        // Shifts - handle array
        if (!formData.shift || (Array.isArray(formData.shift) && formData.shift.length === 0) || (typeof formData.shift === 'string' && !formData.shift.trim()))
          errors.shift = 'Shifts is required';
        // Resume and profile summary
        if (!formData.resume && !formData.resumeUrl) errors.resume = 'Resume upload is required';
        if (!formData.profile_summary?.trim())
          errors.profile_summary = 'Profile summary is required';

        // Experience validations using ValidationPatterns
        if (formData.total_experience) {
          const totalExpError = ValidationPatterns.totalExperience(
            formData.total_experience
          );
          if (totalExpError) {
            errors.total_experience = totalExpError;
          }
        }
        if (formData.relevantExperience) {
          const relevantExpError = ValidationPatterns.relevantExperience(
            formData.relevantExperience,
            formData.total_experience
          );
          if (relevantExpError) {
            errors.relevantExperience = relevantExpError;
          }
        }
        if (formData.current_ctc && isNaN(parseFloat(formData.current_ctc))) {
          errors.current_ctc = 'Current CTC must be a valid number';
        }
        if (formData.expected_ctc && isNaN(parseFloat(formData.expected_ctc))) {
          errors.expected_ctc = 'Expected CTC must be a valid number';
        }

        // LinkedIn profile validation
        if (formData.linkedin_profile) {
          const linkedinRegex = /^https?:\/\/(www\.)?linkedin\.com\/.*$/;
          if (!linkedinRegex.test(formData.linkedin_profile)) {
            errors.linkedin_profile = 'Please enter a valid LinkedIn profile URL';
          }
        }

        return Object.keys(errors).length > 0 ? errors : null;
      },
    },
    {
      id: 'education-skills',
      label: 'Education & Skills',
      icon: <Icon name="book" />,
      description: 'Educational background and technical skills',
      component: EducationSkillsStep,
      validation: formData => {
        const errors: Record<string, string> = {};
        // if (!formData.skillCategory || (typeof formData.skillCategory === 'string' && !formData.skillCategory.trim())) {
        //   errors.skillCategory = 'Skill Category is required';
        // }
        if (!formData.primarySkills || !formData.primarySkills.trim()) {
          errors.primarySkills = 'At least one Primary Skill is required';
        }
        return Object.keys(errors).length > 0 ? errors : null;
      },
    },
    {
      id: 'employment-projects',
      label: 'Employment & Projects',
      icon: <Icon name="buildings" />,
      description: 'Work experience and key projects',
      component: EmploymentProjectsStep,
      isOptional: true,
    },
    {
      id: 'documents-others',
      label: 'Documents & Others',
      icon: <Icon name="file-text" />,
      description: 'Document uploads and additional information',
      component: DocumentsOthersStep,
      isOptional: true,
    },
  ];

  // Initial form data - matching API structure
  const initialData: CandidateFormData = {
    // Personal Details
    candidate_id: '',
    panNo: '',
    dob: '',
    candidatePicture: null,
    candidatePicturePreview: '',
    candidatePictureUrl: null, // Store uploaded URL
    firstName: '',
    middleName: '',
    lastName: '',
    displayName: '',
    phone: '',
    alternatePhone: null,
    email: '',
    alternateEmail: null,
    gender: '',
    applied_job_id: jobId || '',
    applied_job_name: job_id || '',
    applied_job_title: job_title || '',
    maritalStatus: '',
    currentAddress: '',
    currentCountry: '',
    currentState: '',
    currentCity: '',
    permanentAddress: '',
    permanentCountry: '',
    permanentState: '',
    permanentCity: '',
    currentPostalCode: '',
    permanentPostalCode: '',
    sameAsCurrentAddress: false,

    // Professional Details
    total_experience: '',
    relevantExperience: '',
    current_ctc: '',
    expected_ctc: '',
    location: '',
    preffered_location: [],
    notice_period: '',
    preferred_job: '', // Field for "Preferred Job" dropdown
    job_preference: '', // Field for "Job Preference" dropdown
    job_open_type: '',
    job_type: '',
    shift: '',
    career_break: '',
    career_break_type: '',
    duration: [],
    differently_abled: '',
    differently_abled_type: '',
    linkedin_profile: '',
    resume: null,
    resumeUrl: null, // Store uploaded URL
    profile_summary: '',
    textCV: '', // Full parsed resume text

    // Education & Skills (from other steps)
    educationHistory: [],
    skillMetrics: [],
    primarySkills: '',
    skillCategory: '',
    additionalSkills: '',

    // Employment & Projects (from other steps)
    employmentHistory: [],
    projectHistory: [],
    certifications: [],
    // Documents & Others (from other steps)
    documents: [],
    source_details: {
      source_type: '',
      source_name: '',
      flags: ['Blue'], // Set Blue as default flag
      is_actively_looking: false,
      comments: '',
    },
  };

  // Transform form data to API format (files already uploaded)
  const transformFormDataToAPI = async (
    formData: CandidateFormData
  ): Promise<CandidateCreateRequest> => {
    // Helper function to extract value from dropdown objects
    const extractValue = (field: any): string => {
      if (!field) return '';
      if (typeof field === 'string') return field;
      if (field && typeof field === 'object' && 'value' in field) {
        return String(field.value);
      }
      return String(field);
    };

    // Helper function to extract name from dropdown objects (for specific fields)
    const extractName = (field: any): string => {
      if (!field) return '';
      if (typeof field === 'string') return field;
      if (field && typeof field === 'object') {
        // Check for label property (standard DropdownOption)
        if ('label' in field) return String(field.label);
        // Fallback to name property if exists
        if ('name' in field) return String(field.name);
      }
      return String(field);
    };

    // Helper function to extract array values from dropdown objects
    const extractArrayValues = (field: any): string[] => {
      if (!field) return [];
      if (Array.isArray(field)) {
        return field.map(item => extractValue(item));
      }
      return [extractValue(field)];
    };

    // Helper function to extract array names from dropdown objects
    const extractArrayNames = (field: any): string[] => {
      if (!field) return [];
      if (Array.isArray(field)) {
        return field.map(item => extractName(item));
      }
      return [extractName(field)];
    };

    // Helper function to extract location names from preferred_location array
    const extractPreferredLocationNames = (field: any): string => {
      if (!field) return '';

      // Handle array of objects (new format)
      if (Array.isArray(field) && field.length > 0) {
        return field.map(item => item.label || item.value || item).join(', ');
      }

      // Handle legacy string format
      if (typeof field === 'string') return field;

      return '';
    };

    // Generate display name for created_by field
    const createdByDisplayName = user
      ? createDisplayName(user.first_name, user.middle_name, user.last_name)
      : 'Unknown User';

    // Use pre-uploaded URLs from form data
    const candidatePictureUrl = formData.candidatePictureUrl;
    const resumeUrl = formData.resumeUrl;

    // Fetch static dropdown data for ID to name conversion
    const staticDropdowns = await getStaticDropdowns();

    const result = {
      candidate_id: formData.candidate_id || '',
      pan_number: formData.panNo || '',
      date_of_birth: formData.dob || '', // Date should be in YYYY-MM-DD format
      candidate_picture: candidatePictureUrl,
      first_name: formData.firstName || '',
      middle_name: formData.middleName || '',
      last_name: formData.lastName || '',
      display_name: formData.displayName || '',
      phone: formData.phone ? parseInt(formData.phone, 10) : null,
      alt_phone: formData.alternatePhone ? parseInt(formData.alternatePhone, 10) : null,
      email: formData.email || '',
      alt_email: formData.alternateEmail ?? null,
      // Convert IDs to names using static dropdown data
      gender: getIdToName(staticDropdowns.Gender, formData.gender),
      marital_status: getIdToName(staticDropdowns.Marital, formData.maritalStatus),
      current_address: formData.currentAddress || '',
      current_country: formData.currentCountry || '',
      current_state: formData.currentState || '',
      current_city: formData.currentCity || '',
      postal_code: formData.currentPostalCode || '',
      total_experience: formData.total_experience ? parseFloat(formData.total_experience) : 0,
      relevant_experience: formData.relevantExperience ? parseFloat(formData.relevantExperience) : 0,
      current_ctc: formData.current_ctc ? parseFloat(formData.current_ctc) : 0,
      expected_ctc: formData.expected_ctc ? parseFloat(formData.expected_ctc) : 0,
      current_location: formData.location || '',
      preferred_location: extractPreferredLocationNames(
        formData.preffered_location
      ),
      notice_period: extractName(formData.notice_period),
      preferred_job: extractArrayNames(formData.preferred_job), // "Preferred Job" field → preferred_job
      job_preference: extractArrayNames(formData.job_preference), // "Job Preference" field → job_preference
      job_open_type: extractArrayNames(formData.job_open_type),
      job_type: extractName(formData.job_type || ''),
      shifts: extractArrayNames(formData.shift),
      career_break: formData.career_break === 'Yes',
      career_break_type: extractName(formData.career_break_type || ''),
      duration: Array.isArray(formData.duration)
        ? formData.duration.map(d => ({
          from_date: d.from_date || null,
          to_date: d.to_date || null,
        }))
        : [],
      differently_abled: formData.differently_abled === 'Yes',
      disability_type: extractName(formData.differently_abled_type || ''),
      linkedin_profile:
        formData.linkedin_profile && formData.linkedin_profile.trim()
          ? formData.linkedin_profile
          : '',
      resume_url: resumeUrl,
      profile_summary: formData.profile_summary || '',
      text_cv: formData.textCV || '',
      education: (formData.educationHistory || []).map(
        transformEducationForAPI
      ),
      skills: (formData.skillMetrics || []).map(transformSkillForAPI),
      primary_skill: formData.primarySkills
        ? formData.primarySkills.split(',').map(s => s.trim()).filter(Boolean)
        : [],
      skill_category: (() => {
        const categoriesMap = new Map<string, { id: string; name: string }>();
        (formData.skillMetrics || []).forEach((s: any) => {
          if (!s.skillCategory) return;
          const name = typeof s.skillCategory === 'object' ? s.skillCategory.label || s.skillCategory.name : s.skillCategory;
          const id = typeof s.skillCategory === 'object' ? s.skillCategory.value || s.skillCategory.id : '';
          if (name && !categoriesMap.has(name)) {
            categoriesMap.set(name, { id: id || '', name });
          }
        });
        return Array.from(categoriesMap.values());
      })(),
      additional_skill: formData.additionalSkills || '',
      employment: (formData.employmentHistory || []).map(
        transformEmploymentForAPI
      ),
      projects: (formData.projectHistory || []).map(transformProjectForAPI),
      certifications: (formData.certifications || []).map(
        transformCertificationForAPI
      ),
      documents: (formData.documents || []).map(transformDocumentForAPI),
      source_details: {
        source_type: getIdToName(staticDropdowns.Source_Type, formData.source_details?.source_type || ''),
        source_name: extractName(formData.source_details?.source_name || ''),
        flags: Array.isArray(formData.source_details?.flags)
          ? formData.source_details.flags.map(flag => extractName(flag))
          : [],
        is_actively_looking: formData.source_details?.is_actively_looking || false,
        comments: formData.source_details?.comments || '',
      },
      job_id: formData.applied_job_name || formData.applied_job_id || undefined,
      // applied_job_name: formData.applied_job_name || undefined,
      created_by: createdByDisplayName,
    };

    return result;
  };

  // Helper function to parse validation errors from backend
  const parseValidationErrors = (errorData: any): string => {
    if (!errorData) return 'Unknown validation error';

    try {
      // Handle case where errorData is already an array
      const errors = Array.isArray(errorData)
        ? errorData
        : errorData.detail || errorData.errors || [];

      if (!Array.isArray(errors) || errors.length === 0) {
        return 'Validation failed - please check your input';
      }

      const errorMessages: string[] = [];

      errors.forEach((error: any) => {
        if (error.loc && error.msg) {
          const field = error.loc.join('.');
          const message = error.msg;

          // Convert technical field names to user-friendly names
          let friendlyField = field;
          if (field.includes('education') && field.includes('subject')) {
            friendlyField = 'Education Subject';
          } else if (
            field.includes('skills') &&
            field.includes('additional_skill')
          ) {
            friendlyField = 'Skills Additional Information';
          } else if (field.includes('employment')) {
            friendlyField = 'Employment Information';
          } else if (field.includes('documents')) {
            friendlyField = 'Document Information';
          }

          errorMessages.push(`${friendlyField}: ${message}`);
        } else if (error.msg) {
          errorMessages.push(error.msg);
        }
      });

      return errorMessages.length > 0
        ? `Please fix the following issues:\n\n${errorMessages.join('\n')}`
        : 'Validation failed - please check your input';
    } catch (e) {
      console.error('Error parsing validation errors:', e);
      return 'Validation failed - please check your input and try again';
    }
  };

  // Handle form completion
  const handleComplete = async (candidateData: CandidateFormData) => {
    console.log('=== FORM SUBMISSION DEBUG ===');
    setIsSubmitting(true);

    try {
      // STEP 1: Fetch fresh candidate ID from API to ensure we have the latest
      console.log('Fetching fresh candidate ID...');
      let freshCandidateId: string;
      try {
        const { getLastCandidateId } = await import('../../services/candidateService');
        freshCandidateId = await getLastCandidateId();
        console.log('Fresh candidate ID fetched:', freshCandidateId);
      } catch (idError) {
        console.error('Failed to fetch fresh candidate ID:', idError);
        showErrorToast('Failed to generate candidate ID. Please try again.');
        throw idError; // Propagate so FormWizardLayout re-enables navigation blocker
      }

      // Update candidateData with fresh ID
      const updatedCandidateData = {
        ...candidateData,
        candidate_id: freshCandidateId,
      };

      console.log(
        'Candidate form completed:',
        await transformFormDataToAPI(updatedCandidateData)
      );
      console.log(
        'Documents content:',
        JSON.stringify(updatedCandidateData.documents, null, 2)
      );

      // STEP 2: Transform form data to API format (files already uploaded)
      const apiPayload = await transformFormDataToAPI(updatedCandidateData);

      // Clean up payload - remove empty URLs that cause validation errors
      if (
        !apiPayload.linkedin_profile ||
        apiPayload.linkedin_profile.trim() === ''
      ) {
        delete (apiPayload as any).linkedin_profile;
      }

      console.log('API Payload:', apiPayload);

      // Make API call to create candidate
      const response = await apiCall<CandidateCreateResponse>(
        API_ENDPOINTS.CANDIDATES.CREATE,
        {
          method: 'POST',
          body: apiPayload as any, // NetWrapper will handle JSON.stringify for objects
        }
      );

      if (response.error) {
        console.error('API Error Details:', response.error);

        // Check if it's a detail-style error (FastAPI format: {"detail": "..."})
        const detailMessage = response.error.data?.detail;
        if (detailMessage && typeof detailMessage === 'string') {
          showErrorToast(detailMessage);
          const err: any = new Error(detailMessage);
          err._toastShown = true;
          throw err;
        }

        // Check if it's a validation error (status 422)
        if (
          response.error.status === 422 ||
          response.error.message?.includes('validation')
        ) {
          const validationMessage = parseValidationErrors(response.error.data);
          showErrorToast(validationMessage);
          const err: any = new Error(validationMessage);
          err._toastShown = true;
          throw err;
        }

        throw new Error(response.error.message || 'Failed to create candidate');
      }

      console.log('Candidate created successfully:', response.data);

      // Clear any draft data on successful submission
      localStorage.removeItem('candidate_draft');

      showSuccessToast('Candidate created successfully!');

      // Navigate conditionally - if created from a job, go to recruitment, otherwise go to applicants
      const targetPath = (jobId || job_id) ? '/requirements' : '/applicants';
      navigate(targetPath, { replace: true });
    } catch (error: any) {
      console.error('Error creating candidate:', error);

      // Skip toast if error was already shown (thrown from API error handlers above)
      if (!error?._toastShown) {
        // Handle specific datetime serialization error
        if (
          error instanceof Error &&
          error.message.includes('cannot encode object') &&
          error.message.includes('datetime')
        ) {
          showErrorToast(
            'Failed to create candidate: There was an issue with date formatting. Please contact support.'
          );
        } else if (
          error instanceof Error &&
          (error.message.includes('validation') ||
            error.message.includes('Input should be'))
        ) {
          showErrorToast(`Validation Error: ${error.message}`);
        } else {
          showErrorToast(
            `Failed to create candidate: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }
      // Re-throw so FormWizardLayout knows submission failed and re-enables navigation blocker
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle draft saving
  const handleSaveAsDraft = async (draftData: CandidateFormData) => {
    try {
      // Save draft to localStorage
      localStorage.setItem('candidate_draft', JSON.stringify(draftData));
      showSuccessToast('Candidate data saved as draft!');
    } catch (error) {
      console.error('Error saving draft:', error);
      showErrorToast('Failed to save draft. Please try again.');
    }
  };

  // Handle form cancellation
  const handleCancel = () => {
    navigate('/applicants');
  };

  // Check for existing draft
  const existingDraft = (() => {
    try {
      const draft = localStorage.getItem('candidate_draft');
      return draft ? JSON.parse(draft) : null;
    } catch {
      return null;
    }
  })();

  return (
    <FormWizardLayout
      title="Applicant Registration"
      subtitle=""
      steps={steps}
      initialData={existingDraft || initialData}
      onComplete={handleComplete}
      onCancel={handleCancel}
      onSaveAsDraft={handleSaveAsDraft}
      allowStepNavigation={true}
      showSaveAsDraft={true}
      showResetButton={true}
      stepProps={{
        'personal-details': {
          onFileUpload: {
            candidatePicture: handleAvatarUpload,
          },
          avatarUploadState: uploadStates.avatar,
        },
        'professional-details': {
          onResumeParseAndPopulate: (file: File, onChange: (field: string, value: any) => void) =>
            handleResumeParseAndPopulate(file, onChange, true), // parseOnlyTextCV = true
          resumeUploadState: uploadStates.resume,
        },
        'documents-others': {
          onFileUpload: {
            documents: handleDocumentUpload,
          },
          uploadStates: uploadStates,
        },
      }}
      onDiscardDraft={() => localStorage.removeItem('candidate_draft')}
    />
  );
};

export default AddCandidate;

