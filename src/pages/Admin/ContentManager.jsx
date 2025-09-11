import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Settings } from "lucide-react";
import PageHeader from "../../components/UI/PageHeader";
import Button from "../../components/UI/Button";
import Modal from "../../components/UI/Modal";
import toast from "react-hot-toast";
import { contentApi, uploadApi } from "../../api/client";

const SECTIONS = [
  {
    id: "hero",
    name: "Hero Section",
    fields: [
      "title",
      "subtitle",
      "description",
      "buttonText",
      "buttonLink",
      "imageUrl",
    ],
  },
  {
    id: "main1",
    name: "Main Section 1",
    fields: ["title", "description", "buttonText", "buttonLink", "imageUrl"],
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

const FIELD_TEMPLATES = {
  features: { icon: "", title: "", description: "" },
  faqs: { question: "", answer: "" },
  testimonials: { name: "", occupation: "", quote: "", imageUrl: "" },
  pricing: { amount: "", title: "", description: "" },
};

// Stable component: view-only renderer for a field
function FieldViewComp({ field, currentDoc, labelize }) {
  const data = currentDoc;
  if (["features", "faqs", "testimonials", "pricing"].includes(field)) {
    const items = data[field] || [];
    if (!items.length) return null;
    return (
      <div className="space-y-2">
        <div className="font-medium text-gray-700 dark:text-gray-200 capitalize">
          {labelize(field)}
        </div>
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="bg-gray-50 dark:bg-gray-900/40 rounded p-3 text-sm text-gray-700 dark:text-gray-200"
            >
              {field === "features" && (
                <>
                  <div className="font-semibold">{item.title}</div>
                  <div className="text-gray-600 dark:text-gray-300">
                    {item.description}
                  </div>
                </>
              )}
              {field === "faqs" && (
                <>
                  <div className="font-semibold">Q: {item.question}</div>
                  <div className="text-gray-600 dark:text-gray-300">
                    A: {item.answer}
                  </div>
                </>
              )}
              {field === "testimonials" && (
                <div className="flex items-start gap-3">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt="testimonial"
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : null}
                  <div>
                    <div className="font-semibold">
                      {item.name}{" "}
                      <span className="text-gray-500 font-normal">
                        {item.occupation}
                      </span>
                    </div>
                    <div className="text-gray-600 dark:text-gray-300 italic">
                      “{item.quote}”
                    </div>
                  </div>
                </div>
              )}
              {field === "pricing" && (
                <>
                  <div className="font-semibold">
                    {item.title} — {item.amount}
                  </div>
                  <div className="text-gray-600 dark:text-gray-300">
                    {item.description}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (field === "imageUrl" && data.imageUrl) {
    return (
      <div className="flex items-center gap-2">
        <span className="font-medium text-gray-700 dark:text-gray-200">
          Image:
        </span>
        <img
          src={data.imageUrl}
          alt="section"
          className="h-12 w-12 object-cover rounded"
        />
      </div>
    );
  }
  if (data[field]) {
    return (
      <div>
        <span className="font-medium text-gray-700 dark:text-gray-200 mr-2 capitalize">
          {labelize(field)}:
        </span>
        <span className="text-gray-800 dark:text-gray-100">{data[field]}</span>
      </div>
    );
  }
  return null;
}

// Stable component: editor renderer for a field
function FieldEditorComp({
  field,
  currentDoc,
  labelize,
  updateField,
  addArrayItem,
  updateArrayField,
  removeArrayItem,
  openImagePicker,
}) {
  if (["features", "faqs", "testimonials", "pricing"].includes(field)) {
    const items = currentDoc[field] || [];
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 capitalize">
            {labelize(field)}
          </label>
          <button
            type="button"
            onClick={() => addArrayItem(field)}
            className="text-xs bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 hover:bg-gray-200 px-2 py-1 rounded text-gray-800 dark:text-gray-200"
          >
            + Add
          </button>
        </div>
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="border rounded p-3 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            >
              {field === "features" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    className="border rounded px-3 py-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400"
                    placeholder="Icon (optional)"
                    value={item.icon || ""}
                    onChange={(e) =>
                      updateArrayField(field, idx, "icon", e.target.value)
                    }
                  />
                  <input
                    className="border rounded px-3 py-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400"
                    placeholder="Title"
                    value={item.title || ""}
                    onChange={(e) =>
                      updateArrayField(field, idx, "title", e.target.value)
                    }
                  />
                  <input
                    className="border rounded px-3 py-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400"
                    placeholder="Description"
                    value={item.description || ""}
                    onChange={(e) =>
                      updateArrayField(
                        field,
                        idx,
                        "description",
                        e.target.value
                      )
                    }
                  />
                </div>
              )}
              {field === "faqs" && (
                <div className="space-y-2">
                  <input
                    className="border rounded px-3 py-2 w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400"
                    placeholder="Question"
                    value={item.question || ""}
                    onChange={(e) =>
                      updateArrayField(field, idx, "question", e.target.value)
                    }
                  />
                  <textarea
                    className="border rounded px-3 py-2 w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400"
                    rows={2}
                    placeholder="Answer"
                    value={item.answer || ""}
                    onChange={(e) =>
                      updateArrayField(field, idx, "answer", e.target.value)
                    }
                  />
                </div>
              )}
              {field === "testimonials" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    className="border rounded px-3 py-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400"
                    placeholder="Name"
                    value={item.name || ""}
                    onChange={(e) =>
                      updateArrayField(field, idx, "name", e.target.value)
                    }
                  />
                  <input
                    className="border rounded px-3 py-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400"
                    placeholder="Occupation"
                    value={item.occupation || ""}
                    onChange={(e) =>
                      updateArrayField(field, idx, "occupation", e.target.value)
                    }
                  />
                  <textarea
                    className="border rounded px-3 py-2 md:col-span-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400"
                    rows={2}
                    placeholder="Quote"
                    value={item.quote || ""}
                    onChange={(e) =>
                      updateArrayField(field, idx, "quote", e.target.value)
                    }
                  />
                  <div className="md:col-span-2 flex gap-2">
                    <input
                      className="border rounded px-3 py-2 flex-1 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400"
                      placeholder="Image URL"
                      value={item.imageUrl || ""}
                      onChange={(e) =>
                        updateArrayField(field, idx, "imageUrl", e.target.value)
                      }
                    />
                    <button
                      type="button"
                      className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
                      onClick={openImagePicker}
                    >
                      Pick
                    </button>
                  </div>
                </div>
              )}
              {field === "pricing" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    className="border rounded px-3 py-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400"
                    placeholder="Amount"
                    value={item.amount || ""}
                    onChange={(e) =>
                      updateArrayField(field, idx, "amount", e.target.value)
                    }
                  />
                  <input
                    className="border rounded px-3 py-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400"
                    placeholder="Title"
                    value={item.title || ""}
                    onChange={(e) =>
                      updateArrayField(field, idx, "title", e.target.value)
                    }
                  />
                  <input
                    className="border rounded px-3 py-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400"
                    placeholder="Description"
                    value={item.description || ""}
                    onChange={(e) =>
                      updateArrayField(
                        field,
                        idx,
                        "description",
                        e.target.value
                      )
                    }
                  />
                </div>
              )}
              <div className="text-right mt-2">
                <button
                  type="button"
                  className="text-xs text-red-600 hover:underline"
                  onClick={() => removeArrayItem(field, idx)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (field === "imageUrl") {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
          Image URL
        </label>
        <div className="flex gap-2">
          <input
            className="w-full border rounded px-3 py-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400"
            value={currentDoc.imageUrl || ""}
            onChange={(e) => updateField("imageUrl", e.target.value)}
            placeholder="https://..."
          />
          <button
            type="button"
            className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
            onClick={openImagePicker}
          >
            Pick
          </button>
        </div>
        {currentDoc.imageUrl ? (
          <img
            src={currentDoc.imageUrl}
            alt="preview"
            className="h-16 w-16 object-cover rounded mt-2"
          />
        ) : null}
      </div>
    );
  }

  if (["description"].includes(field)) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 capitalize">
          {labelize(field)}
        </label>
        <textarea
          className="w-full border rounded px-3 py-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400"
          rows={3}
          value={currentDoc[field] || ""}
          onChange={(e) => updateField(field, e.target.value)}
        />
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 capitalize">
        {labelize(field)}
      </label>
      <input
        className="w-full border rounded px-3 py-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400"
        value={currentDoc[field] || ""}
        onChange={(e) => updateField(field, e.target.value)}
      />
    </div>
  );
}

function ImagePickerModal({ open, onClose, onPick }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [nextCursor, setNextCursor] = useState(null);

  const fetchFiles = useCallback(
    async (cursor) => {
      if (!open) return;
      try {
        setLoading(true);
        setError("");
        const res = await uploadApi.list(cursor);
        if (cursor) {
          setFiles((prev) => [...prev, ...(res.data.files || [])]);
        } else {
          setFiles(res.data.files || []);
        }
        setNextCursor(res.data.nextCursor || null);
      } catch (e) {
        setError(e?.response?.data?.message || "Failed to load files");
      } finally {
        setLoading(false);
      }
    },
    [open]
  );

  useEffect(() => {
    if (open) fetchFiles();
  }, [open, fetchFiles]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 w-full max-w-3xl relative text-gray-900 dark:text-gray-100">
        <button
          className="absolute top-2 right-2 text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white"
          onClick={onClose}
        >
          &times;
        </button>
        <h3 className="text-xl font-semibold mb-3">Pick an image</h3>
        {error && (
          <div className="mb-2 p-2 rounded bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[60vh] overflow-auto pr-1">
          {files.map((f, idx) => (
            <button
              key={idx}
              onClick={() => onPick(f.url)}
              className="group border rounded overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700"
            >
              <img
                src={f.url}
                alt={f.publicId}
                className="h-28 w-full object-cover"
              />
              <div className="p-2 text-[11px] text-gray-600 dark:text-gray-300 truncate group-hover:text-gray-800 dark:group-hover:text-gray-100">
                {f.publicId.split("/").pop()}
              </div>
            </button>
          ))}
          {!loading && files.length === 0 && (
            <div className="col-span-full text-center text-gray-500 dark:text-gray-400">
              No files found in Cloudinary folder.
            </div>
          )}
        </div>
        <div className="flex justify-between items-center mt-3">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {files.length} items
          </span>
          <div>
            <button
              disabled={!nextCursor || loading}
              onClick={() => fetchFiles(nextCursor)}
              className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded disabled:opacity-50 text-gray-800 dark:text-gray-200"
            >
              {loading ? "Loading..." : nextCursor ? "Load more" : "No more"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const ContentManager = () => {
  const [selectedId, setSelectedId] = useState(SECTIONS[0].id);
  const [allContent, setAllContent] = useState({});
  const [loadingAll, setLoadingAll] = useState(true);
  const [errorAll, setErrorAll] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [imagePickerOpen, setImagePickerOpen] = useState(false);

  const fetchAllContent = useCallback(async () => {
    try {
      setLoadingAll(true);
      setErrorAll("");
      const res = await contentApi.list();
      const map = {};
      (res.data || []).forEach((doc) => {
        if (doc?.section) map[doc.section] = doc;
      });
      setAllContent(map);
    } catch (err) {
      setErrorAll(err?.response?.data?.message || "Failed to load content");
    } finally {
      setLoadingAll(false);
    }
  }, []);

  useEffect(() => {
    fetchAllContent();
  }, [fetchAllContent]);

  const currentSection = SECTIONS.find((s) => s.id === selectedId);
  // Clone currentDoc to avoid creating a brand-new object reference on every keystroke
  const currentDoc = allContent[selectedId]
    ? { ...allContent[selectedId] }
    : { section: selectedId };

  const updateField = (field, value) => {
    setAllContent((prev) => ({
      ...prev,
      [selectedId]: {
        ...(prev[selectedId] || { section: selectedId }),
        [field]: value,
      },
    }));
  };

  const addArrayItem = (field) => {
    const template = FIELD_TEMPLATES[field] || {};
    const items = currentDoc[field] || [];
    updateField(field, [...items, { ...template }]);
  };

  const updateArrayField = (field, index, key, value) => {
    const items = [...(currentDoc[field] || [])];
    items[index] = { ...items[index], [key]: value };
    updateField(field, items);
  };

  const removeArrayItem = (field, index) => {
    const items = [...(currentDoc[field] || [])];
    items.splice(index, 1);
    updateField(field, items);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage("");
      const payload = { section: currentSection.id };
      currentSection.fields.forEach((f) => {
        if (currentDoc[f] !== undefined) payload[f] = currentDoc[f];
      });
      const res = await contentApi.save(currentSection.id, payload);
      setAllContent((prev) => ({ ...prev, [currentSection.id]: res.data }));
      setIsEditing(false);
      setMessage("Saved successfully");
    } catch (err) {
      setMessage(err?.response?.data?.message || "Failed to save content");
    } finally {
      setSaving(false);
    }
  };
  const [confirmDeleteOpen, setConfirmDeleteOpen] = React.useState(false);

  const handleDelete = async () => {
    // open confirmation modal
    if (!allContent[selectedId]?._id) return;
    setConfirmDeleteOpen(true);
  };

  const confirmDelete = async () => {
    try {
      setSaving(true);
      setMessage("");
      await contentApi.delete(currentSection.id);
      setAllContent((prev) => {
        const next = { ...prev };
        delete next[currentSection.id];
        return next;
      });
      setIsEditing(false);
      setMessage("Deleted successfully");
      toast.success("Content section deleted");
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to delete content";
      setMessage(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
      setConfirmDeleteOpen(false);
    }
  };

  const labelize = (key) => key.replace(/([A-Z])/g, " $1").trim();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <PageHeader
        title="Content Manager"
        subtitle="Manage website content and sections"
        icon={Settings}
        actions={
          <Button variant="outline" size="sm" onClick={fetchAllContent}>
            Refresh
          </Button>
        }
      />

      {errorAll && (
        <div className="p-3 rounded bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
          {errorAll}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="grid grid-cols-12">
          {/* Vertical tabs */}
          <aside className="col-span-12 md:col-span-3 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <ul className="p-2">
              {SECTIONS.map((s) => {
                const isActive = s.id === selectedId;
                const configured = !!allContent[s.id]?._id;
                return (
                  <li key={s.id}>
                    <button
                      className={`w-full text-left px-3 py-2 rounded-md mb-1 flex items-center justify-between text-sm ${isActive ? "bg-primary text-white" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
                      onClick={() => {
                        setSelectedId(s.id);
                        setIsEditing(false);
                        setMessage("");
                      }}
                    >
                      <span>{s.name}</span>
                      <span
                        className={`ml-2 text-[10px] px-2 py-0.5 rounded ${configured ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400" : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"}`}
                      >
                        {configured ? "Configured" : "Not set"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          {/* Right content */}
          <section className="col-span-12 md:col-span-9 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white">
                {currentSection.name}
              </h3>
              <div className="flex flex-wrap gap-2">
                {!isEditing ? (
                  <div className="flex gap-2">
                    <button
                      className="bg-green-500 text-white px-3 lg:px-4 py-2 rounded-md hover:bg-green-600 text-sm"
                      onClick={() => setIsEditing(true)}
                    >
                      {allContent[selectedId]?._id ? "Edit" : "Create"}
                    </button>
                    {allContent[selectedId]?._id && (
                      <button
                        className="bg-red-600 text-white px-3 lg:px-4 py-2 rounded-md hover:bg-red-700 text-sm"
                        onClick={handleDelete}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <button
                      className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-3 lg:px-4 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 text-sm"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </button>
                    <button
                      className="bg-primary text-white px-3 lg:px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
                      disabled={saving}
                      onClick={handleSave}
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </>
                )}
              </div>
            </div>

            {message && (
              <div
                className={`mb-4 p-3 rounded border ${message.includes("Failed") ? "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800" : "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800"}`}
              >
                {message}
              </div>
            )}

            {!isEditing ? (
              <div className="space-y-3">
                {currentSection.fields.map((f) => (
                  <FieldViewComp
                    key={f}
                    field={f}
                    currentDoc={currentDoc}
                    labelize={labelize}
                  />
                ))}
                {!allContent[selectedId]?._id && (
                  <div className="text-gray-500 text-sm">
                    No content yet. Click Create to add content.
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {currentSection.fields.map((f) => (
                  <FieldEditorComp
                    key={f}
                    field={f}
                    currentDoc={currentDoc}
                    labelize={labelize}
                    updateField={updateField}
                    addArrayItem={addArrayItem}
                    updateArrayField={updateArrayField}
                    removeArrayItem={removeArrayItem}
                    openImagePicker={() => setImagePickerOpen(true)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {loadingAll && (
        <div className="text-center text-gray-600 dark:text-gray-400">
          Loading...
        </div>
      )}

      {/* Image Picker */}
      <ImagePickerModal
        open={imagePickerOpen}
        onClose={() => setImagePickerOpen(false)}
        onPick={(url) => {
          setImagePickerOpen(false);
          // If editing a testimonial item, last edited input will handle manual paste
          // For single imageUrl fields, set directly
          if (currentSection.fields.includes("imageUrl")) {
            updateField("imageUrl", url);
          }
        }}
      />

      <Modal
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        title="Confirm Delete"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Delete this content section? This cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <button
              className="px-3 py-2 rounded-md border"
              onClick={() => setConfirmDeleteOpen(false)}
            >
              Cancel
            </button>
            <button
              className="px-3 py-2 rounded-md bg-red-600 text-white"
              onClick={confirmDelete}
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
};

export default ContentManager;
