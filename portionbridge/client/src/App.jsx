import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
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
const VolunteerDiscoveryPage = lazy(() => import("./pages/VolunteerDiscoveryPage").then(m => ({ default: m.VolunteerDiscoveryPage })));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage").then(m => ({ default: m.NotificationsPage })));

// Lazy load volunteer and admin dashboards (not part of donor module review)
const VolunteerDashboard = lazy(() => import("./pages/VolunteerDashboard").then(m => ({ default: m.VolunteerDashboard })));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard").then(m => ({ default: m.AdminDashboard })));
const VolunteerProfilePage = lazy(() => import("./pages/VolunteerProfilePage").then(m => ({ default: m.VolunteerProfilePage })));
// PHASE 3: Nearby Opportunities + mission actions
const VolunteerOpportunities = lazy(() => import("./pages/VolunteerOpportunities").then(m => ({ default: m.VolunteerOpportunities })));
// PHASE 4: My Team + announcements
const VolunteerTeam = lazy(() => import("./pages/VolunteerTeam").then(m => ({ default: m.VolunteerTeam })));

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
                  // PHASE 3: this route previously had no role guard at all
                  // (every other dashboard route already does — see
                  // /donor/dashboard etc. above). Added while touching this
                  // file for the new Opportunities route, since the audit
                  // brief repeatedly calls for donor/admin to never reach
                  // volunteer-only actions. The backend already enforced
                  // this independently on every volunteer/donation endpoint,
                  // so this closes a frontend UX gap, not a security hole.
                  <ProtectedRoute requiredRole="volunteer">
                    <AuthSocketProvider>
                      <VolunteerDashboard />
                    </AuthSocketProvider>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/volunteer/opportunities" 
                element={
                  <ProtectedRoute requiredRole="volunteer">
                    <AuthSocketProvider>
                      <VolunteerOpportunities />
                    </AuthSocketProvider>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/volunteer/team" 
                element={
                  <ProtectedRoute requiredRole="volunteer">
                    <AuthSocketProvider>
                      <VolunteerTeam />
                    </AuthSocketProvider>
                  </ProtectedRoute>
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
      {/* PHASE 3: react-hot-toast was already an installed dependency
          (package.json) but had no <Toaster/> mounted anywhere, so no
          toast() call anywhere in the app could ever render. Mounted once
          here at the app root — this is wiring up an existing, unused
          dependency, not introducing a new toast library. Styling matches
          the project's dashboard tokens rather than the library's defaults. */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--color-surface, #fff)',
            color: 'var(--color-text-primary, #1a1a1a)',
            border: '1px solid var(--color-border, #e5e5e5)',
            borderRadius: '0.75rem',
            fontSize: '0.875rem',
          },
        }}
      />
    </BrowserRouter>
  );
}

export default App;
