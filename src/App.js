import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { Toaster } from 'react-hot-toast';

// Public Pages
import Home from "./pages/Home";
import Pricing from "./pages/Pricing/Pricing";
import Loans from "./pages/Loans/Loans";
import Navbar from "./components/Navbar/Navbar";
import Footer from "./pages/Footer";
import ScrollToTop from "./ScrollToTop";
import OnboardingForm from "./components/Navbar/OnboardingForm";

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

// Merchant Pages
import MerchantDashboard from "./pages/Merchant/MerchantDashboard";

// Auth Components
import RequireRole from "./components/Auth/RequireRole";

const App = () => {
  return (
    <Router>
      <div className="App">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              theme: {
                primary: '#4ade80',
              },
            },
            error: {
              duration: 4000,
              theme: {
                primary: '#ef4444',
              },
            },
          }}
        />
        
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={
            <>
              <Navbar />
              <ScrollToTop />
              <Home />
              <Footer />
            </>
          } />
          
          <Route path="/pricing" element={
            <>
              <Navbar />
              <ScrollToTop />
              <Pricing />
              <Footer />
            </>
          } />
          
          <Route path="/loans" element={
            <>
              <Navbar />
              <ScrollToTop />
              <Loans />
              <Footer />
            </>
          } />
          
          <Route path="/onboarding" element={
            <>
              <Navbar />
              <ScrollToTop />
              <OnboardingForm />
              <Footer />
            </>
          } />

          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard/*" element={
            <RequireRole roles={['admin']}>
              <AdminDashboard />
            </RequireRole>
          } />

          {/* Aggregator Routes */}
          <Route path="/aggregator/dashboard" element={
            <RequireRole roles={['aggregator']}>
              <AggregatorDashboard />
            </RequireRole>
          } />
          <Route path="/aggregator/dashboard/tasks" element={
            <RequireRole roles={['aggregator']}>
              <AggregatorTasks />
            </RequireRole>
          } />
          <Route path="/aggregator/dashboard/disputes" element={
            <RequireRole roles={['aggregator']}>
              <AggregatorDisputes />
            </RequireRole>
          } />
          <Route path="/aggregator/dashboard/profile" element={
            <RequireRole roles={['aggregator']}>
              <AggregatorProfile />
            </RequireRole>
          } />

          {/* Staff Routes (placeholder for now) */}
          <Route path="/staff/dashboard" element={
            <RequireRole roles={['staff']}>
              <StaffDashboard />
            </RequireRole>
          } />
          <Route path="/staff/dashboard/tasks" element={
            <RequireRole roles={['staff']}>
              <StaffTasks />
            </RequireRole>
          } />
          <Route path="/staff/dashboard/disputes" element={
            <RequireRole roles={['staff']}>
              <StaffDisputes />
            </RequireRole>
          } />
          <Route path="/staff/dashboard/merchants" element={
            <RequireRole roles={['staff']}>
              <StaffMerchants />
            </RequireRole>
          } />

          {/* Merchant Routes */}
          <Route path="/merchant/dashboard" element={
            <RequireRole roles={['merchant']}>
              <MerchantDashboard />
            </RequireRole>
          } />

          {/* Fallback */}
          <Route path="*" element={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h2>
                <p className="text-gray-600">The page you're looking for doesn't exist.</p>
              </div>
            </div>
          } />
        </Routes>
      </div>
    </Router>
  );
};

export default App;