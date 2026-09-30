/**
 * Tactical Audio & Voice Dispatch Service
 * Uses Web Audio API for synthetic tactical chimes and Web Speech API for voice readouts.
 * 100% offline, requires no external audio asset downloads.
 */

class TacticalAudioService {
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    try {
      const saved = localStorage.getItem('crisis_command_audio_muted');
      this.isMuted = saved === 'true';
    } catch {
      this.isMuted = false;
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    try {
      localStorage.setItem('crisis_command_audio_muted', String(muted));
    } catch {
      // ignore
    }
    if (muted && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  /**
   * Dual-tone tactical dispatch chime (High -> Medium -> High alert beep)
   */
  public playDispatchChime() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      // Pitch sequence: 880Hz (A5) -> 1320Hz (E6)
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.exponentialRampToValueAtTime(1320, now + 0.12);

      osc2.frequency.setValueAtTime(440, now);
      osc2.frequency.exponentialRampToValueAtTime(660, now + 0.12);

      gainNode.gain.setValueAtTime(0.001, now);
      gainNode.gain.linearRampToValueAtTime(0.25, now + 0.03);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.36);
      osc2.stop(now + 0.36);
    } catch (e) {
      console.warn('Audio chime failed:', e);
    }
  }

  /**
   * Staccato siren alert for critical incidents and scrambles
   */
  public playWarningSiren() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      for (let i = 0; i < 3; i++) {
        const start = now + i * 0.18;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(750, start);
        osc.frequency.exponentialRampToValueAtTime(1200, start + 0.12);

        gain.gain.setValueAtTime(0.001, start);
        gain.gain.linearRampToValueAtTime(0.18, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.16);
      }
    } catch (e) {
      console.warn('Warning siren failed:', e);
    }
  }

  /**
   * Tactical voice announcement via browser SpeechSynthesis
   */
  public speak(text: string, priority: 'normal' | 'urgent' = 'normal') {
    if (this.isMuted) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      // Play brief alert chime first
      if (priority === 'urgent') {
        this.playWarningSiren();
      } else {
        this.playDispatchChime();
      }

      window.speechSynthesis.cancel(); // cancel ongoing speech

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = priority === 'urgent' ? 1.08 : 1.0;
      utterance.pitch = 0.95; // slightly lower tactical authority pitch
      utterance.volume = 0.85;

      // Select an English voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(
        (v) => (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('David') || v.name.includes('Alex')) && v.lang.startsWith('en')
      ) || voices.find((v) => v.lang.startsWith('en'));

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis failed:', e);
    }
  }
}

export const tacticalAudio = new TacticalAudioService();
