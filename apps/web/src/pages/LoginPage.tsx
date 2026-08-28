import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck, UserPlus, LogIn, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase.js';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        // Sign Up with Supabase Auth
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim()
        });

        if (error) {
          throw error;
        }

        if (data.session) {
          const cleanEmail = (data.session.user.email || '').toLowerCase().trim();

          let defaultSub: 'Physics' | 'Chemistry' | 'Biology' | 'Mathematics' | 'All' | 'None' = 'None';
          let defaultRole: 'admin' | 'faculty' | 'guest' = 'guest';
          let defaultName = 'User';

          if (cleanEmail === 'admin@eduforge.com' || cleanEmail.startsWith('admin@')) {
            defaultSub = 'All';
            defaultRole = 'admin';
            defaultName = 'System Admin';
          } else if (cleanEmail.includes('physics')) {
            defaultSub = 'Physics';
            defaultRole = 'faculty';
            defaultName = 'Physics Faculty';
          } else if (cleanEmail.includes('chemistry')) {
            defaultSub = 'Chemistry';
            defaultRole = 'faculty';
            defaultName = 'Chemistry Faculty';
          } else if (cleanEmail.includes('biology')) {
            defaultSub = 'Biology';
            defaultRole = 'faculty';
            defaultName = 'Biology Faculty';
          } else if (cleanEmail.includes('maths') || cleanEmail.includes('math')) {
            defaultSub = 'Mathematics';
            defaultRole = 'faculty';
            defaultName = 'Mathematics Faculty';
          } else {
            defaultSub = 'None';
            defaultRole = 'guest';
            defaultName = cleanEmail.split('@')[0] || 'Guest User';
          }

          const userProfile = {
            email: data.session.user.email,
            name: defaultName,
            role: defaultRole,
            assigned_subject: defaultSub
          };
          localStorage.setItem('eduforge_auth', 'true');
          localStorage.setItem('eduforge_user', JSON.stringify(userProfile));
          onLoginSuccess();
        } else {
          setSuccessMessage('Registration successful! Please log in with your credentials.');
          setIsSignUp(false);
        }
      } else {
        // Sign In with Supabase Auth
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim()
        });

        if (error) {
          throw error;
        }

        if (data.session) {
          const cleanEmail = (data.session.user.email || '').toLowerCase().trim();

          let defaultSub: 'Physics' | 'Chemistry' | 'Biology' | 'Mathematics' | 'All' | 'None' = 'None';
          let defaultRole: 'admin' | 'faculty' | 'guest' = 'guest';
          let defaultName = 'User';

          if (cleanEmail === 'admin@eduforge.com' || cleanEmail.startsWith('admin@')) {
            defaultSub = 'All';
            defaultRole = 'admin';
            defaultName = 'System Admin';
          } else if (cleanEmail.includes('physics')) {
            defaultSub = 'Physics';
            defaultRole = 'faculty';
            defaultName = 'Physics Faculty';
          } else if (cleanEmail.includes('chemistry')) {
            defaultSub = 'Chemistry';
            defaultRole = 'faculty';
            defaultName = 'Chemistry Faculty';
          } else if (cleanEmail.includes('biology')) {
            defaultSub = 'Biology';
            defaultRole = 'faculty';
            defaultName = 'Biology Faculty';
          } else if (cleanEmail.includes('maths') || cleanEmail.includes('math')) {
            defaultSub = 'Mathematics';
            defaultRole = 'faculty';
            defaultName = 'Mathematics Faculty';
          } else {
            defaultSub = 'None';
            defaultRole = 'guest';
            defaultName = cleanEmail.split('@')[0] || 'User';
          }

          const userProfile = {
            email: data.session.user.email,
            name: defaultName,
            role: defaultRole,
            assigned_subject: defaultSub
          };
          localStorage.setItem('eduforge_auth', 'true');
          localStorage.setItem('eduforge_user', JSON.stringify(userProfile));
          onLoginSuccess();
        }
      }
    } catch (err: any) {
      console.error('Supabase Auth Error:', err);
      setErrorMessage(err?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden flex items-center justify-center font-sans bg-slate-950">
      {/* Fullscreen Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0 filter brightness-90 contrast-105 scale-[1.01]"
      >
        <source src="/eduforge_login.mp4" type="video/mp4" />
      </video>

      {/* Dark Blur Overlay */}
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs z-10" />

      {/* Centered Auth Card */}
      <div className="relative z-20 max-w-md w-full mx-4 p-8 rounded-3xl bg-white/95 backdrop-blur-md shadow-2xl border border-white/40 space-y-6 animate-in fade-in zoom-in-95 duration-300">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-700 to-teal-500 text-white shadow-lg shadow-teal-700/30 mb-1">
            <span className="font-black text-2xl tracking-tighter">E</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight font-sans">
            EduForge
          </h1>
          <p className="text-xs text-slate-600 font-medium">
            Desktop Question Paper Authoring & Exam Suite
          </p>
        </div>

        {/* Tab Switcher: Sign In vs Sign Up */}
        <div className="flex bg-slate-100 p-1 rounded-xl font-bold text-xs">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(false);
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              !isSignUp ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" /> Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(true);
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              isSignUp ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" /> Register / Sign Up
          </button>
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl animate-in fade-in">
            {successMessage}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-slate-800">
          <div>
            <label className="block text-[11px] font-extrabold uppercase text-slate-500 mb-1.5 tracking-wide">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@eduforge.com"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-600 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-extrabold uppercase text-slate-500 mb-1.5 tracking-wide">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-xl text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-600 font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" /> Supabase Cloud Authentication
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 mt-2"
          >
            {isLoading ? (
              <span>Connecting to Supabase...</span>
            ) : (
              <>
                <span>{isSignUp ? 'Create Supabase Account' : 'Sign In with Supabase'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="text-center pt-2 border-t border-slate-200/60">
          <p className="text-[11px] text-slate-400 font-medium">
            EduForge Suite v1.0 · Secured by Supabase Auth
          </p>
        </div>
      </div>
    </div>
  );
};
