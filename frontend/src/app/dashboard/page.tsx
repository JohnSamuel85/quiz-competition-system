"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth-context";
import { fetchWithAuth, RoundSummary, UserStatsResponse } from "../../lib/api";
import {
  TrophyIcon,
  TimerIcon,
  BrainIcon,
  BookOpenIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  BarChartIcon,
  PlayIcon,
  SparklesIcon,
} from "../../components/Icons";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const [dailyRound, setDailyRound] = useState<RoundSummary | null>(null);
  const [stats, setStats] = useState<UserStatsResponse | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      Promise.all([
        fetchWithAuth("/api/rounds/daily").catch(() => null),
        fetchWithAuth("/api/auth/stats").catch(() => null),
      ])
        .then(([roundData, statsData]) => {
          if (roundData) setDailyRound(roundData);
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
          <p className="text-sm">Loading participant statistics...</p>
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
            Track your performance, review daily scorecards, and enter today's master round.
          </p>
        </div>

        {dailyRound && !dailyRound.user_attempted_today && (
          <Link
            href={`/quiz/${dailyRound.id}`}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-bold text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 shrink-0 group"
          >
            <PlayIcon size={18} />
            Enter Today's Arena
            <ArrowRightIcon size={15} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        )}
      </div>

      {/* Today's Competition Status Card */}
      {dailyRound && (
        <div
          className={`p-6 rounded-2xl glass-card border mb-10 transition-all ${
            dailyRound.user_attempted_today
              ? "border-emerald-500/30 bg-emerald-950/10"
              : "border-amber-500/30 bg-amber-950/10"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  dailyRound.user_attempted_today
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-amber-500/20 text-amber-400"
                }`}
              >
                {dailyRound.user_attempted_today ? <CheckCircleIcon size={24} /> : <TrophyIcon size={24} />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                      dailyRound.user_attempted_today
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                    }`}
                  >
                    {dailyRound.user_attempted_today ? "Completed Today" : "Available Today"}
                  </span>
                  <span className="text-xs text-gray-400">Round #{dailyRound.round_number}</span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1">{dailyRound.title}</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  50 Questions (25 Advanced Bible + 25 General Knowledge) • 20s per question
                </p>
              </div>
            </div>

            <div>
              {dailyRound.user_attempted_today ? (
                <Link
                  href={`/scorecard/${dailyRound.latest_attempt_id}`}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs tracking-wide transition-colors flex items-center gap-1.5"
                >
                  <CheckCircleIcon size={16} />
                  Inspect Scorecard ({dailyRound.latest_score} Pts • {dailyRound.latest_accuracy}%)
                </Link>
              ) : (
                <Link
                  href={`/quiz/${dailyRound.id}`}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs tracking-wide shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5"
                >
                  <PlayIcon size={16} />
                  Start Round ({dailyRound.total_questions} Questions)
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

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
              Your historical scorecards, question-by-question reviews, and accuracy percentages will be archived here.
            </p>
            {dailyRound && (
              <Link
                href={`/quiz/${dailyRound.id}`}
                className="mt-5 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-md transition-colors"
              >
                Launch Inaugural Round
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
