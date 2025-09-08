import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { usersApi } from "../../api/client";
import RequireRole from "../../components/Auth/RequireRole";

const statusBadgeClass = (status) => {
  switch (status) {
    case "approved":
      return "bg-green-100 text-green-700";
    case "pending":
      return "bg-amber-100 text-amber-700";
    case "rejected":
      return "bg-red-100 text-red-700";
    case "suspended":
      return "bg-gray-100 text-gray-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const Users = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    pages: 1,
  });
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get("status") || "";
  const initialRole = searchParams.get("role") || "";
  const initialSearch = searchParams.get("search") || "";

  const [filters, setFilters] = useState({
    role: initialRole,
    status: initialStatus,
    search: initialSearch,
  });

  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: pagination.limit,
        ...(filters.role ? { role: filters.role } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.search ? { search: filters.search } : {}),
      };
      const { data } = await usersApi.list(params);
      setUsers(data.users || []);
      setPagination(data.pagination || { page, limit: 20, pages: 1 });
    } catch (e) {
      setError(e.response?.data?.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialStatus, initialRole, initialSearch]);

  const onApplyFilters = () => {
    const next = {};
    if (filters.status) next.status = filters.status;
    if (filters.role) next.role = filters.role;
    if (filters.search) next.search = filters.search;
    setSearchParams(next);
    fetchUsers(1);
  };

  const confirmReason = (label) => {
    const reason = window.prompt(label + " (optional):");
    return reason || "";
  };

  const doAction = async (id, action) => {
    try {
      setLoading(true);
      if (action === "approve") await usersApi.approve(id);
      if (action === "activate") await usersApi.activate(id);
      if (action === "reject") {
        const reason = confirmReason("Enter rejection reason");
        await usersApi.reject(id, reason);
      }
      if (action === "suspend") {
        const reason = confirmReason("Enter suspension reason");
        await usersApi.suspend(id, reason);
      }
      if (action === "delete") {
        if (!window.confirm("Delete this user? This cannot be undone.")) return;
        await usersApi.delete(id);
      }
      await fetchUsers(pagination.page);
    } catch (e) {
      alert(e.response?.data?.message || "Action failed");
    } finally {
      setLoading(false);
    }
  };

  const roles = useMemo(
    () => ["", "aggregator", "staff", "merchant", "admin"],
    []
  );
  const statuses = useMemo(
    () => ["", "pending", "approved", "suspended", "rejected"],
    []
  );

  return (
    <RequireRole roles={["admin"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Users
          </h2>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              placeholder="Search name, email, username"
              value={filters.search}
              onChange={(e) =>
                setFilters((f) => ({ ...f, search: e.target.value }))
              }
              className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-200"
            />
            <select
              value={filters.role}
              onChange={(e) =>
                setFilters((f) => ({ ...f, role: e.target.value }))
              }
              className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-200"
            >
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r ? r[0].toUpperCase() + r.slice(1) : "All roles"}
                </option>
              ))}
            </select>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters((f) => ({ ...f, status: e.target.value }))
              }
              className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-200"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s ? s[0].toUpperCase() + s.slice(1) : "All status"}
                </option>
              ))}
            </select>
            <button
              onClick={onApplyFilters}
              className="bg-primary text-white px-4 py-2 rounded-md"
            >
              Apply
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-3 lg:px-4 py-3 text-left text-xs lg:text-sm font-medium text-gray-700 dark:text-gray-300">
                    Name
                  </th>
                  <th className="px-3 lg:px-4 py-3 text-left text-xs lg:text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email
                  </th>
                  <th className="px-3 lg:px-4 py-3 text-left text-xs lg:text-sm font-medium text-gray-700 dark:text-gray-300">
                    Role
                  </th>
                  <th className="px-3 lg:px-4 py-3 text-left text-xs lg:text-sm font-medium text-gray-700 dark:text-gray-300">
                    Status
                  </th>
                  <th className="px-3 lg:px-4 py-3 text-right text-xs lg:text-sm font-medium text-gray-700 dark:text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u._id}
                    className="border-t border-gray-100 dark:border-gray-700"
                  >
                    <td className="px-3 lg:px-4 py-3 text-xs lg:text-sm text-gray-900 dark:text-gray-100">
                      {u.fullName}
                    </td>
                    <td className="px-3 lg:px-4 py-3 text-xs lg:text-sm text-gray-600 dark:text-gray-300 truncate max-w-0">
                      {u.email}
                    </td>
                    <td className="px-3 lg:px-4 py-3 text-xs lg:text-sm text-gray-600 dark:text-gray-300">
                      {u.role}
                    </td>
                    <td className="px-3 lg:px-4 py-3 text-xs lg:text-sm">
                      <span
                        className={`px-2 py-1 rounded-md text-xs font-medium ${statusBadgeClass(u.status)}`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="px-3 lg:px-4 py-3 text-xs lg:text-sm text-right">
                      <div className="flex flex-col lg:flex-row gap-1 lg:gap-2 lg:justify-end">
                      {u.status !== "approved" && (
                        <button
                          onClick={() => doAction(u._id, "approve")}
                          className="px-2 lg:px-3 py-1 lg:py-1.5 rounded-md bg-green-600 text-white hover:bg-green-700 text-xs"
                          disabled={loading}
                        >
                          Approve
                        </button>
                      )}
                      {u.role !== "admin" && u.status !== "rejected" && (
                        <button
                          onClick={() => doAction(u._id, "reject")}
                          className="px-2 lg:px-3 py-1 lg:py-1.5 rounded-md bg-red-600 text-white hover:bg-red-700 text-xs"
                          disabled={loading}
                        >
                          Reject
                        </button>
                      )}
                      {u.role !== "admin" && u.status !== "suspended" && (
                        <button
                          onClick={() => doAction(u._id, "suspend")}
                          className="px-2 lg:px-3 py-1 lg:py-1.5 rounded-md bg-gray-600 text-white hover:bg-gray-700 text-xs"
                          disabled={loading}
                        >
                          Suspend
                        </button>
                      )}
                      {u.status !== "approved" && (
                        <button
                          onClick={() => doAction(u._id, "activate")}
                          className="px-2 lg:px-3 py-1 lg:py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-xs"
                          disabled={loading}
                        >
                          Activate
                        </button>
                      )}
                      {u.role !== "admin" && (
                        <button
                          onClick={() => doAction(u._id, "delete")}
                          className="px-2 lg:px-3 py-1 lg:py-1.5 rounded-md bg-red-600 text-white hover:bg-red-700 text-xs"
                          disabled={loading}
                        >
                          Delete
                        </button>
                      )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-3 lg:p-4 border-t border-gray-100 dark:border-gray-700 text-xs lg:text-sm text-gray-600 dark:text-gray-300 gap-2">
            <div>
              Page {pagination.page} of {pagination.pages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => fetchUsers(Math.max(1, pagination.page - 1))}
                disabled={loading || pagination.page <= 1}
                className="px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 disabled:opacity-50 text-xs lg:text-sm"
              >
                Prev
              </button>
              <button
                onClick={() =>
                  fetchUsers(Math.min(pagination.pages, pagination.page + 1))
                }
                disabled={loading || pagination.page >= pagination.pages}
                className="px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 disabled:opacity-50 text-xs lg:text-sm"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {loading && <div className="text-sm text-gray-500">Processing...</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}
      </div>
    </RequireRole>
  );
};

export default Users;
