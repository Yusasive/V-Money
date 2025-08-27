import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FiUsers,
  FiSearch,
  FiMail,
  FiPhone,
  FiUser,
  FiTrendingUp,
} from "react-icons/fi";
import formatTimeAgo from "../../utils/formatTimeAgo";
import { merchantsApi } from "../../api/client";

const Header = () => (
  <div className="mb-6">
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
        <FiUsers className="h-5 w-5" />
      </div>
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white font-lota">
          Merchants
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Create merchants and update daily transactions.
        </p>
      </div>
    </div>
  </div>
);

const Merchants = () => {
  const [merchantId, setMerchantId] = useState("");
  const [merchant, setMerchant] = useState(null);
  const [createForm, setCreateForm] = useState({
    username: "",
    business_name: "",
    email: "",
    phone: "",
  });
  const [txnForm, setTxnForm] = useState({ txn_date: "", txn_count: 0 });

  const createMerchant = async (e) => {
    e.preventDefault();
    try {
      const { data } = await merchantsApi.create(createForm);
      setMerchantId(data.merchant.id);
      setMerchant(data.merchant);
      setCreateForm({ username: "", business_name: "", email: "", phone: "" });
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to create merchant");
    }
  };

  const loadMerchant = async () => {
    if (!merchantId) return;
    try {
      const { data } = await merchantsApi.get(merchantId);
      setMerchant(data);
    } catch (e) {
      alert("Failed to load merchant");
    }
  };

  const addTransaction = async (e) => {
    e.preventDefault();
    try {
      await merchantsApi.addTransaction(merchantId, txnForm);
      await loadMerchant();
      setTxnForm({ txn_date: "", txn_count: 0 });
    } catch (e) {
      alert("Failed to add transaction");
    }
  };

  useEffect(() => {
    loadMerchant();
    // eslint-disable-next-line
  }, [merchantId]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Header />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Create Merchant */}
        <div className="xl:col-span-1">
          <div className="relative overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow border border-gray-100 dark:border-gray-700">
            <div className="absolute -top-10 -right-10 h-32 w-32 bg-emerald-400/20 rounded-full" />
            <div className="p-6 space-y-4 relative">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Create Merchant
              </h3>
              <form onSubmit={createMerchant} className="space-y-3">
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    className="w-full pl-9 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Username"
                    value={createForm.username}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, username: e.target.value })
                    }
                    required
                  />
                </div>
                <input
                  className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Business Name"
                  value={createForm.business_name}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      business_name: e.target.value,
                    })
                  }
                  required
                />
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    className="w-full pl-9 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Email"
                    type="email"
                    value={createForm.email}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, email: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    className="w-full pl-9 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Phone"
                    value={createForm.phone}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, phone: e.target.value })
                    }
                  />
                </div>
                <button className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded shadow hover:shadow-md transition">
                  Create
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Lookup + Details */}
        <div className="xl:col-span-2 space-y-6">
          <div className="rounded-xl bg-white dark:bg-gray-800 shadow border border-gray-100 dark:border-gray-700">
            <div className="p-6">
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                <div className="relative flex-1">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    className="w-full pl-9 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Merchant ID"
                    value={merchantId}
                    onChange={(e) => setMerchantId(e.target.value)}
                  />
                </div>
                <button
                  className="bg-gray-800 text-white px-4 py-2 rounded"
                  onClick={loadMerchant}
                >
                  Load
                </button>
              </div>

              {merchant && (
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {merchant.business_name} ({merchant.username})
                      </div>
                      <div className="text-sm text-gray-500">
                        {merchant.email} • {merchant.phone || "-"}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Last seen: {formatTimeAgo(merchant.last_seen)}
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${merchant.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-700"}`}
                    >
                      {merchant.status}
                    </span>
                  </div>

                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <FiTrendingUp /> Add Daily Transactions
                    </h4>
                    <form
                      onSubmit={addTransaction}
                      className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end"
                    >
                      <div>
                        <label className="text-sm text-gray-600 dark:text-gray-300">
                          Txn Date
                        </label>
                        <input
                          type="date"
                          className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                          value={txnForm.txn_date}
                          onChange={(e) =>
                            setTxnForm({ ...txnForm, txn_date: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-600 dark:text-gray-300">
                          Txn Count
                        </label>
                        <input
                          type="number"
                          className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                          value={txnForm.txn_count}
                          onChange={(e) =>
                            setTxnForm({
                              ...txnForm,
                              txn_count: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                        Add
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Merchants;
