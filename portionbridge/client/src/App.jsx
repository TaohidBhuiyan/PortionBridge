import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { VerifyEmailPage } from "./pages/VerifyEmailPage";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider, AuthSocketProvider } from "./context/SocketContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

// Helper for lazy loading pages with fallback module resolution and auto-reload on Vite chunk fetch failures
const safeLazy = (importFn) =>
  lazy(async () => {
    const pageHasBeenRefreshed = sessionStorage.getItem('pb_page_refreshed');
    try {
      const module = await importFn();
      sessionStorage.removeItem('pb_page_refreshed');
      const component = module.default || Object.values(module)[0];
      return { default: component };
    } catch (error) {
      // Handle Vite dev server restart / HMR chunk invalidation / network fetch error
      if (!pageHasBeenRefreshed && (error?.name === 'TypeError' || error?.message?.includes('dynamically imported module') || error?.message?.includes('Failed to fetch'))) {
        sessionStorage.setItem('pb_page_refreshed', 'true');
        window.location.reload();
      }
      throw error;
    }
  });

// Lazy load donor module pages for better performance
const DonorDashboard = safeLazy(() => import("./pages/DonorDashboard"));
const DonorAnalyticsPage = safeLazy(() => import("./pages/DonorAnalyticsPage"));
const DonorProfilePage = safeLazy(() => import("./pages/DonorProfilePage"));
const DonorSettingsPage = safeLazy(() => import("./pages/DonorSettingsPage"));
const DonorLeaderboardPage = safeLazy(() => import("./pages/DonorLeaderboardPage"));
const DonorHelpPage = safeLazy(() => import("./pages/DonorHelpPage"));
const SavedAddressesPage = safeLazy(() => import("./pages/SavedAddressesPage"));
const DonationFormPage = safeLazy(() => import("./pages/DonationFormPage"));
const MyDonationsPage = safeLazy(() => import("./pages/MyDonationsPage"));
const DonationDetailsPage = safeLazy(() => import("./pages/DonationDetailsPage"));
const VolunteerDiscoveryPage = safeLazy(() => import("./pages/VolunteerDiscoveryPage"));
const NotificationsPage = safeLazy(() => import("./pages/NotificationsPage"));
const MessagesPage = safeLazy(() => import("./pages/MessagesPage"));

