import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ordersApi } from '../api/client';
import { ShoppingCart, Package, ChevronDown, CheckCircle2, Clock, CreditCard } from 'lucide-react';
import { formatCambodiaTime } from '../utils/date';

const STATUS_OPTIONS = [
  { value: 'pending', label: '1. Order Placed', color: 'bg-amber-50 text-amber-800 border-amber-200' },
  { value: 'processing', label: '2. Package Prepared', color: 'bg-blue-50 text-blue-800 border-blue-200' },
  { value: 'delivered', label: '3. Delivery', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-50 text-red-800 border-red-200' },
];

export function OrdersPage() {
  const { token } = useAuth();
  const toast = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchOrders = () => {
    if (!token) return;
    setLoading(true);
    ordersApi.list(token)
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, [token]);

  const updateStatus = async (orderId: number, newStatus: string) => {
    if (!token) return;
    setUpdatingId(orderId);
    try {
      const updated = await ordersApi.updateStatus(token, orderId, newStatus);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: updated.status } : o));
      toast.success(`Order #${orderId} status updated to "${newStatus}"!`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update order status');
    } finally {
      setUpdatingId(null);
    }
  };

  const updatePaymentStatus = async (orderId: number, newPaymentStatus: string) => {
    if (!token) return;
    setUpdatingId(orderId);
    try {
      const updated = await ordersApi.updatePaymentStatus(token, orderId, newPaymentStatus);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, payment_status: updated.payment_status } : o));
      toast.success(`Order #${orderId} marked as "${newPaymentStatus.toUpperCase()}"!`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update payment status');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusStyle = (status: string) => {
    return STATUS_OPTIONS.find(s => s.value === status)?.color || STATUS_OPTIONS[0].color;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Orders & Delivery</h1>
          </div>
          <p className="text-gray-500 mt-1">{orders.length} total customer orders</p>
        </div>

        <button
          onClick={fetchOrders}
          className="px-4 py-2 bg-white dark:bg-dark-card border border-gray-200 dark:border-white/10 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 transition-all cursor-pointer shadow-xs"
        >
          Refresh Orders
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-emerald-900/30 border-t-emerald-900 rounded-full animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-3xl px-6 py-16 text-center text-gray-500 shadow-sm">
          <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30 text-emerald-800" />
          <p className="font-semibold text-gray-800">No orders yet</p>
          <p className="text-xs text-gray-500 mt-1">Orders will appear here once customers place them</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {orders.map((order) => {
            const isPaid = (order.payment_status || '').toLowerCase() === 'paid';
            return (
              <div
                key={order.id}
                className="bg-white border border-gray-100 rounded-3xl overflow-hidden hover:border-emerald-200 transition-all hover:shadow-md shadow-sm"
              >
                {/* Order Header */}
                <div
                  className="flex items-center justify-between px-6 py-4.5 cursor-pointer bg-white hover:bg-gray-50/50 transition-colors"
                  onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
                      isPaid ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
                    }`}>
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-bold text-gray-900">Order #{order.id}</span>
                        
                        {/* Paid / Unpaid Badge */}
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                          isPaid
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}>
                          {isPaid ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                          {isPaid ? 'PAID' : 'UNPAID'}
                        </span>

                        {/* Order Fulfillment Status */}
                        <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold border ${getStatusStyle(order.status)}`}>
                          {order.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 font-medium">
                        {order.user?.name || 'Customer'} • {order.payment_method?.toUpperCase() || 'KHQR'} • {formatCambodiaTime(order.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-bold text-gray-900">${order.total.toFixed(2)}</span>
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                      <ChevronDown className={`w-4 h-4 transition-transform ${expandedOrder === order.id ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedOrder === order.id && (
                  <div className="px-6 pb-6 border-t border-gray-100 pt-5 animate-fade-in space-y-5 bg-gray-50/30">
                    {/* Payment Info Card */}
                    <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-xs space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <CreditCard className="w-5 h-5 text-emerald-700" />
                          <div>
                            <p className="text-xs font-bold text-gray-900">
                              Payment: {order.payment_method?.toUpperCase() || 'KHQR'} ({isPaid ? 'Paid' : 'Unpaid'})
                            </p>
                            {order.tran_id && (
                              <p className="text-[11px] font-mono text-gray-500 mt-0.5">
                                Transaction ID: {order.tran_id}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Payment Status Switcher */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updatePaymentStatus(order.id, 'paid')}
                            disabled={updatingId === order.id || isPaid}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              isPaid
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-gray-100 text-gray-600 hover:bg-emerald-100 hover:text-emerald-800'
                            } disabled:opacity-50`}
                          >
                            ✓ Set Paid
                          </button>
                          <button
                            onClick={() => updatePaymentStatus(order.id, 'unpaid')}
                            disabled={updatingId === order.id || !isPaid}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              !isPaid
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'bg-gray-100 text-gray-600 hover:bg-amber-100 hover:text-amber-800'
                            } disabled:opacity-50`}
                          >
                            ⏳ Set Unpaid
                          </button>
                        </div>
                      </div>

                      {/* Payment Slip / Receipt Image */}
                      {order.payment_receipt && (
                        <div className="mt-2 pt-3 border-t border-gray-100">
                          <p className="text-xs font-bold text-gray-700 mb-2">Customer Payment Receipt:</p>
                          <a
                            href={order.payment_receipt}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block"
                          >
                            <img
                              src={order.payment_receipt}
                              alt="Payment Receipt Slip"
                              className="max-h-56 rounded-xl border border-gray-200 object-contain shadow-xs hover:opacity-95 cursor-zoom-in bg-white"
                            />
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Order Items */}
                    {order.items?.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Order Items for Delivery</p>
                        {order.items.map((item: any) => (
                          <div key={item.id} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-2xl shadow-sm">
                            {item.book?.image && (
                              <img
                                src={item.book.image}
                                alt={item.book?.title}
                                className="w-9 h-12 rounded-lg object-cover bg-gray-50"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">{item.book?.title || `Book #${item.book_id}`}</p>
                              <p className="text-xs text-gray-500 font-medium">{item.selected_format} • Qty: {item.quantity}</p>
                            </div>
                            <span className="text-sm font-bold text-gray-900">${(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Status Update for Delivery */}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2.5">Update Delivery Status</p>
                      <div className="flex flex-wrap gap-2">
                        {STATUS_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => updateStatus(order.id, opt.value)}
                            disabled={updatingId === order.id || order.status === opt.value}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                              order.status === opt.value
                                ? opt.color + ' ring-2 ring-emerald-800/30 shadow-sm'
                                : 'border-gray-200 bg-white text-gray-600 hover:text-emerald-900 hover:border-emerald-800'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
