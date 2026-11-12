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
  const [allRounds, setAllRounds] = useState<RoundSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithAuth("/api/rounds")
      .then((data: RoundSummary[]) => {
        setAllRounds(data);
      })
      .catch((err) => {
        console.warn("Could not fetch rounds:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user]);

  return (
    <div className="flex-1 flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 border-b border-[#1a2032]">
        {/* Ambient gradient lights */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-amber-500/10 via-indigo-500/10 to-transparent blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-6">
            <SparklesIcon size={14} />
            Masters Competition Arena • 2026 Edition
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.1]">
            The Premier Crucible of <span className="gold-gradient-text">Scripture</span> &{" "}
            <span className="indigo-gradient-text">Intellect</span>
          </h1>

          <p className="mt-6 text-base sm:text-xl text-gray-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Fifty intellectually demanding challenges per round: 25 advanced Biblical inquiries and 25 elite general knowledge
            mysteries. Synchronized audio narration with immediate answer revelation.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#rounds-list"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-bold text-sm tracking-wide shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 group"
            >
              <TrophyIcon size={18} />
              Select Competition Round (1, 2, or 3)
              <ArrowRightIcon size={16} className="group-hover:translate-x-1 transition-transform" />
            </a>

            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#131828] hover:bg-[#1a2138] border border-[#232b45] text-gray-200 font-semibold text-sm transition-all flex items-center justify-center gap-2"
            >
              <BrainIcon size={16} className="text-indigo-400" />
              Participant Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* CLEAR LIST OF ROUND 1, ROUND 2, AND ROUND 3 WHERE USER SELECTS TO PROCEED */}
      <section id="rounds-list" className="py-16 md:py-20 bg-[#090b14] border-b border-[#1a2032] scroll-mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold uppercase tracking-widest mb-3">
              <TrophyIcon size={14} />
              Championship Rounds
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Select Your Competition Round
            </h2>
            <p className="mt-2 text-sm text-gray-400">
              Choose Round 1, Round 2, or Round 3 to begin the 50-question master challenge.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {allRounds.map((round) => {
              const roundBorderColor =
                round.round_number === 1
                  ? "border-amber-500/30 hover:border-amber-400"
                  : round.round_number === 2
                  ? "border-indigo-500/30 hover:border-indigo-400"
                  : "border-teal-500/30 hover:border-teal-400";

              const badgeColor =
                round.round_number === 1
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                  : round.round_number === 2
                  ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/30"
                  : "bg-teal-500/10 text-teal-400 border-teal-500/30";

              return (
                <div
                  key={round.id}
                  className={`p-7 rounded-3xl glass-card border flex flex-col justify-between transition-all duration-300 shadow-xl relative overflow-hidden group ${roundBorderColor}`}
                >
                  <div className="absolute top-0 right-0 w-28 h-28 bg-white/5 rounded-full blur-2xl pointer-events-none" />

                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <span className={`text-xs font-mono font-extrabold px-3 py-1 rounded-full border uppercase tracking-wider ${badgeColor}`}>
                        Round #{round.round_number}
                      </span>
                      <span className="text-xs font-semibold text-gray-400 bg-[#101422] px-2.5 py-1 rounded-lg border border-[#1e2538]">
                        50 Questions
                      </span>
                    </div>

                    <h3 className="text-xl font-extrabold text-white group-hover:text-amber-300 transition-colors leading-snug">
                      {round.title}
                    </h3>

                    <p className="mt-3 text-xs text-gray-400 leading-relaxed min-h-[48px]">
                      {round.description || "50 challenging questions: 25 Bible Knowledge + 25 General Knowledge."}
                    </p>

                    {/* Breakdown stats */}
                    <div className="grid grid-cols-2 gap-2 my-5 text-center">
                      <div className="p-2.5 rounded-xl bg-[#0c0f1a] border border-[#1b2236]">
                        <span className="text-[10px] text-amber-400 uppercase font-bold block">Scripture</span>
                        <span className="text-xs font-extrabold text-white">25 Questions</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[#0c0f1a] border border-[#1b2236]">
                        <span className="text-[10px] text-indigo-400 uppercase font-bold block">General</span>
                        <span className="text-xs font-extrabold text-white">25 Questions</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-4 border-t border-[#1e2538]">
                    {round.user_attempted_today ? (
                      <Link
                        href={`/scorecard/${round.latest_attempt_id}`}
                        className="w-full py-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <CheckCircleIcon size={15} />
                        View Scorecard ({round.latest_score} Pts)
                      </Link>
                    ) : (
                      <Link
                        href={`/quiz/${round.id}`}
                        className={`w-full py-3 rounded-xl font-extrabold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg transition-all ${
                          round.round_number === 1
                            ? "bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20"
                            : round.round_number === 2
                            ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20"
                            : "bg-teal-500 hover:bg-teal-400 text-black shadow-teal-500/20"
                        }`}
                      >
                        <PlayIcon size={14} />
                        Proceed to Round {round.round_number}
                        <ArrowRightIcon size={14} />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pillars Section */}
      <section className="py-16 md:py-20 bg-[#0a0d16] border-b border-[#1a2032]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Engineered for Intellectual Rigor
            </h2>
            <p className="mt-2 text-sm text-gray-400">
              Synchronized audio narration, immediate answer reveals, and detailed explanations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-7 rounded-2xl glass-card flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-5">
                  <Volume2Icon size={24} />
                </div>
                <h3 className="text-lg font-bold text-white">Synchronized Voice Narration</h3>
                <p className="mt-3 text-sm text-gray-400 leading-relaxed">
                  Every question and option is automatically read aloud with text-to-speech. The 20-second countdown
                  strictly begins only after the voice narration finishes.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#1e2538] flex items-center gap-2 text-xs text-amber-400 font-medium">
                <TimerIcon size={14} />
                20-Second Window Post-Voice
              </div>
            </div>

            <div className="p-7 rounded-2xl glass-card flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-5">
                  <BrainIcon size={24} />
                </div>
                <h3 className="text-lg font-bold text-white">Immediate Answer Feedback</h3>
                <p className="mt-3 text-sm text-gray-400 leading-relaxed">
                  Selecting an option and confirming immediately highlights the correct answer in emerald green, reveals
                  errors, and displays the scholarly explanation.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#1e2538] flex items-center gap-2 text-xs text-indigo-400 font-medium">
                <BookOpenIcon size={14} />
                Instant Reveal + Scholarly Insights
              </div>
            </div>

            <div className="p-7 rounded-2xl glass-card flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-5">
                  <ShieldIcon size={24} />
                </div>
                <h3 className="text-lg font-bold text-white">Backend Graded & Audited</h3>
                <p className="mt-3 text-sm text-gray-400 leading-relaxed">
                  Anti-cheat server validation prevents multiple submissions. Detailed scorecards break down accuracy
                  across Scripture and General Knowledge.
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
    </div>
  );
}
