import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  StatusBar as RNStatusBar,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Language, UserProgress } from '../types/index';
import { getTranslation } from '../data/translations';
import { Sound } from '../utils/sound';

interface HeaderProps {
  progress: UserProgress;
  language: Language;
  onToggleLanguage: () => void;
  onToggleSound: () => void;
  onToggleVoice: () => void;
  onToggleMusic: () => void;
  onSpeakActiveMission?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  progress,
  language,
  onToggleLanguage,
  onToggleSound,
  onToggleVoice,
  onToggleMusic,
  onSpeakActiveMission,
}) => {
  const t = getTranslation(language);
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const getBadgeTitle = () => {
    return t.badges[progress.badge] || t.badges.junior;
  };

  const handleSpeakerPress = () => {
    Sound.triggerHaptic('light');
    if (onSpeakActiveMission) {
      onSpeakActiveMission();
    } else {
      onToggleVoice();
    }
  };

  const computedTopPadding = isLandscape
    ? Math.max(insets.top, 8)
    : Platform.OS === 'android'
    ? Math.max(RNStatusBar.currentHeight || 28, insets.top) + 8
    : Math.max(insets.top, 14);

  return (
    <View
      style={[
        styles.header,
        {
          paddingTop: computedTopPadding,
          paddingLeft: Math.max(insets.left, 12),
          paddingRight: Math.max(insets.right, 12),
        },
      ]}
    >
      {/* Line 1: Clear, Bold Branding & Badge */}
      <View style={styles.topRow}>
        <View style={styles.brandContainer}>
          <Text
            style={styles.logoTitle}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            🎮 {t.appTitle}
          </Text>
          <View style={styles.badgePill}>
            <Text
              style={styles.badgeText}
              numberOfLines={1}
            >
              {getBadgeTitle()}
            </Text>
          </View>
        </View>

        {/* Global Controls & Status */}
        <View style={styles.controlsRow}>
          {/* Star total */}
          <View style={styles.starPill}>
            <Text style={styles.starPillText}>⭐ {progress.totalStars}</Text>
          </View>

          {/* Background Melody toggle */}
          <Pressable
            onPress={() => {
              Sound.triggerHaptic('light');
              onToggleMusic();
            }}
            style={({ pressed }) => [
              styles.iconBtn,
              !progress.musicEnabled && styles.iconBtnDisabled,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text style={styles.iconBtnText}>
              {progress.musicEnabled ? '🎵' : '🔇'}
            </Text>
          </Pressable>

          {/* Voice Narrator */}
          <Pressable
            onPress={handleSpeakerPress}
            style={({ pressed }) => [
              styles.iconBtn,
              !progress.voiceEnabled && styles.iconBtnDisabled,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text style={styles.iconBtnText}>
              {progress.voiceEnabled ? '🔊' : '🔇'}
            </Text>
          </Pressable>

          {/* SFX toggle */}
          <Pressable
            onPress={() => {
              Sound.triggerHaptic('light');
              onToggleSound();
            }}
            style={({ pressed }) => [
              styles.iconBtn,
              !progress.soundEnabled && styles.iconBtnDisabled,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text style={styles.iconBtnText}>
              {progress.soundEnabled ? '🔔' : '🔕'}
            </Text>
          </Pressable>

          {/* Language Switcher */}
          <Pressable
            onPress={() => {
              Sound.triggerHaptic('medium');
              onToggleLanguage();
            }}
            style={({ pressed }) => [
              styles.langBtn,
              { opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Text style={styles.langBtnText}>
              {language === 'en' ? '🇮🇳 हिंदी' : '🇬🇧 EN'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#2563EB',
    paddingBottom: 10,
    borderBottomWidth: 3.5,
    borderBottomColor: '#1D4ED8',
    elevation: 8,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'nowrap',
    gap: 10,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  logoTitle: {
    fontSize: 20, // Crisp, large, perfectly readable title
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.3,
    flexShrink: 1,
  },
  badgePill: {
    backgroundColor: '#FEF08A',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1.5,
    borderColor: '#EAB308',
  },
  badgeText: {
    fontSize: 13, // Large readable badge in Hindi & English
    fontWeight: '900',
    color: '#854D0E',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  starPill: {
    backgroundColor: '#FEF9C3',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1.5,
    borderColor: '#FACC15',
  },
  starPillText: {
    fontSize: 14, // Clearly visible stars count
    fontWeight: '900',
    color: '#A16207',
  },
  iconBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 12,
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBtnDisabled: {
    opacity: 0.45,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  iconBtnText: {
    fontSize: 19,
  },
  langBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    elevation: 3,
  },
  langBtnText: {
    fontSize: 14, // Large bilingual switch pill
    fontWeight: '900',
    color: '#1D4ED8',
  },
});
