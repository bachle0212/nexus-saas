import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Moon, Sun, X, Zap } from 'lucide-react';
import { toast } from 'react-toastify';

import Sidebar from '../components/Sidebar';
import NotificationCenter from '../components/NotificationCenter';
import OnboardingModal from '../components/OnboardingModal';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';

export default function DashboardLayout() {
  const navigate = useNavigate();
  const { token, user, credits, logout, hasPerm } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem('nexus_dark') === 'true'
  );

  // Guard: redirect to login if not authenticated
  useEffect(() => {
    if (!token) {
      navigate('/login', { replace: true });
    }
  }, [token, navigate]);

  // Dark mode persistence
  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('nexus_dark', darkMode);
  }, [darkMode]);

  // Onboarding for new users
  useEffect(() => {
    if (!localStorage.getItem('nexus_onboarded')) {
      const timer = setTimeout(() => setShowOnboarding(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Handle Stripe redirect callbacks
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      const type = urlParams.get('type');
      const sessionId = urlParams.get('session_id');

      if (type === 'subscription') {
        api
          .post(`/api/billing/verify-subscription?session_id=${sessionId}`)
          .then(() => toast.success('Payment successful! Plan upgraded.'))
          .catch(() => toast.error('Payment verification failed'));
      } else if (type === 'credits') {
        api
          .post(`/api/billing/verify-credits?session_id=${sessionId}`)
          .then(() => toast.success('Credits added to your account!'))
          .catch(() => toast.error('Credit verification failed'));
      } else if (type === 'order') {
        const orderId = urlParams.get('order_id');
        api
          .post(`/api/store/verify-order?session_id=${sessionId}&order_id=${orderId}`)
          .then(() => toast.success('Payment successful! Order confirmed.'))
          .catch(() => toast.error('Payment verification failed'));
      }

      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get('canceled') === 'true') {
      toast.warning('Payment was canceled.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleLogout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch {
      // ignore errors — proceed with local logout anyway
    }
    logout();
    toast.info('Logged out');
    navigate('/login');
  };

  if (!token) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-200 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Zap className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Nexus AI</h1>
        </div>
        <div className="flex items-center gap-2">
          <NotificationCenter api={api} />
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-slate-600"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <Sidebar
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        userEmail={user?.email || ''}
        userPlan={user?.plan || 'Free'}
        userRole={user?.role || 'user'}
        credits={credits}
        hasPerm={hasPerm}
        logout={handleLogout}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Desktop top bar */}
        <div className="hidden md:flex items-center justify-end gap-2 px-8 py-3 border-b border-slate-200 bg-white shrink-0">
          <NotificationCenter api={api} />
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition"
            title="Toggle dark mode"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        {/* Page content rendered by nested routes */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 p-4 md:p-8 pt-20 md:pt-8">
          <Outlet />
        </div>
      </div>

      {/* Onboarding Modal */}
      {showOnboarding && (
        <OnboardingModal
          onClose={() => {
            setShowOnboarding(false);
            localStorage.setItem('nexus_onboarded', 'true');
          }}
        />
      )}
    </div>
  );
}
