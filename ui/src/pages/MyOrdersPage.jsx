import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import api from '../lib/api';

export default function MyOrdersPage() {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => api.get('/api/store/orders').then(r => r.data),
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-slate-200 rounded-lg" />)}
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
          <Zap className="text-indigo-500" /> My Purchases
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500">
                <th className="p-4 font-medium rounded-l-lg">Order ID</th>
                <th className="p-4 font-medium">Items</th>
                <th className="p-4 font-medium">Total</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium rounded-r-lg">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} className="border-b border-slate-50 last:border-0">
                  <td className="p-4 font-mono text-xs">#{o.id.toString().padStart(6, '0')}</td>
                  <td className="p-4">
                    {o.items.map((i, idx) => (
                      <div key={idx} className="font-medium text-slate-800">{i.quantity}x {i.product_name}</div>
                    ))}
                  </td>
                  <td className="p-4 font-bold text-emerald-600">${o.total}</td>
                  <td className="p-4">
                    <span className="bg-indigo-100 text-indigo-700 text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider">
                      {o.status}
                    </span>
                  </td>
                  <td className="p-4 text-slate-500">{new Date(o.date).toLocaleDateString()}</td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-400">No purchases yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
