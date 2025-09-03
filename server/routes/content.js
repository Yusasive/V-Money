const express = require("express");
const { supabase } = require("../config/supabase");
const { authenticateToken, requireRoles } = require("../middleware/auth");

const router = express.Router();

// Get all content
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase.from("content").select("*");
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("GET /api/content error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get content by section
router.get("/:section", async (req, res) => {
  try {
    const { section } = req.params;
    const { data, error } = await supabase
      .from("content")
      .select("*")
      .eq("section", section);
    if (error) throw error;
    if (!data || data.length === 0) {
      return res.status(404).json({ message: "Content not found" });
    }
    res.json(data[0]);
  } catch (error) {
    console.error("GET /api/content/:section error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Create or update content
router.post(
  "/:section",
  authenticateToken,
  requireRoles(["admin", "staff"]),
  async (req, res) => {
    try {
      const { section } = req.params;
      const contentData = { section, ...req.body };
      // Upsert logic: delete existing, then insert new
      await supabase.from("content").delete().eq("section", section);
      const { data, error } = await supabase
        .from("content")
        .insert([contentData]);
      if (error) throw error;
      res.json(data[0]);
    } catch (error) {
      console.error("POST /api/content/:section error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Delete content
router.delete(
  "/:section",
  authenticateToken,
  requireRoles(["admin", "staff"]),
  async (req, res) => {
    try {
      const { section } = req.params;
      const { error } = await supabase
        .from("content")
        .delete()
        .eq("section", section);
      if (error) throw error;
      res.json({ message: "Content deleted successfully" });
    } catch (error) {
      console.error("DELETE /api/content/:section error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

module.exports = router;
