import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { FiLock, FiCheckCircle, FiEye, FiEyeOff } from "react-icons/fi";
import { authApi } from "../../api/client";
import { Link } from "react-router-dom";

// Password reset page styled to match admin visuals
const ResetPassword = () => {
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const token = urlParams.get('token');
  
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!password || password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    if (!token) {
      setError("Invalid reset token. Please request a new password reset.");
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword({ token, password });
      setMessage("Password reset successful. You can now sign in.");
      setPassword("");
      setConfirm("");
    } catch (e) {
      setError(
        e.response?.data?.message || e.message || "Failed to reset password"
      );
    } finally {
      setLoading(false);
    }
  };

  // Show error if no token in URL
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Invalid Reset Link
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This password reset link is invalid or has expired.
          </p>
          <Link
            to="/forgot-password"
            className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Request New Reset Link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
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
                <FiLock className="h-5 w-5" />
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                Reset Password
              </h1>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 px-4 py-3 rounded-lg mb-6">
              Enter your new password below to complete the reset process.
            </div>

            {/* Redirect hint after success */}
            {message && (
              <div className="mb-3 p-2 bg-green-100 text-green-700 rounded">
                <div className="flex items-center gap-2">
                  <FiCheckCircle />
                  <span>{message}</span>
                </div>
                <div className="text-sm mt-1">
                  <Link to="/login" className="text-primary hover:underline">
                    Go to login
                  </Link>
                </div>
              </div>
            )}
            {error && (
              <div className="mb-3 p-2 bg-red-100 text-red-700 rounded">
                {error}
              </div>
            )}

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-300">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 pr-10 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-300">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 pr-10 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    aria-label={showConfirm ? "Hide confirm" : "Show confirm"}
                    onClick={() => setShowConfirm((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirm ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>
              <button
                disabled={loading}
                className="w-full bg-primary text-white px-4 py-2 rounded shadow hover:shadow-md transition disabled:opacity-50"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
