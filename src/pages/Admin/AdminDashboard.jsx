import React, { useState, useEffect } from "react";
import { Routes, Route, NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import ContentManager from "./ContentManager";
import FormSubmissions from "./FormSubmissions";
import FileUpload from "./FileUpload";

const AdminDashboard = () => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    pendingSubmissions: 0,
    contentSections: 0,
  });
  const navigate = useNavigate();

  // Move fetchUserData and fetchStats above useEffect
  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await axios.get("http://localhost:5000/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(response.data.user);
    } catch (error) {
      localStorage.removeItem("adminToken");
      navigate("/admin/login");
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const [submissionsRes, contentRes] = await Promise.all([
        axios.get("http://localhost:5000/api/forms", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://localhost:5000/api/content", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const pendingCount = submissionsRes.data.submissions.filter(
        (sub) => sub.status === "pending"
      ).length;

      setStats({
        totalSubmissions: submissionsRes.data.total,
        pendingSubmissions: pendingCount,
        contentSections: contentRes.data.length,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/admin/login");
      return;
    }

    fetchUserData();
    fetchStats();
  }, [navigate, fetchUserData]);

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
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 font-lota">
            Vmonie Admin
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Welcome, {user.email}</span>
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
        <nav className="w-64 bg-white shadow-sm min-h-screen">
          <div className="p-6">
            <ul className="space-y-2">
              <li>
                <NavLink
                  to="/admin/dashboard"
                  end
                  className={({ isActive }) =>
                    `block px-4 py-2 rounded-md font-medium ${
                      isActive
                        ? "bg-primary text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`
                  }
                >
                  Dashboard
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/admin/dashboard/content"
                  className={({ isActive }) =>
                    `block px-4 py-2 rounded-md font-medium ${
                      isActive
                        ? "bg-primary text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`
                  }
                >
                  Content Manager
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/admin/dashboard/submissions"
                  className={({ isActive }) =>
                    `block px-4 py-2 rounded-md font-medium ${
                      isActive
                        ? "bg-primary text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`
                  }
                >
                  Form Submissions
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/admin/dashboard/upload"
                  className={({ isActive }) =>
                    `block px-4 py-2 rounded-md font-medium ${
                      isActive
                        ? "bg-primary text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`
                  }
                >
                  File Upload
                </NavLink>
              </li>
            </ul>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <Routes>
            <Route path="/" element={<DashboardHome stats={stats} />} />
            <Route path="/content" element={<ContentManager />} />
            <Route path="/submissions" element={<FormSubmissions />} />
            <Route path="/upload" element={<FileUpload />} />
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
      <h2 className="text-3xl font-bold text-gray-900 font-lota">
        Dashboard Overview
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">
            Total Submissions
          </h3>
          <p className="text-3xl font-bold text-primary mt-2">
            {stats.totalSubmissions}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">
            Pending Reviews
          </h3>
          <p className="text-3xl font-bold text-orange-500 mt-2">
            {stats.pendingSubmissions}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">
            Content Sections
          </h3>
          <p className="text-3xl font-bold text-green-500 mt-2">
            {stats.contentSections}
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <NavLink
            to="/admin/dashboard/content"
            className="bg-primary text-white p-4 rounded-lg hover:bg-blue-700 text-center"
          >
            Edit Website Content
          </NavLink>
          <NavLink
            to="/admin/dashboard/submissions"
            className="bg-green-500 text-white p-4 rounded-lg hover:bg-green-600 text-center"
          >
            Review Submissions
          </NavLink>
          <NavLink
            to="/admin/dashboard/upload"
            className="bg-purple-500 text-white p-4 rounded-lg hover:bg-purple-600 text-center"
          >
            Upload Files
          </NavLink>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminDashboard;
