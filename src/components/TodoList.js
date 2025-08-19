'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TodoForm from './TodoForm';
import { 
  PencilIcon, 
  TrashIcon, 
  CheckCircleIcon, 
  ClockIcon,
  CalendarIcon,
  TagIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

export default function TodoList({ todos, onUpdate, onDelete, searchTerm }) {
  const [editingId, setEditingId] = useState(null);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'compact'

  const handleToggleComplete = async (todo) => {
    const result = await onUpdate(todo._id, { completed: !todo.completed });
    if (result.success && !todo.completed) {
      toast.success('🎉 Task completed! Great job!');
    }
  };

  const handleEdit = (todo) => {
    setEditingId(todo._id);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleUpdate = async (todoData) => {
    const result = await onUpdate(editingId, todoData);
    if (result.success) {
      setEditingId(null);
    }
    return result;
  };

  const handleDelete = async (id, title) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      const result = await onDelete(id);
      if (result.success) {
        toast.success('Task deleted successfully');
      }
    }
  };

  const toggleExpanded = (id) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'border-l-red-500 bg-red-50';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50';
      case 'low': return 'border-l-green-500 bg-green-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />;
      case 'medium': return <ClockIcon className="h-4 w-4 text-yellow-500" />;
      case 'low': return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      default: return null;
    }
  };

  const getCategoryEmoji = (category) => {
    const categoryMap = {
      general: '📋',
      work: '💼',
      personal: '👤',
      shopping: '🛒',
      health: '🏥',
      learning: '📚'
    };
    return categoryMap[category] || '📋';
  };

  const highlightText = (text, search) => {
    if (!search.trim()) return text;
    
    const regex = new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.split(regex).map((part, i) => 
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (todos.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/70 backdrop-blur-sm rounded-xl p-12 text-center border border-white/20 shadow-lg"
      >
        <div className="max-w-md mx-auto">
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircleIcon className="h-12 w-12 text-indigo-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-3">
            {searchTerm ? 'No matching todos found' : 'No todos yet!'}
          </h3>
          <p className="text-gray-600">
            {searchTerm 
              ? 'Try adjusting your search term or filter'
              : 'Start organizing your life by adding your first task above'
            }
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* View Mode Toggle */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          Showing {todos.length} task{todos.length !== 1 ? 's' : ''}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('card')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'card' 
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Card View
          </button>
          <button
            onClick={() => setViewMode('compact')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'compact' 
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Compact View
          </button>
        </div>
      </div>

      {/* Todo Items */}
      <AnimatePresence mode="popLayout">
        {todos.map((todo, index) => (
          <motion.div
            key={todo._id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className={`bg-white/70 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg overflow-hidden ${
              viewMode === 'card' ? 'p-6' : 'p-4'
            } ${getPriorityColor(todo.priority)} border-l-4 ${
              todo.completed ? 'opacity-75' : ''
            }`}
          >
            {editingId === todo._id ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <PencilIcon className="h-5 w-5 text-indigo-600" />
                    Editing Task
                  </h3>
                </div>
                <TodoForm 
                  onSubmit={handleUpdate} 
                  initialData={todo}
                  onCancel={handleCancelEdit}
                />
              </motion.div>
            ) : (
              <div className="space-y-4">
                {/* Main Content */}
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="mt-1"
                  >
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => handleToggleComplete(todo)}
                      className="h-5 w-5 rounded border-2 border-gray-300 text-indigo-600 focus:ring-indigo-500 focus:ring-2 transition-all cursor-pointer"
                    />
                  </motion.div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        {/* Title */}
                        <h3 className={`text-lg font-semibold transition-all ${
                          todo.completed 
                            ? 'line-through text-gray-500' 
                            : 'text-gray-900'
                        }`}>
                          {highlightText(todo.title, searchTerm)}
                        </h3>

                        {/* Meta Information */}
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            {getPriorityIcon(todo.priority)}
                            <span className="capitalize">{todo.priority}</span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <TagIcon className="h-4 w-4" />
                            <span>{getCategoryEmoji(todo.category)} {todo.category}</span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-4 w-4" />
                            <span>{formatDate(todo.createdAt)}</span>
                          </div>
                        </div>

                        {/* Description Preview */}
                        {todo.description && (
                          <div className="mt-3">
                            {viewMode === 'card' || expandedIds.has(todo._id) ? (
                              <p className={`text-sm leading-relaxed ${
                                todo.completed 
                                  ? 'line-through text-gray-400' 
                                  : 'text-gray-700'
                              }`}>
                                {highlightText(todo.description, searchTerm)}
                              </p>
                            ) : (
                              <p className={`text-sm ${
                                todo.completed 
                                  ? 'line-through text-gray-400' 
                                  : 'text-gray-700'
                              }`}>
                                {highlightText(todo.description.slice(0, 100), searchTerm)}
                                {todo.description.length > 100 && '...'}
                              </p>
                            )}
                            
                            {viewMode === 'compact' && todo.description.length > 100 && (
                              <button
                                onClick={() => toggleExpanded(todo._id)}
                                className="flex items-center gap-1 mt-2 text-xs text-indigo-600 hover:text-indigo-700 transition-colors"
                              >
                                <EyeIcon className="h-3 w-3" />
                                {expandedIds.has(todo._id) ? 'Show less' : 'Show more'}
                                {expandedIds.has(todo._id) ? (
                                  <ChevronUpIcon className="h-3 w-3" />
                                ) : (
                                  <ChevronDownIcon className="h-3 w-3" />
                                )}
                              </button>
                            )}
                          </div>
                        )}

                        {/* Updated timestamp */}
                        {todo.updatedAt && todo.updatedAt !== todo.createdAt && (
                          <p className="text-xs text-gray-400 mt-2">
                            Updated {formatDate(todo.updatedAt)}
                          </p>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 ml-4">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleEdit(todo)}
                          className="p-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-all"
                          title="Edit task"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </motion.button>
                        
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleDelete(todo._id, todo.title)}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete task"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Completion Badge */}
                {todo.completed && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-2 rounded-lg border border-green-200"
                  >
                    <CheckCircleIcon className="h-5 w-5" />
                    <span className="text-sm font-medium">Completed</span>
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}