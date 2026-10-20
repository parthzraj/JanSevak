import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ShieldCheck, Sparkles, ArrowRight, UserCheck, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const LoginScreen: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useApp();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('ayush.sharma@prajapulse.org');
  const [password, setPassword] = useState('prajapulse2026');
  const [name, setName] = useState('Ayush Sharma');
  const [ward, setWard] = useState('Ward 112 (Indiranagar)');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email, isRegister ? name : undefined);
    navigate('/home');
  };

  const handleQuickDemo = () => {
    login('ayush.sharma@prajapulse.org', 'Ayush Sharma');
    navigate('/home');
  };

  const handleGuestAccess = () => {
    login('citizen.guest@prajapulse.org', 'Citizen Guest');
    navigate('/home');
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between p-4 sm:p-6 max-w-md mx-auto w-full">
      {/* Top Branding Section */}
      <div className="pt-4 flex flex-col items-center text-center">
        {/* Brand Icon Badge */}
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#0f2d59] via-[#1b6843] to-[#1d4e8c] text-white flex items-center justify-center shadow-xl shadow-[#0f2d59]/25 mb-3">
          <svg
            className="w-8 h-8"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] tracking-tight">
          PrajaPulse
        </h1>
        <p className="text-xs sm:text-sm font-semibold text-[#0f2d59] mt-1 tracking-wide">
          Your City. Your Voice. Your Impact.
        </p>
        <p className="text-xs text-[#64748b] mt-1 max-w-xs">
          A modern citizen engagement platform to report civic issues and celebrate positive local impact.
        </p>
      </div>

      {/* Welcoming Civic Illustration Banner */}
      <div className="my-4 p-4 rounded-3xl bg-gradient-to-br from-[#eff6ff] via-[#edf8f1] to-white border border-[#1d4e8c]/20 shadow-xs relative overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#0f2d59] text-white flex items-center justify-center shrink-0 shadow-md">
            <Sparkles className="w-6 h-6 text-[#d97706]" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#0f2d59] uppercase tracking-wider block">
              Citizen Power in Action
            </span>
            <p className="text-xs font-semibold text-[#0f172a]">
              Over 1,400+ neighborhood problems resolved together this month!
            </p>
          </div>
        </div>

        {/* Small Visual Civic Chips */}
        <div className="grid grid-cols-3 gap-1.5 mt-3 pt-3 border-t border-[#0f2d59]/10 text-center">
          <div className="bg-white/80 rounded-xl p-1.5 border border-[#0f2d59]/10">
            <span className="text-[10px] text-[#64748b] block">Speed</span>
            <span className="text-xs font-bold text-[#0f2d59]">Avg 38h</span>
          </div>
          <div className="bg-white/80 rounded-xl p-1.5 border border-[#0f2d59]/10">
            <span className="text-[10px] text-[#64748b] block">Accuracy</span>
            <span className="text-xs font-bold text-[#0f2d59]">94% Verified</span>
          </div>
          <div className="bg-white/80 rounded-xl p-1.5 border border-[#0f2d59]/10">
            <span className="text-[10px] text-[#64748b] block">Rewards</span>
            <span className="text-xs font-bold text-[#d97706]">Trophy Pts</span>
          </div>
        </div>
      </div>

      {/* Main Login / Register Card */}
      <div className="bg-white rounded-3xl p-5 border border-[#cbd5e1] shadow-sm">
        <div className="flex items-center justify-between mb-4 border-b border-[#cbd5e1] pb-3">
          <button
            type="button"
            onClick={() => setIsRegister(false)}
            className={`text-xs font-bold pb-1 transition-all border-b-2 ${
              !isRegister
                ? 'border-[#0f2d59] text-[#0f2d59]'
                : 'border-transparent text-[#64748b] hover:text-[#0f172a]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setIsRegister(true)}
            className={`text-xs font-bold pb-1 transition-all border-b-2 ${
              isRegister
                ? 'border-[#0f2d59] text-[#0f2d59]'
                : 'border-transparent text-[#64748b] hover:text-[#0f172a]'
            }`}
          >
            Create Citizen Account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {isRegister && (
            <>
              <div>
                <label className="text-[11px] font-bold text-[#0f172a] block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ayush Sharma"
                  className="w-full text-xs bg-[#f8fafc] border border-[#cbd5e1] rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#0f2d59] focus:bg-white text-[#0f172a]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#0f172a] block mb-1">
                  Neighborhood / Ward
                </label>
                <input
                  type="text"
                  required
                  value={ward}
                  onChange={(e) => setWard(e.target.value)}
                  placeholder="e.g. Indiranagar (Ward 112)"
                  className="w-full text-xs bg-[#f8fafc] border border-[#cbd5e1] rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#0f2d59] focus:bg-white text-[#0f172a]"
                />
              </div>
            </>
          )}

          <div>
            <label className="text-[11px] font-bold text-[#0f172a] block mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full text-xs bg-[#f8fafc] border border-[#cbd5e1] rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#0f2d59] focus:bg-white text-[#0f172a]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-[#0f172a]">
                Password
              </label>
              {!isRegister && (
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[11px] text-[#0f2d59] hover:underline font-semibold"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs bg-[#f8fafc] border border-[#cbd5e1] rounded-xl px-3 py-2.5 pr-10 focus:outline-none focus:border-[#0f2d59] focus:bg-white text-[#0f172a]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#0f172a]"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl bg-[#0f2d59] hover:bg-[#1d4e8c] text-white font-bold text-xs shadow-md shadow-[#0f2d59]/20 transition-all flex items-center justify-center gap-2 active:scale-98"
          >
            <span>{isRegister ? 'Register & Join PrajaPulse' : 'Sign In to PrajaPulse'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-3 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#cbd5e1]" />
          </div>
          <span className="relative bg-white px-3 text-[10px] text-[#64748b] uppercase font-semibold">
            Or Quick Access
          </span>
        </div>

        {/* One-Tap Demo Login Button */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleQuickDemo}
            className="w-full py-2.5 px-3 rounded-xl bg-[#eff6ff] border border-[#1d4e8c]/30 hover:bg-[#0f2d59] hover:text-white text-[#0f2d59] font-bold text-xs transition-colors flex items-center justify-center gap-2 group"
          >
            <UserCheck className="w-4 h-4 text-[#0f2d59] group-hover:text-white" />
            <span>One-Tap Demo Login (Ayush · Ward 112)</span>
          </button>

          {/* Continue with Google button as visual demo */}
          <button
            type="button"
            onClick={handleQuickDemo}
            className="w-full py-2.5 px-3 rounded-xl bg-white border border-[#cbd5e1] hover:bg-[#f8fafc] text-[#0f172a] font-medium text-xs transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <button
            type="button"
            onClick={handleGuestAccess}
            className="w-full py-2 text-center text-xs text-[#64748b] hover:text-[#0f172a] font-medium"
          >
            Explore as Guest Viewer
          </button>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowForgotModal(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-[#0f172a]">
              Reset Password
            </h3>
            {forgotSubmitted ? (
              <div className="p-4 bg-[#eff6ff] rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-[#0f2d59] mx-auto" />
                <p className="text-xs font-bold text-[#0f2d59]">
                  Demo Link Dispatched!
                </p>
                <p className="text-xs text-[#64748b]">
                  Password reset instructions simulated for {forgotEmail || email}.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotSubmitted(false);
                  }}
                  className="mt-2 w-full py-2 bg-[#0f2d59] text-white rounded-xl text-xs font-bold"
                >
                  Return to Login
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setForgotSubmitted(true);
                }}
                className="space-y-3"
              >
                <p className="text-xs text-[#64748b]">
                  Enter your email address and we will simulate sending a secure reset link.
                </p>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="Enter your registered email"
                  className="w-full text-xs bg-[#f8fafc] border border-[#cbd5e1] rounded-xl px-3 py-2.5 text-[#0f172a]"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-[#cbd5e1] text-xs font-medium text-[#64748b]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-[#0f2d59] text-white text-xs font-bold"
                  >
                    Send Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="text-center py-2 text-[10px] text-[#64748b]">
        <p>PrajaPulse Civic Network · Mobile Prototype Demo</p>
      </div>
    </div>
  );
};
