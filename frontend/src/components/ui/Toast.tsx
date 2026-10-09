import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { ToastMessage } from '../../types/route53';

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-12 right-6 z-50 flex flex-col space-y-2 max-w-md w-full pointer-events-none">
      {toasts.map((toast) => {
        let borderClass = 'border-l-4 border-l-[#1d8102] bg-[#f2f8f0] text-[#16191f]';
        let Icon = CheckCircle2;
        let iconColor = 'text-[#1d8102]';

        if (toast.type === 'error') {
          borderClass = 'border-l-4 border-l-[#d13212] bg-[#fdf2f2] text-[#16191f]';
          Icon = AlertCircle;
          iconColor = 'text-[#d13212]';
        } else if (toast.type === 'warning') {
          borderClass = 'border-l-4 border-l-[#ff9900] bg-[#fffaf0] text-[#16191f]';
          Icon = AlertTriangle;
          iconColor = 'text-[#ec7211]';
        } else if (toast.type === 'info') {
          borderClass = 'border-l-4 border-l-[#0073bb] bg-[#f0f7fb] text-[#16191f]';
          Icon = Info;
          iconColor = 'text-[#0073bb]';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto border border-[#eaeded] shadow-md p-3 rounded-sm flex items-start space-x-3 text-xs transition-all animate-in fade-in slide-in-from-top-2 duration-200 ${borderClass}`}
          >
            <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${iconColor}`} />
            <div className="flex-1 mr-2">
              <p className="font-bold text-[#16191f]">{toast.title}</p>
              {toast.message && <p className="text-[#545b64] mt-0.5">{toast.message}</p>}
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-[#687078] hover:text-[#16191f] p-0.5 rounded focus:outline-none"
              title="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
