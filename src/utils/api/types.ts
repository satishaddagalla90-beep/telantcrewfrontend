export type FetchState<T> = {
    data: T | null;
    status: number;
    error: { data: any; message: string; status: number; } | null;
    refetch: (url?: string, options?: IRequest) => void;
};

export interface IResponse<T> {
    response: T;
}

export interface IRequest extends Omit<RequestInit, 'body'> {
    body?: any;
    cacheTime?: number;
    defaultFetch?: boolean;
    enableCache?: boolean;
    retries?: number;
    requestInterceptor?: (options: RequestInit) => RequestInit;
    showToaster?: boolean;
}

export interface IError {
    message?: string | Array<string> | undefined;
    status?: number;
}

export interface ApiResponse<T = any> {
    data: T | null;
    error: { data: any; message: string; status: number; } | null;
    status: number;
}

// User permission structure from API
export interface UserPermissionObject {
    candidate: string;
    client: string;
    job: string;
    supplier: string;
    users: string;
}

// User types based on your API response
export interface User {
    _id: string;
    avatar: any;
    collectionId: string;
    collectionName: string;
    created: string;
    created_by?: string;
    department: string[];
    designation: string;
    display_name: string;
    email: string;
    emailVisibility: boolean;
    first_name: string;
    id: string;
    last_name: string;
    location: string;
    middle_name: string;
    permission: UserPermissionObject;
    phone_no: number;
    reporting_to: string[];
    role: string[];
    status: string;
    updated: string;
    date_of_joining?: string;
    date_of_birth?: string;
    updated_by?: string;
    username: string;
    verified: boolean;
    last_viewed?: Array<{
        last_viewed_by:
            | {
                  id?: string;
                  email?: string;
                  username?: string;
                  display_name?: string;
              }
            | string
            | null;
        last_viewed_on: string;
    }>;
}

// Paginated response types
export interface PaginatedResponse<T> {
    page: number;
    limit: number;
    total_users?: number;
    total_candidates?: number;
    total_clients?: number;
    total_jobs?: number;
    total_pages: number;
    users?: T[];
    candidates?: T[];
    clients?: T[];
    jobs?: T[];
}

export interface UsersResponse extends PaginatedResponse<User> {
    users: User[];
    total_users: number;
}

export interface DropdownOption {
    id?: string;
    value: string;
    label: string;
    [key: string]: any;
}

// User permissions types (for individual permission objects - legacy)
export interface UserPermission {
    module: string;
    create: boolean;
    view: boolean;
    edit: boolean;
    delete: boolean;
}

// Activity log types
export interface ActivityLog {
    id: string;
    type: 'Permission' | 'Activation' | 'Deactivation' | 'New User';
    action: string;
    description: string;
    timestamp: string;
    user: string;
    icon: 'key' | 'check' | 'minus' | 'user';
}

export interface ActivityLogsResponse {
    logs: ActivityLog[];
    total: number;
}

// Assign permissions types
export interface AssignedUser {
    id: string;
    name: string;
    module: string;
    permissions: {
        create: boolean;
        view: boolean;
        edit: boolean;
        delete: boolean;
    };
}

export interface AssignedUsersResponse {
    users: AssignedUser[];
}

// User management types
export interface UserManagement {
    id: string;
    name: string;
    status: 'Active' | 'Inactive';
}

export interface UserManagementResponse {
    users: UserManagement[];
}

// Client types based on API response structure
export interface ClientContact {
    phone_no: string;
    email: string;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    display_name: string | null;
    designation: string;
    department?: string | string[];
}

export interface ClientContract {
    contract_type: string;
    tax_preference: string;
    payment_term: string | null;
    payment_type: string | null;
    start_date: string;
    end_date: string;
}

export interface ClientDocument {
    document_type: string;
    document_no: string;
    document_description: string;
    document_issue_date: string | null;
    document_expiry_date: string | null;
    client_document_file: string | null;
}

export interface BillingAddress {
    attention: string;
    country_region: string;
    state: string;
    city: string;
    street_1: string;
    street_2: string | null;
    pin_code: string;
    phone: string;
}

export interface Client {
    client_id: string;
    client_name: string;
    client_logo: string;
    vms_client_name: string;
    client_code: string;
    client_registered_address: string;
    client_postal_code: number;
    client_country: string;
    client_website: string;
    client_status: string;
    client_odc: string;
    client_city: string;
    created_by: string;
    updated_by: string;
    client_required_documents: string;
    client_portal: string;
    ownership: string;
    industry: string;
    client_state: string;
    // MSP fields
    msp_type: string;
    associate_msp: string;
    billing_address?: BillingAddress;
    contracts: ClientContract[];
    documents: ClientDocument[];
    contacts: ClientContact[];
    created: string;
    updated: string;
    email: string;
    id: string;
    isNewTC: boolean;
    // Added client display name field
    client_display_name?: string;
    last_viewed?: Array<{
        last_viewed_by:
            | {
                  id?: string;
                  email?: string;
                  username?: string;
                  display_name?: string;
              }
            | string
            | null;
        last_viewed_on: string;
    }>;
}

export interface ClientsResponse extends PaginatedResponse<Client> {
    Client: Client[];
    page: number;
    limit: number;
    status: string;
}
