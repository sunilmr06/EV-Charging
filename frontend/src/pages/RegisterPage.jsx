import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Zap, AlertCircle, Loader2 } from 'lucide-react';

const RegisterPage = () => {
  const { register: registerUser, error: authError } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [customError, setCustomError] = useState(null);
  const navigate = useNavigate();

  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const password = watch('password');

  const onSubmit = async (data) => {
    setSubmitting(true);
    setCustomError(null);
    
    const success = await registerUser(data.username, data.email, data.password);
    setSubmitting(false);
    
    if (success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-100 shadow-soft-lg space-y-6">
          
          <div className="text-center space-y-2">
            <div className="bg-primary-50 text-primary-600 p-3 rounded-2xl w-12 h-12 flex items-center justify-center mx-auto shadow-soft">
              <Zap className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900">Create Account</h2>
            <p className="text-sm text-slate-400">Join the smart EV charging revolution</p>
          </div>

          {(authError || customError) && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start space-x-3 text-red-700">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <span className="text-sm font-medium">{authError || customError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Username / Driver ID</label>
              <input
                type="text"
                {...register('username', { 
                  required: 'Username is required',
                  minLength: { value: 3, message: 'Username must be at least 3 characters' }
                })}
                className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:bg-white text-sm transition-all ${
                  errors.username ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-primary-500'
                }`}
                placeholder="driver123"
              />
              {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Email Address</label>
              <input
                type="email"
                {...register('email', { 
                  required: 'Email is required',
                  pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' }
                })}
                className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:bg-white text-sm transition-all ${
                  errors.email ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-primary-500'
                }`}
                placeholder="driver@example.com"
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Password</label>
              <input
                type="password"
                {...register('password', { 
                  required: 'Password is required',
                  minLength: { value: 6, message: 'Password must be at least 6 characters' }
                })}
                className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:bg-white text-sm transition-all ${
                  errors.password ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-primary-500'
                }`}
                placeholder="••••••••"
              />
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Confirm Password</label>
              <input
                type="password"
                {...register('confirmPassword', { 
                  required: 'Confirm password is required',
                  validate: value => value === password || 'Passwords do not match'
                })}
                className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:outline-none focus:bg-white text-sm transition-all ${
                  errors.confirmPassword ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-primary-500'
                }`}
                placeholder="••••••••"
              />
              {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white rounded-xl font-bold transition-all shadow-soft flex items-center justify-center space-x-2 text-sm"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <span>Register & Login</span>
              )}
            </button>
          </form>

          <div className="text-center pt-2 border-t border-slate-100">
            <p className="text-sm text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700 transition-colors">
                Sign in
              </Link>
            </p>
          </div>

        </div>
      </div>

      <Footer />
    </div>
  );
};

export default RegisterPage;
