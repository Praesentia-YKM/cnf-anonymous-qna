"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { Question } from "@/lib/types";
import { QuestionCard } from "./question-card";
import { QuestionForm } from "./question-form";
import { Button } from "@/components/ui/button";
import { getVisitorId } from "@/lib/utils/visitor";

type SortMode = "popular" | "recent";

interface QuestionListProps {
  eventId: string;
  initialQuestions: Question[];
  isActive: boolean;
  isAdmin?: boolean;
}

export function QuestionList({
  eventId,
  initialQuestions,
  isActive,
  isAdmin = false,
}: QuestionListProps) {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [sortMode, setSortMode] = useState<SortMode>("popular");
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  // 내가 좋아요한 질문 ID 로드
  useEffect(() => {
    async function loadLikes() {
      const visitorId = getVisitorId();
      if (!visitorId) return;

      const { data } = await getSupabase()
        .from("likes")
        .select("question_id")
        .eq("visitor_id", visitorId);

      if (data) {
        setLikedIds(new Set(data.map((l) => l.question_id)));
      }
    }
    loadLikes();
  }, []);

  // Supabase Realtime 구독
  useEffect(() => {
    const channel = getSupabase()
      .channel(`questions:${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "questions",
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setQuestions((prev) => [payload.new as Question, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setQuestions((prev) =>
              prev.map((q) =>
                q.id === (payload.new as Question).id
                  ? (payload.new as Question)
                  : q
              )
            );
          } else if (payload.eventType === "DELETE") {
            setQuestions((prev) =>
              prev.filter((q) => q.id !== (payload.old as Question).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      getSupabase().removeChannel(channel);
    };
  }, [eventId]);

  function handleLikeToggle(questionId: string, liked: boolean) {
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (liked) next.add(questionId);
      else next.delete(questionId);
      return next;
    });
  }

  async function handleMarkAnswered(questionId: string) {
    await getSupabase()
      .from("questions")
      .update({ is_answered: true })
      .eq("id", questionId);
  }

  const sorted = [...questions].sort((a, b) => {
    if (sortMode === "popular") return b.like_count - a.like_count;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="space-y-4">
      <QuestionForm eventId={eventId} isActive={isActive} />

      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">{questions.length}개의 질문</span>
        <div className="flex gap-1">
          <Button
            variant={sortMode === "popular" ? "default" : "ghost"}
            size="sm"
            onClick={() => setSortMode("popular")}
          >
            인기순
          </Button>
          <Button
            variant={sortMode === "recent" ? "default" : "ghost"}
            size="sm"
            onClick={() => setSortMode("recent")}
          >
            최신순
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {sorted.map((question) => (
          <div key={question.id}>
            <QuestionCard
              question={question}
              liked={likedIds.has(question.id)}
              onLikeToggle={handleLikeToggle}
            />
            {isAdmin && !question.is_answered && (
              <div className="flex justify-end mt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => handleMarkAnswered(question.id)}
                >
                  답변 완료 처리
                </Button>
              </div>
            )}
          </div>
        ))}
        {sorted.length === 0 && (
          <p className="text-center text-gray-400 py-8">
            아직 질문이 없습니다. 첫 번째 질문을 남겨보세요!
          </p>
        )}
      </div>
    </div>
  );
}
