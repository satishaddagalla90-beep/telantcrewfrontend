/**
 * Applicant/Candidate API Response Types
 * Maps to the actual API response structure
 */

export interface ApplicantEducation {
  education_type: string;
  highest_degree: string;
  subject: string;
  college: string;
  university: string;
  gpa: number;
  year_of_passing: number;
  is_pursuing: boolean;
}

export interface ApplicantSkill {
  skill_name: string;
  expertise: string;
  rating: number;
  experience: number;
}

export interface ApplicantEmployment {
  organization_name: string;
  job_type: string;
  payroll_organization: string;
  designation: string;
  location: string;
  from_date: string;
  to_date: string | null;
  is_current_job: boolean;
}

export interface ApplicantProject {
  customer_name: string;
  project_type: string;
  designation: string;
  organization_name: string;
  from_date: string;
  to_date: string;
  industry: string | null;
  current_project: boolean;
}

export interface ApplicantCertification {
  certification_name: string;
  institution_name: string;
  certification_number: string;
  certification_date: string;
  valid_until_date: string;
}

export interface ApplicantDocument {
  document_name: string;
  document_number: string;
  document_date: string | null;
  expiry_date: string | null;
  document_url: string | null;
}

export interface ApplicantSourceDetails {
  source_type: string;
  source_name: string;
}

export interface ApplicantLastViewed {
  last_viewed_by: {
    id: string;
    email: string;
    username: string;
    display_name: string;
  };
  last_viewed_on: string;
}

export interface Applicant {
  _id: string;
  candidate_id: string;
  pan_number: string;
  date_of_birth: string;
  candidate_picture: string | null;
  first_name: string;
  middle_name: string;
  last_name: string;
  display_name: string;
  phone: number | string;
  alt_phone: string | null;
  email: string;
  alt_email: string | null;
  gender: string;
  marital_status: string;
  current_address: string;
  current_country: string;
  current_state: string;
  current_city: string;
  postal_code: string;
  total_experience: string | number;
  relevant_experience: string | number;
  current_ctc: string | number;
  expected_ctc: string | number;
  current_location: string;
  preferred_location: string;
  notice_period: string;
  job_preference: string[];
  job_open_type: string[];
  preferred_job: string[];
  shifts: string[];
  career_break: boolean;
  career_break_type: string;
  differently_abled: boolean;
  disability_type: string;
  linkedin_profile: string | null;
  resume_url: string;
  profile_summary: string;
  text_cv: string;
  education: ApplicantEducation[];
  skills: ApplicantSkill[];
  primary_skill: string;
  additional_skill: string;
  employment: ApplicantEmployment[];
  projects: ApplicantProject[];
  certifications: ApplicantCertification[];
  documents: ApplicantDocument[];
  source_details: ApplicantSourceDetails;
  last_viewed: ApplicantLastViewed[];
  created_by: string;
  created: string;
  updated_by: string | null;
  updated: string;
  isNewTC: boolean;
  id: string;
  duration: any[];
  source_name: string;
  source_type: string;
}

export interface ApplicantSearchResponse {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  data: Applicant[];
}
