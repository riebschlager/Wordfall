import React, { useState, useRef, useEffect, useCallback } from 'react';
import PhysicsWorld, { PhysicsWorldHandle } from './components/PhysicsWorld';
import ControlPanel from './components/ControlPanel';
import { PhysicsConfig, SchemeMode } from './types';
import { generateFallingPoem } from './services/geminiService';
import { fetchColorScheme } from './services/colorService';

const INITIAL_CONFIG: PhysicsConfig = {
  gravity: 1,
  restitution: 0.6,
  friction: 0.5,
  scale: 1,
};

const WORD_PAUSE_MS = 600; // Time to wait before starting a new word position
const CHAR_SPACING = 35;   // Horizontal space between falling letters
const DEFAULT_DROP_Y = 100; // Default Vertical start position

const FALLING_POEM = `To fall is not to fail, but to yield. 
We start as rigid things, holding our breath, gripping the ledge of certainty. 
But gravity is a patient teacher. 
Leaves fall to feed the roots. 
Rain falls to drink the earth. 
We fall in love to shatter our own walls. 
We fall asleep to visit dreams we cannot name. 
Even the stars are falling, burning their way through the ancient dark. 
There is a grace in the descent, a freedom in the surrender. 
To let go is to trust the air. 
To land is to arrive, changed. 
Gravity does not judge; it only welcomes. 
Let yourself fall.`;

