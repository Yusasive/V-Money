import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckSquare,
  AlertTriangle,
  TrendingUp,
  Clock,
  User,
  Calendar,
} from "lucide-react";
import DashboardLayout from "../../components/Layout/DashboardLayout";
import PageHeader from "../../components/UI/PageHeader";
import StatsCard from "../../components/UI/StatsCard";
import Button from "../../components/UI/Button";
import Badge from "../../components/UI/Badge";
import { tasksApi, disputesApi, authApi, formsApi } from "../../api/client";
import LoadingSpinner from "../../components/UI/LoadingSpinner";
import toast from "react-hot-toast";

const AggregatorDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    tasksAssigned: 0,
    tasksCompleted: 0,
    tasksInProgress: 0,
    disputesActive: 0,
  });
  const [recentTasks, setRecentTasks] = useState([]);
  const [recentDisputes, setRecentDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingDone, setMarkingDone] = useState(null);
  const [me, setMe] = useState(null);
  const [mySubmission, setMySubmission] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    fetchMe();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch assigned tasks
      const tasksResponse = await tasksApi.assigned();
      const tasks = tasksResponse.data.tasks || [];

      // Fetch disputes
      const disputesResponse = await disputesApi.list({ limit: 5 });
      const disputes = disputesResponse.data.disputes || [];

      // Calculate stats
      const tasksCompleted = tasks.filter(
        (t) => t.status === "completed"
      ).length;
      const tasksInProgress = tasks.filter(
        (t) => t.status === "in_progress"
      ).length;
      const disputesActive = disputes.filter((d) =>
        ["open", "in_review"].includes(d.status)
      ).length;

      setStats({
        tasksAssigned: tasks.length,
        tasksCompleted,
        tasksInProgress,
        disputesActive,
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

  const fetchMe = async () => {
    try {
      const res = await authApi.me();
      setMe(res.data.user || res.data);
      try {
        const subRes = await formsApi.getMine();
        setMySubmission(subRes.data.submission || subRes.data);
      } catch (e) {
        setMySubmission(null);
      }
    } catch (error) {
      console.error("Failed to load user for dashboard", error);
    }
  };

  const handleMarkDone = async (taskId) => {
    try {
      setMarkingDone(taskId);
      await tasksApi.markDone(taskId);
      toast.success("Task marked as done! Waiting for approval.");
      await fetchDashboardData();
    } catch (error) {
      console.error("Failed to mark task as done:", error);
      toast.error("Failed to mark task as done");
    } finally {
      setMarkingDone(null);
    }
  };

  if (loading) {
    return (
      <DashboardLayout userRole="aggregator">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="aggregator">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <PageHeader
          title="Aggregator Dashboard"
          subtitle="Welcome to your aggregator dashboard"
          icon={TrendingUp}
          actions={
            <Button variant="outline" size="sm" onClick={fetchDashboardData}>
              Refresh
            </Button>
          }
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Tasks Assigned"
            value={stats.tasksAssigned}
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
            title="In Progress"
            value={stats.tasksInProgress}
            icon={Clock}
            color="amber"
            delay={0.3}
          />
          <StatsCard
            title="Active Disputes"
            value={stats.disputesActive}
            icon={AlertTriangle}
            color="red"
            delay={0.4}
          />
        </div>

        {/* Recent Activity */}
        {/* Onboarding Status Card */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Onboarding
            </h3>
            {(() => {
              const submission = mySubmission;
              const status = submission?.status; // pending | reviewed | approved | rejected
              const hasSubmission = Boolean(submission);

              const go = (prefill = {}) =>
                navigate("/onboarding", {
                  state: {
                    initialData: {
                      email: me?.email,
                      username: me?.username,
                      ...(prefill || {}),
                    },
                  },
                });

              // No submission at all -> can only start
              if (!hasSubmission) {
                return (
                  <div className="py-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      You haven't submitted onboarding yet.
                    </p>
                    <Button variant="primary" onClick={() => go()}>
                      Start Onboarding
                    </Button>
                  </div>
                );
              }

              // Rejected -> allow resubmit with prefill
              if (status === "rejected") {
                return (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Status:
                      </span>
                      <Badge variant="danger">Rejected</Badge>
                    </div>
                    <p className="text-sm text-red-600 dark:text-red-400">
                      Your onboarding was rejected. Please correct and resubmit.
                    </p>
                    <Button
                      variant="primary"
                      onClick={() =>
                        go(
                          Object.fromEntries(
                            Object.entries(submission.data || {}).filter(
                              ([, v]) => typeof v === "string"
                            )
                          )
                        )
                      }
                    >
                      Resubmit Onboarding
                    </Button>
                  </div>
                );
              }

              // Pending / Reviewed / Approved -> show status only; no editing from here
              const badgeVariant =
                status === "approved"
                  ? "success"
                  : status === "pending"
                    ? "warning"
                    : status === "reviewed"
                      ? "default"
                      : "default";

              const statusTextMap = {
                pending: "Pending review. You'll be notified soon.",
                reviewed: "Reviewed. Awaiting final approval.",
                approved: "Approved. Access granted.",
              };

              return (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Status:
                    </span>
                    <Badge variant={badgeVariant}>{status}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {statusTextMap[status] || "Status updated."}
                  </p>
                  {submission?.files?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">
                        Uploaded documents
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {submission.files.map((f, i) => (
                          <a
                            key={i}
                            href={f.cloudinaryUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <img
                              src={f.cloudinaryUrl}
                              alt={f.originalName}
                              className="h-24 w-24 object-cover rounded-md"
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </motion.div>
          {/* keep the Recent Tasks and Recent Disputes columns after this */}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Tasks */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Tasks
              </h3>
            </div>
            <div className="p-6">
              {recentTasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No tasks assigned yet
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
                          Assigned by:{" "}
                          {task.createdBy?.fullName ||
                            task.createdBy?.username ||
                            "Unknown"}
                        </p>
                        {task.dueDate && (
                          <p className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-1 mt-1">
                            <Calendar className="h-3 w-3" />
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            task.status === "completed"
                              ? "success"
                              : task.status === "done"
                                ? "warning"
                                : task.status === "rejected"
                                  ? "danger"
                                  : task.status === "in_progress"
                                    ? "primary"
                                    : "pending"
                          }
                        >
                          {task.status === "done"
                            ? "Awaiting Approval"
                            : task.status}
                        </Badge>
                        {task.status === "pending" && (
                          <Button
                            variant="success"
                            size="sm"
                            loading={markingDone === task._id}
                            onClick={() => handleMarkDone(task._id)}
                          >
                            Mark Done
                          </Button>
                        )}
                      </div>
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Disputes
              </h3>
            </div>
            <div className="p-6">
              {recentDisputes.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No disputes to review
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
                          {dispute.description}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-1 mt-2">
                          <User className="h-3 w-3" />
                          Raised by:{" "}
                          {dispute.createdBy?.fullName ||
                            dispute.createdBy?.username ||
                            "Unknown"}
                        </p>
                      </div>
                      <Badge
                        variant={
                          dispute.status === "resolved"
                            ? "success"
                            : dispute.status === "in_review"
                              ? "warning"
                              : "danger"
                        }
                      >
                        {dispute.status === "in_review"
                          ? "In Review"
                          : dispute.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AggregatorDashboard;
