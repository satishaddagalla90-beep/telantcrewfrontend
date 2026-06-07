import React, { useState, useEffect, useCallback, useRef } from 'react';
import Icon from '../../../atoms/Icon';
import Button from '../../../atoms/Button';
import Modal from '../../../atoms/Modal';
import {
  fetchDropdownCategories,
  fetchDropdownItems,
  addDropdownItem,
  updateDropdownItem,
  deleteDropdownItem,
} from '../../../../services/adminService';
import { DropdownCategory, DropdownItem } from '../../../../types/admin';

// Debounce hook for search
const useDebounce = (value: string, delay: number = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const DropdownManagement: React.FC = () => {
  const [categories, setCategories] = useState<DropdownCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [items, setItems] = useState<DropdownItem[]>([]);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  
  const [loading, setLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<DropdownItem | null>(null);
  const [modalValue, setModalValue] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState<DropdownItem | null>(null);

  // Load categories
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const cats = await fetchDropdownCategories();
        setCategories(cats);
        if (cats.length > 0) setSelectedCategory(cats[0].key);
      } catch (error) {
        console.error('Error loading categories:', error);
      }
      setLoading(false);
    })();
  }, []);

  // Load items when category or search changes
  const loadItems = useCallback(async () => {
    if (!selectedCategory) return;
    setItemsLoading(true);
    try {
      const result = await fetchDropdownItems(selectedCategory, debouncedSearch || undefined, page, limit);
      setItems(result.data);
      setTotal(result.total);
    } catch (error) {
      console.error('Error loading items:', error);
    }
    setItemsLoading(false);
  }, [selectedCategory, debouncedSearch, page, limit]);

  // Reset to page 1 when category changes
  useEffect(() => {
    setPage(1);
    setSearch('');
  }, [selectedCategory]);

  // Reset to page 1 when search changes
  useEffect(() => {
    if (debouncedSearch !== search) return;
    setPage(1);
  }, [debouncedSearch, search]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const selectedCategoryObj = categories.find(c => c.key === selectedCategory);
  const totalPages = Math.ceil(total / limit);

  const handleAddNew = () => {
    setEditItem(null);
    setModalValue('');
    setModalOpen(true);
  };

  const handleEdit = (item: DropdownItem) => {
    setEditItem(item);
    setModalValue(item.name);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!modalValue.trim() || !selectedCategory) return;
    setSaving(true);
    try {
      if (editItem) {
        await updateDropdownItem(selectedCategory, editItem.id, modalValue.trim());
      } else {
        await addDropdownItem(selectedCategory, modalValue.trim());
      }
      setModalOpen(false);
      setModalValue('');
      setEditItem(null);
      // Reload data after mutation
      await loadItems();
      // Refresh category counts
      const cats = await fetchDropdownCategories();
      setCategories(cats);
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm || !selectedCategory) return;
    try {
      await deleteDropdownItem(selectedCategory, deleteConfirm.id);
      setDeleteConfirm(null);
      await loadItems();
      const cats = await fetchDropdownCategories();
      setCategories(cats);
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Icon name="loading" className="h-6 w-6 animate-spin text-primary-600" />
        <span className="ml-2 text-gray-500">Loading dropdown categories with counts...</span>
      </div>
    );
  }

  return (
    <div className="flex gap-6 min-h-[500px]">
      {/* Left Sidebar — Categories */}
      <div className="w-72 flex-shrink-0 border rounded-xl bg-white overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Categories
          </h3>
        </div>
        <div className="overflow-y-auto max-h-[520px]">
          {categories.map(cat => (
            <button
              key={cat.key}
              onClick={() => {
                setSelectedCategory(cat.key);
                setSearch('');
                setPage(1);
              }}
              className={`w-full text-left px-4 py-3 border-b border-gray-100 transition-colors ${
                selectedCategory === cat.key
                  ? 'bg-primary-50 border-l-4 border-l-primary-600'
                  : 'hover:bg-gray-50 border-l-4 border-l-transparent'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <p
                    className={`text-sm font-medium ${
                      selectedCategory === cat.key ? 'text-primary-700' : 'text-gray-800'
                    }`}
                  >
                    {cat.label}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{cat.description}</p>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-flex items-center justify-center min-w-[32px] text-xs font-bold rounded-full px-2 py-1 ${
                      selectedCategory === cat.key
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {cat.count}
                  </span>
                  <p className="text-xs text-gray-400 mt-1">items</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right Panel — Items */}
      <div className="flex-1 border rounded-xl bg-white overflow-hidden">
        {selectedCategoryObj ? (
          <>
            {/* Header */}
            <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedCategoryObj.label}
                </h3>
                <p className="text-sm text-gray-500">{selectedCategoryObj.description}</p>
              </div>
              <Button variant="primary" size="sm" onClick={handleAddNew}>
                <Icon name="plus" className="h-4 w-4 mr-1" />
                Add New
              </Button>
            </div>

            {/* Search */}
            <div className="px-6 py-3 border-b">
              <div className="relative">
                <Icon
                  name="search"
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={`Search ${selectedCategoryObj.label.toLowerCase()}...`}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Items Table */}
            <div className="overflow-y-auto max-h-[350px]">
              {itemsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Icon name="loading" className="h-5 w-5 animate-spin text-gray-400" />
                  <span className="ml-2 text-sm text-gray-400">Loading...</span>
                </div>
              ) : items.length === 0 ? (
                <div className="py-12 text-center">
                  <Icon name="search" size={32} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-400">
                    {search ? 'No items match your search' : 'No items yet'}
                  </p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Updated
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.map(item => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-3 text-sm font-medium text-gray-900">
                          {item.name}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-500">{item.created}</td>
                        <td className="px-6 py-3 text-sm text-gray-500">{item.updated}</td>
                        <td className="px-6 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(item)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Icon name="edit" className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteConfirm(item)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Icon name="trash" className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination Footer */}
            {!itemsLoading && items.length > 0 && (
              <div className="px-6 py-4 border-t bg-white flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(page * limit, total)}</span> of{' '}
                  <span className="font-medium">{total}</span> items
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1 || itemsLoading}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                  >
                    <Icon name="caret-left" className="h-4 w-4" />
                  </Button>
                  <div className="text-sm text-gray-600 px-2">
                    Page <span className="font-medium">{page}</span> of <span className="font-medium">{totalPages}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === totalPages || itemsLoading}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  >
                    <Icon name="caret-right" className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            Select a category to manage its items
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editItem ? `Edit ${selectedCategoryObj?.label || 'Item'}` : `Add ${selectedCategoryObj?.label || 'Item'}`}
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={!modalValue.trim() || saving}
            >
              {saving ? (
                <>
                  <Icon name="loading" className="h-4 w-4 mr-1 animate-spin" />
                  Saving...
                </>
              ) : editItem ? (
                'Update'
              ) : (
                'Add'
              )}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={modalValue}
            onChange={e => setModalValue(e.target.value)}
            placeholder={`Enter ${selectedCategoryObj?.label?.toLowerCase() || 'item'} name`}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            autoFocus
            onKeyDown={e => {
              if (e.key === 'Enter' && modalValue.trim()) handleSave();
            }}
          />
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Confirm Deletion"
        size="sm"
        headerVariant="danger"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        }
      >
        <p className="text-sm text-gray-600">
          Are you sure you want to delete{' '}
          <span className="font-semibold text-gray-900">"{deleteConfirm?.name}"</span>? This
          action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

export default DropdownManagement;
