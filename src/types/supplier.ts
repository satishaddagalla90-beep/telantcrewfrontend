// Supplier types based on the API response example provided

export interface SupplierAddress {
  country: string;
  state: string;
  city: string;
  postal_code: string;
  registered_address: string;
}

export interface SupplierFinancialContract {
  contract_type: string;
  payment_term: string;
  payment_type: string;
  start_date?: string | null;
  end_date?: string | null;
}

export interface SupplierDocument {
  document_type: string;
  document_no: string;
  issue_date: string | null;
  expiry_date: string | null;
  document_file: string;
}

export interface SupplierContact {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  middle_name: string | null;
  display_name: string;
  designation: string;
  department: string;
}

export interface SupplierData {
  id: string;
  supplier_id: string;
  supplier_name: string;
  supplier_category: string;
  supplier_logo: string;
  supplier_display_name: string;
  empanelment_status: string;
  supplier_type: string;
  website: string;
  category: string;
  capability: string;
  industry: string;
  branches: string;
  msme_certified: boolean;
  zone: string;
  address: SupplierAddress;
  financial_details: SupplierFinancialContract[];
  documents: SupplierDocument[];
  contacts: SupplierContact[];
  created_by: string;
  updated_by: string;
  created: string;
  updated: string;
  isNewTC: boolean;
}

export interface SuppliersResponse {
  page: number;
  limit: number;
  total_suppliers: number;
  total_pages: number;
  suppliers: SupplierData[];
}