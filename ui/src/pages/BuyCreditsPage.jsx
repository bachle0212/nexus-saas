import { motion } from 'framer-motion';
import { Zap, CheckCircle2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';

import api from '../lib/api';

export default function BuyCreditsPage() {
  const { data: creditPackages = [], isLoading } = useQuery({
    queryKey: ['credit-packages'],
    queryFn: () => api.get('/api/billing/credit-packages').then(r => r.data),
  });

  const handleBuy = async (pkg) => {
    try {
      const res = await api.post('/api/billing/buy-credits', { package_id: pkg.id });
      if (res.data.checkout_url) {
        window.location.href = res.data.checkout_url;
      } else {
        toast.success(res.data.message);
      }
    } catch {
      toast.error('Purchase failed');
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-64 bg-slate-200 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <Zap className="text-amber-500" /> Buy Credits
      </h2>
      <p className="text-slate-500">Top up your credit balance instantly. No subscription required.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {creditPackages.map(pkg => (
          <div
            key={pkg.id}
            className="bg-white rounded-2xl border-2 border-slate-100 hover:border-indigo-300 p-6 shadow-sm transition flex flex-col"
          >
            <div className="flex-1">
              <h3 className="text-xl font-bold text-slate-800 mb-1">{pkg.label}</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-bold">${pkg.price_usd}</span>
                <span className="text-slate-400 text-sm">one-time</span>
              </div>
              <ul className="space-y-2 text-sm text-slate-600 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {pkg.credits} AI Credits
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Never expires
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Instant delivery
                </li>
              </ul>
            </div>
            <button
              onClick={() => handleBuy(pkg)}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl font-bold transition"
            >
              Buy {pkg.label}
            </button>
          </div>
        ))}
        {creditPackages.length === 0 && (
          <div className="col-span-3 text-center text-slate-400 py-8">Credit packages loading...</div>
        )}
      </div>
    </motion.div>
  );
}
