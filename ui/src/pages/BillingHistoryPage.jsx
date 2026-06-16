import { motion } from 'framer-motion';
import { CreditCard } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import api from '../lib/api';

export default function BillingHistoryPage() {
  const { data: billingHistory = [], isLoading } = useQuery({
    queryKey: ['billing-history'],
    queryFn: () => api.get('/api/billing/history').then(r => r.data).catch(() => []),
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-slate-200 rounded-lg" />)}
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <CreditCard className="text-emerald-500" /> Billing History
      </h2>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
            <tr>
              <th className="px-6 py-3">Description</th>
              <th className="px-6 py-3">Amount</th>
              <th className="px-6 py-3">Credits</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {billingHistory.map(p => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-700">{p.description || 'Payment'}</td>
                <td className="px-6 py-4 font-bold text-emerald-600">${p.amount}</td>
                <td className="px-6 py-4 text-indigo-600 font-mono">+{p.credits_added}</td>
                <td className="px-6 py-4">
                  <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded font-bold">{p.status}</span>
                </td>
                <td className="px-6 py-4 text-slate-400 text-xs">{new Date(p.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {billingHistory.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-slate-400">No payment history yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
