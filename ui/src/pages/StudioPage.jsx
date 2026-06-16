import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wand2, Download, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

import api from '../lib/api';

export default function StudioPage() {
  const queryClient = useQueryClient();
  const [prompt, setPrompt] = useState('');
  const [width, setWidth] = useState(1024);
  const [height, setHeight] = useState(1024);
  const [seed, setSeed] = useState('');
  const [selectedChar, setSelectedChar] = useState('');

  const { data: characters = [] } = useQuery({
    queryKey: ['characters'],
    queryFn: () => api.get('/api/characters').then(r => r.data),
  });

  const { data: history = [] } = useQuery({
    queryKey: ['generations'],
    queryFn: () => api.get('/api/history').then(r => r.data),
  });

  const generateMutation = useMutation({
    mutationFn: (payload) => api.post('/api/generate', payload),
    onSuccess: () => {
      setPrompt('');
      toast.success('Image generated successfully!');
      queryClient.invalidateQueries({ queryKey: ['generations'] });
      queryClient.invalidateQueries({ queryKey: ['credits'] });
    },
    onError: (err) => {
      if (err.response?.status === 402) {
        toast.warning('Not enough credits! Please top up.');
      } else {
        toast.error('Error generating image');
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/api/resources/generations/${id}`),
    onSuccess: () => {
      toast.success('Deleted');
      queryClient.invalidateQueries({ queryKey: ['generations'] });
    },
    onError: () => toast.error('Delete failed'),
  });

  const handleGenerate = (e) => {
    e.preventDefault();
    if (!prompt) return;
    generateMutation.mutate({
      prompt,
      width,
      height,
      seed: seed ? parseInt(seed) : undefined,
      character_id: selectedChar ? parseInt(selectedChar) : undefined,
    });
  };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Wand2 className="text-indigo-500" /> Create New AI Masterpiece
        </h2>
        <form onSubmit={handleGenerate} className="flex flex-col gap-4">
          <div className="flex gap-4">
            <input
              type="text"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="A futuristic cyberpunk city at night with neon lights, 4k..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
            />
            <button
              disabled={generateMutation.isPending || !prompt}
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 rounded-xl font-medium transition disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
            >
              {generateMutation.isPending ? 'Generating...' : 'Generate (5 Credits)'}
            </button>
          </div>

          <div className="flex gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 flex-wrap">
            <div className="flex-1 min-w-[120px]">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Character (Vault)</label>
              <select
                value={selectedChar}
                onChange={e => setSelectedChar(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">None (Freestyle)</option>
                {characters.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[120px]">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Aspect Ratio</label>
              <select
                value={`${width}x${height}`}
                onChange={(e) => {
                  const [w, h] = e.target.value.split('x');
                  setWidth(parseInt(w));
                  setHeight(parseInt(h));
                }}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="1024x1024">Square (1:1)</option>
                <option value="1024x768">Landscape (4:3)</option>
                <option value="1920x1080">Widescreen (16:9)</option>
                <option value="768x1024">Portrait (3:4)</option>
                <option value="1080x1920">Mobile (9:16)</option>
              </select>
            </div>

            <div className="flex-1 min-w-[120px]">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Seed (Optional)</label>
              <input
                type="number"
                value={seed}
                onChange={e => setSeed(e.target.value)}
                placeholder="Random"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </form>
      </motion.div>

      {history.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800">Recent Generations</h3>
            <span className="text-sm text-slate-500">{history.length} images</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {history.map((item) => (
              <div key={item.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200 group flex flex-col">
                <div className="aspect-square bg-slate-100 relative">
                  <img src={item.result_url} className="w-full h-full object-cover" alt="gen" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => window.open(item.result_url, '_blank')}
                      className="bg-white text-slate-900 p-2 rounded-full"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Delete?')) deleteMutation.mutate(item.id);
                      }}
                      className="bg-red-500 text-white p-2 rounded-full"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-xs text-slate-500 line-clamp-2">{item.prompt}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
