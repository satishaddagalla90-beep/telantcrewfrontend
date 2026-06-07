import { apiCall } from './useSWR';
import { API_ENDPOINTS } from './endpoints';

// Types for update requests
export interface UpdateProfileSummaryRequest {
  profile_summary?: string;
  updated_by?: string;
}

export interface UpdateProfessionalDetailsRequest {
  total_experience?: string;
  relevant_experience?: string;
  current_ctc?: string;
  expected_ctc?: string;
  current_city?: string;
  preferred_location?: { label: string; value: string }[];
  notice_period?: string;
  job_open_type?: string;
  preferred_job?: { label: string; value: string };
  job_preference?: { label: string; value: string };
  shift?: string;
  source_details?: {
    source_type?: string;
    source_name?: string;
    flags?: string[];
    is_actively_looking?: boolean;
    comments?: string;
  };
  updated_by?: string;
}

export interface UpdateSkillsRequest {
  skills?: any[];
  primary_skill?: string[];
  additional_skill?: string;
  skill_category?: Array<{ id: string; name: string }>;
  updated_by?: string;
}

export interface UpdateHeaderRequest {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  designation?: string;
  source_details?: {
    is_actively_looking?: boolean;
    flags?: string[];
  };
  date_of_birth?: string;
  pan_number?: string;
  uan_number?: string;
  current_city?: string;
  linkedin_profile?: string;
  candidate_picture?: string;

  updated_by?: string;
}

export interface UpdateEducationRequest {
  id?: string;
  education_type?: string;
  highest_degree?: string;
  subject?: string;
  college?: string;
  university?: string;
  gpa?: number | null;
  year_of_passing?: number | null;
  is_pursuing?: boolean;
  updated_by?: string;
}

export interface UpdateEmploymentRequest {
  id?: string;
  organization_name?: string;
  job_type?: string;
  payroll_organization?: string | null;
  designation?: string;
  location?: string;
  from_date?: string;
  to_date?: string | null;
  is_current_job?: boolean;
  updated_by?: string;
}

export interface UpdateProjectRequest {
  id?: string;
  customer_name?: string;
  project_type?: string;
  designation?: string;
  organization_name?: string;
  from_date?: string;
  to_date?: string | null;
  updated_by?: string;
}

export interface UpdateCertificationRequest {
  id?: string;
  certification_name?: string;
  institution_name?: string;
  certification_number?: string;
  certification_date?: string;
  valid_until_date?: string | null;
  updated_by?: string;
}

export interface UpdateDocumentRequest {
  id?: string;
  document_name?: string;
  document_number?: string;
  document_date?: string;
  expiry_date?: string | null;
  document_url?: string | null;
  updated_by?: string;
}

