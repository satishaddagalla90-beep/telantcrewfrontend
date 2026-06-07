import React, { useEffect, useState } from 'react';
import { FormField } from '../../atoms/FormField';
import SearchDropdown from '../../molecules/SearchDropdown/SearchDropdown';
import { useClientsDropdown } from '../../../hooks/useClients';
import { JobClientAPI } from '../../../types/job';
import { ClientContact } from '../../../types/contact';
import { DropdownOption } from '../../../types';

interface ClientStepProps {
  formData: {
    client: JobClientAPI;
    [key: string]: any;
  };
  onChange: (updates: any) => void;
  errors?: Record<string, string>;
}

const ClientStep: React.FC<ClientStepProps> = ({
  formData,
  onChange,
  errors = {},
}) => {
  const {
    options: clientOptions,
    clientsMap,
    loading: loadingClients,
    search: searchClients,
  } = useClientsDropdown();
console.log(clientOptions)
  const [logoError, setLogoError] = useState(false);
  const [contactOptions, setContactOptions] = useState<DropdownOption[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedContactValue, setSelectedContactValue] = useState<string>(''); // Track selected contact dropdown value
  const [selectedContactData, setSelectedContactData] = useState<ClientContact | null>(null); // Store complete contact data

  const updateClient = (field: keyof JobClientAPI, value: any) => {
    console.log(`Updating client field "${field}" with value:`, value);

    const updatedClient = {
      ...formData.client,
      [field]: value,
    };

    console.log('Updated client data:', updatedClient);

    onChange({
      client: updatedClient,
    });
  };

  // When a client is selected, populate the logo and extract contacts
  useEffect(() => {
    if (formData.client.client_name && clientsMap.has(formData.client.client_name)) {
      const selectedClient = clientsMap.get(formData.client.client_name);
      if (selectedClient) {
        // Update logo only if it has changed to avoid infinite loop
        if (selectedClient.client_logo && selectedClient.client_logo !== formData.client.client_logo) {
          updateClient('client_logo', selectedClient.client_logo || '');
          setLogoError(false);
        }

        // Auto-populate MSP if present on client
        if (selectedClient.associate_msp !== formData.client.associate_msp) {
          updateClient('associate_msp', selectedClient.associate_msp || '');
        }

        // Extract contacts from client object (contacts are embedded in the client response)
        // Only update if the client ID has actually changed
        if (selectedClient.id && selectedClient.id !== selectedClientId) {
          setSelectedClientId(selectedClient.id || null);
          extractClientContacts(selectedClient);
        }
      }
    } else if (!formData.client.client_name && selectedClientId !== null) {
      // Clear contacts when client is deselected (only if not already cleared)
      setContactOptions([]);
      setSelectedClientId(null);
      setSelectedContactValue('');
      setSelectedContactData(null);
      // Clear all contact fields in a single update
      onChange({
        client: {
          ...formData.client,
          full_name: '',
          designation: '',
          department: '',
          phone: '',
          email: '',
          associate_msp: '',
        },
      });
    }
  }, [formData.client.client_name, selectedClientId, clientsMap]);

  // Extract contacts from the selected client object
  const extractClientContacts = (client: any) => {
    setLoadingContacts(true);
    try {
      // Contacts are embedded in the client object
      const contacts: ClientContact[] = client.contacts || [];

      console.log('Client contacts:', contacts);

      const contactDropdownOptions: DropdownOption[] = contacts.map((contact, index) => {
        // Use display_name if available, otherwise use first_name
        const displayName = contact.display_name || contact.first_name || 'Unknown Contact';

        console.log(`Contact ${index}:`, {
          displayName,
          designation: contact.designation,
          department: contact.department,
          fullContact: contact
        });

        return {
          value: `${client.id}_${index}`, // Use combination of client ID and index as unique value
          label: displayName,
          // Store additional contact data for prepopulation
          data: contact,
        };
      });

      console.log('Contact dropdown options:', contactDropdownOptions);
      setContactOptions(contactDropdownOptions);
    } catch (error) {
      console.error('Error extracting client contacts:', error);
      setContactOptions([]);
    } finally {
      setLoadingContacts(false);
    }
  };

  // When a contact is selected, prepopulate fields
  const handleContactSelect = (selected: any) => {
    if (!selected) {
      setSelectedContactValue('');
      setSelectedContactData(null);
      // Clear all fields in a single update to avoid race conditions
      onChange({
        client: {
          ...formData.client,
          full_name: '',
          designation: '',
          department: '',
          phone: '',
          email: '',
        },
      });
      return;
    }

    // Store the selected dropdown value
    setSelectedContactValue(selected.value);

    console.log('Selected contact:', selected);
    console.log('Contact data:', selected.data);

    const contactData = selected.data as ClientContact;
    if (contactData) {
      // Store complete contact data for later use
      setSelectedContactData(contactData);

      // Use display_name if available, otherwise use first_name
      const displayName = contactData.display_name || contactData.first_name || '';

      console.log('Display name:', displayName);
      console.log('Designation:', contactData.designation);
      console.log('Department:', contactData.department);
      console.log('Phone:', contactData.phone_no);
      console.log('Email:', contactData.email);

      // Update all fields in a single onChange call to avoid race conditions
      // This prevents one update from overwriting another due to async state updates
      // Include phone and email even though they're not shown in UI
      onChange({
        client: {
          ...formData.client,
          full_name: displayName,
          designation: contactData.designation || '',
          department: contactData.department || '',
          phone: contactData.phone_no || '',
          email: contactData.email || '',
          associate_msp: formData.client.associate_msp, // Preserve MSP
        },
      });

      console.log('Contact fields updated including phone and email');
    } else {
      console.log('No contact data found in selected option');
      setSelectedContactData(null);
    }
  };

  // Auto-select contact if resuming from draft or navigating back
  useEffect(() => {
    if (contactOptions.length > 0 && formData.client.full_name && !selectedContactValue) {
      // Find matching contact by display name or first name
      const matchedOption = contactOptions.find(opt =>
        opt.label === formData.client.full_name ||
        (opt as any).data?.display_name === formData.client.full_name ||
        (opt as any).data?.first_name === formData.client.full_name
      );

      if (matchedOption) {
        setSelectedContactValue(matchedOption.value as string);
        setSelectedContactData((matchedOption as any).data as ClientContact || null);
      }
    }
  }, [contactOptions, formData.client.full_name, selectedContactValue]);

  return (
    <div className="space-y-6">
      {/* Client Selection with Logo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="flex flex-col">
          <SearchDropdown
            label="Client Name"
            value={formData.client.client_name}
            onChange={(selected: any) => {
              const clientName = selected?.label || '';
              const isDifferentClient = clientName !== formData.client.client_name;

              // Reset dependent fields when the client is changed or cleared
              if (isDifferentClient) {
                setContactOptions([]);
                setSelectedClientId(null);
                setSelectedContactValue('');
                setSelectedContactData(null);
                setLogoError(false);

                onChange({
                  client: {
                    ...formData.client,
                    client_name: clientName,
                    client_logo: '',
                    associate_msp: '',
                    full_name: '',
                    designation: '',
                    department: '',
                    phone: '',
                    email: '',
                  },
                });
              }
            }}
            options={clientOptions}
            loading={loadingClients}
            onInputChange={(input: string) => searchClients(input)}
            error={errors.client_name}
            placeholder="Search and select a client"
            isMulti={false}
            isClearable={true}
            isSearchable={true}
            required
          />

          {formData.client.associate_msp && (
            <div className="mt-2 pl-1">
              <span className="text-sm text-gray-500 font-medium">MSP Associated With: </span>
              <span className="text-sm text-gray-800">{formData.client.associate_msp}</span>
            </div>
          )}
        </div>

        {/* Client Logo Display */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Client Logo
          </label>
          <div className="w-full h-24 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-white">
            {formData.client.client_logo && !logoError ? (
              <img
                src={formData.client.client_logo}
                alt={`${formData.client.client_name} Logo`}
                className="max-h-full max-w-full object-contain"
                onError={() => setLogoError(true)}
              />
            ) : (
              <span className="text-gray-400 text-sm text-center">
                {formData.client.client_name
                  ? 'No logo available'
                  : 'Select a client to view logo'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Other Client Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <FormField
          label="End Client Name"
          placeholder="Enter end client name"
          value={formData.client.end_client_name || ''}
          onChange={(value: string) => updateClient('end_client_name', value)}
          error={errors.end_client_name}
        />

        <FormField
          label="Client Requirement ID"
          placeholder="Enter client requirement ID"
          value={formData.client.client_requirement_id || ''}
          onChange={(value: string) =>
            updateClient('client_requirement_id', value)
          }
          error={errors.client_requirement_id}
        />
      </div>

      {/* Contact Person Information */}
      <div className="mt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Contact Person Details
        </h3>

        {/* Contact Dropdown - Full width */}
        <div className="mb-4">
          <SearchDropdown
            label="Client Contact"
            value={selectedContactValue}
            onChange={handleContactSelect}
            options={contactOptions}
            loading={loadingContacts}
            error={errors.full_name}
            placeholder={
              !formData.client.client_name
                ? 'Select a client first'
                : contactOptions.length === 0 && !loadingContacts
                ? 'No contacts available'
                : 'Search and select contact'
            }
            isMulti={false}
            isClearable={true}
            isSearchable={true}
            disabled={!formData.client.client_name || loadingContacts}
            required
          />
        </div>

        {/* Auto-populated fields - Two columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            label="Designation"
            placeholder="Designation (auto-populated)"
            value={formData.client.designation || ''}
            onChange={(value: string) => updateClient('designation', value)}
            disabled={true}
          />

          <FormField
            label="Department"
            placeholder="Department (auto-populated)"
            value={formData.client.department || ''}
            onChange={(value: string) => updateClient('department', value)}
            disabled={true}
          />
        </div>
      </div>
    </div>
  );
};

export default ClientStep;
