import React, { useState } from "react";
import { motion } from "framer-motion";
import { Upload } from "lucide-react";
import PageHeader from "../../components/UI/PageHeader";
import Button from "../../components/UI/Button";
import { uploadApi } from "../../api/client";

const FileUpload = () => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [message, setMessage] = useState("");

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setMessage("Please select files to upload");
      return;
    }

    setUploading(true);
    setMessage("");

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });

      const response = await uploadApi.multiple(formData);

      setUploadedFiles((prev) => [...prev, ...response.data.files]);
      setFiles([]);
      setMessage("Files uploaded successfully!");

      // Clear file input
      document.getElementById("fileInput").value = "";
    } catch (error) {
      setMessage("Error uploading files");
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = (url) => {
    navigator.clipboard.writeText(url);
    setMessage("URL copied to clipboard!");
    setTimeout(() => setMessage(""), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <PageHeader
        title="File Upload"
        subtitle="Upload and manage files"
        icon={Upload}
      />

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Files
            </label>
            <input
              id="fileInput"
              type="file"
              multiple
              onChange={handleFileSelect}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md"
              accept="image/*,.pdf,.doc,.docx"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Supported formats: Images (jpg, png, gif).
            </p>
          </div>

          {files.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Selected Files:</h4>
              <ul className="space-y-1">
                {files.map((file, index) => (
                  <li key={index} className="text-sm text-gray-600 dark:text-gray-400">
                    {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </li>
                ))}
              </ul>
            </div>
          )}

          {message && (
            <div
              className={`p-4 rounded-md ${
                message.includes("Error")
                  ? "bg-red-100 text-red-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {message}
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={uploading || files.length === 0}
            className="w-full sm:w-auto bg-primary text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Upload Files"}
          </button>
        </div>
      </div>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Uploaded Files</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
                <div className="mb-2">
                  {file.url.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                    <img
                      src={file.url}
                      alt={file.originalName}
                      className="w-full h-32 object-cover rounded"
                    />
                  ) : (
                    <div className="w-full h-32 bg-gray-100 rounded flex items-center justify-center">
                      <span className="text-gray-500 dark:text-gray-400">📄</span>
                    </div>
                  )}
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {file.originalName}
                </p>
                <div className="mt-2 space-y-1">
                  <button
                    onClick={() => copyToClipboard(file.url)}
                    className="w-full text-xs bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 px-2 py-1 rounded"
                  >
                    Copy URL
                  </button>
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-xs bg-primary text-white text-center px-2 py-1 rounded hover:bg-blue-700"
                  >
                    View File
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default FileUpload;
