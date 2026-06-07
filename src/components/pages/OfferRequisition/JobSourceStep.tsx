import React, { useEffect, useMemo } from 'react';
import { OfferFormData } from './OfferRequisitionNew';

interface JobSourceStepProps {
  formData: OfferFormData;
  onChange: (field: string, value: any) => void;
  errors?: Record<string, string>;
  touched?: Record<string, boolean>;
}

const PLACEMENT_TYPES = ['Organic', 'Routing'];
const EMPLOYMENT_TYPES_EXTERNAL = ['Payroll', 'IC', 'Intern'];
const EMPLOYMENT_TYPES_INTERNAL = ['Payroll', 'IC', 'Intern', 'Trainee'];
const OFFER_TYPES = ['Offer', 'LOI', 'Contract'];
const HIRE_CATEGORIES = ['New Hire', 'Re-hire', 'Replacement'];
const DESIGNATIONS = ['Software Engineer', 'Senior Developer', 'Tech Lead', 'Manager', 'Architect'];
const SOURCES = ['Employee Referral', 'Job Portal', 'Social Media', 'Vendor'];
const CLIENTS = ['Client A', 'Client B', 'Client C'];
const DIVISIONS = ['US-Staffing', 'US-Operations', 'Domestic Staffing'];

const JobSourceStep: React.FC<JobSourceStepProps> = ({ formData, onChange, errors }) => {
  const isExternal = formData.hireType === 'External';
  const isInternal = formData.hireType === 'Internal';

  useEffect(() => {
    if (!formData.hireType) {
      onChange('hireType', 'External');
    }
  }, []);

  useEffect(() => {
    if (isExternal) {
      onChange('division', '');
      onChange('reportingManager', '');
    } else if (isInternal) {
      onChange('placementType', '');
      onChange('client', '');
    }
  }, [formData.hireType]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    onChange(name, value);
  };

  const employmentOptions = useMemo(
    () => (isExternal ? EMPLOYMENT_TYPES_EXTERNAL : EMPLOYMENT_TYPES_INTERNAL),
    [isExternal]
  );

  const renderSelect = (label: string, name: keyof OfferFormData, options: string[], required = false) => (
    <div>
      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <select
        name={name}
        value={formData[name] as string}
        onChange={handleChange}
        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 font-medium"
        required={required}
      >
        <option value="">Select {label.toLowerCase()}</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      {errors?.[name] && <p className="text-red-500 text-xs mt-1">{errors[name]}</p>}
    </div>
  );

  const renderInput = (label: string, name: keyof OfferFormData, required = false, placeholder = '') => (
    <div>
      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <input
        type="text"
        name={name}
        value={formData[name] as string}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        required={required}
      />
      {errors?.[name] && <p className="text-red-500 text-xs mt-1">{errors[name]}</p>}
    </div>
  );

  const renderDesignation = () => (
    <div>
      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
        Designation <span className="text-rose-500">*</span>
      </label>
      <input
        type="text"
        list="designationList"
        name="designation"
        value={formData.designation}
        onChange={handleChange}
        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        required
      />
      <datalist id="designationList">
        {DESIGNATIONS.map(d => <option key={d} value={d} />)}
      </datalist>
      {errors?.designation && <p className="text-red-500 text-xs mt-1">{errors.designation}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* NEW: Mapping ID field */}
        {renderInput('Mapping ID', 'mapId', false, 'Enter Mapping ID')}
        {/* Hire Type dropdown */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
            Hire Type <span className="text-rose-500">*</span>
          </label>
          <select
            name="hireType"
            value={formData.hireType}
            onChange={handleChange}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            required
          >
            <option value="External">External</option>
            <option value="Internal">Internal</option>
          </select>
          {errors?.hireType && <p className="text-red-500 text-xs mt-1">{errors.hireType}</p>}
        </div>

      

        {/* Conditional fields based on hire type */}
        {isExternal && (
          <>
            {renderSelect('Placement Type', 'placementType', PLACEMENT_TYPES, true)}
            {renderSelect('Employment Type', 'empType', employmentOptions, true)}
            {renderSelect('Offer Type', 'offerType', OFFER_TYPES, true)}
            {renderSelect('Hire Category', 'hireCat', HIRE_CATEGORIES, true)}
            {renderSelect('Client', 'client', CLIENTS, true)}
            {renderDesignation()}
            {renderSelect('Source', 'source', SOURCES, true)}
          </>
        )}

        {isInternal && (
          <>
            {renderSelect('Employment Type', 'empType', employmentOptions, true)}
            {renderSelect('Offer Type', 'offerType', OFFER_TYPES, true)}
            {renderSelect('Hire Category', 'hireCat', HIRE_CATEGORIES, true)}
            {renderSelect('Division', 'division', DIVISIONS, true)}
            {renderInput('Reporting Manager', 'reportingManager', true, 'Search by name or ID...')}
            {renderDesignation()}
            {renderSelect('Source', 'source', SOURCES, true)}
          </>
        )}
      </div>

      {formData.hireType && (
        <div className={`mt-4 p-3 rounded-lg border ${
          isExternal 
            ? 'bg-blue-50 border-blue-200 text-blue-700' 
            : 'bg-green-50 border-green-200 text-green-700'
        }`}>
          <p className="text-xs">
            <strong>Note:</strong> You are creating an {formData.hireType.toLowerCase()} requisition.
            {isExternal 
              ? ' External hires require placement type and client details.'
              : ' Internal hires require division and reporting manager.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default JobSourceStep;