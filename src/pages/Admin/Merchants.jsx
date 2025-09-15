import React, { useEffect, useState, useCallback } from "react";
import { Users, Search, Calendar } from "lucide-react";
import PageHeader from "../../components/UI/PageHeader";
import Button from "../../components/UI/Button";
import Badge from "../../components/UI/Badge";
import LoadingSpinner from "../../components/UI/LoadingSpinner";
import Modal from "../../components/UI/Modal";
// formatTimeAgo removed with inline merchant details
import { merchantsApi, usersApi } from "../../api/client";
import { toast } from "react-hot-toast";

const Merchants = () => {
  const [merchantId, setMerchantId] = useState("");
  const [merchant, setMerchant] = useState(null);
  const [assignees, setAssignees] = useState([]);
  const [createForm, setCreateForm] = useState({
    userId: "",
    username: "",
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
  const [txPagination, setTxPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    limit: 15,
  });
  const [merchantsPagination, setMerchantsPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    limit: 20,
  });
  const [flaggedPagination, setFlaggedPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    limit: 20,
  });
  const [showAddTxnModal, setShowAddTxnModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // (deduped) showDeleteModal & deleting defined once

  const createMerchant = async (e) => {
    e.preventDefault();
    try {
      // Only require username; userId optional
      const errs = {};
      if (!String(createForm.username || "").trim()) errs.username = "Required";
      if (Object.keys(errs).length) {
        setCreateErrors(errs);
        toast.error("Username is required");
        return;
      }

      const payload = { username: createForm.username.trim() };
      if (createForm.userId) payload.userId = createForm.userId;

      const res = await merchantsApi.create(payload);
      const created = res.data?.merchant || res.data?.data || res.data;
      setMerchantId(created?._id || created?.id);
      setMerchant(created);
      // reset form and errors
      setCreateForm({ userId: "", username: "" });
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

  // Fetch merchants list (paginated)
  const fetchMerchantsList = useCallback(
    async ({ page = 1 } = {}) => {
      try {
        setLoadingMerchantsList(true);
        const limit = merchantsPagination.limit || 20;
        const res = await merchantsApi.list({ page, limit });
        const list = res.data?.merchants || res.data?.data || res.data || [];
        setMerchantsList(Array.isArray(list) ? list : []);
        if (res.data?.pagination) {
          setMerchantsPagination(res.data.pagination);
        } else {
          setMerchantsPagination((p) => ({
            ...p,
            page,
            pages: 1,
            total: Array.isArray(list) ? list.length : 0,
          }));
        }
      } catch (e) {
        console.error("Failed to fetch merchants list", e);
      } finally {
        setLoadingMerchantsList(false);
      }
    },
    [merchantsPagination.limit]
  );

  useEffect(() => {
    // fetch list for admin overview
    fetchMerchantsList({ page: 1 });
  }, [fetchMerchantsList]);

  // Fetch flagged merchants (paginated)
  const fetchFlaggedMerchants = useCallback(
    async ({ page = 1 } = {}) => {
      try {
        setLoadingFlagged(true);
        const limit = flaggedPagination.limit || 20;
        const res = await merchantsApi.flagged({ page, limit });
        const list = res.data?.merchants || [];
        setFlaggedMerchants(Array.isArray(list) ? list : []);
        if (res.data?.pagination) {
          setFlaggedPagination(res.data.pagination);
        } else {
          setFlaggedPagination((p) => ({
            ...p,
            page,
            pages: 1,
            total: Array.isArray(list) ? list.length : 0,
          }));
        }
      } catch (e) {
        console.error("Failed to fetch flagged merchants", e);
      } finally {
        setLoadingFlagged(false);
      }
    },
    [flaggedPagination.limit]
  );

  // Fetch transactions for a merchant (paginated + optional date filters)
  const fetchTransactions = async (
    id,
    { page = 1, startDate, endDate } = {}
  ) => {
    try {
      setLoadingTransactions(true);
      const query = { page, limit: txPagination.limit || 15 };
      if (startDate) query.startDate = startDate;
      if (endDate) query.endDate = endDate;
      const res = await merchantsApi.getTransactions(id, query);
      const tx = res.data?.transactions || res.data?.data || res.data || [];
      setMerchantTransactions(Array.isArray(tx) ? tx : []);
      if (res.data?.pagination) setTxPagination(res.data.pagination);
      else
        setTxPagination((p) => ({
          ...p,
          page,
          pages: 1,
          total: Array.isArray(tx) ? tx.length : 0,
        }));
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
              onClick={() =>
                fetchMerchantsList({ page: merchantsPagination.page })
              }
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
                        fetchMerchantsList({ page: 1 });
                      }}
                    >
                      Show All
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowFlagged(true);
                        fetchFlaggedMerchants({ page: 1 });
                      }}
                    >
                      Show Flagged
                    </Button>
                  </div>
                </div>
                {loadingMerchantsList || (showFlagged && loadingFlagged) ? (
                  <LoadingSpinner
                    size="md"
                    text={
                      showFlagged
                        ? "Loading flagged merchants..."
                        : "Loading merchants..."
                    }
                  />
                ) : (showFlagged ? flaggedMerchants : merchantsList).length ===
                  0 ? (
                  <div className="text-gray-500">No merchants found.</div>
                ) : (
                  <>
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
                                  @{m.username}
                                </div>
                                {m.userId && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    Linked: {m.userId.fullName} (
                                    {m.userId.email})
                                  </div>
                                )}
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
                            {/* Owner removed for username-only list */}
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
                                    await fetchTransactions(m._id, {
                                      page: 1,
                                      limit: 15,
                                    });
                                    setShowViewModal(true);
                                  } catch (err) {
                                    console.error(
                                      "Failed to load merchant",
                                      err
                                    );
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
                                  fetchTransactions(m._id, {
                                    page: 1,
                                    limit: 15,
                                  });
                                }}
                              >
                                Select
                              </Button>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                    {/* Merchants pagination controls */}
                    <div className="flex items-center justify-between mt-4 text-sm">
                      <span>
                        Page{" "}
                        {
                          (showFlagged
                            ? flaggedPagination
                            : merchantsPagination
                          ).page
                        }{" "}
                        of{" "}
                        {
                          (showFlagged
                            ? flaggedPagination
                            : merchantsPagination
                          ).pages
                        }{" "}
                        •{" "}
                        {
                          (showFlagged
                            ? flaggedPagination
                            : merchantsPagination
                          ).total
                        }{" "}
                        total
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            showFlagged
                              ? fetchFlaggedMerchants({
                                  page: Math.max(1, flaggedPagination.page - 1),
                                })
                              : fetchMerchantsList({
                                  page: Math.max(
                                    1,
                                    merchantsPagination.page - 1
                                  ),
                                })
                          }
                          disabled={
                            showFlagged
                              ? flaggedPagination.page <= 1
                              : merchantsPagination.page <= 1
                          }
                        >
                          Prev
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            showFlagged
                              ? fetchFlaggedMerchants({
                                  page: Math.min(
                                    flaggedPagination.pages,
                                    flaggedPagination.page + 1
                                  ),
                                })
                              : fetchMerchantsList({
                                  page: Math.min(
                                    merchantsPagination.pages,
                                    merchantsPagination.page + 1
                                  ),
                                })
                          }
                          disabled={
                            showFlagged
                              ? flaggedPagination.page >=
                                flaggedPagination.pages
                              : merchantsPagination.page >=
                                merchantsPagination.pages
                          }
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </>
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
          {/* Link to existing approved user (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Link to User Account (optional)
            </label>
            <select
              value={createForm.userId}
              onChange={(e) => {
                setCreateErrors((p) => ({ ...p, userId: undefined }));
                setCreateForm({ ...createForm, userId: e.target.value });
              }}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select user account</option>
              {assignees.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.fullName} ({user.email}) - {user.role}
                </option>
              ))}
            </select>
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
            {/* Removed Business Name field: backend no longer requires it */}
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
        title={editForm ? `Edit @${editForm.username || ""}` : "View Merchant"}
        size="xl"
      >
        {editForm ? (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                // Only allow updating username (and status via separate section)
                const payload = {
                  username: editForm.username,
                };
                if (editForm.status) payload.status = editForm.status;
                await merchantsApi.update(editForm._id, payload);
                setShowViewModal(false);
                fetchMerchantsList();
              } catch (err) {
                toast.error(err?.response?.data?.message || "Failed to update");
              }
            }}
            className="space-y-4"
          >
            {/* Basic Info (Username only) */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-3">
                Merchant Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    required
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
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-3">
                  Merchant
                </h3>
                <div>
                  <div className="font-medium text-gray-700 dark:text-gray-300">
                    Username
                  </div>
                  <div className="text-gray-900 dark:text-white">
                    @{merchant?.username}
                  </div>
                </div>
                {merchant?.userId ? (
                  <div className="mt-3">
                    <div className="font-medium text-gray-700 dark:text-gray-300">
                      Linked User
                    </div>
                    <div className="text-gray-900 dark:text-white text-sm">
                      {merchant.userId.fullName} ({merchant.userId.email})
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 text-sm text-gray-500">
                    No linked user
                  </div>
                )}
              </div>

              {/* Transactions inside modal */}
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900/40">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Transactions
                  </h4>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        fetchTransactions(merchant._id, {
                          page: 1,
                          startDate: txFilter.startDate || undefined,
                          endDate: txFilter.endDate || undefined,
                        })
                      }
                      icon={Calendar}
                    >
                      Apply
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
                    }}
                  />
                  <input
                    type="date"
                    className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 p-2 rounded focus:outline-none focus:ring-2 focus:ring-primary/70 dark:focus:ring-primary"
                    value={txFilter.endDate}
                    onChange={(e) => {
                      const v = e.target.value;
                      setTxFilter((p) => ({ ...p, endDate: v }));
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
                        className="flex items-center justify-between border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 bg-gray-50 dark:bg-gray-800/50"
                      >
                        <div>
                          <div className="font-medium">
                            {new Date(t.transactionDate).toLocaleDateString()}
                          </div>
                          <div className="text-gray-500 text-xs">
                            Recorded by{" "}
                            {t.recordedBy?.fullName ||
                              t.recordedBy?.username ||
                              "-"}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-base font-semibold">
                            {t.transactionCount}
                          </div>
                          {t.notes && (
                            <div className="text-xs text-gray-500 max-w-xs truncate">
                              {t.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between mt-3 text-sm">
                  <span>
                    Page {txPagination.page} of {txPagination.pages} •{" "}
                    {txPagination.total} total
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        fetchTransactions(merchant._id, {
                          page: Math.max(1, txPagination.page - 1),
                          startDate: txFilter.startDate || undefined,
                          endDate: txFilter.endDate || undefined,
                        })
                      }
                      disabled={txPagination.page <= 1 || loadingTransactions}
                    >
                      Prev
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        fetchTransactions(merchant._id, {
                          page: Math.min(
                            txPagination.pages,
                            txPagination.page + 1
                          ),
                          startDate: txFilter.startDate || undefined,
                          endDate: txFilter.endDate || undefined,
                        })
                      }
                      disabled={
                        txPagination.page >= txPagination.pages ||
                        loadingTransactions
                      }
                    >
                      Next
                    </Button>
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
              <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
                Delete
              </Button>
              <Button
                variant="success"
                onClick={() => {
                  setShowAddTxnModal(true);
                }}
              >
                Add Transaction
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Transaction Modal */}
      <Modal
        isOpen={showAddTxnModal}
        onClose={() => setShowAddTxnModal(false)}
        title="Add Daily Transactions"
        size="lg"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await merchantsApi.addTransaction(
                merchant?._id || merchantId,
                txnForm
              );
              await fetchTransactions(merchant?._id || merchantId, { page: 1 });
              await loadMerchant();
              setTxnForm({ txn_date: "", txn_count: 0, notes: "" });
              toast.success("Transaction added");
              setShowAddTxnModal(false);
            } catch (err) {
              const msg =
                err?.response?.data?.message || "Failed to add transaction";
              toast.error(msg);
            }
          }}
          className="space-y-4"
        >
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
                Remarks (optional)
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
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAddTxnModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Add
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => !deleting && setShowDeleteModal(false)}
        title="Delete Merchant"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Are you sure you want to delete{" "}
            <span className="font-semibold">@{merchant?.username}</span>? This
            will remove the merchant and all of their transactions. This action
            cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={async () => {
                if (!merchant?._id) return;
                try {
                  setDeleting(true);
                  await merchantsApi.delete(merchant._id);
                  toast.success("Merchant deleted");
                  setShowDeleteModal(false);
                  setShowViewModal(false);
                  setMerchant(null);
                  setMerchantId("");
                  fetchMerchantsList({ page: 1 });
                } catch (err) {
                  toast.error(
                    err?.response?.data?.message || "Failed to delete merchant"
                  );
                } finally {
                  setDeleting(false);
                }
              }}
              loading={deleting}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Merchants;
