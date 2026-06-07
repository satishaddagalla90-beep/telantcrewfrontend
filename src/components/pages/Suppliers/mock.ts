export type SupplierData = {
    id: string;
    supplier_id: string;
    supplier_name: string;
    contact: string;
    email: string;
    company: string;
    location: string;
    services: string;
    rating: string;
    created: string;
    status: 'active' | 'inactive';
};

export const mockSuppliersData: SupplierData[] = [
    {
        id: '1',
        supplier_id: 'SUP-001',
        supplier_name: 'Alpha Supplies',
        contact: 'John Doe',
        email: 'john@alpha.com',
        company: 'Alpha Inc.',
        location: 'New York, NY',
        services: 'Office Supplies, Furniture',
        rating: '4.5',
        created: '2023-10-01',
        status: 'active',
    },
    {
        id: '2',
        supplier_id: 'SUP-002',
        supplier_name: 'Beta Logistics',
        contact: 'Jane Smith',
        email: 'jane@beta.com',
        company: 'Beta Logistics LLC',
        location: 'San Francisco, CA',
        services: 'Logistics, Warehousing',
        rating: '4.2',
        created: '2023-09-15',
        status: 'inactive',
    },
    // ...add more mock suppliers as needed...
];
