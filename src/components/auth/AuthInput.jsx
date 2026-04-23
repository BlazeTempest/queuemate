import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function AuthInput({ label, type = 'text', placeholder, value, onChange, error, icon: Icon }) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (show ? 'text' : 'password') : type;

  return (
    <div className="space-y-1.5">
      {label && <label className="text-xs font-medium text-[#8b9cb8] uppercase tracking-wider">{label}</label>}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a5568]">
            <Icon size={16} />
          </div>
        )}
        <input
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={cn(
            'w-full bg-[#0d1521] border text-sm text-white placeholder:text-[#4a5568] rounded-xl outline-none transition-all duration-200',
            'py-2.5 pr-10',
            Icon ? 'pl-9' : 'pl-3.5',
            error
              ? 'border-red-500/60 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
              : 'border-[#1f2d40] focus:border-primary/60 focus:ring-2 focus:ring-primary/20'
          )}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4a5568] hover:text-[#8b9cb8] transition-colors"
          >
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-400 flex items-center gap-1 mt-1">{error}</p>}
    </div>
  );
}