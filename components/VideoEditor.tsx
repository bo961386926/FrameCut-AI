import React, { useRef, useState, useEffect } from 'react';
import { 
  Play, Pause, ImagePlus, Layers, Upload, 
  SkipBack, SkipForward, Hash, Clock, Zap,
  Maximize, ChevronDown
} from './Icons';
import { ExtractedFrame, VideoMeta, I18nTexts } from '../types';

interface VideoEditorProps {
  videoSrc: string | null;
  onVideoLoaded: (meta: VideoMeta) => void;
  onFrameCaptured: (frame: ExtractedFrame) => void;
  onBatchComplete: () => void;
  texts: I18nTexts;
}

export const VideoEditor: React.FC<VideoEditorProps> = ({ 
  videoSrc, 
  onVideoLoaded, 
  onFrameCaptured,
  onBatchComplete,
  texts
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  
  // Batch Settings
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [batchMode, setBatchMode] = useState<'interval' | 'count' | 'smart'>('interval');
  const [batchValue, setBatchValue] = useState(2); 

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const handleLoadedData = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      onVideoLoaded({
        name: 'Video',
        duration: videoRef.current.duration,
        width: videoRef.current.videoWidth,
        height: videoRef.current.videoHeight
      });
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleSeek = (e: any) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const changePlaybackRate = () => {
    const speeds = [0.25, 0.5, 1.0, 1.5, 2.0];
    const currentIndex = speeds.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % speeds.length;
    setPlaybackRate(speeds[nextIndex]);
  };

  const stepFrame = (direction: 'forward' | 'backward') => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
      const step = 0.033; 
      const newTime = direction === 'forward' 
        ? Math.min(videoRef.current.currentTime + step, duration)
        : Math.max(videoRef.current.currentTime - step, 0);
      
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const captureFrame = (customTime?: number, existingBlob?: string): ExtractedFrame | null => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    let dataUrl = existingBlob;

    if (!dataUrl) {
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      dataUrl = canvas.toDataURL('image/png');
    }
    
    return {
      id: crypto.randomUUID(),
      timestamp: customTime ?? video.currentTime,
      dataUrl,
    };
  };

  const handleSingleCapture = () => {
    const frame = captureFrame();
    if (frame) {
      onFrameCaptured(frame);
    }
  };

  const calculateFrameDiff = (data1: Uint8ClampedArray, data2: Uint8ClampedArray) => {
    let diff = 0;
    const len = data1.length;
    // Optimization: Check every 16th byte (every 4th pixel)
    for (let i = 0; i < len; i += 16) {
      diff += Math.abs(data1[i] - data2[i]);     // R
      diff += Math.abs(data1[i+1] - data2[i+1]); // G
      diff += Math.abs(data1[i+2] - data2[i+2]); // B
    }
    const pixelsChecked = len / 16;
    return diff / (pixelsChecked * 255 * 3);
  };

  const handleBatchCapture = async () => {
    if (!videoRef.current || isBatchProcessing || !canvasRef.current) return;
    
    setIsBatchProcessing(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    const wasPlaying = !video.paused;
    if (wasPlaying) video.pause();
    
    const totalDuration = video.duration;
    let stepInterval = 0;

    if (batchMode === 'interval') {
      stepInterval = Math.max(0.1, batchValue);
    } else if (batchMode === 'count') {
      const count = Math.max(1, Math.floor(batchValue));
      stepInterval = totalDuration / count;
    } else {
      // Smart mode
      stepInterval = Math.max(0.2, batchValue);
    }

    let seekTime = 0;
    let prevFrameData: Uint8ClampedArray | null = null;

    const waitForSeek = () => new Promise<void>((resolve) => {
      const onSeeked = () => {
        video.removeEventListener('seeked', onSeeked);
        resolve();
      };
      video.addEventListener('seeked', onSeeked);
      video.currentTime = seekTime;
    });

    try {
      while (seekTime < totalDuration) {
        await waitForSeek();
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        if (!ctx) break;
        
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        let shouldCapture = false;

        if (batchMode === 'smart') {
           const currentData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
           if (!prevFrameData) {
             shouldCapture = true; 
           } else {
             const diff = calculateFrameDiff(prevFrameData, currentData);
             if (diff > 0.15) {
               shouldCapture = true;
             }
           }
           prevFrameData = currentData;
        } else {
          shouldCapture = true;
        }

        if (shouldCapture) {
           const dataUrl = canvas.toDataURL('image/png');
           onFrameCaptured({
             id: crypto.randomUUID(),
             timestamp: seekTime,
             dataUrl
           });
        }

        seekTime += stepInterval;
        if (stepInterval < 0.05) break; 
      }
      onBatchComplete();
    } catch (e) {
      console.error("Batch capture error", e);
    } finally {
      setIsBatchProcessing(false);
      video.currentTime = 0; // Reset
    }
  };

  const toggleBatchMode = () => {
    if (batchMode === 'interval') setBatchMode('count');
    else if (batchMode === 'count') setBatchMode('smart');
    else setBatchMode('interval');
  };

  const getBatchModeLabel = () => {
    if (batchMode === 'interval') return texts.batchInterval;
    if (batchMode === 'count') return texts.batchCount;
    return texts.batchSmart;
  };

  const getBatchModeIcon = () => {
    if (batchMode === 'interval') return <Clock size={14} />;
    if (batchMode === 'count') return <Hash size={14} />;
    return <Zap size={14} />;
  };

  const getBatchUnitLabel = () => {
    if (batchMode === 'interval') return 's';
    if (batchMode === 'count') return 'pcs';
    return 'scan(s)';
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-black rounded-2xl overflow-hidden shadow-2xl ring-1 ring-gray-900/5 dark:ring-white/10 transition-colors">
      
      {/* Video Player Area */}
      <div className="relative flex-1 bg-gray-100 dark:bg-neutral-900 flex items-center justify-center overflow-hidden group">
        
        {/* Grid Overlay for Tech feel */}
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(0,0,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.1)_1px,transparent_1px)] bg-[size:20px_20px] dark:bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)]"></div>

        {videoSrc ? (
          <video
            ref={videoRef}
            src={videoSrc}
            className="max-h-full max-w-full shadow-lg z-10"
            onLoadedData={handleLoadedData}
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => setIsPlaying(false)}
          />
        ) : (
          <div className="text-gray-400 dark:text-gray-600 flex flex-col items-center z-10">
            <div className="p-6 rounded-full bg-gray-200/50 dark:bg-white/5 mb-4 backdrop-blur-sm">
              <Upload size={48} className="opacity-50" />
            </div>
            <p className="font-mono text-sm tracking-wider uppercase">{texts.noSignal}</p>
            <p className="text-xs opacity-60 mt-2">{texts.uploadToInit}</p>
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Glass Controls Bar */}
      <div className="h-auto min-h-[100px] z-20 bg-white/80 dark:bg-dark-900/80 backdrop-blur-xl border-t border-gray-200 dark:border-white/5 p-4 flex flex-col gap-4 transition-colors">
        
        {/* Scrubber */}
        <div className="flex items-center gap-4">
          <span className="text-xs font-mono w-14 text-right text-brand-600 dark:text-brand-400">{currentTime.toFixed(2)}s</span>
          <div className="relative flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden group/scrubber cursor-pointer">
             <input
              type="range"
              min="0"
              max={duration || 100}
              step="0.01"
              value={currentTime}
              onChange={handleSeek}
              disabled={!videoSrc || isBatchProcessing}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            {/* Progress Fill */}
            <div 
              className="h-full bg-brand-500 rounded-full relative transition-all"
              style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
            >
              {/* Scrubber Handle */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 bg-white shadow rounded-full scale-0 group-hover/scrubber:scale-100 transition-transform"></div>
            </div>
          </div>
          <span className="text-xs font-mono w-14 text-gray-500">{duration.toFixed(2)}s</span>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          
          {/* Left: Playback Controls */}
          <div className="flex items-center gap-2">
            <button 
              onClick={changePlaybackRate}
              className="h-9 px-3 rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-xs font-mono font-bold text-gray-600 dark:text-gray-300 transition-colors border border-gray-200 dark:border-white/5"
            >
              {playbackRate}x
            </button>
            
            <div className="h-6 w-px bg-gray-300 dark:bg-white/10 mx-1"></div>

            <button
              onClick={() => stepFrame('backward')}
              disabled={!videoSrc}
              className="p-2.5 rounded-lg text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors disabled:opacity-30"
              title="-1 Frame"
            >
              <SkipBack size={18} />
            </button>

            <button
              onClick={togglePlay}
              disabled={!videoSrc || isBatchProcessing}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-900 dark:bg-white text-white dark:text-black hover:scale-105 active:scale-95 transition-all shadow-lg shadow-brand-500/10 disabled:opacity-50 disabled:active:scale-100"
            >
              {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
            </button>

            <button
              onClick={() => stepFrame('forward')}
              disabled={!videoSrc}
              className="p-2.5 rounded-lg text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors disabled:opacity-30"
              title="+1 Frame"
            >
              <SkipForward size={18} />
            </button>
          </div>

          {/* Right: Capture & Batch Controls */}
          <div className="flex items-center gap-3">
            
            {/* Batch Settings Panel */}
            <div className="hidden md:flex items-center p-1 rounded-xl bg-gray-100 dark:bg-black/40 border border-gray-200 dark:border-white/10 shadow-inner">
              <button 
                onClick={toggleBatchMode}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-white/10 hover:shadow-sm flex items-center gap-2 transition-all min-w-[95px]"
              >
                <span className={`${batchMode === 'smart' ? 'text-purple-500' : 'text-brand-500'}`}>
                  {getBatchModeIcon()}
                </span>
                {getBatchModeLabel()}
              </button>
              
              <div className="flex items-center px-1 border-l border-gray-200 dark:border-white/10 ml-1 pl-1">
                <input 
                  type="number" 
                  min={batchMode === 'count' ? "1" : "0.1"} 
                  step={batchMode === 'count' ? "1" : "0.1"}
                  value={batchValue}
                  onChange={(e: any) => setBatchValue(Number(e.target.value))}
                  className="w-10 bg-transparent text-center focus:text-brand-600 dark:focus:text-brand-400 outline-none text-sm font-mono text-gray-700 dark:text-gray-200 py-1"
                />
                <span className="text-[10px] text-gray-400 uppercase font-mono mt-0.5 min-w-[20px]">
                  {getBatchUnitLabel()}
                </span>
              </div>

              <button
                onClick={handleBatchCapture}
                disabled={!videoSrc || isBatchProcessing}
                className={`ml-1 p-2 rounded-lg hover:bg-white dark:hover:bg-white/10 transition-colors shadow-sm ${
                  isBatchProcessing ? 'text-brand-500 animate-pulse' : 'text-gray-500 dark:text-gray-400'
                }`}
                title={texts.startBatch}
              >
                <Layers size={16} />
              </button>
            </div>
            
            {/* Main Capture Button */}
            <button
              onClick={handleSingleCapture}
              disabled={!videoSrc || isBatchProcessing}
              className="group flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white rounded-xl font-medium shadow-lg shadow-brand-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
            >
              <ImagePlus size={20} className="group-hover:rotate-12 transition-transform" />
              <span className="hidden sm:inline">{texts.snapshot}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};