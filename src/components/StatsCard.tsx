import { ReactNode } from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  gradient: string;
  subtitle?: string;
}

export function StatsCard({ title, value, icon, gradient, subtitle }: StatsCardProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-white border border-gray-100 p-6 group hover:border-emerald-200 transition-all hover:shadow-xl shadow-sm animate-fade-in">
      {/* Gradient accent */}
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity ${gradient}`} />

      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">{title}</p>
          <p className="text-3xl font-bold text-gray-900 tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1 font-medium">{subtitle}</p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg shadow-emerald-950/10`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
