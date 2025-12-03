
import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import Matter from 'matter-js';
import { PhysicsConfig } from '../types';

const FADE_DURATION = 600; // ms for the fade-out animation

interface PhysicsWorldProps {
  config: PhysicsConfig;
  fontFamily: string;
  onReady?: () => void;
  onCollision?: () => void;
}

export interface PhysicsWorldHandle {
  addText: (text: string, x?: number, y?: number, color?: string) => void;
  clearWorld: () => void;
  pruneBodies: (maxCount: number) => void;
}

const PhysicsWorld = forwardRef<PhysicsWorldHandle, PhysicsWorldProps>(({ config, fontFamily, onReady, onCollision }, ref) => {
  const sceneRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  
  // Use refs so render loop and imperative handle can access latest props
  const fontRef = useRef(fontFamily);
  const configRef = useRef(config);
  const onCollisionRef = useRef(onCollision);
  
  // Track previous effective size (fontSize * spacing) to handle scaling of existing bodies
  const prevEffectiveSizeRef = useRef(config.fontSize * config.spacing);

  useEffect(() => {
    fontRef.current = fontFamily;
  }, [fontFamily]);
  
  useEffect(() => {
    onCollisionRef.current = onCollision;
  }, [onCollision]);

  useEffect(() => {
    configRef.current = config;
  }, [config]);
  
  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    addText: (text: string, startX?: number, startY?: number, color: string = '#292524') => {
      if (!engineRef.current) return;
      
      const world = engineRef.current.world;
      const width = sceneRef.current ? sceneRef.current.clientWidth : window.innerWidth;
      const fontSize = configRef.current.fontSize;
      const spacing = configRef.current.spacing;
      
      // Calculate spawn position
      // If no X provided, randomize it
      const safeX = startX ?? Math.random() * (width * 0.8) + (width * 0.1);
      const safeY = startY ?? -50;

      let offsetX = 0;

      for (const char of text) {
        if (char === ' ') {
            // Ensure spaces also respect the minimum visual width so we don't collapse spaces when spacing is low
            offsetX += fontSize * 0.6 * Math.max(1, spacing);
            continue;
        }

        const body = Matter.Bodies.rectangle(
            safeX + offsetX, 
            safeY, 
            fontSize * 0.6 * spacing, // Width scaled by spacing
            fontSize * 0.8 * spacing, // Height scaled by spacing
            {
                // Very slight random rotation for natural look, but small enough to keep words legible initially
                angle: (Math.random() - 0.5) * 0.05, 
                restitution: configRef.current.restitution,
                friction: configRef.current.friction,
                render: {
                    fillStyle: 'transparent', 
                },
                label: 'letter'
            }
        );
        
        // Attach custom data for rendering
        (body as any).char = char;
        (body as any).color = color;
        (body as any).createdAt = Date.now();
        (body as any).hasCollided = false; // Track collision for audio

        // Add slight upward motion as letter appears
        Matter.Body.setVelocity(body, {
            x: (Math.random() - 0.5) * 0.5, // Tiny horizontal variance for natural feel
            y: -2 // Upward motion
        });

        Matter.World.add(world, body);
        // Use Math.max(1, spacing) to ensure we always advance at least the visual width of the letter,
        // even if the physics body is tiny (low spacing).
        offsetX += fontSize * 0.7 * Math.max(1, spacing); 
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
      // Get all letter bodies that are NOT currently dying
      const activeBodies = world.bodies.filter(b => b.label === 'letter' && !(b as any).isDying);
      
      // If we have too many, mark the oldest ones for death
      // Matter.js usually adds new bodies to the end of the array, so index 0 is oldest
      if (activeBodies.length > maxCount) {
        const countToRemove = activeBodies.length - maxCount;
        const bodiesToMark = activeBodies.slice(0, countToRemove);
        
        bodiesToMark.forEach(body => {
          (body as any).isDying = true;
          (body as any).dyingSince = Date.now();
        });
      }
    }
  }));

  // Update engine config when props change
  useEffect(() => {
    if (engineRef.current) {
        engineRef.current.gravity.y = config.gravity;

        const currentEffectiveSize = config.fontSize * config.spacing;
        const prevEffectiveSize = prevEffectiveSizeRef.current;

        // Check if effective size (font * spacing) changed significantly to trigger scaling
        if (Math.abs(currentEffectiveSize - prevEffectiveSize) > 0.1) {
            const scaleFactor = currentEffectiveSize / prevEffectiveSize;
            
            engineRef.current.world.bodies.forEach(body => {
                if (body.label === 'letter') {
                    Matter.Body.scale(body, scaleFactor, scaleFactor);
                }
            });
            
            prevEffectiveSizeRef.current = currentEffectiveSize;
        }
        
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

    const initialWidth = sceneRef.current.clientWidth;
    const initialHeight = sceneRef.current.clientHeight;

    // 2. Setup Render
    const render = Matter.Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width: initialWidth,
        height: initialHeight,
        wireframes: false,
        background: 'transparent',
        pixelRatio: window.devicePixelRatio
      }
    });
    renderRef.current = render;

    // 3. Create Walls Helper
    const createWalls = (w: number, h: number) => {
        const wallThickness = 60;
        
        const ground = Matter.Bodies.rectangle(w / 2, h + wallThickness / 2 - 10, w, wallThickness, { 
            isStatic: true, 
            render: { fillStyle: 'transparent' },
            label: 'wall'
        });
        const leftWall = Matter.Bodies.rectangle(0 - wallThickness / 2, h / 2, wallThickness, h * 2, { 
            isStatic: true,
            render: { fillStyle: 'transparent' },
            label: 'wall'
        });
        const rightWall = Matter.Bodies.rectangle(w + wallThickness / 2, h / 2, wallThickness, h * 2, { 
            isStatic: true,
            render: { fillStyle: 'transparent' },
            label: 'wall'
        });

        Matter.World.add(world, [ground, leftWall, rightWall]);
    };
    
    // Initial create
    createWalls(initialWidth, initialHeight);

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

    // 5. Collision Events for Audio
    Matter.Events.on(engine, 'collisionStart', (event) => {
        const pairs = event.pairs;
        let collisionOccurred = false;

        for (let i = 0; i < pairs.length; i++) {
            const bodyA = pairs[i].bodyA as any;
            const bodyB = pairs[i].bodyB as any;

            // Check if A is a letter and hasn't collided yet
            if (bodyA.label === 'letter' && !bodyA.hasCollided) {
                bodyA.hasCollided = true;
                collisionOccurred = true;
            }

            // Check if B is a letter and hasn't collided yet
            if (bodyB.label === 'letter' && !bodyB.hasCollided) {
                bodyB.hasCollided = true;
                collisionOccurred = true;
            }
        }

        if (collisionOccurred && onCollisionRef.current) {
            onCollisionRef.current();
        }
    });

    // 6. Runner
    const runner = Matter.Runner.create();
    runnerRef.current = runner;
    Matter.Runner.run(runner, engine);
    Matter.Render.run(render);

    // 7. Cleanup Logic (Run before physics update)
    Matter.Events.on(engine, 'beforeUpdate', () => {
        const now = Date.now();
        const bodies = Matter.Composite.allBodies(engine.world);
        const bodiesToRemove: Matter.Body[] = [];

        bodies.forEach(body => {
            if ((body as any).isDying) {
                const elapsed = now - (body as any).dyingSince;
                if (elapsed >= FADE_DURATION) {
                    bodiesToRemove.push(body);
                }
            }
        });

        if (bodiesToRemove.length > 0) {
            Matter.World.remove(engine.world, bodiesToRemove);
        }
    });

    // 8. Custom Rendering Hook for Text
    Matter.Events.on(render, 'afterRender', () => {
        const ctx = render.context;
        const bodies = Matter.Composite.allBodies(engine.world);
        const now = Date.now();
        const currentFontSize = configRef.current.fontSize;

        // Use the ref to get the current font family
        // Note: We render text at fontSize, but the body size is fontSize * spacing.
        // This allows user to have large text with small hitboxes or vice versa.
        ctx.font = `bold ${currentFontSize}px ${fontRef.current}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        bodies.forEach(body => {
            if ((body as any).char) {
                const isDying = (body as any).isDying;
                let alpha = 1;
                let scale = 1;

                if (isDying) {
                    const elapsed = now - (body as any).dyingSince;
                    const progress = Math.min(1, elapsed / FADE_DURATION);
                    alpha = 1 - progress;
                    // Shrink slightly as it disappears
                    scale = 1 - (progress * 0.4); 
                }

                if (alpha <= 0) return; // Don't draw if invisible

                // Draw the letter
                ctx.save();
                ctx.translate(body.position.x, body.position.y);
                ctx.rotate(body.angle);
                
                // Apply fade and shrink transforms
                if (scale !== 1) ctx.scale(scale, scale);
                ctx.globalAlpha = alpha;

                // Use the specific color stored on the body, or default to dark stone
                ctx.fillStyle = (body as any).color || '#292524';

                // Artistic touch: Draw a slight shadow for depth
                ctx.shadowColor = "rgba(0,0,0,0.1)";
                ctx.shadowBlur = 4;
                ctx.shadowOffsetX = 2;
                ctx.shadowOffsetY = 2;

                // Draw text centered at body position. 
                // The body size might be different (controlled by spacing), but text draws at fontSize.
                ctx.fillText((body as any).char, 0, 2); 
                
                // Debug: Draw bounding box if you want to see the effect of spacing
                // ctx.strokeStyle = 'red';
                // ctx.strokeRect(-configRef.current.fontSize * 0.6 * configRef.current.spacing / 2, -configRef.current.fontSize * 0.8 * configRef.current.spacing / 2, configRef.current.fontSize * 0.6 * configRef.current.spacing, configRef.current.fontSize * 0.8 * configRef.current.spacing);

                ctx.restore();
            }
        });
    });

    // 9. Resize Handler using ResizeObserver
    // This ensures we capture the correct dimensions after layout changes (fullscreen, window resize)
    const resizeObserver = new ResizeObserver((entries) => {
        if (!entries.length || !renderRef.current || !engineRef.current) return;

        const entry = entries[0];
        const width = entry.contentRect.width;
        const height = entry.contentRect.height;
        const pixelRatio = window.devicePixelRatio || 1;
        
        const render = renderRef.current;
        
        // Optimization: Only resize if dimensions significantly changed or pixelRatio changed
        const isSizeDifferent = Math.abs((render.options.width || 0) - width) > 1 || Math.abs((render.options.height || 0) - height) > 1;
        const isDprDifferent = render.options.pixelRatio !== pixelRatio;

        if (!isSizeDifferent && !isDprDifferent) return;

        // Update Canvas and Render sizing correctly for High DPI
        // We must set internal pixel dimensions (width * ratio) vs display dimensions (style.width)
        render.canvas.width = width * pixelRatio;
        render.canvas.height = height * pixelRatio;
        render.canvas.style.width = `${width}px`;
        render.canvas.style.height = `${height}px`;

        render.options.width = width;
        render.options.height = height;
        render.options.pixelRatio = pixelRatio;

        // Update bounds to match new viewport
        render.bounds.min.x = 0;
        render.bounds.min.y = 0;
        render.bounds.max.x = width;
        render.bounds.max.y = height;

        // Preserve letters
        const bodies = Matter.Composite.allBodies(world).filter(b => b.label === 'letter');
        
        // Clear world to remove old walls and messy state
        Matter.World.clear(world, false);

        // Rebuild walls with new dimensions
        createWalls(width, height);

        // Add back the letters and mouse constraint
        Matter.World.add(world, [...bodies, mouseConstraint]);
        
        // Push back any letters that might be out of bounds
        bodies.forEach(b => {
            // Reposition if outside bounds (allowing for some margin)
            let newX = b.position.x;
            let newY = b.position.y;
            
            if (newX > width - 20) newX = width - 50;
            if (newX < 20) newX = 50;
            // Ensure they don't fall through the new floor immediately
            if (newY > height - 50) newY = height - 100; 
            
            if (newX !== b.position.x || newY !== b.position.y) {
                Matter.Body.setPosition(b, { x: newX, y: newY });
                Matter.Sleeping.set(b, false);
                Matter.Body.setVelocity(b, { x: 0, y: 0 }); // Reset velocity to prevent glitching through walls
            }
        });
    });

    resizeObserver.observe(sceneRef.current);

    if (onReady) onReady();

    return () => {
      resizeObserver.disconnect();
      Matter.Render.stop(render);
      Matter.Runner.stop(runner);
      if (render.canvas) render.canvas.remove();
      if (engineRef.current) {
          Matter.World.clear(engineRef.current.world, false);
          Matter.Engine.clear(engineRef.current);
      }
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
