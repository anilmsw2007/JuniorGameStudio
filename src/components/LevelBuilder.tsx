import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  useWindowDimensions,
} from 'react-native';
import {
  LevelConfig,
  ThemeType,
  HeroType,
  TileType,
  Position,
  Language,
} from '../types/index';
import { THEME_DATA, HERO_EMOJIS } from '../data/themes';
import { getTranslation } from '../data/translations';
import { validateBoardPath } from '../utils/pathValidator';
import { GameGrid } from './GameGrid';
import { Sound } from '../utils/sound';

interface LevelBuilderProps {
  language: Language;
  onSaveLevel: (level: LevelConfig) => void;
  onPlayTest: (level: LevelConfig) => void;
  onClose: () => void;
  editingLevel?: LevelConfig;
}

type PaletteTool = 'START' | 'GOAL' | 'WALL' | 'HAZARD' | 'STAR' | 'KEY' | 'DOOR' | 'EMPTY';

export const LevelBuilder: React.FC<LevelBuilderProps> = ({
  language,
  onSaveLevel,
  onPlayTest,
  onClose,
  editingLevel,
}) => {
  const t = getTranslation(language);
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  // Builder configuration states
  const [title, setTitle] = useState(
    editingLevel ? (language === 'hi' ? editingLevel.titleHi : editingLevel.titleEn) : 'My Super Level'
  );
  const [theme, setTheme] = useState<ThemeType>(editingLevel?.theme || 'jungle');
  const [hero, setHero] = useState<HeroType>(editingLevel?.hero || 'monkey');
  const [selectedTool, setSelectedTool] = useState<PaletteTool>('WALL');
  const [startPos, setStartPos] = useState<Position>(
    editingLevel?.startPos || { row: 0, col: 0 }
  );
  const [requireStars, setRequireStars] = useState<boolean>(
    editingLevel?.requireAllStars ?? false
  );
  const [lives, setLives] = useState<number>(editingLevel?.lives || 3);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    message: string;
  } | null>(null);

  // 6×6 Board State
  const [board, setBoard] = useState<TileType[][]>(() => {
    if (editingLevel?.board) {
      return JSON.parse(JSON.stringify(editingLevel.board));
    }
    const emptyGrid: TileType[][] = Array(6)
      .fill(null)
      .map(() => Array(6).fill('EMPTY'));
    emptyGrid[5][5] = 'GOAL';
    return emptyGrid;
  });

  const handleTilePress = (r: number, c: number) => {
    Sound.playStep();
    setValidationResult(null);

    if (selectedTool === 'START') {
      setStartPos({ row: r, col: c });
      const newBoard = board.map((row) => [...row]);
      newBoard[r][c] = 'EMPTY';
      setBoard(newBoard);
      return;
    }

    if (selectedTool === 'GOAL') {
      const newBoard: TileType[][] = board.map((row) =>
        row.map((cell) => (cell === 'GOAL' ? ('EMPTY' as TileType) : cell))
      );
      newBoard[r][c] = 'GOAL';
      setBoard(newBoard);
      return;
    }

    const newBoard = board.map((row) => [...row]);
    newBoard[r][c] = selectedTool as TileType;
    setBoard(newBoard);
  };

  const validateMap = () => {
    const res = validateBoardPath(board, startPos);
    if (res.isValid) {
      Sound.triggerHaptic('success');
      setValidationResult({
        valid: true,
        message: `${t.builder.pathValid} (${language === 'hi' ? 'कदम' : 'Steps'}: ${res.shortestPathLength})`,
      });
      return true;
    } else {
      Sound.triggerHaptic('error');
      setValidationResult({
        valid: false,
        message: res.error ? `${t.builder.pathInvalid} (${res.error})` : t.builder.pathInvalid,
      });
      return false;
    }
  };

  const handleResetMap = () => {
    Sound.triggerHaptic('medium');
    const emptyGrid: TileType[][] = Array(6)
      .fill(null)
      .map(() => Array(6).fill('EMPTY'));
    emptyGrid[5][5] = 'GOAL';
    setBoard(emptyGrid);
    setStartPos({ row: 0, col: 0 });
    setValidationResult(null);
  };

  const createLevelObject = (): LevelConfig => {
    return {
      id: editingLevel?.id || `custom_${Date.now()}`,
      titleEn: title,
      titleHi: title,
      missionEn: `Custom Level: Guide the hero to the goal!`,
      missionHi: `कस्टम स्तर: हीरो को मंज़िल तक पहुंचाएं!`,
      hintEn: `Follow the clear tiles and jump hazards!`,
      hintHi: `साफ़ रास्ते का अनुसरण करें और खतरों को पार करें!`,
      gridSize: 6,
      theme,
      hero,
      startPos,
      initialDirection: 'RIGHT',
      board,
      maxBlocksTarget: 8,
      requireAllStars: requireStars,
      lives,
      pointsPerStar: 100,
      isCustom: true,
    };
  };

  const handleSave = () => {
    const isValid = validateMap();
    if (!isValid) {
      Alert.alert('Validation Notice', t.builder.pathInvalid);
      return;
    }
    const level = createLevelObject();
    Sound.triggerHaptic('success');
    onSaveLevel(level);
    Alert.alert('Saved! 💾', language === 'hi' ? 'कस्टम स्तर सफलतापूर्वक सहेजा गया!' : 'Custom level saved successfully!');
  };

  const handleTest = () => {
    Sound.triggerHaptic('medium');
    const level = createLevelObject();
    onPlayTest(level);
  };

  const paletteTools: PaletteTool[] = [
    'WALL',
    'HAZARD',
    'STAR',
    'KEY',
    'DOOR',
    'START',
    'GOAL',
    'EMPTY',
  ];

  return (
    <View style={styles.container}>
      {/* Header bar */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {t.builder.title}
        </Text>
        <Pressable onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>✕</Text>
        </Pressable>
      </View>

      <View style={[styles.bodyLayout, isLandscape && styles.bodyLayoutLandscape]}>
        {/* Left Section: 6×6 Board & Validation in Landscape */}
        <View style={[styles.boardColumn, isLandscape && styles.boardColumnLandscape]}>
          <Text
            style={styles.sectionTitle}
            numberOfLines={1}
            adjustsFontSizeToFit
            maxFontSizeMultiplier={1.2}
          >
            {language === 'hi' ? 'नक्शा डिज़ाइन करें' : 'Design Map (Tap to paint)'}
          </Text>
          <GameGrid
            board={board}
            heroPos={startPos}
            heroDir="RIGHT"
            theme={theme}
            hero={hero}
            isInteractive={true}
            showJumpPreview={false}
            onTilePress={handleTilePress}
          />

          {validationResult && (
            <View
              style={[
                styles.valBanner,
                validationResult.valid ? styles.valSuccess : styles.valFail,
              ]}
            >
              <Text
                style={[
                  styles.valText,
                  validationResult.valid ? styles.valTextSuccess : styles.valTextFail,
                ]}
                numberOfLines={2}
                adjustsFontSizeToFit
                maxFontSizeMultiplier={1.2}
              >
                {validationResult.message}
              </Text>
            </View>
          )}
        </View>

        {/* Right Section / Scrollable Options: Title, Brush Palette, Theme, Rules */}
        <ScrollView
          style={[styles.optionsColumn, isLandscape && styles.optionsColumnLandscape]}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 96 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Title Input */}
          <View style={styles.inputCard}>
            <Text style={styles.label}>{t.builder.gameTitlePrompt}</Text>
            <TextInput
              style={styles.textInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Level Name..."
              placeholderTextColor="#94A3B8"
            />
          </View>

          {/* Palette Brush Selector */}
          <View style={styles.sectionCard}>
            <View style={styles.paletteHeaderRow}>
              <Text style={styles.label}>{t.builder.selectTool}:</Text>
              <Pressable onPress={handleResetMap} style={styles.clearCanvasBtn}>
                <Text style={styles.clearCanvasBtnText}>
                  {language === 'hi' ? 'साफ़ करें 🧹' : 'Clear Canvas 🧹'}
                </Text>
              </Pressable>
            </View>
            <View style={styles.toolsRow}>
              {paletteTools.map((tool) => {
                const isSelected = selectedTool === tool;
                let label = t.tools[tool] || tool;
                return (
                  <Pressable
                    key={tool}
                    onPress={() => {
                      Sound.triggerHaptic('light');
                      setSelectedTool(tool);
                    }}
                    style={[
                      styles.toolBtn,
                      isSelected && styles.toolBtnSelected,
                    ]}
                  >
                    <Text
                      style={styles.toolBtnText}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      maxFontSizeMultiplier={1.2}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Theme Selector */}
          <View style={styles.sectionCard}>
            <Text style={styles.label}>{t.builder.selectTheme}:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {(['jungle', 'space', 'ocean', 'city', 'castle'] as ThemeType[]).map((thm) => (
                <Pressable
                  key={thm}
                  onPress={() => {
                    Sound.triggerHaptic('light');
                    setTheme(thm);
                  }}
                  style={[styles.themeChip, theme === thm && styles.themeChipActive]}
                >
                  <Text style={styles.themeChipText}>{t.themes[thm]}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Hero Selector - 3-column × 2-row wrapped grid */}
          <View style={styles.sectionCard}>
            <Text style={styles.label}>{t.builder.selectHero}:</Text>
            <View style={styles.heroesGrid}>
              {(['monkey', 'rocket', 'car', 'unicorn', 'robot', 'ninja'] as HeroType[]).map((hr) => (
                <Pressable
                  key={hr}
                  onPress={() => {
                    Sound.triggerHaptic('light');
                    setHero(hr);
                  }}
                  style={[styles.heroGridCard, hero === hr && styles.heroGridCardActive]}
                >
                  <Text style={styles.heroGridIcon}>{HERO_EMOJIS[hr]}</Text>
                  <Text
                    style={styles.heroGridText}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    maxFontSizeMultiplier={1.2}
                  >
                    {t.heroes[hr]}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Configurable Game Rules */}
          <View style={styles.sectionCard}>
            <Text style={styles.label}>{t.builder.rules}:</Text>

            <View style={styles.ruleItem}>
              <Text style={styles.ruleLabel}>{t.builder.requireStars}</Text>
              <Pressable
                onPress={() => {
                  Sound.triggerHaptic('light');
                  setRequireStars(!requireStars);
                }}
                style={[styles.toggleBtn, requireStars && styles.toggleBtnActive]}
              >
                <Text style={styles.toggleBtnText}>{requireStars ? 'YES / हाँ' : 'NO / नहीं'}</Text>
              </Pressable>
            </View>

            <View style={styles.ruleItem}>
              <Text style={styles.ruleLabel}>{t.builder.livesCount}:</Text>
              <View style={styles.livesSelector}>
                {[1, 2, 3].map((val) => (
                  <Pressable
                    key={val}
                    onPress={() => {
                      Sound.triggerHaptic('light');
                      setLives(val);
                    }}
                    style={[styles.lifeChip, lives === val && styles.lifeChipActive]}
                  >
                    <Text style={styles.lifeChipText}>{val} ❤️</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          <View style={{ height: 80 }} />
        </ScrollView>
      </View>

      {/* Sticky Bottom Action Bar for Quick Play-Testing & Saving */}
      <View style={styles.stickyFooterBar}>
        <Pressable onPress={handleTest} style={styles.stickyTestBtn}>
          <Text
            style={styles.stickyBtnText}
            numberOfLines={1}
            adjustsFontSizeToFit
            maxFontSizeMultiplier={1.2}
          >
            🧪 {t.builder.playTest}
          </Text>
        </Pressable>

        <Pressable onPress={handleSave} style={styles.stickySaveBtn}>
          <Text
            style={styles.stickyBtnText}
            numberOfLines={1}
            adjustsFontSizeToFit
            maxFontSizeMultiplier={1.2}
          >
            💾 {t.builder.saveGame}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#3B82F6',
    borderBottomWidth: 3.5,
    borderBottomColor: '#1D4ED8',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20, // Crisp, large header title in HN/EN
    fontWeight: '900',
    flex: 1,
  },
  closeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bodyLayout: {
    flex: 1,
    flexDirection: 'column',
  },
  bodyLayoutLandscape: {
    flexDirection: 'row',
  },
  boardColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
  },
  boardColumnLandscape: {
    width: '45%',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  optionsColumn: {
    flex: 1,
  },
  optionsColumnLandscape: {
    width: '55%',
  },
  scrollContent: {
    padding: 12,
  },
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 5,
  },
  textInput: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#475569',
    marginBottom: 2,
    textAlign: 'center',
  },
  valBanner: {
    borderRadius: 10,
    padding: 6,
    marginVertical: 4,
    borderWidth: 1.5,
    maxWidth: 360,
  },
  valSuccess: {
    backgroundColor: '#DCFCE7',
    borderColor: '#22C55E',
  },
  valFail: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },
  valText: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  valTextSuccess: {
    color: '#15803D',
  },
  valTextFail: {
    color: '#B91C1C',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  toolsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  paletteHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  clearCanvasBtn: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  clearCanvasBtnText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#991B1B',
  },
  toolBtn: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    minHeight: 40,
    justifyContent: 'center',
  },
  toolBtnSelected: {
    backgroundColor: '#DBEAFE',
    borderColor: '#2563EB',
    borderWidth: 2,
  },
  toolBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
  },
  themeChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    marginRight: 6,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  themeChipActive: {
    backgroundColor: '#FEF08A',
    borderColor: '#CA8A04',
  },
  themeChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  heroesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 6,
  },
  heroGridCard: {
    width: '31%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 7,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    minHeight: 38,
  },
  heroGridCardActive: {
    backgroundColor: '#FED7AA',
    borderColor: '#EA580C',
    borderWidth: 2,
  },
  heroGridIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  heroGridText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  ruleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  ruleLabel: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
  },
  toggleBtnActive: {
    backgroundColor: '#86EFAC',
  },
  toggleBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  livesSelector: {
    flexDirection: 'row',
    gap: 6,
  },
  lifeChip: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  lifeChipActive: {
    backgroundColor: '#FECDD3',
    borderColor: '#E11D48',
  },
  lifeChipText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  stickyFooterBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 2,
    borderTopColor: '#CBD5E1',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: -2 },
  },
  stickyTestBtn: {
    flex: 1,
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    elevation: 2,
  },
  stickySaveBtn: {
    flex: 1.2,
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    elevation: 2,
  },
  stickyBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
});
