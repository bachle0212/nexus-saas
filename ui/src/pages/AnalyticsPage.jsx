import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import api from '../lib/api';

export default function AnalyticsPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <Zap className="text-indigo-500" /> My Analytics
      </h2>
      <AnalyticsDashboard api={api} />
    </motion.div>
  );
}
