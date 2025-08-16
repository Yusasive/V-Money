import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

const ContentManager = () => {
  const [selectedSection, setSelectedSection] = useState('hero');
  const [content, setContent] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const sections = [
    { id: 'hero', name: 'Hero Section', fields: ['title', 'subtitle', 'description', 'buttonText', 'buttonLink'] },
    { id: 'main1', name: 'Main Section 1', fields: ['title', 'description', 'buttonText', 'buttonLink'] },
    { id: 'main2', name: 'Main Section 2', fields: ['title', 'description', 'buttonText', 'buttonLink', 'imageUrl'] },
    { id: 'main3', name: 'Main Section 3', fields: ['title', 'description', 'buttonText', 'buttonLink', 'imageUrl'] },
    { id: 'main4', name: 'Main Section 4', fields: ['title', 'description', 'buttonText', 'buttonLink', 'imageUrl'] },
    { id: 'suite', name: 'Suite Section', fields: ['title', 'features'] },
    { id: 'credit', name: 'Credit Section', fields: ['title', 'features'] },
    { id: 'faq', name: 'FAQ Section', fields: ['title', 'faqs'] },
    { id: 'testimonial', name: 'Testimonials', fields: ['title', 'testimonials'] },
    { id: 'pricing', name: 'Pricing Section', fields: ['title', 'description', 'pricing'] }
  ];

  useEffect(() => {
    fetchContent();
  }, [selectedSection]);

  const fetchContent = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`http://localhost:5000/api/content/${selectedSection}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setContent(response.data);
    } catch (error) {
      if (error.response?.status === 404) {
        setContent({ section: selectedSection });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(`http://localhost:5000/api/content/${selectedSection}`, content, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Content updated successfully!');
    } catch (error) {
      setMessage('Error updating content');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setContent(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayChange = (field, index, subField, value) => {
    setContent(prev => ({
      ...prev,
      [field]: prev[field]?.map((item, i) => 
        i === index ? { ...item, [subField]: value } : item
      ) || []
    }));
  };

  const addArrayItem = (field, template) => {
    setContent(prev => ({
      ...prev,
      [field]: [...(prev[field] || []), template]
    }));
  };

  const removeArrayItem = (field, index) => {
    setContent(prev => ({
      ...prev,
      [field]: prev[field]?.filter((_, i) => i !== index) || []
    }));
  };

  const renderField = (field) => {
    const currentSection = sections.find(s => s.id === selectedSection);
    
    switch (field) {
      case 'features':
        return (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">Features</label>
            {(content.features || []).map((feature, index) => (
              <div key={index} className="border p-4 rounded-md space-y-2">
                <input
                  type="text"
                  placeholder="Feature Title"
                  value={feature.title || ''}
                  onChange={(e) => handleArrayChange('features', index, 'title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <textarea
                  placeholder="Feature Description"
                  value={feature.description || ''}
                  onChange={(e) => handleArrayChange('features', index, 'description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows="3"
                />
                <button
                  type="button"
                  onClick={() => removeArrayItem('features', index)}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove Feature
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayItem('features', { title: '', description: '', icon: '' })}
              className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
            >
              Add Feature
            </button>
          </div>
        );

      case 'faqs':
        return (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">FAQs</label>
            {(content.faqs || []).map((faq, index) => (
              <div key={index} className="border p-4 rounded-md space-y-2">
                <input
                  type="text"
                  placeholder="Question"
                  value={faq.question || ''}
                  onChange={(e) => handleArrayChange('faqs', index, 'question', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <textarea
                  placeholder="Answer"
                  value={faq.answer || ''}
                  onChange={(e) => handleArrayChange('faqs', index, 'answer', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows="3"
                />
                <button
                  type="button"
                  onClick={() => removeArrayItem('faqs', index)}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove FAQ
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayItem('faqs', { question: '', answer: '' })}
              className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
            >
              Add FAQ
            </button>
          </div>
        );

      case 'testimonials':
        return (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">Testimonials</label>
            {(content.testimonials || []).map((testimonial, index) => (
              <div key={index} className="border p-4 rounded-md space-y-2">
                <input
                  type="text"
                  placeholder="Name"
                  value={testimonial.name || ''}
                  onChange={(e) => handleArrayChange('testimonials', index, 'name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <input
                  type="text"
                  placeholder="Occupation"
                  value={testimonial.occupation || ''}
                  onChange={(e) => handleArrayChange('testimonials', index, 'occupation', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <textarea
                  placeholder="Quote"
                  value={testimonial.quote || ''}
                  onChange={(e) => handleArrayChange('testimonials', index, 'quote', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows="3"
                />
                <input
                  type="url"
                  placeholder="Image URL"
                  value={testimonial.imageUrl || ''}
                  onChange={(e) => handleArrayChange('testimonials', index, 'imageUrl', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <button
                  type="button"
                  onClick={() => removeArrayItem('testimonials', index)}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove Testimonial
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayItem('testimonials', { name: '', occupation: '', quote: '', imageUrl: '' })}
              className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
            >
              Add Testimonial
            </button>
          </div>
        );

      case 'pricing':
        return (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">Pricing Items</label>
            {(content.pricing || []).map((item, index) => (
              <div key={index} className="border p-4 rounded-md space-y-2">
                <input
                  type="text"
                  placeholder="Amount"
                  value={item.amount || ''}
                  onChange={(e) => handleArrayChange('pricing', index, 'amount', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <input
                  type="text"
                  placeholder="Title"
                  value={item.title || ''}
                  onChange={(e) => handleArrayChange('pricing', index, 'title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <textarea
                  placeholder="Description"
                  value={item.description || ''}
                  onChange={(e) => handleArrayChange('pricing', index, 'description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows="3"
                />
                <button
                  type="button"
                  onClick={() => removeArrayItem('pricing', index)}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove Item
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayItem('pricing', { amount: '', title: '', description: '' })}
              className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
            >
              Add Pricing Item
            </button>
          </div>
        );

      case 'description':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={content[field] || ''}
              onChange={(e) => handleInputChange(field, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows="4"
            />
          </div>
        );

      default:
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
              {field.replace(/([A-Z])/g, ' $1').trim()}
            </label>
            <input
              type={field.includes('Url') || field.includes('Link') ? 'url' : 'text'}
              value={content[field] || ''}
              onChange={(e) => handleInputChange(field, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <h2 className="text-3xl font-bold text-gray-900 font-lota">Content Manager</h2>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Section to Edit
          </label>
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            {sections.map(section => (
              <option key={section.id} value={section.id}>
                {section.name}
              </option>
            ))}
          </select>
        </div>

        {message && (
          <div className={`p-4 rounded-md mb-4 ${
            message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {sections.find(s => s.id === selectedSection)?.fields.map(field => (
            <div key={field}>
              {renderField(field)}
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="bg-primary text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update Content'}
          </button>
        </form>
      </div>
    </motion.div>
  );
};

export default ContentManager;