import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import Matter from 'matter-js';
import { PhysicsConfig } from '../types';

// Font configuration
const FONT_FAMILY = '"Courier Prime", monospace';
const BASE_FONT_SIZE = 48;

interface PhysicsWorldProps {
  config: PhysicsConfig;
  onReady?: () => void;
}

export interface PhysicsWorldHandle {
  addText: (text: string, x?: number, y?: number, color?: string) => void;
  clearWorld: () => void;
  pruneBodies: (maxCount: number) => void;
}

const PhysicsWorld = forwardRef<PhysicsWorldHandle, PhysicsWorldProps>(({ config, onReady }, ref) => {
  const sceneRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  
  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    addText: (text: string, startX?: number, startY?: number, color: string = '#292524') => {
      if (!engineRef.current) return;
      
      const world = engineRef.current.world;
      const width = window.innerWidth;
      
      // Calculate spawn position
      // If no X provided, randomize it
      const safeX = startX ?? Math.random() * (width * 0.8) + (width * 0.1);
      const safeY = startY ?? -50;

      let offsetX = 0;

      for (const char of text) {
        if (char === ' ') {
            offsetX += BASE_FONT_SIZE * 0.6;
            continue;
        }

        const body = Matter.Bodies.rectangle(
            safeX + offsetX, 
            safeY, 
            BASE_FONT_SIZE * 0.6, // Approximate width
            BASE_FONT_SIZE * 0.8, // Approximate height
            {
                // Very slight random rotation for natural look, but small enough to keep words legible initially
                angle: (Math.random() - 0.5) * 0.05, 
                restitution: config.restitution,
                friction: config.friction,
                render: {
                    fillStyle: 'transparent', 
                },
                label: 'letter'
            }
        );
        
        // Attach custom data for rendering
        (body as any).char = char;
        (body as any).color = color;
        (body as any).createdAt = Date.now(); // Track creation time for pruning if needed
        
        Matter.World.add(world, body);
        offsetX += BASE_FONT_SIZE * 0.7; // Spacing between letters
      }
    },
    clearWorld: () => {
      if (!engineRef.current) return;
      const world = engineRef.current.world;
      // Remove all bodies that are not walls
      const bodiesToRemove = world.bodies.filter(b => b.label === 'letter');
      Matter.World.remove(world, bodiesToRemove);
    },
    pruneBodies: (maxCount: number) => {
      if (!engineRef.current) return;
      const world = engineRef.current.world;
      // Get all letter bodies
      const letterBodies = world.bodies.filter(b => b.label === 'letter');
      
      // If we have too many, remove the oldest ones
      // Matter.js usually adds new bodies to the end of the array, so index 0 is oldest
      if (letterBodies.length > maxCount) {
        const countToRemove = letterBodies.length - maxCount;
        const bodiesToRemove = letterBodies.slice(0, countToRemove);
        Matter.World.remove(world, bodiesToRemove);
      }
    }
  }));

  // Update engine config when props change
  useEffect(() => {
    if (engineRef.current) {
        engineRef.current.gravity.y = config.gravity;
        
        // Update existing bodies properties
        engineRef.current.world.bodies.forEach(body => {
            if (body.label === 'letter') {
                body.restitution = config.restitution;
                body.friction = config.friction;
            }
        });
    }
  }, [config]);

  useEffect(() => {
    if (!sceneRef.current) return;

    // 1. Setup Matter.js
    const engine = Matter.Engine.create();
    const world = engine.world;
    engineRef.current = engine;

    // 2. Setup Render
    const render = Matter.Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width: window.innerWidth,
        height: window.innerHeight,
        wireframes: false,
        background: 'transparent',
        pixelRatio: window.devicePixelRatio
      }
    });
    renderRef.current = render;

    // 3. Create Walls
    const createWalls = () => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const wallThickness = 60;
        
        const ground = Matter.Bodies.rectangle(width / 2, height + wallThickness / 2 - 10, width, wallThickness, { 
            isStatic: true, 
            render: { fillStyle: 'transparent' },
            label: 'wall'
        });
        const leftWall = Matter.Bodies.rectangle(0 - wallThickness / 2, height / 2, wallThickness, height * 2, { 
            isStatic: true,
            render: { fillStyle: 'transparent' },
            label: 'wall'
        });
        const rightWall = Matter.Bodies.rectangle(width + wallThickness / 2, height / 2, wallThickness, height * 2, { 
            isStatic: true,
            render: { fillStyle: 'transparent' },
            label: 'wall'
        });

        Matter.World.add(world, [ground, leftWall, rightWall]);
    };
    createWalls();

    // 4. Mouse Control
    const mouse = Matter.Mouse.create(render.canvas);
    const mouseConstraint = Matter.MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.2,
        render: {
          visible: false
        }
      }
    });
    Matter.World.add(world, mouseConstraint);
    render.mouse = mouse;

    // 5. Runner
    const runner = Matter.Runner.create();
    runnerRef.current = runner;
    Matter.Runner.run(runner, engine);
    Matter.Render.run(render);

    // 6. Custom Rendering Hook for Text
    Matter.Events.on(render, 'afterRender', () => {
        const ctx = render.context;
        const bodies = Matter.Composite.allBodies(engine.world);

        ctx.font = `bold ${BASE_FONT_SIZE}px ${FONT_FAMILY}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        bodies.forEach(body => {
            if ((body as any).char) {
                // Draw the letter
                ctx.save();
                ctx.translate(body.position.x, body.position.y);
                ctx.rotate(body.angle);
                
                // Use the specific color stored on the body, or default to dark stone
                ctx.fillStyle = (body as any).color || '#292524';

                // Artistic touch: Draw a slight shadow for depth
                ctx.shadowColor = "rgba(0,0,0,0.1)";
                ctx.shadowBlur = 4;
                ctx.shadowOffsetX = 2;
                ctx.shadowOffsetY = 2;

                ctx.fillText((body as any).char, 0, 2); 
                ctx.restore();
            }
        });
    });

    // 7. Resize Handler
    const handleResize = () => {
        render.canvas.width = window.innerWidth;
        render.canvas.height = window.innerHeight;
        Matter.World.clear(world, false);
        // Re-create walls and re-add bodies
        const bodies = Matter.Composite.allBodies(world).filter(b => b.label === 'letter');
        Matter.World.clear(world, false);
        createWalls();
        Matter.World.add(world, [...bodies, mouseConstraint]);
    };

    window.addEventListener('resize', handleResize);

    if (onReady) onReady();

    return () => {
      window.removeEventListener('resize', handleResize);
      Matter.Render.stop(render);
      Matter.Runner.stop(runner);
      if (render.canvas) render.canvas.remove();
    };
  }, []);

  return (
    <div 
        ref={sceneRef} 
        className="absolute inset-0 w-full h-full cursor-text z-0"
    />
  );
});

export default PhysicsWorld;