import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { salesApi, categoriesApi } from '../api/client';
import { Modal } from '../components/Modal';
import {
  Megaphone,
  Plus,
  Search,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';

interface CampaignData {
  title: string;
  description: string;
  discount_percent: number;
  category: string;
  banner_image: string;
  bg_gradient: string;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
}

const emptyCampaign: CampaignData = {
  title: '',
  description: '',
  discount_percent: 20,
  category: 'all',
  banner_image: '',
  bg_gradient: 'from-amber-950 to-emerald-950',
  is_active: true,
};

export function CampaignsPage() {
  const { token } = useAuth();
  const toast = useToast();

  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<any | null>(null);
  const [formData, setFormData] = useState<CampaignData>(emptyCampaign);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const fetchCampaigns = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await salesApi.listCampaigns(token);
      setCampaigns(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch campaigns');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    if (!token) return;
    try {
      const data = await categoriesApi.list(token);
      setCategories(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchCampaigns();
    fetchCategories();
  }, [token]);

  const openCreateModal = () => {
    setEditingCampaign(null);
    setFormData({ ...emptyCampaign });
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (camp: any) => {
    setEditingCampaign(camp);
    setFormData({
      title: camp.title,
      description: camp.description || '',
      discount_percent: camp.discount_percent || 20,
      category: camp.category || 'all',
      banner_image: camp.banner_image || '',
      bg_gradient: camp.bg_gradient || 'from-amber-950 to-emerald-950',
      is_active: camp.is_active ?? true,
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError('');

    try {
      if (editingCampaign?.id) {
        await salesApi.updateCampaign(token, editingCampaign.id, formData);
        toast.success(`Campaign "${formData.title}" updated!`);
      } else {
        await salesApi.createCampaign(token, formData);
        toast.success(`Campaign "${formData.title}" created!`);
      }
      localStorage.setItem('sales_updated_at', Date.now().toString());
      setIsModalOpen(false);
      fetchCampaigns();
    } catch (err: any) {
      setError(err.message || 'Failed to save campaign');
      toast.error(err.message || 'Failed to save');
    }
  };

  const toggleStatus = async (camp: any) => {
    if (!token) return;
    try {
      await salesApi.updateCampaign(token, camp.id, { is_active: !camp.is_active });
      localStorage.setItem('sales_updated_at', Date.now().toString());
      toast.success(`Campaign marked as ${!camp.is_active ? 'Active' : 'Inactive'}`);
      fetchCampaigns();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  const handleDelete = async (id: number) => {
    if (!token) return;
    try {
      await salesApi.deleteCampaign(token, id);
      localStorage.setItem('sales_updated_at', Date.now().toString());
      setDeleteConfirm(null);
      fetchCampaigns();
      toast.success('Campaign deleted successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete campaign');
    }
  };

  const filtered = campaigns.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(search.toLowerCase())) ||
      (c.category && c.category.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Megaphone className="w-8 h-8 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <h1 className="text-2xl sm:text-3xl font-bold text-black dark:text-black">Discount Campaigns</h1>
          </div>
          <p className="text-gray-500 mt-1 text-sm">
            Launch seasonal promo banners, category-wide percentage discounts, and marketing campaigns
          </p>
        </div>
        <button onClick={openCreateModal} className="btn-primary">
          <Plus className="w-4 h-4" />
          Create Campaign
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
            placeholder="Search campaigns by title, category, or description..."
          />
        </div>
      </div>

      {/* Campaigns Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-emerald-900/30 border-t-emerald-900 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center text-gray-500 shadow-sm">
          <Megaphone className="w-12 h-12 mx-auto mb-3 opacity-30 text-emerald-800" />
          <p className="font-bold text-gray-800 text-base">No Campaigns Found</p>
          <p className="text-xs text-gray-500 mt-1">
            Start a seasonal campaign or promotional festival for your bookstore.
          </p>
          <button onClick={openCreateModal} className="btn-primary text-xs mt-4">
            + Launch First Campaign
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((camp) => (
            <div
              key={camp.id}
              className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-3 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-700" />
                    {camp.discount_percent}% OFF
                  </span>
                  <button
                    onClick={() => toggleStatus(camp)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 transition-all ${
                      camp.is_active
                        ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {camp.is_active ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-700" /> Live
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3 text-gray-400" /> Paused
                      </>
                    )}
                  </button>
                </div>

                <h3 className="font-bold text-gray-900 text-xl leading-snug">{camp.title}</h3>
                {camp.description && (
                  <p className="text-xs text-gray-600 mt-1.5 line-clamp-2">{camp.description}</p>
                )}

                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full flex items-center gap-1 font-medium">
                    <Layers className="w-3 h-3 text-gray-500" />
                    Target: <strong className="capitalize">{camp.category}</strong>
                  </span>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-xs">
                <span className="text-gray-400">Created: {new Date(camp.created_at || Date.now()).toLocaleDateString()}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(camp)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-gray-600 hover:text-emerald-800 hover:bg-emerald-50 transition-all"
                    title="Edit Campaign"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  {deleteConfirm === camp.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(camp.id)}
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
                      onClick={() => setDeleteConfirm(camp.id)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all"
                      title="Delete Campaign"
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

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCampaign ? 'Edit Campaign' : 'Create Discount Campaign'}
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
            <label className="block text-xs font-semibold text-gray-700 mb-1">Campaign Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-emerald-800"
              placeholder="e.g. Summer Reading Festival 2026"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Description / Banner Text</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-emerald-800 resize-none"
              placeholder="e.g. Save 20% on all books across all categories this weekend"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Discount % *</label>
              <input
                type="number"
                min="1"
                max="90"
                required
                value={formData.discount_percent}
                onChange={(e) => setFormData({ ...formData, discount_percent: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-emerald-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Target Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-emerald-800"
              >
                <option value="all">All Books (Sitewide)</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.label}
                  </option>
                ))}
              </select>
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
              <span className="text-sm text-gray-700 font-medium">Activate campaign immediately</span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {editingCampaign ? 'Save Changes' : 'Create Campaign'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
