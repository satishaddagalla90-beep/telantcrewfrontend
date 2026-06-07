// File Upload Service
import { apiCall } from '../utils/api';
import { API_ENDPOINTS } from '../utils/api/endpoints';

export interface FileUploadResponse {
    success: boolean;
    url: string;
    filename: string;
    size: number;
    mimetype: string;
}

export interface DocumentUploadResponse {
    file_url: string;
    file_name: string;
    file_type: string;
    file_category: string;
    uploaded_at: string;
    status: string;
    code: number;
}

export interface AvatarUploadResponse {
    file_url: string;
    file_name: string;
    file_type: string;
    file_category: string;
    uploaded_at: string;
    status: string;
    code: number;
}

export interface ResumeUploadResponse {
    file_url: string;
    file_name: string;
    file_type: string;
    file_category: string;
    uploaded_at: string;
    status: string;
    code: number;
}

export class FileUploadService {
    /**
     * Upload a file to the server
     * @param file - The file to upload
     * @param folder - Optional folder path (e.g., 'candidates', 'resumes')
     * @returns Promise with the upload response
     */
    static async uploadFile(file: File, folder?: string): Promise<FileUploadResponse> {
        try {
            const formData = new FormData();
            formData.append('file', file);

            if (folder) {
                formData.append('folder', folder);
            }

            // Note: This endpoint might need to be created in your backend
            const response = await apiCall<FileUploadResponse>('/files/upload', {
                method: 'POST',
                body: formData,
                // Don't set Content-Type header for FormData, let browser set it
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`
                }
            });

            if (response.error) {
                throw new Error(response.error.message || 'File upload failed');
            }

            return response.data!;
        } catch (error) {
            console.error('File upload error:', error);
            throw error;
        }
    }

    /**
     * Upload multiple files
     * @param files - Array of files to upload
     * @param folder - Optional folder path
     * @returns Promise with array of upload responses
     */
    static async uploadFiles(files: File[], folder?: string): Promise<FileUploadResponse[]> {
        const uploadPromises = files.map(file => this.uploadFile(file, folder));
        return Promise.all(uploadPromises);
    }

    /**
     * Upload candidate picture
     * @param file - Image file
     * @returns Promise with upload response
     */
    static async uploadCandidatePicture(file: File): Promise<FileUploadResponse> {
        return this.uploadFile(file, 'candidates/pictures');
    }

    /**
     * Upload resume using the specific API endpoint
     * @param file - Resume file (PDF, DOC, DOCX)
     * @returns Promise with upload response
     */
    static async uploadResume(file: File): Promise<ResumeUploadResponse> {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await apiCall<ResumeUploadResponse>(API_ENDPOINTS.CANDIDATES.UPLOAD_RESUME, {
                method: 'POST',
                body: formData,
                // Don't set Content-Type header for FormData, let browser set it
            });

            if (response.error) {
                throw new Error(response.error.message || 'Resume upload failed');
            }

            return response.data!;
        } catch (error) {
            console.error('Resume upload error:', error);
            throw error;
        }
    }

    /**
     * Upload candidate avatar using the specific API endpoint
     * @param file - Image file to upload
     * @returns Promise with upload response
     */
    static async uploadCandidateAvatar(file: File): Promise<AvatarUploadResponse> {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await apiCall<AvatarUploadResponse>(API_ENDPOINTS.CANDIDATES.UPLOAD_AVATAR, {
                method: 'POST',
                body: formData,
                // Don't set Content-Type header for FormData, let browser set it
            });

            if (response.error) {
                throw new Error(response.error.message || 'Avatar upload failed');
            }

            return response.data!;
        } catch (error) {
            console.error('Avatar upload error:', error);
            throw error;
        }
    }

    /**
     * Upload candidate documents using the specific API endpoint
     * @param files - Array of files to upload or single file
     * @param documentInfo - Optional document metadata
     * @returns Promise with array of upload responses
     */
    static async uploadCandidateDocuments(
        files: File | File[], 
        documentInfo?: {
            document_name?: string;
            document_number?: string;
            document_date?: string;
            expiry_date?: string;
        }
    ): Promise<DocumentUploadResponse[]> {
        try {
            const formData = new FormData();

            // Handle both single file and array of files
            const fileArray = Array.isArray(files) ? files : [files];

            // Append each file to the FormData
            fileArray.forEach((file) => {
                formData.append('files', file);
            });

            // Append document metadata if provided
            if (documentInfo) {
                if (documentInfo.document_name) {
                    formData.append('document_name', documentInfo.document_name);
                }
                if (documentInfo.document_number) {
                    formData.append('document_number', documentInfo.document_number);
                }
                if (documentInfo.document_date) {
                    formData.append('document_date', documentInfo.document_date);
                }
                if (documentInfo.expiry_date) {
                    formData.append('expiry_date', documentInfo.expiry_date);
                }
            }

            const response = await apiCall<DocumentUploadResponse[]>(API_ENDPOINTS.CANDIDATES.UPLOAD_DOCUMENTS, {
                method: 'POST',
                body: formData,
                // Don't set Content-Type header for FormData, let browser set it
            });

            if (response.error) {
                throw new Error(response.error.message || 'Document upload failed');
            }

            return response.data!;
        } catch (error) {
            console.error('Document upload error:', error);
            throw error;
        }
    }

    /**
     * Upload candidate document
     * @param file - Document file
     * @param documentType - Type of document
     * @returns Promise with upload response
     */
    static async uploadCandidateDocument(file: File, documentType: string): Promise<FileUploadResponse> {
        return this.uploadFile(file, `candidates/documents/${documentType.toLowerCase()}`);
    }

    /**
     * Validate file before upload
     * @param file - File to validate
     * @param options - Validation options
     * @returns Validation result
     */
    static validateFile(file: File, options: {
        maxSize?: number; // in MB
        allowedTypes?: string[];
    }): { valid: boolean; error?: string; } {
        const { maxSize = 10, allowedTypes = [] } = options;

        // Check file size
        const fileSizeMB = file.size / (1024 * 1024);
        if (fileSizeMB > maxSize) {
            return {
                valid: false,
                error: `File size must be less than ${maxSize}MB`
            };
        }

        // Check file type
        if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
            return {
                valid: false,
                error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`
            };
        }

        return { valid: true };
    }

    /**
     * Generate file preview URL for local files
     * @param file - File to preview
     * @returns Data URL for preview
     */
    static generatePreviewUrl(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                resolve(event.target?.result as string);
            };
            reader.onerror = (error) => {
                reject(error);
            };
            reader.readAsDataURL(file);
        });
    }

    /**
     * Upload client logo
     * @param file - Logo image file
     * @returns Promise with upload response
     */
    static async uploadClientLogo(file: File): Promise<DocumentUploadResponse> {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await apiCall<DocumentUploadResponse>(
                API_ENDPOINTS.CLIENTS.UPLOAD_LOGO,
                {
                    method: 'POST',
                    body: formData,
                }
            );

            if (response.error) {
                throw new Error(response.error.message || 'Failed to upload client logo');
            }

            if (!response.data) {
                throw new Error('No data received from server');
            }

            return response.data;
        } catch (error) {
            console.error('Client logo upload error:', error);
            throw error;
        }
    }

    /**
     * Upload client documents
     * @param files - Array of document files
     * @returns Promise with upload responses
     */
    static async uploadClientDocuments(files: File[]): Promise<DocumentUploadResponse[]> {
        try {
            const formData = new FormData();
            files.forEach((file) => {
                formData.append('files', file);
            });

            const response = await apiCall<DocumentUploadResponse[]>(
                API_ENDPOINTS.CLIENTS.UPLOAD_DOCUMENTS,
                {
                    method: 'POST',
                    body: formData,
                }
            );

            if (response.error) {
                throw new Error(response.error.message || 'Failed to upload client documents');
            }

            if (!response.data) {
                throw new Error('No data received from server');
            }

            return response.data;
        } catch (error) {
            console.error('Client documents upload error:', error);
            throw error;
        }
    }

    /**
     * Upload supplier logo
     * @param file - Logo image file
     * @returns Promise with upload response
     */
    static async uploadSupplierLogo(file: File): Promise<DocumentUploadResponse> {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await apiCall<DocumentUploadResponse>(
                API_ENDPOINTS.SUPPLIERS.UPLOAD_LOGO,
                {
                    method: 'POST',
                    body: formData,
                }
            );

            if (response.error) {
                throw new Error(response.error.message || 'Failed to upload supplier logo');
            }

            if (!response.data) {
                throw new Error('No data received from server');
            }

            return response.data;
        } catch (error) {
            console.error('Supplier logo upload error:', error);
            throw error;
        }
    }

    /**
     * Upload supplier documents
     * @param files - Array of document files
     * @returns Promise with upload responses
     */
    static async uploadSupplierDocuments(files: File[]): Promise<DocumentUploadResponse[]> {
        try {
            const formData = new FormData();
            files.forEach((file) => {
                formData.append('files', file);
            });

            const response = await apiCall<DocumentUploadResponse[]>(
                API_ENDPOINTS.SUPPLIERS.UPLOAD_DOCUMENTS,
                {
                    method: 'POST',
                    body: formData,
                }
            );

            if (response.error) {
                throw new Error(response.error.message || 'Failed to upload supplier documents');
            }

            if (!response.data) {
                throw new Error('No data received from server');
            }

            return response.data;
        } catch (error) {
            console.error('Supplier documents upload error:', error);
            throw error;
        }
    }

    /**
     * Extract bucket name and file key from a DigitalOcean Space URL
     * @param url - The URL to parse
     * @returns Object with bucket and key
     */
    static extractBucketAndKey(url: string): { bucket: string; key: string } {
        if (!url) return { bucket: 'tekishub', key: '' };

        // Normalize URL - handle potentially encoded URLs
        let decodedUrl = url;
        try {
            decodedUrl = decodeURIComponent(url);
        } catch (e) {
            // If decoding fails, continue with original url
        }

        let bucket = 'tekishub';
        let key = decodedUrl;

        // If it's a full URL, we need to extract the parts
        if (decodedUrl.startsWith('http')) {
            try {
                const parsedUrl = new URL(decodedUrl);
                const hostname = parsedUrl.hostname;
                const pathParts = parsedUrl.pathname.split('/').filter(p => p);

                if (hostname.endsWith('.digitaloceanspaces.com')) {
                    const hostParts = hostname.split('.');
                    
                    if (hostParts.length >= 4 && hostParts[hostParts.length - 3] !== 'digitaloceanspaces') {
                        // Case: bucket.region.digitaloceanspaces.com
                        bucket = hostParts[0];
                        key = pathParts.join('/');
                    } else if (pathParts.length >= 2) {
                        // Case: region.digitaloceanspaces.com/bucket/key
                        bucket = pathParts[0];
                        key = pathParts.slice(1).join('/');
                    } else if (pathParts.length === 1) {
                        // Case: region.digitaloceanspaces.com/bucket (empty key)
                        bucket = pathParts[0];
                        key = '';
                    }
                } else if (pathParts.length >= 2) {
                    // Fallback for other domains: assume first part is bucket
                    bucket = pathParts[0];
                    key = pathParts.slice(1).join('/');
                }
            } catch (error) {
                // If URL parsing fails, stick with raw key
            }
        }

        // Final normalization: ensure key doesn't have leading slash and is clean
        key = key.trim();
        if (key.startsWith('/')) key = key.slice(1);

        // Aggressively and recursively strip bucket name from start of key (case-insensitive)
        const bucketLower = bucket.toLowerCase();
        let changed = true;
        while (changed) {
            changed = false;
            const keyLower = key.toLowerCase();
            
            if (keyLower.startsWith(`${bucketLower}/`)) {
                key = key.slice(bucket.length + 1);
                changed = true;
            } else if (keyLower === bucketLower) {
                key = '';
                changed = true;
            }
            
            if (key.startsWith('/')) {
                key = key.slice(1);
                changed = true;
            }
        }

        return { bucket, key };
    }

    /**
     * Generate a presigned URL to view a private file
     * @param fileUrl - The original file URL
     * @returns Presigned view URL
     */
    static async getFileViewUrl(fileUrl: string): Promise<string> {
        try {
            const { bucket, key } = this.extractBucketAndKey(fileUrl);
            
            // API expects encoded parameters
            const response = await apiCall<{ view_url: string }>(
                `${API_ENDPOINTS.FILES.VIEW}?file_key=${encodeURIComponent(key)}&bucket_name=${encodeURIComponent(bucket)}`,
                { method: 'GET' }
            );

            if (response.error) {
                throw new Error(response.error.message || 'Failed to get view URL');
            }

            return response.data?.view_url || '';
        } catch (error) {
            console.error('Error getting file view URL:', error);
            throw error;
        }
    }

    /**
     * Generate a presigned URL to download a private file
     * @param fileUrl - The original file URL
     * @returns Presigned download URL
     */
    static async getFileDownloadUrl(fileUrl: string): Promise<string> {
        try {
            const { bucket, key } = this.extractBucketAndKey(fileUrl);
            
            const response = await apiCall<{ download_url: string }>(
                `${API_ENDPOINTS.FILES.DOWNLOAD}?file_key=${encodeURIComponent(key)}&bucket_name=${encodeURIComponent(bucket)}`,
                { method: 'GET' }
            );

            if (response.error) {
                throw new Error(response.error.message || 'Failed to get download URL');
            }

            return response.data?.download_url || '';
        } catch (error) {
            console.error('Error getting file download URL:', error);
            throw error;
        }
    }

    /**
     * Open a private file in a new tab (view or download)
     * @param fileUrl - The original file URL
     * @param mode - 'view' or 'download'
     */
    static async openFile(fileUrl: string, mode: 'view' | 'download' = 'view'): Promise<void> {
        if (!fileUrl) return;
        
        try {
            const url = mode === 'view' 
                ? await this.getFileViewUrl(fileUrl) 
                : await this.getFileDownloadUrl(fileUrl);
            
            if (url) {
                window.open(url, '_blank');
            }
        } catch (error) {
            console.error(`Error opening file in ${mode} mode:`, error);
        }
    }
}
export default FileUploadService;
