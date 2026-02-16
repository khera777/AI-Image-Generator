
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sparkles, Image as ImageIcon, History, Download, Wand2, Search, Sliders, Layers, Trash2, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';
import { GeminiService } from './services/geminiService';
import { IMAGE_STYLES, ASPECT_RATIOS, IMAGE_SIZES } from './constants';
import { GeneratedImage, GenerationSettings, AspectRatio, ImageSize, ModelType } from './types';

export default function App() {
  const [settings, setSettings] = useState<GenerationSettings>({
    prompt: '',
    style: 'none',
    aspectRatio: '1:1',
    size: '1K',
    model: 'gemini-2.5-flash-image',
    useSearch: false
  });

  const [history, setHistory] = useState<GeneratedImage[]>(() => {
    const saved = localStorage.getItem('gemini-image-history');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentImage, setCurrentImage] = useState<GeneratedImage | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editPrompt, setEditPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);

  useEffect(() => {
    localStorage.setItem('gemini-image-history', JSON.stringify(history));
  }, [history]);

  const handleGenerate = async () => {
    if (!settings.prompt) return;
    
    setIsGenerating(true);
    setError(null);

    try {
      let activePrompt = settings.prompt;
      let grounding: any[] = [];

      // Optional prompt enhancement
      if (settings.useSearch) {
        setIsEnhancing(true);
        const { enhancedPrompt, groundingMetadata } = await GeminiService.enhancePrompt(settings.prompt, true);
        activePrompt = enhancedPrompt;
        // Fix: Use web.title from grounding chunks as per provided guidelines
        grounding = groundingMetadata.map((c: any) => ({
          title: c.web?.title || 'Search Result',
          uri: c.web?.uri || '#'
        })).filter((c: any) => c.uri !== '#');
        setIsEnhancing(false);
      }

      const imageUrl = await GeminiService.generateImage({
        ...settings,
        prompt: activePrompt
      });

      const newImage: GeneratedImage = {
        id: crypto.randomUUID(),
        url: imageUrl,
        prompt: activePrompt,
        style: settings.style,
        aspectRatio: settings.aspectRatio,
        model: settings.model,
        timestamp: Date.now(),
        groundingUrls: grounding
      };

      setCurrentImage(newImage);
      setHistory(prev => [newImage, ...prev]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate image. Please try again.");
    } finally {
      setIsGenerating(false);
      setIsEnhancing(false);
    }
  };

  const handleEdit = async () => {
    if (!currentImage || !editPrompt) return;

    setIsEditing(true);
    setError(null);

    try {
      const editedUrl = await GeminiService.editImage(currentImage.url, editPrompt);
      
      const newImage: GeneratedImage = {
        id: crypto.randomUUID(),
        url: editedUrl,
        prompt: `${currentImage.prompt} (Edited: ${editPrompt})`,
        style: currentImage.style,
        aspectRatio: currentImage.aspectRatio,
        model: currentImage.model,
        timestamp: Date.now()
      };

      setCurrentImage(newImage);
      setHistory(prev => [newImage, ...prev]);
      setEditPrompt('');
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to edit image.");
    } finally {
      setIsEditing(false);
    }
  };

  const downloadImage = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearHistory = () => {
    if (confirm("Clear all generation history?")) {
      setHistory([]);
      setCurrentImage(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Gemini Lens AI
            </h1>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-400">
            <a href="#" className="hover:text-white transition-colors">Generator</a>
            <a href="#" className="hover:text-white transition-colors">Documentation</a>
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="hover:text-white transition-colors">Billing</a>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Sidebar: Controls */}
        <aside className="lg:col-span-4 flex flex-col gap-6">
          <section className="glass rounded-2xl p-6 flex flex-col gap-5">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold mb-2">
              <Sliders className="w-5 h-5" />
              <h2>Generation Settings</h2>
            </div>

            {/* Prompt Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Prompt</label>
              <textarea
                value={settings.prompt}
                onChange={(e) => setSettings({ ...settings, prompt: e.target.value })}
                placeholder="Describe what you want to create..."
                className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
              />
            </div>

            {/* Style Picker */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Style</label>
              <div className="grid grid-cols-3 gap-2">
                {IMAGE_STYLES.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setSettings({ ...settings, style: style.prompt })}
                    className={`text-[10px] py-2 px-1 rounded-lg border transition-all truncate ${
                      settings.style === style.prompt
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {style.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Model Toggle */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Model</label>
              <div className="flex bg-black/40 p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => setSettings({ ...settings, model: 'gemini-2.5-flash-image' })}
                  className={`flex-1 py-2 text-xs rounded-lg transition-all ${
                    settings.model === 'gemini-2.5-flash-image' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400'
                  }`}
                >
                  Standard
                </button>
                <button
                  onClick={() => setSettings({ ...settings, model: 'gemini-3-pro-image-preview' })}
                  className={`flex-1 py-2 text-xs rounded-lg transition-all flex items-center justify-center gap-1 ${
                    settings.model === 'gemini-3-pro-image-preview' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400'
                  }`}
                >
                  Pro High-Res
                </button>
              </div>
            </div>

            {/* Aspect Ratio & Size */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ratio</label>
                <select
                  value={settings.aspectRatio}
                  onChange={(e) => setSettings({ ...settings, aspectRatio: e.target.value as AspectRatio })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {ASPECT_RATIOS.map(ratio => (
                    <option key={ratio.value} value={ratio.value}>{ratio.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Resolution</label>
                <select
                  disabled={settings.model !== 'gemini-3-pro-image-preview'}
                  value={settings.size}
                  onChange={(e) => setSettings({ ...settings, size: e.target.value as ImageSize })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50"
                >
                  {IMAGE_SIZES.map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Search Grounding Toggle */}
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.useSearch} 
                  onChange={(e) => setSettings({...settings, useSearch: e.target.checked})} 
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-200 group-hover:text-indigo-400 transition-colors">Enhance with Search</span>
                <span className="text-[10px] text-gray-500">Uses Gemini 3 Flash to refine prompt</span>
              </div>
            </label>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !settings.prompt}
              className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl shadow-indigo-500/10 ${
                isGenerating || !settings.prompt 
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-500 text-white hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {isEnhancing ? 'Enhancing Prompt...' : 'Generating Image...'}
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  Generate Masterpiece
                </>
              )}
            </button>
          </section>

          {/* History Preview */}
          <section className="glass rounded-2xl p-6 hidden lg:flex flex-col gap-4 overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-400 font-semibold">
                <History className="w-5 h-5" />
                <h2>History</h2>
              </div>
              <button onClick={clearHistory} className="text-gray-500 hover:text-red-400 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 overflow-y-auto max-h-[300px] pr-2">
              {history.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setCurrentImage(img)}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    currentImage?.id === img.id ? 'border-indigo-500 scale-95' : 'border-transparent hover:border-white/20'
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
              {history.length === 0 && (
                <div className="col-span-2 py-8 text-center text-gray-600 text-xs italic">
                  No generations yet
                </div>
              )}
            </div>
          </section>
        </aside>

        {/* Main Workspace */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-6 py-4 rounded-2xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Image Display */}
          <div className="relative min-h-[500px] flex items-center justify-center bg-black/60 rounded-3xl border border-white/5 overflow-hidden group">
            {currentImage ? (
              <>
                <img
                  src={currentImage.url}
                  alt={currentImage.prompt}
                  className="w-full h-full object-contain max-h-[70vh]"
                />
                
                {/* Floating Actions */}
                <div className="absolute top-6 right-6 flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => downloadImage(currentImage.url, `gemini-${currentImage.id}.png`)}
                    className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all shadow-xl"
                    title="Download Image"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </div>

                {/* Grounding Attribution */}
                {currentImage.groundingUrls && currentImage.groundingUrls.length > 0 && (
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="bg-black/60 backdrop-blur-md rounded-xl p-3 border border-white/10">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                        <Search className="w-3 h-3" /> Search Sources
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {currentImage.groundingUrls.map((url, idx) => (
                          <a
                            key={idx}
                            href={url.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-indigo-300 hover:text-indigo-200 bg-white/5 px-2 py-1 rounded border border-white/5 flex items-center gap-1"
                          >
                            {url.title} <ChevronRight className="w-3 h-3" />
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center gap-4 text-gray-500">
                {isGenerating ? (
                  <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                      <Sparkles className="w-6 h-6 text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                    </div>
                    <div className="text-center space-y-2">
                      <p className="text-lg font-medium text-gray-300">Summoning Pixels...</p>
                      <p className="text-sm text-gray-600">This can take a few moments for Pro models</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <ImageIcon className="w-16 h-16 opacity-10" />
                    <p className="text-lg">Your creation will appear here</p>
                    <p className="text-sm text-gray-600 max-w-xs text-center">
                      Select settings and click generate to start your journey into AI artistry.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Editing Area */}
          {currentImage && (
            <div className="glass rounded-3xl p-6 flex flex-col gap-4">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold">
                <Layers className="w-5 h-5" />
                <h2>Edit Current Creation</h2>
              </div>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  placeholder="e.g. 'Add a retro film grain' or 'Change the background to a sunset'"
                  className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
                <button
                  onClick={handleEdit}
                  disabled={isEditing || !editPrompt}
                  className={`px-6 rounded-xl font-bold flex items-center gap-2 transition-all ${
                    isEditing || !editPrompt
                    ? 'bg-gray-800 text-gray-500'
                    : 'bg-white text-black hover:bg-gray-200 active:scale-95'
                  }`}
                >
                  {isEditing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                  Apply Edit
                </button>
              </div>
              <p className="text-[11px] text-gray-500 italic">
                * Editing uses Gemini 2.5 Flash Image to modify the existing composition.
              </p>
            </div>
          )}

          {/* Current Prompt Details */}
          {currentImage && (
            <div className="glass rounded-3xl p-6">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Generation Metadata</h3>
              <p className="text-gray-300 text-sm leading-relaxed mb-4">"{currentImage.prompt}"</p>
              <div className="flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-full border border-white/5 text-gray-400">
                  <span className="font-bold text-gray-500">Model:</span> {currentImage.model}
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-full border border-white/5 text-gray-400">
                  <span className="font-bold text-gray-500">Ratio:</span> {currentImage.aspectRatio}
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-full border border-white/5 text-gray-400">
                  <span className="font-bold text-gray-500">Time:</span> {new Date(currentImage.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/5 bg-black/20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© 2024 Gemini Lens AI. Powered by Google Gemini.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Help Center</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
