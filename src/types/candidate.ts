// Candidate API Types
import {
  SkillAPIFormat,
  EducationAPIFormat,
  EmploymentAPIFormat,
  ProjectAPIFormat,
  CertificationAPIFormat,
  DocumentAPIFormat,
} from '../utils/apiDataTransform';

// API Response interface for candidate data
export interface CandidateData {
  _id: string;
  id: number;
  candidate_id: string;
  pan_number: string;
  date_of_birth: string;
  candidate_picture: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  display_name: string;
  phone: number;
  alt_phone: string;
  email: string;
  alt_email: string | null;
  gender: string;
  marital_status: string;
  current_address: string;
  current_country: string;
  current_state: string;
  current_city: string;
  postal_code: string;
  total_experience: number;
  relevant_experience: number;
  current_ctc: number;
  expected_ctc: number;
  current_location: string;
  preferred_location: string;
  notice_period: string;
  job_preference: string | string[];
  job_open_type: string | string[];
  preferred_job: string | null | string[];
  shifts: string[];
  career_break: boolean;
  career_break_type: string;
  duration: Array<{
    from_date: string | null;
    to_date: string | null;
  }>;
  differently_abled: boolean;
  disability_type: string;
  linkedin_profile: string | null;
  resume_url: string;
  profile_summary: string;
  last_viewed?: Array<{
    last_viewed_by: {
      id: string;
      email: string;
      username: string;
      display_name: string;
    } | null;
    last_viewed_on: string;
  }>;
  education: Array<{
    education_type: string;
    highest_degree: string;
    subject: string;
    college: string;
    university: string;
    gpa: number;
    year_of_passing: number;
    is_pursuing: boolean;
  }>;
  skills: Array<{
    skill_name: string;
    expertise: string;
    rating: number;
    experience: number;
    skill_category?: string;
  }>;
  primary_skill?: string[];
  additional_skill?: string;
  employment: Array<{
    organization_name: string;
    job_type: string;
    payroll_organization: string;
    designation: string;
    location: string;
    from_date: string;
    to_date: string | null;
    is_current_job: boolean;
  }>;
  projects: Array<any>;
  certifications: Array<any>;
  documents: Array<any>;
  source_details: {
    source_type: string;
    source_name: string;
    flags: string[];
    is_actively_looking: boolean;
    comments: string;
  };
  created_by: string;
  created: string;
  updated: string;
  updated_by: string;
  isNewTC: boolean;
  designation: string;
  linkedin_id: string;
  uan_number: string;
  is_deleted: boolean;
  ismapped?: boolean;
  [key: string]: any;
}

export interface CandidateCreateRequest {
  candidate_id: string;
  pan_number: string;
  date_of_birth: string;
  candidate_picture: string | null;
  first_name: string;
  middle_name: string;
  last_name: string;
  display_name: string;
  phone: number | null;
  alt_phone: number | null;
  email: string;
  alt_email: string | null;
  gender: string;
  marital_status: string;
  current_address: string;
  current_country: string;
  current_state: string;
  current_city: string;
  postal_code: string;
  total_experience: number;
  relevant_experience: number;
  current_ctc: number;
  expected_ctc: number;
  current_location: string;
  preferred_location: string;
  notice_period: string;
  job_preference: string | string[];
  job_open_type: string | string[];
  job_type: string;
  shifts: string[];
  career_break: boolean;
  career_break_type: string;
  duration: Array<{
    from_date: string | null;
    to_date: string | null;
  }>;
  differently_abled: boolean;
  disability_type: string;
  linkedin_profile: string;
  resume_url: string | null;
  profile_summary: string;
  text_cv: string; // Full parsed resume text
  education: EducationAPIFormat[];
  skills: SkillAPIFormat[];
  primary_skill?: string[];
  skill_category?: Array<{ id: string; name: string }>;
  additional_skill?: string;
  employment: EmploymentAPIFormat[];
  projects: ProjectAPIFormat[];
  certifications: CertificationAPIFormat[];
  documents: DocumentAPIFormat[];
  source_details: SourceDetails;
  created_by: string;
  created?: string;
  updated?: string;
  job_id?: string; // Link to job internal ID (e.g. JOB-5005)
}

