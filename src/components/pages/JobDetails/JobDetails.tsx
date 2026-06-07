import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSWR, apiCall } from '../../../utils/api';
import { API_ENDPOINTS } from '../../../utils/api/endpoints';
import { JobsAPI } from '../../../utils/api/JobsAPI';
import {
  JobAPI,
  JobDetailsAPI,
  JobDescriptionAPI,
  JobComment,
  JobFormData,
} from '../../../types/job';
import { FileUploadService } from '../../../services/fileUploadService';
import { getEffectiveJobStatus } from '../../../utils/tatStatusOverride';
import DetailTemplate from '../../templates/DetailTemplate';
import Breadcrumb from '../../organisms/BreadCrumb';
import Card from '../../molecules/Card';
import Badge from '../../atoms/Badge';
import Button from '../../atoms/Button';
import Icon from '../../atoms/Icon';
import Text from '../../atoms/Text';
import Avatar from '../../atoms/Avatar';
import Input from '../../atoms/Input';
import SelectField from '../../molecules/SelectField';
import CandidateSearch from '../CandidateSearch/CandidateSearch';
import { usePermissions } from '../../../hooks/usePermissions';
import EditJobModal from './modals/EditJobModal';
import EditJobDetailsModal from './modals/EditJobDetailsModal';
import EditJobDescriptionModal from './modals/EditJobDescriptionModal';
import EditJobCommentsModal from './modals/EditJobCommentsModal';
import EditJobOwnerModal from './modals/EditJobOwnerModal';
import MapCandidateModal from '../../organisms/MapCandidateModal';
import MapApplicantsModal from '../../components/modals/MapApplicantsModal';
import { formatUIDate } from '../../../utils/dateFormat';
import DetailHeader from '../../organisms/DetailHeader';


const mockActivity = [
  {
    id: 1,
    type: 'candidate_added',
    user: 'Jane Smith',
    action: 'added a new candidate',
    details: 'Added Michael Scott to the candidate pool',
    time: '10:23 AM',
    date: 'Today',
    candidate: {
      name: 'Michael Scott',
      initials: 'MS',
      experience: '6 years experience',
      skills: ['React', 'Node.js', 'TypeScript'],
    },
  },
  {
    id: 2,
    type: 'status_change',
    user: 'John Doe',
    action: 'updated candidate status',
    details: "Changed Dwight Schrute's status from Interview to Offer",
    time: '9:45 AM',
    date: 'Today',
    statusChange: {
      from: 'Interview',
      to: 'Offer',
    },
  },
  {
    id: 3,
    type: 'job_update',
    user: 'John Doe',
    action: 'updated job description',
    details: 'Updated the responsibilities section of the job description',
    time: '4:45 PM',
    date: 'Yesterday',
  },
  {
    id: 4,
    type: 'interview_scheduled',
    user: 'System',
    action: 'scheduled interview',
    details:
      'Scheduled interview with Jim Halpert for March 26, 2025 at 10:00 AM',
    time: '2:30 PM',
    date: 'Yesterday',
    interview: {
      date: 'March 26, 2025',
      time: '10:00 AM - 11:00 AM',
      participants: ['Jim Halpert', 'John Doe', 'Jane Smith'],
    },
  },
  {
    id: 5,
    type: 'comment',
    user: 'Sarah Johnson',
    action: 'left a comment',
    details:
      'We should consider increasing the experience requirement to 6+ years',
    time: '2:30 PM',
    date: 'March 23, 2025',
  },
  {
    id: 6,
    type: 'job_created',
    user: 'John Doe',
    action: 'created job requisition',
    details: 'Created job requisition for Senior React Developer',
    time: '10:15 AM',
    date: 'March 23, 2025',
  },
];



// Mock submissions data
const mockSubmissions = [
  {
    id: 1,
    submittedBy: 'Jane Smith',
    submittedOn: 'Mar 24, 2025',
    candidateName: 'Michael Scott',
    phone: '+1 (555) 123-4567',
    email: 'michael.s@example.com',
    billRate: '$85/hr',
    status: 'Shortlisted',
  },
  {
    id: 2,
    submittedBy: 'John Doe',
    submittedOn: 'Mar 23, 2025',
    candidateName: 'Jim Halpert',
    phone: '+1 (555) 234-5678',
    email: 'jim.h@example.com',
    billRate: '$80/hr',
    status: 'Interview',
  },
  {
    id: 3,
    submittedBy: 'Sarah Johnson',
    submittedOn: 'Mar 22, 2025',
    candidateName: 'Pam Beesly',
    phone: '+1 (555) 345-6789',
    email: 'pam.b@example.com',
    billRate: '$75/hr',
    status: 'Screening',
  },
];

const JobDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canUpdateJobs } = usePermissions();

  // Fetch job data using real API
  const {
    data: jobData,
    error,
    loading,
    mutate,
  } = useSWR<JobAPI>(id ? `/job/${id}` : null);

  const {
    data: applicantsDataResponse,
    mutate: mutateApplicants,
  } = useSWR<any[]>(jobData?.job_id ? API_ENDPOINTS.RECRUITMENT.JOB_APPLICANTS(jobData.job_id) : id ? API_ENDPOINTS.RECRUITMENT.JOB_APPLICANTS(id) : null);
  const applicants = Array.isArray(applicantsDataResponse) ? applicantsDataResponse : (applicantsDataResponse as any)?.data || [];

  // State management - All hooks must be called before any conditional returns
  const [activeTab, setActiveTab] = useState('details');
  const [showSearchFilters, setShowSearchFilters] = useState(false);

  // Candidates state management
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Individual modal states for each section
  const [showEditJobModal, setShowEditJobModal] = useState(false);
  const [showEditDetailsModal, setShowEditDetailsModal] = useState(false);
  const [showEditDescriptionModal, setShowEditDescriptionModal] =
    useState(false);
  const [showEditCommentsModal, setShowEditCommentsModal] = useState(false);
  const [showEditJobOwnerModal, setShowEditJobOwnerModal] = useState(false);
  const [showMapCandidateModal, setShowMapCandidateModal] = useState(false);
  const [showMapApplicantsModal, setShowMapApplicantsModal] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [presignedPdfUrl, setPresignedPdfUrl] = useState<string>('');
  const [presignedJobUploadUrl, setPresignedJobUploadUrl] = useState<string>('');

  // Fetch presigned URLs check
  useEffect(() => {
    const fetchPresignedUrls = async () => {
      if (jobData?.pdf_upload) {
        try {
          const url = await FileUploadService.getFileViewUrl(jobData.pdf_upload);
          setPresignedPdfUrl(url);
        } catch (error) {
          console.error('Error fetching presigned PDF URL:', error);
        }
      }
      
      if (jobData?.job_upload) {
        try {
          const url = await FileUploadService.getFileViewUrl(jobData.job_upload);
          setPresignedJobUploadUrl(url);
        } catch (error) {
          console.error('Error fetching presigned Job Upload URL:', error);
        }
      }
    };

    if (jobData) {
      fetchPresignedUrls();
    }
  }, [jobData]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Helper functions for candidate status
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'screening':
        return 'bg-blue-100 text-blue-700';
      case 'interview':
        return 'bg-purple-100 text-purple-700';
      case 'offer':
        return 'bg-amber-100 text-amber-700';
      case 'hired':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case 'screening':
        return 'Screening';
      case 'interview':
        return 'Interview';
      case 'offer':
        return 'Offer';
      case 'hired':
        return 'Hired';
      case 'rejected':
        return 'Rejected';
      default:
        return status;
    }
  };

  const updateCandidateStatus = async (mappingId: string, newStatus: string) => {
    try {
      await apiCall(API_ENDPOINTS.RECRUITMENT.UPDATE(mappingId), {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      await mutateApplicants();
    } catch (err) {
      console.error('Failed to update status', err);
    }
    setActiveDropdown(null);
  };

  const removeCandidate = async (mappingId: string) => {
    try {
      await apiCall(API_ENDPOINTS.RECRUITMENT.UNMAP(mappingId), {
        method: 'POST' // Assuming POST for unmap based on endpoint structure, check if it's DELETE
      });
      await mutateApplicants();
    } catch (err) {
      console.error('Failed to remove candidate', err);
    }
    setActiveDropdown(null);
  };

  // Handle loading state - AFTER all hooks
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading job details...</p>
        </div>
      </div>
    );
  }

  // Handle error state - AFTER all hooks
  if (error || !jobData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Icon name="alert" size={48} className="text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Job Not Found
          </h3>
          <p className="text-gray-500 mb-4">
            {error
              ? 'Error loading job details.'
              : 'The job you are looking for does not exist.'}
          </p>
          <Button onClick={() => navigate('/jobs')} variant="primary">
            Back to Jobs
          </Button>
        </div>
      </div>
    );
  }

  // Save handlers for each modal section

  // Handler for saving job header (title, status, priority, location)
  const handleSaveJob = async (data: any) => {
    if (!id) return;

    setIsSaving(true);
    try {
      await JobsAPI.updateJob(id, data);
      await mutate();
    } catch (error) {
      console.error('Error updating job:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDetails = async (data: any) => {
    if (!id) return;

    setIsSaving(true);
    try {
      // Call PATCH API to update job details
      await JobsAPI.updateJob(id, data);

      // Refresh job data
      await mutate();
    } catch (error) {
      console.error('Error updating job details:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDescription = async (data: Partial<JobDescriptionAPI>) => {
    if (!id) return;

    setIsSaving(true);
    try {
      // Log the data being sent to API
      console.log('handleSaveDescription - data received:', data);

      // Call PATCH API to update job description
      await JobsAPI.updateJob(id, data as any);

      // Refresh job data
      await mutate();
    } catch (error) {
      console.error('Error updating job description:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveComments = async (comments: JobComment[]) => {
    if (!id) return;

    setIsSaving(true);
    try {
      await JobsAPI.updateJob(id, { comments } as any);
      await mutate();
    } catch (error) {
      console.error('Error updating comments:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveJobOwner = async (data: { assigned_to: string[]; job_owner: string }) => {
    if (!id) return;

    setIsSaving(true);
    try {
      // Call PATCH API to update job owner and assignment
      // assigned_to is sent as string[] (IDs only) to the API
      await JobsAPI.updateJob(id, data as any);

      // Refresh job data
      await mutate();
    } catch (error) {
      console.error('Error updating job owner:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  // Handler for mapping candidates to job
  const handleMapCandidates = (mappedCandidates: any[]) => {
    console.log('Mapping candidates to job:', mappedCandidates);

    // Add mapped candidates to the candidates list
    const newCandidates = mappedCandidates.map((candidate, index) => {
      // Handle both formats: from MapCandidateModal and MapApplicantsModal
      const candidateId = candidate._id || candidate.id || candidate.candidate_id;
      const displayName = 
        candidate.display_name || 
        candidate.candidate_name ||
        `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim();
      
      const skills = candidate.skills
        ? (Array.isArray(candidate.skills)
          ? candidate.skills.map((s: any) => typeof s === 'string' ? s : (s.name || s.skill_name)).slice(0, 5)
          : [])
        : [];

      return {
        id: candidateId,
        name: displayName,
        email: candidate.email || '',
        initials: displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'NA',
        avatarColor: ['blue', 'purple', 'green', 'pink', 'amber'][index % 5],
        skills: skills,
        experience: candidate.total_experience?.toString() || 'N/A',
        appliedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        status: 'screening',
      };
    });

    // TODO: Call API to save the mapping to backend
    // if (id) {
    //   await JobsAPI.mapCandidates(id, mappedCandidates.map(c => c._id || c.id || c.candidate_id));
    //   await mutateApplicants();
    // }
  };

  // If no job data found, show error
  if (!jobData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <Icon name="alert" className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <Text variant="h3" className="text-gray-900 mb-2">
            Job Not Found
          </Text>
          <Text className="text-gray-600 mb-4">
            The job requisition you're looking for doesn't exist.
          </Text>
          <Button onClick={() => navigate('/jobs')}>Back to Jobs</Button>
        </Card>
      </div>
    );
  }

  // Helper functions
  const getActivityIconColor = (type: string) => {
    switch (type) {
      case 'candidate_added':
        return 'text-blue-600';
      case 'status_change':
        return 'text-green-600';
      case 'job_update':
        return 'text-purple-600';
      case 'interview_scheduled':
        return 'text-yellow-600';
      case 'comment':
        return 'text-orange-600';
      case 'job_created':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  // Get priority badge styling (matching list view)
  const getPriorityBadge = () => {
    const priority = jobData.job_priority;
    if (!priority) return null;

    const priorityLower = priority.toLowerCase();
    const badgeClass = priorityLower === 'high' || priorityLower === 'urgent'
      ? 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20'
      : priorityLower === 'medium'
        ? 'bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20'
        : priorityLower === 'low'
          ? 'bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-600/20'
          : 'bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/20';

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClass}`}>
        {priority}
      </span>
    );
  };

  // Get status badge styling
  const getStatusBadgeStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'open':
      case 'filled':
        return 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20';
      case 'closed':
      case 'inactive':
        return 'bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/20';
      case 'on hold':
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20';
      case 'freeze':
        return 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20';
      default:
        return 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20';
    }
  };

  // Get status dot color
  const getStatusDotColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'open':
        return 'bg-green-500';
      case 'closed':
      case 'inactive':
        return 'bg-gray-400';
      case 'freeze':
        return 'bg-red-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getUserDisplayName = (
    user: { id?: string; name?: string } | { id?: string; name?: string }[] | string | undefined
  ) => {
    if (!user) return 'Unknown';
    if (typeof user === 'string') return user;
    if (Array.isArray(user)) {
      return user[0]?.name || user[0]?.id || 'Unknown';
    }
    return user.name || user.id || 'Unknown';
  };

  // Custom Job Header Component - Matching DetailHeader structure exactly
  const JobHeader = () => (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 relative">
        <div className="flex justify-between items-stretch">
          <div className="flex flex-col justify-between flex-1 px-6 pt-6 pb-2">
            {/* Top Section - Name and Info */}
            <div className="space-y-2">
              {/* Name and Actions */}
              <div className="">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <Text variant="h2" weight="semibold" className="text-gray-900">
                      {jobData.job_id} - {jobData.job_title}
                      {jobData.client?.client_requirement_id && (
                        <span className="text-gray-600 font-normal"> ({jobData.client.client_requirement_id})</span>
                      )}
                    </Text>
                    {/* Priority Badge */}
                    {getPriorityBadge()}
                    {/* Status Badge */}
                    {jobData.job_status && (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeStyle(jobData.job_status)}`}>
                        <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${getStatusDotColor(jobData.job_status)}`} />
                        {jobData.job_status}
                      </span>
                    )}
                  </div>
                </div>

                {/* Designation - Client Name (MSP) | Location */}
                <div className="flex items-center gap-1">
                  <Text size="sm" className="text-gray-700 font-semibold">
                    {jobData.client?.client_name || 'No Client'}
                    {jobData.client?.associate_msp && (
                      <span className="text-gray-600 font-normal"> ({jobData.client.associate_msp})</span>
                    )}
                  </Text>
                  {/* {jobData.client?.associate_msp && (
                  <div className="flex items-center gap-1 mt-1">
                    <Text size="sm" className="text-gray-600">
                      <span className="font-semibold">Associated MSP:</span> {jobData.client.associate_msp}
                    </Text>
                  </div>
                )} */}
                  {jobData.job_location && (
                    <>
                      <span className="text-gray-600 text-sm">|</span>
                      <Icon name="map-pin" size={14} className="text-gray-500" />
                      <Text size="sm" className="text-gray-600">
                        {jobData.job_location}
                      </Text>
                    </>
                  )}
                </div>


              </div>
            </div>

            {/* Bottom Section - Action Buttons */}
            <div className="flex flex-wrap gap-3 mt-auto pt-4">
              <button
                disabled
                className="flex items-center gap-1 text-gray-400 cursor-not-allowed"
              >
                <Icon name="users" size={14} />
                <Text size="sm">Recommended Candidates ({jobData.no_of_position || 0})</Text>
              </button>
              <button
                onClick={() => setShowMapApplicantsModal(true)}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-700 transition-colors"
              >
                <Icon name="plus" size={14} />
                <Text size="sm">Map Applicant</Text>
              </button>
            </div>
          </div>

          <div className="flex flex-col justify-between pr-2 pt-2 pb-2">
            {/* Avatar Container with Edit Button */}
            <div className="flex items-start justify-between w-full pb-1">
              <div className="w-8 h-8"></div>
              <div className="relative mt-2 w-24 h-24">
                {/* Profile Image or Placeholder with white border */}
                <div className="w-full h-full rounded-full overflow-hidden bg-gray-200 border-2 border-white shadow-lg">
                  {jobData.client?.client_logo ? (
                    <img
                      src={jobData.client.client_logo}
                      alt="Client Logo"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <svg
                        className="text-gray-400 w-12 h-12"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <circle cx="12" cy="8" r="4" />
                        <path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* Edit Button - to the right of Avatar */}
              {canUpdateJobs && (
                <Button
                  variant="ghost"
                  iconOnly
                  onClick={() => setShowEditJobModal(true)}
                  className="mt-1"
                >
                  <Icon name="edit" size={16} />
                </Button>
              )}
            </div>

            {/* Last Updated Info - Below Avatar (like lastUpdatedBy in DetailHeader) */}
            {((jobData.updated_by || jobData.created_by) || jobData.updated) && (
              <div className="text-gray-500 mt-auto pt-4">
                <div className="flex items-center gap-x-2 whitespace-nowrap">
                  {(jobData.updated_by || jobData.created_by) && (
                    <Text size="xs">
                      Last Updated By: {getUserDisplayName(jobData.updated_by || jobData.created_by)}
                    </Text>
                  )}
                  {(jobData.updated_by || jobData.created_by) && jobData.updated && (
                    <Text size="xs">|</Text>
                  )}
                  {jobData.updated && (
                    <Text size="xs">
                      Last Updated: {new Date(jobData.updated).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </Text>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Requirement details content - Job Details Tab
  const RequirementDetailsContent = () => (
    <div className="space-y-6">
      <Card>
        <div className="pb-4 flex items-center justify-between">
          <Text
            variant="h3"
            className="text-lg font-medium flex items-center gap-2"
          >
            <Icon name="briefcase" className="w-5 h-5 text-blue-600" />
            Job Details
          </Text>
          {canUpdateJobs && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowEditDetailsModal(true)}
              className="gap-1"
            >
              <Icon name="edit" size={16} />
              Edit
            </Button>
          )}
        </div>

        {/* Row 1: Skill Category | Primary Skills | Secondary Skills */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-gray-100">
          <div className="space-y-2">
            <Text className="text-sm font-medium text-gray-500">Skill Category</Text>
            <div className="flex flex-wrap gap-2">
              {jobData.skill_category ? (
                Array.isArray(jobData.skill_category) ? (
                  (jobData.skill_category as string[]).map((cat: string, index: number) => (
                    <Badge key={index} variant="secondary" className="rounded-full px-3 py-1">
                      {cat}
                    </Badge>
                  ))
                ) : (
                  typeof jobData.skill_category === 'string' ? (
                    jobData.skill_category.split(',').map((cat: string, index: number) => (
                      <Badge key={index} variant="secondary" className="rounded-full px-3 py-1">
                        {cat.trim()}
                      </Badge>
                    ))
                  ) : (
                    <Text className="text-gray-400">Not specified</Text>
                  )
                )
              ) : (
                <Text className="text-gray-400">Not specified</Text>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Text className="text-sm font-medium text-gray-500">Primary Skills</Text>
            <div className="flex flex-wrap gap-2">
              {jobData.primary_skill_set?.length > 0 ? (
                jobData.primary_skill_set.map((skill: string, index: number) => (
                  <Badge key={index} variant="primary" className="rounded-full px-3 py-1">
                    {skill}
                  </Badge>
                ))
              ) : (
                <Text className="text-gray-400">Not specified</Text>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Text className="text-sm font-medium text-gray-500">Secondary Skills</Text>
            <div className="flex flex-wrap gap-2">
              {jobData.secondary_skill_set?.length > 0 ? (
                jobData.secondary_skill_set.map((skill: string, index: number) => (
                  <Badge key={index} variant="secondary" className="rounded-full px-3 py-1">
                    {skill}
                  </Badge>
                ))
              ) : (
                <Text className="text-gray-400">Not specified</Text>
              )}
            </div>
          </div>
        </div>

        {/* Row 2: Experience & Job Type Details - 3 columns on large, 2 on medium */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 py-6 border-b border-gray-100">
          <div className="space-y-1">
            <Text className="text-xs font-medium text-gray-400 uppercase tracking-wide">Total Exp.</Text>
            <Text weight="medium" className="text-gray-900">
              {jobData.total_experience ? `${jobData.total_experience} Years` : '-'}
            </Text>
          </div>
          <div className="space-y-1">
            <Text className="text-xs font-medium text-gray-400 uppercase tracking-wide">Relevant Exp.</Text>
            <Text weight="medium" className="text-gray-900">
              {jobData.relevant_experience ? `${jobData.relevant_experience} Years` : '-'}
            </Text>
          </div>
          <div className="space-y-1">
            <Text className="text-xs font-medium text-gray-400 uppercase tracking-wide">Preferred Job</Text>
            <Text weight="medium" className="text-gray-900">{jobData.preferred_job || '-'}</Text>
          </div>
          <div className="space-y-1">
            <Text className="text-xs font-medium text-gray-400 uppercase tracking-wide">Job Open Type</Text>
            <Text weight="medium" className="text-gray-900">{jobData.job_open_type || '-'}</Text>
          </div>
          <div className="space-y-1">
            <Text className="text-xs font-medium text-gray-400 uppercase tracking-wide">BGC Type</Text>
            <Text weight="medium" className="text-gray-900">{jobData.bgc_type || '-'}</Text>
          </div>
          <div className="space-y-1">
            <Text className="text-xs font-medium text-gray-400 uppercase tracking-wide">Rate/Period</Text>
            <Text weight="medium" className="text-gray-900">
              {jobData.client_bill_period && jobData.client_bill_rate
                ? `${jobData.client_bill_rate} / ${jobData.client_bill_period}`
                : '-'}
            </Text>
          </div>
        </div>

        {/* Row 3: Position Details - 3 columns on large, 2 on medium */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 py-6 border-b border-gray-100">
          <div className="space-y-1">
            <Text className="text-xs font-medium text-gray-400 uppercase tracking-wide">No. of Positions</Text>
            <Text weight="medium" className="text-gray-900">{jobData.no_of_position || '-'}</Text>
          </div>
          <div className="space-y-1">
            <Text className="text-xs font-medium text-gray-400 uppercase tracking-wide">End Client</Text>
            <Text weight="medium" className="text-gray-900">{jobData.client?.end_client_name || '-'}</Text>
          </div>
          <div className="space-y-1">
            <Text className="text-xs font-medium text-gray-400 uppercase tracking-wide">Degree</Text>
            <div className="flex items-center gap-2">
              <Text weight="medium" className="text-gray-900">{jobData.education_criteria || jobData.degree || '-'}</Text>
              {jobData.premium_institute && (
                <Badge variant="info" className="rounded-full text-xs px-2 py-0.5">Premium</Badge>
              )}
            </div>
          </div>
          <div className="space-y-1">
            <Text className="text-xs font-medium text-gray-400 uppercase tracking-wide">Subject</Text>
            <Text weight="medium" className="text-gray-900">{jobData.subject || '-'}</Text>
          </div>
          <div className="space-y-1">
            <Text className="text-xs font-medium text-gray-400 uppercase tracking-wide">Certification</Text>
            <Text weight="medium" className="text-gray-900">{jobData.certification || '-'}</Text>
          </div>
          <div className="space-y-1">
            <Text className="text-xs font-medium text-gray-400 uppercase tracking-wide">Shifts</Text>
            <Text weight="medium" className="text-gray-900">
              {jobData.shifts
                ? (Array.isArray(jobData.shifts)
                  ? jobData.shifts.join(', ')
                  : jobData.shifts)
                : '-'}
            </Text>
          </div>
          <div className="space-y-1">
            <Text className="text-xs font-medium text-gray-400 uppercase tracking-wide">Gender Preference</Text>
            <Text weight="medium" className="text-gray-900">{jobData.gender_preference || '-'}</Text>
          </div>

          <div className="space-y-1">
            <Text className="text-xs font-medium text-gray-400 uppercase tracking-wide">Industry</Text>
            <Text weight="medium" className="text-gray-900">
              {jobData.industry && jobData.industry.length > 0
                ? (Array.isArray(jobData.industry)
                  ? jobData.industry.map((item: any) => typeof item === 'string' ? item : item.name).join(', ')
                  : jobData.industry)
                : '-'}
            </Text>
          </div>
        </div>

        {/* Row 4: Submission & Compliance - 3 columns */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-6">
          <div className="space-y-1">
            <Text className="text-xs font-medium text-gray-400 uppercase tracking-wide">Submission Limit</Text>
            <Text weight="medium" className="text-gray-900">{jobData.submission_limit || '-'}</Text>
          </div>
          <div className="space-y-1">
            <Text className="text-xs font-medium text-gray-400 uppercase tracking-wide">TAT</Text>
            <Text weight="medium" className="text-gray-900">
              {jobData.tat ? new Date(jobData.tat).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              }) : '-'}
            </Text>
          </div>
          <div className="space-y-1">
            <Text className="text-xs font-medium text-gray-400 uppercase tracking-wide">Diversity Hiring</Text>
            {jobData.diversity_hiring ? (
              <Badge variant="success" className="rounded-full px-3 py-1">Yes</Badge>
            ) : (
              <Text weight="medium" className="text-gray-900">No</Text>
            )}
          </div>
        </div>
      </Card>
    </div>
  );

  // Job description content
  const JobDescriptionContent = () => (
    <div className="space-y-6">
      {/* Job Description Card */}
      <Card>
        <div className="pb-4 flex flex-row items-center justify-between border-b border-gray-100">
          <Text
            variant="h3"
            className="text-lg font-medium flex items-center gap-2"
          >
            <Icon name="file-text" className="w-5 h-5 text-blue-600" />
            Job Description
          </Text>
          <div className="flex items-center gap-2">
            {/* Req Upload Button */}
            {jobData.job_upload && (
              <a
                href={presignedJobUploadUrl || 'javascript:void(0)'}
                target={presignedJobUploadUrl ? "_blank" : "_self"}
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (!presignedJobUploadUrl) {
                    e.preventDefault();
                    // Optional: show a toast or alert that it's loading if needed
                  }
                }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  disabled={!presignedJobUploadUrl}
                >
                  <Icon name="download" size={16} />
                  Req Upload
                </Button>
              </a>
            )}
            {canUpdateJobs && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEditDescriptionModal(true)}
                className="gap-1"
              >
                <Icon name="edit" size={16} />
                Edit
              </Button>
            )}
          </div>
        </div>
        <div className="pt-4">
          {jobData.job_description ? (
            <div
              className="prose prose-sm max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ __html: jobData.job_description }}
            />
          ) : (
            <Text className="text-gray-400 italic">No job description provided</Text>
          )}
        </div>
      </Card>

      {/* PDF Viewer - Only show if PDF exists */}
      {jobData.pdf_upload && (
        <Card>
          <div className="pb-4 flex flex-row items-center justify-between border-b border-gray-100">
            <Text
              variant="h3"
              className="text-lg font-medium flex items-center gap-2"
            >
              <Icon name="file" className="w-5 h-5 text-red-600" />
              Job Description Document
            </Text>
            <a
              href={presignedPdfUrl || 'javascript:void(0)'}
              target={presignedPdfUrl ? "_blank" : "_self"}
              rel="noopener noreferrer"
              onClick={(e) => {
                if (!presignedPdfUrl) e.preventDefault();
              }}
            >
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                disabled={!presignedPdfUrl}
              >
                <Icon name="download" size={16} />
                Download
              </Button>
            </a>
          </div>
          <div className="pt-4">
            {presignedPdfUrl ? (
              <iframe
                src={`${presignedPdfUrl}#toolbar=0`}
                className="w-full h-[600px] border border-gray-200 rounded-lg"
                title="Job Description PDF"
              />
            ) : (
                <div className="w-full h-[300px] flex items-center justify-center bg-gray-50 border border-gray-200 rounded-lg border-dashed">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <Text className="text-gray-500 text-sm">Loading document...</Text>
                  </div>
                </div>
            )}
          </div>
        </Card>
      )}

      {/* Comments Section */}
      <Card>
        <div className="pb-4 flex flex-row items-center justify-between border-b border-gray-100">
          <Text
            variant="h3"
            className="text-lg font-medium flex items-center gap-2"
          >
            <Icon name="chat" className="w-5 h-5 text-blue-600" />
            Comments ({jobData.comments?.length || 0})
          </Text>
          {canUpdateJobs && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowEditCommentsModal(true)}
              className="gap-1"
            >
              <Icon name="edit" size={16} />
              Manage Comments
            </Button>
          )}
        </div>
        <div className="pt-4">
          {jobData.comments && jobData.comments.length > 0 ? (
            <div className="space-y-4">
              {(Array.isArray(jobData.comments) ? jobData.comments : []).map((comment: JobComment, index: number) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <Text className="text-sm font-medium text-gray-700">{comment.addedBy}</Text>
                    <Text className="text-xs text-gray-500">
                      {new Date(comment.addedTime).toLocaleString()}
                    </Text>
                  </div>
                  <Text className="text-gray-700 whitespace-pre-wrap break-words overflow-hidden">{comment.comment}</Text>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Icon name="chat" size={24} className="text-gray-400" />
              </div>
              <Text className="text-gray-400 text-sm">No comments added</Text>
            </div>
          )}
        </div>
      </Card>
    </div>
  );

  // Candidates content - mapped candidates with status management
  const CandidatesContent = () => (
    <Card>
      <div className="pb-2 flex flex-row items-center justify-between">
        <Text
          variant="h3"
          className="text-lg font-medium flex items-center gap-2"
        >
          <Icon name="users" className="w-5 h-5 text-blue-600" />
          Candidates
        </Text>
        <div className="flex items-center gap-2">
          <div className="text-sm text-gray-500">
            {applicants.length} candidates
          </div>
          <Button
            size="sm"
            className="gap-1"
            onClick={() => setShowMapApplicantsModal(true)}
          >
            <Icon name="plus" size={16} />
            Map Candidate
          </Button>
        </div>
      </div>

      <div className="mb-4 flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Icon
            name="search"
            className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
          />
          <Input
            type="text"
            placeholder="Search candidates by name, skills, or experience..."
            className="w-full pl-10"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1 whitespace-nowrap"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Icon name="funnel" size={16} />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </Button>
      </div>

      {showFilters && (
        <div className="mb-4 p-4 border rounded-md bg-gray-50">
          <Text variant="h4" weight="medium" className="mb-3">
            Filter Candidates
          </Text>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Text className="text-sm font-medium text-gray-500 mb-1 block">
                Status
              </Text>
              <SelectField
                options={[
                  { value: 'all', label: 'All Statuses' },
                  { value: 'screening', label: 'Screening' },
                  { value: 'shortlisted', label: 'Shortlisted' },
                  { value: 'interview', label: 'Interview' },
                  { value: 'offer', label: 'Offer' },
                  { value: 'rejected', label: 'Rejected' },
                ]}
                placeholder="All Statuses"
                value="all"
                onChange={() => { }}
              />
            </div>
            <div>
              <Text className="text-sm font-medium text-gray-500 mb-1 block">
                Experience
              </Text>
              <SelectField
                options={[
                  { value: 'all', label: 'All Experience' },
                  { value: '0-2', label: '0-2 years' },
                  { value: '3-5', label: '3-5 years' },
                  { value: '5-7', label: '5-7 years' },
                  { value: '7+', label: '7+ years' },
                ]}
                placeholder="All Experience"
                value="all"
                onChange={() => { }}
              />
            </div>
            <div>
              <Text className="text-sm font-medium text-gray-500 mb-1 block">
                Skills
              </Text>
              <SelectField
                options={[
                  { value: 'all', label: 'All Skills' },
                  { value: 'react', label: 'React' },
                  { value: 'node', label: 'Node.js' },
                  { value: 'typescript', label: 'TypeScript' },
                  { value: 'graphql', label: 'GraphQL' },
                ]}
                placeholder="All Skills"
                value="all"
                onChange={() => { }}
              />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button variant="outline" size="sm" className="mr-2">
              Reset
            </Button>
            <Button size="sm">Apply Filters</Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {applicants.map((applicant: any) => {
          const initials = applicant.applicant_name ? applicant.applicant_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : '??';
          const avatarUrl = applicant.applicant_profile_image || applicant.applicant_picture || applicant.candidate_picture || '';
          
          return (
          <Card key={applicant.id} className="overflow-visible h-full flex flex-col">
            <div className="p-4 flex flex-col h-full">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <Avatar
                    src={avatarUrl}
                    fallback={initials}
                    size="lg"
                    className="bg-blue-100 text-blue-600"
                  />
                </div>
                <div className="flex-grow min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <Text variant="h4" weight="medium" className="text-lg truncate">
                        {applicant.applicant_name}
                      </Text>
                      <Text size="sm" className="text-gray-500 truncate">
                        {applicant.email}
                      </Text>
                    </div>
                    <div className="relative flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        iconOnly
                        onClick={e => {
                          e.stopPropagation();
                          setActiveDropdown(
                            activeDropdown === applicant.id
                              ? null
                              : applicant.id
                          );
                        }}
                      >
                        <Icon name="sliders" size={16} />
                      </Button>
                      {activeDropdown === applicant.id && (
                        <div
                          ref={dropdownRef}
                          className="absolute right-0 top-8 z-50 w-56 bg-white rounded-md shadow-lg border"
                          onClick={e => e.stopPropagation()}
                          style={{ maxHeight: '300px', overflowY: 'auto' }}
                        >
                          <div className="p-2 text-sm font-medium text-gray-700 border-b">
                            Update Status
                          </div>
                          <div className="p-1">
                            <button
                              type="button"
                              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded-sm flex items-center gap-2"
                              onClick={() =>
                                updateCandidateStatus(applicant.id, 'Screening')
                              }
                            >
                              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                              Screening
                            </button>
                            <button
                              type="button"
                              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded-sm flex items-center gap-2"
                              onClick={() =>
                                updateCandidateStatus(applicant.id, 'Interview')
                              }
                            >
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              Interview
                            </button>
                            <button
                              type="button"
                              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded-sm flex items-center gap-2"
                              onClick={() =>
                                updateCandidateStatus(applicant.id, 'Offer')
                              }
                            >
                              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                              Offer
                            </button>
                            <button
                              type="button"
                              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded-sm flex items-center gap-2"
                              onClick={() =>
                                updateCandidateStatus(applicant.id, 'Hired')
                              }
                            >
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              Hired
                            </button>
                          </div>
                          <div className="border-t p-1">
                            <button
                              type="button"
                              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded-sm flex items-center gap-2 text-red-600"
                              onClick={() =>
                                updateCandidateStatus(applicant.id, 'Rejected')
                              }
                            >
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              Reject Candidate
                            </button>
                            <button
                              type="button"
                              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded-sm flex items-center gap-2 text-gray-600"
                              onClick={() => removeCandidate(applicant.id)}
                            >
                              Remove Candidate
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-2">
                    {(() => {
                      const skillsList = applicant.primary_skill?.length ? applicant.primary_skill : applicant.skill_set || [];
                      const displaySkills = skillsList.slice(0, 1);
                      const extraSkillsCount = skillsList.length - 1;
                      
                      return (
                        <div 
                          className="flex items-center gap-1 mb-2 h-6" 
                          title={skillsList.join(', ')}
                        >
                          {displaySkills.map((skill: string, index: number) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="rounded-full text-xs shrink-0"
                            >
                              <span className="truncate inline-block align-bottom max-w-[110px]">
                                {skill}
                              </span>
                            </Badge>
                          ))}
                          {extraSkillsCount > 0 && (
                            <Badge variant="secondary" className="rounded-full text-xs shrink-0">
                              +{extraSkillsCount}
                            </Badge>
                          )}
                          {skillsList.length === 0 && (
                            <span className="text-xs text-gray-400 italic">No skills listed</span>
                          )}
                        </div>
                      );
                    })()}
                    <div className="flex justify-between text-sm">
                      <Text className="text-gray-500 flex items-center gap-1.5">
                        {applicant.total_exp ? (
                          <>
                            <span className="text-gray-600">{applicant.total_exp}</span>
                            <span className="text-gray-400">|</span>
                          </>
                        ) : null}
                        {/* <span className="font-medium text-gray-700">{applicant.status || 'Applied'}</span> */}
                      </Text>
                      <Text className="text-gray-500">
                        {getStatusDisplayName(applicant.status) || applicant.status || 'Applied'}
                       
                      </Text>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-auto pt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(applicant.status?.toLowerCase())}`}>
                     {formatUIDate(applicant.mapped_date)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => navigate(`/applicants/${applicant.id}`)}
                  >
                    View Profile
                  </Button>
                </div>
                {/* Progress indicator */}
                <div className="flex items-center w-full">
                  <div
                    className={`h-1.5 rounded-l-full w-1/4 ${
                      ['interview', 'offer', 'hired'].includes(
                        applicant.status?.toLowerCase()
                      )
                        ? 'bg-blue-600'
                        : applicant.status?.toLowerCase() === 'screening'
                        ? 'bg-blue-600'
                        : 'bg-gray-200'
                    }`}
                  ></div>
                  <div
                    className={`h-1.5 w-1/4 ${
                      ['offer', 'hired'].includes(applicant.status?.toLowerCase())
                        ? 'bg-blue-600'
                        : applicant.status?.toLowerCase() === 'interview'
                        ? 'bg-blue-600'
                        : 'bg-gray-200'
                    }`}
                  ></div>
                  <div
                    className={`h-1.5 w-1/4 ${
                      ['hired'].includes(applicant.status?.toLowerCase())
                        ? 'bg-blue-600'
                        : applicant.status?.toLowerCase() === 'offer'
                        ? 'bg-blue-600'
                        : 'bg-gray-200'
                    }`}
                  ></div>
                  <div
                    className={`h-1.5 rounded-r-full w-1/4 ${
                      applicant.status?.toLowerCase() === 'hired'
                        ? 'bg-blue-600'
                        : 'bg-gray-200'
                    }`}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Screening</span>
                  <span>Interview</span>
                  <span>Offer</span>
                  <span>Hired</span>
                </div>
              </div>
            </div>
          </Card>
        )})}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Showing {applicants.length} of {applicants.length} candidates
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" disabled>
            <Icon name="caret-left" size={16} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 bg-blue-50 text-blue-600 border-blue-200"
          >
            1
          </Button>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0">
            2
          </Button>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0">
            3
          </Button>
          <Button variant="outline" size="sm">
            <Icon name="caret-right" size={16} />
          </Button>
        </div>
      </div>
    </Card>
  );


  // Activity content
  const ActivityContent = () => (
    <Card>
      <div className="pb-2">
        <Text
          variant="h3"
          className="text-lg font-medium flex items-center gap-2"
        >
          <Icon name="chart" className="w-5 h-5 text-blue-600" />
          Activity Log
        </Text>
      </div>
      <div className="relative pl-6 border-l border-gray-200">
        {Object.entries(
          mockActivity.reduce(
            (groups, activity) => {
              if (!groups[activity.date]) {
                groups[activity.date] = [];
              }
              groups[activity.date].push(activity);
              return groups;
            },
            {} as Record<string, typeof mockActivity>
          )
        ).map(([date, activities]) => (
          <div key={date} className="mb-4">
            <Text weight="medium" className="text-sm text-gray-500 mb-3 -ml-6">
              {date}
            </Text>
            {activities.map(activity => (
              <div key={activity.id} className="relative mb-8">
                <div
                  className={`absolute -left-[29px] w-4 h-4 rounded-full ${getActivityIconColor(activity.type).replace('text-', 'bg-')}`}
                ></div>
                <div className="mb-2">
                  <div className="flex items-center gap-2">
                    <Text weight="medium">{activity.user}</Text>
                    <Text className="text-gray-500">{activity.action}</Text>
                    <Text className="text-xs text-gray-400">
                      {activity.time}
                    </Text>
                  </div>
                  <Text size="sm" className="text-gray-600 mt-1">
                    {activity.details}
                  </Text>
                </div>

                {activity.candidate && (
                  <div className="bg-gray-50 p-3 rounded-md border text-sm">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src=""
                        fallback={activity.candidate.initials}
                        size="sm"
                        className="bg-blue-100 text-blue-600"
                      />
                      <div>
                        <Text weight="medium">{activity.candidate.name}</Text>
                        <Text size="xs" className="text-gray-500">
                          {activity.candidate.experience} •{' '}
                          {activity.candidate.skills.join(', ')}
                        </Text>
                      </div>
                    </div>
                  </div>
                )}

                {activity.statusChange && (
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-100 text-blue-800">
                      {activity.statusChange.from}
                    </Badge>
                    <Icon
                      name="caret-right"
                      size={16}
                      className="text-gray-400"
                    />
                    <Badge className="bg-purple-100 text-purple-800">
                      {activity.statusChange.to}
                    </Badge>
                  </div>
                )}

                {activity.interview && (
                  <div className="bg-gray-50 p-3 rounded-md border text-sm">
                    <div className="flex items-center gap-2">
                      <Icon name="calendar" className="w-4 h-4 text-blue-600" />
                      <Text weight="medium">
                        {activity.interview.date} • {activity.interview.time}
                      </Text>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Icon name="users" className="w-4 h-4 text-gray-500" />
                      <Text>{activity.interview.participants.join(', ')}</Text>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      <Button variant="outline" className="w-full mt-4">
        Load More Activity
      </Button>
    </Card>
  );

  // Sidebar components - Job Owner Card (matching Client Ownership style)
  const JobOwnerCard = () => {
    const assignedToNames = jobData?.assigned_to && jobData.assigned_to.length > 0
      ? jobData.assigned_to.map((person: any) =>
        typeof person === 'string' ? person : person?.name || 'Unknown'
      ).join(', ')
      : 'N/A';

    return (
      <Card
        title="User Information"
        className="w-full text-left relative"
      >
        {/* Edit button positioned absolutely */}
        {canUpdateJobs && (
          <div className="absolute top-4 right-4">
            <Button
              variant="ghost"
              iconOnly
              onClick={() => setShowEditJobOwnerModal(true)}
              title="Edit Information"
            >
              <Icon name="edit" size={16} />
            </Button>
          </div>
        )}

        <div className="mb-2">
          <span className="text-gray-600">Job Owner:</span>{' '}
          {jobData?.job_owner ? (
            <span className="font-bold">{jobData.job_owner}</span>
          ) : (
            <span className="text-gray-500">Not assigned</span>
          )}
        </div>
        {(jobData as any)?.job_owner_phone && (
          <>
            <hr className="my-2" />
            <div className="mb-2">
              <span className="text-gray-600">Phone:</span>{' '}
              <span className="font-bold">{(jobData as any).job_owner_phone}</span>
            </div>
          </>
        )}
        <hr className="my-2" />
        <div className="mb-2">
          <span className="text-gray-600">Assigned To:</span>{' '}
          <span className="font-bold">{assignedToNames}</span>
        </div>

      </Card>
    );
  }

  // Sidebar components - Job Information Card (matching Client Information style)
  const JobInformationCard = () => {
    const client = jobData.client;

    // Format assigned_to names

    return (
      <Card
        title="Client POC Information"
        className="w-full text-left relative"
      >

        <div className="mb-2">
          <span className="text-gray-600">Name:</span>{' '}
          <span className="font-bold">{client?.full_name || 'N/A'}</span>
        </div>
        <hr className="my-2" />
        <div className="mb-2">
          <span className="text-gray-600">Designation:</span>{' '}
          <span className="font-bold">{client?.designation || 'N/A'}</span>
        </div>
        <hr className="my-2" />
        <div className="mb-2">
          <span className="text-gray-600">Department:</span>{' '}
          <span className="font-bold">{client?.department || 'N/A'}</span>
        </div>
        <hr className="my-2" />
        <div className="mb-2">
          <span className="text-gray-600">Phone:</span>{' '}
          <span className="font-bold">{client?.phone || 'N/A'}</span>
        </div>
        <hr className="my-2" />
        <div className="mb-2">
          <span className="text-gray-600">Email:</span>{' '}
          <span className="font-bold">{client?.email || 'N/A'}</span>
        </div>
      </Card>
    );
  };

  // Sidebar component - Candidate Search Card
  const CandidateSearchCard = () => (
    <Card>
      <div className="pb-2">
        <Text
          variant="h3"
          className="text-lg font-medium flex items-center gap-2"
        >
          <Icon name="search" className="w-5 h-5 text-blue-600" />
          Candidate Search
        </Text>
      </div>
      <div className="relative mb-4">
        <Icon
          name="search"
          className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
        />
        <Input
          type="text"
          placeholder="Search candidates..."
          className="w-full pl-10"
        />
      </div>

      <div className="space-y-3">
        <div>
          <Text className="text-sm font-medium text-gray-500 mb-2">
            Key Words
          </Text>
          <div className="flex flex-wrap gap-2">
            {jobData.primary_skill_set?.slice(0, 3).map((skill: string, index: number) => (
              <Badge
                key={index}
                variant="info"
                className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
              >
                {skill}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <Text className="text-sm font-medium text-gray-500 mb-2">
            Generate String by CoPilot
          </Text>
          <button type="button" className="text-blue-600 hover:underline text-sm">
            Generate Search String
          </button>
        </div>

        <hr className="border-gray-200" />

        <div>
          <Text className="text-sm font-medium text-gray-500 mb-2">
            By Job Title
          </Text>
          <Input placeholder={jobData.job_title || "Job Title"} />
        </div>

        <div>
          <Text className="text-sm font-medium text-gray-500 mb-2">
            By Location
          </Text>
          <SelectField
            options={[
              { value: 'any', label: 'Any Location' },
              { value: jobData.job_location || '', label: jobData.job_location || 'Current Location' },
            ]}
            placeholder="Select location"
            value={jobData.job_location || 'any'}
            onChange={() => { }}
          />
        </div>

        <div>
          <Text className="text-sm font-medium text-gray-500 mb-2">
            By End Client
          </Text>
          <SelectField
            options={[
              { value: 'any', label: 'Any Client' },
              { value: jobData.client?.end_client_name || '', label: jobData.client?.end_client_name || 'Current Client' },
            ]}
            placeholder="Select client"
            value={jobData.client?.end_client_name || 'any'}
            onChange={() => { }}
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Text className="text-sm font-medium text-gray-500 mb-2">
              Filters
            </Text>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 p-0 text-blue-600"
              onClick={() => setShowSearchFilters(!showSearchFilters)}
            >
              {showSearchFilters ? 'Hide' : 'Show'}
            </Button>
          </div>

          {showSearchFilters && (
            <div className="space-y-3 mt-2 p-3 bg-gray-50 rounded-md border">
              <div>
                <Text className="text-sm font-medium text-gray-500 mb-1 block">
                  Total Experience
                </Text>
                <SelectField
                  options={[
                    { value: 'any', label: 'Any' },
                    { value: '0-2', label: '0-2 years' },
                    { value: '3-5', label: '3-5 years' },
                    { value: '5-7', label: '5-7 years' },
                    { value: '7+', label: '7+ years' },
                  ]}
                  placeholder="Select experience"
                  value="any"
                  onChange={() => { }}
                />
              </div>

              <div>
                <Text className="text-sm font-medium text-gray-500 mb-1 block">
                  Education
                </Text>
                <SelectField
                  options={[
                    { value: 'any', label: 'Any' },
                    { value: 'bachelors', label: "Bachelor's" },
                    { value: 'masters', label: "Master's" },
                    { value: 'phd', label: 'PhD' },
                  ]}
                  placeholder="Select education"
                  value="any"
                  onChange={() => { }}
                />
              </div>

              <div>
                <Text className="text-sm font-medium text-gray-500 mb-1 block">
                  Certification
                </Text>
                <Input
                  placeholder="Enter certification"
                  value=""
                  onChange={() => { }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <Button className="flex-1" onClick={() => setActiveTab('candidates')}>
          Quick Search
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          onClick={() =>
            navigate(
              `/candidate-search?jobId=${id}&title=${encodeURIComponent(jobData.job_title || '')}&skills=${encodeURIComponent(jobData.primary_skill_set?.join(',') || '')}`
            )
          }
        >
          Advanced Search
        </Button>
      </div>
    </Card>
  );

  // Tab definitions
  const tabs = [
    {
      id: 'details',
      label: 'Job Details',
      content: <RequirementDetailsContent />,
    },
    {
      id: 'description',
      label: 'Job Description',
      content: <JobDescriptionContent />,
    },
    { id: 'candidates', label: 'Candidates', content: <CandidatesContent /> },
    // { id: 'activity', label: 'Activity', content: <ActivityContent /> },
  ];

  return (
    <>
      <DetailTemplate
        breadcrumb={
          <Breadcrumb
            items={[
              { label: 'Home', path: '/' },
              { label: 'Jobs', path: '/jobs' },
              {
                label: `${jobData.job_id || jobData.id} - ${jobData.job_title || 'Untitled Job'}`,
              },
            ]}
            additionalInfo={
              jobData.created_by || jobData.created
                ? `Created By ${getUserDisplayName(jobData.created_by)}${jobData.created ? ` | Created on ${formatUIDate(jobData.created)}` : ''}`
                : undefined
            }
          />
        }
        header={
          <DetailHeader
            name={jobData.job_title}
            code={jobData.job_id}
            subName={jobData.client?.client_requirement_id}
            codeFormat="prefix"
            designation={`${jobData.client?.client_name || 'No Client'}${jobData.client?.associate_msp ? ` (${jobData.client.associate_msp})` : ''}`}
            status={getEffectiveJobStatus(jobData.job_status, jobData.tat)}
            priority={jobData.job_priority}
            contactInfo={{
              location: jobData.job_location || 'N/A'
            }}
            photo={jobData.client?.client_logo || undefined}

            auditInfo={{
              lastUpdatedBy: getUserDisplayName(jobData.updated_by || jobData.created_by),
              lastUpdatedOn: formatUIDate(jobData.updated),
              createdBy: getUserDisplayName(jobData.created_by),
              createdOn: formatUIDate(jobData.created),
            }}
            onEdit={() => setShowEditJobModal(true)}
            canEdit={canUpdateJobs}
            footerActions={
              <>
                <button
                  disabled
                  className="flex items-center gap-1 text-gray-400 cursor-not-allowed"
                >
                  <Icon name="users" size={14} />
                  <Text size="sm">Recommended Candidates ({jobData.no_of_position || 0})</Text>
                </button>
                <button
                  onClick={() => setShowMapApplicantsModal(true)}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <Icon name="plus" size={14} />
                  <Text size="sm">Map Applicant</Text>
                </button>
              </>
            }
          />

        }

        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        sidebar={
          <div className="flex flex-col gap-6 w-full items-stretch">
            <JobOwnerCard />
            <JobInformationCard />
            <CandidateSearchCard />
          </div>
        }
      />

      {/* Edit Job Modal - Header fields (title, status, priority, location) */}
      <EditJobModal
        isOpen={showEditJobModal}
        onClose={() => setShowEditJobModal(false)}
        jobData={{
          job_title: jobData.job_title,
          job_status: jobData.job_status,
          priority: jobData.job_priority,
          job_location: jobData.job_location,
          client: {
            client_name: jobData.client?.client_name,
            end_client_name: jobData.client?.end_client_name,
            client_requirement_id: jobData.client?.client_requirement_id,
            full_name: jobData.client?.full_name,
            phone: jobData.client?.phone,
            email: jobData.client?.email,
            designation: jobData.client?.designation,
            department: jobData.client?.department,
            client_logo: jobData.client?.client_logo,
            associate_msp: jobData.client?.associate_msp,
          },
        }}
        onSave={handleSaveJob}
        isLoading={isSaving}
      />

      {/* Edit Job Details Modal - Job Details and Requirements */}
      <EditJobDetailsModal
        isOpen={showEditDetailsModal}
        onClose={() => setShowEditDetailsModal(false)}
        jobDetails={{
          primary_skill_set: jobData.primary_skill_set,
          skill_category: jobData.skill_category,
          secondary_skill_set: jobData.secondary_skill_set,
          total_experience: jobData.total_experience,
          relevant_experience: jobData.relevant_experience,
          preferred_job: jobData.preferred_job,
          job_open_type: jobData.job_open_type,
          bgc_type: jobData.bgc_type,
          client_bill_rate: jobData.client_bill_rate,
          client_bill_period: jobData.client_bill_period,
          no_of_position: jobData.no_of_position,
          end_client_name: jobData.client?.end_client_name,
          degree: jobData.education_criteria || jobData.degree,
          subject: jobData.subject,
          certification: jobData.certification,
          shifts: jobData.shifts,
          gender_preference: jobData.gender_preference,
          submission_limit: jobData.submission_limit,
          tat: jobData.tat ?? undefined,
          diversity_hiring: jobData.diversity_hiring,
          industry: jobData.industry,
        }}
        onSave={handleSaveDetails}
        isLoading={isSaving}
      />

      <EditJobDescriptionModal
        isOpen={showEditDescriptionModal}
        onClose={() => setShowEditDescriptionModal(false)}
        jobDescription={{
          job_description: jobData.job_description,
          pdf_upload: jobData.pdf_upload,
        }}
        onSave={handleSaveDescription}
        isLoading={isSaving}
      />

      <EditJobCommentsModal
        isOpen={showEditCommentsModal}
        onClose={() => setShowEditCommentsModal(false)}
        comments={jobData.comments || []}
        onSave={handleSaveComments}
        isLoading={isSaving}
      />

      <EditJobOwnerModal
        isOpen={showEditJobOwnerModal}
        onClose={() => setShowEditJobOwnerModal(false)}
        jobOwnerData={{
          assigned_to: jobData.assigned_to,
          job_owner: jobData.job_owner,
        }}
        onSave={handleSaveJobOwner}
        isLoading={isSaving}
      />

      <MapCandidateModal
        isOpen={showMapCandidateModal}
        onClose={() => setShowMapCandidateModal(false)}
        jobId={id}
        jobTitle={jobData.job_title}
        onMapCandidates={handleMapCandidates}
      />

      <MapApplicantsModal
        isOpen={showMapApplicantsModal}
        onClose={() => setShowMapApplicantsModal(false)}
        jobId={id || ''}
        job_id={jobData.job_id}
        jobTitle={jobData.job_title}
        onMapped={handleMapCandidates}
      />
    </>
  );
};

export default JobDetails;
