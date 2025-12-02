import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, Mail, MapPin, Calendar, CreditCard, Bed, Users, Edit2, Save, X, Plus, Trash2 } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import axios from 'axios';
import RoomServiceOrders from './RoomServiceOrders';
import RestaurantOrders from './RestaurantOrders';

const BookingDetails = () => {
  const { bookingId } = useParams(); // This will now be bookingNo
  const navigate = useNavigate();
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [serviceCharges, setServiceCharges] = useState([]);
  const [restaurantCharges, setRestaurantCharges] = useState([]);
  const [editingOrder, setEditingOrder] = useState(null);
  const [editItems, setEditItems] = useState([]);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [newPayment, setNewPayment] = useState({
    amount: '',
    paymentMode: '',
    paymentDate: new Date().toISOString().split('T')[0],
    reference: '',
    notes: ''
  });

  useEffect(() => {
    fetchBookingDetails();
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${BASE_URL}/api/bookings/booking-number/${bookingId}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setBooking(response.data.booking);
      
      // Fetch service charges
      if (response.data.booking._id) {
        await fetchServiceCharges(response.data.booking._id, token, response.data.booking);
      }
    } catch (err) {
      setError(`Failed to fetch booking details: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchServiceCharges = async (bookingId, token, bookingData = booking) => {
    try {
      console.log('Fetching charges for booking ID:', bookingId);
      
      // Fetch room service orders by booking ID
      const serviceResponse = await axios.get(`${BASE_URL}/api/room-service/all`, {
        headers: { 'Authorization': `Bearer ${token}` },
        params: { bookingId }
      });
      
      // Fetch restaurant orders by booking ID and booking number
      const restaurantResponse = await axios.get(`${BASE_URL}/api/restaurant-orders/all`, {
        headers: { 'Authorization': `Bearer ${token}` },
        params: { 
          bookingId: bookingId,
          bookingNumber: bookingData?.grcNo
        }
      });
      
      console.log('Room service response:', serviceResponse.data);
      console.log('Restaurant response:', restaurantResponse.data);
      
      // Filter restaurant orders
      const allRestaurantOrders = restaurantResponse.data || [];
      console.log('All restaurant orders:', allRestaurantOrders);
      console.log('Current booking room number:', bookingData?.roomNumber);
      console.log('Current booking ID:', bookingId);
      
      const filteredRestaurantOrders = allRestaurantOrders.filter(order => {
        console.log('Checking order:', order._id, 'bookingId:', order.bookingId, 'bookingNumber:', order.bookingNumber, 'tableNo:', order.tableNo, 'status:', order.status);
        
        // Match only by booking ID or booking number
        const matchesBookingId = (order.bookingId && order.bookingId._id === bookingId) || order.bookingId === bookingId;
        const matchesBookingNumber = order.bookingNumber === bookingData?.grcNo;
        
        const isForThisBooking = matchesBookingId || matchesBookingNumber;
        const isNotCancelled = order.status !== 'cancelled' && order.status !== 'canceled';
        
        console.log('Match result:', { matchesBookingId, matchesBookingNumber, isForThisBooking, isNotCancelled });
        
        return isForThisBooking && isNotCancelled;
      });
      
      // Filter room service orders to exclude cancelled ones
      const filteredServiceOrders = (serviceResponse.data.orders || []).filter(order => 
        order.status !== 'cancelled' && order.status !== 'canceled'
      );
      
      console.log('Final filtered restaurant orders:', filteredRestaurantOrders);
      console.log('Final filtered service orders:', filteredServiceOrders);
      
      setServiceCharges(filteredServiceOrders);
      setRestaurantCharges(filteredRestaurantOrders);
    } catch (err) {
      console.error('Failed to fetch service charges:', err);
    }
  };

  const handleEditOrder = (order, type) => {
    setEditingOrder({ ...order, type });
    setEditItems([...order.items]);
  };

  const handleSaveOrder = async () => {
    try {
      const token = localStorage.getItem('token');
      const subtotal = editItems.reduce((sum, item) => {
        const unitPrice = item.unitPrice || item.price || 0;
        return sum + (item.quantity * unitPrice);
      }, 0);
      const totalAmount = subtotal; // Add tax calculation if needed
      
      if (editingOrder.type === 'service') {
        await axios.put(`${BASE_URL}/api/room-service/orders/${editingOrder._id}`, {
          items: editItems,
          subtotal,
          totalAmount
        }, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } else {
        await axios.patch(`${BASE_URL}/api/restaurant-orders/${editingOrder._id}`, {
          items: editItems,
          amount: totalAmount
        }, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }

      
      // Refresh charges
      await fetchServiceCharges(booking._id, token);
      setEditingOrder(null);
      setEditItems([]);
    } catch (err) {
      console.error('Failed to update order:', err);
      alert('Failed to update order');
    }
  };

  const handleCancelEdit = () => {
    setEditingOrder(null);
    setEditItems([]);
  };

  const handleAddPayment = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${BASE_URL}/api/bookings/update/${booking._id}`, {
        advancePayments: [...(booking.advancePayments || []), {
          ...newPayment,
          amount: Number(newPayment.amount)
        }]
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Update local booking state
      setBooking(prev => ({
        ...prev,
        advancePayments: [...(prev.advancePayments || []), {
          ...newPayment,
          amount: Number(newPayment.amount)
        }]
      }));
      
      // Reset form
      setNewPayment({
        amount: '',
        paymentMode: '',
        paymentDate: new Date().toISOString().split('T')[0],
        reference: '',
        notes: ''
      });
      setShowAddPayment(false);
    } catch (err) {
      console.error('Failed to add payment:', err);
      alert('Failed to add payment');
    }
  };

  const handleCancelAddPayment = () => {
    setNewPayment({
      amount: '',
      paymentMode: '',
      paymentDate: new Date().toISOString().split('T')[0],
      reference: '',
      notes: ''
    });
    setShowAddPayment(false);
  };

  const updateItemQuantity = (index, quantity) => {
    const newItems = [...editItems];
    newItems[index].quantity = Math.max(0, quantity);
    
    // Handle different property names for price and total
    const unitPrice = newItems[index].unitPrice || newItems[index].price || 0;
    const calculatedTotal = newItems[index].quantity * unitPrice;
    
    // Update both possible total property names
    newItems[index].totalPrice = calculatedTotal;
    newItems[index].total = calculatedTotal;
    
    setEditItems(newItems);
  };

  const handleRemoveOrder = async (orderId, type) => {
    if (!confirm('Are you sure you want to remove this order?')) return;
    
    try {
      const token = localStorage.getItem('token');
      
      if (type === 'service') {
        await axios.delete(`${BASE_URL}/api/room-service/orders/${orderId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } else {
        // For restaurant orders, update status to cancelled
        await axios.patch(`${BASE_URL}/api/restaurant-orders/${orderId}/status`, {
          status: 'cancelled'
        }, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
      
      // Refresh charges
      await fetchServiceCharges(booking._id, token);
    } catch (err) {
      console.error('Failed to remove order:', err);
      alert('Failed to remove order');
    }
  };

  const handleRemoveItem = (itemIndex) => {
    const newItems = editItems.filter((_, index) => index !== itemIndex);
    setEditItems(newItems);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg">{error || 'Booking not found'}</p>
          <button
            onClick={() => navigate('/booking')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Bookings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/booking')}
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Bookings
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Booking Details</h1>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Guest Information */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <User className="mr-2 text-blue-600" size={20} />
                Guest Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600">Full Name</label>
                  <p className="text-lg font-medium text-gray-800">{booking.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Mobile Number</label>
                  <p className="text-lg font-medium text-gray-800 flex items-center">
                    <Phone size={16} className="mr-2 text-gray-500" />
                    {booking.mobileNo}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Email</label>
                  <p className="text-lg font-medium text-gray-800 flex items-center">
                    <Mail size={16} className="mr-2 text-gray-500" />
                    {booking.email || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Address</label>
                  <p className="text-lg font-medium text-gray-800 flex items-center">
                    <MapPin size={16} className="mr-2 text-gray-500" />
                    {booking.address || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">ID Proof Type</label>
                  <p className="text-lg font-medium text-gray-800">{booking.idProofType || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">ID Proof Number</label>
                  <p className="text-lg font-medium text-gray-800">{booking.idProofNumber || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Room Guest Details */}
            {booking.roomGuestDetails && booking.roomGuestDetails.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <Users className="mr-2 text-blue-600" size={20} />
                  Room Guest Details
                </h2>
                <div className="space-y-4">
                  {booking.roomRates?.map((roomRate, index) => {
                    // Find corresponding guest details for this room
                    const guestDetails = booking.roomGuestDetails?.find(guest => guest.roomNumber === roomRate.roomNumber);
                    
                    return (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-medium text-gray-800 mb-2">Room {roomRate.roomNumber}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Adults:</span>
                            <span className="ml-2 font-medium">{guestDetails?.adults || 0}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Children:</span>
                            <span className="ml-2 font-medium">{guestDetails?.children || 0}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Rate:</span>
                            <span className="ml-2 font-medium">₹{roomRate.customRate || 0}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Extra Bed:</span>
                            <span className="ml-2 font-medium">{roomRate.extraBed ? 'Yes' : 'No'}</span>
                          </div>
                        </div>
                        {roomRate.extraBed && roomRate.extraBedStartDate && (
                          <div className="mt-2 text-xs text-green-600">
                            Extra bed from: {new Date(roomRate.extraBedStartDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Room Service Orders */}
            <RoomServiceOrders
              serviceCharges={serviceCharges}
              editingOrder={editingOrder}
              editItems={editItems}
              onEditOrder={handleEditOrder}
              onSaveOrder={handleSaveOrder}
              onCancelEdit={handleCancelEdit}
              onUpdateItemQuantity={updateItemQuantity}
            />

            {/* Restaurant Orders */}
            <RestaurantOrders
              restaurantCharges={restaurantCharges}
              editingOrder={editingOrder}
              editItems={editItems}
              onEditOrder={handleEditOrder}
              onSaveOrder={handleSaveOrder}
              onCancelEdit={handleCancelEdit}
              onUpdateItemQuantity={updateItemQuantity}
              onRemoveOrder={handleRemoveOrder}
              onRemoveItem={handleRemoveItem}
            />

            {/* Amendment History */}
            {booking.amendmentHistory && booking.amendmentHistory.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Amendment History</h2>
                <div className="space-y-3">
                  {booking.amendmentHistory.map((amendment, index) => (
                    <div key={index} className="border-l-4 border-orange-400 pl-4 py-2 bg-orange-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-800">
                            Amendment #{index + 1}
                          </p>
                          <p className="text-sm text-gray-600">
                            Date: {new Date(amendment.amendedOn).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-600">
                            Extended to: {new Date(amendment.newCheckOut).toLocaleDateString()}
                          </p>
                          {amendment.reason && (
                            <p className="text-sm text-gray-600">Reason: {amendment.reason}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-orange-600">
                            ₹{amendment.totalAdjustment || 0}
                          </p>
                          <p className="text-xs text-gray-500">Adjustment</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Booking Summary */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Booking Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">GRC Number:</span>
                  <span className="font-medium">{booking.grcNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    booking.status === 'Booked' ? 'bg-green-100 text-green-800' :
                    booking.status === 'Checked In' ? 'bg-blue-100 text-blue-800' :
                    booking.status === 'Checked Out' ? 'bg-gray-100 text-gray-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {booking.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    booking.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' :
                    booking.paymentStatus === 'Partial' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {booking.paymentStatus}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <Calendar className="mr-2 text-blue-600" size={20} />
                Stay Details
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600">Check-in Date</label>
                  <p className="text-lg font-medium text-gray-800">
                    {new Date(booking.checkInDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Check-out Date</label>
                  <p className="text-lg font-medium text-gray-800">
                    {new Date(booking.checkOutDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Duration</label>
                  <p className="text-lg font-medium text-gray-800">
                    {Math.ceil((new Date(booking.checkOutDate) - new Date(booking.checkInDate)) / (1000 * 60 * 60 * 24))} nights
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <Bed className="mr-2 text-blue-600" size={20} />
                Room Details
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600">Room Numbers</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {booking.roomNumber ? booking.roomNumber.split(',').map((room, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                        {room.trim()}
                      </span>
                    )) : (
                      <span className="text-gray-500 text-sm">No rooms assigned</span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Total Guests</label>
                  <p className="text-lg font-medium text-gray-800">
                    {booking.roomGuestDetails && booking.roomGuestDetails.length > 0 ? 
                      booking.roomGuestDetails.reduce((sum, room) => sum + (room.adults || 0) + (room.children || 0), 0) :
                      (booking.noOfAdults || 0) + (booking.noOfChildren || 0) || 'N/A'
                    }
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">VIP Guest</label>
                  <p className="text-lg font-medium text-gray-800">
                    {booking.vip ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>
            </div>

            {/* Advance Payments */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <CreditCard className="mr-2 text-blue-600" size={20} />
                  Advance Payments
                </h2>
                <button
                  onClick={() => setShowAddPayment(true)}
                  className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  <Plus size={16} className="mr-1" />
                  Add Payment
                </button>
              </div>
              {booking.advancePayments && booking.advancePayments.length > 0 ? (
                <div className="space-y-3">
                  {booking.advancePayments.map((payment, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-800">Payment #{index + 1}</p>
                          <p className="text-sm text-gray-600">{payment.paymentMode}</p>
                          <p className="text-sm text-gray-600">{new Date(payment.paymentDate).toLocaleDateString()}</p>
                          {payment.reference && (
                            <p className="text-xs text-gray-500">Ref: {payment.reference}</p>
                          )}
                          {payment.notes && (
                            <p className="text-xs text-gray-500">{payment.notes}</p>
                          )}
                        </div>
                        <span className="font-medium text-lg text-green-600">₹{payment.amount}</span>
                      </div>
                    </div>
                  ))}
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total Advance Received:</span>
                      <span className="text-green-600">₹{booking.advancePayments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-semibold mt-2">
                      <span>Balance Due:</span>
                      <span className="text-orange-600">₹{(() => {
                        const baseRoomRate = (() => {
                          const totalRate = booking.taxableAmount || 0;
                          const extraBedCost = booking.extraBed && booking.extraBedRooms && booking.extraBedRooms.length > 0 
                            ? booking.roomRates?.reduce((sum, room) => {
                                if (!room.extraBed) return sum;
                                const startDate = new Date(room.extraBedStartDate || booking.checkInDate);
                                const endDate = new Date(booking.checkOutDate);
                                if (startDate >= endDate) return sum;
                                const timeDiff = endDate.getTime() - startDate.getTime();
                                const days = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
                                return sum + ((booking.extraBedCharge || 0) * Math.max(0, days));
                              }, 0) || 0 : 0;
                          return totalRate - extraBedCost;
                        })();
                        const extraBedCost = booking.extraBed && booking.extraBedRooms && booking.extraBedRooms.length > 0 
                          ? booking.roomRates?.reduce((sum, room) => {
                              if (!room.extraBed) return sum;
                              const startDate = new Date(room.extraBedStartDate || booking.checkInDate);
                              const endDate = new Date(booking.checkOutDate);
                              if (startDate >= endDate) return sum;
                              const timeDiff = endDate.getTime() - startDate.getTime();
                              const days = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
                              return sum + ((booking.extraBedCharge || 0) * Math.max(0, days));
                            }, 0) || 0 : 0;
                        const serviceTotal = serviceCharges.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
                        const restaurantTotal = restaurantCharges.reduce((sum, order) => sum + (order.amount || 0), 0);
                        const subtotal = baseRoomRate + extraBedCost + serviceTotal + restaurantTotal;
                        const cgstAmount = subtotal * (booking.cgstRate || 0.025);
                        const sgstAmount = subtotal * (booking.sgstRate || 0.025);
                        const grandTotal = subtotal + cgstAmount + sgstAmount;
                        const totalAdvance = booking.advancePayments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
                        return Math.max(0, Math.round((grandTotal - totalAdvance) * 100) / 100);
                      })()}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No advance payments recorded</p>
              )}
              
              {/* Add Payment Form */}
              {showAddPayment && (
                <div className="mt-4 border-t pt-4">
                  <h3 className="text-lg font-medium text-gray-800 mb-3">Add New Payment</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Amount (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={newPayment.amount}
                        onChange={(e) => setNewPayment(prev => ({ ...prev, amount: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter amount"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Payment Mode</label>
                      <select
                        value={newPayment.paymentMode}
                        onChange={(e) => setNewPayment(prev => ({ ...prev, paymentMode: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Mode</option>
                        <option value="Cash">Cash</option>
                        <option value="Card">Card</option>
                        <option value="UPI">UPI</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Online">Online</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Payment Date</label>
                      <input
                        type="date"
                        value={newPayment.paymentDate}
                        onChange={(e) => setNewPayment(prev => ({ ...prev, paymentDate: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Reference/Transaction ID</label>
                      <input
                        type="text"
                        value={newPayment.reference}
                        onChange={(e) => setNewPayment(prev => ({ ...prev, reference: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Transaction ID, Cheque No, etc."
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-600 mb-1">Notes</label>
                      <input
                        type="text"
                        value={newPayment.notes}
                        onChange={(e) => setNewPayment(prev => ({ ...prev, notes: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Additional notes"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 mt-4">
                    <button
                      onClick={handleCancelAddPayment}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                    >
                      <X size={16} className="inline mr-1" /> Cancel
                    </button>
                    <button
                      onClick={handleAddPayment}
                      disabled={!newPayment.amount || !newPayment.paymentMode}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save size={16} className="inline mr-1" /> Add Payment
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <CreditCard className="mr-2 text-blue-600" size={20} />
                Billing Details
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Base Amount:</span>
                  <span className="font-medium">₹{(() => {
                    // Calculate base room rate without extra bed charges
                    const totalRate = booking.taxableAmount || 0;
                    const extraBedCost = booking.extraBed && booking.extraBedRooms && booking.extraBedRooms.length > 0 
                      ? booking.roomRates?.reduce((sum, room) => {
                          if (!room.extraBed) return sum;
                          const startDate = new Date(room.extraBedStartDate || booking.checkInDate);
                          const endDate = new Date(booking.checkOutDate);
                          if (startDate >= endDate) return sum;
                          const timeDiff = endDate.getTime() - startDate.getTime();
                          const days = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
                          return sum + ((booking.extraBedCharge || 0) * Math.max(0, days));
                        }, 0) || 0 : 0;
                    return totalRate - extraBedCost;
                  })()}</span>
                </div>
                {booking.extraBed && booking.extraBedRooms && booking.extraBedRooms.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Extra Bed ({booking.extraBedRooms.join(', ')}):</span>
                    <span className="font-medium">₹{(() => {
                      // Calculate actual extra bed cost based on room rates
                      const extraBedCost = booking.roomRates?.reduce((sum, room) => {
                        if (!room.extraBed) return sum;
                        const startDate = new Date(room.extraBedStartDate || booking.checkInDate);
                        const endDate = new Date(booking.checkOutDate);
                        if (startDate >= endDate) return sum;
                        const timeDiff = endDate.getTime() - startDate.getTime();
                        const days = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
                        return sum + ((booking.extraBedCharge || 0) * Math.max(0, days));
                      }, 0) || 0;
                      return extraBedCost;
                    })()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">CGST ({(booking.cgstRate * 100) || 2.5}%):</span>
                  <span className="font-medium">₹{(() => {
                    // Calculate subtotal: base room rate + extra bed + services (before tax)
                    const baseRoomRate = (() => {
                      const totalRate = booking.taxableAmount || 0;
                      const extraBedCost = booking.extraBed && booking.extraBedRooms && booking.extraBedRooms.length > 0 
                        ? booking.roomRates?.reduce((sum, room) => {
                            if (!room.extraBed) return sum;
                            const startDate = new Date(room.extraBedStartDate || booking.checkInDate);
                            const endDate = new Date(booking.checkOutDate);
                            if (startDate >= endDate) return sum;
                            const timeDiff = endDate.getTime() - startDate.getTime();
                            const days = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
                            return sum + ((booking.extraBedCharge || 0) * Math.max(0, days));
                          }, 0) || 0 : 0;
                      return totalRate - extraBedCost;
                    })();
                    const extraBedCost = booking.extraBed && booking.extraBedRooms && booking.extraBedRooms.length > 0 
                      ? booking.roomRates?.reduce((sum, room) => {
                          if (!room.extraBed) return sum;
                          const startDate = new Date(room.extraBedStartDate || booking.checkInDate);
                          const endDate = new Date(booking.checkOutDate);
                          if (startDate >= endDate) return sum;
                          const timeDiff = endDate.getTime() - startDate.getTime();
                          const days = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
                          return sum + ((booking.extraBedCharge || 0) * Math.max(0, days));
                        }, 0) || 0 : 0;
                    const serviceTotal = serviceCharges.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
                    const restaurantTotal = restaurantCharges.reduce((sum, order) => sum + (order.amount || 0), 0);
                    const subtotal = baseRoomRate + extraBedCost + serviceTotal + restaurantTotal;
                    return (subtotal * (booking.cgstRate || 0.025)).toFixed(2);
                  })()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">SGST ({(booking.sgstRate * 100) || 2.5}%):</span>
                  <span className="font-medium">₹{(() => {
                    // Calculate subtotal: base room rate + extra bed + services (before tax)
                    const baseRoomRate = (() => {
                      const totalRate = booking.taxableAmount || 0;
                      const extraBedCost = booking.extraBed && booking.extraBedRooms && booking.extraBedRooms.length > 0 
                        ? booking.roomRates?.reduce((sum, room) => {
                            if (!room.extraBed) return sum;
                            const startDate = new Date(room.extraBedStartDate || booking.checkInDate);
                            const endDate = new Date(booking.checkOutDate);
                            if (startDate >= endDate) return sum;
                            const timeDiff = endDate.getTime() - startDate.getTime();
                            const days = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
                            return sum + ((booking.extraBedCharge || 0) * Math.max(0, days));
                          }, 0) || 0 : 0;
                      return totalRate - extraBedCost;
                    })();
                    const extraBedCost = booking.extraBed && booking.extraBedRooms && booking.extraBedRooms.length > 0 
                      ? booking.roomRates?.reduce((sum, room) => {
                          if (!room.extraBed) return sum;
                          const startDate = new Date(room.extraBedStartDate || booking.checkInDate);
                          const endDate = new Date(booking.checkOutDate);
                          if (startDate >= endDate) return sum;
                          const timeDiff = endDate.getTime() - startDate.getTime();
                          const days = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
                          return sum + ((booking.extraBedCharge || 0) * Math.max(0, days));
                        }, 0) || 0 : 0;
                    const serviceTotal = serviceCharges.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
                    const restaurantTotal = restaurantCharges.reduce((sum, order) => sum + (order.amount || 0), 0);
                    const subtotal = baseRoomRate + extraBedCost + serviceTotal + restaurantTotal;
                    return (subtotal * (booking.sgstRate || 0.025)).toFixed(2);
                  })()}</span>
                </div>
                {(serviceCharges.length > 0 || restaurantCharges.length > 0) && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Room Service:</span>
                      <span className="font-medium">₹{serviceCharges.reduce((sum, order) => sum + (order.totalAmount || 0), 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Restaurant:</span>
                      <span className="font-medium">₹{restaurantCharges.reduce((sum, order) => sum + (order.amount || 0), 0)}</span>
                    </div>
                  </>
                )}
                <div className="border-t pt-3">
                  <div className="flex justify-between text-xl font-bold text-blue-600">
                    <span>Grand Total:</span>
                    <span>₹{(() => {
                      // Calculate base room rate (without extra bed)
                      const baseRoomRate = (() => {
                        const totalRate = booking.taxableAmount || 0;
                        const extraBedCost = booking.extraBed && booking.extraBedRooms && booking.extraBedRooms.length > 0 
                          ? booking.roomRates?.reduce((sum, room) => {
                              if (!room.extraBed) return sum;
                              const startDate = new Date(room.extraBedStartDate || booking.checkInDate);
                              const endDate = new Date(booking.checkOutDate);
                              if (startDate >= endDate) return sum;
                              const timeDiff = endDate.getTime() - startDate.getTime();
                              const days = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
                              return sum + ((booking.extraBedCharge || 0) * Math.max(0, days));
                            }, 0) || 0 : 0;
                        return totalRate - extraBedCost;
                      })();
                      
                      const extraBedCost = booking.extraBed && booking.extraBedRooms && booking.extraBedRooms.length > 0 
                        ? booking.roomRates?.reduce((sum, room) => {
                            if (!room.extraBed) return sum;
                            const startDate = new Date(room.extraBedStartDate || booking.checkInDate);
                            const endDate = new Date(booking.checkOutDate);
                            if (startDate >= endDate) return sum;
                            const timeDiff = endDate.getTime() - startDate.getTime();
                            const days = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
                            return sum + ((booking.extraBedCharge || 0) * Math.max(0, days));
                          }, 0) || 0 : 0;
                      
                      const serviceTotal = serviceCharges.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
                      const restaurantTotal = restaurantCharges.reduce((sum, order) => sum + (order.amount || 0), 0);
                      
                      // Subtotal = base room + extra bed + services (₹4000 + ₹1000 + ₹80 + ₹90 = ₹5170)
                      const subtotal = baseRoomRate + extraBedCost + serviceTotal + restaurantTotal;
                      
                      // Calculate taxes on subtotal
                      const cgstAmount = subtotal * (booking.cgstRate || 0.025);
                      const sgstAmount = subtotal * (booking.sgstRate || 0.025);
                      
                      // Grand total = subtotal + taxes (₹5170 + ₹129.25 + ₹129.25 = ₹5428.50)
                      const grandTotal = subtotal + cgstAmount + sgstAmount;
                      
                      return Math.round(grandTotal * 100) / 100; // Round to 2 decimal places
                    })()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetails;