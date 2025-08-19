'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PlusIcon, PencilIcon, XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

export default function TodoForm({ onSubmit, initialData = null, onCancel = null }) {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    priority: initialData?.priority || 'medium',
    category: initialData?.category || 'general',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const titleRef = useRef(null);

  // Auto focus on title input
  useEffect(() => {
    if (titleRef.current && !initialData) {
      titleRef.current.focus();
    }
  }, [initialData]);

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
    }
    
    if (formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors below');
      return;
    }

    setLoading(true);
    
    try {
      const result = await onSubmit(formData);
      
      if (result.success) {
        if (!initialData) {
          setFormData({ title: '', description: '', priority: 'medium', category: 'general' });
          if (titleRef.current) {
            titleRef.current.focus();
          }
        }
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const priorityColors = {
    low: 'bg-green-100 text-green-800 border-green-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    high: 'bg-red-100 text-red-800 border-red-200',
  };

  const categories = [
    { value: 'general', label: '📋 General', color: 'bg-gray-100' },
    { value: 'work', label: '💼 Work', color: 'bg-blue-100' },
    { value: 'personal', label: '👤 Personal', color: 'bg-purple-100' },
    { value: 'shopping', label: '🛒 Shopping', color: 'bg-green-100' },
    { value: 'health', label: '🏥 Health', color: 'bg-pink-100' },
    { value: 'learning', label: '📚 Learning', color: 'bg-indigo-100' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title Input */}
        <div className="space-y-2">
          <label htmlFor="title" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <SparklesIcon className="h-4 w-4" />
            Title *
          </label>
          <div className="relative">
            <input
              ref={titleRef}
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border-2 transition-all focus:outline-none ${
                errors.title
                  ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                  : 'border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'
              }`}
              placeholder="What needs to be done?"
              disabled={loading}
              maxLength={100}
            />
            <div className="absolute right-3 top-3 text-xs text-gray-400">
              {formData.title.length}/100
            </div>
          </div>
          {errors.title && (
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-red-600 flex items-center gap-1"
            >
              <XMarkIcon className="h-4 w-4" />
              {errors.title}
            </motion.p>
          )}
        </div>

        {/* Priority and Category Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Priority Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Priority</label>
            <div className="flex gap-2">
              {['low', 'medium', 'high'].map((priority) => (
                <button
                  key={priority}
                  type="button"
                  onClick={() => handleInputChange('priority', priority)}
                  className={`flex-1 px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                    formData.priority === priority
                      ? priorityColors[priority]
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                  disabled={loading}
                >
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Category Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Category</label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
              disabled={loading}
            >
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Description Input */}
        <div className="space-y-2">
          <label htmlFor="description" className="block text-sm font-semibold text-gray-700">
            Description
          </label>
          <div className="relative">
            <textarea
              id="description"
              rows={4}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border-2 transition-all focus:outline-none resize-none ${
                errors.description
                  ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                  : 'border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'
              }`}
              placeholder="Add more details (optional)..."
              disabled={loading}
              maxLength={500}
            />
            <div className="absolute right-3 bottom-3 text-xs text-gray-400">
              {formData.description.length}/500
            </div>
          </div>
          {errors.description && (
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-red-600 flex items-center gap-1"
            >
              <XMarkIcon className="h-4 w-4" />
              {errors.description}
            </motion.p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-lg font-semibold text-white transition-all ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
            }`}
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                {initialData ? <PencilIcon className="h-5 w-5" /> : <PlusIcon className="h-5 w-5" />}
                {initialData ? 'Update Task' : 'Create Task'}
              </>
            )}
          </motion.button>

          {onCancel && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={onCancel}
              className="px-6 py-4 rounded-lg font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all"
              disabled={loading}
            >
              Cancel
            </motion.button>
          )}
        </div>
      </form>
    </motion.div>
  );
}