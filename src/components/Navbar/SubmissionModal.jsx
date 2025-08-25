import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function SubmissionModal({ open, onClose, email }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
          >
            <h2 className="text-2xl font-bold mb-4 text-primary">
              Submission Successful!
            </h2>
            <p className="mb-4 text-gray-700">
              Thank you for submitting your onboarding form.
              {email && (
                <span>
                  {" "}
                  A confirmation has been sent to{" "}
                  <span className="font-semibold">{email}</span>.
                </span>
              )}
            </p>
            <button
              className="mt-4 px-6 py-2 bg-primary text-white rounded hover:bg-green-600"
              onClick={onClose}
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
