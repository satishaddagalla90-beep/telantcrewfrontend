# TalentCrew Frontend

A modern React application built with TypeScript, Tailwind CSS, Storybook, and React Router, following Atomic Design principles for scalable component architecture.

feat: Trigger Deploy 139


## 🚀 Features

- **React 18** with TypeScript
- **Tailwind CSS** for modern styling with custom primary color (#007ABF)
- **Storybook** for component documentation and interactive development
- **React Router v6** for declarative navigation
- **Atomic Design** complete component architecture (47+ components)
- **Phosphor Icons** for consistent iconography
- **Advanced Data Tables** with filtering, sorting, pagination, and search
- **Modal System** for user interactions and confirmations
- **Responsive Design** with mobile-first approach

## 📁 Project Structure

```
src/
├── components/
│   ├── atoms/          # Basic building blocks (16 components)
│   │   ├── Button/     # Multi-variant button system
│   │   ├── Text/       # Typography with consistent sizing
│   │   ├── Icon/       # Phosphor icons with 35+ icons
│   │   ├── Badge/      # Status and notification badges
│   │   ├── AsyncSelect/# Async searchable dropdown
│   │   ├── Breadcrumb/ # Navigation breadcrumbs
│   │   └── ...         # And more foundational components
│   ├── molecules/      # Component combinations (15 components)
│   │   ├── DataTable/  # Advanced table with internal scrolling
│   │   ├── FilterPanel/# Advanced filtering system
│   │   ├── Pagination/ # Data navigation controls
│   │   ├── TabNavBar/  # Tabbed navigation
│   │   └── ...         # Complex interactive components
│   ├── organisms/      # Complex UI sections (11 components)
│   │   ├── Header/     # Main application header
│   │   ├── NavBar/     # Navigation with active states
│   │   ├── DetailHeader/ # Profile header with actions
│   │   ├── ProfessionalDetails/ # Candidate info display
│   │   └── ...         # Feature-rich components
│   ├── templates/      # Page layouts (5 components)
│   │   ├── PageLayout/ # Standard page wrapper
│   │   ├── DetailView/ # Profile/detail page template
│   │   ├── DetailTemplate/ # Alternative detail layout
│   │   └── ...         # Layout templates
│   └── pages/          # Complete pages (6 components)
│       ├── Applicants/ # Advanced applicant management
│       ├── Users/      # User administration
│       └── ...         # Full-featured pages
├── constants/          # Application constants
├── types/             # TypeScript type definitions
├── utils/             # Utility functions
├── App.tsx            # Main application component
└── index.tsx          # Application entry point
```

## 🎨 Design System

### Brand Colors

- **Primary**: #007ABF (Professional blue)
- **Secondary**: Complementary grays and accent colors
- **Status**: Success, Warning, Danger, Info variants

### Typography

- **Headings**: h1-h6 with consistent scaling
- **Body**: Multiple sizes (xs, sm, base, lg, xl)
- **Weights**: light, normal, medium, semibold, bold

### Component Variants

- **Buttons**: primary, secondary, outline, ghost, danger
- **Badges**: success, warning, danger, info, secondary
- **Modals**: confirmation, alert, delete confirmation
- **Tables**: sortable, filterable, paginated, scrollable

## 📁 Project Structure

```
src/
├── components/
│   ├── atoms/          # Basic building blocks (Button, Text, etc.)
│   ├── molecules/      # Simple combinations of atoms (Card, etc.)
│   ├── organisms/      # Complex UI components (Header, etc.)
│   ├── templates/      # Page layouts (DashboardLayout, etc.)
│   └── pages/          # Full pages (Dashboard, etc.)
├── App.tsx
├── index.tsx
└── index.css
```

## 🏗️ Component Architecture Overview

### ✅ Completed Atoms (16/16)

- **Button**: Multi-variant button with icon support and loading states
- **Text**: Typography system with consistent sizing and weights
- **Icon**: 35+ Phosphor icons with proper TypeScript typing
- **Badge**: Status badges with 5 variants and 3 sizes
- **Avatar**: Profile pictures with fallback and size variants
- **Logo**: Company branding component
- **NavLink**: Navigation with active state styling
- **Modal**: Base modal with backdrop and animation
- **Input**: Form input with validation and error states
- **SearchBox**: Search input with clear functionality and icons
- **Dropdown**: Select dropdown with search and async options
- **AsyncSelect**: Advanced searchable dropdown with API integration
- **Checkbox**: Form checkbox with label and validation
- **Toggle**: Switch/toggle component
- **IconButton**: Icon-only buttons with multiple sizes
- **Breadcrumb**: Navigation breadcrumbs with React Router integration

### ✅ Completed Molecules (15/15)

- **Card**: Container component with header, body, and footer
- **DataTable**: Advanced table with sorting, filtering, and internal scrolling
- **FilterPanel**: Complex filtering interface with multiple input types
- **FilterBar**: Search and basic filtering controls
- **Pagination**: Data navigation with page size controls
- **TabNavBar**: Tabbed navigation with active states
- **ActionMenu**: Dropdown menu with action items
- **ColumnSelector**: Multi-select for table column visibility
- **Timeline**: Step-by-step progress indicator
- **LabeledInput**: Input with integrated labeling
- **FormSection**: Form organization with validation
- **StepTracker**: Multi-step form progress
- **EditableCard**: Card with edit mode toggle
- **ConfirmationModal**: Modal for user confirmations
- **DeleteConfirmationModal**: Specialized deletion confirmation

### ✅ Completed Organisms (11/11)

- **Header**: Main application header with user controls
- **NavBar**: Primary navigation with routing
- **DataTable**: Enterprise-grade table with advanced features
- **AddUserFlow**: Multi-step user creation wizard
- **PermissionManager**: Role-based access control interface
- **UserForm**: Comprehensive user management form
- **ErrorModal**: Error display and handling
- **BreadCrumb**: Navigation breadcrumb organism
- **DetailHeader**: Profile header with actions and social links
- **ProfessionalDetails**: Candidate information display
- **SkillMetrics**: Skills visualization with progress bars

### ✅ Completed Templates (5/5)

- **DashboardLayout**: Main application layout with sidebar
- **PageLayout**: Standard page wrapper with consistent spacing
- **DetailView**: Profile/detail page template with sidebar support
- **DetailTemplate**: Alternative detail layout for candidate pages
- **FormWizardLayout**: Multi-step form layout with progress
- **PermissionLayout**: Specialized layout for permission management

### ✅ Completed Pages (6/6)

- **Home**: Dashboard home with overview widgets
- **Users**: User management with advanced filtering and table
- **Applicants**: Comprehensive applicant management system
- **Clients**: Client relationship management interface
- **Vendors**: Vendor management and tracking
- **JobRequisition**: Job posting and requisition management

## 🎯 Key Features Implemented

### Advanced Data Management

- **Smart Tables**: Sorting, filtering, search, column management
- **Pagination**: Configurable page sizes with navigation
- **Internal Scrolling**: Tables maintain header/footer visibility
- **Column Resizing**: Dynamic column width adjustment
- **Selection**: Single and multi-select with bulk actions

### Interactive Components

- **Modal System**: Confirmation, alert, and custom modals
- **Async Loading**: Loading states and error handling
- **Form Validation**: Real-time validation with error display
- **Search & Filter**: Debounced search with advanced filtering
- **Responsive Design**: Mobile-first with breakpoint adaptation

### Navigation & Layout

- **React Router v6**: routing with nested layouts
- **Breadcrumb Navigation**: Automatic breadcrumb generation
- **Sidebar Navigation**: Collapsible sidebar with active states
- **Tab Navigation**: Tabbed interfaces with state management

### Developer Experience

- **TypeScript**: Full type safety with comprehensive interfaces
- **Storybook**: 47+ component stories with interactive controls
- **Atomic Design**: Scalable component architecture
- **Icon System**: Consistent iconography with Phosphor icons

## 🛠️ Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd talentcrew
```

2. Install dependencies:

```bash
npm install
```

## 📲 Progressive Web App (PWA) Support

This application is now installable with a working service worker, offline page, background sync, push notification handling, and install prompt support.

### Environment variables

Create a local `.env` file from `.env.example` and define your values:

```bash
cp .env.example .env
```

Then update the following variables:

- `REACT_APP_PUSH_PUBLIC_KEY` — your VAPID public key for push subscriptions
- `REACT_APP_PUSH_SUBSCRIPTION_URL` — backend endpoint to register push subscriptions
- `REACT_APP_API_BASE_URL` — optional API host used by runtime requests

### Build and run for production testing

```bash
npm run build
```

### Serve the production build over HTTPS

To test installation and service worker behavior, serve the built app from HTTPS. Example using `http-server`:

```bash
npm install -g http-server
http-server build -p 5000 --ssl
```

If you need a local certificate, use `mkcert` or a similar tool and pass `--cert` and `--key`.

### Install and offline validation

1. Open the app in your browser on a supported device.
2. Confirm the app installs via the browser install prompt or the iOS banner.
3. Go offline using DevTools or airplane mode.
4. Reload the page and verify that `offline.html` is displayed when the app cannot reach the network.

### Lighthouse validation

Run Lighthouse in Chrome with the Progressive Web App category and verify a score of at least 95. Ensure the service worker is active and the manifest is valid.

### Real device testing

- Android Chrome
- iOS Safari
- Windows Edge
- macOS Chrome

### Notes

- The service worker is registered in production builds only.
- Push notifications require a valid VAPID key and backend subscription endpoint.
- Background sync works for failed `POST`/`PUT` requests when the device returns online.

3. Start the development server:

```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## 📚 Storybook

Start Storybook to view and interact with all 47+ components:

```bash
npm run storybook
```

This will open Storybook at [http://localhost:6006](http://localhost:6006).

### Storybook Features

- **Interactive Component Library**: All components with live controls
- **Documentation**: Auto-generated documentation from TypeScript interfaces
- **Visual Testing**: Test components in isolation with different props
- **Design System**: Browse the complete design system by atomic levels

### Story Organization

Stories are organized by Atomic Design principles:

- **Atoms**: 16 foundational components (Button, Text, Icon, etc.)
- **Molecules**: 15 combinations (DataTable, FilterPanel, Pagination, etc.)
- **Organisms**: 11 complex components (Header, NavBar, DetailHeader, etc.)
- **Templates**: 5 page layouts (PageLayout, DetailView, etc.)
- **Pages**: 6 complete pages (Applicants, Users, etc.)

Each component includes multiple stories showing:

- **Default state** with standard props
- **All variants** (sizes, colors, states)
- **Interactive examples** with form controls
- **Edge cases** (empty states, long content, etc.)

### Component Examples in Storybook

- **Button**: 5 variants × 4 sizes = 20+ combinations
- **DataTable**: Sortable, filterable, paginated examples
- **Modal System**: Confirmation, alert, and delete modals
- **Form Components**: Validation states, error handling
- **Navigation**: Breadcrumbs, tabs, pagination examples

## 🎨 Available Scripts

- `npm start` - Runs the app in development mode
- `npm test` - Launches the test runner
- `npm run build` - Builds the app for production
- `npm run storybook` - Starts Storybook
- `npm run build-storybook` - Builds Storybook for production

## 🧩 Component Development Guide

### Component File Structure

Each component follows a consistent structure:

```
ComponentName/
├── ComponentName.tsx           # Main component implementation
├── ComponentName.stories.tsx   # Storybook documentation & examples
└── index.ts                   # Clean exports with TypeScript types
```

### Development Workflow

1. **Design First**: Review component requirements and design patterns
2. **Implement Component**: Create TypeScript component with proper interfaces
3. **Add Stories**: Create comprehensive Storybook examples
4. **Test Integration**: Verify component works with existing system
5. **Document**: Update README and add inline documentation

### TypeScript Best Practices

```typescript
// Always define proper interfaces
export interface ComponentProps {
  /** Descriptive prop documentation */
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

// Use proper default values
const Component: React.FC<ComponentProps> = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  children,
  ...props
}) => {
  // Component implementation
};
```

### Styling Guidelines

- **Use Tailwind CSS**: Utility-first approach for consistency
- **Custom Properties**: Use CSS variables for theming
- **Responsive Design**: Mobile-first breakpoints
- **Consistent Spacing**: Use Tailwind spacing scale
- **Brand Colors**: Primary #007ABF with semantic color system

### Component Integration

Components are designed to work together seamlessly:

```typescript
// Example: Complex page using multiple components
<PageLayout>
  <Breadcrumb items={breadcrumbItems} />
  <DataTable
    data={applicants}
    columns={columns}
    onSort={handleSort}
    renderFilters={() => (
      <FilterPanel>
        <SearchBox onSearch={handleSearch} />
        <AsyncSelect options={locationOptions} />
      </FilterPanel>
    )}
    renderPagination={() => (
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    )}
  />
</PageLayout>
```

## 🎯 Production-Ready Features

### Performance Optimizations

- **Code Splitting**: Automatic route-based splitting with React.lazy()
- **Bundle Optimization**: Tree shaking and minification
- **Image Optimization**: Responsive images with proper formats
- **Lazy Loading**: Components and routes loaded on demand
- **Memoization**: React.memo() for expensive components

### Accessibility (A11Y)

- **Semantic HTML**: Proper heading hierarchy and landmarks
- **ARIA Labels**: Screen reader compatibility
- **Keyboard Navigation**: Full keyboard accessibility
- **Focus Management**: Proper focus handling in modals and forms
- **Color Contrast**: WCAG AA compliance

### Error Handling

- **Error Boundaries**: Graceful error recovery
- **Loading States**: Skeleton screens and spinners
- **Empty States**: Meaningful empty state messages
- **Form Validation**: Real-time validation with error messages
- **Network Errors**: Retry mechanisms and offline support

### Security Considerations

- **Input Sanitization**: XSS protection
- **Content Security Policy**: Proper CSP headers
- **Environment Variables**: Secure configuration management
- **Dependency Auditing**: Regular security audits

### Browser Support

- **Browsers**: Chrome, Firefox, Safari, Edge (last 2 versions)
- **Mobile Browsers**: iOS Safari, Android Chrome
- **Progressive Enhancement**: Graceful degradation for older browsers

## 📊 Project Statistics

- **Total Components**: 47+ fully documented components
- **Code Coverage**: TypeScript interfaces for 100% of components
- **Storybook Stories**: 150+ interactive examples
- **Icon Library**: 35+ carefully selected Phosphor icons
- **Color Palette**: 12 semantic colors + brand color system
- **Responsive Breakpoints**: 5 breakpoints (sm, md, lg, xl, 2xl)

## 🚀 Recent Updates (August 2025)

### New Features Added

- ✅ **Advanced DataTable**: Internal scrolling, sticky headers, column management
- ✅ **Modal System**: Confirmation, alert, and delete confirmation modals
- ✅ **Breadcrumb Navigation**: React Router integration with proper styling
- ✅ **DetailView Templates**: Reusable profile and detail page layouts
- ✅ **Professional Components**: DetailHeader, ProfessionalDetails, SkillMetrics
- ✅ **Icon System Enhancement**: Added 35+ icons with proper TypeScript typing
- ✅ **Bootstrap to Tailwind Migration**: All components now use Tailwind CSS

### Technical Improvements

- ✅ **Component Index Files**: Proper index.ts files for all organisms and templates
- ✅ **TypeScript Interfaces**: Complete type safety across all components
- ✅ **Storybook Documentation**: Comprehensive stories for all components
- ✅ **Atomic Design Compliance**: Strict adherence to atomic design principles
- ✅ **Performance Optimization**: Optimized rendering and bundle size

## 🔧 Configuration & Setup

### Environment Configuration

- **Development**: Hot reloading, source maps, detailed errors
- **Production**: Optimized builds, minification, code splitting
- **Storybook**: Isolated component development and documentation

### Key Configuration Files

- `tailwind.config.js` - Custom Tailwind configuration with brand colors
- `tsconfig.json` - TypeScript configuration with strict mode
- `.storybook/` - Storybook configuration with Tailwind integration
- `package.json` - Dependencies, scripts, and project metadata
- `postcss.config.js` - PostCSS configuration for Tailwind processing

### Dependencies Overview

#### Core Dependencies

- **react** (^18.0.0) - React with concurrent features
- **react-router-dom** (^6.0.0) - Declarative routing
- **typescript** (^4.9.0) - Type safety and developer experience

#### Styling & UI

- **tailwindcss** (^3.4.3) - Utility-first CSS framework
- **phosphor-react** (^1.4.1) - Icon system with 1000+ icons
- **postcss** & **autoprefixer** - CSS processing

#### Development & Documentation

- **@storybook/react** (^8.6.14) - Component development environment
- **@types/react** & **@types/react-dom** - TypeScript definitions

### Build & Deployment

The application is configured for:

- **Static hosting** (Netlify, Vercel, GitHub Pages)
- **CDN deployment** with optimized assets
- **Progressive Web App** capabilities
- **SEO optimization** with meta tags and structured data

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Add tests and stories
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, please open an issue in the repository or contact the development team.
