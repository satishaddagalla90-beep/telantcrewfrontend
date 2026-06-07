/**
 * API functions for ClientDetail page
 * Handles all API calls, save/update/delete operations
 * Following the same pattern as ApplicantDetail
 */

// ===== SUCCESS/ERROR MESSAGES =====

export const getSuccessMessage = (action: string, section: string): string => {
  const messages: Record<string, string> = {
    'save-header': 'Client information updated successfully',
    'save-clientInfo': 'Client information updated successfully',
    'save-ownership': 'Client ownership updated successfully',
    'save-contact': 'Contact saved successfully',
    'save-contacts': 'Contacts updated successfully',
    'save-document': 'Document saved successfully',
    'save-documents': 'Documents updated successfully',
    'delete-contact': 'Contact deleted successfully',
    'delete-document': 'Document deleted successfully',
    'add-contact': 'Contact added successfully',
    'add-document': 'Document added successfully',
  };

  const key = `${action}-${section}`;
  return messages[key] || `${section} ${action} successfully`;
};

export const getErrorMessage = (action: string, section: string, error?: any): string => {
  const messages: Record<string, string> = {
    'save-header': 'Failed to update client information',
    'save-clientInfo': 'Failed to update client information',
    'save-ownership': 'Failed to update client ownership',
    'save-contact': 'Failed to save contact',
    'save-contacts': 'Failed to update contacts',
    'save-document': 'Failed to save document',
    'save-documents': 'Failed to update documents',
    'delete-contact': 'Failed to delete contact',
    'delete-document': 'Failed to delete document',
    'add-contact': 'Failed to add contact',
    'add-document': 'Failed to add document',
  };

  const key = `${action}-${section}`;
  const baseMessage = messages[key] || `Failed to ${action} ${section}`;
  
  if (error?.message) {
    return `${baseMessage}: ${error.message}`;
  }
  
  return baseMessage;
};

// ===== API ENDPOINTS =====

const API_BASE_URL = '/api/clients';

// ===== EDIT OPERATIONS =====

/**
 * Handle save edit for any section
 */
export const handleSaveEdit = async (
  clientId: string,
  section: string,
  formData: any,
  mutate?: any
): Promise<{ success: boolean; message: string; data?: any }> => {
  try {
    // Map section to API endpoint
    const endpoint = getSectionEndpoint(clientId, section);
    
    // Prepare data for API
    const payload = prepareSavePayload(section, formData);

    // Make API call
    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Revalidate data if mutate function provided
    if (mutate) {
      mutate();
    }

    const successMessage = getSuccessMessage('save', section);
    console.log(successMessage);

    return {
      success: true,
      message: successMessage,
      data,
    };
  } catch (error) {
    console.error(`Error saving ${section}:`, error);
    const errorMessage = getErrorMessage('save', section, error);
    console.error(errorMessage);

    return {
      success: false,
      message: errorMessage,
    };
  }
};

/**
 * Handle add new item
 */
export const handleSaveAdd = async (
  clientId: string,
  section: string,
  formData: any,
  mutate?: any
): Promise<{ success: boolean; message: string; data?: any }> => {
  try {
    const endpoint = getSectionEndpoint(clientId, section);
    const payload = prepareSavePayload(section, formData);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (mutate) {
      mutate();
    }

    const successMessage = getSuccessMessage('add', section);
    console.log(successMessage);

    return {
      success: true,
      message: successMessage,
      data,
    };
  } catch (error) {
    console.error(`Error adding ${section}:`, error);
    const errorMessage = getErrorMessage('add', section, error);
    console.error(errorMessage);

    return {
      success: false,
      message: errorMessage,
    };
  }
};

/**
 * Handle delete operation
 */
