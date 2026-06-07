/**
 * Helper functions for ClientDetail page
 * Handles data transformation, form preparation, and data processing
 * Following the same pattern as ApplicantDetail
 */

// ===== TYPE DEFINITIONS =====

export interface ClientFormData {
  client_name: string;
  client_id: string;
  client_logo: File | null;
  client_logo_preview: string;
  billing_attention: string;
  billing_country: string;
  billing_state: string;
  billing_city: string;
  billing_street1: string;
  billing_street2: string;
  billing_pin_code: string;
  website: string;
  client_portal: string;
  status: string;
  // Added client display name field
  client_display_name: string;
}

export interface ClientInformationFormData {
  client_odc: string[];
  required_documents: string[];
  contract_type?: string;
  expiry_date?: string;
  payment_term?: string;
  payment_type?: string;
}

export interface OwnershipFormData {
  ownership: string[];
}

export interface ContactFormData {
  id?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  displayName: string;
  phone: string;
  email: string;
  designation: string;
  division: string;
}

export interface DocumentFormData {
  id?: string;
  documentType: string;
  documentNumber: string;
  documentDescription?: string;
  issueDate?: string;
  expiryDate?: string;
  fileName?: string;
  fileUrl?: string;
  status?: string;
}

// ===== DATA RETRIEVAL =====

/**
 * Get client data from API or mock
 */
export const getClientData = async (clientId: string): Promise<any> => {
  // TODO: Replace with actual API call
  // const response = await fetch(`/api/clients/${clientId}`);
  // return response.json();
  return null;
};

// ===== DATA TRANSFORMATION =====

/**
 * Transform contacts data from API to display format
 */
export const transformContactsData = (contacts: any[]): ContactFormData[] => {
  if (!contacts || contacts.length === 0) {
    return [];
  }

  return contacts.map(contact => {
    const fullName = contact.name || '';
    const nameParts = fullName.split(' ');

    return {
      id: contact.id || Math.random().toString(),
      firstName: nameParts[0] || '',
      middleName: nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : '',
      lastName: nameParts.length > 1 ? nameParts[nameParts.length - 1] : '',
      displayName: contact.name || '',
      phone: contact.phone || '',
      email: contact.email || '',
      designation: contact.designation || '',
      division: contact.division || '',
    };
  });
};

/**
 * Transform documents data from API to display format
 */
export const transformDocumentsData = (documents: any[]): DocumentFormData[] => {
  if (!documents || documents.length === 0) {
    return [];
  }

  return documents.map((document, index) => ({
    id: document.id || index.toString(),
    documentType: document.type || '',
    documentNumber: document.number || '',
    issueDate: document.issueDate || '',
    expiryDate: document.expiryDate || '',
    fileName: document.fileName || '',
    fileUrl: document.fileUrl || '',
    status: document.status || 'Active',
  }));
};

// ===== FORM DATA PREPARATION (EDIT) =====

/**
 * Prepare header form data from client object for editing
 */
export const prepareHeaderFormData = (client: any): ClientFormData => {
  return {
    client_name: client.client_name || '',
    client_id: client.client_id || '',
    client_logo: null,
    client_logo_preview: client.logo || '',
    billing_attention: client.billing_attention || '',
    billing_country: client.billing_country || '',
    billing_state: client.billing_state || '',
    billing_city: client.billing_city || '',
    billing_street1: client.billing_street1 || '',
    billing_street2: client.billing_street2 || '',
    billing_pin_code: client.billing_pin_code || '',
    website: client.website || '',
    client_portal: client.portal || '',
    status: client.status || 'active',
    client_display_name: client.client_display_name || '',
  };
};

/**
 * Prepare client information form data for editing
 */
export const prepareClientInformationFormData = (client: any): ClientInformationFormData => {
  return {
    client_odc: client.client_odc || ['bengaluru'],
    required_documents: client.required_documents || ['aadhaar'],
    contract_type: client.contract_type || '',
    expiry_date: client.expiry_date || '',
    payment_term: client.payment_term || '',
    payment_type: client.payment_type || '',
  };
};

