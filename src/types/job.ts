// Job Types - Based on API Response Structure
// Updated to match flattened API schema (2025-10-29)

// Assigned user object (for assigned_to array)
export interface AssignedUser {
  id: string;
  name: string;
}

// Comment object for the comments array
export interface JobComment {
  comment: string;
  addedBy: string;
  addedTime: string; // ISO timestamp
}

// Client information nested object
export interface JobClientInfo {
  client_name: string;
  end_client_name: string;
  client_requirement_id: string;
  full_name: string;
  phone: string;
  email: string;
  designation: string;
  department: string;
  client_logo: string | null; // URL Can be null
  associate_msp?: string | null;
}

// Complete Job record from API - Flattened structure
export interface JobAPI {
  id: string; // Primary ID field for API operations
  job_id: string;
  job_title: string;
  job_type: string;
  job_priority: string;
  job_status: string;
  job_date: string; // YYYY-MM-DD format
  received_date: string; // YYYY-MM-DD format
  job_upload: string; // URL
  preferred_job: string;
  skill_category: string | string[];
  employment_type: string;
  bgc_type: string;
  client: JobClientInfo;
  job_detail: string;
  primary_skill_set: string[];
  secondary_skill_set: string[];
  total_experience: number;
  relevant_experience: number;
  job_location: string;
  no_of_position: number;
  submission_limit: number;
  tat: string | null; // ISO Date-time string
  shifts: string[];
  client_bill_rate: number;
  client_bill_period: string;
  gender_preference: string;
  job_open_type: string;
  industry: string[];
  education_criteria: string;
  // Backward compatibility in UI; API uses education_criteria
  degree?: string;
  subject: string;
  certification: string;
  diversity_hiring: boolean;
  premium_institute: boolean;
  job_description: string;
  pdf_upload: string; // URL
  comments: JobComment[]; // Array of comment objects
  assigned_to: AssignedUser[]; // Array of assigned user objects with id and name
  job_owner: string;
  created_by: AssignedUser[];
  updated_by: AssignedUser[]; // Add updated_by field
  created: string; // ISO timestamp
  updated: string; // ISO timestamp
  isNewTC: boolean; // Default: true
  ismapped?: boolean;
}

// Input type for creating a job - assigned_to is an array of user IDs (strings)
// Backend transforms this to AssignedUser[] in the response
export type CreateJobInput = Omit<JobAPI, 'assigned_to' | 'created' | 'updated'> & {
  assigned_to: string[]; // Array of user IDs when creating
};

// Legacy nested interfaces (keeping for backward compatibility during migration)
export interface JobRequirementAPI {
  job_id: string;
  job_title: string;
  job_type: string;
  job_priority: string;
  job_status: string;
  job_date: string;
  received_date: string;
  job_upload: string;
  preferred_job: string;
  skill_category: string;
  employment_type: string;
  bgc_type: string;
  created_by: AssignedUser[];
}

export interface JobClientAPI {
  client_name: string;
  end_client_name: string;
  client_requirement_id: string;
  full_name: string;
  phone: string;
  email: string;
  designation: string;
  department: string;
  client_logo: string | null;
  associate_msp?: string | null;
}

export interface JobDetailsAPI {
  job_detail: string;
  primary_skill_set: string[];
  secondary_skill_set: string[];
  total_experience: number;
  relevant_experience: number;
  job_location: string[];
  no_of_position: number;
  submission_limit: number;
  tat: string | null;
  shifts: string[];
  client_bill_rate: number;
  client_bill_period: string;
  gender_preference: string;
  job_open_type: string;
  industry: string[];
  degree: string;
  subject: string;
  certification: string;
  diversity_hiring: boolean;
  premium_institute?: boolean;
}

export interface JobDescriptionAPI {
  job_description: string;
  pdf_upload: string;
  comments: JobComment[]; // Array of comment objects
  assigned_to: AssignedUser[] | string[]; // Can be array of objects or strings
  job_owner: string;
}

// Legacy nested Job API (keeping for backward compatibility)
export interface JobAPILegacy {
  _id: string;
  id: string;
  requirement: JobRequirementAPI;
  client: JobClientAPI;
  job_details: JobDetailsAPI;
  job_description: JobDescriptionAPI;
  created: string;
  updated: string;
  isNewTC: boolean;
  ismapped?: boolean;
}

// API Response for jobs listing
export interface JobsAPIResponse {
  page: number;
  limit: number;
  total_jobs: number;
  total_pages: number;
  Job: JobAPI[]; // Array of flattened Job objects
}

