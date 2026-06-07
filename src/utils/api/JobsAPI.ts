import { apiCall } from './index';
import { API_ENDPOINTS } from './endpoints';
import {
  JobAPI,
  JobsAPIResponse,
  JobListItem,
  JobSearchParams,
  JobFilters,
} from '../../types/job';
import { getEffectiveJobStatus } from '../../utils/tatStatusOverride';

/**
 * Jobs API Service
 * Handles all job-related API operations for the jobs listing
 */
export class JobsAPI {
  /**
   * Fetch jobs with pagination and filters
   */
  static async getJobs(params: JobSearchParams = {}): Promise<JobsAPIResponse> {
    const {
      page = 1,
      limit = 10,
      search,
      filters = {},
      sort_by,
      sort_order,
    } = params;

    // Build query parameters
    const queryParams = new URLSearchParams();
    queryParams.append('page', page.toString());
    queryParams.append('limit', limit.toString());

    // Add search parameter
    if (search && search.trim()) {
      queryParams.append('search', search.trim());
    }

    // Add filter parameters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          // Handle array filters
          if (value.length > 0) {
            if (key === 'job_location') {
              // Backend expects comma-separated string for job_location
              queryParams.append(key, value.join(', '));
            } else {
              value.forEach(item => {
                queryParams.append(key, item.toString());
              });
            }
          }
        } else if (typeof value === 'object') {
          // Handle date range filters
          if (key === 'date_range' && value.start) {
            queryParams.append('start_date', value.start);
            if (value.end) {
              queryParams.append('end_date', value.end);
            }
          }
        } else {
          // Handle string/number filters
          queryParams.append(key, value.toString());
        }
      }
    });

    // Add sorting parameters
    if (sort_by) {
      queryParams.append('sort_by', sort_by);
      queryParams.append('sort_order', sort_order || 'asc');
    }

    const url = `${API_ENDPOINTS.JOBS.LIST}?${queryParams.toString()}`;

    try {
      const response = await apiCall<JobsAPIResponse>(url, {
        method: 'GET',
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to fetch jobs');
      }

      return response.data!;
    } catch (error) {
      console.error('Error fetching jobs:', error);
      throw error;
    }
  }

  /**
   * Get a single job by ID
   */
  static async getJob(id: string): Promise<JobAPI> {
    try {
      const response = await apiCall<JobAPI>(API_ENDPOINTS.JOBS.GET(id), {
        method: 'GET',
      });

      if (response.error) {
        throw new Error(response.error.message || `Failed to fetch job ${id}`);
      }

      return response.data!;
    } catch (error) {
      console.error(`Error fetching job ${id}:`, error);
      throw error;
    }
  }

  /**
   * Transform API job data to list item format
   * Updated to use flattened API structure
   */
  static transformToListItem(job: JobAPI): JobListItem {
    // Apply TAT status override: if TAT time has passed, override status to "Freeze"
    const effectiveStatus = getEffectiveJobStatus(job.job_status, job.tat);
    
    return {
      id: job.id,
      job_id: job.job_id,
      job_title: job.job_title,
      job_priority: job.job_priority,
      job_status: effectiveStatus,
      job_type: job.job_type,
      employment_type: job.employment_type,
      bgc_type: job.bgc_type,
      client_name: job.client?.client_name || '',
      end_client_name: job.client?.end_client_name,
      client_requirement_id: job.client?.client_requirement_id,
      job_location: job.job_location,
      primary_skills: job.primary_skill_set,
      secondary_skills: job.secondary_skill_set,
      total_experience: job.total_experience,
      client_bill_rate: job.client_bill_rate,
      client_bill_period: job.client_bill_period,
      no_of_position: job.no_of_position,
      job_owner: job.job_owner,
      assigned_to: job.assigned_to,
      created_by: job.created_by,
      updated_by: job.updated_by,
      created_date: job.created,
      job_date: job.job_date,
      received_date: job.received_date,
      preferred_job: job.preferred_job,
      skill_category: job.skill_category,
      ismapped: job.ismapped,
    };
  }  /**
   * Transform API response to list items
   */
  static transformResponse(response: JobsAPIResponse): JobListItem[] {
    return response.Job.map(job => this.transformToListItem(job));
  }

  /**
   * Search jobs by query string
   */
  static async searchJobs(
    query: string,
    filters?: JobFilters,
    page: number = 1,
    limit: number = 10
  ): Promise<JobsAPIResponse> {
    return this.getJobs({
      search: query,
      filters,
      page,
      limit,
    });
  }

  /**
   * Get jobs by status
   */
  static async getJobsByStatus(
    status: string,
    page: number = 1,
    limit: number = 10
  ): Promise<JobsAPIResponse> {
    return this.getJobs({
      filters: { job_status: [status] },
      page,
      limit,
    });
  }

  /**
   * Get jobs by priority
   */
  static async getJobsByPriority(
    priority: string,
    page: number = 1,
    limit: number = 10
  ): Promise<JobsAPIResponse> {
    return this.getJobs({
      filters: { job_priority: [priority] },
      page,
      limit,
    });
  }

  /**
   * Get jobs by client
   */
  static async getJobsByClient(
    clientName: string,
    page: number = 1,
    limit: number = 10
  ): Promise<JobsAPIResponse> {
    return this.getJobs({
      filters: { client_name: [clientName] },
      page,
      limit,
    });
  }

  /**
   * Get jobs assigned to user
   */
  static async getJobsAssignedTo(
    assignee: string,
    page: number = 1,
    limit: number = 10
  ): Promise<JobsAPIResponse> {
    return this.getJobs({
      filters: { assigned_to: [assignee] },
      page,
      limit,
    });
  }

  /**
   * Get jobs owned by user
   */
  static async getJobsByOwner(
    owner: string,
    page: number = 1,
    limit: number = 10
  ): Promise<JobsAPIResponse> {
    return this.getJobs({
      filters: { job_owner: [owner] },
      page,
      limit,
    });
  }

  /**
   * Update an existing job
   */
  static async updateJob(
    id: string,
    jobData: Partial<JobAPI>
  ): Promise<JobAPI> {
    try {
      const response = await apiCall<JobAPI>(API_ENDPOINTS.JOBS.UPDATE(id), {
        method: 'PATCH',
        body: JSON.stringify(jobData),
      });

      if (response.error) {
        throw new Error(response.error.message || `Failed to update job ${id}`);
      }

      return response.data!;
    } catch (error) {
      console.error(`Error updating job ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a job
   */
  static async deleteJob(id: string): Promise<void> {
    try {
      const response = await apiCall<void>(API_ENDPOINTS.JOBS.DELETE(id), {
        method: 'DELETE',
      });

      if (response.error) {
        throw new Error(response.error.message || `Failed to delete job ${id}`);
      }
    } catch (error) {
      console.error(`Error deleting job ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete multiple jobs
   */
  static async deleteJobs(
    ids: string[]
  ): Promise<{ success: string[]; failed: string[] }> {
    const results = { success: [] as string[], failed: [] as string[] };

    // Process deletions sequentially to avoid overwhelming the server
    for (const id of ids) {
      try {
        await this.deleteJob(id);
        results.success.push(id);
      } catch (error) {
        console.error(`Failed to delete job ${id}:`, error);
        results.failed.push(id);
      }
    }

    return results;
  }

  /**
   * Get job dropdown options
   */
  static async getJobDropdowns(
    dropdownType: string,
    searchTerm: string = ''
  ): Promise<Array<{ value: string; label: string }>> {
    try {
      const params = new URLSearchParams();
      params.append('limit', '20');
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }

      const response = await apiCall<{
        data: Array<{
          id: string;
          name: string;
          client_name?: string;
          display_name?: string;
          middle_name?: string;
          last_name?: string;
        }>;
      }>(
        `${API_ENDPOINTS.JOBS.LIST}dropdowns/${dropdownType}?${params.toString()}`,
        {
          method: 'GET',
        }
      );

      if (response.error) {
        throw new Error(
          response.error.message || `Failed to fetch ${dropdownType} dropdown`
        );
      }

      const data = response.data?.data;
      if (data && Array.isArray(data)) {
        return data.map(item => {
          let label = item.name;
          if (dropdownType === 'Client') {
            label = item.client_name || item.name;
          } else if (dropdownType === 'Users') {
            label = [item.display_name, item.middle_name, item.last_name]
              .filter(Boolean)
              .join(' ') || item.name;
          }
          return { value: label, label };
        });
      }

      return [];
    } catch (error) {
      console.error(`Error fetching ${dropdownType} dropdown:`, error);
      throw error;
    }
  }

  /**
   * Get job priorities dropdown
   */
  static async getJobPriorities(
    searchTerm: string = ''
  ): Promise<
    Array<{ value: string; label: string }>
  > {
    return this.getJobDropdowns('job_priority', searchTerm);
  }

  /**
   * Get job statuses dropdown
   */
  static async getJobStatuses(
    searchTerm: string = ''
  ): Promise<
    Array<{ value: string; label: string }>
  > {
    return this.getJobDropdowns('job_status', searchTerm);
  }

  /**
   * Get job types dropdown
   */
  static async getJobTypes(
    searchTerm: string = ''
  ): Promise<Array<{ value: string; label: string }>> {
    return this.getJobDropdowns('Job_Type', searchTerm);
  }

  /**
   * Get job preferences dropdown
   */
  static async getJobPreferences(
    searchTerm: string = ''
  ): Promise<Array<{ value: string; label: string }>> {
    return this.getJobDropdowns('preferred_job', searchTerm);
  }

  /**
   * Get employment types dropdown
   */
  static async getEmploymentTypes(): Promise<
    Array<{ value: string; label: string }>
  > {
    return this.getJobDropdowns('Employment_Type');
  }

  /**
   * Get BGC types dropdown
   */
  static async getBgcTypes(): Promise<Array<{ value: string; label: string }>> {
    return this.getJobDropdowns('BGC');
  }

  /**
   * Get client bill periods dropdown
   */
  static async getClientBillPeriods(): Promise<
    Array<{ value: string; label: string }>
  > {
    return this.getJobDropdowns('Bill_Period');
  }

  /**
   * Get industries dropdown
   */
  static async getIndustries(): Promise<
    Array<{ value: string; label: string }>
  > {
    return this.getJobDropdowns('Industry');
  }

  /**
   * Get shifts dropdown
   */
  static async getShifts(): Promise<Array<{ value: string; label: string }>> {
    return this.getJobDropdowns('Shifts');
  }

  /**
   * Get gender preferences dropdown
   */
  static async getGenderPreferences(): Promise<
    Array<{ value: string; label: string }>
  > {
    return this.getJobDropdowns('Gender');
  }

  /**
   * Get job open types dropdown
   */
  static async getJobOpenTypes(): Promise<
    Array<{ value: string; label: string }>
  > {
    return this.getJobDropdowns('JobOpenType');
  }

  /**
   * Get client names dropdown
   */
  static async getClients(): Promise<
    Array<{ value: string; label: string }>
  > {
    return this.getJobDropdowns('Client');
  }

  /**
   * Get users dropdown
   */
  static async getUsers(): Promise<
    Array<{ value: string; label: string }>
  > {
    return this.getJobDropdowns('Users');
  }

  /**
   * Get locations dropdown
   */
  static async getLocations(): Promise<
    Array<{ value: string; label: string }>
  > {
    return this.getJobDropdowns('Locations');
  }

  /**
   * Get designations dropdown
   */
  static async getDesignations(): Promise<
    Array<{ value: string; label: string }>
  > {
    return this.getJobDropdowns('Designation');
  }

  /**
   * Get departments dropdown
   */
  static async getDepartments(): Promise<
    Array<{ value: string; label: string }>
  > {
    return this.getJobDropdowns('Department');
  }

  /**
   * Get skill categories dropdown
   */
  static async getSkillCategories(
    searchTerm: string = ''
  ): Promise<Array<{ value: string; label: string }>> {
    return this.getJobDropdowns('Skill Category', searchTerm);
  }
}

export default JobsAPI;