function App() {
  const [config, setConfig] = useState<PhysicsConfig>(INITIAL_CONFIG);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Dynamic Color State
  const [seedColor, setSeedColor] = useState<string>('#ef4444'); // Default Ruby Red
  const [schemeMode, setSchemeMode] = useState<SchemeMode>('analogic-complement');
  const [paletteColors, setPaletteColors] = useState<string[]>(['#ef4444']);
  
  const colorIndexRef = useRef<number>(0);
  
  // Auto-type settings
  const [isAutoTyping, setIsAutoTyping] = useState(false);
  const [wpm, setWpm] = useState(50);
  const [maxParticles, setMaxParticles] = useState(300);
  const [autoText, setAutoText] = useState(FALLING_POEM);
  const [clickIndicator, setClickIndicator] = useState<{x: number, y: number, id: number} | null>(null);
  
  // View settings
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [isUiVisible, setIsUiVisible] = useState(true);
  const uiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const physicsRef = useRef<PhysicsWorldHandle>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Typewriter state
  const lastTypeTimeRef = useRef<number>(0);
  const cursorXRef = useRef<number>(0);
  const cursorYRef = useRef<number>(DEFAULT_DROP_Y);
  const cursorAnchorRef = useRef<{x: number, y: number} | null>(null);
  
  // Auto-type refs
  const autoTypeIndexRef = useRef(0);
  const autoTypeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Focus the hidden input on load for immediate typing
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle Fullscreen Changes via Standard API
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Fetch Color Scheme when Seed or Mode changes
  useEffect(() => {
    // Debounce API calls to avoid rate limits
    const timer = setTimeout(async () => {
        const colors = await fetchColorScheme(seedColor, schemeMode);
        setPaletteColors(colors);
    }, 500);
    return () => clearTimeout(timer);
  }, [seedColor, schemeMode]);

  // Remove click indicator after animation
  useEffect(() => {
    if (clickIndicator) {
      const timer = setTimeout(() => {
        setClickIndicator(null);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [clickIndicator]);

  // Mouse interaction for Zen Mode UI visibility
  const handleMouseMove = useCallback(() => {
    if (!isZenMode) return;
    
    setIsUiVisible(true);
    
    if (uiTimeoutRef.current) {
        clearTimeout(uiTimeoutRef.current);
    }
    
    uiTimeoutRef.current = setTimeout(() => {
        if (isZenMode) {
            setIsUiVisible(false);
        }
    }, 2000); // Hide after 2 seconds of inactivity
  }, [isZenMode]);

  // Get current color based on palette and index
  const getCurrentColor = useCallback(() => {
    if (paletteColors.length === 0) return seedColor;
    return paletteColors[colorIndexRef.current % paletteColors.length];
  }, [paletteColors, seedColor]);

  const handleClear = () => {
    physicsRef.current?.clearWorld();
    autoTypeIndexRef.current = 0;
    
    // Reset anchor on clear to return to random distribution
    cursorAnchorRef.current = null;
    cursorYRef.current = DEFAULT_DROP_Y;
    
    resetCursorForNewWord();
    
    // Refocus input
    inputRef.current?.focus();
  };

  const handleRegeneratePoem = async () => {
    setIsGenerating(true);
    try {
        const newPoem = await generateFallingPoem();
        if (newPoem) {
            setAutoText(newPoem);
            autoTypeIndexRef.current = 0;
        }
    } catch (e) {
        console.error("Failed to regenerate poem:", e);
    } finally {
        setIsGenerating(false);
    }
  };

  const toggleAutoType = () => {
    setIsAutoTyping(!isAutoTyping);
    if (!isAutoTyping) {
        inputRef.current?.focus();
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
  };

  const toggleZenMode = () => {
    const nextMode = !isZenMode;
    setIsZenMode(nextMode);
    setIsUiVisible(true); // Ensure UI is visible when toggling
    
    // If entering Zen Mode, start the timeout immediately
    if (nextMode) {
         if (uiTimeoutRef.current) clearTimeout(uiTimeoutRef.current);
         uiTimeoutRef.current = setTimeout(() => setIsUiVisible(false), 2000);
    } else {
        // If exiting Zen Mode, clear timeout and keep visible
        if (uiTimeoutRef.current) clearTimeout(uiTimeoutRef.current);
    }
  };
  
  const handleCanvasClick = (e: React.MouseEvent) => {
    // Ignore clicks on controls (buttons, inputs, or the settings panel)
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('.settings-panel')) return;

    const x = e.clientX;
    const y = e.clientY;
    
    cursorAnchorRef.current = { x, y };
    cursorXRef.current = x;
    cursorYRef.current = y;
    
    setClickIndicator({ x, y, id: Date.now() });
    
    // Keep focus for typing
    inputRef.current?.focus();
    
    // Reset timer to treat next char as immediate
    lastTypeTimeRef.current = Date.now();
  };

  // Helper to position cursor for next word
  const resetCursorForNewWord = () => {
      // Cycle color for new word
      colorIndexRef.current += 1;

      if (cursorAnchorRef.current) {
          cursorXRef.current = cursorAnchorRef.current.x;
          cursorYRef.current = cursorAnchorRef.current.y;
      } else {
          // Default random behavior if no click set
          const width = window.innerWidth;
          const minX = width * 0.1;
          const maxX = width * 0.7; 
          cursorXRef.current = minX + Math.random() * (maxX - minX);
          cursorYRef.current = DEFAULT_DROP_Y;
      }
  };

  // Auto-Type Effect Loop
  useEffect(() => {
    if (!isAutoTyping) {
        if (autoTypeTimeoutRef.current) {
            clearTimeout(autoTypeTimeoutRef.current);
        }
        return;
    }

    const typeNextChar = () => {
        const width = window.innerWidth;
        const text = autoText;
        const char = text[autoTypeIndexRef.current % text.length];
        
        let delay = 60000 / (wpm * 6);
        delay = delay * (0.8 + Math.random() * 0.4);

        if (char === ' ' || char === '.' || char === ',') {
            delay *= 2;
        }
        
        // Line break / New word logic (timeout based)
        if (autoTypeIndexRef.current === 0 || (Date.now() - lastTypeTimeRef.current > WORD_PAUSE_MS)) {
             resetCursorForNewWord();
        }

        // Check wrapping
        if (cursorXRef.current > width * 0.9) {
            resetCursorForNewWord();
            delay += 400;
        }

        if (physicsRef.current) {
            if (char !== ' ' && char !== '\n' && char !== '\r') {
                physicsRef.current.addText(char, cursorXRef.current, cursorYRef.current, getCurrentColor());
                physicsRef.current.pruneBodies(maxParticles);
                // Only advance cursor after placing a letter
                cursorXRef.current += CHAR_SPACING;
            } else {
                // If it's a space or newline, we reset the cursor to the start position (anchor or random)
                // This ensures each new word starts from the origin point.
                resetCursorForNewWord();
            }
        }

        lastTypeTimeRef.current = Date.now();
        autoTypeIndexRef.current = autoTypeIndexRef.current + 1;

        autoTypeTimeoutRef.current = setTimeout(typeNextChar, delay);
    };

    typeNextChar();

    return () => {
        if (autoTypeTimeoutRef.current) {
            clearTimeout(autoTypeTimeoutRef.current);
        }
    };
  }, [isAutoTyping, wpm, maxParticles, autoText, getCurrentColor]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' && target.id !== 'hidden-type-input') return;
    
    // Prevent double-typing: If we are focused on the hidden input, 
    // let the onChange event handle single characters.
    if (target.id === 'hidden-type-input' && e.key.length === 1) return;
    
    const now = Date.now();
    const width = window.innerWidth;

    if (e.key === 'Enter') {
        lastTypeTimeRef.current = 0; 
        return;
    }

    if (now - lastTypeTimeRef.current > WORD_PAUSE_MS) {
        resetCursorForNewWord();
    }

    if (cursorXRef.current > width * 0.9) {
         resetCursorForNewWord();
    }

    if (physicsRef.current) {
         if (e.key.length === 1) {
            if (e.key === ' ') {
                 cursorXRef.current += CHAR_SPACING;
            } else {
                 physicsRef.current.addText(e.key, cursorXRef.current, cursorYRef.current, getCurrentColor());
                 physicsRef.current.pruneBodies(maxParticles);
                 cursorXRef.current += CHAR_SPACING;
            }
            lastTypeTimeRef.current = now;
         }
    }
  }, [maxParticles, getCurrentColor]); 

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.length > 0) {
        const char = val.slice(-1);
        const now = Date.now();
        const width = window.innerWidth;
        
        if (now - lastTypeTimeRef.current > WORD_PAUSE_MS) {
             resetCursorForNewWord();
        }
        
        if (cursorXRef.current > width * 0.9) resetCursorForNewWord();

        if (char === ' ') {
            cursorXRef.current += CHAR_SPACING;
        } else {
            physicsRef.current?.addText(char, cursorXRef.current, cursorYRef.current, getCurrentColor());
            physicsRef.current?.pruneBodies(maxParticles);
            cursorXRef.current += CHAR_SPACING;
        }
        lastTypeTimeRef.current = now;
        e.target.value = '';
    }
  };

  const toggleKeyboard = () => {
    inputRef.current?.focus();
  };
  
  // Combined class logic for UI visibility
  const uiOpacityClass = isZenMode && !isUiVisible ? 'opacity-0 pointer-events-none' : 'opacity-100';

  return (
    <div 
        className="relative w-full h-screen overflow-hidden bg-stone-100 selection:bg-orange-200 selection:text-orange-900"
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
    >
      <PhysicsWorld ref={physicsRef} config={config} />

      <div className={`absolute top-6 left-6 pointer-events-none select-none z-10 transition-opacity duration-500 ${uiOpacityClass}`}>
        <h1 className="font-['Courier_Prime'] text-4xl font-bold text-stone-800 tracking-tighter">
          Wordfall
        </h1>
        <p className="font-['Courier_Prime'] text-sm text-stone-500 mt-1 max-w-xs">
          {isAutoTyping ? "Listening to the falling words..." : "Type to create. Click to set origin."}
        </p>
      </div>

      <div className={`transition-opacity duration-500 ${uiOpacityClass}`}>
          <ControlPanel 
            config={config}
            onConfigChange={setConfig}
            onClear={handleClear}
            isGenerating={isGenerating}
            onToggleKeyboard={toggleKeyboard}
            isAutoTyping={isAutoTyping}
            onToggleAutoType={toggleAutoType}
            wpm={wpm}
            onWpmChange={setWpm}
            maxParticles={maxParticles}
            onMaxParticlesChange={setMaxParticles}
            // Palette Props
            seedColor={seedColor}
            onSeedColorChange={setSeedColor}
            schemeMode={schemeMode}
            onSchemeModeChange={setSchemeMode}
            currentPalette={paletteColors}
            onRegeneratePoem={handleRegeneratePoem}
            // View Props
            isFullscreen={isFullscreen}
            onToggleFullscreen={toggleFullscreen}
            isZenMode={isZenMode}
            onToggleZenMode={toggleZenMode}
          />
      </div>

      {clickIndicator && (
        <div 
            key={clickIndicator.id}
            className="absolute w-8 h-8 border-2 border-stone-400 rounded-full animate-ping pointer-events-none z-20"
            style={{ left: clickIndicator.x - 16, top: clickIndicator.y - 16 }}
        />
      )}

      <input 
        id="hidden-type-input"
        ref={inputRef}
        type="text" 
        className="absolute opacity-0 top-0 left-0 w-1 h-1"
        style={{ opacity: 0, position: 'absolute', zIndex: -1 }}
        onChange={handleInputChange}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
      />
      
      <div className={`absolute bottom-6 left-0 w-full text-center pointer-events-none opacity-50 z-0 transition-opacity duration-500 ${uiOpacityClass}`}>
        <p className="font-['Courier_Prime'] text-xs text-stone-400">
          powered by Gemini • built with React & Matter.js
        </p>
      </div>
    </div>
  );
}

export default App;