import React, { useState } from 'react';
import { apiCall } from '../../../../utils/api/useSWR';
import { useSWR } from '../../../../utils/api';
import SearchDropdown from '../../../../components/molecules/SearchDropdown';
import { useAuth } from '../../../auth/AuthContext';
import { showSuccessToast, showErrorToast } from '../../../../utils/toast';
import EditModal from '../../../../components/molecules/EditModal/EditModal';
import EnhancedInputField from '../../../../components/molecules/EnhancedInputField/EnhancedInputField';
import AvatarUpload from '../../../../components/molecules/AvatarUpload/AvatarUpload';
// supplier_type removed from header modal
import CountryStateCity from '../../../../components/molecules/CountryStateCity/CountryStateCity';
import SelectField from '../../../../components/molecules/SelectField/SelectField';
import { useZoneDropdown } from '../../../../hooks/useSupplierDropdowns';
import { FileUploadService } from '../../../../services/fileUploadService';
import { SupplierData } from '../../../../types/supplier';

interface EditSupplierHeaderProps {
  isOpen: boolean;
  onClose: () => void;
  supplierData: SupplierData;
  onUpdate: (updatedData: SupplierData) => void;
  logoUrl?: string;
}

const EditSupplierHeader: React.FC<EditSupplierHeaderProps> = ({
  isOpen,
  onClose,
  supplierData,
  onUpdate,
  logoUrl,
}) => {
  // Website helpers: display without protocol, store lowercase, and format for API
  const formatWebsiteDisplay = (url: string) => {
    if (!url) return '';
    return url.replace(/^https?:\/\//i, '').replace(/\/+$/, '');
  };

  const formatWebsiteStorage = (url: string) => {
    if (!url) return '';
    return url.trim().toLowerCase().replace(/^https?:\/\//i, '').replace(/\/+$/, '');
  };

  const formatWebsiteForAPI = (url: string) => {
    if (!url) return '';
    const trimmed = url.trim().replace(/\/+$/, '');
    const cleaned = trimmed;
    if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) return cleaned.replace(/\/+$/, '');
    if (cleaned.startsWith('www.')) return `https://${cleaned}`;
    if (!cleaned.includes('.')) return `https://www.${cleaned}.com`;
    return `https://${cleaned}`;
  };
  // Zone dropdown hook
  const { options: zoneOptions, loading: zoneLoading, search: searchZone } = useZoneDropdown();
  const loadZoneOptions = (inputValue: string, callback: (opts: any[]) => void) => {
    try { searchZone(inputValue); } catch (e) { }
    const filtered = zoneOptions.filter((opt: any) => opt.label.toLowerCase().includes(String(inputValue || '').toLowerCase()));
    callback(filtered as any);
  };

  const [formData, setFormData] = useState({
    supplier_name: supplierData.supplier_name || '',
    supplier_id: supplierData.supplier_id || '',
    supplier_display_name: supplierData.supplier_display_name || '',
    supplier_logo: null as File | null,
    supplier_logo_preview: logoUrl || supplierData.supplier_logo || '',
    empanelment_status: supplierData.empanelment_status || 'Active',
    // supplier_type intentionally omitted from header
    website: supplierData.website ? formatWebsiteDisplay(supplierData.website) : '',
    zone: supplierData.zone || '',
    msme_certified: supplierData.msme_certified || false,
    registered_address: supplierData.address?.registered_address || '',
    country: supplierData.address?.country || '',
    state: supplierData.address?.state || '',
    city: supplierData.address?.city || '',
    postal_code: supplierData.address?.postal_code || '',
    supplier_logo_permanent_url: '',
  });

  // Sync logo preview when the secure presigned URL is ready
  React.useEffect(() => {
    if (logoUrl) {
      setFormData(prev => ({
        ...prev,
        supplier_logo_preview: logoUrl,
      }));
    }
  }, [logoUrl]);

  const [empanelmentSearch, setEmpanelmentSearch] = useState('');
  const empanelmentUrl = `/supplierdropdowns/Empanelment%20Status?page=1&limit=100${empanelmentSearch ? `&search=${encodeURIComponent(empanelmentSearch)}` : ''}`;
  const { data: empanelmentData } = useSWR<any>(empanelmentUrl);
  const empanelmentOptions = empanelmentData?.data?.map((d: any) => ({ value: d.name, label: d.name })) || [];

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [uploadStates, setUploadStates] = useState({
    logo: { uploading: false, error: null as string | null },
  });
  const { user } = useAuth();

  const handleLogoUpload = async (file: File | null) => {
    if (!file) {
      setFormData(prev => ({
        ...prev,
        supplier_logo: null,
        supplier_logo_preview: '',
      }));
      setUploadStates(prev => ({
        ...prev,
        logo: { uploading: false, error: null },
      }));
      return;
    }

    setUploadStates(prev => ({
      ...prev,
      logo: { uploading: true, error: null },
    }));

    try {
      const validation = FileUploadService.validateFile(file, {
        maxSize: 5,
        allowedTypes: [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'image/svg+xml',
        ],
      });

      if (!validation.valid) {
        throw new Error(validation.error || 'Invalid image file');
      }

      const uploadResponse = await FileUploadService.uploadSupplierLogo(file);

      // Get presigned URL for immediate secure preview
      const presignedUrl = await FileUploadService.getFileViewUrl(uploadResponse.file_url);

      setFormData(prev => ({
        ...prev,
        supplier_logo: null,
        supplier_logo_preview: presignedUrl,
        supplier_logo_permanent_url: uploadResponse.file_url // Store the permanent URL too
      }));

      setUploadStates(prev => ({
        ...prev,
        logo: { uploading: false, error: null },
      }));
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Upload failed';
      setUploadStates(prev => ({
        ...prev,
        logo: { uploading: false, error: errorMsg },
      }));

      setFormData(prev => ({
        ...prev,
        supplier_logo: null,
        supplier_logo_preview: '',
      }));

      setFormErrors(prev => ({
        ...prev,
        supplier_logo: errorMsg,
      }));
    }
  };

  const handleFormChange = (field: string, value: string | string[] | File | null | boolean) => {
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

    if (!formData.supplier_name?.trim()) {
      errors.supplier_name = 'Supplier name is required';
    }

    if (!formData.supplier_id?.trim()) {
      errors.supplier_id = 'Supplier ID is required';
    }

    if (!formData.zone?.trim()) {
      errors.zone = 'Zone is required';
    }

    // supplier_type validation removed for header

    if (!formData.website || !formData.website.trim()) {
      errors.website = 'Website is required';
    } else if (!/^www\.[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/i.test(formData.website)) {
      errors.website = 'Website must be in format www.xyz.com';
    }

    if (!formData.registered_address || !formData.registered_address.trim()) {
      errors.registered_address = 'Registered address is required';
    }

    if (!formData.country || !formData.country.trim()) {
      errors.country = 'Country is required';
    }

    if (!formData.state || !formData.state.trim()) {
      errors.state = 'State is required';
    }

    if (!formData.city || !formData.city.trim()) {
      errors.city = 'City is required';
    }

    if (!formData.empanelment_status || !String(formData.empanelment_status).trim()) {
      errors.empanelment_status = 'Empanelment status is required';
    }

    const postal = String(formData.postal_code || '').replace(/\D/g, '').trim();
    if (!postal) {
      errors.postal_code = 'PIN Code is required';
    } else if (postal.length !== 6) {
      errors.postal_code = 'PIN Code must be exactly 6 digits';
    }

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
        supplier_name: formData.supplier_name,
        supplier_id: formData.supplier_id,
        supplier_display_name: formData.supplier_display_name,
        supplier_logo: formData.supplier_logo_permanent_url || formData.supplier_logo_preview || supplierData.supplier_logo || null,
        empanelment_status: formData.empanelment_status,
        // zone included in header update
        zone: formData.zone || '',
        website: formatWebsiteForAPI(formData.website),
        msme_certified: formData.msme_certified,
        address: {
          registered_address: formData.registered_address,
          country: formData.country,
          state: formData.state,
          city: formData.city,
          postal_code: formData.postal_code,
        },
      };

      const response = await apiCall(`/supplier/${supplierData.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ ...updateData, updated_by: user?.display_name || 'Unknown User' }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response) {
        showSuccessToast('Supplier updated successfully!');
        onUpdate({
          ...supplierData,
          supplier_name: updateData.supplier_name,
          supplier_id: updateData.supplier_id,
          supplier_display_name: updateData.supplier_display_name,
          supplier_logo: updateData.supplier_logo || supplierData.supplier_logo,
          empanelment_status: updateData.empanelment_status,
          zone: updateData.zone || supplierData.zone,
          website: updateData.website,
          msme_certified: updateData.msme_certified,
          address: updateData.address,
        });
        onClose();
      }
    } catch (error) {
      console.error('Error updating supplier:', error);
      showErrorToast('Failed to update supplier. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClose = () => {
    setFormData({
      supplier_name: supplierData.supplier_name || '',
      supplier_id: supplierData.supplier_id || '',
      supplier_display_name: supplierData.supplier_display_name || '',
      supplier_logo: null,
      supplier_logo_preview: logoUrl || supplierData.supplier_logo || '',
      empanelment_status: supplierData.empanelment_status || 'Active',
      // supplier_type omitted in reset
      website: supplierData.website ? formatWebsiteDisplay(supplierData.website) : '',
      zone: supplierData.zone || '',
      msme_certified: supplierData.msme_certified || false,
      registered_address: supplierData.address?.registered_address || '',
      country: supplierData.address?.country || '',
      state: supplierData.address?.state || '',
      city: supplierData.address?.city || '',
      postal_code: supplierData.address?.postal_code || '',
      supplier_logo_permanent_url: '',
    });
    setFormErrors({});
    onClose();
  };

  return (
    <EditModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Edit Supplier Basic Information"
      isLoading={isUpdating}
      onSave={handleSave}
      size="lg"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <EnhancedInputField
          label="Supplier Name"
          value={formData.supplier_name}
          onChange={(value: string) => handleFormChange('supplier_name', value)}
          error={formErrors.supplier_name}
          required
          placeholder="Enter supplier name"
          gridCols="col-span-1"
          textTransform="capitalize"
        />

        <EnhancedInputField
          label="Supplier ID"
          value={formData.supplier_id}
          onChange={(value: string) => handleFormChange('supplier_id', value)}
          error={formErrors.supplier_id}
          required
          placeholder="Enter supplier ID"
          gridCols="col-span-1"
          disabled
          readOnly
        />

        <EnhancedInputField
          label="Display Name"
          value={formData.supplier_display_name}
          onChange={(value: string) => handleFormChange('supplier_display_name', value)}
          error={formErrors.supplier_display_name}
          placeholder="Enter display name"
          gridCols="col-span-1"
        />

        <EnhancedInputField
          label="Website"
          value={formData.website}
          onChange={(value: string) => handleFormChange('website', formatWebsiteStorage(value))}
          error={formErrors.website}
          placeholder="www.example.com"
          required
          gridCols="col-span-1"
        />

        <div className="col-span-1">
          <SelectField
            label="Zone"
            value={formData.zone || ''}
            onChange={(value: string) => handleFormChange('zone', value)}
            options={zoneOptions}
            loadOptions={loadZoneOptions}
            isSearchable={true}
            isAsync={true}
            isClearable={true}
            isLoading={zoneLoading}
            placeholder="Search or select zone"
            className="w-full"
            required
            error={formErrors.zone}
          />
        </div>

        <div className="col-span-1">
          <SearchDropdown
            label="Empanelment Status"
            value={formData.empanelment_status}
            onChange={(val: any) => handleFormChange('empanelment_status', Array.isArray(val) ? val[0]?.value || '' : val?.value || '')}
            options={empanelmentOptions}
            isSearchable
            isClearable
            required
            error={formErrors.empanelment_status}
            onInputChange={(v: string) => setEmpanelmentSearch(v)}
            placeholder={empanelmentData ? 'Select empanelment status' : 'Loading...'}
          />
        </div>

        {/* Supplier Logo Upload */}
        <div className="col-span-2">
          <AvatarUpload
            label="Supplier Logo"
            value={formData.supplier_logo}
            preview={formData.supplier_logo_preview}
            onChange={handleLogoUpload}
            error={formErrors.supplier_logo}
            accept=".jpg,.jpeg,.png,.gif"
            maxSize={5}
            size="lg"
            fallbackIcon="upload"
            showFileName={true}
            uploading={uploadStates.logo.uploading}
            uploadError={uploadStates.logo.error || undefined}
          />
        </div>

        {/* Registered Address Section */}
        <div className="col-span-2">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Registered Address
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <EnhancedInputField
              label="Registered Address"
              value={formData.registered_address}
              onChange={(value: string) => handleFormChange('registered_address', value)}
              error={formErrors.registered_address}
              placeholder="Enter registered address"
              gridCols="col-span-2"
              textTransform="capitalize"
              required
            />

            <div className="col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
              <CountryStateCity
                type="country"
                label="Country"
                value={formData.country}
                onChange={(value: string) => handleFormChange('country', value)}
                error={formErrors.country}
                required={true}
                placeholder="Select country"
              />

              <CountryStateCity
                type="state"
                label="State"
                value={formData.state}
                onChange={(value: string) => handleFormChange('state', value)}
                error={formErrors.state}
                required={true}
                country={formData.country}
                placeholder="Select state"
              />

              <CountryStateCity
                type="city"
                label="City"
                value={formData.city}
                onChange={(value: string) => handleFormChange('city', value)}
                error={formErrors.city}
                required={true}
                country={formData.country}
                state={formData.state}
                placeholder="Select city"
              />
            </div>

            <EnhancedInputField
              label="PIN Code"
              type="number"
              value={formData.postal_code}
              onChange={(value: string) => {
                // Only allow digits and max 6 characters
                const sanitizedValue = value.replace(/\D/g, '').slice(0, 6);
                handleFormChange('postal_code', sanitizedValue);
              }}
              error={formErrors.postal_code}
              placeholder="Enter 6-digit PIN code"
              gridCols="col-span-1"
              required
            />

            <div className="col-span-1 flex items-end pb-2">
              <div className="flex items-center">
                <input
                  id="msme_certified"
                  type="checkbox"
                  checked={Boolean(formData.msme_certified)}
                  onChange={(e) => handleFormChange('msme_certified', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="msme_certified" className="ml-2 text-sm font-medium text-gray-700">
                  MSME Certified
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </EditModal>
  );
};

export default EditSupplierHeader;