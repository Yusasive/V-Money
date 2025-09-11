import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./contexts/AuthContext";

// Public Pages
import Home from "./pages/Home";
import Pricing from "./pages/Pricing/Pricing";
import Loans from "./pages/Loans/Loans";
import Navbar from "./components/Navbar/Navbar";
import Footer from "./pages/Footer";
import ScrollToTop from "./ScrollToTop";
import OnboardingPage from "./pages/OnboardingPage";

// Auth Pages
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import ResetPassword from "./pages/Auth/ResetPassword";

// Admin Pages
import AdminLogin from "./pages/Admin/AdminLogin";
import AdminDashboard from "./pages/Admin/AdminDashboard";

// Aggregator Pages
import AggregatorDashboard from "./pages/Aggregator/AggregatorDashboard";
import AggregatorTasks from "./pages/Aggregator/AggregatorTasks";
import AggregatorDisputes from "./pages/Aggregator/AggregatorDisputes";
import AggregatorProfile from "./pages/Aggregator/AggregatorProfile";

// Staff Pages (to be implemented)
import StaffDashboard from "./pages/Staff/StaffDashboard";
import StaffTasks from "./pages/Staff/StaffTasks";
import StaffDisputes from "./pages/Staff/StaffDisputes";
import StaffMerchants from "./pages/Staff/StaffMerchants";
import StaffProfile from "./pages/Staff/StaffProfile";

// Merchant Pages
import MerchantDashboard from "./pages/Merchant/MerchantDashboard";

// Auth Components
import ProtectedRoute from "./components/Auth/ProtectedRoute";
import AuthGuard from "./components/Auth/AuthGuard";
import SessionManager from "./components/UI/SessionManager";
import Button from "./components/UI/Button";

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          {/* Global Session Manager */}
          <SessionManager />

          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#363636",
                color: "#fff",
              },
              success: {
                duration: 3000,
                theme: {
                  primary: "#4ade80",
                },
              },
              error: {
                duration: 4000,
                theme: {
                  primary: "#ef4444",
                },
              },
            }}
          />

          <Routes>
            {/* Public Routes */}
            <Route
              path="/"
              element={
                <>
                  <Navbar />
                  <ScrollToTop />
                  <Home />
                  <Footer />
                </>
              }
            />

            <Route
              path="/pricing"
              element={
                <>
                  <Navbar />
                  <ScrollToTop />
                  <Pricing />
                  <Footer />
                </>
              }
            />

            <Route
              path="/loans"
              element={
                <>
                  <Navbar />
                  <ScrollToTop />
                  <Loans />
                  <Footer />
                </>
              }
            />

            <Route path="/onboarding" element={<OnboardingPage />} />

            {/* Auth Routes - Only show when not authenticated */}
            <Route
              path="/login"
              element={
                <AuthGuard redirectTo="/">
                  <Login />
                </AuthGuard>
              }
            />
            <Route
              path="/register"
              element={
                <AuthGuard redirectTo="/">
                  <Register />
                </AuthGuard>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <AuthGuard redirectTo="/">
                  <ForgotPassword />
                </AuthGuard>
              }
            />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Admin Routes */}
            <Route
              path="/admin/login"
              element={
                <AuthGuard redirectTo="/admin/dashboard">
                  <AdminLogin />
                </AuthGuard>
              }
            />
            <Route
              path="/admin/dashboard/*"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Aggregator Routes */}
            <Route
              path="/aggregator/dashboard"
              element={
                <ProtectedRoute roles={["aggregator"]}>
                  <AggregatorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/aggregator/dashboard/tasks"
              element={
                <ProtectedRoute roles={["aggregator"]}>
                  <AggregatorTasks />
                </ProtectedRoute>
              }
            />
            <Route
              path="/aggregator/dashboard/disputes"
              element={
                <ProtectedRoute roles={["aggregator"]}>
                  <AggregatorDisputes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/aggregator/dashboard/profile"
              element={
                <ProtectedRoute roles={["aggregator"]}>
                  <AggregatorProfile />
                </ProtectedRoute>
              }
            />

            {/* Staff Routes */}
            <Route
              path="/staff/dashboard"
              element={
                <ProtectedRoute roles={["staff"]}>
                  <StaffDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/dashboard/tasks"
              element={
                <ProtectedRoute roles={["staff"]}>
                  <StaffTasks />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/dashboard/disputes"
              element={
                <ProtectedRoute roles={["staff"]}>
                  <StaffDisputes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/dashboard/merchants"
              element={
                <ProtectedRoute roles={["staff"]}>
                  <StaffMerchants />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/dashboard/profile"
              element={
                <ProtectedRoute roles={["staff"]}>
                  <StaffProfile />
                </ProtectedRoute>
              }
            />

            {/* Merchant Routes */}
            <Route
              path="/merchant/dashboard"
              element={
                <ProtectedRoute roles={["merchant"]}>
                  <MerchantDashboard />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route
              path="*"
              element={
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      Page Not Found
                    </h2>
                    <p className="text-gray-600">
                      The page you're looking for doesn't exist.
                    </p>
                    <Button
                      variant="primary"
                      onClick={() => (window.location.href = "/")}
                      className="mt-4"
                    >
                      Go Home
                    </Button>
                  </div>
                </div>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
