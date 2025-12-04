declare var chrome: any;
import { Language, I18nTexts } from '../types';

export const translations: Record<Language, I18nTexts> = {
  'en': {
    appTitle: 'FrameCut AI',
    uploadClick: 'Click to Upload Video',
    uploadHint: 'Upload video to initialize system',
    signalData: 'Signal Data',
    duration: 'DURATION',
    dimensions: 'DIMENSIONS',
    frames: 'FRAMES',
    toggleTheme: 'Toggle Theme',
    collapse: 'Collapse',
    expand: '»',
    galleryTitle: 'Frame Gallery',
    gallerySubtitle: 'Manage captured snapshots',
    selectAll: 'Select All',
    deselectAll: 'Deselect All',
    selected: 'SELECTED',
    download: 'Download',
    delete: 'Delete',
    clearAll: 'Clear All',
    clearAllConfirm: 'Are you sure you want to clear all extracted frames?',
    deleteConfirm: (count) => `Are you sure you want to delete ${count} selected frames?`,
    galleryEmpty: 'Gallery Empty',
    galleryEmptyHint: 'Extract frames to populate the grid',
    noSignal: 'No Signal Input',
    uploadToInit: 'Upload video to initialize system',
    snapshot: 'Snapshot',
    batchInterval: 'Interval',
    batchCount: 'Count',
    batchSmart: 'Smart AI',
    startBatch: 'Start Batch Extraction',
    downloadFrame: 'Download Frame',
    deleteFrame: 'Delete Frame',
    analyzeFrame: 'Analyze Frame',
    analyzing: 'Analyzing...',
    aiAnalysis: 'AI Analysis',
    analysisError: 'No description generated.'
  },
  'zh-CN': {
    appTitle: '智能帧剪 AI',
    uploadClick: '点击上传视频',
    uploadHint: '上传视频以初始化系统',
    signalData: '信号数据',
    duration: '时长',
    dimensions: '分辨率',
    frames: '帧数',
    toggleTheme: '切换主题',
    collapse: '收起',
    expand: '展开',
    galleryTitle: '帧图库',
    gallerySubtitle: '管理已截取的画面',
    selectAll: '全选',
    deselectAll: '取消全选',
    selected: '项已选',
    download: '下载',
    delete: '删除',
    clearAll: '清空全部',
    clearAllConfirm: '确定要清空所有已截取的图片吗？',
    deleteConfirm: (count) => `确定要删除选中的 ${count} 张图片吗？`,
    galleryEmpty: '图库为空',
    galleryEmptyHint: '请截取视频帧以填充列表',
    noSignal: '无信号输入',
    uploadToInit: '请上传视频以开始',
    snapshot: '快照截取',
    batchInterval: '间隔抽帧',
    batchCount: '数量抽帧',
    batchSmart: '智能抽帧',
    startBatch: '开始批量抽帧',
    downloadFrame: '下载图片',
    deleteFrame: '删除图片',
    analyzeFrame: 'AI 分析',
    analyzing: '分析中...',
    aiAnalysis: 'AI 分析结果',
    analysisError: '未能生成描述。'
  },
  'zh-TW': {
    appTitle: '智能幀剪 AI',
    uploadClick: '點擊上傳影片',
    uploadHint: '上傳影片以初始化系統',
    signalData: '信號數據',
    duration: '時長',
    dimensions: '解析度',
    frames: '幀數',
    toggleTheme: '切換主題',
    collapse: '收起',
    expand: '展開',
    galleryTitle: '幀圖庫',
    gallerySubtitle: '管理已截取的畫面',
    selectAll: '全選',
    deselectAll: '取消全選',
    selected: '項已選',
    download: '下載',
    delete: '刪除',
    clearAll: '清空全部',
    clearAllConfirm: '確定要清空所有已截取的圖片嗎？',
    deleteConfirm: (count) => `確定要刪除選中的 ${count} 張圖片嗎？`,
    galleryEmpty: '圖庫為空',
    galleryEmptyHint: '請截取影片幀以填充列表',
    noSignal: '無信號輸入',
    uploadToInit: '請上傳影片以開始',
    snapshot: '快照截取',
    batchInterval: '間隔抽幀',
    batchCount: '數量抽幀',
    batchSmart: '智能抽幀',
    startBatch: '開始批量抽幀',
    downloadFrame: '下載圖片',
    deleteFrame: '刪除圖片',
    analyzeFrame: 'AI 分析',
    analyzing: '分析中...',
    aiAnalysis: 'AI 分析結果',
    analysisError: '未能生成描述。'
  }
};

export const detectLanguage = async (): Promise<Language> => {
  // 1. Try Chrome Extension API
  if (typeof chrome !== 'undefined' && chrome.i18n && typeof chrome.i18n.getUILanguage === 'function') {
    try {
      const uiLang = chrome.i18n.getUILanguage();
      if (uiLang.toLowerCase().includes('cn') || uiLang.toLowerCase().includes('hans')) {
        return 'zh-CN';
      } else if (uiLang.toLowerCase().includes('tw') || uiLang.toLowerCase().includes('hk')) {
        return 'zh-TW';
      }
      // If it's a generic 'zh', we might default to CN or TW. Let's stick to browser standard check below.
    } catch (e) {
      console.log('Chrome I18n API check failed', e);
    }
  }

  try {
    // 2. Try to check IP
    const response = await fetch('https://api.country.is');
    if (response.ok) {
      const data = await response.json();
      const country = data.country; // ISO 3166-1 alpha-2 code (e.g., CN, US, HK)
      
      if (country === 'CN') {
        return 'zh-CN';
      } else if (['HK', 'MO', 'TW'].includes(country)) {
        return 'zh-TW';
      } else {
        return 'en';
      }
    }
  } catch (error) {
    console.warn('IP geolocation failed, falling back to browser language', error);
  }

  // 3. Fallback to Browser Language
  const browserLang = navigator.language;
  if (browserLang.toLowerCase().includes('zh')) {
     if (browserLang.toLowerCase().includes('cn') || browserLang.toLowerCase().includes('hans')) {
       return 'zh-CN';
     }
     return 'zh-TW';
  }

  return 'en';
};