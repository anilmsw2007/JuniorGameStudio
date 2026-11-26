import { ThemeType, HeroType, TileType } from '../types/index';

export interface ThemeColors {
  boardBg: string;
  gridLine: string;
  emptyTileBg: string;
  emptyTileBorder: string;
  wallBg: string;
  wallBorder: string;
  hazardBg: string;
  hazardBorder: string;
  accent: string;
  bannerBg: string;
  bannerText: string;
}

export const THEME_DATA: Record<ThemeType, {
  nameEn: string;
  nameHi: string;
  colors: ThemeColors;
  emojis: Record<TileType, string>;
}> = {
  jungle: {
    nameEn: 'Jungle 🌴',
    nameHi: 'जंगल 🌴',
    colors: {
      boardBg: '#1B4D3E',
      gridLine: '#2E7D32',
      emptyTileBg: '#A5D6A7',
      emptyTileBorder: '#81C784',
      wallBg: '#5D4037',
      wallBorder: '#4E342E',
      hazardBg: '#FF7043',
      hazardBorder: '#D84315',
      accent: '#2E7D32',
      bannerBg: '#2E7D32',
      bannerText: '#FFFFFF',
    },
    emojis: {
      EMPTY: '',
      WALL: '🌳',
      HAZARD: '🐊',
      STAR: '🍌',
      KEY: '🗝️',
      DOOR: '🛖',
      GOAL: '🌴',
    },
  },
  space: {
    nameEn: 'Space 🚀',
    nameHi: 'अंतरिक्ष 🚀',
    colors: {
      boardBg: '#0D1B2A',
      gridLine: '#1B263B',
      emptyTileBg: '#1E293B',
      emptyTileBorder: '#334155',
      wallBg: '#475569',
      wallBorder: '#334155',
      hazardBg: '#DC2626',
      hazardBorder: '#991B1B',
      accent: '#38BDF8',
      bannerBg: '#1E293B',
      bannerText: '#38BDF8',
    },
    emojis: {
      EMPTY: '',
      WALL: '☄️',
      HAZARD: '🕳️',
      STAR: '⭐',
      KEY: '🔋',
      DOOR: '🛸',
      GOAL: '🪐',
    },
  },
  ocean: {
    nameEn: 'Ocean 🌊',
    nameHi: 'समुद्र 🌊',
    colors: {
      boardBg: '#003554',
      gridLine: '#0582CA',
      emptyTileBg: '#BEE9E8',
      emptyTileBorder: '#89C2D9',
      wallBg: '#014F86',
      wallBorder: '#013A63',
      hazardBg: '#FF6B6B',
      hazardBorder: '#EE5253',
      accent: '#0077B6',
      bannerBg: '#0077B6',
      bannerText: '#FFFFFF',
    },
    emojis: {
      EMPTY: '',
      WALL: '🪨',
      HAZARD: '🦈',
      STAR: '🐚',
      KEY: '🔱',
      DOOR: '🐙',
      GOAL: '🏝️',
    },
  },
  city: {
    nameEn: 'City 🏙️',
    nameHi: 'शहर 🏙️',
    colors: {
      boardBg: '#374151',
      gridLine: '#4B5563',
      emptyTileBg: '#E5E7EB',
      emptyTileBorder: '#D1D5DB',
      wallBg: '#1F2937',
      wallBorder: '#111827',
      hazardBg: '#F59E0B',
      hazardBorder: '#D97706',
      accent: '#4F46E5',
      bannerBg: '#4F46E5',
      bannerText: '#FFFFFF',
    },
    emojis: {
      EMPTY: '',
      WALL: '🏢',
      HAZARD: '🚧',
      STAR: '💎',
      KEY: '💳',
      DOOR: '🏬',
      GOAL: '🏁',
    },
  },
  castle: {
    nameEn: 'Castle 🏰',
    nameHi: 'किला 🏰',
    colors: {
      boardBg: '#2D1537',
      gridLine: '#4A255B',
      emptyTileBg: '#E9D5FF',
      emptyTileBorder: '#D8B4FE',
      wallBg: '#581C87',
      wallBorder: '#3B0764',
      hazardBg: '#E11D48',
      hazardBorder: '#9F1239',
      accent: '#9333EA',
      bannerBg: '#7E22CE',
      bannerText: '#FFFFFF',
    },
    emojis: {
      EMPTY: '',
      WALL: '🏰',
      HAZARD: '🔥',
      STAR: '👑',
      KEY: '🗝️',
      DOOR: '🚪',
      GOAL: '🏆',
    },
  },
};

export const HERO_EMOJIS: Record<HeroType, string> = {
  monkey: '🐵',
  rocket: '🚀',
  car: '🏎️',
  unicorn: '🦄',
  robot: '🤖',
  ninja: '🥷',
};
