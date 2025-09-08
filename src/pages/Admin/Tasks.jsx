import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  User,
  Calendar,
  CheckCircle,
  Loader,
} from "react-icons/fi";
import PageHeader from "../../components/UI/PageHeader";
import Button from "../../components/UI/Button";
import { tasksApi, usersApi } from "../../api/client";

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [assignees, setAssignees] = useState([]);
  const [form, setForm] = useState({
    title: "",
    assigned_to: "",
    due_date: "",
  });

  const load = async () => {
    setLoading(true);
    try {
      const [{ data: tasksRes }, { data: usersRes }] = await Promise.all([
        tasksApi.list(),
        usersApi.list({ limit: 100, role: "", status: "approved" }),
      ]);
      setTasks(tasksRes.tasks || []);
      const candidates = (usersRes.users || []).filter((u) =>
        ["staff", "aggregator"].includes(u.role)
      );
      setAssignees(candidates);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await tasksApi.create(form);
      setForm({ title: "", assigned_to: "", due_date: "" });
      await load();
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to create task");
    } finally {
      setSubmitting(false);
    }
  };

  const markDone = async (id) => {
    try {
      await tasksApi.markDone(id);
      await load();
    } catch (e) {
      alert("Failed to mark done");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks"
        subtitle="Create, assign and track tasks for your team"
        icon={CheckCircle}
        actions={
          <Button variant="outline" size="sm" onClick={load}>
            Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Task */}
        <div className="lg:col-span-1">
          <div className="relative overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow border border-gray-100 dark:border-gray-700">
            <div className="absolute -top-6 -right-6 h-20 w-20 lg:h-32 lg:w-32 lg:-top-10 lg:-right-10 bg-primary/20 rounded-full" />
            <div className="p-6 space-y-4 relative">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-md bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <Plus className="h-4 w-4" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Create Task
                </h3>
              </div>
              <form onSubmit={submit} className="space-y-3">
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-300">
                    Title
                  </label>
                  <input
                    className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-300">
                    Assign To
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <select
                      className="w-full pl-9 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                      value={form.assigned_to}
                      onChange={(e) =>
                        setForm({ ...form, assigned_to: e.target.value })
                      }
                      required
                    >
                      <option value="">Select user</option>
                      {assignees.map((u) => (
                        <option key={u._id} value={u._id}>
                          {u.fullName || u.username} ({u.email}) - {u.role}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-300">
                    Due Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="date"
                      className="w-full pl-9 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                      value={form.due_date}
                      onChange={(e) =>
                        setForm({ ...form, due_date: e.target.value })
                      }
                    />
                  </div>
                </div>
                <button
                  disabled={submitting}
                  className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded shadow hover:shadow-md transition disabled:opacity-50"
                >
                  {submitting && <Loader className="animate-spin h-4 w-4" />} Create
                  Task
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Task List */}
        <div className="lg:col-span-2">
          <div className="rounded-xl bg-white dark:bg-gray-800 shadow border border-gray-100 dark:border-gray-700">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Task List
                </h3>
                <button
                  onClick={load}
                  className="text-sm text-primary hover:underline"
                >
                  Refresh
                </button>
              </div>

              {loading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="h-16 rounded-md bg-gray-100 dark:bg-gray-700 animate-pulse"
                    />
                  ))}
                </div>
              ) : tasks.length === 0 ? (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                  No tasks yet. Create your first task.
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.map((t) => {
                    const id = t._id || t.id;
                    const assignedName =
                      t.assignedTo?.fullName ||
                      t.assignedTo?.username ||
                      t.assigned_to ||
                      "-";
                    const due = t.dueDate || t.due_date;
                    return (
                      <div
                        key={id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {t.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              Assigned to: {assignedName}{" "}
                              {due && (
                                <span className="ml-2">
                                  • Due: {new Date(due).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                t.status === "completed"
                                  ? "bg-green-100 text-green-700"
                                  : t.status === "rejected"
                                    ? "bg-red-100 text-red-700"
                                    : t.status === "done"
                                      ? "bg-blue-100 text-blue-700"
                                      : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {t.status}
                            </span>
                            {t.status !== "done" && t.status !== "completed" && (
                              <button
                                onClick={() => markDone(id)}
                                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
                              >
                                Mark Done
                              </button>
                            )}
                            {t.status === "done" && (
                              <div className="flex gap-1">
                                <button
                                  onClick={async () => {
                                    try {
                                      await tasksApi.approve(id);
                                      await load();
                                    } catch (e) {
                                      alert(
                                        e?.response?.data?.message ||
                                          "Failed to approve"
                                      );
                                    }
                                  }}
                                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={async () => {
                                    try {
                                      const reason =
                                        window.prompt(
                                          "Reason for rejection (optional):"
                                        ) || "";
                                      await tasksApi.reject(id, reason);
                                      await load();
                                    } catch (e) {
                                      alert(
                                        e?.response?.data?.message ||
                                          "Failed to reject"
                                      );
                                    }
                                  }}
                                  className="px-3 py-1 bg-amber-600 text-white rounded hover:bg-amber-700 text-xs"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                            <button
                              onClick={async () => {
                                if (!window.confirm("Delete this task?")) return;
                                try {
                                  await tasksApi.delete(id);
                                  await load();
                                } catch (e) {
                                  alert(
                                    e?.response?.data?.message ||
                                      "Failed to delete task"
                                  );
                                }
                              }}
                              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tasks;
                            {t.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            Assigned to: {assignedName}{" "}
                            {due && (
                              <span className="ml-2">
                                • Due: {new Date(due).toLocaleDateString()}
                              </span>
                            )}{" "}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              t.status === "completed"
                                ? "bg-green-100 text-green-700"
                                : t.status === "rejected"
                                  ? "bg-red-100 text-red-700"
                                  : t.status === "done"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {t.status}
                          </span>
                          {t.status !== "done" && t.status !== "completed" && (
                            <button
                              onClick={() => markDone(id)}
                              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              Mark Done
                            </button>
                          )}
                          {t.status === "done" && (
                            <>
                              <button
                                onClick={async () => {
                                  try {
                                    await tasksApi.approve(id);
                                    await load();
                                  } catch (e) {
                                    alert(
                                      e?.response?.data?.message ||
                                        "Failed to approve"
                                    );
                                  }
                                }}
                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                              >
                                Approve
                              </button>
                              <button
                                onClick={async () => {
                                  try {
                                    const reason =
                                      window.prompt(
                                        "Reason for rejection (optional):"
                                      ) || "";
                                    await tasksApi.reject(id, reason);
                                    await load();
                                  } catch (e) {
                                    alert(
                                      e?.response?.data?.message ||
                                        "Failed to reject"
                                    );
                                  }
                                }}
                                className="px-3 py-1 bg-amber-600 text-white rounded hover:bg-amber-700"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          <button
                            onClick={async () => {
                              if (!window.confirm("Delete this task?")) return;
                              try {
                                await tasksApi.delete(id);
                                await load();
                              } catch (e) {
                                alert(
                                  e?.response?.data?.message ||
                                    "Failed to delete task"
                                );
                              }
                            }}
                            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Tasks;
