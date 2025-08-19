'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TodoForm from '@/components/TodoForm';
import TodoList from '@/components/TodoList';
import { Toaster, toast } from 'react-hot-toast';
import { PlusIcon, CheckCircleIcon, ClockIcon, ListBulletIcon } from '@heroicons/react/24/outline';

export default function Home() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0 });

  // Calculate stats
  const calculateStats = useCallback((todoList) => {
    const total = todoList.length;
    const completed = todoList.filter(todo => todo.completed).length;
    const pending = total - completed;
    setStats({ total, completed, pending });
  }, []);

  // Fetch todos with better error handling
  const fetchTodos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/todos');
      const result = await response.json();
      
      if (result.success) {
        setTodos(result.data);
        calculateStats(result.data);
      } else {
        toast.error('Failed to fetch todos');
      }
    } catch (error) {
      console.error('Error fetching todos:', error);
      toast.error('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Add new todo with optimistic updates
  const addTodo = async (todoData) => {
    const optimisticTodo = {
      _id: Date.now().toString(),
      ...todoData,
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isOptimistic: true
    };

    // Optimistic update
    const newTodos = [optimisticTodo, ...todos];
    setTodos(newTodos);
    calculateStats(newTodos);

    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(todoData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Replace optimistic todo with real one
        setTodos(prev => prev.map(todo => 
          todo._id === optimisticTodo._id ? result.data : todo
        ));
        toast.success('Todo added successfully!');
        return { success: true };
      } else {
        // Revert optimistic update
        setTodos(todos);
        calculateStats(todos);
        toast.error(result.error || 'Failed to add todo');
        return { success: false, error: result.error };
      }
    } catch (error) {
      // Revert optimistic update
      setTodos(todos);
      calculateStats(todos);
      toast.error('Network error occurred');
      return { success: false, error: error.message };
    }
  };

  // Update todo with optimistic updates
  const updateTodo = async (id, todoData) => {
    // Optimistic update
    const updatedTodos = todos.map(todo => 
      todo._id === id ? { ...todo, ...todoData, updatedAt: new Date().toISOString() } : todo
    );
    setTodos(updatedTodos);
    calculateStats(updatedTodos);

    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(todoData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setTodos(prev => prev.map(todo => 
          todo._id === id ? result.data : todo
        ));
        toast.success('Todo updated successfully!');
        return { success: true };
      } else {
        // Revert optimistic update
        setTodos(todos);
        calculateStats(todos);
        toast.error(result.error || 'Failed to update todo');
        return { success: false, error: result.error };
      }
    } catch (error) {
      // Revert optimistic update
      setTodos(todos);
      calculateStats(todos);
      toast.error('Network error occurred');
      return { success: false, error: error.message };
    }
  };

  // Delete todo with optimistic updates
  const deleteTodo = async (id) => {
    // Optimistic update
    const filteredTodos = todos.filter(todo => todo._id !== id);
    setTodos(filteredTodos);
    calculateStats(filteredTodos);

    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('Todo deleted successfully!');
        return { success: true };
      } else {
        // Revert optimistic update
        setTodos(todos);
        calculateStats(todos);
        toast.error(result.error || 'Failed to delete todo');
        return { success: false, error: result.error };
      }
    } catch (error) {
      // Revert optimistic update
      setTodos(todos);
      calculateStats(todos);
      toast.error('Network error occurred');
      return { success: false, error: error.message };
    }
  };

  // Filter todos based on filter and search
  const filteredTodos = todos.filter(todo => {
    const matchesFilter = 
      filter === 'all' ||
      (filter === 'completed' && todo.completed) ||
      (filter === 'pending' && !todo.completed);

    const matchesSearch = 
      todo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      todo.description?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  useEffect(() => {
    fetchTodos();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600 font-medium">Loading your todos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <Toaster position="top-right" />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
            Todo Masterpiece
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Transform your productivity with our beautiful, intelligent task management system
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <ListBulletIcon className="h-12 w-12 text-indigo-500" />
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircleIcon className="h-12 w-12 text-green-500" />
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-3xl font-bold text-orange-600">{stats.pending}</p>
              </div>
              <ClockIcon className="h-12 w-12 text-orange-500" />
            </div>
          </div>
        </motion.div>

        {/* Search and Filter */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-lg mb-8"
        >
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex-1 w-full">
              <input
                type="text"
                placeholder="Search todos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
              />
            </div>
            
            <div className="flex gap-2">
              {['all', 'pending', 'completed'].map((filterType) => (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType)}
                  className={`px-6 py-3 rounded-lg font-medium transition-all ${
                    filter === filterType
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Todo Form */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-lg mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <PlusIcon className="h-6 w-6 text-indigo-600" />
            <h2 className="text-xl font-semibold text-gray-800">Add New Task</h2>
          </div>
          <TodoForm onSubmit={addTodo} />
        </motion.div>

        {/* Todo List */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <TodoList 
            todos={filteredTodos}
            onUpdate={updateTodo}
            onDelete={deleteTodo}
            searchTerm={searchTerm}
          />
        </motion.div>
      </div>
    </div>
  );
}