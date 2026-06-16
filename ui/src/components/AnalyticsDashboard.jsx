import { useState, useEffect } from 'react';
import { Zap, Image as ImageIcon, Video, Edit, TrendingUp, CreditCard } from 'lucide-react';
import { SkeletonStats } from './SkeletonCard';

function BarChart({ labels, data }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-2 h-32">
      {labels.map((label, i) => (
        <div key={label} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full bg-brand-500 rounded-t transition-all duration-500"
            style={{ height: `${(data[i] / max) * 100}%`, minHeight: data[i] > 0 ? '4px' : '0' }}
          />
          <span className="text-[9px] text-slate-400 font-mono">
            {label.split('-').slice(1).join('/')}
          </span>
        </div>
      ))}
    </div>
  );
}

function StatCard({ icon, label, value, sub, color = 'indigo' }) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
  };
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
      <div className={`w-10 h-10 ${colors[color]} rounded-xl flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-sm text-slate-500 font-medium">{label}</p>
      <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function AnalyticsDashboard({ api }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/analytics/dashboard')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <SkeletonStats />;
  if (!data) return <p className="text-slate-500">Failed to load analytics.</p>;

  const { stats, chart, recent_payments } = data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard icon={<ImageIcon className="w-5 h-5" />} label="Total Images" value={stats.total_images} color="indigo" />
        <StatCard icon={<Video className="w-5 h-5" />} label="Total Videos" value={stats.total_videos} color="rose" />
        <StatCard icon={<Edit className="w-5 h-5" />} label="Scripts Written" value={stats.total_scripts} color="amber" />
        <StatCard
          icon={<Zap className="w-5 h-5" />}
          label="Credits Left"
          value={stats.credits_remaining}
          sub={`Plan: ${stats.current_plan}`}
          color="emerald"
        />
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-brand-500" /> Images Generated (Last 7 Days)
        </h3>
        {chart && <BarChart labels={chart.labels} data={chart.data} />}
      </div>

      {recent_payments?.length > 0 && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-500" /> Recent Payments
          </h3>
          <div className="space-y-2">
            {recent_payments.map(p => (
              <div key={p.id} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-slate-700">{p.description || 'Payment'}</p>
                  <p className="text-xs text-slate-400">{new Date(p.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-emerald-600">${p.amount}</p>
                  <p className="text-xs text-slate-400">+{p.credits_added} credits</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
