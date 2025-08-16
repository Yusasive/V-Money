import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

const FormSubmissions = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [filters, setFilters] = useState({
    formType: '',
    status: '',
    page: 1
  });
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    fetchSubmissions();
  }, [filters]);

  const fetchSubmissions = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams();
      
      if (filters.formType) params.append('formType', filters.formType);
      if (filters.status) params.append('status', filters.status);
      params.append('page', filters.page);
      params.append('limit', '10');

      const response = await axios.get(`http://localhost:5000/api/forms?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSubmissions(response.data.submissions);
      setPagination({
        currentPage: response.data.currentPage,
        totalPages: response.data.totalPages,
        total: response.data.total
      });
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSubmissionStatus = async (id, status, notes = '') => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.patch(`http://localhost:5000/api/forms/${id}`, 
        { status, notes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      fetchSubmissions();
      setSelectedSubmission(null);
    } catch (error) {
      console.error('Error updating submission:', error);
    }
  };

  const deleteSubmission = async (id) => {
    if (!window.confirm('Are you sure you want to delete this submission?')) return;
    
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`http://localhost:5000/api/forms/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      fetchSubmissions();
      setSelectedSubmission(null);
    } catch (error) {
      console.error('Error deleting submission:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <h2 className="text-3xl font-bold text-gray-900 font-lota">Form Submissions</h2>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow flex flex-wrap gap-4">
        <select
          value={filters.formType}
          onChange={(e) => setFilters(prev => ({ ...prev, formType: e.target.value, page: 1 }))}
          className="px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="">All Form Types</option>
          <option value="onboarding">Onboarding</option>
          <option value="contact">Contact</option>
          <option value="loan">Loan</option>
        </select>

        <select
          value={filters.status}
          onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
          className="px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="reviewed">Reviewed</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>

        <div className="ml-auto text-sm text-gray-600">
          Total: {pagination.total} submissions
        </div>
      </div>

      {/* Submissions List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Form Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Submitted
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {submissions.map((submission) => (
              <tr key={submission._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 capitalize">
                    {submission.formType}
                  </div>
                  <div className="text-sm text-gray-500">
                    {submission.data.firstName || submission.data.email || 'N/A'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(submission.status)}`}>
                    {submission.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(submission.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => setSelectedSubmission(submission)}
                    className="text-primary hover:text-blue-700"
                  >
                    View
                  </button>
                  <button
                    onClick={() => deleteSubmission(submission._id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => setFilters(prev => ({ ...prev, page }))}
              className={`px-3 py-2 rounded-md ${
                page === pagination.currentPage
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      )}

      {/* Submission Detail Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">
                  {selectedSubmission.formType} Submission
                </h3>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              {/* Submission Data */}
              <div className="space-y-4 mb-6">
                <h4 className="font-semibold">Form Data:</h4>
                <div className="bg-gray-50 p-4 rounded-md">
                  <pre className="text-sm whitespace-pre-wrap">
                    {JSON.stringify(selectedSubmission.data, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Files */}
              {selectedSubmission.files && selectedSubmission.files.length > 0 && (
                <div className="space-y-4 mb-6">
                  <h4 className="font-semibold">Uploaded Files:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedSubmission.files.map((file, index) => (
                      <div key={index} className="border p-4 rounded-md">
                        <p className="font-medium">{file.fieldName}</p>
                        <p className="text-sm text-gray-600">{file.originalName}</p>
                        <a
                          href={file.cloudinaryUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          View File
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Update */}
              <div className="space-y-4">
                <h4 className="font-semibold">Update Status:</h4>
                <div className="flex space-x-2">
                  <button
                    onClick={() => updateSubmissionStatus(selectedSubmission._id, 'reviewed')}
                    className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                  >
                    Mark as Reviewed
                  </button>
                  <button
                    onClick={() => updateSubmissionStatus(selectedSubmission._id, 'approved')}
                    className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => updateSubmissionStatus(selectedSubmission._id, 'rejected')}
                    className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default FormSubmissions;