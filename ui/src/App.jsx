import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import LandingPage from './components/LandingPage';
import Login from './components/Login';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import EmailVerify from './components/EmailVerify';
import DashboardLayout from './layouts/DashboardLayout';

// User pages
import StudioPage from './pages/StudioPage';
import GalleryPage from './pages/GalleryPage';
import VideoPage from './pages/VideoPage';
import ScriptsPage from './pages/ScriptsPage';
import CharactersPage from './pages/CharactersPage';
import BillingPage from './pages/BillingPage';
import BuyCreditsPage from './pages/BuyCreditsPage';
import BillingHistoryPage from './pages/BillingHistoryPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ProfilePage from './pages/ProfilePage';
import ApiKeysPage from './pages/ApiKeysPage';
import StorePage from './pages/StorePage';
import MyOrdersPage from './pages/MyOrdersPage';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UsersPage from './pages/admin/UsersPage';
import RolesPage from './pages/admin/RolesPage';
import PlansPage from './pages/admin/PlansPage';
import AllOrdersPage from './pages/admin/AllOrdersPage';
import ModerationPage from './pages/admin/ModerationPage';
import ProductsPage from './pages/admin/ProductsPage';
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage';
import AuditLogsPage from './pages/admin/AuditLogsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword onBack={() => (window.location.href = '/login')} />} />
          <Route path="/reset-password" element={<ResetPassword onSuccess={() => (window.location.href = '/login')} />} />
          <Route path="/verify-email" element={<EmailVerify onSuccess={() => (window.location.href = '/login')} />} />

          {/* Protected: all dashboard routes share DashboardLayout */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Navigate to="studio" replace />} />
            <Route path="studio" element={<StudioPage />} />
            <Route path="gallery" element={<GalleryPage />} />
            <Route path="video" element={<VideoPage />} />
            <Route path="scripts" element={<ScriptsPage />} />
            <Route path="characters" element={<CharactersPage />} />
            <Route path="billing" element={<BillingPage />} />
            <Route path="billing/buy-credits" element={<BuyCreditsPage />} />
            <Route path="billing/history" element={<BillingHistoryPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="api-keys" element={<ApiKeysPage />} />
            <Route path="store" element={<StorePage />} />
            <Route path="my-orders" element={<MyOrdersPage />} />
            {/* Admin routes */}
            <Route path="admin" element={<AdminDashboard />} />
            <Route path="admin/users" element={<UsersPage />} />
            <Route path="admin/roles" element={<RolesPage />} />
            <Route path="admin/plans" element={<PlansPage />} />
            <Route path="admin/orders" element={<AllOrdersPage />} />
            <Route path="admin/moderation" element={<ModerationPage />} />
            <Route path="admin/products" element={<ProductsPage />} />
            <Route path="admin/analytics" element={<AdminAnalyticsPage />} />
            <Route path="admin/audit-logs" element={<AuditLogsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <ToastContainer position="bottom-right" autoClose={3000} theme="colored" />
    </QueryClientProvider>
  );
}
