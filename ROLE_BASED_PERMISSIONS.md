# Role-Based Permissions Implementation

## Overview

The permission system has been updated to support dynamic role-based permissions fetched from the API. When a user selects a role from the dropdown, the permissions are automatically populated based on the role's predefined permissions configuration.

## How It Works

### 1. Permission Format
Permissions are stored as binary strings where each position represents a specific action:
- Position 0: Create (1 = allowed, 0 = not allowed)
- Position 1: View (1 = allowed, 0 = not allowed)  
- Position 2: Edit (1 = allowed, 0 = not allowed)
- Position 3: Delete (1 = allowed, 0 = not allowed)

**Examples:**
- `"1111"` = Full CRUD access
- `"0100"` = View only access
- `"1110"` = Create, View, Edit (no delete)
- `"0000"` = No access

### 2. API Endpoint

The system expects a new API endpoint: `/users/roles-permissions`

**Expected Response Format:**
```json
{
  "Roles": [
    {
      "name": "Intern",
      "permissions": {
        "candidate": "1111",
        "client": "0000",
        "job": "0000",
        "supplier": "0000",
        "users": "0000"
      }
    },
    {
      "name": "Recruiter",
      "permissions": {
        "candidate": "1111",
        "client": "0110",
        "job": "0111",
        "supplier": "0100",
        "users": "0100"
      }
    }
  ]
}
```

### 3. Implementation Details

#### Files Modified:
1. **`/src/utils/api/dropdowns.ts`** - Added `fetchRolesWithPermissions()` function
2. **`/src/hooks/useDropdowns.ts`** - Added `useRolesWithPermissions()` hook  
3. **`/src/components/pages/AddUser/PermissionsStep.tsx`** - Updated to use role-based permissions

#### Key Features:
- **Automatic Permission Setting**: When a role is selected, permissions are automatically populated
- **Manual Override**: Users can still manually adjust permissions after role selection
- **Fallback Support**: System falls back to mock data if the API endpoint is not available
- **Binary Conversion**: Automatic conversion between binary strings and UI checkboxes

## Testing

### Mock Data
For testing purposes, mock data is available in `/src/utils/api/mockRolesData.ts`. This will be used automatically if the API endpoint is not available.

### Role Examples in Mock Data:
- **Intern**: Full candidate access, no other permissions
- **Recruiter**: Full candidate access, limited client/job access
- **Manager**: Full access to most modules except full user management
- **Administrator**: Full access to all modules
- **HR**: Full candidate and user access, limited others
- **Read Only**: View-only access to all modules

## API Implementation Guide

To implement the backend API endpoint `/users/roles-permissions`:

1. Create the endpoint that returns roles with their permission configurations
2. Use the binary string format for permissions (4 digits: CRUD)
3. Ensure the response matches the expected format shown above
4. Consider caching since role permissions don't change frequently

## Usage Flow

1. User navigates to Add User form
2. In Step 1, user selects a role from the dropdown
3. System automatically navigates to Step 2 (Permissions)
4. Permissions are automatically populated based on the selected role
5. User can manually adjust permissions if needed
6. User completes the form and submits

## Benefits

- **Consistency**: Ensures role-based permissions are applied consistently
- **Efficiency**: Reduces manual permission setup time
- **Flexibility**: Allows manual override when needed
- **Maintainability**: Centralized permission management through API
- **Scalability**: Easy to add new roles or modify existing ones

## Next Steps

1. Implement the `/users/roles-permissions` API endpoint
2. Test the implementation with real API data
3. Add any additional roles or permission combinations as needed
4. Consider adding role permission management UI for administrators