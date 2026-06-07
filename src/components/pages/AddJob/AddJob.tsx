import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import FormWizardLayout from '../../templates/FormWizardLayout/FormWizardLayout';
import { FormWizardStep } from '../../templates/FormWizardLayout/FormWizardLayout';
import RequirementStep from './RecruitmentStep';
import ClientStep from './ClientStep';
import OtherDetailsStep from './OtherDetailsStep';
import JobDescriptionStep from './JobDescriptionStep';
import {
  JobRequirementAPI,
  JobClientAPI,
  JobDetailsAPI,
} from '../../../types/job';
import { createJob, getNextJobId } from '../../../services/jobService';
import { useJobDropdowns } from '../../../hooks/useJobDropdowns';
import { useSkillsDropdown, useLocationsDropdown, useDropdownData } from '../../../hooks/useDropdowns';
import {
  showSuccessToast,
  showErrorToast,
} from '../../../utils/toast';
import { useAuth } from '../../auth/AuthContext';
import { createDisplayName } from '../../../utils';
import { apiCall, API_ENDPOINTS } from '../../../utils/api';
import Icon from '../../atoms/Icon/Icon';

// Form data interface for internal use (arrays for multi-select)
interface JobDetailsFormData extends Omit<JobDetailsAPI, 'industry'> {
  industry: string[]; // UI uses array
}

// Form version of JobDescriptionAPI with string[] for assigned_to
interface JobDescriptionFormData {
  job_description: string;
  pdf_upload: string;
  comments: string;
  assigned_to: string[]; // Always string[] when creating
  job_owner: string;
  _assigned_to_options?: any[];
  _job_owner_option?: any;
}

export interface JobFormData {
  requirement: JobRequirementAPI;
  client: JobClientAPI;
  job_details: JobDetailsFormData; // Use form version with arrays
  job_description: JobDescriptionFormData; // Use form version with string[] for assigned_to
}

const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

const getInitialFormData = (createdBy: { id: string; name: string }): JobFormData => ({
  // Step 1: Requirement
  requirement: {
    job_id: '', // Will be auto-generated from API in RequirementStep
    created_by: [createdBy],
    job_title: '',
    preferred_job: '',
    skill_category: '',
    employment_type: '',
    job_priority: '',
    job_status: 'Open', // Default to Open
    job_type: '',
    received_date: getTodayDate(), // Default to today, can be changed
    bgc_type: '',
    job_date: getTodayDate(), // Auto-set to today's date
    job_upload: '',
  },

  // Step 2: Client
  client: {
    client_name: '',
    client_logo: '',
    end_client_name: '',
    client_requirement_id: '',
    full_name: '',
    phone: '',
    email: '',
    designation: '',
    department: '',
    associate_msp: '',
  },

  // Step 3: Job Details
  job_details: {
    job_detail: '',
    primary_skill_set: [],
    secondary_skill_set: [],
    total_experience: 0,
    relevant_experience: 0,
    job_location: [], // Multi-select locations array
    no_of_position: 1,
    submission_limit: 0,
    tat: '',
    shifts: [],
    client_bill_rate: 0,
    client_bill_period: '',
    gender_preference: '', // Single gender preference
    job_open_type: '',
    industry: [], // UI uses array, converts to string for API
    degree: '',
    subject: '',
    certification: '',
    diversity_hiring: false,
    premium_institute: false,
  },

  // Step 4: Job Description
  job_description: {
    job_description: '',
    pdf_upload: '',
    comments: '',
    assigned_to: [],
    job_owner: '',
  },
});

