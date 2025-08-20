'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function RegisterForm({ onSwitchToLogin }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, message: '', color: '' });
  const [fieldValidation, setFieldValidation] = useState({
    name: { isValid: false, message: '' },
    email: { isValid: false, message: '' },
    password: { isValid: false, message: '' },
    confirmPassword: { isValid: false, message: '' },
  });

  const { register } = useAuth();

  // Password strength calculator
  const calculatePasswordStrength = (password) => {
    let score = 0;
    let message = '';
    let color = '';

    if (!password) {
      return { score: 0, message: '', color: '' };
    }

    // Length check
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;

    // Character variety checks
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    switch (score) {
      case 0:
      case 1:
        message = 'Very Weak';
        color = 'red';
        break;
      case 2:
      case 3:
        message = 'Weak';
        color = 'orange';
        break;
      case 4:
        message = 'Good';
        color = 'yellow';
        break;
      case 5:
        message = 'Strong';
        color = 'green';
        break;
      case 6:
        message = 'Very Strong';
        color = 'emerald';
        break;
      default:
        message = 'Very Strong';
        color = 'emerald';
    }

    return { score, message, color };
  };

  // Validate individual fields
  const validateField = (name, value) => {
    let isValid = false;
    let message = '';

    switch (name) {
      case 'name':
        isValid = value.trim().length >= 2;
        message = isValid ? '✓ Name looks good' : 'Name must be at least 2 characters';
        break;
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        isValid = emailRegex.test(value);
        message = isValid ? '✓ Valid email address' : 'Please enter a valid email address';
        break;
      case 'password':
        isValid = value.length >= 6;
        message = isValid ? '✓ Password meets requirements' : 'Password must be at least 6 characters';
        break;
      case 'confirmPassword':
        isValid = value === formData.password && value.length > 0;
        message = isValid ? '✓ Passwords match' : value.length > 0 ? 'Passwords do not match' : 'Please confirm your password';
        break;
    }

    return { isValid, message };
  };

  useEffect(() => {
    if (formData.password) {
      setPasswordStrength(calculatePasswordStrength(formData.password));
    }
  }, [formData.password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Enhanced validation
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }

    if (!formData.password) {
      setError('Password is required');
      return;
    }

    if (!formData.confirmPassword) {
      setError('Please confirm your password');
      return;
    }

    // Validate all fields
    const validations = {
      name: validateField('name', formData.name),
      email: validateField('email', formData.email),
      password: validateField('password', formData.password),
      confirmPassword: validateField('confirmPassword', formData.confirmPassword),
    };

    const hasErrors = !Object.values(validations).every(v => v.isValid);
    if (hasErrors) {
      const firstError = Object.values(validations).find(v => !v.isValid);
      setError(firstError.message.replace('✓ ', ''));
      return;
    }

    setLoading(true);
    
    try {
      const result = await register(formData.email.trim(), formData.password, formData.name.trim());
      
      if (!result.success) {
        setError(result.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    }
    
    setLoading(false);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Real-time validation
    const validation = validateField(field, value);
    setFieldValidation(prev => ({ ...prev, [field]: validation }));
    
    // Clear error when user starts typing
    if (error) setError('');
  };

  const getFieldBorderColor = (fieldName) => {
    const field = fieldValidation[fieldName];
    if (!formData[fieldName]) return 'border-gray-200';
    return field.isValid ? 'border-green-300' : 'border-red-300';
  };

  const getPasswordStrengthBar = () => {
    const { score, color } = passwordStrength;
    const width = (score / 6) * 100;
    
    const colorClasses = {
      red: 'bg-red-500',
      orange: 'bg-orange-500',
      yellow: 'bg-yellow-500',
      green: 'bg-green-500',
      emerald: 'bg-emerald-500',
    };

    return (
      <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${colorClasses[color] || 'bg-gray-200'}`}
          style={{ width: `${width}%` }}
        ></div>
      </div>
    );
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-200">
          <span className="text-white text-2xl">✨</span>
        </div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
          Create Account
        </h2>
        <p className="text-gray-600">Join us and start organizing your life</p>
      </div>
      
      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center space-x-3 animate-in slide-in-from-top-2 fade-in-0 duration-300">
          <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-red-600 text-xs">!</span>
          </div>
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name Field */}
        <div className="space-y-2">
          <label htmlFor="name" className="block text-sm font-semibold text-gray-700">
            Full Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span className="text-gray-400 text-lg">👤</span>
            </div>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full pl-12 pr-4 py-3 border ${getFieldBorderColor('name')} rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 bg-gray-50 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed`}
              placeholder="Enter your full name"
              disabled={loading}
              autoComplete="name"
            />
          </div>
          {formData.name && (
            <p className={`text-xs ${fieldValidation.name.isValid ? 'text-green-600' : 'text-red-600'}`}>
              {fieldValidation.name.message}
            </p>
          )}
        </div>

        {/* Email Field */}
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span className="text-gray-400 text-lg">📧</span>
            </div>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`w-full pl-12 pr-4 py-3 border ${getFieldBorderColor('email')} rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 bg-gray-50 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed`}
              placeholder="Enter your email address"
              disabled={loading}
              autoComplete="email"
            />
          </div>
          {formData.email && (
            <p className={`text-xs ${fieldValidation.email.isValid ? 'text-green-600' : 'text-red-600'}`}>
              {fieldValidation.email.message}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span className="text-gray-400 text-lg">🔑</span>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className={`w-full pl-12 pr-12 py-3 border ${getFieldBorderColor('password')} rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 bg-gray-50 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed`}
              placeholder="Create a strong password"
              disabled={loading}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
              disabled={loading}
            >
              <span className="text-lg">
                {showPassword ? '🙈' : '👁️'}
              </span>
            </button>
          </div>
          
          {/* Password Strength Indicator */}
          {formData.password && (
            <div className="space-y-2">
              {getPasswordStrengthBar()}
              <div className="flex justify-between items-center">
                <p className={`text-xs font-medium ${
                  passwordStrength.color === 'red' ? 'text-red-600' :
                  passwordStrength.color === 'orange' ? 'text-orange-600' :
                  passwordStrength.color === 'yellow' ? 'text-yellow-600' :
                  passwordStrength.color === 'green' ? 'text-green-600' :
                  'text-emerald-600'
                }`}>
                  {passwordStrength.message}
                </p>
                <p className="text-xs text-gray-500">
                  {formData.password.length}/12+ chars
                </p>
              </div>
            </div>
          )}
          
          {formData.password && (
            <p className={`text-xs ${fieldValidation.password.isValid ? 'text-green-600' : 'text-red-600'}`}>
              {fieldValidation.password.message}
            </p>
          )}
        </div>

        {/* Confirm Password Field */}
        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700">
            Confirm Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span className="text-gray-400 text-lg">🔒</span>
            </div>
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              className={`w-full pl-12 pr-12 py-3 border ${getFieldBorderColor('confirmPassword')} rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 bg-gray-50 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed`}
              placeholder="Confirm your password"
              disabled={loading}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
              disabled={loading}
            >
              <span className="text-lg">
                {showConfirmPassword ? '🙈' : '👁️'}
              </span>
            </button>
          </div>
          {formData.confirmPassword && (
            <p className={`text-xs ${fieldValidation.confirmPassword.isValid ? 'text-green-600' : 'text-red-600'}`}>
              {fieldValidation.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Terms and Privacy */}
        <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-xl">
          <input
            type="checkbox"
            id="terms"
            className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2 mt-0.5"
            disabled={loading}
          />
          <label htmlFor="terms" className="text-sm text-gray-600">
            I agree to the{' '}
            <a href="#" className="text-purple-600 hover:text-purple-800 font-medium">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-purple-600 hover:text-purple-800 font-medium">Privacy Policy</a>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full relative overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {loading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Creating account...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <span>Create Account</span>
              <span className="text-lg">🎉</span>
            </div>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="mt-8 mb-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500 font-medium">Already have an account?</span>
          </div>
        </div>
      </div>

      {/* Switch to Login */}
      <div className="text-center">
        <button
          onClick={onSwitchToLogin}
          disabled={loading}
          className="group relative inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-purple-600 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 hover:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="flex items-center space-x-2">
            <span>Sign in to existing account</span>
            <span className="group-hover:translate-x-1 transition-transform duration-200">🚪</span>
          </span>
        </button>
      </div>

      {/* Benefits Section */}
      <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-100">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 text-center">Why join TodoApp?</h3>
        <div className="grid grid-cols-1 gap-3">
          <div className="flex items-center space-x-3 text-sm text-gray-700">
            <span className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-xs">📝</span>
            <span>Organize tasks effortlessly</span>
          </div>
          <div className="flex items-center space-x-3 text-sm text-gray-700">
            <span className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-xs">📊</span>
            <span>Track your productivity</span>
          </div>
          <div className="flex items-center space-x-3 text-sm text-gray-700">
            <span className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-xs">🔄</span>
            <span>Sync across all devices</span>
          </div>
        </div>
      </div>
    </div>
  );
}