import { NavLink, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSidebar, SidebarToggleIcon } from '../context/SidebarContext';
import {
  LayoutDashboard,
  BookOpen,
  FolderTree,
  ShoppingCart,
  LogOut,
  Users,
  MessageSquare,
  UserCircle,
  ShieldCheck,
  Gift,
  Megaphone,
  Ticket,
  Zap,
  Flame,
} from 'lucide-react';
import { useEffect } from 'react';

const mainNavItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/books', icon: BookOpen, label: 'Books' },
  { to: '/categories', icon: FolderTree, label: 'Categories' },
  { to: '/orders', icon: ShoppingCart, label: 'Orders' },
  { to: '/users', icon: Users, label: 'Users' },
  { to: '/reviews', icon: MessageSquare, label: 'Reviews' },
];

const saleNavItems = [
  { to: '/sales/special-offers', icon: Gift, label: 'Special Offers' },
  { to: '/sales/campaigns', icon: Megaphone, label: 'Discount Campaigns' },
  { to: '/sales/coupons', icon: Ticket, label: 'Coupons' },
  { to: '/sales/flash-sales', icon: Zap, label: 'Flash Sales' },
];

export function Sidebar() {
  const { logout, user } = useAuth();
  const { collapsed, mobileOpen, closeMobile, toggleSidebar } = useSidebar();
  const location = useLocation();

  // Close mobile drawer when route changes
  useEffect(() => {
    closeMobile();
  }, [location.pathname]);

  return (
    <>
      {/* Mobile / Tablet Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity animate-fade-in"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Aside */}
      <aside
        className={`fixed top-0 left-0 h-screen bg-white border-r border-gray-200 flex flex-col z-50 transition-all duration-300 ease-in-out ${
          // Desktop sizing
          collapsed ? 'lg:w-[76px]' : 'lg:w-[260px]'
        } ${
          // Mobile & Tablet drawer handling
          mobileOpen
            ? 'translate-x-0 w-[270px] shadow-2xl'
            : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header with Logo, Title, and Sidebar Toggle Icon Button */}
        <div
          className={`flex items-center border-b border-gray-100 transition-all duration-300 ${
            collapsed ? 'lg:justify-center p-3.5' : 'justify-between px-4 py-4'
          }`}
        >
          {/* Logo + Branding */}
          <Link
            to="/"
            onClick={closeMobile}
            className={`flex items-center gap-2.5 overflow-hidden ${
              collapsed ? 'lg:hidden' : 'flex'
            }`}
          >
            <img
              src="/logo.png"
              alt="KhmerBookStore Logo"
              className="w-10 h-10 object-contain flex-shrink-0"
            />
            <div className="animate-fade-in overflow-hidden whitespace-nowrap">
              <div className="flex items-center leading-tight">
                <span
                  className="font-black text-[#0d5233] text-lg"
                  style={{ fontFamily: 'Merriweather, serif' }}
                >
                  Khmer
                </span>
                <span
                  className="font-black text-[#15803d] text-lg"
                  style={{ fontFamily: 'Merriweather, serif' }}
                >
                  Bookstore
                </span>
              </div>
              <p className="text-[10px] font-bold tracking-widest uppercase text-emerald-800">
                Admin Panel
              </p>
            </div>
          </Link>

          {/* Single Toggle Button */}
          <button
            onClick={toggleSidebar}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-emerald-900 hover:bg-emerald-50/80 transition-all flex-shrink-0"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            aria-label="Toggle sidebar"
          >
            <SidebarToggleIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
          {/* Main Navigation */}
          {mainNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-full text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-800 to-emerald-950 text-white shadow-sm shadow-emerald-950/20 font-semibold'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-emerald-50/60'
                } ${collapsed ? 'lg:justify-center lg:px-0' : ''}`
              }
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span
                className={`truncate ${
                  collapsed ? 'lg:hidden' : 'inline-block'
                }`}
              >
                {item.label}
              </span>
            </NavLink>
          ))}

          {/* Sale Management Header */}
          <div className="pt-4 pb-1">
            <div className={`flex items-center gap-2 px-3.5 ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}>
              <span className={`text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-700 ${collapsed ? 'lg:hidden' : 'inline-block'}`}>
                Sale Management
              </span>
              {collapsed && <div className="hidden lg:block w-6 h-[1px] bg-gray-200 my-1" />}
            </div>
          </div>

          {/* Sale Management Links */}
          {saleNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-full text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-800 to-emerald-950 text-white shadow-sm shadow-emerald-950/20 font-semibold'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-emerald-50/60'
                } ${collapsed ? 'lg:justify-center lg:px-0' : ''}`
              }
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span
                className={`truncate ${
                  collapsed ? 'lg:hidden' : 'inline-block'
                }`}
              >
                {item.label}
              </span>
            </NavLink>
          ))}
        </nav>

        {/* User & Logout */}
        <div className="border-t border-gray-100 p-3 space-y-2">
          {user && (
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `flex items-center gap-3 p-2 rounded-2xl transition-all ${
                  isActive
                    ? 'bg-emerald-50/90 border border-emerald-200'
                    : 'hover:bg-gray-100/70 border border-transparent'
                } ${collapsed ? 'lg:justify-center' : ''}`
              }
              title={`${user.name} (${user.email})`}
            >
              <div className="relative w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-emerald-800 to-green-900 flex items-center justify-center text-white font-bold shadow-sm">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{user.name.charAt(0).toUpperCase()}</span>
                )}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
              </div>
              <div
                className={`flex-1 min-w-0 ${
                  collapsed ? 'lg:hidden' : 'block'
                }`}
              >
                <div className="flex items-center gap-1">
                  <p className="text-sm font-semibold text-gray-900 truncate leading-tight">
                    {user.name}
                  </p>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
                </div>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </NavLink>
          )}

          <button
            onClick={logout}
            className={`flex items-center gap-3 px-3.5 py-2.5 w-full rounded-full text-sm font-medium text-red-500 hover:bg-red-50 transition-all ${
              collapsed ? 'lg:justify-center' : ''
            }`}
            title="Sign Out"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className={collapsed ? 'lg:hidden' : 'inline-block'}>
              Sign Out
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
