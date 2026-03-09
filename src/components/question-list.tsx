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

      const { data, error } = await getSupabase()
        .from("likes")
        .select("question_id")
        .eq("visitor_id", visitorId)
        .not("question_id", "is", null);

      if (error) {
        console.error("좋아요 목록 로드 실패:", error);
        return;
      }
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

  function handleLikeCountChange(questionId: string, delta: number) {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? { ...q, like_count: Math.max(0, q.like_count + delta) }
          : q
      )
    );
  }

  async function handleToggleAnswered(questionId: string, answered: boolean) {
    setQuestions((prev) =>
      prev.map((q) => q.id === questionId ? { ...q, is_answered: answered } : q)
    );
    await getSupabase()
      .from("questions")
      .update({ is_answered: answered })
      .eq("id", questionId);
  }

  async function handleTogglePin(questionId: string, pinned: boolean) {
    setQuestions((prev) =>
      prev.map((q) => q.id === questionId ? { ...q, is_pinned: pinned } : q)
    );
    await getSupabase()
      .from("questions")
      .update({ is_pinned: pinned })
      .eq("id", questionId);
  }

  const sorted = [...questions].sort((a, b) => {
    // 고정된 질문을 항상 상단에
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
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
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {questions.length}개의 질문
        </span>
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
          <button
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              sortMode === "popular"
                ? "bg-white dark:bg-gray-700 text-violet-600 dark:text-violet-400 shadow-[0_1px_4px_rgba(0,0,0,0.1)]"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
            onClick={() => setSortMode("popular")}
          >
            인기순
          </button>
          <button
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              sortMode === "recent"
                ? "bg-white dark:bg-gray-700 text-violet-600 dark:text-violet-400 shadow-[0_1px_4px_rgba(0,0,0,0.1)]"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
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
            onLikeCountChange={handleLikeCountChange}
            eventCode={eventCode}
            eventId={eventId}
            isAdmin={isAdmin}
            onToggleAnswered={handleToggleAnswered}
            onTogglePin={handleTogglePin}
          />
        ))}
        {sorted.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-gray-400 dark:text-gray-500 font-medium">아직 질문이 없습니다</p>
            <p className="text-gray-300 dark:text-gray-600 text-sm mt-1">첫 번째 질문을 남겨보세요!</p>
          </div>
        )}
      </div>
    </div>
  );
}
