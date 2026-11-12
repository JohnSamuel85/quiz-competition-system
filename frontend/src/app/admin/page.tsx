"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth-context";
import { fetchWithAuth } from "../../lib/api";
import {
  ShieldIcon,
  UploadIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  BookOpenIcon,
  BrainIcon,
  SparklesIcon,
} from "../../components/Icons";

const CHATGPT_PROMPT_TEMPLATE = `Please generate a 50-question master quiz competition JSON file adhering strictly to this schema:

{
  "round_number": 2,
  "title": "Championship Round 2 - Advanced Theology & Universal Sciences",
  "description": "50 high-difficulty questions: 25 Bible Knowledge + 25 General Knowledge.",
  "questions": [
    {
      "question_order": 1,
      "category": "Bible Knowledge",
      "difficulty": "Advanced",
      "question_text": "Precise, challenging question text here...",
      "options": {
        "A": "Option text 1",
        "B": "Option text 2",
        "C": "Option text 3",
        "D": "Option text 4"
      },
      "correct_answer": "B",
      "explanation": "Scholarly, concise explanation of the correct answer.",
      "bible_reference": "Book Chapter:Verse"
    }
    ...
  ]
}

STRICT CRITERIA:
1. Exactly 50 questions in the array.
2. Questions 1 to 25 MUST be "Bible Knowledge" (Advanced/Challenging) with exact bible_reference.
3. Questions 26 to 50 MUST be "General Knowledge" (Astrophysics, world history, classical literature, advanced science, philosophy) with "bible_reference": null.
4. Exactly four options per question keyed "A", "B", "C", "D". Only one option correct.
5. "correct_answer" must be strictly "A", "B", "C", or "D".
6. Output raw JSON only.`;

