import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Database } from 'lucide-react';

const InventorySeeder = ({ onSeedComplete }) => {
  const [loading, setLoading] = useState(false);

  const seedInventory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to continue.');
        localStorage.clear();
        window.location.reload();
        return;
      }

      const response = await fetch('https://ashoka-api.shineinfosolutions.in/api/inventory/seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Room inventory items added successfully!');
        if (onSeedComplete) onSeedComplete();
      } else if (response.status === 403) {
        toast.error('Session expired. Please login again.');
        localStorage.clear();
        window.location.reload();
      } else {
        const errorData = await response.text();
        toast.error(`Failed to add inventory items: ${response.status}`);
      }
    } catch (error) {
      toast.error('Network error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Database className="text-green-500" size={20} />
        <h3 className="text-lg font-semibold text-gray-800">Setup Room Inventory</h3>
      </div>
      <p className="text-gray-600 mb-4">
        Click below to add standard room inventory items (towels, sheets, toiletries, etc.)
      </p>
      <button
        onClick={seedInventory}
        disabled={loading}
        className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
      >
        <Database size={16} />
        {loading ? 'Adding Items...' : 'Add Room Inventory Items'}
      </button>
    </div>
  );
};

export default InventorySeeder;
