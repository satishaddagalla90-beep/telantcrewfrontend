import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import FormWizardLayout from '../../templates/FormWizardLayout/FormWizardLayout';
import { FormWizardStep } from '../../templates/FormWizardLayout/FormWizardLayout';
import JobSourceStep from './JobSourceStep';
import CandidateKYSStep from './CandidateKYSStep';
import OfferTermsStep from './OfferTermsStep';
import HierarchyStep from './HierarchyStep';
import { showSuccessToast, showErrorToast } from '../../../utils/toast';

// ---------- Types ----------
export interface OfferFormData {
  existingReqId: string;
  isRevision: boolean;
  saveMode: 'draft' | 'submit';
  hireType: string;
  placementType: string;
  empType: string;
  offerType: string;
  hireCat: string;
  division: string;
  reportingManager: string;
  client: string;
  designation: string;
  source: string;
  vendor: string;
  tcId: string;
  mapId: string;
  candName: string;
  aadharName: string;
  email: string;
  phone: string;
  skillSet: string;
  uan: string;
  address: string;
  aadharNum: string;
  panNum: string;
  aadharLink: string;
  doj: string;
  joinLoc: string;
  currentCtc: string;
  offerCtc: string;
  billingUom: string;
  rawBillingRate: string;
  candBilling: string;
  vendorFeeType: string;
  vendorFeeValue: string;
  vendorFeePerc: string;
  grossProfit: string;
  netProfit: string;
  recruiter: string;
  teamLead: string;
  deliveryMgr: string;
  accountMgr: string;
  clientManager: string;
  businessHead: string;
  vp: string;
  // New fields
  bonusType: string;
  bonusMaturity: string;
  bonusAmount: string;
  ctcJump: string;
  lastApprovedMargin: string;
}

export interface FilesState {
  aadhar: File | null;
  pan: File | null;
  resume: File | null;
}

const getInitialFormData = (): OfferFormData => ({
  existingReqId: '',
  isRevision: false,
  saveMode: 'submit',
  hireType: 'External',
  placementType: '',
  empType: '',
  offerType: '',
  hireCat: '',
  division: '',
  reportingManager: '',
  client: '',
  designation: '',
  source: '',
  vendor: '',
  tcId: '',
  mapId: '',
  candName: '',
  aadharName: '',
  email: '',
  phone: '',
  skillSet: '',
  uan: '',
  address: '',
  aadharNum: '',
  panNum: '',
  aadharLink: 'Yes',
  doj: '',
  joinLoc: '',
  currentCtc: '',
  offerCtc: '',
  billingUom: '',
  rawBillingRate: '',
  candBilling: '',
  vendorFeeType: '',
  vendorFeeValue: '',
  vendorFeePerc: '',
  grossProfit: '',
  netProfit: '',
  recruiter: '',
  teamLead: '',
  deliveryMgr: '',
  accountMgr: '',
  clientManager: '',
  businessHead: '',
  vp: '',
  // New fields
  bonusType: '',
  bonusMaturity: '',
  bonusAmount: '',
  ctcJump: '',
  lastApprovedMargin: '',
});

