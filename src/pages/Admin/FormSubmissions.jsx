import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText } from "lucide-react";
import PageHeader from "../../components/UI/PageHeader";
import Button from "../../components/UI/Button";
import { formsApi } from "../../api/client";

const FormSubmissions = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [filters, setFilters] = useState({
    formType: "",
    status: "",
    page: 1,
  });
  const [pagination, setPagination] = useState({});
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [actionNotes, setActionNotes] = useState("");
  const [statusNotice, setStatusNotice] = useState(null); 
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [editingSubmission, setEditingSubmission] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchSubmissions = useCallback(async () => {
    try {
      const params = {};
      if (filters.formType) params.formType = filters.formType;
      if (filters.status) params.status = filters.status;
      params.page = filters.page;
      params.limit = 10;

      const response = await formsApi.list(params);

      setSubmissions(response.data.submissions);
      setPagination({
        currentPage: response.data.currentPage,
        totalPages: response.data.totalPages,
        total: response.data.total,
      });
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchSubmissions();
  }, [filters, fetchSubmissions]);

  const updateSubmissionStatus = async (id, status, notes = "") => {
    try {
      setUpdatingStatus(status);
      const { data } = await formsApi.update(id, { status, notes });
      fetchSubmissions();
      setSelectedSubmission(null);

      // Build message based on email result
      const email = data?.email || {};
      if (email.sent) {
        setStatusNotice({
          title: `Status updated to ${status}`,
          message: "Email sent successfully to the user.",
        });
      } else {
        const reasonMap = {
          no_email: "No email found on this submission.",
          invalid_email: "The email address on this submission is invalid.",
          send_failed: "Email could not be sent (server error).",
          no_status: "No status provided to include in the email.",
        };
        const reason = reasonMap[email.reason] || "Unknown email status.";
        setStatusNotice({
          title: `Status updated to ${status}`,
          message: `Note: ${reason}`,
        });
      }
    } catch (error) {
      console.error("Error updating submission:", error);
      setStatusNotice({
        title: "Update failed",
        message: "Failed to update status. Please try again.",
      });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const deleteSubmission = async (id) => {
    setConfirmDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      setDeleting(true);
      await formsApi.remove(confirmDeleteId);
      fetchSubmissions();
      setSelectedSubmission(null);
    } catch (error) {
      console.error("Error deleting submission:", error);
    } finally {
      setDeleting(false);
      setConfirmDeleteId(null);
    }
  };

  const cancelDelete = () => setConfirmDeleteId(null);

  const handleEditSubmission = (submission) => {
    setEditingSubmission({ ...submission });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingSubmission) return;
    
    try {
      setSavingEdit(true);
      await formsApi.update(editingSubmission._id, {
        data: editingSubmission.data,
        status: editingSubmission.status,
        notes: editingSubmission.notes,
      });
      toast.success("Submission updated successfully");
      setShowEditModal(false);
      setEditingSubmission(null);
      await fetchSubmissions();
    } catch (error) {
      console.error("Failed to update submission:", error);
      toast.error("Failed to update submission");
    } finally {
      setSavingEdit(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "reviewed":
        return "bg-blue-100 text-blue-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <PageHeader
        title="Form Submissions"
        subtitle="Review and manage form submissions"
        icon={FileText}
        actions={
          <Button variant="outline" size="sm" onClick={fetchSubmissions}>
            Refresh
          </Button>
        }
      />

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700 flex flex-wrap gap-4 items-center">
        <div className="space-y-1">
          <label className="text-xs text-gray-500 dark:text-gray-400">Status</label>
          <select
            value={filters.status}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                status: e.target.value,
                page: 1,
              }))
            }
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md"
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <button
          onClick={() => setFilters({ formType: "", status: "", page: 1 })}
          className="ml-auto text-sm px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
        >
          Reset Filters
        </button>

        <div className="text-sm text-gray-600 dark:text-gray-400">
          Total: {pagination.total || 0} submissions
        </div>
      </div>

      {/* Submissions List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        {submissions.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            No submissions found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-3 lg:px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Form Type
                  </th>
                  <th className="px-3 lg:px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 lg:px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-3 lg:px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                {submissions.map((submission, i) => (
                  <tr
                    key={submission._id}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition ${
                      i % 2 === 0 ? "bg-gray-50/30 dark:bg-gray-900/30" : "bg-white dark:bg-gray-800"
                    }`}
                  >
                    <td className="px-3 lg:px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                        {submission.formType}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-0">
                        {submission.data?.firstName ||
                          submission.data?.email ||
                          "N/A"}
                      </div>
                    </td>
                    <td className="px-3 lg:px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          submission.status
                        )}`}
                      >
                        {submission.status}
                      </span>
                    </td>
                    <td className="px-3 lg:px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(submission.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 lg:px-6 py-4 text-sm font-medium">
                      <div className="flex flex-col lg:flex-row gap-1 lg:gap-3">
                        <button
                          onClick={() => setSelectedSubmission(submission)}
                          className="text-primary hover:text-blue-700 text-xs lg:text-sm"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleEditSubmission(submission)}
                          className="text-green-600 hover:text-green-900 text-xs lg:text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteSubmission(submission._id)}
                          className="text-red-600 hover:text-red-900 text-xs lg:text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex flex-wrap justify-center items-center gap-2 mt-4">
          <button
            disabled={filters.page === 1}
            onClick={() =>
              setFilters((prev) => ({ ...prev, page: prev.page - 1 }))
            }
            className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 text-sm"
          >
            Prev
          </button>

          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
            (page) => (
              <button
                key={page}
                onClick={() => setFilters((prev) => ({ ...prev, page }))}
                className={`px-3 py-2 rounded-md ${
                  page === pagination.currentPage
                    ? "bg-primary text-white"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600"
                }`}
              >
                {page}
              </button>
            )
          )}

          <button
            disabled={filters.page === pagination.totalPages}
            onClick={() =>
              setFilters((prev) => ({ ...prev, page: prev.page + 1 }))
            }
            className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 text-sm"
          >
            Next
          </button>
        </div>
      )}

      {/* Submission Detail Modal */}
      <AnimatePresence>
        {/* Delete Confirmation Modal */}
        {confirmDeleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg max-w-md w-full shadow-lg"
            >
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Delete submission?
                </h3>
                <p className="text-sm text-gray-600 mt-2">
                  This action cannot be undone.
                </p>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={cancelDelete}
                    className="px-4 py-2 rounded-md border hover:bg-gray-100"
                    disabled={deleting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                    disabled={deleting}
                  >
                    {deleting ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {selectedSubmission && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black min-h-screen bg-opacity-50 z-50 overflow-y-auto"
            onClick={() => setSelectedSubmission(null)}
          >
            <div className="min-h-screen flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-lg max-w-4xl w-full shadow-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-8 max-h-[200vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold capitalize">
                      {selectedSubmission.formType} Submission
                    </h3>
                    <button
                      onClick={() => setSelectedSubmission(null)}
                      className="text-gray-500 text-xl font-bold hover:text-gray-700"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Submission Data */}
                  <div className="space-y-4 mb-6">
                    <h4 className="font-semibold">Form Data:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(selectedSubmission.data || {}).map(
                        ([key, value]) => (
                          <div
                            key={key}
                            className="bg-gray-50 p-3 rounded-md border text-sm"
                          >
                            <p className="text-xs uppercase text-gray-500">
                              {key}
                            </p>
                            <p className="font-medium text-gray-900">
                              {String(value)}
                            </p>
                          </div>
                        )
                      )}
                    </div>

                    <details className="mt-3">
                      <summary className="cursor-pointer text-sm text-primary">
                        Show Raw JSON
                      </summary>
                      <pre className="text-xs bg-gray-100 p-3 rounded-md overflow-x-auto mt-2">
                        {JSON.stringify(selectedSubmission.data || {}, null, 2)}
                      </pre>
                    </details>
                  </div>

                  {/* Files */}
                  {selectedSubmission.files?.length > 0 && (
                    <div className="space-y-4 mb-6">
                      <h4 className="font-semibold">Uploaded Files:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedSubmission.files.map((file, index) => (
                          <div key={index} className="border p-4 rounded-md">
                            <p className="font-medium">{file.fieldName}</p>
                            <p className="text-sm text-gray-600">
                              {file.originalName}
                            </p>
                            <a
                              href={file.cloudinaryUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              <img
                                className="w-full h-32 object-cover rounded-md mt-2"
                                src={file.cloudinaryUrl}
                                alt={file.cloudinaryUrl}
                              />
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Status Update */}
                  <div className="space-y-4">
                    <h4 className="font-semibold">Update Status:</h4>

                    {/* Optional notes to include in email */}
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">
                        Notes to user (optional)
                      </label>
                      <textarea
                        value={actionNotes}
                        onChange={(e) => setActionNotes(e.target.value)}
                        placeholder="Add a message that will be emailed to the user"
                        className="w-full p-2 border rounded-md text-sm"
                        rows={3}
                      />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() =>
                          updateSubmissionStatus(
                            selectedSubmission._id,
                            "reviewed",
                            actionNotes
                          )
                        }
                        disabled={!!updatingStatus}
                        className={`px-4 py-2 rounded-md text-white hover:bg-blue-600 ${
                          updatingStatus
                            ? "opacity-60 cursor-not-allowed bg-blue-500"
                            : "bg-blue-500"
                        }`}
                      >
                        {updatingStatus === "reviewed" ? (
                          <span className="flex items-center gap-2">
                            <span className="inline-block h-4 w-4 border-2 border-white border-b-transparent rounded-full animate-spin" />
                            Updating...
                          </span>
                        ) : (
                          "Reviewed"
                        )}
                      </button>
                      <button
                        onClick={() =>
                          updateSubmissionStatus(
                            selectedSubmission._id,
                            "approved",
                            actionNotes
                          )
                        }
                        disabled={!!updatingStatus}
                        className={`px-4 py-2 rounded-md text-white hover:bg-green-600 ${
                          updatingStatus
                            ? "opacity-60 cursor-not-allowed bg-green-500"
                            : "bg-green-500"
                        }`}
                      >
                        {updatingStatus === "approved" ? (
                          <span className="flex items-center gap-2">
                            <span className="inline-block h-4 w-4 border-2 border-white border-b-transparent rounded-full animate-spin" />
                            Updating...
                          </span>
                        ) : (
                          "Approve"
                        )}
                      </button>
                      <button
                        onClick={() =>
                          updateSubmissionStatus(
                            selectedSubmission._id,
                            "rejected",
                            actionNotes
                          )
                        }
                        disabled={!!updatingStatus}
                        className={`px-4 py-2 rounded-md text-white hover:bg-red-600 ${
                          updatingStatus
                            ? "opacity-60 cursor-not-allowed bg-red-500"
                            : "bg-red-500"
                        }`}
                      >
                        {updatingStatus === "rejected" ? (
                          <span className="flex items-center gap-2">
                            <span className="inline-block h-4 w-4 border-2 border-white border-b-transparent rounded-full animate-spin" />
                            Updating...
                          </span>
                        ) : (
                          "Reject"
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Notice Modal */}
      <AnimatePresence>
        {statusNotice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[70]"
            onClick={() => setStatusNotice(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg max-w-md w-full shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {statusNotice.title}
                </h3>
                <p className="text-sm text-gray-700 mt-2 whitespace-pre-line">
                  {statusNotice.message}
                </p>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setStatusNotice(null)}
                    className="px-4 py-2 rounded-md bg-primary text-white hover:opacity-90"
                  >
                    OK
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Submission Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingSubmission(null);
        }}
        title="Edit Form Submission"
        size="xl"
      >
        {editingSubmission && (
          <div className="space-y-6">
            {/* Status and Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={editingSubmission.status}
                  onChange={(e) =>
                    setEditingSubmission({
                      ...editingSubmission,
                      status: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="pending">Pending</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Form Type
                </label>
                <select
                  value={editingSubmission.formType}
                  onChange={(e) =>
                    setEditingSubmission({
                      ...editingSubmission,
                      formType: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="onboarding">Onboarding</option>
                  <option value="contact">Contact</option>
                  <option value="loan">Loan</option>
                  <option value="support">Support</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Admin Notes
              </label>
              <textarea
                value={editingSubmission.notes || ""}
                onChange={(e) =>
                  setEditingSubmission({
                    ...editingSubmission,
                    notes: e.target.value,
                  })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Add notes for this submission"
              />
            </div>

            {/* Editable Form Data */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Form Data
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(editingSubmission.data || {}).map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                    {key === 'address' || key === 'businessAddress' ? (
                      <textarea
                        value={value || ""}
                        onChange={(e) =>
                          setEditingSubmission({
                            ...editingSubmission,
                            data: {
                              ...editingSubmission.data,
                              [key]: e.target.value,
                            },
                          })
                        }
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    ) : key === 'gender' ? (
                      <select
                        value={value || ""}
                        onChange={(e) =>
                          setEditingSubmission({
                            ...editingSubmission,
                            data: {
                              ...editingSubmission.data,
                              [key]: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">Select...</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    ) : (
                      <input
                        type={key === 'email' ? 'email' : key === 'phone' ? 'tel' : 'text'}
                        value={value || ""}
                        onChange={(e) =>
                          setEditingSubmission({
                            ...editingSubmission,
                            data: {
                              ...editingSubmission.data,
                              [key]: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Files Display (Read-only) */}
            {editingSubmission.files?.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Uploaded Files
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {editingSubmission.files.map((file, index) => (
                    <div key={index} className="border p-4 rounded-md">
                      <p className="font-medium">{file.fieldName}</p>
                      <p className="text-sm text-gray-600">{file.originalName}</p>
                      <a
                        href={file.cloudinaryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        <img
                          className="w-full h-32 object-cover rounded-md mt-2"
                          src={file.cloudinaryUrl}
                          alt={file.originalName}
                        />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingSubmission(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={savingEdit}
                onClick={handleSaveEdit}
              >
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
};

export default FormSubmissions;