// Job Create Request (for Add Job form submission)
export interface JobCreateRequest {
  job_id: string;
  job_title: string;
  job_type: string;
  job_priority: string;
  job_status: string;
  job_date: string; // YYYY-MM-DD
  received_date: string; // YYYY-MM-DD
  job_upload: string;
  preferred_job: string;
  skill_category: string;
  employment_type: string;
  bgc_type: string;
  client: JobClientInfo;
  job_detail: string;
  primary_skill_set: string[];
  secondary_skill_set: string[];
  total_experience: number;
  relevant_experience: number;
  job_location: string;
  no_of_position: number;
  submission_limit: number;
  tat: string | null; // ISO Date-time
  shifts: string[];
  client_bill_rate: number;
  client_bill_period: string;
  gender_preference: string;
  job_open_type: string;
  industry: string[];
  education_criteria: string;
  subject: string;
  certification: string;
  diversity_hiring: boolean;
  premium_institute: boolean;
  job_description: string;
  pdf_upload: string;
  comments: JobComment[]; // Array of comment objects
  assigned_to: string[]; // Array of User IDs
  job_owner: string;
  created_by: string;
  updated_by: string; // Add updated_by field
  created: string; // ISO timestamp
  updated: string; // ISO timestamp
  isNewTC: boolean; // Default: true
}

// Job Form Data (for internal form state management)
export interface JobFormData {
  job_id: string;
  job_title: string;
  job_type: string;
  job_priority: string;
  job_status: string;
  job_date: string;
  received_date: string;
  job_upload: string | null;
  preferred_job: string;
  employment_type: string;
  bgc_type: string;
  // Client fields (flattened for form)
  client_name: string;
  end_client_name: string;
  client_requirement_id: string;
  client_contact_name: string;
  client_phone: string;
  client_email: string;
  client_designation: string;
  client_department: string;
  client_logo: string | null;
  // Job details
  job_detail: string;
  primary_skill_set: string[];
  secondary_skill_set: string[];
  total_experience: number;
  relevant_experience: number;
  job_location: string;
  no_of_position: number;
  submission_limit: number;
  tat: string | null;
  shifts: string[];
  client_bill_rate: number;
  client_bill_period: string;
  gender_preference: string;
  job_open_type: string;
  industry: string[];
  degree: string;
  subject: string;
  certification: string;
  diversity_hiring: boolean;
  premium_institute: boolean;
  // Job description
  job_description: string;
  pdf_upload: string | null;
  comments: string;
  assigned_to: string[];
  job_owner: string;
}

// Simplified job data for list display (transformed from API)
export interface JobListItem {
  id: string;
  job_id: string;
  job_title: string;
  job_priority: string;
  job_status: string;
  job_type: string;
  employment_type: string;
  bgc_type?: string;
  client_name: string;
  end_client_name?: string;
  client_requirement_id?: string;
  job_location: string;
  primary_skills?: string[];
  secondary_skills?: string[];
  total_experience: number;
  client_bill_rate: number;
  client_bill_period: string;
  no_of_position: number;
  job_owner?: string | { id: string; name: string };
  assigned_to?: (string | { id: string | null; name: string })[];
  created_by?: AssignedUser[];
  updated_by?: AssignedUser[];
  created_date: string;
  job_date: string;
  received_date: string;
  preferred_job?: string;
  skill_category?: string | string[];
  ismapped?: boolean;
}

// Search and filter interfaces
export interface JobFilters {
  search?: string;
  job_status?: string[];
  job_priority?: string[];
  job_type?: string[];
  employment_type?: string[];
  client_name?: string[];
  job_location?: string[];
  assigned_to?: string[];
  job_owner?: string[];
  created_by?: string[];
  client_requirement_id?: string[];
  primary_skills?: string[];
  skill_category?: string[];
  experience_min?: number;
  experience_max?: number;
  bill_rate_min?: number;
  bill_rate_max?: number;
  date_range?: {
    start?: string;
    end?: string;
  };
}

// Search parameters for API calls
export interface JobSearchParams {
  page?: number;
  limit?: number;
  search?: string;
  filters?: JobFilters;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// Dropdown options for job filters
export interface JobDropdownOptions {
  jobPriorities: Array<{ value: string; label: string }>;
  jobStatuses: Array<{ value: string; label: string }>;
  jobTypes: Array<{ value: string; label: string }>;
  employmentTypes: Array<{ value: string; label: string }>;
  bgcTypes: Array<{ value: string; label: string }>;
  clientBillPeriods: Array<{ value: string; label: string }>;
  genderPreferences: Array<{ value: string; label: string }>;
  jobOpenTypes: Array<{ value: string; label: string }>;
  shifts: Array<{ value: string; label: string }>;
  industries: Array<{ value: string; label: string }>;
}
