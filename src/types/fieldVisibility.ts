// Field Visibility Types

export interface FieldVisibilityConfig {
  role: string;
  modules: {
    [module: string]: {
      [sectionKey: string]: boolean;
    };
  };
}

export interface ModuleSectionDefinition {
  key: string;
  label: string;
  description: string;
}

export interface ModuleDefinition {
  key: string;
  label: string;
  sections: ModuleSectionDefinition[];
}

// All configurable module sections
export const MODULE_DEFINITIONS: ModuleDefinition[] = [
  {
    key: 'job',
    label: 'Jobs',
    sections: [
      { key: 'clientInfo', label: 'Client Information', description: 'Client name, logo, and contact details in job view' },
      { key: 'salaryDetails', label: 'Salary Details', description: 'Salary range, CTC, and compensation breakdown' },
      { key: 'internalNotes', label: 'Internal Notes', description: 'Internal recruiter notes and comments' },
      { key: 'billingInfo', label: 'Billing Information', description: 'Billing rate, margins, and commercial details' },
    ],
  },
  {
    key: 'candidate',
    label: 'Candidates',
    sections: [
      { key: 'personalDetails', label: 'Personal Details', description: 'Date of birth, marital status, PAN, Aadhaar' },
      { key: 'salaryInfo', label: 'Salary Information', description: 'Current and expected salary details' },
      { key: 'contactInfo', label: 'Contact Information', description: 'Phone numbers, email, and address' },
      { key: 'documents', label: 'Documents', description: 'Uploaded resumes, certificates, and ID proofs' },
    ],
  },
  {
    key: 'client',
    label: 'Clients',
    sections: [
      { key: 'contactDetails', label: 'Contact Details', description: 'Client contact persons and their details' },
      { key: 'commercials', label: 'Commercial Details', description: 'Payment terms, billing details, agreements' },
      { key: 'internalNotes', label: 'Internal Notes', description: 'Internal team notes about the client' },
    ],
  },
  {
    key: 'supplier',
    label: 'Suppliers',
    sections: [
      { key: 'contactDetails', label: 'Contact Details', description: 'Supplier contact persons and their details' },
      { key: 'commercials', label: 'Commercial Details', description: 'Payment terms and agreement details' },
      { key: 'performance', label: 'Performance Metrics', description: 'Supplier performance and rating data' },
    ],
  },
  {
    key: 'users',
    label: 'Users',
    sections: [
      { key: 'personalInfo', label: 'Personal Information', description: 'Date of birth, personal contact info' },
      { key: 'permissionDetails', label: 'Permission Details', description: 'Detailed permission breakdown table' },
    ],
  },
];
