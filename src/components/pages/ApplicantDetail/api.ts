import { candidateUpdateAPI } from '../../../utils/api';
import { Country, State } from 'country-state-city';
import {
  transformEmploymentForAPI,
  transformProjectForAPI,
  transformCertificationForAPI,
  transformDocumentForAPI,
  transformEducationForAPI,
  transformSkillForAPI,
} from '../../../utils/apiDataTransform';

// Helper function to extract name from dropdown objects (for labels/names)
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

// Helper function to extract array names from dropdown objects
const extractArrayNames = (field: any): string[] => {
  if (!field) return [];
  if (Array.isArray(field)) {
    return field.map(item => extractName(item));
  }
  return [extractName(field)];
};

export interface SaveEditParams {
  candidateId: string;
  editModalOpen: string | null;
  editFormData: any;
  mutateCandidateData: () => Promise<any>;
  candidateData?: any;
  updated_by?: string;
}

export interface SaveAddParams {
  candidateId: string;
  addModalOpen: string | null;
  addFormData: any;
  mutateCandidateData: () => Promise<any>;
}

/**
 * Handles saving edits for different sections
 */
export const handleSaveEdit = async ({
  candidateId,
  editModalOpen,
  editFormData,
  mutateCandidateData,
  candidateData,
  updated_by,
}: SaveEditParams): Promise<void> => {
  if (!candidateId || !editFormData) {
    throw new Error('Missing required parameters for saving edit');
  }

  const updateId = candidateId;

  switch (editModalOpen) {
    case 'profile':
      await candidateUpdateAPI.updateProfileSummary(String(updateId), {
        profile_summary: editFormData.profileSummary,
        updated_by: updated_by,
      });
      break;

    case 'professional':
      // Extract array values using extractArrayNames for multi-select fields
      // Exclude shift from spread to avoid sending both shift and shifts
      const { shift, ...restProfessionalData } = editFormData;
      const professionalData = {
        ...restProfessionalData,
        current_city: editFormData.current_location, // Map current_location to current_city for API
        preferred_job: extractArrayNames(editFormData.preferred_job),
        job_preference: extractArrayNames(editFormData.job_preference),
        job_open_type: extractArrayNames(editFormData.job_open_type),
        shifts: extractArrayNames(shift),
        // Include source_details for source_type and source_name updates
        source_details: {
          ...(candidateData?.source_details || {}),
          source_type: editFormData.source_type || '',
          source_name: editFormData.source_name || '',
        },
        updated_by: updated_by,
      };
      await candidateUpdateAPI.updateProfessionalDetails(
        String(updateId),
        professionalData
      );
      break;

    case 'header':
      const headerData: any = {
        first_name: editFormData.first_name,
        middle_name: editFormData.middle_name,
        last_name: editFormData.last_name,
        display_name: editFormData.display_name,
        email: editFormData.email,
        phone: editFormData.phone ? parseInt(editFormData.phone, 10) : null,
        alt_phone: editFormData.alternative_phone ? parseInt(editFormData.alternative_phone, 10) : null,
        alt_email: editFormData.alternative_email || '',
        current_address: editFormData.current_address || '',
        date_of_birth: editFormData.date_of_birth,
        pan_number: editFormData.pan_number,
        uan_number: editFormData.uan_number,
        linkedin_profile: editFormData.linkedin_profile,
        designation: editFormData.designation,
      };

      // Handle country/state/city conversion from ISO codes to names
      if (editFormData.country) {
        const countryObj = Country.getCountryByCode(editFormData.country);
        headerData.current_country = countryObj?.name || editFormData.country;
      }

      if (editFormData.state && editFormData.country) {
        const statesArray = State.getStatesOfCountry(editFormData.country);
        const stateObj = statesArray?.find((s: any) => s.isoCode === editFormData.state);
        headerData.current_state = stateObj?.name || editFormData.state;
      }

      if (editFormData.city) {
        headerData.current_city = editFormData.city;
      }

      // Handle designation: Update in employment array with robust logic
      if (
        editFormData.designation &&
        candidateData?.employment &&
        Array.isArray(candidateData.employment) &&
        candidateData.employment.length > 0
      ) {
        // Find which employment record to update:
        // 1. First try to find explicit current job
        let targetIndex = candidateData.employment.findIndex(
          (emp: any) => emp.is_current_job === true
        );

        // 2. If not found, find most recent employment by date (same logic as prepareHeaderFormData)
        if (targetIndex === -1) {
          const withDates = candidateData.employment
            .map((emp: any, idx: number) => {
              const rawTo = emp.to_date || emp.to || '';
              const rawFrom = emp.from_date || emp.from || '';
              const dateStr = rawTo && rawTo.toString().trim() !== '' ? rawTo : rawFrom;
              const parsed = dateStr ? new Date(dateStr) : null;
              const time = parsed && !isNaN(parsed.getTime()) ? parsed.getTime() : null;
              return { idx, time };
            })
            .filter((x: any) => x.time !== null);

          if (withDates.length > 0) {
            withDates.sort((a: any, b: any) => b.time - a.time);
            targetIndex = withDates[0].idx;
          } else {
            // Fallback to first record if no dates available
            targetIndex = 0;
          }
        }

        // Update the identified employment record
        const updatedEmployment = candidateData.employment.map(
          (emp: any, idx: number) => {
            if (idx === targetIndex) {
              return {
                ...emp,
                designation: editFormData.designation,
              };
            }
            return emp;
          }
        );

        // Add employment array to headerData
        headerData.employment = updatedEmployment;
      }

      // Handle profile picture - use pre-uploaded URL or handle removal
      if (editFormData.profile_picture_url) {
        // Use the URL from immediate upload (already uploaded in HeaderForm)
        headerData.candidate_picture = editFormData.profile_picture_url;
      } else if (editFormData.profile_picture_removed) {
        headerData.candidate_picture = null;
      }

      // Handle resume - use pre-uploaded URL and text_cv
      if (editFormData.resume_url) {
        // Use the URL from immediate upload (already uploaded in HeaderForm)
        headerData.resume_url = editFormData.resume_url;

        // Include text_cv if available (extracted from resume during upload)
        if (editFormData.text_cv) {
          headerData.text_cv = editFormData.text_cv;
        }
      }

      // Handle source_details for flags (and is_actively_looking if present)
      if (
        typeof editFormData.is_actively_looking === 'boolean' ||
        editFormData.flag
      ) {
        headerData.source_details = {
          ...(candidateData?.source_details || {}),
          is_actively_looking:
            typeof editFormData.is_actively_looking === 'boolean'
              ? editFormData.is_actively_looking
              : candidateData?.source_details?.is_actively_looking || false,
          flags: editFormData.flag ? [editFormData.flag] : candidateData?.source_details?.flags || [],
        };
      }

      // Note: No need to upload here as HeaderForm handles immediate upload

      // Add updated_by to headerData
      if (updated_by) {
        headerData.updated_by = updated_by;
      }

      await candidateUpdateAPI.updateHeader(String(updateId), headerData);
      break;

    case 'skills':
      // Transform skills data to match API expected format
      // Note: Backend expects categories at top-level, so we strip them from metrics
      const transformedSkills = editFormData.skills.map((skill: any) => ({
        skill_name: skill.skill_name || '',
        expertise:
          typeof skill.expertise === 'object' && skill.expertise
            ? skill.expertise.value
            : skill.expertise,
        rating: skill.rating ? parseInt(String(skill.rating), 10) : null,
        experience: skill.experience ? parseFloat(String(skill.experience)) : null,
      }));

      // Extract all unique categories from skill rows (preserving IDs)
      const categoriesMap = new Map<string, { id: string; name: string }>();
      editFormData.skills.forEach((s: any) => {
        if (!s.skill_category) return;
        const name = typeof s.skill_category === 'object' ? s.skill_category.name : s.skill_category;
        const id = typeof s.skill_category === 'object' ? s.skill_category.id : '';

        // Prioritize entries with IDs if possible
        if (name && (!categoriesMap.has(name) || id)) {
          categoriesMap.set(name, { id: id || '', name });
        }
      });

      const skillCategory = categoriesMap.size > 0
        ? Array.from(categoriesMap.values())
        : undefined;

      await candidateUpdateAPI.updateSkills(
        String(updateId),
        transformedSkills,
        editFormData.primary_skill
          ? editFormData.primary_skill
            .split(',')
            .map((s: string) => s.trim())
            .filter(Boolean)
          : [],
        editFormData.additional_skill || '',
        skillCategory,
        updated_by
      );
      break;

    case 'edit-education':
      const educationData = {
        id: editFormData.id,
        education_type: editFormData.educationType,
        highest_degree: editFormData.highestDegree,
        subject: Array.isArray(editFormData.subject) ? editFormData.subject : editFormData.subject ? [editFormData.subject] : [],
        college: editFormData.college,
        university: editFormData.university,
        gpa: editFormData.gpa ? parseFloat(editFormData.gpa) : null,
        year_of_passing: editFormData.yearOfPassing
          ? parseInt(editFormData.yearOfPassing)
          : null,
        is_pursuing: editFormData.isPursuing,
        updated_by: updated_by,
      };
      await candidateUpdateAPI.updateEducation(String(updateId), educationData);
      break;

    case 'edit-employment':
      const employmentData = {
        id: editFormData.id,
        organization_name: editFormData.organizationName,
        job_type: editFormData.jobType,
        payroll_organization: editFormData.payrollOrganization || null,
        designation: editFormData.designation,
        location: editFormData.location,
        from_date: editFormData.fromDate,
        to_date: editFormData.toDate || null,
        is_current_job: editFormData.isCurrentJob,
        updated_by: updated_by,
      };
      await candidateUpdateAPI.updateEmployment(
        String(updateId),
        employmentData
      );
      break;

    case 'edit-project':
      const projectData = {
        id: editFormData.id,
        customer_name: editFormData.customerName,
        project_type: editFormData.projectType,
        designation: editFormData.designation,
        organization_name: editFormData.organizationName,
        industry: editFormData.industry,
        from_date: editFormData.fromDate,
        to_date: editFormData.toDate || null,
        current_project: editFormData.isCurrentProject || false,
        updated_by: updated_by,
      }; await candidateUpdateAPI.updateProject(String(updateId), projectData);
      break;

    case 'edit-certification':
      const certificationData = {
        id: editFormData.id,
        certification_name: editFormData.certificationName,
        institution_name: editFormData.institutionName,
        certification_number: editFormData.certificationNo,
        certification_date: editFormData.certificationDate,
        valid_until_date: editFormData.validUntil || null,
        updated_by: updated_by,
      };
      await candidateUpdateAPI.updateCertification(
        String(updateId),
        certificationData
      );
      break;

    case 'edit-document':
      const documentData = {
        document_name: editFormData.documentType,
        document_number: editFormData.documentNumber,
        document_date: editFormData.documentDate,
        expiry_date: editFormData.expiryDate || null,
        document_url:
          editFormData.documentFile_url || editFormData.documentUrl || null,
        updated_by: updated_by,
      };
      await candidateUpdateAPI.updateDocument(String(updateId), documentData);
      break;

    case 'bulk-education':
      // Update all education records as an array
      if (editFormData.education && Array.isArray(editFormData.education)) {
        // Transform data to match API expectations
        // Note: The form stores IDs but API expects names, so we need to convert
        const educationArray = editFormData.education.map((education: any) => {
          // Extract year value if it's an object
          const yearValue =
            typeof education.yearOfPassing === 'object' &&
              education.yearOfPassing?.value
              ? education.yearOfPassing.value
              : education.yearOfPassing;

          return {
            id: education.id,
            education_type:
              education.educationTypeName || education.educationType || '',
            highest_degree:
              education.highestDegreeName || education.highestDegree,
            subject: Array.isArray(education.subjectName)
              ? education.subjectName
              : Array.isArray(education.subject)
                ? education.subject
                : typeof (education.subjectName || education.subject) === 'string' && (education.subjectName || education.subject)
                  ? [(education.subjectName || education.subject)]
                  : [],
            college: education.collegeName || education.college,
            university: education.universityName || education.university,
            gpa: education.gpa ? parseFloat(education.gpa) : null,
            year_of_passing: yearValue ? parseInt(yearValue) : null,
            is_pursuing:
              education.isPursuing === 'Yes' || education.isPursuing === true,
          };
        });
        // Update all education records at once
        await candidateUpdateAPI.updateBulkEducation(
          String(updateId),
          educationArray,
          updated_by
        );
      }
      break;

    case 'bulk-employment':
      // Update all employment records as an array
      if (editFormData.employment && Array.isArray(editFormData.employment)) {
        // Transform data to match API expectations using the transform function
        const employmentArray = editFormData.employment.map(transformEmploymentForAPI);
        // Update all employment records at once
        await candidateUpdateAPI.updateBulkEmployment(
          String(updateId),
          employmentArray,
          updated_by
        );
      }
      break;

    case 'bulk-projects':
      // Update all project records as an array
      if (editFormData.projects && Array.isArray(editFormData.projects)) {
        // Transform data to match API expectations using the transform function
        const projectsArray = editFormData.projects.map(transformProjectForAPI);
        // Update all project records at once
        await candidateUpdateAPI.updateBulkProjects(
          String(updateId),
          projectsArray,
          updated_by
        );
      }
      break;

    case 'bulk-certifications':
      // Update all certification records as an array
      if (
        editFormData.certifications &&
        Array.isArray(editFormData.certifications)
      ) {
        // Transform data to match API expectations
        const certificationsArray = editFormData.certifications.map(
          (certification: any) => ({
            id: certification.id,
            certification_name: certification.certificationName,
            institution_name: certification.issuingOrganization,
            certification_number: certification.credentialId,
            certification_date: certification.dateObtained,
            valid_until_date: certification.expiryDate || null,
            // Note: credentialUrl is not supported by API
          })
        );
        // Update all certification records at once
        await candidateUpdateAPI.updateBulkCertifications(
          String(updateId),
          certificationsArray,
          updated_by
        );
      }
      break;

    case 'bulk-documents':
      // Update all document records as an array
      if (editFormData.documents && Array.isArray(editFormData.documents)) {
        // Transform data to match API expectations
        const documentsArray = editFormData.documents.map((document: any) => ({
          document_name: document.documentType, // Map documentType to document_name
          document_number: document.documentNumber,
          document_date: document.documentDate,
          expiry_date: document.expiryDate || null,
          document_url:
            document.documentFile_url || document.documentUrl || null,
        }));
        // Update all document records at once
        await candidateUpdateAPI.updateBulkDocuments(
          String(updateId),
          documentsArray,
          updated_by
        );
      }
      break;

    default:
      throw new Error(`Unknown edit modal type: ${editModalOpen}`);
  }

  console.log('About to call mutateCandidateData...');
  try {
    await mutateCandidateData();
    console.log('mutateCandidateData called successfully');
  } catch (mutationError) {
    console.error('Error during mutation:', mutationError);
    // Still re-throw to let the calling function handle it
    throw mutationError;
  }
};

