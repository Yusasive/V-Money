import React, { useEffect, useState } from "react";
import { Users, Search, TrendingUp } from "lucide-react";
import PageHeader from "../../components/UI/PageHeader";
import Button from "../../components/UI/Button";
import Badge from "../../components/UI/Badge";
import LoadingSpinner from "../../components/UI/LoadingSpinner";
import Modal from "../../components/UI/Modal";
import formatTimeAgo from "../../utils/formatTimeAgo";
import { merchantsApi, usersApi } from "../../api/client";
import { toast } from "react-hot-toast";

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
  const [createErrors, setCreateErrors] = useState({});
  const [txnForm, setTxnForm] = useState({
    txn_date: "",
    txn_count: 0,
    notes: "",
  });
  const [txFilter, setTxFilter] = useState({ startDate: "", endDate: "" });
  const [merchantsList, setMerchantsList] = useState([]);
  const [loadingMerchantsList, setLoadingMerchantsList] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [flaggedMerchants, setFlaggedMerchants] = useState([]);
  const [loadingFlagged, setLoadingFlagged] = useState(false);
  const [showFlagged, setShowFlagged] = useState(false);
  const [merchantTransactions, setMerchantTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  const createMerchant = async (e) => {
    e.preventDefault();
    try {
      // Basic client-side validation aligned to backend requirements
      const requiredFields = [
        "userId",
        "username",
        "businessName",
        "email",
        "phone",
        "address",
        "firstName",
        "lastName",
        "gender",
        "state",
        "lga",
        "bvn",
        "nin",
      ];
      const missing = requiredFields.filter(
        (k) => String(createForm[k] ?? "").trim() === ""
      );
      if (missing.length) {
        // Set per-field errors
        const errs = {};
        missing.forEach((k) => (errs[k] = "Required"));
        setCreateErrors(errs);
        toast.error(`Please fill all required fields`);
        return;
      }
      const digits11 = /^\d{11}$/;
      if (!digits11.test(createForm.bvn)) {
        setCreateErrors((p) => ({ ...p, bvn: "Must be exactly 11 digits" }));
        toast.error("BVN must be exactly 11 digits");
        return;
      }
      if (!digits11.test(createForm.nin)) {
        setCreateErrors((p) => ({ ...p, nin: "Must be exactly 11 digits" }));
        toast.error("NIN must be exactly 11 digits");
        return;
      }

      // Trim string fields before submit
      const payload = Object.fromEntries(
        Object.entries(createForm).map(([k, v]) => [
          k,
          typeof v === "string" ? v.trim() : v,
        ])
      );

      const res = await merchantsApi.create(payload);
      const created = res.data?.merchant || res.data?.data || res.data;
      setMerchantId(created?._id || created?.id);
      setMerchant(created);
      // reset form and errors
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
      setCreateErrors({});
      // close modal and refresh list
      setShowCreateModal(false);
      toast.success("Merchant created successfully");
      fetchMerchantsList();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to create merchant");
    }
  };

  const loadMerchant = async () => {
    if (!merchantId) return;
    try {
      const res = await merchantsApi.get(merchantId);
      const m = res.data?.data || res.data?.merchant || res.data;
      setMerchant(m);
      if (m?._id) {
        fetchTransactions(m._id);
      }
    } catch (e) {
      toast.error("Failed to load merchant");
    }
  };

  const addTransaction = async (e) => {
    e.preventDefault();
    try {
      await merchantsApi.addTransaction(merchantId, txnForm);
      await loadMerchant();
      setTxnForm({ txn_date: "", txn_count: 0, notes: "" });
    } catch (e) {
      const msg = e?.response?.data?.message || "Failed to add transaction";
      toast.error(msg);
    }
  };

  useEffect(() => {
    loadMerchant();
    // eslint-disable-next-line
  }, [merchantId]);

  useEffect(() => {
    // fetch list for admin overview
    fetchMerchantsList();
  }, []);

  const fetchMerchantsList = async (search = "") => {
    try {
      setLoadingMerchantsList(true);
      const res = await merchantsApi.list({ limit: 100, search });
      setMerchantsList(
        res.merchants ? res.merchants : res.data?.merchants || []
      );
    } catch (e) {
      console.error("Failed to fetch merchants list", e);
    } finally {
      setLoadingMerchantsList(false);
    }
  };

  const fetchFlaggedMerchants = async () => {
    try {
      setLoadingFlagged(true);
      const res = await merchantsApi.flagged();
      setFlaggedMerchants(res.data?.merchants || []);
    } catch (e) {
      console.error("Failed to fetch flagged merchants", e);
    } finally {
      setLoadingFlagged(false);
    }
  };

  const fetchTransactions = async (id, params = {}) => {
    try {
      setLoadingTransactions(true);
      const query = { limit: 30, ...params };
      const res = await merchantsApi.getTransactions(id, query);
      const tx = res.data?.transactions || res.data?.data || res.data || [];
      setMerchantTransactions(Array.isArray(tx) ? tx : []);
    } catch (e) {
      console.error("Failed to fetch transactions", e);
      setMerchantTransactions([]);
    } finally {
      setLoadingTransactions(false);
    }
  };

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
    <div className="space-y-6">
      <PageHeader
        title="Merchants"
        subtitle="Create merchants and update daily transactions"
        icon={Users}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadMerchant}>
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchMerchantsList()}
            >
              Refresh List
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Merchant (compact) */}
        <div className="lg:col-span-1">
          <div className="relative overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow border border-gray-100 dark:border-gray-700 p-6 flex flex-col items-start justify-center gap-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Merchant Actions
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Create or manage merchants using modal dialogs to keep the page
              short.
            </p>
            <div className="flex gap-2 w-full">
              <Button
                variant="primary"
                onClick={() => setShowCreateModal(true)}
                className="w-full"
              >
                Add Merchant
              </Button>
              <Button
                variant="outline"
                onClick={() => fetchMerchantsList()}
                className="w-full"
              >
                Refresh List
              </Button>
            </div>
          </div>
        </div>

        {/* Lookup + Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl bg-white dark:bg-gray-800 shadow border border-gray-100 dark:border-gray-700">
            <div className="p-6">
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
                  <input
                    className="w-full pl-9 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary/70 dark:focus:ring-primary"
                    placeholder="Merchant ID"
                    value={merchantId}
                    onChange={(e) => setMerchantId(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") loadMerchant();
                    }}
                  />
                </div>
                <Button variant="primary" onClick={loadMerchant}>
                  Load
                </Button>
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
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {merchant.email} • {merchant.phone || "-"}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Last seen:{" "}
                        {formatTimeAgo(
                          merchant.lastActivityDate || merchant.last_seen
                        )}
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${merchant.status === "active" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : merchant.status === "flagged" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200"}`}
                    >
                      {merchant.status}
                    </span>
                  </div>

                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900/40 backdrop-blur-sm">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-gray-700 dark:text-gray-200" />{" "}
                      Add Daily Transactions
                    </h4>
                    <form onSubmit={addTransaction} className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="text-sm text-gray-600 dark:text-gray-300">
                            Txn Date
                          </label>
                          <input
                            type="date"
                            className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary/70 dark:focus:ring-primary"
                            value={txnForm.txn_date}
                            onChange={(e) =>
                              setTxnForm({
                                ...txnForm,
                                txn_date: e.target.value,
                              })
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
                            min={0}
                            className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary/70 dark:focus:ring-primary"
                            value={txnForm.txn_count}
                            onChange={(e) =>
                              setTxnForm({
                                ...txnForm,
                                txn_count: Number(e.target.value),
                              })
                            }
                            required
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-600 dark:text-gray-300">
                            Notes (optional)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g., market closed early"
                            className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary/70 dark:focus:ring-primary"
                            value={txnForm.notes}
                            onChange={(e) =>
                              setTxnForm({
                                ...txnForm,
                                notes: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <button className="w-full md:w-auto bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                        Add
                      </button>
                    </form>
                  </div>
                  {/* Transactions list for selected merchant */}
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 mt-4 bg-white dark:bg-gray-900/40">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        Recent Transactions
                      </h4>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            fetchTransactions(merchant._id, {
                              startDate: txFilter.startDate || undefined,
                              endDate: txFilter.endDate || undefined,
                            })
                          }
                        >
                          Refresh
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                      <input
                        type="date"
                        className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary/70 dark:focus:ring-primary"
                        value={txFilter.startDate}
                        onChange={(e) => {
                          const v = e.target.value;
                          setTxFilter((p) => ({ ...p, startDate: v }));
                          fetchTransactions(merchant._id, {
                            startDate: v || undefined,
                            endDate: txFilter.endDate || undefined,
                          });
                        }}
                      />
                      <input
                        type="date"
                        className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary/70 dark:focus:ring-primary"
                        value={txFilter.endDate}
                        onChange={(e) => {
                          const v = e.target.value;
                          setTxFilter((p) => ({ ...p, endDate: v }));
                          fetchTransactions(merchant._id, {
                            startDate: txFilter.startDate || undefined,
                            endDate: v || undefined,
                          });
                        }}
                      />
                    </div>
                    {loadingTransactions ? (
                      <div className="text-sm text-gray-500">Loading...</div>
                    ) : merchantTransactions.length === 0 ? (
                      <div className="text-sm text-gray-500">
                        No transactions recorded.
                      </div>
                    ) : (
                      <div className="space-y-2 text-sm text-gray-700 dark:text-gray-200">
                        {merchantTransactions.map((t) => (
                          <div
                            key={t._id}
                            className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2"
                          >
                            <div>
                              <div className="font-medium">
                                {new Date(
                                  t.transactionDate
                                ).toLocaleDateString()}
                              </div>
                              <div className="text-gray-500">
                                Count: {t.transactionCount}
                              </div>
                              {t.notes && (
                                <div className="text-xs text-gray-400 mt-1">
                                  Note: {t.notes}
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-gray-400 text-right">
                              By:{" "}
                              {t.recordedBy?.username ||
                                t.recordedBy?.fullName ||
                                "system"}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Admin merchants list overview */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    All Merchants
                  </h3>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowFlagged(false);
                        fetchMerchantsList();
                      }}
                    >
                      Show All
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowFlagged(true);
                        fetchFlaggedMerchants();
                      }}
                    >
                      Show Flagged
                    </Button>
                  </div>
                </div>
                {loadingMerchantsList ? (
                  <LoadingSpinner size="md" text="Loading merchants..." />
                ) : merchantsList.length === 0 ? (
                  <div className="text-gray-500">No merchants found.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(showFlagged ? flaggedMerchants : merchantsList).map(
                      (m) => (
                        <div
                          key={m._id}
                          className="border rounded p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 transition-colors hover:border-gray-300 dark:hover:border-gray-600"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-semibold text-gray-900 dark:text-white">
                                {m.businessName}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-300">
                                @{m.username} • {m.email}
                              </div>
                            </div>
                            <div className="ml-4">
                              <Badge
                                variant={
                                  m.status === "flagged"
                                    ? "danger"
                                    : m.status === "active"
                                      ? "success"
                                      : "default"
                                }
                              >
                                {m.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                            Owner: {m.firstName} {m.lastName}
                          </div>
                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                try {
                                  // fetch merchant directly by id and open view modal
                                  const res = await merchantsApi.get(m._id);
                                  const mm =
                                    res.data?.data ||
                                    res.data?.merchant ||
                                    res.data;
                                  setMerchant(mm);
                                  setMerchantId(m._id);
                                  await fetchTransactions(m._id);
                                  setShowViewModal(true);
                                  window.scrollTo({
                                    top: 0,
                                    behavior: "smooth",
                                  });
                                } catch (err) {
                                  console.error("Failed to load merchant", err);
                                }
                              }}
                            >
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => {
                                setMerchantId(m._id);
                                fetchTransactions(m._id);
                              }}
                            >
                              Select
                            </Button>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Merchant Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add New Merchant"
        size="xl"
      >
        <form onSubmit={createMerchant} className="space-y-6">
          {/* Link to existing approved user */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Link to User Account *
            </label>
            <select
              value={createForm.userId}
              onChange={(e) => {
                setCreateErrors((p) => ({ ...p, userId: undefined }));
                setCreateForm({ ...createForm, userId: e.target.value });
              }}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
              required
            >
              <option value="">Select user account</option>
              {assignees.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.fullName} ({user.email}) - {user.role}
                </option>
              ))}
            </select>
            {createErrors.userId && (
              <p className="mt-1 text-xs text-red-500">{createErrors.userId}</p>
            )}
          </div>

          {/* Basic business info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Username *
              </label>
              <input
                type="text"
                value={createForm.username}
                onChange={(e) => {
                  setCreateErrors((p) => ({ ...p, username: undefined }));
                  setCreateForm({ ...createForm, username: e.target.value });
                }}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
              {createErrors.username && (
                <p className="mt-1 text-xs text-red-500">
                  {createErrors.username}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Business Name *
              </label>
              <input
                type="text"
                value={createForm.businessName}
                onChange={(e) => {
                  setCreateErrors((p) => ({ ...p, businessName: undefined }));
                  setCreateForm({
                    ...createForm,
                    businessName: e.target.value,
                  });
                }}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
              {createErrors.businessName && (
                <p className="mt-1 text-xs text-red-500">
                  {createErrors.businessName}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={createForm.email}
                onChange={(e) => {
                  setCreateErrors((p) => ({ ...p, email: undefined }));
                  setCreateForm({ ...createForm, email: e.target.value });
                }}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
              {createErrors.email && (
                <p className="mt-1 text-xs text-red-500">
                  {createErrors.email}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone *
              </label>
              <input
                type="tel"
                inputMode="tel"
                value={createForm.phone}
                onChange={(e) => {
                  setCreateErrors((p) => ({ ...p, phone: undefined }));
                  setCreateForm({ ...createForm, phone: e.target.value });
                }}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
              {createErrors.phone && (
                <p className="mt-1 text-xs text-red-500">
                  {createErrors.phone}
                </p>
              )}
            </div>
          </div>

          {/* Addresses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Address *
              </label>
              <input
                type="text"
                value={createForm.address}
                onChange={(e) => {
                  setCreateErrors((p) => ({ ...p, address: undefined }));
                  setCreateForm({ ...createForm, address: e.target.value });
                }}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
              {createErrors.address && (
                <p className="mt-1 text-xs text-red-500">
                  {createErrors.address}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Business Address
              </label>
              <input
                type="text"
                value={createForm.businessAddress}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    businessAddress: e.target.value,
                  })
                }
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Personal information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                First Name *
              </label>
              <input
                type="text"
                value={createForm.firstName}
                onChange={(e) => {
                  setCreateErrors((p) => ({ ...p, firstName: undefined }));
                  setCreateForm({ ...createForm, firstName: e.target.value });
                }}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
              {createErrors.firstName && (
                <p className="mt-1 text-xs text-red-500">
                  {createErrors.firstName}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Middle Name
              </label>
              <input
                type="text"
                value={createForm.middleName}
                onChange={(e) =>
                  setCreateForm({ ...createForm, middleName: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Last Name *
              </label>
              <input
                type="text"
                value={createForm.lastName}
                onChange={(e) => {
                  setCreateErrors((p) => ({ ...p, lastName: undefined }));
                  setCreateForm({ ...createForm, lastName: e.target.value });
                }}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
              {createErrors.lastName && (
                <p className="mt-1 text-xs text-red-500">
                  {createErrors.lastName}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Gender *
              </label>
              <select
                value={createForm.gender}
                onChange={(e) => {
                  setCreateErrors((p) => ({ ...p, gender: undefined }));
                  setCreateForm({ ...createForm, gender: e.target.value });
                }}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {createErrors.gender && (
                <p className="mt-1 text-xs text-red-500">
                  {createErrors.gender}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                State *
              </label>
              <input
                type="text"
                value={createForm.state}
                onChange={(e) => {
                  setCreateErrors((p) => ({ ...p, state: undefined }));
                  setCreateForm({ ...createForm, state: e.target.value });
                }}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
              {createErrors.state && (
                <p className="mt-1 text-xs text-red-500">
                  {createErrors.state}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                LGA *
              </label>
              <input
                type="text"
                value={createForm.lga}
                onChange={(e) => {
                  setCreateErrors((p) => ({ ...p, lga: undefined }));
                  setCreateForm({ ...createForm, lga: e.target.value });
                }}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
              {createErrors.lga && (
                <p className="mt-1 text-xs text-red-500">{createErrors.lga}</p>
              )}
            </div>
          </div>

          {/* Identity numbers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                BVN (11 digits) *
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={11}
                value={createForm.bvn}
                onChange={(e) => {
                  setCreateErrors((p) => ({ ...p, bvn: undefined }));
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
                  setCreateForm({ ...createForm, bvn: digits });
                }}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
              {createErrors.bvn && (
                <p className="mt-1 text-xs text-red-500">{createErrors.bvn}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                NIN (11 digits) *
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={11}
                value={createForm.nin}
                onChange={(e) => {
                  setCreateErrors((p) => ({ ...p, nin: undefined }));
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
                  setCreateForm({ ...createForm, nin: digits });
                }}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
              {createErrors.nin && (
                <p className="mt-1 text-xs text-red-500">{createErrors.nin}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Serial No
              </label>
              <input
                type="text"
                value={createForm.serialNo}
                onChange={(e) =>
                  setCreateForm({ ...createForm, serialNo: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create
            </Button>
          </div>
        </form>
      </Modal>

      {/* View / Edit Merchant Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setEditForm(null);
        }}
        title={editForm ? `Edit ${editForm.businessName}` : "View Merchant"}
        size="xl"
      >
        {editForm ? (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await merchantsApi.update(editForm._id, editForm);
                setShowViewModal(false);
                fetchMerchantsList();
              } catch (err) {
                toast.error(err?.response?.data?.message || "Failed to update");
              }
            }}
            className="space-y-4"
          >
            {/* Business Information */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-3">
                Business Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Business Name
                  </label>
                  <input
                    className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    value={editForm.businessName}
                    onChange={(e) =>
                      setEditForm({ ...editForm, businessName: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm({ ...editForm, email: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    value={editForm.phone}
                    onChange={(e) =>
                      setEditForm({ ...editForm, phone: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Username
                  </label>
                  <input
                    className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    value={editForm.username}
                    onChange={(e) =>
                      setEditForm({ ...editForm, username: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Account Status */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-3">
                Account Status
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    value={editForm.status}
                    onChange={(e) =>
                      setEditForm({ ...editForm, status: e.target.value })
                    }
                  >
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="flagged">Flagged</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowViewModal(false);
                  setEditForm(null);
                }}
              >
                Close
              </Button>
              <Button type="submit" variant="primary">
                Save
              </Button>
            </div>
          </form>
        ) : (
          <div>
            <div className="space-y-4">
              {/* Business Information */}
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-3">
                  Business Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="font-medium text-gray-700 dark:text-gray-300">
                      Business Name
                    </div>
                    <div className="text-gray-900 dark:text-white">
                      {merchant?.businessName}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-700 dark:text-gray-300">
                      Username
                    </div>
                    <div className="text-gray-900 dark:text-white">
                      @{merchant?.username}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-700 dark:text-gray-300">
                      Email
                    </div>
                    <div className="text-gray-900 dark:text-white">
                      {merchant?.email}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-700 dark:text-gray-300">
                      Phone
                    </div>
                    <div className="text-gray-900 dark:text-white">
                      {merchant?.phone}
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Status */}
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-3">
                  Account Status
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="font-medium text-gray-700 dark:text-gray-300">
                      Status
                    </div>
                    <Badge
                      variant={
                        merchant?.status === "approved"
                          ? "success"
                          : merchant?.status === "suspended"
                            ? "error"
                            : merchant?.status === "pending"
                              ? "warning"
                              : "default"
                      }
                    >
                      {merchant?.status}
                    </Badge>
                  </div>
                  <div>
                    <div className="font-medium text-gray-700 dark:text-gray-300">
                      Email Verification
                    </div>
                    <Badge
                      variant={merchant?.isEmailVerified ? "success" : "error"}
                    >
                      {merchant?.isEmailVerified ? "Verified" : "Not Verified"}
                    </Badge>
                  </div>
                  <div>
                    <div className="font-medium text-gray-700 dark:text-gray-300">
                      Created
                    </div>
                    <div className="text-gray-900 dark:text-white">
                      {merchant?.createdAt
                        ? new Date(merchant.createdAt).toLocaleDateString()
                        : "-"}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-700 dark:text-gray-300">
                      Last Activity
                    </div>
                    <div className="text-gray-900 dark:text-white">
                      {merchant?.lastLogin
                        ? formatTimeAgo(merchant.lastLogin)
                        : "-"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowViewModal(false)}>
                Close
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setEditForm(merchant);
                }}
              >
                Edit Details
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Merchants;
