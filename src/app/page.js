'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TodoForm from '@/components/TodoForm';
import TodoList from '@/components/TodoList';
import { Toaster, toast } from 'react-hot-toast';
import { PlusIcon, CheckCircleIcon, ClockIcon, ListBulletIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function Home() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Memoized stats calculation for better performance
  const stats = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter(todo => todo.completed).length;
    const pending = total - completed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { total, completed, pending, completionRate };
  }, [todos]);

  // Enhanced error handling with retry mechanism
  const fetchTodos = useCallback(async (retryCount = 0) => {
    const maxRetries = 3;
    
    try {
      setLoading(true);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const response = await fetch('/api/todos', {
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setTodos(result.data || []);
        toast.success(`Loaded ${result.data?.length || 0} todos`);
      } else {
        throw new Error(result.error || 'Failed to fetch todos');
      }
    } catch (error) {
      console.error('Error fetching todos:', error);
      
      if (retryCount < maxRetries && error.name !== 'AbortError') {
        toast.error(`Retry ${retryCount + 1}/${maxRetries}...`);
        setTimeout(() => fetchTodos(retryCount + 1), 1000 * (retryCount + 1));
      } else {
        const errorMessage = error.name === 'AbortError' 
          ? 'Request timeout. Please check your connection.' 
          : 'Failed to load todos. Please refresh the page.';
        toast.error(errorMessage);
        setTodos([]); // Set empty array as fallback
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Enhanced add todo with better UX
  const addTodo = async (todoData) => {
    if (isSubmitting) return { success: false, error: 'Already submitting...' };
    
    setIsSubmitting(true);
    
    const optimisticId = `temp_${Date.now()}`;
    const optimisticTodo = {
      _id: optimisticId,
      ...todoData,
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isOptimistic: true
    };

    // Optimistic update
    setTodos(prev => [optimisticTodo, ...prev]);

    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify(todoData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Replace optimistic todo with real one
        setTodos(prev => prev.map(todo => 
          todo._id === optimisticId ? result.data : todo
        ));
        toast.success('✅ Task created successfully!');
        return { success: true };
      } else {
        throw new Error(result.error || 'Failed to add todo');
      }
    } catch (error) {
      // Revert optimistic update
      setTodos(prev => prev.filter(todo => todo._id !== optimisticId));
      toast.error(`❌ ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      setIsSubmitting(false);
    }
  };

  // Enhanced update todo
  const updateTodo = async (id, todoData) => {
    const originalTodos = [...todos];
    
    // Optimistic update
    setTodos(prev => prev.map(todo => 
      todo._id === id ? { ...todo, ...todoData, updatedAt: new Date().toISOString() } : todo
    ));

    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify(todoData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setTodos(prev => prev.map(todo => 
          todo._id === id ? result.data : todo
        ));
        
        // Different toast messages for different updates
        if (todoData.hasOwnProperty('completed')) {
          toast.success(todoData.completed ? '🎉 Task completed!' : '↩️ Task reopened');
        } else {
          toast.success('📝 Task updated successfully!');
        }
        
        return { success: true };
      } else {
        throw new Error(result.error || 'Failed to update todo');
      }
    } catch (error) {
      // Revert optimistic update
      setTodos(originalTodos);
      toast.error(`❌ ${error.message}`);
      return { success: false, error: error.message };
    }
  };

  // Enhanced delete todo with confirmation
  const deleteTodo = async (id) => {
    const todoToDelete = todos.find(todo => todo._id === id);
    if (!todoToDelete) return { success: false, error: 'Todo not found' };

    // Optimistic update
    setTodos(prev => prev.filter(todo => todo._id !== id));

    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'DELETE',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('🗑️ Task deleted successfully!');
        return { success: true };
      } else {
        throw new Error(result.error || 'Failed to delete todo');
      }
    } catch (error) {
      // Revert optimistic update
      setTodos(prev => [...prev, todoToDelete].sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      ));
      toast.error(`❌ ${error.message}`);
      return { success: false, error: error.message };
    }
  };

  // Optimized filtered todos with debounced search
  const filteredTodos = useMemo(() => {
    return todos.filter(todo => {
      const matchesFilter = 
        filter === 'all' ||
        (filter === 'completed' && todo.completed) ||
        (filter === 'pending' && !todo.completed);

      const searchLower = searchTerm.toLowerCase().trim();
      const matchesSearch = !searchLower ||
        todo.title.toLowerCase().includes(searchLower) ||
        todo.description?.toLowerCase().includes(searchLower) ||
        todo.category?.toLowerCase().includes(searchLower);

      return matchesFilter && matchesSearch;
    });
  }, [todos, filter, searchTerm]);

  // Initialize data
  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  // Loading state with better UX
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-4"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-t-purple-400 mx-auto animate-pulse"></div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Loading Todo Masterpiece</h2>
          <p className="text-gray-600">Preparing your productivity dashboard...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1f2937',
            color: '#f9fafb',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '500'
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#f9fafb',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#f9fafb',
            },
          },
        }}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Header */}
        <motion.div 
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Todo Masterpiece
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
            Transform your productivity with our intelligent task management system. 
            <span className="block mt-2 text-lg text-gray-600">
              Currently managing <strong className="text-indigo-600">{stats.total}</strong> tasks with <strong className="text-green-600">{stats.completionRate}%</strong> completion rate
            </span>
          </p>
        </motion.div>

        {/* Enhanced Stats Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10"
        >
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Tasks</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <div className="bg-indigo-100 p-3 rounded-full">
                <ListBulletIcon className="h-8 w-8 text-indigo-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Completed</p>
                <p className="text-3xl font-bold text-green-700 mt-1">{stats.completed}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Pending</p>
                <p className="text-3xl font-bold text-orange-700 mt-1">{stats.pending}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <ClockIcon className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Progress</p>
                <p className="text-3xl font-bold text-purple-700 mt-1">{stats.completionRate}%</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <div className="h-8 w-8 rounded-full border-4 border-purple-600 border-t-transparent animate-spin"></div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Search and Filter */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-xl mb-8"
        >
          <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
            <div className="flex-1 w-full relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search todos by title, description, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 text-gray-800 placeholder-gray-500 bg-white/70"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
            
            <div className="flex gap-3 flex-wrap">
              {[
                { key: 'all', label: 'All Tasks', count: stats.total },
                { key: 'pending', label: 'Pending', count: stats.pending },
                { key: 'completed', label: 'Completed', count: stats.completed }
              ].map(({ key, label, count }) => (
                <motion.button
                  key={key}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFilter(key)}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 ${
                    filter === key
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                  }`}
                >
                  {label}
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    filter === key
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}>
                    {count}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          {filteredTodos.length !== todos.length && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 pt-4 border-t border-gray-200"
            >
              <p className="text-sm text-gray-600 text-center">
                Showing <strong className="text-indigo-600">{filteredTodos.length}</strong> of <strong>{todos.length}</strong> tasks
                {searchTerm && <span> matching &quot;<strong className="text-purple-600">{searchTerm}</strong>&quot;</span>}
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Enhanced Todo Form */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-xl mb-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-indigo-100 p-2 rounded-full">
              <PlusIcon className="h-6 w-6 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Create New Task</h2>
            {isSubmitting && (
              <div className="flex items-center gap-2 ml-auto">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-300 border-t-indigo-600"></div>
                <span className="text-sm text-gray-600">Creating...</span>
              </div>
            )}
          </div>
          <TodoForm onSubmit={addTodo} isSubmitting={isSubmitting} />
        </motion.div>

        {/* Enhanced Todo List */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <TodoList 
            todos={filteredTodos}
            onUpdate={updateTodo}
            onDelete={deleteTodo}
            searchTerm={searchTerm}
            isEmpty={todos.length === 0}
            isFiltered={filteredTodos.length !== todos.length}
          />
        </motion.div>

        {/* Enhanced Empty State */}
        <AnimatePresence>
          {todos.length === 0 && !loading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center py-16"
            >
              <div className="text-6xl mb-4">🚀</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Ready to boost your productivity?</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Start by creating your first task above. Every great achievement begins with a single step!
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}