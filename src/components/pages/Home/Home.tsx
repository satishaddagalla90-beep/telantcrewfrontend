import React from 'react';
import Text from '../../atoms/Text';

const Home: React.FC = () => {
    return (
        <div className="bg-white p-6 rounded-lg shadow text-center">
            <Text variant="h1" size="2xl" weight="bold" className="mb-4 text-primary-600">
                🏠 Dashboard Home
            </Text>
            <Text variant="p" color="muted" className="text-lg">
                Home content coming soon...
            </Text>
            <div className="mt-4 p-4 bg-blue-50 rounded">
                <Text variant="p" size="sm">
                    ✅ If you can see this, the Home component is rendering correctly!
                </Text>
            </div>
        </div>
    );
};

export default Home;
