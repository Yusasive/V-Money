const express = require("express");
const { supabase, supabaseAdmin } = require("../config/supabase");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// Get all content
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("content")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Get content error:", error);
      return res.status(500).json({ message: "Failed to fetch content" });
    }

    res.json(data || []);
  } catch (error) {
    console.error("Get content error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get content by section
router.get("/:section", async (req, res) => {
  try {
    const { section } = req.params;

    const { data, error } = await supabaseAdmin
      .from("content")
      .select("*")
      .eq("section", section)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "not found"
      console.error("Get content by section error:", error);
      return res.status(500).json({ message: "Failed to fetch content" });
    }

    res.json(data || null);
  } catch (error) {
    console.error("Get content by section error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Create or update content by section (Admin only)
router.post("/:section", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { section } = req.params;
    const contentData = req.body;

    // Check if content exists for this section
    const { data: existingContent } = await supabaseAdmin
      .from("content")
      .select("id")
      .eq("section", section)
      .single();

    let result;
    if (existingContent) {
      // Update existing content
      const { data, error } = await supabaseAdmin
        .from("content")
        .update({
          ...contentData,
          section,
          updated_at: new Date().toISOString(),
        })
        .eq("section", section)
        .select()
        .single();

      if (error) {
        console.error("Update content error:", error);
        return res.status(500).json({ message: "Failed to update content" });
      }
      result = data;
    } else {
      // Create new content
      const { data, error } = await supabaseAdmin
        .from("content")
        .insert({
          ...contentData,
          section,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error("Create content error:", error);
        return res.status(500).json({ message: "Failed to create content" });
      }
      result = data;
    }

    res.json({
      message: "Content saved successfully",
      data: result,
    });
  } catch (error) {
    console.error("Save content error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete content by section (Admin only)
router.delete(
  "/:section",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { section } = req.params;

      const { error } = await supabaseAdmin
        .from("content")
        .delete()
        .eq("section", section);

      if (error) {
        console.error("Delete content error:", error);
        return res.status(500).json({ message: "Failed to delete content" });
      }

      res.json({ message: "Content deleted successfully" });
    } catch (error) {
      console.error("Delete content error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

module.exports = router;
