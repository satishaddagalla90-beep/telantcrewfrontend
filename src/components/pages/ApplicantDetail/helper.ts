import { CandidateData } from '../../../types';
import { capitalizeAndSafe, safeValue } from '../../../utils/textUtils';
import { AsyncSelectOption } from '../../atoms/AsyncSelect/AsyncSelect';
import { Country, State, } from 'country-state-city';

// Helper function to extract designation string from either string or object
const getDesignationString = (designation: any): string => {
  if (!designation) return '';
  if (typeof designation === 'string') return designation;
  if (typeof designation === 'object' && designation.name)
    return designation.name;
  if (
    typeof designation === 'object' &&
    designation.label &&
    designation.label.name
  )
    return designation.label.name;
  return '';
};

// Data transformation functions
export const transformEducationData = (candidateData: CandidateData) => {
  return (
    candidateData.education?.map((edu: any, index: number) => ({
      id: edu.id || `edu-${index}`,
      educationType: capitalizeAndSafe(edu.education_type) || 'Not specified',
      highestDegree: capitalizeAndSafe(edu.highest_degree) || 'Not specified',
      subject: Array.isArray(edu.subject)
        ? edu.subject.map((s: string) => capitalizeAndSafe(s))
        : capitalizeAndSafe(edu.subject) || 'Not specified',
      college: capitalizeAndSafe(edu.college) || 'Not specified',
      university: capitalizeAndSafe(edu.university) || 'Not specified',
      gpa: safeValue(edu.gpa?.toString(), ''),
      yearOfPassing: safeValue(edu.year_of_passing?.toString(), ''),
      isPursuing: edu.is_pursuing ? 'Yes' : 'No',
    })) || []
  );
};

export const transformEmploymentData = (candidateData: CandidateData) => {
  const list =
    candidateData.employment?.map((emp: any, index: number) => {
      // Normalize organization_name: could be array or string
      let orgName = emp.organization_name;
      if (Array.isArray(orgName)) {
        orgName = orgName[0];
      }

      const fromTs = toTimestamp(emp.from_date || emp.to_date || '');
      const isCurrentJob = !!emp.is_current_job;

      return {
        id: emp.id || `emp-${index}`,
        organizationName:
          capitalizeAndSafe(orgName) || 'Not specified',
        jobType: capitalizeAndSafe(emp.job_type) || 'Not specified',
        payrollOrganization:
          capitalizeAndSafe(emp.payroll_organization) || 'Not specified',
        designation:
          capitalizeAndSafe(getDesignationString(emp.designation)) ||
          'Not specified',
        location: capitalizeAndSafe(emp.location) || 'Not specified',
        fromTo: `${formatDisplayDate(emp.from_date)} - ${emp.is_current_job ? 'Present' : formatDisplayDate(emp.to_date)}`,
        projects:
          emp.projects?.map((proj: any, projIndex: number) => ({
            id: proj.id || `proj-${index}-${projIndex}`,
            customerName:
              capitalizeAndSafe(proj.customer_name) || 'Not specified',
            projectType: capitalizeAndSafe(proj.project_type) || 'Not specified',
            fromTo: `${formatDisplayDate(proj.from_date)} - ${proj.to_date ? formatDisplayDate(proj.to_date) : 'Present'}`,
          })) || [],
        _sortFrom: fromTs,
        _isCurrentJob: isCurrentJob,
      };
    }) || [];

  // Sort by start date (latest first) with current jobs first
  const sorted = [...list].sort((a, b) => {
    if (a._isCurrentJob && !b._isCurrentJob) return -1;
    if (!a._isCurrentJob && b._isCurrentJob) return 1;
    return b._sortFrom - a._sortFrom;
  });

  // Strip helper fields before returning
  return sorted.map(({ _sortFrom, _isCurrentJob, ...rest }) => rest);
};

export const transformProjectsData = (candidateData: CandidateData) => {
  const list =
    candidateData.projects?.map((proj: any, index: number) => {
      const fromTs = toTimestamp(proj.from_date || proj.to_date || '');
      const isCurrentProject = !proj.to_date;

      return {
        id: proj.id || `proj-${index}`,
        customerName: capitalizeAndSafe(proj.customer_name) || 'Not specified',
        industry: capitalizeAndSafe(proj.industry) || 'Not specified',
        projectType: capitalizeAndSafe(proj.project_type) || 'Not specified',
        organizationName:
          capitalizeAndSafe(proj.organization_name) || 'Not specified',
        designation:
          capitalizeAndSafe(getDesignationString(proj.designation)) ||
          'Not specified',
        fromTo: `${formatDisplayDate(proj.from_date)} - ${proj.to_date ? formatDisplayDate(proj.to_date) : 'Present'}`,
        isCurrentProject,
        _sortFrom: fromTs,
        _isCurrentProject: isCurrentProject,
      };
    }) || [];

  const sorted = [...list].sort((a, b) => {
    if (a._isCurrentProject && !b._isCurrentProject) return 1;
    if (!a._isCurrentProject && b._isCurrentProject) return -1;
    return b._sortFrom - a._sortFrom;
  });

  return sorted.map(({ _sortFrom, _isCurrentProject, ...rest }) => rest);
};

