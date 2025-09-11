import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { LogIn, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { authApi } from "../../api/client";
import Button from "../../components/UI/Button";
import toast from "react-hot-toast";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const expired = params.get("reason") === "expired";

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await authApi.login(formData);
      // Try both possible token locations
      const accessToken =
        response.data?.session?.access_token || response.data?.access_token;
      // console.log("[DIAGNOSE] Storing token:", accessToken);
      localStorage.setItem("authToken", accessToken);
      toast.success("Login successful!");
      // Fetch user info to get role
      const meResponse = await authApi.me();
      const role = meResponse.data.user?.role;
      switch (role) {
        case "admin":
          navigate("/admin/dashboard");
          break;
        case "staff":
          navigate("/staff/dashboard");
          break;
        case "aggregator":
          navigate("/aggregator/dashboard");
          break;
        case "merchant":
          navigate("/merchant/dashboard");
          break;
        default:
          navigate("/");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="relative overflow-hidden rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-xl border border-gray-200 dark:border-gray-700">
          {/* Decorative background */}
          <div className="absolute -top-10 -right-10 h-40 w-40 bg-gradient-to-br from-primary/20 to-blue-600/20 rounded-full" />

          <div className="relative p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                <LogIn className="h-8 w-8" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome Back
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Sign in to your account
              </p>
            </div>

            {/* Error Message */}
            {(expired || error) && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6">
                {expired
                  ? "Your session has expired. Please sign in again."
                  : error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                    placeholder="you@company.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                    placeholder="Your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                loading={loading}
                className="w-full"
                size="lg"
              >
                Sign In
              </Button>
            </form>

            {/* Footer Links */}
            <div className="mt-8 space-y-4 text-center">
              <Link
                to="/forgot-password"
                className="block text-sm text-primary hover:text-blue-700 font-medium"
              >
                Forgot your password?
              </Link>

              <div className="text-sm text-gray-600 dark:text-gray-400">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="text-primary hover:text-blue-700 font-medium"
                >
                  Create one
                </Link>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
