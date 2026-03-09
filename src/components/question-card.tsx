"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Question } from "@/lib/types";
import { getSupabase } from "@/lib/supabase";
import { getVisitorId } from "@/lib/utils/visitor";
import { useState } from "react";

interface QuestionCardProps {
  question: Question;
  liked: boolean;
  onLikeToggle: (questionId: string, liked: boolean) => void;
}

export function QuestionCard({ question, liked, onLikeToggle }: QuestionCardProps) {
  const [loading, setLoading] = useState(false);

  async function handleLike() {
    setLoading(true);
    const visitorId = getVisitorId();

    if (liked) {
      // 좋아요 취소
      await getSupabase()
        .from("likes")
        .delete()
        .eq("question_id", question.id)
        .eq("visitor_id", visitorId);

      await getSupabase().rpc("increment_like_count", { q_id: question.id, delta: -1 });

      onLikeToggle(question.id, false);
    } else {
      // 좋아요
      await getSupabase()
        .from("likes")
        .insert({ question_id: question.id, visitor_id: visitorId });

      await getSupabase().rpc("increment_like_count", { q_id: question.id, delta: 1 });

      onLikeToggle(question.id, true);
    }
    setLoading(false);
  }

  const timeAgo = getTimeAgo(question.created_at);

  return (
    <Card className={question.is_answered ? "opacity-60" : ""}>
      <CardContent className="flex items-start gap-3 p-4">
        <Button
          variant={liked ? "default" : "outline"}
          size="sm"
          className="flex-shrink-0 flex flex-col items-center min-w-[48px] h-auto py-1"
          onClick={handleLike}
          disabled={loading}
        >
          <span className="text-lg">▲</span>
          <span className="text-sm font-bold">{question.like_count}</span>
        </Button>
        <div className="flex-1 space-y-1">
          <p className="text-sm">{question.content}</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">{timeAgo}</span>
            {question.is_answered && (
              <Badge variant="secondary" className="text-xs">답변 완료</Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
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
