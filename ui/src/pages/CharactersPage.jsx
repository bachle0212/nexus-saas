import { motion } from 'framer-motion';
import { Image as ImageIcon, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { useRef } from 'react';

import api from '../lib/api';

export default function CharactersPage() {
  const queryClient = useQueryClient();
  const nameRef = useRef();
  const promptRef = useRef();
  const seedRef = useRef();

  const { data: characters = [] } = useQuery({
    queryKey: ['characters'],
    queryFn: () => api.get('/api/characters').then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (payload) => api.post('/api/characters', payload),
    onSuccess: () => {
      toast.success('Character created!');
      if (nameRef.current) nameRef.current.value = '';
      if (promptRef.current) promptRef.current.value = '';
      if (seedRef.current) seedRef.current.value = '';
      queryClient.invalidateQueries({ queryKey: ['characters'] });
    },
    onError: () => toast.error('Error creating character'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/api/characters/${id}`),
    onSuccess: () => {
      toast.success('Deleted!');
      queryClient.invalidateQueries({ queryKey: ['characters'] });
    },
    onError: () => toast.error('Error deleting character'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const name = nameRef.current?.value;
    const prompt_injection = promptRef.current?.value;
    const seed = seedRef.current?.value;
    if (!name || !prompt_injection || !seed) return;
    createMutation.mutate({ name, prompt_injection, seed: parseInt(seed) });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ImageIcon className="text-indigo-500" /> Character Vault
          </h2>
          <p className="text-slate-500 mt-1">Create consistent characters using locked seeds and fixed physical traits.</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Character Name</label>
              <input
                ref={nameRef}
                required
                type="text"
                placeholder="e.g. Cyberpunk Ninja"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fixed Seed</label>
              <input
                ref={seedRef}
                required
                type="number"
                placeholder="123456"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Physical Traits (Prompt Injection)</label>
            <textarea
              ref={promptRef}
              required
              rows={2}
              placeholder="e.g. 1girl, 25 years old, short blonde hair, blue eyes, wearing a red leather jacket"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-medium transition disabled:opacity-50"
          >
            {createMutation.isPending ? 'Creating...' : 'Create Character'}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {characters.map(c => (
          <div key={c.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative group">
            <button
              onClick={() => {
                if (window.confirm('Delete this character?')) {
                  deleteMutation.mutate(c.id);
                }
              }}
              className="absolute top-4 right-4 text-red-500 opacity-0 group-hover:opacity-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-bold text-lg text-slate-800">{c.name}</h3>
            <p className="text-xs text-indigo-600 font-mono mt-1 mb-3">Seed: {c.seed}</p>
            <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-600">
              <strong>Injection:</strong> {c.prompt_injection}
            </div>
          </div>
        ))}
        {characters.length === 0 && <p className="text-slate-500 col-span-2">No characters yet.</p>}
      </div>
    </motion.div>
  );
}
