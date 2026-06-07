import React from 'react';
import Text from '../../../atoms/Text';
import Button from '../../../atoms/Button';
import DataTable from '../../../molecules/DataTable';

interface Document {
  type: string;
  number: string;
  view?: string;
}

interface DocumentsTabProps {
  documents: Document[];
  searchDocument: string;
  onSearchChange: (value: string) => void;
  onEditDocuments: () => void;
}

export const DocumentsTab: React.FC<DocumentsTabProps> = ({
  documents,
  searchDocument,
  onSearchChange,
  onEditDocuments,
}) => {
  const filteredDocuments = documents.filter((d) => {
    const q = searchDocument.toLowerCase();
    return (
      d.type?.toLowerCase().includes(q) ||
      d.number?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-white rounded shadow p-6 w-full">
      <div className="flex justify-between items-center mb-4">
        <Text variant="h4" className="text-gray-900">
          Client Documents
        </Text>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search Documents"
            className="border rounded px-3 py-1 text-gray-700"
            value={searchDocument}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <Button variant="primary" onClick={onEditDocuments}>
            Edit Documents
          </Button>
        </div>
      </div>

      {/* Filtered documents table */}
      <DataTable
        columns={[
          { key: 'type', label: 'DOCUMENT TYPE' },
          { key: 'number', label: 'DOCUMENT NUMBER' },
          { 
            key: 'view', 
            label: 'DOCUMENT VIEW',
            render: (value: any, row: Document) => (
              value ? (
                <a
                  href={value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
                >
                  View File
                </a>
              ) : (
                <span className="text-gray-400">No file</span>
              )
            )
          },
          { key: 'actions', label: 'ACTIONS' },
        ]}
        data={filteredDocuments}
        visibleColumns={{
          type: true,
          number: true,
          view: true,
          actions: true,
        }}
        className="mt-4"
        emptyMessage="No documents available"
      />

      <div className="flex text-sm justify-between items-center mt-4 text-gray-500">
        <span>
          Showing {filteredDocuments.length} of {documents.length} documents
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

export default DocumentsTab;