/**
 * Handles saving new items for different sections
 */
export const handleSaveAdd = async ({
  candidateId,
  addModalOpen,
  addFormData,
  mutateCandidateData,
}: SaveAddParams): Promise<void> => {
  if (!candidateId || !addFormData) {
    throw new Error('Missing required parameters for saving add');
  }

  const updateId = candidateId;

  switch (addModalOpen) {
    case 'education':
      // TODO: Implement add education API when available
      console.log('Adding education:', addFormData);
      break;

    case 'employment':
      // TODO: Implement add employment API when available
      console.log('Adding employment:', addFormData);
      break;

    case 'project':
      // TODO: Implement add project API when available
      console.log('Adding project:', addFormData);
      break;

    case 'certification':
      // TODO: Implement add certification API when available
      console.log('Adding certification:', addFormData);
      break;

    case 'document':
      // TODO: Implement add document API when available
      console.log('Adding document:', addFormData);
      break;

    default:
      throw new Error(`Unknown add modal type: ${addModalOpen}`);
  }

  await mutateCandidateData();
};

/**
 * Handles deletion operations for different sections
 */
export const handleDelete = async (
  section:
    | 'education'
    | 'employment'
    | 'project'
    | 'certification'
    | 'document',
  id: string,
  mutateCandidateData: () => Promise<any>
): Promise<void> => {
  switch (section) {
    case 'education':
      // TODO: Implement delete education API when available
      console.log('Delete education not implemented yet:', id);
      break;

    case 'employment':
      // TODO: Implement delete employment API when available
      console.log('Delete employment not implemented yet:', id);
      break;

    case 'project':
      // TODO: Implement delete project API when available
      console.log('Delete project not implemented yet:', id);
      break;

    case 'certification':
      // TODO: Implement delete certification API when available
      console.log('Delete certification not implemented yet:', id);
      break;

    case 'document':
      // TODO: Implement delete document API when available
      console.log('Delete document not implemented yet:', id);
      break;

    default:
      throw new Error(`Unknown section for deletion: ${section}`);
  }

  await mutateCandidateData();
};

