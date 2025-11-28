import React from 'react';
import { ExtractedFrame } from '../types';
import { Download, Trash2, Sparkles, Check } from './Icons';

interface FrameCardProps {
  frame: ExtractedFrame;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onAnalyze: (id: string) => void;
}

export const FrameCard: React.FC<FrameCardProps> = ({ 
  frame, 
  isSelected,
  onToggleSelect,
  onDelete, 
  onAnalyze 
}) => {
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = frame.dataUrl;
    link.download = `frame_${formatTime(frame.timestamp).replace(/:/g, '-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(frame.id);
  };

  return (
    <div 
      onClick={() => onToggleSelect(frame.id)}
      class={`group relative rounded-xl overflow-hidden transition-all duration-200 cursor-pointer backdrop-blur-sm
        ${isSelected 
          ? 'ring-2 ring-brand-500 shadow-[0_0_15px_rgba(59,130,246,0.3)] translate-y-[-2px]' 
          : 'hover:translate-y-[-2px] hover:shadow-lg border border-gray-200 dark:border-white/10 shadow-sm'}
        bg-white/40 dark:bg-dark-800/40
      `}
    >
      {/* Image Preview Container */}
      <div class="aspect-video w-full bg-gray-100 dark:bg-black/50 relative overflow-hidden">
        {/* Checkerboard pattern for transparency */}
        <div class="absolute inset-0 opacity-10" 
             style={{ backgroundImage: 'linear-gradient(45deg, #888 25%, transparent 25%), linear-gradient(-45deg, #888 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #888 75%), linear-gradient(-45deg, transparent 75%, #888 75%)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px' }} 
        />
        
        <img 
          src={frame.dataUrl} 
          alt={`Frame at ${frame.timestamp}`} 
          class="w-full h-full object-contain relative z-0 transition-transform duration-500 group-hover:scale-105" 
        />
        
        {/* Selection Checkbox (Top Left) */}
        <div class={`absolute top-2 left-2 z-20 transition-all duration-200 ${isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100'}`}>
          <div class={`
            w-5 h-5 rounded border flex items-center justify-center transition-all shadow-lg backdrop-blur-md
            ${isSelected 
              ? 'bg-brand-500 border-brand-500 text-white' 
              : 'bg-white/20 dark:bg-black/40 border-white/50 dark:border-white/30 hover:border-brand-400 text-transparent'}
          `}>
            <Check size={12} strokeWidth={4} />
          </div>
        </div>
        
        {/* Overlay Controls (Top Right) */}
        <div class="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0 z-20">
          <button 
            onClick={handleDownload}
            class="p-1.5 bg-white/90 dark:bg-black/60 hover:bg-brand-500 hover:text-white dark:hover:bg-brand-500 rounded-md text-slate-700 dark:text-slate-200 backdrop-blur-md shadow-lg transition-colors border border-gray-200 dark:border-white/10"
            title="Download Frame"
          >
            <Download size={12} />
          </button>
          <button 
            onClick={handleDelete}
            class="p-1.5 bg-white/90 dark:bg-black/60 hover:bg-red-500 hover:text-white dark:hover:bg-red-500 rounded-md text-slate-700 dark:text-slate-200 backdrop-blur-md shadow-lg transition-colors border border-gray-200 dark:border-white/10"
            title="Delete Frame"
          >
            <Trash2 size={12} />
          </button>
        </div>
        
        {/* Timestamp Badge */}
        <div class="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent flex justify-end">
           <span class="px-1.5 py-0.5 bg-black/40 border border-white/10 rounded text-[10px] font-mono text-white backdrop-blur-sm shadow-sm">
            {formatTime(frame.timestamp)}
          </span>
        </div>
      </div>

      {/* Analysis Section */}
      <div class="p-3 border-t border-gray-100 dark:border-white/5 bg-white/50 dark:bg-dark-900/30" onClick={(e) => e.stopPropagation()}>
        {frame.analysis ? (
          <div class="text-xs text-slate-600 dark:text-slate-300">
            <span class="font-semibold text-brand-600 dark:text-brand-400 mb-1 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
              <Sparkles size={10} /> AI Analysis
            </span>
            <p class="line-clamp-2 hover:line-clamp-none transition-all leading-relaxed opacity-90">{frame.analysis}</p>
          </div>
        ) : (
          <button 
            onClick={() => onAnalyze(frame.id)}
            disabled={frame.isAnalyzing}
            class="w-full py-1.5 px-3 rounded border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-white/5 hover:bg-brand-50 dark:hover:bg-brand-500/20 text-xs text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-200 flex items-center justify-center gap-2 transition-all group-analyze"
          >
            {frame.isAnalyzing ? (
              <span class="flex items-center gap-2">
                <div class="w-2 h-2 bg-brand-500 rounded-full animate-ping"></div>
                Analyzing...
              </span>
            ) : (
              <>
                <Sparkles size={12} class="text-purple-500 group-hover:text-purple-600 dark:text-purple-400" />
                <span>Analyze Frame</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};