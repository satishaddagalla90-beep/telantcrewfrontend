// Client API Service
const API_BASE_URL = 'https://tc-py-fastapi-to33v.ondigitalocean.app';

interface LastClientIdResponse {
    last_client_id: string;
}

/**
 * Fetches the last client ID from the API
 * @returns Promise containing the last client ID
 */
export const fetchLastClientId = async (): Promise<string> => {
    try {
        const response = await fetch(`${API_BASE_URL}/client/last-client-id`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                // Add authorization header if needed
                // 'Authorization': `Bearer ${getAccessToken()}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch last client ID: ${response.statusText}`);
        }

        const data: LastClientIdResponse = await response.json();
        return data.last_client_id;
    } catch (error) {
        console.error('Error fetching last client ID:', error);
        throw new Error('Failed to fetch last client ID');
    }
};

/**
 * Generates the next client ID by incrementing the last client ID
 * @param lastClientId - The last client ID (e.g., "CLT-001")
 * @returns The next client ID (e.g., "CLT-002")
 */
export const generateNextClientId = (lastClientId: string): string => {
    try {
        // Extract the prefix and number from the last client ID
        // Expected format: "CLT-###" where ### is the number
        const parts = lastClientId.split('-');
        
        if (parts.length !== 2) {
            throw new Error(`Invalid client ID format: ${lastClientId}. Expected format: CLT-###`);
        }

        const prefix = parts[0]; // "CLT"
        const numberPart = parts[1]; // "001"
        
        if (prefix !== 'CLT') {
            throw new Error(`Invalid client ID prefix: ${prefix}. Expected: CLT`);
        }

        const currentNumber = parseInt(numberPart, 10);
        
        if (isNaN(currentNumber)) {
            throw new Error(`Invalid number in client ID: ${lastClientId}`);
        }

        const nextNumber = currentNumber + 1;
        
        // Pad with zeros to maintain the same length (3 digits)
        const paddedNumber = nextNumber.toString().padStart(numberPart.length, '0');
        
        return `${prefix}-${paddedNumber}`;
    } catch (error) {
        console.error('Error generating next client ID:', error);
        throw new Error('Failed to generate next client ID');
    }
};

/**
 * Fetches the last client ID and generates the next one
 * @returns Promise containing the next client ID
 */
export const getNextClientId = async (): Promise<string> => {
    try {
        const lastClientId = await fetchLastClientId();
        const nextClientId = generateNextClientId(lastClientId);
        return nextClientId;
    } catch (error) {
        console.error('Error getting next client ID:', error);
        throw new Error('Failed to get next client ID');
    }
};
