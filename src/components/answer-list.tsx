"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { getVisitorId } from "@/lib/utils/visitor";
import { Answer } from "@/lib/types";
import { AnswerCard } from "./answer-card";
import { AnswerForm } from "./answer-form";

interface AnswerListProps {
  questionId: string;
  eventCode: string;
  eventId?: string;
  onCountChange?: (count: number) => void;
}

export function AnswerList({ questionId, eventCode, eventId, onCountChange }: AnswerListProps) {
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  // 답변 + 좋아요 로드
  useEffect(() => {
    async function load() {
      const { data } = await getSupabase()
        .from("answers")
        .select("*")
        .eq("question_id", questionId)
        .order("like_count", { ascending: false });

      if (data) {
        setAnswers(data);
        onCountChange?.(data.length);
      }

      const visitorId = getVisitorId();
      if (visitorId) {
        const { data: likes } = await getSupabase()
          .from("likes")
          .select("answer_id")
          .eq("visitor_id", visitorId)
          .not("answer_id", "is", null);

        if (likes) {
          setLikedIds(new Set(likes.map((l) => l.answer_id)));
        }
      }
      setLoaded(true);
    }
    load();
  }, [questionId, onCountChange]);

  // Realtime 구독
  useEffect(() => {
    const channel = getSupabase()
      .channel(`answers:${questionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "answers",
          filter: `question_id=eq.${questionId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setAnswers((prev) => {
              const newA = payload.new as Answer;
              if (prev.some((a) => a.id === newA.id)) return prev;
              const next = [...prev, newA];
              onCountChange?.(next.length);
              return next;
            });
          } else if (payload.eventType === "UPDATE") {
            setAnswers((prev) =>
              prev.map((a) =>
                a.id === (payload.new as Answer).id ? (payload.new as Answer) : a
              )
            );
          } else if (payload.eventType === "DELETE") {
            setAnswers((prev) => {
              const next = prev.filter((a) => a.id !== (payload.old as Answer).id);
              onCountChange?.(next.length);
              return next;
            });
          }
        }
      )
      .subscribe();

    return () => {
      getSupabase().removeChannel(channel);
    };
  }, [questionId, onCountChange]);

  function handleOptimisticAdd(answer: Answer) {
    setAnswers((prev) => {
      if (prev.some((a) => a.id === answer.id)) return prev;
      const next = [...prev, answer];
      onCountChange?.(next.length);
      return next;
    });
  }

  function handleLikeToggle(answerId: string, liked: boolean) {
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (liked) next.add(answerId);
      else next.delete(answerId);
      return next;
    });
  }

  if (!loaded) {
    return (
      <div className="mt-3 pl-4 border-l-2 border-violet-100 dark:border-violet-900/30">
        <p className="text-xs text-gray-400 py-2 animate-pulse">답변 로딩 중...</p>
      </div>
    );
  }

  const sorted = [...answers].sort((a, b) => b.like_count - a.like_count);

  return (
    <div className="mt-3 pl-4 border-l-2 border-violet-100 dark:border-violet-900/30 space-y-1">
      {sorted.map((answer) => (
        <AnswerCard
          key={answer.id}
          answer={answer}
          liked={likedIds.has(answer.id)}
          onLikeToggle={handleLikeToggle}
        />
      ))}
      {sorted.length === 0 && (
        <p className="text-xs text-gray-400 py-2">아직 답변이 없습니다. 첫 답변을 남겨보세요!</p>
      )}
      <AnswerForm
        questionId={questionId}
        eventCode={eventCode}
        eventId={eventId}
        onOptimisticAdd={handleOptimisticAdd}
      />
    </div>
  );
}
