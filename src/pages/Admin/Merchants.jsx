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
import { merchantsApi, usersApi } from "../../api/client";

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
  const [assignees, setAssignees] = useState([]);
  const [createForm, setCreateForm] = useState({
    userId: "",
    username: "",
    businessName: "",
    email: "",
    phone: "",
    address: "",
    businessAddress: "",
    firstName: "",
    middleName: "",
    lastName: "",
    gender: "",
    state: "",
    lga: "",
    bvn: "",
    nin: "",
    serialNo: "",
  });
  const [txnForm, setTxnForm] = useState({ txn_date: "", txn_count: 0 });

  const createMerchant = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...createForm };
      const { data } = await merchantsApi.create(payload);
      setMerchantId(data.merchant._id || data.merchant.id);
      setMerchant(data.merchant);
      setCreateForm({
        userId: "",
        username: "",
        businessName: "",
        email: "",
        phone: "",
        address: "",
        businessAddress: "",
        firstName: "",
        middleName: "",
        lastName: "",
        gender: "",
        state: "",
        lga: "",
        bvn: "",
        nin: "",
        serialNo: "",
      });
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

  useEffect(() => {
    // load users for selection
    (async () => {
      try {
        const { data } = await usersApi.list({
          limit: 200,
          status: "approved",
        });
        setAssignees(data.users || []);
      } catch (e) {
        console.error("Failed to load users");
      }
    })();
  }, []);

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
                {/* User selection */}
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-300">
                    Linked User
                  </label>
                  <select
                    className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                    value={createForm.userId}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, userId: e.target.value })
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
                  value={createForm.businessName}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      businessName: e.target.value,
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
                    required
                  />
                </div>

                {/* Address */}
                <input
                  className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Address"
                  value={createForm.address}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, address: e.target.value })
                  }
                  required
                />
                <input
                  className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Business Address (optional)"
                  value={createForm.businessAddress}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      businessAddress: e.target.value,
                    })
                  }
                />

                {/* Personal Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="First Name"
                    value={createForm.firstName}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        firstName: e.target.value,
                      })
                    }
                    required
                  />
                  <input
                    className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Middle Name (optional)"
                    value={createForm.middleName}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        middleName: e.target.value,
                      })
                    }
                  />
                  <input
                    className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Last Name"
                    value={createForm.lastName}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, lastName: e.target.value })
                    }
                    required
                  />
                  <select
                    className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                    value={createForm.gender}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, gender: e.target.value })
                    }
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Region */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="State"
                    value={createForm.state}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, state: e.target.value })
                    }
                    required
                  />
                  <input
                    className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="LGA"
                    value={createForm.lga}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, lga: e.target.value })
                    }
                    required
                  />
                </div>

                {/* Identity */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="BVN (11 digits)"
                    value={createForm.bvn}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, bvn: e.target.value })
                    }
                    required
                  />
                  <input
                    className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="NIN (11 digits)"
                    value={createForm.nin}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, nin: e.target.value })
                    }
                    required
                  />
                  <input
                    className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Serial No (optional)"
                    value={createForm.serialNo}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, serialNo: e.target.value })
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
                        {(merchant.businessName || merchant.business_name) ??
                          "-"}{" "}
                        ({merchant.username})
                      </div>
                      <div className="text-sm text-gray-500">
                        {merchant.email} • {merchant.phone || "-"}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Last seen:{" "}
                        {formatTimeAgo(
                          merchant.lastActivityDate || merchant.last_seen
                        )}
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${merchant.status === "active" ? "bg-green-100 text-green-700" : merchant.status === "flagged" ? "bg-amber-100 text-amber-700" : "bg-gray-200 text-gray-700"}`}
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