const OfferRequisition: React.FC = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState<FilesState>({ aadhar: null, pan: null, resume: null });
  const [fileNames, setFileNames] = useState({
    aadhar: 'No file chosen',
    pan: 'No file chosen',
    resume: 'No file chosen',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation functions
  const validateJobSource = (data: OfferFormData): Record<string, string> => {
    const errors: Record<string, string> = {};
    const isExternal = data.hireType === 'External';
    const isInternal = data.hireType === 'Internal';

    if (!data.hireType) errors.hireType = 'Hire Type is required';
    if (isExternal) {
      if (!data.placementType) errors.placementType = 'Placement Type is required';
      if (!data.client) errors.client = 'Client is required';
    }
    if (!data.empType) errors.empType = 'Employment Type is required';
    if (!data.offerType) errors.offerType = 'Offer Type is required';
    if (!data.hireCat) errors.hireCat = 'Hire Category is required';
    if (isInternal) {
      if (!data.division) errors.division = 'Division is required';
      if (!data.reportingManager) errors.reportingManager = 'Reporting Manager is required';
    }
    if (!data.designation) errors.designation = 'Designation is required';
    if (!data.source) errors.source = 'Source is required';
    if (data.source === 'Vendor' && isExternal && !data.vendor) errors.vendor = 'Vendor is required';
    return errors;
  };

  const validateCandidateKYC = (data: OfferFormData): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!data.tcId) errors.tcId = 'Applicant ID is required';
    if (!data.candName) errors.candName = 'Candidate Name is required';
    if (!data.aadharName) errors.aadharName = 'Name as per Aadhar is required';
    if (!data.email) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(data.email)) errors.email = 'Invalid email format';
    if (!data.phone) errors.phone = 'Phone is required';
    else if (!/^\d{10}$/.test(data.phone.replace(/\D/g, ''))) errors.phone = 'Phone must be 10 digits';
    if (!data.skillSet) errors.skillSet = 'Skill Set is required';
    if (!data.address) errors.address = 'Address is required';
    if (!data.aadharNum) errors.aadharNum = 'Aadhar Number is required';
    if (!data.panNum) errors.panNum = 'PAN Number is required';
    if (!files.aadhar) errors.aadharFile = 'Aadhar file is required';
    if (!files.pan) errors.panFile = 'PAN file is required';
    if (!files.resume) errors.resumeFile = 'Resume is required';
    return errors;
  };

  const validateOfferTerms = (data: OfferFormData): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!data.doj) errors.doj = 'Date of Joining is required';
    if (!data.joinLoc) errors.joinLoc = 'Location is required';
    if (!data.currentCtc) errors.currentCtc = 'Current CTC is required';
    if (!data.offerCtc) errors.offerCtc = 'Offer CTC is required';

    if (data.hireType === 'External') {
      if (!data.billingUom) errors.billingUom = 'Billing UOM is required';
      if (!data.rawBillingRate) errors.rawBillingRate = 'Raw Billing Rate is required';
    }
    // Vendor fees validation – only if source = Vendor
    if (data.source === 'Vendor' && data.hireType === 'External') {
      if (!data.vendorFeeType) errors.vendorFeeType = 'Vendor Fees Type is required';
      else if (data.vendorFeeType === 'One time' && !data.vendorFeeValue) errors.vendorFeeValue = 'Vendor Fee Value is required';
      else if (data.vendorFeeType === 'Monthly %' && !data.vendorFeePerc) errors.vendorFeePerc = 'Vendor Fee % is required';
    }
    // Bonus fields validation – optional, but if one is filled, all mandatory
    if (data.bonusType && (!data.bonusMaturity || !data.bonusAmount)) {
      if (!data.bonusMaturity) errors.bonusMaturity = 'Bonus Maturity is required when Bonus Type is selected';
      if (!data.bonusAmount) errors.bonusAmount = 'Bonus Amount is required when Bonus Type is selected';
    }
    return errors;
  };

  const validateHierarchy = (data: OfferFormData): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!data.businessHead) errors.businessHead = 'Business Head is required';
    if (!data.vp) errors.vp = 'VP is required';
    return errors;
  };

  // Step definitions
  const steps: FormWizardStep[] = [
    {
      id: 'job-source',
      label: 'Job & Source',
      description: 'Job details and source information',
      component: (props: any) => <JobSourceStep {...props} />,
      validation: validateJobSource,
    },
    {
      id: 'candidate-kyc',
      label: 'Candidate KYC',
      description: 'Candidate personal & document details',
      component: (props: any) => (
        <CandidateKYSStep
          {...props}
          files={files}
          fileNames={fileNames}
          onFileChange={(type, file) => {
            setFiles((prev) => ({ ...prev, [type]: file }));
            setFileNames((prev) => ({ ...prev, [type]: file?.name || 'No file chosen' }));
          }}
        />
      ),
      validation: validateCandidateKYC,
    },
    {
      id: 'offer-terms',
      label: 'Offer Terms',
      description: 'Compensation and margin calculator',
      component: (props: any) => <OfferTermsStep {...props} />,
      validation: validateOfferTerms,
    },
    {
      id: 'hierarchy',
      label: 'Hierarchy',
      description: 'Reporting structure',
      component: (props: any) => <HierarchyStep {...props} />,
      validation: validateHierarchy,
    },
  ];

  const handleComplete = async (finalData: OfferFormData) => {
    setIsSubmitting(true);
    try {
      const payload = { ...finalData, saveMode: 'submit' };
      console.log('Submitting:', payload, files);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      showSuccessToast('Requisition submitted successfully');
      localStorage.removeItem('offer_draft');
      navigate('/offer-requisitions');
    } catch (error) {
      showErrorToast('Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async (currentData: OfferFormData): Promise<void> => {
    localStorage.setItem('offer_draft', JSON.stringify(currentData));
    showSuccessToast('Draft saved locally');
  };

  const handleCancel = () => navigate('/offer-requisitions');

  const initialData = useMemo(() => {
    const draft = localStorage.getItem('offer_draft');
    if (draft) {
      try {
        if (window.confirm('A draft was found. Restore it?')) return JSON.parse(draft);
        else localStorage.removeItem('offer_draft');
      } catch (e) {
        localStorage.removeItem('offer_draft');
      }
    }
    return getInitialFormData();
  }, []);

  return (
    <div className="h-full bg-gray-50 overflow-y-auto">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Offer Requisition Form</h1>
          <p className="mt-2 text-lg text-gray-600">
            Submit candidate details and auto-calculate billing margins
          </p>
        </div>
        <FormWizardLayout
          title=""
          subtitle=""
          showCustomHeader={false}
          steps={steps}
          initialData={initialData}
          onComplete={handleComplete}
          onCancel={handleCancel}
          onSaveAsDraft={handleSaveDraft}
          showSaveAsDraft={true}
          allowStepNavigation={true}
          onDiscardDraft={() => localStorage.removeItem('offer_draft')}
        />
      </div>
    </div>
  );
};

export default OfferRequisition;