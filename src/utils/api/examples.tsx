// Example usage of the API system
import React from 'react';
import { useSWR, apiCall, API_ENDPOINTS, User } from '../../utils/api';

const UsersExample: React.FC = () => {
    // Using useSWR for data fetching (GET requests)
    const { data: users, error, loading, refetch } = useSWR<User[]>(
        API_ENDPOINTS.USERS.LIST
    );

    // Example of using apiCall for mutations
    const handleCreateUser = async (userData: Partial<User>) => {
        try {
            const response = await apiCall<User>(
                API_ENDPOINTS.USERS.CREATE,
                {
                    method: 'POST',
                    body: JSON.stringify(userData),
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (response.data) {
                console.log('User created:', response.data);
                // Refetch the list to get updated data
                refetch();
            }
        } catch (err) {
            console.error('Error creating user:', err);
        }
    };

    const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
        try {
            const response = await apiCall<User>(
                API_ENDPOINTS.USERS.UPDATE(userId),
                {
                    method: 'PUT',
                    body: JSON.stringify(updates),
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (response.data) {
                console.log('User updated:', response.data);
                refetch();
            }
        } catch (err) {
            console.error('Error updating user:', err);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        try {
            await apiCall(
                API_ENDPOINTS.USERS.DELETE(userId),
                { method: 'DELETE' }
            );

            console.log('User deleted');
            refetch();
        } catch (err) {
            console.error('Error deleting user:', err);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error.message}</div>;

    return (
        <div>
            <h1>Users</h1>
            <button onClick={() => handleCreateUser({
                first_name: 'New',
                last_name: 'User',
                email: 'newuser@example.com'
            })}>
                Create User
            </button>

            {users?.map((user) => (
                <div key={user.id} style={{ border: '1px solid #ccc', margin: '10px', padding: '10px' }}>
                    <h3>{user.display_name}</h3>
                    <p>Email: {user.email}</p>
                    <p>Department: {user.department.join(', ')}</p>
                    <p>Role: {user.role.join(', ')}</p>
                    <button onClick={() => handleUpdateUser(user.id, { status: 'Inactive' })}>
                        Deactivate
                    </button>
                    <button onClick={() => handleDeleteUser(user.id)}>
                        Delete
                    </button>
                </div>
            ))}
        </div>
    );
};

export default UsersExample;
