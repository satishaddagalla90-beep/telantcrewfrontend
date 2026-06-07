import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { showErrorToast } from '../../../utils/toast';
import PageLayout from '../../templates/PageLayout/PageLayout';
import Header from '../../molecules/Header';
import Button from '../../atoms/Button';
import Badge from '../../atoms/Badge';
import { OfferFormData } from './OfferRequisitionNew';

// Helper to determine status
const getStatus = (data: OfferFormData): string => {
  if (data.saveMode === 'draft') return 'Draft';
  return 'Submitted';
};

// Mock function to fetch a single requisition (replace with real API call)
const fetchRequisitionDetail = async (id: string): Promise<OfferFormData | null> => {
  await new Promise(resolve => setTimeout(resolve, 300));

  const mockData: Record<string, OfferFormData> = {
    '1': {
      existingReqId: '',
      isRevision: false,
      saveMode: 'submit',
      hireType: 'External',
      placementType: 'Organic',
      empType: 'Payroll',
      offerType: 'Offer',
      hireCat: 'New Hire',
      division: '',
      reportingManager: '',
      client: 'Client A',
      designation: 'Software Engineer',
      source: 'Job Portal',
      vendor: '',
      tcId: 'TC12345',
      mapId: '',
      candName: 'John Doe',
      aadharName: 'John Doe',
      email: 'john.doe@example.com',
      phone: '9876543210',
      skillSet: 'React, TypeScript, Node.js',
      uan: '',
      address: '123 Main St, Bangalore',
      aadharNum: '123456789012',
      panNum: 'ABCDE1234F',
      aadharLink: 'Yes',
      doj: '15-06-2025',
      joinLoc: 'Bangalore',
      currentCtc: '12.00',
      offerCtc: '18.00',
      billingUom: 'Monthly',
      rawBillingRate: '150000',
      candBilling: '1800000',
      vendorFeeType: '',
      vendorFeeValue: '',
      vendorFeePerc: '',
      grossProfit: '25.50',
      netProfit: '18.75',
      recruiter: 'Recruiter A',
      teamLead: 'Team Lead X',
      deliveryMgr: 'DM John',
      accountMgr: 'AM Sarah',
      clientManager: 'CM David',
      businessHead: 'BH Robert',
      vp: 'VP Smith',
      bonusType: '',
      bonusMaturity: '',
      bonusAmount: '',
      ctcJump: '',
      lastApprovedMargin: '',
    },
    '2': {
      existingReqId: '',
      isRevision: false,
      saveMode: 'submit',
      hireType: 'Internal',
      placementType: '',
      empType: 'Payroll',
      offerType: 'Offer',
      hireCat: 'Internal Movement',
      division: 'US-Staffing',
      reportingManager: 'John Manager',
      client: '',
      designation: 'Tech Lead',
      source: 'Employee Referral',
      vendor: '',
      tcId: 'TC67890',
      mapId: '',
      candName: 'Jane Smith',
      aadharName: 'Jane Smith',
      email: 'jane.smith@example.com',
      phone: '9876543211',
      skillSet: 'Java, Spring, AWS',
      uan: '',
      address: '456 Oak St, Bangalore',
      aadharNum: '123456789013',
      panNum: 'FGHIJ5678K',
      aadharLink: 'Yes',
      doj: '20-06-2025',
      joinLoc: 'Bangalore',
      currentCtc: '15.00',
      offerCtc: '22.00',
      billingUom: '',
      rawBillingRate: '',
      candBilling: '',
      vendorFeeType: '',
      vendorFeeValue: '',
      vendorFeePerc: '',
      grossProfit: '',
      netProfit: '',
      recruiter: 'Recruiter B',
      teamLead: 'Team Lead Y',
      deliveryMgr: 'DM Jane',
      accountMgr: 'AM Mike',
      clientManager: 'CM Lisa',
      businessHead: 'BH Alice',
      vp: 'VP John',
      bonusType: '',
      bonusMaturity: '',
      bonusAmount: '',
      ctcJump: '46.67',
      lastApprovedMargin: '',
    },
    '3': {
      existingReqId: '',
      isRevision: false,
      saveMode: 'draft',
      hireType: 'External',
      placementType: 'Routing',
      empType: 'IC',
      offerType: 'LOI',
      hireCat: 'New Hire',
      division: '',
      reportingManager: '',
      client: 'Client B',
      designation: 'Senior Developer',
      source: 'LinkedIn',
      vendor: '',
      tcId: 'TC11111',
      mapId: '',
      candName: 'Robert Johnson',
      aadharName: 'Robert Johnson',
      email: 'robert.j@example.com',
      phone: '9876543212',
      skillSet: 'Python, Django, PostgreSQL',
      uan: '',
      address: '789 Pine St, Bangalore',
      aadharNum: '123456789014',
      panNum: 'KLMNO9012P',
      aadharLink: 'Yes',
      doj: '01-07-2025',
      joinLoc: 'Chennai',
      currentCtc: '10.00',
      offerCtc: '15.00',
      billingUom: 'Monthly',
      rawBillingRate: '120000',
      candBilling: '1440000',
      vendorFeeType: '',
      vendorFeeValue: '',
      vendorFeePerc: '',
      grossProfit: '20.00',
      netProfit: '12.50',
      recruiter: 'Recruiter C',
      teamLead: 'Team Lead Z',
      deliveryMgr: 'DM Robert',
      accountMgr: 'AM Emma',
      clientManager: 'CM James',
      businessHead: 'BH David',
      vp: 'VP Linda',
      bonusType: '',
      bonusMaturity: '',
      bonusAmount: '',
      ctcJump: '',
      lastApprovedMargin: '',
    },
  };
  return mockData[id] || null;
};

