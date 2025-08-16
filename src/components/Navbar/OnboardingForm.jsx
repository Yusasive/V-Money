import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const steps = ["Documentation", "Requirements"];

export default function OnboardingForm() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
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
    utilityBill: null,
    passport: null,
    businessPic: null,
    ninSlip: null,
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const nextStep = () => setStep((prev) => Math.min(prev + 1, steps.length - 1));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 0));

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Final Form Data:", formData);
    alert("Form submitted!");
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      {/* Step Indicator */}
      <div className="flex justify-between mb-6">
        {steps.map((s, i) => (
          <div
            key={i}
            className={`flex-1 text-center py-2 rounded-xl font-semibold ${
              step === i ? "bg-primary text-white" : "bg-gray-200 text-gray-600"
            }`}
          >
            {s}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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
              {[
                { label: "First Name", name: "firstName" },
                { label: "Middle Name", name: "middleName" },
                { label: "Last Name", name: "lastName" },
                { label: "Gender", name: "gender" },
                { label: "Phone No.", name: "phone" },
                { label: "Email Address", name: "email" },
                { label: "Address", name: "address" },
                { label: "State", name: "state" },
                { label: "Local Government", name: "lga" },
                { label: "Bank Verification Number", name: "bvn" },
                { label: "National Identity Number", name: "nin" },
                { label: "Business Name", name: "businessName" },
                { label: "Business Address", name: "businessAddress" },
                { label: "Serial Nom of Pos", name: "serialNo" },
              ].map((field, idx) => (
                <div key={idx}>
                  <label className="block text-gray-700 font-medium">
                    {field.label}
                  </label>
                  <input
                    type="text"
                    name={field.name}
                    value={formData[field.name]}
                    onChange={handleChange}
                    className="w-full border p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              ))}
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4 }}
              className="space-y-4"
            >
              <h2 className="text-xl font-bold text-secondary">
                Requirements for Onboarding
              </h2>
              {[
                { label: "Utility Bill Picture", name: "utilityBill" },
                { label: "Passport Photograph", name: "passport" },
                { label: "Business Picture", name: "businessPic" },
                { label: "NIN Slip Picture", name: "ninSlip" },
              ].map((field, idx) => (
                <div key={idx}>
                  <label className="block text-gray-700 font-medium">
                    {field.label}
                  </label>
                  <input
                    type="file"
                    name={field.name}
                    onChange={handleChange}
                    className="w-full border p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary"
                  />
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          {step > 0 && (
            <button
              type="button"
              onClick={prevStep}
              className="px-4 py-2 rounded-xl bg-gray-300 hover:bg-gray-400"
            >
              Back
            </button>
          )}
          {step < steps.length - 1 ? (
            <button
              type="button"
              onClick={nextStep}
              className="px-12 py-3 rounded-xl bg-primary text-white hover:bg-blue-700"
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              className="px-12 py-3 rounded-xl bg-secondary text-white hover:bg-orange-600"
            >
              Submit
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
