const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { auth } = require("../middleware/auth");

//  Allowed origins
const allowedOrigins = [
  "http://localhost:3000",
  "https://vmonieweb.com",
  "https://www.vmonieweb.com",
];

//  Set CORS headers
const setCORS = (req, res) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PATCH,DELETE,OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");
};

//  Helper to parse body for POST requests
const getBody = async (req) => {
  if (req.body) return req.body;
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(data));
      } catch {
        resolve({});
      }
    });
    req.on("error", reject);
  });
};

//  Helper to send response with CORS always applied
const send = (req, res, status, data) => {
  setCORS(req, res);
  res.status(status).json(data);
};

//  Main handler
module.exports = async (req, res) => {
  setCORS(req, res);

  //  Handle OPTIONS preflight early
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // 🔹 /api/auth/register
  if (req.method === "POST" && req.url.endsWith("/register")) {
    const bodyData = await getBody(req);
    if (!bodyData.email || !bodyData.password || bodyData.password.length < 6) {
      return send(req, res, 400, { message: "Invalid input" });
    }
    try {
      let user = await User.findOne({ email: bodyData.email });
      if (user) {
        return send(req, res, 400, { message: "User already exists" });
      }
      user = new User({
        email: bodyData.email,
        password: bodyData.password,
        role: "admin",
      });
      await user.save();
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "24h",
      });
      return send(req, res, 201, {
        token,
        user: { id: user._id, email: user.email, role: user.role },
      });
    } catch (error) {
      return send(req, res, 500, { message: "Server error" });
    }
  }

  // 🔹 /api/auth/login
  if (req.method === "POST" && req.url.endsWith("/login")) {
    const bodyData = await getBody(req);
    if (!bodyData.email || !bodyData.password) {
      return send(req, res, 400, { message: "Invalid input" });
    }
    try {
      const user = await User.findOne({ email: bodyData.email });
      if (!user) {
        return send(req, res, 400, { message: "Invalid credentials" });
      }
      const isMatch = await user.comparePassword(bodyData.password);
      if (!isMatch) {
        return send(req, res, 400, { message: "Invalid credentials" });
      }
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "24h",
      });
      return send(req, res, 200, {
        token,
        user: { id: user._id, email: user.email, role: user.role },
      });
    } catch (error) {
      return send(req, res, 500, { message: "Server error" });
    }
  }

  // 🔹 /api/auth/me
  if (req.method === "GET" && req.url.endsWith("/me")) {
    try {
      await auth(req, res, async () => {
        return send(req, res, 200, {
          user: {
            id: req.user._id,
            email: req.user.email,
            role: req.user.role,
          },
        });
      });
    } catch (error) {
      return send(req, res, 401, { message: "Unauthorized" });
    }
  }

  // 🔹 Not found
  return send(req, res, 404, { message: "Not found" });
};
