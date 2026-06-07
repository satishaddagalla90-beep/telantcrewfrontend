import React, { useState } from 'react';
import Modal from '../../atoms/Modal';
import Button from '../../atoms/Button';
import EnhancedInputField from '../EnhancedInputField';
import Checkbox from '../../atoms/Checkbox';
import Text from '../../atoms/Text';
import { apiCall } from '../../../utils/api';

// Import the toast function from netWrapper
const dispatchToaster = (
  type: 'error' | 'success',
  message: string,
  duration = 5000
) => {
  window.dispatchEvent(
    new CustomEvent('toasterEvents', {
      detail: {
        type,
        message,
        ...(type === 'error' && { duration, dismissible: true }),
      },
    })
  );
};

interface AddRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newOption: { id: string; value: string; label: string }) => void;
}

const AddRoleModal: React.FC<AddRoleModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Permission state - using the same structure as in PermissionsStep
  const modules = ["candidate", "job", "client", "supplier", "users"];
  const actions = ["Create", "View", "Edit", "Delete"];
  
  // Module display names mapping
  const moduleDisplayNames: { [key: string]: string } = {
    "candidate": "Candidate",
    "job": "Job",
    "client": "Client",
    "supplier": "Supplier",
    "users": "Users"
  };
  
  // Initialize permissions state
  const [permissions, setPermissions] = useState<Record<string, string[]>>({
    "Candidate": [],
    "Job": [],
    "Client": [],
    "Supplier": [],
    "Users": []
  });

  const handlePermissionChange = (module: string, action: string, checked: boolean) => {
    setPermissions(prev => {
      const currentPermissions = { ...prev };
      
      if (!currentPermissions[module]) {
        currentPermissions[module] = [];
      }
      
      if (checked) {
        if (!currentPermissions[module].includes(action)) {
          currentPermissions[module] = [...currentPermissions[module], action];
        }
      } else {
        currentPermissions[module] = currentPermissions[module].filter(a => a !== action);
      }
      
      return currentPermissions;
    });
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Role name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Convert permissions to binary format for API
      const permissionsObject: Record<string, string> = {};
      
      modules.forEach(module => {
        const displayName = moduleDisplayNames[module];
        const modulePermissions = permissions[displayName] || [];
        
        // Create binary string (e.g., "1111" for all permissions)
        let binaryString = '0000';
        const binaryArray = binaryString.split('');
        
        if (modulePermissions.includes('Create')) binaryArray[0] = '1';
        if (modulePermissions.includes('View')) binaryArray[1] = '1';
        if (modulePermissions.includes('Edit')) binaryArray[2] = '1';
        if (modulePermissions.includes('Delete')) binaryArray[3] = '1';
        
        permissionsObject[module] = binaryArray.join('');
      });

      const payload = {
        name: name.trim(),
        permissions: permissionsObject
      };

      const response = await apiCall<{
        id: string;
        name: string;
        permissions: {
          candidate: string;
          client: string;
          job: string;
          supplier: string;
          users: string;
        };
      }>(`/common/add_dropdowns/Roles`, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to add role');
      }

      // Transform the API response to match the expected format
      // Based on the example, the response should be an object with the role data
      const roleData = response.data;
      if (!roleData) {
        throw new Error('Invalid response from server');
      }

      const newOption = {
        id: roleData.id,
        value: roleData.name,
        label: roleData.name,
      };

      // Call onSuccess with the new option (this will auto-select it)
      onSuccess(newOption);

      // Dispatch a custom event to notify other components that a role was added
      window.dispatchEvent(new CustomEvent('roleAdded', { detail: { role: roleData } }));

      // Show success toast
      dispatchToaster(
        'success',
        `New role "${name.trim()}" has been added and selected!`,
        3000
      );

      // Reset and close
      setName('');
      setPermissions({
        "Candidate": [],
        "Job": [],
        "Client": [],
        "Supplier": [],
        "Users": []
      });
      onClose();
    } catch (err) {
      console.error('Error adding role:', err);
      setError(err instanceof Error ? err.message : 'Failed to add role');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setPermissions({
      "Candidate": [],
      "Job": [],
      "Client": [],
      "Supplier": [],
      "Users": []
    });
    setError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add New Role"
      size="lg"
    >
      <div className="space-y-6 p-4 max-h-[70vh] overflow-y-auto">
        <EnhancedInputField
          label="Role Name"
          value={name}
          onChange={setName}
          placeholder="Enter role name"
          required
      
          error={error}
        />
        
        <div className="space-y-4">
          <Text variant="h4" weight="semibold">
            Permissions
          </Text>
          
          <div className="overflow-hidden border border-gray-200 rounded-lg">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3 text-left">
                    <Text variant="span" size="sm" weight="semibold" color="secondary" className="uppercase tracking-wider">
                      Modules
                    </Text>
                  </th>
                  {actions.map((action) => (
                    <th key={action} className="px-6 py-3 text-center">
                      <Text variant="span" size="sm" weight="semibold" color="secondary" className="uppercase tracking-wider">
                        {action}
                      </Text>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {modules.map((module, idx) => {
                  const displayName = moduleDisplayNames[module];
                  return (
                    <tr key={module} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4">
                        <Text variant="span" weight="semibold">
                          {displayName}
                        </Text>
                      </td>
                      {actions.map((action) => (
                        <td key={action} className="px-6 py-4 text-center">
                          <Checkbox
                            checked={permissions[displayName]?.includes(action) || false}
                            onChange={(checked) => handlePermissionChange(displayName, action, checked)}
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Adding...' : 'Add Role'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AddRoleModal;