import { useState, useEffect } from 'react';

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  userId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  subtotal: number;
  discount: number;
  total: number;
  status: string;
  paymentStatus: string;
  paymentId?: string;
  referralCode?: string;
  createdAt: string;
  items: OrderItem[];
}

const OrderStatus = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled'
};

const PaymentStatus = {
  pending: 'Pending',
  paid: 'Paid',
  failed: 'Failed',
  refunded: 'Refunded'
};

// API functions
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

async function apiCall(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.statusText}`);
  }

  return response.json();
}

const ordersApi = {
  getOrders: async (params?: { status?: string; search?: string; userId?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.search) searchParams.append('search', params.search);
    if (params?.userId) searchParams.append('userId', params.userId);
    
    return apiCall(`/api/orders?${searchParams.toString()}`);
  },

  getUserOrders: async () => {
    return apiCall('$/api/orders/user');
  },

  createOrder: async (orderData: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    sessionId?: string;
    userId?: string;
    referralCode?: string;
  }) => {
    return apiCall(`${import.meta.env.VITE_API_BASE_URL}/api/orders`, {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  updateOrderStatus: async (id: string, status: string) => {
    return apiCall(`${import.meta.env.VITE_API_BASE_URL}/api/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },
};

function OrderCard({ order, isAdmin = false, onStatusUpdate }: { 
  order: Order; 
  isAdmin?: boolean; 
  onStatusUpdate?: (id: string, status: string) => void;
}) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    if (!onStatusUpdate) return;
    setIsUpdating(true);
    try {
      await onStatusUpdate(order.id, newStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold">Order #{order.id.slice(-8)}</h3>
          <p className="text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-green-600">₹{order.total}</p>
          <div className="flex gap-2 mt-2">
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              order.status === 'delivered' ? 'bg-green-100 text-green-800' :
              order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
              order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {OrderStatus[order.status as keyof typeof OrderStatus] || order.status}
            </span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
              order.paymentStatus === 'failed' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {PaymentStatus[order.paymentStatus as keyof typeof PaymentStatus] || order.paymentStatus}
            </span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div>
          <h4 className="font-medium mb-2">Customer Details</h4>
          <p className="text-sm text-gray-600">{order.customerName}</p>
          <p className="text-sm text-gray-600">{order.customerEmail}</p>
          <p className="text-sm text-gray-600">{order.customerPhone}</p>
        </div>
        <div>
          <h4 className="font-medium mb-2">Delivery Address</h4>
          <p className="text-sm text-gray-600">
            {order.address}, {order.city}, {order.state} - {order.pincode}
          </p>
        </div>
      </div>

      <div className="mb-4">
        <h4 className="font-medium mb-2">Order Items ({order.items.length})</h4>
        <div className="space-y-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-100">
              <div className="flex items-center gap-3">
                {item.productImage && (
                  <img src={item.productImage} alt={item.productName} className="w-12 h-12 object-cover rounded" />
                )}
                <div>
                  <p className="font-medium">{item.productName}</p>
                  <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                </div>
              </div>
              <p className="font-medium">₹{item.price * item.quantity}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          <p>Subtotal: ₹{order.subtotal}</p>
          {order.discount > 0 && <p>Discount: -₹{order.discount}</p>}
          {order.referralCode && <p>Referral Code: {order.referralCode}</p>}
        </div>
        
        {isAdmin && (
          <div className="flex gap-2">
            <select 
              value={order.status} 
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={isUpdating}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            >
              {Object.entries(OrderStatus).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}

function CreateOrderForm({ onOrderCreated }: { onOrderCreated: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    referralCode: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      await ordersApi.createOrder({
        ...formData,
        sessionId: 'demo-session-' + Date.now()
      });
      setIsOpen(false);
      setFormData({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        referralCode: ''
      });
      onOrderCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create order');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Create Test Order
      </button>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">Create New Order</h3>
      <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="Customer Name"
          value={formData.customerName}
          onChange={(e) => setFormData({...formData, customerName: e.target.value})}
          className="px-3 py-2 border border-gray-300 rounded"
          required
        />
        <input
          type="email"
          placeholder="Customer Email"
          value={formData.customerEmail}
          onChange={(e) => setFormData({...formData, customerEmail: e.target.value})}
          className="px-3 py-2 border border-gray-300 rounded"
          required
        />
        <input
          type="tel"
          placeholder="Customer Phone"
          value={formData.customerPhone}
          onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
          className="px-3 py-2 border border-gray-300 rounded"
          required
        />
        <input
          type="text"
          placeholder="Address"
          value={formData.address}
          onChange={(e) => setFormData({...formData, address: e.target.value})}
          className="px-3 py-2 border border-gray-300 rounded"
          required
        />
        <input
          type="text"
          placeholder="City"
          value={formData.city}
          onChange={(e) => setFormData({...formData, city: e.target.value})}
          className="px-3 py-2 border border-gray-300 rounded"
          required
        />
        <input
          type="text"
          placeholder="State"
          value={formData.state}
          onChange={(e) => setFormData({...formData, state: e.target.value})}
          className="px-3 py-2 border border-gray-300 rounded"
          required
        />
        <input
          type="text"
          placeholder="Pincode"
          value={formData.pincode}
          onChange={(e) => setFormData({...formData, pincode: e.target.value})}
          className="px-3 py-2 border border-gray-300 rounded"
          required
        />
        <input
          type="text"
          placeholder="Referral Code (Optional)"
          value={formData.referralCode}
          onChange={(e) => setFormData({...formData, referralCode: e.target.value})}
          className="px-3 py-2 border border-gray-300 rounded"
        />
        
        <div className="md:col-span-2 flex gap-2">
          <button 
            type="submit" 
            disabled={isLoading}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            {isLoading ? 'Creating...' : 'Create Order'}
          </button>
          <button 
            type="button" 
            onClick={() => setIsOpen(false)}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
        
        {error && (
          <div className="md:col-span-2 text-red-600 text-sm">
            Error: {error}
          </div>
        )}
      </form>
    </div>
  );
}

export default function OrdersPage() {
  const [view, setView] = useState<'admin' | 'user'>('admin');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      let data;
      if (view === 'admin') {
        data = await ordersApi.getOrders({
          status: statusFilter === 'all' ? undefined : statusFilter,
          search: searchTerm || undefined
        });
      } else {
        data = await ordersApi.getUserOrders();
      }
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await ordersApi.updateOrderStatus(id, status);
      fetchOrders();
    } catch (err) {
      console.error('Failed to update order status:', err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [view, statusFilter, searchTerm]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Orders Management</h1>
          
          {/* View Toggle */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setView('admin')}
              className={`px-4 py-2 rounded ${
                view === 'admin' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300'
              }`}
            >
              Admin View (All Orders)
            </button>
            <button
              onClick={() => setView('user')}
              className={`px-4 py-2 rounded ${
                view === 'user' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300'
              }`}
            >
              User View (My Orders)
            </button>
          </div>

          {/* Filters (Admin only) */}
          {view === 'admin' && (
            <div className="flex gap-4 mb-4">
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded"
              >
                <option value="all">All Status</option>
                {Object.entries(OrderStatus).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              
              <input
                type="text"
                placeholder="Search by customer name, email, or phone"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded flex-1 max-w-md"
              />
            </div>
          )}

          {/* Create Order Form (Admin only) */}
          {view === 'admin' && (
            <CreateOrderForm onOrderCreated={fetchOrders} />
          )}
        </div>

        {/* Orders List */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading orders...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600">Error: {error}</p>
            <button 
              onClick={fetchOrders}
              className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : orders && orders.length > 0 ? (
          <div>
            <p className="text-gray-600 mb-4">
              {view === 'admin' ? `${orders.length} orders found` : `You have ${orders.length} orders`}
            </p>
            {orders.map((order) => (
              <OrderCard 
                key={order.id} 
                order={order} 
                isAdmin={view === 'admin'}
                onStatusUpdate={view === 'admin' ? handleStatusUpdate : undefined}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600">
              {view === 'admin' ? 'No orders found' : 'You have no orders yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}