import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  UserProgress,
  Language,
  LevelConfig,
} from './src/types/index';
import {
  loadUserProgress,
  saveUserProgress,
  DEFAULT_USER_PROGRESS,
} from './src/utils/storage';
import { STORY_LEVELS } from './src/data/levels';
import { getTranslation } from './src/data/translations';
import { Sound } from './src/utils/sound';
import { Header } from './src/components/Header';
import { GamePlayer } from './src/components/GamePlayer';
import { LevelBuilder } from './src/components/LevelBuilder';

type AppScreen = 'HOME' | 'STORY_LEVELS' | 'PLAY_GAME' | 'BUILDER' | 'MY_GAMES';

export default function App() {
  const [progress, setProgress] = useState<UserProgress>(DEFAULT_USER_PROGRESS);
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('HOME');
  const [activeLevel, setActiveLevel] = useState<LevelConfig | null>(null);
  const [editingCustomLevel, setEditingCustomLevel] = useState<LevelConfig | undefined>(undefined);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importCodeText, setImportCodeText] = useState('');

  // Initial load of offline stored progress
  useEffect(() => {
    (async () => {
      const saved = await loadUserProgress();
      setProgress(saved);
      Sound.setSoundEnabled(saved.soundEnabled);
      Sound.setVoiceEnabled(saved.voiceEnabled);
      Sound.setMusicEnabled(saved.musicEnabled);
    })();
  }, []);

  const language = progress.language;
  const t = getTranslation(language);

  // Global control handlers
  const handleToggleLanguage = () => {
    const nextLang: Language = language === 'en' ? 'hi' : 'en';
    const updated = { ...progress, language: nextLang };
    setProgress(updated);
    saveUserProgress(updated);
  };

  const handleToggleSound = () => {
    const next = !progress.soundEnabled;
    Sound.setSoundEnabled(next);
    const updated = { ...progress, soundEnabled: next };
    setProgress(updated);
    saveUserProgress(updated);
  };

  const handleToggleVoice = () => {
    const next = !progress.voiceEnabled;
    Sound.setVoiceEnabled(next);
    const updated = { ...progress, voiceEnabled: next };
    setProgress(updated);
    saveUserProgress(updated);
  };

  const handleToggleMusic = () => {
    const next = !progress.musicEnabled;
    Sound.setMusicEnabled(next);
    const updated = { ...progress, musicEnabled: next };
    setProgress(updated);
    saveUserProgress(updated);
  };

  // Launch a level
  const handleStartLevel = (level: LevelConfig) => {
    Sound.triggerHaptic('medium');
    setActiveLevel(level);
    setCurrentScreen('PLAY_GAME');
  };

  // Victory callback
  const handleLevelVictory = (starsEarned: number) => {
    if (!activeLevel) return;

    const currentStars = progress.levelStars[activeLevel.id] || 0;
    const bestStars = Math.max(currentStars, starsEarned);

    // Calculate next level unlock for story mode
    let nextUnlocked = progress.unlockedLevels;
    const currentStoryIndex = STORY_LEVELS.findIndex((l) => l.id === activeLevel.id);
    if (currentStoryIndex !== -1 && currentStoryIndex + 2 > nextUnlocked) {
      nextUnlocked = currentStoryIndex + 2;
    }

    const updated: UserProgress = {
      ...progress,
      levelStars: {
        ...progress.levelStars,
        [activeLevel.id]: bestStars,
      },
      unlockedLevels: nextUnlocked,
    };

    setProgress(updated);
    saveUserProgress(updated);
  };

  // Move to next story level
  const handleNextStoryLevel = () => {
    if (!activeLevel) return;
    const currentIndex = STORY_LEVELS.findIndex((l) => l.id === activeLevel.id);
    if (currentIndex !== -1 && currentIndex + 1 < STORY_LEVELS.length) {
      const nextLvl = STORY_LEVELS[currentIndex + 1];
      setActiveLevel(nextLvl);
    } else {
      setCurrentScreen('STORY_LEVELS');
    }
  };

  // Save custom level created in builder
  const handleSaveCustomLevel = (level: LevelConfig) => {
    const existingIndex = progress.customGames.findIndex((g) => g.id === level.id);
    let updatedGames: LevelConfig[];
    if (existingIndex >= 0) {
      updatedGames = [...progress.customGames];
      updatedGames[existingIndex] = level;
    } else {
      updatedGames = [level, ...progress.customGames];
    }

    const updated = {
      ...progress,
      customGames: updatedGames,
    };
    setProgress(updated);
    saveUserProgress(updated);
    setCurrentScreen('MY_GAMES');
  };

  // Delete custom level
  const handleDeleteCustomLevel = (id: string) => {
    Sound.triggerHaptic('warning');
    Alert.alert(t.builder.deleteConfirm, '', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          Sound.triggerHaptic('error');
          const updatedGames = progress.customGames.filter((g) => g.id !== id);
          const updated = { ...progress, customGames: updatedGames };
          setProgress(updated);
          saveUserProgress(updated);
        },
      },
    ]);
  };

  // Compact JSON Export / Share code
  const handleExportLevel = (level: LevelConfig) => {
    Sound.triggerHaptic('light');
    const code = JSON.stringify(level);
    Alert.alert(t.builder.exportCode, code);
  };

  // Import level from JSON string
  const handleImportLevel = () => {
    try {
      if (!importCodeText.trim()) return;
      const parsed = JSON.parse(importCodeText.trim()) as LevelConfig;
      if (!parsed.board || !parsed.startPos) {
        throw new Error('Invalid level schema');
      }
      parsed.id = `imported_${Date.now()}`;
      parsed.isCustom = true;

      const updated = {
        ...progress,
        customGames: [parsed, ...progress.customGames],
      };
      setProgress(updated);
      saveUserProgress(updated);
      setImportModalVisible(false);
      setImportCodeText('');
      Sound.triggerHaptic('success');
      Alert.alert('Success', t.builder.importSuccess);
    } catch {
      Sound.triggerHaptic('error');
      Alert.alert('Error', 'Invalid level code format!');
    }
  };

  // Speak active mission for current screen if applicable
  const handleSpeakActive = () => {
    if (currentScreen === 'PLAY_GAME' && activeLevel) {
      const text = language === 'hi' ? activeLevel.missionHi : activeLevel.missionEn;
      Sound.speakText(text, language);
    } else {
      const welcome = language === 'hi' ? t.appSubtitle : t.appSubtitle;
      Sound.speakText(welcome, language);
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar style="light" />

        {/* Global Child-Friendly Header */}
        <Header
          progress={progress}
          language={language}
          onToggleLanguage={handleToggleLanguage}
          onToggleSound={handleToggleSound}
          onToggleVoice={handleToggleVoice}
          onToggleMusic={handleToggleMusic}
          onSpeakActiveMission={handleSpeakActive}
        />

        {/* Main Screen Switcher */}
        {currentScreen === 'HOME' && (
          <ScrollView contentContainerStyle={styles.homeContainer}>
            {/* Welcome Banner */}
            <View style={styles.welcomeBanner}>
              <Text style={styles.welcomeEmoji}>🚀🧩</Text>
              <Text style={styles.welcomeTitle}>{t.appTitle}</Text>
              <Text style={styles.welcomeSubtitle}>{t.appSubtitle}</Text>
            </View>

            {/* Mode 1: Learn & Play (Story Mode) */}
            <Pressable
              onPress={() => {
                Sound.triggerHaptic('light');
                setCurrentScreen('STORY_LEVELS');
              }}
              style={({ pressed }) => [
                styles.modeCard,
                styles.storyCard,
                { transform: [{ scale: pressed ? 0.98 : 1 }] },
              ]}
            >
              <Text style={styles.cardEmoji}>📖⭐</Text>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{t.storyMode}</Text>
                <Text style={styles.cardDesc}>{t.storyModeDesc}</Text>
              </View>
              <Text style={styles.cardChevron}>➔</Text>
            </Pressable>

            {/* Mode 2: Create Mode (Game Builder) */}
            <Pressable
              onPress={() => {
                Sound.triggerHaptic('light');
                setEditingCustomLevel(undefined);
                setCurrentScreen('BUILDER');
              }}
              style={({ pressed }) => [
                styles.modeCard,
                styles.builderCard,
                { transform: [{ scale: pressed ? 0.98 : 1 }] },
              ]}
            >
              <Text style={styles.cardEmoji}>🎨🛠️</Text>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{t.createMode}</Text>
                <Text style={styles.cardDesc}>{t.createModeDesc}</Text>
              </View>
              <Text style={styles.cardChevron}>➔</Text>
            </Pressable>

            {/* My Custom Games Library */}
            <Pressable
              onPress={() => {
                Sound.triggerHaptic('light');
                setCurrentScreen('MY_GAMES');
              }}
              style={({ pressed }) => [
                styles.modeCard,
                styles.myGamesCard,
                { transform: [{ scale: pressed ? 0.98 : 1 }] },
              ]}
            >
              <Text style={styles.cardEmoji}>📁💾</Text>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>
                  {t.builder.myGames} ({progress.customGames.length})
                </Text>
                <Text style={styles.cardDesc}>
                  {language === 'hi' ? 'अपने बनाए गेम खेलें, शेयर करें या बदलें' : 'Play, edit or share your custom 2D games'}
                </Text>
              </View>
              <Text style={styles.cardChevron}>➔</Text>
            </Pressable>
          </ScrollView>
        )}

        {/* Story Mode Level Selection */}
        {currentScreen === 'STORY_LEVELS' && (
          <ScrollView contentContainerStyle={styles.screenScroll}>
            <View style={styles.subHeaderRow}>
              <Pressable
                onPress={() => {
                  Sound.triggerHaptic('light');
                  setCurrentScreen('HOME');
                }}
                style={styles.subBackBtn}
              >
                <Text style={styles.subBackBtnText}>◀ {language === 'hi' ? 'वापस' : 'Back'}</Text>
              </Pressable>
              <Text style={styles.subHeaderTitle}>{t.storyMode}</Text>
            </View>

            <View style={styles.levelsGrid}>
              {STORY_LEVELS.map((lvl, index) => {
                const isUnlocked = index + 1 <= progress.unlockedLevels;
                const earned = progress.levelStars[lvl.id] || 0;

                return (
                  <Pressable
                    key={lvl.id}
                    disabled={!isUnlocked}
                    onPress={() => handleStartLevel(lvl)}
                    style={({ pressed }) => [
                      styles.levelSelectCard,
                      !isUnlocked && styles.levelCardLocked,
                      { transform: [{ scale: pressed && isUnlocked ? 0.96 : 1 }] },
                    ]}
                  >
                    <View style={styles.levelCardTop}>
                      <Text style={styles.levelNumber}>{index + 1}</Text>
                      {isUnlocked ? (
                        <View style={styles.starDisplay}>
                          <Text style={styles.starText}>
                            {earned >= 1 ? '⭐' : '☆'}
                            {earned >= 2 ? '⭐' : '☆'}
                            {earned >= 3 ? '⭐' : '☆'}
                          </Text>
                        </View>
                      ) : (
                        <Text style={styles.lockIcon}>🔒</Text>
                      )}
                    </View>

                    <Text style={styles.levelCardTitle} numberOfLines={1}>
                      {language === 'hi' ? lvl.titleHi : lvl.titleEn}
                    </Text>
                    <Text style={styles.levelCardMission} numberOfLines={2}>
                      {language === 'hi' ? lvl.missionHi : lvl.missionEn}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        )}

        {/* Active Game Player */}
        {currentScreen === 'PLAY_GAME' && activeLevel && (
          <GamePlayer
            level={activeLevel}
            language={language}
            onVictory={handleLevelVictory}
            onNextLevel={handleNextStoryLevel}
            onBackToMenu={() => setCurrentScreen(activeLevel.isCustom ? 'MY_GAMES' : 'STORY_LEVELS')}
            hasNextLevel={
              !activeLevel.isCustom &&
              STORY_LEVELS.findIndex((l) => l.id === activeLevel.id) + 1 < STORY_LEVELS.length
            }
          />
        )}

        {/* Level Builder Studio */}
        {currentScreen === 'BUILDER' && (
          <LevelBuilder
            language={language}
            editingLevel={editingCustomLevel}
            onSaveLevel={handleSaveCustomLevel}
            onPlayTest={(testLvl) => {
              setActiveLevel(testLvl);
              setCurrentScreen('PLAY_GAME');
            }}
            onClose={() => setCurrentScreen('HOME')}
          />
        )}

        {/* My Custom Games Library Screen */}
        {currentScreen === 'MY_GAMES' && (
          <ScrollView contentContainerStyle={styles.screenScroll}>
            <View style={styles.subHeaderRow}>
              <Pressable
                onPress={() => {
                  Sound.triggerHaptic('light');
                  setCurrentScreen('HOME');
                }}
                style={styles.subBackBtn}
              >
                <Text style={styles.subBackBtnText}>◀ {language === 'hi' ? 'वापस' : 'Back'}</Text>
              </Pressable>
              <Text style={styles.subHeaderTitle}>{t.builder.myGames}</Text>
              <Pressable
                onPress={() => {
                  Sound.triggerHaptic('light');
                  setImportModalVisible(true);
                }}
                style={styles.importBtn}
              >
                <Text style={styles.importBtnText}>📥 {language === 'hi' ? 'आयात' : 'Import'}</Text>
              </Pressable>
            </View>

            {progress.customGames.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateEmoji}>🎨🕹️</Text>
                <Text style={styles.emptyStateText}>{t.builder.noCustomGames}</Text>
                <Pressable
                  onPress={() => {
                    Sound.triggerHaptic('light');
                    setEditingCustomLevel(undefined);
                    setCurrentScreen('BUILDER');
                  }}
                  style={styles.createNowBtn}
                >
                  <Text style={styles.createNowText}>
                    + {language === 'hi' ? 'नया गेम बनाएं' : 'Create New Game'}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.myGamesList}>
                {progress.customGames.map((game) => (
                  <View key={game.id} style={styles.customGameCard}>
                    <View style={styles.customGameInfo}>
                      <Text style={styles.customGameTitle}>
                        {language === 'hi' ? game.titleHi : game.titleEn}
                      </Text>
                      <Text style={styles.customGameMeta}>
                        {t.themes[game.theme]} • {t.heroes[game.hero]}
                      </Text>
                    </View>

                    <View style={styles.customActions}>
                      <Pressable
                        onPress={() => handleStartLevel(game)}
                        style={styles.playCustomBtn}
                      >
                        <Text style={styles.playCustomText}>▶️</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          Sound.triggerHaptic('light');
                          setEditingCustomLevel(game);
                          setCurrentScreen('BUILDER');
                        }}
                        style={styles.editCustomBtn}
                      >
                        <Text style={styles.customActionText}>✏️</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleExportLevel(game)}
                        style={styles.exportCustomBtn}
                      >
                        <Text style={styles.customActionText}>📋</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleDeleteCustomLevel(game.id)}
                        style={styles.deleteCustomBtn}
                      >
                        <Text style={styles.customActionText}>🗑️</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        )}

        {/* Import Code Modal */}
        <Modal
          visible={importModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setImportModalVisible(false)}
        >
          <View style={styles.importModalOverlay}>
            <View style={styles.importModalCard}>
              <Text style={styles.importModalTitle}>📥 {t.builder.importCode}</Text>
              <TextInput
                style={styles.importInput}
                multiline
                numberOfLines={4}
                placeholder="Paste level JSON here..."
                value={importCodeText}
                onChangeText={setImportCodeText}
              />
              <View style={styles.importBtnRow}>
                <Pressable
                  onPress={() => setImportModalVisible(false)}
                  style={styles.importCancelBtn}
                >
                  <Text style={styles.importModalBtnText}>Cancel</Text>
                </Pressable>
                <Pressable onPress={handleImportLevel} style={styles.importSubmitBtn}>
                  <Text style={styles.importModalBtnText}>Import</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#2563EB', // Matching header blue so Android status bar blends seamlessly
  },
  homeContainer: {
    padding: 16,
    paddingBottom: 32,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    minHeight: '100%',
  },
  welcomeBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  welcomeEmoji: {
    fontSize: 50,
    marginBottom: 8,
  },
  welcomeTitle: {
    fontSize: 26, // Enlarged from 22
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16, // Enlarged from 13
    color: '#475569',
    fontWeight: '700',
    marginTop: 6,
    textAlign: 'center',
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    width: '100%',
    marginBottom: 16,
    elevation: 4,
    borderWidth: 2.5,
    minHeight: 96,
  },
  storyCard: {
    borderColor: '#60A5FA',
    backgroundColor: '#EFF6FF',
  },
  builderCard: {
    borderColor: '#F472B6',
    backgroundColor: '#FDF2F8',
  },
  myGamesCard: {
    borderColor: '#34D399',
    backgroundColor: '#ECFDF5',
  },
  cardEmoji: {
    fontSize: 40, // Enlarged from 34
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 19, // Enlarged from 16
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 14, // Enlarged from 12
    color: '#334155',
    lineHeight: 18,
    fontWeight: '600',
  },
  cardChevron: {
    fontSize: 24,
    color: '#64748B',
    marginLeft: 10,
    fontWeight: '900',
  },
  screenScroll: {
    padding: 16,
    backgroundColor: '#F8FAFC',
    minHeight: '100%',
  },
  subHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  subBackBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
  },
  subBackBtnText: {
    fontSize: 15, // Enlarged from 13
    fontWeight: '900',
    color: '#1E293B',
  },
  subHeaderTitle: {
    fontSize: 22, // Enlarged from 18
    fontWeight: '900',
    color: '#0F172A',
  },
  importBtn: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  importBtnText: {
    color: '#FFFFFF',
    fontSize: 14, // Enlarged from 12
    fontWeight: '900',
  },
  levelsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  levelSelectCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 2.5,
    borderColor: '#CBD5E1',
    elevation: 4,
    minHeight: 124,
  },
  levelCardLocked: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    opacity: 0.6,
  },
  levelCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  levelNumber: {
    fontSize: 22, // Enlarged from 18
    fontWeight: '900',
    color: '#2563EB',
  },
  starDisplay: {
    flexDirection: 'row',
  },
  starText: {
    fontSize: 18, // Enlarged from 14
  },
  lockIcon: {
    fontSize: 20,
  },
  levelCardTitle: {
    fontSize: 16, // Enlarged from 13
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 4,
  },
  levelCardMission: {
    fontSize: 13, // Enlarged from 11
    color: '#475569',
    lineHeight: 17,
    fontWeight: '600',
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginTop: 20,
  },
  emptyStateEmoji: {
    fontSize: 48,
    marginBottom: 10,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  createNowBtn: {
    backgroundColor: '#10B981',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  createNowText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  myGamesList: {
    gap: 12,
  },
  customGameCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
  },
  customGameInfo: {
    flex: 1,
  },
  customGameTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 3,
  },
  customGameMeta: {
    fontSize: 12,
    color: '#64748B',
  },
  customActions: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  playCustomBtn: {
    backgroundColor: '#22C55E',
    borderRadius: 10,
    padding: 8,
  },
  playCustomText: {
    fontSize: 14,
  },
  editCustomBtn: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 8,
  },
  exportCustomBtn: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 8,
  },
  deleteCustomBtn: {
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    padding: 8,
  },
  customActionText: {
    fontSize: 14,
  },
  importModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  importModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    elevation: 8,
  },
  importModalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1E293B',
  },
  importInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 12,
    fontSize: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 14,
  },
  importBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  importCancelBtn: {
    flex: 1,
    backgroundColor: '#94A3B8',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  importSubmitBtn: {
    flex: 1,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  importModalBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
