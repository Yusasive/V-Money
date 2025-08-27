import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { authApi, merchantsApi } from "../../api/client";
import {
  FiUser,
  FiActivity,
  FiTrendingUp,
  FiLogOut,
  FiRefreshCw,
  FiMenu,
  FiX,
} from "react-icons/fi";
import formatTimeAgo from "../../utils/formatTimeAgo";
import MerchantProfileTabs from "./MerchantProfileTabs";

const MerchantDashboard = () => {
  const [user, setUser] = useState(null);
  const [merchant, setMerchant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      // Always use "me"; server resolves current user's merchant by token
      const [userRes, merchantRes] = await Promise.all([
        authApi.me(),
        merchantsApi.get("me"),
      ]);

      setUser(userRes.data.user);
      // merchants API returns { data: { ...merchant } }
      setMerchant(merchantRes.data?.data || null);
    } catch (error) {
      console.error("Error fetching merchant data:", error);
      setError("Failed to load merchant data");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
      localStorage.removeItem("adminToken");
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleProfileUpdate = async (profileData) => {
    try {
      const response = await merchantsApi.updateMe(profileData);
      // Update local merchant state with new data
      setMerchant(response.data.merchant);
      return response.data;
    } catch (error) {
      console.error("Profile update error:", error);
      throw error.response?.data || error;
    }
  };

  const handlePasswordUpdate = async (currentPassword, newPassword) => {
    try {
      const response = await authApi.changePassword({
        current: currentPassword,
        new: newPassword,
      });
      return response.data;
    } catch (error) {
      console.error("Password update error:", error);
      throw error.response?.data || error;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading merchant dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchUserData}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-blue-700"
          >
            <FiRefreshCw className="inline mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="px-4 sm:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-md bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-bold text-sm sm:text-base">
                V
              </span>
            </div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white font-lota">
              <span className="hidden sm:inline">Merchant Dashboard</span>
              <span className="sm:hidden">Dashboard</span>
            </h1>
          </div>

          {/* Desktop Header Actions */}
          <div className="hidden md:flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Welcome back,
              </p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {merchant?.business_name ||
                  merchant?.first_name ||
                  merchant?.email}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              <FiLogOut className="h-4 w-4" />
              Logout
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              {mobileMenuOpen ? (
                <FiX className="h-6 w-6" />
              ) : (
                <FiMenu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
          >
            <div className="px-4 py-4 space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Welcome back,
                </p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {merchant?.business_name ||
                    merchant?.first_name ||
                    merchant?.email}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors rounded-md"
              >
                <FiLogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </header>

      {/* Main Content */}
      <main className="px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto">
          {/* Status Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-6 sm:mb-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Account Status
                </h2>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      merchant?.status === "active"
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  ></div>
                  <span
                    className={`font-medium text-sm sm:text-base ${
                      merchant?.status === "active"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {merchant?.status === "active" ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Last Activity
                </p>
                <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">
                  {merchant?.last_activity_date
                    ? formatTimeAgo(merchant.last_activity_date)
                    : "N/A"}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                  <FiUser className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Username
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate">
                    {merchant?.username || "N/A"}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <FiActivity className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Status
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
                    {merchant?.status === "active" ? "Active" : "Inactive"}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 sm:col-span-2 lg:col-span-1"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                  <FiTrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Member Since
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
                    {merchant?.created_at
                      ? new Date(merchant.created_at).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Profile Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6"
          >
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Business Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name
                </label>
                <p className="text-gray-900 dark:text-white text-sm sm:text-base break-words">
                  {[
                    merchant?.first_name,
                    merchant?.middle_name,
                    merchant?.last_name,
                  ]
                    .filter(Boolean)
                    .join(" ") || "N/A"}
                </p>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Business Name
                </label>
                <p className="text-gray-900 dark:text-white text-sm sm:text-base break-words">
                  {merchant?.business_name || "N/A"}
                </p>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email Address
                </label>
                <p className="text-gray-900 dark:text-white text-sm sm:text-base break-all">
                  {merchant?.email || user?.email || "N/A"}
                </p>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone Number
                </label>
                <p className="text-gray-900 dark:text-white text-sm sm:text-base">
                  {merchant?.phone || "N/A"}
                </p>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Gender
                </label>
                <p className="text-gray-900 dark:text-white text-sm sm:text-base">
                  {merchant?.gender || "N/A"}
                </p>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  State
                </label>
                <p className="text-gray-900 dark:text-white text-sm sm:text-base">
                  {merchant?.state || "N/A"}
                </p>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  LGA
                </label>
                <p className="text-gray-900 dark:text-white text-sm sm:text-base">
                  {merchant?.lga || "N/A"}
                </p>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Account Status
                </label>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    merchant?.status === "active"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                  }`}
                >
                  {merchant?.status || "N/A"}
                </span>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Username
                </label>
                <p className="text-gray-900 dark:text-white text-sm sm:text-base break-words">
                  {merchant?.username || "N/A"}
                </p>
              </div>

              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Personal Address
                </label>
                <p className="text-gray-900 dark:text-white text-sm sm:text-base break-words">
                  {merchant?.address || "N/A"}
                </p>
              </div>

              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Business Address
                </label>
                <p className="text-gray-900 dark:text-white text-sm sm:text-base break-words">
                  {merchant?.business_address || "N/A"}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Profile Management Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <MerchantProfileTabs
              merchant={merchant}
              onUpdateProfile={handleProfileUpdate}
              onChangePassword={handlePasswordUpdate}
            />
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default MerchantDashboard;
