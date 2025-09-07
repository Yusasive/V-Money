const { cloudinary } = require("../config/cloudinary");
const { adminAuth } = require("../middleware/auth");

// Allowed origins
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

// Response helper
const send = (req, res, status, data) => {
  setCORS(req, res);
  res.status(status).json(data);
};

// Main handler
module.exports = async (req, res) => {
  setCORS(req, res);

  // Handle OPTIONS preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // 🔹 POST /api/upload/single
  if (req.method === "POST" && req.url.endsWith("/single")) {
    return adminAuth(req, res, async () => {
      try {
        if (!req.file) {
          return send(req, res, 400, { message: "No file uploaded" });
        }
        
        return send(req, res, 200, {
          url: req.file.path,
          publicId: req.file.filename,
          originalName: req.file.originalname,
        });
      } catch (error) {
        console.error('Single upload error:', error);
        return send(req, res, 500, { message: "Upload failed" });
      }
    });
  }

  // 🔹 POST /api/upload/multiple
  if (req.method === "POST" && req.url.endsWith("/multiple")) {
    return adminAuth(req, res, async () => {
      try {
        if (!req.files || req.files.length === 0) {
          return send(req, res, 400, { message: "No files uploaded" });
        }
        
        const files = req.files.map((file) => ({
          url: file.path,
          publicId: file.filename,
          originalName: file.originalname,
        }));
        
        return send(req, res, 200, { files });
      } catch (error) {
        console.error('Multiple upload error:', error);
        return send(req, res, 500, { message: "Upload failed" });
      }
    });
  }

  // 🔹 GET /api/upload/list
  if (req.method === "GET" && req.url.endsWith("/list")) {
    return adminAuth(req, res, async () => {
      try {
        const { nextCursor } = req.query || {};
        const result = await cloudinary.search
          .expression("folder:vmonie")
          .max_results(50)
          .next_cursor(nextCursor || undefined)
          .execute();

        const files = (result.resources || []).map((r) => ({
          url: r.secure_url,
          publicId: r.public_id,
          format: r.format,
          bytes: r.bytes,
          width: r.width,
          height: r.height,
          createdAt: r.created_at,
        }));

        return send(req, res, 200, {
          files,
          nextCursor: result.next_cursor || null,
        });
      } catch (error) {
        console.error('List files error:', error);
        return send(req, res, 500, { message: "Failed to list files" });
      }
    });
  }

  // 🔹 Not found
  return send(req, res, 404, { message: "Not found" });
};