// Normalize a date string into a comparable timestamp (supports MM/YYYY, YYYY-MM, YYYY-MM-DD)
const toTimestamp = (dateStr: string | null | undefined): number => {
  if (!dateStr) return 0;

  // Handle MM/YYYY by converting to YYYY-MM-01
  const mmYYYY = dateStr.match(/^(\d{1,2})\/(\d{4})$/);
  if (mmYYYY) {
    const month = mmYYYY[1].padStart(2, '0');
    const year = mmYYYY[2];
    return new Date(`${year}-${month}-01`).getTime() || 0;
  }

  // Handle YYYY-MM by appending day
  const yyyyMM = dateStr.match(/^(\d{4})-(\d{1,2})$/);
  if (yyyyMM) {
    const year = yyyyMM[1];
    const month = yyyyMM[2].padStart(2, '0');
    return new Date(`${year}-${month}-01`).getTime() || 0;
  }

  // Fallback to native parsing
  return new Date(dateStr).getTime() || 0;
};

// Helper function to format dates for display in MM/YYYY format
const formatDisplayDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return 'Unknown';

  // Handle MM/YYYY format directly
  if (dateStr.match(/^\d{1,2}\/\d{4}$/)) {
    const [month, year] = dateStr.split('/');
    return `${month.padStart(2, '0')}/${year}`;
  }

  // Handle YYYY-MM format (convert to MM/YYYY)
  const yearMonthMatch = dateStr.match(/^(\d{4})-(\d{1,2})$/);
  if (yearMonthMatch) {
    const year = yearMonthMatch[1];
    const month = yearMonthMatch[2].padStart(2, '0');
    return `${month}/${year}`;
  }

  // Handle YYYY-MM-DD format (convert to MM/YYYY)
  const fullDateMatch = dateStr.match(/^(\d{4})-(\d{1,2})-\d{1,2}$/);
  if (fullDateMatch) {
    const year = fullDateMatch[1];
    const month = fullDateMatch[2].padStart(2, '0');
    return `${month}/${year}`;
  }

  // Handle other formats if needed
  return safeValue(dateStr, 'Unknown');
};

export const transformCertificationsData = (candidateData: CandidateData) => {
  const list =
    candidateData.certifications?.map((cert: any, index: number) => ({
      id: cert.id || `cert-${index}`,
      certificationName:
        capitalizeAndSafe(cert.certification_name) || 'Not specified',
      issuingOrganization:
        capitalizeAndSafe(cert.institution_name) || 'Not specified',
      dateObtained: safeValue(cert.certification_date, ''),
      expiryDate: safeValue(cert.valid_until_date, ''),
      credentialId: safeValue(cert.certification_number, ''),
      _sortDate: toTimestamp(cert.certification_date),
    })) || [];

  const sorted = [...list].sort((a, b) => b._sortDate - a._sortDate);

  return sorted.map(({ _sortDate, ...rest }) => rest);
};

export const transformDocumentsData = (candidateData: CandidateData) => {
  return (
    candidateData.documents?.map((doc: any, index: number) => ({
      id: doc.id || `doc-${index}`,
      documentType: capitalizeAndSafe(doc.document_name) || 'Not specified',
      documentNumber: safeValue(doc.document_number, ''),
      documentDate: safeValue(doc.document_date, ''),
      expiryDate: safeValue(doc.expiry_date, ''),
      documentFile: null, // File object, will be null for existing items
      documentFile_url: doc.document_url || null, // URL from server
    })) || []
  );
};

