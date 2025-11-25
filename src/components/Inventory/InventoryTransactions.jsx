import React, { useState, useEffect } from 'react';
import { ArrowUpDown, Plus, History } from 'lucide-react';
import { toast } from 'react-hot-toast';

const InventoryTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    inventoryId: '',
    transactionType: 'added',
    quantity: '',
    previousStock: '0',
    newStock: '1',
    reason: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTransactions();
    fetchInventoryItems();
  }, []);

  const fetchTransactions = async () => {
    try {
      console.log('Fetching transactions...');
      const response = await fetch('https://ashoka-api.shineinfosolutions.in/api/inventory/transactions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      console.log('Transactions API response:', response);
      if (response.ok) {
        const data = await response.json();
        console.log('Transactions API data:', data);
        const transactionsArray = Array.isArray(data) ? data : data.transactions || [];
        console.log('Processed transactions array:', transactionsArray);
        setTransactions(transactionsArray);
      } else {
        const errorText = await response.text();
        console.log('Transactions API failed with status:', response.status, 'Error:', errorText);
        setTransactions([]);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setTransactions([]);
    }
  };

  const fetchInventoryItems = async () => {
    try {
      const response = await fetch('https://ashoka-api.shineinfosolutions.in/api/inventory/items', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      console.log('Inventory items API response:', response);
      if (response.ok) {
        const data = await response.json();
        console.log('Inventory items API data:', data);
        const itemsArray = data.items || data.inventory || data || [];
        setInventoryItems(Array.isArray(itemsArray) ? itemsArray : []);
      } else {
        console.log('Inventory items API failed with status:', response.status);
        setInventoryItems([]);
      }
    } catch (error) {
      console.error('Error fetching inventory items:', error);
      setInventoryItems([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.newStock || formData.newStock === '') {
      toast.error('New stock level is required');
      return;
    }
    
    setLoading(true);

    try {
      console.log('Form data before conversion:', formData);
      
      const newStockValue = formData.newStock === '' ? 1 : Number(formData.newStock);
      
      const payload = {
        inventoryId: formData.inventoryId,
        transactionType: formData.transactionType,
        quantity: Number(formData.quantity),
        previousStock: Number(formData.previousStock),
        newStock: newStockValue,
        notes: formData.notes
      };
      
      console.log('Transaction payload:', payload);
      console.log('newStock value:', newStockValue, 'type:', typeof newStockValue);
      
      const response = await fetch('https://ashoka-api.shineinfosolutions.in/api/inventory/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast.success('Transaction added successfully!');
        setFormData({ inventoryId: '', transactionType: 'added', quantity: '', previousStock: '0', newStock: '1', reason: '', notes: '' });
        setShowForm(false);
        fetchTransactions();
      } else {
        toast.error('Failed to add transaction');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error adding transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg sm:text-xl font-extrabold text-[#1f2937] flex items-center gap-2">
          <ArrowUpDown className="text-purple-600" size={24} />
          Inventory Transactions
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-sm"
        >
          <Plus size={16} />
          Add Transaction
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold mb-4">Add Inventory Transaction</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Inventory Item *</label>
                <select
                  value={formData.inventoryId}
                  onChange={(e) => setFormData({...formData, inventoryId: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select item</option>
                  {inventoryItems.map(item => (
                    <option key={item._id} value={item._id}>{item.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Type *</label>
                <select
                  value={formData.transactionType}
                  onChange={(e) => setFormData({...formData, transactionType: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="added">Added</option>
                  <option value="used">Used</option>
                  <option value="consumed">Consumed</option>
                  <option value="damaged">Damaged</option>
                  <option value="missing">Missing</option>
                  <option value="restock">Restock</option>
                  <option value="adjustment">Adjustment</option>
                  <option value="transfer">Transfer</option>
                  <option value="return">Return</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                  required
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter quantity"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Stock Level *</label>
                <input
                  type="number"
                  value={formData.newStock}
                  onChange={(e) => setFormData({...formData, newStock: e.target.value})}
                  required
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter new stock level"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Previous Stock *</label>
                <input
                  type="number"
                  value={formData.previousStock}
                  onChange={(e) => setFormData({...formData, previousStock: e.target.value})}
                  required
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Previous stock level"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Additional notes"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Plus size={16} />
                )}
                {loading ? 'Adding...' : 'Add Transaction'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Transactions List */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <History size={20} />
          Recent Transactions
        </h3>
        {transactions.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No transactions found</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {transactions.slice(0, 10).map((transaction, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${['added', 'restock', 'return'].includes(transaction.transactionType) ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <div>
                    <p className="font-medium">{transaction.inventory?.name || transaction.inventoryItem?.name || transaction.inventoryId?.name || 'Unknown Item'}</p>
                    <p className="text-sm text-gray-600">{transaction.reason}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${['added', 'restock', 'return'].includes(transaction.transactionType) ? 'text-green-600' : 'text-red-600'}`}>
                    {['added', 'restock', 'return'].includes(transaction.transactionType) ? '+' : '-'}{transaction.quantity}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(transaction.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryTransactions;
