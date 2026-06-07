import { apiCall } from './index';
import { API_ENDPOINTS } from './endpoints';

export interface CandidateSearchParams {
    pan_number?: string;
    email?: string;
    phone?: number;
}

export interface DuplicateCandidate {
    _id: string;
    candidate_id: string;
    pan_number?: string;
    date_of_birth?: string;
    candidate_picture: string | null;
    first_name: string;
    middle_name?: string;
    last_name: string;
    display_name: string;
    phone: string;
    alt_phone?: string;
    email: string;
    alt_email?: string;
    gender?: string;
    marital_status?: string;
    current_address?: string;
    current_country?: string;
    current_state?: string;
    current_city?: string;
    postal_code?: string;
    total_experience?: string;
    relevant_experience?: string;
    current_ctc?: string;
    expected_ctc?: string;
    current_location?: string;
    preferred_location?: string;
    notice_period?: string;
    job_preference?: string;
    job_open_type?: string;
    preferred_job?: string;
    shifts?: string[];
    career_break?: boolean;
    career_break_type?: string;
    differently_abled?: boolean;
    disability_type?: string;
    linkedin_profile?: string;
    resume_url?: string;
    profile_summary?: string;
    text_cv?: string;
    education?: any[];
    skills?: any[];
    primary_skill?: string | any[];
    additional_skill?: string | any[];
    employment?: any[];
    projects?: any[];
    certifications?: any[];
    documents?: any[];
    source_details?: any;
    created_by?: string;
    created?: string;
    updated?: string;
    isNewTC?: boolean;
    shift?: string;
}

export interface CheckDuplicatesResponse {
    duplicates: DuplicateCandidate[];
}

export interface CandidateData {
    _id: string;
    id: string;
    display_name?: string;
    pan_number?: string;
    phone?: number;
    email?: string;
    candidate_id?: string;
    first_name?: string;
    last_name?: string;
    current_organisation?: string;
    current_ctc?: number;
    expected_ctc?: number;
    total_experience?: number;
    primary_skill?: string | any[];
}

export interface CandidatesResponse {
    page: number;
    limit: number;
    total_candidates: number;
    total_pages: number;
    candidates: CandidateData[];
    filter: {
        pan_number?: string;
        email?: string;
        phone?: number;
    };
    search?: string;
}

export interface ApplicantHeaderFormData {
    first_name: string;
    middle_name: string;
    last_name: string;
    display_name: string;
    candidate_id: string;
    phone: string;
    email: string;
    alternative_phone: string;
    alternative_email: string;
    current_address: string;
    country: string;
    state: string;
    city: string;
    designation: string;
    current_city: string;
    date_of_birth: string;
    linkedin_profile: string;
    pan_number: string;
    uan_number: string;
    profile_picture: File | null;
    profile_picture_removed: boolean;
    profile_picture_url: string | null;
    resume: File | null;
    resume_url: string | null;
    text_cv?: string; // Extracted text content from resume
    is_actively_looking: boolean;
    flag: string;
}

export interface ProfessionalFormData {
    total_experience: string;
    relevant_experience: string;
    current_ctc: string;
    expected_ctc: string;
    preferred_location: string[];
    notice_period: string;
    job_open_type: string;
    preferred_job: string;
    job_preference: string;
    shift: string;
}

export interface SkillFormData {
    name: string;
    skill_expertise: string;
    rating: string;
    experience: number;
}

export interface EducationFormData {
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

export interface EmploymentFormData {
    id?: string;
    organizationName: string;
    jobType: string;
    payrollOrganization: string;
    designation: string;
    location: string;
    country: string;
    state: string;
    city: string;
    fromDate: string;
    toDate: string;
    isCurrentJob: boolean;
}

export interface ProjectFormData {
    id?: string;
    customerName: string;
    projectType: string;
    designation: string;
    organizationName: string;
    fromDate: string;
    toDate: string;
}

export interface CertificationFormData {
    id?: string;
    certificationName: string;
    institutionName: string;
    certificationNo: string;
    certificationDate: string;
    validUntil: string;
}

export interface DocumentFormData {
    id?: string;
    documentType: string;
    documentNumber: string;
    documentDate: string;
    expiryDate: string;
    documentFile: string;
}


export const candidatesAPI = {
    /**
     * Check if PAN number already exists (for duplicate validation)
     */
    checkPanExists: async (panNumber: string): Promise<boolean> => {
        const queryParams = new URLSearchParams();
        queryParams.append('pan_number', panNumber);

        const url = `${API_ENDPOINTS.CANDIDATES.LIST}?${queryParams.toString()}`;

        try {
            const response = await apiCall<CandidatesResponse>(url, {
                method: 'GET',
            });

            if (response.error) {
                throw new Error(response.error.message || 'Failed to check PAN');
            }

            // Return true if candidates found, false if not
            return response.data ? response.data.candidates.length > 0 : false;
        } catch (error) {
            console.error('Error checking PAN:', error);
            return false; // Assume not duplicate on error to avoid blocking user
        }
    },

    /**
     * Search for candidates by PAN number, email, or phone
     */
    searchCandidates: async (params: CandidateSearchParams & { search?: string; limit?: number }): Promise<CandidatesResponse> => {
        // Build query parameters
        const queryParams = new URLSearchParams();

        if (params.pan_number) {
            queryParams.append('pan_number', params.pan_number);
        }
        if (params.email) {
            queryParams.append('email', params.email);
        }
        if (params.phone) {
            queryParams.append('phone', params.phone.toString());
        }
        if (params.search) {
            queryParams.append('search', params.search);
        }
        if (params.limit) {
            queryParams.append('limit', params.limit.toString());
        }

        const url = `${API_ENDPOINTS.CANDIDATES.LIST}?${queryParams.toString()}`;

        const response = await apiCall<CandidatesResponse>(url, {
            method: 'GET',
        });

        if (response.error) {
            throw new Error(response.error.message || 'Failed to fetch candidates');
        }

        return response.data || {
            page: 1,
            limit: 10,
            total_candidates: 0,
            total_pages: 0,
            candidates: [],
            filter: {}
        };
    },

    /**
     * Check for duplicate candidates by PAN number, email, or phone
     */
    checkDuplicates: async (params: CandidateSearchParams): Promise<CheckDuplicatesResponse> => {
        const response = await apiCall<CheckDuplicatesResponse>(API_ENDPOINTS.CANDIDATES.CHECK_DUPLICATES, {
            method: 'POST',
            body: JSON.stringify(params),
        });

        if (response.error) {
            throw new Error(response.error.message || 'Failed to check duplicates');
        }

        return response.data || {
            duplicates: []
        };
    },
};
