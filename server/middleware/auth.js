// Supabase-based authentication and role middleware
const { authHelpers } = require("../config/supabase");

// Verify Authorization: Bearer <access_token> using Supabase
const authenticateToken = async (req, res, next) => {
  try {
    const header = req.header("Authorization") || req.headers["authorization"];
    const token = header?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const { data: user, error } = await authHelpers.getCurrentUser(token);
    if (error || !user) {
      return res.status(401).json({ message: "Invalid token" });
    }

    // Normalize and attach user + role to request
    req.user = user;
    req.user.role = authHelpers.getUserRole(user);

    return next();
  } catch (err) {
    console.error("authenticateToken error:", err);
    return res.status(401).json({ message: "Invalid token" });
  }
};

// Require one of the allowed roles present in Supabase user metadata
const requireRoles =
  (roles = []) =>
  (req, res, next) => {
    try {
      const role =
        req.user?.user_metadata?.role ||
        req.user?.app_metadata?.role ||
        req.user?.role;
      if (!role || (roles.length && !roles.includes(role))) {
        return res
          .status(403)
          .json({ message: "Forbidden: insufficient role" });
      }
      return next();
    } catch (err) {
      console.error("requireRoles error:", err);
      return res.status(403).json({ message: "Forbidden" });
    }
  };

module.exports = { authenticateToken, requireRoles };
