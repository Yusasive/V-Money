const express = require("express");
const multer = require("multer");
const { supabase, supabaseAdmin } = require("../config/supabase");
const {
  authenticateToken,
  requireAdmin,
  requireRoles,
} = require("../middleware/auth");
const { uploadToCloudinary } = require("../utils/cloudinary");
const { sendEmail } = require("../utils/email");
const crypto = require("crypto");

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Submit form (public endpoint)
router.post("/submit", upload.array("files", 10), async (req, res) => {
  try {
    const { formType, ...formData } = req.body;
    const files = req.files || [];

    if (!formType) {
      return res.status(400).json({ message: "Form type is required" });
    }

    // Special handling for merchant onboarding
    if (formType === "onboarding") {
      return await handleMerchantOnboarding(req, res, formData, files);
    }

    // Upload files to Cloudinary if any
    let fileUrls = [];
    if (files.length > 0) {
      try {
        const uploadPromises = files.map((file) =>
          uploadToCloudinary(file.buffer, file.originalname)
        );
        fileUrls = await Promise.all(uploadPromises);
      } catch (uploadError) {
        console.error("File upload error:", uploadError);
        return res.status(500).json({ message: "File upload failed" });
      }
    }

    // Save form submission to database
    const { data, error } = await supabaseAdmin
      .from("form_submissions")
      .insert({
        form_type: formType,
        data: formData,
        files: fileUrls,
        status: "pending",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Form submission error:", error);
      return res.status(500).json({ message: "Failed to submit form" });
    }

    res.status(201).json({
      message: "Form submitted successfully",
      submissionId: data.id,
    });
  } catch (error) {
    console.error("Form submission error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Handle merchant onboarding - creates account and sends credentials
async function handleMerchantOnboarding(req, res, formData, files) {
  try {
    const { email, businessName, firstName, lastName, phone } = formData;

    // Check if email already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingUser.users.some((user) => user.email === email);

    if (userExists) {
      return res.status(400).json({
        message:
          "An account with this email already exists. Please use a different email or contact support.",
      });
    }

    // Generate unique username and password
    const username = generateUniqueUsername(businessName || firstName);
    const password = generateSecurePassword();

    // Upload files to Cloudinary
    let fileUrls = [];
    if (files.length > 0) {
      try {
        const uploadPromises = files.map((file) =>
          uploadToCloudinary(file.buffer, file.originalname)
        );
        fileUrls = await Promise.all(uploadPromises);
      } catch (uploadError) {
        console.error("File upload error:", uploadError);
        return res.status(500).json({ message: "File upload failed" });
      }
    }

    // Create merchant user account
    const { data: userData, error: userError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email for merchants
        user_metadata: {
          role: "merchant",
          username,
          businessName: businessName || `${firstName} ${lastName}`,
          phone,
        },
        app_metadata: { role: "merchant" },
      });

    if (userError) {
      console.error("Merchant account creation error:", userError);
      return res.status(500).json({
        message: "Failed to create merchant account. Please try again.",
      });
    }

    // Create merchant profile in merchants table with all onboarding data
    const { error: merchantError } = await supabaseAdmin
      .from("merchants")
      .insert({
        user_id: userData.user.id,
        username,
        business_name: businessName || `${firstName} ${lastName}`,
        email,
        phone: phone || null,
        address: formData.address || null,
        business_address: formData.businessAddress || null,
        first_name: firstName || null,
        middle_name: formData.middleName || null,
        last_name: lastName || null,
        gender: formData.gender || null,
        state: formData.state || null,
        lga: formData.lga || null,
        bvn: formData.bvn || null,
        nin: formData.nin || null,
        serial_no: formData.serialNo || null,
        // Document URLs will be populated from fileUrls array (extract URL from object)
        utility_bill_url: fileUrls[0]?.url || null,
        passport_url: fileUrls[1]?.url || null,
        business_pic_url: fileUrls[2]?.url || null,
        nin_slip_url: fileUrls[3]?.url || null,
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (merchantError) {
      console.error("Merchant profile creation error:", merchantError);
      // Don't fail the request, but log the error
    }

    // Save onboarding form submission
    const { error: formError } = await supabaseAdmin
      .from("form_submissions")
      .insert({
        form_type: "onboarding",
        data: formData,
        files: fileUrls,
        status: "approved", // Auto-approve merchant onboarding
        notes: `Merchant account created with username: ${username}`,
        created_at: new Date().toISOString(),
      });

    if (formError) {
      console.error("Form submission error:", formError);
      // Don't fail the request, but log the error
    }

    // Send credentials email
    try {
      await sendMerchantCredentials(
        email,
        username,
        password,
        businessName || `${firstName} ${lastName}`
      );
    } catch (emailError) {
      console.error("Failed to send credentials email:", emailError);
      // Don't fail the request, but log the error
    }

    res.status(201).json({
      message:
        "Merchant registration successful! Check your email for login credentials.",
      merchantId: userData.user.id,
    });
  } catch (error) {
    console.error("Merchant onboarding error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Generate unique username from business name
function generateUniqueUsername(businessName) {
  const base = businessName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .substring(0, 8);

  const timestamp = Date.now().toString().slice(-4);
  return `${base}${timestamp}`;
}

// Generate secure password
function generateSecurePassword() {
  const length = 12;
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";

  // Ensure at least one of each type
  password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)]; // uppercase
  password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)]; // lowercase
  password += "0123456789"[Math.floor(Math.random() * 10)]; // number
  password += "!@#$%^&*"[Math.floor(Math.random() * 8)]; // symbol

  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }

  // Shuffle the password
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

// Alternative: Send merchant credentials email using Supabase Admin API
async function sendMerchantCredentialsAdmin(
  email,
  username,
  password,
  businessName
) {
  try {
    const loginUrl =
      process.env.MERCHANT_LOGIN_REDIRECT_URL || "http://localhost:3000/login";

    // Use Supabase Admin API to send custom email
    // This gives you more control over the email content
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "signup",
      email: email,
      options: {
        redirectTo: loginUrl,
        data: {
          username,
          password,
          businessName,
          message: `Your merchant account has been created successfully!

Login Credentials:
Username: ${username}
Password: ${password}

Please login at: ${loginUrl}

For security reasons, we recommend changing your password after your first login.

Welcome to V-Money!`,
        },
      },
    });

    if (error) {
      console.error("Failed to send merchant credentials email:", error);
      throw error;
    }

    console.log("Merchant credentials email sent successfully to:", email);
    return { success: true, data };
  } catch (error) {
    console.error("Error sending merchant credentials email:", error);
    throw error;
  }
}

// Send merchant credentials email using custom approach
async function sendMerchantCredentials(
  email,
  username,
  password,
  businessName
) {
  try {
    const loginUrl =
      process.env.MERCHANT_LOGIN_REDIRECT_URL || "http://localhost:3000/login";

    // Build email content and send via SMTP
    const emailContent = {
      to: email,
      subject: "Welcome to V-Money - Your Merchant Account Credentials",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Welcome to V-Money!</h2>
          <p>Dear ${businessName},</p>
          <p>Your merchant account has been created successfully!</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Your Login Credentials:</h3>
            <p><strong>Username:</strong> ${username}</p>
            <p><strong>Password:</strong> ${password}</p>
            <p><strong>Login URL:</strong> <a href="${loginUrl}">${loginUrl}</a></p>
          </div>
          
          <p><strong>Important:</strong> For security reasons, we recommend changing your password after your first login.</p>
          
          <p>If you have any questions, please contact our support team.</p>
          
          <p>Best regards,<br>The V-Money Team</p>
        </div>
      `,
      text: `
Welcome to V-Money!

Dear ${businessName},

Your merchant account has been created successfully!

Your Login Credentials:
Username: ${username}
Password: ${password}
Login URL: ${loginUrl}

Important: For security reasons, we recommend changing your password after your first login.

If you have any questions, please contact our support team.

Best regards,
The V-Money Team
      `,
    };

    await sendEmail(emailContent);

    return {
      success: true,
      message: "Email sent via SMTP",
    };
  } catch (error) {
    console.error("Error preparing merchant credentials email:", error);
    throw error;
  }
}

// Get all form submissions (Admin/Staff only)
router.get(
  "/",
  authenticateToken,
  requireRoles(["admin", "staff"]),
  async (req, res) => {
    try {
      const { page = 1, limit = 10, status, formType } = req.query;

      let query = supabaseAdmin
        .from("form_submissions")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      // Apply filters
      if (status) {
        query = query.eq("status", status);
      }
      if (formType) {
        query = query.eq("form_type", formType);
      }

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error("Get submissions error:", error);
        return res.status(500).json({ message: "Failed to fetch submissions" });
      }

      res.json({
        submissions: data || [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit),
        },
      });
    } catch (error) {
      console.error("Get submissions error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Get single form submission (Admin only)
router.get("/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from("form_submissions")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Get submission error:", error);
      return res.status(404).json({ message: "Submission not found" });
    }

    res.json(data);
  } catch (error) {
    console.error("Get submission error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update form submission status (Admin only)
router.patch("/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ["pending", "reviewed", "approved", "rejected"];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status. Must be one of: " + validStatuses.join(", "),
      });
    }

    const updateData = {
      updated_at: new Date().toISOString(),
    };

    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    const { data, error } = await supabaseAdmin
      .from("form_submissions")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Update submission error:", error);
      return res.status(500).json({ message: "Failed to update submission" });
    }

    res.json({
      message: "Submission updated successfully",
      data,
    });
  } catch (error) {
    console.error("Update submission error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete form submission (Admin only)
router.delete("/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from("form_submissions")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Delete submission error:", error);
      return res.status(500).json({ message: "Failed to delete submission" });
    }

    res.json({ message: "Submission deleted successfully" });
  } catch (error) {
    console.error("Delete submission error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
