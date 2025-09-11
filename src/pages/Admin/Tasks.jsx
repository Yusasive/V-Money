import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CheckSquare,
  Plus,
  User,
  Calendar,
  Clock,
  CheckCircle,
  X,
} from "lucide-react";

import PageHeader from "../../components/UI/PageHeader";
import Button from "../../components/UI/Button";
import Badge from "../../components/UI/Badge";
import Modal from "../../components/UI/Modal";
import { tasksApi, usersApi } from "../../api/client";
import LoadingSpinner from "../../components/UI/LoadingSpinner";
import toast from "react-hot-toast";

const AdminTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState("all");
  const [submitting, setSubmitting] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    assigned_to: "",
    due_date: "",
    priority: "medium",
  });

  useEffect(() => {
    fetchTasks();
    fetchUsers();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await tasksApi.list();
      setTasks(response.data.tasks || []);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await usersApi.list({ status: "approved", limit: 100 });
      const allUsers = response.data.users || [];
      const eligibleUsers = allUsers.filter((u) =>
        ["aggregator", "staff"].includes(u.role)
      );
      setUsers(eligibleUsers);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await tasksApi.create(taskForm);
      toast.success("Task created successfully");
      setShowCreateModal(false);
      setTaskForm({
        title: "",
        description: "",
        assigned_to: "",
        due_date: "",
        priority: "medium",
      });
      await fetchTasks();
    } catch (error) {
      console.error("Failed to create task:", error);
      toast.error("Failed to create task");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (task) => {
    setEditingTask({
      ...task,
      assigned_to: task.assignedTo?._id || "",
      due_date: task.dueDate
        ? new Date(task.dueDate).toISOString().split("T")[0]
        : "",
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsUpdating(true);
      await tasksApi.update(editingTask._id, {
        title: editingTask.title,
        description: editingTask.description,
        assigned_to: editingTask.assigned_to,
        due_date: editingTask.due_date,
        priority: editingTask.priority,
      });
      toast.success("Task updated successfully");
      setIsEditModalOpen(false);
      setEditingTask(null);
      await fetchTasks();
    } catch (error) {
      console.error("Failed to update task:", error);
      toast.error("Failed to update task");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteClick = (task) => {
    setTaskToDelete(task);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setIsUpdating(true);
      await tasksApi.delete(taskToDelete._id);
      toast.success("Task deleted successfully");
      setIsDeleteModalOpen(false);
      setTaskToDelete(null);
      await fetchTasks();
    } catch (error) {
      console.error("Failed to delete task:", error);
      toast.error("Failed to delete task");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleApproveTask = async (taskId) => {
    try {
      await tasksApi.approve(taskId);
      toast.success("Task approved successfully");
      await fetchTasks();
    } catch (error) {
      console.error("Failed to approve task:", error);
      toast.error("Failed to approve task");
    }
  };

  const handleRejectTask = async (taskId) => {
    // open reason modal
    setPendingReject({ id: taskId });
  };

  const [pendingReject, setPendingReject] = React.useState(null);
  const [rejectReason, setRejectReason] = React.useState("");

  const submitReject = async () => {
    if (!pendingReject) return;
    try {
      await tasksApi.reject(pendingReject.id, rejectReason || "");
      toast.success("Task rejected");
      await fetchTasks();
    } catch (error) {
      console.error("Failed to reject task:", error);
      toast.error("Failed to reject task");
    } finally {
      setPendingReject(null);
      setRejectReason("");
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === "all") return true;
    return task.status === filter;
  });

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { variant: "pending", label: "Pending" },
      in_progress: { variant: "primary", label: "In Progress" },
      done: { variant: "warning", label: "Done (Awaiting Approval)" },
      completed: { variant: "success", label: "Completed" },
      rejected: { variant: "danger", label: "Rejected" },
    };
    const config = statusMap[status] || { variant: "default", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading tasks..." />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Task Management"
        subtitle="Create, assign, and track tasks for your team"
        icon={CheckSquare}
        actions={
          <Button
            variant="primary"
            onClick={() => setShowCreateModal(true)}
            icon={Plus}
          >
            Create Task
          </Button>
        }
      />

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-wrap gap-2">
          {[
            { key: "all", label: "All Tasks" },
            { key: "pending", label: "Pending" },
            { key: "in_progress", label: "In Progress" },
            { key: "done", label: "Awaiting Approval" },
            { key: "completed", label: "Completed" },
            { key: "rejected", label: "Rejected" },
          ].map((filterOption) => (
            <button
              key={filterOption.key}
              onClick={() => setFilter(filterOption.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === filterOption.key
                  ? "bg-primary text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              {filterOption.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tasks List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Tasks ({filteredTasks.length})
          </h3>
        </div>

        <div className="p-6">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No tasks found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {filter === "all"
                  ? "Create your first task to get started."
                  : `No tasks with status "${filter}".`}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTasks.map((task, index) => (
                <motion.div
                  key={task._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {task.title}
                        </h4>
                        {getStatusBadge(task.status)}
                      </div>

                      {task.description && (
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          {task.description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          Assigned to:{" "}
                          {task.assignedTo?.fullName ||
                            task.assignedTo?.username ||
                            "Unknown"}
                        </div>

                        {task.dueDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </div>
                        )}

                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Created:{" "}
                          {new Date(task.createdAt).toLocaleDateString()}
                        </div>

                        <div className="flex items-center gap-1">
                          Priority:{" "}
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              task.priority === "high"
                                ? "bg-red-100 text-red-800"
                                : task.priority === "medium"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-green-100 text-green-800"
                            }`}
                          >
                            {task.priority}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedTask(task)}
                      >
                        View Details
                      </Button>

                      {task.status === "done" ? (
                        <>
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleApproveTask(task._id)}
                            icon={CheckCircle}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleRejectTask(task._id)}
                            icon={X}
                          >
                            Reject
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="warning"
                            size="sm"
                            onClick={() => handleEditClick(task)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteClick(task)}
                          >
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Task Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Task"
        size="lg"
      >
        <form onSubmit={handleCreateTask} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Task Title *
            </label>
            <input
              type="text"
              value={taskForm.title}
              onChange={(e) =>
                setTaskForm({ ...taskForm, title: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Enter task title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={taskForm.description}
              onChange={(e) =>
                setTaskForm({ ...taskForm, description: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Enter task description"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Assign To *
              </label>
              <select
                value={taskForm.assigned_to}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, assigned_to: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              >
                <option value="">Select user</option>
                {users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.fullName} ({user.username}) - {user.role}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority
              </label>
              <select
                value={taskForm.priority}
                onChange={(e) =>
                  setTaskForm({ ...taskForm, priority: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Due Date
            </label>
            <input
              type="date"
              value={taskForm.due_date}
              onChange={(e) =>
                setTaskForm({ ...taskForm, due_date: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting} icon={Plus}>
              Create Task
            </Button>
          </div>
        </form>
      </Modal>
      <Modal
        isOpen={!!pendingReject}
        onClose={() => {
          setPendingReject(null);
          setRejectReason("");
        }}
        title="Reject Task"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Enter rejection reason (optional):
          </p>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Optional reason"
            className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-200"
          />
          <div className="flex justify-end gap-2">
            <button
              className="px-3 py-2 rounded-md border"
              onClick={() => {
                setPendingReject(null);
                setRejectReason("");
              }}
            >
              Cancel
            </button>
            <button
              className="px-3 py-2 rounded-md bg-primary text-white"
              onClick={submitReject}
            >
              Submit
            </button>
          </div>
        </div>
      </Modal>

      {/* Task Detail Modal */}
      <Modal
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        title="Task Details"
        size="lg"
      >
        {selectedTask && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedTask.title}
                </h4>
                {getStatusBadge(selectedTask.status)}
              </div>

              {selectedTask.description && (
                <p className="text-gray-600 dark:text-gray-400">
                  {selectedTask.description}
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Task Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingTask(null);
        }}
        title="Edit Task"
        size="lg"
      >
        {editingTask && (
          <form onSubmit={handleEditSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Task Title *
              </label>
              <input
                type="text"
                value={editingTask.title}
                onChange={(e) =>
                  setEditingTask({ ...editingTask, title: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter task title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={editingTask.description || ""}
                onChange={(e) =>
                  setEditingTask({
                    ...editingTask,
                    description: e.target.value,
                  })
                }
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter task description"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Assign To *
                </label>
                <select
                  value={editingTask.assigned_to}
                  onChange={(e) =>
                    setEditingTask({
                      ...editingTask,
                      assigned_to: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                >
                  <option value="">Select user</option>
                  {users.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.fullName} ({user.username}) - {user.role}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Priority
                </label>
                <select
                  value={editingTask.priority}
                  onChange={(e) =>
                    setEditingTask({
                      ...editingTask,
                      priority: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Due Date
              </label>
              <input
                type="date"
                value={editingTask.due_date || ""}
                onChange={(e) =>
                  setEditingTask({
                    ...editingTask,
                    due_date: e.target.value,
                  })
                }
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingTask(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" loading={isUpdating}>
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Task Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setTaskToDelete(null);
        }}
        title="Delete Task"
      >
        {taskToDelete && (
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Are you sure you want to delete this task? This action cannot be
              undone.
            </p>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                {taskToDelete.title}
              </h4>
              {taskToDelete.description && (
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {taskToDelete.description}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setTaskToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                loading={isUpdating}
                onClick={handleDeleteConfirm}
              >
                Delete Task
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminTasks;
