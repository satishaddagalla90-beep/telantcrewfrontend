import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import NavBar from '../../organisms/NavBar';
import AuthApiService, { UserData } from '../../../services/authService';
import { useAuth } from '../../auth/AuthContext';
import { FileUploadService } from '../../../services/fileUploadService';

// Avatar object structure from API
interface AvatarObject {
  file_url: string;
  file_name: string;
  file_type: string;
  file_category: string;
  uploaded_at: string;
  status: string;
  code: number;
}

// Extended interface to handle potential API variations
interface FlexibleUserData {
  // Core user properties
  id?: string;
  _id?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  display_name?: string;
  username?: string;
  
  // Name variants
  name?: string;
  given_name?: string;
  family_name?: string;
  full_name?: string;
  
  // Role and designation variants
  role?: string | string[];
  designation?: string;
  position?: string;
  title?: string;
  
  // Contact and location
  phone?: string;
  phone_no?: string;
  department?: string | string[];
  location?: string;
  
  // Avatar can be string or object
  avatar?: string | AvatarObject;
  
  // Other fields
  reporting_to?: string | any[];
  last_login?: string;
  status?: 'active' | 'inactive' | string;
  collectionId?: string;
  created?: string;
  updated?: string;
  permission?: {
    candidate: string;
    client: string;
    job: string;
    supplier: string;
    users: string;
  };
  
  [key: string]: any; // Allow additional fields
}

