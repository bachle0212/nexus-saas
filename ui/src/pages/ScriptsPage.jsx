import { motion } from 'framer-motion';
import { Edit } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { useRef } from 'react';

import api from '../lib/api';

export default function ScriptsPage() {
  const queryClient = useQueryClient();
  const topicRef = useRef();
  const toneRef = useRef();
  const lengthRef = useRef();

  const { data: scripts = [] } = useQuery({
    queryKey: ['scripts'],
    queryFn: () => api.get('/api/scripts').then(r => r.data),
  });

  const generateMutation = useMutation({
    mutationFn: (payload) => api.post('/api/scripts/generate', payload),
    onSuccess: () => {
      toast.success('Script generated successfully!');
      if (topicRef.current) topicRef.current.value = '';
      queryClient.invalidateQueries({ queryKey: ['scripts'] });
      queryClient.invalidateQueries({ queryKey: ['credits'] });
    },
    onError: (err) => {
      if (err.response?.status === 402) {
        toast.warning('Not enough credits! (Costs 2 credits)');
      } else {
        toast.error('Error generating script');
      }
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const topic = topicRef.current?.value;
    const tone = toneRef.current?.value;
    const length = lengthRef.current?.value;
    if (!topic) return;
    generateMutation.mutate({ topic, tone, length });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Edit className="text-indigo-500" /> Script Studio
          </h2>
          <p className="text-slate-500 mt-1">Generate professional video scripts using LLaMA 3 70B.</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Topic / Idea</label>
            <textarea
              ref={topicRef}
              required
              rows={2}
              placeholder="A short documentary about how black holes actually work..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tone</label>
              <select
                ref={toneRef}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="professional">Professional / Documentary</option>
                <option value="dramatic">Dramatic / Cinematic</option>
                <option value="humorous">Humorous / Fun</option>
                <option value="educational">Educational / Simple</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Length</label>
              <select
                ref={lengthRef}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="60-second YouTube Short">60-second Short (TikTok/Reels)</option>
                <option value="3-minute">3-minute Video</option>
                <option value="10-minute long-form">10-minute Long-form</option>
              </select>
            </div>
          </div>
          <button
            disabled={generateMutation.isPending}
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-medium transition disabled:opacity-50 flex items-center gap-2"
          >
            {generateMutation.isPending ? 'Writing...' : 'Generate Script (2 Credits)'}
          </button>
        </form>
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-lg text-slate-800">Your Scripts</h3>
        {scripts.map(s => (
          <div key={s.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h4 className="font-bold text-slate-800 mb-2">{s.title}</h4>
            <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-700 whitespace-pre-wrap font-mono h-64 overflow-y-auto border border-slate-100">
              {s.content}
            </div>
          </div>
        ))}
        {scripts.length === 0 && <p className="text-slate-500">No scripts generated yet.</p>}
      </div>
    </motion.div>
  );
}
