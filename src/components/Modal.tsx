import React from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';

export function Modal({ title, children, onClose, wide }: { title: string; children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-stone-900/40 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className={`bg-white rounded-3xl w-full ${wide ? 'max-w-5xl' : 'max-w-md'} overflow-hidden shadow-2xl`}
      >
        <div className="px-8 py-6 border-b border-stone-100 flex justify-between items-center">
          <h3 className="text-xl font-bold tracking-tight">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-stone-50 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className={`p-8 ${wide ? 'max-h-[85vh]' : 'max-h-[70vh]'} overflow-y-auto`}>
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}