/**
 * Prepare ownership form data for editing
 */
export const prepareOwnershipFormData = (client: any): OwnershipFormData => {
  return {
    ownership: client.ownership || ['Sona Shabnam'],
  };
};

/**
 * Prepare contacts form data for editing (bulk)
 */
export const prepareBulkContactsFormData = (client: any): ContactFormData[] => {
  const contacts = transformContactsData(client.contacts || []);
  
  // If no contacts, return one empty contact
  if (contacts.length === 0) {
    return [getDefaultContactFormData()];
  }
  
  return contacts;
};

/**
 * Prepare single contact form data for editing
 */
export const prepareContactFormData = (contact: any): ContactFormData => {
  const fullName = contact.name || '';
  const nameParts = fullName.split(' ');

  return {
    id: contact.id || Math.random().toString(),
    firstName: nameParts[0] || '',
    middleName: nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : '',
    lastName: nameParts.length > 1 ? nameParts[nameParts.length - 1] : '',
    displayName: contact.name || '',
    phone: contact.phone || '',
    email: contact.email || '',
    designation: contact.designation || '',
    division: contact.division || '',
  };
};

/**
 * Prepare documents form data for editing (bulk)
 */
export const prepareBulkDocumentsFormData = (client: any): DocumentFormData[] => {
  const documents = transformDocumentsData(client.documents || []);
  
  // If no documents, return one empty document
  if (documents.length === 0) {
    return [getDefaultDocumentFormData()];
  }
  
  return documents;
};

/**
 * Prepare single document form data for editing
 */
export const prepareDocumentFormData = (document: any): DocumentFormData => {
  return {
    id: document.id || Math.random().toString(),
    documentType: document.type || '',
    documentNumber: document.number || '',
    issueDate: document.issueDate || '',
    expiryDate: document.expiryDate || '',
    fileName: document.fileName || '',
    fileUrl: document.fileUrl || '',
    status: document.status || 'Active',
  };
};

// ===== DEFAULT FORM DATA (ADD NEW) =====

/**
 * Get default header form data for adding new client
 */
export const getDefaultHeaderFormData = (): ClientFormData => {
  return {
    client_name: '',
    client_id: '',
    client_logo: null,
    client_logo_preview: '',
    billing_attention: '',
    billing_country: '',
    billing_state: '',
    billing_city: '',
    billing_street1: '',
    billing_street2: '',
    billing_pin_code: '',
    website: '',
    client_portal: '',
    status: 'active',
    client_display_name: '',
  };
};

/**
 * Get default client information form data
 */
export const getDefaultClientInformationFormData = (): ClientInformationFormData => {
  return {
    client_odc: [],
    required_documents: [],
    contract_type: '',
    expiry_date: '',
    payment_term: '',
    payment_type: '',
  };
};

/**
 * Get default ownership form data
 */
export const getDefaultOwnershipFormData = (): OwnershipFormData => {
  return {
    ownership: [],
  };
};

/**
 * Get default contact form data for adding new contact
 */
export const getDefaultContactFormData = (): ContactFormData => {
  return {
    id: Math.random().toString(),
    firstName: '',
    middleName: '',
    lastName: '',
    displayName: '',
    phone: '',
    email: '',
    designation: '',
    division: '',
  };
};

/**
 * Get default document form data for adding new document
 */
export const getDefaultDocumentFormData = (): DocumentFormData => {
  return {
    id: Math.random().toString(),
    documentType: '',
    documentNumber: '',
    issueDate: '',
    expiryDate: '',
    fileName: '',
    fileUrl: '',
    status: 'Active',
  };
};

// ===== VALIDATION HELPERS =====

/**
 * Validate header form data
 */
