import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import api from '../../lib/api';

export default function AdminAnalyticsPage() {
  const { data: adminAnalytics, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => api.get('/api/analytics/admin').then(r => r.data),
  });

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <Zap className="text-amber-500" /> Platform Analytics
      </h2>

      {isLoading ? (
        <div className="text-slate-400 text-center py-12">Loading platform analytics...</div>
      ) : !adminAnalytics ? (
        <div className="text-slate-400 text-center py-12">No analytics data available.</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Users', value: adminAnalytics.kpis?.total_users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
              { label: 'New (30d)', value: adminAnalytics.kpis?.new_users_30d, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Monthly Revenue', value: `$${(adminAnalytics.kpis?.mrr_usd ?? 0).toFixed(2)}`, color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Active Plans', value: adminAnalytics.plan_distribution?.length, color: 'text-rose-600', bg: 'bg-rose-50' },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className={`${bg} p-5 rounded-xl border border-slate-200 shadow-sm`}>
                <p className="text-sm text-slate-500 font-medium">{label}</p>
                <p className={`text-2xl font-bold mt-1 ${color}`}>{value ?? '—'}</p>
              </div>
            ))}
          </div>

          {adminAnalytics.top_users?.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="font-bold text-slate-800">Top Users by Usage</h3>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-6 py-3 text-left">Email</th>
                    <th className="px-6 py-3 text-left">Plan</th>
                    <th className="px-6 py-3 text-left">Generations</th>
                    <th className="px-6 py-3 text-left">Credits</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {adminAnalytics.top_users.map((u, i) => (
                    <tr key={u.u_id || i} className="hover:bg-slate-50">
                      <td className="px-6 py-3 font-medium">{u.u_email}</td>
                      <td className="px-6 py-3">
                        <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded font-bold">{u.u_plan}</span>
                      </td>
                      <td className="px-6 py-3 font-mono">{u.gen_count}</td>
                      <td className="px-6 py-3 font-mono text-amber-600">{u.u_credits}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {adminAnalytics.plan_distribution?.length > 0 && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4">Plan Distribution</h3>
              <div className="space-y-3">
                {adminAnalytics.plan_distribution.map(p => (
                  <div key={p.plan} className="flex items-center gap-3">
                    <span className="w-20 text-sm font-medium text-slate-700 shrink-0">{p.plan}</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-2">
                      <div
                        className="bg-indigo-500 h-2 rounded-full"
                        style={{ width: `${(p.count / (adminAnalytics.kpis?.total_users || 1)) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-slate-600 w-6 text-right">{p.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
