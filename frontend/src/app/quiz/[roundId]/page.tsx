"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../lib/auth-context";
import { fetchWithAuth, QuestionSanitized, StartAttemptResponse } from "../../../lib/api";
import { voiceManager } from "../../../components/VoiceController";
import {
  TimerIcon,
  Volume2Icon,
  VolumeXIcon,
  RotateCcwIcon,
  BookOpenIcon,
  BrainIcon,
  ArrowRightIcon,
  SparklesIcon,
  AlertCircleIcon,
} from "../../../components/Icons";

export default function QuizArenaPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const roundId = params.roundId as string;

  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [roundTitle, setRoundTitle] = useState<string>("");
  const [questions, setQuestions] = useState<QuestionSanitized[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // Question state
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Voice + Timer Synchronization States
  // phase: "SPEAKING" | "COUNTDOWN" | "LOCKED" | "EXPIRED"
  const [phase, setPhase] = useState<"SPEAKING" | "COUNTDOWN" | "LOCKED" | "EXPIRED">("SPEAKING");
  const [timeLeft, setTimeLeft] = useState<number>(20);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const questionStartTimeRef = useRef<number>(Date.now());

  // Clean timer
  const clearCountdown = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Initialize Quiz Attempt
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
      return;
    }

    if (user && roundId) {
      setLoading(true);
      fetchWithAuth(`/api/quiz/rounds/${roundId}/start`, { method: "POST" })
        .then((data: StartAttemptResponse) => {
          setAttemptId(data.attempt_id);
          setRoundTitle(data.round_title);
          setQuestions(data.questions);
          setLoading(false);
        })
        .catch((err: any) => {
          setInitError(err.message || "Failed to initialize round attempt.");
          setLoading(false);
        });
    }

    return () => {
      voiceManager.cancel();
      clearCountdown();
    };
  }, [user, isLoading, roundId, router, clearCountdown]);

  // Start 20-second countdown
  const startCountdown = useCallback(() => {
    clearCountdown();
    setPhase("COUNTDOWN");
    setTimeLeft(20);
    questionStartTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearCountdown();
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clearCountdown]);

  // Read current question whenever index changes
  useEffect(() => {
    if (questions.length === 0 || currentIndex >= questions.length) return;

    const currentQ = questions[currentIndex];
    setSelectedOption(null);
    clearCountdown();

    if (isMuted) {
      startCountdown();
    } else {
      setPhase("SPEAKING");
      voiceManager.speakQuestion(
        currentQ.question_order,
        currentQ.question_text,
        {
          A: currentQ.option_a,
          B: currentQ.option_b,
          C: currentQ.option_c,
          D: currentQ.option_d,
        },
        {
          onStart: () => {
            setPhase("SPEAKING");
          },
          onEnd: () => {
            startCountdown();
          },
          onError: () => {
            startCountdown();
          },
        }
      );
    }

    return () => {
      voiceManager.cancel();
      clearCountdown();
    };
  }, [currentIndex, questions, isMuted, startCountdown, clearCountdown]);

  // Handle Timeout (Auto-Proceed when 20s expires)
  const handleTimeout = async () => {
    setPhase("EXPIRED");
    await commitAnswer(null, 20.0);
  };

  // Submit Answer to Backend
  const commitAnswer = async (option: string | null, elapsedSeconds?: number) => {
    if (!attemptId || submitting) return;
    setSubmitting(true);
    clearCountdown();
    voiceManager.cancel();

    const currentQ = questions[currentIndex];
    const timeSpent =
      elapsedSeconds !== undefined
        ? elapsedSeconds
        : Math.min(20, (Date.now() - questionStartTimeRef.current) / 1000);

    try {
      const resp = await fetchWithAuth(`/api/quiz/attempts/${attemptId}/answer`, {
        method: "POST",
        body: JSON.stringify({
          question_id: currentQ.id,
          selected_option: option,
          time_taken_seconds: parseFloat(timeSpent.toFixed(1)),
        }),
      });

      // Check if last question
      if (currentIndex + 1 >= questions.length || resp.is_last_question) {
        // Finish quiz attempt and redirect to scorecard
        await fetchWithAuth(`/api/quiz/attempts/${attemptId}/finish`, { method: "POST" });
        router.push(`/scorecard/${attemptId}`);
      } else {
        setCurrentIndex((prev) => prev + 1);
        setSubmitting(false);
      }
    } catch (err: any) {
      console.error("Submission failed:", err);
      // If already answered or error, still advance
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        router.push(`/scorecard/${attemptId}`);
      }
      setSubmitting(false);
    }
  };

  // Manual submission by user clicking Lock In
  const handleConfirmAnswer = () => {
    if (!selectedOption) return;
    setPhase("LOCKED");
    commitAnswer(selectedOption);
  };

  // Skip Speech Narration & immediately start countdown
  const handleSkipSpeech = () => {
    voiceManager.cancel();
    startCountdown();
  };

  // Toggle Mute
  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    voiceManager.setMuted(nextMuted);
    if (nextMuted && phase === "SPEAKING") {
      startCountdown();
    }
  };

  // Replay question narration without resetting running timer
  const handleReplayAudio = () => {
    if (questions.length === 0 || currentIndex >= questions.length) return;
    const currentQ = questions[currentIndex];
    voiceManager.replayQuestionAudio(currentQ.question_order, currentQ.question_text, {
      A: currentQ.option_a,
      B: currentQ.option_b,
      C: currentQ.option_c,
      D: currentQ.option_d,
    });
  };

  // Keyboard shortcut listener (A, B, C, D or 1, 2, 3, 4)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (submitting || phase === "LOCKED") return;
      const key = e.key.toUpperCase();
      if (["A", "1"].includes(key)) setSelectedOption("A");
      if (["B", "2"].includes(key)) setSelectedOption("B");
      if (["C", "3"].includes(key)) setSelectedOption("C");
      if (["D", "4"].includes(key)) setSelectedOption("D");
      if (e.key === "Enter" && selectedOption) {
        handleConfirmAnswer();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedOption, submitting, phase]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-gray-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <h2 className="text-base font-bold text-white">Initializing Competition Arena...</h2>
          <p className="text-xs text-gray-400">Preparing 50 synchronized challenges</p>
        </div>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full p-8 rounded-3xl glass-card border border-red-500/30 text-center">
          <AlertCircleIcon size={44} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white">Round Access Notice</h2>
          <p className="text-sm text-gray-300 mt-2">{initError}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-6 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  if (!currentQ) return null;

  const isBibleCategory = currentQ.category.toLowerCase().includes("bible");
  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);

  return (
    <div className="flex-1 flex flex-col max-w-5xl mx-auto px-4 sm:px-6 w-full py-6">
      {/* Top Arena Navigation & Progress Bar */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold text-amber-400 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30">
              Question {currentIndex + 1} of {questions.length}
            </span>
            <div
              className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border ${
                isBibleCategory
                  ? "bg-amber-950/30 border-amber-500/30 text-amber-300"
                  : "bg-indigo-950/30 border-indigo-500/30 text-indigo-300"
              }`}
            >
              {isBibleCategory ? <BookOpenIcon size={14} /> : <BrainIcon size={14} />}
              {currentQ.category}
            </div>
            {currentQ.bible_reference && (
              <span className="text-[11px] font-serif italic text-amber-400/80 hidden sm:inline">
                [{currentQ.bible_reference}]
              </span>
            )}
          </div>

          {/* Voice & Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleReplayAudio}
              title="Replay Voice (Timer continues)"
              className="p-2 rounded-lg bg-[#141828] hover:bg-[#1e253e] border border-[#232b45] text-gray-300 hover:text-amber-400 text-xs flex items-center gap-1.5 transition-colors"
            >
              <RotateCcwIcon size={15} />
              <span className="hidden sm:inline">Replay Audio</span>
            </button>
            <button
              onClick={handleToggleMute}
              title={isMuted ? "Unmute Voice" : "Mute Voice"}
              className={`p-2 rounded-lg border text-xs flex items-center gap-1.5 transition-colors ${
                isMuted
                  ? "bg-red-500/10 border-red-500/30 text-red-400"
                  : "bg-[#141828] border-[#232b45] text-gray-300 hover:text-white"
              }`}
            >
              {isMuted ? <VolumeXIcon size={15} /> : <Volume2Icon size={15} />}
              <span className="hidden sm:inline">{isMuted ? "Muted" : "Voice On"}</span>
            </button>
          </div>
        </div>

        {/* Linear Progress Bar */}
        <div className="w-full h-1.5 rounded-full bg-[#141826] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-indigo-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Voice & Timer Synchronization Banner */}
      <div className="mb-6">
        {phase === "SPEAKING" ? (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-amber-300">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <span className="w-1.5 bg-amber-400 rounded-full animate-soundwave-1" />
                <span className="w-1.5 bg-amber-400 rounded-full animate-soundwave-2" />
                <span className="w-1.5 bg-amber-400 rounded-full animate-soundwave-3" />
                <span className="w-1.5 bg-amber-400 rounded-full animate-soundwave-4" />
              </div>
              <span className="text-xs sm:text-sm font-semibold">
                Voice Narration in Progress... (20-second timer begins after speech)
              </span>
            </div>
            <button
              onClick={handleSkipSpeech}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 underline underline-offset-4 shrink-0"
            >
              Skip to Timer →
            </button>
          </div>
        ) : (
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between gap-3 transition-colors ${
              timeLeft <= 5
                ? "bg-rose-500/10 border-rose-500/40 text-rose-300 urgent-timer"
                : timeLeft <= 10
                ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
            }`}
          >
            <div className="flex items-center gap-3">
              <TimerIcon size={20} className={timeLeft <= 5 ? "text-rose-400 animate-pulse" : ""} />
              <span className="text-xs sm:text-sm font-semibold">
                {timeLeft <= 5 ? "Hurry! Timer expiring soon!" : "Countdown Active: Answer within 20 seconds"}
              </span>
            </div>

            {/* Visual Circular Countdown Counter */}
            <div className="flex items-center gap-2">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-mono font-bold text-sm border-2 ${
                  timeLeft <= 5
                    ? "border-rose-400 text-rose-300 bg-rose-950/40"
                    : timeLeft <= 10
                    ? "border-amber-400 text-amber-300 bg-amber-950/40"
                    : "border-emerald-400 text-emerald-300 bg-emerald-950/40"
                }`}
              >
                {timeLeft}s
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Question Card */}
      <div className="p-6 sm:p-8 rounded-3xl glass-card border border-[#232b45] shadow-2xl mb-6">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
          Intellectual Challenge #{currentQ.question_order}
        </span>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white leading-snug tracking-tight">
          {currentQ.question_text}
        </h2>
      </div>

      {/* Four Option Cards (A, B, C, D) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {[
          { key: "A", label: currentQ.option_a },
          { key: "B", label: currentQ.option_b },
          { key: "C", label: currentQ.option_c },
          { key: "D", label: currentQ.option_d },
        ].map((opt) => {
          const isSelected = selectedOption === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              disabled={submitting || phase === "LOCKED"}
              onClick={() => setSelectedOption(opt.key)}
              className={`p-5 rounded-2xl text-left border transition-all flex items-start gap-4 ${
                isSelected
                  ? "bg-amber-500/15 border-amber-400 shadow-lg shadow-amber-500/15 scale-[1.01]"
                  : "bg-[#111422] border-[#20273d] hover:border-[#38456c] hover:bg-[#161a2c]"
              } disabled:cursor-not-allowed`}
            >
              <span
                className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${
                  isSelected
                    ? "bg-amber-500 text-black"
                    : "bg-[#181d30] text-gray-300 border border-[#2b3552]"
                }`}
              >
                {opt.key}
              </span>
              <div className="flex-1 pt-0.5">
                <span
                  className={`text-sm sm:text-base font-medium leading-relaxed ${
                    isSelected ? "text-amber-100 font-semibold" : "text-gray-200"
                  }`}
                >
                  {opt.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom Action Footer */}
      <div className="flex items-center justify-between gap-4 pt-4 border-t border-[#1a2030]">
        <div className="text-xs text-gray-400">
          <span className="hidden sm:inline">Shortcut: Press </span>
          <kbd className="px-1.5 py-0.5 rounded bg-[#181d30] border border-[#27304d] text-[11px] text-gray-300">
            A
          </kbd>
          ,{" "}
          <kbd className="px-1.5 py-0.5 rounded bg-[#181d30] border border-[#27304d] text-[11px] text-gray-300">
            B
          </kbd>
          ,{" "}
          <kbd className="px-1.5 py-0.5 rounded bg-[#181d30] border border-[#27304d] text-[11px] text-gray-300">
            C
          </kbd>
          ,{" "}
          <kbd className="px-1.5 py-0.5 rounded bg-[#181d30] border border-[#27304d] text-[11px] text-gray-300">
            D
          </kbd>
        </div>

        <button
          type="button"
          disabled={!selectedOption || submitting || phase === "LOCKED"}
          onClick={handleConfirmAnswer}
          className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-extrabold text-sm tracking-wide shadow-lg shadow-amber-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 group"
        >
          {submitting ? "Locking In..." : "Confirm & Proceed"}
          <ArrowRightIcon size={16} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}
