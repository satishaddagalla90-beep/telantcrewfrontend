# Modular Detail Page System

This document explains how to use the redesigned modular detail page system that can be used across different entity types (Applicants, Candidates, Clients, Vendors, etc.).

## Components Overview

### 1. DetailTemplate (Template)

The main template component that provides the layout structure.

**Location:** `src/components/templates/DetailTemplate/DetailTemplate.tsx`

**Features:**

- Responsive layout with main content and optional sidebar
- Built-in loading and error states
- Support for breadcrumbs, header, summary, tabs, and custom content
- Backward compatibility with existing implementations

### 2. DetailHeader (Organism)

Redesigned header component for displaying entity information and actions.

**Location:** `src/components/organisms/DetailHeader/DetailHeader.tsx`

**Features:**

- Profile photo with status indicators
- Contact information (location, phone, email, etc.)
- Personal information (DOB, PAN, UAN)
- Social links (LinkedIn)
- Action buttons (Edit, View Resume, etc.)
- Audit trail information
- Favorite toggle
- Navigation controls (Previous/Next)

### 3. ProfileSummary (Molecule)

Enhanced summary component supporting both grid-based metrics and traditional content.

**Location:** `src/components/molecules/ProfileSummary/ProfileSummary.tsx`

**Features:**

- Grid-based summary items with icons and formatting
- Support for different data types (text, currency, percentage, date)
- Highlighted items for important metrics
- Configurable column layout
- Edit functionality
- Backward compatibility with existing content-based usage

## Basic Usage

### Simple Detail Page

```tsx
import React from 'react';
import DetailTemplate from '../templates/DetailTemplate';
import DetailHeader from '../organisms/DetailHeader';

const MyDetailPage: React.FC = () => {
  return (
    <DetailTemplate
      header={
        <DetailHeader
          name="John Doe"
          code="EMP001"
          designation="Senior Developer"
          contactInfo={{
            location: 'New York, NY',
            phone: '+1-555-0123',
            email: 'john@example.com',
          }}
          onEdit={() => console.log('Edit')}
          onFavorite={() => console.log('Favorite')}
        />
      }
      mainContent={<div>Your main content here</div>}
    />
  );
};
```

### Advanced Detail Page with Tabs and Sidebar

```tsx
import React, { useState } from 'react';
import DetailTemplate from '../templates/DetailTemplate';
import DetailHeader from '../organisms/DetailHeader';
import ProfileSummary from '../molecules/ProfileSummary';

const AdvancedDetailPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const summaryItems = [
    {
      label: 'Experience',
      value: '5 years',
      icon: 'briefcase',
      highlight: true,
    },
    {
      label: 'Salary',
      value: 75000,
      icon: 'chart',
      type: 'currency',
    },
  ];

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      content: <div>Overview content</div>,
    },
    {
      id: 'details',
      label: 'Details',
      content: <div>Detailed information</div>,
      badge: 5,
    },
  ];

  return (
    <DetailTemplate
      header={
        <DetailHeader
          name="Jane Smith"
          code="CAN002"
          designation="Product Manager"
          contactInfo={{
            location: 'San Francisco, CA',
            phone: '+1-555-0456',
            email: 'jane@example.com',
          }}
          isFavorite={true}
          isActivelyLooking={false}
          onEdit={() => console.log('Edit')}
          onFavorite={() => console.log('Favorite')}
        />
      }
      summaryTitle="Profile Summary"
      summaryContent={
        <ProfileSummary
          items={summaryItems}
          columns={2}
          onEdit={() => console.log('Edit Summary')}
        />
      }
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      sidebar={<div>Sidebar content here</div>}
    />
  );
};
```

## Component Props Reference

### DetailTemplate Props

```tsx
interface DetailTemplateProps {
  // Layout components
  breadcrumb?: React.ReactNode;
  header?: React.ReactNode;
  mainContent?: React.ReactNode;
  sidebar?: React.ReactNode;

  // Enhanced features
  summaryTitle?: string;
  summaryContent?: ReactNode;
  tabs?: Array<{
    id: string;
    label: string;
    content: ReactNode;
    badge?: number;
  }>;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  bottomContent?: ReactNode;

  // States
  isLoading?: boolean;
  error?: string;
  className?: string;
}
```

