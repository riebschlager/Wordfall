# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Wordfall** (also known as "Kinetic Typewriter") is an artistic typographic physics simulation built with React, Matter.js, and Gemini AI. Words fall and interact with physics as users type, featuring AI-generated poetry, dynamic color schemes, and musical audio feedback.

Originally built for Google AI Studio: https://ai.studio/apps/drive/1i8Nr3gUDE75PatnfacBYUq0hWxQxYkus

## Development Commands

```bash
# Install dependencies
npm install

# Run development server (starts on port 3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm preview
```

## Environment Setup

Create `.env.local` file with:
```
GEMINI_API_KEY=your_api_key_here
```

The Vite config exposes this as `process.env.GEMINI_API_KEY` and `process.env.API_KEY` to the client.

## Architecture Overview

### Core Components

- **[App.tsx](App.tsx)** - Main application component handling all state, user interactions, and mode management
  - Manages typing state (manual vs auto-typing)
  - Controls performance/recording mode with countdown
  - Handles color cycling, musical scale changes, and cursor positioning
  - Manages fullscreen, Zen mode, and UI visibility
  - Implements auto-type loop with word wrapping and timing logic

- **[components/PhysicsWorld.tsx](components/PhysicsWorld.tsx)** - Matter.js physics engine wrapper
  - Exposes imperative API via ref: `addText()`, `clearWorld()`, `pruneBodies()`
  - Renders letters as physics bodies with custom canvas text rendering
  - Handles body lifecycle with fade-out animations (`isDying` flag)
  - Manages collision detection for audio feedback
  - Responsive: Uses ResizeObserver to handle window/fullscreen changes while preserving letters

- **[components/ControlPanel.tsx](components/ControlPanel.tsx)** - Settings UI with floating action buttons
  - Physics controls (gravity, bounciness)
  - Typography controls (font, size, body spacing)
  - Color scheme selector
  - Auto-type settings (WPM, max letters)
  - View modes (fullscreen, Zen mode, perform mode)

### Services

- **[services/audioService.ts](services/audioService.ts)** - Web Audio API sound generation
  - Uses chord progression (I-V-vi-IV) with arpeggios for typing sounds
  - Triangle wave for typing, sine wave for collisions
  - Built-in reverb using ConvolverNode with generated impulse response
  - Musical context: Changes chord on new word via `changeScale()`

- **[services/geminiService.ts](services/geminiService.ts)** - Gemini API integration
  - Generates contemplative poems about "falling" (< 500 chars)
  - Uses `gemini-2.5-flash` model
  - Fallback text on API errors

- **[services/colorService.ts](services/colorService.ts)** - Color palette generation
  - Fetches schemes from https://www.thecolorapi.com
  - Supports 8 modes: monochrome, analogic, complement, triad, quad, etc.

### Key Concepts

**Letter Spacing vs Font Size:**
- `fontSize`: Visual size of rendered text
- `spacing`: Multiplier for physics body hitbox size
- Low spacing = small hitboxes, tight packing; High spacing = large hitboxes, spread out
- Text always renders at `fontSize`, but body dimensions are `fontSize * spacing`

**Cursor & Word Positioning:**
- Cursor tracks horizontal position (`cursorXRef.current`)
- New words start at `cursorAnchorRef.current` (set by canvas click) or random position
- Word boundaries detected by `WORD_PAUSE_MS` (600ms gap) or space characters
- Wrapping occurs at 90% of viewport width

**Performance Mode:**
- 3-second countdown, then auto-types entire poem once without looping
- UI hidden during performance (with 5s tail delay after completion)
- Keeps cursor anchor so performance plays at user-selected spot

**Audio Architecture:**
- Arpeggio pattern: Ascends through chord notes, then descends (excluding endpoints)
- Each new word advances to next chord in progression and resets arpeggio
- Dry/wet mix routing for reverb effect on both typing and collision sounds

## File Structure

```
/
├── App.tsx                      # Main app component
├── index.tsx                    # React root
├── index.html                   # Entry HTML (CDN-based imports via importmap)
├── types.ts                     # TypeScript interfaces (PhysicsConfig, LetterBody, SchemeMode)
├── components/
│   ├── PhysicsWorld.tsx         # Matter.js integration
│   └── ControlPanel.tsx         # Settings UI
├── services/
│   ├── audioService.ts          # Web Audio synthesis
│   ├── geminiService.ts         # AI poem generation
│   └── colorService.ts          # Color API client
├── vite.config.ts               # Vite config with env variable injection
├── tsconfig.json                # TypeScript config (ES2022, React JSX)
└── package.json                 # Dependencies and scripts
```

## Important Implementation Details

**Physics Body Pruning:**
- [PhysicsWorld.tsx:107-124](components/PhysicsWorld.tsx#L107-L124) - Bodies marked as `isDying` fade out over `FADE_DURATION` (600ms)
- Oldest bodies removed first when exceeding `maxParticles` limit

**Auto-Type Logic:**
- [App.tsx:316-392](App.tsx#L316-L392) - Character-by-character typing with dynamic delays based on WPM
- Spaces and punctuation get 2x delay
- Perform mode stops at text end; normal mode loops infinitely

**Collision Audio:**
- [PhysicsWorld.tsx:224-248](components/PhysicsWorld.tsx#L224-L248) - Each body tracks `hasCollided` flag
- Only triggers audio once per body to avoid sound spam

**Responsive Canvas:**
- [PhysicsWorld.tsx:337-401](components/PhysicsWorld.tsx#L337-L401) - ResizeObserver rebuilds walls and repositions out-of-bounds bodies
- High DPI handling: Canvas internal resolution scales by `devicePixelRatio`

## Development Notes

- Vite dev server runs on port 3000 with host `0.0.0.0` (external access enabled)
- Path alias `@` maps to project root via tsconfig and Vite config
- Tailwind CSS loaded via CDN in [index.html](index.html#L7)
- All external dependencies use importmap for browser-native ESM (AI Studio CDN)
- No test suite or linting configuration present
