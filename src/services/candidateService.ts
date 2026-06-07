// Candidate API Service
import { CandidateData as ApiCandidateData } from '../types/candidate';
import { CandidateData } from '../components/pages/CandidateSearch/types';

const API_BASE_URL = 'https://tc-py-fastapi-to33v.ondigitalocean.app';

interface LastCandidateIdResponse {
    last_candidate_id: string;
}

interface SearchCandidatesParams {
    search?: string;
    isBoolean?: boolean;
    clientHiringFor?: string;
    employer?: string;
    keywords?: string;
    excludeKeywords?: string;
    designation?: string;
    expMin?: number;
    expMax?: number;
    salaryMin?: number;
    salaryMax?: number;
    currentLocation?: string;
    preferredLocation?: string[];
    noticePeriod?: string[];
    preferredJobTitle?: string;
    jobType?: string;
    workMode?: string[];
    gender?: string;
    pwdOnly?: boolean;
    createdWithinDays?: number;
    modifiedWithinDays?: number;
    page?: number;
    limit?: number;
}

interface SearchCandidatesResponse {
    data: ApiCandidateData[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

/**
 * Search candidates using boolean search query
 * @param params - Search parameters (q, page, limit)
 * @returns Promise containing search results with mapped CandidateData
 */
export const searchCandidates = async (params: SearchCandidatesParams): Promise<{
    candidates: CandidateData[];
    totalResults: number;
    totalPages: number;
}> => {
    try {
        const queryParams = new URLSearchParams();

        if (params.search) queryParams.set('search', params.search);
        if (params.isBoolean !== undefined) queryParams.set('is_boolean', String(params.isBoolean));
        if (params.clientHiringFor) queryParams.set('client_hiring_for', params.clientHiringFor);
        if (params.employer) queryParams.set('employer', params.employer);
        if (params.keywords) queryParams.set('keywords', params.keywords);
        if (params.excludeKeywords) queryParams.set('exclude_keywords', params.excludeKeywords);
        if (params.designation) queryParams.set('designation', params.designation);
        if (params.expMin !== undefined) queryParams.set('exp_min', String(params.expMin));
        if (params.expMax !== undefined) queryParams.set('exp_max', String(params.expMax));
        if (params.salaryMin !== undefined) queryParams.set('salary_min', String(params.salaryMin));
        if (params.salaryMax !== undefined) queryParams.set('salary_max', String(params.salaryMax));
        if (params.currentLocation) queryParams.set('current_location', params.currentLocation);
        if (params.preferredLocation?.length) {
            params.preferredLocation.forEach((loc) => queryParams.append('preferred_location', loc));
        }
        if (params.noticePeriod?.length) {
            params.noticePeriod.forEach((notice) => queryParams.append('notice_period', notice));
        }
        if (params.preferredJobTitle) queryParams.set('preferred_job_title', params.preferredJobTitle);
        if (params.jobType) queryParams.set('job_type', params.jobType);
        if (params.workMode?.length) {
            params.workMode.forEach((mode) => queryParams.append('work_mode', mode));
        }
        if (params.gender) queryParams.set('gender', params.gender);
        if (params.pwdOnly !== undefined) queryParams.set('pwd_only', String(params.pwdOnly));
        if (params.createdWithinDays !== undefined) queryParams.set('created_within_days', String(params.createdWithinDays));
        if (params.modifiedWithinDays !== undefined) queryParams.set('modified_within_days', String(params.modifiedWithinDays));
        queryParams.set('page', String(params.page || 1));
        queryParams.set('limit', String(params.limit || 10));

        const response = await fetch(`${API_BASE_URL}/candidates/search/candidates?${queryParams}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                // Add authorization header if needed
                // 'Authorization': `Bearer ${getAccessToken()}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to search candidates: ${response.statusText}`);
        }

        const data: SearchCandidatesResponse = await response.json();
        
        return {
            candidates: mapApiCandidatesToCandidateDataArray(data.data),
            totalResults: data.pagination?.total || 0,
            totalPages: data.pagination?.pages || 0,
        };
    } catch (error) {
        console.error('Error searching candidates:', error);
        throw new Error('Failed to search candidates');
    }
};

/**
 * Fetches the last candidate ID from the API
 * @returns Promise containing the last candidate ID
 */
export const fetchLastCandidateId = async (): Promise<string> => {
    try {
        const response = await fetch(`${API_BASE_URL}/candidates/last-candidate-id`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                // Add authorization header if needed
                // 'Authorization': `Bearer ${getAccessToken()}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch last candidate ID: ${response.statusText}`);
        }

        const data: LastCandidateIdResponse = await response.json();
        return data.last_candidate_id;
    } catch (error) {
        console.error('Error fetching last candidate ID:', error);
        throw new Error('Failed to fetch last candidate ID');
    }
};

/**
 * Generates the next candidate ID by incrementing the last candidate ID
 * @param lastCandidateId - The last candidate ID (e.g., "THCAN-IND-2")
 * @returns The next candidate ID (e.g., "THCAN-IND-3")
 */
export const generateNextCandidateId = (lastCandidateId: string): string => {
    try {
        // Extract the number from the last candidate ID
        // Expected format: "THCAN-IND-X" where X is the number
        const parts = lastCandidateId.split('-');
        
        if (parts.length !== 3 || parts[0] !== 'THCAN' || parts[1] !== 'IND') {
            throw new Error(`Invalid candidate ID format: ${lastCandidateId}`);
        }

        const currentNumber = parseInt(parts[2], 10);
        
        if (isNaN(currentNumber)) {
            throw new Error(`Invalid number in candidate ID: ${lastCandidateId}`);
        }

        const nextNumber = currentNumber + 1;
        return `THCAN-IND-${nextNumber}`;
    } catch (error) {
        console.error('Error generating next candidate ID:', error);
        throw new Error('Failed to generate next candidate ID');
    }
};

/**
 * Fetches the last candidate ID and generates the next one
 * @returns Promise containing the next candidate ID
 */
export const getLastCandidateId = async (): Promise<string> => {
    try {
        return await fetchLastCandidateId();
    } catch (error) {
        console.error('Error getting last candidate ID:', error);
        throw error;
    }
};

/**
 * Maps Candidate API response to CandidateData format for CandidateCard display
 * 
 * DUMMY FIELDS (always set to default values):
 * - profileViews: 0 (placeholder)
 * - downloads: 0 (placeholder)
 * - similarProfiles: 0 (placeholder - kept for future mock usage)
 * 
 * AVATAR:
 * - Uses candidate_picture from API if available, otherwise undefined
 * 
 * EDUCATION:
 * - Mapped from education array with degree, subject, university, year_of_passing
 * 
 * @param candidate - Candidate data from API
 * @returns CandidateData formatted for display
 */
export const mapApiCandidateToCandidateData = (candidate: ApiCandidateData): CandidateData => {
    // Get current and previous company from employment array
    const currentJob = (candidate as any).employment?.[0];
    const previousJob = (candidate as any).employment?.[1];

    // Extract primary and secondary skills
    const primarySkills = Array.isArray(candidate.primary_skill)
        ? (candidate.primary_skill as any[]).flat(Infinity).map((s: any) => String(s)).filter(Boolean)
        : typeof (candidate.primary_skill as unknown) === 'string'
            ? (candidate.primary_skill as unknown as string).split(',').map((s: string) => s.trim()).filter(Boolean)
            : [];
    
    const additionalSkills = Array.isArray(candidate.additional_skill)
        ? (candidate.additional_skill as any[]).flat(Infinity).map((s: any) => String(s)).filter(Boolean)
        : typeof (candidate.additional_skill as unknown) === 'string'
            ? (candidate.additional_skill as unknown as string).split(',').map((s: string) => s.trim()).filter(Boolean)
            : [];

    // Map education array
    const educationData = (candidate as any).education && (candidate as any).education.length > 0
        ? (candidate as any).education.map((edu: any) => ({
            degree: edu.highest_degree,
            subject: edu.subject,
            university: edu.university,
            passingYear: edu.year_of_passing,
        }))
        : [];

    // Extract certifications
    const certifications = (candidate as any).certifications?.map((c: any) => c.certification_name) || [];

    return {
        id: candidate.id?.toString() || candidate._id || '',
        candidateId: candidate.candidate_id || '',
        name: candidate.display_name,
        title: currentJob?.designation || 'N/A',
        avatar: candidate.candidate_picture || undefined,
        experience: candidate.total_experience?.toString() || '0',
        location: (candidate as any).current_location || candidate.current_city || 'N/A',
        currentCompany: currentJob?.organization_name || 'N/A',
        previousCompany: previousJob?.organization_name || 'N/A',
        education: educationData.length > 0 ? educationData : (candidate as any).education?.[0]?.highest_degree || '',
        preferredLocations: (candidate as any).preferred_location
            ? (candidate as any).preferred_location.split(',').map((l: string) => l.trim())
            : [],
        keySkills: primarySkills,
        additionalSkills: additionalSkills,
        salary: `${candidate.current_ctc || '0'} - ${candidate.expected_ctc || '0'}`,
        availability: (candidate as any).notice_period || 'N/A',
        lastActive: new Date((candidate as any).updated).toLocaleDateString() || 'Recently',
        profileViews: 0, // Dummy value
        downloads: 0, // Dummy value
        similarProfiles: 0, // Kept for mock usage
        certifications: certifications,
        workType: (candidate as any).job_open_type || [],
        email: candidate.email,
        phone: candidate.phone?.toString(),
        summary: (candidate as any).profile_summary,
        portfolioUrl: candidate.linkedin_profile || undefined,
        resumeUrl: candidate.resume_url || undefined,
        isActivelyLooking: (candidate as any).source_details?.is_actively_looking,
        gender: candidate.gender,
        personWithDisability: candidate.differently_abled,
    };
};

/**
 * Maps an array of Candidates to CandidateData array
 * @param candidates - Array of Candidate data from API
 * @returns Array of CandidateData formatted for display
 */
export const mapApiCandidatesToCandidateDataArray = (candidates: ApiCandidateData[]): CandidateData[] => {
    return candidates.map(candidate => mapApiCandidateToCandidateData(candidate));
};