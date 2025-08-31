import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Edit, Save, X } from 'lucide-react';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import PageHeader from '../../components/UI/PageHeader';
import Button from '../../components/UI/Button';
import { authApi, usersApi } from '../../api/client';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import toast from 'react-hot-toast';

const AggregatorProfile = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [basicForm, setBasicForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    username: ''
  });

  const [onboardingForm, setOnboardingForm] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    gender: '',
    address: '',
    state: '',
    lga: '',
    bvn: '',
    nin: '',
    businessName: '',
    businessAddress: ''
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await authApi.me();
      const userData = response.data.user;
      setUser(userData);
      
      // Populate forms
      setBasicForm({
        fullName: userData.fullName || '',
        email: userData.email || '',
        phone: userData.phone || '',
        username: userData.username || ''
      });
      
      // If user has onboarding data, populate that form too
      if (userData.onboardingData) {
        setOnboardingForm(userData.onboardingData);
      }
      
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleBasicSave = async () => {
    try {
      setSaving(true);
      await usersApi.update('me', basicForm);
      toast.success('Profile updated successfully');
      setEditing(false);
      await fetchUserData();
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleOnboardingSave = async () => {
    try {
      setSaving(true);
      await usersApi.update('me', { onboardingData: onboardingForm });
      toast.success('Onboarding information updated successfully');
      setEditing(false);
      await fetchUserData();
    } catch (error) {
      console.error('Failed to update onboarding info:', error);
      toast.error('Failed to update onboarding information');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'basic', label: 'Basic Profile', icon: User },
    { id: 'onboarding', label: 'Onboarding Info', icon: Edit },
  ];

  if (loading) {
    return (
      <DashboardLayout userRole="aggregator">
        <LoadingSpinner size="lg" text="Loading profile..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="aggregator">
      <div className="space-y-8">
        <PageHeader
          title="Profile Management"
          subtitle="Manage your personal and onboarding information"
          icon={User}
          actions={
            <div className="flex gap-2">
              {editing ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditing(false)}
                    icon={X}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="success"
                    size="sm"
                    loading={saving}
                    onClick={activeTab === 'basic' ? handleBasicSave : handleOnboardingSave}
                    icon={Save}
                  >
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setEditing(true)}
                  icon={Edit}
                >
                  Edit Profile
                </Button>
              )}
            </div>
          }
        />

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* Basic Profile Tab */}
            {activeTab === 'basic' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={basicForm.fullName}
                      onChange={(e) => setBasicForm({ ...basicForm, fullName: e.target.value })}
                      disabled={!editing}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={basicForm.email}
                      onChange={(e) => setBasicForm({ ...basicForm, email: e.target.value })}
                      disabled={!editing}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={basicForm.phone}
                      onChange={(e) => setBasicForm({ ...basicForm, phone: e.target.value })}
                      disabled={!editing}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      value={basicForm.username}
                      onChange={(e) => setBasicForm({ ...basicForm, username: e.target.value })}
                      disabled={!editing}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Onboarding Info Tab */}
            {activeTab === 'onboarding' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {!user?.onboardingData && !editing ? (
                  <div className="text-center py-12">
                    <Edit className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No onboarding information
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      You haven't filled out the onboarding form yet.
                    </p>
                    <Button
                      variant="primary"
                      onClick={() => setEditing(true)}
                      icon={Edit}
                    >
                      Add Onboarding Info
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={onboardingForm.firstName}
                        onChange={(e) => setOnboardingForm({ ...onboardingForm, firstName: e.target.value })}
                        disabled={!editing}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={onboardingForm.lastName}
                        onChange={(e) => setOnboardingForm({ ...onboardingForm, lastName: e.target.value })}
                        disabled={!editing}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Gender
                      </label>
                      <select
                        value={onboardingForm.gender}
                        onChange={(e) => setOnboardingForm({ ...onboardingForm, gender: e.target.value })}
                        disabled={!editing}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <option value="">Select gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        State
                      </label>
                      <input
                        type="text"
                        value={onboardingForm.state}
                        onChange={(e) => setOnboardingForm({ ...onboardingForm, state: e.target.value })}
                        disabled={!editing}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Address
                      </label>
                      <textarea
                        value={onboardingForm.address}
                        onChange={(e) => setOnboardingForm({ ...onboardingForm, address: e.target.value })}
                        disabled={!editing}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AggregatorProfile;