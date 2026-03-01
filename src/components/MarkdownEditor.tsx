import React, { useState } from 'react';
import Markdown from 'react-markdown';

export function MarkdownEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [mode, setMode] = useState<'write' | 'preview'>('write');

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex justify-between items-center">
        <label className="text-xs font-bold uppercase tracking-widest text-stone-400">Content (Markdown)</label>
        <div className="flex bg-stone-100 p-1 rounded-lg">
          <button
            onClick={() => setMode('write')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${mode === 'write' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
          >
            Write
          </button>
          <button
            onClick={() => setMode('preview')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${mode === 'preview' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
          >
            Preview
          </button>
        </div>
      </div>
      
      <div className="flex-grow min-h-[400px]">
        {mode === 'write' ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-full p-4 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-all font-mono text-sm resize-none"
            placeholder="Write your post content in Markdown..."
          />
        ) : (
          <div className="w-full h-full p-4 bg-white border border-stone-200 rounded-xl prose prose-stone max-w-none overflow-y-auto">
            <Markdown>{value || '*No content to preview*'}</Markdown>
          </div>
        )}
      </div>
    </div>
  );
}
