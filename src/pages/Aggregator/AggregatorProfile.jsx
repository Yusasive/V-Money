import React, { useEffect, useState } from "react";
import DashboardLayout from "../../components/Layout/DashboardLayout";
import PageHeader from "../../components/UI/PageHeader";
import Button from "../../components/UI/Button";
import Badge from "../../components/UI/Badge";
import { authApi, formsApi } from "../../api/client";
import LoadingSpinner from "../../components/UI/LoadingSpinner";
import { FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AggregatorProfile = () => {
  const [me, setMe] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const res = await authApi.me();
        const user = res.data?.user || res.data;
        setMe(user);
        try {
          const subRes = await formsApi.getMine();
          setSubmission(subRes.data?.submission || subRes.data);
        } catch {
          setSubmission(null);
        }
      } catch (e) {
        // silently fail
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <DashboardLayout userRole="aggregator">
        <LoadingSpinner size="lg" text="Loading profile..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="aggregator">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <PageHeader
          title="Profile"
          subtitle="Your aggregator account details"
          icon={FileText}
          actions={
            submission?.status === "rejected" ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() =>
                  navigate("/onboarding", {
                    state: {
                      initialData: {
                        email: me?.email,
                        username: me?.username,
                        ...(submission?.data || {}),
                      },
                    },
                  })
                }
              >
                Resubmit Onboarding
              </Button>
            ) : null
          }
        />

        <div className="bg-white dark:bg-gray-800 shadow rounded-xl p-6 space-y-6 border border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
              Account
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500 dark:text-gray-400">Email</div>
                <div className="text-gray-900 dark:text-white">{me?.email}</div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400">Username</div>
                <div className="text-gray-900 dark:text-white">
                  {me?.username}
                </div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400">Role</div>
                <Badge variant="default">{me?.role}</Badge>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400">Status</div>
                <Badge
                  variant={
                    me?.status === "approved"
                      ? "success"
                      : me?.status === "pending"
                        ? "warning"
                        : "default"
                  }
                >
                  {me?.status}
                </Badge>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
              Onboarding Submission
            </h2>
            {!submission ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                No onboarding submitted yet.
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 dark:text-gray-400">
                    Status:
                  </span>
                  <Badge
                    variant={
                      submission.status === "approved"
                        ? "success"
                        : submission.status === "rejected"
                          ? "danger"
                          : submission.status === "pending"
                            ? "warning"
                            : "default"
                    }
                  >
                    {submission.status}
                  </Badge>
                </div>
                {submission.notes && (
                  <div>
                    <div className="text-gray-500 dark:text-gray-400 mb-1">
                      Reviewer Notes
                    </div>
                    <div className="whitespace-pre-line text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded p-3 bg-gray-50 dark:bg-gray-900/50">
                      {submission.notes}
                    </div>
                  </div>
                )}
                {submission.files?.length > 0 && (
                  <div>
                    <div className="text-gray-500 dark:text-gray-400 mb-1">
                      Documents
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {submission.files.map((f, i) => (
                        <a
                          key={i}
                          href={f.cloudinaryUrl}
                          className="block border border-gray-200 dark:border-gray-700 rounded p-2 hover:bg-gray-50 dark:hover:bg-gray-700"
                          target="_blank"
                          rel="noreferrer"
                        >
                          <img
                            src={f.cloudinaryUrl}
                            alt={f.originalName}
                            className="h-20 w-20 object-cover rounded"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AggregatorProfile;
