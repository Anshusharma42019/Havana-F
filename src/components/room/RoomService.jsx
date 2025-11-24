import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, ShoppingCart } from 'lucide-react';

const RoomService = () => {
  const navigate = useNavigate();
  const [roomData, setRoomData] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [availableItems, setAvailableItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');



  useEffect(() => {
    const storedRoomData = localStorage.getItem('selectedRoomService');
    console.log('RoomService mounted, localStorage data:', storedRoomData);
    
    if (storedRoomData) {
      try {
        const parsedData = JSON.parse(storedRoomData);
        console.log('Parsed room data:', parsedData);
        setRoomData(parsedData);
      } catch (error) {
        console.error('Error parsing room data:', error);
        navigate('/easy-dashboard');
      }
    } else {
      console.log('No room data found, redirecting...');
      setTimeout(() => navigate('/easy-dashboard'), 100);
    }
    fetchItems();
  }, [navigate]);

  const fetchItems = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch inventory items
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/inventory/items`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const inventoryItems = await res.json();
        const formattedItems = (Array.isArray(inventoryItems) ? inventoryItems : []).map(item => ({
          ...item,
          category: item.category || 'Restaurant',
          name: item.itemName || item.name,
          price: item.sellingPrice || item.price || 0,
          stock: item.currentStock || 0,
          id: item._id
        }));
        
        setAvailableItems(formattedItems);
      }
    } catch (error) {
      console.error('Error fetching inventory items:', error);
    }
  };

  const addItemToOrder = (item, quantity = 1) => {
    if (item.stock < quantity) {
      alert(`Insufficient stock! Only ${item.stock} items available.`);
      return;
    }
    
    const totalPrice = quantity * item.price;
    setOrderItems([...orderItems, {
      itemName: item.name,
      quantity,
      unitPrice: item.price,
      totalPrice,
      category: item.category,
      specialInstructions: '',
      itemId: item.id,
      stock: item.stock
    }]);
  };

  const removeItem = (index) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const subtotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const tax = subtotal * 0.18;
    const serviceCharge = subtotal * 0.10;
    const totalAmount = subtotal + tax + serviceCharge;
    return { subtotal, tax, serviceCharge, totalAmount };
  };

  const handleKOTEntry = async () => {
    if (orderItems.length === 0) {
      alert('Please add items to create KOT');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      
      // Deduct stock for each item
      for (const item of orderItems) {
        await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/inventory/items/${item.itemId}/stock`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            quantity: -item.quantity,
            type: 'OUT',
            reason: `Room Service - Room ${roomData.room_number}`,
            notes: `Order by ${roomData.booking?.name || 'Guest'}`
          })
        });
      }
      
      const restaurantItems = orderItems.filter(item => item.category === 'Restaurant');
      
      // Create restaurant order for restaurant items
      if (restaurantItems.length > 0) {
        const restaurantOrderData = {
          staffName: 'Room Service',
          phoneNumber: roomData.booking?.mobileNo || '',
          tableNo: `R${roomData.room_number.toString().replace(/\D/g, '').padStart(3, '0')}`,
          items: restaurantItems.map(item => ({
            itemId: item.itemId,
            quantity: item.quantity,
            price: item.unitPrice
          })),
          notes: `Room Service - ${roomData.booking?.name || 'Guest'}`,
          amount: restaurantItems.reduce((sum, item) => sum + item.totalPrice, 0),
          discount: 0,
          isMembership: false,
          isLoyalty: false,
          bookingId: roomData.booking?._id,
          grcNo: roomData.booking?.grcNo,
          roomNumber: roomData.room_number,
          guestName: roomData.booking?.name,
          guestPhone: roomData.booking?.mobileNo
        };
        
        await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/restaurant-orders/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(restaurantOrderData)
        });
      }
      
      alert('Order created successfully! Stock updated.');
      setOrderItems([]);
      fetchItems(); // Refresh items to show updated stock
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Error creating order');
    }
  };

  const handleSaleBill = () => {
    navigate('/room-service-billing', { 
      state: { 
        grcNo: roomData.booking?.grcNo,
        roomNumber: roomData.room_number,
        guestName: roomData.booking?.name 
      }
    });
  };

  const handleBillLookup = () => {
    navigate('/bill-lookup', { 
      state: { 
        grcNo: roomData.booking?.grcNo,
        roomNumber: roomData.room_number,
        guestName: roomData.booking?.name 
      }
    });
  };

  if (!roomData) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  const booking = roomData.booking;

  const filteredItems = availableItems.filter(item => 
    (selectedCategory === 'All' || item.category === selectedCategory) && 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen" style={{backgroundColor: '#f5f5dc'}}>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/easy-dashboard')}
            className="flex items-center hover:opacity-80 transition-opacity text-lg"
            style={{color: '#B8860B'}}
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold" style={{color: '#B8860B'}}>Room Service</h1>
          <div className="flex space-x-3">
            <button 
              onClick={handleSaleBill}
              className="px-6 py-2 rounded-lg font-medium text-white transition-colors"
              style={{backgroundColor: '#D4AF37'}}
            >
              Sale Bill
            </button>
            <button 
              onClick={handleBillLookup}
              className="px-6 py-2 rounded-lg font-medium border transition-colors"
              style={{borderColor: '#D4AF37', color: '#B8860B'}}
            >
              Bill Lookup
            </button>
          </div>
        </div>

        {/* Guest Details */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4" style={{color: '#B8860B'}}>Guest Details - Room {roomData.room_number}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium" style={{color: '#B8860B'}}>Room No.: </span>
              <span style={{color: '#8B4513'}}>{roomData.room_number}</span>
            </div>
            <div>
              <span className="font-medium" style={{color: '#B8860B'}}>GRC No.: </span>
              <span style={{color: '#8B4513'}}>{booking?.grcNo || 'GRC-2053'}</span>
            </div>
            <div>
              <span className="font-medium" style={{color: '#B8860B'}}>Name: </span>
              <span style={{color: '#8B4513'}}>{booking?.name || 'Anshu'}</span>
            </div>
            <div>
              <span className="font-medium" style={{color: '#B8860B'}}>PAX: </span>
              <span style={{color: '#8B4513'}}>{booking?.noOfAdults || 1}</span>
            </div>
            <div>
              <span className="font-medium" style={{color: '#B8860B'}}>Mobile No.: </span>
              <span style={{color: '#8B4513'}}>{booking?.mobileNo || '9227390327'}</span>
            </div>
            <div>
              <span className="font-medium" style={{color: '#B8860B'}}>Plan: </span>
              <span style={{color: '#8B4513'}}>{booking?.planPackage || 'CP STANDARD'}</span>
            </div>
            <div>
              <span className="font-medium" style={{color: '#B8860B'}}>Company: </span>
              <span style={{color: '#8B4513'}}>{booking?.companyName || '-'}</span>
            </div>
            <div>
              <span className="font-medium" style={{color: '#B8860B'}}>Remark: </span>
              <span style={{color: '#8B4513'}}>{booking?.remark || '-'}</span>
            </div>
          </div>
        </div>

        {/* Search Menu */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4" style={{color: '#B8860B'}}>Search Menu</h3>
          
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{color: '#D4AF37'}} />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>
          
          {/* Available Items Count */}
          <p className="text-sm mb-4" style={{color: '#D4AF37'}}>
            Available items: {availableItems.length}
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              selectedCategory === 'All' ? 'text-white' : 'bg-white border'
            }`}
            style={selectedCategory === 'All' ? 
              {backgroundColor: '#D4AF37'} : 
              {borderColor: '#D4AF37', color: '#B8860B'}}
          >
            All Items
          </button>
          {[...new Set(availableItems.map(item => item.category))].map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === category ? 'text-white' : 'bg-white border'
              }`}
              style={selectedCategory === category ? 
                {backgroundColor: '#D4AF37'} : 
                {borderColor: '#D4AF37', color: '#B8860B'}}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-6">
          {availableItems.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500">
              Loading items...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500">
              No items found
            </div>
          ) : filteredItems.map((item, index) => (
            <div key={index} className={`bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow ${item.stock === 0 ? 'opacity-50' : ''}`}>
              <h5 className="text-lg font-semibold mb-2" style={{color: '#8B4513'}}>{item.name}</h5>
              <p className="text-sm mb-1" style={{color: '#B8860B'}}>{item.category}</p>
              <p className="text-sm mb-2" style={{color: item.stock > 0 ? '#22c55e' : '#ef4444'}}>Stock: {item.stock}</p>
              <p className="text-2xl font-bold mb-4" style={{color: '#8B4513'}}>₹{item.price}</p>
              <button
                onClick={() => addItemToOrder(item, 1)}
                disabled={item.stock === 0}
                className="w-full py-3 rounded-lg font-medium text-white transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                style={{backgroundColor: item.stock > 0 ? '#D4AF37' : '#9ca3af'}}
                onMouseEnter={(e) => item.stock > 0 && (e.target.style.backgroundColor = '#B8860B')}
                onMouseLeave={(e) => item.stock > 0 && (e.target.style.backgroundColor = '#D4AF37')}
              >
                {item.stock > 0 ? 'Add to Order' : 'Out of Stock'}
              </button>
            </div>
          ))}
        </div>

        {/* Floating Cart Button */}
        {orderItems.length > 0 && (
          <div className="fixed bottom-6 right-6">
            <button
              onClick={handleKOTEntry}
              className="flex items-center justify-center w-16 h-16 rounded-full text-white shadow-lg transition-transform hover:scale-110"
              style={{backgroundColor: '#D4AF37'}}
            >
              <ShoppingCart className="w-6 h-6" />
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                {orderItems.length}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomService;
