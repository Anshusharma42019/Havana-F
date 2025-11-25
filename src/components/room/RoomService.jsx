import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Minus } from 'lucide-react';

const RoomService = () => {
  const navigate = useNavigate();
  const [roomData, setRoomData] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [availableItems, setAvailableItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Restaurant');
  const [showOrderForm, setShowOrderForm] = useState(false);



  useEffect(() => {
    const storedRoomData = localStorage.getItem('selectedRoomService');
    if (storedRoomData) {
      setRoomData(JSON.parse(storedRoomData));
      localStorage.removeItem('selectedRoomService');
    } else {
      navigate('/easy-dashboard');
    }
    fetchItems();
  }, [navigate]);

  const fetchItems = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch restaurant items
      let restaurantItems = [];
      try {
        const res = await fetch('https://ashoka-api.shineinfosolutions.in/api/items/all', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          restaurantItems = await res.json();
        }
      } catch (err) {
        console.log('Restaurant API failed:', err);
      }
      
      // Fetch laundry items
      let laundryItems = [];
      try {
        const laundryRes = await fetch('https://ashoka-api.shineinfosolutions.in/api/laundry-rates/all', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (laundryRes.ok) {
          laundryItems = await laundryRes.json();
        }
      } catch (err) {
        console.log('Laundry API failed:', err);
      }
      
      const formattedItems = [
        ...(Array.isArray(restaurantItems) ? restaurantItems : []).map(item => ({
          ...item,
          category: 'Restaurant',
          name: item.name,
          price: item.Price || item.price || 0
        })),
        ...(Array.isArray(laundryItems) ? laundryItems : []).map(item => ({
          ...item,
          category: 'Laundry',
          name: item.itemName,
          price: item.rate || 0
        }))
      ];
      
      setAvailableItems(formattedItems);
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  const addItemToOrder = (item, quantity = 1) => {
    const totalPrice = quantity * item.price;
    setOrderItems([...orderItems, {
      itemName: item.name,
      quantity,
      unitPrice: item.price,
      totalPrice,
      category: item.category,
      specialInstructions: '',
      itemId: item._id
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
      const restaurantItems = orderItems.filter(item => item.category === 'Restaurant');
      
      // Create restaurant order for restaurant items (goes to chef dashboard)
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
        
        await fetch('https://ashoka-api.shineinfosolutions.in/api/restaurant-orders/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(restaurantOrderData)
        });
      }
      
      alert('Order created successfully!');
      setOrderItems([]);
      setShowOrderForm(false);
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

  return (
    <div className="min-h-screen" style={{backgroundColor: 'var(--color-background)'}}>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6" style={{borderColor: 'var(--color-border)'}}>
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/easy-dashboard')}
              className="flex items-center hover:opacity-80 transition-opacity"
              style={{color: 'var(--color-primary)'}}
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </button>
            <h1 className="text-2xl font-bold" style={{color: 'var(--color-text)'}}>Room Service</h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-sm" style={{color: 'var(--color-text)'}}>KOT Ordered</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gray-400 rounded"></div>
                <span className="text-sm" style={{color: 'var(--color-text)'}}>Exclusive Rooms</span>
              </div>
            </div>
          </div>
        </div>

        {/* Guest Details and Services */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Guest Details */}
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{color: 'var(--color-text)'}}>Guest Details - Room {roomData.room_number}</h3>
              <div className="grid grid-cols-1 gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium" style={{color: 'var(--color-text)'}}>Room No.:</span>
                  <span style={{color: 'var(--color-text)'}}>{roomData.room_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium" style={{color: 'var(--color-text)'}}>GRC No.:</span>
                  <span style={{color: 'var(--color-text)'}}>{booking?.grcNo || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium" style={{color: 'var(--color-text)'}}>Name:</span>
                  <span style={{color: 'var(--color-text)'}}>{booking?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium" style={{color: 'var(--color-text)'}}>PAX:</span>
                  <span style={{color: 'var(--color-text)'}}>{booking?.noOfAdults || 1}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium" style={{color: 'var(--color-text)'}}>Mobile No.:</span>
                  <span style={{color: 'var(--color-text)'}}>{booking?.mobileNo || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium" style={{color: 'var(--color-text)'}}>Plan:</span>
                  <span style={{color: 'var(--color-text)'}}>{booking?.planPackage || 'CP STANDARD'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium" style={{color: 'var(--color-text)'}}>Company:</span>
                  <span style={{color: 'var(--color-text)'}}>{booking?.companyName || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium" style={{color: 'var(--color-text)'}}>Remark:</span>
                  <span style={{color: 'var(--color-text)'}}>{booking?.remark || '-'}</span>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{color: 'var(--color-text)'}}>Room Services</h3>
              <div className="grid grid-cols-1 gap-3">
                <button 
                  onClick={handleKOTEntry}
                  className="w-full px-4 py-3 rounded-lg font-medium transition-colors"
                  style={{backgroundColor: 'var(--color-primary)', color: 'white'}}
                >
                  KOT Entry
                </button>
                <button 
                  onClick={handleSaleBill}
                  className="w-full px-4 py-3 rounded-lg font-medium transition-colors"
                  style={{backgroundColor: 'var(--color-secondary)', color: 'var(--color-text)'}}
                >
                  Sale Bill
                </button>
                <button 
                  onClick={handleBillLookup}
                  className="w-full px-4 py-3 rounded-lg font-medium border transition-colors hover:bg-gray-50"
                  style={{borderColor: 'var(--color-border)', color: 'var(--color-text)'}}
                >
                  Bill Lookup
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Order Form */}
        <div className="bg-white rounded-xl shadow-md p-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold" style={{color: 'var(--color-text)'}}>Add Items</h3>
            <button
              onClick={() => setShowOrderForm(!showOrderForm)}
              className="px-4 py-2 rounded-lg font-medium transition-colors"
              style={{backgroundColor: 'var(--color-primary)', color: 'white'}}
            >
              {showOrderForm ? 'Hide Form' : 'Add Items'}
            </button>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600">Available items: {availableItems.length} | Restaurant: {availableItems.filter(i => i.category === 'Restaurant').length} | Laundry: {availableItems.filter(i => i.category === 'Laundry').length}</p>
          </div>
          
          {showOrderForm && (
            <div className="space-y-4">
              <div className="flex space-x-4 mb-4">
                <button
                  onClick={() => setSelectedCategory('Restaurant')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedCategory === 'Restaurant' ? 'text-white' : 'border'
                  }`}
                  style={selectedCategory === 'Restaurant' ? 
                    {backgroundColor: 'var(--color-primary)'} : 
                    {borderColor: 'var(--color-border)', color: 'var(--color-text)'}}
                >
                  Restaurant
                </button>
                <button
                  onClick={() => setSelectedCategory('Laundry')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedCategory === 'Laundry' ? 'text-white' : 'border'
                  }`}
                  style={selectedCategory === 'Laundry' ? 
                    {backgroundColor: 'var(--color-primary)'} : 
                    {borderColor: 'var(--color-border)', color: 'var(--color-text)'}}
                >
                  Laundry
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {availableItems.length === 0 ? (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    Loading items...
                  </div>
                ) : availableItems
                  .filter(item => item.category === selectedCategory)
                  .map((item, index) => (
                    <div key={index} className="border rounded-lg p-3 hover:bg-gray-50">
                      <h5 className="font-medium" style={{color: 'var(--color-text)'}}>{item.name}</h5>
                      <p className="font-bold" style={{color: 'var(--color-primary)'}}>₹{item.price}</p>
                      <div className="flex items-center mt-2 space-x-2">
                        <input
                          type="number"
                          min="1"
                          defaultValue="1"
                          className="border rounded px-2 py-1 w-16 text-sm"
                          id={`qty-${index}`}
                        />
                        <button
                          onClick={() => {
                            const qty = parseInt(document.getElementById(`qty-${index}`).value) || 1;
                            addItemToOrder(item, qty);
                          }}
                          className="px-3 py-1 rounded text-sm font-medium transition-colors"
                          style={{backgroundColor: 'var(--color-primary)', color: 'white'}}
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  ))
                }
                {availableItems.length > 0 && availableItems.filter(item => item.category === selectedCategory).length === 0 && (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    No {selectedCategory.toLowerCase()} items available
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Order Items List */}
          {orderItems.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold mb-3" style={{color: 'var(--color-text)'}}>Order Items</h4>
              <div className="space-y-2">
                {orderItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <span className="font-medium">{item.itemName}</span>
                      <span className="text-sm text-gray-600 ml-2">({item.category})</span>
                    </div>
                    <div className="text-sm">
                      {item.quantity} × ₹{item.unitPrice} = ₹{item.totalPrice}
                    </div>
                    <button
                      onClick={() => removeItem(index)}
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              
              {/* Order Summary */}
              <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{calculateTotals().subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (18%):</span>
                    <span>₹{calculateTotals().tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Service Charge (10%):</span>
                    <span>₹{calculateTotals().serviceCharge.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>₹{calculateTotals().totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomService;
