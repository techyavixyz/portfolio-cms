import React from 'react';

export function Input({ label, value, onChange, textarea, type = "text" }: { label: string; value: string; onChange: (v: string) => void; textarea?: boolean; type?: string }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-bold uppercase tracking-widest text-stone-400">{label}</label>
      {textarea ? (
        <textarea 
          value={value} 
          onChange={e => onChange(e.target.value)}
          className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-stone-900 transition-colors min-h-[100px]"
        />
      ) : (
        <input 
          type={type} 
          value={value} 
          onChange={e => onChange(e.target.value)}
          className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-stone-900 transition-colors"
        />
      )}
    </div>
  );
}
