import { useState } from 'react';
import LoginForm from '../components/auth/LoginForm';
import SignupForm from '../components/auth/SignupForm';
import { cn } from '../lib/utils';

export default function Auth() {
  const [tab, setTab] = useState('login');

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30 mb-3">
            <span className="text-white font-bold text-xl">Q</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">QueueMate</h1>
          <p className="text-[#8b9cb8] text-sm mt-1">Find your perfect gaming teammates</p>
        </div>

        {/* Card */}
        <div className="bg-[#111827] border border-[#1f2d40] rounded-2xl shadow-2xl shadow-black/40 overflow-hidden">
          {/* Tab switcher */}
          <div className="flex bg-[#0d1521] p-1.5 m-4 rounded-xl border border-[#1f2d40]">
            {['login', 'signup'].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  'flex-1 py-2 text-sm font-semibold rounded-lg capitalize transition-all duration-200',
                  tab === t
                    ? 'bg-primary text-white shadow-md shadow-primary/30'
                    : 'text-[#8b9cb8] hover:text-white'
                )}
              >
                {t === 'login' ? 'Login' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* Form area */}
          <div className="px-6 pb-6">
            <div className={cn('transition-all duration-300', tab === 'login' ? 'block animate-fade-in' : 'hidden')}>
              <LoginForm onSwitch={() => setTab('signup')} />
            </div>
            <div className={cn('transition-all duration-300', tab === 'signup' ? 'block animate-fade-in' : 'hidden')}>
              <SignupForm onSwitch={() => setTab('login')} />
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-[#4a5568] mt-6">
          By continuing, you agree to QueueMate's Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}