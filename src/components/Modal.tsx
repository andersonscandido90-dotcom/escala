import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, className }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={cn(
              "relative w-full max-w-lg bg-bg-card rounded-[2rem] shadow-2xl overflow-hidden border border-white/10",
              className
            )}
          >
            <div className="flex items-center justify-between p-8 border-b border-white/5 bg-white/5">
              <div>
                <div className="label-tech mb-1">Confirmação de Sistema</div>
                <h3 className="text-xl font-display font-black text-text-main tracking-tight">{title}</h3>
              </div>
              <button
                onClick={onClose}
                className="p-3 hover:bg-white/10 rounded-2xl transition-colors text-text-muted hover:text-text-main border border-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
