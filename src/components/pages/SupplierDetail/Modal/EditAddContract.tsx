import React, { useState } from 'react';
import { apiCall, useSWR } from '../../../../utils/api';
import { useAuth } from '../../../auth/AuthContext';
import { showSuccessToast, showErrorToast } from '../../../../utils/toast';
import EditModal from '../../../../components/molecules/EditModal/EditModal';
import EnhancedInputField from '../../../../components/molecules/EnhancedInputField/EnhancedInputField';
import SearchDropdown from '../../../../components/molecules/SearchDropdown';
import Button from '../../../../components/atoms/Button';
import Icon from '../../../../components/atoms/Icon';
import { SupplierData } from '../../../../types/supplier';

interface EditAddContractProps {
  isOpen: boolean;
  onClose: () => void;
  supplierData: SupplierData;
  onUpdate: (updatedData: SupplierData) => void;
}

interface ContractFormData {
  id: string;
  contractType: string;
  paymentTerm: string;
  paymentType: string;
}

const EditAddContract: React.FC<EditAddContractProps> = ({
  isOpen,
  onClose,
  supplierData,
  onUpdate,
}) => {
  // Prepare contracts data from supplier with proper field mapping
  const prepareContractsData = (): ContractFormData[] => {
    if (supplierData.financial_details && Array.isArray(supplierData.financial_details)) {
      return supplierData.financial_details.map((contract: any, index: number) => ({
        id: index.toString(),
        contractType: contract.contract_type || '',
        paymentTerm: contract.payment_term || '',
        paymentType: contract.payment_type || '',
      }));
    }
    
    // If no contracts exist, create one empty contract
    return [{
      id: Math.random().toString(),
      contractType: '',
      paymentTerm: '',
      paymentType: '',
    }];
  };

  const [editContractsFormData, setEditContractsFormData] = useState<ContractFormData[]>(prepareContractsData());
  const [contractsErrors, setContractsErrors] = useState<Record<string, string>>({});
  const [isUpdating, setIsUpdating] = useState(false);
  const { user } = useAuth();

  // Dropdown states
  const [contractTypeSearch, setContractTypeSearch] = useState('');
  const contractTypeUrl = `/supplierdropdowns/Contracts?page=1&limit=100${contractTypeSearch ? `&search=${encodeURIComponent(contractTypeSearch)}` : ''}`;
  const { data: contractTypeData } = useSWR<any>(contractTypeUrl);
  const contractTypeOptions = contractTypeData?.data?.map((d: any) => ({ value: d.name, label: d.name })) || [];

  const [paymentTermSearch, setPaymentTermSearch] = useState('');
  const paymentTermUrl = `/supplierdropdowns/Payment_Term?page=1&limit=100${paymentTermSearch ? `&search=${encodeURIComponent(paymentTermSearch)}` : ''}`;
  const { data: paymentTermData } = useSWR<any>(paymentTermUrl);
  const paymentTermOptions = paymentTermData?.data?.map((d: any) => ({ value: d.name, label: d.name })) || [];

  const [paymentTypeSearch, setPaymentTypeSearch] = useState('');
  const paymentTypeUrl = `/supplierdropdowns/Payment_Type?page=1&limit=100${paymentTypeSearch ? `&search=${encodeURIComponent(paymentTypeSearch)}` : ''}`;
  const { data: paymentTypeData } = useSWR<any>(paymentTypeUrl);
  const paymentTypeOptions = paymentTypeData?.data?.map((d: any) => ({ value: d.name, label: d.name })) || [];

  // Handle contracts form field changes
  const handleContractFormChange = (
    index: number,
    field: string,
    value: string
  ) => {
    const updatedContracts = [...editContractsFormData];
    updatedContracts[index] = { ...updatedContracts[index], [field]: value };
    setEditContractsFormData(updatedContracts);

    // Clear error for this field
    const errorKey = `${index}_${field}`;
    if (contractsErrors[errorKey]) {
      setContractsErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  // Add new contract
  const handleAddNewContract = () => {
    const newContract = {
      id: Math.random().toString(),
      contractType: '',
      paymentTerm: '',
      paymentType: '',
    };
    setEditContractsFormData([...editContractsFormData, newContract]);
  };

  // Remove contract
  const handleRemoveContract = (index: number) => {
    const updatedContracts = editContractsFormData.filter(
      (_, i) => i !== index
    );
    setEditContractsFormData(updatedContracts);
  };

  // Validate contracts form
  const validateContractsForm = () => {
    const errors: Record<string, string> = {};

    editContractsFormData.forEach((contract, index) => {
      // Contract Type validation
      if (!contract.contractType?.trim()) {
        errors[`${index}_contractType`] = 'Contract type is required';
      }

      // Payment Term validation
      if (!contract.paymentTerm?.trim()) {
        errors[`${index}_paymentTerm`] = 'Payment term is required';
      }

      // Payment Type validation
      if (!contract.paymentType?.trim()) {
        errors[`${index}_paymentType`] = 'Payment type is required';
      }
    });

    setContractsErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Contracts validity checker without setting errors
  const isContractsValidNoSet = () => {
    for (let index = 0; index < editContractsFormData.length; index++) {
      const contract: any = editContractsFormData[index];
      if (!contract.contractType?.trim()) return false;
      if (!contract.paymentTerm?.trim()) return false;
      if (!contract.paymentType?.trim()) return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateContractsForm()) {
      return;
    }

    setIsUpdating(true);
    try {
      // Map contracts to API schema
      const contractsPayload = editContractsFormData.map(contract => ({
        contract_type: contract.contractType,
        payment_term: contract.paymentTerm,
        payment_type: contract.paymentType,
      }));

      // PATCH API call
      const response = await apiCall(`/supplier/${supplierData.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ 
          financial_details: contractsPayload,
          updated_by: user?.display_name || 'Unknown User' 
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response) {
        showSuccessToast('Contracts updated successfully!');
        
        onUpdate({
          ...supplierData,
          financial_details: contractsPayload,
        });
        onClose();
      }
    } catch (error) {
      console.error('Error updating contracts:', error);
      showErrorToast('Failed to update contracts. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClose = () => {
    setEditContractsFormData(prepareContractsData());
    setContractsErrors({});
    onClose();
  };

  return (
    <EditModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Manage Contracts"
      isLoading={isUpdating}
      onSave={handleSave}
      isSaveDisabled={!isContractsValidNoSet()}
      size="xl"
    >
      <div className="p-6 space-y-6">
        <div className="space-y-4">
          {editContractsFormData.map((contract, index) => (
            <div
              key={contract.id || index}
              className="p-4 border rounded-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-900 font-semibold">Contract {index + 1}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveContract(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Icon name="trash" size={16} />
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <SearchDropdown
                    label="Contract Type"
                    value={contract.contractType || ''}
                    onChange={value => {
                      const contractTypeValue = Array.isArray(value)
                        ? value[0]?.value || ''
                        : value?.value || '';
                      handleContractFormChange(
                        index,
                        'contractType',
                        contractTypeValue
                      );
                    }}
                    options={contractTypeOptions}
                    placeholder="Select Contract Type"
                    error={contractsErrors[`${index}_contractType`]}
                    required
                    isSearchable
                    isClearable
                    loading={!contractTypeData}
                  />
                </div>
                <div>
                  <SearchDropdown
                    label="Payment Term"
                    value={contract.paymentTerm || ''}
                    onChange={value => {
                      const paymentTermValue = Array.isArray(value)
                        ? value[0]?.value || ''
                        : value?.value || '';
                      handleContractFormChange(
                        index,
                        'paymentTerm',
                        paymentTermValue
                      );
                    }}
                    options={paymentTermOptions}
                    placeholder="Select Payment Term"
                    error={contractsErrors[`${index}_paymentTerm`]}
                    required
                    isSearchable
                    isClearable
                    loading={!paymentTermData}
                  />
                </div>
                <div>
                  <SearchDropdown
                    label="Payment Type"
                    value={contract.paymentType || ''}
                    onChange={value => {
                      const paymentTypeValue = Array.isArray(value)
                        ? value[0]?.value || ''
                        : value?.value || '';
                      handleContractFormChange(
                        index,
                        'paymentType',
                        paymentTypeValue
                      );
                    }}
                    options={paymentTypeOptions}
                    placeholder="Select Payment Type"
                    error={contractsErrors[`${index}_paymentType`]}
                    required
                    isSearchable
                    isClearable
                    loading={!paymentTypeData}
                  />
                </div>
              </div>
              </div>
            </div>
          ))}
        </div>
        <Button
          variant="outline"
          onClick={handleAddNewContract}
          className="w-full"
        >
          <Icon name="plus" size={16} className="mr-2" />
          Add Contract
        </Button>
      </div>
    </EditModal>
  );
};

export default EditAddContract;