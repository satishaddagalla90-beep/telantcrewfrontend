import { DropdownOption } from './types';
import { apiCall } from './useSWR';

// Unified dropdown response type
export interface DropdownsResponse {
  Locations?:
  | Array<{
    name: string;
    country: string;
    state: string;
    city: string;
  }>
  | string[];
  Designation?:
  | Array<{
    value: {
      id: string;
      name: string;
    };
    label: {
      id: string;
      name: string;
    };
  }>
  | string[];
  Designations?:
  | Array<{
    value: {
      id: string;
      name: string;
    };
    label: {
      id: string;
      name: string;
    };
  }>
  | string[];
  Department?: string[];
  Departments?: string[];
  users?: {
    _id: string;
    display_name: string;
    designation: string;
  }[];
  Roles?: RoleWithPermissions[]; // Updated to support roles with permissions
}

// Role with permissions interface
export interface RoleWithPermissions {
  name: string;
  permissions: {
    candidate: string; // binary string like "1111"
    client: string;
    job: string;
    supplier: string;
    users: string;
  };
}

// Candidates dropdown response type
export interface CandidateDropdownsResponse {
  Flags?: string[];
  Employer?: string[];
  NoticePeriod?: string[];
}

export interface DropdownDataItem {
  id: string;
  name: string;
}
export interface StaticDropdownsResponse {
  static_dropdowns: {
    Gender?: DropdownDataItem[];
    Marital?: DropdownDataItem[];
    NoticePeriod?: DropdownDataItem[];
    preferred_job?: DropdownDataItem[];
    JobOpenType?: DropdownDataItem[];
    Job_Type?: DropdownDataItem[];
    Shifts?: DropdownDataItem[];
    CareerBreakType?: DropdownDataItem[];
    EducationType?: DropdownDataItem[];
    ProjectType?: DropdownDataItem[];
    Source_Type?: DropdownDataItem[];
    Flags?: DropdownDataItem[];
  };
}

// Generic dropdown response type for individual dropdown types
export interface GenericDropdownResponse {
  dropdown_type: string;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  data: Array<{
    id: string;
    name: string;
    education_type?: string; // For Degree dropdown
    degree?: string; // For Subject dropdown
    source_type?: string; // For Source_name dropdown
    permissions?: any;
  }>;
}

// Types for dropdown responses
export interface LocationsResponse {
  Locations: Array<{
    name: string;
    country: string;
    state: string;
    city: string;
  }>;
}

export interface DesignationsResponse {
  Designation:
  | Array<{
    value: {
      id: string;
      name: string;
    };
    label: {
      id: string;
      name: string;
    };
  }>
  | string[]; // Support both new and old formats
}

export interface DepartmentsResponse {
  Department: string[];
}

export interface UsersResponse {
  users: {
    _id: string;
    display_name: string;
    designation: string;
  }[];
}

// API functions

