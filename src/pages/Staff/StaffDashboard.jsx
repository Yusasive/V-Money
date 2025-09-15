import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CheckSquare,
  AlertTriangle,
  Store,
  TrendingUp,
  Plus,
} from "lucide-react";
import DashboardLayout from "../../components/Layout/DashboardLayout";
import PageHeader from "../../components/UI/PageHeader";
import StatsCard from "../../components/UI/StatsCard";
import Button from "../../components/UI/Button";
import Modal from "../../components/UI/Modal";
import {
  analyticsApi,
  tasksApi,
  disputesApi,
  usersApi,
} from "../../api/client";
import LoadingSpinner from "../../components/UI/LoadingSpinner";
import toast from "react-hot-toast";

const StaffDashboard = () => {
  const [stats, setStats] = useState({
    tasksCreated: 0,
    tasksCompleted: 0,
    disputesRaised: 0,
    merchantsManaged: 0,
  });
  const [recentTasks, setRecentTasks] = useState([]);
  const [recentDisputes, setRecentDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [users, setUsers] = useState([]);

  // Task form
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    assigned_to: "",
    due_date: "",
    priority: "medium",
  });

  // Dispute form
  const [disputeForm, setDisputeForm] = useState({
    title: "",
    description: "",
    raised_against: "",
    priority: "medium",
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    fetchUsers();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch overview stats
      const overviewResponse = await analyticsApi.overview();
      const overviewStats = overviewResponse.data;

      // Fetch tasks created by current user
      const tasksResponse = await tasksApi.list({ limit: 10 });
      const tasks = tasksResponse.data.tasks || [];

      // Fetch disputes
      const disputesResponse = await disputesApi.list({ limit: 5 });
      const disputes = disputesResponse.data.disputes || [];

      setStats({
        tasksCreated: tasks.length,
        tasksCompleted: tasks.filter((t) => t.status === "completed").length,
        disputesRaised: disputes.length,
        merchantsManaged: overviewStats.merchants?.total || 0,
      });

      setRecentTasks(tasks.slice(0, 5));
      setRecentDisputes(disputes.slice(0, 3));
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await usersApi.list({
        status: "approved",
        limit: 100,
      });
      const allUsers = response.data.users || [];
      // Filter for aggregators and staff for task assignment
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
      setShowTaskModal(false);
      setTaskForm({
        title: "",
        description: "",
        assigned_to: "",
        due_date: "",
        priority: "medium",
      });
      await fetchDashboardData();
    } catch (error) {
      console.error("Failed to create task:", error);
      toast.error("Failed to create task");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateDispute = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await disputesApi.create(disputeForm);
      toast.success("Dispute created successfully");
      setShowDisputeModal(false);
      setDisputeForm({
        title: "",
        description: "",
        raised_against: "",
        priority: "medium",
      });
      await fetchDashboardData();
    } catch (error) {
      console.error("Failed to create dispute:", error);
      toast.error("Failed to create dispute");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout userRole="staff">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="staff">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <PageHeader
          title="Staff Dashboard"
          subtitle="Manage tasks, disputes, and merchants"
          icon={TrendingUp}
          actions={
            <div className="flex gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowTaskModal(true)}
                icon={Plus}
              >
                Create Task
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDisputeModal(true)}
                icon={AlertTriangle}
              >
                Raise Dispute
              </Button>
            </div>
          }
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Tasks Created"
            value={stats.tasksCreated}
            icon={CheckSquare}
            color="blue"
            delay={0.1}
          />
          <StatsCard
            title="Tasks Completed"
            value={stats.tasksCompleted}
            icon={CheckSquare}
            color="green"
            delay={0.2}
          />
          <StatsCard
            title="Disputes Raised"
            value={stats.disputesRaised}
            icon={AlertTriangle}
            color="amber"
            delay={0.3}
          />
          <StatsCard
            title="Merchants Managed"
            value={stats.merchantsManaged}
            icon={Store}
            color="purple"
            delay={0.4}
          />
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Tasks */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Recent Tasks
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTaskModal(true)}
                  icon={Plus}
                >
                  Create
                </Button>
              </div>
            </div>
            <div className="p-6">
              {recentTasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No tasks created yet
                </div>
              ) : (
                <div className="space-y-4">
                  {recentTasks.map((task) => (
                    <div
                      key={task._id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {task.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Assigned to:{" "}
                          {task.assignedTo?.fullName ||
                            task.assignedTo?.username ||
                            "Unknown"}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          task.status === "completed"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                            : task.status === "done"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                              : task.status === "rejected"
                                ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {task.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Recent Disputes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Recent Disputes
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDisputeModal(true)}
                  icon={AlertTriangle}
                >
                  Raise
                </Button>
              </div>
            </div>
            <div className="p-6">
              {recentDisputes.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No disputes raised yet
                </div>
              ) : (
                <div className="space-y-4">
                  {recentDisputes.map((dispute) => (
                    <div
                      key={dispute._id}
                      className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {dispute.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Against:{" "}
                          {dispute.raisedAgainst?.fullName ||
                            dispute.raisedAgainst?.username ||
                            "Unknown"}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          dispute.status === "resolved"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                            : dispute.status === "in_review"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                              : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                        }`}
                      >
                        {dispute.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Create Task Modal */}
        <Modal
          isOpen={showTaskModal}
          onClose={() => setShowTaskModal(false)}
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
                onClick={() => setShowTaskModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit" loading={submitting} icon={Plus}>
                Create Task
              </Button>
            </div>
          </form>
        </Modal>

        {/* Create Dispute Modal */}
        <Modal
          isOpen={showDisputeModal}
          onClose={() => setShowDisputeModal(false)}
          title="Raise New Dispute"
          size="lg"
        >
          <form onSubmit={handleCreateDispute} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Dispute Title *
              </label>
              <input
                type="text"
                value={disputeForm.title}
                onChange={(e) =>
                  setDisputeForm({ ...disputeForm, title: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter dispute title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description *
              </label>
              <textarea
                value={disputeForm.description}
                onChange={(e) =>
                  setDisputeForm({
                    ...disputeForm,
                    description: e.target.value,
                  })
                }
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Describe the dispute in detail"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Raise Against *
                </label>
                <select
                  value={disputeForm.raised_against}
                  onChange={(e) =>
                    setDisputeForm({
                      ...disputeForm,
                      raised_against: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                >
                  <option value="">Select user</option>
                  {users
                    .filter((u) => u.role === "aggregator")
                    .map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.fullName} ({user.username})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Priority
                </label>
                <select
                  value={disputeForm.priority}
                  onChange={(e) =>
                    setDisputeForm({ ...disputeForm, priority: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDisputeModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={submitting}
                variant="danger"
                icon={AlertTriangle}
              >
                Raise Dispute
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default StaffDashboard;
