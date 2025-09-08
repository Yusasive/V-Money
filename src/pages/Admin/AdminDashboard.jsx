import React, { useState, useEffect, useCallback } from "react";
import { Routes, Route, NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Home, 
  Users, 
  CheckSquare, 
  AlertTriangle, 
  Store, 
  FileText, 
  Upload, 
  BarChart3,
  Settings,
  LogOut,
  Moon,
  Sun,
  Menu,
  X
} from "lucide-react";
import { authApi, analyticsApi } from "../../api/client";
import ContentManager from "./ContentManager";
import FormSubmissions from "./FormSubmissions";
import FileUpload from "./FileUpload";
import Tasks from "./Tasks";
import Merchants from "./Merchants";
import Disputes from "./Disputes";
import Users from "./Users";
import RequireRole from "../../components/Auth/RequireRole";
import StatsCard from "../../components/UI/StatsCard";
import toast from "react-hot-toast";

const AdminDashboard = () => {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("theme") === "dark" || 
           (!localStorage.getItem("theme") && 
            window.matchMedia("(prefers-color-scheme: dark)").matches);
  });
  const [stats, setStats] = useState({
    users: { total: 0, pending: 0, approved: 0 },
    tasks: { total: 0, completed: 0, pending: 0 },
    disputes: { total: 0, open: 0, resolved: 0 },
    merchants: { total: 0, active: 0, flagged: 0 }
  });
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const fetchUserData = useCallback(async () => {
    try {
      const response = await authApi.me();
      setUser(response.data.user);
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
      console.error('Failed to fetch stats:', error);
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

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  const handleLogout = async () => {
    try {
      await authApi.logout();
      localStorage.removeItem("authToken");
      toast.success("Logged out successfully");
      navigate("/admin/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Logout failed");
    }
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const navigationItems = [
    { name: "Dashboard", href: "/admin/dashboard", icon: Home, end: true },
    { name: "User Management", href: "/admin/dashboard/users", icon: Users },
    { name: "Tasks", href: "/admin/dashboard/tasks", icon: CheckSquare },
    { name: "Disputes", href: "/admin/dashboard/disputes", icon: AlertTriangle },
    { name: "Merchants", href: "/admin/dashboard/merchants", icon: Store },
    { name: "Analytics", href: "/admin/dashboard/analytics", icon: BarChart3 },
    { name: "Content", href: "/admin/dashboard/content", icon: Settings },
    { name: "Form Submissions", href: "/admin/dashboard/submissions", icon: FileText },
    { name: "File Upload", href: "/admin/dashboard/upload", icon: Upload },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: sidebarOpen ? 0 : "-100%" }}
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-white/80 dark:bg-gray-800/80 
          backdrop-blur-xl border-r border-gray-200 dark:border-gray-700
          lg:translate-x-0 lg:static lg:inset-0
        `}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-bold">V</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white font-lota">
                Vmonie Admin
              </span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  end={item.end}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                    ${isActive
                      ? "bg-primary text-white shadow-sm"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                    }
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>

          {/* User info */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user?.fullName || user?.email}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Administrator
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {isDark ? "Light" : "Dark"}
              </button>

              <button
                onClick={handleLogout}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 hover:text-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700">
          <div className="flex h-full items-center justify-between px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-4 ml-auto">
              <div className="hidden sm:block text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Welcome back,
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {user?.fullName || user?.email?.split("@")[0] || "Admin"}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          <Routes>
            <Route path="/" element={<DashboardHome stats={stats} />} />
            <Route path="/users" element={
              <RequireRole roles={["admin"]}>
                <Users />
              </RequireRole>
            } />
            <Route path="/tasks" element={
              <RequireRole roles={["admin"]}>
                <Tasks />
              </RequireRole>
            } />
            <Route path="/disputes" element={
              <RequireRole roles={["admin"]}>
                <Disputes />
              </RequireRole>
            } />
            <Route path="/merchants" element={
              <RequireRole roles={["admin"]}>
                <Merchants />
              </RequireRole>
            } />
            <Route path="/analytics" element={
              <RequireRole roles={["admin"]}>
                <AnalyticsPage />
              </RequireRole>
            } />
            <Route path="/content" element={
              <RequireRole roles={["admin"]}>
                <ContentManager />
              </RequireRole>
            } />
            <Route path="/submissions" element={
              <RequireRole roles={["admin"]}>
                <FormSubmissions />
              </RequireRole>
            } />
            <Route path="/upload" element={
              <RequireRole roles={["admin"]}>
                <FileUpload />
              </RequireRole>
            } />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const DashboardHome = ({ stats }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white font-lota">
          Admin Dashboard
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Complete system overview and management
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Users"
          value={stats.users?.total || 0}
          icon={Users}
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
      >
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <NavLink
            to="/admin/dashboard/users"
            className="group p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  Manage Users
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {stats.users?.pending || 0} pending
                </div>
              </div>
            </div>
          </NavLink>

          <NavLink
            to="/admin/dashboard/tasks"
            className="group p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 flex items-center justify-center">
                <CheckSquare className="h-5 w-5" />
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  Task Management
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {stats.tasks?.pending || 0} pending
                </div>
              </div>
            </div>
          </NavLink>

          <NavLink
            to="/admin/dashboard/disputes"
            className="group p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  Dispute Resolution
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {stats.disputes?.open || 0} open
                </div>
              </div>
            </div>
          </NavLink>

          <NavLink
            to="/admin/dashboard/merchants"
            className="group p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Store className="h-5 w-5" />
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  Merchant Management
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {stats.merchants?.flagged || 0} flagged
                </div>
              </div>
            </div>
          </NavLink>
        </div>
      </motion.div>
    </motion.div>
  );
};

const AnalyticsPage = () => {
  const [analytics, setAnalytics] = useState({
    users: null,
    tasks: null,
    merchants: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [userStats, taskStats, merchantStats] = await Promise.all([
          analyticsApi.userStats(),
          analyticsApi.taskStats(),
          analyticsApi.merchantStats()
        ]);

        setAnalytics({
          users: userStats.data,
          tasks: taskStats.data,
          merchants: merchantStats.data
        });
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
        toast.error('Failed to load analytics');
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
            <div key={role._id} className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-primary">{role.count}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">{role._id}s</div>
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
            <div key={status._id} className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-primary">{status.count}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">{status._id}</div>
              {status.avgCompletionTime && (
                <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Avg: {Math.round(status.avgCompletionTime / (1000 * 60 * 60 * 24))} days
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
            <div key={status._id} className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-primary">{status.count}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">{status._id}</div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default AdminDashboard;