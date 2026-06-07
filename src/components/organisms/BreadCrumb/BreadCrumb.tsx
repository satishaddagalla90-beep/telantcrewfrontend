import React from 'react';
import { Link } from 'react-router-dom';
import Text from '../../atoms/Text';
import Icon from '../../atoms/Icon';

interface BreadcrumbItem {
    label: string;
    path?: string;
    active?: boolean;
}

interface BreadcrumbProps {
    items: BreadcrumbItem[];
    additionalInfo?: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, additionalInfo }) => {
    return (
     <div className='flex justify-between items-center pr-8'>
           <div className="bg-white px-6 py-3 flex items-center text-sm text-gray-600">
            {items.map((item, index) => (
                <React.Fragment key={index}>
                    {item.path ? (
                        <Link
                            to={item.path}
                            className="hover:text-blue-600 text-gray-600"
                        >
                            {item.label}
                        </Link>
                    ) : (
                        <span className="font-medium text-gray-800">
                            {item.label}
                        </span>
                    )}
                    {index < items.length - 1 && (
                        <Icon name='caret-right' className="w-4 h-4 mx-2" />
                    )}
                </React.Fragment>
            ))}
        </div>
        {additionalInfo && (
            <Text size="xs" className='text-sm text-gray-500'>{additionalInfo}</Text>
        )}
     </div>
    );
};

export default Breadcrumb;