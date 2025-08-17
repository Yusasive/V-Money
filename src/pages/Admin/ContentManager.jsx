import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";

const ContentManager = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSection, setModalSection] = useState(null);
  const [modalContent, setModalContent] = useState({});

  const openEditModal = (section) => {
    setModalSection(section);
    setModalContent(content);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalSection(null);
    setModalContent({});
  };
  const [selectedSection] = useState("hero");
  const [content, setContent] = useState({});
  // Removed unused loading state
  // Removed unused message state

  const sections = [
    {
      id: "hero",
      name: "Hero Section",
      fields: ["title", "subtitle", "description", "buttonText", "buttonLink"],
    },
    {
      id: "main1",
      name: "Main Section 1",
      fields: ["title", "description", "buttonText", "buttonLink"],
    },
    {
      id: "main2",
      name: "Main Section 2",
      fields: ["title", "description", "buttonText", "buttonLink", "imageUrl"],
    },
    {
      id: "main3",
      name: "Main Section 3",
      fields: ["title", "description", "buttonText", "buttonLink", "imageUrl"],
    },
    {
      id: "main4",
      name: "Main Section 4",
      fields: ["title", "description", "buttonText", "buttonLink", "imageUrl"],
    },
    { id: "suite", name: "Suite Section", fields: ["title", "features"] },
    { id: "credit", name: "Credit Section", fields: ["title", "features"] },
    { id: "faq", name: "FAQ Section", fields: ["title", "faqs"] },
    {
      id: "testimonial",
      name: "Testimonials",
      fields: ["title", "testimonials"],
    },
    {
      id: "pricing",
      name: "Pricing Section",
      fields: ["title", "description", "pricing"],
    },
  ];

  // Move fetchContent above useEffect and wrap in useCallback
  const fetchContent = React.useCallback(async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await axios.get(
        `http://localhost:5000/api/content/${selectedSection}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setContent(response.data);
    } catch (error) {
      if (error.response?.status === 404) {
        setContent({ section: selectedSection });
      }
    }
  }, [selectedSection]);

  useEffect(() => {
    fetchContent();
  }, [selectedSection, fetchContent]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <h2 className="text-3xl font-bold text-gray-900 font-lota">
        Content Manager
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section) => {
          // Get content for this section
          const sectionContent = section.id === selectedSection ? content : {};
          return (
            <div
              key={section.id}
              className="bg-white rounded-lg shadow p-6 relative"
            >
              <h3 className="text-xl font-semibold mb-4">{section.name}</h3>
              {/* Display fields */}
              <div className="space-y-2 mb-4">
                {section.fields.map((field) => {
                  // Array fields
                  if (
                    ["features", "faqs", "testimonials", "pricing"].includes(
                      field
                    )
                  ) {
                    const items = sectionContent[field] || [];
                    if (items.length === 0) return null;
                    return (
                      <div key={field}>
                        <div className="font-medium text-gray-700 mb-1 capitalize">
                          {field.replace(/([A-Z])/g, " $1").trim()}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {items.map((item, idx) => (
                            <div
                              key={idx}
                              className="bg-gray-100 rounded p-2 flex items-center gap-2"
                            >
                              {/* Features */}
                              {field === "features" && (
                                <>
                                  <span className="inline-block bg-blue-200 text-blue-800 px-2 py-1 rounded text-xs font-semibold mr-2">
                                    {item.title}
                                  </span>
                                  <span className="text-gray-600 text-xs">
                                    {item.description}
                                  </span>
                                </>
                              )}
                              {/* FAQs */}
                              {field === "faqs" && (
                                <>
                                  <span className="inline-block bg-yellow-200 text-yellow-800 px-2 py-1 rounded text-xs font-semibold mr-2">
                                    Q: {item.question}
                                  </span>
                                  <span className="text-gray-600 text-xs">
                                    A: {item.answer}
                                  </span>
                                </>
                              )}
                              {/* Testimonials */}
                              {field === "testimonials" && (
                                <>
                                  {item.imageUrl && (
                                    <img
                                      src={item.imageUrl}
                                      alt="testimonial"
                                      className="h-8 w-8 object-cover rounded-full mr-2"
                                    />
                                  )}
                                  <span className="inline-block bg-green-200 text-green-800 px-2 py-1 rounded text-xs font-semibold mr-2">
                                    {item.name}
                                  </span>
                                  <span className="text-gray-600 text-xs">
                                    {item.occupation}
                                  </span>
                                </>
                              )}
                              {/* Pricing */}
                              {field === "pricing" && (
                                <>
                                  <span className="inline-block bg-purple-200 text-purple-800 px-2 py-1 rounded text-xs font-semibold mr-2">
                                    {item.title}
                                  </span>
                                  <span className="text-gray-600 text-xs">
                                    {item.amount}
                                  </span>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  // Image field
                  if (field === "imageUrl" && sectionContent.imageUrl) {
                    return (
                      <div key={field} className="flex items-center gap-2">
                        <span className="font-medium text-gray-700 mb-1">
                          Image:
                        </span>
                        <img
                          src={sectionContent.imageUrl}
                          alt="section"
                          className="h-10 w-10 object-cover rounded"
                        />
                      </div>
                    );
                  }
                  // Default: text fields
                  if (sectionContent[field]) {
                    return (
                      <div key={field}>
                        <span className="font-medium text-gray-700 mr-2 capitalize">
                          {field.replace(/([A-Z])/g, " $1").trim()}:
                        </span>
                        {field === "buttonLink" ? (
                          <span className="text-gray-800">
                            {sectionContent[field]}
                          </span>
                        ) : (
                          <span className="text-gray-800">
                            {sectionContent[field]}
                          </span>
                        )}
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                  onClick={() => {
                    setModalSection(section);
                    setModalContent(sectionContent);
                    setModalOpen(true);
                  }}
                >
                  View
                </button>
                <button
                  type="button"
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                  onClick={() => openEditModal(section)}
                >
                  Edit
                </button>
              </div>
            </div>
          );
        })}
        {/* Modal for viewing or editing content */}
        {modalOpen && modalSection && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-xl relative">
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                onClick={closeModal}
              >
                &times;
              </button>
              <h3 className="text-2xl font-semibold mb-4">
                {modalSection.name} Details
              </h3>
              <div className="space-y-4">
                {modalSection.fields.map((field) => {
                  // Array fields
                  if (
                    ["features", "faqs", "testimonials", "pricing"].includes(
                      field
                    )
                  ) {
                    const items = modalContent[field] || [];
                    if (items.length === 0) return null;
                    return (
                      <div key={field}>
                        <div className="font-medium text-gray-700 mb-1 capitalize">
                          {field.replace(/([A-Z])/g, " $1").trim()}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {items.map((item, idx) => (
                            <div
                              key={idx}
                              className="bg-gray-100 rounded p-2 flex items-center gap-2"
                            >
                              {/* Features */}
                              {field === "features" && (
                                <>
                                  <span className="inline-block bg-blue-200 text-blue-800 px-2 py-1 rounded text-xs font-semibold mr-2">
                                    {item.title}
                                  </span>
                                  <span className="text-gray-600 text-xs">
                                    {item.description}
                                  </span>
                                </>
                              )}
                              {/* FAQs */}
                              {field === "faqs" && (
                                <>
                                  <span className="inline-block bg-yellow-200 text-yellow-800 px-2 py-1 rounded text-xs font-semibold mr-2">
                                    Q: {item.question}
                                  </span>
                                  <span className="text-gray-600 text-xs">
                                    A: {item.answer}
                                  </span>
                                </>
                              )}
                              {/* Testimonials */}
                              {field === "testimonials" && (
                                <>
                                  {item.imageUrl && (
                                    <img
                                      src={item.imageUrl}
                                      alt="testimonial"
                                      className="h-8 w-8 object-cover rounded-full mr-2"
                                    />
                                  )}
                                  <span className="inline-block bg-green-200 text-green-800 px-2 py-1 rounded text-xs font-semibold mr-2">
                                    {item.name}
                                  </span>
                                  <span className="text-gray-600 text-xs">
                                    {item.occupation}
                                  </span>
                                </>
                              )}
                              {/* Pricing */}
                              {field === "pricing" && (
                                <>
                                  <span className="inline-block bg-purple-200 text-purple-800 px-2 py-1 rounded text-xs font-semibold mr-2">
                                    {item.title}
                                  </span>
                                  <span className="text-gray-600 text-xs">
                                    {item.amount}
                                  </span>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  // Image field
                  if (field === "imageUrl" && modalContent.imageUrl) {
                    return (
                      <div key={field} className="flex items-center gap-2">
                        <span className="font-medium text-gray-700 mb-1">
                          Image:
                        </span>
                        <img
                          src={modalContent.imageUrl}
                          alt="section"
                          className="h-16 w-16 object-cover rounded"
                        />
                      </div>
                    );
                  }
                  // Default: text fields
                  if (modalContent[field]) {
                    return (
                      <div key={field}>
                        <span className="font-medium text-gray-700 mr-2 capitalize">
                          {field.replace(/([A-Z])/g, " $1").trim()}:
                        </span>
                        {field === "buttonLink" ? (
                          <span className="text-gray-800">
                            {modalContent[field]}
                          </span>
                        ) : (
                          <span className="text-gray-800">
                            {modalContent[field]}
                          </span>
                        )}
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  type="button"
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                  onClick={() => openEditModal(modalSection)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                  onClick={closeModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ContentManager;
