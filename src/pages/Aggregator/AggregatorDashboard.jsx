import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckSquare, AlertTriangle, TrendingUp, Clock } from 'lucide-react';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import PageHeader from '../../components/UI/PageHeader';
import StatsCard from '../../components/UI/StatsCard';
import { analyticsApi, tasksApi, disputesApi } from '../../api/client';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const AggregatorDashboard = () => {
  const [stats, setStats] = useState({
    tasksAssigned: 0,
    tasksCompleted: 0,
    tasksInProgress: 0,
    disputesActive: 0
  });
  const [recentTasks, setRecentTasks] = useState([]);
  const [recentDisputes, setRecentDisputes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch assigned tasks
      const tasksResponse = await tasksApi.assigned();
      const tasks = tasksResponse.data.tasks || [];
      
      // Fetch disputes
      const disputesResponse = await disputesApi.list({ limit: 5 });
      const disputes = disputesResponse.data.disputes || [];
      
      // Calculate stats
      const tasksCompleted = tasks.filter(t => t.status === 'completed').length;
      const tasksInProgress = tasks.filter(t => t.status === 'in_progress').length;
      const disputesActive = disputes.filter(d => d.status === 'open').length;
      
      setStats({
        tasksAssigned: tasks.length,
        tasksCompleted,
        tasksInProgress,
        disputesActive
      });
      
      setRecentTasks(tasks.slice(0, 5));
      setRecentDisputes(disputes.slice(0, 3));
      
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout userRole="aggregator">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="aggregator">
      <div className="space-y-8">
        <PageHeader
          title="Dashboard"
          subtitle="Welcome to your aggregator dashboard"
          icon={TrendingUp}
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Tasks Assigned"
            value={stats.tasksAssigned}
            icon={CheckSquare}
            color="blue"
            delay={0.1}
          />
          <StatsCard
            title="Tasks Completed"
            value={stats.tasksCompleted}
            icon={CheckSquare}
            color="green"
            delay={0.2}
          />
          <StatsCard
            title="In Progress"
            value={stats.tasksInProgress}
            icon={Clock}
            color="amber"
            delay={0.3}
          />
          <StatsCard
            title="Active Disputes"
            value={stats.disputesActive}
            icon={AlertTriangle}
            color="red"
            delay={0.4}
          />
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Tasks */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Tasks
              </h3>
            </div>
            <div className="p-6">
              {recentTasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No tasks assigned yet
                </div>
              ) : (
                <div className="space-y-4">
                  {recentTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {task.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Assigned by: {task.created_by_name || 'Unknown'}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        task.status === 'completed' ? 'bg-green-100 text-green-800' :
                        task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Recent Disputes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Disputes
              </h3>
            </div>
            <div className="p-6">
              {recentDisputes.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No disputes to review
                </div>
              ) : (
                <div className="space-y-4">
                  {recentDisputes.map((dispute) => (
                    <div
                      key={dispute.id}
                      className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {dispute.title || 'Dispute'}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {dispute.description}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        dispute.status === 'open' ? 'bg-red-100 text-red-800' :
                        dispute.status === 'resolved' ? 'bg-green-100 text-green-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {dispute.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AggregatorDashboard;