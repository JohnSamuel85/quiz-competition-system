"use client";

export interface VoicePlaybackCallbacks {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err?: any) => void;
}

class VoiceManager {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isMuted: boolean = false;
  private isReplaying: boolean = false;

  constructor() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      this.synth = window.speechSynthesis;
    }
  }

  public get isSupported(): boolean {
    return this.synth !== null;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.cancel();
    }
  }

  public get muted(): boolean {
    return this.isMuted;
  }

  public cancel() {
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch (e) {
        console.error("Error cancelling speech", e);
      }
    }
    this.currentUtterance = null;
    this.isReplaying = false;
  }

  /**
   * Narrates question and options. When speech finishes, invokes onEnd to start the 20s countdown.
   */
  public speakQuestion(
    questionOrder: number,
    questionText: string,
    options: { A: string; B: string; C: string; D: string },
    callbacks?: VoicePlaybackCallbacks
  ) {
    this.cancel();

    if (!this.synth || this.isMuted) {
      // If voice is unsupported or muted, start timer immediately
      callbacks?.onEnd?.();
      return;
    }

    const narrationText = `Question ${questionOrder}. ${questionText}. Option A: ${options.A}. Option B: ${options.B}. Option C: ${options.C}. Option D: ${options.D}.`;

    const utterance = new SpeechSynthesisUtterance(narrationText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.lang = "en-US";

    // Attempt to select a natural English voice if available
    const voices = this.synth.getVoices();
    const naturalVoice = voices.find(
      (v) => (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Premium") || v.name.includes("Samantha")) && v.lang.startsWith("en")
    ) || voices.find((v) => v.lang.startsWith("en"));
    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }

    let endTriggered = false;

    utterance.onstart = () => {
      callbacks?.onStart?.();
    };

    utterance.onend = () => {
      if (!endTriggered) {
        endTriggered = true;
        this.currentUtterance = null;
        callbacks?.onEnd?.();
      }
    };

    utterance.onerror = (e) => {
      console.warn("Speech synthesis error:", e);
      if (!endTriggered) {
        endTriggered = true;
        this.currentUtterance = null;
        callbacks?.onEnd?.(); // Fallback to timer start
      }
    };

    this.currentUtterance = utterance;

    try {
      this.synth.speak(utterance);
    } catch (e) {
      console.error("Speech speak failed:", e);
      callbacks?.onEnd?.();
    }
  }

  /**
   * Replays narration while the 20-second countdown continues unaffected.
   */
  public replayQuestionAudio(
    questionOrder: number,
    questionText: string,
    options: { A: string; B: string; C: string; D: string }
  ) {
    if (!this.synth || this.isMuted) return;

    this.cancel();
    this.isReplaying = true;

    const narrationText = `Repeating question ${questionOrder}. ${questionText}. Option A: ${options.A}. Option B: ${options.B}. Option C: ${options.C}. Option D: ${options.D}.`;
    const utterance = new SpeechSynthesisUtterance(narrationText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.lang = "en-US";

    utterance.onend = () => {
      this.isReplaying = false;
      this.currentUtterance = null;
    };
    utterance.onerror = () => {
      this.isReplaying = false;
      this.currentUtterance = null;
    };

    this.currentUtterance = utterance;
    try {
      this.synth.speak(utterance);
    } catch (e) {
      console.error("Replay failed:", e);
    }
  }
}

export const voiceManager = new VoiceManager();
