import React, { useState } from 'react';
import { AlertTriangle, X, Loader2 } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  resourceName?: string;
  requireTypingConfirm?: boolean;
  confirmButtonText?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  resourceName,
  requireTypingConfirm = false,
  confirmButtonText = 'Delete',
  isDestructive = true,
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  const [typedValue, setTypedValue] = useState('');

  if (!isOpen) return null;

  const expectedValue = resourceName ? resourceName : 'delete';
  const isMatch = !requireTypingConfirm || typedValue.trim().toLowerCase() === expectedValue.toLowerCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-[1px] animate-in fade-in duration-150">
      <div className="bg-white border border-[#eaeded] shadow-2xl rounded-sm w-full max-w-lg text-xs overflow-hidden mx-2 sm:mx-auto">
        {/* Header */}
        <div className="px-4 sm:px-5 py-3 sm:py-3.5 border-b border-[#eaeded] flex items-center justify-between bg-[#fafafa]">
          <div className="flex items-center space-x-2.5">
            <div className={`p-1 rounded ${isDestructive ? 'text-[#d13212] bg-[#fdf2f2]' : 'text-[#ec7211] bg-[#fffaf0]'}`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-[#16191f]">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="text-[#687078] hover:text-[#16191f] p-1 rounded hover:bg-[#eaeded] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-3.5">
          <p className="text-[#545b64] leading-relaxed text-xs">{message}</p>

          {resourceName && (
            <div className="bg-[#f8f9fa] border border-[#eaeded] p-2.5 rounded font-mono text-[11px] text-[#16191f] break-all">
              {resourceName}
            </div>
          )}

          {requireTypingConfirm && (
            <div className="space-y-1.5 pt-1">
              <label className="block text-[#16191f] font-semibold text-xs">
                To confirm deletion, type <span className="font-mono text-[#d13212]">{expectedValue}</span> in the field below:
              </label>
              <input
                type="text"
                value={typedValue}
                onChange={(e) => setTypedValue(e.target.value)}
                placeholder={expectedValue}
                disabled={isLoading}
                className="w-full border border-[#aab7b8] focus:border-[#ec7211] rounded px-3 py-1.5 text-xs text-[#16191f] outline-none"
                autoFocus
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#eaeded] bg-[#fafafa] flex items-center justify-end space-x-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-1.5 rounded-sm border border-[#545b64] text-[#16191f] font-semibold hover:bg-[#eaeded] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading || !isMatch}
            className={`px-4 py-1.5 rounded-sm font-bold text-white transition-colors flex items-center space-x-1.5 ${
              isDestructive
                ? 'bg-[#d13212] hover:bg-[#a8250a] disabled:bg-[#d13212]/40'
                : 'bg-[#ec7211] hover:bg-[#eb5f07] disabled:bg-[#ec7211]/40'
            }`}
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{confirmButtonText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
