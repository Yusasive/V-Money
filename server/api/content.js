const Content = require("../models/Content");
const { adminAuth } = require("../middleware/auth");

const allowedOrigins = [
  "http://localhost:3000",
  "https://vmonieweb.com",
  "https://www.vmonieweb.com",
  process.env.FRONTEND_URL
].filter(Boolean);

// Set CORS headers
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

// Helper to parse body for POST requests
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

// Response helper (always applies CORS)
const send = (req, res, status, data) => {
  setCORS(req, res);
  res.status(status).json(data);
};

// Main handler
module.exports = async (req, res) => {
  setCORS(req, res);

  // Handle OPTIONS preflight early
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // 🔹 GET /api/content
  if (req.method === "GET" && req.url === "/api/content") {
    try {
      const content = await Content.find({ isActive: true }).sort({ section: 1 });
      return send(req, res, 200, content);
    } catch (error) {
      console.error('Get content error:', error);
      return send(req, res, 500, { message: "Server error" });
    }
  }

  // 🔹 GET /api/content/:section
  if (req.method === "GET" && req.url.match(/^\/api\/content\/[^/]+$/)) {
    const section = req.url.split("/").pop();
    try {
      const content = await Content.findOne({ section, isActive: true });
      if (!content) {
        return send(req, res, 404, { message: "Content not found" });
      }
      return send(req, res, 200, content);
    } catch (error) {
      console.error('Get content by section error:', error);
      return send(req, res, 500, { message: "Server error" });
    }
  }

  // 🔹 POST /api/content/:section
  if (req.method === "POST" && req.url.match(/^\/api\/content\/[^/]+$/)) {
    return adminAuth(req, res, async () => {
      const section = req.url.split("/").pop();
      const contentData = { section, ...(await getBody(req)) };
      
      try {
        // Upsert: update if exists, create if not
        const content = await Content.findOneAndUpdate(
          { section },
          contentData,
          { new: true, upsert: true, runValidators: true }
        );
        
        return send(req, res, 200, content);
      } catch (error) {
        console.error('Save content error:', error);
        return send(req, res, 500, { message: "Server error" });
      }
    });
  }

  // 🔹 DELETE /api/content/:section
  if (req.method === "DELETE" && req.url.match(/^\/api\/content\/[^/]+$/)) {
    return adminAuth(req, res, async () => {
      const section = req.url.split("/").pop();
      try {
        const content = await Content.findOneAndDelete({ section });
        if (!content) {
          return send(req, res, 404, { message: "Content not found" });
        }
        return send(req, res, 200, { message: "Content deleted successfully" });
      } catch (error) {
        console.error('Delete content error:', error);
        return send(req, res, 500, { message: "Server error" });
      }
    });
  }

  // 🔹 Not found
  return send(req, res, 404, { message: "Not found" });
};