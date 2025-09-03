import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiLogIn, FiMail, FiLock } from "react-icons/fi";
import { authApi } from "../../api/client";

const AdminLogin = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await authApi.login(formData);
      const accessToken = response.data?.session?.access_token;
      if (!accessToken) {
        throw new Error("No access token returned");
      }
      localStorage.setItem("authToken", accessToken);
      // Fetch user info to check admin role
      const meResponse = await authApi.me();
      const role = meResponse?.data?.user?.role;
      if (role !== "admin") {
        setError("Admin access required");
        try {
          await authApi.logout();
        } catch {}
        return;
      }
      navigate("/admin/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow border border-gray-100 dark:border-gray-700">
          <div className="absolute -top-10 -right-10 h-40 w-40 bg-primary/20 rounded-full" />
          <div className="p-6 relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <FiLogIn className="h-5 w-5" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Admin Login
              </h1>
            </div>

            <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded mb-4 text-sm">
              Access is restricted to V-Monie administrators.
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="admin@yourcompany.com"
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="Your password"
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white py-2 px-4 rounded shadow hover:shadow-md transition disabled:opacity-50"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-300">
              <div className="space-x-2">
                <span>Need an account?</span>
                <Link
                  to="/admin/register"
                  className="text-primary hover:underline"
                >
                  Create admin
                </Link>
              </div>
              <div className="mt-2">
                <Link
                  to="/reset-password"
                  className="text-primary hover:underline"
                >
                  Have a reset link? Reset password
                </Link>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
