"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth-context";
import { fetchWithAuth, RoundSummary, UserStatsResponse } from "../../lib/api";
import {
  TrophyIcon,
  BrainIcon,
  BookOpenIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  BarChartIcon,
  PlayIcon,
} from "../../components/Icons";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const [allRounds, setAllRounds] = useState<RoundSummary[]>([]);
  const [stats, setStats] = useState<UserStatsResponse | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      Promise.all([
        fetchWithAuth("/api/rounds").catch(() => []),
        fetchWithAuth("/api/auth/stats").catch(() => null),
      ])
        .then(([roundsData, statsData]) => {
          if (Array.isArray(roundsData)) setAllRounds(roundsData);
          if (statsData) setStats(statsData);
        })
        .finally(() => {
          setLoadingData(false);
        });
    }
  }, [user, isLoading, router]);

  if (isLoading || loadingData) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-gray-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Loading participant dossier...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-bold text-amber-400 tracking-wider">
              Scholar Dossier
            </span>
            <span className="text-gray-500">•</span>
            <span className="text-xs text-gray-400">ID #{user?.id}</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Greetings, {user?.full_name}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Select a competition round below, review scorecards, and track your metrics.
          </p>
        </div>
      </div>

      {/* CLEAR LIST OF ROUND 1, ROUND 2, AND ROUND 3 WHERE USER SELECTS TO PROCEED */}
      <div className="mb-12">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <TrophyIcon size={20} className="text-amber-400" />
              Championship Rounds Selection
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Select any round to proceed directly into its 50-question master challenge.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-amber-400 px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/20">
            3 Rounds Available
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {allRounds.map((round) => {
            const isRound1 = round.round_number === 1;
            const isRound2 = round.round_number === 2;

            const borderClass = isRound1
              ? "border-amber-500/30 hover:border-amber-400"
              : isRound2
              ? "border-indigo-500/30 hover:border-indigo-400"
              : "border-teal-500/30 hover:border-teal-400";

            const badgeClass = isRound1
              ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
              : isRound2
              ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/30"
              : "bg-teal-500/10 text-teal-400 border-teal-500/30";

            return (
              <div
                key={round.id}
                className={`p-6 rounded-3xl glass-card border flex flex-col justify-between transition-all duration-200 shadow-xl relative overflow-hidden group ${borderClass}`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${badgeClass}`}>
                      Round #{round.round_number}
                    </span>
                    <span className="text-[11px] font-semibold text-gray-400 bg-[#0e1220] px-2 py-0.5 rounded border border-[#1f273d]">
                      50 Questions
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors leading-snug">
                    {round.title}
                  </h3>

                  <p className="text-xs text-gray-400 mt-2 min-h-[40px] leading-relaxed">
                    {round.description || "50 high-difficulty challenges: 25 Bible Knowledge + 25 General Knowledge."}
                  </p>

                  <div className="grid grid-cols-2 gap-2 my-4 text-center">
                    <div className="p-2 rounded-xl bg-[#0b0e18] border border-[#1a2032]">
                      <span className="text-[10px] text-amber-400 uppercase font-bold block">Scripture</span>
                      <span className="text-xs font-bold text-white">25 Qs</span>
                    </div>
                    <div className="p-2 rounded-xl bg-[#0b0e18] border border-[#1a2032]">
                      <span className="text-[10px] text-indigo-400 uppercase font-bold block">General</span>
                      <span className="text-xs font-bold text-white">25 Qs</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#1e2538]">
                  {round.user_attempted_today ? (
                    <Link
                      href={`/scorecard/${round.latest_attempt_id}`}
                      className="w-full py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <CheckCircleIcon size={14} />
                      View Scorecard ({round.latest_score} Pts)
                    </Link>
                  ) : (
                    <Link
                      href={`/quiz/${round.id}`}
                      className={`w-full py-2.5 rounded-xl font-extrabold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg transition-all ${
                        isRound1
                          ? "bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20"
                          : isRound2
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

      {/* Lifetime Performance Overview */}
      <div className="mb-10">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <BarChartIcon size={20} className="text-amber-400" />
          Career Competition Metrics
        </h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl glass-card border border-[#1f273d]">
            <span className="text-xs text-gray-400 block font-medium">Rounds Completed</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-white mt-1 block">
              {stats?.total_rounds_completed ?? 0}
            </span>
            <span className="text-[11px] text-gray-500 mt-1 block">
              {stats?.total_questions_answered ?? 0} total questions answered
            </span>
          </div>

          <div className="p-5 rounded-2xl glass-card border border-[#1f273d]">
            <span className="text-xs text-gray-400 block font-medium">Overall Accuracy</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-400 mt-1 block">
              {stats?.overall_accuracy ?? 0}%
            </span>
            <span className="text-[11px] text-gray-500 mt-1 block">
              {stats?.total_correct ?? 0} correct answers
            </span>
          </div>

          <div className="p-5 rounded-2xl glass-card border border-[#1f273d]">
            <span className="text-xs text-gray-400 block font-medium">Scripture Mastery</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-300 mt-1 block">
              {stats?.bible_accuracy ?? 0}%
            </span>
            <div className="flex items-center gap-1 text-[11px] text-amber-500/80 mt-1">
              <BookOpenIcon size={12} />
              Bible Knowledge Category
            </div>
          </div>

          <div className="p-5 rounded-2xl glass-card border border-[#1f273d]">
            <span className="text-xs text-gray-400 block font-medium">General Knowledge</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-indigo-400 mt-1 block">
              {stats?.gk_accuracy ?? 0}%
            </span>
            <div className="flex items-center gap-1 text-[11px] text-indigo-400/80 mt-1">
              <BrainIcon size={12} />
              Sciences & Civilization
            </div>
          </div>
        </div>
      </div>

      {/* Quiz Attempt History Table */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <TrophyIcon size={20} className="text-amber-400" />
          Championship Attempt History
        </h2>

        {stats?.recent_attempts && stats.recent_attempts.length > 0 ? (
          <div className="rounded-2xl glass-card border border-[#1f273d] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-[#0c0f1a] text-gray-400 border-b border-[#1f273d] uppercase text-[10px] tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Round</th>
                    <th className="py-3 px-4">Completed</th>
                    <th className="py-3 px-4">Score</th>
                    <th className="py-3 px-4">Accuracy</th>
                    <th className="py-3 px-4">Performance (C / I / U)</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#181f33] text-gray-300">
                  {stats.recent_attempts.map((attempt) => (
                    <tr key={attempt.attempt_id} className="hover:bg-[#121626] transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-white">
                        Round #{attempt.round_number}: {attempt.round_title}
                      </td>
                      <td className="py-3.5 px-4 text-gray-400">
                        {attempt.completed_at ? new Date(attempt.completed_at).toLocaleDateString() : "—"}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-amber-400">
                        {attempt.total_score} Pts
                      </td>
                      <td className="py-3.5 px-4 font-semibold">
                        {attempt.accuracy_percentage}%
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-emerald-400 font-bold">{attempt.correct_count}</span> /{" "}
                        <span className="text-rose-400">{attempt.incorrect_count}</span> /{" "}
                        <span className="text-gray-500">{attempt.unanswered_count}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/scorecard/${attempt.attempt_id}`}
                          className="px-3 py-1.5 rounded-lg bg-[#182035] hover:bg-[#222c4a] text-amber-400 font-medium text-xs transition-colors"
                        >
                          View Scorecard
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="p-10 rounded-2xl glass-card border border-[#1f273d] text-center text-gray-400">
            <TrophyIcon size={36} className="mx-auto text-gray-600 mb-3" />
            <p className="text-base font-semibold text-white">No Championship Attempts Recorded Yet</p>
            <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
              Choose any of the rounds above to begin competing.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
