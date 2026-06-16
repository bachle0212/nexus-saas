import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Wand2, Image as ImageIcon, Zap } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

import api from '../lib/api';

export default function VideoPage() {
  const queryClient = useQueryClient();
  const [generating, setGenerating] = useState(false);
  // Track all active intervals so we can clear them on unmount
  const pollRefs = useRef(new Set());

  useEffect(() => {
    return () => {
      pollRefs.current.forEach(clearInterval);
    };
  }, []);

  const { data: videoHistory = [] } = useQuery({
    queryKey: ['video-history'],
    queryFn: () => api.get('/api/video/history').then(r => r.data),
  });

  const startPolling = (jobId) => {
    const poll = setInterval(async () => {
      try {
        const s = await api.get(`/api/video/${jobId}/status`);
        if (s.data.status === 'completed') {
          clearInterval(poll);
          pollRefs.current.delete(poll);
          toast.success('Video ready!');
          queryClient.invalidateQueries({ queryKey: ['video-history'] });
        } else if (s.data.status === 'failed') {
          clearInterval(poll);
          pollRefs.current.delete(poll);
          toast.error('Video generation failed — credits refunded.');
        }
      } catch {
        clearInterval(poll);
        pollRefs.current.delete(poll);
      }
    }, 4000);
    pollRefs.current.add(poll);
  };

  const handleTextToVideo = async (e) => {
    e.preventDefault();
    const vprompt = e.target.elements.video_prompt.value;
    if (!vprompt) return;
    setGenerating(true);
    try {
      const res = await api.post('/api/video/generate', { prompt: vprompt });
      toast.success(`Job started! ID: ${res.data.job_id}. Polling for completion...`);
      e.target.reset();
      startPolling(res.data.job_id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error starting video job');
    }
    setGenerating(false);
  };

  const handleImageToVideo = async (e) => {
    e.preventDefault();
    const vurl = e.target.elements.video_image_url.value;
    if (!vurl) return;
    setGenerating(true);
    try {
      const res = await api.post('/api/video/generate', { image_url: vurl });
      toast.success('Job started! Polling for completion...');
      e.target.reset();
      startPolling(res.data.job_id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error starting video job');
    }
    setGenerating(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Zap className="text-indigo-500" /> Video Studio
          </h2>
          <p className="text-slate-500 mt-1">Transform Text or Images into motion. (Cost: 20 Credits) — Async processing, no page lock.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-indigo-500" /> Text to Video
          </h3>
          <form onSubmit={handleTextToVideo} className="space-y-4">
            <textarea
              name="video_prompt"
              required
              rows={3}
              placeholder="A cinematic drone shot of a futuristic city..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              disabled={generating}
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg font-medium transition disabled:opacity-50"
            >
              {generating ? 'Queuing...' : 'Generate from Text (Async)'}
            </button>
          </form>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-indigo-500" /> Image to Video
          </h3>
          <form onSubmit={handleImageToVideo} className="space-y-4">
            <input
              name="video_image_url"
              type="url"
              required
              placeholder="Paste image URL here (https://...)"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-[10px] text-slate-400 -mt-2">Tip: Use an image from your Gallery or any public URL.</p>
            <button
              disabled={generating}
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg font-medium transition disabled:opacity-50"
            >
              {generating ? 'Queuing...' : 'Animate this Image (Async)'}
            </button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {videoHistory.map(v => (
          <div key={v.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {v.status === 'processing' ? (
              <div className="w-full aspect-video bg-slate-100 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-slate-500 font-medium">Processing...</p>
              </div>
            ) : v.status === 'failed' ? (
              <div className="w-full aspect-video bg-red-50 flex items-center justify-center">
                <p className="text-red-500 text-sm font-medium">Generation failed</p>
              </div>
            ) : (
              <video src={v.result_url} controls className="w-full aspect-video bg-black" />
            )}
            <div className="p-4 flex justify-between items-center">
              <p className="text-sm text-slate-600 line-clamp-2 flex-1">{v.prompt}</p>
              <span className={`ml-2 text-[10px] px-2 py-0.5 rounded font-bold uppercase shrink-0 ${
                v.status === 'completed' ? 'bg-emerald-100 text-emerald-700'
                : v.status === 'failed' ? 'bg-red-100 text-red-600'
                : 'bg-amber-100 text-amber-700'
              }`}>
                {v.status}
              </span>
            </div>
          </div>
        ))}
        {videoHistory.length === 0 && (
          <p className="text-slate-500 col-span-2">No videos generated yet.</p>
        )}
      </div>
    </motion.div>
  );
}
