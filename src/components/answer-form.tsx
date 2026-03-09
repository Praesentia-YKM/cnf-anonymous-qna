"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getSupabase } from "@/lib/supabase";
import { getNickname } from "@/lib/utils/nickname";
import { useState } from "react";

interface AnswerFormProps {
  questionId: string;
  eventCode: string;
}

export function AnswerForm({ questionId, eventCode }: AnswerFormProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || loading) return;

    const nickname = getNickname(eventCode);
    setLoading(true);
    await getSupabase().from("answers").insert({
      question_id: questionId,
      content: content.trim(),
      nickname: nickname === "익명" ? null : nickname,
    });
    setContent("");
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 pt-2">
      <Textarea
        placeholder="답변을 입력하세요..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={500}
        rows={2}
        className="text-sm"
      />
      <Button type="submit" size="sm" disabled={!content.trim() || loading}>
        {loading ? "..." : "답변"}
      </Button>
    </form>
  );
}