export interface CandidateCreateResponse extends CandidateCreateRequest {
  created: string;
  updated: string;
}

// Supporting interfaces
export interface Education {
  id?: string;
  educationType: string;
  highestDegree: string;
  subject: string;
  college: string;
  university: string;
  gpa: string;
  yearOfPassing: string;
  isPursuing: boolean;
}

export interface Skill {
  id?: string;
  skill_name: string;
  skill_category?: string;
  expertise: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  rating: string;
  experience: string;
}

export interface Employment {
  id?: string;
  company: string;
  designation: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
}

export interface Project {
  id?: string;
  projectName: string;
  description: string;
  technologies: string[];
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  isCurrentProject: boolean;
}

export interface Certification {
  id?: string;
  name: string;
  issuingOrganization: string;
  issueDate: string;
  expiryDate: string;
  credentialId: string;
}

export interface CandidateDocument {
  id?: string;
  document_name: string;
  document_number: string;
  document_date: string;
  expiry_date: string;
  document_url: string;
}

export interface SourceDetails {
  source_type: string;
  source_name: string;
  flags: string[];
  is_actively_looking: boolean;
  comments: string;
}

// Form data interface (internal form state)
export interface CandidateFormData {
  // Personal Details
  candidate_id: string;
  panNo: string;
  dob: string;
  candidatePicture: File | null;
  candidatePicturePreview: string;
  candidatePictureUrl: string | null; // Store uploaded picture URL
  firstName: string;
  middleName: string;
  lastName: string;
  displayName: string;
  phone: string;
  alternatePhone?: string | null;
  email: string;
  alternateEmail?: string | null;
  gender: string;
  maritalStatus: string;
  currentAddress: string;
  currentCountry: string;
  currentState: string;
  currentCity: string;
  permanentAddress: string;
  permanentCountry: string;
  permanentState: string;
  permanentCity: string;
  currentPostalCode: string;
  permanentPostalCode: string;
  sameAsCurrentAddress: boolean;

  // Professional Details
  total_experience: string;
  relevantExperience: string;
  current_ctc: string;
  expected_ctc: string;
  location: string;
  preffered_location: string | Array<{ value: string; label: string }>;
  notice_period: string;
  preferred_job: string; // Field for "Preferred Job" dropdown
  job_preference: string; // Field for "Job Preference" dropdown
  job_open_type: string;
  job_type: string;
  shift: string;
  career_break: string;
  career_break_type: string;
  duration: Array<{
    from_date: string | null;
    to_date: string | null;
  }>;
  differently_abled: string;
  differently_abled_type: string;
  linkedin_profile: string;
  resume: File | null;
  resumeUrl: string | null; // Store uploaded resume URL
  profile_summary: string;
  textCV: string; // Full parsed resume text for recreation

  // Education & Skills (from other steps)
  educationHistory: Education[];
  skillMetrics: Skill[];
  primarySkills?: string; // Bulk primary skills (comma-separated)
  skillCategory?: string | { value: string; label: string; id?: string };
  additionalSkills?: string; // Bulk additional skills (comma-separated)

  // Employment & Projects (from other steps)
  employmentHistory: Employment[];
  projectHistory: Project[];
  certifications: Certification[];

  // Documents & Others (from other steps)
  documents: CandidateDocument[];
  source_details: SourceDetails;

  // Job Link (passed from navigation)
  job_id?: string; // Link to job internal ID (e.g. JOB-5005)
  applied_job_id?: string; // Applied Job ID
  applied_job_name?: string; // Applied Job Name (Code)
  applied_job_title?: string; // Job Title
}
