"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getSupabase } from "@/lib/supabase";
import { getNickname } from "@/lib/utils/nickname";
import { useState } from "react";

interface QuestionFormProps {
  eventId: string;
  eventCode: string;
  isActive: boolean;
}

export function QuestionForm({ eventId, eventCode, isActive }: QuestionFormProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const nickname = getNickname(eventCode);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || loading) return;

    setLoading(true);
    await getSupabase().from("questions").insert({
      event_id: eventId,
      content: content.trim(),
      nickname: nickname === "익명" ? null : nickname,
    });
    setContent("");
    setLoading(false);
  }

  if (!isActive) {
    return (
      <div className="text-center text-gray-500 py-4">
        질문 접수가 종료되었습니다.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <p className="text-xs text-gray-500">
        {nickname || "익명"} 님으로 질문합니다
      </p>
      <Textarea
        placeholder="익명으로 질문을 남겨보세요..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={500}
        rows={3}
      />
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-400">{content.length}/500</span>
        <Button type="submit" disabled={!content.trim() || loading}>
          {loading ? "전송 중..." : "질문하기"}
        </Button>
      </div>
    </form>
  );
}
