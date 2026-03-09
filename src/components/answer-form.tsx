"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getSupabase } from "@/lib/supabase";
import { getNickname } from "@/lib/utils/nickname";
import { Answer } from "@/lib/types";
import { useState } from "react";

interface AnswerFormProps {
  questionId: string;
  eventCode: string;
  onOptimisticAdd?: (answer: Answer) => void;
}

export function AnswerForm({ questionId, eventCode, onOptimisticAdd }: AnswerFormProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const nickname = getNickname(eventCode);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || loading) return;

    const trimmed = content.trim();
    const nick = nickname === "익명" ? null : nickname;

    setLoading(true);
    setContent("");

    const { data } = await getSupabase()
      .from("answers")
      .insert({
        question_id: questionId,
        content: trimmed,
        nickname: nick,
      })
      .select()
      .single();

    if (data && onOptimisticAdd) {
      onOptimisticAdd(data);
    }

    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="pt-2 space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-300 to-violet-300 flex items-center justify-center text-white text-[8px] font-bold flex-shrink-0">
          {(nickname || "익명").charAt(0)}
        </div>
        <span className="text-xs text-gray-500">{nickname || "익명"}</span>
      </div>
      <Textarea
        placeholder="답변을 입력하세요..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={500}
        rows={2}
        className="text-xs resize-none border-gray-200 focus:border-violet-300"
      />
      <div className="flex justify-between items-center">
        <span className="text-[10px] text-gray-400">{content.length}/500</span>
        <Button
          type="submit"
          size="sm"
          disabled={!content.trim() || loading}
          className="bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 text-white text-xs h-7 px-3"
        >
          {loading ? "전송 중..." : "답변하기"}
        </Button>
      </div>
    </form>
  );
}
