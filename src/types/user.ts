// User API Types
export interface UserCreateRequest {
    email: string;
    username: string;
    first_name: string;
    last_name: string;
    middle_name: string;
    phone_no: string;
    date_of_birth: string; // ISO format: YYYY-MM-DD
    date_of_joining: string; // ISO format: YYYY-MM-DD
    display_name: string;
    department: string[];
    designation: string;
    location: string;
    reporting_to: string[];
    role: string[];
    status: string;
    emailVisibility: boolean;
    permission: UserPermissions;
    avatar?: any; // File or avatar object
    created_by: string;
    updated_by: string;
}

// API Wrapper for user creation - the API expects user data nested under 'user' field
export interface UserCreateApiRequest {
    user: UserCreateRequest;
}

// Updated UserCreateResponse to match the database example format
export interface UserCreateResponse {
    _id: {
        $oid: string;
    };
    id: string;
    name: string;
    created: string;
    updated: string;
    permissions: UserPermissions;
}

export interface UserPermissions {
    candidate: string;
    client: string;
    job: string;
    supplier: string;
    users: string;
}

// Form data interface (internal form state)
export interface UserFormData {
    // User Details
    first_name: string;
    middle_name: string;
    last_name: string;
    username: string;
    phone_no: string;
    email: string;
    date_of_birth: string; // Date of Birth field
    date_of_joining: string; // Date of Joining field
    country: string;
    state: string;
    city: string;
    designation: string;
    department: string[];
    reporting_to: string[];
    role: string[];

    // UI-only fields for form state
    display_name: string;
    user_picture?: File | null;
    user_picture_preview?: string | null;
    user_picture_url?: string | null; // Store the uploaded avatar URL
    user_status: string;

    // Permissions (for step 2) - Role-based permissions
    permissions: {
        [module: string]: string[]; // e.g., { "Candidate": ["Create", "View"], "Job": ["View", "Edit"] }
    };
}

// Permission action mapping for UI to API conversion
export interface PermissionActionMap {
    Create: number;
    View: number;
    Edit: number;
    Delete: number;
}

export interface PermissionModuleMap {
    [key: string]: keyof UserPermissions;
}
