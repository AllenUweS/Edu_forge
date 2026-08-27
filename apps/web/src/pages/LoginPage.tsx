import React, { useState } from 'react';
import { Eye, EyeOff, Lock, User, ArrowRight, ShieldCheck } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin@123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      localStorage.setItem('eduforge_auth', 'true');
      onLoginSuccess();
    }, 400);
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

      {/* Centered Login Card */}
      <div className="relative z-20 max-w-md w-full mx-4 p-8 rounded-3xl bg-white/90 backdrop-blur-md shadow-2xl border border-white/40 space-y-6 animate-in fade-in zoom-in-95 duration-300">
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

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs font-semibold text-slate-800">
          <div>
            <label className="block text-[11px] font-extrabold uppercase text-slate-500 mb-1.5 tracking-wide">
              Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-slate-900 bg-white/90 focus:outline-hidden focus:ring-2 focus:ring-teal-600 font-medium"
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
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-xl text-slate-900 bg-white/90 focus:outline-hidden focus:ring-2 focus:ring-teal-600 font-medium"
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
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" /> Admin / Faculty Access
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 mt-2"
          >
            {isLoading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to EduForge</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="text-center pt-2 border-t border-slate-200/60">
          <p className="text-[11px] text-slate-400 font-medium">
            EduForge Suite v1.0 · HAEGL Technologies
          </p>
        </div>
      </div>
    </div>
  );
};
