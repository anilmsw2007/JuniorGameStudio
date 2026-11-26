import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { Language } from '../types/index';

class SoundEffects {
  private isSoundEnabled = true;
  private isVoiceEnabled = true;
  private isMusicEnabled = false;
  private audioCtx: any = null;
  private melodyInterval: any = null;

  constructor() {
    this.initWebAudio();
  }

  private initWebAudio() {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
          this.audioCtx = new AudioContext();
        }
      }
    } catch {
      // AudioContext unavailable
    }
  }

  public setSoundEnabled(enabled: boolean) {
    this.isSoundEnabled = enabled;
  }

  public setVoiceEnabled(enabled: boolean) {
    this.isVoiceEnabled = enabled;
  }

  public setMusicEnabled(enabled: boolean) {
    this.isMusicEnabled = enabled;
    if (enabled) {
      this.startMelody();
    } else {
      this.stopMelody();
    }
  }

  public getSoundEnabled() {
    return this.isSoundEnabled;
  }

  public getVoiceEnabled() {
    return this.isVoiceEnabled;
  }

  public getMusicEnabled() {
    return this.isMusicEnabled;
  }

  /**
   * Background Chiptune Melody for Kids
   */
  public startMelody() {
    if (!this.isMusicEnabled || this.melodyInterval || !this.audioCtx) return;
    const melodyNotes = [
      261.63, 329.63, 392.00, 523.25, // C4, E4, G4, C5
      392.00, 329.63, 440.00, 349.23, // G4, E4, A4, F4
      392.00, 329.63, 293.66, 261.63, // G4, E4, D4, C4
    ];
    let noteIdx = 0;
    this.melodyInterval = setInterval(() => {
      if (!this.isMusicEnabled) {
        this.stopMelody();
        return;
      }
      const freq = melodyNotes[noteIdx % melodyNotes.length];
      this.playTone(freq, 0.25, 'triangle', 0.04); // Gentle soothing volume
      noteIdx++;
    }, 600);
  }

  public stopMelody() {
    if (this.melodyInterval) {
      clearInterval(this.melodyInterval);
      this.melodyInterval = null;
    }
  }

  /**
   * Haptic Feedback Helper
   */
  public triggerHaptic(type: 'light' | 'medium' | 'success' | 'warning' | 'error') {
    try {
      if (type === 'light') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else if (type === 'medium') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else if (type === 'success') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (type === 'warning') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } else if (type === 'error') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch {
      // Haptics safe fallback
    }
  }

  /**
   * Generates procedural synth chimes for SFX
   */
  private playTone(freq: number, durationSec: number, type: 'sine' | 'triangle' | 'square' = 'sine', volume = 0.15) {
    if (!this.isSoundEnabled || !this.audioCtx) return;
    try {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

      gain.gain.setValueAtTime(volume, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + durationSec);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + durationSec);
    } catch {
      // audio error safe fallback
    }
  }

  public playStep() {
    this.triggerHaptic('light');
    this.playTone(440, 0.08, 'triangle');
  }

  public playJump() {
    this.triggerHaptic('medium');
    if (!this.isSoundEnabled || !this.audioCtx) return;
    try {
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(750, this.audioCtx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.2);
    } catch {}
  }

  public playStarCollect() {
    this.triggerHaptic('success');
    if (!this.isSoundEnabled) return;
    setTimeout(() => this.playTone(523.25, 0.1, 'sine'), 0);   // C5
    setTimeout(() => this.playTone(659.25, 0.1, 'sine'), 80);  // E5
    setTimeout(() => this.playTone(783.99, 0.18, 'sine'), 160); // G5
  }

  public playKeyPickup() {
    this.triggerHaptic('success');
    if (!this.isSoundEnabled) return;
    setTimeout(() => this.playTone(587.33, 0.08, 'square'), 0);  // D5
    setTimeout(() => this.playTone(880.00, 0.15, 'square'), 90);  // A5
  }

  public playDoorUnlock() {
    this.triggerHaptic('success');
    if (!this.isSoundEnabled) return;
    setTimeout(() => this.playTone(392.00, 0.1, 'sine'), 0);   // G4
    setTimeout(() => this.playTone(523.25, 0.1, 'sine'), 100); // C5
    setTimeout(() => this.playTone(659.25, 0.2, 'sine'), 200); // E5
  }

  public playBump() {
    this.triggerHaptic('error');
    this.playTone(180, 0.2, 'square');
  }

  public playVictory() {
    this.triggerHaptic('success');
    if (!this.isSoundEnabled) return;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 fanfare
    notes.forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 0.22, 'triangle'), idx * 140);
    });
  }

  /**
   * Bilingual Text-To-Speech Mission Narration
   */
  public async speakText(text: string, language: Language) {
    if (!this.isVoiceEnabled) return;
    try {
      await Speech.stop();
      const locale = language === 'hi' ? 'hi-IN' : 'en-US';
      Speech.speak(text, {
        language: locale,
        pitch: 1.1,
        rate: 0.9,
      });
    } catch {
      // speech fallback
    }
  }

  public stopSpeech() {
    try {
      Speech.stop();
    } catch {}
  }
}

export const Sound = new SoundEffects();
