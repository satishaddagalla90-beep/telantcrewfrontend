import React, { useState, useEffect } from 'react';
import { UploadCloud } from 'lucide-react';
import { OfferFormData, FilesState } from './OfferRequisitionNew';

interface CandidateKYSStepProps {
  formData: OfferFormData;
  files: FilesState;
  onFileChange: (type: 'aadhar' | 'pan' | 'resume', file: File | null) => void;
  fileNames: { aadhar: string; pan: string; resume: string };
  onChange: (field: string, value: any) => void;
  errors?: Record<string, string>;
}

// Validation functions (unchanged) ...
const validateRequired = (value: any): string | null => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return 'This field is required';
  }
  return null;
};

const validateNumber = (value: string, fieldName: string, isRequired: boolean, exactLength?: number): string | null => {
  if (!isRequired && (!value || value.trim() === '')) return null;
  const requiredError = validateRequired(value);
  if (requiredError) return requiredError;
  if (!/^\d+$/.test(value.trim())) {
    return `${fieldName} must contain only digits`;
  }
  if (exactLength && value.trim().length !== exactLength) {
    return `${fieldName} must be exactly ${exactLength} digits`;
  }
  return null;
};

const validateUAN = (uan: string): string | null => {
  if (!uan || uan.trim() === '') return null;
  if (uan.trim().length > 30) return 'UAN cannot exceed 30 characters';
  if (!/^[A-Za-z0-9\s\-_]+$/.test(uan.trim())) {
    return 'UAN can contain only letters, numbers, spaces, hyphens, or underscores';
  }
  return null;
};

const validatePhone = (phone: string): string | null => {
  if (!phone || phone.trim() === '') return 'Phone number is required';
  const cleaned = phone.trim();
  if (!/^\d{10}$/.test(cleaned)) {
    return 'Phone number must be exactly 10 digits';
  }
  return null;
};

const validateEmail = (email: string): string | null => {
  if (!email || email.trim() === '') return 'Email is required';
  const emailRegex = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;
  if (!emailRegex.test(email.trim())) {
    return 'Enter a valid email address (e.g., name@example.com)';
  }
  return null;
};

const validatePAN = (pan: string): string | null => {
  if (!pan || pan.trim() === '') return 'PAN number is required';
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  if (!panRegex.test(pan.trim().toUpperCase())) {
    return 'PAN must be in format ABCDE1234F (5 letters, 4 digits, 1 letter)';
  }
  return null;
};

const validateAadhar = (aadhar: string): string | null => {
  if (!aadhar || aadhar.trim() === '') return 'Aadhar number is required';
  const cleaned = aadhar.trim();
  if (!/^\d{12}$/.test(cleaned)) {
    return 'Aadhar number must be exactly 12 digits';
  }
  return null;
};

const validateSkillSet = (skills: string): string | null => {
  if (!skills || skills.trim() === '') return 'Skill set is required';
  if (skills.trim().length < 2) return 'Enter at least one skill';
  return null;
};

const validateAddress = (address: string): string | null => {
  if (!address || address.trim() === '') return 'Full address is required';
  if (address.trim().length < 10) return 'Please enter a complete address';
  return null;
};

