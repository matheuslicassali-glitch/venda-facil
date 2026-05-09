import React from 'react';
import { Modal } from './Modal';
import { AlertCircle, Check, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'danger' | 'warning' | 'info';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Sim, Confirmar',
  cancelLabel = 'Cancelar',
  type = 'info'
}) => {
  const iconMap = {
    danger: <AlertCircle className="text-red-500" size={48} />,
    warning: <AlertCircle className="text-amber-500" size={48} />,
    info: <AlertCircle className="text-primary" size={48} />,
  };

  const buttonClasses = {
    danger: 'bg-red-500 hover:bg-red-600 text-white shadow-red-200',
    warning: 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200',
    info: 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="flex flex-col items-center text-center py-4">
        <div className="mb-6 p-4 bg-muted rounded-full">
          {iconMap[type]}
        </div>
        
        <h3 className="text-xl font-bold mb-2 text-foreground">{title}</h3>
        <p className="text-muted-foreground mb-8 text-sm leading-relaxed max-w-[280px]">
          {message}
        </p>

        <div className="flex flex-col w-full gap-3">
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`w-full py-4 rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg ${buttonClasses[type]}`}
          >
            <Check size={16} />
            {confirmLabel}
          </button>
          
          <button
            onClick={onClose}
            className="w-full py-4 rounded-2xl font-bold uppercase tracking-widest text-xs text-muted-foreground hover:bg-muted/50 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <X size={16} />
            {cancelLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
};