export const validateHeaderForm = (formData: ClientFormData): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!formData.client_name.trim()) {
    errors.client_name = 'Client name is required';
  }

  if (!formData.billing_street1.trim()) {
    errors.billing_street1 = 'Street address is required';
  }

  if (!formData.billing_country.trim()) {
    errors.billing_country = 'Country is required';
  }

  if (!formData.billing_state.trim()) {
    errors.billing_state = 'State is required';
  }

  if (!formData.billing_city.trim()) {
    errors.billing_city = 'City is required';
  }

  if (!formData.billing_pin_code.trim()) {
    errors.billing_pin_code = 'PIN code is required';
  }

  if (!formData.status) {
    errors.status = 'Status is required';
  }

  // Optional: Add URL validation for website and portal
  if (formData.website && !isValidUrl(formData.website)) {
    errors.website = 'Please enter a valid URL';
  }

  if (formData.client_portal && !isValidUrl(formData.client_portal)) {
    errors.client_portal = 'Please enter a valid URL';
  }

  return errors;
};

/**
 * Validate client information form data
 */
export const validateClientInformationForm = (formData: ClientInformationFormData): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!formData.client_odc || formData.client_odc.length === 0) {
    errors.client_odc = 'Client ODC is required';
  }

  if (!formData.required_documents || formData.required_documents.length === 0) {
    errors.required_documents = 'Required documents is required';
  }

  return errors;
};

/**
 * Validate ownership form data
 */
export const validateOwnershipForm = (formData: OwnershipFormData): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!formData.ownership || formData.ownership.length === 0) {
    errors.ownership = 'Client ownership is required';
  }

  return errors;
};

/**
 * Validate contact form data
 */
export const validateContactForm = (contact: ContactFormData, index: number): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!contact.firstName?.trim()) {
    errors[`${index}_firstName`] = 'First name is required';
  }

  if (!contact.lastName?.trim()) {
    errors[`${index}_lastName`] = 'Last name is required';
  }

  if (!contact.phone?.trim()) {
    errors[`${index}_phone`] = 'Phone is required';
  }

  if (!contact.email?.trim()) {
    errors[`${index}_email`] = 'Email is required';
  } else if (!isValidEmail(contact.email)) {
    errors[`${index}_email`] = 'Please enter a valid email address';
  }

  if (!contact.designation?.trim()) {
    errors[`${index}_designation`] = 'Designation is required';
  }

  if (!contact.division?.trim()) {
    errors[`${index}_division`] = 'Division is required';
  }

  return errors;
};

/**
 * Validate contacts form data (bulk)
 */
export const validateContactsForm = (contacts: ContactFormData[]): Record<string, string> => {
  let allErrors: Record<string, string> = {};

  contacts.forEach((contact, index) => {
    const errors = validateContactForm(contact, index);
    allErrors = { ...allErrors, ...errors };
  });

  return allErrors;
};

/**
 * Validate document form data
 */
export const validateDocumentForm = (document: DocumentFormData, index: number): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!document.documentType?.trim()) {
    errors[`${index}_documentType`] = 'Document type is required';
  }

  if (!document.documentNumber?.trim()) {
    errors[`${index}_documentNumber`] = 'Document number is required';
  }

  if (!document.fileName?.trim()) {
    errors[`${index}_fileName`] = 'Document file is required';
  }

  return errors;
};

/**
 * Validate documents form data (bulk)
 */
export const validateDocumentsForm = (documents: DocumentFormData[]): Record<string, string> => {
  let allErrors: Record<string, string> = {};

  documents.forEach((document, index) => {
    const errors = validateDocumentForm(document, index);
    allErrors = { ...allErrors, ...errors };
  });

  return allErrors;
};

// ===== UTILITY FUNCTIONS =====

/**
 * Check if a string is a valid email
 */
export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

/**
 * Check if a string is a valid URL
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url.startsWith('http') ? url : `https://${url}`);
    return true;
  } catch {
    return false;
  }
};

/**
 * Auto-update display name from first, middle, and last names
 */
export const generateDisplayName = (firstName: string, middleName: string, lastName: string): string => {
  return [firstName, middleName, lastName]
    .filter(name => name && name.trim())
    .join(' ');
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Generate unique ID
 */
export const generateUniqueId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
