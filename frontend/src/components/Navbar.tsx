"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../lib/auth-context";
import { TrophyIcon, BrainIcon, ShieldIcon, UserIcon, LogOutIcon, SparklesIcon } from "./Icons";

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#1f273d] bg-[#080a10]/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <TrophyIcon className="text-black" size={22} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-wider text-white">BIBLE QUIZ</span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                Masters
              </span>
            </div>
            <p className="text-[11px] text-gray-400 tracking-wide">Elite Bible & GK Competition</p>
          </div>
        </Link>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            className={`text-sm font-medium transition-colors ${
              pathname === "/" ? "text-amber-400" : "text-gray-300 hover:text-white"
            }`}
          >
            Arena Home
          </Link>
          <Link
            href="/dashboard"
            className={`text-sm font-medium transition-colors ${
              pathname === "/dashboard" ? "text-amber-400" : "text-gray-300 hover:text-white"
            }`}
          >
            My Dashboard
          </Link>
          {user?.is_admin && (
            <Link
              href="/admin"
              className={`flex items-center gap-1.5 text-sm font-medium px-2.5 py-1 rounded-md transition-colors ${
                pathname === "/admin"
                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                  : "text-indigo-400 hover:text-indigo-300"
              }`}
            >
              <ShieldIcon size={14} />
              Question Bank
            </Link>
          )}
        </nav>

        {/* User profile / login actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-white">{user.full_name}</span>
                <span className="text-[10px] text-amber-400/90 font-mono">
                  {user.is_admin ? "Grand Arbiter (Admin)" : "Championship Scholar"}
                </span>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-600 to-indigo-900 border border-indigo-400/30 flex items-center justify-center text-white text-xs font-bold">
                {user.username.slice(0, 2).toUpperCase()}
              </div>
              <button
                onClick={logout}
                title="Sign Out"
                className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
              >
                <LogOutIcon size={18} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-amber-500 hover:bg-amber-400 text-black shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5"
              >
                <SparklesIcon size={15} />
                Sign In / Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
