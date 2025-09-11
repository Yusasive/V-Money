import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Edit, Save, X } from "lucide-react";
import DashboardLayout from "../../components/Layout/DashboardLayout";
import PageHeader from "../../components/UI/PageHeader";
import Button from "../../components/UI/Button";
import { authApi, usersApi, formsApi } from "../../api/client";
import OnboardingForm from "../../components/Navbar/OnboardingForm";
import LoadingSpinner from "../../components/UI/LoadingSpinner";
import toast from "react-hot-toast";

const StaffProfile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");

  const [basicForm, setBasicForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    username: "",
  });
  const [onboardingForm, setOnboardingForm] = useState({});

  const [mySubmission, setMySubmission] = useState(null);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  // removed unused showOnboardingModal state

  const protectedFields = ["bvn", "nin", "serialNo"];

  useEffect(() => {
    fetchUserData();
    fetchMySubmission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const res = await authApi.me();
      const u = res.data?.user || res.data;
      setUser(u || null);
      setBasicForm({
        fullName: u?.fullName || "",
        email: u?.email || "",
        phone: u?.phone || "",
        username: u?.username || "",
      });
      setOnboardingForm(u?.onboardingData || {});
    } catch (e) {
      console.error(e);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const fetchMySubmission = async () => {
    try {
      const res = await formsApi.getMine();
      const payload = res.data?.submission || res.data;
      setMySubmission(payload || null);
      // If user document doesn't yet have onboardingData but we have a submission, hydrate display form
      if (!user?.onboardingData && payload?.data) {
        setOnboardingForm((prev) => ({ ...prev, ...(payload.data || {}) }));
      }
    } catch (e) {
      setMySubmission(null);
    }
  };

  const navigateToOnboarding = () => {
    const initialData = {
      email: user?.email,
      username: user?.username,
      ...(user?.onboardingData || {}),
    };

    // Navigate to onboarding page with prefilled data
    window.location.href = `/onboarding?prefill=${encodeURIComponent(JSON.stringify(initialData))}`;
  };

  const handleBasicSave = async () => {
    try {
      setSaving(true);
      await usersApi.update("me", basicForm);
      toast.success("Profile updated");
      setEditing(false);
      await fetchUserData();
    } catch (e) {
      console.error(e);
      toast.error("Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleFilesUpload = async (files) => {
    if (!files || !files.length) return;
    try {
      setUploadingFiles(true);
      const fd = new FormData();
      fd.append("formType", "onboarding");
      if (onboardingForm.email) fd.append("email", onboardingForm.email);
      Array.from(files).forEach((f) => fd.append("files", f));
      await formsApi.submit(fd);
      toast.success("Documents uploaded");
      await fetchMySubmission();
    } catch (e) {
      console.error(e);
      toast.error("Upload failed");
    } finally {
      setUploadingFiles(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout userRole="staff">
        <LoadingSpinner size="lg" text="Loading profile..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="staff">
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
                    onClick={
                      activeTab === "basic" ? handleBasicSave : undefined
                    }
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

        {/* Persistent Onboarding Banner (visible until approved) */}
        {(() => {
          const status = mySubmission?.status;
          const needsOnboarding = !mySubmission && !user?.onboardingData;
          const show = needsOnboarding || (status && status !== "approved");
          if (!show) return null;

          let toneClasses = "";
          let title = "";
          let message = "";
          let cta = "";

          if (needsOnboarding) {
            toneClasses =
              "bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700";
            title = "Onboarding Required";
            message =
              "Complete your onboarding to unlock all platform features.";
            cta = "Start Onboarding";
          } else if (status === "pending") {
            toneClasses =
              "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-800";
            title = "Onboarding Pending Review";
            message =
              "Your submission is under review. You will be notified once processed.";
            cta = "View Submission";
          } else if (status === "reviewed") {
            toneClasses =
              "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700";
            title = "Onboarding Reviewed";
            message = "Your submission was reviewed and awaits final decision.";
            cta = "View Submission";
          } else if (status === "rejected") {
            toneClasses =
              "bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-700";
            title = "Onboarding Rejected";
            message =
              "Please correct issues and resubmit your onboarding information.";
            cta = "Resubmit Onboarding";
          }

          return (
            <div
              role="alert"
              className={`rounded-xl border p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm ${toneClasses}`}
            >
              <div className="space-y-1">
                <h4 className="font-semibold text-sm text-gray-900 dark:text-white tracking-wide">
                  {title}
                </h4>
                <p className="text-xs md:text-sm text-gray-700 dark:text-gray-300 max-w-prose">
                  {message}
                </p>
                {status && (
                  <div className="text-[11px] uppercase tracking-wide font-medium text-gray-500 dark:text-gray-400 pt-1">
                    Status: {status}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={status === "rejected" ? "danger" : "primary"}
                  onClick={navigateToOnboarding}
                >
                  {cta}
                </Button>
              </div>
            </div>
          );
        })()}

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6">
              {[
                { id: "basic", label: "Basic Profile" },
                { id: "onboarding", label: "Onboarding Info" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === "basic" && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Full Name
                    </label>
                    {editing ? (
                      <input
                        value={basicForm.fullName}
                        onChange={(e) =>
                          setBasicForm({
                            ...basicForm,
                            fullName: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border rounded-lg"
                      />
                    ) : (
                      <div className="text-sm text-gray-700">
                        {basicForm.fullName || "-"}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address
                    </label>
                    {editing ? (
                      <input
                        type="email"
                        value={basicForm.email}
                        onChange={(e) =>
                          setBasicForm({ ...basicForm, email: e.target.value })
                        }
                        className="w-full px-4 py-3 border rounded-lg"
                      />
                    ) : (
                      <div className="text-sm text-gray-700">
                        {basicForm.email || "-"}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phone
                    </label>
                    {editing ? (
                      <input
                        value={basicForm.phone}
                        onChange={(e) =>
                          setBasicForm({ ...basicForm, phone: e.target.value })
                        }
                        className="w-full px-4 py-3 border rounded-lg"
                      />
                    ) : (
                      <div className="text-sm text-gray-700">
                        {basicForm.phone || "-"}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Username
                    </label>
                    {editing ? (
                      <input
                        value={basicForm.username}
                        onChange={(e) =>
                          setBasicForm({
                            ...basicForm,
                            username: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border rounded-lg"
                      />
                    ) : (
                      <div className="text-sm text-gray-700">
                        {basicForm.username || "-"}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "onboarding" && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {!user?.onboardingData && !mySubmission && !editing ? (
                  <div className="text-center py-12">
                    <Edit className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Complete Your Onboarding
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Complete your onboarding to access all platform features.
                    </p>
                    <Button
                      variant="primary"
                      onClick={navigateToOnboarding}
                      icon={Edit}
                    >
                      Complete Onboarding
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Onboarding Status */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-blue-800 dark:text-blue-200">
                            Onboarding Status
                          </h4>
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            {mySubmission?.status === "approved"
                              ? "Your onboarding has been approved"
                              : mySubmission?.status === "pending"
                                ? "Your onboarding is pending review"
                                : mySubmission?.status === "rejected"
                                  ? "Your onboarding was rejected - please resubmit"
                                  : "Onboarding information available"}
                          </p>
                        </div>
                        {/* <Button
                          variant="outline"
                          size="sm"
                          onClick={navigateToOnboarding}
                        >
                          Update Onboarding
                        </Button> */}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {editing ? (
                        <div className="md:col-span-2">
                          <OnboardingForm
                            initialData={
                              user?.onboardingData || {
                                email: user?.email,
                                username: user?.username,
                              }
                            }
                            initialFiles={(mySubmission?.files || []).reduce(
                              (acc, f) => {
                                acc[f.fieldName] = f.cloudinaryUrl;
                                return acc;
                              },
                              {}
                            )}
                            isEdit={true}
                            protectedFields={protectedFields}
                            onSaveText={async (textOnly) => {
                              await usersApi.update("me", {
                                onboardingData: textOnly,
                              });
                              await fetchUserData();
                              await fetchMySubmission();
                            }}
                          />

                          <div className="mt-4">
                            <label className="block text-sm text-gray-600 mb-2">
                              Upload additional documents
                            </label>
                            <input
                              type="file"
                              multiple
                              onChange={(e) =>
                                handleFilesUpload(e.target.files)
                              }
                              className="block"
                              disabled={uploadingFiles}
                            />
                            {uploadingFiles && (
                              <div className="text-sm text-gray-500 mt-2">
                                Uploading...
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="md:col-span-2 space-y-6">
                          {/* Basic Information Display */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                First Name
                              </label>
                              <div className="text-sm text-gray-700">
                                {onboardingForm.firstName || "-"}
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Last Name
                              </label>
                              <div className="text-sm text-gray-700">
                                {onboardingForm.lastName || "-"}
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Gender
                              </label>
                              <div className="text-sm text-gray-700">
                                {onboardingForm.gender || "-"}
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                State
                              </label>
                              <div className="text-sm text-gray-700">
                                {onboardingForm.state || "-"}
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                LGA
                              </label>
                              <div className="text-sm text-gray-700">
                                {onboardingForm.lga || "-"}
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Business Name
                              </label>
                              <div className="text-sm text-gray-700">
                                {onboardingForm.businessName || "-"}
                              </div>
                            </div>
                          </div>

                          {/* Documents Section */}
                          <div>
                            <h4 className="text-sm font-semibold mb-2">
                              Uploaded Documents
                            </h4>
                            {mySubmission?.files?.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {mySubmission.files.map((file, idx) => (
                                  <div
                                    key={idx}
                                    className="border p-3 rounded-md"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <div className="text-xs text-gray-500">
                                          {file.fieldName}
                                        </div>
                                        <div className="text-sm font-medium">
                                          {file.originalName}
                                        </div>
                                      </div>
                                      <a
                                        href={file.cloudinaryUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-primary underline"
                                      >
                                        Open
                                      </a>
                                    </div>
                                    <img
                                      src={file.cloudinaryUrl}
                                      alt={file.originalName}
                                      className="w-full h-36 object-cover rounded-md mt-3"
                                    />
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-500">
                                No documents uploaded yet.
                              </div>
                            )}
                          </div>
                        </div>
                      )}
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

export default StaffProfile;
