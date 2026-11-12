"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../lib/auth-context";
import { fetchWithAuth, RoundSummary } from "../lib/api";
import {
  TrophyIcon,
  TimerIcon,
  Volume2Icon,
  BrainIcon,
  BookOpenIcon,
  ShieldIcon,
  ArrowRightIcon,
  SparklesIcon,
  CheckCircleIcon,
  PlayIcon,
} from "../components/Icons";

export default function HomePage() {
  const { user } = useAuth();
  const [dailyRound, setDailyRound] = useState<RoundSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithAuth("/api/rounds/daily")
      .then((data: RoundSummary) => {
        setDailyRound(data);
      })
      .catch((err) => {
        console.warn("Could not fetch daily round:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user]);

  return (
    <div className="flex-1 flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-[#1a2032]">
        {/* Ambient gradient lights */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-amber-500/10 via-indigo-500/10 to-transparent blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-6">
            <SparklesIcon size={14} />
            Daily Masters Competition • 2026 Edition
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.1]">
            The Premier Crucible of <span className="gold-gradient-text">Scripture</span> &{" "}
            <span className="indigo-gradient-text">Intellect</span>
          </h1>

          <p className="mt-6 text-base sm:text-xl text-gray-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Fifty intellectually rigorous challenges: 25 advanced Biblical inquiries and 25 elite general knowledge
            mysteries. Synchronized audio narration with a 20-second countdown window.
          </p>

          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4">
            {dailyRound ? (
              dailyRound.user_attempted_today ? (
                <Link
                  href={`/scorecard/${dailyRound.latest_attempt_id}`}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-bold text-sm tracking-wide shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircleIcon size={18} />
                  View Today's Scorecard ({dailyRound.latest_score} Pts)
                </Link>
              ) : (
                <Link
                  href={`/quiz/${dailyRound.id}`}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-bold text-sm tracking-wide shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 group"
                >
                  <PlayIcon size={18} />
                  Launch Today's Championship Round
                  <ArrowRightIcon size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              )
            ) : (
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-black font-bold text-sm shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2"
              >
                Sign In to Enter Arena
                <ArrowRightIcon size={16} />
              </Link>
            )}

            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#131828] hover:bg-[#1a2138] border border-[#232b45] text-gray-200 font-semibold text-sm transition-all flex items-center justify-center gap-2"
            >
              <TrophyIcon size={16} className="text-amber-400" />
              Participant Dashboard
            </Link>
          </div>

          {/* Today's Active Championship Showcase Card */}
          {dailyRound && (
            <div className="mt-12 max-w-2xl mx-auto p-6 rounded-2xl glass-card border border-amber-500/20 text-left shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between gap-4 border-b border-[#1e2538] pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <TrophyIcon size={20} />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest">
                      Active Daily Competition
                    </span>
                    <h3 className="text-base font-bold text-white">{dailyRound.title}</h3>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#1b2238] border border-[#2b3554] text-gray-300">
                    50 Questions
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 rounded-xl bg-[#0b0e18] border border-[#1a2032]">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Round</span>
                  <span className="text-base font-bold text-white">#{dailyRound.round_number}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#0b0e18] border border-[#1a2032]">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Scripture</span>
                  <span className="text-base font-bold text-amber-400">25 Questions</span>
                </div>
                <div className="p-3 rounded-xl bg-[#0b0e18] border border-[#1a2032]">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider block">General</span>
                  <span className="text-base font-bold text-indigo-400">25 Questions</span>
                </div>
                <div className="p-3 rounded-xl bg-[#0b0e18] border border-[#1a2032]">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Window</span>
                  <span className="text-base font-bold text-emerald-400">20s / Q</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Pillars Section */}
      <section className="py-16 md:py-24 bg-[#0a0d16] border-b border-[#1a2032]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Engineered for Pure Intellectual Rigor
            </h2>
            <p className="mt-3 text-sm text-gray-400">
              No generic templates or childlike game shows. Built for discerning scholars who relish demanding challenges.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-7 rounded-2xl glass-card glass-card-hover flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-5">
                  <Volume2Icon size={24} />
                </div>
                <h3 className="text-lg font-bold text-white">Synchronized Voice Narration</h3>
                <p className="mt-3 text-sm text-gray-400 leading-relaxed">
                  Every question and option is automatically read aloud with clear text-to-speech. The 20-second countdown
                  strictly begins only after the voice narration finishes.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#1e2538] flex items-center gap-2 text-xs text-amber-400 font-medium">
                <TimerIcon size={14} />
                20-Second Window Post-Voice
              </div>
            </div>

            {/* Feature 2 */}
            <div className="p-7 rounded-2xl glass-card glass-card-hover flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-5">
                  <BrainIcon size={24} />
                </div>
                <h3 className="text-lg font-bold text-white">50-Question Master Rounds</h3>
                <p className="mt-3 text-sm text-gray-400 leading-relaxed">
                  Balanced 50-question competition: 25 deep biblical theology, historical context, and original language
                  insights + 25 astrophysics, philosophy, and global history questions.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#1e2538] flex items-center gap-2 text-xs text-indigo-400 font-medium">
                <BookOpenIcon size={14} />
                25 Bible + 25 General Knowledge
              </div>
            </div>

            {/* Feature 3 */}
            <div className="p-7 rounded-2xl glass-card glass-card-hover flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-5">
                  <ShieldIcon size={24} />
                </div>
                <h3 className="text-lg font-bold text-white">Backend Graded & Audited</h3>
                <p className="mt-3 text-sm text-gray-400 leading-relaxed">
                  Correct answers and explanations are protected strictly on the backend. Detailed post-round scorecards
                  break down category accuracy and explain every single question.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#1e2538] flex items-center gap-2 text-xs text-emerald-400 font-medium">
                <CheckCircleIcon size={14} />
                Anti-Cheat Server Validation
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Rules & Structure Banner */}
      <section className="py-16 bg-[#080a10]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 rounded-3xl bg-gradient-to-b from-[#131726] to-[#0c0f1a] border border-[#232b45] shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6 text-center">Championship Protocol & Rules</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm text-gray-300">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  1
                </div>
                <p>
                  <strong className="text-white">One Round Per Day:</strong> Each scholar may submit one scored attempt
                  per daily championship round to ensure fair leaderboard integrity.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  2
                </div>
                <p>
                  <strong className="text-white">Strict 20s Countdown:</strong> Audio narration precedes the timer. You
                  have exactly 20 seconds to choose between Options A, B, C, or D.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  3
                </div>
                <p>
                  <strong className="text-white">No Question Backtracking:</strong> Once an answer is locked or time
                  expires, the arena immediately advances to the next question.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  4
                </div>
                <p>
                  <strong className="text-white">Exhaustive Scorecard:</strong> Receive full performance analytics,
                  scripture citations, and detailed historical/theological explanations upon completion.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
