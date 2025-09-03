import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, MessageSquare, Clock } from "lucide-react";
import DashboardLayout from "../../components/Layout/DashboardLayout";
import PageHeader from "../../components/UI/PageHeader";
import Button from "../../components/UI/Button";
import Badge from "../../components/UI/Badge";
import Modal from "../../components/UI/Modal";
import { disputesApi } from "../../api/client";
import LoadingSpinner from "../../components/UI/LoadingSpinner";
import toast from "react-hot-toast";

const AggregatorDisputes = () => {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [responseText, setResponseText] = useState("");
  const [submittingResponse, setSubmittingResponse] = useState(false);

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const response = await disputesApi.list();
      setDisputes(response.data.disputes || []);
    } catch (error) {
      console.error("Failed to fetch disputes:", error);
      toast.error("Failed to load disputes");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitResponse = async (e) => {
    e.preventDefault();
    if (!responseText.trim()) return;

    try {
      setSubmittingResponse(true);
      await disputesApi.respond(selectedDispute.id, responseText);
      toast.success("Response submitted successfully");
      setResponseText("");
      setSelectedDispute(null);
      await fetchDisputes();
    } catch (error) {
      console.error("Failed to submit response:", error);
      toast.error("Failed to submit response");
    } finally {
      setSubmittingResponse(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      open: { variant: "danger", label: "Open" },
      in_review: { variant: "warning", label: "In Review" },
      resolved: { variant: "success", label: "Resolved" },
    };

    const config = statusMap[status] || { variant: "default", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <DashboardLayout userRole="aggregator">
        <LoadingSpinner size="lg" text="Loading disputes..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="aggregator">
      <div className="space-y-8">
        <PageHeader
          title="Disputes"
          subtitle="View and respond to disputes raised by staff or admin"
          icon={AlertTriangle}
          actions={
            <Button onClick={fetchDisputes} variant="outline" size="sm">
              Refresh
            </Button>
          }
        />

        {/* Disputes List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              All Disputes ({disputes.length})
            </h3>
          </div>

          <div className="p-6">
            {disputes.length === 0 ? (
              <div className="text-center py-12">
                <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No disputes
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  You have no disputes to review at this time.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {disputes.map((dispute, index) => (
                  <motion.div
                    key={dispute.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {dispute.title || "Dispute"}
                          </h4>
                          {getStatusBadge(dispute.status)}
                        </div>

                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          {dispute.description}
                        </p>

                        <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            {/* Fix: User is not defined. Remove or import if needed. */}
                            Raised by: {dispute.created_by_name || "Unknown"}
                          </div>

                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Created:{" "}
                            {new Date(dispute.created_at).toLocaleDateString()}
                          </div>

                          {dispute.responses?.length > 0 && (
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-4 w-4" />
                              {dispute.responses.length} response(s)
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedDispute(dispute)}
                        >
                          View Details
                        </Button>

                        {dispute.status === "open" && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              setSelectedDispute(dispute);
                              setResponseText("");
                            }}
                            icon={MessageSquare}
                          >
                            Respond
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

        {/* Dispute Detail Modal */}
        <Modal
          isOpen={!!selectedDispute}
          onClose={() => {
            setSelectedDispute(null);
            setResponseText("");
          }}
          title="Dispute Details"
          size="lg"
        >
          {selectedDispute && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedDispute.title || "Dispute"}
                  </h4>
                  {getStatusBadge(selectedDispute.status)}
                </div>

                <p className="text-gray-600 dark:text-gray-400">
                  {selectedDispute.description}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h5 className="font-medium text-gray-900 dark:text-white mb-1">
                    Raised By
                  </h5>
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedDispute.created_by_name || "Unknown"}
                  </p>
                </div>

                <div>
                  <h5 className="font-medium text-gray-900 dark:text-white mb-1">
                    Created
                  </h5>
                  <p className="text-gray-600 dark:text-gray-400">
                    {new Date(selectedDispute.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Previous Responses */}
              {selectedDispute.responses?.length > 0 && (
                <div>
                  <h5 className="font-medium text-gray-900 dark:text-white mb-3">
                    Previous Responses
                  </h5>
                  <div className="space-y-3 max-h-40 overflow-y-auto">
                    {selectedDispute.responses.map((response, index) => (
                      <div
                        key={index}
                        className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3"
                      >
                        <p className="text-gray-900 dark:text-white text-sm">
                          {response.text}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {new Date(response.created_at).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Response Form */}
              {selectedDispute.status === "open" && (
                <form onSubmit={handleSubmitResponse}>
                  <h5 className="font-medium text-gray-900 dark:text-white mb-3">
                    Your Response
                  </h5>
                  <textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Enter your response to this dispute..."
                    rows={4}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />

                  <div className="flex justify-end gap-3 mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setSelectedDispute(null);
                        setResponseText("");
                      }}
                    >
                      Cancel
                    </Button>

                    <Button
                      type="submit"
                      loading={submittingResponse}
                      icon={MessageSquare}
                    >
                      Submit Response
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default AggregatorDisputes;