### DetailHeader Props

```tsx
interface DetailHeaderProps {
  // Basic info
  name: string;
  code: string;
  designation?: string;

  // Contact information
  contactInfo?: {
    location?: string;
    phone?: string;
    email?: string;
    dob?: string;
    panNo?: string;
    uanNo?: string;
  };

  // Social and status
  linkedinProfile?: string;
  isFavorite?: boolean;
  isActivelyLooking?: boolean;
  photo?: string;

  // Audit information
  auditInfo?: {
    lastViewedBy?: string;
    lastViewedOn?: string;
    lastUpdatedBy?: string;
    lastUpdatedOn?: string;
  };

  // Actions
  onEdit?: () => void;
  onFavorite?: () => void;
  onViewResume?: () => void;
  onCreateResume?: () => void;
  canEdit?: boolean;

  // Navigation
  onPrevious?: () => void;
  onNext?: () => void;
}
```

### ProfileSummary Props

```tsx
interface ProfileSummaryProps {
  // Legacy support
  content?: string;
  onEdit?: () => void;
  canEdit?: boolean;
  loading?: boolean;

  // Enhanced features
  items?: Array<{
    label: string;
    value: string | number;
    icon?: IconName;
    type?: 'text' | 'number' | 'currency' | 'percentage' | 'date';
    highlight?: boolean;
  }>;
  title?: string;
  columns?: 1 | 2 | 3 | 4;
  children?: React.ReactNode;
  className?: string;
}
```

## Data Type Formatting

The ProfileSummary component automatically formats values based on type:

- `text`: Display as-is
- `number`: Add thousand separators
- `currency`: Add $ prefix and formatting
- `percentage`: Add % suffix
- `date`: Format as locale date string

## Migration Guide

### From Legacy DetailTemplate

The new DetailTemplate maintains backward compatibility. Existing code will continue to work:

```tsx
// This still works
<DetailTemplate
  breadcrumb={<Breadcrumb />}
  header={<DetailHeader />}
  mainContent={<div>Content</div>}
  sidebar={<div>Sidebar</div>}
/>
```

To use enhanced features, simply add the new props:

```tsx
// Enhanced usage
<DetailTemplate
  breadcrumb={<Breadcrumb />}
  header={<DetailHeader />}
  summaryTitle="Summary"
  summaryContent={<ProfileSummary />}
  tabs={tabs}
  activeTab={activeTab}
  onTabChange={setActiveTab}
  sidebar={<div>Sidebar</div>}
/>
```

### From Old DetailHeader

The old DetailHeader used a `data` prop with specific structure. The new version uses individual props for better type safety and flexibility:

```tsx
// Old way
<DetailHeader
  data={{
    display_name: "John Doe",
    candidate_id: "EMP001",
    current_city: "New York",
    // ... other fields
  }}
  onEdit={handleEdit}
  canEdit={canEdit}
/>

// New way
<DetailHeader
  name="John Doe"
  code="EMP001"
  contactInfo={{
    location: "New York",
    // ... other contact info
  }}
  onEdit={handleEdit}
  canEdit={canEdit}
/>
```

## Best Practices

1. **Consistent Data Structure**: Use the same field names across different entity types where possible.

2. **Loading States**: Always handle loading states using the template's `isLoading` prop.

3. **Error Handling**: Use the template's `error` prop for consistent error display.

4. **Responsive Design**: The components are responsive by default. Test on different screen sizes.

5. **Accessibility**: All components include proper ARIA labels and keyboard navigation.

6. **Performance**: Use React.memo() for complex tab content to avoid unnecessary re-renders.

## Examples

See the following files for complete examples:

- `src/components/pages/ApplicantDetail/ApplicantDetail.tsx`
- `src/components/pages/CandidateDetail/CandidateDetail.tsx`

These show how to implement the modular system for different entity types while maintaining consistency and reusability.
