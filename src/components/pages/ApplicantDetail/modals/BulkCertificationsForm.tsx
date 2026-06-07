import React, { useState, useEffect, useCallback } from 'react';
import EnhancedInputField from '../../../molecules/EnhancedInputField';
import SearchDropdown from '../../../molecules/SearchDropdown';
import Button from '../../../atoms/Button';
import Icon from '../../../atoms/Icon';

interface CertificationFormData {
  id?: string;
  certificationName: string;
  issuingOrganization: string;
  dateObtained: string;
  expiryDate: string;
  credentialId: string;
}

interface BulkCertificationsFormProps {
  initialData: { certifications: CertificationFormData[] };
  onDataChange: (data: any) => void;
  canUpdateCandidates: boolean;
  canDeleteCandidates: boolean;
  institutionOptions?: any[];
  institutionLoading?: boolean;
  onInstitutionSearch?: (search: string) => void;
}

export const BulkCertificationsForm: React.FC<BulkCertificationsFormProps> = ({
  initialData,
  onDataChange,
  canUpdateCandidates,
  canDeleteCandidates,
  institutionOptions = [],
  institutionLoading = false,
  onInstitutionSearch,
}) => {
  const [data, setData] = useState(initialData);
  const [lastSentData, setLastSentData] = useState(initialData);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Helper function to sort certifications by date (latest first)
  const sortCertificationsByDate = useCallback((certList: CertificationFormData[]) => {
    return [...certList].sort((a, b) => {
      // Sort by dateObtained (latest first)
      const dateA = a.dateObtained ? new Date(a.dateObtained).getTime() : 0;
      const dateB = b.dateObtained ? new Date(b.dateObtained).getTime() : 0;
      return dateB - dateA;
    });
  }, []);

  // Send updates when focus changes or when data changes significantly
  useEffect(() => {
    if (
      !focusedField &&
      JSON.stringify(data) !== JSON.stringify(lastSentData)
    ) {
      // Auto-sort certifications by date before sending to parent
      const sortedData = {
        ...data,
        certifications: sortCertificationsByDate(data.certifications),
      };
      onDataChange(sortedData);
      setLastSentData(data);
    }
  }, [data, lastSentData, focusedField, onDataChange, sortCertificationsByDate]);

  const handleCertificationChange = useCallback(
    (index: number, field: keyof CertificationFormData, value: any) => {
      setData(prev => {
        const updatedCertifications = [...prev.certifications];
        updatedCertifications[index] = {
          ...updatedCertifications[index],
          [field]: value,
        };
        return { ...prev, certifications: updatedCertifications };
      });
    },
    []
  );

  const handleFocus = useCallback((field: string) => {
    setFocusedField(field);
  }, []);

  const handleBlur = useCallback(() => {
    setFocusedField(null);
  }, []);

  const handleAddCertification = () => {
    if (!canUpdateCandidates) {
      console.warn('User does not have permission to update candidate data');
      return;
    }
    const newData = {
      ...data,
      certifications: [
        ...data.certifications,
        {
          certificationName: '',
          issuingOrganization: '',
          dateObtained: '',
          expiryDate: '',
          credentialId: '',
        },
      ],
    };
    setData(newData);
    onDataChange(newData);
    setLastSentData(newData);
  };

  const handleRemoveCertification = (index: number) => {
    if (!canDeleteCandidates) {
      console.warn('User does not have permission to delete candidate data');
      return;
    }
    const newData = {
      ...data,
      certifications: data.certifications.filter((_, i) => i !== index),
    };
    setData(newData);
    onDataChange(newData);
    setLastSentData(newData);
  };

  return (
    <div
      className="p-6 space-y-6"
      onFocus={e =>
        handleFocus(e.target.getAttribute('data-field') || 'unknown')
      }
      onBlur={handleBlur}
    >
      <div className="space-y-4">
        {data.certifications.map((certification, index) => (
          <div
            key={certification.id || index}
            className="p-4 border rounded-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-900 font-semibold">Certification {index + 1}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={
                  canDeleteCandidates
                    ? () => handleRemoveCertification(index)
                    : undefined
                }
                disabled={!canDeleteCandidates}
                className="text-red-600 hover:text-red-800"
              >
                <Icon name="trash" size={16} />
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <EnhancedInputField
                  label="Certification Name"
                  value={certification.certificationName}
                  onChange={value =>
                    handleCertificationChange(index, 'certificationName', value)
                  }
                  placeholder="e.g., AWS Certified Solutions Architect"
                />
                <SearchDropdown
                  label="Issuing Organization"
                  options={institutionOptions}
                  value={certification.issuingOrganization}
                  onChange={(option: any) => {
                    handleCertificationChange(
                      index,
                      'issuingOrganization',
                      option?.label || ''
                    );
                    setFocusedField(null);
                  }}
                  onInputChange={onInstitutionSearch}
                  loading={institutionLoading}
                  placeholder="Search for institution..."
                  showAddButton={true}
                  dropdownType="Institution"
                  dropdownLabel="Issuing Organization"
                  onOptionAdded={(newOption: any) => {
                    // Refresh institution options
                    if (onInstitutionSearch) {
                      onInstitutionSearch('');
                    }
                  }}
                />
                <EnhancedInputField
                  label="Credential ID"
                  value={certification.credentialId}
                  onChange={value =>
                    handleCertificationChange(index, 'credentialId', value)
                  }
                  placeholder="e.g., CERT123456"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <EnhancedInputField
                  label="Issue Date"
                  type="date"
                  value={certification.dateObtained}
                  onChange={value =>
                    handleCertificationChange(index, 'dateObtained', value)
                  }
                  max={new Date().toISOString().split('T')[0]}
                />
                <EnhancedInputField
                  label="Expiry Date"
                  type="date"
                  value={certification.expiryDate}
                  onChange={value =>
                    handleCertificationChange(index, 'expiryDate', value)
                  }
                  min={certification.dateObtained}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      <Button
        variant="outline"
        onClick={canUpdateCandidates ? handleAddCertification : undefined}
        disabled={!canUpdateCandidates}
        className="w-full"
      >
        <Icon name="plus" size={16} className="mr-2" />
        Add Certification
      </Button>
    </div>
  );
};
