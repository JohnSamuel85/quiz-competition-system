export const API_BASE = ""; // Relative paths automatically routed through Next.js rewrites

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  is_admin: boolean;
  created_at: string;
}

export interface QuestionSanitized {
  id: number;
  question_order: number;
  category: string;
  difficulty: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  bible_reference?: string | null;
}

export interface RoundSummary {
  id: number;
  round_number: number;
  title: string;
  description?: string | null;
  total_questions: number;
  is_active: boolean;
  user_attempted_today: boolean;
  latest_score?: number | null;
  latest_accuracy?: number | null;
  latest_attempt_id?: number | null;
}

export interface StartAttemptResponse {
  attempt_id: number;
  round_id: number;
  round_number: number;
  round_title: string;
  total_questions: number;
  started_at: string;
  questions: QuestionSanitized[];
}

export interface SubmitAnswerResponse {
  success: boolean;
  question_id: number;
  saved: boolean;
  is_last_question: boolean;
  correct_answer?: string;
  is_correct?: boolean;
  explanation?: string;
  bible_reference?: string | null;
}

export interface QuestionReviewItem {
  question_id: number;
  question_order: number;
  category: string;
  difficulty: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  selected_option: string | null;
  correct_answer: string;
  is_correct: boolean;
  explanation: string;
  bible_reference?: string | null;
  time_taken_seconds: number;
}

export interface ScorecardResponse {
  attempt_id: number;
  round_id: number;
  round_number: number;
  round_title: string;
  started_at: string;
  completed_at?: string | null;
  total_score: number;
  total_questions: number;
  correct_count: number;
  incorrect_count: number;
  unanswered_count: number;
  accuracy_percentage: number;
  total_time_seconds: number;
  bible_correct: number;
  bible_total: number;
  gk_correct: number;
  gk_total: number;
  user_full_name: string;
  questions_review: QuestionReviewItem[];
}

export interface UserStatsResponse {
  total_attempts: number;
  total_rounds_completed: number;
  overall_accuracy: number;
  total_correct: number;
  total_questions_answered: number;
  best_score: number;
  bible_accuracy: number;
  gk_accuracy: number;
  recent_attempts: Array<{
    attempt_id: number;
    round_id: number;
    round_number: number;
    round_title: string;
    completed_at: string | null;
    total_score: number;
    correct_count: number;
    incorrect_count: number;
    unanswered_count: number;
    accuracy_percentage: number;
    total_time_seconds: number;
  }>;
}

export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<any> {
  const token = typeof window !== "undefined" ? localStorage.getItem("aethelgard_token") : null;
  
  const headers = new Headers(options.headers || {});
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = `Request failed (${response.status})`;
    try {
      const errorJson = await response.json();
      if (typeof errorJson.detail === "string") {
        errorDetail = errorJson.detail;
      } else if (errorJson.detail?.message) {
        errorDetail = errorJson.detail.message;
      } else if (Array.isArray(errorJson.detail?.errors)) {
        errorDetail = errorJson.detail.errors.join("; ");
      }
    } catch {
      // fallback
    }
    throw new Error(errorDetail);
  }

  return response.json();
}
