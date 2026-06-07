import React, { useState, useRef, useEffect } from 'react';
import DetailTemplate from '../../templates/DetailTemplate';
import Text from '../../atoms/Text';
import Icon from '../../atoms/Icon';
import EditModal from '../../molecules/EditModal/EditModal';
import { AsyncSelectOption } from '../../atoms/AsyncSelect/AsyncSelect';
import AccessDenied from '../../molecules/AccessDenied/AccessDenied';
import { useParams } from 'react-router-dom';
import { CandidateData } from '../../../types/candidate';
import { API_ENDPOINTS, useSWR } from '../../../utils/api';
import { getSimpleFlagColor } from '../../../utils/flagColors';
import {
  useDropdownData,
  useSkillsDropdown,
  useInstitutionsDropdown,
  useUniversitiesDropdown,
  useCollegesDropdown,
  useDegreesDropdown,
  useSubjectsDropdown,
  useCustomersDropdown,
  useProjectTypesDropdown,
  useEmployersDropdown,
  useStaticDropdowns,
  useEducationTypesDropdown,
  useIndustryDropdown,
  useDesignationsDropdown,
} from '../../../hooks/useDropdowns';
import { usePermissions } from '../../../hooks/usePermissions';
import { showErrorToast, showWarningToast } from '../../../utils/toast';
import {
  getApplicantData,
  transformEducationData,
  transformEmploymentData,
  transformProjectsData,
  transformCertificationsData,
  transformDocumentsData,
  prepareHeaderFormData,
  prepareProfessionalFormData,
  prepareSkillsFormData,
  prepareBulkEmploymentFormData,
  prepareBulkEducationFormData,
  prepareBulkProjectsFormData,
  prepareBulkCertificationsFormData,
  prepareBulkDocumentsFormData,
} from './helper';
import { handleSaveEdit, handleSaveAdd, getErrorMessage } from './api';
import { EducationTab } from './tabs/EducationTab';
import { EmploymentTab } from './tabs/EmploymentTab';
import { AppliedJobsTab } from './tabs/AppliedJobsTab';
import {
  ProjectsTab,
  CertificationsTab,
  DocumentsTab,
} from './tabs/ProjectsTab';
import Breadcrumb from '../../organisms/BreadCrumb';
import DetailHeader from '../../organisms/DetailHeader';
import ProfileSummary from '../../molecules/ProfileSummary';
import ProfessionalDetails from '../../organisms/ProfessionalDetails';
import SkillMetrics from '../../organisms/SkillMetrics';
import { HeaderForm } from './modals/HeaderForm';
import { ProfessionalDetailsForm } from './modals/ProfessionalDetailsForm';
import { ProfileSummaryForm } from './modals/ProfileSummaryForm';
import { SkillsForm } from './modals/SkillsForm';
import { BulkEmploymentForm } from './modals/BulkEmploymentForm';
import { BulkEducationForm } from './modals/BulkEducationForm';
import { BulkProjectsForm } from './modals/BulkProjectsForm';
import { BulkCertificationsForm } from './modals/BulkCertificationsForm';
import { BulkDocumentsForm } from './modals/BulkDocumentsForm';
import { useAuth } from '../../auth/AuthContext';
import { formatUIDate } from '../../../utils/dateFormat';
import FileUploadService from '../../../services/fileUploadService';
import MapJobsToCandidateModal from '../../components/modals/MapJobsToCandidateModal';
const ApplicantDetailPage: React.FC = () => {
  // All hooks must be at the top level, before any conditionals or functions
  const headerFormRef = useRef<any>(null);
  const professionalFormRef = useRef<any>(null);
  const profileSummaryFormRef = useRef<any>(null);
  const skillsFormRef = useRef<any>(null);
  const bulkEmploymentFormRef = useRef<any>(null);
  const bulkEducationFormRef = useRef<any>(null);
  const bulkProjectsFormRef = useRef<any>(null);
  const bulkDocumentsFormRef = useRef<any>(null);
  const { id: candidateId } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('education');
  const [educationSearch, setEducationSearch] = useState('');
  const [employmentSearch, setEmploymentSearch] = useState('');
  const [projectsSearch, setProjectsSearch] = useState('');
  const [certificationsSearch, setCertificationsSearch] = useState('');
  const [documentsSearch, setDocumentsSearch] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [uploadInProgress, setUploadInProgress] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState<string | null>(null);
  const [addLoading, setAddLoading] = useState(false);
  const [editFormData, setEditFormData] = useState<any>(null);
  const [addFormData, setAddFormData] = useState<any>(null);
  const [photoViewUrl, setPhotoViewUrl] = useState<string | undefined>(undefined);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { canReadCandidates, canUpdateCandidates, canDeleteCandidates } =
    usePermissions();
  const { user } = useAuth();

  const {
    noticePeriodOptions,
    preferredJobOptions,
    jobOpenTypeOptions,
    jobTypeOptions,
    shiftsOptions,
    loading: staticDropdownsLoading,
    error: staticDropdownsError,
  } = useStaticDropdowns();

  const { options: degreeOptions, loading: degreeLoading } =
    useDegreesDropdown();
  const { options: subjectOptions, loading: subjectLoading } =
    useSubjectsDropdown();
  const {
    options: collegeOptions,
    loading: collegeLoading,
    search: searchCollege,
  } = useCollegesDropdown();
  const {
    options: universityOptions,
    loading: universityLoading,
    search: searchUniversity,
  } = useUniversitiesDropdown();
  const {
    options: designationOptions,
    loading: designationLoading,
    search: searchDesignations,
  } = useDesignationsDropdown();

  // Convert dropdown options to AsyncSelectOption format
  const designationAsyncOptions: AsyncSelectOption[] = designationOptions.map(
    option => ({
      value:
        typeof option.value === 'string'
          ? option.value
          : (option.value as any)?.id ||
          (option.value as any)?.name ||
          option.value,
      label:
        typeof option.label === 'string'
          ? option.label
          : (option.label as any)?.name ||
          (option.label as any)?.id ||
          option.label,
    })
  );

  // Create options with placeholder for job preference (preferred job field)
  const jobPreferenceSelectOptions = [
    { id: '', value: '', label: 'Select preferred job' },
    ...preferredJobOptions,
  ];

  const jobTypeSelectOptions = [
    { id: '', value: '', label: 'Select job preference' },
    ...jobTypeOptions,
  ];

  // Dropdown hooks - moved most to end of component for better organization
  const { options: jobPreferenceOptions, loading: jobPreferenceLoading } =
    useDropdownData('jobPreference');
  const {
    options: educationTypeOptions,
    loading: educationTypeLoading,
    search: searchEducationType,
  } = useEducationTypesDropdown();
  const {
    options: skillsOptions,
    loading: skillsLoading,
    search: searchSkills,
  } = useSkillsDropdown();
  const {
    options: institutionsOptions,
    loading: institutionsLoading,
    search: searchInstitutions,
  } = useInstitutionsDropdown();
  const {
    options: customerOptions,
    loading: customerLoading,
    search: searchCustomers,
  } = useCustomersDropdown();
  const {
    options: projectTypeOptions,
    loading: projectTypeLoading,
    search: searchProjectTypes,
  } = useProjectTypesDropdown();
  const {
    options: employersOptions,
    loading: employersLoading,
    search: searchEmployers,
  } = useEmployersDropdown();

  const {
    options: industryOptions,
    loading: industryLoading,
    search: searchIndustries,
  } = useIndustryDropdown();

  const {
    options: careerBreakTypeOptions,
    loading: careerBreakTypeLoading,
  } = useDropdownData('careerBreakType');

  const {
    data: candidateData,
    error,
    loading,
    mutate: mutateCandidateData,
  } = useSWR<CandidateData>(
    candidateId
      ? `${API_ENDPOINTS.CANDIDATES.GET(candidateId)}${user?.id ? `?user_id=${user.id}` : ''}`
      : null
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setActiveDropdown(null);
      }
    }

    if (activeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeDropdown]);

