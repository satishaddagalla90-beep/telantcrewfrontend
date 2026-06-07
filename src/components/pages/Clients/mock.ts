export type Document = {
  uploadedOn: any;
  uploadedBy: any;
  name: any;
  type: string;
  number: string;
  issueDate: string;
  expiryDate: string;
};

export type Contact = {
  id: string;
  name: string;
  phone: string;
  email: string;
  designation: string;
  division: string;
};

export type ClientData = {
  contractors: any;
  id: string;
  client_id: string;
  client_name: string;
  contact: string;
  email: string;
  company: string;
  location: string;
  address?: string; // Full detailed address
  services: string;
  rating: string;
  created: string;
  status: 'active' | 'inactive';
  website: string;
  portal: string;
  documents: Document[];
  contacts: Contact[];
  client_code?: string;
  client_display_name?: string;
  vms_name?: string;
  industry?: string;
  currency?: string;
  pan_number?: string;
  tax_preferences?: string;
  payment_terms?: string;
  place_of_supply?: string;
  created_date?: string;
};

export const mockClientsData: ClientData[] = [
  {
    id: '1',
    client_id: 'C-1001',
    client_name: 'Acme Corp',
    contact: 'John Doe',
    email: 'john@acme.com',
    company: 'Acme Corporation',
    location: 'New York',
    address: '16-11-16/N/33, Manhattan District, New York, NY - 10001',
    services: 'Logistics, IT Services',
    rating: 'A',
    created: '2025-01-10',
    status: 'active',
    website: 'www.acme.com',
    portal: 'No Portal',
    documents: [
      {
        type: 'Tax Certificate', number: 'TAX789', issueDate: '2022-01-01', expiryDate: '2025-01-01',
        uploadedOn: undefined,
        uploadedBy: undefined,
        name: undefined
      },
      {
        type: 'Insurance', number: 'INS456', issueDate: '2023-01-01', expiryDate: '2026-01-01',
        uploadedOn: undefined,
        uploadedBy: undefined,
        name: undefined
      }
    ],
    contacts: [
      { id: '1', name: 'John Doe', phone: '+1-555-1234', email: 'john@acme.com', designation: 'Director', division: 'Logistics' },
      { id: '2', name: 'Jane Roe', phone: '+1-555-5678', email: 'jane@acme.com', designation: 'Manager', division: 'IT Services' }
    ],
    contractors: undefined,
    client_code: 'C-1001',
    client_display_name: 'Acme Corporation',
    vms_name: 'No Portal',
    industry: 'Logistics, IT Services',
    currency: 'USD',
    pan_number: 'ABCDE1234F',
    tax_preferences: 'GST',
    payment_terms: 'Net 30',
    place_of_supply: 'New York',
    created_date: '2025-01-10',
  },
  {
    id: '2',
    client_id: 'C-1002',
    client_name: 'Beta LLC',
    contact: 'Jane Smith',
    email: 'jane@beta.com',
    company: 'Beta LLC',
    location: 'San Francisco',
    address: '45-22-8/SF/12, Mission District, San Francisco, CA - 94102',
    services: 'Manufacturing',
    rating: 'B',
    created: '2025-02-15',
    status: 'inactive',
    website: 'www.beta.com',
    portal: 'Has Portal',
    documents: [
      {
        type: 'Insurance', number: 'INS999', issueDate: '2021-01-01', expiryDate: '2024-01-01',
        uploadedOn: undefined,
        uploadedBy: undefined,
        name: undefined
      }
    ],
    contacts: [
      { id: '3', name: 'Jane Smith', phone: '+1-555-8765', email: 'jane@beta.com', designation: 'Lead', division: 'Manufacturing' }
    ],
    contractors: undefined,
    client_code: 'C-1002',
    client_display_name: 'Beta LLC',
    vms_name: 'Has Portal',
    industry: 'Manufacturing',
    currency: 'USD',
    pan_number: 'FGHIJ5678K',
    tax_preferences: 'GST',
    payment_terms: 'Net 45',
    place_of_supply: 'San Francisco',
    created_date: '2025-02-15',
  },
  {
    id: '3',
    client_id: 'C-1003',
    client_name: 'Gamma Inc',
    contact: 'Alice Johnson',
    email: 'alice@gamma.com',
    company: 'Gamma Inc',
    location: 'Los Angeles',
    address: '16-11-16/N/33, Prashanth Nagar Colony, Malakpet, IN - 500046',
    services: 'IT Services',
    rating: 'A',
    created: '2025-03-20',
    status: 'active',
    website: 'www.gamma.com',
    portal: 'No Portal',
    documents: [
      {
        type: 'Tax Certificate', number: 'TAX123', issueDate: '2023-01-01', expiryDate: '2026-01-01',
        uploadedOn: undefined,
        uploadedBy: undefined,
        name: undefined
      }
    ],
    contacts: [
      { id: '4', name: 'Alice Johnson', phone: '+1-555-4321', email: 'alice@gamma.com', designation: 'Director', division: 'IT Services' }
    ],
    contractors: undefined,
    client_code: 'C-1003',
    client_display_name: 'Gamma Inc',
    vms_name: 'No Portal',
    industry: 'IT Services',
    currency: 'USD',
    pan_number: 'LMNOP9012Q',
    tax_preferences: 'GST',
    payment_terms: 'Net 30',
    place_of_supply: 'Los Angeles',
    created_date: '2025-03-20',
  },
];