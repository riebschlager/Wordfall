import React, { useState } from 'react';
import { PhysicsConfig, ColorPalette } from '../types';
import { Settings2, Trash2, Sparkles, Keyboard, Play, Pause, Palette, RefreshCw } from 'lucide-react';

interface ControlPanelProps {
  config: PhysicsConfig;
  onConfigChange: (newConfig: PhysicsConfig) => void;
  onClear: () => void;
  onGenerate: (prompt: string) => void;
  isGenerating: boolean;
  onToggleKeyboard: () => void;
  isAutoTyping: boolean;
  onToggleAutoType: () => void;
  wpm: number;
  onWpmChange: (val: number) => void;
  maxParticles: number;
  onMaxParticlesChange: (val: number) => void;
  palettes: ColorPalette[];
  activePaletteId: string;
  onPaletteChange: (id: string) => void;
  onRegeneratePoem: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ 
    config, 
    onConfigChange, 
    onClear, 
    onGenerate, 
    isGenerating,
    onToggleKeyboard,
    isAutoTyping,
    onToggleAutoType,
    wpm,
    onWpmChange,
    maxParticles,
    onMaxParticlesChange,
    palettes,
    activePaletteId,
    onPaletteChange,
    onRegeneratePoem
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState("");

  const handleRangeChange = (key: keyof PhysicsConfig, value: number) => {
    onConfigChange({ ...config, [key]: value });
  };

  const handleGenerateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
        onGenerate(prompt);
        setPrompt("");
        setIsOpen(false); // Close panel on mobile/cleaner UI
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col items-end gap-2 pointer-events-none control-panel-container">
      {/* Floating Action Buttons */}
      <div className="flex gap-2 pointer-events-auto">
        <button 
            onClick={onToggleAutoType}
            className={`p-3 rounded-full shadow-lg transition-all border border-stone-200 flex items-center justify-center ${
                isAutoTyping ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-white/80 backdrop-blur-sm text-stone-700 hover:bg-white'
            }`}
            title={isAutoTyping ? "Pause Auto-Type" : "Start Auto-Type Poem"}
        >
            {isAutoTyping ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
        </button>

        <button 
            onClick={onToggleKeyboard}
            className="p-3 bg-white/80 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all text-stone-700 border border-stone-200 lg:hidden"
            aria-label="Toggle Keyboard"
        >
            <Keyboard size={20} />
        </button>

        <button 
            onClick={onClear}
            className="p-3 bg-white/80 backdrop-blur-sm rounded-full shadow-lg hover:bg-red-50 text-stone-700 hover:text-red-600 transition-all border border-stone-200"
            title="Clear Canvas"
        >
            <Trash2 size={20} />
        </button>

        <button 
            onClick={() => setIsOpen(!isOpen)}
            className={`p-3 rounded-full shadow-lg transition-all border border-stone-200 ${
                isOpen ? 'bg-stone-800 text-white' : 'bg-white/80 backdrop-blur-sm text-stone-700 hover:bg-white'
            }`}
        >
            <Settings2 size={20} />
        </button>
      </div>

      {/* Settings Panel */}
      {isOpen && (
        <div className="settings-panel mt-2 p-6 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-stone-200 w-80 pointer-events-auto animate-in fade-in slide-in-from-top-4 duration-200 max-h-[80vh] overflow-y-auto">
            
            <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Palette size={16} /> Colors
            </h3>
            <div className="grid grid-cols-5 gap-2 mb-6">
                {palettes.map((palette) => (
                    <button
                        key={palette.id}
                        onClick={() => onPaletteChange(palette.id)}
                        className={`w-full aspect-square rounded-full shadow-sm border-2 transition-transform hover:scale-110 ${
                            activePaletteId === palette.id ? 'border-stone-800 scale-110' : 'border-transparent'
                        }`}
                        title={palette.name}
                        style={{
                            background: `linear-gradient(135deg, ${palette.colors[0]}, ${palette.colors[Math.min(1, palette.colors.length-1)]})`
                        }}
                    />
                ))}
            </div>
            
            <hr className="border-stone-200 my-4" />

            <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-4">Auto-Type Settings</h3>
            <div className="space-y-4 mb-6">
                 <div>
                    <div className="flex justify-between text-xs text-stone-600 mb-1">
                        <span>Speed (WPM)</span>
                        <span>{wpm}</span>
                    </div>
                    <input 
                        type="range" 
                        min="10" max="200" step="10"
                        value={wpm}
                        onChange={(e) => onWpmChange(parseInt(e.target.value))}
                        className="w-full accent-amber-600 h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer"
                    />
                </div>
                <div>
                    <div className="flex justify-between text-xs text-stone-600 mb-1">
                        <span>Max Letters</span>
                        <span>{maxParticles}</span>
                    </div>
                    <input 
                        type="range" 
                        min="50" max="800" step="50"
                        value={maxParticles}
                        onChange={(e) => onMaxParticlesChange(parseInt(e.target.value))}
                        className="w-full accent-amber-600 h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer"
                    />
                </div>
                
                <button 
                    onClick={onRegeneratePoem}
                    disabled={isGenerating}
                    className="w-full py-2 px-3 mt-2 bg-stone-100 border border-stone-200 text-stone-600 rounded-lg text-xs font-medium hover:bg-stone-200 hover:text-stone-800 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <RefreshCw size={14} className={isGenerating ? "animate-spin" : ""} />
                    {isGenerating ? "Writing..." : "Write New Poem"}
                </button>
            </div>

            <hr className="border-stone-200 my-4" />

            <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-4">Physics Settings</h3>
            
            <div className="space-y-4">
                <div>
                    <div className="flex justify-between text-xs text-stone-600 mb-1">
                        <span>Gravity</span>
                        <span>{config.gravity.toFixed(1)}</span>
                    </div>
                    <input 
                        type="range" 
                        min="0" max="2" step="0.1"
                        value={config.gravity}
                        onChange={(e) => handleRangeChange('gravity', parseFloat(e.target.value))}
                        className="w-full accent-stone-800 h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer"
                    />
                </div>

                <div>
                    <div className="flex justify-between text-xs text-stone-600 mb-1">
                        <span>Bounciness</span>
                        <span>{config.restitution.toFixed(1)}</span>
                    </div>
                    <input 
                        type="range" 
                        min="0" max="1.2" step="0.1"
                        value={config.restitution}
                        onChange={(e) => handleRangeChange('restitution', parseFloat(e.target.value))}
                        className="w-full accent-stone-800 h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer"
                    />
                </div>

                <hr className="border-stone-200 my-4" />

                <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-4">AI Inspiration</h3>
                
                <form onSubmit={handleGenerateSubmit} className="space-y-2">
                    <input 
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g. A rainy day in Paris..."
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 transition-all"
                    />
                    <button 
                        type="submit" 
                        disabled={isGenerating || !prompt.trim()}
                        className="w-full py-2 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg text-sm font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all transform active:scale-95"
                    >
                        {isGenerating ? (
                            <span className="animate-pulse">Dreaming...</span>
                        ) : (
                            <>
                                <Sparkles size={16} />
                                <span>Generate</span>
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default ControlPanel;