import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SidebarProvider, useSidebar, SidebarToggleIcon } from './context/SidebarContext';
import { Sidebar } from './components/Sidebar';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { BooksPage } from './pages/BooksPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { OrdersPage } from './pages/OrdersPage';
import { UsersPage } from './pages/UsersPage';
import { ReviewsPage } from './pages/ReviewsPage';
import { ProfilePage } from './pages/ProfilePage';
import { SpecialOffersPage } from './pages/SpecialOffersPage';
import { CampaignsPage } from './pages/CampaignsPage';
import { CouponsPage } from './pages/CouponsPage';
import { FlashSalesPage } from './pages/FlashSalesPage';
import { ToastProvider } from './context/ToastContext';

function ProtectedLayout() {
  const { user, isLoading } = useAuth();
  const { collapsed, toggleSidebar } = useSidebar();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-emerald-900/30 border-t-emerald-900 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Sidebar (Responsive drawer on mobile, collapsible on desktop) */}
      <Sidebar />

      {/* Responsive Top Header */}
      <header
        className={`sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 sm:px-8 py-3 flex items-center justify-between transition-all duration-300 ${
          collapsed ? 'lg:ml-[76px]' : 'lg:ml-[260px]'
        }`}
      >
        <div className="flex items-center gap-3">
          {/* Sidebar Toggle Icon Button (Mobile / Tablet only when sidebar drawer is closed) */}
          <button
            onClick={toggleSidebar}
            className="lg:hidden w-9 h-9 rounded-xl bg-gray-50 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-300 text-gray-600 hover:text-emerald-900 flex items-center justify-center transition-all shadow-sm"
            title="Toggle Sidebar"
            aria-label="Toggle Sidebar"
          >
            <SidebarToggleIcon className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-800 hidden sm:inline-block">
              Khmer Bookstore
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
              Admin
            </span>
          </div>
        </div>

        {/* User quick pill on top right */}
        <div className="flex items-center gap-3">
          <Link
            to="/profile"
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-full hover:bg-emerald-50/60 transition-colors border border-transparent hover:border-emerald-100"
          >
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-7 h-7 rounded-full object-cover shadow-sm border border-emerald-200"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-emerald-800 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-xs font-semibold text-gray-800 hidden md:inline-block">
              {user.name}
            </span>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main
        className={`flex-1 p-4 sm:p-6 lg:p-8 transition-all duration-300 ease-in-out ${
          collapsed ? 'lg:ml-[76px]' : 'lg:ml-[260px]'
        }`}
      >
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/books" element={<BooksPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/sales/special-offers" element={<SpecialOffersPage />} />
          <Route path="/sales/campaigns" element={<CampaignsPage />} />
          <Route path="/sales/coupons" element={<CouponsPage />} />
          <Route path="/sales/flash-sales" element={<FlashSalesPage />} />
        </Routes>
      </main>
    </div>
  );
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route
        path="/*"
        element={
          <SidebarProvider>
            <ProtectedLayout />
          </SidebarProvider>
        }
      />
    </Routes>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
