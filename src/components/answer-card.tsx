"use client";

import { Answer } from "@/lib/types";
import { Textarea } from "@/components/ui/textarea";
import { Heart } from "lucide-react";
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
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(answer.content);
  const [saving, setSaving] = useState(false);

  const visitorId = getVisitorId();
  const isMine = answer.visitor_id && answer.visitor_id === visitorId;

  async function handleLike() {
    setLoading(true);

    try {
      if (liked) {
        await getSupabase()
          .from("likes")
          .delete()
          .eq("answer_id", answer.id)
          .eq("visitor_id", visitorId);
        onLikeToggle(answer.id, false);
      } else {
        await getSupabase()
          .from("likes")
          .insert({ answer_id: answer.id, visitor_id: visitorId });
        onLikeToggle(answer.id, true);
      }

      // 실제 좋아요 수를 count하여 like_count 동기화
      const { count } = await getSupabase()
        .from("likes")
        .select("id", { count: "exact", head: true })
        .eq("answer_id", answer.id);

      await getSupabase()
        .from("answers")
        .update({ like_count: count ?? 0 })
        .eq("id", answer.id);
    } catch (err) {
      console.error("답변 좋아요 처리 실패:", err);
    }
    setLoading(false);
  }

  async function handleEdit() {
    if (!editContent.trim() || saving) return;
    setSaving(true);
    const res = await fetch("/api/answers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: answer.id,
        content: editContent.trim(),
        visitor_id: visitorId,
      }),
    });
    if (res.ok) {
      setEditing(false);
    }
    setSaving(false);
  }

  const timeAgo = getTimeAgo(answer.created_at);
  const initial = (answer.nickname || "익명").charAt(0);

  return (
    <div className="flex items-start gap-2 py-2">
      <button
        onClick={handleLike}
        disabled={loading}
        className={`flex-shrink-0 flex flex-col items-center justify-center w-8 h-10 rounded-lg transition-all text-[10px] cursor-pointer gap-0.5 ${
          liked
            ? "bg-rose-500 text-white shadow-sm"
            : "bg-gray-50 text-gray-400 hover:bg-rose-50 hover:text-rose-500 shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
        }`}
      >
        <Heart className={`w-3 h-3 ${liked ? "fill-white" : ""}`} />
        <span className="font-bold">{answer.like_count}</span>
      </button>
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-[7px] font-bold flex-shrink-0">
            {initial}
          </div>
          <span className="text-[10px] font-semibold text-gray-600">
            {answer.nickname || "익명"}
          </span>
          <span className="text-[10px] text-gray-400">·</span>
          <span className="text-[10px] text-gray-500">{timeAgo}</span>
          {isMine && !editing && (
            <button
              className="text-[10px] text-gray-400 hover:text-violet-500 transition-colors cursor-pointer ml-1"
              onClick={() => setEditing(true)}
            >
              수정
            </button>
          )}
        </div>
        {editing ? (
          <div className="space-y-1.5">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              maxLength={500}
              rows={2}
              className="text-xs resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleEdit}
                disabled={saving || !editContent.trim()}
                className="text-[10px] font-medium text-white bg-violet-500 hover:bg-violet-600 px-2 py-0.5 rounded-md transition-colors"
              >
                {saving ? "저장 중..." : "저장"}
              </button>
              <button
                onClick={() => { setEditing(false); setEditContent(answer.content); }}
                className="text-[10px] font-medium text-gray-500 hover:text-gray-700 px-2 py-0.5 rounded-md transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-700 leading-relaxed">{answer.content}</p>
        )}
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
