import React from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import AccessDenied from '../molecules/AccessDenied/AccessDenied';

/**
 * Example component showing how to use permissions in any page
 * Replace 'candidate' with 'client', 'job', 'supplier', or 'users' as needed
 */
const PermissionExampleComponent: React.FC = () => {
  const {
    canReadCandidates,
    canCreateCandidates,
    canUpdateCandidates,
    canDeleteCandidates,
    loading: permissionsLoading,
    checkPermission
  } = usePermissions();

  // Show loading while checking permissions
  if (permissionsLoading) {
    return <div>Checking permissions...</div>;
  }

  // Early return if no read permission
  if (!canReadCandidates) {
    return (
      <AccessDenied 
        message="You don't have permission to view candidates. Please contact your administrator for access."
      />
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Candidates</h1>
      
      {/* Create button - only show if user has create permission */}
      {canCreateCandidates && (
        <button className="bg-blue-500 text-white px-4 py-2 rounded mb-4">
          Add New Candidate
        </button>
      )}

      {/* Example table with conditional actions */}
      <div className="border rounded">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Email</th>
              {(canUpdateCandidates || canDeleteCandidates) && (
                <th className="p-3 text-left">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-3">John Doe</td>
              <td className="p-3">john@example.com</td>
              {(canUpdateCandidates || canDeleteCandidates) && (
                <td className="p-3">
                  {canUpdateCandidates && (
                    <button className="text-blue-600 mr-2">Edit</button>
                  )}
                  {canDeleteCandidates && (
                    <button className="text-red-600">Delete</button>
                  )}
                </td>
              )}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Example of checking specific permissions */}
      <div className="mt-6 p-4 bg-gray-50 rounded">
        <h3 className="font-medium mb-2">Your Permissions:</h3>
        <ul className="space-y-1 text-sm">
          <li>Read Candidates: {canReadCandidates ? '✅' : '❌'}</li>
          <li>Create Candidates: {canCreateCandidates ? '✅' : '❌'}</li>
          <li>Update Candidates: {canUpdateCandidates ? '✅' : '❌'}</li>
          <li>Delete Candidates: {canDeleteCandidates ? '✅' : '❌'}</li>
        </ul>
      </div>

      {/* Example of using generic checkPermission function */}
      <div className="mt-4 p-4 bg-blue-50 rounded">
        <h3 className="font-medium mb-2">Using Generic Permission Check:</h3>
        <p className="text-sm">
          Can update jobs: {checkPermission('job', 'update') ? '✅' : '❌'}
        </p>
        <p className="text-sm">
          Can read clients: {checkPermission('client', 'read') ? '✅' : '❌'}
        </p>
      </div>
    </div>
  );
};

export default PermissionExampleComponent;