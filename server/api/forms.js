const FormSubmission = require("../models/FormSubmission");
const { adminAuth } = require("../middleware/auth");
const { upload } = require("../config/cloudinary");
const { sendStatusEmail } = require("../config/email");

// Allowed origins
const allowedOrigins = [
  "http://localhost:3000",
  "https://vmonieweb.com",
  "https://www.vmonieweb.com",
  "https://admin.vmonieweb.com",
  "https://www.admin.vmonieweb.com",
  process.env.FRONTEND_URL,
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

// Helper to parse body for POST/PATCH requests
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

// Main handler
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
        status: 'pending'
      });
      
      await submission.save();
      
      return send(req, res, 201, {
        message: "Form submitted successfully",
        id: submission._id,
      });
    } catch (error) {
      console.error('Form submission error:', error);
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
          .populate('reviewedBy', 'fullName email')
          .sort({ createdAt: -1 })
          .limit(limit * 1)
          .skip((page - 1) * limit);

        const total = await FormSubmission.countDocuments(query);

        return send(req, res, 200, {
          submissions,
          totalPages: Math.ceil(total / limit),
          currentPage: parseInt(page),
          total,
        });
      } catch (error) {
        console.error('Get forms error:', error);
        return send(req, res, 500, { message: "Server error" });
      }
    });
  }

  // 🔹 GET /api/forms/:id (admin only)
  if (req.method === "GET" && req.url.match(/^\/api\/forms\/[^/]+$/)) {
    return adminAuth(req, res, async () => {
      const id = req.url.split("/").pop();
      try {
        const submission = await FormSubmission.findById(id)
          .populate('reviewedBy', 'fullName email');
          
        if (!submission) {
          return send(req, res, 404, { message: "Submission not found" });
        }
        
        return send(req, res, 200, submission);
      } catch (error) {
        console.error('Get form error:', error);
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
          { 
            status, 
            notes,
            reviewedBy: req.user._id,
            reviewedAt: new Date()
          },
          { new: true }
        ).populate('reviewedBy', 'fullName email');
        
        if (!submission) {
          return send(req, res, 404, { message: "Submission not found" });
        }

        // Send email notification
        let emailResult = { sent: false, reason: 'no_email' };
        const rawEmail = submission.data?.email?.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (rawEmail && emailRegex.test(rawEmail) && status) {
          try {
            await sendStatusEmail({
              to: rawEmail,
              status,
              notes,
              formType: submission.formType,
              name: submission.data?.firstName || submission.data?.fullName
            });
            
            submission.emailSent = true;
            submission.emailSentAt = new Date();
            await submission.save();
            
            emailResult = { sent: true, reason: 'ok' };
          } catch (mailErr) {
            console.error('Email send failed:', mailErr);
            emailResult = { sent: false, reason: 'send_failed' };
          }
        }
        
        return send(req, res, 200, { 
          submission,
          email: emailResult 
        });
      } catch (error) {
        console.error('Update form error:', error);
        return send(req, res, 500, { message: "Server error" });
      }
    });
  }

  // 🔹 DELETE /api/forms/:id (admin only)
  if (req.method === "DELETE" && req.url.match(/^\/api\/forms\/[^/]+$/)) {
    return adminAuth(req, res, async () => {
      const id = req.url.split("/").pop();
      try {
        const submission = await FormSubmission.findByIdAndDelete(id);
        if (!submission) {
          return send(req, res, 404, { message: "Submission not found" });
        }
        
        return send(req, res, 200, {
          message: "Submission deleted successfully",
        });
      } catch (error) {
        console.error('Delete form error:', error);
        return send(req, res, 500, { message: "Server error" });
      }
    });
  }

  // 🔹 Not found
  return send(req, res, 404, { message: "Not found" });
};