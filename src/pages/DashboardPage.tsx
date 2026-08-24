import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboardApi } from '../api/client';
import { StatsCard } from '../components/StatsCard';
import { BookOpen, FolderTree, ShoppingCart, Users, DollarSign, TrendingUp, LayoutDashboard } from 'lucide-react';

export function DashboardPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      dashboardApi.stats(token)
        .then(setStats)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-emerald-900/30 border-t-emerald-900 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <div className="flex items-center gap-3">
          <LayoutDashboard className="w-8 h-8 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <h1 className="text-2xl sm:text-3xl font-bold text-black dark:text-black">Dashboard</h1>
        </div>
        <p className="text-gray-500 mt-1">Overview of your bookstore metrics and recent activity</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatsCard
          title="Total Books"
          value={stats?.total_books ?? 0}
          icon={<BookOpen className="w-6 h-6 text-white" />}
          gradient="from-emerald-800 to-green-900"
          subtitle="In catalog"
        />
        <StatsCard
          title="Categories"
          value={stats?.total_categories ?? 0}
          icon={<FolderTree className="w-6 h-6 text-white" />}
          gradient="from-teal-700 to-emerald-800"
          subtitle="Active genres"
        />
        <StatsCard
          title="Total Orders"
          value={stats?.total_orders ?? 0}
          icon={<ShoppingCart className="w-6 h-6 text-white" />}
          gradient="from-emerald-600 to-teal-800"
          subtitle="All time"
        />
        <StatsCard
          title="Customers"
          value={stats?.total_users ?? 0}
          icon={<Users className="w-6 h-6 text-white" />}
          gradient="from-green-700 to-emerald-900"
          subtitle="Registered users"
        />
        <StatsCard
          title="Revenue"
          value={`$${(stats?.total_revenue ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          icon={<DollarSign className="w-6 h-6 text-white" />}
          gradient="from-emerald-800 to-emerald-950"
          subtitle="Total earned"
        />
      </div>

      {/* Recent Orders */}
      <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
            <p className="text-xs text-gray-500 mt-0.5">Latest 5 orders placed by customers</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {stats?.recent_orders?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/30">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3.5">Order ID</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3.5">Customer</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3.5">Total</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3.5">Status</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3.5">Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_orders.map((order: any) => (
                  <tr key={order.id} className="border-b border-gray-100/70 hover:bg-emerald-50/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono font-semibold text-emerald-900">#{order.id}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">{order.user?.name || 'Guest'}</td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">${order.total.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-gray-500">
            <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30 text-emerald-800" />
            <p className="font-semibold text-gray-800">No orders yet</p>
            <p className="text-xs text-gray-500 mt-1">Orders will appear here once customers place them</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-800 border-amber-200',
    processing: 'bg-blue-50 text-blue-800 border-blue-200',
    in_transit: 'bg-purple-50 text-purple-800 border-purple-200',
    shipped: 'bg-teal-50 text-teal-800 border-teal-200',
    delivered: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    cancelled: 'bg-red-50 text-red-800 border-red-200',
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${styles[status] || styles.pending}`}>
      {status.replace('_', ' ').toUpperCase()}
    </span>
  );
}
