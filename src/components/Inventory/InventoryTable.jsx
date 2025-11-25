import React, { useState, useEffect } from 'react';
import { Edit, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import DashboardLoader from '../DashboardLoader';

const InventoryTable = ({ onEdit, refreshTable }) => {
  const [inventoryData, setInventoryData] = useState([]);
  const [debugStats, setDebugStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    const loadInitialData = async () => {
      setIsInitialLoading(true);
      await Promise.all([
        fetchInventoryData(),
        fetchDebugStats()
      ]);
      setIsInitialLoading(false);
    };
    loadInitialData();
  }, [refreshTable]);

  const fetchInventoryData = async () => {
    try {
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login to continue.');
        localStorage.clear();
        window.location.reload();
        return;
      }

      const response = await fetch('https://ashoka-api.shineinfosolutions.in/api/inventory/items', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const inventoryArray = data.items || data.inventory || data.data || data || [];
        setInventoryData(Array.isArray(inventoryArray) ? inventoryArray : []);
      } else if (response.status === 403) {
        setError('Session expired. Please login again.');
        localStorage.clear();
        window.location.reload();
      } else {
        const errorText = await response.text();
        if (errorText.includes('buffering timed out') || errorText.includes('timeout')) {
          setError('Database connection timeout. Please try again in a moment.');
        } else {
          setError(`API Error: ${response.status} - ${errorText}`);
        }
        setInventoryData([]);
      }
    } catch (error) {
      console.error('Error fetching inventory data:', error);
      if (error.message.includes('buffering timed out') || error.message.includes('timeout')) {
        setError('Database connection timeout. Please try again in a moment.');
        toast.error('Database connection timeout. Please try again.');
      } else {
        setError(`Network Error: ${error.message}`);
        toast.error('Failed to fetch inventory data');
      }
      setInventoryData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDebugStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('https://ashoka-api.shineinfosolutions.in/api/inventory/debug/count', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setDebugStats(data);
      } else if (response.status === 403) {
        localStorage.clear();
        window.location.reload();
      }
    } catch (error) {
      console.error('Error fetching debug stats:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this inventory item?')) {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          toast.error('Please login to continue.');
          localStorage.clear();
          window.location.reload();
          return;
        }

        const response = await fetch(`https://ashoka-api.shineinfosolutions.in/api/inventory/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          toast.success('Inventory item deleted successfully!');
          fetchInventoryData();
        } else if (response.status === 403) {
          toast.error('Session expired. Please login again.');
          localStorage.clear();
          window.location.reload();
        } else {
          toast.error('Failed to delete inventory item');
        }
      } catch (error) {
        console.error('Error:', error);
        toast.error('Error deleting inventory item');
      }
    }
  };

  if (isInitialLoading) {
    return <DashboardLoader pageName="Inventory Management" />;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-md">
          <h3 className="text-xs sm:text-sm font-medium text-gray-500">Total Items</h3>
          <p className="text-lg sm:text-2xl font-bold text-gray-900">{debugStats?.totalCount || inventoryData.length}</p>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-md">
          <h3 className="text-xs sm:text-sm font-medium text-gray-500">Low Stock</h3>
          <p className="text-lg sm:text-2xl font-bold text-red-600">
            {inventoryData.filter(item => item.currentStock <= item.minThreshold).length}
          </p>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-md">
          <h3 className="text-xs sm:text-sm font-medium text-gray-500">Total Value</h3>
          <p className="text-lg sm:text-2xl font-bold text-green-600">
            ₹{inventoryData.reduce((sum, item) => sum + (item.currentStock * item.costPerUnit), 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-md">
          <h3 className="text-xs sm:text-sm font-medium text-gray-500">Auto Reorder</h3>
          <p className="text-lg sm:text-2xl font-bold text-blue-600">
            {inventoryData.filter(item => item.autoReorder).length}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Inventory Items</h3>
        </div>
        
        {inventoryData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {error && !error.includes('403') && !error.includes('Invalid token') ? (
              <div>
                <p className="text-red-600 mb-2">Error loading inventory data</p>
                <p className="text-sm text-gray-600 mb-4">{error}</p>
                <button
                  onClick={fetchInventoryData}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
                >
                  Retry
                </button>
              </div>
            ) : (
              <div>
                <p className="mb-4">No inventory items found</p>
                <button
                  onClick={fetchInventoryData}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
                >
                  Refresh
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Mobile Cards View */}
            <div className="block lg:hidden">
              {inventoryData.map((item) => (
                <div key={item._id} className="border-b border-gray-200 p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900">{item.name}</h4>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => onEdit(item)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Category:</span>
                      <span className="ml-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {item.category}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Stock:</span>
                      <span className={`ml-1 font-medium ${item.currentStock <= item.minThreshold ? 'text-red-600' : 'text-green-600'}`}>
                        {item.currentStock} {item.unit}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Min Threshold:</span>
                      <span className="ml-1 text-gray-900">{item.minThreshold} {item.unit}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Cost/Unit:</span>
                      <span className="ml-1 font-medium text-gray-900">₹{item.costPerUnit}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Location:</span>
                      <span className="ml-1 text-gray-900">{item.location}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Status:</span>
                      {item.currentStock <= item.minThreshold ? (
                        <span className="ml-1 inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          <AlertTriangle size={12} className="mr-1" />
                          Low Stock
                        </span>
                      ) : (
                        <span className="ml-1 inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          <CheckCircle size={12} className="mr-1" />
                          In Stock
                        </span>
                      )}
                    </div>
                  </div>
                  {item.supplier?.name && (
                    <div className="mt-2">
                      <span className="text-gray-500">Supplier:</span>
                      <span className="ml-1 text-gray-900">{item.supplier.name}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min Threshold</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost/Unit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {inventoryData.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`font-medium ${item.currentStock <= item.minThreshold ? 'text-red-600' : 'text-green-600'}`}>
                          {item.currentStock} {item.unit}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.minThreshold} {item.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ₹{item.costPerUnit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.location}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.currentStock <= item.minThreshold ? (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            <AlertTriangle size={12} className="mr-1" />
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            <CheckCircle size={12} className="mr-1" />
                            In Stock
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.supplier?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => onEdit(item)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(item._id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default InventoryTable;
