import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { VideoEditor } from './components/VideoEditor';
import { FrameCard } from './components/FrameCard';
import { ExtractedFrame, VideoMeta, Language } from './types';
import { 
  Film, Upload, Trash2, Download, 
  CheckSquare, Square, XCircle, Archive,
  Sun, Moon, LayoutGrid
} from './components/Icons';
import { analyzeFrame } from './services/geminiService';
import { detectLanguage, translations } from './services/i18nService';

const App = () => {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [videoMeta, setVideoMeta] = useState<VideoMeta | null>(null);
  const [frames, setFrames] = useState<ExtractedFrame[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  // Default to closed sidebar on small screens (like browser extension side panel)
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 800);
  const [isZipping, setIsZipping] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [currentLang, setCurrentLang] = useState<Language>('en');

  // Load language settings on mount
  useEffect(() => {
    detectLanguage().then(lang => setCurrentLang(lang));
  }, []);

  // Handle window resize for responsiveness
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 800) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const t = translations[currentLang];

  // Initialize theme from system or local storage
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleFileUpload = (e: any) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setFrames([]); // Clear frames on new video
      setSelectedIds([]);
      setVideoMeta(null);
    }
  };

  const handleFrameCaptured = (frame: ExtractedFrame) => {
    setFrames(prev => [...prev, frame]);
  };

  const handleDeleteFrame = (id: string) => {
    setFrames(prev => prev.filter(f => f.id !== id));
    setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    
    // Capture the current selection in a Set for O(1) lookups
    const idsToDelete = new Set(selectedIds);
    
    if (window.confirm(t.deleteConfirm(idsToDelete.size))) {
      // Filter out frames that are in the delete set
      setFrames(currentFrames => currentFrames.filter(frame => !idsToDelete.has(frame.id)));
      setSelectedIds([]);
    }
  };

  const handleClearAll = () => {
    if (window.confirm(t.clearAllConfirm)) {
      setFrames([]);
      setSelectedIds([]);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(sid => sid !== id) 
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === frames.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(frames.map(f => f.id));
    }
  };

  const handleDownloadSelected = async () => {
    if (selectedIds.length === 0) return;
    setIsZipping(true);

    try {
      const zip = new JSZip();
      const folder = zip.folder("extracted_frames");
      
      const selectedFrames = frames.filter(f => selectedIds.includes(f.id));
      
      selectedFrames.forEach((frame) => {
        const base64Data = frame.dataUrl.split(',')[1];
        
        const mins = Math.floor(frame.timestamp / 60).toString().padStart(2, '0');
        const secs = Math.floor(frame.timestamp % 60).toString().padStart(2, '0');
        const ms = Math.floor((frame.timestamp % 1) * 100).toString().padStart(2, '0');
        const filename = `frame_${mins}-${secs}-${ms}.png`;
        
        if (folder) {
          folder.file(filename, base64Data, { base64: true });
        }
      });

      const content = await zip.generateAsync({ type: "blob" });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `frames_archive_${new Date().toISOString().slice(0,10)}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error("Failed to zip files:", error);
      alert("Failed to create zip file.");
    } finally {
      setIsZipping(false);
    }
  };

  const handleAnalyzeFrame = async (id: string) => {
    const frame = frames.find(f => f.id === id);
    if (!frame) return;

    setFrames(prev => prev.map(f => f.id === id ? { ...f, isAnalyzing: true } : f));
    
    // Pass current language instruction to the AI
    const prompt = currentLang === 'zh-CN' 
      ? "详细描述这个视频帧的内容，适合作为标题或说明文字，请用简体中文回答。"
      : currentLang === 'zh-TW'
        ? "詳細描述這個視頻幀的內容，適合作為標題或說明文字，請用繁體中文回答。"
        : "Describe this video frame in detail suitable for a caption.";

    const analysis = await analyzeFrame(frame.dataUrl, prompt);
    
    setFrames(prev => prev.map(f => f.id === id ? { ...f, isAnalyzing: false, analysis } : f));
  };

  return (
    <div className={`flex h-screen w-screen overflow-hidden font-sans transition-colors duration-300 ${theme === 'dark' ? 'dark bg-dark-950' : 'bg-gray-50'}`}>
      
      {/* Background Pattern */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-grid-pattern opacity-100"></div>

      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-80' : 'w-20'} relative z-20 flex-shrink-0 bg-white/80 dark:bg-dark-900/80 backdrop-blur-xl border-r border-gray-200 dark:border-white/5 transition-all duration-300 flex flex-col shadow-xl`}>
        {/* App Logo */}
        <div className="h-16 flex items-center justify-center border-b border-gray-200 dark:border-white/5 overflow-hidden whitespace-nowrap">
          <Film className="text-brand-500 mr-2 flex-shrink-0" />
          <span className={`font-bold text-xl tracking-tight text-slate-800 dark:text-slate-100 transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>
            {t.appTitle}
          </span>
        </div>

        {/* Video Upload Section */}
        <div className="p-4">
          <label className={`
            flex flex-col items-center justify-center w-full rounded-2xl border-2 border-dashed border-gray-300 dark:border-white/10 
            hover:border-brand-500 dark:hover:border-brand-500 hover:bg-brand-50/50 dark:hover:bg-white/5 transition-all cursor-pointer group
            ${isSidebarOpen ? 'h-36' : 'h-16'}
          `}>
            <input type="file" className="hidden" accept="video/*" onChange={handleFileUpload} />
            <div className={`p-3 rounded-full bg-gray-100 dark:bg-white/5 group-hover:scale-110 transition-transform ${!isSidebarOpen && 'p-2'}`}>
              <Upload className="text-gray-400 group-hover:text-brand-500 transition-colors" size={isSidebarOpen ? 24 : 20} />
            </div>
            {isSidebarOpen && <span className="mt-3 text-xs font-medium text-gray-500 dark:text-slate-400 group-hover:text-brand-600 dark:group-hover:text-brand-400 text-center">{t.uploadClick}</span>}
          </label>
        </div>

        {/* Info Section */}
        {isSidebarOpen && videoMeta && (
          <div className="px-6 py-4 mx-4 mb-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 animate-in fade-in slide-in-from-left-4">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">{t.signalData}</h3>
            <div className="space-y-2 text-xs font-mono text-gray-500 dark:text-slate-400">
              <p className="flex justify-between"><span>{t.duration}</span> <span className="text-gray-800 dark:text-slate-200">{videoMeta.duration.toFixed(2)}s</span></p>
              <p className="flex justify-between"><span>{t.dimensions}</span> <span className="text-gray-800 dark:text-slate-200">{videoMeta.width}x{videoMeta.height}</span></p>
              <p className="flex justify-between"><span>{t.frames}</span> <span className="text-brand-500">{frames.length}</span></p>
            </div>
          </div>
        )}

        <div className="flex-1" />
        
        {/* Bottom Actions */}
        <div className="p-4 border-t border-gray-200 dark:border-white/5 flex items-center justify-between">
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            title={t.toggleTheme}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <button 
             onClick={() => setIsSidebarOpen(!isSidebarOpen)}
             className="p-2 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-xs font-medium"
          >
            {isSidebarOpen ? t.collapse : t.expand}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative z-10">
        
        {/* Editor Section */}
        <div className="flex-1 p-4 md:p-6 min-h-0 flex flex-col">
          <VideoEditor 
            videoSrc={videoSrc}
            onVideoLoaded={setVideoMeta}
            onFrameCaptured={handleFrameCaptured}
            onBatchComplete={() => {}}
            texts={t}
          />
        </div>

        {/* Frames Gallery Panel */}
        <div className="h-[35vh] bg-white/90 dark:bg-dark-900/90 backdrop-blur-xl border-t border-gray-200 dark:border-white/10 flex flex-col min-h-0 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] transition-colors">
          
          {/* Gallery Toolbar */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 dark:border-white/5 flex-shrink-0">
            
            {/* Left: Title & Count */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded bg-brand-100 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400">
                  <LayoutGrid size={16} />
                </div>
                <div>
                  <h2 className="font-semibold text-sm text-gray-800 dark:text-slate-200">{t.galleryTitle}</h2>
                  <p className="text-[10px] text-gray-500 dark:text-slate-500 hidden sm:block">{t.gallerySubtitle}</p>
                </div>
              </div>
              
              {/* Select All Checkbox */}
              {frames.length > 0 && (
                <>
                  <div className="h-6 w-px bg-gray-200 dark:bg-white/10 mx-2"></div>
                  <button 
                    onClick={toggleSelectAll}
                    className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                  >
                    {selectedIds.length === frames.length && frames.length > 0 ? (
                      <CheckSquare size={16} className="text-brand-500" />
                    ) : (
                      <Square size={16} />
                    )}
                    <span className="hidden sm:inline">
                      {selectedIds.length === frames.length ? t.deselectAll : t.selectAll}
                    </span>
                  </button>
                </>
              )}
            </div>
            
            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {selectedIds.length > 0 ? (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
                  <span className="text-xs font-mono text-gray-500 dark:text-slate-500 mr-2 hidden md:inline">
                    <span className="text-brand-500 font-bold">{selectedIds.length}</span> {t.selected}
                  </span>
                  
                  <button 
                    onClick={handleDownloadSelected}
                    disabled={isZipping}
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-bold tracking-wide uppercase transition-colors shadow-lg shadow-brand-500/20 disabled:opacity-70"
                  >
                    {isZipping ? (
                      <span className="animate-spin">⏳</span>
                    ) : (
                      <Archive size={14} />
                    )}
                    <span className="hidden sm:inline">{t.download}</span>
                  </button>
                  
                  <button 
                    onClick={handleDeleteSelected}
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 rounded-lg text-xs font-bold tracking-wide uppercase transition-colors"
                  >
                    <Trash2 size={14} />
                    <span className="hidden sm:inline">{t.delete}</span>
                  </button>

                  <button 
                    onClick={() => setSelectedIds([])}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors"
                    title="Clear Selection"
                  >
                    <XCircle size={18} />
                  </button>
                </div>
              ) : (
                frames.length > 0 && (
                  <button 
                    onClick={handleClearAll}
                    className="text-xs font-medium text-gray-500 hover:text-red-500 flex items-center gap-1.5 px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} /> <span className="hidden sm:inline">{t.clearAll}</span>
                  </button>
                )
              )}
            </div>
          </div>

          {/* Gallery Grid */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 scroll-smooth bg-gray-50/50 dark:bg-black/20">
            {frames.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-slate-600">
                <div className="w-16 h-16 mb-4 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                  <LayoutGrid size={32} className="opacity-50" />
                </div>
                <p className="font-medium text-center px-4">{t.galleryEmpty}</p>
                <p className="text-xs mt-1 opacity-70 text-center px-4">{t.galleryEmptyHint}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-6 pb-20">
                {frames.map((frame) => (
                  <FrameCard 
                    key={frame.id} 
                    frame={frame} 
                    isSelected={selectedIds.includes(frame.id)}
                    onToggleSelect={toggleSelect}
                    onDelete={handleDeleteFrame}
                    onAnalyze={handleAnalyzeFrame}
                    texts={t}
                  />
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default App;