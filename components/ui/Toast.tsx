import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = type === 'success' 
    ? 'bg-emerald-500 shadow-emerald-500/20' 
    : 'bg-red-500 shadow-red-500/20';

  return (
    <div className={`fixed bottom-8 right-8 z-[200] ${styles} text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-in-up border border-white/20 min-w-[320px]`}>
      <div className="bg-white/20 p-2 rounded-xl">
        {type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
      </div>
      <div className="flex-1">
        <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">{type === 'success' ? 'Sucesso' : 'Erro'}</p>
        <p className="text-xs font-bold">{message}</p>
      </div>
      <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
        <X size={16} />
      </button>
    </div>
  );
};
