'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function LoginForm({ onSwitchToRegister }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Enhanced validation
    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }
    
    if (!formData.password) {
      setError('Password is required');
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    
    try {
      const result = await login(formData.email.trim(), formData.password);
      
      if (!result.success) {
        setError(result.error || 'Login failed. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    }
    
    setLoading(false);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-xl transform hover:scale-105 hover:rotate-3 transition-all duration-300">
          <span className="text-white text-3xl">🔐</span>
        </div>
        <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-3">
          Welcome Back
        </h2>
        <p className="text-gray-600 text-lg">Sign in to continue your journey</p>
      </div>
      
      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-400 text-red-800 rounded-xl shadow-sm animate-in slide-in-from-top-2 fade-in-0 duration-300">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-red-600 text-sm font-bold">!</span>
            </div>
            <span className="text-sm font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Field */}
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-bold text-gray-800 mb-2">
            Email Address
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
              <span className="text-gray-400 text-xl group-focus-within:text-blue-500 transition-colors duration-200">📧</span>
            </div>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full pl-14 pr-4 py-4 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 bg-gray-50 hover:bg-white hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed group"
              placeholder="Enter your email address"
              disabled={loading}
              autoComplete="email"
            />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-focus-within:opacity-20 pointer-events-none transition-opacity duration-200"></div>
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-bold text-gray-800 mb-2">
            Password
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
              <span className="text-gray-400 text-xl group-focus-within:text-blue-500 transition-colors duration-200">🔑</span>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className="w-full pl-14 pr-14 py-4 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 bg-gray-50 hover:bg-white hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed group"
              placeholder="Enter your password"
              disabled={loading}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-blue-600 transition-all duration-200 z-10 hover:scale-110"
              disabled={loading}
            >
              <span className="text-xl">
                {showPassword ? '🙈' : '👁️'}
              </span>
            </button>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-focus-within:opacity-20 pointer-events-none transition-opacity duration-200"></div>
          </div>
        </div>

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between pt-2">
          <label className="flex items-center group cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded-md focus:ring-blue-500 focus:ring-2 transition-all duration-200"
              disabled={loading}
            />
            <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900 transition-colors duration-200 font-medium">Remember me</span>
          </label>
          <button
            type="button"
            className="text-sm text-blue-600 hover:text-blue-800 font-semibold transition-all duration-200 hover:underline"
            disabled={loading}
          >
            Forgot password?
          </button>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white font-bold py-4 px-6 rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-[1.02] hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          {loading ? (
            <div className="flex items-center justify-center space-x-3 relative z-10">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span className="text-lg">Signing in...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-3 relative z-10">
              <span className="text-lg">Sign In</span>
              <span className="text-xl">🚀</span>
            </div>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="mt-10 mb-8">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t-2 border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-base">
            <span className="px-6 bg-white text-gray-600 font-semibold">New to TodoApp?</span>
          </div>
        </div>
      </div>

      {/* Switch to Register */}
      <div className="text-center">
        <button
          onClick={onSwitchToRegister}
          disabled={loading}
          className="group relative inline-flex items-center justify-center px-8 py-4 text-base font-bold text-blue-700 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl hover:bg-gradient-to-r hover:from-blue-100 hover:to-purple-100 hover:border-blue-300 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
        >
          <span className="flex items-center space-x-3">
            <span>Create new account</span>
            <span className="text-xl group-hover:translate-x-1 group-hover:scale-110 transition-all duration-300">✨</span>
          </span>
        </button>
      </div>

      {/* Demo Credentials (for development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-5 bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400 rounded-xl shadow-sm">
          <h4 className="text-sm font-bold text-yellow-800 mb-3 flex items-center">
            <span className="mr-2">🧪</span>
            Demo Credentials
          </h4>
          <div className="text-sm text-yellow-700 mb-3 space-y-1">
            <p><strong>Email:</strong> demo@example.com</p>
            <p><strong>Password:</strong> demo123</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setFormData({ email: 'demo@example.com', password: 'demo123' });
              setError('');
            }}
            className="text-sm text-yellow-600 hover:text-yellow-800 font-semibold underline hover:no-underline transition-all duration-200"
            disabled={loading}
          >
            Fill demo credentials
          </button>
        </div>
      )}
    </div>
  );
}