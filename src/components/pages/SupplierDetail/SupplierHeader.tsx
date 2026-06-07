import React from 'react';
import Text from '../../atoms/Text';
import Icon from '../../atoms/Icon';
import Button from '../../atoms/Button';
import DefaultAvatar from '../../atoms/Avatar/DefaultAvatar';
import { SupplierData } from '../../../types/supplier';
import { formatUIDate } from '../../../utils/dateFormat';

interface SupplierHeaderProps {
  supplier: SupplierData;
  onEdit?: () => void;
  canEdit?: boolean;
  logoUrl?: string;
}

const SupplierHeader: React.FC<SupplierHeaderProps> = ({
  supplier,
  onEdit,
  canEdit,
  logoUrl,
}) => {
  const status = supplier.empanelment_status || 'Active';
  const code = supplier.supplier_id;
  const photo = logoUrl || supplier.supplier_logo;
  const website = supplier.website || undefined;
  const lastUpdatedBy = supplier.updated_by || supplier.created_by || undefined;
  const lastUpdatedOn = supplier.updated
    ? formatUIDate(supplier.updated)
    : supplier.created
      ? formatUIDate(supplier.created)
      : undefined;

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
      <div className="bg-[#EBF5FF] px-6 py-4"> {/* Compact padding like Image 1 */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-3">
          {/* Main Info Section */}
          <div className="flex-1 min-w-0 space-y-1.5"> {/* Tighter spacing */}
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <Text
                  variant="h3"
                  weight="semibold"
                  className="text-gray-900 leading-snug"
                >
                  {supplier.supplier_name}
                  <span className="ml-1.5 text-gray-400 font-normal">({code})</span>
                </Text>

                {status && (
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      status === 'Active'
                        ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20'
                        : 'bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/20'
                    }`}
                  >
                    <span
                      className={`mr-1 h-1 w-1 rounded-full ${
                        status === 'Active' ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                    />
                    {status}
                  </span>
                )}
              </div>

              {/* Address */}
              {supplier.address && (
                <div
                  className="flex items-start gap-1.5 text-gray-500"
                  title={`${supplier.address.registered_address}, ${supplier.address.city}, ${supplier.address.state}, ${supplier.address.country}`}
                >
                  <Icon name="map-pin" size={13} className="mt-0.5 flex-shrink-0" weight="regular" />
                  <Text size="xs" className="break-words leading-relaxed font-medium">
                    {supplier.address.registered_address},{' '}
                    {supplier.address.city}, {supplier.address.state},{' '}
                    {supplier.address.country}
                  </Text>
                </div>
              )}

              {/* Website */}
              {website && (
                <div className="flex items-center gap-1.5 text-gray-500">
                  <Icon name="external-link" size={13} className="flex-shrink-0" weight="regular" />
                  <Text size="xs" className="font-medium">
                    Website:{' '}
                    <a
                      href={website.startsWith('http') ? website : `https://${website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline break-all"
                    >
                      {website.replace(/^https?:\/\//i, '').replace(/\/$/, '')}
                    </a>
                  </Text>
                </div>
              )}
            </div>
          </div>

          {/* Right Section: Logo and Edit */}
          <div className="flex items-start gap-3 flex-shrink-0">
            <div className="relative w-28 h-28 md:mt-2"> {/* Balanced logo size */}
              <div className="w-full h-full rounded-full overflow-hidden bg-white border-[6px] border-white shadow-sm ring-1 ring-gray-100/50">
                {photo && photo.trim() ? (
                  <img
                    src={photo}
                    alt="Logo"
                    className="w-full h-full object-contain p-1"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-50">
                    <DefaultAvatar size="md" />
                  </div>
                )}
              </div>
            </div>

            {canEdit && onEdit && (
              <button
                onClick={onEdit}
                disabled={!canEdit}
                className="mt-1 p-2 bg-[#F8FAFC] hover:bg-white text-gray-500 hover:text-blue-600 rounded-lg shadow-sm border border-gray-100 transition-all active:scale-95"
                title="Edit Supplier"
              >
                <Icon name="edit" size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Footer Metadata Section - More compact like Image 1 */}
        <div className="mt-5 pt-3 border-t border-blue-200/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-[10px] text-gray-400 font-medium">
          <div className="flex items-center gap-4 flex-wrap">
            {(supplier.msme_certified !== undefined) && (
              <div className="flex items-center gap-1">
                <span>MSME Certified:</span>
                <span className="text-gray-600">{supplier.msme_certified ? 'Yes' : 'No'}</span>
              </div>
            )}
            
            {supplier.zone && (
              <div className="flex items-center gap-1">
                <span className="text-gray-200 mx-1">|</span>
                <span>Zone:</span>
                <span className="text-gray-600">{supplier.zone}</span>
              </div>
            )}
          </div>

          {(lastUpdatedBy || lastUpdatedOn) && (
            <div className="flex items-center gap-x-1.5 flex-wrap">
              {lastUpdatedBy && (
                <span>Last Updated By: <span className="text-gray-500">{lastUpdatedBy}</span></span>
              )}
              {lastUpdatedBy && lastUpdatedOn && <span className="text-gray-200 mx-0.5">|</span>}
              {lastUpdatedOn && (
                <span>Last Updated: <span className="text-gray-500">{lastUpdatedOn}</span></span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupplierHeader;
