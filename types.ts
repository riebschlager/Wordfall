// Fix: Import Matter to resolve namespace error
import Matter from 'matter-js';

export interface PhysicsConfig {
  gravity: number;
  restitution: number; // Bounciness
  friction: number;
  scale: number;
  fontSize: number;
}

export enum WallType {
  FLOOR = 'FLOOR',
  WALL_LEFT = 'WALL_LEFT',
  WALL_RIGHT = 'WALL_RIGHT',
  CEILING = 'CEILING',
}

export interface LetterBody extends Matter.Body {
  char?: string;
}

export type SchemeMode = 'monochrome' | 'monochrome-dark' | 'monochrome-light' | 'analogic' | 'complement' | 'analogic-complement' | 'triad' | 'quad';