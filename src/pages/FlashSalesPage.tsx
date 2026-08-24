import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { salesApi, booksApi } from '../api/client';
import { Modal } from '../components/Modal';
import {
  Zap,
  Plus,
  Search,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  DollarSign,
  Package,
} from 'lucide-react';

interface FlashSaleData {
  title: string;
  book_id?: number | null;
  flash_price: number;
  original_price: number;
  stock_limit: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

const getDefaultDates = () => {
  const start = new Date();
  const end = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours later
  return {
    start_time: start.toISOString().slice(0, 16),
    end_time: end.toISOString().slice(0, 16),
  };
};

const emptyFlashSale: FlashSaleData = {
  title: '24-Hour Flash Sale',
  book_id: null,
  flash_price: 9.99,
  original_price: 19.99,
  stock_limit: 30,
  ...getDefaultDates(),
  is_active: true,
};

export function FlashSalesPage() {
  const { token } = useAuth();
  const toast = useToast();

  const [flashSales, setFlashSales] = useState<any[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<any | null>(null);
  const [formData, setFormData] = useState<FlashSaleData>(emptyFlashSale);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const fetchFlashSales = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await salesApi.listFlashSales(token);
      setFlashSales(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch flash sales');
    } finally {
      setLoading(false);
    }
  };

  const fetchBooks = async () => {
    if (!token) return;
    try {
      const res = await booksApi.list(token, { per_page: '100' });
      setBooks(res.books || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchFlashSales();
    fetchBooks();
  }, [token]);

  const openCreateModal = () => {
    setEditingSale(null);
    setFormData({ ...emptyFlashSale, ...getDefaultDates() });
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (sale: any) => {
    setEditingSale(sale);
    setFormData({
      title: sale.title,
      book_id: sale.book_id,
      flash_price: sale.flash_price || 0,
      original_price: sale.original_price || 0,
      stock_limit: sale.stock_limit || 50,
      start_time: sale.start_time ? new Date(sale.start_time).toISOString().slice(0, 16) : '',
      end_time: sale.end_time ? new Date(sale.end_time).toISOString().slice(0, 16) : '',
      is_active: sale.is_active ?? true,
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleBookSelect = (bookIdStr: string) => {
    const bookId = parseInt(bookIdStr);
    const selected = books.find((b) => b.id === bookId);
    if (selected) {
      setFormData((prev) => ({
        ...prev,
        book_id: selected.id,
        original_price: selected.price,
        flash_price: Math.round(selected.price * 0.6 * 100) / 100, // default 40% discount
      }));
    } else {
      setFormData((prev) => ({ ...prev, book_id: null }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError('');

    try {
      const payload = {
        ...formData,
        start_time: new Date(formData.start_time).toISOString(),
        end_time: new Date(formData.end_time).toISOString(),
      };

      if (editingSale?.id) {
        await salesApi.updateFlashSale(token, editingSale.id, payload);
        toast.success(`Flash Sale "${formData.title}" updated!`);
      } else {
        await salesApi.createFlashSale(token, payload);
        toast.success(`Flash Sale "${formData.title}" created!`);
      }
      localStorage.setItem('sales_updated_at', Date.now().toString());
      setIsModalOpen(false);
      fetchFlashSales();
    } catch (err: any) {
      setError(err.message || 'Failed to save flash sale');
      toast.error(err.message || 'Failed to save');
    }
  };

  const toggleStatus = async (sale: any) => {
    if (!token) return;
    try {
      await salesApi.updateFlashSale(token, sale.id, { is_active: !sale.is_active });
      localStorage.setItem('sales_updated_at', Date.now().toString());
      toast.success(`Flash sale marked as ${!sale.is_active ? 'Active' : 'Inactive'}`);
      fetchFlashSales();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  const handleDelete = async (id: number) => {
    if (!token) return;
    try {
      await salesApi.deleteFlashSale(token, id);
      localStorage.setItem('sales_updated_at', Date.now().toString());
      setDeleteConfirm(null);
      fetchFlashSales();
      toast.success('Flash sale deleted successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete flash sale');
    }
  };

  const filtered = flashSales.filter((s) => s.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Zap className="w-8 h-8 text-amber-500 fill-amber-500 shrink-0" />
            <h1 className="text-2xl sm:text-3xl font-bold text-black dark:text-black">Flash Sales</h1>
          </div>
          <p className="text-gray-500 mt-1 text-sm">
            Launch countdown deals, high-urgency limited stock sales, and real-time flash pricing
          </p>
        </div>
        <button onClick={openCreateModal} className="btn-primary">
          <Plus className="w-4 h-4" />
          Create Flash Sale
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
            placeholder="Search flash sales by title..."
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-emerald-900/30 border-t-emerald-900 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center text-gray-500 shadow-sm">
          <Zap className="w-12 h-12 mx-auto mb-3 opacity-30 text-emerald-800" />
          <p className="font-bold text-gray-800 text-base">No Flash Sales Scheduled</p>
          <p className="text-xs text-gray-500 mt-1">
            Create an urgent flash sale deal with a countdown timer to drive customer conversions.
          </p>
          <button onClick={openCreateModal} className="btn-primary text-xs mt-4">
            + Schedule Flash Sale
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((sale) => {
            const book = books.find((b) => b.id === sale.book_id);
            const discountPercent = sale.original_price
              ? Math.round((1 - sale.flash_price / sale.original_price) * 100)
              : 0;

            return (
              <div
                key={sale.id}
                className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-3 py-1 bg-amber-500 text-white rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm">
                      <Zap className="w-3 h-3 fill-white" />
                      {discountPercent > 0 ? `-${discountPercent}%` : 'Flash Deal'}
                    </span>
                    <button
                      onClick={() => toggleStatus(sale)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 transition-all ${
                        sale.is_active
                          ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {sale.is_active ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-700" /> Active
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 text-gray-400" /> Inactive
                        </>
                      )}
                    </button>
                  </div>

                  <h3 className="font-bold text-gray-900 text-lg leading-snug">{sale.title}</h3>
                  {book && (
                    <p className="text-xs text-emerald-800 font-semibold mt-1 truncate">
                      Book: {book.title}
                    </p>
                  )}

                  {/* Price Comparison */}
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-emerald-800">
                      ${sale.flash_price.toFixed(2)}
                    </span>
                    <span className="text-xs text-gray-400 line-through">
                      ${sale.original_price.toFixed(2)}
                    </span>
                  </div>

                  {/* Stock & Timer info */}
                  <div className="mt-3 space-y-1.5 text-xs text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-gray-400" />
                      <span>
                        Stock: <strong>{sale.stock_limit} units</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span className="truncate">
                        Ends: {new Date(sale.end_time).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs">
                  <span className="text-gray-400">ID #{sale.id}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(sale)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-gray-600 hover:text-emerald-800 hover:bg-emerald-50 transition-all"
                      title="Edit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {deleteConfirm === sale.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(sale.id)}
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
                        onClick={() => setDeleteConfirm(sale.id)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSale ? 'Edit Flash Sale' : 'Schedule Flash Sale'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-red-50 text-red-600 text-xs font-medium border border-red-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Sale Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-emerald-800"
              placeholder="e.g. 24-Hour Bestseller Flash Rush"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Target Book (Optional)</label>
            <select
              value={formData.book_id || ''}
              onChange={(e) => handleBookSelect(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-emerald-800"
            >
              <option value="">-- Select a Book --</option>
              {books.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title} (${b.price})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Original Price ($) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.original_price}
                onChange={(e) => setFormData({ ...formData, original_price: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-emerald-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Flash Price ($) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.flash_price}
                onChange={(e) => setFormData({ ...formData, flash_price: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-emerald-800 font-bold text-emerald-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Stock Limit</label>
              <input
                type="number"
                min="1"
                value={formData.stock_limit}
                onChange={(e) => setFormData({ ...formData, stock_limit: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-emerald-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Start Date & Time *</label>
              <input
                type="datetime-local"
                required
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-emerald-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">End Date & Time *</label>
              <input
                type="datetime-local"
                required
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-emerald-800"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-800 focus:ring-emerald-800 accent-emerald-800"
              />
              <span className="text-sm text-gray-700 font-medium">Activate flash sale immediately</span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {editingSale ? 'Save Changes' : 'Schedule Sale'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
