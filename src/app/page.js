'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import LoginForm from '@/components/LoginForm';
import RegisterForm from '@/components/RegisterForm';
import TodoForm from '@/components/TodoForm';
import TodoList from '@/components/TodoList';

export default function Home() {
  const { user, loading, logout, isAuthenticated } = useAuth();
  const [todos, setTodos] = useState([]);
  const [todosLoading, setTodosLoading] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0 });

  // Calculate todo statistics
  const calculateStats = useCallback((todoList) => {
    const total = todoList.length;
    const completed = todoList.filter(todo => todo.completed).length;
    const pending = total - completed;
    setStats({ total, completed, pending });
  }, []);

  // Show notification
  const showNotification = useCallback((message, type = 'success') => {
    if (type === 'success') {
      setSuccess(message);
      setError('');
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(message);
      setSuccess('');
      setTimeout(() => setError(''), 3000);
    }
  }, []);

  // Enhanced fetch todos with better error handling and retry mechanism
  const fetchTodos = useCallback(async (retryCount = 0) => {
    if (!isAuthenticated) return;
    
    setTodosLoading(true);
    try {
      // Get auth token from local storage or context if available
      const token = localStorage.getItem('authToken') || user?.token;
      
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      };

      const response = await fetch('/api/todos', {
        method: 'GET',
        headers,
        credentials: 'include', // Include cookies for authentication
      });

      // Handle different HTTP status codes
      if (response.status === 401) {
        // Unauthorized - redirect to login
        logout();
        showNotification('Session expired. Please login again.', 'error');
        return;
      }

      if (response.status === 404) {
        // API endpoint not found
        showNotification('API endpoint not found. Please check your server configuration.', 'error');
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || 'Failed to fetch todos'}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setTodos(result.data || []);
        calculateStats(result.data || []);
      } else {
        throw new Error(result.error || result.message || 'Failed to fetch todos');
      }
    } catch (error) {
      console.error('Error fetching todos:', error);
      
      // Check if it's a network error
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        if (retryCount < 2) {
          // Retry up to 2 times for network errors
          setTimeout(() => fetchTodos(retryCount + 1), 1000 * (retryCount + 1));
          return;
        }
        showNotification('Network error. Please check your connection and try again.', 'error');
      } else {
        showNotification(error.message || 'Failed to load todos. Please try again.', 'error');
      }
      
      // Set empty array as fallback
      setTodos([]);
      calculateStats([]);
    } finally {
      setTodosLoading(false);
    }
  }, [isAuthenticated, calculateStats, showNotification, user, logout]);

  // Enhanced add todo with better error handling
  const addTodo = async (todoData) => {
    if (!todoData.title?.trim()) {
      showNotification('Todo title is required', 'error');
      return { success: false, error: 'Todo title is required' };
    }

    try {
      const token = localStorage.getItem('authToken') || user?.token;
      
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      };

      const response = await fetch('/api/todos', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          ...todoData,
          title: todoData.title.trim(),
          completed: false,
          createdAt: new Date().toISOString()
        }),
      });
      
      if (response.status === 401) {
        logout();
        showNotification('Session expired. Please login again.', 'error');
        return { success: false, error: 'Unauthorized' };
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || 'Failed to create todo'}`);
      }
      
      const result = await response.json();
      if (result.success) {
        const newTodos = [result.data, ...todos];
        setTodos(newTodos);
        calculateStats(newTodos);
        showNotification('Todo created successfully! 🎉');
        return { success: true };
      }
      throw new Error(result.error || result.message || 'Failed to create todo');
    } catch (error) {
      console.error('Error adding todo:', error);
      const errorMessage = error.message || 'Failed to create todo. Please try again.';
      showNotification(errorMessage, 'error');
      return { success: false, error: errorMessage };
    }
  };

  // Enhanced update todo with better error handling
  const updateTodo = async (id, todoData) => {
    if (!id) {
      showNotification('Invalid todo ID', 'error');
      return { success: false, error: 'Invalid todo ID' };
    }

    const originalTodos = [...todos];
    
    // Optimistic update
    const updatedTodos = todos.map(todo => 
      todo._id === id ? { ...todo, ...todoData, updatedAt: new Date().toISOString() } : todo
    );
    setTodos(updatedTodos);
    calculateStats(updatedTodos);

    try {
      const token = localStorage.getItem('authToken') || user?.token;
      
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      };

      const response = await fetch(`/api/todos/${id}`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          ...todoData,
          updatedAt: new Date().toISOString()
        }),
      });
      
      if (response.status === 401) {
        logout();
        showNotification('Session expired. Please login again.', 'error');
        // Revert optimistic update
        setTodos(originalTodos);
        calculateStats(originalTodos);
        return { success: false, error: 'Unauthorized' };
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || 'Failed to update todo'}`);
      }
      
      const result = await response.json();
      if (result.success) {
        const finalTodos = todos.map(todo => 
          todo._id === id ? result.data : todo
        );
        setTodos(finalTodos);
        calculateStats(finalTodos);
        showNotification('Todo updated successfully! ✨');
        return { success: true };
      }
      throw new Error(result.error || result.message || 'Failed to update todo');
    } catch (error) {
      console.error('Error updating todo:', error);
      // Revert optimistic update
      setTodos(originalTodos);
      calculateStats(originalTodos);
      const errorMessage = error.message || 'Failed to update todo. Please try again.';
      showNotification(errorMessage, 'error');
      return { success: false, error: errorMessage };
    }
  };

  // Enhanced delete todo with better error handling
  const deleteTodo = async (id) => {
    if (!id) {
      showNotification('Invalid todo ID', 'error');
      return { success: false, error: 'Invalid todo ID' };
    }

    const todoToDelete = todos.find(todo => todo._id === id);
    if (!todoToDelete) {
      showNotification('Todo not found', 'error');
      return { success: false, error: 'Todo not found' };
    }

    // Optimistic update
    const filteredTodos = todos.filter(todo => todo._id !== id);
    const originalTodos = [...todos];
    setTodos(filteredTodos);
    calculateStats(filteredTodos);

    try {
      const token = localStorage.getItem('authToken') || user?.token;
      
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      };

      const response = await fetch(`/api/todos/${id}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });
      
      if (response.status === 401) {
        logout();
        showNotification('Session expired. Please login again.', 'error');
        // Revert optimistic update
        setTodos(originalTodos);
        calculateStats(originalTodos);
        return { success: false, error: 'Unauthorized' };
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || 'Failed to delete todo'}`);
      }
      
      const result = await response.json();
      if (result.success) {
        showNotification('Todo deleted successfully! 🗑️');
        return { success: true };
      }
      throw new Error(result.error || result.message || 'Failed to delete todo');
    } catch (error) {
      console.error('Error deleting todo:', error);
      // Revert optimistic update
      setTodos(originalTodos);
      calculateStats(originalTodos);
      const errorMessage = error.message || 'Failed to delete todo. Please try again.';
      showNotification(errorMessage, 'error');
      return { success: false, error: errorMessage };
    }
  };

  // Handle logout with confirmation
  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      setTodos([]);
      setStats({ total: 0, completed: 0, pending: 0 });
      showNotification('Logged out successfully. See you soon! 👋');
    }
  };

  // Handle manual refresh
  const handleRefresh = () => {
    fetchTodos();
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchTodos();
    } else {
      setTodos([]);
      setStats({ total: 0, completed: 0, pending: 0 });
    }
  }, [isAuthenticated, fetchTodos]);

  // Loading screen with modern design
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600 mx-auto"></div>
            <div className="w-12 h-12 border-4 border-purple-200 rounded-full animate-spin border-t-purple-600 absolute top-2 left-2 opacity-70"></div>
          </div>
          <p className="mt-4 text-lg font-medium text-gray-700">Loading your workspace...</p>
          <p className="text-sm text-gray-500 mt-1">Please wait a moment</p>
        </div>
      </div>
    );
  }

  // Enhanced authentication screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-4 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute -top-4 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>
        
        <div className="relative py-12 px-4">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center transform rotate-12 shadow-lg">
                <span className="text-white text-2xl font-bold transform -rotate-12">T</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to TodoApp</h1>
              <p className="text-gray-600">Organize your life, one task at a time</p>
            </div>

            <div className="backdrop-blur-sm bg-white/80 rounded-2xl shadow-xl border border-white/20 p-8">
              {authMode === 'login' ? (
                <LoginForm onSwitchToRegister={() => setAuthMode('register')} />
              ) : (
                <RegisterForm onSwitchToLogin={() => setAuthMode('login')} />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main authenticated app with enhanced design
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Notifications */}
      {(success || error) && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 fade-in-0 duration-300">
          <div className={`px-6 py-3 rounded-lg shadow-lg backdrop-blur-sm border ${
            success 
              ? 'bg-green-50/90 border-green-200 text-green-800' 
              : 'bg-red-50/90 border-red-200 text-red-800'
          }`}>
            <p className="font-medium">{success || error}</p>
          </div>
        </div>
      )}

      {/* Enhanced Header */}
      <header className="backdrop-blur-sm bg-white/80 border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center transform rotate-12 shadow-md">
                <span className="text-white text-lg font-bold transform -rotate-12">T</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  My Todo List
                </h1>
                <p className="text-sm text-gray-500">Stay organized, stay productive</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-50/50 rounded-lg transition-all duration-200 border border-gray-200 hover:border-gray-300 backdrop-blur-sm"
                disabled={todosLoading}
              >
                {todosLoading ? '⟳' : '↻'} Refresh
              </button>
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">Welcome back, {user?.name}! 👋</p>
                <p className="text-xs text-gray-500">Ready to conquer your day?</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50/50 rounded-lg transition-all duration-200 border border-red-200 hover:border-red-300 backdrop-blur-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Dashboard */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="backdrop-blur-sm bg-white/60 rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">📝</span>
              </div>
            </div>
          </div>
          <div className="backdrop-blur-sm bg-white/60 rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">✅</span>
              </div>
            </div>
          </div>
          <div className="backdrop-blur-sm bg-white/60 rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-3xl font-bold text-orange-600">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">⏳</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Add Todo Section */}
        <div className="backdrop-blur-sm bg-white/60 rounded-2xl shadow-xl border border-white/20 p-8 mb-8 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">+</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Add New Todo</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent"></div>
          </div>
          <TodoForm onSubmit={addTodo} />
        </div>

        {/* Todo List Section */}
        <div className="backdrop-blur-sm bg-white/60 rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <div className="p-6 border-b border-gray-200/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">📋</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900">Your Tasks</h2>
              </div>
              {stats.total > 0 && (
                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    {stats.completed} of {stats.total} completed
                  </p>
                  <div className="w-32 h-2 bg-gray-200 rounded-full mt-1">
                    <div 
                      className="h-2 bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-500"
                      style={{ width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {todosLoading ? (
            <div className="text-center py-12">
              <div className="relative inline-block">
                <div className="w-12 h-12 border-4 border-gray-200 rounded-full animate-spin border-t-indigo-600"></div>
              </div>
              <p className="mt-4 text-lg font-medium text-gray-600">Loading your todos...</p>
              <p className="text-sm text-gray-500">This won&apos;t take long</p>
            </div>
          ) : todos.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">📝</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No todos yet</h3>
              <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                Start by adding your first task above. Every great journey begins with a single step!
              </p>
              <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                <span className="text-sm text-blue-700 font-medium">💡 Pro tip: Try adding a simple task to get started</span>
              </div>
              {error && (
                <button
                  onClick={handleRefresh}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              )}
            </div>
          ) : (
            <TodoList 
              todos={todos}
              onUpdate={updateTodo}
              onDelete={deleteTodo}
            />
          )}
        </div>
      </main>
    </div>
  );
}