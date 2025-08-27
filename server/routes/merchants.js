const express = require("express");
const { supabaseAdmin } = require("../config/supabase");
const { authenticateToken, requireRoles } = require("../middleware/auth");

const router = express.Router();

// Update own merchant profile (Merchant only)
router.patch("/me", authenticateToken, async (req, res) => {
  try {
    // First, verify that the user has a merchant profile
    const { data: existingMerchant, error: checkError } = await supabaseAdmin
      .from("merchants")
      .select("id")
      .eq("user_id", req.user.id)
      .single();

    if (checkError || !existingMerchant) {
      return res.status(403).json({
        message: "Access denied. No merchant profile found for this user.",
      });
    }

    const updates = {};
    // Basic info
    if (req.body.business_name !== undefined)
      updates.business_name = req.body.business_name;
    if (req.body.phone !== undefined) updates.phone = req.body.phone;
    if (req.body.address !== undefined) updates.address = req.body.address;
    if (req.body.business_address !== undefined)
      updates.business_address = req.body.business_address;

    // Personal information
    if (req.body.first_name !== undefined)
      updates.first_name = req.body.first_name;
    if (req.body.middle_name !== undefined)
      updates.middle_name = req.body.middle_name;
    if (req.body.last_name !== undefined)
      updates.last_name = req.body.last_name;
    if (req.body.gender !== undefined) updates.gender = req.body.gender;
    if (req.body.state !== undefined) updates.state = req.body.state;
    if (req.body.lga !== undefined) updates.lga = req.body.lga;

    // Business information
    if (req.body.serial_no !== undefined)
      updates.serial_no = req.body.serial_no;

    // Note: BVN, NIN, and document URLs are typically not updated after initial registration
    // for security and compliance reasons, but can be added if needed

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from("merchants")
      .update(updates)
      .eq("user_id", req.user.id)
      .select()
      .single();

    if (error) {
      console.error("Update own merchant error:", error);
      return res.status(500).json({ message: "Failed to update profile" });
    }

    res.json({ message: "Profile updated", merchant: data });
  } catch (error) {
    console.error("Update own merchant error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Create merchant profile (Staff/Admin)
router.post(
  "/",
  authenticateToken,
  requireRoles(["staff", "admin"]),
  async (req, res) => {
    try {
      const {
        username,
        business_name,
        email,
        phone,
        address,
        business_address,
        first_name,
        middle_name,
        last_name,
        gender,
        state,
        lga,
        serial_no,
        user_id,
      } = req.body;
      if (!username || !business_name || !email) {
        return res
          .status(400)
          .json({ message: "username, business_name, email are required" });
      }

      const { data, error } = await supabaseAdmin
        .from("merchants")
        .insert({
          username,
          business_name,
          email,
          phone: phone || null,
          address: address || null,
          business_address: business_address || null,
          first_name: first_name || null,
          middle_name: middle_name || null,
          last_name: last_name || null,
          gender: gender || null,
          state: state || null,
          lga: lga || null,
          serial_no: serial_no || null,
          user_id: user_id || null,
        })
        .select()
        .single();

      if (error) {
        console.error("Create merchant error:", error);
        return res.status(500).json({ message: "Failed to create merchant" });
      }

      res.status(201).json({ message: "Merchant created", merchant: data });
    } catch (error) {
      console.error("Create merchant error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Update merchant profile (Staff/Admin)
router.patch(
  "/:id",
  authenticateToken,
  requireRoles(["staff", "admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const {
        username,
        business_name,
        email,
        phone,
        address,
        business_address,
        first_name,
        middle_name,
        last_name,
        gender,
        state,
        lga,
        serial_no,
        status,
      } = req.body;

      const updates = { updated_at: new Date().toISOString() };
      if (username !== undefined) updates.username = username;
      if (business_name !== undefined) updates.business_name = business_name;
      if (email !== undefined) updates.email = email;
      if (phone !== undefined) updates.phone = phone;
      if (address !== undefined) updates.address = address;
      if (business_address !== undefined)
        updates.business_address = business_address;
      if (first_name !== undefined) updates.first_name = first_name;
      if (middle_name !== undefined) updates.middle_name = middle_name;
      if (last_name !== undefined) updates.last_name = last_name;
      if (gender !== undefined) updates.gender = gender;
      if (state !== undefined) updates.state = state;
      if (lga !== undefined) updates.lga = lga;
      if (serial_no !== undefined) updates.serial_no = serial_no;
      if (status !== undefined) updates.status = status;

      const { data, error } = await supabaseAdmin
        .from("merchants")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Update merchant error:", error);
        return res.status(500).json({ message: "Failed to update merchant" });
      }

      res.json({ message: "Merchant updated", merchant: data });
    } catch (error) {
      console.error("Update merchant error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Record daily merchant transactions (Staff/Admin)
router.post(
  "/:id/transactions",
  authenticateToken,
  requireRoles(["staff", "admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { txn_date, txn_count } = req.body;
      if (!txn_date || txn_count === undefined) {
        return res
          .status(400)
          .json({ message: "txn_date and txn_count are required" });
      }

      const { data, error } = await supabaseAdmin
        .from("merchant_transactions")
        .insert({
          merchant_id: id,
          txn_date,
          txn_count: parseInt(txn_count, 10),
        })
        .select()
        .single();

      if (error) {
        console.error("Create transaction error:", error);
        return res
          .status(500)
          .json({ message: "Failed to record transaction" });
      }

      // Status auto-update handled by DB trigger
      res
        .status(201)
        .json({ message: "Transaction recorded", transaction: data });
    } catch (error) {
      console.error("Create transaction error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Check what's actually on Cloudinary (Admin only)
router.get(
  "/debug/cloudinary",
  authenticateToken,
  requireRoles(["admin"]),
  async (req, res) => {
    try {
      const { getCloudinaryResources } = require("../utils/cloudinary");
      const resources = await getCloudinaryResources();

      res.json({
        message: "Cloudinary resources",
        totalCount: resources.resources.length,
        resources: resources.resources.map((r) => ({
          public_id: r.public_id,
          secure_url: r.secure_url,
          created_at: r.created_at,
          bytes: r.bytes,
          format: r.format,
        })),
      });
    } catch (error) {
      console.error("Cloudinary debug error:", error);
      res
        .status(500)
        .json({
          message: "Failed to fetch Cloudinary resources",
          error: error.message,
        });
    }
  }
);

// Utility endpoint to fix document URLs (Admin only)
router.post(
  "/fix-document-urls",
  authenticateToken,
  requireRoles(["admin"]),
  async (req, res) => {
    try {
      // Get all merchants with document URLs
      const { data: merchants, error: fetchError } = await supabaseAdmin
        .from("merchants")
        .select(
          "id, utility_bill_url, passport_url, business_pic_url, nin_slip_url"
        );

      if (fetchError) {
        console.error("Fetch merchants error:", fetchError);
        return res.status(500).json({ message: "Failed to fetch merchants" });
      }

      let fixedCount = 0;
      const results = [];

      for (const merchant of merchants) {
        const updates = {};
        let needsUpdate = false;

        // Helper function to extract and fix URL from object or JSON string
        const extractAndFixUrl = (urlData) => {
          if (!urlData) return null;

          let extractedUrl = null;

          // Extract URL from different formats
          if (typeof urlData === "string" && !urlData.startsWith("{")) {
            extractedUrl = urlData;
          } else if (typeof urlData === "object" && urlData.url) {
            extractedUrl = urlData.url;
          } else if (typeof urlData === "string" && urlData.startsWith("{")) {
            try {
              const parsed = JSON.parse(urlData);
              extractedUrl = parsed.url || null;
            } catch (e) {
              return null;
            }
          }

          if (!extractedUrl) return null;

          // Fix double folder issue: v-money/v-money/ -> v-money/
          if (extractedUrl.includes("/v-money/v-money/")) {
            extractedUrl = extractedUrl.replace(
              "/v-money/v-money/",
              "/v-money/"
            );
          }

          // Clean up double extensions
          if (extractedUrl.includes(".png.png")) {
            extractedUrl = extractedUrl.replace(".png.png", ".png");
          }
          if (extractedUrl.includes(".jpg.jpg")) {
            extractedUrl = extractedUrl.replace(".jpg.jpg", ".jpg");
          }
          if (extractedUrl.includes(".jpeg.jpeg")) {
            extractedUrl = extractedUrl.replace(".jpeg.jpeg", ".jpeg");
          }

          return extractedUrl;
        };

        // Check each document URL
        [
          "utility_bill_url",
          "passport_url",
          "business_pic_url",
          "nin_slip_url",
        ].forEach((field) => {
          const currentValue = merchant[field];
          const fixedUrl = extractAndFixUrl(currentValue);

          if (currentValue && fixedUrl && fixedUrl !== currentValue) {
            updates[field] = fixedUrl;
            needsUpdate = true;
          }
        });

        if (needsUpdate) {
          updates.updated_at = new Date().toISOString();

          const { error: updateError } = await supabaseAdmin
            .from("merchants")
            .update(updates)
            .eq("id", merchant.id);

          if (updateError) {
            results.push({
              id: merchant.id,
              status: "error",
              error: updateError.message,
            });
          } else {
            results.push({ id: merchant.id, status: "fixed", updates });
            fixedCount++;
          }
        } else {
          results.push({ id: merchant.id, status: "no_changes_needed" });
        }
      }

      res.json({
        message: `Fixed ${fixedCount} merchant records`,
        totalProcessed: merchants.length,
        fixedCount,
        results,
      });
    } catch (error) {
      console.error("Fix document URLs error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Debug endpoint to check user info
router.get("/debug/user", authenticateToken, async (req, res) => {
  try {
    const userRole =
      req.user.user_metadata?.role || req.user.app_metadata?.role || "user";

    // Check if user has merchant profile
    const { data: merchantProfile, error } = await supabaseAdmin
      .from("merchants")
      .select("*")
      .eq("user_id", req.user.id)
      .single();

    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        role: userRole,
        user_metadata: req.user.user_metadata,
        app_metadata: req.user.app_metadata,
      },
      merchantProfile: merchantProfile || null,
      hasProfile: !!merchantProfile,
      error: error?.message || null,
    });
  } catch (error) {
    console.error("Debug user error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get merchant + status
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // If "me" is requested, update last_activity_date and get the current user's merchant profile
    if (id === "me") {
      // Update last_activity_date to now
      await supabaseAdmin
        .from("merchants")
        .update({ last_activity_date: new Date().toISOString() })
        .eq("user_id", req.user.id);

      const { data, error } = await supabaseAdmin
        .from("merchants")
        .select("*")
        .eq("user_id", req.user.id)
        .single();

      if (error || !data) {
        return res.status(404).json({ message: "Merchant profile not found" });
      }

      return res.json({ data });
    }

    // Otherwise, get merchant by ID (for staff/admin)
    const { data, error } = await supabaseAdmin
      .from("merchants")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return res.status(404).json({ message: "Merchant not found" });
    }

    res.json({ data });
  } catch (error) {
    console.error("Get merchant error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
