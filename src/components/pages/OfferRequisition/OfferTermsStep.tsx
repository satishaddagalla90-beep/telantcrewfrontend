import React, { useEffect, useRef, useState } from 'react';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/themes/material_blue.css';
import { OfferFormData } from './OfferRequisitionNew';

interface OfferTermsStepProps {
  formData: OfferFormData;
  onChange: (field: string, value: any) => void;
  errors?: Record<string, string>;
}

const BILLING_UOMS = ['Hourly', 'Daily', 'Monthly', 'Yearly'];
const VENDOR_FEE_TYPES = ['One time', 'Monthly %'];
const BONUS_TYPES = ['Joining', 'Retention'];

const annualizeFromRate = (rate: number, uom: string): number => {
  switch (uom) {
    case 'Hourly': return rate * 2080;
    case 'Daily': return rate * 260;
    case 'Monthly': return rate * 12;
    case 'Yearly': return rate;
    default: return 0;
  }
};

const OfferTermsStep: React.FC<OfferTermsStepProps> = ({
  formData,
  onChange,
  errors = {},
}) => {
  const dojRef = useRef<HTMLInputElement>(null);
  const flatpickrInstance = useRef<any>(null);
  const [grossProfit, setGrossProfit] = useState('0.00');
  const [netProfit, setNetProfit] = useState('0.00');
  const [ctcJump, setCtcJump] = useState('0.00');
  const [lastApprovedMargin, setLastApprovedMargin] = useState('0.00');

  const isExternal = formData.hireType === 'External';
  const isInternal = formData.hireType === 'Internal';
  const showVendorFees = formData.source === 'Vendor' && isExternal;

  // Initialize flatpickr
  useEffect(() => {
    if (dojRef.current && !flatpickrInstance.current) {
      flatpickrInstance.current = flatpickr(dojRef.current, {
        dateFormat: 'd-m-Y',
        minDate: 'today',
        onChange: (selectedDates: Date[], dateStr: string) => {
          onChange('doj', dateStr);
        },
      });
    }
    if (flatpickrInstance.current && formData.doj) {
      flatpickrInstance.current.setDate(formData.doj, false);
    }
    return () => {
      if (flatpickrInstance.current) {
        flatpickrInstance.current.destroy();
        flatpickrInstance.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (flatpickrInstance.current && formData.doj) {
      flatpickrInstance.current.setDate(formData.doj, false);
    }
  }, [formData.doj]);

  // Calculations: Gross Profit, Net Profit, CTC Jump, Last Approved Margin
  useEffect(() => {
    const rawRate = parseFloat(formData.rawBillingRate) || 0;
    const offerCtc = parseFloat(formData.offerCtc) || 0;
    const currentCtc = parseFloat(formData.currentCtc) || 0;
    const annualBilling = annualizeFromRate(rawRate, formData.billingUom);

    let gross = 0, net = 0;
    if (annualBilling > 0 && isExternal) {
      gross = ((annualBilling - offerCtc) / annualBilling) * 100;
      let vendorCost = 0;
      if (formData.vendorFeeType === 'One time') {
        vendorCost = parseFloat(formData.vendorFeeValue) || 0;
      } else if (formData.vendorFeeType === 'Monthly %') {
        vendorCost = ((parseFloat(formData.vendorFeePerc) || 0) / 100) * annualBilling;
      }
      // Net profit includes 15% operational cost
      const operationalCost = annualBilling * 0.15;
      net = ((annualBilling - offerCtc - vendorCost - operationalCost) / annualBilling) * 100;
    }
    setGrossProfit(gross.toFixed(2));
    setNetProfit(net.toFixed(2));
    onChange('candBilling', annualBilling.toFixed(2));
    onChange('grossProfit', gross.toFixed(2));
    onChange('netProfit', net.toFixed(2));

    // CTC Jump % for internal hires
    if (isInternal && currentCtc > 0) {
      const jump = ((offerCtc - currentCtc) / currentCtc) * 100;
      setCtcJump(jump.toFixed(2));
      onChange('ctcJump', jump.toFixed(2));
    } else {
      setCtcJump('0.00');
      onChange('ctcJump', '0.00');
    }

    // Last Approved Margin (if revision – replace with actual API fetch)
    if (formData.isRevision) {
      // In real app, fetch from backend. Here we set placeholder.
      const mockLastMargin = '25.00';
      setLastApprovedMargin(mockLastMargin);
      onChange('lastApprovedMargin', mockLastMargin);
    } else {
      setLastApprovedMargin('0.00');
      onChange('lastApprovedMargin', '0.00');
    }
  }, [
    formData.rawBillingRate,
    formData.billingUom,
    formData.offerCtc,
    formData.currentCtc,
    formData.vendorFeeType,
    formData.vendorFeeValue,
    formData.vendorFeePerc,
    isExternal,
    isInternal,
    formData.isRevision,
    onChange,
  ]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    onChange(name, value);
  };

  const renderInput = (
    label: string,
    name: keyof OfferFormData,
    type = 'text',
    required = false,
    placeholder = '',
    className = '',
    readOnly = false
  ) => {
    const error = errors[name];
    return (
      <div>
        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        <input
          type={type}
          name={name}
          value={formData[name] as string}
          onChange={handleChange}
          placeholder={placeholder}
          readOnly={readOnly}
          className={`w-full bg-slate-50 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${className} ${
            readOnly ? 'bg-gray-100 cursor-not-allowed' : ''
          } ${error ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200'}`}
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
    required = false
  ) => {
    const error = errors[name];
    return (
      <div>
        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        <select
          name={name}
          value={formData[name] as string}
          onChange={handleChange}
          className={`w-full bg-slate-50 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${
            error ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200'
          }`}
          required={required}
        >
          <option value="">Select {label.toLowerCase()}</option>
          {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Basic fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
            DOJ <span className="text-rose-500">*</span>
          </label>
          <input
            ref={dojRef}
            type="text"
            placeholder="Select Date"
            value={formData.doj || ''}
            readOnly
            className={`w-full bg-slate-50 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer ${
              errors.doj ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200'
            }`}
          />
          {errors.doj && <p className="text-red-500 text-xs mt-1">{errors.doj}</p>}
        </div>
        {renderInput('Joining Location', 'joinLoc', 'text', true)}
        {renderInput('Candidate Current CTC (LPA)', 'currentCtc', 'number', true, '0.00', 'font-bold text-slate-700')}
        {renderInput('Candidate Offer CTC (LPA)', 'offerCtc', 'number', true, '0.00', 'font-bold text-emerald-600')}
      </div>

      {/* External: Margin Calculator */}
      {isExternal && (
        <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4 mt-6">
          <h3 className="text-base font-bold text-amber-900 mb-4">Margin Calculator</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {renderSelect('Client Billing UOM', 'billingUom', BILLING_UOMS, true)}
            {renderInput('Client Raw Billing Rate', 'rawBillingRate', 'number', true, '0.00', 'font-bold')}
            {renderInput('Client Billing (Annualized LPA)', 'candBilling', 'text', false, '', 'bg-slate-100 text-center font-bold', true)}

            {/* Vendor Fees – conditional on source === 'Vendor' */}
            {showVendorFees && (
              <>
                {renderSelect('Vendor Fees Type', 'vendorFeeType', VENDOR_FEE_TYPES, true)}
                {formData.vendorFeeType === 'One time' && renderInput('Vendor Fees Value', 'vendorFeeValue', 'number', true, '0.00')}
                {formData.vendorFeeType === 'Monthly %' && renderInput('Vendor Fee %', 'vendorFeePerc', 'number', true, '0.00')}
              </>
            )}

            {/* Bonus Fields */}
            {renderSelect('Bonus Type', 'bonusType', BONUS_TYPES, false)}
            {formData.bonusType && (
              <>
                {renderInput('Bonus Maturity (Months)', 'bonusMaturity', 'text', true, 'e.g., 6')}
                {renderInput('Bonus Amount', 'bonusAmount', 'number', true, '0.00')}
              </>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-2 border-t border-amber-200">
            <div className="bg-white p-3 rounded-xl border border-amber-200 text-center">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Gross Profit (%)</label>
              <input type="text" value={grossProfit} readOnly className="w-full bg-transparent border-none text-center font-black text-xl text-slate-800 outline-none" />
            </div>
            <div className="bg-white p-3 rounded-xl border border-amber-200 text-center">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Net Profit (%)</label>
              <input type="text" value={netProfit} readOnly className="w-full bg-transparent border-none text-center font-black text-xl text-blue-600 outline-none" />
            </div>
          </div>
        </div>
      )}

      {/* Internal: CTC Jump and Last Approved Margin */}
      {isInternal && (
        <div className="bg-green-50 rounded-2xl border border-green-200 p-4 mt-6">
          <h3 className="text-base font-bold text-green-900 mb-4">Internal Movement Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {renderInput('CTC Jump (%)', 'ctcJump', 'text', false, '', 'bg-green-100 font-bold text-green-800 text-center', true)}
            {formData.isRevision && renderInput('Last Approved Margin (%)', 'lastApprovedMargin', 'text', false, '', 'bg-green-100 font-bold text-green-800 text-center', true)}
          </div>
        </div>
      )}
    </div>
  );
};

export default OfferTermsStep;