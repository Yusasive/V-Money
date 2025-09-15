import React, { useEffect, useState } from "react";
import {
  FiAlertTriangle as AlertTriangle,
  FiUser as User,
  FiClipboard as Clipboard,
  FiCheckCircle as CheckCircle,
  FiMessageCircle as MessageCircle,
} from "react-icons/fi";
import PageHeader from "../../components/UI/PageHeader";
import Button from "../../components/UI/Button";
import Modal from "../../components/UI/Modal";
import { disputesApi, merchantsApi, usersApi } from "../../api/client";
import toast from "react-hot-toast";

const Disputes = () => {
  const [disputes, setDisputes] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [assignees, setAssignees] = useState([]);
  const [form, setForm] = useState({
    merchant_id: "",
    title: "",
    description: "",
    raised_against: "",
    assigned_to: "",
  });
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [responseText, setResponseText] = useState("");
  const [submittingResponse, setSubmittingResponse] = useState(false);

  // Removed duplicate handleSubmitResponse function

  const load = async () => {
    try {
      const [
        { data: disputesRes },
        { data: merchantsRes },
        { data: usersRes },
      ] = await Promise.all([
        disputesApi.list(),
        merchantsApi.list({ limit: 100 }),
        usersApi.list({ limit: 100, status: "approved" }),
      ]);
      setDisputes(disputesRes.disputes || []);
      setMerchants(merchantsRes.merchants || []);
      const candidates = (usersRes.users || []).filter((u) =>
        ["staff", "aggregator"].includes(u.role)
      );
      setAssignees(candidates);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await disputesApi.create({
        ...form,
        assigned_to: form.assigned_to || undefined,
      });
      setForm({ merchant_id: "", description: "", assigned_to: "" });
      await load();
      toast.success("Dispute logged");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to log dispute");
    }
  };

  const resolve = async (id) => {
    try {
      await disputesApi.close(id); // ensure resolved via close endpoint
      await load();
      toast.success("Dispute resolved");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to resolve dispute");
    }
  };

  const removeDispute = async (id) => {
    setConfirmDeleteId(id);
  };

  const confirmRemove = async () => {
    const id = confirmDeleteId;
    setConfirmDeleteId(null);
    if (!id) return;
    try {
      await disputesApi.delete(id);
      await load();
      toast.success("Dispute deleted");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to delete dispute");
    }
  };

  const handleSubmitResponse = async (e) => {
    e.preventDefault();
    if (!responseText.trim() || !selectedDispute) return;

    try {
      setSubmittingResponse(true);
      await disputesApi.respond(
        selectedDispute._id || selectedDispute.id,
        responseText
      );
      toast.success("Response submitted successfully");
      setResponseText("");
      setSelectedDispute(null);
      load();
    } catch (error) {
      console.error("Failed to submit response:", error);
      toast.error("Failed to submit response");
    } finally {
      setSubmittingResponse(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Disputes"
        subtitle="Log and resolve customer disputes"
        icon={AlertTriangle}
        actions={
          <Button variant="outline" size="sm" onClick={load}>
            Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Create Dispute */}
        <div className="xl:col-span-1">
          <div className="relative overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow border border-gray-100 dark:border-gray-700">
            <div className="absolute -top-6 -right-6 h-20 w-20 lg:h-32 lg:w-32 lg:-top-10 lg:-right-10 bg-amber-400/20 rounded-full" />
            <div className="p-6 space-y-4 relative">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Log Dispute
              </h3>
              <form onSubmit={submit} className="space-y-3">
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-300">
                    Merchant
                  </label>
                  <select
                    className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 p-2 rounded text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    value={form.merchant_id}
                    onChange={(e) =>
                      setForm({ ...form, merchant_id: e.target.value })
                    }
                    required
                  >
                    <option value="">Select merchant</option>
                    {merchants.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.businessName ||
                          m.username ||
                          `${m.firstName || ""} ${m.lastName || ""}`.trim()}{" "}
                        ({m.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-300">
                    Title
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 p-2 rounded text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-300">
                    Raised Against (user)
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <select
                      className="w-full pl-9 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 p-2 rounded text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                      value={form.raised_against}
                      onChange={(e) =>
                        setForm({ ...form, raised_against: e.target.value })
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
                    Description
                  </label>
                  <div className="relative">
                    <Clipboard className="absolute left-3 top-3 text-gray-400 h-4 w-4" />
                    <textarea
                      rows={4}
                      className="w-full pl-9 pt-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 p-2 rounded text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary resize-vertical"
                      value={form.description}
                      onChange={(e) =>
                        setForm({ ...form, description: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-300">
                    Assign To (optional)
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <select
                      className="w-full pl-9 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 p-2 rounded text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                      value={form.assigned_to}
                      onChange={(e) =>
                        setForm({ ...form, assigned_to: e.target.value })
                      }
                    >
                      <option value="">Unassigned</option>
                      {assignees.map((u) => (
                        <option key={u._id} value={u._id}>
                          {u.fullName || u.username} ({u.email}) - {u.role}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <button className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded shadow hover:shadow-md transition">
                  Create
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Disputes List */}
        <div className="xl:col-span-2">
          <div className="rounded-xl bg-white dark:bg-gray-800 shadow border border-gray-100 dark:border-gray-700">
            <div className="p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Recent Disputes
              </h3>
              {disputes.length === 0 ? (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                  No disputes yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {disputes.map((d) => (
                    <div
                      key={d._id || d.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {d.description}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            Merchant: {d.merchant_id}
                          </div>
                          {/* Responses Section */}
                          {d.responses && d.responses.length > 0 && (
                            <div className="mt-3 space-y-2">
                              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Responses:
                              </div>
                              {d.responses.map((response, idx) => (
                                <div
                                  key={idx}
                                  className="ml-4 p-2 bg-gray-50 dark:bg-gray-800 rounded border-l-2 border-primary"
                                >
                                  <div className="text-sm text-gray-700 dark:text-gray-300">
                                    {response.response}
                                  </div>
                                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    By:{" "}
                                    {response.respondedBy?.fullName ||
                                      response.respondedBy?.username ||
                                      "Unknown"}{" "}
                                    •{" "}
                                    {new Date(
                                      response.createdAt
                                    ).toLocaleString()}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${d.status === "resolved" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}
                          >
                            {d.status}
                          </span>
                          {d.status !== "resolved" && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedDispute(d);
                                  setResponseText("");
                                }}
                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 inline-flex items-center gap-1 text-xs"
                              >
                                <MessageCircle className="h-3 w-3" /> Respond
                              </button>
                              <button
                                onClick={() => resolve(d._id || d.id)}
                                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 inline-flex items-center gap-1 text-xs"
                              >
                                <CheckCircle className="h-3 w-3" /> Resolve
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => removeDispute(d._id || d.id)}
                            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Delete Modal */}
      <Modal
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        title="Confirm Deletion"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Are you sure you want to delete this dispute? This action cannot be
            undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmRemove}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Response Modal */}
      <Modal
        isOpen={!!selectedDispute}
        onClose={() => {
          setSelectedDispute(null);
          setResponseText("");
        }}
        title="Respond to Dispute"
      >
        <form onSubmit={handleSubmitResponse} className="space-y-4">
          <div>
            <label
              htmlFor="response"
              className="block text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              Your Response
            </label>
            <textarea
              id="response"
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 bg-white dark:bg-gray-700"
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder="Enter your response..."
              required
            />
          </div>
          <div className="flex justify-end gap-3">
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
            <Button type="submit" loading={submittingResponse}>
              Submit Response
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Disputes;
