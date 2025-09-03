const express = require("express");
const { supabase } = require("../config/supabase");
const { authenticateToken, requireRoles } = require("../middleware/auth");

const router = express.Router();

// Log a new dispute (Staff/Admin)
router.post(
  "/",
  authenticateToken,
  requireRoles(["staff", "admin"]),
  async (req, res) => {
    try {
      const { merchant_id, description, assigned_to } = req.body;
      if (!merchant_id || !description) {
        return res
          .status(400)
          .json({ message: "merchant_id and description are required" });
      }
      const { data, error } = await supabase
        .from("disputes")
        .insert({ merchant_id, description, assigned_to: assigned_to || null })
        .select()
        .single();
      if (error) {
        console.error("Create dispute error:", error);
        return res.status(500).json({ message: "Failed to log dispute" });
      }
      res.status(201).json({ message: "Dispute logged", dispute: data });
    } catch (error) {
      console.error("Create dispute error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// List disputes (Staff/Admin)
router.get(
  "/",
  authenticateToken,
  requireRoles(["staff", "admin"]),
  async (req, res) => {
    try {
      const { status, merchant_id, page = 1, limit = 20 } = req.query;
      let query = supabase
        .from("disputes")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });
      if (status) query = query.eq("status", status);
      if (merchant_id) query = query.eq("merchant_id", merchant_id);
      const offset = (parseInt(page) - 1) * parseInt(limit);
      query = query.range(offset, offset + parseInt(limit) - 1);
      const { data, error, count } = await query;
      if (error) {
        console.error("List disputes error:", error);
        return res.status(500).json({ message: "Failed to fetch disputes" });
      }
      res.json({
        disputes: data || [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil((count || 0) / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error("List disputes error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Update dispute status (Staff/Admin)
router.patch(
  "/:id",
  authenticateToken,
  requireRoles(["staff", "admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status, assigned_to } = req.body;

      const updates = { updated_at: new Date().toISOString() };
      if (status) {
        if (!["under_review", "resolved"].includes(status)) {
          return res.status(400).json({ message: "Invalid status" });
        }
        updates.status = status;
        if (status === "resolved")
          updates.resolved_at = new Date().toISOString();
      }
      if (assigned_to !== undefined) updates.assigned_to = assigned_to;

      const { data, error } = await supabase
        .from("disputes")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Update dispute error:", error);
        return res.status(500).json({ message: "Failed to update dispute" });
      }

      res.json({ message: "Dispute updated", dispute: data });
    } catch (error) {
      console.error("Update dispute error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

module.exports = router;
