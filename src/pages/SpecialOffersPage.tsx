import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { salesApi, booksApi } from '../api/client';
import { Modal } from '../components/Modal';
import {
  Gift,
  Plus,
  Search,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  Percent,
  Sparkles,
} from 'lucide-react';

interface SpecialOfferData {
  title: string;
  subtitle: string;
  badge: string;
  discount_percent: number;
  image: string;
  book_ids: number[];
  link_url: string;
  is_active: boolean;
}

const emptyOffer: SpecialOfferData = {
  title: '',
  subtitle: '',
  badge: 'Special Offer',
  discount_percent: 15,
  image: '',
  book_ids: [],
  link_url: '/special-offers',
  is_active: true,
};

export function SpecialOffersPage() {
  const { token } = useAuth();
  const toast = useToast();

  const [offers, setOffers] = useState<any[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<any | null>(null);
  const [formData, setFormData] = useState<SpecialOfferData>(emptyOffer);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const fetchOffers = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await salesApi.listSpecialOffers(token);
      setOffers(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch special offers');
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
    fetchOffers();
    fetchBooks();
  }, [token]);

  const openCreateModal = () => {
    setEditingOffer(null);
    setFormData({ ...emptyOffer });
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (offer: any) => {
    setEditingOffer(offer);
    setFormData({
      title: offer.title,
      subtitle: offer.subtitle || '',
      badge: offer.badge || 'Special Offer',
      discount_percent: offer.discount_percent || 0,
      image: offer.image || '',
      book_ids: offer.book_ids || [],
      link_url: offer.link_url || '/special-offers',
      is_active: offer.is_active ?? true,
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError('');

    try {
      if (editingOffer?.id) {
        await salesApi.updateSpecialOffer(token, editingOffer.id, formData);
        toast.success(`Special Offer "${formData.title}" updated!`);
      } else {
        await salesApi.createSpecialOffer(token, formData);
        toast.success(`Special Offer "${formData.title}" created!`);
      }
      setIsModalOpen(false);
      fetchOffers();
    } catch (err: any) {
      setError(err.message || 'Failed to save special offer');
      toast.error(err.message || 'Failed to save');
    }
  };

  const toggleStatus = async (offer: any) => {
    if (!token) return;
    try {
      await salesApi.updateSpecialOffer(token, offer.id, { is_active: !offer.is_active });
      toast.success(`Offer marked as ${!offer.is_active ? 'Active' : 'Inactive'}`);
      fetchOffers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  const handleDelete = async (id: number) => {
    if (!token) return;
    try {
      await salesApi.deleteSpecialOffer(token, id);
      setDeleteConfirm(null);
      fetchOffers();
      toast.success('Special offer deleted successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete offer');
    }
  };

  const filteredOffers = offers.filter(
    (o) =>
      o.title.toLowerCase().includes(search.toLowerCase()) ||
      (o.subtitle && o.subtitle.toLowerCase().includes(search.toLowerCase())) ||
      (o.badge && o.badge.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Gift className="w-8 h-8 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <h1 className="text-2xl sm:text-3xl font-bold text-black dark:text-black">Special Offers</h1>
          </div>
          <p className="text-gray-500 mt-1 text-sm">
            Manage featured bundles, member deals, and promotional perks shown on frontend
          </p>
        </div>
        <button onClick={openCreateModal} className="btn-primary">
          <Plus className="w-4 h-4" />
          Add Special Offer
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-full text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 shadow-sm transition-all"
            placeholder="Search special offers by title, badge, or subtitle..."
          />
        </div>
      </div>

      {/* Offers Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-emerald-900/30 border-t-emerald-900 rounded-full animate-spin" />
        </div>
      ) : filteredOffers.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center text-gray-500 shadow-sm">
          <Gift className="w-12 h-12 mx-auto mb-3 opacity-30 text-emerald-800" />
          <p className="font-bold text-gray-800 text-base">No Special Offers Found</p>
          <p className="text-xs text-gray-500 mt-1">
            Create an exclusive bundle or promotional offer to showcase on the frontend.
          </p>
          <button onClick={openCreateModal} className="btn-primary text-xs mt-4">
            + Create First Offer
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredOffers.map((offer) => (
            <div
              key={offer.id}
              className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    {offer.badge || 'Offer'}
                  </span>
                  <button
                    onClick={() => toggleStatus(offer)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 transition-all ${
                      offer.is_active
                        ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {offer.is_active ? (
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

                <h3 className="font-bold text-gray-900 text-lg leading-snug">{offer.title}</h3>
                {offer.subtitle && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{offer.subtitle}</p>
                )}

                {offer.discount_percent > 0 && (
                  <div className="mt-3 inline-flex items-center gap-1 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-900 rounded-full text-xs font-bold">
                    <Percent className="w-3 h-3" />
                    Up to {offer.discount_percent}% Off
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs">
                <span className="text-gray-400 truncate max-w-[140px]">{offer.link_url}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(offer)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-gray-600 hover:text-emerald-800 hover:bg-emerald-50 transition-all"
                    title="Edit"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  {deleteConfirm === offer.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(offer.id)}
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
                      onClick={() => setDeleteConfirm(offer.id)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingOffer ? 'Edit Special Offer' : 'Create Special Offer'}
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
            <label className="block text-xs font-semibold text-gray-700 mb-1">Offer Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-emerald-800"
              placeholder="e.g. Weekend Book Bundle Special"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Subtitle / Description</label>
            <textarea
              rows={2}
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-emerald-800 resize-none"
              placeholder="e.g. Buy 2 get 1 free on selected bestsellers"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Badge Tag</label>
              <input
                type="text"
                value={formData.badge}
                onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-emerald-800"
                placeholder="e.g. Exclusive Bundle"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Discount %</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.discount_percent}
                onChange={(e) => setFormData({ ...formData, discount_percent: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-emerald-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Frontend Destination Link</label>
            <input
              type="text"
              value={formData.link_url}
              onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-emerald-800"
              placeholder="/special-offers"
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
              <span className="text-sm text-gray-700 font-medium">Activate this offer immediately</span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {editingOffer ? 'Save Changes' : 'Create Offer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