// Wait for data to be ready

  // Fetch secure photo URL for detail header
  useEffect(() => {
    const fetchPhotoUrl = async () => {
      const picturePath = candidateData?.candidate_picture;
      if (picturePath) {
        try {
          const secureUrl = await FileUploadService.getFileViewUrl(picturePath);
          setPhotoViewUrl(secureUrl);
        } catch (error) {
          console.error('Error fetching secure photo URL:', error);
          setPhotoViewUrl(undefined);
        }
      } else {
        setPhotoViewUrl(undefined);
      }
    };

    fetchPhotoUrl();
  }, [candidateData?.candidate_picture]);

  useEffect(() => {
    if (editModalOpen === 'header' && editFormData) {
      const { first_name, middle_name, last_name } = editFormData;
      if (first_name || middle_name || last_name) {
        const displayName = [first_name, middle_name, last_name]
          .filter((name: string) => name && name.trim())
          .join(' ')
          .trim();
        setEditFormData((prev: any) => ({
          ...prev,
          display_name: displayName,
        }));
      }
    }
  }, [
    editModalOpen,
    editFormData?.first_name,
    editFormData?.middle_name,
    editFormData?.last_name,
  ]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Text className="text-lg">Loading candidate details...</Text>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Text className="text-lg text-red-600">
          Error loading candidate details: {error.message}
        </Text>
      </div>
    );
  }

  if (!candidateData) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Text className="text-lg">Candidate not found</Text>
      </div>
    );
  }

  const applicantData = getApplicantData(candidateData);
  const educationData = transformEducationData(candidateData);
  const employmentData = transformEmploymentData(candidateData);
  const projectsData = transformProjectsData(candidateData);
  const certificationsData = transformCertificationsData(candidateData);
  const documentsData = transformDocumentsData(candidateData);

  // Event handlers
  const handleEditHeader = () => {
    if (!canUpdateCandidates) return;
    setEditFormData(prepareHeaderFormData(candidateData, applicantData));
    setEditModalOpen('header');
  };

  const handleEditProfessional = () => {
    if (!canUpdateCandidates) return;
    setEditFormData(prepareProfessionalFormData(applicantData, candidateData));
    setEditModalOpen('professional');
  };

  const handleEditSkills = () => {
    if (!canUpdateCandidates) return;
    setEditFormData(prepareSkillsFormData(applicantData));
    setEditModalOpen('skills');
  };

  const handleEditSummary = () => {
    if (!canUpdateCandidates) return;
    setEditModalOpen('profile');
    setEditFormData({
      profileSummary: applicantData.profile_summary || '',
    });
  };

  const handleFavorite = () => {
    // TODO: Implement favorite toggle
  };

  const handleViewResume = () => {
    if (applicantData.resume_url) {
      FileUploadService.openFile(applicantData.resume_url, 'view');
    }
  };

  const handleCreateResume = () => {
    // TODO: Implement resume creation
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(null);
    setEditFormData(null);
    setEditLoading(false);
  };

  const handleCloseAddModal = () => {
    setAddModalOpen(null);
    setAddFormData(null);
    setAddLoading(false);
  };

  const handleSaveEditAction = async () => {
    if (!canUpdateCandidates || !candidateData || !editFormData) return;

    // If editing header, validate all fields before saving
    if (editModalOpen === 'header' && headerFormRef.current) {
      const isValid = headerFormRef.current.validateAllFields();
      if (!isValid) {
        showWarningToast('Please fix validation errors before saving.');
        return;
      }
    }

    // If editing professional details, validate all fields before saving
    if (editModalOpen === 'professional' && professionalFormRef.current) {
      const isValid = professionalFormRef.current.validateAllFields();
      if (!isValid) {
        showWarningToast('Please fix validation errors before saving.');
        return;
      }
    }

    // If editing profile summary, validate all fields before saving
    if (editModalOpen === 'profile' && profileSummaryFormRef.current) {
      const isValid = profileSummaryFormRef.current.validateAllFields();
      if (!isValid) {
        showWarningToast('Please fix validation errors before saving.');
        return;
      }
    }

    // If editing skills, validate all fields before saving
    if (editModalOpen === 'skills' && skillsFormRef.current) {
      const isValid = skillsFormRef.current.validateAllFields();
      // Check if no skills exist (either skill metrics OR primary skills)
      const hasSkillMetrics = editFormData.skills && editFormData.skills.length > 0;
      const hasPrimarySkills = editFormData.primary_skill && editFormData.primary_skill.trim().length > 0;
      if (!hasSkillMetrics && !hasPrimarySkills) {
        showWarningToast('Please add at least one primary skill or skill metric before saving.');
        return;
      }
      if (!isValid) {
        showWarningToast('Please fix validation errors before saving.');
        return;
      }
    }

    if (editModalOpen === 'bulk-employment' && bulkEmploymentFormRef.current) {
      const isValid = bulkEmploymentFormRef.current.validateAllFields();
      if (!isValid) {
        showWarningToast('Please fix validation errors before saving.');
        return;
      }
    }

    if (editModalOpen === 'bulk-education' && bulkEducationFormRef.current) {
      const isValid = bulkEducationFormRef.current.validateAllFields();
      if (!isValid) {
        return;
      }
    }

    if (editModalOpen === 'bulk-projects' && bulkProjectsFormRef.current) {
      const isValid = bulkProjectsFormRef.current.validateAllFields();
      if (!isValid) {
        showWarningToast('Please fix validation errors before saving.');
        return;
      }
    }

    if (editModalOpen === 'bulk-documents' && bulkDocumentsFormRef.current) {
      const isValid = bulkDocumentsFormRef.current.validateAllFields();
      if (!isValid) {
        showWarningToast('Please fix validation errors before saving.');
        return;
      }
    }

    // Unfocus any active element before executing
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    setEditLoading(true);
    try {
      const updateId = candidateData.id || candidateId;
      if (!updateId) throw new Error('No valid candidate ID found');

      console.log(
        'Starting save edit for:',
        editModalOpen,
        'with data:',
        editFormData
      );

      await handleSaveEdit({
        candidateId: String(updateId),
        editModalOpen,
        editFormData,
        mutateCandidateData,
        candidateData,
        updated_by: user?.display_name,
      });

      handleCloseEditModal();
    } catch (error) {
      console.error('Error saving changes:', error);
      showErrorToast(getErrorMessage(editModalOpen || ''));
    } finally {
      setEditLoading(false);
    }
  };

  const handleSaveAddAction = async () => {
    if (!canUpdateCandidates || !candidateData || !addFormData) return;

    setAddLoading(true);
    try {
      const updateId = candidateData.id || candidateId;
      if (!updateId) throw new Error('No valid candidate ID found');

      await handleSaveAdd({
        candidateId: String(updateId),
        addModalOpen,
        addFormData,
        mutateCandidateData,
      });

      handleCloseAddModal();
    } catch (error) {
      console.error('Error adding item:', error);
      showErrorToast(getErrorMessage(addModalOpen || ''));
    } finally {
      setAddLoading(false);
    }
  };

  const handleViewFile = (fileUrl: string) => {
    if (fileUrl && fileUrl.trim()) {
      FileUploadService.openFile(fileUrl, 'view');
    } else {
      showWarningToast('No document URL available');
    }
  };

  const filterEducationData = (
    data: typeof educationData,
    searchTerm: string
  ) => {
    if (!searchTerm) return data;
    return data.filter(
      (item: any) =>
        item.highestDegree.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.college.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.university.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.yearOfPassing.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filterEmploymentData = (
    data: typeof employmentData,
    searchTerm: string
  ) => {
    if (!searchTerm) return data;
    return data.filter(
      (item: any) =>
        item.organizationName
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        item.jobType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.payrollOrganization
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        item.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.fromTo.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filterProjectsData = (
    data: typeof projectsData,
    searchTerm: string
  ) => {
    if (!searchTerm) return data;
    return data.filter(
      (item: any) =>
        item.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.projectType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.organizationName
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        item.fromTo.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filterCertificationsData = (
    data: typeof certificationsData,
    searchTerm: string
  ) => {
    if (!searchTerm) return data;
    return data.filter(
      (item: any) =>
        item.certificationName
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        item.issuedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.issueDate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.expiryDate.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filterDocumentsData = (
    data: typeof documentsData,
    searchTerm: string
  ) => {
    if (!searchTerm) return data;
    return data.filter(
      (item: any) =>
        item.documentType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.documentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.documentDate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.expiryDate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.documentFile_url || '')
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
    );
  };

  const tabContent = {
    education: (
      <EducationTab
        educationData={educationData}
        educationSearch={educationSearch}
        setEducationSearch={setEducationSearch}
        canUpdateCandidates={canUpdateCandidates}
        handleEditEducation={() => {
          if (!canUpdateCandidates) return;
          setEditFormData(prepareBulkEducationFormData(educationData));
          setEditModalOpen('bulk-education');
        }}
        filterEducationData={filterEducationData}
      />
    ),
    employment: (
      <EmploymentTab
        employmentData={employmentData}
        employmentSearch={employmentSearch}
        setEmploymentSearch={setEmploymentSearch}
        canUpdateCandidates={canUpdateCandidates}
        handleEditEmployment={() => {
          if (!canUpdateCandidates) return;
          setEditFormData(prepareBulkEmploymentFormData(employmentData));
          setEditModalOpen('bulk-employment');
        }}
        filterEmploymentData={filterEmploymentData}
      />
    ),
    projects: (
      <ProjectsTab
        projectsData={projectsData}
        projectsSearch={projectsSearch}
        setProjectsSearch={setProjectsSearch}
        canUpdateCandidates={canUpdateCandidates}
        handleEditProject={() => {
          if (!canUpdateCandidates) return;
          setEditFormData(prepareBulkProjectsFormData(projectsData));
          setEditModalOpen('bulk-projects');
        }}
        filterProjectsData={filterProjectsData}
      />
    ),
    certifications: (
      <CertificationsTab
        certificationsData={certificationsData}
        certificationsSearch={certificationsSearch}
        setCertificationsSearch={setCertificationsSearch}
        canUpdateCandidates={canUpdateCandidates}
        handleEditCertification={() => {
          if (!canUpdateCandidates) return;
          setEditFormData(
            prepareBulkCertificationsFormData(certificationsData)
          );
          setEditModalOpen('bulk-certifications');
        }}
        filterCertificationsData={filterCertificationsData}
      />
    ),
    documents: (
      <DocumentsTab
        documentsData={documentsData}
        documentsSearch={documentsSearch}
        setDocumentsSearch={setDocumentsSearch}
        canUpdateCandidates={canUpdateCandidates}
        handleEditDocument={() => {
          if (!canUpdateCandidates) return;
          setEditFormData(prepareBulkDocumentsFormData(documentsData));
          setEditModalOpen('bulk-documents');
        }}
        handleViewFile={handleViewFile}
        filterDocumentsData={filterDocumentsData}
      />
    ),
    appliedJobs: (
      <AppliedJobsTab 
        candidateId={applicantData.candidate_id || candidateId || ''} 
        onAddJob={() => setIsMapModalOpen(true)}
        canUpdate={canUpdateCandidates}
      />
    ),
  };

  const tabs = [
    {
      id: 'education',
      label: 'Education',
      content: tabContent.education,
      badge: educationData.length,
    },
    {
      id: 'employment',
      label: 'Employment',
      content: tabContent.employment,
      badge: employmentData.length,
    },
    {
      id: 'projects',
      label: 'Projects',
      content: tabContent.projects,
      badge: projectsData.length,
    },
    {
      id: 'certifications',
      label: 'Certifications',
      content: tabContent.certifications,
      badge: certificationsData.length,
    },
    {
      id: 'documents',
      label: 'Documents',
      content: tabContent.documents,
      badge: documentsData.length,
    },
    {
      id: 'appliedJobs',
      label: 'Applied Jobs',
      content: tabContent.appliedJobs,
    },
  ];

  // Check if user has read access
  if (!canReadCandidates) {
    return <AccessDenied />;
  }
  return (
    <>
      <DetailTemplate
        breadcrumb={
          <Breadcrumb
            items={[
              { label: 'Home', path: '/' },
              { label: 'Applicants', path: '/applicants' },
              {
                label: `${applicantData.display_name} (${applicantData.candidate_id})`,
                active: true,
              },
            ]}
            additionalInfo={
              applicantData.created_by || applicantData.created
                ? `Created By ${applicantData.created_by || 'Unknown'}${applicantData.created ? ` | Created on ${formatUIDate(applicantData.created)}` : ''}`
                : undefined
            }
          />
        }
        profileSummary={
          <ProfileSummary
            candidate={{
              profileSummary: applicantData.profile_summary || '',
            }}
            canEdit={canUpdateCandidates}
            onEdit={handleEditSummary}
          />
        }
        header={
          <DetailHeader
            name={applicantData.display_name}
            code={applicantData.candidate_id}
            designation={applicantData.designation || ''}
            contactInfo={{
              phone: applicantData.phone,
              email: applicantData.email,
              dob: applicantData.date_of_birth,
              panNo: applicantData.pan_number,
              uanNo: applicantData.uan_number,
            }}
            linkedinProfile={applicantData.linkedin_profile}
            isActivelyLooking={applicantData.actively_looking}
            flag={applicantData.flag}
            flagColor={getSimpleFlagColor(applicantData.flag)}
            photo={photoViewUrl || applicantData.candidate_picture}
            auditInfo={{
              lastViewedBy: applicantData.last_viewed_by,
              lastViewedOn: applicantData.last_viewed_date,
              lastUpdatedBy: applicantData.updated_by,
              lastUpdatedOn: formatUIDate(applicantData.updated),
              createdBy: applicantData.created_by,
              createdOn: applicantData.created
                ? formatUIDate(applicantData.created)
                : undefined,
            }}
            onEdit={handleEditHeader}
            onViewResume={handleViewResume}
            onCreateResume={handleCreateResume}
            canEdit={canUpdateCandidates}
            resumeUrl={applicantData.resume_url ?? undefined}
            footerActions={
              <button 
                onClick={() => setIsMapModalOpen(true)}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline transition-colors"
              >
                <Icon name="plus" size={12} />
                <Text size="xs">Add Job</Text>
              </button>
            }
          />
        }
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        sidebar={
          <div className="space-y-6">
            <ProfessionalDetails
              data={applicantData}
              onEdit={handleEditProfessional}
              canEdit={canUpdateCandidates}
            />
            <SkillMetrics
              skills={applicantData.skills || []}
              primarySkills={applicantData.primary_skill}
              additionalSkills={applicantData.additional_skill}
              skillCategory={applicantData.skill_category}
              onEdit={handleEditSkills}
              canEdit={canUpdateCandidates}
            />
          </div>
        }
      />

      {/* Modals */}
      <EditModal
        isOpen={editModalOpen === 'profile'}
        onClose={handleCloseEditModal}
        title="Edit Profile Summary"
        isLoading={editLoading}
        onSave={handleSaveEditAction}
        size="lg"
      >
        <ProfileSummaryForm
          ref={profileSummaryFormRef}
          initialData={{
            profileSummary: applicantData.profile_summary || '',
          }}
          onDataChange={setEditFormData}
        />
      </EditModal>

      <EditModal
        isOpen={editModalOpen === 'header'}
        onClose={handleCloseEditModal}
        title="Edit Candidate Information"
        isLoading={editLoading || uploadInProgress}
        onSave={handleSaveEditAction}
        size="xl"
      >
        {editFormData && (
          <HeaderForm
            ref={headerFormRef}
            initialData={editFormData}
            onDataChange={setEditFormData}
            designationAsyncOptions={designationAsyncOptions}
            designationLoading={designationLoading}
            applicantData={applicantData}
            onUploadStateChange={setEditLoading}
            searchDesignations={searchDesignations}
          />
        )}
      </EditModal>

      <EditModal
        isOpen={editModalOpen === 'professional'}
        onClose={handleCloseEditModal}
        title="Edit Professional Details"
        isLoading={editLoading}
        onSave={handleSaveEditAction}
        size="xl"
      >
        {editFormData && (
          <ProfessionalDetailsForm
            ref={professionalFormRef}
            initialData={editFormData}
            onDataChange={setEditFormData}
            noticePeriodOptions={noticePeriodOptions}
            jobOpenTypeOptions={jobOpenTypeOptions}
            shiftsOptions={shiftsOptions}
            jobPreferenceSelectOptions={jobPreferenceSelectOptions}
            jobTypeSelectOptions={jobTypeSelectOptions}
            staticDropdownsLoading={staticDropdownsLoading}
            careerBreakTypeOptions={careerBreakTypeOptions}
            careerBreakTypeLoading={careerBreakTypeLoading}
          />
        )}
      </EditModal>

      <EditModal
        isOpen={editModalOpen === 'skills'}
        onClose={handleCloseEditModal}
        title="Edit Skills"
        isLoading={editLoading}
        onSave={handleSaveEditAction}
        size="xl"
      >
        <SkillsForm
          ref={skillsFormRef}
          initialData={editFormData}
          onDataChange={setEditFormData}
          skillsOptions={skillsOptions}
          skillsLoading={skillsLoading}
          onSkillSearch={searchSkills}
          canUpdateCandidates={canUpdateCandidates}
          canDeleteCandidates={canDeleteCandidates}
          dateOfBirth={applicantData.date_of_birth}
        />
      </EditModal>

      <EditModal
        isOpen={editModalOpen === 'bulk-education'}
        onClose={handleCloseEditModal}
        title="Manage Education"
        isLoading={editLoading}
        onSave={handleSaveEditAction}
        size="xl"
      >
        <BulkEducationForm
          ref={bulkEducationFormRef}
          initialData={editFormData}
          onDataChange={setEditFormData}
          degreeOptions={degreeOptions}
          degreeLoading={degreeLoading}
          subjectOptions={subjectOptions}
          subjectLoading={subjectLoading}
          collegeOptions={collegeOptions}
          collegeLoading={collegeLoading}
          universityOptions={universityOptions}
          universityLoading={universityLoading}
          educationTypeOptions={educationTypeOptions}
          educationTypeLoading={educationTypeLoading}
          canUpdateCandidates={canUpdateCandidates}
          canDeleteCandidates={canDeleteCandidates}
          searchEducationType={searchEducationType}
          searchCollege={searchCollege}
          searchUniversity={searchUniversity}
        />
      </EditModal>

      <EditModal
        isOpen={editModalOpen === 'bulk-employment'}
        onClose={handleCloseEditModal}
        title="Manage Employment"
        isLoading={editLoading}
        onSave={handleSaveEditAction}
        size="xl"
      >
        <BulkEmploymentForm
          ref={bulkEmploymentFormRef}
          initialData={editFormData}
          onDataChange={setEditFormData}
          canUpdateCandidates={canUpdateCandidates}
          canDeleteCandidates={canDeleteCandidates}
        />
      </EditModal>

      <EditModal
        isOpen={editModalOpen === 'bulk-projects'}
        onClose={handleCloseEditModal}
        title="Manage Projects"
        isLoading={editLoading}
        onSave={handleSaveEditAction}
        size="xl"
      >
        <BulkProjectsForm
          ref={bulkProjectsFormRef}
          initialData={editFormData}
          onDataChange={setEditFormData}
          canUpdateCandidates={canUpdateCandidates}
          canDeleteCandidates={canDeleteCandidates}
          candidateId={candidateId}
          employmentData={employmentData}
        />
      </EditModal>

      <EditModal
        isOpen={editModalOpen === 'bulk-certifications'}
        onClose={handleCloseEditModal}
        title="Manage Certifications"
        isLoading={editLoading}
        onSave={handleSaveEditAction}
        size="xl"
      >
        <BulkCertificationsForm
          initialData={editFormData}
          onDataChange={setEditFormData}
          canUpdateCandidates={canUpdateCandidates}
          canDeleteCandidates={canDeleteCandidates}
          institutionOptions={institutionsOptions}
          institutionLoading={institutionsLoading}
          onInstitutionSearch={searchInstitutions}
        />
      </EditModal>

      <EditModal
        isOpen={editModalOpen === 'bulk-documents'}
        onClose={handleCloseEditModal}
        title="Manage Documents"
        isLoading={editLoading}
        onSave={handleSaveEditAction}
        size="xl"
      >
        <BulkDocumentsForm
          ref={bulkDocumentsFormRef}
          initialData={editFormData}
          onDataChange={setEditFormData}
          canUpdateCandidates={canUpdateCandidates}
          canDeleteCandidates={canDeleteCandidates}
        />
      </EditModal>

      {/* Map Job Modal */}
      {isMapModalOpen && (
        <MapJobsToCandidateModal
          isOpen={isMapModalOpen}
          candidateId={String(candidateData?.id || candidateId)}
          candidateHumanId={applicantData.candidate_id}
          candidateName={applicantData.display_name}
          onClose={() => setIsMapModalOpen(false)}
          onMapped={() => mutateCandidateData()}
        />
      )}

      <EditModal
        isOpen={
          editModalOpen === 'edit-document' || addModalOpen === 'document'
        }
        onClose={editModalOpen ? handleCloseEditModal : handleCloseAddModal}
        title={editModalOpen ? 'Edit Document' : 'Add Document'}
        isLoading={editModalOpen ? editLoading : addLoading}
        onSave={editModalOpen ? handleSaveEditAction : handleSaveAddAction}
        size="lg"
      >
        <BulkDocumentsForm
          initialData={editModalOpen ? editFormData : addFormData}
          onDataChange={editModalOpen ? setEditFormData : setAddFormData}
        />
      </EditModal>
    </>
  );
};

export default ApplicantDetailPage;
