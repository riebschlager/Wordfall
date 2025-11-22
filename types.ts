// Fix: Import Matter to resolve namespace error
import Matter from 'matter-js';

export interface PhysicsConfig {
  gravity: number;
  restitution: number; // Bounciness
  friction: number;
  scale: number;
}

export enum WallType {
  FLOOR = 'FLOOR',
  WALL_LEFT = 'WALL_LEFT',
  WALL_RIGHT = 'WALL_RIGHT',
  CEILING = 'CEILING',
}

export interface LetterBody extends Matter.Body {
  char?: string;
  isStatic?: boolean;
}

export interface ColorPalette {
  id: string;
  name: string;
  colors: string[];
}
