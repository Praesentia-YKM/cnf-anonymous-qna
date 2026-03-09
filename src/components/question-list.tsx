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
  eventCode: string;
  initialQuestions: Question[];
  isActive: boolean;
  isAdmin?: boolean;
}

export function QuestionList({
  eventId,
  eventCode,
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
        .eq("visitor_id", visitorId)
        .not("question_id", "is", null);

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
            setQuestions((prev) => {
              const newQ = payload.new as Question;
              if (prev.some((q) => q.id === newQ.id)) return prev;
              return [newQ, ...prev];
            });
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

  function handleOptimisticAdd(question: Question) {
    setQuestions((prev) => {
      if (prev.some((q) => q.id === question.id)) return prev;
      return [question, ...prev];
    });
  }

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
      <QuestionForm
        eventId={eventId}
        eventCode={eventCode}
        isActive={isActive}
        onOptimisticAdd={handleOptimisticAdd}
      />

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500">
          {questions.length}개의 질문
        </span>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          <button
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              sortMode === "popular"
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setSortMode("popular")}
          >
            인기순
          </button>
          <button
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              sortMode === "recent"
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setSortMode("recent")}
          >
            최신순
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {sorted.map((question) => (
          <QuestionCard
            key={question.id}
            question={question}
            liked={likedIds.has(question.id)}
            onLikeToggle={handleLikeToggle}
            eventCode={eventCode}
            eventId={eventId}
            isAdmin={isAdmin}
            onMarkAnswered={handleMarkAnswered}
          />
        ))}
        {sorted.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-gray-400 font-medium">아직 질문이 없습니다</p>
            <p className="text-gray-300 text-sm mt-1">첫 번째 질문을 남겨보세요!</p>
          </div>
        )}
      </div>
    </div>
  );
}
