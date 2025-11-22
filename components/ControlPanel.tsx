import React, { useState } from 'react';
import { PhysicsConfig, SchemeMode } from '../types';
import { Settings2, Trash2, Play, Pause, Palette, RefreshCw, Maximize2, Minimize2, Eye, EyeOff, Type } from 'lucide-react';

interface FontOption {
    name: string;
    value: string;
}

interface ControlPanelProps {
  config: PhysicsConfig;
  onConfigChange: (newConfig: PhysicsConfig) => void;
  onClear: () => void;
  isGenerating: boolean;
  isAutoTyping: boolean;
  onToggleAutoType: () => void;
  wpm: number;
  onWpmChange: (val: number) => void;
  maxParticles: number;
  onMaxParticlesChange: (val: number) => void;
  
  // Color Scheme Props
  seedColor: string;
  onSeedColorChange: (color: string) => void;
  schemeMode: SchemeMode;
  onSchemeModeChange: (mode: SchemeMode) => void;
  currentPalette: string[];
  
  // Font Props
  fonts: FontOption[];
  currentFont: string;
  onFontChange: (font: string) => void;

  onRegeneratePoem: () => void;

  // View Props
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  isZenMode: boolean;
  onToggleZenMode: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ 
    config, 
    onConfigChange, 
    onClear, 
    isGenerating,
    isAutoTyping,
    onToggleAutoType,
    wpm,
    onWpmChange,
    maxParticles,
    onMaxParticlesChange,
    seedColor,
    onSeedColorChange,
    schemeMode,
    onSchemeModeChange,
    currentPalette,
    fonts,
    currentFont,
    onFontChange,
    onRegeneratePoem,
    isFullscreen,
    onToggleFullscreen,
    isZenMode,
    onToggleZenMode
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleRangeChange = (key: keyof PhysicsConfig, value: number) => {
    onConfigChange({ ...config, [key]: value });
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col items-end gap-2 pointer-events-none control-panel-container">
      {/* Floating Action Buttons */}
      <div className="flex gap-2 pointer-events-auto">
        <button 
            onClick={onToggleZenMode}
            className={`p-3 rounded-full shadow-lg transition-all border border-stone-200 ${
                isZenMode ? 'bg-stone-800 text-white' : 'bg-white/80 backdrop-blur-sm text-stone-700 hover:bg-white'
            }`}
            title={isZenMode ? "Exit Zen Mode" : "Enter Zen Mode"}
        >
            {isZenMode ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>

        <button 
            onClick={onToggleFullscreen}
            className="p-3 bg-white/80 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all text-stone-700 border border-stone-200"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
        </button>

        <div className="w-px h-10 bg-stone-300 mx-1 opacity-50" />

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
            title="Settings"
        >
            <Settings2 size={20} />
        </button>
      </div>

      {/* Settings Panel */}
      {isOpen && (
        <div className="settings-panel mt-2 p-6 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-stone-200 w-80 pointer-events-auto animate-in fade-in slide-in-from-top-4 duration-200 max-h-[80vh] overflow-y-auto">
            
            <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Type size={16} /> Typography
            </h3>
            
            <div className="mb-6">
                 <select 
                    value={currentFont}
                    onChange={(e) => onFontChange(e.target.value)}
                    className="w-full h-10 rounded-lg border border-stone-200 bg-white text-stone-800 text-sm px-3 focus:outline-none focus:ring-2 focus:ring-stone-800 cursor-pointer appearance-auto"
                >
                    {fonts.map((font) => (
                        <option key={font.name} value={font.value}>{font.name}</option>
                    ))}
                </select>
                <p className="text-[10px] text-stone-400 mt-2 text-center" style={{ fontFamily: currentFont.split(',')[0] }}>
                    The quick brown fox jumps over the lazy dog.
                </p>
            </div>

            <hr className="border-stone-200 my-4" />

            <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Palette size={16} /> Color Scheme
            </h3>
            
            <div className="flex flex-col gap-3 mb-6">
                <div className="flex gap-2 items-center">
                    <div className="relative overflow-hidden rounded-lg shadow-sm border border-stone-200 w-12 h-10 shrink-0 bg-white">
                         <input 
                            type="color" 
                            value={seedColor}
                            onChange={(e) => onSeedColorChange(e.target.value)}
                            className="absolute -top-2 -left-2 w-16 h-16 p-0 border-0 cursor-pointer"
                        />
                    </div>
                    
                    <select 
                        value={schemeMode}
                        onChange={(e) => onSchemeModeChange(e.target.value as SchemeMode)}
                        className="flex-1 h-10 rounded-lg border border-stone-200 bg-white text-stone-800 text-sm px-3 focus:outline-none focus:ring-2 focus:ring-stone-800 cursor-pointer appearance-auto"
                    >
                         <option value="monochrome">Monochrome</option>
                         <option value="monochrome-dark">Mono Dark</option>
                         <option value="monochrome-light">Mono Light</option>
                         <option value="analogic">Analogic</option>
                         <option value="complement">Complement</option>
                         <option value="analogic-complement">Analogic-Comp</option>
                         <option value="triad">Triad</option>
                         <option value="quad">Quad</option>
                    </select>
                </div>

                {/* Current Palette Preview */}
                <div className="w-full h-8 rounded-lg flex overflow-hidden border border-stone-200 shadow-inner">
                    {currentPalette.length > 0 ? (
                         currentPalette.map((color, idx) => (
                            <div 
                                key={idx} 
                                className="flex-1 h-full transition-colors duration-500" 
                                style={{ backgroundColor: color }} 
                                title={color}
                            />
                        ))
                    ) : (
                        <div className="w-full h-full bg-stone-200 animate-pulse" />
                    )}
                </div>
                <p className="text-[10px] text-stone-400 text-center">
                    powered by thecolorapi.com
                </p>
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
            </div>
        </div>
      )}
    </div>
  );
};

export default ControlPanel;