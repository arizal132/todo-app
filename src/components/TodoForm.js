'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlusIcon, 
  PencilIcon, 
  XMarkIcon, 
  SparklesIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  CalendarDaysIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

export default function TodoForm({ 
  onSubmit, 
  initialData = null, 
  onCancel = null, 
  isSubmitting = false 
}) {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    priority: initialData?.priority || 'medium',
    category: initialData?.category || 'general',
    dueDate: initialData?.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : '',
    tags: initialData?.tags || [],
  });
  
  const [errors, setErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(!!initialData || false);
  
  const titleRef = useRef(null);
  const tagInputRef = useRef(null);

  // Auto focus on title input for new todos
  useEffect(() => {
    if (titleRef.current && !initialData) {
      const timer = setTimeout(() => titleRef.current.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [initialData]);

  // Enhanced form validation
  const validateForm = useCallback(() => {
    const newErrors = {};
    
    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = 'Task title is required';
    } else if (formData.title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters long';
    } else if (formData.title.length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
    }
    
    // Description validation
    if (formData.description.length > 1000) {
      newErrors.description = 'Description must be less than 1000 characters';
    }
    
    // Due date validation
    if (formData.dueDate) {
      const selectedDate = new Date(formData.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.dueDate = 'Due date cannot be in the past';
      }
    }
    
    // Tags validation
    if (formData.tags.length > 10) {
      newErrors.tags = 'Maximum 10 tags allowed';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the validation errors');
      return;
    }

    try {
      // Clean up the data before submitting
      const cleanedData = {
        ...formData,
        title: formData.title.trim(),
        description: formData.description.trim(),
        dueDate: formData.dueDate || null,
        tags: formData.tags.filter(tag => tag.trim().length > 0)
      };

      const result = await onSubmit(cleanedData);
      
      if (result.success) {
        if (!initialData) {
          // Reset form for new todos
          setFormData({
            title: '',
            description: '',
            priority: 'medium',
            category: 'general',
            dueDate: '',
            tags: [],
          });
          setTagInput('');
          setIsDirty(false);
          setShowAdvanced(false);
          
          if (titleRef.current) {
            titleRef.current.focus();
          }
        } else if (onCancel) {
          // Close edit mode
          onCancel();
        }
      }
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('An unexpected error occurred');
    }
  };

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    
    // Clear specific field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  // Tag management functions
  const addTag = useCallback((tag) => {
    const trimmedTag = tag.trim().toLowerCase();
    if (trimmedTag && !formData.tags.includes(trimmedTag) && formData.tags.length < 10) {
      handleInputChange('tags', [...formData.tags, trimmedTag]);
      setTagInput('');
    }
  }, [formData.tags, handleInputChange]);

  const removeTag = useCallback((tagToRemove) => {
    handleInputChange('tags', formData.tags.filter(tag => tag !== tagToRemove));
  }, [formData.tags, handleInputChange]);

  const handleTagInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === 'Backspace' && tagInput === '' && formData.tags.length > 0) {
      removeTag(formData.tags[formData.tags.length - 1]);
    }
  };

  // Memoized priority colors and categories for better performance
  const priorityConfig = useMemo(() => ({
    low: { 
      colors: 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100', 
      icon: '🟢',
      label: 'Low Priority'
    },
    medium: { 
      colors: 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100', 
      icon: '🟡',
      label: 'Medium Priority'
    },
    high: { 
      colors: 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100', 
      icon: '🔴',
      label: 'High Priority'
    },
  }), []);

  const categories = useMemo(() => [
    { value: 'general', label: '📋 General', color: 'bg-slate-100', description: 'Miscellaneous tasks' },
    { value: 'work', label: '💼 Work', color: 'bg-blue-100', description: 'Professional tasks' },
    { value: 'personal', label: '👤 Personal', color: 'bg-purple-100', description: 'Personal activities' },
    { value: 'shopping', label: '🛒 Shopping', color: 'bg-green-100', description: 'Shopping lists' },
    { value: 'health', label: '🏥 Health', color: 'bg-pink-100', description: 'Health & wellness' },
    { value: 'learning', label: '📚 Learning', color: 'bg-indigo-100', description: 'Education & skills' },
    { value: 'finance', label: '💰 Finance', color: 'bg-yellow-100', description: 'Financial tasks' },
    { value: 'home', label: '🏠 Home', color: 'bg-orange-100', description: 'Household tasks' },
  ], []);

  // Calculate character progress for visual feedback
  const titleProgress = (formData.title.length / 100) * 100;
  const descriptionProgress = (formData.description.length / 1000) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title Input with Enhanced Validation */}
        <div className="space-y-3">
          <label htmlFor="title" className="flex items-center gap-2 text-sm font-bold text-gray-800">
            <SparklesIcon className="h-4 w-4 text-indigo-500" />
            Task Title
            <span className="text-red-500">*</span>
          </label>
          
          <div className="relative">
            <input
              ref={titleRef}
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={`w-full px-4 py-4 rounded-xl border-2 transition-all duration-200 focus:outline-none text-gray-800 placeholder-gray-500 ${
                errors.title
                  ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100 bg-red-50'
                  : formData.title.length > 0
                  ? 'border-green-300 focus:border-green-500 focus:ring-4 focus:ring-green-100 bg-green-50'
                  : 'border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 bg-white'
              }`}
              placeholder="What would you like to accomplish?"
              disabled={isSubmitting}
              maxLength={100}
            />
            
            {/* Character Counter with Progress Bar */}
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
              <div className="text-xs font-medium text-gray-600">
                {formData.title.length}/100
              </div>
              <div className="w-8 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    titleProgress > 90 ? 'bg-red-400' : 
                    titleProgress > 70 ? 'bg-yellow-400' : 'bg-green-400'
                  }`}
                  style={{ width: `${titleProgress}%` }}
                />
              </div>
            </div>
          </div>

          <AnimatePresence>
            {errors.title && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200"
              >
                <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" />
                {errors.title}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Priority and Category Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Enhanced Priority Selection */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-800">
              <ExclamationTriangleIcon className="h-4 w-4 text-amber-500" />
              Priority Level
            </label>
            
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(priorityConfig).map(([priority, config]) => (
                <motion.button
                  key={priority}
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleInputChange('priority', priority)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 text-sm font-semibold transition-all duration-200 ${
                    formData.priority === priority
                      ? config.colors
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                  disabled={isSubmitting}
                  title={config.label}
                >
                  <span className="text-lg">{config.icon}</span>
                  <span>{priority.charAt(0).toUpperCase() + priority.slice(1)}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Enhanced Category Selection */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-800">
              <TagIcon className="h-4 w-4 text-purple-500" />
              Category
            </label>
            
            <div className="relative">
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-4 py-4 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 text-gray-800 bg-white appearance-none cursor-pointer"
                disabled={isSubmitting}
              >
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
              
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            
            {/* Category Description */}
            <p className="text-xs text-gray-500 italic">
              {categories.find(cat => cat.value === formData.category)?.description}
            </p>
          </div>
        </div>

        {/* Advanced Options Toggle */}
        <motion.button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          <motion.div
            animate={{ rotate: showAdvanced ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </motion.div>
          {showAdvanced ? 'Hide' : 'Show'} Advanced Options
        </motion.button>

        {/* Advanced Options */}
        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6 border-t border-gray-200 pt-6"
            >
              {/* Due Date */}
              <div className="space-y-3">
                <label htmlFor="dueDate" className="flex items-center gap-2 text-sm font-bold text-gray-800">
                  <CalendarDaysIcon className="h-4 w-4 text-blue-500" />
                  Due Date
                </label>
                
                <div className="relative">
                  <input
                    type="date"
                    id="dueDate"
                    value={formData.dueDate}
                    onChange={(e) => handleInputChange('dueDate', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className={`w-full px-4 py-4 rounded-xl border-2 transition-all duration-200 focus:outline-none text-gray-800 ${
                      errors.dueDate
                        ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100 bg-red-50'
                        : 'border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 bg-white'
                    }`}
                    disabled={isSubmitting}
                  />
                </div>

                <AnimatePresence>
                  {errors.dueDate && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200"
                    >
                      <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" />
                      {errors.dueDate}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Tags Input */}
              <div className="space-y-3">
                <label htmlFor="tags" className="flex items-center gap-2 text-sm font-bold text-gray-800">
                  <TagIcon className="h-4 w-4 text-green-500" />
                  Tags
                  <span className="text-xs font-normal text-gray-500">({formData.tags.length}/10)</span>
                </label>
                
                {/* Tags Display */}
                <AnimatePresence>
                  {formData.tags.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border"
                    >
                      {formData.tags.map((tag, index) => (
                        <motion.span
                          key={tag}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-800 text-sm font-medium rounded-full"
                        >
                          #{tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="hover:bg-indigo-200 rounded-full p-0.5 transition-colors"
                          >
                            <XMarkIcon className="h-3 w-3" />
                          </button>
                        </motion.span>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Tag Input */}
                <div className="flex gap-2">
                  <input
                    ref={tagInputRef}
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagInputKeyDown}
                    className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 text-gray-800 placeholder-gray-500"
                    placeholder="Add a tag and press Enter"
                    disabled={isSubmitting || formData.tags.length >= 10}
                    maxLength={20}
                  />
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => addTag(tagInput)}
                    disabled={!tagInput.trim() || formData.tags.length >= 10 || isSubmitting}
                    className="px-4 py-3 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Add
                  </motion.button>
                </div>

                <AnimatePresence>
                  {errors.tags && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200"
                    >
                      <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" />
                      {errors.tags}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Description Input */}
        <div className="space-y-3">
          <label htmlFor="description" className="flex items-center gap-2 text-sm font-bold text-gray-800">
            <PencilIcon className="h-4 w-4 text-gray-500" />
            Description
            <span className="text-xs font-normal text-gray-500">(optional)</span>
          </label>
          
          <div className="relative">
            <textarea
              id="description"
              rows={4}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className={`w-full px-4 py-4 rounded-xl border-2 transition-all duration-200 focus:outline-none resize-none text-gray-800 placeholder-gray-500 ${
                errors.description
                  ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100 bg-red-50'
                  : 'border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 bg-white'
              }`}
              placeholder="Add more details about this task..."
              disabled={isSubmitting}
              maxLength={1000}
            />
            
            {/* Character Counter with Progress Bar */}
            <div className="absolute right-3 bottom-3 flex items-center gap-2">
              <div className="text-xs font-medium text-gray-600">
                {formData.description.length}/1000
              </div>
              <div className="w-8 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    descriptionProgress > 90 ? 'bg-red-400' : 
                    descriptionProgress > 70 ? 'bg-yellow-400' : 'bg-green-400'
                  }`}
                  style={{ width: `${descriptionProgress}%` }}
                />
              </div>
            </div>
          </div>

          <AnimatePresence>
            {errors.description && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200"
              >
                <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" />
                {errors.description}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <motion.button
            whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
            whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
            type="submit"
            disabled={isSubmitting || !formData.title.trim()}
            className={`flex-1 flex items-center justify-center gap-3 py-4 px-6 rounded-xl font-bold text-white transition-all duration-200 ${
              isSubmitting || !formData.title.trim()
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                {initialData ? (
                  <>
                    <PencilIcon className="h-5 w-5" />
                    <span>Update Task</span>
                  </>
                ) : (
                  <>
                    <PlusIcon className="h-5 w-5" />
                    <span>Create Task</span>
                  </>
                )}
                {formData.title.trim() && (
                  <CheckCircleIcon className="h-4 w-4 text-white/70" />
                )}
              </>
            )}
          </motion.button>

          {onCancel && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={onCancel}
              className="px-6 py-4 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all duration-200 border-2 border-gray-200 hover:border-gray-300"
              disabled={isSubmitting}
            >
              Cancel
            </motion.button>
          )}
        </div>

        {/* Form Status Indicator */}
        <AnimatePresence>
          {isDirty && !isSubmitting && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 text-xs text-gray-600 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200"
            >
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <span>Unsaved changes</span>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </motion.div>
  );
}