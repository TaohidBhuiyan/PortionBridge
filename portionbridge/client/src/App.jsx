import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { DonorDashboard } from "./pages/DonorDashboard";
import { VolunteerDashboard } from "./pages/VolunteerDashboard";
import { AdminDashboard } from "./pages/AdminDashboard";
import { DonationFormPage } from "./pages/DonationFormPage";
import { MyDonationsPage } from "./pages/MyDonationsPage";
import { DonationDetailsPage } from "./pages/DonationDetailsPage";
import { VolunteerDiscoveryPage } from "./pages/VolunteerDiscoveryPage";
import { VolunteerProfilePage } from "./pages/VolunteerProfilePage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider, AuthSocketProvider } from "./context/SocketContext";

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
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route 
              path="/donor/dashboard" 
              element={
                <AuthSocketProvider>
                  <DonorDashboard />
                </AuthSocketProvider>
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
                <AuthSocketProvider>
                  <DonationFormPage />
                </AuthSocketProvider>
              } 
            />
            <Route 
              path="/donor/my-donations" 
              element={
                <AuthSocketProvider>
                  <MyDonationsPage />
                </AuthSocketProvider>
              } 
            />
            <Route 
              path="/donations/:id" 
              element={
                <AuthSocketProvider>
                  <DonationDetailsPage />
                </AuthSocketProvider>
              } 
            />
            <Route 
              path="/donor/discover-volunteers" 
              element={
                <AuthSocketProvider>
                  <VolunteerDiscoveryPage />
                </AuthSocketProvider>
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
                <AuthSocketProvider>
                  <NotificationsPage />
                </AuthSocketProvider>
              } 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