export default function AdminPortalPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const [rounds, setRounds] = useState<any[]>([]);
  const [jsonInput, setJsonInput] = useState<string>("");
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [importing, setImporting] = useState(false);
  const [validationReport, setValidationReport] = useState<{
    valid: boolean;
    total: number;
    bible: number;
    gk: number;
    errors: string[];
  } | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const loadRounds = () => {
    fetchWithAuth("/api/admin/rounds")
      .then((data) => setRounds(data))
      .catch((err) => console.error("Failed to load admin rounds:", err));
  };

  useEffect(() => {
    if (!isLoading && (!user || !user.is_admin)) {
      router.push("/dashboard");
      return;
    }
    if (user?.is_admin) {
      loadRounds();
    }
  }, [user, isLoading, router]);

  // Client-side quick validator
  const validateJson = (text: string) => {
    setImportSuccess(null);
    setImportError(null);
    if (!text.trim()) {
      setValidationReport(null);
      return;
    }

    try {
      const data = JSON.parse(text);
      const errors: string[] = [];
      if (!data.round_number || typeof data.round_number !== "number") {
        errors.push("Missing or invalid 'round_number'.");
      }
      if (!data.title || typeof data.title !== "string") {
        errors.push("Missing 'title'.");
      }
      if (!Array.isArray(data.questions)) {
        errors.push("'questions' must be an array.");
        setValidationReport({ valid: false, total: 0, bible: 0, gk: 0, errors });
        return;
      }

      const total = data.questions.length;
      let bible = 0;
      let gk = 0;

      data.questions.forEach((q: any, i: number) => {
        const cat = String(q.category || "").toLowerCase();
        if (cat.includes("bible")) bible++;
        else gk++;

        if (!q.options || typeof q.options !== "object") {
          errors.push(`Q#${i + 1}: Missing 'options' object.`);
        } else {
          for (const k of ["A", "B", "C", "D"]) {
            if (!q.options[k]) errors.push(`Q#${i + 1}: Missing option '${k}'.`);
          }
        }
        if (!["A", "B", "C", "D"].includes(String(q.correct_answer || "").toUpperCase())) {
          errors.push(`Q#${i + 1}: Invalid correct_answer '${q.correct_answer}'.`);
        }
      });

      if (total !== 50) {
        errors.push(`Round must contain exactly 50 questions (found ${total}).`);
      }
      if (bible !== 25) {
        errors.push(`Requires exactly 25 Bible Knowledge questions (found ${bible}).`);
      }
      if (gk !== 25) {
        errors.push(`Requires exactly 25 General Knowledge questions (found ${gk}).`);
      }

      setValidationReport({
        valid: errors.length === 0,
        total,
        bible,
        gk,
        errors,
      });
    } catch (e: any) {
      setValidationReport({
        valid: false,
        total: 0,
        bible: 0,
        gk: 0,
        errors: [`Invalid JSON Syntax: ${e.message}`],
      });
    }
  };

  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setJsonInput(val);
    validateJson(val);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonInput(content);
      validateJson(content);
    };
    reader.readAsText(file);
  };

  const handleImportSubmit = async () => {
    if (!validationReport?.valid) return;
    setImporting(true);
    setImportSuccess(null);
    setImportError(null);

    try {
      const parsed = JSON.parse(jsonInput);
      const res = await fetchWithAuth("/api/admin/import", {
        method: "POST",
        body: JSON.stringify(parsed),
      });

      setImportSuccess(res.message);
      setJsonInput("");
      setValidationReport(null);
      loadRounds();
    } catch (err: any) {
      setImportError(err.message || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const handleDeleteRound = async (id: number) => {
    if (!confirm("Are you sure you want to delete this round and all its questions?")) return;
    try {
      await fetchWithAuth(`/api/admin/rounds/${id}`, { method: "DELETE" });
      loadRounds();
    } catch (err: any) {
      alert(err.message || "Delete failed");
    }
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(CHATGPT_PROMPT_TEMPLATE);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2500);
  };

  if (isLoading || !user?.is_admin) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-gray-400">
        <p>Verifying administrative credentials...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-bold text-indigo-400 tracking-wider">
              Question Management Facility
            </span>
            <span className="text-gray-500">•</span>
            <span className="text-xs text-amber-400 font-semibold">Director Access</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Championship Question Bank</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Bulk-import ChatGPT-generated 50-question rounds and manage competition content.
          </p>
        </div>
      </div>

      {/* ChatGPT Prompt Generator Card */}
      <div className="p-6 rounded-2xl glass-card border border-indigo-500/20 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <SparklesIcon size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">ChatGPT Prompt Generator</h3>
              <p className="text-xs text-gray-400">
                Copy this pre-formatted prompt to have ChatGPT produce a 100% compliant 50-question round.
              </p>
            </div>
          </div>
          <button
            onClick={handleCopyPrompt}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs tracking-wide transition-colors shrink-0"
          >
            {copiedPrompt ? "✓ Prompt Copied to Clipboard!" : "Copy ChatGPT Prompt"}
          </button>
        </div>

        <pre className="p-4 rounded-xl bg-[#090c14] border border-[#1b2236] text-[11px] text-gray-400 font-mono overflow-x-auto max-h-40">
          {CHATGPT_PROMPT_TEMPLATE}
        </pre>
      </div>

      {/* Bulk Importer Section */}
      <div className="p-6 sm:p-8 rounded-2xl glass-card border border-[#232b45] mb-10 shadow-xl">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <UploadIcon size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Bulk Question Import Portal</h2>
              <p className="text-xs text-gray-400">
                Upload a JSON file or paste ChatGPT JSON output directly.
              </p>
            </div>
          </div>

          <label className="px-4 py-2 rounded-xl bg-[#182035] hover:bg-[#222c4a] border border-[#2b3552] text-xs font-semibold text-amber-400 cursor-pointer transition-colors flex items-center gap-1.5">
            <UploadIcon size={14} />
            Upload .json File
            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        {importSuccess && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
            <CheckCircleIcon size={18} />
            {importSuccess}
          </div>
        )}

        {importError && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center gap-2">
            <AlertCircleIcon size={18} />
            {importError}
          </div>
        )}

        {/* Textarea */}
        <textarea
          value={jsonInput}
          onChange={handleJsonChange}
          placeholder="Paste ChatGPT generated JSON object here (must contain round_number, title, and 50 questions)..."
          rows={10}
          className="w-full p-4 rounded-xl bg-[#0b0e18] border border-[#1e2538] focus:border-amber-500 focus:outline-none text-xs text-gray-200 font-mono placeholder-gray-600 transition-colors"
        />

        {/* Live Validation Diagnostics */}
        {validationReport && (
          <div className="mt-4 p-4 rounded-xl bg-[#0e1220] border border-[#1f273d] text-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-2 font-semibold">
              <span className={validationReport.valid ? "text-emerald-400" : "text-amber-400"}>
                {validationReport.valid ? "✓ Schema Validation Passed (100% Compliant)" : "⚠ Validation Issues Found"}
              </span>
              <div className="flex items-center gap-3 text-gray-400 font-mono text-[11px]">
                <span>Total: {validationReport.total} / 50</span>
                <span>Bible: {validationReport.bible} / 25</span>
                <span>GK: {validationReport.gk} / 25</span>
              </div>
            </div>

            {validationReport.errors.length > 0 && (
              <ul className="list-disc list-inside space-y-1 text-red-400/90 max-h-32 overflow-y-auto">
                {validationReport.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Import Action */}
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            disabled={!validationReport?.valid || importing}
            onClick={handleImportSubmit}
            className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs tracking-wider uppercase transition-all shadow-lg shadow-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {importing ? "Importing & Seeding Database..." : "Commit Round to Database"}
          </button>
        </div>
      </div>

      {/* Active Rounds Table */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <BookOpenIcon size={20} className="text-amber-400" />
          Active Competition Rounds in Database ({rounds.length})
        </h2>

        <div className="rounded-2xl glass-card border border-[#1f273d] overflow-hidden">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#0c0f1a] text-gray-400 border-b border-[#1f273d] uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Round</th>
                <th className="py-3 px-4">Questions</th>
                <th className="py-3 px-4">Distribution</th>
                <th className="py-3 px-4">Attempts</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#181f33] text-gray-300">
              {rounds.map((r) => (
                <tr key={r.id} className="hover:bg-[#121626] transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-white">
                    Round #{r.round_number}: {r.title}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                    {r.total_questions} Questions
                  </td>
                  <td className="py-3.5 px-4 text-gray-400">
                    {r.bible_questions} Bible / {r.gk_questions} GK
                  </td>
                  <td className="py-3.5 px-4 text-gray-400 font-mono">
                    {r.attempts_count} participants
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleDeleteRound(r.id)}
                      className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
