import { useEffect, useState, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { categoriesApi } from '../api/client';
import { Modal } from '../components/Modal';
import { Plus, Edit3, Trash2, FolderTree, AlertCircle, X } from 'lucide-react';

interface CategoryData {
  id?: number;
  slug: string;
  label: string;
  description: string;
  icon: string;
  image: string;
}

const emptyCategory: CategoryData = {
  slug: '', label: '', description: '', icon: '', image: '',
};

export function CategoriesPage() {
  const { token } = useAuth();
  const toast = useToast();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<CategoryData | null>(null);
  const [formData, setFormData] = useState<CategoryData>(emptyCategory);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const fetchCategories = () => {
    if (!token) return;
    setLoading(true);
    categoriesApi.list(token)
      .then(setCategories)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCategories(); }, [token]);

  const openCreateModal = () => {
    setEditingCat(null);
    setFormData({ ...emptyCategory });
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (cat: any) => {
    setEditingCat(cat);
    setFormData({
      slug: cat.slug,
      label: cat.label,
      description: cat.description,
      icon: cat.icon,
      image: cat.image,
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError('');

    try {
      if (editingCat?.id) {
        await categoriesApi.update(token, editingCat.id, formData);
        toast.success(`Category "${formData.label}" updated successfully!`);
      } else {
        await categoriesApi.create(token, formData);
        toast.success(`Category "${formData.label}" created successfully!`);
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      const msg = err.message || 'Failed to save category';
      setError(msg);
      toast.error(msg);
    }
  };

  const handleDelete = async (id: number) => {
    if (!token) return;
    try {
      await categoriesApi.delete(token, id);
      setDeleteConfirm(null);
      fetchCategories();
      toast.success('Category deleted successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete category');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <FolderTree className="w-8 h-8 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <h1 className="text-2xl sm:text-3xl font-bold text-black dark:text-black">Categories</h1>
          </div>
          <p className="text-gray-500 mt-1">{categories.length} categories configured</p>
        </div>
        <button
          onClick={openCreateModal}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-emerald-900/30 border-t-emerald-900 rounded-full animate-spin" />
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-3xl px-6 py-16 text-center text-gray-500 shadow-sm">
          <FolderTree className="w-12 h-12 mx-auto mb-3 opacity-30 text-emerald-800" />
          <p className="font-semibold text-gray-800">No categories yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-white border border-gray-100 rounded-3xl overflow-hidden group hover:border-emerald-200 transition-all hover:shadow-lg shadow-sm"
            >
              {cat.image && (
                <div className="h-36 overflow-hidden bg-gray-50">
                  <img
                    src={cat.image}
                    alt={cat.label}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              )}
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{cat.label}</h3>
                    <span className="inline-block text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-mono mt-1">
                      {cat.slug}
                    </span>
                    <p className="text-xs text-gray-500 mt-2 line-clamp-2">{cat.description || 'No description provided.'}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(cat)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-gray-600 hover:text-emerald-800 hover:bg-emerald-50 transition-all"
                      title="Edit Category"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    {deleteConfirm === cat.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(cat.id)}
                          className="px-3 py-1 text-xs font-semibold text-white bg-red-600 rounded-full hover:bg-red-700"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="w-6 h-6 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-700"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(cat.id)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all"
                        title="Delete Category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCat ? 'Edit Category' : 'Add New Category'}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Label *</label>
            <input
              type="text"
              value={formData.label}
              onChange={(e) => setFormData(p => ({ ...p, label: e.target.value }))}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Slug *</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData(p => ({ ...p, slug: e.target.value }))}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 transition-all"
              placeholder="e.g. self-help"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Icon name</label>
            <input
              type="text"
              value={formData.icon}
              onChange={(e) => setFormData(p => ({ ...p, icon: e.target.value }))}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 transition-all"
              placeholder="e.g. literature"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Image URL</label>
            <input
              type="url"
              value={formData.image}
              onChange={(e) => setFormData(p => ({ ...p, image: e.target.value }))}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 transition-all"
              placeholder="https://..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-5 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              {editingCat ? 'Update Category' : 'Create Category'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
