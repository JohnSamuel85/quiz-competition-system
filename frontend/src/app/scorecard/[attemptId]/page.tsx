"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../lib/auth-context";
import { fetchWithAuth, ScorecardResponse } from "../../../lib/api";
import {
  TrophyIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertCircleIcon,
  BookOpenIcon,
  BrainIcon,
  TimerIcon,
  ArrowRightIcon,
  SparklesIcon,
} from "../../../components/Icons";

export default function ScorecardPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const attemptId = params.attemptId as string;

  const [scorecard, setScorecard] = useState<ScorecardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "correct" | "incorrect" | "unanswered">("all");

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
      return;
    }

    if (user && attemptId) {
      fetchWithAuth(`/api/quiz/attempts/${attemptId}/scorecard`)
        .then((data: ScorecardResponse) => {
          setScorecard(data);
          setLoading(false);
        })
        .catch((err: any) => {
          setError(err.message || "Failed to load scorecard");
          setLoading(false);
        });
    }
  }, [user, isLoading, attemptId, router]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-gray-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Tabulating Championship Scorecard...</p>
        </div>
      </div>
    );
  }

  if (error || !scorecard) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full p-8 rounded-3xl glass-card border border-red-500/30 text-center">
          <AlertCircleIcon size={40} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white">Scorecard Unavailable</h2>
          <p className="text-sm text-gray-300 mt-2">{error || "Could not locate this scorecard."}</p>
          <Link
            href="/dashboard"
            className="mt-6 inline-block px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Tier calculation
  let tier = "Grand Scholar";
  let tierColor = "text-amber-400";
  if (scorecard.accuracy_percentage >= 90) {
    tier = "Grandmaster of Scripture & Sciences";
    tierColor = "text-amber-300";
  } else if (scorecard.accuracy_percentage >= 75) {
    tier = "Master Inquisitor";
    tierColor = "text-indigo-400";
  } else if (scorecard.accuracy_percentage >= 60) {
    tier = "Adept Competitor";
    tierColor = "text-emerald-400";
  }

  const bibleAccuracy =
    scorecard.bible_total > 0
      ? Math.round((scorecard.bible_correct / scorecard.bible_total) * 100)
      : 0;
  const gkAccuracy =
    scorecard.gk_total > 0
      ? Math.round((scorecard.gk_correct / scorecard.gk_total) * 100)
      : 0;

  const filteredQuestions = scorecard.questions_review.filter((q) => {
    if (filter === "correct") return q.is_correct;
    if (filter === "incorrect") return !q.is_correct && q.selected_option !== null;
    if (filter === "unanswered") return q.selected_option === null;
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
      {/* Header Banner */}
      <div className="p-8 sm:p-10 rounded-3xl glass-card border border-amber-500/30 text-center relative overflow-hidden mb-10 shadow-2xl">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-4">
          <TrophyIcon size={14} />
          Championship Round #{scorecard.round_number} Scorecard
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          {scorecard.round_title}
        </h1>

        <div className="mt-3 flex items-center justify-center gap-2 text-sm text-gray-300">
          <span>Competitor: <strong className="text-white">{scorecard.user_full_name}</strong></span>
          <span>•</span>
          <span className={`font-semibold ${tierColor}`}>{tier}</span>
        </div>

        {/* Primary Scores Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 max-w-3xl mx-auto">
          <div className="p-4 rounded-2xl bg-[#0b0e18] border border-[#1f273d]">
            <span className="text-[11px] text-gray-400 uppercase tracking-wider block">Total Points</span>
            <span className="text-3xl font-extrabold text-amber-400 mt-1 block">
              {scorecard.total_score}
            </span>
            <span className="text-[10px] text-gray-500 block">out of 500 max</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#0b0e18] border border-[#1f273d]">
            <span className="text-[11px] text-gray-400 uppercase tracking-wider block">Overall Accuracy</span>
            <span className="text-3xl font-extrabold text-white mt-1 block">
              {scorecard.accuracy_percentage}%
            </span>
            <span className="text-[10px] text-gray-500 block">{scorecard.correct_count} of 50 correct</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#0b0e18] border border-[#1f273d]">
            <span className="text-[11px] text-gray-400 uppercase tracking-wider block">Time Elapsed</span>
            <span className="text-3xl font-extrabold text-white mt-1 block">
              {Math.floor(scorecard.total_time_seconds / 60)}m {Math.round(scorecard.total_time_seconds % 60)}s
            </span>
            <span className="text-[10px] text-gray-500 block">Total Arena Time</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#0b0e18] border border-[#1f273d]">
            <span className="text-[11px] text-gray-400 uppercase tracking-wider block">Performance</span>
            <div className="text-lg font-bold mt-2 flex items-center justify-center gap-1.5">
              <span className="text-emerald-400 font-extrabold">{scorecard.correct_count}C</span>
              <span className="text-gray-500">/</span>
              <span className="text-rose-400 font-extrabold">{scorecard.incorrect_count}I</span>
              <span className="text-gray-500">/</span>
              <span className="text-amber-400 font-extrabold">{scorecard.unanswered_count}U</span>
            </div>
            <span className="text-[10px] text-gray-500 block">Correct / Wrong / Timeouts</span>
          </div>
        </div>

        {/* Category Dual Progress */}
        <div className="mt-8 pt-6 border-t border-[#1e2538] grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto text-left">
          <div className="p-4 rounded-xl bg-[#0e1220] border border-amber-500/20">
            <div className="flex items-center justify-between text-xs font-semibold mb-2">
              <span className="flex items-center gap-1.5 text-amber-400">
                <BookOpenIcon size={14} />
                Bible Knowledge
              </span>
              <span className="text-white font-mono">
                {scorecard.bible_correct} / {scorecard.bible_total} ({bibleAccuracy}%)
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#181f33] overflow-hidden">
              <div
                className="h-full bg-amber-400 transition-all duration-500"
                style={{ width: `${bibleAccuracy}%` }}
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0e1220] border border-indigo-500/20">
            <div className="flex items-center justify-between text-xs font-semibold mb-2">
              <span className="flex items-center gap-1.5 text-indigo-400">
                <BrainIcon size={14} />
                General Knowledge
              </span>
              <span className="text-white font-mono">
                {scorecard.gk_correct} / {scorecard.gk_total} ({gkAccuracy}%)
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#181f33] overflow-hidden">
              <div
                className="h-full bg-indigo-500 transition-all duration-500"
                style={{ width: `${gkAccuracy}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Review Section */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Comprehensive Question Audit & Explanations</h2>
            <p className="text-xs text-gray-400">
              Review correct answers, participant selections, and official theological & scientific explanations.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#0f1322] border border-[#20273d] text-xs">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filter === "all" ? "bg-amber-500 text-black font-bold" : "text-gray-300 hover:text-white"
              }`}
            >
              All ({scorecard.questions_review.length})
            </button>
            <button
              onClick={() => setFilter("correct")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filter === "correct" ? "bg-emerald-500 text-black font-bold" : "text-gray-300 hover:text-white"
              }`}
            >
              Correct ({scorecard.correct_count})
            </button>
            <button
              onClick={() => setFilter("incorrect")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filter === "incorrect" ? "bg-rose-500 text-white font-bold" : "text-gray-300 hover:text-white"
              }`}
            >
              Incorrect ({scorecard.incorrect_count})
            </button>
            <button
              onClick={() => setFilter("unanswered")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filter === "unanswered" ? "bg-amber-400 text-black font-bold" : "text-gray-300 hover:text-white"
              }`}
            >
              Timeouts ({scorecard.unanswered_count})
            </button>
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-4">
          {filteredQuestions.map((q) => {
            const isBible = q.category.toLowerCase().includes("bible");
            const isUnanswered = q.selected_option === null;

            return (
              <div
                key={q.question_id}
                className={`p-6 rounded-2xl glass-card border transition-all ${
                  q.is_correct
                    ? "border-emerald-500/20"
                    : isUnanswered
                    ? "border-amber-500/20"
                    : "border-rose-500/20"
                }`}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold text-gray-400">#{q.question_order}</span>
                    <span
                      className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${
                        isBible
                          ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                          : "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
                      }`}
                    >
                      {q.category}
                    </span>
                    {q.bible_reference && (
                      <span className="text-xs font-serif italic text-amber-400">
                        [{q.bible_reference}]
                      </span>
                    )}
                  </div>

                  <div>
                    {q.is_correct ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                        <CheckCircleIcon size={14} /> Correct (+10 Pts)
                      </span>
                    ) : isUnanswered ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-bold">
                        <TimerIcon size={14} /> Timed Out
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs font-bold">
                        <XCircleIcon size={14} /> Incorrect
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-white mb-4 leading-snug">
                  {q.question_text}
                </h3>

                {/* Options Review */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4 text-xs sm:text-sm">
                  {[
                    { key: "A", val: q.option_a },
                    { key: "B", val: q.option_b },
                    { key: "C", val: q.option_c },
                    { key: "D", val: q.option_d },
                  ].map((opt) => {
                    const isCorrect = opt.key === q.correct_answer;
                    const isUserChoice = opt.key === q.selected_option;

                    return (
                      <div
                        key={opt.key}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                          isCorrect
                            ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-100 font-semibold"
                            : isUserChoice && !isCorrect
                            ? "bg-rose-500/15 border-rose-500/50 text-rose-200"
                            : "bg-[#0b0e18] border-[#1e2538] text-gray-400"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs ${
                              isCorrect
                                ? "bg-emerald-500 text-black"
                                : isUserChoice
                                ? "bg-rose-500 text-white"
                                : "bg-[#161c2e] text-gray-400"
                            }`}
                          >
                            {opt.key}
                          </span>
                          <span>{opt.val}</span>
                        </div>
                        {isCorrect && <span className="text-[10px] uppercase font-bold text-emerald-400">Correct Answer</span>}
                        {isUserChoice && !isCorrect && (
                          <span className="text-[10px] uppercase font-bold text-rose-400">Your Selection</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Scholarly Explanation */}
                <div className="p-3.5 rounded-xl bg-[#0c101c] border border-[#1b233a] text-xs text-gray-300 leading-relaxed">
                  <strong className="text-amber-400 block mb-1">Scholarly Explanation:</strong>
                  {q.explanation}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Return to Dashboard */}
      <div className="text-center pt-6 border-t border-[#1a2030]">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm tracking-wide shadow-lg shadow-amber-500/20 transition-all"
        >
          Return to Dashboard
          <ArrowRightIcon size={16} />
        </Link>
      </div>
    </div>
  );
}
