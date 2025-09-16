import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Store, Plus, TrendingUp, Search, Calendar } from "lucide-react";
import { Pen } from "lucide-react";
import DashboardLayout from "../../components/Layout/DashboardLayout";
import PageHeader from "../../components/UI/PageHeader";
import Button from "../../components/UI/Button";
import Badge from "../../components/UI/Badge";
import Modal from "../../components/UI/Modal";
import { merchantsApi } from "../../api/client";
import LoadingSpinner from "../../components/UI/LoadingSpinner";
import toast from "react-hot-toast";

import { useAuth } from "../../contexts/AuthContext"; // adjust path as needed

const StaffMerchants = () => {
  const { user } = useAuth(); // Get current user from context
  const [merchants, setMerchants] = useState([]);
  const [merchantsPagination, setMerchantsPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    limit: 20,
  });
  // Remove users state, staff can only link merchant to themselves
  const [loading, setLoading] = useState(true);
  // const [users, setUsers] = useState([]);
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTxEditModal, setShowTxEditModal] = useState(false);
  const [editTx, setEditTx] = useState(null);
  const [editTxCount, setEditTxCount] = useState("");
  const [editTxNotes, setEditTxNotes] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [merchantForm, setMerchantForm] = useState({
    userId: "",
    username: "",
  });

  const [transactionForm, setTransactionForm] = useState({
    txn_date: new Date().toISOString().split("T")[0],
    txn_count: "",
    notes: "",
  });

  // Transactions viewing state
  const [transactions, setTransactions] = useState([]);
  const [txnLoading, setTxnLoading] = useState(false);
  const [txnPagination, setTxnPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    limit: 15,
  });
  const [txnFilters, setTxnFilters] = useState({ startDate: "", endDate: "" });

  // CSV utility
  function transactionsToCSV(transactions) {
    if (!transactions.length) return "";
    const header = [
      "Date",
      "Transaction Count",
      "Notes",
      "Recorded By Name",
      "Recorded By Email",
      "Recorded By Username",
    ];
    const rows = transactions.map((t) => [
      new Date(t.transactionDate).toLocaleDateString(),
      t.transactionCount,
      t.notes ? '"' + String(t.notes).replace(/"/g, '""') + '"' : "",
      t.recordedBy?.fullName || "",
      t.recordedBy?.email || "",
      t.recordedBy?.username || "",
    ]);
    return [header, ...rows].map((r) => r.join(",")).join("\r\n");
  }

  // Fetch transactions for selected merchant
  const fetchTransactions = async (page = 1) => {
    if (!selectedMerchant?._id) return;
    try {
      setTxnLoading(true);
      const params = { page, limit: txnPagination.limit };
      if (txnFilters.startDate) params.startDate = txnFilters.startDate;
      if (txnFilters.endDate) params.endDate = txnFilters.endDate;
      const res = await merchantsApi.getTransactions(
        selectedMerchant._id,
        params
      );
      setTransactions(res.data.transactions || []);
      setTxnPagination(
        res.data.pagination || { page, pages: 1, total: 0, limit: 15 }
      );
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      toast.error("Failed to load transactions");
    } finally {
      setTxnLoading(false);
    }
  };

  // Auto-load transactions when a merchant is selected
  useEffect(() => {
    if (selectedMerchant) {
      fetchTransactions(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMerchant]);

  const fetchMerchants = useCallback(
    async ({ page = 1, search = "" } = {}) => {
      try {
        setLoading(true);
        const limit = merchantsPagination.limit || 20;
        const response = await merchantsApi.list({ search, page, limit });
        const list = response.data?.merchants || response.merchants || [];
        setMerchants(list);
        if (response.data?.pagination) {
          setMerchantsPagination(response.data.pagination);
        } else {
          setMerchantsPagination((p) => ({
            ...p,
            page,
            pages: 1,
            total: list.length,
          }));
        }
      } catch (error) {
        console.error("Failed to fetch merchants:", error);
        toast.error("Failed to load merchants");
      } finally {
        setLoading(false);
      }
    },
    [merchantsPagination.limit]
  );

  useEffect(() => {
    fetchMerchants({ page: 1, search: "" });
  }, [fetchMerchants]);

  const handleCreateMerchant = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      // Always link merchant to current staff user
      const payload = {
        username: merchantForm.username.trim(),
        userId: user._id,
      };
      await merchantsApi.create(payload);
      toast.success("Merchant created successfully");
      setShowCreateModal(false);
      setMerchantForm({
        userId: "",
        username: "",
      });
      await fetchMerchants();
    } catch (error) {
      console.error("Failed to create merchant:", error);
      toast.error(
        error?.response?.data?.message || "Failed to create merchant"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await merchantsApi.addTransaction(selectedMerchant._id, transactionForm);
      toast.success("Transaction recorded successfully");
      setShowTransactionModal(false);
      setTransactionForm({
        txn_date: new Date().toISOString().split("T")[0],
        txn_count: "",
        notes: "",
      });
      // Refresh transactions list
      fetchTransactions(1);
    } catch (error) {
      console.error("Failed to add transaction:", error);
      toast.error(
        error.response?.data?.message || "Failed to record transaction"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Server-side search + pagination used; no client-side filter

  const getStatusBadge = (status) => {
    const statusMap = {
      active: { variant: "success", label: "Active" },
      inactive: { variant: "default", label: "Inactive" },
      flagged: { variant: "danger", label: "Flagged" },
      suspended: { variant: "warning", label: "Suspended" },
    };

    const config = statusMap[status] || { variant: "default", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <DashboardLayout userRole="staff">
        <LoadingSpinner size="lg" text="Loading merchants..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="staff">
      <div className="space-y-8">
        <PageHeader
          title="Merchant Management"
          subtitle="Create merchants and manage daily transactions"
          icon={Store}
          actions={
            <Button
              variant="primary"
              onClick={() => setShowCreateModal(true)}
              icon={Plus}
            >
              Add Merchant
            </Button>
          }
        />

        {/* Search */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="relative flex gap-3 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter")
                    fetchMerchants({ page: 1, search: searchTerm });
                }}
                placeholder="Search merchants by name, username, or email..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => fetchMerchants({ page: 1, search: searchTerm })}
            >
              Search
            </Button>
          </div>
        </div>

        {/* Merchants List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Merchants ({merchantsPagination.total})
            </h3>
          </div>

          <div className="p-6">
            {merchants.length === 0 ? (
              <div className="text-center py-12">
                <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No merchants found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {searchTerm
                    ? "No merchants match your search."
                    : "Add your first merchant to get started."}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {merchants.map((merchant, index) => (
                    <motion.div
                      key={merchant._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                            @{merchant.username}
                          </h4>
                          {merchant.userId && (
                            <div className="text-xs text-gray-500 mt-1">
                              Linked: {merchant.userId.fullName} (
                              {merchant.userId.email})
                            </div>
                          )}
                        </div>
                        {getStatusBadge(merchant.status)}
                      </div>

                      <div className="flex gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedMerchant(merchant)}
                        >
                          View Details
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setSelectedMerchant(merchant);
                            setEditUsername(merchant.username);
                            setShowEditModal(true);
                          }}
                        >
                          Edit Username
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setSelectedMerchant(merchant);
                            setShowTransactionModal(true);
                          }}
                          icon={TrendingUp}
                        >
                          Add Transaction
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-6 text-sm">
                  <span>
                    Page {merchantsPagination.page} of{" "}
                    {merchantsPagination.pages} • {merchantsPagination.total}{" "}
                    total
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        fetchMerchants({
                          page: Math.max(1, merchantsPagination.page - 1),
                          search: searchTerm,
                        })
                      }
                      disabled={merchantsPagination.page <= 1}
                    >
                      Prev
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        fetchMerchants({
                          page: Math.min(
                            merchantsPagination.pages,
                            merchantsPagination.page + 1
                          ),
                          search: searchTerm,
                        })
                      }
                      disabled={
                        merchantsPagination.page >= merchantsPagination.pages
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

        {/* Create Merchant Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Add New Merchant"
          size="xl"
        >
          <form onSubmit={handleCreateMerchant} className="space-y-6">
            {/* Info: Staff can only link merchant to themselves */}
            <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">
              This merchant will be linked to your staff account:{" "}
              <span className="font-semibold">
                {user?.fullName} ({user?.email})
              </span>
            </div>
            {/* Basic Info */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Username *
                </label>
                <input
                  type="text"
                  value={merchantForm.username}
                  onChange={(e) =>
                    setMerchantForm({
                      ...merchantForm,
                      username: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit" loading={submitting} icon={Plus}>
                Create Merchant
              </Button>
            </div>
          </form>
        </Modal>

        {/* Add Transaction Modal */}
        <Modal
          isOpen={showTransactionModal}
          onClose={() => setShowTransactionModal(false)}
          title={`Add Transaction - @${selectedMerchant?.username}`}
          size="md"
        >
          <form onSubmit={handleAddTransaction} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Transaction Date *
              </label>
              <input
                type="date"
                value={transactionForm.txn_date}
                onChange={(e) =>
                  setTransactionForm({
                    ...transactionForm,
                    txn_date: e.target.value,
                  })
                }
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Transaction Count *
              </label>
              <input
                type="number"
                min="0"
                value={transactionForm.txn_count}
                onChange={(e) =>
                  setTransactionForm({
                    ...transactionForm,
                    txn_count: e.target.value,
                  })
                }
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Number of transactions"
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Minimum 10 transactions per day recommended
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Remarks
              </label>
              <textarea
                value={transactionForm.notes}
                onChange={(e) =>
                  setTransactionForm({
                    ...transactionForm,
                    notes: e.target.value,
                  })
                }
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Optional remarks about the transaction day"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowTransactionModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit" loading={submitting} icon={TrendingUp}>
                Record Transaction
              </Button>
            </div>
          </form>
        </Modal>

        {/* Merchant Detail Modal */}
        {/* Edit Username Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Edit Merchant Username"
          size="md"
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!editUsername.trim()) {
                toast.error("Username cannot be empty");
                return;
              }
              try {
                await merchantsApi.update(selectedMerchant._id, {
                  username: editUsername.trim(),
                });
                toast.success("Username updated successfully");
                setShowEditModal(false);
                setEditUsername("");
                fetchMerchants({
                  page: merchantsPagination.page,
                  search: searchTerm,
                });
              } catch (err) {
                toast.error(
                  err?.response?.data?.message || "Failed to update username"
                );
              }
            }}
            className="space-y-6"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                New Username
              </label>
              <input
                type="text"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Save
              </Button>
            </div>
          </form>
        </Modal>
        <Modal
          isOpen={!!selectedMerchant && !showTransactionModal}
          onClose={() => setSelectedMerchant(null)}
          title="Merchant Details"
          size="lg"
        >
          {selectedMerchant && (
            <div className="space-y-6">
              <div>
                <h5 className="font-medium text-gray-900 dark:text-white mb-1">
                  Username
                </h5>
                <p className="text-gray-600 dark:text-gray-400">
                  @{selectedMerchant.username}
                </p>
              </div>
              {selectedMerchant.userId ? (
                <div>
                  <h5 className="font-medium text-gray-900 dark:text-white mb-1">
                    Linked User
                  </h5>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {selectedMerchant.userId.fullName} (
                    {selectedMerchant.userId.email})
                  </p>
                </div>
              ) : (
                <div className="text-sm text-gray-500">No linked user</div>
              )}

              {/* Transactions Filter */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={txnFilters.startDate}
                    onChange={(e) =>
                      setTxnFilters({
                        ...txnFilters,
                        startDate: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={txnFilters.endDate}
                    onChange={(e) =>
                      setTxnFilters({ ...txnFilters, endDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => fetchTransactions(1)}
                    icon={Calendar}
                  >
                    Apply
                  </Button>
                </div>
              </div>

              {/* Transactions List */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <h6 className="text-sm font-semibold">Transactions</h6>
                  {!txnLoading && (
                    <span className="text-xs text-gray-500">
                      {txnPagination.total} total
                    </span>
                  )}
                </div>
                <div className="p-3 max-h-80 overflow-auto">
                  {txnLoading ? (
                    <div className="py-8 text-center text-gray-500">
                      Loading...
                    </div>
                  ) : transactions.length === 0 ? (
                    <div className="py-8 text-center text-gray-500">
                      No transactions found
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {transactions.map((t) => (
                        <li
                          key={t._id}
                          className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2"
                        >
                          <div className="text-sm">
                            <div className="font-medium">
                              {new Date(t.transactionDate).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              Recorded by{" "}
                              {t.recordedBy?.fullName ||
                                t.recordedBy?.username ||
                                "-"}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-base font-semibold">
                              {t.transactionCount}
                            </div>
                            {t.notes && (
                              <div className="text-xs text-gray-500 max-w-xs truncate">
                                {t.notes}
                              </div>
                            )}
                            <button
                              className="ml-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                              onClick={() => {
                                setEditTx(t);
                                setEditTxCount(t.transactionCount);
                                setEditTxNotes(t.notes || "");
                                setShowTxEditModal(true);
                              }}
                              aria-label="Edit Transaction"
                            >
                              <Pen className="h-4 w-4 text-gray-500" />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-sm">
                  <span>
                    Page {txnPagination.page} of {txnPagination.pages}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        fetchTransactions(Math.max(1, txnPagination.page - 1))
                      }
                      disabled={txnPagination.page <= 1 || txnLoading}
                    >
                      Prev
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        fetchTransactions(
                          Math.min(txnPagination.pages, txnPagination.page + 1)
                        )
                      }
                      disabled={
                        txnPagination.page >= txnPagination.pages || txnLoading
                      }
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
              {/* Edit Transaction Modal */}
              <Modal
                isOpen={showTxEditModal}
                onClose={() => setShowTxEditModal(false)}
                title="Edit Transaction"
                size="md"
              >
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!editTx) return;
                    try {
                      await merchantsApi.updateTransaction(editTx._id, {
                        transactionCount: editTxCount,
                        notes: editTxNotes,
                      });
                      toast.success("Transaction updated successfully");
                      setShowTxEditModal(false);
                      setEditTx(null);
                      fetchTransactions(txnPagination.page);
                    } catch (err) {
                      toast.error(
                        err?.response?.data?.message ||
                          "Failed to update transaction"
                      );
                    }
                  }}
                  className="space-y-6"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Transaction Count
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editTxCount}
                      onChange={(e) => setEditTxCount(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Remarks
                    </label>
                    <textarea
                      value={editTxNotes}
                      onChange={(e) => setEditTxNotes(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Optional remarks about the transaction day"
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowTxEditModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary">
                      Save
                    </Button>
                  </div>
                </form>
              </Modal>

              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Transactions
                </h4>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      selectedMerchant &&
                      fetchTransactions(selectedMerchant._id, {
                        page: 1,
                        startDate: txnFilters.startDate || undefined,
                        endDate: txnFilters.endDate || undefined,
                      })
                    }
                    icon={Calendar}
                  >
                    Apply
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      try {
                        if (!selectedMerchant) return;
                        // Fetch ALL transactions for this merchant with current date filter
                        let page = 1;
                        let allTx = [];
                        let done = false;
                        while (!done) {
                          const res = await merchantsApi.getTransactions(
                            selectedMerchant._id,
                            {
                              page,
                              limit: 100,
                              startDate: txnFilters.startDate || undefined,
                              endDate: txnFilters.endDate || undefined,
                            }
                          );
                          const tx = res.data?.transactions || [];
                          allTx = allTx.concat(tx);
                          if (
                            !res.data?.pagination ||
                            page >= res.data.pagination.pages
                          )
                            done = true;
                          else page++;
                        }
                        if (!allTx.length) {
                          toast.error("No transactions to export");
                          return;
                        }
                        const csv = transactionsToCSV(allTx);
                        const blob = new Blob([csv], { type: "text/csv" });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `transactions_${selectedMerchant.username}_${Date.now()}.csv`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        window.URL.revokeObjectURL(url);
                      } catch (err) {
                        toast.error("Failed to export CSV");
                      }
                    }}
                  >
                    Download CSV
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default StaffMerchants;
