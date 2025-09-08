import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Plus, User, MessageSquare, Clock } from 'lucide-react';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import PageHeader from '../../components/UI/PageHeader';
import Button from '../../components/UI/Button';
import Badge from '../../components/UI/Badge';
import Modal from '../../components/UI/Modal';
import { disputesApi, usersApi } from '../../api/client';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import toast from 'react-hot-toast';

const StaffDisputes = () => {
  const [disputes, setDisputes] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [submitting, setSubmitting] = useState(false);

  const [disputeForm, setDisputeForm] = useState({
    title: '',
    description: '',
    raised_against: '',
    priority: 'medium'
  });

  useEffect(() => {
    fetchDisputes();
    fetchUsers();
  }, []);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const response = await disputesApi.list();
      setDisputes(response.data.disputes || []);
    } catch (error) {
      console.error('Failed to fetch disputes:', error);
      toast.error('Failed to load disputes');
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
      const allUsers = response.data.users || [];
      const aggregators = allUsers.filter(u => u.role === 'aggregator');
      setUsers(aggregators);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleCreateDispute = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await disputesApi.create(disputeForm);
      toast.success('Dispute created successfully');
      setShowCreateModal(false);
      setDisputeForm({
        title: '',
        description: '',
        raised_against: '',
        priority: 'medium'
      });
      await fetchDisputes();
    } catch (error) {
      console.error('Failed to create dispute:', error);
      toast.error('Failed to create dispute');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseDispute = async (disputeId) => {
    try {
      await disputesApi.close(disputeId);
      toast.success('Dispute closed successfully');
      await fetchDisputes();
    } catch (error) {
      console.error('Failed to close dispute:', error);
      toast.error('Failed to close dispute');
    }
  };

  const filteredDisputes = disputes.filter(dispute => {
    if (filter === 'all') return true;
    return dispute.status === filter;
  });

  const getStatusBadge = (status) => {
    const statusMap = {
      open: { variant: 'danger', label: 'Open' },
      in_review: { variant: 'warning', label: 'In Review' },
      resolved: { variant: 'success', label: 'Resolved' },
      escalated: { variant: 'danger', label: 'Escalated' },
    };

    const config = statusMap[status] || { variant: 'default', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <DashboardLayout userRole="staff">
        <LoadingSpinner size="lg" text="Loading disputes..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="staff">
      <div className="space-y-8">
        <PageHeader
          title="Dispute Management"
          subtitle="Create and manage disputes with aggregators"
          icon={AlertTriangle}
          actions={
            <Button
              variant="danger"
              onClick={() => setShowCreateModal(true)}
              icon={Plus}
            >
              Raise Dispute
            </Button>
          }
        />

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All Disputes' },
              { key: 'open', label: 'Open' },
              { key: 'in_review', label: 'In Review' },
              { key: 'resolved', label: 'Resolved' },
              { key: 'escalated', label: 'Escalated' },
            ].map((filterOption) => (
              <button
                key={filterOption.key}
                onClick={() => setFilter(filterOption.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === filterOption.key
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {filterOption.label}
              </button>
            ))}
          </div>
        </div>

        {/* Disputes List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Disputes ({filteredDisputes.length})
            </h3>
          </div>

          <div className="p-6">
            {filteredDisputes.length === 0 ? (
              <div className="text-center py-12">
                <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No disputes found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {filter === 'all' 
                    ? 'No disputes have been raised yet.'
                    : `No disputes with status "${filter}".`
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredDisputes.map((dispute, index) => (
                  <motion.div
                    key={dispute._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {dispute.title}
                          </h4>
                          {getStatusBadge(dispute.status)}
                        </div>

                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          {dispute.description}
                        </p>

                        <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            Against: {dispute.raisedAgainst?.fullName || dispute.raisedAgainst?.username || 'Unknown'}
                          </div>

                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Created: {new Date(dispute.createdAt).toLocaleDateString()}
                          </div>

                          {dispute.responses?.length > 0 && (
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-4 w-4" />
                              {dispute.responses.length} response(s)
                            </div>
                          )}

                          <div className="flex items-center gap-1">
                            Priority: <span className={`px-2 py-1 text-xs rounded-full ${
                              dispute.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                              dispute.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                              dispute.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {dispute.priority}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedDispute(dispute)}
                        >
                          View Details
                        </Button>

                        {dispute.status !== 'resolved' && (
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleCloseDispute(dispute._id)}
                          >
                            Close
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Create Dispute Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Raise New Dispute"
          size="lg"
        >
          <form onSubmit={handleCreateDispute} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Dispute Title *
              </label>
              <input
                type="text"
                value={disputeForm.title}
                onChange={(e) => setDisputeForm({ ...disputeForm, title: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter dispute title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description *
              </label>
              <textarea
                value={disputeForm.description}
                onChange={(e) => setDisputeForm({ ...disputeForm, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Describe the dispute in detail"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Raise Against *
                </label>
                <select
                  value={disputeForm.raised_against}
                  onChange={(e) => setDisputeForm({ ...disputeForm, raised_against: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                >
                  <option value="">Select aggregator</option>
                  {users.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.fullName} ({user.username})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Priority
                </label>
                <select
                  value={disputeForm.priority}
                  onChange={(e) => setDisputeForm({ ...disputeForm, priority: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
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
                variant="danger"
                icon={AlertTriangle}
              >
                Raise Dispute
              </Button>
            </div>
          </form>
        </Modal>

        {/* Dispute Detail Modal */}
        <Modal
          isOpen={!!selectedDispute}
          onClose={() => setSelectedDispute(null)}
          title="Dispute Details"
          size="lg"
        >
          {selectedDispute && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedDispute.title}
                  </h4>
                  {getStatusBadge(selectedDispute.status)}
                </div>

                <p className="text-gray-600 dark:text-gray-400">
                  {selectedDispute.description}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h5 className="font-medium text-gray-900 dark:text-white mb-1">
                    Raised Against
                  </h5>
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedDispute.raisedAgainst?.fullName || selectedDispute.raisedAgainst?.username || 'Unknown'}
                  </p>
                </div>

                <div>
                  <h5 className="font-medium text-gray-900 dark:text-white mb-1">
                    Priority
                  </h5>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    selectedDispute.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                    selectedDispute.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                    selectedDispute.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {selectedDispute.priority}
                  </span>
                </div>

                <div>
                  <h5 className="font-medium text-gray-900 dark:text-white mb-1">
                    Created
                  </h5>
                  <p className="text-gray-600 dark:text-gray-400">
                    {new Date(selectedDispute.createdAt).toLocaleString()}
                  </p>
                </div>

                {selectedDispute.resolvedAt && (
                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-white mb-1">
                      Resolved
                    </h5>
                    <p className="text-gray-600 dark:text-gray-400">
                      {new Date(selectedDispute.resolvedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {/* Responses */}
              {selectedDispute.responses?.length > 0 && (
                <div>
                  <h5 className="font-medium text-gray-900 dark:text-white mb-3">
                    Responses ({selectedDispute.responses.length})
                  </h5>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {selectedDispute.responses.map((response, index) => (
                      <div
                        key={index}
                        className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {response.respondedBy?.fullName || response.respondedBy?.username || 'Unknown'}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(response.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 text-sm">
                          {response.response}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setSelectedDispute(null)}
                >
                  Close
                </Button>

                {selectedDispute.status !== 'resolved' && (
                  <Button
                    variant="success"
                    onClick={() => {
                      handleCloseDispute(selectedDispute._id);
                      setSelectedDispute(null);
                    }}
                  >
                    Mark Resolved
                  </Button>
                )}
              </div>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default StaffDisputes;