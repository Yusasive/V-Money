import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FiAlertTriangle,
  FiUser,
  FiClipboard,
  FiCheckCircle,
} from "react-icons/fi";
import { disputesApi, merchantsApi, usersApi } from "../../api/client";

const Header = () => (
  <div className="mb-6">
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
        <FiAlertTriangle className="h-5 w-5" />
      </div>
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white font-lota">
          Disputes
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Log and resolve customer disputes.
        </p>
      </div>
    </div>
  </div>
);

const Disputes = () => {
  const [disputes, setDisputes] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [assignees, setAssignees] = useState([]);
  const [form, setForm] = useState({
    merchant_id: "",
    description: "",
    assigned_to: "",
  });

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
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to log dispute");
    }
  };

  const resolve = async (id) => {
    try {
      await disputesApi.close(id); // ensure resolved via close endpoint
      await load();
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to resolve dispute");
    }
  };

  const removeDispute = async (id) => {
    if (!window.confirm("Delete this dispute? This cannot be undone.")) return;
    try {
      await disputesApi.delete(id);
      await load();
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to delete dispute");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Header />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Dispute */}
        <div className="lg:col-span-1">
          <div className="relative overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow border border-gray-100 dark:border-gray-700">
            <div className="absolute -top-10 -right-10 h-32 w-32 bg-amber-400/20 rounded-full" />
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
                    className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary"
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
                    Description
                  </label>
                  <div className="relative">
                    <FiClipboard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      className="w-full pl-9 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary"
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
                    <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select
                      className="w-full pl-9 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary"
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
        <div className="lg:col-span-2">
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
                      key={d.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-center justify-between bg-white dark:bg-gray-900"
                    >
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {d.description}
                        </div>
                        <div className="text-sm text-gray-500">
                          Merchant: {d.merchant_id}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${d.status === "resolved" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}
                        >
                          {d.status}
                        </span>
                        {d.status !== "resolved" && (
                          <button
                            onClick={() => resolve(d._id || d.id)}
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 inline-flex items-center gap-1"
                          >
                            <FiCheckCircle /> Resolve
                          </button>
                        )}
                        <button
                          onClick={() => removeDispute(d._id || d.id)}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Disputes;
