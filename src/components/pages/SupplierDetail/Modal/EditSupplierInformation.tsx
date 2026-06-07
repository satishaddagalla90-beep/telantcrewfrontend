import React, { useState } from 'react';
import { apiCall, useSWR } from '../../../../utils/api';
import { useAuth } from '../../../auth/AuthContext';
import { useBranchesDropdown } from '../../../../hooks/useSupplierDropdowns';
import { showSuccessToast, showErrorToast } from '../../../../utils/toast';
import EditModal from '../../../../components/molecules/EditModal/EditModal';
import EnhancedInputField from '../../../../components/molecules/EnhancedInputField/EnhancedInputField';
import SearchDropdown from '../../../../components/molecules/SearchDropdown/SearchDropdown';
import { SupplierData } from '../../../../types/supplier';

interface EditSupplierInformationProps {
  isOpen: boolean;
  onClose: () => void;
  supplierData: SupplierData;
  onUpdate: (updatedData: SupplierData) => void;
}

const EditSupplierInformation: React.FC<EditSupplierInformationProps> = ({
  isOpen,
  onClose,
  supplierData,
  onUpdate,
}) => {
  // Helper to normalize comma-separated strings into arrays for multi-select fields
  const parseArrayValue = (val: any): string[] => {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string' && val.trim()) return val.split(',').map((s) => s.trim()).filter(Boolean);
    return [];
  };

  const [formData, setFormData] = useState({
    supplier_type: parseArrayValue(supplierData.supplier_type),
    industry: parseArrayValue(supplierData.industry),
    category: parseArrayValue(supplierData.category),
    capability: supplierData.capability || '',
    branches: parseArrayValue(supplierData.branches),
  });

  // Search strings for dropdowns
  const [supplierTypeSearch, setSupplierTypeSearch] = useState('');
  const [industrySearch, setIndustrySearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [capabilitySearch, setCapabilitySearch] = useState('');

  // Build URLs for supplier dropdowns
  const supplierTypeUrl = `/supplierdropdowns/SupplierType?page=1&limit=100${supplierTypeSearch ? `&search=${encodeURIComponent(supplierTypeSearch)}` : ''}`;
  const industryUrl = `/supplierdropdowns/Industry?page=1&limit=100${industrySearch ? `&search=${encodeURIComponent(industrySearch)}` : ''}`;
  const categoryUrl = `/supplierdropdowns/Skill Category?page=1&limit=100${categorySearch ? `&search=${encodeURIComponent(categorySearch)}` : ''}`;
  const capabilityUrl = `/supplierdropdowns/SkillSets?page=1&limit=100${capabilitySearch ? `&search=${encodeURIComponent(capabilitySearch)}` : ''}`;

  const { data: supplierTypeData } = useSWR<any>(supplierTypeUrl);
  const { data: industryData } = useSWR<any>(industryUrl);
  const { data: categoryData } = useSWR<any>(categoryUrl);
  const { data: capabilityData } = useSWR<any>(capabilityUrl);

  // Use branches hook which loads countries API and flattens cities
  const {
    options: branchesOptionsFromHook,
    loading: branchesLoading,
    search: searchBranches,
  } = useBranchesDropdown();

  const supplierTypeOptions = supplierTypeData?.data?.map((d: any) => ({ value: d.name, label: d.name })) || [];
  const industryOptions = industryData?.data?.map((d: any) => ({ value: d.name, label: d.name })) || [];
  const categoryOptions = categoryData?.data?.map((d: any) => ({ value: d.name, label: d.name })) || [];
  const capabilityOptions = capabilityData?.data?.map((d: any) => ({ value: d.name, label: d.name })) || [];
  const branchesOptions = branchesOptionsFromHook || [];

  const selectedSupplierType = supplierTypeOptions.filter((o: any) => (Array.isArray(formData.supplier_type) ? formData.supplier_type : []).includes(o.value));
  const selectedIndustry = industryOptions.filter((o: any) => (Array.isArray(formData.industry) ? formData.industry : []).includes(o.value));
  const selectedCategory = categoryOptions.find((o: any) => {
    const v = Array.isArray(formData.category) ? formData.category[0] : formData.category;
    return v && o.value === v;
  }) || null;
  const selectedCapability = capabilityOptions.find((o: any) => {
    const v = Array.isArray(formData.capability) ? formData.capability[0] : formData.capability;
    return v && o.value === v;
  }) || null;
  const selectedBranches = branchesOptions.find((o: any) => o.value === formData.branches) || null;

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isUpdating, setIsUpdating] = useState(false);
  const { user } = useAuth();

  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    const supplierTypeEmpty = Array.isArray(formData.supplier_type)
      ? formData.supplier_type.length === 0
      : !(typeof formData.supplier_type === 'string' && (formData.supplier_type as any).trim());

    if (supplierTypeEmpty) {
      errors.supplier_type = 'Supplier type is required';
    }

    const industryEmpty = Array.isArray(formData.industry)
      ? formData.industry.length === 0
      : !(typeof formData.industry === 'string' && (formData.industry as any).trim());

    if (industryEmpty) {
      errors.industry = 'Industry is required';
    }


    // if (!formData.capability.trim()) {
    //   errors.capability = 'Skill capability is required';
    // }

    const branchesEmpty = Array.isArray(formData.branches)
      ? formData.branches.length === 0
      : !(typeof formData.branches === 'string' && (formData.branches as any).trim());

    if (branchesEmpty) {
      errors.branches = 'Branches is required';
    }

    const categoryEmpty = Array.isArray(formData.category)
      ? formData.category.length === 0
      : !(typeof formData.category === 'string' && (formData.category as any).trim());

    if (categoryEmpty) {
      errors.category = 'Skill category is required';
    }



    // removed website validation (field removed)

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsUpdating(true);
    try {
      const updateData = {
        supplier_type: Array.isArray(formData.supplier_type) ? formData.supplier_type.join(', ') : formData.supplier_type,
        industry: Array.isArray(formData.industry) ? formData.industry.join(', ') : formData.industry,
        category: formData.category, // Send as array
        capability: formData.capability,
        branches: formData.branches, // Send as array

      };

      const response = await apiCall(`/supplier/${supplierData.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ ...updateData, updated_by: user?.display_name || 'Unknown User' }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response) {
        showSuccessToast('Supplier information updated successfully!');
        onUpdate({
          ...supplierData,
          supplier_type: updateData.supplier_type,
          industry: updateData.industry,
          category: updateData.category as any, // Cast to any to handle string | string[] mismatch
          capability: updateData.capability,
          branches: updateData.branches as any, // Cast to any to handle string | string[] mismatch
        });
        onClose();
      }
    } catch (error) {
      console.error('Error updating supplier information:', error);
      showErrorToast('Failed to update supplier information. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClose = () => {
    setFormData({
      supplier_type: parseArrayValue(supplierData.supplier_type),
      industry: parseArrayValue(supplierData.industry),
      category: parseArrayValue(supplierData.category),
      capability: supplierData.capability || '',
      branches: parseArrayValue(supplierData.branches),

    });
    setFormErrors({});
    onClose();
  };

  return (
    <EditModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Edit Supplier Information"
      isLoading={isUpdating}
      onSave={handleSave}
      size="lg"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <SearchDropdown
            label="Supplier Type"
            value={formData.supplier_type}
            onChange={(val: any) => handleFormChange('supplier_type', Array.isArray(val) ? val.map((v: any) => v.value) : val ? val.value : '')}
            options={supplierTypeOptions}
            isMulti
            isSearchable
            onInputChange={(v: string) => setSupplierTypeSearch(v)}
            placeholder="Select supplier type"
            required
            error={formErrors.supplier_type}
          />
        </div>

        {/* Website field removed as requested */}

        <div>
          <SearchDropdown
            label="Skill Category"
            value={formData.category}
            onChange={(val: any) => handleFormChange('category', Array.isArray(val) ? val.map((v: any) => v.value) : val ? val.value : '')}
            options={categoryOptions}
            isMulti
            isSearchable
            onInputChange={(v: string) => setCategorySearch(v)}
            placeholder="Select skill category"
            required
            error={formErrors.category}
          />
        </div>

        {/* <div>
          <SearchDropdown
            label="Skill Capability"
            value={formData.capability}
            onChange={(val: any) => handleFormChange('capability', Array.isArray(val) ? val.map((v: any) => v.value) : val ? val.value : '')}
            options={capabilityOptions}
            isSearchable
            onInputChange={(v: string) => setCapabilitySearch(v)}
            placeholder="Select skill capability"
            required
            error={formErrors.capability}
          />
        </div> */}

        <div>
          <SearchDropdown
            label="Branches"
            value={formData.branches}
            onChange={(val: any) => handleFormChange('branches', Array.isArray(val) ? val.map((v: any) => v.value) : val ? val.value : '')}
            options={branchesOptions}
            isMulti
            isSearchable
            onInputChange={(v: string) => searchBranches(v)}
            placeholder="Select branch"
            required
            error={formErrors.branches}
          />
        </div>

        <div className="md:col-span-2">
          <SearchDropdown
            label="Industry"
            value={formData.industry}
            onChange={(val: any) => handleFormChange('industry', Array.isArray(val) ? val.map((v: any) => v.value) : val ? val.value : '')}
            options={industryOptions}
            isMulti
            isSearchable
            onInputChange={(v: string) => setIndustrySearch(v)}
            placeholder="Select industry"
            required
            error={formErrors.industry}
          />
        </div>
      </div>
    </EditModal>
  );
};

export default EditSupplierInformation;