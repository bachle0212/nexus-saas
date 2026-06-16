import { motion } from 'framer-motion';
import { ShoppingBag, Zap, Plus, Edit, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { useRef } from 'react';

import api, { API_BASE } from '../../lib/api';

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const modalRef = useRef();
  const idRef = useRef();
  const nameRef = useRef();
  const descRef = useRef();
  const priceRef = useRef();
  const stockRef = useRef();
  const imgRef = useRef();

  const { data: products = [] } = useQuery({
    queryKey: ['store-products'],
    queryFn: () => api.get('/api/store/products').then(r => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: (payload) => {
      const { id, ...data } = payload;
      if (id) return api.put(`${API_BASE}/api/admin/products/${id}`, data);
      return api.post(`${API_BASE}/api/admin/products`, data);
    },
    onSuccess: () => {
      toast.success('Saved!');
      hideModal();
      queryClient.invalidateQueries({ queryKey: ['store-products'] });
    },
    onError: () => toast.error('Error saving product'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`${API_BASE}/api/admin/products/${id}`),
    onSuccess: () => {
      toast.success('Deleted');
      queryClient.invalidateQueries({ queryKey: ['store-products'] });
    },
    onError: () => toast.error('Error deleting product'),
  });

  const showModal = (p = null) => {
    if (idRef.current) idRef.current.value = p?.id || '';
    if (nameRef.current) nameRef.current.value = p?.name || '';
    if (descRef.current) descRef.current.value = p?.description || '';
    if (priceRef.current) priceRef.current.value = p?.price || 100;
    if (stockRef.current) stockRef.current.value = p?.inventory || 1000;
    if (imgRef.current) imgRef.current.value = p?.image_url || '';
    modalRef.current?.classList.remove('hidden');
  };

  const hideModal = () => modalRef.current?.classList.add('hidden');

  const handleSave = () => {
    saveMutation.mutate({
      id: idRef.current?.value || undefined,
      name: nameRef.current?.value,
      description: descRef.current?.value,
      price: parseInt(priceRef.current?.value),
      inventory: parseInt(stockRef.current?.value),
      image_url: imgRef.current?.value,
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-800">
            <ShoppingBag className="text-pink-500" /> Products Management
          </h2>
          <p className="text-sm text-slate-500 mt-1">Add, edit or remove items from the Content Store.</p>
        </div>
        <div className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded flex items-center gap-1 uppercase">
          <Zap className="w-3 h-3" /> ADMIN DASHBOARD
        </div>
      </div>

      <div className="flex justify-end mb-4">
        <button
          onClick={() => showModal()}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
            <tr>
              <th className="px-6 py-4">Image</th>
              <th className="px-6 py-4">Name & Desc</th>
              <th className="px-6 py-4">Price</th>
              <th className="px-6 py-4">Stock</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map(p => (
              <tr key={p.id} className="hover:bg-slate-50 transition">
                <td className="px-6 py-4">
                  <img
                    src={p.image_url || 'https://via.placeholder.com/150'}
                    className="w-12 h-12 rounded object-cover border border-slate-200"
                    alt="img"
                  />
                </td>
                <td className="px-6 py-4">
                  <p className="font-bold text-slate-900">{p.name}</p>
                  <p className="text-xs text-slate-500 truncate max-w-xs">{p.description}</p>
                </td>
                <td className="px-6 py-4 font-bold text-emerald-600">
                  <Zap className="w-3 h-3 inline mr-1" />{p.price}
                </td>
                <td className="px-6 py-4">{p.inventory}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => showModal(p)} className="text-blue-600 hover:text-blue-800 p-2">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Delete product?')) deleteMutation.mutate(p.id);
                    }}
                    className="text-red-500 hover:text-red-700 p-2 ml-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-slate-500">No products found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Product Modal (imperative show/hide to match original pattern) */}
      <div ref={modalRef} className="hidden fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
          <h3 className="text-xl font-bold mb-4">Product Details</h3>
          <input type="hidden" ref={idRef} />
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <input ref={nameRef} type="text" className="w-full px-3 py-2 border rounded-lg bg-slate-50 mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <input ref={descRef} type="text" className="w-full px-3 py-2 border rounded-lg bg-slate-50 mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Price (Credits)</label>
                <input ref={priceRef} type="number" className="w-full px-3 py-2 border rounded-lg bg-slate-50 mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Stock</label>
                <input ref={stockRef} type="number" className="w-full px-3 py-2 border rounded-lg bg-slate-50 mt-1" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Image URL</label>
              <input ref={imgRef} type="text" className="w-full px-3 py-2 border rounded-lg bg-slate-50 mt-1" />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button onClick={hideModal} className="px-4 py-2 text-slate-600 font-medium">Cancel</button>
            <button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
