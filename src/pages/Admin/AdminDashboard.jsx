import React, { useState, useEffect, useCallback } from "react";
import { Routes, Route, NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { authApi, formsApi, contentApi } from "../../api/client";
import ContentManager from "./ContentManager";
import FormSubmissions from "./FormSubmissions";
import FileUpload from "./FileUpload";
import Tasks from "./Tasks";
import Merchants from "./Merchants";
import Disputes from "./Disputes";
import RequireRole from "../../components/Auth/RequireRole";
import { FiMoon, FiSun, FiEdit, FiFileText, FiUpload } from "react-icons/fi";

const AdminDashboard = () => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    pendingSubmissions: 0,
    contentSections: 0,
  });
  const [isDark, setIsDark] = useState(() => {
    const root = document.documentElement;
    return (
      root.classList.contains("dark") ||
      localStorage.getItem("theme-dark") === "1"
    );
  });
  const navigate = useNavigate();

  // Move fetchUserData and fetchStats above useEffect
  const fetchUserData = useCallback(async () => {
    try {
      const response = await authApi.me();
      setUser(response.data.user);
    } catch (error) {
      localStorage.removeItem("adminToken");
      navigate("/admin/login");
    }
  }, [navigate]);

  const fetchStats = useCallback(async () => {
    try {
      const [submissionsRes, contentRes] = await Promise.all([
        formsApi.list({ page: 1, limit: 1 }), // just to get counts, adjust if needed
        contentApi.list(),
      ]);

      const pendingCount = (submissionsRes.data.submissions || []).filter(
        (sub) => sub.status === "pending"
      ).length;

      setStats({
        totalSubmissions: submissionsRes.data.total || 0,
        pendingSubmissions: pendingCount,
        contentSections: (contentRes.data || []).length,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/admin/login");
      return;
    }

    fetchUserData();
    fetchStats();
  }, [navigate, fetchUserData, fetchStats]);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/admin/login");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-bold">V</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white font-lota">
              Vmonie Admin
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const root = document.documentElement;
                root.classList.toggle("dark");
                const next = root.classList.contains("dark");
                localStorage.setItem("theme-dark", next ? "1" : "0");
                setIsDark(next);
              }}
              className="px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Toggle theme"
            >
              {isDark ? (
                <FiSun className="h-5 w-5" />
              ) : (
                <FiMoon className="h-5 w-5" />
              )}
            </button>
            <span className="text-gray-600 dark:text-gray-300 hidden sm:inline">
              {user.email}
            </span>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 min-h-[calc(100vh-64px)] hidden md:block">
          <div className="p-4">
            <ul className="space-y-1">
              {[
                { to: "/admin/dashboard", label: "Dashboard", end: true },
                { to: "/admin/dashboard/content", label: "Content Manager" },
                { to: "/admin/dashboard/tasks", label: "Tasks" },
                { to: "/admin/dashboard/merchants", label: "Merchants" },
                { to: "/admin/dashboard/disputes", label: "Disputes" },
                {
                  to: "/admin/dashboard/submissions",
                  label: "Form Submissions",
                },
                { to: "/admin/dashboard/upload", label: "File Upload" },
              ].map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    end={link.end}
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition ${
                        isActive
                          ? "bg-primary text-white shadow"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`
                    }
                  >
                    <span className="inline-block h-2 w-2 rounded-full bg-current/60" />
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6">
          <Routes>
            <Route path="/" element={<DashboardHome stats={stats} />} />
            <Route
              path="/content"
              element={
                <RequireRole roles={["admin", "staff"]}>
                  <ContentManager />
                </RequireRole>
              }
            />
            <Route
              path="/tasks"
              element={
                <RequireRole roles={["admin", "staff"]}>
                  <Tasks />
                </RequireRole>
              }
            />
            <Route
              path="/merchants"
              element={
                <RequireRole roles={["admin", "staff"]}>
                  <Merchants />
                </RequireRole>
              }
            />
            <Route
              path="/disputes"
              element={
                <RequireRole roles={["admin", "staff"]}>
                  <Disputes />
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
                <RequireRole roles={["admin", "staff"]}>
                  <FileUpload />
                </RequireRole>
              }
            />
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
      className="space-y-6"
    >
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white font-lota">
        Dashboard Overview
      </h2>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            title: "Total Submissions",
            value: stats.totalSubmissions,
            color: "from-blue-500 to-cyan-500",
          },
          {
            title: "Pending Reviews",
            value: stats.pendingSubmissions,
            color: "from-amber-500 to-orange-500",
          },
          {
            title: "Content Sections",
            value: stats.contentSections,
            color: "from-emerald-500 to-green-500",
          },
        ].map((c) => (
          <div
            key={c.title}
            className="relative overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow border border-gray-100 dark:border-gray-700"
          >
            <div
              className={`absolute -top-10 -right-10 h-32 w-32 bg-gradient-to-br ${c.color} opacity-20 rounded-full`}
            />
            <div className="p-6 relative">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {c.title}
              </div>
              <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {c.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border border-gray-100 dark:border-gray-700">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <NavLink
            to="/admin/dashboard/content"
            className="group p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary hover:shadow transition"
          >
            <div className="flex items-center gap-3">
              <span className="h-9 w-9 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                <FiEdit size={18} />
              </span>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  Edit Website Content
                </div>
                <div className="text-sm text-gray-500">
                  Open Content Manager
                </div>
              </div>
            </div>
          </NavLink>
          <NavLink
            to="/admin/dashboard/submissions"
            className="group p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary hover:shadow transition"
          >
            <div className="flex items-center gap-3">
              <span className="h-9 w-9 rounded-md bg-green-100 text-green-600 flex items-center justify-center">
                <FiFileText size={18} />
              </span>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  Review Submissions
                </div>
                <div className="text-sm text-gray-500">Manage user forms</div>
              </div>
            </div>
          </NavLink>
          <NavLink
            to="/admin/dashboard/upload"
            className="group p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary hover:shadow transition"
          >
            <div className="flex items-center gap-3">
              <span className="h-9 w-9 rounded-md bg-purple-100 text-purple-600 flex items-center justify-center">
                <FiUpload size={18} />
              </span>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  Upload Files
                </div>
                <div className="text-sm text-gray-500">Assets and media</div>
              </div>
            </div>
          </NavLink>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminDashboard;
