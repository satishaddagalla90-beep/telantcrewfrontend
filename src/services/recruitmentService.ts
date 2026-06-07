// Requirement API Service
import { CreateRequirementInput, RequirementAPI } from '../types/recruitment';

const API_BASE_URL = 'https://tc-py-fastapi-to33v.ondigitalocean.app';

interface LastMappingIdResponse {
  last_mapping_id: string;
}

interface CreateRequirementResponse {
  message: string;
  mapping_id: string;
  id: string;
}

/**
 * Fetches the last mapping ID from the API
 * @returns Promise containing the last mapping ID
 */
export const fetchLastMappingId = async (): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE_URL}/requirement/last-mapping-id`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch last mapping ID: ${response.statusText}`);
    }

    const data: LastMappingIdResponse = await response.json();
    return data.last_mapping_id;
  } catch (error) {
    console.error('Error fetching last mapping ID:', error);
    throw new Error('Failed to fetch last mapping ID');
  }
};

/**
 * Fetches the last mapping ID and generates the next one
 * @returns Promise containing the next mapping ID
 */
export const getNextMappingId = async (): Promise<string> => {
  try {
    const lastMappingId = await fetchLastMappingId();
    return lastMappingId;
  } catch (error) {
    console.error('Error getting next mapping ID:', error);
    throw error;
  }
};

/**
 * Creates a new requirement/mapping
 * @param requirementData - Complete requirement data
 * @returns Promise containing the created requirement response
 */
export const createRequirement = async (
  requirementData: CreateRequirementInput
): Promise<CreateRequirementResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/requirement/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requirementData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || `Failed to create requirement: ${response.statusText}`
      );
    }

    const data: CreateRequirementResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating requirement:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to create requirement');
  }
};

/**
 * Updates an existing requirement
 * @param id - Requirement ID to update
 * @param requirementData - Partial requirement data to update
 * @returns Promise containing the updated requirement
 */
export const updateRequirement = async (
  id: string,
  requirementData: Partial<RequirementAPI>
): Promise<RequirementAPI> => {
  try {
    const response = await fetch(`${API_BASE_URL}/requirement/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requirementData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || `Failed to update requirement: ${response.statusText}`
      );
    }

    const data: RequirementAPI = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating requirement:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to update requirement');
  }
};

/**
 * Deletes a requirement by ID
 * @param id - Requirement ID to delete
 * @returns Promise containing the delete response
 */
export const deleteRequirement = async (id: string): Promise<{ message: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/requirement/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || `Failed to delete requirement: ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting requirement:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to delete requirement');
  }
};

/**
 * Bulk deletes requirements
 * @param ids - Array of requirement IDs to delete
 * @returns Promise containing the bulk delete response
 */
export const bulkDeleteRequirements = async (
  ids: string[]
): Promise<{ message: string; deleted_count: number }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/requirement/bulk-delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || `Failed to delete requirements: ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error('Error bulk deleting requirements:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to delete requirements');
  }
};

/**
 * Exports requirements data
 * @param format - Export format ('csv' | 'excel')
 * @param filters - Optional filters to apply
 * @returns Promise containing the blob data
 */
export const exportRequirements = async (
  format: 'csv' | 'excel',
  filters?: Record<string, unknown>
): Promise<Blob> => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('format', format);
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(
      `${API_BASE_URL}/requirement/export?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to export requirements: ${response.statusText}`);
    }

    return await response.blob();
  } catch (error) {
    console.error('Error exporting requirements:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to export requirements');
  }
};

const requirementService = {
  fetchLastMappingId,
  getNextMappingId,
  createRequirement,
  updateRequirement,
  deleteRequirement,
  bulkDeleteRequirements,
  exportRequirements,
};

export default requirementService;