export const dropdownAPI = {
  fetchDropdowns: async (): Promise<DropdownsResponse | null> => {
    try {
      const response = await apiCall<DropdownsResponse>(`/usersdropdowns`);
      if (response.error) {
        throw new Error(response.error.message || 'Failed to fetch dropdowns');
      }
      return response.data || null;
    } catch (error) {
      console.error('Error fetching dropdowns:', error);
      return null;
    }
  },

  fetchLocations: async (): Promise<DropdownOption[]> => {
    try {
      const response = await apiCall<GenericDropdownResponse>(
        `/usersdropdowns/Locations`
      );
      if (response.error) {
        throw new Error(response.error.message || 'Failed to fetch locations');
      }
      const data = response.data?.data;
      if (data && Array.isArray(data)) {
        // Always return city only
        return data.map(item => ({
          id: item.id,
          value: item.name, // Use name as city
          label: item.name, // Use name as city
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching locations:', error);
      return [];
    }
  },

  fetchDesignations: async (): Promise<DropdownOption[]> => {
    try {
      const response = await apiCall<GenericDropdownResponse>(
        `/usersdropdowns/Designation`
      );
      if (response.error) {
        throw new Error(response.error.message || 'Failed to fetch designations');
      }
      const data = response.data?.data;
      if (data && Array.isArray(data)) {
        return data.map(item => ({
          id: item.id,
          value: item.id, // Store ID instead of name
          label: item.name, // Display name
          // Preserve optional color metadata if backend provides it (e.g., item.color or item.hex)
          color: (item as any).color || (item as any).hex || undefined,
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching designations:', error);
      return [];
    }
  },

  fetchDepartments: async (): Promise<DropdownOption[]> => {
    try {
      const response = await apiCall<GenericDropdownResponse>(
        `/usersdropdowns/Department`
      );
      if (response.error) {
        throw new Error(response.error.message || 'Failed to fetch departments');
      }
      const data = response.data?.data;
      if (data && Array.isArray(data)) {
        return data.map(item => ({
          id: item.id,
          value: item.id, // Store ID instead of name
          label: item.name, // Display name
          // Preserve optional color metadata if backend provides it (e.g., item.color or item.hex)
          color: (item as any).color || (item as any).hex || undefined,
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching departments:', error);
      return [];
    }
  },

  fetchReportingToUsers: async (
    searchTerm: string = ''
  ): Promise<DropdownOption[]> => {
    try {
      // Build query parameters for search
      const params = new URLSearchParams();
      params.append('limit', '20'); // Increase limit for better search results

      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }

      const response = await apiCall<{
        users: {
          id: string;
          first_name: string;
          last_name?: string;
          middle_name?: string;
          designation: string;
        }[];
      }>(`/users/?${params.toString()}`);
      if (response.error) {
        throw new Error(response.error.message || 'Failed to fetch users');
      }
      const users = response.data?.users;
      if (users && Array.isArray(users)) {
        return users.map(user => {
          // Create display name: first_name + middle_name + last_name
          const displayName = [
            user.first_name,
            user.middle_name,
            user.last_name,
          ]
            .filter(Boolean)
            .join(' ');

          return {
            value: user.id, // Send user ID as expected by backend (or full object if needed)
            label: `${displayName} (${user.designation})`,
            id: user.id,
            // Include full details for backend
            email: (user as any).email || '',
            first_name: user.first_name,
            last_name: user.last_name,
            department: (user as any).department || [],
            designation: user.designation || ''
          };
        });
      }
      return [];
    } catch (error) {
      console.error('Error fetching reporting to users:', error);
      return [];
    }
  },

  // Async search function for user dropdowns (compatible with CreatableAsyncSelect)
  searchUsers: async (inputValue: string): Promise<DropdownOption[]> => {
    try {
      // Build query parameters for search
      const params = new URLSearchParams();
      params.append('limit', '20');
      if (inputValue.trim()) {
        params.append('search', inputValue.trim());
      }

      const response = await apiCall<{
        users: {
          id: string;
          first_name: string;
          last_name?: string;
          middle_name?: string;
          designation: string;
        }[];
      }>(`/users/?${params.toString()}`);
      if (response.error) {
        throw new Error(response.error.message || 'Failed to search users');
      }

      const users = response.data?.users;
      if (users && Array.isArray(users)) {
        return users.map(user => {
          // Create display name: first_name + middle_name + last_name
          const displayName = [
            user.first_name,
            user.middle_name,
            user.last_name,
          ]
            .filter(Boolean)
            .join(' ');

          return {
            value: user.id, // Send user ID instead of display name
            label: `${displayName} (${user.designation})`,
          };
        });
      }
      return [];
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  },

  fetchRoles: async (): Promise<DropdownOption[]> => {
    try {
      const response = await apiCall<GenericDropdownResponse>(
        `/usersdropdowns/Roles`
      );
      if (response.error) {
        throw new Error(response.error.message || 'Failed to fetch roles');
      }
      const data = response.data?.data;
      if (data && Array.isArray(data)) {
        return data.map(item => ({
          id: item.id,
          value: item.id, // Store ID instead of name
          label: item.name, // Display name
          // Preserve optional color metadata if backend provides it (e.g., item.color or item.hex)
          color: (item as any).color || (item as any).hex || undefined,
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching roles:', error);
      return [];
    }
  },

  // Fetch roles with their permission configurations
  fetchRolesWithPermissions: async (): Promise<RoleWithPermissions[]> => {
    try {
      const response = await apiCall<GenericDropdownResponse>(
        `/usersdropdowns/Roles?limit=1000`
      );
      if (response.error) {
        throw new Error(response.error.message || 'Failed to fetch roles');
      }
      const data = response.data?.data;
      if (data && Array.isArray(data)) {
        // Convert the new format to RoleWithPermissions[]
        return data.map((item: any) => ({
          name: item.name || item.label || '',
          permissions: {
            candidate: (item.permissions?.candidate !== undefined) ? item.permissions.candidate :
              ((item.permissions && typeof item.permissions === 'object') ?
                (item.permissions['candidate'] || '0000') : '0000'),
            client: (item.permissions?.client !== undefined) ? item.permissions.client :
              ((item.permissions && typeof item.permissions === 'object') ?
                (item.permissions['client'] || '0000') : '0000'),
            job: (item.permissions?.job !== undefined) ? item.permissions.job :
              ((item.permissions && typeof item.permissions === 'object') ?
                (item.permissions['job'] || '0000') : '0000'),
            supplier: (item.permissions?.supplier !== undefined) ? item.permissions.supplier :
              ((item.permissions && typeof item.permissions === 'object') ?
                (item.permissions['supplier'] || '0000') : '0000'),
            users: (item.permissions?.users !== undefined) ? item.permissions.users :
              ((item.permissions && typeof item.permissions === 'object') ?
                (item.permissions['users'] || '0000') : '0000'),
          },
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching roles with permissions:', error);
      return [];
    }
  },

  fetchCandidateFlags: async (): Promise<DropdownOption[]> => {
    try {
      const response = await apiCall<CandidateDropdownsResponse>(
        `/candidates/dropdowns`
      );
      if (response.error) {
        throw new Error(
          response.error.message || 'Failed to fetch candidate flags'
        );
      }
      const flags = response.data?.Flags;
      if (flags && Array.isArray(flags)) {
        return flags.map((flag: string) => ({
          value: flag,
          label: flag,
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching candidate flags:', error);
      return [];
    }
  },

  fetchCandidateEmployers: async (): Promise<DropdownOption[]> => {
    try {
      const response = await apiCall<CandidateDropdownsResponse>(
        `/candidates/dropdowns`
      );
      if (response.error) {
        throw new Error(
          response.error.message || 'Failed to fetch candidate employers'
        );
      }
      const employers = response.data?.Employer;
      if (employers && Array.isArray(employers)) {
        return employers.map((employer: string) => ({
          value: employer.replace(/\s+/g, '_'),
          label: employer,
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching candidate employers:', error);
      return [];
    }
  },

  fetchCandidateNoticePeriods: async (): Promise<DropdownOption[]> => {
    try {
      const response = await apiCall<CandidateDropdownsResponse>(
        `/candidates/dropdowns`
      );
      if (response.error) {
        throw new Error(
          response.error.message || 'Failed to fetch candidate notice periods'
        );
      }
      const noticePeriods = response.data?.NoticePeriod;
      if (noticePeriods && Array.isArray(noticePeriods)) {
        return noticePeriods.map((period: string) => ({
          value: period.replace(/\s+/g, '_'),
          label: period,
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching candidate notice periods:', error);
      return [];
    }
  },

  // Generic function to fetch any dropdown type from candidates API
  fetchCandidateDropdown: async (
    dropdownType: string
  ): Promise<DropdownOption[]> => {
    try {
      const response = await apiCall<GenericDropdownResponse>(
        `/candidates/dropdowns/${dropdownType}`
      );
      if (response.error) {
        throw new Error(
          response.error.message || `Failed to fetch ${dropdownType} dropdown`
        );
      }
      const data = response.data?.data;
      if (data && Array.isArray(data)) {
        return data.map(item => ({
          id: item.id,
          value: item.id, // Store ID instead of name
          label: item.name, // Display name
          // Preserve optional color metadata if backend provides it (e.g., item.color or item.hex)
          color: (item as any).color || (item as any).hex || undefined,
        }));
      }
      return [];
    } catch (error) {
      console.error(`Error fetching ${dropdownType} dropdown:`, error);
      return [];
    }
  },

  // Generic function to fetch any dropdown type from users API
  fetchUserDropdown: async (
    dropdownType: string
  ): Promise<DropdownOption[]> => {
    try {
      const response = await apiCall<GenericDropdownResponse>(
        `/usersdropdowns/${dropdownType}`
      );
      if (response.error) {
        throw new Error(
          response.error.message || `Failed to fetch ${dropdownType} dropdown`
        );
      }
      const data = response.data?.data;
      if (data && Array.isArray(data)) {
        return data.map(item => ({
          id: item.id,
          value: item.id, // Store ID instead of name
          label: item.name, // Display name
          // Preserve optional color metadata if backend provides it (e.g., item.color or item.hex)
          color: (item as any).color || (item as any).hex || undefined,
        }));
      }
      return [];
    } catch (error) {
      console.error(`Error fetching ${dropdownType} dropdown:`, error);
      return [];
    }
  },

  // Searchable version of fetchUserDropdown with pagination and search
  fetchUserDropdownSearchable: async (
    dropdownType: string,
    searchTerm: string = '',
    page: number = 1,
    limit: number = 20,
    additionalParams?: Record<string, string>
  ): Promise<DropdownOption[]> => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      // Add any additional parameters
      if (additionalParams) {
        Object.entries(additionalParams).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });
      }

      const response = await apiCall<GenericDropdownResponse>(
        `/usersdropdowns/${dropdownType}?${params}`
      );
      if (response.error) {
        throw new Error(
          response.error.message || `Failed to fetch ${dropdownType} dropdown`
        );
      }
      let data = response.data?.data;
      if (data && Array.isArray(data)) {
        return data.map(item => ({
          id: item.id,
          value: item.name, // Use Name as value to match form data strings and avoid duplicates
          label: item.name, // Display name
          permissions: item.permissions,
          // Preserve optional color metadata if backend provides it
          color: (item as any).color || (item as any).hex || undefined,
        }));
      }
      return [];
    } catch (error) {
      console.error(
        `Error fetching searchable ${dropdownType} dropdown:`,
        error
      );
      return [];
    }
  },

  // Searchable version of fetchCandidateDropdown with pagination and search
  fetchCandidateDropdownSearchable: async (
    dropdownType: string,
    searchTerm: string = '',
    page: number = 1,
    limit: number = 20,
    additionalParams?: Record<string, string>
  ): Promise<DropdownOption[]> => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      // Add any additional parameters
      if (additionalParams) {
        Object.entries(additionalParams).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });
      }

      const response = await apiCall<GenericDropdownResponse>(
        `/candidates/dropdowns/${dropdownType}?${params}`
      );
      if (response.error) {
        throw new Error(
          response.error.message || `Failed to fetch ${dropdownType} dropdown`
        );
      }
      let data = response.data?.data;
      if (data && Array.isArray(data)) {
        // Filter data based on additionalParams if present
        // This handles cases where backend might return all data or mixed data
        if (additionalParams) {

          data = data.filter(item => {
            let matches = true;

            // Check specific filter keys if they exist in additionalParams
            if (additionalParams.source_type && item.source_type) {
              matches = matches && item.source_type === additionalParams.source_type;
            }
            if (additionalParams.education_type && item.education_type) {
              matches = matches && item.education_type === additionalParams.education_type;
            }
            if (additionalParams.degree && item.degree) {
              matches = matches && item.degree === additionalParams.degree;
            }

            return matches;
          });
        }

        return data.map(item => ({
          ...item, // distinct properties from item will be included
          id: item.id,
          value: item.id, // Store ID instead of name
          label: item.name, // Display name
          // Preserve optional color metadata if backend provides it
          color: (item as any).color || (item as any).hex || undefined,
        }));
      }
      return [];
    } catch (error) {
      console.error(
        `Error fetching searchable ${dropdownType} dropdown:`,
        error
      );
      return [];
    }
  },

  // Generic function to fetch any dropdown type from job API
  fetchJobsDropdown: async (
    dropdownType: string
  ): Promise<DropdownOption[]> => {
    try {
      const response = await apiCall<GenericDropdownResponse>(
        `/job/dropdowns/${dropdownType}`
      );
      if (response.error) {
        throw new Error(
          response.error.message || `Failed to fetch ${dropdownType} dropdown`
        );
      }
      const data = response.data?.data;
      if (data && Array.isArray(data)) {
        return data.map(item => ({
          id: item.id,
          value: item.id, // Store ID instead of name
          label: item.name, // Display name
        }));
      }
      return [];
    } catch (error) {
      console.error(
        `Error fetching ${dropdownType} dropdown from job API:`,
        error
      );
      return [];
    }
  },

  // Searchable version of fetchJobsDropdown with pagination and search
  fetchJobsDropdownSearchable: async (
    dropdownType: string,
    searchTerm: string = '',
    page: number = 1,
    limit: number = 20,
    additionalParams?: Record<string, string>
  ): Promise<DropdownOption[]> => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      // Add any additional parameters
      if (additionalParams) {
        Object.entries(additionalParams).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });
      }

      const response = await apiCall<GenericDropdownResponse>(
        `/job/dropdowns/${dropdownType}?${params}`
      );
      if (response.error) {
        throw new Error(
          response.error.message || `Failed to fetch ${dropdownType} dropdown`
        );
      }
      const data = response.data?.data;
      if (data && Array.isArray(data)) {
        return data.map((item: any) => {
          // Handle special label fields per collection type
          let label = item.name;
          if (dropdownType === 'Client') {
            label = item.client_name || item.name;
          } else if (dropdownType === 'Users') {
            label = [item.display_name, item.middle_name, item.last_name]
              .filter(Boolean)
              .join(' ') || item.name;
          }

          return {
            id: item.id,
            value: item.id,
            label,
            color: item.color || item.hex || undefined,
          };
        });
      }
      return [];
    } catch (error) {
      console.error(
        `Error fetching searchable ${dropdownType} dropdown from job API:`,
        error
      );
      return [];
    }
  },

  // Specific function for gender dropdown
  fetchGender: async (): Promise<DropdownOption[]> => {
    return await dropdownAPI.fetchCandidateDropdown('Gender');
  },

  // Specific function for marital status dropdown
  fetchMaritalStatus: async (): Promise<DropdownOption[]> => {
    return await dropdownAPI.fetchCandidateDropdown('Marital');
  },

  // Specific function for notice period dropdown
  fetchNoticePeriod: async (): Promise<DropdownOption[]> => {
    return await dropdownAPI.fetchCandidateDropdown('NoticePeriod');
  },

  // Specific function for job preference dropdown
  fetchJobPreference: async (): Promise<DropdownOption[]> => {
    return await dropdownAPI.fetchJobsDropdown('preferred_job');
  },

  // Specific function for skill category dropdown
  fetchSkillCategory: async (): Promise<DropdownOption[]> => {
    return await dropdownAPI.fetchJobsDropdown('Skill Category');
  },

  // Specific function for job open type dropdown
  fetchJobOpenType: async (): Promise<DropdownOption[]> => {
    return await dropdownAPI.fetchJobsDropdown('JobOpenType');
  },

  // Specific function for shifts dropdown
  fetchShifts: async (): Promise<DropdownOption[]> => {
    return await dropdownAPI.fetchJobsDropdown('Shifts');
  },

  // Specific function for job type dropdown
  fetchJobType: async (): Promise<DropdownOption[]> => {
    return await dropdownAPI.fetchJobsDropdown('Job_Type');
  },

  // Job-specific dropdowns
  fetchEmploymentType: async (): Promise<DropdownOption[]> => {
    return await dropdownAPI.fetchJobsDropdown('Employment_Type');
  },

  fetchJobPriority: async (): Promise<DropdownOption[]> => {
    return await dropdownAPI.fetchJobsDropdown('job_priority');
  },

  fetchJobStatus: async (): Promise<DropdownOption[]> => {
    return await dropdownAPI.fetchJobsDropdown('job_status');
  },

  fetchBGCType: async (): Promise<DropdownOption[]> => {
    return await dropdownAPI.fetchJobsDropdown('BGC');
  },

  fetchBillPeriod: async (): Promise<DropdownOption[]> => {
    return await dropdownAPI.fetchJobsDropdown('Bill_Period');
  },

  fetchGenderPreference: async (): Promise<DropdownOption[]> => {
    return await dropdownAPI.fetchJobsDropdown('Gender');
  },

  fetchIndustry: async (): Promise<DropdownOption[]> => {
    return await dropdownAPI.fetchJobsDropdown('Industry');
  },

  // Specific function for career break type dropdown
  fetchCareerBreakType: async (): Promise<DropdownOption[]> => {
    return await dropdownAPI.fetchCandidateDropdown('CareerBreakType');
  },

  // Specific function for education type dropdown
  fetchEducationType: async (): Promise<DropdownOption[]> => {
    return await dropdownAPI.fetchCandidateDropdown('EducationType');
  },

  // Specific function for degree dropdown
  fetchDegree: async (): Promise<DropdownOption[]> => {
    return await dropdownAPI.fetchCandidateDropdown('Degree');
  },

  // Specific function for subject dropdown
  fetchSubject: async (): Promise<DropdownOption[]> => {
    return await dropdownAPI.fetchCandidateDropdown('Subject');
  },

  // Specific function for college dropdown
  fetchCollege: async (): Promise<DropdownOption[]> => {
    return await dropdownAPI.fetchCandidateDropdown('College');
  },

  // Specific function for university dropdown
  fetchUniversity: async (): Promise<DropdownOption[]> => {
    return await dropdownAPI.fetchCandidateDropdown('University');
  },

  // Specific function for employer dropdown
  fetchEmployer: async (): Promise<DropdownOption[]> => {
    return await dropdownAPI.fetchCandidateDropdown('Employer');
  },

  // Fetch static dropdowns from /candidates/dropdown/static
  fetchStaticDropdowns: async (): Promise<StaticDropdownsResponse | null> => {
    try {
      const response = await apiCall<StaticDropdownsResponse>(
        `/candidates/dropdown/static`
      );
      if (response.error) {
        throw new Error(
          response.error.message || 'Failed to fetch static dropdowns'
        );
      }
      return response.data || null;
    } catch (error) {
      console.error('Error fetching static dropdowns:', error);
      return null;
    }
  },

  // Add new dropdown option
  addDropdownOption: async (
    dropdownType: string,
    payload: { name: string; education_type?: string }
  ): Promise<{ id: string; name: string } | null> => {
    try {
      const response = await apiCall<{ id: string; name: string }>(
        `/common/add_dropdowns/${dropdownType}`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );

      if (response.error) {
        throw new Error(response.error.message || 'Failed to add option');
      }

      return response.data || null;
    } catch (error) {
      console.error(`Error adding ${dropdownType} option:`, error);
      throw error;
    }
  },

  // Searchable recruitment dropdowns — calls /recruitment/dropdowns/{type}
  fetchRecruitmentDropdownSearchable: async (
    dropdownType: string,
    searchTerm: string = '',
    page: number = 1,
    limit: number = 20
  ): Promise<DropdownOption[]> => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const response = await apiCall<GenericDropdownResponse>(
        `/recruitment/dropdowns/${dropdownType}?${params}`
      );
      if (response.error) {
        throw new Error(
          response.error.message || `Failed to fetch ${dropdownType} recruitment dropdown`
        );
      }
      const data = response.data?.data;
      if (data && Array.isArray(data)) {
        return data.map((item: any) => {
          // Build the display label based on what each collection returns
          let label: string;
          if (dropdownType === 'Client') {
            label = item.client_name || item.name || item.id;
          } else if (dropdownType === 'mapped_by' || dropdownType === 'job_owner') {
            // Users collection: display_name + middle_name + last_name
            label = [item.display_name, item.middle_name, item.last_name]
              .filter(Boolean)
              .join(' ') || item.name || item.id;
          } else {
            label = item.name || item.id;
          }

          return {
            id: item.id,
            value: label,
            label,
          };
        });
      }
      return [];
    } catch (error) {
      console.error(`Error fetching recruitment ${dropdownType} dropdown:`, error);
      return [];
    }
  },
};



// Named exports for convenience
export const fetchGender = dropdownAPI.fetchGender;
export const fetchMaritalStatus = dropdownAPI.fetchMaritalStatus;
export const fetchNoticePeriod = dropdownAPI.fetchNoticePeriod;
export const fetchJobPreference = dropdownAPI.fetchJobPreference;
export const fetchJobOpenType = dropdownAPI.fetchJobOpenType;
export const fetchShifts = dropdownAPI.fetchShifts;
export const fetchJobType = dropdownAPI.fetchJobType;
export const fetchEmploymentType = dropdownAPI.fetchEmploymentType;
export const fetchJobPriority = dropdownAPI.fetchJobPriority;
export const fetchJobStatus = dropdownAPI.fetchJobStatus;
export const fetchBGCType = dropdownAPI.fetchBGCType;
export const fetchBillPeriod = dropdownAPI.fetchBillPeriod;
export const fetchGenderPreference = dropdownAPI.fetchGenderPreference;
export const fetchIndustry = dropdownAPI.fetchIndustry;
export const fetchCareerBreakType = dropdownAPI.fetchCareerBreakType;
export const fetchEducationType = dropdownAPI.fetchEducationType;
export const fetchRolesWithPermissions = dropdownAPI.fetchRolesWithPermissions;
export const fetchDegree = dropdownAPI.fetchDegree;
export const fetchSubject = dropdownAPI.fetchSubject;
export const fetchCollege = dropdownAPI.fetchCollege;
export const fetchUniversity = dropdownAPI.fetchUniversity;
export const fetchEmployer = dropdownAPI.fetchEmployer;
export const fetchStaticDropdowns = dropdownAPI.fetchStaticDropdowns;
export const fetchJobsDropdownSearchable = dropdownAPI.fetchJobsDropdownSearchable;
export const fetchRecruitmentDropdownSearchable = dropdownAPI.fetchRecruitmentDropdownSearchable;