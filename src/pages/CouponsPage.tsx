import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { salesApi } from '../api/client';
import { Modal } from '../components/Modal';
import {
  Ticket,
  Plus,
  Search,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Copy,
  DollarSign,
  Percent,
  Hash,
} from 'lucide-react';

interface CouponData {
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_spend: number;
  max_discount?: number | null;
  usage_limit?: number | null;
  is_active: boolean;
}

const emptyCoupon: CouponData = {
  code: '',
  description: '',
  discount_type: 'percentage',
  discount_value: 15,
  min_spend: 0,
  max_discount: null,
  usage_limit: null,
  is_active: true,
};

export function CouponsPage() {
  const { token } = useAuth();
  const toast = useToast();

  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any | null>(null);
  const [formData, setFormData] = useState<CouponData>(emptyCoupon);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const fetchCoupons = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await salesApi.listCoupons(token);
      setCoupons(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch coupons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [token]);

  const openCreateModal = () => {
    setEditingCoupon(null);
    setFormData({ ...emptyCoupon });
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (coupon: any) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description || '',
      discount_type: coupon.discount_type || 'percentage',
      discount_value: coupon.discount_value || 0,
      min_spend: coupon.min_spend || 0,
      max_discount: coupon.max_discount,
      usage_limit: coupon.usage_limit,
      is_active: coupon.is_active ?? true,
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError('');

    try {
      if (editingCoupon?.id) {
        await salesApi.updateCoupon(token, editingCoupon.id, formData);
        toast.success(`Coupon "${formData.code}" updated!`);
      } else {
        await salesApi.createCoupon(token, formData);
        toast.success(`Coupon "${formData.code}" created!`);
      }
      setIsModalOpen(false);
      fetchCoupons();
    } catch (err: any) {
      setError(err.message || 'Failed to save coupon');
      toast.error(err.message || 'Failed to save coupon');
    }
  };

  const toggleStatus = async (coupon: any) => {
    if (!token) return;
    try {
      await salesApi.updateCoupon(token, coupon.id, { is_active: !coupon.is_active });
      toast.success(`Coupon ${coupon.code} marked as ${!coupon.is_active ? 'Active' : 'Inactive'}`);
      fetchCoupons();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  const handleDelete = async (id: number) => {
    if (!token) return;
    try {
      await salesApi.deleteCoupon(token, id);
      setDeleteConfirm(null);
      fetchCoupons();
      toast.success('Coupon deleted successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete coupon');
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Copied code "${code}" to clipboard!`);
  };

  const filtered = coupons.filter(
    (c) =>
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Ticket className="w-8 h-8 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <h1 className="text-2xl sm:text-3xl font-bold text-black dark:text-black">Coupons & Promo Codes</h1>
          </div>
          <p className="text-gray-500 mt-1 text-sm">
            Create and manage customer discount vouchers, promo codes, and usage limits
          </p>
        </div>
        <button onClick={openCreateModal} className="btn-primary">
          <Plus className="w-4 h-4" />
          Create Coupon
        </button>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-full text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 shadow-sm transition-all"
            placeholder="Search coupons by code or description..."
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-emerald-900/30 border-t-emerald-900 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Ticket className="w-12 h-12 mx-auto mb-3 opacity-30 text-emerald-800" />
            <p className="font-bold text-gray-800 text-base">No Coupons Found</p>
            <p className="text-xs text-gray-500 mt-1">
              Create your first promotional discount voucher for customers.
            </p>
            <button onClick={openCreateModal} className="btn-primary text-xs mt-4">
              + Add First Coupon
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50/50">
                  <th className="px-6 py-4">Promo Code</th>
                  <th className="px-6 py-4">Discount</th>
                  <th className="px-6 py-4">Min Spend</th>
                  <th className="px-6 py-4">Usage</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filtered.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-gray-50/60 transition-colors">
                    {/* Code */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-gray-900 text-base px-2.5 py-1 bg-gray-100 border border-gray-200 rounded-lg">
                          {coupon.code}
                        </span>
                        <button
                          onClick={() => copyCode(coupon.code)}
                          className="text-gray-400 hover:text-emerald-800 p-1 transition-colors"
                          title="Copy Code"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {coupon.description && (
                        <p className="text-xs text-gray-400 mt-1">{coupon.description}</p>
                      )}
                    </td>

                    {/* Discount */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full font-bold text-xs">
                        {coupon.discount_type === 'percentage' ? (
                          <>
                            <Percent className="w-3 h-3" />
                            {coupon.discount_value}% OFF
                          </>
                        ) : (
                          <>
                            <DollarSign className="w-3 h-3" />
                            ${coupon.discount_value.toFixed(2)} OFF
                          </>
                        )}
                      </span>
                    </td>

                    {/* Min Spend */}
                    <td className="px-6 py-4 text-gray-600 font-medium text-xs">
                      {coupon.min_spend > 0 ? `$${coupon.min_spend.toFixed(2)}` : 'No minimum'}
                    </td>

                    {/* Usage */}
                    <td className="px-6 py-4 text-xs text-gray-600">
                      <span className="font-semibold text-gray-900">{coupon.used_count || 0}</span>
                      {coupon.usage_limit ? ` / ${coupon.usage_limit}` : ' uses (unlimited)'}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleStatus(coupon)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 transition-all ${
                          coupon.is_active
                            ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {coupon.is_active ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-700" /> Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-gray-400" /> Inactive
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(coupon)}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-gray-600 hover:text-emerald-800 hover:bg-emerald-50 transition-all"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {deleteConfirm === coupon.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(coupon.id)}
                              className="px-2.5 py-1 text-xs font-semibold text-white bg-red-600 rounded-full hover:bg-red-700"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="px-2 py-1 text-xs text-gray-500 rounded-full hover:bg-gray-100"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(coupon.id)}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCoupon ? 'Edit Coupon' : 'Create Coupon Voucher'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-red-50 text-red-600 text-xs font-medium border border-red-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Coupon Code *</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm font-mono uppercase focus:outline-none focus:border-emerald-800"
                placeholder="e.g. BOOKWORM15"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Discount Type</label>
              <select
                value={formData.discount_type}
                onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as any })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-emerald-800"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount ($)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Value {formData.discount_type === 'percentage' ? '(%)' : '($)'} *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.1"
                required
                value={formData.discount_value}
                onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-emerald-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Min Spend ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.min_spend}
                onChange={(e) => setFormData({ ...formData, min_spend: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-emerald-800"
                placeholder="0 = No min"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Usage Limit</label>
              <input
                type="number"
                min="1"
                value={formData.usage_limit ?? ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    usage_limit: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-emerald-800"
                placeholder="Unlimited"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-emerald-800"
              placeholder="e.g. 15% discount for new club members"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-800 focus:ring-emerald-800 accent-emerald-800"
              />
              <span className="text-sm text-gray-700 font-medium">Enable coupon immediately</span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {editingCoupon ? 'Save Changes' : 'Create Coupon'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