// Option transformation functions
export const getDesignationOptionFromValue = (
  value: string | any,
  designationOptions: AsyncSelectOption[]
): AsyncSelectOption | null => {
  if (!value) return null;

  console.log('Raw designation value received:', value, 'Type:', typeof value);

  // Extract string value from potential object
  const stringValue = getDesignationString(value);
  if (!stringValue) {
    console.log('No valid string value extracted from designation');
    return null;
  }

  console.log('Finding designation for extracted string value:', stringValue);
  console.log('Available designation options:', designationOptions);

  // First try to find by label (name) for display preference
  const byLabel = designationOptions.find(option => {
    const label =
      typeof option.label === 'string'
        ? option.label
        : (option.label as { name: string })?.name;
    console.log('Comparing with label:', label);
    return label?.toLowerCase() === stringValue.toLowerCase();
  });
  if (byLabel) {
    console.log('Found designation by label:', byLabel);
    // Return normalized option with string values
    const normalizedOption = {
      value:
        typeof byLabel.value === 'string'
          ? byLabel.value
          : (byLabel.value as any)?.id ||
          (byLabel.value as any)?.name ||
          byLabel.value,
      label:
        typeof byLabel.label === 'string'
          ? byLabel.label
          : (byLabel.label as any)?.name ||
          (byLabel.label as any)?.id ||
          byLabel.label,
    };
    console.log('Returning normalized option:', normalizedOption);
    return normalizedOption;
  }

  // Try to find by value (id) for exact match
  const byValue = designationOptions.find(option => {
    const optionValue =
      typeof option.value === 'string'
        ? option.value
        : (option.value as { id: string })?.id;
    return optionValue === stringValue;
  });
  if (byValue) {
    console.log('Found designation by value:', byValue);
    // Return normalized option with string values
    const normalizedOption = {
      value:
        typeof byValue.value === 'string'
          ? byValue.value
          : (byValue.value as any)?.id ||
          (byValue.value as any)?.name ||
          byValue.value,
      label:
        typeof byValue.label === 'string'
          ? byValue.label
          : (byValue.label as any)?.name ||
          (byValue.label as any)?.id ||
          byValue.label,
    };
    console.log('Returning normalized option:', normalizedOption);
    return normalizedOption;
  }

  // If no exact match found, create a custom option with the value as both value and label
  console.log('Creating custom designation option for:', stringValue);
  return { value: stringValue, label: stringValue };
};

export const getCustomerOptionFromValue = (
  value: string,
  customerOptions: any[]
) => {
  if (!value) return null;
  const option = customerOptions.find(opt => opt.value === value);
  return option
    ? { value: option.value, label: option.label }
    : { value, label: value };
};

export const getProjectTypeOptionFromValue = (
  value: string,
  projectTypeOptions: any[]
) => {
  if (!value) return null;
  const option = projectTypeOptions.find(opt => opt.value === value);
  return option
    ? { value: option.value, label: option.label }
    : { value, label: value };
};

export const getEmployerOptionFromValue = (
  value: string,
  employersOptions: any[]
) => {
  if (!value) return null;
  const option = employersOptions.find(opt => opt.value === value);
  return option
    ? { value: option.value, label: option.label }
    : { value, label: value };
};

