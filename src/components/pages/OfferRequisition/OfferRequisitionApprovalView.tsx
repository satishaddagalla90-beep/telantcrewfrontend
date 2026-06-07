// src/components/pages/OfferRequisition/OfferRequisitionApprovalView.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { showSuccessToast, showErrorToast } from '../../../utils/toast';
import PageLayout from '../../templates/PageLayout/PageLayout';
import Header from '../../molecules/Header';
import Button from '../../atoms/Button';
import Badge from '../../atoms/Badge';
import Input from '../../atoms/Input';
import { OfferFormData } from './OfferRequisitionNew';

// Helper: fetch requisition (same as detail view)
const fetchRequisition = async (id: string): Promise<OfferFormData | null> => {
  await new Promise(r => setTimeout(r, 300));
  // Reuse the same mock data as in detail view – replace with API call
  const mockData: Record<string, OfferFormData> = {
    '1': {
      existingReqId: '', isRevision: false, saveMode: 'submit', hireType: 'External',
      placementType: 'Organic', empType: 'Payroll', offerType: 'Offer', hireCat: 'New Hire',
      division: '', reportingManager: '', client: 'Client A', designation: 'Software Engineer',
      source: 'Job Portal', vendor: '', tcId: 'TC12345', mapId: '', candName: 'John Doe',
      aadharName: 'John Doe', email: 'john@example.com', phone: '9876543210',
      skillSet: 'React, TS', uan: '', address: 'Bangalore', aadharNum: '123456789012',
      panNum: 'ABCDE1234F', aadharLink: 'Yes', doj: '2025-06-15', joinLoc: 'Bangalore',
      currentCtc: '12.00', offerCtc: '18.00', billingUom: 'Monthly', rawBillingRate: '150000',
      candBilling: '1800000', vendorFeeType: '', vendorFeeValue: '', vendorFeePerc: '',
      grossProfit: '25.50', netProfit: '18.75', recruiter: 'Recruiter A', teamLead: 'Team Lead X',
      deliveryMgr: 'DM John', accountMgr: 'AM Sarah', clientManager: 'CM David',
      businessHead: 'BH Robert', vp: 'VP Smith', bonusType: '', bonusMaturity: '', bonusAmount: '',
      ctcJump: '', lastApprovedMargin: ''
    },
    // Add other IDs as needed
  };
  return mockData[id] || null;
};

// Helper to calculate margins (simplified)
const calculateMargins = (data: OfferFormData) => {
  const rawRate = parseFloat(data.rawBillingRate) || 0;
  const offerCtc = parseFloat(data.offerCtc) || 0;
  let annualBilling = 0;
  switch (data.billingUom) {
    case 'Hourly': annualBilling = rawRate * 2080; break;
    case 'Daily': annualBilling = rawRate * 260; break;
    case 'Monthly': annualBilling = rawRate * 12; break;
    case 'Yearly': annualBilling = rawRate; break;
    default: annualBilling = 0;
  }
  let gross = 0, net = 0;
  if (annualBilling > 0) {
    gross = ((annualBilling - offerCtc) / annualBilling) * 100;
    net = ((annualBilling - offerCtc) / annualBilling) * 100;
  }
  return { gross, net };
};

type Action = 'Approve' | 'Reject' | 'Edit' | 'Save' | 'Revoke' | 'Cancel';

