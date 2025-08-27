import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiUserPlus,
  FiMail,
  FiLock,
  FiTag,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";
import { authApi } from "../../api/client";

const roles = [
  { value: "aggregator", label: "Aggregator" },
  { value: "staff", label: "Staff" },
  { value: "admin", label: "Admin (requires UID)" },
];

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    hints: [],
  });
  const [role, setRole] = useState("aggregator");
  const [adminUid, setAdminUid] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const evaluateStrength = (pwd) => {
    // Simple strength estimator
    let score = 0;
    const hints = [];
    if (pwd.length >= 8) score += 1;
    else hints.push("Use at least 8 characters");
    if (/[A-Z]/.test(pwd)) score += 1;
    else hints.push("Add an uppercase letter (A-Z)");
    if (/[a-z]/.test(pwd)) score += 1;
    else hints.push("Add a lowercase letter (a-z)");
    if (/[0-9]/.test(pwd)) score += 1;
    else hints.push("Add a number (0-9)");
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
    else hints.push("Add a symbol (!@#$)");
    return { score, hints };
  };

  const handlePasswordChange = (val) => {
    setPassword(val);
    setPasswordStrength(evaluateStrength(val));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const payload = { email, password, role };
      if (role === "admin") {
        payload.admin_uid = adminUid.trim();
      }
      const { data } = await authApi.register(payload);
      setSuccess("Account created! Check your email to verify your account.");
      // Redirect to login after a short delay
      setTimeout(() => navigate("/login"), 2000);
    } catch (e) {
      const msg =
        e?.response?.data?.message || e.message || "Registration failed";
      setError(msg);
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
                <FiUserPlus className="h-5 w-5" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Create Account
              </h1>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                {success}
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@company.com"
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
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Minimum 6 characters"
                    className="w-full pl-9 pr-10 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded focus:outline-none focus:ring-2 focus:ring-primary"
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
                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Confirm your password"
                    className="w-full pl-9 pr-10 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded focus:outline-none focus:ring-2 focus:ring-primary"
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

              {/* Password strength meter */}
              <div>
                <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded">
                  <div
                    className={`${
                      passwordStrength.score <= 2
                        ? "bg-red-500"
                        : passwordStrength.score === 3
                          ? "bg-yellow-500"
                          : "bg-green-500"
                    } h-2 rounded`}
                    style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                  />
                </div>
                {password && passwordStrength.hints.length > 0 && (
                  <ul className="mt-2 text-xs text-gray-600 dark:text-gray-300 list-disc list-inside space-y-1">
                    {passwordStrength.hints.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
                  Role
                </label>
                <div className="relative">
                  <FiTag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {roles.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {role === "admin" && (
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
                    Admin UID
                  </label>
                  <input
                    value={adminUid}
                    onChange={(e) => setAdminUid(e.target.value)}
                    placeholder="Enter provided admin UID"
                    className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded p-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white py-2 px-4 rounded shadow hover:shadow-md transition disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Account"}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-300">
              <span>Already have an account? </span>
              <Link to="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
