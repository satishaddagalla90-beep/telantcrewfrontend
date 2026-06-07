import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './components/auth/AuthContext';
import ProtectedLayout from './components/auth/ProtectedLayout';
import DashboardLayout from './components/layouts/DashboardLayout/DashboardLayout';
import Home from './components/pages/Home/Home';
import Users from './components/pages/Users/Users';
import Applicants from './components/pages/Applicants/Applicants';
import Clients from './components/pages/Clients/Clients';
import Vendors from './components/pages/Vendors/Vendors';
import AddCandidateForm from './components/pages/AddCandidate';
import CandidateSearch from './components/pages/CandidateSearch/CandidateSearch';
import './App.css';
import ApplicantDetail from './components/pages/ApplicantDetail/ApplicantDetail';
import Suppliers from './components/pages/Suppliers/Suppliers';
import UserDetailPage from './components/pages/UserDetail/UserDetail';
import AddClient from './components/pages/AddClient/AddClient';
import AddUser from './components/pages/AddUser/AddUser';
import AddSupplier from './components/pages/AddSupplier/AddSupplier';
import SupplierDetailPage from './components/pages/SupplierDetail/SupplierDetail';
import ClientDetailPage from './components/pages/ClientDetail/ClientDetail';
import AddJob from './components/pages/AddJob/AddJob';
import JobDetails from './components/pages/JobDetails/JobDetails';
import Login from './components/pages/Login';
import AuthCallback from './components/pages/AuthCallback';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useEffect, useState } from 'react';
import { 
  showSuccessToast, 
  showErrorToast, 
  showWarningToast, 
  showInfoToast 
} from './utils/toast';
import Jobs from './components/pages/Jobs';
import InstallPrompt from './components/InstallPrompt';
import OfflineStatus from './components/OfflineStatus';
import PwaUpdateSnackbar from './components/PwaUpdateSnackbar';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import { usePushNotifications } from './hooks/usePushNotifications';
import Requirements from './components/pages/Recruitment';
import RequirementDetail from './components/pages/RecruitmentDetail';
import AdminPanel from './components/pages/AdminPanel/AdminPanel';
import OfferRequisitionListView from './components/pages/OfferRequisition/OfferRequisitionListView';
import OfferRequisition from './components/pages/OfferRequisition/OfferRequisitionNew';
import OfferRequisitionDetailView from './components/pages/OfferRequisition/OfferRequisitionDetailView';
import OfferRequisitionApprovalView from './components/pages/OfferRequisition/OfferRequisitionApprovalView';

function App() {
  const [isUpdateReady, setIsUpdateReady] = useState(false);
  const [waitingRegistration, setWaitingRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const { permission, requestPermission, subscribe } = usePushNotifications();

  useEffect(() => {
    const handleToasterEvent = (event: any) => {
      const { type, message } = event.detail;
      switch (type) {
        case 'success':
          showSuccessToast(message);
          break;
        case 'error':
          showErrorToast(message);
          break;
        case 'warning':
          showWarningToast(message);
          break;
        case 'info':
          showInfoToast(message);
          break;
        default:
          showSuccessToast(message);
      }
    };

    window.addEventListener('toasterEvents', handleToasterEvent);
    return () => window.removeEventListener('toasterEvents', handleToasterEvent);
  }, []);

  useEffect(() => {
    serviceWorkerRegistration.register({
      onUpdate: (registration) => {
        setWaitingRegistration(registration);
        setIsUpdateReady(true);
      },
    });
  }, []);

  useEffect(() => {
    if (permission === 'default') {
      requestPermission();
    }
    if (permission === 'granted') {
      subscribe().catch((error) => {
        console.error('Push subscription error:', error);
      });
    }
  }, [permission, requestPermission, subscribe]);

  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <OfflineStatus />
          <InstallPrompt />
          <PwaUpdateSnackbar
            visible={isUpdateReady}
            onRefresh={() => {
              if (waitingRegistration?.waiting) {
                waitingRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
              }
            }}
          />
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/auth" element={<AuthCallback />} />
            <Route path="/notInSystem" element={<AuthCallback />} />

            {/* Protected Routes */}
            <Route element={<ProtectedLayout />}>
              <Route path="/" element={<DashboardLayout />}>
                <Route index element={<Home />} />
                {/* Users Routes */}
                <Route path="users" element={<Users />} />
                <Route path="users/:id" element={<UserDetailPage />} />
                <Route path="add-user" element={<AddUser />} />

                {/* Applicants Routes */}
                <Route path="applicants" element={<Applicants />} />
                <Route path="applicants/:id" element={<ApplicantDetail />} />
                <Route path="add-candidate" element={<AddCandidateForm />} />
                <Route path="candidate-search" element={<CandidateSearch />} />

                {/* Clients Routes */}
                <Route path="clients" element={<Clients />} />
                <Route path="clients/:id" element={<ClientDetailPage />} />
                <Route path="add-client" element={<AddClient />} />

                {/* Suppliers Routes */}
                <Route path="suppliers" element={<Suppliers />} />
                <Route path="suppliers/:id" element={<SupplierDetailPage />} />
                <Route path="add-supplier" element={<AddSupplier />} />

                {/* Jobs Routes */}
                <Route path="jobs" element={<Jobs />} />
                <Route path="jobs/new" element={<AddJob />} />
                <Route path="jobs/:id" element={<JobDetails />} />
                <Route path="jobs/:id/edit" element={<AddJob />} />
                <Route path="add-job" element={<AddJob />} />

                {/* Requirements Routes */}
                <Route path="requirements" element={<Requirements />} />
                <Route path="requirements/:id" element={<RequirementDetail />} />

                {/* Offer Requisition Routes */}
                <Route path="offer-requisitions" element={<OfferRequisitionListView />} />
                <Route path="offer-requisitions/new" element={<OfferRequisition />} />
                <Route path="offer-requisitions/:id" element={<OfferRequisitionDetailView />} />
                <Route path="offer-requisitions/:id/approval" element={<OfferRequisitionApprovalView />} />
                <Route path="offer-requisitions/:id/edit" element={<OfferRequisition />} />

                {/* Admin Panel */}
                <Route path="admin" element={<AdminPanel />} />

                {/* Legacy Routes for backwards compatibility */}
                <Route path="vendors" element={<Vendors />} />

                {/* Fallback */}
                <Route path="*" element={<div>Page Not Found</div>} />
              </Route>
            </Route>
          </Routes>

          {/* Toast Container */}
          <ToastContainer
            position="top-right"
            autoClose={4000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
            className="toast-container"
            toastClassName="toast-custom"
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
