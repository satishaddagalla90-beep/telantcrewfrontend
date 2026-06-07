import { apiCall } from './useSWR';
import { SupplierData, SuppliersResponse } from '../../types/supplier';
import { API_ENDPOINTS } from './endpoints';

// Export types
export type { SupplierData, SuppliersResponse };

// API functions
export const suppliersAPI = {
  // Fetch suppliers with pagination and filters
  fetchSuppliers: async (
    page: number = 1,
    limit: number = 10,
    filters: Record<string, string | null> = {}
  ): Promise<SuppliersResponse> => {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      // Add filter parameters
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value.trim()) {
          switch (key) {
            case 'search':
              params.append('search', value);
              break;
            case 'supplierName':
              params.append('supplier_name', value);
              break;
            case 'supplierId':
              params.append('supplier_id', value);
              break;
            case 'category':
              params.append('category', value);
              break;
            case 'status':
              params.append('empanelment_status', value);
              break;
            // Add other filters as needed
            default:
              // For any additional filters, use the key as-is
              params.append(key, value);
          }
        }
      });

      const url = `${API_ENDPOINTS.SUPPLIERS.LIST}?${params.toString()}`;
      const response = await apiCall<any>(url, {
        method: 'GET',
      });
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      // Transform the API response to match the expected structure
      const apiResponse = response.data!;
      return {
        page: apiResponse.page,
        limit: apiResponse.limit,
        total_pages: apiResponse.total_pages,
        total_suppliers: apiResponse.total_items,
        suppliers: apiResponse.data || []
      };
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      throw error;
    }
  },

  // Fetch single supplier by ID
  fetchSupplierById: async (id: string): Promise<SupplierData> => {
    try {
      const response = await apiCall<SupplierData>(API_ENDPOINTS.SUPPLIERS.GET(id), {
        method: 'GET',
      });
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data!;
    } catch (error) {
      console.error('Error fetching supplier:', error);
      throw error;
    }
  },

  // Create a new supplier
  createSupplier: async (supplierData: any): Promise<{ success: boolean; message: string; supplier?: SupplierData }> => {
    try {
      const response = await apiCall<SupplierData>(API_ENDPOINTS.SUPPLIERS.CREATE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(supplierData),
      });
      
      if (response.error) {
        throw new Error(response.error.message || 'Failed to create supplier');
      }
      
      // Return success response with the created supplier data
      return {
        success: true,
        message: 'Supplier created successfully',
        supplier: response.data!
      };
    } catch (error) {
      console.error('Error creating supplier:', error);
      throw error;
    }
  },

  // Delete single supplier by ID
  deleteSupplier: async (supplierId: string): Promise<{ success: boolean; message: string; }> => {
    try {
      const response = await apiCall<{ success: boolean; message: string; }>(API_ENDPOINTS.SUPPLIERS.DELETE(supplierId), {
        method: 'DELETE',
      });
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data!;
    } catch (error) {
      console.error('Error deleting supplier:', error);
      throw error;
    }
  },

  // Delete multiple suppliers using individual supplier deletion
  deleteSuppliers: async (ids: string[]): Promise<{ success: boolean; message: string; failed?: string[]; }> => {
    try {
      // Helper function to delete individual supplier
      const deleteSingleSupplier = async (supplierId: string): Promise<{ success: boolean; message: string; }> => {
        try {
          const response = await apiCall<{ success: boolean; message: string; }>(API_ENDPOINTS.SUPPLIERS.DELETE(supplierId), {
            method: 'DELETE',
          });
          if (response.error) {
            throw new Error(response.error.message);
          }
          return response.data!;
        } catch (error) {
          console.error(`Error deleting supplier ${supplierId}:`, error);
          throw error;
        }
      };

      const results = await Promise.allSettled(
        ids.map(id => deleteSingleSupplier(id))
      );

      const successCount = results.filter(result => result.status === 'fulfilled').length;
      const failedIds: string[] = [];

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          failedIds.push(ids[index]);
        }
      });

      if (failedIds.length === 0) {
        return {
          success: true,
          message: `Successfully deleted ${successCount} supplier(s).`
        };
      } else if (successCount === 0) {
        return {
          success: false,
          message: `Failed to delete all ${ids.length} supplier(s).`,
          failed: failedIds
        };
      } else {
        return {
          success: true,
          message: `Successfully deleted ${successCount} supplier(s). Failed to delete ${failedIds.length} supplier(s).`,
          failed: failedIds
        };
      }
    } catch (error) {
      console.error('Error deleting suppliers:', error);
      return {
        success: false,
        message: 'An unexpected error occurred while deleting suppliers.',
      };
    }
  },
};