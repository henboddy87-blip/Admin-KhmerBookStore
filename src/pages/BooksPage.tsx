import { useEffect, useState, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { booksApi } from '../api/client';
import { Modal } from '../components/Modal';
import {
  Plus, Search, Edit3, Trash2, ChevronLeft, ChevronRight,
  BookOpen, AlertCircle, X, Upload, Link, Image as ImageIcon, Star,
  Package, Minus, PlusCircle, AlertTriangle, CheckCircle2,
} from 'lucide-react';

interface BookData {
  id?: number;
  title: string;
  author: string;
  price: number;
  original_price: number | null;
  image: string;
  images: string[];
  category: string;
  genre: string;
  rating: number;
  reviews: number;
  pages: number;
  publisher: string;
  published_year: number;
  isbn: string;
  language: string;
  format: string;
  description: string;
  is_new: boolean;
  is_sale: boolean;
  is_bestseller: boolean;
  is_top_rated: boolean;
  is_special_offer: boolean;
  in_stock: boolean;
  stock_count: number;
  tags: string[];
}

const emptyBook: BookData = {
  title: '', author: '', price: 0, original_price: null,
  image: '', images: [], category: '', genre: '',
  rating: 0, reviews: 0, pages: 0, publisher: '',
  published_year: 2024, isbn: '', language: 'English',
  format: 'Paperback', description: '',
  is_new: false, is_sale: false, is_bestseller: false,
  is_top_rated: false, is_special_offer: false,
  in_stock: true, stock_count: 0, tags: [],
};

export function BooksPage() {
  const { token } = useAuth();
  const toast = useToast();
  const [books, setBooks] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<BookData | null>(null);
  const [formData, setFormData] = useState<BookData>(emptyBook);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [editingStockId, setEditingStockId] = useState<number | null>(null);
  const [tempStockValue, setTempStockValue] = useState<number>(0);

  const handleQuickStockChange = async (bookId: number, currentStock: number, delta: number) => {
    if (!token) return;
    const newStock = Math.max(0, currentStock + delta);
    try {
      await booksApi.updateStock(token, bookId, newStock, newStock > 0);
      setBooks((prev) =>
        prev.map((b) =>
          b.id === bookId
            ? { ...b, stock_count: newStock, in_stock: newStock > 0 }
            : b
        )
      );
      localStorage.setItem('books_updated_at', Date.now().toString());
      toast.success(`Updated stock to ${newStock} units`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update stock');
    }
  };

  const handleDirectStockSubmit = async (bookId: number) => {
    if (!token) return;
    const newStock = Math.max(0, tempStockValue);
    try {
      await booksApi.updateStock(token, bookId, newStock, newStock > 0);
      setBooks((prev) =>
        prev.map((b) =>
          b.id === bookId
            ? { ...b, stock_count: newStock, in_stock: newStock > 0 }
            : b
        )
      );
      setEditingStockId(null);
      localStorage.setItem('books_updated_at', Date.now().toString());
      toast.success(`Updated stock to ${newStock} units`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update stock');
    }
  };

  const handleAddImageUrl = () => {
    if (!newImageUrl.trim()) return;
    const urls = newImageUrl
      .split(/[\n,\s]+/)
      .map(u => u.trim())
      .filter(u => u.startsWith('http://') || u.startsWith('https://') || u.startsWith('data:image/'));

    if (urls.length > 0) {
      updateField('images', Array.from(new Set([...formData.images, ...urls])));
      setNewImageUrl('');
    }
  };

  const handleLocalFilesUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    const promises = fileArray.map(file => new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = (ev) => resolve(ev.target?.result as string);
      reader.readAsDataURL(file);
    }));
    Promise.all(promises).then(base64Images => {
      const valid = base64Images.filter(Boolean);
      updateField('images', Array.from(new Set([...formData.images, ...valid])));
      if (!formData.image && valid.length > 0) {
        updateField('image', valid[0]);
      }
    });
  };

  const fetchBooks = (query = search, targetPage = page) => {
    if (!token) return;
    setLoading(true);
    const params: Record<string, string> = {
      page: targetPage.toString(),
      per_page: '15',
    };
    if (query.trim()) params.search = query.trim();

    booksApi.list(token, params)
      .then((res) => {
        setBooks(res.books);
        setTotal(res.total);
        setTotalPages(res.total_pages);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  // Instant real-time search whenever the user types any letter
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchBooks(search, 1);
    }, 200);

    return () => clearTimeout(timer);
  }, [search, token]);

  // Handle page pagination navigation
  useEffect(() => {
    if (page > 1) {
      fetchBooks(search, page);
    }
  }, [page]);

  const handleSearch = () => {
    setPage(1);
    fetchBooks(search, 1);
  };

  const openCreateModal = () => {
    setEditingBook(null);
    setFormData({ ...emptyBook });
    setNewImageUrl('');
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (book: any) => {
    setEditingBook(book);
    setNewImageUrl('');
    setFormData({
      title: book.title,
      author: book.author,
      price: book.price,
      original_price: book.original_price,
      image: book.image,
      images: book.images || [],
      category: book.category,
      genre: book.genre,
      rating: book.rating,
      reviews: book.reviews,
      pages: book.pages,
      publisher: book.publisher,
      published_year: book.published_year,
      isbn: book.isbn,
      language: book.language,
      format: book.format,
      description: book.description,
      is_new: Boolean(book.is_new),
      is_sale: Boolean(book.is_sale),
      is_bestseller: Boolean(book.is_bestseller),
      is_top_rated: Boolean(book.is_top_rated),
      is_special_offer: Boolean(book.is_special_offer),
      in_stock: book.in_stock ?? true,
      stock_count: book.stock_count || 0,
      tags: book.tags || [],
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError('');

    try {
      if (editingBook?.id) {
        await booksApi.update(token, editingBook.id, formData);
        toast.success(`Book "${formData.title}" updated successfully!`);
      } else {
        await booksApi.create(token, formData);
        toast.success(`Book "${formData.title}" added successfully!`);
      }
      localStorage.setItem('books_updated_at', Date.now().toString());
      setIsModalOpen(false);
      fetchBooks(search, page);
    } catch (err: any) {
      const msg = err.message || 'Failed to save book';
      setError(msg);
      toast.error(msg);
    }
  };

  const handleDelete = async (id: number) => {
    if (!token) return;
    try {
      await booksApi.delete(token, id);
      setDeleteConfirm(null);
      localStorage.setItem('books_updated_at', Date.now().toString());
      fetchBooks(search, page);
      toast.success('Book deleted successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete book');
    }
  };

  const updateField = (field: keyof BookData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (

    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <h1 className="text-2xl sm:text-3xl font-bold text-black dark:text-black">Books</h1>
          </div>
          <p className="text-gray-500 mt-1">
            {total} books in catalog {search && <span className="text-emerald-800 font-semibold">(filtered by "{search}")</span>}
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          Add Book
        </button>
      </div>

      {/* Instant Search Bar & Stock Filter Pills */}
      <div className="space-y-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-10 py-2.5 bg-white border border-gray-200 rounded-full text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 shadow-sm transition-all"
              placeholder="Type any title, author, category, genre, or ISBN..."
              autoFocus
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-all"
                title="Clear Search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="btn-secondary"
            >
              Clear
            </button>
          )}
        </div>

        {/* Stock Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setStockFilter('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              stockFilter === 'all'
                ? 'bg-emerald-900 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            All Stock ({books.length})
          </button>
          <button
            type="button"
            onClick={() => setStockFilter('in_stock')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              stockFilter === 'in_stock'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> In Stock ({books.filter(b => b.in_stock && (b.stock_count || 0) > 5).length})
          </button>
          <button
            type="button"
            onClick={() => setStockFilter('low_stock')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              stockFilter === 'low_stock'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-white border border-amber-200 text-amber-700 hover:bg-amber-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" /> Low Stock (≤ 5) ({books.filter(b => (b.stock_count || 0) > 0 && (b.stock_count || 0) <= 5).length})
          </button>
          <button
            type="button"
            onClick={() => setStockFilter('out_of_stock')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              stockFilter === 'out_of_stock'
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-white border border-red-200 text-red-700 hover:bg-red-50'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" /> Out of Stock ({books.filter(b => !b.in_stock || (b.stock_count || 0) === 0).length})
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-emerald-900/30 border-t-emerald-900 rounded-full animate-spin" />
          </div>
        ) : books.length === 0 ? (
          <div className="px-6 py-16 text-center text-gray-500">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30 text-emerald-800" />
            <p className="font-bold text-gray-800 text-base">No books found</p>
            {search ? (
              <div className="mt-2 space-y-3">
                <p className="text-xs text-gray-500">No books contain "{search}". Try typing another keyword or name.</p>
                <button
                  onClick={() => setSearch('')}
                  className="btn-secondary text-xs"
                >
                  Clear Search
                </button>
              </div>
            ) : (
              <p className="text-xs text-gray-500 mt-1">Start by adding books to your catalog.</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Book</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Category</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Price</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Stock (Units)</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Rating</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {books
                  .filter((book) => {
                    if (stockFilter === 'in_stock') return book.in_stock && (book.stock_count || 0) > 5;
                    if (stockFilter === 'low_stock') return (book.stock_count || 0) > 0 && (book.stock_count || 0) <= 5;
                    if (stockFilter === 'out_of_stock') return !book.in_stock || (book.stock_count || 0) === 0;
                    return true;
                  })
                  .map((book) => (
                  <tr key={book.id} className="border-b border-gray-200/50 hover:bg-gray-100/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={book.image}
                          alt={book.title}
                          className="w-10 h-14 rounded-lg object-cover bg-gray-100 flex-shrink-0"
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/40x56/27272a/52525b?text=Book'; }}
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate max-w-[220px]">{book.title}</p>
                          <p className="text-xs text-gray-500 truncate max-w-[220px]">{book.author}</p>
                          {/* Active Frontend Placement Badges */}
                          <div className="flex flex-wrap gap-1 mt-1">
                            {book.is_bestseller && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                                Best Seller
                              </span>
                            )}
                            {book.is_new && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                                New Arrival
                              </span>
                            )}
                            {book.is_top_rated && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200 font-bold">
                                Top Rate
                              </span>
                            )}
                            {book.is_sale && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 font-bold">
                                On Sale
                              </span>
                            )}
                            {book.is_special_offer && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 font-bold">
                                Special Offer
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {book.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-gray-900">${book.price.toFixed(2)}</span>
                      {book.original_price && (
                        <span className="text-xs text-gray-400 line-through ml-2">${book.original_price.toFixed(2)}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingStockId === book.id ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            value={tempStockValue}
                            onChange={(e) => setTempStockValue(parseInt(e.target.value) || 0)}
                            className="w-16 px-2 py-1 text-xs font-bold border border-emerald-500 rounded-lg focus:outline-none"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleDirectStockSubmit(book.id)}
                            className="px-2 py-1 bg-emerald-800 text-white text-[10px] font-bold rounded-md hover:bg-emerald-700"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingStockId(null)}
                            className="px-1.5 py-1 bg-gray-100 text-gray-500 text-[10px] font-bold rounded-md hover:bg-gray-200"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span
                            onClick={() => {
                              setEditingStockId(book.id);
                              setTempStockValue(book.stock_count || 0);
                            }}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold cursor-pointer transition-all hover:scale-105 ${
                              !book.in_stock || (book.stock_count || 0) === 0
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : (book.stock_count || 0) <= 5
                                ? 'bg-amber-50 text-amber-800 border border-amber-200 animate-pulse'
                                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            }`}
                            title="Click to edit stock amount directly"
                          >
                            <Package className="w-3 h-3" />
                            {!book.in_stock || (book.stock_count || 0) === 0
                              ? '0 (Out of Stock)'
                              : (book.stock_count || 0) <= 5
                              ? `${book.stock_count} units (Low)`
                              : `${book.stock_count} units`}
                          </span>

                          <div className="flex items-center gap-0.5 opacity-60 hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => handleQuickStockChange(book.id, book.stock_count || 0, -1)}
                              disabled={(book.stock_count || 0) <= 0}
                              className="w-5 h-5 rounded flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600 disabled:opacity-30"
                              title="Decrease stock by 1"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickStockChange(book.id, book.stock_count || 0, 1)}
                              className="w-5 h-5 rounded flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600"
                              title="Increase stock by 1"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span className="text-sm font-medium text-gray-700">{book.rating}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(book)}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-gray-600 hover:text-emerald-800 hover:bg-emerald-50 transition-all"
                          title="Edit Book"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {deleteConfirm === book.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(book.id)}
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
                            onClick={() => setDeleteConfirm(book.id)}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all"
                            title="Delete Book"
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/30">
            <p className="text-xs font-medium text-gray-500">
              Page {page} of {totalPages} • {total} total books
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 rounded-full flex items-center justify-center border border-gray-300 text-gray-600 hover:text-emerald-900 hover:border-emerald-800 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-8 h-8 rounded-full flex items-center justify-center border border-gray-300 text-gray-600 hover:text-emerald-900 hover:border-emerald-800 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBook ? 'Edit Book' : 'Add New Book'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Author *</label>
              <input
                type="text"
                value={formData.author}
                onChange={(e) => updateField('author', e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 transition-all"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Price *</label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => updateField('price', parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Original Price</label>
              <input
                type="number"
                step="0.01"
                value={formData.original_price ?? ''}
                onChange={(e) => updateField('original_price', e.target.value ? parseFloat(e.target.value) : null)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">ISBN</label>
              <input
                type="text"
                value={formData.isbn}
                onChange={(e) => updateField('isbn', e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Category *</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => updateField('category', e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 transition-all"
                placeholder="e.g. fiction, selfHelp"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Genre *</label>
              <input
                type="text"
                value={formData.genre}
                onChange={(e) => updateField('genre', e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 transition-all"
                placeholder="e.g. Fantasy Romance"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Format</label>
              <select
                value={formData.format}
                onChange={(e) => updateField('format', e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 transition-all"
              >
                <option value="Paperback">Paperback</option>
                <option value="Hardcover">Hardcover</option>
                <option value="E-Book">E-Book</option>
                <option value="Audiobook">Audiobook</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Pages</label>
              <input
                type="number"
                value={formData.pages}
                onChange={(e) => updateField('pages', parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Published Year</label>
              <input
                type="number"
                value={formData.published_year}
                onChange={(e) => updateField('published_year', parseInt(e.target.value) || 2024)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Publisher</label>
              <input
                type="text"
                value={formData.publisher}
                onChange={(e) => updateField('publisher', e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center justify-between">
                <span>Stock Amount (Units) *</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  formData.stock_count > 5
                    ? 'bg-emerald-100 text-emerald-800'
                    : formData.stock_count > 0
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {formData.stock_count > 5 ? 'In Stock' : formData.stock_count > 0 ? 'Low Stock' : 'Out of Stock'}
                </span>
              </label>
              <input
                type="number"
                min="0"
                value={formData.stock_count}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setFormData(prev => ({
                    ...prev,
                    stock_count: val,
                    in_stock: val > 0 ? prev.in_stock : false
                  }));
                }}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-bold focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 transition-all"
                placeholder="e.g. 50"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Quantity cut automatically on customer orders.
              </p>
            </div>
          </div>

          {/* Main Cover Image */}
          <div className="bg-gray-50/70 p-4 rounded-2xl border border-gray-200">
            <label className="block text-sm font-semibold text-gray-800 mb-2">Main Cover Image *</label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {formData.image ? (
                <div className="relative group flex-shrink-0">
                  <img
                    src={formData.image}
                    alt="Main Cover Preview"
                    className="w-20 h-28 object-cover rounded-xl shadow-md border border-gray-200"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://placehold.co/100x140?text=Invalid+Image";
                    }}
                  />
                  <span className="absolute bottom-1 left-1 bg-[#0d5233] text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
                    Cover
                  </span>
                </div>
              ) : (
                <div className="w-20 h-28 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 text-xs text-center p-2 flex-shrink-0">
                  <ImageIcon className="w-6 h-6 mb-1 opacity-50" />
                  <span>No Cover</span>
                </div>
              )}
              <div className="flex-1 w-full space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.image}
                    onChange={(e) => updateField('image', e.target.value)}
                    className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 transition-all"
                    placeholder="Enter main image URL or select from local file below"
                    required
                  />
                  {formData.image && (
                    <button
                      type="button"
                      onClick={() => updateField('image', '')}
                      className="px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-xl border border-red-200 font-medium cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-700 hover:bg-emerald-50/50 hover:border-emerald-300 cursor-pointer transition-all shadow-sm">
                    <Upload className="w-3.5 h-3.5 text-[#0d5233]" />
                    <span>Upload Local Cover</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            if (ev.target?.result) {
                              updateField('image', ev.target.result as string);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                  <span className="text-xs text-gray-400">Supports JPG, PNG, WebP</span>
                </div>
              </div>
            </div>
          </div>

          {/* Multiple Additional Gallery Images (Local & URL) */}
          <div className="bg-gray-50/70 p-4 rounded-2xl border border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-semibold text-gray-800">
                  Additional Gallery Images ({formData.images.length})
                </label>
                <p className="text-xs text-gray-500">Upload multiple local files or paste image URLs</p>
              </div>
              {formData.images.length > 0 && (
                <button
                  type="button"
                  onClick={() => updateField('images', [])}
                  className="text-xs text-red-600 hover:text-red-700 font-medium cursor-pointer"
                >
                  Remove All
                </button>
              )}
            </div>

            {/* Input by URL */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Link className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddImageUrl();
                    }
                  }}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 transition-all"
                  placeholder="Paste image URL (or multiple separated by space/comma) and press Enter"
                />
              </div>
              <button
                type="button"
                onClick={handleAddImageUrl}
                disabled={!newImageUrl.trim()}
                className="px-4 py-2 bg-[#0d5233] hover:bg-[#083b24] text-white text-xs font-semibold rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-950/20 cursor-pointer active:scale-95"
              >
                + Add URL
              </button>
            </div>

            {/* Upload Multiple Local Files */}
            <div>
              <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 hover:border-emerald-600 bg-white rounded-xl cursor-pointer transition-all hover:bg-emerald-50/40">
                <Upload className="w-5 h-5 text-[#0d5233] mb-1" />
                <span className="text-xs font-semibold text-gray-700">Click to Select Multiple Local Images</span>
                <span className="text-[11px] text-gray-400">Select multiple files at once from your computer</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleLocalFilesUpload(e.target.files)}
                />
              </label>
            </div>

            {/* Preview Thumbnails Grid */}
            {formData.images.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-2">
                {formData.images.map((img, i) => (
                  <div key={i} className="relative group bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center">
                    <div className="w-full h-20 overflow-hidden rounded-lg bg-gray-100 flex items-center justify-center">
                      <img
                        src={img}
                        alt={`Gallery ${i + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://placehold.co/100x140?text=Invalid";
                        }}
                      />
                    </div>
                    <div className="mt-1.5 flex items-center justify-between w-full px-0.5">
                      <button
                        type="button"
                        onClick={() => updateField('image', img)}
                        title="Set as Main Cover"
                        className="text-[10px] text-[#0d5233] hover:text-[#083b24] font-bold hover:underline truncate cursor-pointer"
                      >
                        {formData.image === img ? '✓ Main' : 'Set Main'}
                      </button>
                      <button
                        type="button"
                        onClick={() => updateField('images', formData.images.filter((_, index) => index !== i))}
                        className="text-gray-400 hover:text-red-600 p-0.5 cursor-pointer"
                        title="Remove Image"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Tags (comma-separated)</label>
            <input
              type="text"
              value={formData.tags.join(', ')}
              onChange={(e) => updateField('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 transition-all"
              placeholder="habits, productivity, self-help"
            />
          </div>

          {/* Frontend Feature Placement & Status */}
          <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 space-y-3">
            <div>
              <label className="block text-xs font-bold text-emerald-950 uppercase tracking-wider">
                Frontend Feature Placement & Status
              </label>
              <p className="text-xs text-gray-500 mt-0.5">
                Check where this book should appear across rows, highlights, and specialized shop pages:
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {[
                { field: 'is_bestseller', label: 'Best Seller', desc: 'Best Sellers row & page' },
                { field: 'is_new', label: 'New Arrival', desc: 'New Arrivals row & page' },
                { field: 'is_top_rated', label: 'Top Rate', desc: 'Top Rated row & awards' },
                { field: 'is_sale', label: 'On Sale', desc: 'On Sale row & discounts' },
                { field: 'is_special_offer', label: 'Special Offer', desc: 'Special Offers row & bundles' },
                { field: 'in_stock', label: 'In Stock', desc: 'Active & available to order' },
              ].map(({ field, label, desc }) => (
                <label
                  key={field}
                  className={`flex flex-col p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                    formData[field as keyof BookData]
                      ? 'bg-white border-emerald-500 shadow-sm ring-1 ring-emerald-500/20'
                      : 'bg-white/70 border-gray-200 hover:border-emerald-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={Boolean(formData[field as keyof BookData])}
                      onChange={(e) => updateField(field as keyof BookData, e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-emerald-800 focus:ring-emerald-800 accent-emerald-800 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-gray-900">{label}</span>
                  </div>
                  <span className="text-[10px] text-gray-500 mt-1 pl-6">{desc}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
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
              {editingBook ? 'Update Book' : 'Create Book'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