// Filter functions
export const filterEducationData = (data: any[], searchTerm: string) => {
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

export const filterEmploymentData = (data: any[], searchTerm: string) => {
  if (!searchTerm) return data;
  return data.filter(
    (item: any) =>
      item.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.jobType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.payrollOrganization
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      item.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.fromTo.toLowerCase().includes(searchTerm.toLowerCase())
  );
};

export const filterProjectsData = (data: any[], searchTerm: string) => {
  if (!searchTerm) return data;
  return data.filter(
    (item: any) =>
      item.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.projectType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.fromTo.toLowerCase().includes(searchTerm.toLowerCase())
  );
};

export const filterCertificationsData = (data: any[], searchTerm: string) => {
  if (!searchTerm) return data;
  return data.filter(
    (item: any) =>
      item.certificationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.issuedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.issueDate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.expiryDate.toLowerCase().includes(searchTerm.toLowerCase())
  );
};

export const filterDocumentsData = (data: any[], searchTerm: string) => {
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

// Form data preparation functions
export const prepareHeaderFormData = (
  candidateData: CandidateData,
  applicantData: any
) => {
  // Get designation from current job (same logic as getApplicantData)
  const getCurrentDesignation = (): string => {
    if (candidateData.employment && candidateData.employment.length > 0) {
      // 1) Prefer explicit current job flag
      const currentJob = candidateData.employment.find(
        emp => emp.is_current_job === true
      );
      if (currentJob && currentJob.designation) {
        return getDesignationString(currentJob.designation);
      }

      // 2) No explicit current job — pick the most recent past employment
      // based on `to_date` (or `from_date` if `to_date` missing).
      const withDates = candidateData.employment
        .map((emp: any) => {
          const rawTo = emp.to_date || emp.to || '';
          const rawFrom = emp.from_date || emp.from || '';
          const dateStr = rawTo && rawTo.toString().trim() !== '' ? rawTo : rawFrom;
          const parsed = dateStr ? new Date(dateStr) : null;
          const time = parsed && !isNaN(parsed.getTime()) ? parsed.getTime() : null;
          return { emp, time };
        })
        .filter((x: any) => x.time !== null);

      if (withDates.length > 0) {
        withDates.sort((a: any, b: any) => b.time - a.time);
        const latest = withDates[0].emp;
        if (latest && latest.designation) {
          return getDesignationString(latest.designation);
        }
      }

      // 3) As a last-resort fallback pick the first employment record's designation
      const firstEmp = candidateData.employment[0];
      if (firstEmp && firstEmp.designation) {
        return getDesignationString(firstEmp.designation);
      }
    }

    // Fallback to current_organisation if no employment info found
    return candidateData.current_organisation || '';
  };

  // Get flag from source_details (first flag in the array)
  const getFlagFromSourceDetails = (): string => {
    if (
      candidateData.source_details?.flags &&
      candidateData.source_details.flags.length > 0
    ) {
      return candidateData.source_details.flags[0];
    }
    return '';
  };

  // Convert country and state names to ISO codes for the form
  const countryInput = candidateData.current_country || '';
  const foundCountry = Country.getAllCountries().find(
    c => c.name.toLowerCase() === countryInput.toLowerCase() || c.isoCode === countryInput
  );
  const countryIso = foundCountry ? foundCountry.isoCode : countryInput;

  const stateInput = candidateData.current_state || '';
  let stateIso = stateInput;
  if (countryIso) {
    const states = State.getStatesOfCountry(countryIso);
    const foundState = states.find(
      s => s.name.toLowerCase() === stateInput.toLowerCase() || s.isoCode === stateInput
    );
    stateIso = foundState ? foundState.isoCode : stateInput;
  }

  return {
    first_name: candidateData.first_name || '',
    middle_name: (candidateData as any).middle_name || '',
    last_name: candidateData.last_name || '',
    display_name: applicantData.display_name || '',
    candidate_id: candidateData.candidate_id || '',
    phone: candidateData.phone?.toString() || '',
    email: candidateData.email || '',
    alternative_phone: (candidateData as any).alt_phone?.toString() || '',
    alternative_email: (candidateData as any).alt_email || '',
    current_address: (candidateData as any).current_address || '',
    country: countryIso,
    state: stateIso,
    city:
      candidateData.current_city ||
      extractCityFromLocation(candidateData.current_location || '') ||
      '',
    designation: getCurrentDesignation(),
    date_of_birth: candidateData.date_of_birth || '',
    linkedin_profile: candidateData.linkedin_profile || '',
    pan_number: (() => {
      const panDoc = candidateData.documents?.find(
        (doc: any) => (doc.document_name || doc.documentType) === 'PAN Card'
      );
      if (panDoc && panDoc.document_number && panDoc.document_number.trim() !== '') {
        return panDoc.document_number;
      }
      return candidateData.pan_number || '';
    })(),
    uan_number: candidateData.uan_number || '',
    profile_picture: null,
    profile_picture_removed: false,
    resume: null,
    is_actively_looking:
      candidateData.source_details?.is_actively_looking || false,
    flag: getFlagFromSourceDetails(), // Add flag field
  };
};

export const prepareProfessionalFormData = (
  applicantData: any,
  candidateData?: any
) => {
  // Keep preferred_locations as the original string format for easier backend handling
  let preferred_location_string = '';
  if (candidateData?.preferred_location) {
    preferred_location_string = candidateData.preferred_location;
  } else if (Array.isArray(applicantData.preferred_location)) {
    // Convert parsed array back to string format
    preferred_location_string = applicantData.preferred_location
      .map((loc: any) => loc.label || loc.value || loc)
      .join(', ');
  }

  return {
    total_experience: applicantData.total_experience || '',
    relevant_experience: applicantData.relevant_experience || '',
    current_ctc: applicantData.current_ctc || '',
    expected_ctc: applicantData.expected_ctc || '',
    current_location: applicantData.current_city || candidateData?.current_city || '',
    preferred_location: preferred_location_string,
    notice_period: applicantData.notice_period || '',
    job_open_type: applicantData.job_open_type || '',
    preferred_job:
      typeof applicantData.preferred_job === 'object' &&
        applicantData.preferred_job
        ? (applicantData.preferred_job.value || '').toLowerCase()
        : (applicantData.preferred_job || '').toLowerCase(),
    job_preference:
      typeof applicantData.job_preference === 'object' &&
        applicantData.job_preference
        ? applicantData.job_preference.value || ''
        : applicantData.job_preference || '',
    shift: applicantData.shift || '',
    source_type: candidateData?.source_details?.source_type || applicantData.source_type || '',
    source_name: candidateData?.source_details?.source_name || applicantData.source_name || '',
    career_break: candidateData?.career_break || '',
    career_break_type: candidateData?.career_break_type || '',
    duration: candidateData?.duration || [],
    differently_abled: candidateData?.differently_abled || '',
    differently_abled_type: candidateData?.differently_abled_type || '',
  };
};

export const prepareSkillsFormData = (applicantData: any) => {
  return {
    skills: applicantData.skills.map((skill: any) => ({
      skill_name: skill.skill_name || skill.name || '',
      expertise: skill.expertise || skill.skill_expertise || skill.level || '',
      rating: skill.rating || '3',
      experience: skill.experience || skill.years || 0,
      skill_category: skill.skill_category || null,
    })),
    primary_skill: applicantData.primary_skill || '',
    additional_skill: applicantData.additional_skill || '',
  };
};

export const prepareBulkEmploymentFormData = (employmentData: any[]) => {
  return {
    employment: employmentData.map((employment: any) => ({
      id: employment.id,
      organizationName: employment.organizationName || '',
      jobType: employment.jobType || '',
      payrollOrganization: employment.payrollOrganization || '',
      designation: getDesignationString(employment.designation) || '',
      location: employment.location || '',
      country: '',
      state: '',
      city: '',
      fromDate: employment.from_date
        ? parseDateForForm(employment.from_date)
        : employment.fromTo
          ? parseDateForForm(employment.fromTo.split(' - ')[0])
          : '',
      toDate: employment.to_date
        ? parseDateForForm(employment.to_date)
        : employment.fromTo && employment.fromTo.split(' - ')[1] !== 'Present'
          ? parseDateForForm(employment.fromTo.split(' - ')[1])
          : '',
      isCurrentJob: employment.is_current_job !== undefined
        ? employment.is_current_job
        : employment.fromTo
          ? employment.fromTo.includes('Present')
          : false,
    })),
  };
};

export const prepareBulkEducationFormData = (educationData: any[]) => {
  return {
    education: educationData.map((education: any) => ({
      id: education.id,
      educationType: education.educationType || '',
      educationTypeName: education.educationType || '', // Store name for API
      highestDegree: education.highestDegree || '',
      highestDegreeName: education.highestDegree || '', // Store name for API
      subject: Array.isArray(education.subject) ? education.subject : [],
      subjectName: Array.isArray(education.subject) ? education.subject : [], // Store name for API
      college: education.college || '',
      collegeName: education.college || '', // Store name for API
      university: education.university || '',
      universityName: education.university || '', // Store name for API
      gpa: education.gpa || '',
      yearOfPassing: education.yearOfPassing || '',
      isPursuing: education.isPursuing === 'Yes',
    })),
  };
};

export const prepareBulkProjectsFormData = (projectsData: any[]) => {
  return {
    projects: projectsData.map((project: any) => ({
      id: project.id,
      customerName: project.customerName || '',
      projectType: project.projectType || '',
      designation: getDesignationString(project.designation) || '',
      organizationName: project.organizationName || '',
      industry: project.industry || '',
      fromDate: project.from_date
        ? parseDateForForm(project.from_date)
        : parseDateForForm(project.fromTo ? project.fromTo.split(' - ')[0] : ''),
      toDate: project.to_date
        ? parseDateForForm(project.to_date)
        : parseDateForForm(
          project.fromTo && project.fromTo.split(' - ')[1] !== 'Present'
            ? project.fromTo.split(' - ')[1]
            : ''
        ),
      isCurrentProject: project.current_project !== undefined
        ? project.current_project
        : project.isCurrentProject || (project.fromTo
          ? project.fromTo.includes('Present')
          : false),
    })),
  };
};

// Helper function to parse dates for form inputs (convert display format to input format)
const parseDateForForm = (dateStr: string): string => {
  if (!dateStr || dateStr === 'Unknown') return '';

  // Handle MM/YYYY format (convert to YYYY-MM)
  const mmYyyyMatch = dateStr.match(/^(\d{1,2})\/(\d{4})$/);
  if (mmYyyyMatch) {
    const month = mmYyyyMatch[1].padStart(2, '0');
    const year = mmYyyyMatch[2];
    return `${year}-${month}`;
  }

  // Handle yyyy-mm format directly
  if (dateStr.match(/^\d{4}-\d{2}$/)) {
    return dateStr; // Already in correct format for month input
  }

  // Handle other formats if needed
  return dateStr;
};

export const prepareBulkCertificationsFormData = (
  certificationsData: any[]
) => {
  return {
    certifications: certificationsData.map((certification: any) => ({
      id: certification.id,
      certificationName: certification.certificationName || '',
      issuingOrganization: certification.issuingOrganization || '',
      dateObtained: certification.dateObtained || '',
      expiryDate: certification.expiryDate || '',
      credentialId: certification.credentialId || '',
    })),
  };
};

export const prepareBulkDocumentsFormData = (documentsData: any[]) => {
  return {
    documents: documentsData.map((document: any) => ({
      id: document.id,
      documentType: document.documentType || '',
      documentNumber: document.documentNumber || '',
      documentDate: document.documentDate || '',
      expiryDate: document.expiryDate || '',
      documentFile: null, // File object, will be null for existing items
      documentFile_url:
        document.document_url ||
        document.documentUrl ||
        document.documentFile_url ||
        null,
    })),
  };
};

export const prepareEducationFormData = (educationItem: any) => {
  return {
    id: educationItem.id,
    educationType: educationItem.educationType || '',
    highestDegree: educationItem.highestDegree || '',
    subject: educationItem.subject || '',
    college: educationItem.college || '',
    university: educationItem.university || '',
    gpa: educationItem.gpa || '',
    yearOfPassing: educationItem.yearOfPassing || '',
    isPursuing: educationItem.isPursuing === 'Yes',
  };
};

export const prepareEmploymentFormData = (employmentItem: any) => {
  return {
    id: employmentItem.id,
    organizationName: employmentItem.organizationName || '',
    jobType: employmentItem.jobType || '',
    payrollOrganization: employmentItem.payrollOrganization || '',
    designation: getDesignationString(employmentItem.designation) || '',
    location: employmentItem.location || '',
    country: '',
    state: '',
    city: '',
    fromDate: employmentItem.from_date
      ? parseDateForForm(employmentItem.from_date)
      : employmentItem.fromTo
        ? parseDateForForm(employmentItem.fromTo.split(' - ')[0])
        : '',
    toDate: employmentItem.to_date
      ? parseDateForForm(employmentItem.to_date)
      : employmentItem.fromTo && employmentItem.fromTo.split(' - ')[1] !== 'Present'
        ? parseDateForForm(employmentItem.fromTo.split(' - ')[1])
        : '',
    isCurrentJob: employmentItem.is_current_job !== undefined
      ? employmentItem.is_current_job
      : employmentItem.fromTo
        ? employmentItem.fromTo.includes('Present')
        : false,
  };
};

export const prepareProjectFormData = (projectItem: any) => {
  return {
    id: projectItem.id,
    customerName: projectItem.customerName || '',
    projectType: projectItem.projectType || '',
    designation: getDesignationString(projectItem.designation) || '',
    organizationName: projectItem.organizationName || '',
    industry: projectItem.industry || '',
    fromDate: projectItem.from_date
      ? parseDateForForm(projectItem.from_date)
      : parseDateForForm(projectItem.fromTo ? projectItem.fromTo.split(' - ')[0] : ''),
    toDate: projectItem.to_date
      ? parseDateForForm(projectItem.to_date)
      : parseDateForForm(projectItem.fromTo ? projectItem.fromTo.split(' - ')[1] : ''),
    isCurrentProject: projectItem.current_project !== undefined
      ? projectItem.current_project
      : projectItem.isCurrentProject || (projectItem.fromTo ? projectItem.fromTo.includes('Present') : false),
  };
};

export const prepareCertificationFormData = (certificationItem: any) => {
  return {
    id: certificationItem.id,
    certificationName: certificationItem.certificationName || '',
    institutionName: certificationItem.issuedBy || '',
    certificationNo: '',
    certificationDate: certificationItem.issueDate || '',
    validUntil: certificationItem.expiryDate || '',
  };
};

export const prepareDocumentFormData = (documentItem: any) => {
  return {
    id: documentItem.id,
    documentType: documentItem.documentType || '',
    documentNumber: documentItem.documentNumber || '',
    documentDate: documentItem.documentDate || '',
    expiryDate: documentItem.expiryDate || '',
    documentFile: null, // File object, will be null for existing items
    documentFile_url:
      documentItem.document_url || documentItem.documentUrl || null, // URL from server
  };
};

// Default form data for adding new items
export const getDefaultEducationFormData = () => ({
  educationType: '',
  highestDegree: '',
  subject: '',
  college: '',
  university: '',
  gpa: '',
  yearOfPassing: '',
  isPursuing: false,
});

export const getDefaultEmploymentFormData = () => ({
  organizationName: '',
  jobType: '',
  payrollOrganization: '',
  designation: '',
  location: '',
  country: '',
  state: '',
  city: '',
  fromDate: '',
  toDate: '',
  isCurrentJob: false,
});

export const getDefaultProjectFormData = () => ({
  customerName: '',
  projectType: '',
  designation: '',
  organizationName: '',
  industry: '',
  fromDate: '',
  toDate: '',
  isCurrentProject: false,
});

export const getDefaultCertificationFormData = () => ({
  certificationName: '',
  institutionName: '',
  certificationNo: '',
  certificationDate: '',
  validUntil: '',
});

export const getDefaultDocumentFormData = () => ({
  documentType: '',
  documentNumber: '',
  documentDate: '',
  expiryDate: '',
  documentFile: null,
  documentFile_url: null,
});

export const getDisplayName = (candidate: CandidateData): string => {
  if (candidate.display_name && candidate.display_name.trim()) {
    return capitalizeAndSafe(candidate.display_name);
  }
  const firstName = capitalizeAndSafe(candidate.first_name);
  const middleName = capitalizeAndSafe((candidate as any).middle_name);
  const lastName = capitalizeAndSafe(candidate.last_name);
  const nameParts = [firstName, middleName, lastName].filter(
    part => part !== ''
  );
  return nameParts.length > 0 ? nameParts.join(' ') : 'Unknown Candidate';
};

export const extractCityFromLocation = (locationString: string): string => {
  if (!locationString || typeof locationString !== 'string') return '';
  const parts = locationString.split('/');
  const city = parts[parts.length - 1]?.trim() || locationString.trim();
  return capitalizeAndSafe(city);
};

export const parsePreferredLocations = (
  locations: any
): { label: string }[] => {
  try {
    if (!locations) return [];
    if (Array.isArray(locations)) {
      return locations.map(loc => ({
        label: extractCityFromLocation(
          typeof loc === 'string' ? loc : loc.label || 'Unknown Location'
        ),
      }));
    }
    if (typeof locations === 'string' && locations.trim()) {
      return locations.split(',').map(loc => ({
        label: extractCityFromLocation(loc.trim()),
      }));
    }
    if (typeof locations === 'object' && locations.label) {
      return [{ label: extractCityFromLocation(locations.label) }];
    }
    return [];
  } catch (error) {
    console.error('Error parsing preferred locations:', error, locations);
    return [];
  }
};

export const getApplicantData = (candidateData: CandidateData) => {
  // Find current job designation from employment array where is_current_job is true
  const getCurrentDesignation = (): string => {
    if (candidateData.employment && candidateData.employment.length > 0) {
      // 1) Prefer explicit current job flag
      const currentJob = candidateData.employment.find(
        emp => emp.is_current_job === true
      );
      if (currentJob && currentJob.designation) {
        return capitalizeAndSafe(getDesignationString(currentJob.designation));
      }

      // 2) No explicit current job — pick the most recent past employment
      // based on `to_date` (or `from_date` if `to_date` missing).
      // We'll parse dates and pick the entry with the latest date.
      const withDates = candidateData.employment
        .map((emp: any) => {
          const rawTo = emp.to_date || emp.to || '';
          const rawFrom = emp.from_date || emp.from || '';
          // prefer to_date for ordering; fallback to from_date
          const dateStr = rawTo && rawTo.toString().trim() !== '' ? rawTo : rawFrom;
          const parsed = dateStr ? new Date(dateStr) : null;
          const time = parsed && !isNaN(parsed.getTime()) ? parsed.getTime() : null;
          return { emp, time };
        })
        .filter((x: any) => x.time !== null);

      if (withDates.length > 0) {
        // pick max time
        withDates.sort((a: any, b: any) => b.time - a.time);
        const latest = withDates[0].emp;
        if (latest && latest.designation) {
          return capitalizeAndSafe(getDesignationString(latest.designation));
        }
      }

      // 3) As a last-resort fallback pick the first employment record's designation
      const firstEmp = candidateData.employment[0];
      if (firstEmp && firstEmp.designation) {
        return capitalizeAndSafe(getDesignationString(firstEmp.designation));
      }
    }

    // Fallback to current_organisation if no employment info found
    return capitalizeAndSafe(candidateData.current_organisation) || 'NA';
  };

  const lastViewedEntry = candidateData.last_viewed?.[0];
  const lastViewedBy = (() => {
    const by = lastViewedEntry?.last_viewed_by;
    if (!by) return '';
    if (typeof by === 'object') {
      return (
        capitalizeAndSafe(by.display_name) ||
        capitalizeAndSafe(by.username) ||
        capitalizeAndSafe(by.email) ||
        capitalizeAndSafe(by.id)
      );
    }
    return capitalizeAndSafe(by as unknown as string);
  })();
  const lastViewedOn = lastViewedEntry?.last_viewed_on
    ? new Date(lastViewedEntry.last_viewed_on).toLocaleDateString()
    : '';

  return {
    display_name: getDisplayName(candidateData),
    candidate_id: safeValue(candidateData.candidate_id, 'Unknown ID'),
    designation: getCurrentDesignation(),
    linkedin_profile: safeValue(candidateData.linkedin_profile, ''),
    current_city:
      extractCityFromLocation(candidateData.current_location || '') || '',
    phone: safeValue(candidateData.phone?.toString(), ''),
    email: safeValue(candidateData.email, ''),
    date_of_birth: safeValue(candidateData.date_of_birth, ''),
    pan_number: (() => {
      const panDoc = candidateData.documents?.find(
        (doc: any) => (doc.document_name || doc.documentType) === 'PAN Card'
      );
      if (panDoc && panDoc.document_number && panDoc.document_number.trim() !== '') {
        return panDoc.document_number;
      }
      return safeValue(candidateData.pan_number, '');
    })(),
    uan_number: safeValue(candidateData.uan_number, ''),
    total_experience: safeValue(
      candidateData.total_experience?.toString(),
      '0'
    ),
    relevant_experience: safeValue(
      candidateData.relevant_experience?.toString(),
      '0'
    ),
    current_ctc: safeValue(candidateData.current_ctc?.toString(), '0'),
    expected_ctc: safeValue(candidateData.expected_ctc?.toString(), '0'),
    preferred_location: parsePreferredLocations(
      candidateData.preferred_location
    ),
    notice_period: capitalizeAndSafe(candidateData.notice_period),
    job_open_type: capitalizeAndSafe(candidateData.job_open_type),
    preferred_job: capitalizeAndSafe(candidateData.preferred_job),
    job_preference: capitalizeAndSafe(candidateData.job_preference),
    shift:
      candidateData.shifts && candidateData.shifts.length > 0
        ? candidateData.shifts.map(s => capitalizeAndSafe(s)).join(', ')
        : '',
    career_break_type: safeValue(candidateData.career_break_type, ''),
    duration: candidateData.duration || [],
    is_favorite: candidateData.is_favorite || false,
    actively_looking:
      candidateData.source_details?.is_actively_looking || false,
    candidate_picture: candidateData.candidate_picture,
    last_viewed_by: lastViewedBy,
    last_viewed_date: safeValue(lastViewedOn, ''),
    updated_by: capitalizeAndSafe(candidateData.updated_by || candidateData.created_by),
    created_by: capitalizeAndSafe(candidateData.created_by),
    created: candidateData.created
      ? new Date(candidateData.created).toISOString()
      : new Date().toISOString(),
    updated: candidateData.updated
      ? new Date(candidateData.updated).toISOString()
      : candidateData.created
        ? new Date(candidateData.created).toISOString()
        : new Date().toISOString(),
    skills:
      candidateData.skills?.map((skill: any) => ({
        name: capitalizeAndSafe(skill.skill_name),
        level: capitalizeAndSafe(skill.expertise) || 'Intermediate',
        years: skill.experience || 0,
        skill_expertise: capitalizeAndSafe(skill.expertise),
        rating: skill.rating || '3',
        experience: skill.experience || 0,
        skill_category: (Array.isArray(candidateData.skill_category) && candidateData.skill_category.length > 0)
          ? {
            id: candidateData.skill_category[0].id || '',
            name: candidateData.skill_category[0].name || candidateData.skill_category[0].label || ''
          }
          : skill.skill_category_id || skill.skill_category
            ? { id: skill.skill_category_id || '', name: skill.skill_category || '' }
            : null,
      })) || [],
    primary_skill: Array.isArray(candidateData.primary_skill)
      ? (candidateData.primary_skill as any[]).flat(Infinity).filter(Boolean).join(', ')
      : (candidateData.primary_skill as unknown as string) || '',
    additional_skill: Array.isArray(candidateData.additional_skill)
      ? (candidateData.additional_skill as any[]).flat(Infinity).filter(Boolean).join(', ')
      : (candidateData.additional_skill as unknown as string) || '',
    skill_category: Array.isArray(candidateData.skill_category)
      ? candidateData.skill_category.map((cat: any) => cat.name || cat.label || cat).filter(Boolean).join(', ')
      : (candidateData.skill_category as unknown as string) || '',
    profile_summary: candidateData.profile_summary || '',
    resume_url: candidateData.resume_url || null,
    flag: candidateData.source_details?.flags?.[0] || '',
    source_name: candidateData.source_details?.source_name || '',
  };
};
