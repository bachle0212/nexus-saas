import { useLocation, Link } from 'react-router-dom';
import { Zap, Wand2, Image as ImageIcon, Edit, CheckCircle2, ShoppingCart, Key, LogOut, ShoppingBag, BarChart2, User, CreditCard, Video } from 'lucide-react';

export default function Sidebar({
  isMobileMenuOpen, setIsMobileMenuOpen,
  userEmail, userPlan, userRole, credits, hasPerm, logout,
}) {
  const location = useLocation();

  const btn = (path, icon, label) => {
    // For /dashboard/admin, only mark active when exactly on that path (not sub-paths)
    const isActive = path === '/dashboard/admin'
      ? location.pathname === path
      : location.pathname === path || location.pathname.startsWith(path + '/');
    return (
      <Link
        to={path}
        onClick={() => setIsMobileMenuOpen(false)}
        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition text-sm ${
          isActive
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }`}
      >
        {icon} {label}
      </Link>
    );
  };

  return (
    <>
      <div className={`${isMobileMenuOpen ? 'flex' : 'hidden'} md:flex w-full md:w-64 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 p-6 flex-col relative z-50 shrink-0`}>
        {/* Logo */}
        <div className="hidden md:flex items-center gap-2 pb-6">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.5)]">
            <Zap className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">Nexus AI</h1>
        </div>

        {/* User Chip */}
        <div className="px-4 py-3 border border-slate-700 bg-slate-800/50 rounded-xl mb-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 font-bold border border-indigo-500/30 shrink-0 text-sm">
              {userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-slate-200 truncate">{userEmail}</p>
              <p className="text-xs text-indigo-400 capitalize font-medium">{userPlan} Plan</p>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-0.5 py-2 overflow-y-auto min-h-0">
          {/* AI Tools */}
          {hasPerm('generate:image') && (
            <>
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider px-4 pt-3 pb-1">AI Studio</p>
              {btn('/dashboard/studio', <Wand2 className="w-4 h-4" />, 'Image Studio')}
              {btn('/dashboard/characters', <ImageIcon className="w-4 h-4" />, 'Character Vault')}
              {btn('/dashboard/scripts', <Edit className="w-4 h-4" />, 'Script Studio')}
              {btn('/dashboard/video', <Video className="w-4 h-4" />, 'Video Studio')}
              {btn('/dashboard/gallery', <ImageIcon className="w-4 h-4" />, 'My Gallery')}

              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider px-4 pt-4 pb-1">Billing</p>
              {btn('/dashboard/billing', <CheckCircle2 className="w-4 h-4" />, 'Subscription')}
              {btn('/dashboard/billing/buy-credits', <Zap className="w-4 h-4" />, 'Buy Credits')}
              {btn('/dashboard/billing/history', <CreditCard className="w-4 h-4" />, 'Billing History')}

              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider px-4 pt-4 pb-1">More</p>
              {btn('/dashboard/store', <ShoppingCart className="w-4 h-4" />, 'Content Store')}
              {btn('/dashboard/my-orders', <ShoppingBag className="w-4 h-4" />, 'My Orders')}
              {btn('/dashboard/analytics', <BarChart2 className="w-4 h-4" />, 'Analytics')}
              {btn('/dashboard/api-keys', <Key className="w-4 h-4" />, 'API Keys')}
              {btn('/dashboard/profile', <User className="w-4 h-4" />, 'Profile')}
            </>
          )}

          {/* Admin */}
          {userRole === 'admin' && (
            <>
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider px-4 pt-4 pb-1">Administration</p>
              {btn('/dashboard/admin', <Zap className="w-4 h-4" />, 'Admin Dashboard')}
              {hasPerm('users:read') && btn('/dashboard/admin/users', <User className="w-4 h-4" />, 'Users')}
              {hasPerm('roles:manage') && btn('/dashboard/admin/roles', <Key className="w-4 h-4" />, 'Roles & Perms')}
              {hasPerm('roles:manage') && btn('/dashboard/admin/plans', <CreditCard className="w-4 h-4" />, 'Plans')}
              {hasPerm('roles:manage') && btn('/dashboard/admin/orders', <ShoppingCart className="w-4 h-4" />, 'All Orders')}
              {btn('/dashboard/admin/moderation', <ImageIcon className="w-4 h-4" />, 'Moderation')}
              {hasPerm('roles:manage') && btn('/dashboard/admin/products', <ShoppingBag className="w-4 h-4" />, 'Products')}
              {btn('/dashboard/admin/analytics', <BarChart2 className="w-4 h-4" />, 'Platform Analytics')}
              {btn('/dashboard/admin/audit-logs', <Key className="w-4 h-4" />, 'Audit Logs')}
            </>
          )}
        </div>

        {/* Credits + Logout */}
        <div className="mt-auto pt-4 border-t border-slate-800">
          <div className="bg-slate-800/40 rounded-xl p-4 mb-3 border border-slate-700 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/10 rounded-full blur-xl -mr-8 -mt-8" />
            <div className="flex justify-between items-center mb-1 relative z-10">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Credits</p>
              {userRole === 'admin' && (
                <span className="bg-indigo-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">Root</span>
              )}
            </div>
            <div className="flex items-center gap-2 relative z-10">
              <Zap className="w-5 h-5 text-indigo-400" />
              <span className="text-2xl font-black text-white">{credits.toLocaleString()}</span>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 text-sm font-bold text-slate-400 hover:text-red-400 hover:bg-slate-800 transition py-2.5 rounded-xl"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>
    </>
  );
}
