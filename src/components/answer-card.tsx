"use client";

import { Answer } from "@/lib/types";
import { getSupabase } from "@/lib/supabase";
import { getVisitorId } from "@/lib/utils/visitor";
import { useState } from "react";

interface AnswerCardProps {
  answer: Answer;
  liked: boolean;
  onLikeToggle: (answerId: string, liked: boolean) => void;
}

export function AnswerCard({ answer, liked, onLikeToggle }: AnswerCardProps) {
  const [loading, setLoading] = useState(false);

  async function handleLike() {
    setLoading(true);
    const visitorId = getVisitorId();

    if (liked) {
      await getSupabase()
        .from("likes")
        .delete()
        .eq("answer_id", answer.id)
        .eq("visitor_id", visitorId);
      await getSupabase().rpc("increment_answer_like_count", { a_id: answer.id, delta: -1 });
      onLikeToggle(answer.id, false);
    } else {
      await getSupabase()
        .from("likes")
        .insert({ answer_id: answer.id, visitor_id: visitorId });
      await getSupabase().rpc("increment_answer_like_count", { a_id: answer.id, delta: 1 });
      onLikeToggle(answer.id, true);
    }
    setLoading(false);
  }

  const timeAgo = getTimeAgo(answer.created_at);
  const initial = (answer.nickname || "익명").charAt(0);

  return (
    <div className="flex items-start gap-2 py-2">
      <button
        onClick={handleLike}
        disabled={loading}
        className={`flex-shrink-0 flex flex-col items-center justify-center w-8 h-10 rounded-lg transition-all text-[10px] ${
          liked
            ? "bg-violet-500 text-white shadow-sm"
            : "bg-gray-50 text-gray-400 hover:bg-violet-50 hover:text-violet-500 border border-gray-100"
        }`}
      >
        <span>▲</span>
        <span className="font-bold">{answer.like_count}</span>
      </button>
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-300 to-violet-300 flex items-center justify-center text-white text-[7px] font-bold flex-shrink-0">
            {initial}
          </div>
          <span className="text-[10px] font-semibold text-gray-600">
            {answer.nickname || "익명"}
          </span>
          <span className="text-[10px] text-gray-300">·</span>
          <span className="text-[10px] text-gray-400">{timeAgo}</span>
        </div>
        <p className="text-xs text-gray-700 leading-relaxed">{answer.content}</p>
      </div>
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}