/**
 * Gets success message based on operation type
 */
export const getSuccessMessage = (modalType: string): string => {
  const messageMap: Record<string, string> = {
    profile: 'Profile summary updated successfully',
    professional: 'Professional details updated successfully',
    header: 'Personal information updated successfully',
    skills: 'Skills updated successfully',
    'edit-education': 'Education record updated successfully',
    'edit-employment': 'Employment record updated successfully',
    'edit-project': 'Project record updated successfully',
    'edit-certification': 'Certification record updated successfully',
    'edit-document': 'Document record updated successfully',
    'bulk-education': 'Education records updated successfully',
    'bulk-employment': 'Employment records updated successfully',
    'bulk-projects': 'Project records updated successfully',
    'bulk-certifications': 'Certification records updated successfully',
    'bulk-documents': 'Document records updated successfully',
    education: 'Education record added successfully',
    employment: 'Employment record added successfully',
    project: 'Project added successfully',
    certification: 'Certification added successfully',
    document: 'Document added successfully',
  };

  return messageMap[modalType] || 'Successfully updated candidate data';
};

/**
 * Gets error message based on operation type
 */
export const getErrorMessage = (modalType: string): string => {
  const messageMap: Record<string, string> = {
    profile: 'Failed to update profile summary. Please try again.',
    professional: 'Failed to update professional details. Please try again.',
    header: 'Failed to update personal information. Please try again.',
    skills: 'Failed to update skills. Please try again.',
    'edit-education': 'Failed to update education record. Please try again.',
    'edit-employment': 'Failed to update employment record. Please try again.',
    'edit-project': 'Failed to update project record. Please try again.',
    'edit-certification':
      'Failed to update certification record. Please try again.',
    'edit-document': 'Failed to update document record. Please try again.',
    'bulk-education': 'Failed to update education records. Please try again.',
    'bulk-employment': 'Failed to update employment records. Please try again.',
    'bulk-projects': 'Failed to update project records. Please try again.',
    'bulk-certifications':
      'Failed to update certification records. Please try again.',
    'bulk-documents': 'Failed to update document records. Please try again.',
    education: 'Failed to add education record. Please try again.',
    employment: 'Failed to add employment record. Please try again.',
    project: 'Failed to add project. Please try again.',
    certification: 'Failed to add certification. Please try again.',
    document: 'Failed to add document. Please try again.',
  };

  return messageMap[modalType] || 'Failed to save changes. Please try again.';
};
