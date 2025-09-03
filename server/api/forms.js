const FormSubmission = require("../models/FormSubmission");
const { adminAuth } = require("../middleware/auth");
const { upload } = require("../config/cloudinary");

//  Allowed origins
const allowedOrigins = [
  "http://localhost:3000",
  "https://vmonieweb.com",
  "https://www.vmonieweb.com",
];

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

//  Helper to parse body for POST/PATCH requests
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

//  Main handler
module.exports = async (req, res) => {
  setCORS(req, res);

  // Handle OPTIONS preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // 🔹 POST /api/forms/submit
  if (req.method === "POST" && req.url.endsWith("/submit")) {
    try {
      const bodyData = await getBody(req);
      const { formType, ...formData } = bodyData;
      const files = req.files
        ? req.files.map((file) => ({
            fieldName: file.fieldname,
            originalName: file.originalname,
            cloudinaryUrl: file.path,
            publicId: file.filename,
          }))
        : [];
      const submission = new FormSubmission({
        formType,
        data: formData,
        files,
      });
      await submission.save();
      return send(req, res, 201, {
        message: "Form submitted successfully",
        id: submission._id,
      });
    } catch (error) {
      return send(req, res, 500, { message: "Server error" });
    }
  }

  // 🔹 GET /api/forms (admin only)
  if (req.method === "GET" && req.url === "/api/forms") {
    return adminAuth(req, res, async () => {
      try {
        const { page = 1, limit = 10, formType, status } = req.query;
        const query = {};
        if (formType) query.formType = formType;
        if (status) query.status = status;

        const submissions = await FormSubmission.find(query)
          .sort({ createdAt: -1 })
          .limit(limit * 1)
          .skip((page - 1) * limit);

        const total = await FormSubmission.countDocuments(query);

        return send(req, res, 200, {
          submissions,
          totalPages: Math.ceil(total / limit),
          currentPage: page,
          total,
        });
      } catch (error) {
        return send(req, res, 500, { message: "Server error" });
      }
    });
  }

  // 🔹 GET /api/forms/:id (admin only)
  if (req.method === "GET" && req.url.match(/^\/api\/forms\/[^/]+$/)) {
    return adminAuth(req, res, async () => {
      const id = req.url.split("/").pop();
      try {
        const submission = await FormSubmission.findById(id);
        if (!submission) {
          return send(req, res, 404, { message: "Submission not found" });
        }
        return send(req, res, 200, submission);
      } catch (error) {
        return send(req, res, 500, { message: "Server error" });
      }
    });
  }

  // 🔹 PATCH /api/forms/:id (admin only)
  if (req.method === "PATCH" && req.url.match(/^\/api\/forms\/[^/]+$/)) {
    return adminAuth(req, res, async () => {
      const id = req.url.split("/").pop();
      const { status, notes } = await getBody(req);
      try {
        const submission = await FormSubmission.findByIdAndUpdate(
          id,
          { status, notes },
          { new: true }
        );
        if (!submission) {
          return send(req, res, 404, { message: "Submission not found" });
        }
        return send(req, res, 200, submission);
      } catch (error) {
        return send(req, res, 500, { message: "Server error" });
      }
    });
  }

  // 🔹 DELETE /api/forms/:id (admin only)
  if (req.method === "DELETE" && req.url.match(/^\/api\/forms\/[^/]+$/)) {
    return adminAuth(req, res, async () => {
      const id = req.url.split("/").pop();
      try {
        await FormSubmission.findByIdAndDelete(id);
        return send(req, res, 200, {
          message: "Submission deleted successfully",
        });
      } catch (error) {
        return send(req, res, 500, { message: "Server error" });
      }
    });
  }

  // 🔹 Not found
  return send(req, res, 404, { message: "Not found" });
};
