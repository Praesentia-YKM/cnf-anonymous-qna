"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Question } from "@/lib/types";
import { getSupabase } from "@/lib/supabase";
import { getVisitorId } from "@/lib/utils/visitor";
import { useState } from "react";
import { AnswerList } from "./answer-list";

interface QuestionCardProps {
  question: Question;
  liked: boolean;
  onLikeToggle: (questionId: string, liked: boolean) => void;
  eventCode: string;
  eventId?: string;
  isAdmin?: boolean;
  onMarkAnswered?: (questionId: string) => void;
}

export function QuestionCard({
  question,
  liked,
  onLikeToggle,
  eventCode,
  eventId,
  isAdmin = false,
  onMarkAnswered,
}: QuestionCardProps) {
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [answerCount, setAnswerCount] = useState<number | null>(null);

  async function handleLike() {
    setLoading(true);
    const visitorId = getVisitorId();

    if (liked) {
      await getSupabase()
        .from("likes")
        .delete()
        .eq("question_id", question.id)
        .eq("visitor_id", visitorId);
      await getSupabase().rpc("increment_like_count", { q_id: question.id, delta: -1 });
      onLikeToggle(question.id, false);
    } else {
      await getSupabase()
        .from("likes")
        .insert({ question_id: question.id, visitor_id: visitorId });
      await getSupabase().rpc("increment_like_count", { q_id: question.id, delta: 1 });
      onLikeToggle(question.id, true);
    }
    setLoading(false);
  }

  const timeAgo = getTimeAgo(question.created_at);
  const initial = (question.nickname || "익명").charAt(0);

  return (
    <Card className={`shadow-sm border-0 bg-white/90 backdrop-blur transition-all hover:shadow-md ${question.is_answered ? "opacity-60" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <button
            onClick={handleLike}
            disabled={loading}
            className={`flex-shrink-0 flex flex-col items-center justify-center w-12 h-14 rounded-xl transition-all ${
              liked
                ? "bg-violet-500 text-white shadow-md"
                : "bg-gray-50 text-gray-400 hover:bg-violet-50 hover:text-violet-500 border border-gray-100"
            }`}
          >
            <span className="text-sm">▲</span>
            <span className="text-sm font-bold">{question.like_count}</span>
          </button>

          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-300 to-blue-300 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                {initial}
              </div>
              <span className="text-xs font-semibold text-gray-600">
                {question.nickname || "익명"}
              </span>
              <span className="text-xs text-gray-300">·</span>
              <span className="text-xs text-gray-400">{timeAgo}</span>
              {question.is_answered && (
                <Badge className="bg-green-100 text-green-700 text-[10px] border-0">답변 완료</Badge>
              )}
            </div>

            <p className="text-sm text-gray-800 leading-relaxed">{question.content}</p>

            <div className="flex items-center gap-3 pt-1">
              <button
                className="text-xs text-gray-400 hover:text-violet-500 transition-colors flex items-center gap-1"
                onClick={() => setExpanded(!expanded)}
              >
                <span>{expanded ? "💬" : "💬"}</span>
                <span>{expanded ? "답변 접기" : "답변 보기"}</span>
                {answerCount !== null && answerCount > 0 && (
                  <span className="bg-violet-100 text-violet-600 rounded-full px-1.5 py-0.5 text-[10px] font-bold">
                    {answerCount}
                  </span>
                )}
              </button>
              {isAdmin && !question.is_answered && onMarkAnswered && (
                <button
                  className="text-xs text-gray-300 hover:text-green-500 transition-colors"
                  onClick={() => onMarkAnswered(question.id)}
                >
                  ✓ 답변 완료 처리
                </button>
              )}
            </div>

            {expanded && (
              <AnswerList
                questionId={question.id}
                eventCode={eventCode}
                eventId={eventId}
                onCountChange={setAnswerCount}
              />
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
