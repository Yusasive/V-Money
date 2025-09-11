import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckSquare, Clock, User, Calendar, CheckCircle } from "lucide-react";
import DashboardLayout from "../../components/Layout/DashboardLayout";
import PageHeader from "../../components/UI/PageHeader";
import Button from "../../components/UI/Button";
import Badge from "../../components/UI/Badge";
import Modal from "../../components/UI/Modal";
import { tasksApi } from "../../api/client";
import LoadingSpinner from "../../components/UI/LoadingSpinner";
import toast from "react-hot-toast";

const AggregatorTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [markingDone, setMarkingDone] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await tasksApi.assigned();
      setTasks(response.data.tasks || []);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkDone = async (taskId) => {
    try {
      setMarkingDone(taskId);
      await tasksApi.markDone(taskId);
      toast.success("Task marked as done! Waiting for approval.");
      await fetchTasks();
    } catch (error) {
      console.error("Failed to mark task as done:", error);
      toast.error("Failed to mark task as done");
    } finally {
      setMarkingDone(null);
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
      completed: { variant: "success", label: "Completed" },
      rejected: { variant: "danger", label: "Rejected" },
    };

    const config = statusMap[status] || { variant: "default", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <DashboardLayout userRole="aggregator">
        <LoadingSpinner size="lg" text="Loading tasks..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="aggregator">
      <div className="space-y-8">
        <PageHeader
          title="My Tasks"
          subtitle="View and manage your assigned tasks"
          icon={CheckSquare}
          actions={
            <Button onClick={fetchTasks} variant="outline" size="sm">
              Refresh
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
                    ? "You have no assigned tasks yet."
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

                        {/* Show rejection reason inline in the list for quick visibility */}
                        {task.status === "rejected" && task.notes && (
                          <div className="mb-3">
                            <div className="inline-block px-3 py-1 rounded bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm">
                              Rejection reason: {task.notes}
                            </div>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            Assigned by:{" "}
                            {task.createdBy?.fullName ||
                              task.createdBy?.username ||
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

                        {task.status === "pending" && (
                          <Button
                            variant="success"
                            size="sm"
                            loading={markingDone === task._id}
                            onClick={() => handleMarkDone(task._id)}
                            icon={CheckCircle}
                          >
                            Mark Done
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

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
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {selectedTask.title}
                </h4>
                {getStatusBadge(selectedTask.status)}
              </div>

              {selectedTask.description && (
                <div>
                  <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                    Description
                  </h5>
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedTask.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h5 className="font-medium text-gray-900 dark:text-white mb-1">
                    Assigned By
                  </h5>
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedTask.createdBy?.fullName ||
                      selectedTask.createdBy?.username ||
                      "Unknown"}
                  </p>
                </div>

                <div>
                  <h5 className="font-medium text-gray-900 dark:text-white mb-1">
                    Created
                  </h5>
                  <p className="text-gray-600 dark:text-gray-400">
                    {new Date(selectedTask.createdAt).toLocaleString()}
                  </p>
                </div>

                {selectedTask.dueDate && (
                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-white mb-1">
                      Due Date
                    </h5>
                    <p className="text-gray-600 dark:text-gray-400">
                      {new Date(selectedTask.dueDate).toLocaleString()}
                    </p>
                  </div>
                )}

                {selectedTask.completedAt && (
                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-white mb-1">
                      Completed
                    </h5>
                    <p className="text-gray-600 dark:text-gray-400">
                      {new Date(selectedTask.completedAt).toLocaleString()}
                    </p>
                  </div>
                )}
                {selectedTask.approvedBy && (
                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-white mb-1">
                      Approved By
                    </h5>
                    <p className="text-gray-600 dark:text-gray-400">
                      {selectedTask.approvedBy.fullName ||
                        selectedTask.approvedBy.username}
                    </p>
                  </div>
                )}
                {selectedTask.rejectedBy && (
                  <div>
                    <h5 className="font-medium text-red-700 dark:text-red-300 mb-1">
                      Rejected By
                    </h5>
                    <p className="text-red-700 dark:text-red-300">
                      {selectedTask.rejectedBy.fullName ||
                        selectedTask.rejectedBy.username}
                    </p>
                  </div>
                )}
              </div>

              {/* If task was rejected, show rejection reason prominently */}
              {selectedTask.status === "rejected" && selectedTask.notes && (
                <div>
                  <h5 className="font-medium text-red-700 dark:text-red-300 mb-2">
                    Rejection reason
                  </h5>
                  <div className="p-3 rounded bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300">
                    {selectedTask.notes}
                  </div>
                </div>
              )}

              {selectedTask.notes && selectedTask.status !== "rejected" && (
                <div>
                  <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                    Notes
                  </h5>
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedTask.notes}
                  </p>
                </div>
              )}

              {/* Activity / History */}
              {selectedTask.history && selectedTask.history.length > 0 && (
                <div>
                  <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                    Activity
                  </h5>
                  <div className="space-y-3">
                    {selectedTask.history
                      .slice()
                      .reverse()
                      .map((h, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <div className="text-xs text-gray-500 dark:text-gray-400 w-36">
                            {new Date(h.at).toLocaleString()}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm">
                              <strong className="capitalize">
                                {h.type.replace("_", " ")}
                              </strong>
                              {h.actor && (
                                <span className="ml-2 text-gray-600 dark:text-gray-300">
                                  by {h.actor.fullName || h.actor.username}
                                </span>
                              )}
                            </div>
                            {h.note && (
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {h.note}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setSelectedTask(null)}>
                  Close
                </Button>

                {selectedTask.status === "pending" && (
                  <Button
                    variant="success"
                    loading={markingDone === selectedTask._id}
                    onClick={() => {
                      handleMarkDone(selectedTask._id);
                      setSelectedTask(null);
                    }}
                    icon={CheckCircle}
                  >
                    Mark Done
                  </Button>
                )}
              </div>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default AggregatorTasks;
