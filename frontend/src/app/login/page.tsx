"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth-context";
import { TrophyIcon, SparklesIcon, ShieldIcon, UserIcon } from "../../components/Icons";

export default function LoginPage() {
  const router = useRouter();
  const { login, register, guestDemoLogin } = useAuth();

  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (isRegister) {
        await register(username, email, password, fullName);
      } else {
        await login(username, password);
      }
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please verify credentials.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemo = async (role: "scholar" | "admin") => {
    setError(null);
    setSubmitting(true);
    try {
      await guestDemoLogin(role);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to log in with demo account.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 py-12 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] bg-gradient-to-tr from-amber-500/10 via-indigo-600/10 to-transparent blur-3xl pointer-events-none -z-10" />

      <div className="w-full max-w-md p-8 rounded-3xl glass-card border border-[#232b45] shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/20 mx-auto mb-4">
            <TrophyIcon className="text-black" size={28} />
          </div>
          <h2 className="text-2xl font-extrabold text-white">
            {isRegister ? "Join the Championship" : "Scholars Portal"}
          </h2>
          <p className="mt-1 text-xs text-gray-400">
            {isRegister
              ? "Register to participate in daily 50-question master competitions"
              : "Access your competition arena, live rounds, and historical scorecards"}
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Samuel Cherukuri"
                className="w-full px-4 py-2.5 rounded-xl bg-[#0c0f1a] border border-[#20273d] focus:border-amber-500 focus:outline-none text-sm text-white placeholder-gray-500 transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">
              {isRegister ? "Username" : "Username or Email"}
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={isRegister ? "e.g. theologist_prime" : "Enter username or email"}
              className="w-full px-4 py-2.5 rounded-xl bg-[#0c0f1a] border border-[#20273d] focus:border-amber-500 focus:outline-none text-sm text-white placeholder-gray-500 transition-colors"
            />
          </div>

          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="scholar@example.com"
                className="w-full px-4 py-2.5 rounded-xl bg-[#0c0f1a] border border-[#20273d] focus:border-amber-500 focus:outline-none text-sm text-white placeholder-gray-500 transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-4 py-2.5 rounded-xl bg-[#0c0f1a] border border-[#20273d] focus:border-amber-500 focus:outline-none text-sm text-white placeholder-gray-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm tracking-wide shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Authenticating..." : isRegister ? "Create Account" : "Enter Arena"}
          </button>
        </form>

        {/* Toggle Register / Login */}
        <div className="mt-6 text-center text-xs text-gray-400">
          {isRegister ? "Already registered?" : "New competitor?"}{" "}
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-4 ml-1"
          >
            {isRegister ? "Sign in to existing account" : "Create scholar account"}
          </button>
        </div>

        {/* Quick Demo Access Buttons */}
        <div className="mt-8 pt-6 border-t border-[#1e2538]">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 text-center mb-3">
            One-Click Evaluator Credentials
          </span>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleDemo("scholar")}
              disabled={submitting}
              className="px-3 py-2 rounded-xl bg-[#131726] hover:bg-[#1a2138] border border-[#232b45] text-xs font-medium text-gray-300 hover:text-white flex items-center justify-center gap-1.5 transition-colors"
            >
              <UserIcon size={14} className="text-amber-400" />
              Demo Scholar
            </button>
            <button
              type="button"
              onClick={() => handleDemo("admin")}
              disabled={submitting}
              className="px-3 py-2 rounded-xl bg-[#131726] hover:bg-[#1a2138] border border-[#232b45] text-xs font-medium text-gray-300 hover:text-white flex items-center justify-center gap-1.5 transition-colors"
            >
              <ShieldIcon size={14} className="text-indigo-400" />
              Demo Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
