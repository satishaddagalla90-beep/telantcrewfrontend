import React, { useState, useEffect } from 'react';
import EnhancedInputField from '../../../molecules/EnhancedInputField';
import Button from '../../../atoms/Button';
import Icon from '../../../atoms/Icon';
import FileUpload from '../../../molecules/FileUpload';
import { DocumentFormData } from '../helper';

interface BulkDocumentsFormProps {
  initialData: DocumentFormData[];
  onDataChange: (data: DocumentFormData[]) => void;
  errors?: Record<string, string>;
  onValidationChange?: (isValid: boolean) => void;
}

const documentTypeOptions = [
  { value: 'GST Certificate', label: 'GST Certificate' },
  { value: 'PAN Card', label: 'PAN Card' },
  { value: 'Incorporation Certificate', label: 'Incorporation Certificate' },
  { value: 'MOA', label: 'MOA (Memorandum of Association)' },
  { value: 'AOA', label: 'AOA (Articles of Association)' },
  { value: 'Bank Statement', label: 'Bank Statement' },
  { value: 'Cancelled Cheque', label: 'Cancelled Cheque' },
  { value: 'MSME Certificate', label: 'MSME Certificate' },
  { value: 'Trade License', label: 'Trade License' },
  { value: 'Other', label: 'Other' },
];

export const BulkDocumentsForm: React.FC<BulkDocumentsFormProps> = ({
  initialData,
  onDataChange,
  errors = {},
  onValidationChange,
}) => {
  const [documents, setDocuments] = useState<DocumentFormData[]>(initialData);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setDocuments(initialData);
  }, [initialData]);

  useEffect(() => {
    setLocalErrors(errors);
  }, [errors]);

  useEffect(() => {
    const isValid = Object.keys(localErrors).length === 0;
    onValidationChange?.(isValid);
  }, [localErrors, onValidationChange]);

  const handleDocumentChange = (index: number, field: keyof DocumentFormData, value: string) => {
    const updatedDocuments = [...documents];
    updatedDocuments[index] = { ...updatedDocuments[index], [field]: value };
    setDocuments(updatedDocuments);
    onDataChange(updatedDocuments);

    // Clear error for this field
    const errorKey = `${index}_${field}`;
    if (localErrors[errorKey]) {
      const newErrors = { ...localErrors };
      delete newErrors[errorKey];
      setLocalErrors(newErrors);
    }
  };

  const handleFileUpload = (index: number, file: File | null) => {
    const updatedDocuments = [...documents];
    
    if (file) {
      const fileName = file.name;
      const fileUrl = URL.createObjectURL(file); // In real app, upload to server

      updatedDocuments[index] = {
        ...updatedDocuments[index],
        fileName,
        fileUrl,
      };
    } else {
      // Clear file when null is passed
      updatedDocuments[index] = {
        ...updatedDocuments[index],
        fileName: '',
        fileUrl: '',
      };
    }
    
    setDocuments(updatedDocuments);
    onDataChange(updatedDocuments);
  };

  const handleAddDocument = () => {
    const newDocument: DocumentFormData = {
      id: Math.random().toString(),
      documentType: '',
      documentNumber: '',
      issueDate: '',
      expiryDate: '',
      fileName: '',
      fileUrl: '',
      status: 'Active',
    };
    const updatedDocuments = [...documents, newDocument];
    setDocuments(updatedDocuments);
    onDataChange(updatedDocuments);
  };

  const handleRemoveDocument = (index: number) => {
    const updatedDocuments = documents.filter((_, i) => i !== index);
    setDocuments(updatedDocuments);
    onDataChange(updatedDocuments);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-4">
        {documents.map((document, index) => (
          <div key={document.id || index} className="grid grid-cols-1 gap-4 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-900">
                Document {index + 1}
              </div>
              {!document.documentType?.toLowerCase().includes('pan') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveDocument(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Icon name="trash" size={16} />
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <EnhancedInputField
                label="Document Type"
                value={document.documentType || ''}
                onChange={(value) => handleDocumentChange(index, 'documentType', value)}
                type="select"
                options={documentTypeOptions}
                placeholder="Select Document Type"
                error={localErrors[`${index}_documentType`]}
                required
              />
              <EnhancedInputField
                label="Document Number"
                value={document.documentNumber || ''}
                onChange={(value) => handleDocumentChange(index, 'documentNumber', value)}
                placeholder="Enter Document Number"
                error={localErrors[`${index}_documentNumber`]}
                required
              />
              <EnhancedInputField
                label="Issue Date"
                type="date"
                value={document.issueDate || ''}
                onChange={(value) => handleDocumentChange(index, 'issueDate', value)}
                placeholder="dd/mm/yyyy"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <EnhancedInputField
                label="Expiry Date"
                type="date"
                value={document.expiryDate || ''}
                onChange={(value) => handleDocumentChange(index, 'expiryDate', value)}
                placeholder="dd/mm/yyyy"
              />
              <div className="md:col-span-2">
                <FileUpload
                  label="Upload Document"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  maxSize={10}
                  required
                  onChange={file => {
                    handleFileUpload(index, file);
                  }}
                  error={localErrors[`${index}_fileName`]}
                  dragDrop={true}
                  currentFile={
                    document.fileName
                      ? { name: document.fileName }
                      : undefined
                  }
                  onViewFile={
                    document.fileUrl
                      ? () => window.open(document.fileUrl, '_blank')
                      : undefined
                  }
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button variant="outline" onClick={handleAddDocument} className="w-full">
        <Icon name="plus" size={16} className="mr-2" />
        Add Document
      </Button>
    </div>
  );
};

export default BulkDocumentsForm;
