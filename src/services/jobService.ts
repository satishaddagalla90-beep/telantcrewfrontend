// Job API Service
import {  CreateJobInput } from '../types/job';

const API_BASE_URL = 'https://tc-py-fastapi-to33v.ondigitalocean.app';

interface LastJobIdResponse {
  last_job_id: string;
}

interface CreateJobResponse {
  message: string;
  job_id: string;
  id: string;
}

interface UploadDocumentResponseItem {
  file_url: string;
  file_name: string;
  file_type: string;
  file_category: string;
  uploaded_at: string;
  status: string;
  code: number;
}

/**
 * Fetches the last job ID from the API
 * @returns Promise containing the last job ID
 */
export const fetchLastJobId = async (): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE_URL}/job/last-job-id`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add authorization header if needed
        // 'Authorization': `Bearer ${getAccessToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch last job ID: ${response.statusText}`);
    }

    const data: LastJobIdResponse = await response.json();
    return data.last_job_id;
  } catch (error) {
    console.error('Error fetching last job ID:', error);
    throw new Error('Failed to fetch last job ID');
  }
};

/**
 * Fetches the last job ID and generates the next one
 * @returns Promise containing the next job ID
 */
export const getNextJobId = async (): Promise<string> => {
  try {
    const lastJobId = await fetchLastJobId();
    return lastJobId;
  } catch (error) {
    console.error('Error getting next job ID:', error);
    throw error;
  }
};

/**
 * Creates a new job requisition
 * @param jobData - Complete job data in flattened structure with nested client object
 * @returns Promise containing the created job response
 */
export const createJob = async (jobData: CreateJobInput): Promise<CreateJobResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/job/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add authorization header if needed
        // 'Authorization': `Bearer ${getAccessToken()}`,
      },
      body: JSON.stringify(jobData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to create job: ${response.statusText}`);
    }

    const data: CreateJobResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating job:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to create job requisition');
  }
};

/**
 * Uploads a job document (JD) and returns the file URL
 * @param file - The file to upload (PDF, DOC, DOCX)
 * @returns Promise containing the uploaded file URL
 */
export const uploadJobDocument = async (file: File): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('files', file); // Changed from 'file' to 'files'

    const response = await fetch(`${API_BASE_URL}/job/upload/documents`, {
      method: 'POST',
      headers: {
        // Don't set Content-Type header - browser will set it with boundary for FormData
        // Add authorization header if needed
        // 'Authorization': `Bearer ${getAccessToken()}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to upload document: ${response.statusText}`);
    }

    const data: UploadDocumentResponseItem[] = await response.json();
    // API returns an array, get the first item's file_url
    if (data && data.length > 0 && data[0].file_url) {
      return data[0].file_url;
    }
    throw new Error('No file URL returned from upload');
  } catch (error) {
    console.error('Error uploading job document:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to upload job document');
  }
};
