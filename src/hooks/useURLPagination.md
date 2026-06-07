# URL-Based Pagination Hook

The `useURLPagination` hook provides standardized URL-based pagination functionality that can be reused across different components.

## Features

- ✅ **URL Synchronization**: Page, limit, search, and tab state are stored in URL parameters
- ✅ **Browser Navigation**: Full support for back/forward navigation
- ✅ **Clean URLs**: Default values are omitted from URL for cleaner URLs
- ✅ **Customizable**: Parameter names and defaults can be configured
- ✅ **Type Safe**: Full TypeScript support
- ✅ **Auto Reset**: Page automatically resets to 1 when search/tab changes

## Basic Usage

```typescript
import { useURLPagination } from '../../../hooks/useURLPagination';

const MyComponent = () => {
  const {
    currentPage,
    limit,
    searchTerm,
    activeTab,
    setPage,
    setSearchTerm,
    setActiveTab,
    buildURLParams
  } = useURLPagination({
    defaultPage: 1,
    defaultLimit: 10,
    defaultTab: 'all',
    defaultSearch: ''
  });

  // Use the values in your API calls
  const apiUrl = `${API_ENDPOINTS.MY_ENDPOINT}?${buildURLParams().toString()}`;
  const { data, loading, error } = useSWR(apiUrl);

  return (
    <div>
      {/* Your component JSX */}
      <Pagination
        currentPage={currentPage}
        onPageChange={setPage}
        // ... other props
      />
    </div>
  );
};
```

## Configuration Options

```typescript
interface URLPaginationConfig {
  defaultPage?: number; // Default: 1
  defaultLimit?: number; // Default: 10
  defaultTab?: string; // Default: 'all'
  defaultSearch?: string; // Default: ''
  paramNames?: {
    // Customize URL parameter names
    page?: string; // Default: 'page'
    limit?: string; // Default: 'limit'
    search?: string; // Default: 'search'
    tab?: string; // Default: 'tab'
  };
}
```

## Custom Parameter Names

```typescript
const pagination = useURLPagination({
  paramNames: {
    page: 'p',
    limit: 'size',
    search: 'q',
    tab: 'filter',
  },
});
// URLs will use: ?p=2&size=20&q=search&filter=active
```

## Advanced Usage

### Bulk Updates

```typescript
const { updateParams } = useURLPagination();

// Update multiple parameters at once
updateParams({
  page: 1,
  search: 'new search',
  tab: 'active',
  // Custom parameters
  sortBy: 'name',
  order: 'asc',
});
```

### Custom Parameters

```typescript
// Add custom parameters beyond the standard ones
updateParams({
  page: 1,
  customFilter: 'value',
  sortDirection: 'desc',
});
```

### Reset to Defaults

```typescript
const { resetPagination } = useURLPagination();

const handleReset = () => {
  resetPagination(); // Resets all values to defaults
};
```

## URL Examples

With default configuration:

- `/users` - Default state (page=1, limit=10, tab=all, search='')
- `/users?page=2` - Page 2
- `/users?search=john` - Searching for "john"
- `/users?tab=active&page=3` - Active tab, page 3
- `/users?page=2&limit=20&search=admin&tab=inactive` - Full example

## Integration with Existing Components

### DataTable

```typescript
<DataTable
  data={paginatedData}
  // ... other props
/>
```

### FilterBar

```typescript
<FilterBar
  searchValue={searchTerm}
  onSearchChange={setSearchTerm}
  selectedProfile={activeTab}
  onProfileChange={setActiveTab}
  // ... other props
/>
```

### Pagination

```typescript
<Pagination
  currentPage={currentPage}
  onPageChange={setPage}
  // ... other props
/>
```

## Benefits

1. **Consistency**: All paginated components use the same URL structure
2. **User Experience**: Users can bookmark, share, and navigate with browser buttons
3. **SEO Friendly**: Search engines can index paginated content
4. **Maintainability**: Centralized pagination logic
5. **Reusability**: Easy to add to new components

## Migration from Component-Specific State

### Before (component-specific):

```typescript
const [currentPage, setCurrentPage] = useState(1);
const [searchTerm, setSearchTerm] = useState('');
// Manual URL handling...
```

### After (standardized):

```typescript
const { currentPage, searchTerm, setPage, setSearchTerm } = useURLPagination();
// URL handling is automatic!
```

This hook eliminates the need for manual URL parameter management in each component while providing a consistent, type-safe interface for pagination across your application.