const DashboardLayout: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [userData, setUserData] = useState<FlexibleUserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [presignedAvatarUrl, setPresignedAvatarUrl] = useState<string>('');

  // Helper function to format username from available fields
  const formatUsername = (user: FlexibleUserData): string => {
    // Try multiple possible name fields from different API structures
    const possibleNames = [
      user.display_name,
      user.full_name,
      user.name,
      user.username,
    ].filter(Boolean);

    if (possibleNames.length > 0) {
      const name = possibleNames[0]?.trim();
      if (name) {
        return name;
      }
    }

    // Try combining first and last name variants
    const firstNameVariants = [user.first_name, user.given_name].filter(
      Boolean
    );
    const lastNameVariants = [user.last_name, user.family_name].filter(Boolean);

    if (firstNameVariants.length > 0 || lastNameVariants.length > 0) {
      const parts = [
        firstNameVariants[0]?.trim(),
        lastNameVariants[0]?.trim(),
      ].filter(Boolean);

      if (parts.length > 0) {
        const fullName = parts.join(' ');

        return fullName;
      }
    }

    // Extract name from email if available
    if (user.email) {
      const emailName = user.email.split('@')[0];

      return emailName;
    }

    return 'User';
  };

  // Helper function to get designation
  const getDesignation = (user: FlexibleUserData): string => {
    const possibleDesignations = [
      user.designation,
      user.role,
      user.position,
      user.title,
    ].filter(Boolean);

    if (possibleDesignations.length > 0) {
      return possibleDesignations[0] as string;
    }

    return 'User';
  };

  // Helper function to get avatar URL
  const getAvatarUrl = (user: FlexibleUserData): string | undefined => {
    // Check if user has an avatar field
    if (user.avatar) {
      // Handle avatar as object (new API format)
      if (typeof user.avatar === 'object' && user.avatar.file_url) {
        return user.avatar.file_url;
      }
      
      // Handle avatar as string (legacy format)
      if (typeof user.avatar === 'string') {
        // If avatar is already a full URL, return it
        if (
          user.avatar.startsWith('http://') ||
          user.avatar.startsWith('https://')
        ) {
          return user.avatar;
        }

        // If avatar is a relative path, construct full URL
        const baseUrl = 'https://tc-py-fastapi-to33v.ondigitalocean.app';
        const avatarUrl = `${baseUrl}${user.avatar.startsWith('/') ? '' : '/'}${user.avatar}`;

        return avatarUrl;
      }
    }

    return undefined;
  };

  // Helper function to get avatar fallback text
  const getAvatarFallback = (user: FlexibleUserData): string => {
    const name = formatUsername(user);

    // Get initials from the name
    const words = name.split(' ').filter(Boolean);
    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    } else if (words.length === 1) {
      return words[0][0].toUpperCase();
    }

    return 'U'; // Default fallback
  };

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);

        const user = await AuthApiService.getCurrentUser();

        if (user) {
          console.log('DashboardLayout - Fetched user data:', user);
          
          const avatarUrl = getAvatarUrl(user);
          const fallbackText = getAvatarFallback(user);
          const username = formatUsername(user);
          const designation = getDesignation(user);
          
          console.log('DashboardLayout - Processed data:', {
            avatarUrl,
            fallbackText,
            username,
            designation,
            displayName: user.display_name,
            avatar: user.avatar
          });
        }
        setUserData(user);
      } catch (error) {
        console.error('DashboardLayout - Failed to fetch user data:', error);
        // If user fetch fails, they might need to re-authenticate
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Effect to fetch presigned URL for the user avatar
  useEffect(() => {
    const fetchAvatarUrl = async () => {
      const avatarUrl = userData ? getAvatarUrl(userData) : null;
      if (avatarUrl) {
        try {
          const url = await FileUploadService.getFileViewUrl(avatarUrl);
          setPresignedAvatarUrl(url);
        } catch (error) {
          console.error('Error fetching avatar view URL:', error);
          setPresignedAvatarUrl('');
        }
      } else {
        setPresignedAvatarUrl('');
      }
    };
    fetchAvatarUrl();
  }, [userData]);

  // Navigation items for NavBar
  const navigationItems = [
    { name: 'Home', path: '/' },
    { name: 'Jobs', path: '/jobs' },
    { name: 'Applicants', path: '/applicants' },
    { name: 'Clients', path: '/clients' },
    { name: 'Suppliers', path: '/suppliers' },
    { name: 'Users', path: '/users' },
    { name: 'Recruitment', path: '/requirements' },
    { name: 'Offer Requisition', path: '/offer-requisitions' },
  ];

  const handleNavigationClick = (event: React.MouseEvent, path: string) => {
    event.preventDefault();
    navigate(path);
  };

  // Handle logout with proper cleanup and debugging
  const handleLogout = () => {
    try {
      // Clear user data from component state
      setUserData(null);

      // Call the auth context logout (which clears tokens and redirects)
      logout();

      // Auth state after logout is handled in the AuthContext
    } catch (error) {
      console.error('DashboardLayout - Logout failed:', error);
      // Fallback: force redirect to login if logout fails
      AuthApiService.clearTokens();
      window.location.href = '/login';
    }
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Fixed NavBar at top */}
      <div className="flex-shrink-0 z-50">
        <NavBar
          logoSrc="/logo_black.png"
          logoAlt="TalentCrew Logo"
          navigationItems={navigationItems}
          onNavigationClick={handleNavigationClick}
          onLogout={handleLogout}
          userName={
            userData ? formatUsername(userData) : loading ? 'Loading...' : 'User'
          }
          designation={
            userData ? getDesignation(userData) : loading ? 'Loading...' : 'User'
          }
          userAvatar={presignedAvatarUrl || undefined}
          userDetails={
            userData
              ? {
                  id: userData.id || userData._id || '',
                  display_name:
                    userData.display_name || userData.full_name || userData.name,
                  username: userData.username || '',
                  email: userData.email || '',
                  phone_no: userData.phone_no || userData.phone || '',
                  status:
                    userData.status === 'active' || userData.status === 'inactive'
                      ? (userData.status as 'active' | 'inactive')
                      : 'active',
                  avatar: presignedAvatarUrl, // Use presigned URL for avatar
                  created: userData.created || '',
                  updated: userData.updated || '',
                  last_login: userData.last_login || '',
                  collectionId: userData.collectionId || 'users',
                  expand: {
                    designation: userData.designation
                      ? { name: userData.designation }
                      : undefined,
                    department: userData.department
                      ? Array.isArray(userData.department)
                        ? userData.department.map(d => ({ name: d }))
                        : { name: userData.department }
                      : undefined,
                    location: userData.location
                      ? { city: userData.location }
                      : undefined,
                    role: userData.role
                      ? Array.isArray(userData.role)
                        ? userData.role.map(r => ({ name: r }))
                        : { name: userData.role }
                      : undefined,
                    reporting_to: userData.reporting_to
                      ? { first_name: Array.isArray(userData.reporting_to) 
                          ? userData.reporting_to[0]?.detail || 'User not found'
                          : userData.reporting_to }
                      : undefined,
                  },
                }
              : undefined
          }
          avatarBaseUrl="https://tc-py-fastapi-to33v.ondigitalocean.app"
          variant="light"
        />
      </div>

      {/* Main Content Area - Fills remaining height, prevents page scroll */}
      <main className="flex-1 min-h-0 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
