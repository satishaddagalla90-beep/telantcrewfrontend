import { apiCall } from './index';
import { API_ENDPOINTS } from './endpoints';
import {
  RequirementAPI,
  RequirementsAPIResponse,
  RequirementListItem,
  RequirementFilters,
} from '../../types/recruitment';

/**
 * Requirements API Service
 * Handles all requirement/mapping-related API operations
 */

export interface RequirementSearchParams {
  page?: number;
  limit?: number;
  search?: string;
  filters?: RequirementFilters;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export class RequirementsAPI {
  /**
   * Fetch requirements with pagination and filters
   */
  static async getRequirements(
    params: RequirementSearchParams = {}
  ): Promise<RequirementsAPIResponse> {
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
            value.forEach((item) => {
              queryParams.append(key, item.toString());
            });
          }
        } else if (typeof value === 'object') {
          // Handle date range filters
          if (key === 'date_range' && value.start) {
            queryParams.append('date_from', value.start);
            if (value.end) {
              queryParams.append('date_to', value.end);
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

    const url = `${API_ENDPOINTS.REQUIREMENTS.LIST}?${queryParams.toString()}`;

    try {
      const response = await apiCall<RequirementsAPIResponse>(url, {
        method: 'GET',
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to fetch requirements');
      }

      return response.data!;
    } catch (error) {
      console.error('Error fetching requirements:', error);
      throw error;
    }
  }

  /**
   * Get a single requirement by ID
   */
  static async getRequirement(id: string): Promise<RequirementAPI> {
    try {
      const response = await apiCall<RequirementAPI>(
        API_ENDPOINTS.REQUIREMENTS.GET(id),
        {
          method: 'GET',
        }
      );

      if (response.error) {
        throw new Error(
          response.error.message || `Failed to fetch requirement ${id}`
        );
      }

      return response.data!;
    } catch (error) {
      console.error(`Error fetching requirement ${id}:`, error);
      throw error;
    }
  }

  /**
   * Transform API requirement data to list item format
   */
  static transformToListItem(requirement: RequirementAPI): RequirementListItem {
    return {
      id: requirement.id,
      mapping_id: requirement.mapping_id,
      applicant_name: requirement.applicant.applicant_name,
      applicant_id: requirement.applicant.applicant_id,
      phone: requirement.applicant.phone,
      email: requirement.applicant.email,
      job_title: requirement.job.job_title,
      job_id: requirement.job.job_id,
      client_name: requirement.job.client_name,
      job_type: requirement.job.job_type,
      skill_set: requirement.skill_set,
      status: requirement.status,
      mapped_by: requirement.mapped_by,
      mapped_date: requirement.mapped_date,
      job_owner: requirement.job_owner,
      pan_no: requirement.pan_no,
      client_req_id: requirement.client_req_id,
      last_viewed: requirement.last_viewed,
    };
  }

  /**
   * Transform API response to list items
   */
  static transformResponse(
    response: RequirementsAPIResponse
  ): RequirementListItem[] {
    return response.Requirements.map((requirement) =>
      this.transformToListItem(requirement)
    );
  }

  /**
   * Search requirements by query string
   */
  static async searchRequirements(
    query: string,
    page = 1,
    limit = 10
  ): Promise<RequirementsAPIResponse> {
    return this.getRequirements({
      page,
      limit,
      search: query,
    });
  }

  /**
   * Get requirements by status
   */
  static async getRequirementsByStatus(
    status: string,
    page = 1,
    limit = 10
  ): Promise<RequirementsAPIResponse> {
    return this.getRequirements({
      page,
      limit,
      filters: { status: [status] },
    });
  }

  /**
   * Get requirements by job owner
   */
  static async getRequirementsByOwner(
    jobOwner: string,
    page = 1,
    limit = 10
  ): Promise<RequirementsAPIResponse> {
    return this.getRequirements({
      page,
      limit,
      filters: { job_owner: [jobOwner] },
    });
  }

  /**
   * Get requirements by mapped by user
   */
  static async getRequirementsByMapper(
    mappedBy: string,
    page = 1,
    limit = 10
  ): Promise<RequirementsAPIResponse> {
    return this.getRequirements({
      page,
      limit,
      filters: { mapped_by: [mappedBy] },
    });
  }

  /**
   * Delete a requirement
   */
  static async deleteRequirement(id: string): Promise<void> {
    try {
      const response = await apiCall(API_ENDPOINTS.REQUIREMENTS.DELETE(id), {
        method: 'DELETE',
      });

      if (response.error) {
        throw new Error(
          response.error.message || `Failed to delete requirement ${id}`
        );
      }
    } catch (error) {
      console.error(`Error deleting requirement ${id}:`, error);
      throw error;
    }
  }

  /**
   * Bulk delete requirements
   */
  static async bulkDeleteRequirements(ids: string[]): Promise<void> {
    try {
      const response = await apiCall(API_ENDPOINTS.REQUIREMENTS.BULK_DELETE, {
        method: 'POST',
        body: JSON.stringify({ ids }),
      });

      if (response.error) {
        throw new Error(
          response.error.message || 'Failed to delete requirements'
        );
      }
    } catch (error) {
      console.error('Error bulk deleting requirements:', error);
      throw error;
    }
  }

  /**
   * Update a requirement
   */
  static async updateRequirement(
    id: string,
    data: Partial<RequirementAPI>
  ): Promise<RequirementAPI> {
    try {
      const response = await apiCall<RequirementAPI>(
        API_ENDPOINTS.REQUIREMENTS.UPDATE(id),
        {
          method: 'PUT',
          body: JSON.stringify(data),
        }
      );

      if (response.error) {
        throw new Error(
          response.error.message || `Failed to update requirement ${id}`
        );
      }

      return response.data!;
    } catch (error) {
      console.error(`Error updating requirement ${id}:`, error);
      throw error;
    }
  }

  /**
   * Unmap a candidate from a job
   */
  static async unmapCandidate(id: string, reason: string): Promise<void> {
    try {
      const url = `${API_ENDPOINTS.RECRUITMENT.UNMAP(id)}?reason=${encodeURIComponent(reason)}`;
      const response = await apiCall(url, {
        method: 'PATCH',
      });

      if (response.error) {
        throw new Error(
          response.error.message || `Failed to unmap candidate ${id}`
        );
      }
    } catch (error) {
      console.error(`Error unmapping candidate ${id}:`, error);
      throw error;
    }
  }
}

export default RequirementsAPI;