const OfferRequisitionApprovalView: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<OfferFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [editable, setEditable] = useState(false);
  const [editedData, setEditedData] = useState<Partial<OfferFormData>>({});

  useEffect(() => {
    if (id) {
      fetchRequisition(id).then(fetched => {
        if (fetched) setData(fetched);
        else showErrorToast('Requisition not found');
        setLoading(false);
      });
    }
  }, [id]);

  const handleAction = async (action: Action) => {
    // Replace with real API calls
    switch (action) {
      case 'Approve': showSuccessToast('Requisition approved'); break;
      case 'Reject': showSuccessToast('Requisition rejected'); break;
      case 'Edit': setEditable(true); setEditedData({ ...data }); break;
      case 'Save':
        if (data) setData({ ...data, ...editedData });
        setEditable(false);
        showSuccessToast('Changes saved');
        break;
      case 'Revoke': showSuccessToast('Requisition revoked'); break;
      case 'Cancel': showSuccessToast('Requisition cancelled'); break;
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!data) return <div className="p-8 text-center text-red-500">Requisition not found</div>;

  const { net } = calculateMargins(data);
  const currentData = editable ? { ...data, ...editedData } : data;
  const pendingWithEmail = 'pending@example.com';
  const requestorName = data.recruiter;
  const currentStatus = data.saveMode === 'draft' ? 'Draft' : 'Pending BH';

  // Tab 1: Offer Details (read-only fields, editable fields, approval hierarchy)
  const renderOfferDetails = () => (
    <div className="space-y-6">
      {/* Read-only fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div><label className="text-xs font-bold uppercase">Applicant ID</label><div>{data.tcId}</div></div>
        <div><label className="text-xs font-bold uppercase">Candidate Name</label><div>{data.candName}</div></div>
        <div><label className="text-xs font-bold uppercase">Client</label><div>{data.client || '-'}</div></div>
        <div><label className="text-xs font-bold uppercase">Designation</label><div>{data.designation}</div></div>
        <div><label className="text-xs font-bold uppercase">Current CTC (LPA)</label><div>{data.currentCtc}</div></div>
        <div><label className="text-xs font-bold uppercase">Client Raw Billing Rate</label><div>{data.rawBillingRate || '-'}</div></div>
        <div><label className="text-xs font-bold uppercase">Gross Margin (%)</label><div>{calculateMargins(data).gross.toFixed(2)}%</div></div>
        <div><label className="text-xs font-bold uppercase">Net Margin (%)</label><div>{net.toFixed(2)}%</div></div>
      </div>

      {/* Editable fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 border-t pt-4">
        <div>
          <label className="text-xs font-bold uppercase">Candidate Offer CTC (LPA)</label>
          <Input
            value={editable ? editedData.offerCtc ?? data.offerCtc : data.offerCtc}
            onChange={e => setEditedData({ ...editedData, offerCtc: e.target.value })}
            disabled={!editable}
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase">DOJ</label>
          <Input
            type="date"
            value={editable ? editedData.doj ?? data.doj : data.doj}
            onChange={e => setEditedData({ ...editedData, doj: e.target.value })}
            disabled={!editable}
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase">Joining Location</label>
          <Input
            value={editable ? editedData.joinLoc ?? data.joinLoc : data.joinLoc}
            onChange={e => setEditedData({ ...editedData, joinLoc: e.target.value })}
            disabled={!editable}
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase">Bonus Details</label>
          <Input
            placeholder="Type / Amount / Maturity"
            value={editable ? editedData.bonusType ?? data.bonusType : data.bonusType}
            onChange={e => setEditedData({ ...editedData, bonusType: e.target.value })}
            disabled={!editable}
          />
        </div>
      </div>

      {/* Approval Hierarchy (Editable) */}
      <div className="border-t pt-4">
        <h4 className="font-semibold mb-2">Approval Hierarchy</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div><label>Recruiter</label><Input value={currentData.recruiter} disabled={!editable} onChange={e => setEditedData({ ...editedData, recruiter: e.target.value })} /></div>
          <div><label>Team Lead</label><Input value={currentData.teamLead} disabled={!editable} onChange={e => setEditedData({ ...editedData, teamLead: e.target.value })} /></div>
          <div><label>Delivery Manager</label><Input value={currentData.deliveryMgr} disabled={!editable} onChange={e => setEditedData({ ...editedData, deliveryMgr: e.target.value })} /></div>
          <div><label>Account Manager</label><Input value={currentData.accountMgr} disabled={!editable} onChange={e => setEditedData({ ...editedData, accountMgr: e.target.value })} /></div>
          <div><label>Client Manager</label><Input value={currentData.clientManager} disabled={!editable} onChange={e => setEditedData({ ...editedData, clientManager: e.target.value })} /></div>
          <div><label>Business Head</label><Input value={currentData.businessHead} disabled={!editable} onChange={e => setEditedData({ ...editedData, businessHead: e.target.value })} /></div>
          <div><label>Vice President</label><Input value={currentData.vp} disabled={!editable} onChange={e => setEditedData({ ...editedData, vp: e.target.value })} /></div>
          <div><label>Reporting Manager</label><Input value={currentData.reportingManager} disabled={!editable} onChange={e => setEditedData({ ...editedData, reportingManager: e.target.value })} /></div>
        </div>
      </div>
    </div>
  );

  // Tab 2: Audit & Approvals (simple HTML table)
  const auditData = [
    { actionBy: 'Recruiter A', actionTaken: 'Submitted', timestamp: '2025-05-01 10:00', comments: 'Initial submission' },
    { actionBy: 'Team Lead X', actionTaken: 'Approved', timestamp: '2025-05-02 14:30', comments: 'Skills match' },
  ];

  // Tab 3: Documents
  const renderDocuments = () => (
    <div className="space-y-4">
      <div><strong>Generated Offer Letter</strong> <Button variant="outline" size="sm">Download</Button></div>
      <div><strong>Uploaded KYC (Aadhar/PAN)</strong> <Button variant="outline" size="sm">View</Button></div>
      <div><strong>Candidate Resume</strong> <Button variant="outline" size="sm">Download</Button></div>
      <div><strong>Client Approval Proof</strong> <Button variant="outline" size="sm">Upload</Button></div>
    </div>
  );

  const tabs = [
    { label: 'Offer Details', content: renderOfferDetails() },
    { 
      label: 'Audit & Approvals', 
      content: (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action Taken</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Comments</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {auditData.map((item, idx) => (
                <tr key={idx}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.actionBy}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.actionTaken}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.timestamp}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.comments}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    },
    { label: 'Documents', content: renderDocuments() },
  ];

  return (
    <PageLayout
      header={
        <div className="bg-white border-b sticky top-0 z-10 p-4 shadow-sm">
          {/* Top row: Title + action buttons */}
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <div className="text-xl font-bold">Requisition #{id} - {data.candName}</div>
              <div className="text-sm text-gray-500">{data.designation} & {data.client || data.division}</div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={() => handleAction('Approve')} variant="success">Approve</Button>
              <Button onClick={() => handleAction('Reject')} variant="danger">Reject</Button>
              <Button onClick={() => handleAction('Edit')} variant="secondary">Edit</Button>
              <Button onClick={() => handleAction('Save')} variant="primary">Save</Button>
              <Button onClick={() => handleAction('Revoke')} variant="warning">Revoke</Button>
              <Button onClick={() => handleAction('Cancel')} variant="outline">Cancel</Button>
            </div>
          </div>
          {/* Second row: metrics and pending info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 text-sm">
            <div><span className="font-medium">Net Margin %:</span> {net.toFixed(2)}%</div>
            <div><span className="font-medium">DOJ:</span> 
              <Input value={currentData.doj} disabled={!editable} onChange={e => setEditedData({ ...editedData, doj: e.target.value })} className="inline-block w-auto ml-1" />
            </div>
            <div><span className="font-medium">Requestor Name:</span> {requestorName}</div>
            <div><span className="font-medium">Pending With Email:</span> {pendingWithEmail}</div>
          </div>
          <Badge variant="warning" className="mt-2 inline-block">Current Status: {currentStatus}</Badge>
        </div>
      }
    >
      <div className="max-w-7xl mx-auto p-4">
        {/* Simple tab navigation */}
        <div className="border-b border-gray-200 mb-4">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab, idx) => (
              <button
                key={idx}
                onClick={() => setActiveTab(idx)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === idx
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="mt-4">{tabs[activeTab].content}</div>
      </div>
    </PageLayout>
  );
};

export default OfferRequisitionApprovalView;