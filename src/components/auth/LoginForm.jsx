"use client";
import { useState } from 'react';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AuthInput from './AuthInput';

export default function LoginForm({ onSwitch }) {
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const set = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (!form.identifier.trim()) errs.identifier = 'Email or username is required';
    if (!form.password) errs.password = 'Password is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    
    setErrors({});
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: form.identifier, password: form.password }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Display the error returned from your TiDB database/API
        setErrors({ server: data.error || 'Invalid credentials' });
        setLoading(false);
        return;
      }

      // Success! The API has set the HttpOnly cookie.
      if (data.user?.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
      router.refresh(); // Forces Next.js to update the UI with the new auth state
      
    } catch (error) {
      setErrors({ server: 'An unexpected error occurred. Please try again.' });
      setLoading(false);
    }
  };

  const canSubmit = form.identifier.trim() && form.password && !loading;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="mb-2">
        <h2 className="text-lg font-bold text-white">Welcome back</h2>
        <p className="text-sm text-[#8b9cb8] mt-0.5">Log in to find your teammates</p>
      </div>

      {errors.server && (
        <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-sm font-medium text-center">
          {errors.server}
        </div>
      )}

      <AuthInput
        label="Email or Username"
        type="text"
        placeholder="Enter your email or username"
        value={form.identifier}
        onChange={set('identifier')}
        error={errors.identifier}
        icon={Mail}
      />
      <AuthInput
        label="Password"
        type="password"
        placeholder="Enter your password"
        value={form.password}
        onChange={set('password')}
        error={errors.password}
        icon={Lock}
      />

      <div className="flex justify-end">
        <button type="button" className="text-xs text-primary hover:text-primary/80 transition-colors">
          Forgot password?
        </button>
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-all duration-200 shadow-md shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-0.5 mt-2"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : null}
        {loading ? 'Logging in...' : 'Login'}
      </button>

      <p className="text-center text-sm text-[#8b9cb8] pt-1">
        Don't have an account?{' '}
        <button type="button" onClick={onSwitch} className="text-primary hover:text-primary/80 font-semibold transition-colors">
          Sign Up
        </button>
      </p>
    </form>
  );
}