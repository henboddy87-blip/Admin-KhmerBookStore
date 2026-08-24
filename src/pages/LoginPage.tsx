import { useState, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { BookMarked, Mail, Lock, AlertCircle } from 'lucide-react';

export function LoginPage() {
  const { login, isLoading, error } = useAuth();
  const [email, setEmail] = useState('admin@bookstore.com');
  const [password, setPassword] = useState('admin123');
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError('');
    try {
      await login(email, password);
    } catch (err: any) {
      setLocalError(err.message || 'Login failed');
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-green-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in flex flex-col items-center justify-center">
          <img
            src="/logo.png"
            alt="KhmerBookStore Logo"
            className="h-28 sm:h-32 md:h-36 w-auto max-w-[240px] object-contain mb-3 transition-transform hover:scale-105 duration-300"
          />
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-3xl sm:text-4xl font-black text-[#0d5233]" style={{ fontFamily: "Merriweather, serif" }}>
              Khmer
            </span>
            <span className="text-3xl sm:text-4xl font-black text-[#15803d]" style={{ fontFamily: "Merriweather, serif" }}>
              Bookstore
            </span>
          </div>
          <p className="text-emerald-800 text-xs uppercase tracking-widest mt-1 font-bold">Admin Dashboard</p>
        </div>

        {/* Login Form */}
        <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-xl animate-fade-in">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Welcome back</h2>
          <p className="text-sm text-gray-500 mb-6">Sign in to your administrator account</p>

          {displayError && (
            <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium mb-4">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {displayError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-full text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 transition-all"
                  placeholder="admin@bookstore.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-full text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800/20 focus:border-emerald-800 transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary py-3.5 text-sm"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </div>
          </form>

          <p className="text-center text-xs text-gray-500 mt-6 font-medium">
            Default: <span className="text-emerald-900 font-semibold">admin@bookstore.com</span> / <span className="text-emerald-900 font-semibold">admin123</span>
          </p>
        </div>
      </div>
    </div>
  );
}
