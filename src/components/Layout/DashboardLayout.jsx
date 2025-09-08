import React, { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Users,
  CheckSquare,
  AlertTriangle,
  Store,
  User,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  Settings,
  FileText,
  Upload,
  BarChart3,
} from "lucide-react";
import { authApi } from "../../api/client";
import toast from "react-hot-toast";

const DashboardLayout = ({ children, userRole }) => {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    return (
      localStorage.getItem("theme") === "dark" ||
      (!localStorage.getItem("theme") &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
    );
  });

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await authApi.me();
        setUser(response.data.user);
      } catch (error) {
        console.error("Failed to fetch user:", error);
        navigate("/login");
      }
    };

    fetchUser();
  }, [navigate]);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await authApi.logout();
      localStorage.removeItem("authToken");
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Logout failed");
    }
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  // Navigation items based on role
  const getNavigationItems = () => {
    const baseItems = [
      { name: "Dashboard", href: "", icon: Home, end: true },
    ];

    switch (userRole) {
      case "admin":
        return [
          ...baseItems,
          { name: "User Management", href: "/users", icon: Users },
          { name: "Tasks", href: "/tasks", icon: CheckSquare },
          { name: "Disputes", href: "/disputes", icon: AlertTriangle },
          { name: "Merchants", href: "/merchants", icon: Store },
          { name: "Analytics", href: "/analytics", icon: BarChart3 },
          { name: "Content", href: "/content", icon: Settings },
          { name: "Form Submissions", href: "/submissions", icon: FileText },
          { name: "File Upload", href: "/upload", icon: Upload },
        ];

      case "staff":
        return [
          ...baseItems,
          { name: "Tasks", href: "/tasks", icon: CheckSquare },
          { name: "Disputes", href: "/disputes", icon: AlertTriangle },
          { name: "Merchants", href: "/merchants", icon: Store },
        ];

      case "aggregator":
        return [
          ...baseItems,
          { name: "Tasks", href: "/tasks", icon: CheckSquare },
          { name: "Disputes", href: "/disputes", icon: AlertTriangle },
          { name: "Profile", href: "/profile", icon: User },
        ];

      default:
        return baseItems;
    }
  };

  const navigationItems = getNavigationItems();
  const basePath = `/${userRole}/dashboard`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ 
          x: sidebarOpen ? 0 : "-100%",
          transition: { type: "spring", damping: 25, stiffness: 200 }
        }}
        className="fixed top-0 left-0 z-50 h-full w-64 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border-r border-gray-200 dark:border-gray-700 lg:translate-x-0 lg:static lg:inset-0 shadow-xl lg:shadow-none"
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-bold">V</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white font-lota">
                Vmonie
              </span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const href = `${basePath}${item.href}`;
              const isActive = item.end
                ? location.pathname === basePath
                : location.pathname.startsWith(href);

              return (
                <NavLink
                  key={item.name}
                  to={href}
                  end={item.end}
                  className={`
                    flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 group
                    ${
                      isActive
                        ? "bg-primary text-white shadow-sm"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                    }
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className="truncate">{item.name}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* User info */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white/50 dark:bg-gray-800/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user?.fullName || user?.email}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {userRole}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {isDark ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">{isDark ? "Light" : "Dark"}</span>
              </button>

              <button
                onClick={handleLogout}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 hover:text-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main content */}
      <div className="lg:pl-64 min-h-screen flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex h-full items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="hidden sm:block">
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                  {userRole} Dashboard
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:block text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Welcome back,
                </p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {user?.fullName?.split(' ')[0] || user?.email?.split("@")[0] || "User"}
                </p>
              </div>

              {/* Mobile theme toggle */}
              <button
                onClick={toggleTheme}
                className="lg:hidden p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {isDark ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;