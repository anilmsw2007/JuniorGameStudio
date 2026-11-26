import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { ActionType, CodeBlock, Language } from '../types/index';
import { getTranslation } from '../data/translations';
import { Sound } from '../utils/sound';

interface BlockWorkspaceProps {
  blocks: CodeBlock[];
  activeBlockIndex: number | null;
  loopWrapMode: 2 | 3 | null;
  language: Language;
  isRunning: boolean;
  onAddAction: (action: ActionType) => void;
  onToggleLoop: (factor: 2 | 3) => void;
  onUndo: () => void;
  onClear: () => void;
  onHint: () => void;
  onPlay: () => void;
  onStop: () => void;
  onRemoveBlock?: (index: number) => void;
  isFirstLevel?: boolean;
  gameSpeed?: 1 | 2;
  onToggleSpeed?: () => void;
}

export const BlockWorkspace: React.FC<BlockWorkspaceProps> = ({
  blocks,
  activeBlockIndex,
  loopWrapMode,
  language,
  isRunning,
  onAddAction,
  onToggleLoop,
  onUndo,
  onClear,
  onHint,
  onPlay,
  onStop,
  onRemoveBlock,
  isFirstLevel = false,
  gameSpeed = 1,
  onToggleSpeed,
}) => {
  const t = getTranslation(language);
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const getActionLabel = (action: ActionType) => {
    switch (action) {
      case 'MOVE_UP': return { icon: '⬆️', text: t.directionUp, color: '#3B82F6' };
      case 'MOVE_DOWN': return { icon: '⬇️', text: t.directionDown, color: '#10B981' };
      case 'MOVE_LEFT': return { icon: '⬅️', text: t.directionLeft, color: '#F59E0B' };
      case 'MOVE_RIGHT': return { icon: '➡️', text: t.directionRight, color: '#8B5CF6' };
      case 'JUMP': return { icon: '🦘', text: 'Jump', color: '#EC4899' };
    }
  };

  const handleBlockPress = (idx: number) => {
    if (isRunning) return;
    Sound.triggerHaptic('light');
    if (onRemoveBlock) {
      onRemoveBlock(idx);
    }
  };

  // Level 1 tutorial onboarding cues
  const showRightPulseHint = isFirstLevel && blocks.length < 4;
  const showPlayPulseHint = isFirstLevel && blocks.length >= 4 && !isRunning;

  return (
    <View style={[styles.container, isLandscape && styles.containerLandscape]}>
      {/* Loop mode banner */}
      {loopWrapMode && (
        <View style={styles.loopBanner}>
          <Text
            style={styles.loopBannerText}
            numberOfLines={1}
            adjustsFontSizeToFit
            maxFontSizeMultiplier={1.3}
          >
            {t.wrapActivated} ({loopWrapMode}×)
          </Text>
        </View>
      )}

      {/* Program sequence queue */}
      <View style={[styles.sequenceCard, isLandscape && styles.sequenceCardLandscape]}>
        <View style={styles.sequenceHeader}>
          <Text
            style={styles.sequenceTitle}
            numberOfLines={1}
            adjustsFontSizeToFit
            maxFontSizeMultiplier={1.3}
          >
            {t.codeWorkspace} ({blocks.length} {t.blocksCount})
          </Text>
          <View style={styles.headerBtnRow}>
            {/* Speed Toggle: 🐢 1× or ⚡ 2× */}
            {onToggleSpeed && (
              <Pressable
                onPress={() => {
                  Sound.triggerHaptic('light');
                  onToggleSpeed();
                }}
                style={styles.speedBtn}
              >
                <Text style={styles.speedBtnText}>
                  {gameSpeed === 1 ? '🐢 1×' : '⚡ 2×'}
                </Text>
              </Pressable>
            )}

            <Pressable
              disabled={isRunning || blocks.length === 0}
              onPress={onUndo}
              style={({ pressed }) => [
                styles.headerSmallBtn,
                { opacity: isRunning || blocks.length === 0 ? 0.4 : pressed ? 0.7 : 1 },
              ]}
            >
              <Text style={styles.headerSmallBtnText}>{t.undo}</Text>
            </Pressable>
            <Pressable
              disabled={isRunning || blocks.length === 0}
              onPress={onClear}
              style={({ pressed }) => [
                styles.headerSmallBtn,
                styles.clearBtn,
                { opacity: isRunning || blocks.length === 0 ? 0.4 : pressed ? 0.7 : 1 },
              ]}
            >
              <Text style={styles.headerSmallBtnText}>{t.clear}</Text>
            </Pressable>
            <Pressable
              disabled={isRunning}
              onPress={onHint}
              style={({ pressed }) => [
                styles.headerSmallBtn,
                styles.hintBtn,
                { opacity: isRunning ? 0.4 : pressed ? 0.7 : 1 },
              ]}
            >
              <Text style={styles.headerSmallBtnText}>{t.giveHint}</Text>
            </Pressable>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sequenceScroll}
        >
          {blocks.length === 0 ? (
            <View style={styles.emptyQueue}>
              <Text style={styles.emptyQueueText} numberOfLines={1}>
                {isFirstLevel
                  ? (language === 'hi' ? '👉 4 बार दाएँ (➡️) ब्लॉक दबाएं!' : '👉 Tap Move Right (➡️) 4 times!')
                  : (language === 'hi' ? 'ब्लॉक छूकर कोड जोड़ें 👇' : 'Tap blocks below to build code 👇')}
              </Text>
            </View>
          ) : (
            blocks.map((block, idx) => {
              const meta = getActionLabel(block.type);
              const isActive = activeBlockIndex === idx;

              return (
                <Pressable
                  key={block.id}
                  disabled={isRunning}
                  onPress={() => handleBlockPress(idx)}
                  style={({ pressed }) => [
                    styles.queuedBlock,
                    { backgroundColor: meta.color },
                    isActive && styles.activeQueuedBlock,
                    { opacity: pressed ? 0.75 : 1, transform: [{ scale: pressed ? 0.95 : 1 }] },
                  ]}
                >
                  {block.repeat > 1 && (
                    <View style={styles.repeatBadge}>
                      <Text style={styles.repeatBadgeText}>{block.repeat}×</Text>
                    </View>
                  )}
                  <Text style={styles.queuedBlockIcon}>{meta.icon}</Text>
                  <Text
                    style={styles.queuedBlockLabel}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    maxFontSizeMultiplier={1.3}
                  >
                    {meta.text}
                  </Text>
                  {!isRunning && (
                    <View style={styles.deleteMiniBadge}>
                      <Text style={styles.deleteMiniBadgeText}>×</Text>
                    </View>
                  )}
                </Pressable>
              );
            })
          )}
        </ScrollView>
      </View>

      {/* Palette Toolbar: Direction Blocks + JUMP */}
      <View style={styles.paletteRow}>
        {(['MOVE_UP', 'MOVE_DOWN', 'MOVE_LEFT', 'MOVE_RIGHT', 'JUMP'] as ActionType[]).map((act) => {
          const meta = getActionLabel(act);
          const isRightPulse = showRightPulseHint && act === 'MOVE_RIGHT';

          return (
            <Pressable
              key={act}
              disabled={isRunning}
              onPress={() => onAddAction(act)}
              style={({ pressed }) => [
                styles.paletteBtn,
                {
                  backgroundColor: meta.color,
                  opacity: isRunning ? 0.5 : pressed ? 0.8 : 1,
                  transform: [{ scale: pressed ? 0.95 : isRightPulse ? 1.05 : 1 }],
                },
                isRightPulse && styles.pulseHintBtn,
              ]}
            >
              <Text style={styles.paletteIcon}>{meta.icon}</Text>
              <Text
                style={styles.paletteLabel}
                numberOfLines={1}
                adjustsFontSizeToFit
                maxFontSizeMultiplier={1.3}
              >
                {meta.text}
              </Text>
              {isRightPulse && (
                <View style={styles.onboardingFingerPill}>
                  <Text style={styles.onboardingFingerText}>👆</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Loop Wrappers & Main Play Button */}
      <View style={styles.footerRow}>
        <Pressable
          disabled={isRunning}
          onPress={() => onToggleLoop(2)}
          style={({ pressed }) => [
            styles.loopBtn,
            loopWrapMode === 2 && styles.loopBtnActive,
            { opacity: isRunning ? 0.5 : pressed ? 0.8 : 1 },
          ]}
        >
          <Text style={styles.loopBtnIcon}>🔁</Text>
          <Text
            style={styles.loopBtnText}
            numberOfLines={1}
            adjustsFontSizeToFit
            maxFontSizeMultiplier={1.3}
          >
            {t.repeat2x}
          </Text>
        </Pressable>

        <Pressable
          disabled={isRunning}
          onPress={() => onToggleLoop(3)}
          style={({ pressed }) => [
            styles.loopBtn,
            loopWrapMode === 3 && styles.loopBtnActive,
            { opacity: isRunning ? 0.5 : pressed ? 0.8 : 1 },
          ]}
        >
          <Text style={styles.loopBtnIcon}>🔂</Text>
          <Text
            style={styles.loopBtnText}
            numberOfLines={1}
            adjustsFontSizeToFit
            maxFontSizeMultiplier={1.3}
          >
            {t.repeat3x}
          </Text>
        </Pressable>

        {/* Big Action Button (RUN / STOP) */}
        <Pressable
          onPress={isRunning ? onStop : onPlay}
          style={({ pressed }) => [
            styles.playButton,
            isRunning ? styles.stopButton : null,
            showPlayPulseHint && styles.pulsePlayBtn,
            { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
          ]}
        >
          <Text style={styles.playButtonIcon}>{isRunning ? '⏹️' : '▶️'}</Text>
          <Text
            style={styles.playButtonText}
            numberOfLines={1}
            adjustsFontSizeToFit
            maxFontSizeMultiplier={1.3}
          >
            {isRunning ? t.stop : t.play}
          </Text>
          {showPlayPulseHint && (
            <View style={styles.playFingerPill}>
              <Text style={styles.onboardingFingerText}>👆</Text>
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    width: '100%',
    maxWidth: 550,
    alignSelf: 'center',
  },
  containerLandscape: {
    maxWidth: '100%',
    paddingVertical: 2,
    justifyContent: 'center',
  },
  loopBanner: {
    backgroundColor: '#FEF08A',
    borderColor: '#EAB308',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 6,
    alignItems: 'center',
  },
  loopBannerText: {
    color: '#854D0E',
    fontSize: 13, // Enlarged from 11
    fontWeight: 'bold',
  },
  sequenceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    padding: 10,
    marginBottom: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  sequenceCardLandscape: {
    padding: 8,
    marginBottom: 6,
  },
  sequenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sequenceTitle: {
    fontSize: 14, // Enlarged from 12
    fontWeight: 'bold',
    color: '#1E293B',
    flex: 1,
  },
  headerBtnRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  speedBtn: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    minHeight: 30, // Enlarged
    justifyContent: 'center',
    alignItems: 'center',
  },
  speedBtnText: {
    fontSize: 12, // Enlarged from 10
    fontWeight: '900',
    color: '#1D4ED8',
  },
  headerSmallBtn: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    minHeight: 30, // Enlarged from 26
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearBtn: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  hintBtn: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
  },
  headerSmallBtnText: {
    fontSize: 12, // Enlarged from 10
    fontWeight: 'bold',
    color: '#1E293B',
  },
  sequenceScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52, // Enlarged from 46
    paddingVertical: 2,
  },
  emptyQueue: {
    paddingHorizontal: 8,
  },
  emptyQueueText: {
    fontSize: 13, // Enlarged from 11
    color: '#475569',
    fontWeight: '700',
  },
  queuedBlock: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 54, // Enlarged from 48
    minHeight: 50, // Enlarged from 44
    position: 'relative',
    elevation: 3,
  },
  activeQueuedBlock: {
    borderWidth: 3,
    borderColor: '#FACC15',
    transform: [{ scale: 1.1 }],
    elevation: 6,
  },
  repeatBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    zIndex: 2,
  },
  repeatBadgeText: {
    color: '#FFFFFF',
    fontSize: 11, // Enlarged from 9
    fontWeight: '900',
  },
  deleteMiniBadge: {
    position: 'absolute',
    top: -4,
    left: -4,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 10,
    width: 18, // Enlarged from 14
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    zIndex: 2,
  },
  deleteMiniBadgeText: {
    color: '#FFFFFF',
    fontSize: 12, // Enlarged from 9
    fontWeight: '900',
    lineHeight: 12,
  },
  queuedBlockIcon: {
    fontSize: 18, // Enlarged from 14
  },
  queuedBlockLabel: {
    color: '#FFFFFF',
    fontSize: 11, // Enlarged from 9
    fontWeight: 'bold',
  },
  paletteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 6,
  },
  paletteBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56, // Large touch target for kids
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    position: 'relative',
  },
  pulseHintBtn: {
    borderColor: '#FEF08A',
    borderWidth: 3.5,
    elevation: 9,
  },
  onboardingFingerPill: {
    position: 'absolute',
    top: -14,
    right: -2,
    zIndex: 5,
  },
  playFingerPill: {
    position: 'absolute',
    top: -14,
    right: 6,
    zIndex: 5,
  },
  onboardingFingerText: {
    fontSize: 20, // Enlarged from 16
  },
  paletteIcon: {
    fontSize: 20, // Enlarged from 16
    marginBottom: 2,
  },
  paletteLabel: {
    color: '#FFFFFF',
    fontSize: 11, // Enlarged from 9
    fontWeight: '800',
  },
  footerRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  loopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 9,
    minHeight: 50, // Enlarged from 46
    justifyContent: 'center',
  },
  loopBtnActive: {
    backgroundColor: '#FEF08A',
    borderColor: '#CA8A04',
    borderWidth: 2.5,
  },
  loopBtnIcon: {
    fontSize: 18, // Enlarged from 14
    marginRight: 4,
  },
  loopBtnText: {
    fontSize: 12, // Enlarged from 10
    fontWeight: 'bold',
    color: '#1E293B',
  },
  playButton: {
    flex: 1.5,
    flexDirection: 'row',
    backgroundColor: '#22C55E',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    elevation: 5,
    shadowColor: '#16A34A',
    shadowOpacity: 0.35,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    position: 'relative',
  },
  pulsePlayBtn: {
    borderColor: '#FEF08A',
    borderWidth: 3.5,
    elevation: 9,
  },
  stopButton: {
    backgroundColor: '#EF4444',
    shadowColor: '#DC2626',
  },
  playButtonIcon: {
    fontSize: 22, // Enlarged from 18
    marginRight: 6,
  },
  playButtonText: {
    color: '#FFFFFF',
    fontSize: 15, // Enlarged from 13
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
