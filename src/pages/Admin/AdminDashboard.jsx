import React, { useState, useEffect, useCallback } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users as UsersIcon,
  CheckSquare,
  AlertTriangle,
  Store,
  TrendingUp,
} from "lucide-react";
import { analyticsApi } from "../../api/client";
import DashboardLayout from "../../components/Layout/DashboardLayout";
import PageHeader from "../../components/UI/PageHeader";
import StatsCard from "../../components/UI/StatsCard";
import Button from "../../components/UI/Button";
import ContentManager from "./ContentManager";
import FormSubmissions from "./FormSubmissions";
import FileUpload from "./FileUpload";
import Tasks from "./Tasks";
import Merchants from "./Merchants";
import Disputes from "./Disputes";
import Users from "./Users";
import RequireRole from "../../components/Auth/RequireRole";
import toast from "react-hot-toast";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    users: { total: 0, pending: 0, approved: 0 },
    tasks: { total: 0, completed: 0, pending: 0 },
    disputes: { total: 0, open: 0, resolved: 0 },
    merchants: { total: 0, active: 0, flagged: 0 },
  });
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const fetchUserData = useCallback(async () => {
    try {
      // const response = await authApi.me(); // removed unused variable
    } catch (error) {
      localStorage.removeItem("authToken");
      navigate("/admin/login");
    }
  }, [navigate]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await analyticsApi.overview();
      setStats(response.data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/admin/login");
      return;
    }

    const loadData = async () => {
      await Promise.all([fetchUserData(), fetchStats()]);
      setLoading(false);
    };

    loadData();
  }, [navigate, fetchUserData, fetchStats]);

  if (loading) {
    return (
      <DashboardLayout userRole="admin">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Loading dashboard...
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="admin">
      <Routes>
        <Route path="/" element={<DashboardHome stats={stats} />} />
        <Route
          path="/users"
          element={
            <RequireRole roles={["admin"]}>
              <Users />
            </RequireRole>
          }
        />
        <Route
          path="/tasks"
          element={
            <RequireRole roles={["admin"]}>
              <Tasks />
            </RequireRole>
          }
        />
        <Route
          path="/disputes"
          element={
            <RequireRole roles={["admin"]}>
              <Disputes />
            </RequireRole>
          }
        />
        <Route
          path="/merchants"
          element={
            <RequireRole roles={["admin"]}>
              <Merchants />
            </RequireRole>
          }
        />
        <Route
          path="/analytics"
          element={
            <RequireRole roles={["admin"]}>
              <AnalyticsPage />
            </RequireRole>
          }
        />
        <Route
          path="/content"
          element={
            <RequireRole roles={["admin"]}>
              <ContentManager />
            </RequireRole>
          }
        />
        <Route
          path="/submissions"
          element={
            <RequireRole roles={["admin"]}>
              <FormSubmissions />
            </RequireRole>
          }
        />
        <Route
          path="/upload"
          element={
            <RequireRole roles={["admin"]}>
              <FileUpload />
            </RequireRole>
          }
        />
      </Routes>
    </DashboardLayout>
  );
};

const DashboardHome = ({ stats }) => {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Admin Dashboard"
        subtitle="Complete system overview and management"
        icon={TrendingUp}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatsCard
          title="Total Users"
          value={stats.users?.total || 0}
          icon={UsersIcon}
          color="blue"
          delay={0.1}
        />
        <StatsCard
          title="Pending Approvals"
          value={stats.users?.pending || 0}
          icon={AlertTriangle}
          color="amber"
          delay={0.2}
        />
        <StatsCard
          title="Total Tasks"
          value={stats.tasks?.total || 0}
          icon={CheckSquare}
          color="green"
          delay={0.3}
        />
        <StatsCard
          title="Active Disputes"
          value={stats.disputes?.open || 0}
          icon={AlertTriangle}
          color="red"
          delay={0.4}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        <StatsCard
          title="Total Merchants"
          value={stats.merchants?.total || 0}
          icon={Store}
          color="purple"
          delay={0.5}
        />
        <StatsCard
          title="Flagged Merchants"
          value={stats.merchants?.flagged || 0}
          icon={AlertTriangle}
          color="red"
          delay={0.6}
        />
        <StatsCard
          title="Completed Tasks"
          value={stats.tasks?.completed || 0}
          icon={CheckSquare}
          color="green"
          delay={0.7}
        />
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 lg:p-6"
      >
        <h3 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white mb-4 lg:mb-6">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <a
            href="/admin/dashboard/users"
            className="group p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary hover:shadow-md transition-all duration-200 block"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                <UsersIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="font-medium text-gray-900 dark:text-white text-sm lg:text-base">
                  Manage Users
                </div>
                <div className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">
                  {stats.users?.pending || 0} pending
                </div>
              </div>
            </div>
          </a>

          <a
            href="/admin/dashboard/tasks"
            className="group p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary hover:shadow-md transition-all duration-200 block"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 flex items-center justify-center flex-shrink-0">
                <CheckSquare className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="font-medium text-gray-900 dark:text-white text-sm lg:text-base">
                  Task Management
                </div>
                <div className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">
                  {stats.tasks?.pending || 0} pending
                </div>
              </div>
            </div>
          </a>

          <a
            href="/admin/dashboard/disputes"
            className="group p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary hover:shadow-md transition-all duration-200 block"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="font-medium text-gray-900 dark:text-white text-sm lg:text-base">
                  Dispute Resolution
                </div>
                <div className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">
                  {stats.disputes?.open || 0} open
                </div>
              </div>
            </div>
          </a>

          <a
            href="/admin/dashboard/merchants"
            className="group p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary hover:shadow-md transition-all duration-200 block"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
                <Store className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="font-medium text-gray-900 dark:text-white text-sm lg:text-base">
                  Merchant Management
                </div>
                <div className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">
                  {stats.merchants?.flagged || 0} flagged
                </div>
              </div>
            </div>
          </a>
        </div>
      </motion.div>
    </div>
  );
};

const AnalyticsPage = () => {
  const [analytics, setAnalytics] = useState({
    users: null,
    tasks: null,
    merchants: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [userStats, taskStats, merchantStats] = await Promise.all([
          analyticsApi.userStats(),
          analyticsApi.taskStats(),
          analyticsApi.merchantStats(),
        ]);

        setAnalytics({
          users: userStats.data,
          tasks: taskStats.data,
          merchants: merchantStats.data,
        });
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
        toast.error("Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white font-lota">
          Analytics
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Detailed system analytics and insights
        </p>
      </div>

      {/* User Analytics */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          User Distribution
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {analytics.users?.roleDistribution?.map((role, index) => (
            <div
              key={role._id}
              className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div className="text-2xl font-bold text-primary">
                {role.count}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                {role._id}s
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {role.pending} pending, {role.approved} approved
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Task Analytics */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Task Status Distribution
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {analytics.tasks?.statusDistribution?.map((status, index) => (
            <div
              key={status._id}
              className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div className="text-2xl font-bold text-primary">
                {status.count}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                {status._id}
              </div>
              {status.avgCompletionTime && (
                <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Avg:{" "}
                  {Math.round(status.avgCompletionTime / (1000 * 60 * 60 * 24))}{" "}
                  days
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Merchant Analytics */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Merchant Status Distribution
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {analytics.merchants?.statusDistribution?.map((status, index) => (
            <div
              key={status._id}
              className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div className="text-2xl font-bold text-primary">
                {status.count}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                {status._id}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default AdminDashboard;
