import React, { useState } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import { Warehouse, Package, Plus } from 'lucide-react';
import InventoryTable from './InventoryTable';
import InventoryTransactions from './InventoryTransactions';
import RoomChecklist from './RoomChecklist';

const InventoryForm = () => {
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [refreshTable, setRefreshTable] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Amenity',
    currentStock: '',
    unit: '',
    minThreshold: '',
    reorderQuantity: '',
    costPerUnit: '',
    supplier: {
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: ''
    },
    location: 'Main Storage',
    autoReorder: false,
    notes: ''
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('supplier.')) {
      const supplierField = name.split('.')[1];
      setFormData({
        ...formData,
        supplier: {
          ...formData.supplier,
          [supplierField]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const submitData = {
        ...formData,
        currentStock: Number(formData.currentStock),
        minThreshold: Number(formData.minThreshold),
        reorderQuantity: Number(formData.reorderQuantity),
        costPerUnit: Number(formData.costPerUnit)
      };
      
      console.log('Submit data:', submitData);
      
      const url = editingId 
        ? `https://ashoka-api.shineinfosolutions.in/api/inventory/${editingId}`
        : 'https://ashoka-api.shineinfosolutions.in/api/inventory/items';
      
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(submitData)
      });
      
      console.log('Response status:', response.status);

      if (response.ok) {
        toast.success(editingId ? 'Inventory updated successfully!' : 'Inventory item added successfully!');
        
        setFormData({
          name: '',
          category: 'Amenity',
          currentStock: '',
          unit: '',
          minThreshold: '',
          reorderQuantity: '',
          costPerUnit: '',
          supplier: {
            name: '',
            contactPerson: '',
            phone: '',
            email: '',
            address: ''
          },
          location: 'Main Storage',
          autoReorder: false,
          notes: ''
        });
        setEditingId(null);
        setRefreshTable(prev => prev + 1);
        setShowForm(false);
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || 'Failed to save inventory item';
        if (errorMessage.includes('buffering timed out')) {
          toast.error('Database connection timeout. Please try again.');
        } else {
          toast.error(errorMessage);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error saving inventory item');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setFormData({
      name: item.name,
      category: item.category,
      currentStock: item.currentStock.toString(),
      unit: item.unit,
      minThreshold: item.minThreshold.toString(),
      reorderQuantity: item.reorderQuantity.toString(),
      costPerUnit: item.costPerUnit.toString(),
      supplier: item.supplier || {
        name: '',
        contactPerson: '',
        phone: '',
        email: '',
        address: ''
      },
      location: item.location || 'Main Storage',
      autoReorder: item.autoReorder || false,
      notes: item.notes || ''
    });
    setEditingId(item._id);
    setShowForm(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({
      name: '',
      category: 'Amenity',
      currentStock: '',
      unit: '',
      minThreshold: '',
      reorderQuantity: '',
      costPerUnit: '',
      supplier: {
        name: '',
        contactPerson: '',
        phone: '',
        email: '',
        address: ''
      },
      location: 'Main Storage',
      autoReorder: false,
      notes: ''
    });
  };

  return (
    <div className="p-3 sm:p-4 lg:p-6 overflow-auto h-full bg-background">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-4">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#1f2937] flex items-center gap-2">
          <Warehouse className="text-blue-600" size={24} />
          <span className="hidden sm:inline">Inventory Management</span>
          <span className="sm:hidden">Inventory</span>
        </h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm sm:text-base w-full sm:w-auto justify-center"
        >
          <Plus size={16} />
          {showForm ? 'Hide Form' : 'Add Item'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 mb-4 sm:mb-6">
            <Package className="text-blue-500" size={20} />
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">
              {editingId ? 'Edit Inventory Item' : 'Add Inventory Item'}
            </h2>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Item Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter item name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Amenity">Amenity</option>
                  <option value="Cleaning">Cleaning</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Food">Food</option>
                  <option value="Beverage">Beverage</option>
                  <option value="Linen">Linen</option>
                  <option value="Toiletry">Toiletry</option>
                  <option value="Snakes">Snakes</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Stock *</label>
                <input
                  type="number"
                  name="currentStock"
                  value={formData.currentStock}
                  onChange={handleChange}
                  required
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Unit *</label>
                <input
                  type="text"
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., kg, pieces, liters"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Min Threshold *</label>
                <input
                  type="number"
                  name="minThreshold"
                  value={formData.minThreshold}
                  onChange={handleChange}
                  required
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Minimum stock level"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reorder Quantity *</label>
                <input
                  type="number"
                  name="reorderQuantity"
                  value={formData.reorderQuantity}
                  onChange={handleChange}
                  required
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Quantity to reorder"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cost Per Unit *</label>
                <input
                  type="number"
                  name="costPerUnit"
                  value={formData.costPerUnit}
                  onChange={handleChange}
                  required
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Cost per unit"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Storage location"
                />
              </div>
            </div>

            <div className="border-t pt-4 sm:pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Supplier Information</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Supplier Name</label>
                  <input
                    type="text"
                    name="supplier.name"
                    value={formData.supplier.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Supplier name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Person</label>
                  <input
                    type="text"
                    name="supplier.contactPerson"
                    value={formData.supplier.contactPerson}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Contact person"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    name="supplier.phone"
                    value={formData.supplier.phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    name="supplier.email"
                    value={formData.supplier.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Email address"
                  />
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <textarea
                    name="supplier.address"
                    value={formData.supplier.address}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Supplier address"
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4 sm:pt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="autoReorder"
                    checked={formData.autoReorder}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700">
                    Enable Auto Reorder
                  </label>
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Additional notes"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                {loading ? 'Saving...' : (editingId ? 'Update Item' : 'Add Item')}
              </button>
              
              {editingId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      <InventoryTable 
        onEdit={handleEdit} 
        refreshTrigger={refreshTable}
      />

      <div className="mt-6">
        <InventoryTransactions />
      </div>

      <div className="mt-6">
        <RoomChecklist />
      </div>

      <Toaster position="top-right" />
    </div>
  );
};

export default InventoryForm;