const OfferRequisitionDetailView: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<OfferFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchRequisitionDetail(id)
        .then(fetched => {
          if (fetched) setData(fetched);
          else setError('Requisition not found');
        })
        .catch(() => setError('Failed to load requisition details'))
        .finally(() => setLoading(false));
    } else {
      setError('No ID provided');
      setLoading(false);
    }
  }, [id]);

  if (loading) {
    return (
      <PageLayout header={<Header title="Requisition Details" showBackButton onBack={() => navigate('/offer-requisitions')} />}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">Loading...</div>
        </div>
      </PageLayout>
    );
  }

  if (error || !data) {
    return (
      <PageLayout header={<Header title="Requisition Details" showBackButton onBack={() => navigate('/offer-requisitions')} />}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center text-red-600">{error || 'Data not available'}</div>
        </div>
      </PageLayout>
    );
  }

  const status = getStatus(data);

  const FieldRow = ({ label, value }: { label: string; value: any }) => (
    <div className="py-3 border-b border-gray-100">
      <div className="sm:flex sm:items-start sm:justify-between">
        <dt className="text-sm font-medium text-gray-500 sm:flex-shrink-0">{label}</dt>
        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:ml-4 break-words">{value || '-'}</dd>
      </div>
    </div>
  );

  return (
    <PageLayout
      header={
        <Header
          title={`Requisition #${id}`}
          showBackButton
          onBack={() => navigate('/offer-requisitions')}
        />
      }
    >
      <div className="max-w-5xl mx-auto py-6">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-200">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">Requisition Details</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Full information of the candidate and offer terms.
              </p>
            </div>
            <div className="flex space-x-3">
              <Badge variant={status === 'Draft' ? 'warning' : 'success'}>{status}</Badge>
              <Button
                variant="primary"
                onClick={() => navigate(`/offer-requisitions/${id}/edit`)}  // ✅ edit route
                icon="edit"
              >
                Edit
              </Button>
            </div>
          </div>

          <div className="px-4 py-5 sm:px-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-0 sm:grid-cols-2">
              <FieldRow label="Requisition ID" value={id} />
              <FieldRow label="Hire Type" value={data.hireType} />
              <FieldRow label="Candidate Name" value={data.candName} />
              <FieldRow label="Designation" value={data.designation} />
              <FieldRow label="Employment Type" value={data.empType} />
              <FieldRow label="Offer Type" value={data.offerType} />
              <FieldRow label="Hire Category" value={data.hireCat} />
              {data.hireType === 'External' && (
                <>
                  <FieldRow label="Placement Type" value={data.placementType} />
                  <FieldRow label="Client" value={data.client} />
                </>
              )}
              {data.hireType === 'Internal' && (
                <>
                  <FieldRow label="Division" value={data.division} />
                  <FieldRow label="Reporting Manager" value={data.reportingManager} />
                </>
              )}
              <FieldRow label="Source" value={data.source} />
              {data.source === 'Vendor' && <FieldRow label="Vendor" value={data.vendor} />}
              <FieldRow label="Applicant ID (TC)" value={data.tcId} />
              <FieldRow label="Mapping ID" value={data.mapId} />
              <FieldRow label="Name as per Aadhar" value={data.aadharName} />
              <FieldRow label="Email" value={data.email} />
              <FieldRow label="Phone" value={data.phone} />
              <FieldRow label="Skill Set" value={data.skillSet} />
              <FieldRow label="PF‑UAN Number" value={data.uan} />
              <FieldRow label="Full Address" value={data.address} />
              <FieldRow label="Aadhar Number" value={data.aadharNum} />
              <FieldRow label="PAN Number" value={data.panNum} />
              <FieldRow label="Aadhar/PAN Link" value={data.aadharLink} />
              <FieldRow label="Date of Joining" value={data.doj} />
              <FieldRow label="Location" value={data.joinLoc} />
              <FieldRow label="Current CTC (LPA)" value={data.currentCtc} />
              <FieldRow label="Offer CTC (LPA)" value={data.offerCtc} />

              {data.hireType === 'External' && (
                <>
                  <FieldRow label="Billing UOM" value={data.billingUom} />
                  <FieldRow label="Raw Billing Rate" value={data.rawBillingRate} />
                  <FieldRow label="Annualized (LPA)" value={data.candBilling} />
                  <FieldRow label="Vendor Fee Type" value={data.vendorFeeType || 'None'} />
                  {data.vendorFeeType === 'One time' && <FieldRow label="Vendor Fee Value" value={data.vendorFeeValue} />}
                  {data.vendorFeeType === 'Monthly %' && <FieldRow label="Vendor Fee %" value={data.vendorFeePerc} />}
                  <FieldRow label="Gross Profit (%)" value={data.grossProfit} />
                  <FieldRow label="Net Profit (%)" value={data.netProfit} />
                  <FieldRow label="Bonus Type" value={data.bonusType || 'None'} />
                  {data.bonusType && (
                    <>
                      <FieldRow label="Bonus Maturity (Months)" value={data.bonusMaturity} />
                      <FieldRow label="Bonus Amount" value={data.bonusAmount} />
                    </>
                  )}
                </>
              )}

              {data.hireType === 'Internal' && (
                <>
                  <FieldRow label="CTC Jump (%)" value={data.ctcJump} />
                  {data.isRevision && <FieldRow label="Last Approved Margin (%)" value={data.lastApprovedMargin} />}
                </>
              )}

              <FieldRow label="Recruiter" value={data.recruiter} />
              <FieldRow label="Team Lead" value={data.teamLead} />
              <FieldRow label="Delivery Manager" value={data.deliveryMgr} />
              <FieldRow label="Account Manager" value={data.accountMgr} />
              <FieldRow label="Client Manager" value={data.clientManager} />
              <FieldRow label="Business Head" value={data.businessHead} />
              <FieldRow label="VP" value={data.vp} />
            </dl>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default OfferRequisitionDetailView;