"use client";

import { Button } from "@/components/ui/button";
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

  return (
    <div className="flex items-start gap-2 py-2 border-b last:border-b-0">
      <Button
        variant={liked ? "default" : "outline"}
        size="sm"
        className="flex-shrink-0 flex flex-col items-center min-w-[36px] h-auto py-0.5 text-xs"
        onClick={handleLike}
        disabled={loading}
      >
        <span>▲</span>
        <span className="font-bold">{answer.like_count}</span>
      </Button>
      <div className="flex-1 space-y-0.5">
        <p className="text-xs font-medium text-gray-600">{answer.nickname || "익명"}</p>
        <p className="text-sm">{answer.content}</p>
        <span className="text-xs text-gray-400">{timeAgo}</span>
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
