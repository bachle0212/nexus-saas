import { motion } from 'framer-motion';
import ProfileSettings from '../components/ProfileSettings';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();

  const handleUpdate = ({ display_name, avatar_url }) => {
    updateUser({ display_name, avatar_url });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <h2 className="text-2xl font-bold">Profile & Settings</h2>
      <ProfileSettings
        api={api}
        user={{
          email: user?.email || '',
          display_name: user?.display_name || null,
          avatar_url: user?.avatar_url || null,
        }}
        onUpdate={handleUpdate}
      />
    </motion.div>
  );
}
