const express = require("express");
const { supabaseAdmin } = require("../config/supabase");
const {
  authenticateToken,
  requireRoles,
  getUserRole,
} = require("../middleware/auth");

const router = express.Router();

// Create task (Staff/Admin)
router.post(
  "/",
  authenticateToken,
  requireRoles(["staff", "admin"]),
  async (req, res) => {
    try {
      const { title, description, assigned_to, due_date } = req.body;

      if (!title || !assigned_to) {
        return res
          .status(400)
          .json({ message: "title and assigned_to are required" });
      }

      // Validate assignee role (Only Staff and Aggregators)
      const { data: assignee, error: assigneeErr } = await supabaseAdmin
        .from("profiles")
        .select("id, role")
        .eq("id", assigned_to)
        .single();

      if (assigneeErr || !assignee) {
        return res.status(400).json({ message: "Assigned user not found" });
      }

      if (!["staff", "aggregator"].includes(assignee.role)) {
        return res
          .status(400)
          .json({
            message: "Tasks can only be assigned to Staff or Aggregators",
          });
      }

      const { data, error } = await supabaseAdmin
        .from("tasks")
        .insert({
          title,
          description: description || null,
          assigned_to,
          due_date: due_date ? new Date(due_date).toISOString() : null,
          created_by: req.user.id,
          status: "pending",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error("Create task error:", error);
        return res.status(500).json({ message: "Failed to create task" });
      }

      res.status(201).json({ message: "Task created", task: data });
    } catch (error) {
      console.error("Create task error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// List tasks (Staff/Admin) with optional filters
router.get(
  "/",
  authenticateToken,
  requireRoles(["staff", "admin"]),
  async (req, res) => {
    try {
      const { assigned_to, status, page = 1, limit = 20 } = req.query;
      let query = supabaseAdmin
        .from("tasks")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });
      if (assigned_to) query = query.eq("assigned_to", assigned_to);
      if (status) query = query.eq("status", status);
      const offset = (parseInt(page) - 1) * parseInt(limit);
      query = query.range(offset, offset + parseInt(limit) - 1);

      const { data, error, count } = await query;
      if (error) {
        console.error("List tasks error:", error);
        return res.status(500).json({ message: "Failed to fetch tasks" });
      }

      res.json({
        tasks: data || [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil((count || 0) / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error("List tasks error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// Get tasks assigned to current user
router.get("/assigned", authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("tasks")
      .select("*")
      .eq("assigned_to", req.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Assigned tasks error:", error);
      return res.status(500).json({ message: "Failed to fetch tasks" });
    }

    res.json({ tasks: data || [] });
  } catch (error) {
    console.error("Assigned tasks error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Mark task as done (assignee or Staff/Admin)
router.patch("/:id/done", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch task
    const { data: task, error: fetchErr } = await supabaseAdmin
      .from("tasks")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchErr || !task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const role = getUserRole(req.user);
    const canUpdate =
      task.assigned_to === req.user.id || ["staff", "admin"].includes(role);
    if (!canUpdate) {
      return res
        .status(403)
        .json({ message: "Not allowed to update this task" });
    }

    const { data, error } = await supabaseAdmin
      .from("tasks")
      .update({
        status: "done",
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Update task error:", error);
      return res.status(500).json({ message: "Failed to update task" });
    }

    res.json({ message: "Task marked as done", task: data });
  } catch (error) {
    console.error("Update task error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