export const handleDelete = async (
  clientId: string,
  section: string,
  itemId: string,
  mutate?: any
): Promise<{ success: boolean; message: string }> => {
  try {
    const endpoint = `${getSectionEndpoint(clientId, section)}/${itemId}`;

    const response = await fetch(endpoint, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (mutate) {
      mutate();
    }

    const successMessage = getSuccessMessage('delete', section);
    console.log(successMessage);

    return {
      success: true,
      message: successMessage,
    };
  } catch (error) {
    console.error(`Error deleting ${section}:`, error);
    const errorMessage = getErrorMessage('delete', section, error);
    console.error(errorMessage);

    return {
      success: false,
      message: errorMessage,
    };
  }
};

// ===== FILE UPLOAD =====

/**
 * Handle file upload
 */
export const handleFileUpload = async (
  file: File,
  clientId?: string
): Promise<{ success: boolean; url?: string; message: string }> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    if (clientId) {
      formData.append('clientId', clientId);
    }

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return {
      success: true,
      url: data.url,
      message: 'File uploaded successfully',
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    return {
      success: false,
      message: 'Failed to upload file',
    };
  }
};

// ===== HELPER FUNCTIONS =====

/**
 * Get API endpoint for a specific section
 */
const getSectionEndpoint = (clientId: string, section: string): string => {
  const endpoints: Record<string, string> = {
    header: `${API_BASE_URL}/${clientId}`,
    clientInfo: `${API_BASE_URL}/${clientId}/information`,
    ownership: `${API_BASE_URL}/${clientId}/ownership`,
    contact: `${API_BASE_URL}/${clientId}/contacts`,
    contacts: `${API_BASE_URL}/${clientId}/contacts`,
    document: `${API_BASE_URL}/${clientId}/documents`,
    documents: `${API_BASE_URL}/${clientId}/documents`,
  };

  return endpoints[section] || `${API_BASE_URL}/${clientId}/${section}`;
};

/**
 * Prepare payload for save operation based on section
 */
const prepareSavePayload = (section: string, formData: any): any => {
  switch (section) {
    case 'header':
      return {
        client_name: formData.client_name,
        client_id: formData.client_id,
        registered_address: formData.registered_address,
        website: formData.website,
        client_portal: formData.client_portal,
        status: formData.status,
        // client_logo handled separately via file upload
      };

    case 'clientInfo':
      return {
        client_odc: formData.client_odc,
        required_documents: formData.required_documents,
        contract_type: formData.contract_type,
        expiry_date: formData.expiry_date,
        payment_term: formData.payment_term,
        payment_type: formData.payment_type,
      };

    case 'ownership':
      return {
        ownership: formData.ownership,
      };

    case 'contact':
    case 'contacts':
      return formData;

    case 'document':
    case 'documents':
      return formData;

    default:
      return formData;
  }
};

// ===== BULK OPERATIONS =====

/**
 * Handle bulk upload of contacts
 */
export const handleBulkContactsUpload = async (
  clientId: string,
  file: File,
  mutate?: any
): Promise<{ success: boolean; message: string; data?: any }> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/${clientId}/contacts/bulk`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (mutate) {
      mutate();
    }

    console.log('Contacts uploaded successfully');

    return {
      success: true,
      message: 'Contacts uploaded successfully',
      data,
    };
  } catch (error) {
    console.error('Error uploading contacts:', error);
    console.error('Failed to upload contacts');

    return {
      success: false,
      message: 'Failed to upload contacts',
    };
  }
};

/**
 * Handle bulk upload of documents
 */
export const handleBulkDocumentsUpload = async (
  clientId: string,
  file: File,
  mutate?: any
): Promise<{ success: boolean; message: string; data?: any }> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/${clientId}/documents/bulk`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (mutate) {
      mutate();
    }

    console.log('Documents uploaded successfully');

    return {
      success: true,
      message: 'Documents uploaded successfully',
      data,
    };
  } catch (error) {
    console.error('Error uploading documents:', error);
    console.error('Failed to upload documents');

    return {
      success: false,
      message: 'Failed to upload documents',
    };
  }
};

// ===== DOWNLOAD OPERATIONS =====

/**
 * Download template for bulk upload
 */
export const downloadTemplate = (type: 'contacts' | 'documents'): void => {
  const templates = {
    contacts: '/template/contact-upload-template.xlsx',
    documents: '/template/document-upload-template.xlsx',
  };

  const link = document.createElement('a');
  link.href = templates[type];
  link.download = `${type}-template.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Download contractors data
 */
export const downloadContractors = (clientId: string): void => {
  const link = document.createElement('a');
  link.href = `${API_BASE_URL}/${clientId}/contractors/download`;
  link.download = `contractors-${clientId}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
