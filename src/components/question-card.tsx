"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Question } from "@/lib/types";
import { getSupabase } from "@/lib/supabase";
import { getVisitorId } from "@/lib/utils/visitor";
import { useEffect, useState } from "react";
import { AnswerList } from "./answer-list";

interface QuestionCardProps {
  question: Question;
  liked: boolean;
  onLikeToggle: (questionId: string, liked: boolean) => void;
  onLikeCountChange: (questionId: string, delta: number) => void;
  eventCode: string;
  eventId?: string;
  isAdmin?: boolean;
  onMarkAnswered?: (questionId: string) => void;
}

export function QuestionCard({
  question,
  liked,
  onLikeToggle,
  onLikeCountChange,
  eventCode,
  eventId,
  isAdmin = false,
  onMarkAnswered,
}: QuestionCardProps) {
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [answerCount, setAnswerCount] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(question.content);
  const [saving, setSaving] = useState(false);

  const visitorId = getVisitorId();
  const isMine = question.visitor_id && question.visitor_id === visitorId;

  // 답변 개수 초기 로드 (펼치지 않아도 표시)
  useEffect(() => {
    async function loadCount() {
      const { count } = await getSupabase()
        .from("answers")
        .select("id", { count: "exact", head: true })
        .eq("question_id", question.id);
      setAnswerCount(count ?? 0);
    }
    loadCount();
  }, [question.id]);

  async function handleLike() {
    setLoading(true);

    try {
      // DB에서 실제 좋아요 상태 확인 (stale UI 방지)
      const { data: existingLike } = await getSupabase()
        .from("likes")
        .select("id")
        .eq("question_id", question.id)
        .eq("visitor_id", visitorId)
        .maybeSingle();

      const actuallyLiked = !!existingLike;
      const delta = actuallyLiked ? -1 : 1;

      // 낙관적 업데이트
      onLikeToggle(question.id, !actuallyLiked);
      onLikeCountChange(question.id, delta);

      if (actuallyLiked) {
        const { error: deleteError } = await getSupabase()
          .from("likes")
          .delete()
          .eq("question_id", question.id)
          .eq("visitor_id", visitorId);
        if (deleteError) throw deleteError;
      } else {
        const { error: insertError } = await getSupabase()
          .from("likes")
          .insert({ question_id: question.id, visitor_id: visitorId });
        if (insertError) throw insertError;
      }

      const { error: rpcError } = await getSupabase().rpc("increment_like_count", {
        q_id: question.id,
        delta,
      });
      if (rpcError) throw rpcError;
    } catch (err) {
      console.error("좋아요 처리 실패:", err);
      // 실패 시 전체 상태 재동기화
      const { data: likes } = await getSupabase()
        .from("likes")
        .select("id")
        .eq("question_id", question.id)
        .eq("visitor_id", visitorId)
        .maybeSingle();
      onLikeToggle(question.id, !!likes);
    } finally {
      setLoading(false);
    }
  }

  async function handleEdit() {
    if (!editContent.trim() || saving) return;
    setSaving(true);
    const res = await fetch("/api/questions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: question.id,
        content: editContent.trim(),
        visitor_id: visitorId,
      }),
    });
    if (res.ok) {
      setEditing(false);
    }
    setSaving(false);
  }

  const timeAgo = getTimeAgo(question.created_at);
  const initial = (question.nickname || "익명").charAt(0);

  return (
    <Card className={`bg-white transition-all ${question.is_answered ? "opacity-60" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <button
            onClick={handleLike}
            disabled={loading}
            className={`flex-shrink-0 flex flex-col items-center justify-center w-12 h-14 rounded-xl transition-all cursor-pointer ${
              liked
                ? "bg-violet-500 text-white shadow-md shadow-violet-200"
                : "bg-gray-50 text-gray-600 hover:bg-violet-50 hover:text-violet-500 shadow-[0_1px_4px_rgba(0,0,0,0.1)]"
            }`}
          >
            <span className="text-sm">▲</span>
            <span className="text-sm font-bold">{question.like_count}</span>
          </button>

          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 shadow-sm">
                {initial}
              </div>
              <span className="text-xs font-semibold text-gray-700">
                {question.nickname || "익명"}
              </span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-500">{timeAgo}</span>
              {question.is_answered && (
                <Badge className="bg-green-100 text-green-700 text-[10px] border-0">답변 완료</Badge>
              )}
            </div>

            {editing ? (
              <div className="space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  maxLength={500}
                  rows={3}
                  className="text-sm resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleEdit}
                    disabled={saving || !editContent.trim()}
                    className="text-xs font-medium text-white bg-violet-500 hover:bg-violet-600 px-3 py-1 rounded-lg transition-colors"
                  >
                    {saving ? "저장 중..." : "저장"}
                  </button>
                  <button
                    onClick={() => { setEditing(false); setEditContent(question.content); }}
                    className="text-xs font-medium text-gray-500 hover:text-gray-700 px-3 py-1 rounded-lg transition-colors"
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-900 leading-relaxed font-medium">{question.content}</p>
            )}

            <div className="flex items-center gap-3 pt-1">
              <button
                className="text-xs text-violet-500 font-medium hover:text-violet-600 transition-colors flex items-center gap-1.5 cursor-pointer"
                onClick={() => setExpanded(!expanded)}
              >
                <span>💬</span>
                <span>{expanded ? "답변 접기" : "답변 보기"}</span>
                {answerCount !== null && answerCount > 0 && (
                  <span className="bg-violet-100 text-violet-600 rounded-full px-1.5 py-0.5 text-[10px] font-bold">
                    {answerCount}
                  </span>
                )}
              </button>
              {isMine && !editing && (
                <button
                  className="text-xs text-gray-400 hover:text-violet-500 transition-colors cursor-pointer"
                  onClick={() => setEditing(true)}
                >
                  수정
                </button>
              )}
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
