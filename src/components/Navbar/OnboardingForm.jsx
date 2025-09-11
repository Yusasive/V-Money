import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formsApi } from "../../api/client";
import SubmissionModal from "./SubmissionModal";

const steps = ["Documentation", "Requirements"];

export default function OnboardingForm({
  initialData = {},
  initialFiles = {},
  isEdit = false,
  protectedFields = ["bvn", "nin", "serialNo"],
  onSaveText,
}) {
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    gender: "",
    phone: "",
    email: "",
    username: "",
    address: "",
    state: "",
    lga: "",
    bvn: "",
    nin: "",
    businessName: "",
    businessAddress: "",
    serialNo: "",
    utilityBill: null,
    passport: null,
    businessPic: null,
    ninSlip: null,
  });
  const [previews, setPreviews] = useState({
    utilityBill: null,
    passport: null,
    businessPic: null,
    ninSlip: null,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Per-field validation state
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [attemptedNext, setAttemptedNext] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("onboardingForm");
      if (saved) {
        const parsed = JSON.parse(saved);
        setFormData((prev) => ({ ...prev, ...parsed }));
      } else if (initialData && Object.keys(initialData).length) {
        // prefill from passed initialData (email/username or full onboardingData)
        setFormData((prev) => ({ ...prev, ...initialData }));
      }
    } catch {}
  }, [initialData]);

  // Initialize previews from any provided initialFiles (fieldName -> url)
  useEffect(() => {
    try {
      if (initialFiles && Object.keys(initialFiles).length) {
        setPreviews((p) => ({ ...p, ...initialFiles }));
      }
    } catch {}
  }, [initialFiles]);

  useEffect(() => {
    try {
      const { utilityBill, passport, businessPic, ninSlip, ...textOnly } =
        formData;
      localStorage.setItem("onboardingForm", JSON.stringify(textOnly));
    } catch {}
  }, [formData]);

  const requiredStep0 = [
    "firstName",
    "lastName",
    "gender",
    "phone",
    "email",
    "username",
    "address",
    "state",
    "lga",
    "bvn",
    "nin",
  ];

  function validateField(name, value) {
    // Required checks
    if (requiredStep0.includes(name)) {
      if (!value || (typeof value === "string" && value.trim() === "")) {
        return "This field is required.";
      }
    }

    // Specific format checks
    if (name === "phone" && value) {
      if (!/^[0-9]{10,14}$/.test(value)) return "Phone must be 10–14 digits.";
    }
    if (name === "email" && value) {
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value))
        return "Enter a valid email.";
    }
    if (name === "bvn" && value) {
      if (!/^[0-9]{11}$/.test(value)) return "BVN must be 11 digits.";
    }
    if (name === "nin" && value) {
      if (!/^[0-9]{11}$/.test(value)) return "NIN must be 11 digits.";
    }
    if (name === "username" && value) {
      if (typeof value === "string" && value.trim().length < 3)
        return "Username must be at least 3 characters.";
    }

    return "";
  }

  function validateAllStep0(currentData) {
    const errors = {};
    for (const key of requiredStep0) {
      const msg = validateField(key, currentData[key]);
      if (msg) errors[key] = msg;
    }
    return errors;
  }

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    // File inputs: validate image and create preview
    if (files && files[0]) {
      const file = files[0];
      const isImage = file.type.startsWith("image/");

      if (!isImage) {
        setError("Please upload an image file (JPEG, PNG, GIF, WEBP, etc.)");
        setFormData((prev) => ({ ...prev, [name]: null }));
        setPreviews((prev) => ({ ...prev, [name]: null }));
        return;
      }

      setError("");

      // Revoke old preview URL if exists to avoid memory leaks
      setPreviews((prev) => {
        if (prev[name]) URL.revokeObjectURL(prev[name]);
        return { ...prev, [name]: URL.createObjectURL(file) };
      });

      setFormData((prev) => ({ ...prev, [name]: file }));
      return;
    }

    // Non-file inputs
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      // Live-validate the changed field
      const msg = validateField(name, next[name]);
      setFieldErrors((errs) => {
        const n = { ...errs };
        if (msg) n[name] = msg;
        else delete n[name];
        return n;
      });
      return next;
    });
  };

  const nextStep = () =>
    setStep((prev) => Math.min(prev + 1, steps.length - 1));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 0));

  function touchAllStep0() {
    setTouched((t) => ({
      ...t,
      firstName: true,
      lastName: true,
      gender: true,
      phone: true,
      email: true,
      address: true,
      state: true,
      lga: true,
      bvn: true,
      nin: true,
    }));
  }

  const guardedNext = () => {
    setAttemptedNext(true);
    touchAllStep0();

    const errors = validateAllStep0(formData);
    setFieldErrors(errors);

    if (Object.keys(errors).length) {
      setError("Please fix the highlighted fields.");
      return;
    }
    setError("");
    nextStep();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAttemptedSubmit(true);
    setLoading(true);
    setError("");

    // Validate required files before submit. In edit mode, existing previews satisfy the requirement.
    const fileFields = ["utilityBill", "passport", "businessPic", "ninSlip"];
    const missingFiles = fileFields.filter((k) => !formData[k] && !previews[k]);
    if (missingFiles.length) {
      setError(`Please upload: ${missingFiles.join(", ")}`);
      setLoading(false);
      return;
    }

    const submitData = new FormData();
    submitData.append("formType", "onboarding");

    // Append text data
    Object.keys(formData).forEach((key) => {
      if (formData[key] && typeof formData[key] !== "object") {
        submitData.append(key, formData[key]);
      }
    });

    // Append files
    ["utilityBill", "passport", "businessPic", "ninSlip"].forEach(
      (fileField) => {
        if (formData[fileField]) {
          submitData.append("files", formData[fileField]);
        }
      }
    );

    try {
      await formsApi.submit(submitData);

      // Revoke preview URLs after successful submit to avoid leaking
      Object.values(previews).forEach((url) => url && URL.revokeObjectURL(url));
      setPreviews({
        utilityBill: null,
        passport: null,
        businessPic: null,
        ninSlip: null,
      });

      setFormData({
        firstName: "",
        middleName: "",
        lastName: "",
        gender: "",
        phone: "",
        email: "",
        address: "",
        state: "",
        lga: "",
        bvn: "",
        nin: "",
        businessName: "",
        businessAddress: "",
        serialNo: "",
        username: "",
        utilityBill: null,
        passport: null,
        businessPic: null,
        ninSlip: null,
      });
      setTouched({});
      setFieldErrors({});
      setAttemptedNext(false);
      setAttemptedSubmit(false);
      setStep(0);
      setShowModal(true);
      // If parent wants to persist text-only fields (profile edit), notify it
      try {
        const textOnly = {};
        Object.keys(formData).forEach((key) => {
          if (formData[key] && typeof formData[key] !== "object")
            textOnly[key] = formData[key];
        });
        if (onSaveText) await onSaveText(textOnly);
      } catch (e) {
        // ignore parent save errors here; parent will show its own toast
        console.debug("onSaveText hook failed", e?.message || e);
      }
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Error submitting form. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Cleanup previews on unmount
  useEffect(() => {
    return () => {
      Object.values(previews).forEach((url) => url && URL.revokeObjectURL(url));
    };
  }, [previews]);

  // Upload card component for nicer file input UX
  function UploadCard({ label, name, hasError }) {
    const hasFile = !!previews[name];
    return (
      <div
        className={`border rounded-md p-4 ${hasError ? "border-red-500" : ""}`}
      >
        <p className="text-gray-700 font-medium mb-2">
          {label} <span className="text-red-500">*</span>
        </p>

        {!hasFile ? (
          <label
            className={`block border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover:bg-gray-50 ${
              hasError ? "border-red-500" : "border-gray-300"
            }`}
          >
            <span className={`text-gray-600 ${hasError ? "text-red-600" : ""}`}>
              Click to upload or drag and drop
            </span>
            <input
              type="file"
              name={name}
              accept="image/*"
              onChange={handleChange}
              className="hidden"
            />
          </label>
        ) : (
          <div className="flex items-center gap-4">
            <img
              src={previews[name]}
              alt={`${label} preview`}
              className="h-24 w-24 object-cover rounded-md border"
            />
            <div className="flex gap-2">
              <label className="px-3 py-2 rounded-md bg-gray-100 border cursor-pointer hover:bg-gray-200">
                Change
                <input
                  type="file"
                  name={name}
                  accept="image/*"
                  onChange={handleChange}
                  className="hidden"
                />
              </label>
              <button
                type="button"
                onClick={() => {
                  setFormData((p) => ({ ...p, [name]: null }));
                  setPreviews((p) => {
                    if (p[name]) URL.revokeObjectURL(p[name]);
                    return { ...p, [name]: null };
                  });
                }}
                className="px-3 py-2 rounded-md bg-red-50 text-red-600 border hover:bg-red-100"
              >
                Remove
              </button>
            </div>
          </div>
        )}

        {hasError && (
          <p className="mt-2 text-sm text-red-600">This file is required.</p>
        )}
      </div>
    );
  }

  const showErrorFor = (name) =>
    (touched[name] || attemptedNext) && fieldErrors[name];
  const inputClass = (name) =>
    `w-full border p-2 rounded-md focus:outline-none focus:ring-2 ${
      showErrorFor(name)
        ? "border-red-500 focus:ring-red-500"
        : "focus:ring-primary"
    }`;

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <SubmissionModal
        open={showModal}
        onClose={() => setShowModal(false)}
        email={formData.email}
      />
      {/* Step Indicator */}
      <div className="flex items-center justify-between mb-6">
        {steps.map((s, i) => (
          <div key={i} className="flex-1 flex items-center">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold ${
                step === i
                  ? "bg-primary text-white"
                  : step > i
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-600"
              }`}
            >
              {i + 1}
            </div>
            <span
              className={`ml-2 font-medium ${step === i ? "text-primary" : "text-gray-600"}`}
            >
              {s}
            </span>
            {i < steps.length - 1 && (
              <div className="flex-1 h-1 mx-3 bg-gray-200 rounded">
                <div
                  className={`h-1 rounded ${step > i ? "bg-green-500 w-full" : "bg-gray-200 w-0"}`}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4 }}
            className="space-y-4"
          >
            <h2 className="text-xl font-bold text-primary">
              Documentation for Onboarding Agent
            </h2>

            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-md border border-red-200">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* First Name */}
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-gray-700 font-medium"
                >
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="firstName"
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  onBlur={() => setTouched((t) => ({ ...t, firstName: true }))}
                  required
                  className={inputClass("firstName")}
                  placeholder="John"
                />
                {showErrorFor("firstName") && (
                  <p className="mt-1 text-sm text-red-600">
                    {fieldErrors.firstName}
                  </p>
                )}
              </div>

              {/* Middle Name */}
              <div>
                <label
                  htmlFor="middleName"
                  className="block text-gray-700 font-medium"
                >
                  Middle Name
                </label>
                <input
                  id="middleName"
                  type="text"
                  name="middleName"
                  value={formData.middleName}
                  onChange={handleChange}
                  className="w-full border p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Michael"
                />
              </div>

              {/* Last Name */}
              <div>
                <label
                  htmlFor="lastName"
                  className="block text-gray-700 font-medium"
                >
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="lastName"
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  onBlur={() => setTouched((t) => ({ ...t, lastName: true }))}
                  required
                  className={inputClass("lastName")}
                  placeholder="Doe"
                />
                {showErrorFor("lastName") && (
                  <p className="mt-1 text-sm text-red-600">
                    {fieldErrors.lastName}
                  </p>
                )}
              </div>

              {/* Gender */}
              <div>
                <label
                  htmlFor="gender"
                  className="block text-gray-700 font-medium"
                >
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  onBlur={() => setTouched((t) => ({ ...t, gender: true }))}
                  required
                  className={inputClass("gender") + " bg-white"}
                >
                  <option value="">Select...</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                  <option>Prefer not to say</option>
                </select>
                {showErrorFor("gender") && (
                  <p className="mt-1 text-sm text-red-600">
                    {fieldErrors.gender}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label
                  htmlFor="phone"
                  className="block text-gray-700 font-medium"
                >
                  Phone No. <span className="text-red-500">*</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^0-9]/g, "");
                    handleChange({ target: { name: "phone", value: v } });
                  }}
                  onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
                  inputMode="tel"
                  pattern="^[0-9]{10,14}$"
                  placeholder="08012345678"
                  required
                  className={inputClass("phone")}
                />
                {showErrorFor("phone") && (
                  <p className="mt-1 text-sm text-red-600">
                    {fieldErrors.phone}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-gray-700 font-medium"
                >
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your_email@email.com"
                  onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                  required
                  className={inputClass("email")}
                />
                {showErrorFor("email") && (
                  <p className="mt-1 text-sm text-red-600">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              {/* Username */}
              <div>
                <label
                  htmlFor="username"
                  className="block text-gray-700 font-medium"
                >
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  id="username"
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="your-username"
                  onBlur={() => setTouched((t) => ({ ...t, username: true }))}
                  required
                  className={inputClass("username")}
                />
                {showErrorFor("username") && (
                  <p className="mt-1 text-sm text-red-600">
                    {fieldErrors.username}
                  </p>
                )}
              </div>

              {/* State */}
              <div>
                <label
                  htmlFor="state"
                  className="block text-gray-700 font-medium"
                >
                  State <span className="text-red-500">*</span>
                </label>
                <input
                  id="state"
                  type="text"
                  name="state"
                  placeholder="Lagos"
                  value={formData.state}
                  onChange={handleChange}
                  onBlur={() => setTouched((t) => ({ ...t, state: true }))}
                  required
                  className={inputClass("state")}
                />
                {showErrorFor("state") && (
                  <p className="mt-1 text-sm text-red-600">
                    {fieldErrors.state}
                  </p>
                )}
              </div>

              {/* LGA */}
              <div>
                <label
                  htmlFor="lga"
                  className="block text-gray-700 font-medium"
                >
                  Local Government <span className="text-red-500">*</span>
                </label>
                <input
                  id="lga"
                  type="text"
                  name="lga"
                  value={formData.lga}
                  onChange={handleChange}
                  placeholder="Ikeja"
                  onBlur={() => setTouched((t) => ({ ...t, lga: true }))}
                  required
                  className={inputClass("lga")}
                />
                {showErrorFor("lga") && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.lga}</p>
                )}
              </div>

              {/* BVN */}
              <div>
                <label
                  htmlFor="bvn"
                  className="block text-gray-700 font-medium"
                >
                  Bank Verification Number{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  id="bvn"
                  type="text"
                  name="bvn"
                  value={formData.bvn}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 11);
                    handleChange({ target: { name: "bvn", value: v } });
                  }}
                  onBlur={() => setTouched((t) => ({ ...t, bvn: true }))}
                  inputMode="numeric"
                  maxLength={11}
                  pattern="^[0-9]{11}$"
                  placeholder="11 digits"
                  required
                  disabled={isEdit && protectedFields.includes("bvn")}
                  className={inputClass("bvn")}
                />
                {showErrorFor("bvn") && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.bvn}</p>
                )}
                {isEdit && protectedFields.includes("bvn") && (
                  <p className="text-sm text-gray-500 mt-1">
                    To change BVN, please{" "}
                    <a
                      href="mailto:admin@example.com"
                      className="text-primary underline"
                    >
                      contact admin
                    </a>
                    .
                  </p>
                )}
              </div>

              {/* NIN */}
              <div>
                <label
                  htmlFor="nin"
                  className="block text-gray-700 font-medium"
                >
                  National Identity Number{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  id="nin"
                  type="text"
                  name="nin"
                  value={formData.nin}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 11);
                    handleChange({ target: { name: "nin", value: v } });
                  }}
                  onBlur={() => setTouched((t) => ({ ...t, nin: true }))}
                  inputMode="numeric"
                  maxLength={11}
                  pattern="^[0-9]{11}$"
                  placeholder="11 digits"
                  required
                  disabled={isEdit && protectedFields.includes("nin")}
                  className={inputClass("nin")}
                />
                {showErrorFor("nin") && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.nin}</p>
                )}
                {isEdit && protectedFields.includes("nin") && (
                  <p className="text-sm text-gray-500 mt-1">
                    To change NIN, please{" "}
                    <a
                      href="mailto:admin@example.com"
                      className="text-primary underline"
                    >
                      contact admin
                    </a>
                    .
                  </p>
                )}
              </div>

              {/* Business Name */}
              <div>
                <label
                  htmlFor="businessName"
                  className="block text-gray-700 font-medium"
                >
                  Business Name
                </label>
                <input
                  id="businessName"
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  className="w-full border p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Serial Number of POS */}
              <div>
                <label
                  htmlFor="serialNo"
                  className="block text-gray-700 font-medium"
                >
                  Serial Number of Pos
                </label>
                <input
                  id="serialNo"
                  type="text"
                  name="serialNo"
                  value={formData.serialNo}
                  onChange={handleChange}
                  disabled={isEdit && protectedFields.includes("serialNo")}
                  className="w-full border p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {isEdit && protectedFields.includes("serialNo") && (
                  <p className="text-sm text-gray-500 mt-1">
                    To change POS serial number, please{" "}
                    <a
                      href="mailto:admin@example.com"
                      className="text-primary underline"
                    >
                      contact admin
                    </a>
                    .
                  </p>
                )}
              </div>

              {/* Address - full width */}
              <div className="md:col-span-2">
                <label
                  htmlFor="address"
                  className="block text-gray-700 font-medium"
                >
                  Address <span className="text-red-500">*</span>
                </label>
                <input
                  id="address"
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  onBlur={() => setTouched((t) => ({ ...t, address: true }))}
                  required
                  className={inputClass("address")}
                  placeholder="Street, City"
                />
                {showErrorFor("address") && (
                  <p className="mt-1 text-sm text-red-600">
                    {fieldErrors.address}
                  </p>
                )}
              </div>

              {/* Business Address - full width */}
              <div className="md:col-span-2">
                <label
                  htmlFor="businessAddress"
                  className="block text-gray-700 font-medium"
                >
                  Business Address
                </label>
                <input
                  id="businessAddress"
                  type="text"
                  name="businessAddress"
                  value={formData.businessAddress}
                  onChange={handleChange}
                  className="w-full border p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </motion.div>
        )}

        {step === 1 && (
          <motion.form
            key="step2"
            onSubmit={handleSubmit}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4 }}
            className="space-y-4"
          >
            <h2 className="text-xl font-bold text-secondary">
              Requirements for Onboarding
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <UploadCard
                label="Utility Bill Picture"
                name="utilityBill"
                hasError={attemptedSubmit && !formData.utilityBill}
              />
              <UploadCard
                label="Passport Photograph"
                name="passport"
                hasError={attemptedSubmit && !formData.passport}
              />
              <UploadCard
                label="Business Picture"
                name="businessPic"
                hasError={attemptedSubmit && !formData.businessPic}
              />
              <UploadCard
                label="NIN Slip Picture"
                name="ninSlip"
                hasError={attemptedSubmit && !formData.ninSlip}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-100 text-red-700 p-2 rounded mb-2">
                {error}
              </div>
            )}

            {/* Navigation + Submit */}
            <div className="flex justify-between">
              <button
                type="button"
                onClick={prevStep}
                className="px-12 py-3 rounded-xl bg-gray-300 hover:bg-gray-400"
                disabled={loading}
              >
                Back
              </button>
              <button
                type="submit"
                className="px-12 py-3 rounded-xl bg-secondary text-white hover:bg-orange-600 flex items-center justify-center"
                disabled={loading}
              >
                {loading ? (
                  <span>
                    <svg
                      className="animate-spin h-5 w-5 mr-2 inline-block text-white"
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
                        d="M4 12a8 8 0 018-8v8z"
                      ></path>
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  "Submit"
                )}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Navigation for step 0 */}
      {step === 0 && (
        <div className="flex justify-end mt-6">
          <button
            type="button"
            onClick={guardedNext}
            className="px-12 py-3 rounded-xl bg-primary text-white hover:bg-blue-700"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