const CandidateKYSStep: React.FC<CandidateKYSStepProps> = ({
  formData,
  files,
  onFileChange,
  fileNames,
  onChange,
  errors: externalErrors = {},
}) => {
  const [internalErrors, setInternalErrors] = useState<Record<string, string>>({});
  const allErrors = { ...internalErrors, ...externalErrors };

  // Vendor options state (fetched from Vendor Master)
  const [vendorOptions, setVendorOptions] = useState<string[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(false);

  // Fetch vendors when component mounts
  useEffect(() => {
    const fetchVendors = async () => {
      setLoadingVendors(true);
      try {
        // Replace with your actual API endpoint
        const response = await fetch('/api/vendor-master/list');
        const data = await response.json();
        // Assuming API returns an array of objects with a 'name' field
        const vendorNames = data.map((vendor: any) => vendor.name || vendor.vendor_name);
        setVendorOptions(vendorNames);
      } catch (error) {
        console.error('Failed to fetch vendors:', error);
        // Fallback mock data – remove in production
        setVendorOptions(['Abacus staffing', 'Allyted Solutions', 'Vendor C', 'Vendor D']);
      } finally {
        setLoadingVendors(false);
      }
    };
    fetchVendors();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    onChange(name, value);

    let error = '';
    switch (name) {
      case 'tcId':
        error = validateNumber(value, 'Applicant ID', true) || '';
        break;
      case 'candName':
        error = validateRequired(value) || '';
        break;
      case 'aadharName':
        error = validateRequired(value) || '';
        break;
      case 'email':
        error = validateEmail(value) || '';
        break;
      case 'phone':
        error = validatePhone(value) || '';
        break;
      case 'skillSet':
        error = validateSkillSet(value) || '';
        break;
      case 'address':
        error = validateAddress(value) || '';
        break;
      case 'aadharNum':
        error = validateAadhar(value) || '';
        break;
      case 'panNum':
        error = validatePAN(value) || '';
        break;
      case 'aadharLink':
        error = validateRequired(value) || '';
        break;
      case 'uan':
        error = validateUAN(value) || '';
        break;
      case 'vendor':
        // Vendor is required only when source === 'Vendor'
        if (formData.source === 'Vendor' && !value) {
          error = 'Vendor is required when source is Vendor';
        } else {
          error = '';
        }
        break;
      default:
        break;
    }
    setInternalErrors((prev) => ({ ...prev, [name]: error }));
  };

  const validateFile = (type: 'aadhar' | 'pan' | 'resume'): string => {
    if (!files[type]) return `Please upload ${type === 'resume' ? 'Resume' : type.toUpperCase()} file`;
    return '';
  };

  useEffect(() => {
    setInternalErrors((prev) => ({
      ...prev,
      aadharFile: validateFile('aadhar'),
      panFile: validateFile('pan'),
      resumeFile: validateFile('resume'),
    }));
  }, [files]);

  // Re-run vendor validation when source changes
  useEffect(() => {
    if (formData.source === 'Vendor' && !formData.vendor) {
      setInternalErrors((prev) => ({ ...prev, vendor: 'Vendor is required when source is Vendor' }));
    } else if (formData.source !== 'Vendor') {
      setInternalErrors((prev) => ({ ...prev, vendor: '' }));
    }
  }, [formData.source, formData.vendor]);

  const renderInput = (
    label: string,
    name: keyof OfferFormData,
    value: string,
    required = false,
    placeholder = '',
    className = '',
    inputType = 'text'
  ) => {
    const error = allErrors[name as string];
    return (
      <div>
        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        <input
          type={inputType}
          name={name}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className={`w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${className} ${
            error ? 'border-red-500 ring-1 ring-red-500' : ''
          }`}
          required={required}
        />
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
    );
  };

  const renderSelect = (
    label: string,
    name: keyof OfferFormData,
    options: string[],
    required = false,
    placeholder = 'Select'
  ) => {
    const error = allErrors[name as string];
    return (
      <div>
        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        <select
          name={name}
          value={formData[name] as string}
          onChange={handleChange}
          className={`w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${
            error ? 'border-red-500 ring-1 ring-red-500' : ''
          }`}
          required={required}
          disabled={loadingVendors && name === 'vendor'}
        >
          <option value="">{loadingVendors && name === 'vendor' ? 'Loading vendors...' : placeholder}</option>
          {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
    );
  };

  const renderFileUpload = (label: string, type: 'aadhar' | 'pan' | 'resume', required = false) => {
    const errorKey = type === 'aadhar' ? 'aadharFile' : type === 'pan' ? 'panFile' : 'resumeFile';
    const error = allErrors[errorKey];
    return (
      <div>
        <div
          className={`border-2 border-dashed rounded-xl p-3 text-center relative hover:bg-slate-50 transition-colors ${
            error ? 'border-red-500 bg-red-50' : 'border-slate-300'
          }`}
        >
          <label className="block text-[10px] font-bold text-blue-600 uppercase mb-1">
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
          <input
            type="file"
            accept={type === 'resume' ? '.pdf,.doc,.docx' : '.pdf,image/*'}
            onChange={(e) => onFileChange(type, e.target.files?.[0] || null)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            required={required}
          />
          <UploadCloud className="mx-auto h-4 w-4 text-slate-400" />
          <p className="text-[9px] font-medium text-slate-500 mt-1 truncate">
            {fileNames[type] || 'No file chosen'}
          </p>
        </div>
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
    );
  };

  const showVendorField = formData.source === 'Vendor';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {renderInput('Applicant ID (As per TC)', 'tcId', formData.tcId, true, '', 'font-mono', 'number')}
        {renderInput('Candidate Name', 'candName', formData.candName, true)}
        {renderInput('Name as per Aadhar', 'aadharName', formData.aadharName, true)}
        {renderInput('Email', 'email', formData.email, true, '', '', 'email')}
        {renderInput('Phone', 'phone', formData.phone, true, '', '', 'tel')}
        <div className="md:col-span-2">
          {renderInput('Skill Set', 'skillSet', formData.skillSet, true, 'e.g. Java, Python, React')}
        </div>
        {renderInput('PF-UAN Number', 'uan', formData.uan, false, '', '', 'text')}
        
        {/* Vendor dropdown – conditionally shown */}
        {showVendorField && renderSelect('Vendor', 'vendor', vendorOptions, true, 'Select Vendor')}
        
        <div className="md:col-span-3">
          {renderInput('Full Address', 'address', formData.address, true)}
        </div>
        {renderInput('Aadhar Num', 'aadharNum', formData.aadharNum, true, '', 'font-mono', 'number')}
        {renderInput('PAN Num', 'panNum', formData.panNum, true, '', 'font-mono uppercase', 'text')}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
            Aadhar/PAN Link <span className="text-rose-500">*</span>
          </label>
          <select
            name="aadharLink"
            value={formData.aadharLink}
            onChange={handleChange}
            className={`w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${
              allErrors.aadharLink ? 'border-red-500 ring-1 ring-red-500' : ''
            }`}
            required
          >
            <option value="">Select</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
          {allErrors.aadharLink && <p className="text-red-500 text-xs mt-1">{allErrors.aadharLink}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {renderFileUpload('Aadhar (PDF/Img)', 'aadhar', true)}
        {renderFileUpload('PAN (PDF/Img)', 'pan', true)}
        {renderFileUpload('Resume (PDF/Doc)', 'resume', true)}
      </div>
    </div>
  );
};

export default CandidateKYSStep;