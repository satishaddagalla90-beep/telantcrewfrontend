import React, { useState } from 'react';
import { apiCall, useSWR } from '../../../../utils/api';
import { useAuth } from '../../../auth/AuthContext';
import { showSuccessToast, showErrorToast } from '../../../../utils/toast';
import EditModal from '../../../../components/molecules/EditModal/EditModal';
import EnhancedInputField from '../../../../components/molecules/EnhancedInputField/EnhancedInputField';
import AsyncSelect, { AsyncSelectOption } from '../../../../components/atoms/AsyncSelect/AsyncSelect';
import SearchDropdown from '../../../../components/molecules/SearchDropdown';
import Icon from '../../../../components/atoms/Icon';
import Button from '../../../../components/atoms/Button';
import { SupplierData, SupplierContact } from '../../../../types/supplier';

interface EditAddContactProps {
  isOpen: boolean;
  onClose: () => void;
  supplierData: SupplierData;
  onUpdate: (updatedData: SupplierData) => void;
  countryCodes?: Array<{ value: string; label: string }>;
  countryCodesLoading?: boolean;
}

const EditAddContact: React.FC<EditAddContactProps> = ({
  isOpen,
  onClose,
  supplierData,
  onUpdate,
  countryCodes = [],
  countryCodesLoading = false,
}) => {
  const [editContactsFormData, setEditContactsFormData] = useState<any[]>([]);
  const [contactsErrors, setContactsErrors] = useState<Record<string, string>>({});
  const [isUpdatingContacts, setIsUpdatingContacts] = useState(false);
  const { user } = useAuth();

  // Fetch designation & department via supplier dropdowns
  const [designationSearch, setDesignationSearch] = useState('');
  const designationUrl = `/supplierdropdowns/Designation?page=1&limit=100${designationSearch ? `&search=${encodeURIComponent(designationSearch)}` : ''}`;
  const { data: designationsData } = useSWR<any>(designationUrl);
  const designationOptions =
    designationsData?.data?.map((d: any) => ({ value: d.name, label: d.name })) || [];

  const [departmentSearch, setDepartmentSearch] = useState('');
  const departmentUrl = `/supplierdropdowns/Department?page=1&limit=100${departmentSearch ? `&search=${encodeURIComponent(departmentSearch)}` : ''}`;
  const { data: departmentsData } = useSWR<any>(departmentUrl);
  const departmentOptions =
    departmentsData?.data?.map((d: any) => ({ value: d.name, label: d.name })) || [];

  // Initialize form data from supplierData when modal opens
  React.useEffect(() => {
    if (!isOpen) return;
    const contactsData = (supplierData.contacts || []).map((contact: any, index: number) => {
      const fullPhone = contact.phone || '';
      let countryCode = '+91';
      let phoneNumber = '';

      if (fullPhone.startsWith('+')) {
        // Try to match known country codes
        let foundCode = '';
        for (const cc of countryCodes) {
          if (fullPhone.startsWith(cc.value)) {
            if (cc.value.length > foundCode.length) foundCode = cc.value;
          }
        }
        if (foundCode) {
          countryCode = foundCode;
          phoneNumber = fullPhone.substring(foundCode.length).replace(/\D/g, '');
        } else {
          const match = fullPhone.match(/^(\+\d{1,4})(.*)$/);
          if (match) {
            countryCode = match[1];
            phoneNumber = match[2].replace(/\D/g, '');
          }
        }
      } else if (fullPhone) {
        phoneNumber = String(fullPhone).replace(/\D/g, '');
      }

      return {
        id: index.toString(),
        firstName: contact.first_name || '',
        middleName: contact.middle_name || '',
        lastName: contact.last_name || '',
        displayName: contact.display_name || [contact.first_name, contact.middle_name, contact.last_name].filter(Boolean).join(' '),
        phone: phoneNumber,
        countryCode: countryCode,
        email: contact.email || '',
        designation: contact.designation || '',
        department: Array.isArray(contact.department) ? contact.department : (contact.department ? contact.department.split(',').map((d: string) => d.trim()) : []),
      };
    });

    if (contactsData.length === 0) {
      contactsData.push({
        id: Math.random().toString(),
        firstName: '',
        middleName: '',
        lastName: '',
        displayName: '',
        phone: '',
        countryCode: countryCodes[0]?.value || '+91',
        email: '',
        designation: '',
        department: [],
      });
    }

    setEditContactsFormData(contactsData);
    setContactsErrors({});
  }, [isOpen, supplierData, countryCodes]);

  const handleContactFormChange = (index: number, field: string, value: any) => {
    const updated = [...editContactsFormData];
    updated[index] = { ...updated[index], [field]: value };

    if (field === 'firstName' || field === 'middleName' || field === 'lastName') {
      const firstName = field === 'firstName' ? value : updated[index].firstName || '';
      const middleName = field === 'middleName' ? value : updated[index].middleName || '';
      const lastName = field === 'lastName' ? value : updated[index].lastName || '';
      updated[index].displayName = [firstName, middleName, lastName].filter(Boolean).join(' ');
    }

    setEditContactsFormData(updated);

    // Immediate validations for phone and email
    const errorKey = `${index}_${field}`;
    if (field === 'phone') {
      const phoneVal = String(updated[index].phone || '').replace(/\D/g, '');
      if (!phoneVal) {
        setContactsErrors(prev => ({ ...prev, [errorKey]: 'Phone is required' }));
      } else if (!/^\d{10}$/.test(phoneVal)) {
        setContactsErrors(prev => ({ ...prev, [errorKey]: 'Phone must be 10 digits' }));
      } else {
        setContactsErrors(prev => { const n = { ...prev }; delete n[errorKey]; return n; });
      }
      return;
    }

    if (field === 'email') {
      const emailVal = String(updated[index].email || '').trim();
      if (!emailVal) {
        setContactsErrors(prev => ({ ...prev, [errorKey]: 'Email is required' }));
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
        setContactsErrors(prev => ({ ...prev, [errorKey]: 'Please enter a valid email address' }));
      } else {
        setContactsErrors(prev => { const n = { ...prev }; delete n[errorKey]; return n; });
      }
      return;
    }

    if (contactsErrors[errorKey]) {
      setContactsErrors(prev => { const n = { ...prev }; delete n[errorKey]; return n; });
    }
  };

  const handleAddNewContact = () => {
    const newContact = {
      id: Math.random().toString(),
      firstName: '',
      middleName: '',
      lastName: '',
      displayName: '',
      phone: '',
      countryCode: countryCodes[0]?.value || '+91',
      email: '',
      designation: '',
      department: [],
    };
    setEditContactsFormData([...editContactsFormData, newContact]);
  };

  const handleRemoveContact = (index: number) => {
    const updated = editContactsFormData.filter((_, i) => i !== index);
    setEditContactsFormData(updated);
  };

  const validateContactsForm = () => {
    const errors: Record<string, string> = {};
    editContactsFormData.forEach((contact, index) => {
      if (!contact.firstName?.trim()) errors[`${index}_firstName`] = 'First name is required';
      if (!contact.lastName?.trim()) errors[`${index}_lastName`] = 'Last name is required';
      if (!contact.phone?.trim()) errors[`${index}_phone`] = 'Phone is required';
      else if (String(contact.phone).replace(/\D/g, '').length !== 10) errors[`${index}_phone`] = 'Phone must be 10 digits';
      if (!contact.email?.trim()) errors[`${index}_email`] = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) errors[`${index}_email`] = 'Please enter a valid email address';
      if (!contact.designation?.trim()) errors[`${index}_designation`] = 'Designation is required';
      const deptVal = Array.isArray(contact.department) ? contact.department.join(', ') : contact.department;
      if (!deptVal || !deptVal.trim()) errors[`${index}_department`] = 'Department is required';
    });
    setContactsErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isContactsValidNoSet = () => {
    for (let index = 0; index < editContactsFormData.length; index++) {
      const contact = editContactsFormData[index];
      if (!contact.firstName?.trim()) return false;
      if (!contact.lastName?.trim()) return false;
      const phoneVal = String(contact.phone || '').replace(/\D/g, '');
      if (!phoneVal || phoneVal.length !== 10) return false;
      if (!contact.email?.trim()) return false;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) return false;
      if (!contact.designation?.trim()) return false;
      let departmentValue = contact.department;
      if (Array.isArray(departmentValue)) departmentValue = departmentValue.join(', ');
      if (!departmentValue || !departmentValue.trim()) return false;
    }
    return true;
  };

  const handleSaveContacts = async () => {
    if (!validateContactsForm()) return;
    setIsUpdatingContacts(true);
    try {
      const capitalize = (str: string) => str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
      const contactsPayload = editContactsFormData.map(contact => ({
        phone: `${contact.countryCode || '+91'}${String(contact.phone || '').replace(/\D/g, '')}`,
        email: contact.email,
        first_name: capitalize(contact.firstName),
        middle_name: capitalize(contact.middleName),
        last_name: capitalize(contact.lastName),
        display_name: contact.displayName.split(' ').map(capitalize).join(' '),
        designation: contact.designation,
        department: Array.isArray(contact.department) ? contact.department.join(', ') : contact.department,
      }));

      await apiCall(`/supplier/${supplierData.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ contacts: contactsPayload, updated_by: user?.display_name || 'Unknown User' }),
        headers: { 'Content-Type': 'application/json' },
      });

      setIsUpdatingContacts(false);
      showSuccessToast('Contacts updated successfully!');
      onUpdate({ ...supplierData, contacts: contactsPayload });
      onClose();
    } catch (error) {
      console.error('Error updating contacts:', error);
      showErrorToast('Failed to update contacts. Please try again.');
      setIsUpdatingContacts(false);
    }
  };

  const handleClose = () => {
    setEditContactsFormData([]);
    setContactsErrors({});
    onClose();
  };

  return (
    <EditModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Manage Contacts"
      isLoading={isUpdatingContacts}
      onSave={handleSaveContacts}
      isSaveDisabled={!isContactsValidNoSet()}
      size="xxl"
    >
      <div className="p-6 space-y-6">
        <div className="space-y-4">
          {editContactsFormData.map((contact, idx) => (
            <div key={contact.id || idx} className="bg-white rounded shadow p-6 mb-6 border border-gray-200">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-gray-900 font-semibold">Contact {idx + 1}</span>
                {idx > 0 && (
                  <button type="button" className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded transition" onClick={() => handleRemoveContact(idx)} aria-label="Remove contact">
                    <Icon name="trash" size={16} />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-4 gap-6">
                <div>
                  <EnhancedInputField label="First Name" value={contact.firstName} onChange={(v: string) => handleContactFormChange(idx, 'firstName', v)} type="text" textTransform="capitalize" placeholder="Enter first name" required error={contactsErrors[`${idx}_firstName`]} />
                </div>
                <div>
                  <EnhancedInputField label="Middle Name" value={contact.middleName} onChange={(v: string) => handleContactFormChange(idx, 'middleName', v)} type="text" textTransform="capitalize" placeholder="Enter middle name" />
                </div>
                <div>
                  <EnhancedInputField label="Last Name" value={contact.lastName} onChange={(v: string) => handleContactFormChange(idx, 'lastName', v)} type="text" textTransform="capitalize" placeholder="Enter last name" required error={contactsErrors[`${idx}_lastName`]} />
                </div>
                <div>
                  <EnhancedInputField label="Display Name" value={contact.displayName} onChange={() => {}} type="text" placeholder="Auto-generated from first, middle and last name" disabled readOnly textTransform="capitalize"/>
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone <span className="text-red-500">*</span></label>
                  <div className="flex gap-2">
                    <div className="w-28">
                      <AsyncSelect
                        isClearable={true}
                        isLoading={countryCodesLoading}
                        options={countryCodes || []}
                        value={(countryCodes || []).find((cc: any) => cc.value === contact.countryCode) || null}
                        onChange={(option: any) => {
                          if (option) handleContactFormChange(idx, 'countryCode', option.value);
                          else { handleContactFormChange(idx, 'countryCode', ''); }
                        }}
                        onInputChange={() => {}}
                        placeholder="Search code..."
                        error={contactsErrors[`${idx}_countryCode`]}
                        required={true}
                      />
                    </div>
                    <div className="flex-1">
                      <input type="tel" maxLength={10} placeholder="Enter 10 digit phone number" inputMode="tel" value={contact.phone} onChange={e => handleContactFormChange(idx, 'phone', e.target.value)} className={`w-full h-[42px] px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${contactsErrors[`${idx}_phone`] ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}`} />
                    </div>
                  </div>
                  {contactsErrors[`${idx}_phone`] && (<p className="text-red-500 text-sm mt-1">{contactsErrors[`${idx}_phone`]}</p>)}
                </div>
                <div>
                  <EnhancedInputField label="Email" value={contact.email} onChange={(v: string) => handleContactFormChange(idx, 'email', v)} type="email" textTransform="lowercase" placeholder="Enter email address" required autoComplete="email" error={contactsErrors[`${idx}_email`]} />
                </div>
                <div>
                  <SearchDropdown label="Designation" showAddButton dropdownType="Designation" dropdownLabel="Designation" value={contact.designation} onChange={value => { const designationValue = Array.isArray(value) ? value[0]?.value || '' : value?.value || ''; handleContactFormChange(idx, 'designation', designationValue); }} options={designationOptions} placeholder={designationsData ? 'Select Designation' : 'Loading designations...'} required isSearchable isClearable onInputChange={(input: string) => setDesignationSearch(input)} error={contactsErrors[`${idx}_designation`]} />
                </div>
                <div className='col-span-2'>
                  <SearchDropdown label="Department" showAddButton dropdownType="Department" dropdownLabel="Department" value={Array.isArray(contact.department) ? contact.department : typeof contact.department === 'string' && contact.department ? contact.department.split(',').map((d: string) => d.trim()) : []} onChange={value => { const departmentValue = Array.isArray(value) ? value.map((v: any) => v.value).join(', ') : value?.value || ''; handleContactFormChange(idx, 'department', departmentValue); }} options={departmentOptions} placeholder={departmentsData ? 'Select Departments' : 'Loading departments...'} required isMulti isSearchable onInputChange={(input: string) => setDepartmentSearch(input)} error={contactsErrors[`${idx}_department`]} />
                </div>
              </div>
            </div>
          ))}
        </div>
        <Button variant="outline" onClick={handleAddNewContact} className="w-full"><Icon name="plus" size={16} className="mr-2" />Add Contact</Button>
      </div>
    </EditModal>
  );
};

export default EditAddContact;