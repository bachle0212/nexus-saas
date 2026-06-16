import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

import api from '../lib/api';
import { useAuthStore } from '../store/authStore';

export default function StorePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const credits = useAuthStore(s => s.credits);
  const setCredits = useAuthStore(s => s.setCredits);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['store-products'],
    queryFn: () => api.get('/api/store/products').then(r => r.data),
  });

  const handleBuy = async (prod) => {
    if (credits < prod.price) {
      toast.error('Not enough credits!');
      return;
    }
    try {
      const res = await api.post('/api/store/orders', {
        product_id: prod.id,
        quantity: 1,
        shipping_address: 'Digital Delivery',
      });
      if (res.data.checkout_url) {
        window.location.href = res.data.checkout_url;
      } else {
        setCredits(credits - prod.price);
        toast.success(`Purchased ${prod.name}!`);
        queryClient.invalidateQueries({ queryKey: ['my-orders'] });
        navigate('/dashboard/my-orders');
      }
    } catch {
      toast.error('Purchase failed');
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-64 bg-slate-200 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Zap className="text-indigo-500" /> API Marketplace
          </h2>
          <p className="text-slate-500 mt-1">Purchase Enterprise API Keys, Datasets, and Services.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-100 flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-500" />
          <span className="font-bold">{credits} Credits</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map(prod => (
          <div key={prod.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-lg transition flex flex-col overflow-hidden">
            <div className="h-40 w-full bg-slate-100 relative">
              <img src={prod.image_url} alt={prod.name} className="w-full h-full object-cover" />
              <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded border border-slate-200 shadow-sm flex items-center gap-1">
                <Zap className="w-4 h-4 text-amber-500" />
                <span className="font-bold text-slate-800 text-sm">{prod.price}</span>
              </div>
            </div>
            <div className="p-5 flex flex-col flex-1">
              <h3 className="text-lg font-bold mb-2 text-slate-800 line-clamp-1">{prod.name}</h3>
              <p className="text-slate-500 mb-6 flex-1 text-sm line-clamp-3">{prod.description}</p>
              <button
                onClick={() => handleBuy(prod)}
                className="w-full bg-slate-900 text-white py-2.5 rounded-lg font-medium hover:bg-slate-800 transition shadow-sm"
              >
                Buy Now
              </button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