const AddJob: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [, setIsDraft] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Extract candidate details from URL for auto-mapping
  const candidateIdForMapping = searchParams.get('candidate_id');
  const candidateNameForMapping = searchParams.get('candidate_name');

  // Generate display name for created_by field (same as AddCandidate)
  const createdByDisplayName = user
    ? createDisplayName(user.first_name, user.middle_name, user.last_name)
    : 'Unknown User';

  const createdByUser = {
    id: user?.id || user?._id || '',
    name: createdByDisplayName,
  };

  // Load all dropdown options for ID-to-label mapping
  const {
    jobTypes,
    employmentTypes,
    jobPriorities,
    bgcTypes,
    preferredJobs,
    skillCategories,
    shifts,
    billPeriods,
    genderPreferences,
    jobOpenTypes,
    industries,
  } = useJobDropdowns();
  const { options: skillOptions } = useSkillsDropdown();
  const { options: locationOptions } = useLocationsDropdown();
  const { options: educationTypeOptions } = useDropdownData('educationType');
  const { options: degreeOptions } = useDropdownData('degree');

  // Create lookup maps for converting IDs to labels
  const dropdownMaps = useMemo(() => {
    const createMap = (options: any[]) => {
      const map = new Map<string, string>();
      options.forEach(opt => {
        if (opt.value && opt.label) {
          map.set(opt.value, opt.label);
        }
      });
      return map;
    };

    return {
      jobType: createMap(jobTypes || []),
      employmentType: createMap(employmentTypes || []),
      jobPriority: createMap(jobPriorities || []),
      bgcType: createMap(bgcTypes || []),
      preferredJob: createMap(preferredJobs || []),
      skillCategory: createMap(skillCategories || []),
      shifts: createMap(shifts || []),
      billPeriod: createMap(billPeriods || []),
      genderPreference: createMap(genderPreferences || []),
      jobOpenType: createMap(jobOpenTypes || []),
      industry: createMap(industries || []),
      skills: createMap(skillOptions || []),
      location: createMap(locationOptions || []),
      educationType: createMap(educationTypeOptions || []),
      degree: createMap(degreeOptions || []),
    };
  }, [jobTypes, employmentTypes, jobPriorities, bgcTypes, preferredJobs, shifts, billPeriods, genderPreferences, jobOpenTypes, industries, skillOptions, locationOptions, educationTypeOptions, degreeOptions]);

  // Validation utility functions
  const validateDateNotInFuture = (
    dateString: string,
    fieldName: string
  ): string | null => {
    if (!dateString) return null;

    // Check if date string is complete (YYYY-MM-DD format = 10 characters)
    // Don't validate incomplete dates while user is still typing
    if (dateString.length < 10) return null;

    const date = new Date(dateString);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Set to end of today for comparison

    if (isNaN(date.getTime())) {
      return `Please enter a valid ${fieldName}`;
    }
    if (date > today) {
      return `${fieldName} cannot be in the future`;
    }
    return null;
  };

  const validateArrayField = (
    array: any[],
    fieldName: string,
    minItems: number = 1
  ): string | null => {
    if (!array || array.length === 0) {
      return `At least ${minItems} ${fieldName} ${minItems === 1 ? 'is' : 'are'} required`;
    }
    return null;
  };

  const validateNumericRange = (
    value: number | string,
    fieldName: string,
    min: number,
    max: number
  ): string | null => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) {
      return `${fieldName} must be a valid number`;
    }
    if (num < min) {
      return `${fieldName} must be at least ${min}`;
    }
    if (num > max) {
      return `${fieldName} cannot exceed ${max}`;
    }
    return null;
  };

  const steps: FormWizardStep[] = [
    {
      id: 'requirement',
      label: 'Requirement',
      description: 'Basic job information and requirements',
      component: RequirementStep,
      validation: (formData: JobFormData) => {
        const errors: Record<string, string> = {};
        const req = formData.requirement;

        // Required field validation
        if (!req.job_title?.trim()) {
          errors.job_title = 'Job title is required';
        } else if (req.job_title.length < 3) {
          errors.job_title = 'Job title must be at least 3 characters';
        }

        if (!req.job_type?.trim()) {
          errors.job_type = 'Job type is required';
        }

        if (!req.employment_type?.trim()) {
          errors.employment_type = 'Employment type is required';
        }

        if (!req.preferred_job?.trim()) {
          errors.preferred_job = 'Preferred job is required';
        }

        if (!req.skill_category?.trim()) {
          errors.skill_category = 'Skill category is required';
        }

        if (!req.job_priority?.trim()) {
          errors.job_priority = 'Job priority is required';
        }

        if (!req.job_status?.trim()) {
          errors.job_status = 'Job status is required';
        }

        if (!req.received_date?.trim()) {
          errors.received_date = 'Received date is required';
        } else {
          const dateError = validateDateNotInFuture(
            req.received_date,
            'Received date'
          );
          if (dateError) errors.received_date = dateError;
        }

        // Optional job date validation
        if (req.job_date) {
          const jobDateError = validateDateNotInFuture(
            req.job_date,
            'Job date'
          );
          if (jobDateError) errors.job_date = jobDateError;
        }

        return Object.keys(errors).length > 0 ? errors : null;
      },
    },
    {
      id: 'client',
      label: 'Client',
      description: 'Client details and contact information',
      component: ClientStep,
      validation: (formData: JobFormData) => {
        const errors: Record<string, string> = {};
        const client = formData.client;

        // Required field validation
        if (!client.client_name?.trim()) {
          errors.client_name = 'Client name is required';
        }

        if (!client.full_name?.trim()) {
          errors.full_name = 'Contact person name is required';
        }

        // Phone and email are no longer required - removed from UI
        // Contact information is now fetched from client contacts

        return Object.keys(errors).length > 0 ? errors : null;
      },
    },
    {
      id: 'other-details',
      label: 'Job Details',
      description: 'Skills, experience, and job specifications',
      component: OtherDetailsStep,
      validation: (formData: JobFormData) => {
        const errors: Record<string, string> = {};
        const details = formData.job_details;

        // Required field validation
        const skillsError = validateArrayField(
          details.primary_skill_set,
          'primary skill'
        );
        if (skillsError) errors.primary_skill_set = skillsError;

        if (!details.total_experience || details.total_experience === 0) {
          errors.total_experience = 'Total experience is required';
        } else {
          const expError = validateNumericRange(
            details.total_experience,
            'Total experience',
            0,
            50
          );
          if (expError) errors.total_experience = expError;
        }

        if (details.relevant_experience) {
          const relExpError = validateNumericRange(
            details.relevant_experience,
            'Relevant experience',
            0,
            50
          );
          if (relExpError) {
            errors.relevant_experience = relExpError;
          } else {
            const relExp = details.relevant_experience;
            const totalExp = details.total_experience;
            if (relExp > totalExp) {
              errors.relevant_experience =
                'Relevant experience cannot exceed total experience';
            }
          }
        }

        // Validate job location (multi-select array)
        if (!details.job_location || (Array.isArray(details.job_location) && details.job_location.length === 0)) {
          errors.job_location = 'Job location is required';
        }

        const positionsError = validateNumericRange(
          details.no_of_position,
          'Number of positions',
          1,
          1000
        );
        if (positionsError) errors.no_of_position = positionsError;

        if (
          details.submission_limit !== undefined &&
          details.submission_limit !== null
        ) {
          const submissionError = validateNumericRange(
            details.submission_limit,
            'Submission limit',
            0,
            10000
          );
          if (submissionError) errors.submission_limit = submissionError;
        }

        // Validate TAT (Turnaround Time) - Optional, but if present cannot be in the past
        if (details.tat && details.tat.trim() !== '') {
          const tatDate = new Date(details.tat);
          const now = new Date();

          if (isNaN(tatDate.getTime())) {
            errors.tat = 'Please enter a valid date and time';
          } else if (tatDate <= now) {
            errors.tat = 'TAT must be a future date and time';
          }
        }

        if (details.client_bill_rate !== undefined && details.client_bill_rate !== null) {
          if (details.client_bill_rate < 0) {
            errors.client_bill_rate = 'Bill rate cannot be negative';
          }
        }

        if (!details.client_bill_period?.trim()) {
          errors.client_bill_period = 'Bill period is required';
        }

        return Object.keys(errors).length > 0 ? errors : null;
      },
    },
    {
      id: 'job-description',
      label: 'Job Description',
      description: 'Job description and assignment details',
      component: JobDescriptionStep,
      validation: (formData: JobFormData) => {
        const errors: Record<string, string> = {};
        const desc = formData.job_description;

        // Required field validation
        if (!desc.job_description?.trim()) {
          errors.job_description = 'Job description is required';
        } else if (desc.job_description.length < 50) {
          errors.job_description =
            'Job description must be at least 50 characters';
        } else if (desc.job_description.length > 5000) {
          errors.job_description =
            'Job description cannot exceed 5000 characters';
        }

        const assignedError = validateArrayField(
          desc.assigned_to || [],
          'person to be assigned'
        );
        if (assignedError) errors.assigned_to = assignedError;

        if (!desc.job_owner?.trim()) {
          errors.job_owner = 'Job owner is required';
        } else if (desc.job_owner.length < 2) {
          errors.job_owner = 'Job owner name must be at least 2 characters';
        }

        return Object.keys(errors).length > 0 ? errors : null;
      },
    },
  ];

  const handleSaveDraft = async (currentData: JobFormData) => {
    console.log('Saving draft locally:', currentData);
    setIsDraft(true);

    try {
      // Save draft to localStorage
      localStorage.setItem('add_job_draft', JSON.stringify(currentData));
      showSuccessToast('Job data saved as draft!');
    } catch (error) {
      console.error('Error saving draft:', error);
      showErrorToast('Failed to save draft locally.');
    } finally {
      setIsDraft(false);
    }
  };

  const handleComplete = async (finalData: JobFormData) => {
    console.log('Submitting job requisition:', finalData);

    try {
      setIsSubmitting(true);
      // Helper function to convert arrays to comma-separated strings
      const arrayToString = (value: string[] | string | undefined): string => {
        if (!value) return '';
        if (Array.isArray(value)) return value.join(', ');
        return value;
      };

      // Helper function to convert ID to label using dropdown maps
      const getLabel = (id: string, mapName: keyof typeof dropdownMaps): string => {
        if (!id) return '';
        return dropdownMaps[mapName].get(id) || id; // Return ID if label not found
      };

      // Helper function to convert array of IDs to labels
      const getLabelsArray = (ids: string[], mapName: keyof typeof dropdownMaps): string[] => {
        if (!ids || !Array.isArray(ids)) return [];
        return ids.map(id => dropdownMaps[mapName].get(id) || id);
      };
      // Refetch the latest Job ID right before submission to minimize duplicates
      const latestJobId = await getNextJobId();
      console.log('Using latest fetched Job ID for submission:', latestJobId);

      const jobData = {
        // ID field - empty string for new jobs, will be generated by backend
        id: '',
        // Job requirement fields (flattened) - convert IDs to labels
        job_id: latestJobId,
        job_title: finalData.requirement.job_title,
        job_type: getLabel(finalData.requirement.job_type, 'jobType'),
        job_priority: getLabel(finalData.requirement.job_priority, 'jobPriority'),
        job_status: 'Open', // Set status to Open when completing
        job_date: finalData.requirement.job_date,
        received_date: finalData.requirement.received_date,
        job_upload: finalData.requirement.job_upload,
        preferred_job: getLabel(finalData.requirement.preferred_job, 'preferredJob'),
        skill_category: getLabel(finalData.requirement.skill_category, 'skillCategory'),
        employment_type: getLabel(finalData.requirement.employment_type, 'employmentType'),
        bgc_type: getLabel(finalData.requirement.bgc_type, 'bgcType'),

        // Client object (nested as per new schema)
        client: {
          client_name: finalData.client.client_name,
          end_client_name: finalData.client.end_client_name,
          client_requirement_id: finalData.client.client_requirement_id,
          full_name: finalData.client.full_name,
          phone: finalData.client.phone,
          email: finalData.client.email,
          designation: finalData.client.designation,
          department: finalData.client.department,
          client_logo: finalData.client.client_logo ? finalData.client.client_logo : null,
          associate_msp: finalData.client.associate_msp ? finalData.client.associate_msp : null,
        },

        // Job details fields (flattened) - convert IDs to labels
        job_detail: finalData.job_details.job_detail,
        primary_skill_set: getLabelsArray(finalData.job_details.primary_skill_set, 'skills'),
        secondary_skill_set: getLabelsArray(finalData.job_details.secondary_skill_set, 'skills'),
        total_experience: finalData.job_details.total_experience,
        relevant_experience: finalData.job_details.relevant_experience,
        job_location: arrayToString(finalData.job_details.job_location),
        no_of_position: finalData.job_details.no_of_position,
        submission_limit: finalData.job_details.submission_limit,
        tat: finalData.job_details.tat || null,
        shifts: finalData.job_details.shifts || [],
        client_bill_rate: finalData.job_details.client_bill_rate,
        client_bill_period: getLabel(finalData.job_details.client_bill_period, 'billPeriod'),
        gender_preference: getLabel(finalData.job_details.gender_preference, 'genderPreference'),
        job_open_type: getLabel(finalData.job_details.job_open_type, 'jobOpenType'),
        industry: finalData.job_details.industry.map(id => industries.find(ind => ind.value === id)?.label || id),
        education_criteria: finalData.job_details.degree || '',
        subject: finalData.job_details.subject || '',
        certification: finalData.job_details.certification,
        diversity_hiring: finalData.job_details.diversity_hiring,
        premium_institute: finalData.job_details.premium_institute || false,
        updated_by: [createdByUser],
        // Job description fields (flattened)
        // Note: assigned_to and job_owner are sent as IDs (user UUIDs), not labels
        job_description: finalData.job_description.job_description,
        pdf_upload: finalData.job_description.pdf_upload,
        // Transform comment string into array format
        comments: finalData.job_description.comments
          ? [{
            comment: finalData.job_description.comments,
            addedBy: createdByDisplayName,
            addedTime: new Date().toISOString(),
          }]
          : [],
        assigned_to: finalData.job_description.assigned_to, // Array of user IDs
        job_owner: finalData.job_description.job_owner, // Single user ID

        // Metadata fields
        created_by: [createdByUser],
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        isNewTC: true, // Default as per schema
      };

      // Call the API to create the job
      const response = await createJob(jobData);

      console.log('Job created successfully:', response);
      let successMessage = `Job requisition created successfully! Job ID: ${response.job_id}`;

      // AUTOMATIC MAPPING LOGIC
      if (candidateIdForMapping) {
        try {
          const mappingResponse = await apiCall(API_ENDPOINTS.RECRUITMENT.MAP, {
            method: 'POST',
            body: JSON.stringify({
              candidate_id: candidateIdForMapping,
              job_id: response.job_id,
              mapped_by: user?.id || user?._id || '',
            }),
          });

          if (mappingResponse && !mappingResponse.error) {
            successMessage += ` and candidate ${candidateNameForMapping} has been mapped to it.`;
          }
        } catch (mapError) {
          console.error('Failed to auto-map candidate:', mapError);
          // Don't fail the entire job creation if mapping fails
        }
      }

      showSuccessToast(successMessage);

      // Conditional navigation based on context
      if (candidateIdForMapping) {
        // When creating job for a candidate, navigate to Recruitment (Requirements) with refresh
        window.location.href = '/requirements';
      } else {
        // Normal flow: Redirect to the newly created job details page
        navigate(`/jobs/${response.id}`);
      }

      // Clear draft on successful submission
      localStorage.removeItem('add_job_draft');

    } catch (error) {
      console.error('Error creating job requisition:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to create job requisition. Please try again.';
      showErrorToast(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/jobs');
  };

  // Get initial data with auto-generated values or restore from draft
  const initialData = useMemo(() => {
    const savedDraft = localStorage.getItem('add_job_draft');
    if (savedDraft) {
      try {
        const parsedDraft = JSON.parse(savedDraft);
        // Ask user if they want to restore the draft
        // NOTE: Side effect in useMemo is generally discouraged, but used here to match AddClient behavior ensuring sync return
        const restoreDraft = window.confirm(
          'A draft was found. Would you like to continue from where you left off?'
        );
        if (restoreDraft) {
          return parsedDraft;
        } else {
          localStorage.removeItem('add_job_draft');
        }
      } catch (error) {
        console.error('Error parsing draft:', error);
        localStorage.removeItem('add_job_draft');
      }
    }
    return getInitialFormData(createdByUser);
  }, [createdByDisplayName]);

  // Preparation for the Contextual Banner
  const contextBanner = candidateIdForMapping ? (
    <div className="bg-blue-50/50 border-l-4 border-blue-600 px-6 py-4 flex items-center gap-3">
      <div className="bg-blue-100 p-2 rounded-full">
        <Icon name="info" className="text-blue-600 w-4 h-4" />
      </div>
      <p className="text-sm font-medium text-blue-800">
        Adding job for Candidate: <span className="font-bold">{candidateIdForMapping}</span> - {candidateNameForMapping}
      </p>
    </div>
  ) : null;

  return (
    <div className="h-full bg-gray-50 overflow-y-auto">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Add New Job Requisition</h1>
          <p className="mt-2 text-lg text-gray-600">Create a new job requisition with all necessary details</p>
        </div>

        {/* The banner is now passed to or rendered in FormWizardLayout logic */}
        <FormWizardLayout
          title="" // Hide default header since we use custom header above
          subtitle=""
          showCustomHeader={false} 
          steps={steps}
          initialData={initialData}
          onComplete={handleComplete}
          onCancel={handleCancel}
          onSaveAsDraft={handleSaveDraft}
          showSaveAsDraft={true}
          allowStepNavigation={true}
          onDiscardDraft={() => localStorage.removeItem('add_job_draft')}
          banner={contextBanner}
        />
      </div>
    </div>
  );
};

export default AddJob;
