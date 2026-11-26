import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProgress, LevelConfig, Language } from '../types/index';

const STORAGE_KEY = '@junior_game_studio_v1';

export const DEFAULT_USER_PROGRESS: UserProgress = {
  unlockedLevels: 1,
  levelStars: {},
  totalStars: 0,
  badge: 'junior',
  language: 'en',
  soundEnabled: true,
  musicEnabled: true,
  voiceEnabled: true,
  customGames: [],
};

export async function loadUserProgress(): Promise<UserProgress> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_USER_PROGRESS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_USER_PROGRESS,
      ...parsed,
    };
  } catch (error) {
    console.error('Failed to load user progress:', error);
    return DEFAULT_USER_PROGRESS;
  }
}

export async function saveUserProgress(progress: UserProgress): Promise<void> {
  try {
    // Recompute total stars and badges
    let totalStars = 0;
    Object.values(progress.levelStars).forEach((stars) => {
      totalStars += stars;
    });

    let badge: 'junior' | 'master' | 'creator' = 'junior';
    if (progress.customGames.length > 0) {
      badge = 'creator';
    } else if (totalStars >= 12 || progress.unlockedLevels >= 5) {
      badge = 'master';
    }

    const updated: UserProgress = {
      ...progress,
      totalStars,
      badge,
    };

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save user progress:', error);
  }
}
