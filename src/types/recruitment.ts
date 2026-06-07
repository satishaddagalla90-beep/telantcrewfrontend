// Requirement Types - For Applicant-Job Mapping/Logging

// Comment object for the comments array
export interface RequirementComment {
  comment: string;
  addedBy: string;
  addedTime: string; // ISO timestamp
}

// Applicant information
export interface ApplicantInfo {
  applicant_id: string;
  applicant_name: string;
  phone: string;
  email: string;
  pan_no: string;
  applicant_picture: string;
  designation: string;
  flag: string;
  attachments: string[]; // URLs
  linkedin_profile: string;
}

// Job information for the mapping
export interface MappedJobInfo {
  job_id: string;
  job_code: string;
  job_title: string;
  job_type: string;
  client_name: string;
  client_req_id: string;
  client_job_id: string;
  job_location: string;
  end_client_name: string;
  required_skills: string[];
  primary_skills: string[];
  secondary_skills: string[];
}

// Education details
export interface EducationDetail {
  id?: string;
  education_type: string;
  highest_degree: string;
  subject: string;
  college: string;
  university: string;
  gpa: string;
  from_date: string; // YYYY-MM-DD
  to_date: string; // YYYY-MM-DD
}

// Employment details
export interface EmploymentDetail {
  id?: string;
  organization_name: string;
  job_type: string;
  payroll_organization: string;
  designation: string;
  location: string;
  from_date: string; // YYYY-MM-DD
  to_date: string; // YYYY-MM-DD
}

// Project details
export interface ProjectDetail {
  id?: string;
  customer_name: string;
  industry: string;
  project_type: string;
  designation: string;
  organization_name: string;
  from_date: string; // YYYY-MM-DD
  to_date: string; // YYYY-MM-DD
}

// Certification details
export interface CertificationDetail {
  id?: string;
  certification_name: string;
  issuing_organization: string;
  date_obtained: string; // YYYY-MM-DD
  expiry_date: string; // YYYY-MM-DD
}

// Document details
export interface DocumentDetail {
  id?: string;
  document_type: string;
  document_no: string;
  document_date: string; // YYYY-MM-DD
  expiry_date: string; // YYYY-MM-DD
  document_file: string; // URL
}

export interface LastViewedUser {
  id: string;
  display_name: string;
  email: string;
}

export interface LastViewedEntry {
  last_viewed_by: LastViewedUser;
  last_viewed_on: string; // ISO timestamp
}

// Complete Requirement record from API
export interface RequirementAPI {
  id: string; // Primary ID field for API operations
  mapping_id: string;
  applicant: ApplicantInfo;
  job: MappedJobInfo;
  pan_no: string; // Applicant's PAN number
  client_req_id: string; // Client's requirement ID
  skill_set: string[];
  status: string;
  mapped_by: string;
  mapped_date: string; // YYYY-MM-DD
  job_owner: string;
  last_viewed?: LastViewedEntry[];
  last_viewed_by?: string;
  last_viewed_date?: string; // ISO timestamp
  last_updated_by: string;
  last_updated_date: string; // ISO timestamp
  profile_summary: string;
  education_details: EducationDetail[];
  employment_details: EmploymentDetail[];
  project_details: ProjectDetail[];
  certification_details: CertificationDetail[];
  document_details: DocumentDetail[];
  comments: RequirementComment[];
  status_obj?: any;
  status_code?: string;
  status_display_name?: string;
  stage_history?: any[];
  created_by: string;
  created: string; // ISO timestamp
  updated: string; // ISO timestamp
}

// List view item for Requirements table
export interface RequirementListItem {
  id: string;
  mapping_id: string;
  applicant_name: string;
  applicant_id: string;
  phone: string;
  email: string;
  pan_no: string;
  skill_set: string[];
  job_title: string;
  job_id: string;
  client_name: string;
  client_req_id: string;
  job_type: string;
  job_owner: string;
  status: string;
  mapped_by: string;
  mapped_date: string;
  last_viewed?: LastViewedEntry[];
  flag?: string;
  current_organization?: string;
  payroll_organisation?: string;
  total_experience?: number;
  relevant_experience?: number;
  current_location?: string;
  preferred_location?: string;
  highest_education_degree?: string;
  notice_period?: string;
  current_ctc?: string;
  payroll_ctc?: string;
  expected_ctc?: string;
  preferred_job?: string;
  created_by?: string;
  created?: string;
  is_actively_looking?: boolean;
}

// API Response for requirements listing
export interface RequirementsAPIResponse {
  page: number;
  limit: number;
  total_requirements: number;
  total_pages: number;
  Requirements: RequirementAPI[];
}

// Requirement Create Request
export interface RequirementCreateRequest {
  mapping_id: string;
  applicant: ApplicantInfo;
  job: MappedJobInfo;
  pan_no: string; // Applicant's PAN number
  client_req_id: string; // Client's requirement ID
  skill_set: string[];
  status: string;
  mapped_by: string;
  mapped_date: string;
  job_owner: string;
  profile_summary: string;
  education_details: EducationDetail[];
  employment_details: EmploymentDetail[];
  project_details: ProjectDetail[];
  certification_details: CertificationDetail[];
  document_details: DocumentDetail[];
  comments: RequirementComment[];
}

// Recruitment Map Request
export interface RecruitmentMapRequest {
  candidate_id: string; // Internal candidate ID (Mongo ID)
  job_id: string; // Internal job ID (Mongo ID)
  assigned_to: string; // Recruiter/Owner ID (String)
  mapped_by: string; // Recruiter ID (String)
}

// Recruitment Map Response - Partial representation
export interface RecruitmentMapResponse {
  id: string;
  mapping_id: string;
  candidate_id: string;
  job_id: string;
  current_stage: string;
  created_at: string;
  updated_at: string;
}

// Input type for creating a requirement
export type CreateRequirementInput = Omit<
  RequirementAPI,
  'id' | 'created' | 'updated' | 'created_by' | 'last_viewed' | 'last_viewed_by' | 'last_viewed_date' | 'last_updated_by' | 'last_updated_date'
>;

// Update type for requirement
export type UpdateRequirementInput = Partial<CreateRequirementInput> & {
  id: string;
};

// Filter options for requirements
export interface RequirementFilters {
  status?: string[];
  job_type?: string[];
  client_name?: string[];
  mapped_by?: string[];
  job_owner?: string[];
  date_from?: string;
  date_to?: string;
  skill_set?: string[];
}

// Sort configuration
export interface RequirementSortConfig {
  key: keyof RequirementListItem;
  direction: 'asc' | 'desc';
}

// Tab status counts
export interface RequirementTabCounts {
  all: number;
  active: number;
  submitted: number;
  interviewed: number;
  selected: number;
  rejected: number;
  on_hold: number;
}
