# Dynamic Permissions System

This system provides dynamic permission checking based on API response data from the logged-in user.

## Permission Structure

The API returns permissions in this format:

```typescript
{
  "permission": {
    "candidate": "1111",  // Full CRUD access
    "client": "1100",     // Create and Read only
    "job": "0100",        // Read only
    "supplier": "0000",   // No access
    "users": "1110"       // Create, Read, Update (no Delete)
  }
}
```

### Permission Logic

Each permission string is 4 digits representing CRUD operations:
- **Position 1**: Create (1 = allowed, 0 = denied)
- **Position 2**: Read (1 = allowed, 0 = denied)  
- **Position 3**: Update (1 = allowed, 0 = denied)
- **Position 4**: Delete (1 = allowed, 0 = denied)

Examples:
- `"1111"` = Full CRUD access
- `"0100"` = Read-only access
- `"1110"` = Create, Read, Update (no Delete)
- `"0000"` = No access

## Usage

### 1. Import the Permissions Hook

```typescript
import { usePermissions } from '../hooks/usePermissions';
```

### 2. Basic Usage in Components

```typescript
const MyComponent = () => {
  const {
    canReadUsers,
    canCreateUsers,
    canUpdateUsers,
    canDeleteUsers,
    loading
  } = usePermissions();

  // Show loading while checking permissions
  if (loading) {
    return <div>Checking permissions...</div>;
  }

  // Early return if no read permission
  if (!canReadUsers) {
    return (
      <AccessDenied 
        message="You don't have permission to view users."
      />
    );
  }

  return (
    <div>
      {/* Show create button only if user has create permission */}
      {canCreateUsers && (
        <button onClick={handleCreate}>Add New User</button>
      )}
      
      {/* Your component content */}
      <UserTable 
        showEditActions={canUpdateUsers}
        showDeleteActions={canDeleteUsers}
      />
    </div>
  );
};
```

### 3. Generic Permission Checking

```typescript
const MyComponent = () => {
  const { checkPermission } = usePermissions();

  const handleAction = () => {
    if (checkPermission('client', 'update')) {
      // User can update clients
      updateClient();
    } else {
      alert('You don\'t have permission to update clients');
    }
  };

  return (
    <button 
      onClick={handleAction}
      disabled={!checkPermission('client', 'update')}
    >
      Update Client
    </button>
  );
};
```

### 4. Available Permission Checkers

#### Module-specific permissions:
- **Users**: `canReadUsers`, `canCreateUsers`, `canUpdateUsers`, `canDeleteUsers`
- **Candidates**: `canReadCandidates`, `canCreateCandidates`, `canUpdateCandidates`, `canDeleteCandidates`
- **Clients**: `canReadClients`, `canCreateClients`, `canUpdateClients`, `canDeleteClients`
- **Jobs**: `canReadJobs`, `canCreateJobs`, `canUpdateJobs`, `canDeleteJobs`
- **Suppliers**: `canReadSuppliers`, `canCreateSuppliers`, `canUpdateSuppliers`, `canDeleteSuppliers`

#### Generic functions:
- `checkPermission(module, action)` - Check specific permission
- `getPermissions(module)` - Get all CRUD permissions for a module
- `hasAnyPermissionForModule(module)` - Check if user has any permission for a module

## Components

### AccessDenied Component

Shows a standardized "access denied" message:

```typescript
import AccessDenied from '../molecules/AccessDenied/AccessDenied';

<AccessDenied 
  message="You don't have permission to access this content."
  showIcon={true}
/>
```

## Implementation Example

See `src/components/pages/Users/Users.tsx` for a complete implementation example that includes:

- Read permission check with AccessDenied fallback
- Conditional rendering of create/edit/delete buttons
- Permission-aware form fields
- Modal restrictions based on permissions

## Best Practices

1. **Always check read permissions first** - Show AccessDenied component if user can't read the data
2. **Check permissions before API calls** - Don't rely only on UI hiding, validate on both frontend and backend
3. **Provide clear feedback** - Show disabled buttons with tooltips rather than hiding functionality entirely
4. **Use loading states** - Show loading while permissions are being fetched
5. **Handle permission changes** - The system automatically updates when user permissions change

## File Structure

```
src/
├── types/
│   └── permissions.ts          # Permission type definitions
├── utils/
│   └── permissions.ts          # Permission checking utilities
├── hooks/
│   └── usePermissions.ts       # Main permissions hook
├── components/
│   └── molecules/
│       └── AccessDenied/       # Access denied component
└── services/
    └── authService.ts          # Updated to include permissions
```