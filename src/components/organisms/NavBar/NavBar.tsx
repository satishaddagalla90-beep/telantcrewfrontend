import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Logo from '../../atoms/Logo';
import NavLink from '../../atoms/NavLink';
import Icon from '../../atoms/Icon';
import Badge from '../../atoms/Badge';
import UserDropdown from '../../molecules/UserDropdown';
import Modal from '../../atoms/Modal';
import { UserDetails } from '../../molecules/UserProfile';
import CandidateSearchModal, { CandidateSearchFilters } from '../CandidateSearchModal';

export interface NavigationItem {
    name: string;
    path: string;
}

export interface NavBarProps {
    logoSrc?: string;
    logoAlt?: string;
    navigationItems?: NavigationItem[];
    userName?: string;
    designation?: string;
    userAvatar?: string;
    userDetails?: UserDetails;
    avatarBaseUrl?: string;
    onLogout?: () => void;
    onNavigationClick?: (event: React.MouseEvent, path: string) => void;
    showNotificationBadge?: boolean;
    variant?: 'primary' | 'light';
    className?: string;
}

const defaultNavigationItems: NavigationItem[] = [
    { name: "Home", path: "/blank" },
    { name: "Users", path: "/user" },
    { name: "Applicants", path: "/applicants" },
    { name: "Clients", path: "/client" },
    { name: "Job Requisition", path: "/job-requisitions" },
];

