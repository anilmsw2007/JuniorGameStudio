import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  useWindowDimensions,
} from 'react-native';
import {
  LevelConfig,
  SimulationState,
  CodeBlock,
  ActionType,
  Language,
  Position,
  Direction,
} from '../types/index';
import { getTranslation } from '../data/translations';
import { GameGrid } from '../components/GameGrid';
import { BlockWorkspace } from '../components/BlockWorkspace';
import { Sound } from '../utils/sound';

interface GamePlayerProps {
  level: LevelConfig;
  language: Language;
  onVictory: (starsEarned: number, usedBlocks: number) => void;
  onNextLevel?: () => void;
  onBackToMenu: () => void;
  hasNextLevel: boolean;
}

export const GamePlayer: React.FC<GamePlayerProps> = ({
  level,
  language,
  onVictory,
  onNextLevel,
  onBackToMenu,
  hasNextLevel,
}) => {
  const t = getTranslation(language);
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const [blocks, setBlocks] = useState<CodeBlock[]>([]);
  const [activeBlockIndex, setActiveBlockIndex] = useState<number | null>(null);
  const [loopWrapMode, setLoopWrapMode] = useState<2 | 3 | null>(null);
  const [gameSpeed, setGameSpeed] = useState<1 | 2>(1);
  const [isHeroDizzy, setIsHeroDizzy] = useState(false);

  const [sim, setSim] = useState<SimulationState>(() => ({
    heroPos: { ...level.startPos },
    heroDir: level.initialDirection,
    board: level.board.map((row) => [...row]),
    collectedStars: 0,
    totalStars: level.board.flat().filter((cell) => cell === 'STAR').length,
    hasKey: false,
    isDoorOpen: false,
    remainingLives: level.lives,
    score: 0,
    visitedPositions: [{ ...level.startPos }],
    status: 'idle',
  }));

  const [victoryModalVisible, setVictoryModalVisible] = useState(false);
  const [earnedStarsCount, setEarnedStarsCount] = useState(1);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'info' | 'success' | 'error' | 'warning' } | null>(null);

  const isRunningRef = useRef(false);

  const levelHasHazards = level.board.flat().some((cell) => cell === 'HAZARD');
  const hasJumpBlock = blocks.some((b) => b.type === 'JUMP');
  const showJumpPreview = levelHasHazards || hasJumpBlock;
  const isFirstLevel = level.id === 'story_1';

  const speakCurrentMission = () => {
    const missionText = language === 'hi' ? level.missionHi : level.missionEn;
    Sound.speakText(missionText, language);
  };

  useEffect(() => {
    resetSimulation();
    setBlocks([]);
    setIsHeroDizzy(false);
    speakCurrentMission();

    return () => {
      isRunningRef.current = false;
      Sound.stopSpeech();
    };
  }, [level, language]);

  const showToast = (text: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 2400);
  };

  const resetSimulation = () => {
    isRunningRef.current = false;
    setActiveBlockIndex(null);
    setToastMessage(null);
    setIsHeroDizzy(false);
    setSim({
      heroPos: { ...level.startPos },
      heroDir: level.initialDirection,
      board: level.board.map((row) => [...row]),
      collectedStars: 0,
      totalStars: level.board.flat().filter((cell) => cell === 'STAR').length,
      hasKey: false,
      isDoorOpen: false,
      remainingLives: level.lives,
      score: 0,
      visitedPositions: [{ ...level.startPos }],
      status: 'idle',
    });
  };

  const handleAddAction = (action: ActionType) => {
    if (sim.status === 'running') return;
    Sound.playStep();
    const newBlock: CodeBlock = {
      id: `block_${Date.now()}_${Math.random()}`,
      type: action,
      repeat: loopWrapMode || 1,
    };
    setBlocks([...blocks, newBlock]);
    setLoopWrapMode(null);
  };

  const handleToggleLoop = (factor: 2 | 3) => {
    Sound.playStep();
    setLoopWrapMode(loopWrapMode === factor ? null : factor);
  };

  const handleUndo = () => {
    if (blocks.length > 0) {
      Sound.playStep();
      setBlocks(blocks.slice(0, -1));
    }
  };

  const handleRemoveBlock = (idx: number) => {
    const newBlocks = blocks.filter((_, i) => i !== idx);
    setBlocks(newBlocks);
  };

  const handleClear = () => {
    Sound.triggerHaptic('medium');
    setBlocks([]);
    resetSimulation();
  };

  const handleHint = () => {
    const hintText = language === 'hi' ? level.hintHi : level.hintEn;
    showToast(`💡 ${hintText}`, 'info');
    Sound.speakText(hintText, language);
  };

  const handleToggleSpeed = () => {
    setGameSpeed(gameSpeed === 1 ? 2 : 1);
  };

  const triggerDizzyFeedback = () => {
    setIsHeroDizzy(true);
    setTimeout(() => setIsHeroDizzy(false), 900);
  };

  const handleRunCode = async () => {
    if (blocks.length === 0) {
      showToast(t.noBlocks, 'error');
      Sound.playBump();
      return;
    }

    resetSimulation();
    isRunningRef.current = true;
    setSim((prev) => ({ ...prev, status: 'running' }));
    Sound.triggerHaptic('medium');

    interface FlatStep {
      action: ActionType;
      blockIndex: number;
    }
    const flatSteps: FlatStep[] = [];
    blocks.forEach((b, idx) => {
      for (let r = 0; r < b.repeat; r++) {
        flatSteps.push({ action: b.type, blockIndex: idx });
      }
    });

    let currentHeroPos = { ...level.startPos };
    let currentHeroDir = level.initialDirection;
    let currentBoard = level.board.map((row) => [...row]);
    let currentStars = 0;
    const totalStars = currentBoard.flat().filter((c) => c === 'STAR').length;
    let currentHasKey = false;
    let currentDoorOpen = false;
    let currentLives = level.lives;
    let currentVisited: Position[] = [{ ...level.startPos }];

    const stepDelay = gameSpeed === 2 ? 220 : 450;

    for (let i = 0; i < flatSteps.length; i++) {
      if (!isRunningRef.current) break;

      const step = flatSteps[i];
      setActiveBlockIndex(step.blockIndex);

      let dr = 0;
      let dc = 0;
      let isJump = false;

      if (step.action === 'MOVE_UP') {
        currentHeroDir = 'UP';
        dr = -1;
      } else if (step.action === 'MOVE_DOWN') {
        currentHeroDir = 'DOWN';
        dr = 1;
      } else if (step.action === 'MOVE_LEFT') {
        currentHeroDir = 'LEFT';
        dc = -1;
      } else if (step.action === 'MOVE_RIGHT') {
        currentHeroDir = 'RIGHT';
        dc = 1;
      } else if (step.action === 'JUMP') {
        isJump = true;
        if (currentHeroDir === 'UP') dr = -2;
        else if (currentHeroDir === 'DOWN') dr = 2;
        else if (currentHeroDir === 'LEFT') dc = -2;
        else if (currentHeroDir === 'RIGHT') dc = 2;
      }

      const targetRow = currentHeroPos.row + dr;
      const targetCol = currentHeroPos.col + dc;

      // 1. Out-of-bounds check
      if (
        targetRow < 0 ||
        targetRow >= level.gridSize ||
        targetCol < 0 ||
        targetCol >= level.gridSize
      ) {
        Sound.playBump();
        triggerDizzyFeedback();
        showToast(language === 'hi' ? '🛑 सीमा से बाहर नहीं जा सकते!' : '🛑 Out of bounds!', 'error');
        currentLives -= 1;
        if (currentLives <= 0) {
          endGameLost(t.outOfBounds, currentHeroPos, currentHeroDir, currentBoard, currentStars, currentLives, currentVisited);
          return;
        }
        await sleep(stepDelay);
        continue;
      }

      const targetTile = currentBoard[targetRow][targetCol];

      // 2. Wall obstacle check
      if (targetTile === 'WALL') {
        Sound.playBump();
        triggerDizzyFeedback();
        showToast(language === 'hi' ? '🚫 आगे दीवार है!' : '🚫 Blocked by Wall!', 'error');
        await sleep(stepDelay);
        continue;
      }

      // 3. Locked door check
      if (targetTile === 'DOOR' && !currentHasKey) {
        Sound.playBump();
        triggerDizzyFeedback();
        showToast(t.doorLocked, 'error');
        await sleep(stepDelay);
        continue;
      }

      // 4. Hazard landing collision check
      if (targetTile === 'HAZARD') {
        Sound.playBump();
        triggerDizzyFeedback();
        showToast(language === 'hi' ? '🔥 खतरे से टकरा गए!' : '🔥 Hazard Hit!', 'error');
        currentLives -= 1;
        if (currentLives <= 0) {
          endGameLost(t.hitHazard, currentHeroPos, currentHeroDir, currentBoard, currentStars, currentLives, currentVisited);
          return;
        }
        await sleep(stepDelay);
        continue;
      }

      currentHeroPos = { row: targetRow, col: targetCol };
      currentVisited.push({ ...currentHeroPos });

      if (isJump) {
        Sound.playJump();
      } else {
        Sound.playStep();
      }

      if (targetTile === 'KEY') {
        currentHasKey = true;
        currentDoorOpen = true;
        currentBoard[targetRow][targetCol] = 'EMPTY';
        currentBoard = currentBoard.map((row) =>
          row.map((cell) => (cell === 'DOOR' ? 'EMPTY' : cell))
        );
        Sound.playKeyPickup();
        showToast(language === 'hi' ? '🔑 चाबी मिल गई! दरवाज़ा खुला 🔓' : '🔑 Key Picked Up! Door Unlocked 🔓', 'success');
      } else if (targetTile === 'STAR') {
        currentStars += 1;
        currentBoard[targetRow][targetCol] = 'EMPTY';
        Sound.playStarCollect();
        showToast(language === 'hi' ? '⭐ सितारा मिला!' : '⭐ Star Collected!', 'success');
      }

      setSim({
        heroPos: { ...currentHeroPos },
        heroDir: currentHeroDir,
        board: currentBoard.map((row) => [...row]),
        collectedStars: currentStars,
        totalStars,
        hasKey: currentHasKey,
        isDoorOpen: currentDoorOpen,
        remainingLives: currentLives,
        score: currentStars * level.pointsPerStar,
        visitedPositions: [...currentVisited],
        status: 'running',
      });

      if (targetTile === 'GOAL') {
        if (level.requireAllStars && currentStars < totalStars) {
          showToast(language === 'hi' ? 'सभी सितारे इकट्ठा करने जरूरी हैं!' : 'You must collect all stars first!', 'warning');
        } else {
          endGameWon(blocks.length, currentStars, currentLives);
          return;
        }
      }

      await sleep(stepDelay);
    }

    if (isRunningRef.current) {
      isRunningRef.current = false;
      setActiveBlockIndex(null);
      setSim((prev) => ({ ...prev, status: 'idle' }));
    }
  };

  const endGameWon = (blockCount: number, starsEarned: number, remainingLives: number) => {
    isRunningRef.current = false;
    setActiveBlockIndex(null);
    Sound.playVictory();

    let starCount = 1;
    if (blockCount <= level.maxBlocksTarget) {
      starCount = 3;
    } else if (blockCount <= level.maxBlocksTarget + 2) {
      starCount = 2;
    }

    setEarnedStarsCount(starCount);
    setVictoryModalVisible(true);
    setSim((prev) => ({ ...prev, status: 'won' }));
    onVictory(starCount, blockCount);
  };

  const endGameLost = (
    reason: string,
    pos: Position,
    dir: Direction,
    board: any,
    stars: number,
    lives: number,
    visited: Position[]
  ) => {
    isRunningRef.current = false;
    setActiveBlockIndex(null);
    setSim({
      heroPos: pos,
      heroDir: dir,
      board,
      collectedStars: stars,
      totalStars: level.board.flat().filter((c) => c === 'STAR').length,
      hasKey: false,
      isDoorOpen: false,
      remainingLives: lives,
      score: 0,
      visitedPositions: visited,
      status: 'lost',
      failReason: reason,
    });
  };

  const handleStop = () => {
    Sound.triggerHaptic('medium');
    isRunningRef.current = false;
    setActiveBlockIndex(null);
    setSim((prev) => ({ ...prev, status: 'idle' }));
  };

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  return (
    <View style={styles.container}>
      {/* Top mission & level stats bar */}
      <View style={styles.topBar}>
        <Pressable onPress={onBackToMenu} style={styles.backBtn}>
          <Text style={styles.backBtnText}>◀ {language === 'hi' ? 'मेन्यू' : 'Menu'}</Text>
        </Pressable>

        <Pressable onPress={speakCurrentMission} style={styles.levelInfo}>
          <Text style={styles.levelTitle}>
            {language === 'hi' ? level.titleHi : level.titleEn}
          </Text>
          <Text style={styles.missionText}>
            {language === 'hi' ? level.missionHi : level.missionEn} 🔊
          </Text>
        </Pressable>

        <View style={styles.statsCol}>
          <Text style={styles.statPill}>⭐ {sim.collectedStars}/{sim.totalStars}</Text>
          <Text style={styles.statPill}>❤️ {sim.remainingLives}</Text>
        </View>
      </View>

      {/* Floating Animated Toast Banner */}
      {toastMessage && (
        <View
          style={[
            styles.toastBanner,
            toastMessage.type === 'success' && styles.toastSuccess,
            toastMessage.type === 'error' && styles.toastError,
            toastMessage.type === 'info' && styles.toastInfo,
            toastMessage.type === 'warning' && styles.toastWarning,
          ]}
        >
          <Text
            style={styles.toastBannerText}
            numberOfLines={1}
            adjustsFontSizeToFit
            maxFontSizeMultiplier={1.2}
          >
            {toastMessage.text}
          </Text>
        </View>
      )}

      {/* Main Gameplay Container */}
      <View style={[styles.mainLayout, isLandscape && styles.mainLayoutLandscape]}>
        <View style={[styles.gridSection, isLandscape && styles.gridSectionLandscape]}>
          <GameGrid
            board={sim.board}
            heroPos={sim.heroPos}
            heroDir={sim.heroDir}
            theme={level.theme}
            hero={level.hero}
            visitedPositions={sim.visitedPositions}
            showJumpPreview={showJumpPreview}
            isHeroDizzy={isHeroDizzy}
          />
        </View>

        <View style={[styles.workspaceSection, isLandscape && styles.workspaceSectionLandscape]}>
          <BlockWorkspace
            blocks={blocks}
            activeBlockIndex={activeBlockIndex}
            loopWrapMode={loopWrapMode}
            language={language}
            isRunning={sim.status === 'running'}
            onAddAction={handleAddAction}
            onToggleLoop={handleToggleLoop}
            onUndo={handleUndo}
            onClear={handleClear}
            onHint={handleHint}
            onPlay={handleRunCode}
            onStop={handleStop}
            onRemoveBlock={handleRemoveBlock}
            isFirstLevel={isFirstLevel}
            gameSpeed={gameSpeed}
            onToggleSpeed={handleToggleSpeed}
          />
        </View>
      </View>

      {/* Victory Celebration Modal with floating celebratory confetti */}
      <Modal
        visible={victoryModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setVictoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Visual celebration confetti emojis */}
            <View style={styles.confettiRow}>
              <Text style={styles.confettiParticle}>✨</Text>
              <Text style={styles.confettiParticle}>🎉</Text>
              <Text style={styles.confettiParticle}>🎊</Text>
              <Text style={styles.confettiParticle}>✨</Text>
            </View>

            <Text style={styles.victoryEmoji}>🏆</Text>
            <Text
              style={styles.victoryTitle}
              numberOfLines={1}
              adjustsFontSizeToFit
              maxFontSizeMultiplier={1.2}
            >
              {t.victory}
            </Text>

            <View style={styles.starsRow}>
              {[1, 2, 3].map((s) => (
                <Text
                  key={s}
                  style={[
                    styles.starIcon,
                    s <= earnedStarsCount ? styles.starEarned : styles.starUnearned,
                  ]}
                >
                  ⭐
                </Text>
              ))}
            </View>

            <Text style={styles.victorySubtext}>
              {language === 'hi'
                ? `बहुत बढ़िया! आपने ${blocks.length} ब्लॉक्स में स्तर पूरा किया।`
                : `Awesome! You cleared the level using ${blocks.length} code blocks.`}
            </Text>

            <View style={styles.modalBtnRow}>
              <Pressable
                onPress={() => {
                  setVictoryModalVisible(false);
                  resetSimulation();
                }}
                style={styles.retryBtn}
              >
                <Text style={styles.modalBtnText}>{t.retry}</Text>
              </Pressable>

              {hasNextLevel && onNextLevel ? (
                <Pressable
                  onPress={() => {
                    setVictoryModalVisible(false);
                    onNextLevel();
                  }}
                  style={styles.nextLevelBtn}
                >
                  <Text style={styles.modalBtnText}>{t.nextLevel}</Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => {
                    setVictoryModalVisible(false);
                    onBackToMenu();
                  }}
                  style={styles.nextLevelBtn}
                >
                  <Text style={styles.modalBtnText}>
                    {language === 'hi' ? 'मुख्य मेन्यू 🏠' : 'Main Menu 🏠'}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 2.5,
    borderBottomColor: '#CBD5E1',
    elevation: 3,
  },
  backBtn: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  backBtnText: {
    fontSize: 15, // Large, crisp back button
    fontWeight: '900',
    color: '#0F172A',
  },
  levelInfo: {
    flex: 1,
    marginHorizontal: 12,
  },
  levelTitle: {
    fontSize: 18, // Large bold level title
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 2,
  },
  missionText: {
    fontSize: 14.5, // High legibility mission prompt for kids in HN/EN
    color: '#1E293B',
    fontWeight: '700',
    lineHeight: 18,
  },
  statsCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  statPill: {
    fontSize: 14, // Large bold pill for stars & hearts
    fontWeight: '900',
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  toastBanner: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1.5,
  },
  toastInfo: {
    backgroundColor: '#FEF3C7',
    borderBottomColor: '#FCD34D',
  },
  toastWarning: {
    backgroundColor: '#FFEDD5',
    borderBottomColor: '#FB923C',
  },
  toastSuccess: {
    backgroundColor: '#DCFCE7',
    borderBottomColor: '#86EFAC',
  },
  toastError: {
    backgroundColor: '#FEE2E2',
    borderBottomColor: '#FCA5A5',
  },
  toastBannerText: {
    fontSize: 14, // Enlarged from 12
    fontWeight: '900',
    color: '#1E293B',
    textAlign: 'center',
  },
  mainLayout: {
    flex: 1,
    flexDirection: 'column',
  },
  mainLayoutLandscape: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  gridSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  gridSectionLandscape: {
    width: '45%',
    paddingVertical: 0,
    justifyContent: 'center',
  },
  workspaceSection: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  workspaceSectionLandscape: {
    width: '55%',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    elevation: 10,
    position: 'relative',
  },
  confettiRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 6,
  },
  confettiParticle: {
    fontSize: 26,
  },
  victoryEmoji: {
    fontSize: 54,
    marginBottom: 8,
  },
  victoryTitle: {
    fontSize: 24, // Enlarged from 20
    fontWeight: '900',
    color: '#15803D',
    marginBottom: 10,
    textAlign: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  starIcon: {
    fontSize: 38, // Enlarged from 32
  },
  starEarned: {
    opacity: 1,
  },
  starUnearned: {
    opacity: 0.25,
  },
  victorySubtext: {
    fontSize: 15, // Enlarged from 13
    color: '#334155',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '700',
    lineHeight: 20,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  retryBtn: {
    flex: 1,
    backgroundColor: '#94A3B8',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  nextLevelBtn: {
    flex: 1.5,
    backgroundColor: '#22C55E',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalBtnText: {
    color: '#FFFFFF',
    fontSize: 15, // Enlarged from 13
    fontWeight: '900',
  },
});
