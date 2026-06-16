import { Zap, Key, CheckCircle2, ShoppingCart, Trash2, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const cards = [
  {
    path: '/dashboard/admin/users',
    icon: <Zap className="w-6 h-6" />,
    color: 'bg-indigo-50 text-indigo-600',
    title: 'Users & Access',
    desc: 'Manage user accounts, roles, and balances.',
  },
  {
    path: '/dashboard/admin/roles',
    icon: <Key className="w-6 h-6" />,
    color: 'bg-purple-50 text-purple-600',
    title: 'Roles & Permissions',
    desc: 'Configure global roles and RBAC policies.',
  },
  {
    path: '/dashboard/admin/plans',
    icon: <CheckCircle2 className="w-6 h-6" />,
    color: 'bg-emerald-50 text-emerald-600',
    title: 'Subscription Plans',
    desc: 'Manage pricing tiers and limits.',
  },
  {
    path: '/dashboard/admin/orders',
    icon: <ShoppingCart className="w-6 h-6" />,
    color: 'bg-blue-50 text-blue-600',
    title: 'Order History',
    desc: 'View customer purchases and revenues.',
  },
  {
    path: '/dashboard/admin/moderation',
    icon: <Trash2 className="w-6 h-6" />,
    color: 'bg-rose-50 text-rose-600',
    title: 'Resource Moderation',
    desc: 'View and moderate generated contents.',
  },
  {
    path: '/dashboard/admin/products',
    icon: <ShoppingBag className="w-6 h-6" />,
    color: 'bg-pink-50 text-pink-600',
    title: 'Store Products',
    desc: 'Manage marketplace datasets, APIs, and items.',
  },
];

export default function AdminDashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-800">
            <Zap className="text-amber-500" /> Admin Dashboard
          </h2>
          <p className="text-sm text-slate-500 mt-1">Manage system configurations and users.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map(card => (
          <div
            key={card.path}
            onClick={() => navigate(card.path)}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 cursor-pointer transition group"
          >
            <div className={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition`}>
              {card.icon}
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">{card.title}</h3>
            <p className="text-sm text-slate-500">{card.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
