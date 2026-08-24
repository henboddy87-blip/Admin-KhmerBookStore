import { useEffect, useState, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { usersApi } from '../api/client';
import { Modal } from '../components/Modal';
import { Plus, Edit3, Trash2, Users, AlertCircle, X, Check, Shield } from 'lucide-react';

interface UserData {
  id?: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  password?: string;
  avatar?: string;
}

const emptyUser: UserData = {
  name: '', email: '', role: 'customer', is_active: true, password: ''
};

export function UsersPage() {
  const { token, user: currentUser } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [formData, setFormData] = useState<UserData>(emptyUser);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const fetchUsers = () => {
    if (!token) return;
    setLoading(true);
    usersApi.list(token)
      .then(setUsers)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, [token]);

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({ ...emptyUser });
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (u: any) => {
    setEditingUser(u);
    setFormData({
      name: u.name,
      email: u.email,
      role: u.role,
      is_active: u.is_active,
      avatar: u.avatar || '',
      password: '', // Empty password by default when editing
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError('');

    try {
      const dataToSubmit = { ...formData };
      if (editingUser && !dataToSubmit.password) {
        delete dataToSubmit.password;
      }
      
      if (editingUser?.id) {
        await usersApi.update(token, editingUser.id, dataToSubmit);
        toast.success(`User "${dataToSubmit.name}" updated successfully!`);
      } else {
        await usersApi.create(token, dataToSubmit);
        toast.success(`User "${dataToSubmit.name}" created successfully!`);
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      const msg = err.message || 'Failed to save user';
      setError(msg);
      toast.error(msg);
    }
  };

  const handleDelete = async (id: number) => {
    if (!token) return;
    try {
      await usersApi.delete(token, id);
      setDeleteConfirm(null);
      fetchUsers();
      toast.success('User deleted successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete user');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <h1 className="text-2xl sm:text-3xl font-bold text-black dark:text-black">Users</h1>
          </div>
          <p className="text-gray-500 mt-1">{users.length} registered accounts</p>
        </div>
        <button
          onClick={openCreateModal}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-emerald-900/30 border-t-emerald-900 rounded-full animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-3xl px-6 py-16 text-center text-gray-500 shadow-sm">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30 text-emerald-800" />
          <p className="font-semibold text-gray-800">No users found</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3.5">User</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3.5">Role</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3.5">Status</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3.5">Joined</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3.5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-gray-100/70 hover:bg-emerald-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {u.avatar ? (
                          <img src={u.avatar} alt={u.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0 shadow-sm" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-800 to-green-900 flex items-center justify-center text-white font-bold text-xs shadow-sm flex-shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{u.name}</div>
                          <div className="text-xs text-gray-500">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {u.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">
                          <Shield className="w-3 h-3 text-emerald-800" />
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                          Customer
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {u.is_active ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200">
                          <Check className="w-3 h-3 text-emerald-600" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200">
                          <X className="w-3 h-3 text-rose-500" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-gray-500">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(u)}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-gray-600 hover:text-emerald-800 hover:bg-emerald-50 transition-all"
                          title="Edit User"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {currentUser?.email !== u.email && (
                          <>
                            {deleteConfirm === u.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleDelete(u.id)}
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
                                onClick={() => setDeleteConfirm(u.id)}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all"
                                title="Delete User"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? 'Edit User' : 'Add New User'}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Full Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-amber-900/50 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-amber-900/50 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Avatar Image</label>
            <div className="flex items-center gap-3">
              {formData.avatar ? (
                <img src={formData.avatar} alt="Avatar" className="w-10 h-10 rounded-full object-cover shadow-sm border border-gray-200" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 border border-gray-200">
                  <Users className="w-5 h-5" />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      if (ev.target?.result) {
                        setFormData(p => ({ ...p, avatar: ev.target!.result as string }));
                      }
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">
              {editingUser ? 'New Password (leave empty to keep current)' : 'Password *'}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(p => ({ ...p, password: e.target.value }))}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-amber-900/50 transition-all"
              required={!editingUser}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData(p => ({ ...p, role: e.target.value }))}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-amber-900/50 transition-all appearance-none"
              >
                <option value="customer">Customer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Status</label>
              <select
                value={formData.is_active ? 'active' : 'inactive'}
                onChange={(e) => setFormData(p => ({ ...p, is_active: e.target.value === 'active' }))}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-amber-900/50 transition-all appearance-none"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
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
              {editingUser ? 'Update User' : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
