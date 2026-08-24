import { useState, useRef, FormEvent, ChangeEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  User,
  Mail,
  Lock,
  Camera,
  Shield,
  ShieldCheck,
  Calendar,
  Save,
  RotateCcw,
  Upload,
  Link as LinkIcon,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const toast = useToast();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Format joined date
  const joinedDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'System Administrator';

  // Handle local file upload and convert to base64
  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (PNG, JPG, WEBP, etc.)');
      return;
    }

    // Size limit check (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Optimize/compress image using canvas (max 400x400)
        const canvas = document.createElement('canvas');
        const maxSize = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
          setAvatar(compressedDataUrl);
          toast.success('Avatar image loaded! Click "Save Changes" to apply.');
        } else {
          setAvatar(event.target?.result as string);
        }
        setIsUploading(false);
      };
      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      toast.error('Failed to read image file');
      setIsUploading(false);
    };

    reader.readAsDataURL(file);
  };

  const handleApplyUrl = () => {
    if (!customUrlInput.trim()) {
      toast.error('Please enter an image URL');
      return;
    }
    setAvatar(customUrlInput.trim());
    setIsUrlModalOpen(false);
    setCustomUrlInput('');
    toast.success('Avatar URL updated! Click "Save Changes" to apply.');
  };

  const handleRemoveAvatar = () => {
    setAvatar('');
    toast.info('Avatar removed. Click "Save Changes" to apply.');
  };

  const handleReset = () => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setAvatar(user.avatar || '');
      setNewPassword('');
      setConfirmPassword('');
      toast.info('Changes reverted');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }

    if (!email.trim()) {
      toast.error('Email is required');
      return;
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }
    }

    setIsSaving(true);
    try {
      const payload: { name: string; email: string; avatar: string; password?: string } = {
        name: name.trim(),
        email: email.trim(),
        avatar: avatar || '',
      };

      if (newPassword.trim()) {
        payload.password = newPassword.trim();
      }

      await updateProfile(payload);
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Profile updated successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-black dark:text-black flex items-center gap-2.5">
            Admin Profile
            <span className="text-xs px-3 py-1 rounded-full bg-emerald-50 text-emerald-900 font-semibold border border-emerald-200 flex items-center gap-1.5 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              Verified Admin
            </span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage your account credentials, personal details and profile avatar
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            disabled={isSaving}
            className="btn-secondary"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving || isUploading}
            className="btn-primary"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Hero / Cover Banner Card */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Deep Forest-Emerald Gradient Cover */}
        <div className="h-44 sm:h-52 bg-gradient-to-r from-[#0d5233] via-[#093d25] to-[#062c1a] relative overflow-hidden p-6 sm:p-8 flex items-end">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-emerald-400/10 blur-2xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full bg-green-900/30 blur-2xl pointer-events-none" />
          
          
        </div>

        {/* Profile Info Bar */}
        <div className="p-6 sm:p-8 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 -mt-16 sm:-mt-20">
            {/* Avatar Section */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5">
              <div className="relative group">
                <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-white p-1.5 shadow-xl border-2 border-white overflow-hidden">
                  <div className="w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-emerald-800 to-green-950 flex items-center justify-center text-white text-4xl font-black shadow-inner">
                    {avatar ? (
                      <img
                        src={avatar}
                        alt={name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{(name || 'A').charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                </div>

                {/* Camera hover trigger */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-1.5 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1 cursor-pointer"
                  title="Upload new photo"
                >
                  <Camera className="w-6 h-6 text-emerald-300 animate-bounce" />
                  <span className="text-[11px] font-semibold">Change Photo</span>
                </button>

                {/* Active status pulse badge */}
                <div className="absolute bottom-2 right-2 flex items-center justify-center">
                  <span className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow" />
                </div>
              </div>

              {/* Identity Details */}
              <div className="text-center sm:text-left space-y-1">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h3 className="text-xl font-bold text-gray-900">{name || 'Admin'}</h3>
                  <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 uppercase tracking-wider">
                    {user?.role || 'Admin'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 font-medium">{email}</p>
                <p className="text-xs text-emerald-800 font-medium flex items-center justify-center sm:justify-start gap-1">
                  <Shield className="w-3.5 h-3.5 text-emerald-700" />
                  Full Administrator Privileges
                </p>
              </div>
            </div>

            {/* Avatar Action Buttons with Pill Styling */}
            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2.5 pt-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="btn-primary"
              >
                <Upload className="w-4 h-4" />
                {isUploading ? 'Uploading...' : 'Upload Image'}
              </button>

              <button
                type="button"
                onClick={() => setIsUrlModalOpen(true)}
                className="btn-secondary"
              >
                <LinkIcon className="w-4 h-4" />
                Image URL
              </button>

              {avatar && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="btn-danger"
                  title="Remove avatar image"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Edit Form */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Personal Information (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Account Information */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Personal Information</h3>
                <p className="text-xs text-gray-500">Update your public name and admin contact details</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="e.g. Sokha Chhay"
                    className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="admin@bookstore.com"
                    className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Role
                </label>
                <div className="relative">
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-800" />
                  <input
                    type="text"
                    value="Administrator (Super Admin)"
                    disabled
                    className="w-full pl-11 pr-4 py-2.5 bg-gray-100 border border-gray-200 rounded-full text-sm text-gray-600 font-semibold cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Account Status
                </label>
                <div className="flex items-center gap-2 h-[42px] px-4 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Active & In Good Standing
                </div>
              </div>
            </div>
          </div>

          {/* Card: Security & Change Password */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Security & Password</h3>
                <p className="text-xs text-gray-500">
                  Leave fields empty if you don't wish to change your password
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    minLength={6}
                    className="w-full pl-11 pr-11 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full pl-11 pr-11 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {newPassword && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2 animate-fade-in font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                <span>
                  Make sure your new password has at least 6 characters with a combination of letters and numbers.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Privilege & Summary Information (1 Col) */}
        <div className="space-y-6">
          {/* Admin Badges & System Privileges */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-7 shadow-sm space-y-4">
            <h4 className="font-bold text-gray-900 text-base flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-800" />
              Role & Permissions
            </h4>

            <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-950 uppercase">Access Tier</span>
                <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-800 text-white">
                  ROOT
                </span>
              </div>
              <p className="text-xs text-emerald-900/80 leading-relaxed font-medium">
                You have full operational authorization to create, read, update, and delete bookstore catalog items, categories, customer orders, user accounts, and reviews.
              </p>
            </div>

            <ul className="space-y-2.5 text-xs text-gray-600 pt-2 font-medium">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Manage Books & Inventory</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Manage Categories</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Process Customer Orders</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Manage Users & Staff</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Moderate Book Reviews</span>
              </li>
            </ul>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-7 shadow-sm space-y-4">
            <h4 className="font-bold text-gray-900 text-base">Account Actions</h4>
            <div className="space-y-3">
              <button
                type="submit"
                disabled={isSaving || isUploading}
                className="w-full btn-primary"
              >
                {isSaving ? 'Saving Changes...' : 'Save Profile Changes'}
              </button>

              <button
                type="button"
                onClick={handleReset}
                disabled={isSaving}
                className="w-full btn-secondary text-xs"
              >
                Revert Unsaved Changes
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Image URL Modal */}
      {isUrlModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-emerald-800" />
                Enter Avatar Image URL
              </h3>
              <button
                type="button"
                onClick={() => setIsUrlModalOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 text-sm font-bold transition-all"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-500">
              Paste any direct link to an image (e.g. from Unsplash, Imgur, or cloud storage):
            </p>

            <input
              type="url"
              value={customUrlInput}
              onChange={(e) => setCustomUrlInput(e.target.value)}
              placeholder="https://images.unsplash.com/photo-..."
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 transition-all"
              autoFocus
            />

            <div className="flex items-center justify-end gap-2.5 pt-3">
              <button
                type="button"
                onClick={() => setIsUrlModalOpen(false)}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyUrl}
                className="btn-primary text-xs"
              >
                Set Image URL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
