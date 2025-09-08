import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Store, Plus, TrendingUp, Search, Calendar } from 'lucide-react';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import PageHeader from '../../components/UI/PageHeader';
import Button from '../../components/UI/Button';
import Badge from '../../components/UI/Badge';
import Modal from '../../components/UI/Modal';
import { merchantsApi, usersApi } from '../../api/client';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import toast from 'react-hot-toast';

const StaffMerchants = () => {
  const [merchants, setMerchants] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [merchantForm, setMerchantForm] = useState({
    userId: '',
    username: '',
    businessName: '',
    email: '',
    phone: '',
    address: '',
    businessAddress: '',
    firstName: '',
    middleName: '',
    lastName: '',
    gender: '',
    state: '',
    lga: '',
    bvn: '',
    nin: '',
    serialNo: ''
  });

  const [transactionForm, setTransactionForm] = useState({
    txn_date: new Date().toISOString().split('T')[0],
    txn_count: '',
    notes: ''
  });

  useEffect(() => {
    fetchMerchants();
    fetchUsers();
  }, []);

  const fetchMerchants = async () => {
    try {
      setLoading(true);
      const response = await merchantsApi.list({ search: searchTerm });
      setMerchants(response.data.merchants || []);
    } catch (error) {
      console.error('Failed to fetch merchants:', error);
      toast.error('Failed to load merchants');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await usersApi.list({ 
        status: 'approved', 
        limit: 100 
      });
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleCreateMerchant = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await merchantsApi.create(merchantForm);
      toast.success('Merchant created successfully');
      setShowCreateModal(false);
      setMerchantForm({
        userId: '',
        username: '',
        businessName: '',
        email: '',
        phone: '',
        address: '',
        businessAddress: '',
        firstName: '',
        middleName: '',
        lastName: '',
        gender: '',
        state: '',
        lga: '',
        bvn: '',
        nin: '',
        serialNo: ''
      });
      await fetchMerchants();
    } catch (error) {
      console.error('Failed to create merchant:', error);
      toast.error('Failed to create merchant');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await merchantsApi.addTransaction(selectedMerchant._id, transactionForm);
      toast.success('Transaction recorded successfully');
      setShowTransactionModal(false);
      setTransactionForm({
        txn_date: new Date().toISOString().split('T')[0],
        txn_count: '',
        notes: ''
      });
      // Refresh merchant data if needed
    } catch (error) {
      console.error('Failed to add transaction:', error);
      toast.error(error.response?.data?.message || 'Failed to record transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredMerchants = merchants.filter(merchant =>
    merchant.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    merchant.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    merchant.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status) => {
    const statusMap = {
      active: { variant: 'success', label: 'Active' },
      inactive: { variant: 'default', label: 'Inactive' },
      flagged: { variant: 'danger', label: 'Flagged' },
      suspended: { variant: 'warning', label: 'Suspended' },
    };

    const config = statusMap[status] || { variant: 'default', label: status };
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
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search merchants by name, username, or email..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        {/* Merchants List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Merchants ({filteredMerchants.length})
            </h3>
          </div>

          <div className="p-6">
            {filteredMerchants.length === 0 ? (
              <div className="text-center py-12">
                <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No merchants found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {searchTerm ? 'No merchants match your search.' : 'Add your first merchant to get started.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMerchants.map((merchant, index) => (
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
                          {merchant.businessName}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          @{merchant.username}
                        </p>
                      </div>
                      {getStatusBadge(merchant.status)}
                    </div>

                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <div>
                        <span className="font-medium">Owner:</span> {merchant.firstName} {merchant.lastName}
                      </div>
                      <div>
                        <span className="font-medium">Email:</span> {merchant.email}
                      </div>
                      <div>
                        <span className="font-medium">Phone:</span> {merchant.phone}
                      </div>
                      <div>
                        <span className="font-medium">Location:</span> {merchant.state}, {merchant.lga}
                      </div>
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
            {/* User Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Link to User Account *
              </label>
              <select
                value={merchantForm.userId}
                onChange={(e) => setMerchantForm({ ...merchantForm, userId: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              >
                <option value="">Select user account</option>
                {users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.fullName} ({user.email}) - {user.role}
                  </option>
                ))}
              </select>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Username *
                </label>
                <input
                  type="text"
                  value={merchantForm.username}
                  onChange={(e) => setMerchantForm({ ...merchantForm, username: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Business Name *
                </label>
                <input
                  type="text"
                  value={merchantForm.businessName}
                  onChange={(e) => setMerchantForm({ ...merchantForm, businessName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={merchantForm.email}
                  onChange={(e) => setMerchantForm({ ...merchantForm, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone *
                </label>
                <input
                  type="tel"
                  value={merchantForm.phone}
                  onChange={(e) => setMerchantForm({ ...merchantForm, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  value={merchantForm.firstName}
                  onChange={(e) => setMerchantForm({ ...merchantForm, firstName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Middle Name
                </label>
                <input
                  type="text"
                  value={merchantForm.middleName}
                  onChange={(e) => setMerchantForm({ ...merchantForm, middleName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={merchantForm.lastName}
                  onChange={(e) => setMerchantForm({ ...merchantForm, lastName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Location and Identity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Gender *
                </label>
                <select
                  value={merchantForm.gender}
                  onChange={(e) => setMerchantForm({ ...merchantForm, gender: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  State *
                </label>
                <input
                  type="text"
                  value={merchantForm.state}
                  onChange={(e) => setMerchantForm({ ...merchantForm, state: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  LGA *
                </label>
                <input
                  type="text"
                  value={merchantForm.lga}
                  onChange={(e) => setMerchantForm({ ...merchantForm, lga: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  BVN *
                </label>
                <input
                  type="text"
                  value={merchantForm.bvn}
                  onChange={(e) => setMerchantForm({ ...merchantForm, bvn: e.target.value.replace(/\D/g, '').slice(0, 11) })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="11 digits"
                  maxLength={11}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  NIN *
                </label>
                <input
                  type="text"
                  value={merchantForm.nin}
                  onChange={(e) => setMerchantForm({ ...merchantForm, nin: e.target.value.replace(/\D/g, '').slice(0, 11) })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="11 digits"
                  maxLength={11}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Serial Number
                </label>
                <input
                  type="text"
                  value={merchantForm.serialNo}
                  onChange={(e) => setMerchantForm({ ...merchantForm, serialNo: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            {/* Addresses */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Personal Address *
                </label>
                <textarea
                  value={merchantForm.address}
                  onChange={(e) => setMerchantForm({ ...merchantForm, address: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Business Address
                </label>
                <textarea
                  value={merchantForm.businessAddress}
                  onChange={(e) => setMerchantForm({ ...merchantForm, businessAddress: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
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
              <Button
                type="submit"
                loading={submitting}
                icon={Plus}
              >
                Create Merchant
              </Button>
            </div>
          </form>
        </Modal>

        {/* Add Transaction Modal */}
        <Modal
          isOpen={showTransactionModal}
          onClose={() => setShowTransactionModal(false)}
          title={`Add Transaction - ${selectedMerchant?.businessName}`}
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
                onChange={(e) => setTransactionForm({ ...transactionForm, txn_date: e.target.value })}
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
                onChange={(e) => setTransactionForm({ ...transactionForm, txn_count: e.target.value })}
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
                Notes
              </label>
              <textarea
                value={transactionForm.notes}
                onChange={(e) => setTransactionForm({ ...transactionForm, notes: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Optional notes about the transaction day"
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
              <Button
                type="submit"
                loading={submitting}
                icon={TrendingUp}
              >
                Record Transaction
              </Button>
            </div>
          </form>
        </Modal>

        {/* Merchant Detail Modal */}
        <Modal
          isOpen={!!selectedMerchant && !showTransactionModal}
          onClose={() => setSelectedMerchant(null)}
          title="Merchant Details"
          size="lg"
        >
          {selectedMerchant && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h5 className="font-medium text-gray-900 dark:text-white mb-1">
                    Business Name
                  </h5>
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedMerchant.businessName}
                  </p>
                </div>

                <div>
                  <h5 className="font-medium text-gray-900 dark:text-white mb-1">
                    Username
                  </h5>
                  <p className="text-gray-600 dark:text-gray-400">
                    @{selectedMerchant.username}
                  </p>
                </div>

                <div>
                  <h5 className="font-medium text-gray-900 dark:text-white mb-1">
                    Owner Name
                  </h5>
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedMerchant.firstName} {selectedMerchant.middleName} {selectedMerchant.lastName}
                  </p>
                </div>

                <div>
                  <h5 className="font-medium text-gray-900 dark:text-white mb-1">
                    Status
                  </h5>
                  {getStatusBadge(selectedMerchant.status)}
                </div>

                <div>
                  <h5 className="font-medium text-gray-900 dark:text-white mb-1">
                    Email
                  </h5>
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedMerchant.email}
                  </p>
                </div>

                <div>
                  <h5 className="font-medium text-gray-900 dark:text-white mb-1">
                    Phone
                  </h5>
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedMerchant.phone}
                  </p>
                </div>

                <div>
                  <h5 className="font-medium text-gray-900 dark:text-white mb-1">
                    Location
                  </h5>
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedMerchant.state}, {selectedMerchant.lga}
                  </p>
                </div>

                <div>
                  <h5 className="font-medium text-gray-900 dark:text-white mb-1">
                    Created
                  </h5>
                  <p className="text-gray-600 dark:text-gray-400">
                    {new Date(selectedMerchant.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setSelectedMerchant(null)}
                >
                  Close
                </Button>
                <Button
                  variant="primary"
                  onClick={() => setShowTransactionModal(true)}
                  icon={TrendingUp}
                >
                  Add Transaction
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default StaffMerchants;