const NavBar: React.FC<NavBarProps> = ({
    logoSrc,
    logoAlt = 'Company Logo',
    navigationItems = defaultNavigationItems,
    userName,
    designation,
    userAvatar,
    userDetails,
    avatarBaseUrl = '',
    onLogout,
    onNavigationClick,
    showNotificationBadge = true,
    variant = 'primary',
    className = '',
}) => {
    const [showModal, setShowModal] = useState(false);
    const [inactiveModal, setInactiveModal] = useState(false);
    const [countdown, setCountdown] = useState(5);
    const [showCandidateSearchModal, setShowCandidateSearchModal] = useState(false);

    const location = useLocation();
    const navigate = useNavigate();

    // Auto-logout logic for inactive users
    useEffect(() => {
        if (userDetails && userDetails.status && userDetails.status.toLowerCase() === "inactive") {
            if (!inactiveModal) {
                setInactiveModal(true);
                setCountdown(5);
            }
        }
    }, [userDetails, inactiveModal]);

    // Countdown effect for inactive modal
    useEffect(() => {
        if (!inactiveModal) return;
        if (countdown === 0) {
            if (onLogout) onLogout();
            return;
        }
        const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [inactiveModal, countdown, onLogout]);

    const handleNavItemClicked = (event: React.MouseEvent, path: string) => {
        if (location.pathname === "/create-record") {
            event.preventDefault();
            setShowModal(true);
        }
        if (onNavigationClick) {
            onNavigationClick(event, path);
        }
    };

    const handleUserProfileSetup = () => {
        if (userDetails?.id) {
            navigate(`/detailview/${userDetails.id}`);
        }
    };

    const handleUserGuide = () => {
        window.open("https://tekishub.ams3.digitaloceanspaces.com/TalentCrew_%20Applicant%20Module%20User%20Guide.pdf", "_blank", "noopener,noreferrer");
    };

    const handleCandidateSearch = (filters: CandidateSearchFilters) => {
        const params = new URLSearchParams();

        if (filters.booleanQuery) {
            params.append('query', filters.booleanQuery);
            params.append('boolean', filters.booleanSearchEnabled ? 'true' : 'false');
            params.append('scope', filters.searchScope || 'all');
        }
        if (filters.clientId) params.append('client', filters.clientId);
        if (filters.minExperience) params.append('exp_min', filters.minExperience.toString());
        if (filters.maxExperience) params.append('exp_max', filters.maxExperience.toString());
        if (filters.minSalary) params.append('sal_min', filters.minSalary.toString());
        if (filters.maxSalary) params.append('sal_max', filters.maxSalary.toString());
        if (filters.currentLocation) params.append('current_loc', filters.currentLocation);
        if (filters.preferredLocations?.length) {
            params.append('pref_locs', filters.preferredLocations.join(','));
        }
        if (filters.education?.length) params.append('edu', filters.education.join(','));
        if (filters.noticePeriod?.length) params.append('notice', filters.noticePeriod.join(','));
        if (filters.preferredJob) params.append('job', filters.preferredJob);
        if (filters.jobType?.length) {
            params.append('job_type', filters.jobType.join(','));
        }
        if (filters.jobOpenType) params.append('job_open_type', filters.jobOpenType);
        if (filters.gender) params.append('gender', filters.gender);
        if (filters.personWithDisability) params.append('pwd', 'true');
        if (filters.modifiedIn) params.append('modified', filters.modifiedIn);
        if (filters.createdIn) params.append('created', filters.createdIn);

        setShowCandidateSearchModal(false);
        navigate(`/candidate-search?${params.toString()}`);
    };

    const rightSideIcons = [
        // { name: 'video' as const, hasNotification: false },
        { name: 'bell' as const, hasNotification: showNotificationBadge },
        { name: 'history' as const, hasNotification: false },
        { name: 'plus' as const, hasNotification: false },
        { name: 'search' as const, hasNotification: false },
        // { name: 'grid' as const, hasNotification: false },
    ];

    // Conditional styling based on variant
    const navClasses = variant === 'light'
        ? 'bg-white border-b border-gray-200'
        : 'bg-primary-600 border-b border-primary-700';

    const iconClasses = variant === 'light'
        ? 'text-gray-600 hover:text-gray-800'
        : 'text-white/90 hover:text-white';

    const navLinkVariant = variant === 'light' ? 'navbar-light' : 'navbar';

    return (
        <>
            <nav className={`${navClasses} px-4 py-2  sticky top-0 z-30 ${className}`}>
                <div className="flex items-center justify-between">
                    {/* Left Section */}
                    <div className="flex items-center gap-x-8">
                        {/* Logo */}
                        <a className="flex-shrink-0 flex items-center h-full cursor-pointer" 
                            href="/"
                        >
                            <Logo src={logoSrc} alt={logoAlt} size="md" />
                        </a>

                        {/* Navigation Links */}
                        <div className="hidden md:flex items-center gap-1">
                            {navigationItems.map((item) => (
                                <NavLink
                                    key={item.name}
                                    to={item.path}
                                    variant={navLinkVariant}
                                    onClick={(event) => handleNavItemClicked(event, item.path)}
                                    className="px-4 py-2"
                                >
                                    {item.name}
                                </NavLink>
                            ))}
                        </div>
                    </div>

                    {/* Right Section */}
                    <div className="flex items-center gap-4">
                        {/* Icon Group */}
                        <div className="hidden md:flex items-center gap-3">
                            {rightSideIcons.map((iconItem, index) => (
                                <div key={index} className="relative">
                                    <Icon
                                        name={iconItem.name}
                                        size={20}
                                        className={`${iconClasses} cursor-pointer transition-colors`}
                                        onClick={iconItem.name === 'search' ? () => setShowCandidateSearchModal(true) : undefined}
                                    />
                                    {iconItem.hasNotification && (
                                        <Badge
                                            variant="danger"
                                            size="sm"
                                            className="absolute -top-1 -right-1"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* User Dropdown */}
                        <UserDropdown
                            userName={userName}
                            designation={designation}
                            userAvatar={userAvatar}
                            userDetails={userDetails}
                            avatarBaseUrl={avatarBaseUrl}
                            variant={variant}
                            onLogout={onLogout}
                            onUserProfileSetup={handleUserProfileSetup}
                            onUserGuide={handleUserGuide}
                        />
                    </div>
                </div>
            </nav>

            {/* Applicant Search Modal - Only render when opened to avoid unnecessary API calls */}
            {showCandidateSearchModal && (
                <CandidateSearchModal
                    isOpen={showCandidateSearchModal}
                    onClose={() => setShowCandidateSearchModal(false)}
                    onSearch={handleCandidateSearch}
                />
            )}

            {/* Navigation Warning Modal */}
            {showModal && (
                <Modal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    title="Navigation Warning"
                    size="md"
                    headerVariant="warning"
                >
                    <div className="p-6">
                        <p className="mb-4">
                            To proceed to another page, please click the Cancel button first.
                        </p>
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Inactive User Auto-logout Modal */}
            {inactiveModal && (
                <Modal
                    isOpen={inactiveModal}
                    onClose={() => {
                        // Intentionally empty - modal should not be closeable by user
                    }}
                    title="Account Deactivated"
                    size="md"
                    headerVariant="danger"
                    closeOnBackdropClick={false}
                    showCloseButton={false}
                >
                    <div className="p-6 text-center">
                        <p className="mb-4">
                            Your account has been deactivated by the admin.
                            <br />
                            You will be logged out in <strong>{countdown}</strong> seconds.
                        </p>
                        <div className="flex justify-center">
                            <button
                                onClick={onLogout}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                            >
                                Logout Now
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </>
    );
};

export default NavBar;