// API functions for candidate updates
export const candidateUpdateAPI = {
  // Update profile summary
  updateProfileSummary: async (
    candidateId: string,
    data: UpdateProfileSummaryRequest
  ) => {
    try {
      const response = await apiCall(
        API_ENDPOINTS.CANDIDATES.UPDATE(candidateId),
        {
          method: 'PATCH',
          body: JSON.stringify(data),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.error) {
        throw new Error(
          response.error.message || 'Failed to update profile summary'
        );
      }

      return response.data;
    } catch (error) {
      console.error('Error updating profile summary:', error);
      throw error;
    }
  },

  // Update professional details
  updateProfessionalDetails: async (
    candidateId: string,
    data: UpdateProfessionalDetailsRequest
  ) => {
    try {
      const response = await apiCall(
        API_ENDPOINTS.CANDIDATES.UPDATE(candidateId),
        {
          method: 'PATCH',
          body: JSON.stringify(data),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.error) {
        throw new Error(
          response.error.message || 'Failed to update professional details'
        );
      }

      return response.data;
    } catch (error) {
      console.error('Error updating professional details:', error);
      throw error;
    }
  },

  // Update skills
  updateSkills: async (
    candidateId: string,
    skills: any[],
    primarySkills?: string[],
    additionalSkills?: string,
    skillCategory?: Array<{ id: string; name: string }>,
    updatedBy?: string
  ) => {
    try {
      const payload: any = {
        skills: skills,
      };

      // Add primary_skill if provided
      if (primarySkills !== undefined) {
        payload.primary_skill = primarySkills;
      }

      // Add additional_skill if provided
      if (additionalSkills !== undefined) {
        payload.additional_skill = additionalSkills;
      }

      // Add skill_category if provided
      if (skillCategory !== undefined) {
        payload.skill_category = skillCategory;
      }

      if (updatedBy) {
        payload.updated_by = updatedBy;
      }

      const response = await apiCall(
        API_ENDPOINTS.CANDIDATES.UPDATE(candidateId),
        {
          method: 'PATCH',
          body: JSON.stringify(payload),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.error) {
        throw new Error(response.error.message || 'Failed to update skills');
      }

      return response.data;
    } catch (error) {
      console.error('Error updating skills:', error);
      throw error;
    }
  },

  // Update header information
  updateHeader: async (candidateId: string, data: UpdateHeaderRequest) => {
    try {
      const response = await apiCall(
        API_ENDPOINTS.CANDIDATES.UPDATE(candidateId),
        {
          method: 'PATCH',
          body: JSON.stringify(data),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.error) {
        throw new Error(
          response.error.message || 'Failed to update candidate information'
        );
      }

      return response.data;
    } catch (error) {
      console.error('Error updating candidate information:', error);
      throw error;
    }
  },

  // Update education record
  updateEducation: async (
    candidateId: string,
    data: UpdateEducationRequest
  ) => {
    try {
      const response = await apiCall(
        API_ENDPOINTS.CANDIDATES.UPDATE(candidateId),
        {
          method: 'PATCH',
          body: JSON.stringify({
            education: data,
            updated_by: data.updated_by
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.error) {
        throw new Error(response.error.message || 'Failed to update education');
      }

      return response.data;
    } catch (error) {
      console.error('Error updating education:', error);
      throw error;
    }
  },

  // Update employment record
  updateEmployment: async (
    candidateId: string,
    data: UpdateEmploymentRequest
  ) => {
    try {
      const response = await apiCall(
        API_ENDPOINTS.CANDIDATES.UPDATE(candidateId),
        {
          method: 'PATCH',
          body: JSON.stringify({
            employment: data,
            updated_by: data.updated_by
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.error) {
        throw new Error(
          response.error.message || 'Failed to update employment'
        );
      }

      return response.data;
    } catch (error) {
      console.error('Error updating employment:', error);
      throw error;
    }
  },

  // Update project record
  updateProject: async (candidateId: string, data: UpdateProjectRequest) => {
    try {
      const response = await apiCall(
        API_ENDPOINTS.CANDIDATES.UPDATE(candidateId),
        {
          method: 'PATCH',
          body: JSON.stringify({
            project: data,
            updated_by: data.updated_by
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.error) {
        throw new Error(response.error.message || 'Failed to update project');
      }

      return response.data;
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  },

  // Update certification record
  updateCertification: async (
    candidateId: string,
    data: UpdateCertificationRequest
  ) => {
    try {
      const response = await apiCall(
        API_ENDPOINTS.CANDIDATES.UPDATE(candidateId),
        {
          method: 'PATCH',
          body: JSON.stringify({
            certification: data,
            updated_by: data.updated_by
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.error) {
        throw new Error(
          response.error.message || 'Failed to update certification'
        );
      }

      return response.data;
    } catch (error) {
      console.error('Error updating certification:', error);
      throw error;
    }
  },

  // Update document record
  updateDocument: async (candidateId: string, data: UpdateDocumentRequest) => {
    try {
      const response = await apiCall(
        API_ENDPOINTS.CANDIDATES.UPDATE(candidateId),
        {
          method: 'PATCH',
          body: JSON.stringify({
            document: data,
            updated_by: data.updated_by
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.error) {
        throw new Error(response.error.message || 'Failed to update document');
      }

      return response.data;
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  },

  // Bulk update education records
  updateBulkEducation: async (
    candidateId: string,
    educationArray: UpdateEducationRequest[],
    updatedBy?: string
  ) => {
    try {
      const response = await apiCall(
        API_ENDPOINTS.CANDIDATES.UPDATE(candidateId),
        {
          method: 'PATCH',
          body: JSON.stringify({
            education: educationArray,
            updated_by: updatedBy,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.error) {
        throw new Error(
          response.error.message || 'Failed to update education records'
        );
      }

      return response.data;
    } catch (error) {
      console.error('Error updating education records:', error);
      throw error;
    }
  },

  // Bulk update employment records
  updateBulkEmployment: async (
    candidateId: string,
    employmentArray: UpdateEmploymentRequest[],
    updatedBy?: string
  ) => {
    try {
      const response = await apiCall(
        API_ENDPOINTS.CANDIDATES.UPDATE(candidateId),
        {
          method: 'PATCH',
          body: JSON.stringify({
            employment: employmentArray,
            updated_by: updatedBy,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.error) {
        throw new Error(
          response.error.message || 'Failed to update employment records'
        );
      }

      return response.data;
    } catch (error) {
      console.error('Error updating employment records:', error);
      throw error;
    }
  },

  // Bulk update project records
  updateBulkProjects: async (
    candidateId: string,
    projectsArray: UpdateProjectRequest[],
    updatedBy?: string
  ) => {
    try {
      const response = await apiCall(
        API_ENDPOINTS.CANDIDATES.UPDATE(candidateId),
        {
          method: 'PATCH',
          body: JSON.stringify({
            projects: projectsArray,
            updated_by: updatedBy,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.error) {
        throw new Error(
          response.error.message || 'Failed to update project records'
        );
      }

      return response.data;
    } catch (error) {
      console.error('Error updating project records:', error);
      throw error;
    }
  },

  // Bulk update certification records
  updateBulkCertifications: async (
    candidateId: string,
    certificationsArray: UpdateCertificationRequest[],
    updatedBy?: string
  ) => {
    try {
      const response = await apiCall(
        API_ENDPOINTS.CANDIDATES.UPDATE(candidateId),
        {
          method: 'PATCH',
          body: JSON.stringify({
            certifications: certificationsArray,
            updated_by: updatedBy,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.error) {
        throw new Error(
          response.error.message || 'Failed to update certification records'
        );
      }

      return response.data;
    } catch (error) {
      console.error('Error updating certification records:', error);
      throw error;
    }
  },

  // Bulk update document records
  updateBulkDocuments: async (
    candidateId: string,
    documentsArray: UpdateDocumentRequest[],
    updatedBy?: string
  ) => {
    try {
      const response = await apiCall(
        API_ENDPOINTS.CANDIDATES.UPDATE(candidateId),
        {
          method: 'PATCH',
          body: JSON.stringify({
            documents: documentsArray,
            updated_by: updatedBy,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.error) {
        throw new Error(
          response.error.message || 'Failed to update document records'
        );
      }

      return response.data;
    } catch (error) {
      console.error('Error updating document records:', error);
      throw error;
    }
  },
};

// API functions for user updates (similar structure)
export const userUpdateAPI = {
  // Update profile summary
  updateProfileSummary: async (
    userId: string,
    data: UpdateProfileSummaryRequest
  ) => {
    try {
      const response = await apiCall(API_ENDPOINTS.USERS.UPDATE(userId), {
        method: 'PATCH',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.error) {
        throw new Error(
          response.error.message || 'Failed to update profile summary'
        );
      }

      return response.data;
    } catch (error) {
      console.error('Error updating user profile summary:', error);
      throw error;
    }
  },

  // Update professional details
  updateProfessionalDetails: async (
    userId: string,
    data: UpdateProfessionalDetailsRequest
  ) => {
    try {
      const response = await apiCall(API_ENDPOINTS.USERS.UPDATE(userId), {
        method: 'PATCH',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.error) {
        throw new Error(
          response.error.message || 'Failed to update professional details'
        );
      }

      return response.data;
    } catch (error) {
      console.error('Error updating user professional details:', error);
      throw error;
    }
  },

  // Update skills
  updateSkills: async (userId: string, data: UpdateSkillsRequest) => {
    try {
      const response = await apiCall(API_ENDPOINTS.USERS.UPDATE(userId), {
        method: 'PATCH',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to update skills');
      }

      return response.data;
    } catch (error) {
      console.error('Error updating user skills:', error);
      throw error;
    }
  },

  // Update header information
  updateHeader: async (userId: string, data: UpdateHeaderRequest) => {
    try {
      const response = await apiCall(API_ENDPOINTS.USERS.UPDATE(userId), {
        method: 'PATCH',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.error) {
        throw new Error(
          response.error.message || 'Failed to update user information'
        );
      }

      return response.data;
    } catch (error) {
      console.error('Error updating user information:', error);
      throw error;
    }
  },
};