// Lazy load volunteer and admin dashboards
const VolunteerDashboard = safeLazy(() => import("./pages/VolunteerDashboard"));
const AdminDashboard = safeLazy(() => import("./pages/AdminDashboard"));
const VolunteerProfilePage = safeLazy(() => import("./pages/VolunteerProfilePage"));
// PHASE 3: Nearby Opportunities + mission actions
const VolunteerOpportunities = safeLazy(() => import("./pages/VolunteerOpportunities"));
// PHASE 4: My Team + announcements
const VolunteerTeam = safeLazy(() => import("./pages/VolunteerTeam"));
// PHASE 5: Mission History
const VolunteerHistory = safeLazy(() => import("./pages/VolunteerHistory"));
const VolunteerMission = safeLazy(() => import("./pages/VolunteerMission"));
const VolunteerActiveMissions = safeLazy(() => import("./pages/VolunteerActiveMissions"));
const VolunteerLiveMap = safeLazy(() => import("./pages/VolunteerLiveMap"));
const VolunteerLeaderboardPage = safeLazy(() => import("./pages/VolunteerLeaderboardPage"));
const VolunteerHelpPage = safeLazy(() => import("./pages/VolunteerHelpPage"));
const AdminSectionPage = safeLazy(() => import("./pages/AdminSectionPage"));
const AdminUsers = safeLazy(() => import("./pages/AdminUsers"));
const AdminUserDetail = safeLazy(() => import("./pages/AdminUserDetail"));
const AdminDonations = safeLazy(() => import("./pages/AdminDonations"));
const AdminDonationDetail = safeLazy(() => import("./pages/AdminDonationDetail"));
const AdminVolunteersTeams = safeLazy(() => import("./pages/AdminVolunteersTeams"));
const AdminVolunteerDetail = safeLazy(() => import("./pages/AdminVolunteerDetail"));
const AdminTeamDetail = safeLazy(() => import("./pages/AdminTeamDetail"));
const AdminLiveOperations = safeLazy(() => import("./pages/AdminLiveOperations"));
const AdminAttentionCenter = safeLazy(() => import("./pages/AdminAttentionCenter"));
const AdminReports = safeLazy(() => import("./pages/AdminReports"));
const AdminReportDetail = safeLazy(() => import("./pages/AdminReportDetail"));
const AdminNotifications = safeLazy(() => import("./pages/AdminNotifications"));
const AdminAnalytics = safeLazy(() => import("./pages/AdminAnalytics"));
const AdminAuditLogs = safeLazy(() => import("./pages/AdminAuditLogs"));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dash-primary"></div>
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
              <Route path="/verify-email" element={<VerifyEmailPage />} />
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
                path="/donor/leaderboard"
                element={
                  <ProtectedRoute requiredRole="donor">
                    <AuthSocketProvider>
                      <DonorLeaderboardPage />
                    </AuthSocketProvider>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/donor/help"
                element={
                  <ProtectedRoute requiredRole="donor">
                    <AuthSocketProvider>
                      <DonorHelpPage />
                    </AuthSocketProvider>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/donor/addresses"
                element={
                  <ProtectedRoute requiredRole="donor">
                    <AuthSocketProvider>
                      <SavedAddressesPage />
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
                path="/volunteer/history" 
                element={
                  <ProtectedRoute requiredRole="volunteer">
                    <AuthSocketProvider>
                      <VolunteerHistory />
                    </AuthSocketProvider>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/volunteer/mission" 
                element={
                  <ProtectedRoute requiredRole="volunteer">
                    <AuthSocketProvider>
                      <VolunteerMission />
                    </AuthSocketProvider>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/volunteer/active-missions" 
                element={
                  <ProtectedRoute requiredRole="volunteer">
                    <AuthSocketProvider>
                      <VolunteerActiveMissions />
                    </AuthSocketProvider>
                  </ProtectedRoute>
                } 
              />
              <Route
                path="/volunteer/live-map"
                element={
                  <ProtectedRoute requiredRole="volunteer">
                    <AuthSocketProvider>
                      <VolunteerLiveMap />
                    </AuthSocketProvider>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/volunteer/leaderboard"
                element={
                  <ProtectedRoute requiredRole="volunteer">
                    <AuthSocketProvider>
                      <VolunteerLeaderboardPage />
                    </AuthSocketProvider>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/volunteer/help"
                element={
                  <ProtectedRoute requiredRole="volunteer">
                    <AuthSocketProvider>
                      <VolunteerHelpPage />
                    </AuthSocketProvider>
                  </ProtectedRoute>
                }
              />
              <Route 
                path="/admin/dashboard" 
                element={
                  // PHASE 1 (Dashboard Foundation) FIX: this route had no
                  // ProtectedRoute at all — any logged-in donor/volunteer
                  // (or logged-out user hitting the URL) could load the
                  // admin shell. Every /admin/* API call was still
                  // enforced server-side, but the frontend route itself
                  // was unguarded. Now matches the same pattern used for
                  // donor/volunteer routes above.
                  <ProtectedRoute requiredRole="admin">
                    <AuthSocketProvider>
                      <AdminDashboard />
                    </AuthSocketProvider>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/users" 
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AuthSocketProvider>
                      <AdminUsers />
                    </AuthSocketProvider>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/users/:id" 
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AuthSocketProvider>
                      <AdminUserDetail />
                    </AuthSocketProvider>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/donations" 
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AuthSocketProvider>
                      <AdminDonations />
                    </AuthSocketProvider>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/donations/:id" 
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AuthSocketProvider>
                      <AdminDonationDetail />
                    </AuthSocketProvider>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/volunteers-teams" 
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AuthSocketProvider>
                      <AdminVolunteersTeams />
                    </AuthSocketProvider>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/volunteers/:id" 
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AuthSocketProvider>
                      <AdminVolunteerDetail />
                    </AuthSocketProvider>
                  </ProtectedRoute>
                } 
              />
              <Route
                path="/admin/teams/:id"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AuthSocketProvider>
                      <AdminTeamDetail />
                    </AuthSocketProvider>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/live-operations"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AuthSocketProvider>
                      <AdminLiveOperations />
                    </AuthSocketProvider>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/attention-center"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AuthSocketProvider>
                      <AdminAttentionCenter />
                    </AuthSocketProvider>
                  </ProtectedRoute>
                }
              />
              <Route 
                path="/admin/reports" 
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AuthSocketProvider>
                      <AdminReports />
                    </AuthSocketProvider>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/reports/:id" 
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AuthSocketProvider>
                      <AdminReportDetail />
                    </AuthSocketProvider>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/notifications" 
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AuthSocketProvider>
                      <AdminNotifications />
                    </AuthSocketProvider>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/analytics" 
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AuthSocketProvider>
                      <AdminAnalytics />
                    </AuthSocketProvider>
                  </ProtectedRoute>
                } 
              />
              <Route
                path="/admin/audit-logs"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AuthSocketProvider>
                      <AdminAuditLogs />
                    </AuthSocketProvider>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/:section"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AuthSocketProvider>
                      <AdminSectionPage />
                    </AuthSocketProvider>
                  </ProtectedRoute>
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
              <Route 
                path="/messages" 
                element={
                  <ProtectedRoute>
                    <AuthSocketProvider>
                      <MessagesPage />
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
