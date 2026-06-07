import React from 'react';
import Text from '../../../atoms/Text';
import Button from '../../../atoms/Button';
import DataTable from '../../../molecules/DataTable';

interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string;
  designation: string;
  division: string;
}

interface ContactsTabProps {
  contacts: Contact[];
  searchContact: string;
  onSearchChange: (value: string) => void;
  onEditContacts: () => void;
  onBulkUpload: () => void;
  showBulkUpload: boolean;
  onCloseBulkUpload: () => void;
}

export const ContactsTab: React.FC<ContactsTabProps> = ({
  contacts,
  searchContact,
  onSearchChange,
  onEditContacts,
  onBulkUpload,
  showBulkUpload,
  onCloseBulkUpload,
}) => {
  const filteredContacts = contacts.filter((c) => {
    const q = searchContact.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.designation?.toLowerCase().includes(q) ||
      c.division?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-white rounded shadow p-6 w-full">
      <div className="flex justify-between items-center mb-4">
        <Text variant="h4" className="text-gray-900">
          Client Contacts
        </Text>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search Contacts"
            className="border rounded px-3 py-1 text-gray-700"
            value={searchContact}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <Button variant="primary" onClick={onEditContacts}>
            Edit Contacts
          </Button>
          <button
            className="bg-blue-400 hover:bg-blue-500 text-white px-4 py-2 rounded font-semibold flex items-center gap-1"
            onClick={onBulkUpload}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4"
              />
            </svg>
            Bulk Upload
          </button>
        </div>
      </div>

      {/* Bulk Upload Modal */}
      {showBulkUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded shadow-lg p-6 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={onCloseBulkUpload}
            >
              &times;
            </button>
            <h3 className="text-lg font-bold mb-4">Bulk Upload Contacts</h3>
            <a
              href="/template/contact-upload-template.xlsx"
              download
              className="text-blue-600 underline mb-4 block"
            >
              Download Template
            </a>
            <input type="file" className="mb-4" />
            <div className="flex gap-2">
              <button className="bg-blue-500 text-white px-4 py-2 rounded font-semibold">
                Upload
              </button>
              <button
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded font-semibold"
                onClick={onCloseBulkUpload}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filtered contacts table */}
      <DataTable
        columns={[
          { key: 'name', label: 'NAME' },
          { key: 'phone', label: 'PHONE' },
          { key: 'email', label: 'EMAIL' },
          { key: 'designation', label: 'DESIGNATION' },
          { key: 'division', label: 'DIVISION' },
          { key: 'actions', label: 'ACTIONS' },
        ]}
        data={filteredContacts}
        visibleColumns={{
          name: true,
          phone: true,
          email: true,
          designation: true,
          division: true,
          actions: true,
        }}
        className="mt-4"
        emptyMessage="No contacts available"
      />

      <div className="flex text-sm justify-between items-center mt-4 text-gray-500">
        <span>
          Showing {filteredContacts.length} of {contacts.length} contacts
        </span>
        <div className="flex gap-2">
          <button className="px-2 py-1 rounded border">{'<'}</button>
          <span className="px-2 py-1 rounded bg-blue-400 text-white">1</span>
          <button className="px-2 py-1 rounded border">{'>'}</button>
        </div>
      </div>
    </div>
  );
};

export default ContactsTab;
