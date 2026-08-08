import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider, AuthSocketProvider } from "./context/SocketContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

// Lazy load donor module pages for better performance
const DonorDashboard = lazy(() => import("./pages/DonorDashboard").then(m => ({ default: m.DonorDashboard })));
const DonorAnalyticsPage = lazy(() => import("./pages/DonorAnalyticsPage").then(m => ({ default: m.DonorAnalyticsPage })));
const DonorProfilePage = lazy(() => import("./pages/DonorProfilePage").then(m => ({ default: m.DonorProfilePage })));
const DonorSettingsPage = lazy(() => import("./pages/DonorSettingsPage").then(m => ({ default: m.DonorSettingsPage })));
const DonationFormPage = lazy(() => import("./pages/DonationFormPage").then(m => ({ default: m.DonationFormPage })));
const MyDonationsPage = lazy(() => import("./pages/MyDonationsPage").then(m => ({ default: m.MyDonationsPage })));
const DonationDetailsPage = lazy(() => import("./pages/DonationDetailsPage").then(m => ({ default: m.DonationDetailsPage })));
const VolunteerDiscoveryPage = lazy(() => import("./pages/VolunteerDiscoveryPage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage").then(m => ({ default: m.NotificationsPage })));

// Lazy load volunteer and admin dashboards (not part of donor module review)
const VolunteerDashboard = lazy(() => import("./pages/VolunteerDashboard").then(m => ({ default: m.VolunteerDashboard })));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard").then(m => ({ default: m.AdminDashboard })));
const VolunteerProfilePage = lazy(() => import("./pages/VolunteerProfilePage"));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
  </div>
);

/**
 * Main App component with React Router setup
 * Landing page is mounted at root path "/"
 * Additional routes can be added in future phases
 */
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route 
                path="/donor/dashboard" 
                element={
                  <ProtectedRoute requiredRole="donor">
                    <AuthSocketProvider>
                      <DonorDashboard />
                    </AuthSocketProvider>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/donor/analytics" 
                element={
                  <ProtectedRoute requiredRole="donor">
                    <AuthSocketProvider>
                      <DonorAnalyticsPage />
                    </AuthSocketProvider>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/donor/profile" 
                element={
                  <ProtectedRoute requiredRole="donor">
                    <AuthSocketProvider>
                      <DonorProfilePage />
                    </AuthSocketProvider>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/donor/settings" 
                element={
                  <ProtectedRoute requiredRole="donor">
                    <AuthSocketProvider>
                      <DonorSettingsPage />
                    </AuthSocketProvider>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/volunteer/dashboard" 
                element={
                  <AuthSocketProvider>
                    <VolunteerDashboard />
                  </AuthSocketProvider>
                } 
              />
              <Route 
                path="/admin/dashboard" 
                element={
                  <AuthSocketProvider>
                    <AdminDashboard />
                  </AuthSocketProvider>
                } 
              />
              <Route 
                path="/donation/create" 
                element={
                  <ProtectedRoute requiredRole="donor">
                    <AuthSocketProvider>
                      <DonationFormPage />
                    </AuthSocketProvider>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/donor/my-donations" 
                element={
                  <ProtectedRoute requiredRole="donor">
                    <AuthSocketProvider>
                      <MyDonationsPage />
                    </AuthSocketProvider>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/donations/:id" 
                element={
                  <ProtectedRoute>
                    <AuthSocketProvider>
                      <DonationDetailsPage />
                    </AuthSocketProvider>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/donor/discover-volunteers" 
                element={
                  <ProtectedRoute requiredRole="donor">
                    <AuthSocketProvider>
                      <VolunteerDiscoveryPage />
                    </AuthSocketProvider>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/volunteers/:id" 
                element={
                  <AuthSocketProvider>
                    <VolunteerProfilePage />
                  </AuthSocketProvider>
                } 
              />
              <Route 
                path="/notifications" 
                element={
                  <ProtectedRoute>
                    <AuthSocketProvider>
                      <NotificationsPage />
                    </AuthSocketProvider>
                  </ProtectedRoute>
                } 
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
