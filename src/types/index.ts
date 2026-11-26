export type Language = 'en' | 'hi';

export type TileType = 'EMPTY' | 'WALL' | 'HAZARD' | 'STAR' | 'KEY' | 'DOOR' | 'GOAL';

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export type ActionType = 'MOVE_UP' | 'MOVE_DOWN' | 'MOVE_LEFT' | 'MOVE_RIGHT' | 'JUMP';

export interface CodeBlock {
  id: string;
  type: ActionType;
  repeat: 1 | 2 | 3; // 1 = regular, 2 = 2x repeat, 3 = 3x repeat
}

export type ThemeType = 'jungle' | 'space' | 'ocean' | 'city' | 'castle';

export type HeroType = 'monkey' | 'rocket' | 'car' | 'unicorn' | 'robot' | 'ninja';

export interface Position {
  row: number;
  col: number;
}

export interface LevelConfig {
  id: string;
  titleEn: string;
  titleHi: string;
  missionEn: string;
  missionHi: string;
  hintEn: string;
  hintHi: string;
  gridSize: number; // default 6
  theme: ThemeType;
  hero: HeroType;
  startPos: Position;
  initialDirection: Direction;
  board: TileType[][];
  maxBlocksTarget: number; // for 3 stars
  requireAllStars: boolean;
  lives: number;
  pointsPerStar: number;
  isCustom?: boolean;
}

export interface UserProgress {
  unlockedLevels: number; // 1-based level index
  levelStars: Record<string, number>; // levelId -> stars (1-3)
  totalStars: number;
  badge: 'junior' | 'master' | 'creator';
  language: Language;
  soundEnabled: boolean;
  musicEnabled: boolean;
  voiceEnabled: boolean;
  customGames: LevelConfig[];
}

export interface SimulationState {
  heroPos: Position;
  heroDir: Direction;
  board: TileType[][];
  collectedStars: number;
  totalStars: number;
  hasKey: boolean;
  isDoorOpen: boolean;
  remainingLives: number;
  score: number;
  visitedPositions: Position[];
  status: 'idle' | 'running' | 'won' | 'lost';
  failReason?: string;
}
