import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in-fade">
      <div className={`bg-card text-card-foreground rounded-[2rem] shadow-2xl w-full ${maxWidth} overflow-hidden animate-in-up border border-white/20`}>
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-50 bg-background text-foreground/50">
          <h2 className="text-sm font-black text-foreground uppercase tracking-widest italic">{title}</h2>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-card text-card-foreground rounded-xl text-muted-foreground hover:text-red-500 transition-all active:scale-90"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  );
};
