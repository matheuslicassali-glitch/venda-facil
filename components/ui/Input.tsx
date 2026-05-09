import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => {
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest italic ml-1">
          {label}
        </label>
      )}
      <input 
        className={`w-full h-12 px-4 bg-card text-card-foreground border border-border rounded-xl font-bold text-foreground placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-ring/10 focus:border-blue-500 transition-all ${error ? 'border-red-500 ring-red-500/10' : ''} ${className}`}
        {...props} 
      />
      {error && <p className="text-[10px] font-bold text-red-500 ml-1 italic">{error}</p>}
    </div>
  );
};

export const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string, error?: string }> = ({ label, error, className = '', ...props }) => {
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest italic ml-1">
          {label}
        </label>
      )}
      <textarea 
        className={`w-full px-4 py-3 bg-card text-card-foreground border border-border rounded-xl font-bold text-foreground placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-ring/10 focus:border-blue-500 transition-all ${error ? 'border-red-500 ring-red-500/10' : ''} ${className}`}
        rows={3}
        {...props} 
      />
      {error && <p className="text-[10px] font-bold text-red-500 ml-1 italic">{error}</p>}
    </div>
  );
};
