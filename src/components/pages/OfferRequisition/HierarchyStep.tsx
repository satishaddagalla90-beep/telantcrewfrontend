import React from 'react';
import { OfferFormData } from './OfferRequisitionNew';

interface HierarchyStepProps {
  formData: OfferFormData;
  onChange: (field: string, value: any) => void;
  errors?: Record<string, string>;
  successMessage?: string;
}

const renderInput = (
  label: string,
  name: keyof OfferFormData,
  value: string,
  onChange: (e: any) => void,
  required = false,
  placeholder = ''
) => (
  <div>
    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    <input
      type="text"
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-slate-400"
      required={required}
    />
  </div>
);

const HierarchyStep: React.FC<HierarchyStepProps> = ({ 
  formData, 
  onChange, 
  successMessage 
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onChange(name, value);
  };

  // Condition: Reporting Manager is required only for Internal hires
  const isInternal = formData.hireType === 'Internal';
  const isReportingManagerRequired = isInternal;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {renderInput('Recruiter', 'recruiter', formData.recruiter, handleChange, false, 'Search...')}
        {renderInput('Team Lead', 'teamLead', formData.teamLead, handleChange, false, 'Search...')}
        {renderInput('Delivery Manager', 'deliveryMgr', formData.deliveryMgr, handleChange, false, 'Search...')}
        {renderInput('Account Manager', 'accountMgr', formData.accountMgr, handleChange, false, 'Search...')}
        {renderInput('Client Manager', 'clientManager', formData.clientManager, handleChange, false, 'Search...')}
        {renderInput('Business Head', 'businessHead', formData.businessHead, handleChange, true, 'Search...')}
        {/* Reporting Manager – required only for Internal */}
        {renderInput('Reporting Manager', 'reportingManager', formData.reportingManager, handleChange, isReportingManagerRequired, 'Search...')}
        {renderInput('VP', 'vp', formData.vp, handleChange, true, 'Search...')}
      </div>

      {/* Success message */}
      {successMessage && (
        <div className="mt-6 p-4 rounded-lg bg-green-900/50 border border-green-500 text-green-300 text-center">
          <p className="text-sm font-semibold">{successMessage}</p>
        </div>
      )}
    </div>
  );
};

export default HierarchyStep;