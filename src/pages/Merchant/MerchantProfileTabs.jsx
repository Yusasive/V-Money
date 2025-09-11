import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  FiEdit,
  FiLock,
  FiUser,
  FiBriefcase,
  FiFileText,
  FiEye,
  FiDownload,
} from "react-icons/fi";

// Document Card Component - SIMPLIFIED TO STOP ERRORS
const DocumentCard = ({ title, url, alt }) => {
  // TEMPORARY: Always show placeholder to stop 404 errors
  return (
    <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 sm:p-4">
      <h4 className="font-medium text-gray-900 dark:text-white mb-2 text-sm sm:text-base">
        {title}
      </h4>
      <div className="w-full h-24 sm:h-32 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md flex flex-col items-center justify-center p-2">
        <div className="text-4xl mb-1">📄</div>
        <span className="text-gray-600 dark:text-gray-400 text-xs text-center mb-1">
          {title}
        </span>
        <span className="text-gray-500 dark:text-gray-500 text-xs text-center">
          Document uploaded
        </span>
      </div>
    </div>
  );
};

// ORIGINAL COMPONENT (commented out to stop errors)
const DocumentCardOriginal = ({ title, url, alt }) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [networkTest, setNetworkTest] = useState(null);

  // Extract URL from object or use string directly
  const getImageUrl = (urlData) => {
    if (!urlData) return null;

    let extractedUrl = null;

    // If it's already a clean string URL, return as is
    if (typeof urlData === "string" && !urlData.startsWith("{")) {
      extractedUrl = urlData;
    }
    // If it's an object, extract the URL
    else if (typeof urlData === "object" && urlData.url) {
      extractedUrl = urlData.url;
    }
    // If it's a JSON string, try to parse it
    else if (typeof urlData === "string" && urlData.startsWith("{")) {
      try {
        const parsed = JSON.parse(urlData);
        extractedUrl = parsed.url || null;
      } catch (e) {
        console.error("Failed to parse URL data:", e);
        return null;
      }
    }

    if (!extractedUrl) return null;

    // Fix double folder issue: v-money/v-money/ -> v-money/
    if (extractedUrl.includes("/v-money/v-money/")) {
      extractedUrl = extractedUrl.replace("/v-money/v-money/", "/v-money/");
    }

    // Clean up the URL if needed (remove double extensions)
    if (extractedUrl.includes(".png.png")) {
      extractedUrl = extractedUrl.replace(".png.png", ".png");
    }
    if (extractedUrl.includes(".jpg.jpg")) {
      extractedUrl = extractedUrl.replace(".jpg.jpg", ".jpg");
    }
    if (extractedUrl.includes(".jpeg.jpeg")) {
      extractedUrl = extractedUrl.replace(".jpeg.jpeg", ".jpeg");
    }

    return extractedUrl;
  };

  const imageUrl = getImageUrl(url);

  // TEMPORARY: Disable image loading to stop 404 errors
  const shouldShowImage = false; // Set to true when images are fixed

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = (e) => {
    // Silently handle errors for now
    setImageLoading(false);
    setImageError(true);
  };

  const openImageInNewTab = () => {
    if (imageUrl && !imageError) {
      window.open(imageUrl, "_blank");
    }
  };

  // Test network connectivity to the image URL
  const testNetworkAccess = async () => {
    if (!imageUrl) return;

    setNetworkTest("testing");
    try {
      const response = await fetch(imageUrl, { method: "HEAD" });
      if (response.ok) {
        setNetworkTest("success");
      } else {
        setNetworkTest(`failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      setNetworkTest(`error: ${error.message}`);
    }
  };

  return (
    <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 sm:p-4">
      <h4 className="font-medium text-gray-900 dark:text-white mb-2 text-sm sm:text-base">
        {title}
      </h4>
      {imageUrl ? (
        <div className="relative">
          {imageLoading && (
            <div className="w-full h-24 sm:h-32 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          )}
          {!imageError ? (
            <div className="relative group">
              <img
                src={imageUrl}
                alt={alt}
                className={`w-full h-24 sm:h-32 object-cover rounded-md cursor-pointer transition-opacity ${
                  imageLoading ? "opacity-0 absolute" : "opacity-100"
                }`}
                onLoad={handleImageLoad}
                onError={handleImageError}
                onClick={openImageInNewTab}
              />
              {!imageLoading && (
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex space-x-2">
                    <button
                      onClick={openImageInNewTab}
                      className="bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 p-2 rounded-full transition-all duration-200"
                      title="View full size"
                    >
                      <FiEye className="w-4 h-4" />
                    </button>
                    <a
                      href={imageUrl}
                      download
                      className="bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 p-2 rounded-full transition-all duration-200"
                      title="Download"
                    >
                      <FiDownload className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-24 sm:h-32 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md flex flex-col items-center justify-center p-2">
              <div className="text-4xl mb-1">📄</div>
              <span className="text-gray-600 dark:text-gray-400 text-xs text-center mb-2">
                {title}
              </span>
              <span className="text-red-500 dark:text-red-400 text-xs text-center">
                Image not available
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="w-full h-24 sm:h-32 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center">
          <span className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm text-center px-2">
            No document uploaded
          </span>
        </div>
      )}
    </div>
  );
};

export default function MerchantProfileTabs({
  merchant,
  onUpdateProfile,
  onChangePassword,
}) {
  const [activeTab, setActiveTab] = useState("personal");

  // Personal Information Form
  const [personalForm, setPersonalForm] = useState({
    first_name: merchant?.first_name || "",
    middle_name: merchant?.middle_name || "",
    last_name: merchant?.last_name || "",
    gender: merchant?.gender || "",
    phone: merchant?.phone || "",
    address: merchant?.address || "",
    state: merchant?.state || "",
    lga: merchant?.lga || "",
  });

  // Business Information Form
  const [businessForm, setBusinessForm] = useState({
    business_name: merchant?.business_name || "",
    business_address: merchant?.business_address || "",
    serial_no: merchant?.serial_no || "",
  });

  // Password Form
  const [passwordForm, setPasswordForm] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  // Loading and error states
  const [personalError, setPersonalError] = useState("");
  const [personalSuccess, setPersonalSuccess] = useState("");
  const [businessError, setBusinessError] = useState("");
  const [businessSuccess, setBusinessSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [loadingPersonal, setLoadingPersonal] = useState(false);
  const [loadingBusiness, setLoadingBusiness] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);

  // Update forms when merchant data changes
  useEffect(() => {
    if (merchant) {
      setPersonalForm({
        first_name: merchant.first_name || "",
        middle_name: merchant.middle_name || "",
        last_name: merchant.last_name || "",
        gender: merchant.gender || "",
        phone: merchant.phone || "",
        address: merchant.address || "",
        state: merchant.state || "",
        lga: merchant.lga || "",
      });

      setBusinessForm({
        business_name: merchant.business_name || "",
        business_address: merchant.business_address || "",
        serial_no: merchant.serial_no || "",
      });
    }
  }, [merchant]);

  const handlePersonalSubmit = async (e) => {
    e.preventDefault();
    setLoadingPersonal(true);
    setPersonalError("");
    setPersonalSuccess("");

    try {
      await onUpdateProfile(personalForm);
      setPersonalSuccess("Personal information updated successfully!");
      setTimeout(() => setPersonalSuccess(""), 5000);
    } catch (error) {
      setPersonalError(
        error.message || "Failed to update personal information"
      );
    } finally {
      setLoadingPersonal(false);
    }
  };

  const handleBusinessSubmit = async (e) => {
    e.preventDefault();
    setLoadingBusiness(true);
    setBusinessError("");
    setBusinessSuccess("");

    try {
      await onUpdateProfile(businessForm);
      setBusinessSuccess("Business information updated successfully!");
      setTimeout(() => setBusinessSuccess(""), 5000);
    } catch (error) {
      setBusinessError(
        error.message || "Failed to update business information"
      );
    } finally {
      setLoadingBusiness(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoadingPassword(true);
    setPasswordError("");
    setPasswordSuccess("");

    if (passwordForm.new !== passwordForm.confirm) {
      setPasswordError("New passwords do not match");
      setLoadingPassword(false);
      return;
    }

    if (passwordForm.new.length < 8) {
      setPasswordError("Password must be at least 8 characters long");
      setLoadingPassword(false);
      return;
    }

    try {
      await onChangePassword(passwordForm.current, passwordForm.new);
      setPasswordSuccess("Password changed successfully!");
      setPasswordForm({ current: "", new: "", confirm: "" });
      setTimeout(() => setPasswordSuccess(""), 5000);
    } catch (error) {
      setPasswordError(error.message || "Failed to change password");
    } finally {
      setLoadingPassword(false);
    }
  };

  const tabs = [
    { id: "personal", label: "Personal Info", icon: FiUser },
    { id: "business", label: "Business Info", icon: FiBriefcase },
    { id: "documents", label: "Documents", icon: FiFileText },
    { id: "password", label: "Password", icon: FiLock },
  ];

  const nigerianStates = [
    "Abia",
    "Adamawa",
    "Akwa Ibom",
    "Anambra",
    "Bauchi",
    "Bayelsa",
    "Benue",
    "Borno",
    "Cross River",
    "Delta",
    "Ebonyi",
    "Edo",
    "Ekiti",
    "Enugu",
    "FCT",
    "Gombe",
    "Imo",
    "Jigawa",
    "Kaduna",
    "Kano",
    "Katsina",
    "Kebbi",
    "Kogi",
    "Kwara",
    "Lagos",
    "Nasarawa",
    "Niger",
    "Ogun",
    "Ondo",
    "Osun",
    "Oyo",
    "Plateau",
    "Rivers",
    "Sokoto",
    "Taraba",
    "Yobe",
    "Zamfara",
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        {/* Desktop Tab Navigation */}
        <nav className="hidden sm:flex -mb-px space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                <Icon className="mr-2 h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Mobile Tab Navigation - Dropdown Style */}
        <div className="sm:hidden -mb-px">
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
            className="w-full py-2 px-3 border-0 border-b-2 border-primary bg-transparent text-primary font-medium text-sm focus:outline-none focus:ring-0"
          >
            {tabs.map((tab) => (
              <option key={tab.id} value={tab.id} className="text-gray-900">
                {tab.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Personal Information Tab */}
      {activeTab === "personal" && (
        <form
          onSubmit={handlePersonalSubmit}
          className="max-w-2xl space-y-4 sm:space-y-6 bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div>
            <h3 className="font-bold text-base sm:text-lg mb-2 text-gray-900 dark:text-white">
              Personal Information
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4">
              Update your personal details. Note: BVN and NIN cannot be changed
              for security reasons.
            </p>
          </div>

          {personalError && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm">{personalError}</p>
                </div>
              </div>
            </div>
          )}

          {personalSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-green-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm">{personalSuccess}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                First Name *
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 sm:p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base"
                value={personalForm.first_name}
                onChange={(e) =>
                  setPersonalForm({
                    ...personalForm,
                    first_name: e.target.value,
                  })
                }
                required
                placeholder="Enter your first name"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Middle Name
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 sm:p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base"
                value={personalForm.middle_name}
                onChange={(e) =>
                  setPersonalForm({
                    ...personalForm,
                    middle_name: e.target.value,
                  })
                }
                placeholder="Enter your middle name"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Last Name *
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 sm:p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base"
                value={personalForm.last_name}
                onChange={(e) =>
                  setPersonalForm({
                    ...personalForm,
                    last_name: e.target.value,
                  })
                }
                required
                placeholder="Enter your last name"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Gender *
              </label>
              <select
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 sm:p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base"
                value={personalForm.gender}
                onChange={(e) =>
                  setPersonalForm({ ...personalForm, gender: e.target.value })
                }
                required
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 sm:p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base"
                value={personalForm.phone}
                onChange={(e) =>
                  setPersonalForm({ ...personalForm, phone: e.target.value })
                }
                required
                placeholder="Enter your phone number"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Address *
            </label>
            <textarea
              rows="3"
              className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 sm:p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base"
              value={personalForm.address}
              onChange={(e) =>
                setPersonalForm({ ...personalForm, address: e.target.value })
              }
              required
              placeholder="Enter your address"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                State *
              </label>
              <select
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 sm:p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base"
                value={personalForm.state}
                onChange={(e) =>
                  setPersonalForm({ ...personalForm, state: e.target.value })
                }
                required
              >
                <option value="">Select state</option>
                {nigerianStates.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                LGA *
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 sm:p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base"
                value={personalForm.lga}
                onChange={(e) =>
                  setPersonalForm({ ...personalForm, lga: e.target.value })
                }
                required
                placeholder="Enter your LGA"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="w-full sm:w-auto bg-primary hover:bg-primary-dark text-white px-4 sm:px-6 py-2 sm:py-3 rounded-md font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              disabled={loadingPersonal}
            >
              {loadingPersonal ? (
                <div className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Updating...
                </div>
              ) : (
                "Update Personal Info"
              )}
            </button>
          </div>
        </form>
      )}

      {/* Business Information Tab */}
      {activeTab === "business" && (
        <form
          onSubmit={handleBusinessSubmit}
          className="max-w-2xl space-y-4 sm:space-y-6 bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div>
            <h3 className="font-bold text-base sm:text-lg mb-2 text-gray-900 dark:text-white">
              Business Information
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4">
              Update your business details and information.
            </p>
          </div>

          {businessError && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm">{businessError}</p>
                </div>
              </div>
            </div>
          )}

          {businessSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-green-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm">{businessSuccess}</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Business Name *
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 sm:p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base"
              value={businessForm.business_name}
              onChange={(e) =>
                setBusinessForm({
                  ...businessForm,
                  business_name: e.target.value,
                })
              }
              required
              placeholder="Enter your business name"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Business Address *
            </label>
            <textarea
              rows="3"
              className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 sm:p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base"
              value={businessForm.business_address}
              onChange={(e) =>
                setBusinessForm({
                  ...businessForm,
                  business_address: e.target.value,
                })
              }
              required
              placeholder="Enter your business address"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Serial Number
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 sm:p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base"
              value={businessForm.serial_no}
              onChange={(e) =>
                setBusinessForm({ ...businessForm, serial_no: e.target.value })
              }
              placeholder="Enter serial number (if applicable)"
            />
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="w-full sm:w-auto bg-primary hover:bg-primary-dark text-white px-4 sm:px-6 py-2 sm:py-3 rounded-md font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              disabled={loadingBusiness}
            >
              {loadingBusiness ? (
                <div className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Updating...
                </div>
              ) : (
                "Update Business Info"
              )}
            </button>
          </div>
        </form>
      )}

      {/* Documents Tab */}
      {activeTab === "documents" && (
        <div className="max-w-2xl space-y-4 sm:space-y-6 bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="font-bold text-base sm:text-lg mb-2 text-gray-900 dark:text-white">
              Documents
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4">
              View your uploaded documents. Contact support to update documents.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <DocumentCard
              title="Utility Bill"
              url={merchant?.utility_bill_url}
              alt="Utility Bill"
            />

            <DocumentCard
              title="Passport Photo"
              url={merchant?.passport_url}
              alt="Passport Photo"
            />

            <DocumentCard
              title="Business Picture"
              url={merchant?.business_pic_url}
              alt="Business Picture"
            />

            <DocumentCard
              title="NIN Slip"
              url={merchant?.nin_slip_url}
              alt="NIN Slip"
            />
          </div>

          {/* Status info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
              ℹ️ Document Display Status
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
              Document images are temporarily disabled to prevent 404 errors.
              All documents are safely stored in the database.
            </p>
            <button
              onClick={() => {
                toast(
                  "To re-enable images:\n1. Fix the Cloudinary upload issue\n2. Update the DocumentCard component\n3. Set shouldShowImage = true",
                  { duration: 8000 }
                );
              }}
              className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
            >
              How to Re-enable Images
            </button>
          </div>

          {/* Debug info in development
          {process.env.NODE_ENV === "development" && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3 rounded-md">
              <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                Debug: Document URLs
              </h4>
              <div className="text-xs text-yellow-700 dark:text-yellow-300 space-y-2">
                <div>
                  <strong>Utility Bill Raw:</strong>{" "}
                  {JSON.stringify(merchant?.utility_bill_url) || "Not set"}
                </div>
                <div>
                  <strong>Utility Bill Extracted:</strong>{" "}
                  {(() => {
                    const getImageUrl = (urlData) => {
                      if (!urlData) return null;
                      let extractedUrl = null;

                      if (
                        typeof urlData === "string" &&
                        !urlData.startsWith("{")
                      ) {
                        extractedUrl = urlData;
                      } else if (typeof urlData === "object" && urlData.url) {
                        extractedUrl = urlData.url;
                      } else if (
                        typeof urlData === "string" &&
                        urlData.startsWith("{")
                      ) {
                        try {
                          const parsed = JSON.parse(urlData);
                          extractedUrl = parsed.url || null;
                        } catch (e) {
                          return null;
                        }
                      }

                      if (!extractedUrl) return null;

                      // Fix double folder issue: v-money/v-money/ -> v-money/
                      if (extractedUrl.includes("/v-money/v-money/")) {
                        extractedUrl = extractedUrl.replace(
                          "/v-money/v-money/",
                          "/v-money/"
                        );
                      }

                      // Clean up double extensions
                      if (extractedUrl.includes(".png.png")) {
                        extractedUrl = extractedUrl.replace(".png.png", ".png");
                      }

                      return extractedUrl;
                    };
                    return (
                      getImageUrl(merchant?.utility_bill_url) ||
                      "Failed to extract"
                    );
                  })()}
                </div>
                <div>
                  <strong>Cleaned URL:</strong>{" "}
                  <a
                    href={(() => {
                      const getImageUrl = (urlData) => {
                        if (!urlData) return null;
                        let extractedUrl = null;

                        if (
                          typeof urlData === "string" &&
                          !urlData.startsWith("{")
                        ) {
                          extractedUrl = urlData;
                        } else if (typeof urlData === "object" && urlData.url) {
                          extractedUrl = urlData.url;
                        } else if (
                          typeof urlData === "string" &&
                          urlData.startsWith("{")
                        ) {
                          try {
                            const parsed = JSON.parse(urlData);
                            extractedUrl = parsed.url || null;
                          } catch (e) {
                            return null;
                          }
                        }

                        if (!extractedUrl) return null;

                        // Fix double folder issue: v-money/v-money/ -> v-money/
                        if (extractedUrl.includes("/v-money/v-money/")) {
                          extractedUrl = extractedUrl.replace(
                            "/v-money/v-money/",
                            "/v-money/"
                          );
                        }

                        if (extractedUrl.includes(".png.png")) {
                          extractedUrl = extractedUrl.replace(
                            ".png.png",
                            ".png"
                          );
                        }

                        return extractedUrl;
                      };
                      return getImageUrl(merchant?.utility_bill_url);
                    })()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline text-xs break-all"
                  >
                    Test Direct Link
                  </a>
                </div>
                <div>
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch(
                          "/api/merchants/debug/cloudinary",
                          {
                            headers: {
                              Authorization: `Bearer ${localStorage.getItem("token")}`,
                            },
                          }
                        );
                        const data = await response.json();
                        console.log("Cloudinary Resources:", data);
                        toast.success(`Found ${data.totalCount} files on Cloudinary. Check console for details.`);
                      } catch (error) {
                        console.error(
                          "Failed to fetch Cloudinary resources:",
                          error
                        );
                        toast.error("Failed to check Cloudinary resources");
                      }
                    }}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                  >
                    Check What's on Cloudinary
                  </button>
                </div>
                <hr className="border-yellow-300 dark:border-yellow-600" />
                <div>
                  <strong>All URLs Status:</strong>
                  <ul className="ml-4 mt-1">
                    <li>Utility: {merchant?.utility_bill_url ? "✓" : "✗"}</li>
                    <li>Passport: {merchant?.passport_url ? "✓" : "✗"}</li>
                    <li>Business: {merchant?.business_pic_url ? "✓" : "✗"}</li>
                    <li>NIN: {merchant?.nin_slip_url ? "✓" : "✗"}</li>
                  </ul>
                </div>
              </div>
            </div>
          )} */}

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-blue-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Document Updates
                </h4>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  To update your documents, please contact our support team.
                  Document changes require verification for security purposes.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 p-3 sm:p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2 text-sm sm:text-base">
              Verification Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">BVN:</span>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {merchant?.bvn
                    ? `***${merchant.bvn.slice(-4)}`
                    : "Not provided"}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">NIN:</span>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {merchant?.nin
                    ? `***${merchant.nin.slice(-4)}`
                    : "Not provided"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Tab */}
      {activeTab === "password" && (
        <form
          onSubmit={handlePasswordSubmit}
          className="max-w-md space-y-4 sm:space-y-6 bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div>
            <h3 className="font-bold text-base sm:text-lg mb-2 text-gray-900 dark:text-white">
              Change Password
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4">
              Update your password to keep your account secure. Make sure to use
              a strong password.
            </p>
          </div>

          {passwordError && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm">{passwordError}</p>
                </div>
              </div>
            </div>
          )}

          {passwordSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-green-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm">{passwordSuccess}</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Current Password *
            </label>
            <input
              type="password"
              className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 sm:p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base"
              value={passwordForm.current}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, current: e.target.value })
              }
              required
              placeholder="Enter your current password"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              New Password *
            </label>
            <input
              type="password"
              className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 sm:p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base"
              value={passwordForm.new}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, new: e.target.value })
              }
              required
              minLength="8"
              placeholder="Enter your new password"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Password must be at least 8 characters long
            </p>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Confirm New Password *
            </label>
            <input
              type="password"
              className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 sm:p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base"
              value={passwordForm.confirm}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, confirm: e.target.value })
              }
              required
              placeholder="Confirm your new password"
            />
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-blue-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Password Security Tips
                </h4>
                <ul className="text-xs text-blue-700 dark:text-blue-300 mt-1 list-disc list-inside">
                  <li>Use a combination of letters, numbers, and symbols</li>
                  <li>Avoid using personal information</li>
                  <li>Don't reuse passwords from other accounts</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="w-full sm:w-auto bg-primary hover:bg-primary-dark text-white px-4 sm:px-6 py-2 sm:py-3 rounded-md font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              disabled={loadingPassword}
            >
              {loadingPassword ? (
                <div className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Updating...
                </div>
              ) : (
                "Change Password"
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
