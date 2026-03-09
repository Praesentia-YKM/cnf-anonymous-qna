"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { getNickname } from "@/lib/utils/nickname";
import { getVisitorId } from "@/lib/utils/visitor";
import { Question } from "@/lib/types";
import { useState } from "react";

interface QuestionFormProps {
  eventId: string;
  eventCode: string;
  isActive: boolean;
  onOptimisticAdd?: (question: Question) => void;
}

export function QuestionForm({ eventId, eventCode, isActive, onOptimisticAdd }: QuestionFormProps) {
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

    const res = await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_id: eventId,
        content: trimmed,
        nickname: nick,
        visitor_id: getVisitorId(),
      }),
    });
    const data = res.ok ? await res.json() : null;

    if (data && onOptimisticAdd) {
      onOptimisticAdd(data);
    }

    setLoading(false);
  }

  if (!isActive) {
    return (
      <Card className="border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
        <CardContent className="text-center text-gray-400 py-6">
          질문 접수가 종료되었습니다
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-gray-800 shadow-[0_4px_16px_rgba(139,92,246,0.1)] dark:shadow-[0_4px_16px_rgba(139,92,246,0.05)]">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
              {(nickname || "익명").charAt(0)}
            </div>
            <span className="text-sm text-gray-700 dark:text-gray-300 font-semibold">
              {nickname || "익명"}
            </span>
          </div>
          <Textarea
            placeholder="궁금한 것을 자유롭게 질문해보세요..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={500}
            rows={3}
            className="resize-none"
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500 dark:text-gray-400">{content.length}/500</span>
            <Button
              type="submit"
              disabled={!content.trim() || loading}
              className="bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 text-white shadow-sm"
            >
              {loading ? "전송 중..." : "질문하기"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
