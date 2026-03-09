# 익명 답변 + 닉네임 기능 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 질문에 대한 익명 답변 기능 + 이벤트별 닉네임 설정 기능을 추가한다.

**Architecture:** 기존 questions 테이블에 nickname 컬럼 추가, answers 테이블 신규 생성. likes 테이블을 answer에도 적용되도록 확장. 닉네임은 localStorage에 이벤트별로 저장하고, 이벤트 페이지 진입 시 닉네임 입력 화면을 표시한다.

**Tech Stack:** Next.js 15 (App Router), Supabase (PostgreSQL + Realtime), Tailwind CSS, shadcn/ui, TypeScript

**설계 문서:** `docs/plans/2026-03-09-answers-nickname-design.md`

---

## Task 1: DB 마이그레이션 + 타입 확장

**Files:**
- Create: `supabase/migration-002-answers-nickname.sql`
- Modify: `src/lib/types.ts`

**Step 1: 마이그레이션 SQL 작성**

`supabase/migration-002-answers-nickname.sql`:
```sql
-- 1. questions 테이블에 nickname 추가
ALTER TABLE questions ADD COLUMN nickname VARCHAR(30);

-- 2. answers 테이블 생성
CREATE TABLE answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  nickname VARCHAR(30),
  like_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_answers_question_id ON answers(question_id);

-- 3. answers Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE answers;

-- 4. answers RLS
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "answers_select" ON answers FOR SELECT USING (true);
CREATE POLICY "answers_insert" ON answers FOR INSERT WITH CHECK (true);
CREATE POLICY "answers_update" ON answers FOR UPDATE USING (true);

-- 5. likes 테이블 확장 (answer_id 추가)
ALTER TABLE likes ALTER COLUMN question_id DROP NOT NULL;
ALTER TABLE likes ADD COLUMN answer_id UUID REFERENCES answers(id) ON DELETE CASCADE;
ALTER TABLE likes ADD CONSTRAINT likes_answer_visitor_unique UNIQUE (answer_id, visitor_id);
ALTER TABLE likes ADD CONSTRAINT likes_target_check CHECK (
  (question_id IS NOT NULL AND answer_id IS NULL) OR
  (question_id IS NULL AND answer_id IS NOT NULL)
);

-- 6. answer 좋아요 RPC 함수
CREATE OR REPLACE FUNCTION increment_answer_like_count(a_id UUID, delta INTEGER)
RETURNS void AS $$
  UPDATE answers SET like_count = GREATEST(like_count + delta, 0) WHERE id = a_id;
$$ LANGUAGE sql;
```

**Step 2: 타입 확장**

`src/lib/types.ts`에 Answer 인터페이스 추가, Question에 nickname 추가:
```typescript
export interface Question {
  id: string;
  event_id: string;
  content: string;
  nickname: string | null;
  like_count: number;
  is_answered: boolean;
  created_at: string;
}

export interface Answer {
  id: string;
  question_id: string;
  content: string;
  nickname: string | null;
  like_count: number;
  created_at: string;
}
```

**Step 3: schema.sql도 최신 상태로 업데이트**

`supabase/schema.sql`의 questions 테이블에 `nickname VARCHAR(30)` 추가, answers 테이블 정의 추가.

**Step 4: 커밋**

```bash
git add supabase/ src/lib/types.ts
git commit -m "DB 마이그레이션: answers 테이블 + nickname 컬럼 추가"
```

---

## Task 2: 닉네임 유틸리티 + 닉네임 입력 컴포넌트

**Files:**
- Create: `src/lib/utils/nickname.ts`
- Create: `src/components/nickname-gate.tsx`

**Step 1: 닉네임 유틸리티**

`src/lib/utils/nickname.ts`:
```typescript
"use client";

export function getNickname(eventCode: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(`anonymous-qna-nickname-${eventCode}`);
}

export function setNickname(eventCode: string, nickname: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`anonymous-qna-nickname-${eventCode}`, nickname);
}

export function hasNickname(eventCode: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(`anonymous-qna-nickname-${eventCode}`) !== null;
}
```

**Step 2: 닉네임 게이트 컴포넌트**

이벤트 페이지 진입 시 닉네임 설정 여부를 확인하고, 미설정 시 입력 화면을 표시하는 컴포넌트.

`src/components/nickname-gate.tsx`:
```tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { hasNickname, setNickname, getNickname } from "@/lib/utils/nickname";

interface NicknameGateProps {
  eventCode: string;
  children: React.ReactNode;
}

export function NicknameGate({ eventCode, children }: NicknameGateProps) {
  const [ready, setReady] = useState(false);
  const [input, setInput] = useState("");

  useEffect(() => {
    if (hasNickname(eventCode)) {
      setReady(true);
    }
  }, [eventCode]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = input.trim() || "익명";
    setNickname(eventCode, name);
    setReady(true);
  }

  if (!ready) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-lg text-center">닉네임 설정</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  placeholder="닉네임 (비워두면 '익명')"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  maxLength={30}
                  autoFocus
                />
                <p className="text-xs text-gray-400">이 이벤트에서 사용할 닉네임입니다</p>
              </div>
              <Button type="submit" className="w-full">
                참여하기
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    );
  }

  return <>{children}</>;
}
```

**Step 3: 커밋**

```bash
git add src/lib/utils/nickname.ts src/components/nickname-gate.tsx
git commit -m "닉네임 유틸리티 + 닉네임 게이트 컴포넌트"
```

---

## Task 3: 이벤트 페이지에 닉네임 게이트 적용 + 질문 폼에 닉네임 반영

**Files:**
- Modify: `src/app/event/[code]/page.tsx`
- Modify: `src/app/event/[code]/admin/page.tsx`
- Modify: `src/components/question-form.tsx`
- Modify: `src/components/question-list.tsx`

**Step 1: 이벤트 페이지에 NicknameGate 래핑 + eventCode prop 전달**

`src/app/event/[code]/page.tsx`에서:
- `NicknameGate`로 `QuestionList`를 감싸기
- `QuestionList`에 `eventCode` prop 추가

```tsx
import { NicknameGate } from "@/components/nickname-gate";

// return 부분:
<NicknameGate eventCode={event.code}>
  <div className="max-w-2xl mx-auto p-4 space-y-4">
    <div className="text-center space-y-1">
      <h1 className="text-2xl font-bold">{event.title}</h1>
      <p className="text-sm text-gray-500">코드: {event.code}</p>
    </div>
    <QuestionList
      eventId={event.id}
      eventCode={event.code}
      initialQuestions={questions ?? []}
      isActive={event.is_active}
    />
  </div>
</NicknameGate>
```

**Step 2: admin 페이지도 동일하게 NicknameGate 래핑 + eventCode 전달**

**Step 3: QuestionList에 eventCode prop 추가**

`src/components/question-list.tsx`의 `QuestionListProps`에 `eventCode: string` 추가.
`QuestionForm`에도 `eventCode` 전달.

**Step 4: QuestionForm에 닉네임 반영**

`src/components/question-form.tsx`:
- `eventCode` prop 추가
- `getNickname(eventCode)`로 닉네임 가져오기
- insert 시 `nickname` 필드 포함
- 폼 위에 "OO 님으로 질문" 표시

```tsx
import { getNickname } from "@/lib/utils/nickname";

// props에 eventCode 추가
interface QuestionFormProps {
  eventId: string;
  eventCode: string;
  isActive: boolean;
}

// 컴포넌트 내부:
const nickname = getNickname(eventCode);

// insert 시:
await getSupabase().from("questions").insert({
  event_id: eventId,
  content: content.trim(),
  nickname: nickname === "익명" ? null : nickname,
});

// JSX에 닉네임 표시 추가 (Textarea 위):
<p className="text-xs text-gray-500">
  {nickname || "익명"} 님으로 질문합니다
</p>
```

**Step 5: 커밋**

```bash
git add src/app/event/ src/components/question-form.tsx src/components/question-list.tsx
git commit -m "닉네임 게이트 적용 + 질문에 닉네임 반영"
```

---

## Task 4: 질문 카드에 닉네임 표시 + 답변 펼침 UI

**Files:**
- Modify: `src/components/question-card.tsx`
- Create: `src/components/answer-list.tsx`
- Create: `src/components/answer-form.tsx`
- Create: `src/components/answer-card.tsx`

**Step 1: question-card.tsx에 닉네임 표시 + 답변 펼침 버튼**

`src/components/question-card.tsx` 수정:
- `question.nickname` 표시 (없으면 "익명")
- `answerCount` prop 추가
- 펼침/접힘 상태 추가
- 펼쳤을 때 `AnswerList` 표시
- `eventCode` prop 추가

```tsx
interface QuestionCardProps {
  question: Question;
  liked: boolean;
  onLikeToggle: (questionId: string, liked: boolean) => void;
  eventCode: string;
  isAdmin?: boolean;
  onMarkAnswered?: (questionId: string) => void;
}
```

카드 내부에:
```tsx
<p className="text-xs font-medium text-gray-600">
  {question.nickname || "익명"}
</p>
<p className="text-sm">{question.content}</p>
<div className="flex items-center gap-2">
  <span className="text-xs text-gray-400">{timeAgo}</span>
  <button
    className="text-xs text-blue-500 hover:underline"
    onClick={() => setExpanded(!expanded)}
  >
    답변 {expanded ? "접기" : "보기"} ▾
  </button>
</div>
{expanded && (
  <AnswerList questionId={question.id} eventCode={eventCode} />
)}
```

**Step 2: answer-card.tsx 생성**

`src/components/answer-card.tsx`:
```tsx
"use client";

import { Button } from "@/components/ui/button";
import { Answer } from "@/lib/types";
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

  async function handleLike() {
    setLoading(true);
    const visitorId = getVisitorId();

    if (liked) {
      await getSupabase()
        .from("likes")
        .delete()
        .eq("answer_id", answer.id)
        .eq("visitor_id", visitorId);
      await getSupabase().rpc("increment_answer_like_count", { a_id: answer.id, delta: -1 });
      onLikeToggle(answer.id, false);
    } else {
      await getSupabase()
        .from("likes")
        .insert({ answer_id: answer.id, visitor_id: visitorId });
      await getSupabase().rpc("increment_answer_like_count", { a_id: answer.id, delta: 1 });
      onLikeToggle(answer.id, true);
    }
    setLoading(false);
  }

  const timeAgo = getTimeAgo(answer.created_at);

  return (
    <div className="flex items-start gap-2 py-2 border-b last:border-b-0">
      <Button
        variant={liked ? "default" : "outline"}
        size="sm"
        className="flex-shrink-0 flex flex-col items-center min-w-[36px] h-auto py-0.5 text-xs"
        onClick={handleLike}
        disabled={loading}
      >
        <span>▲</span>
        <span className="font-bold">{answer.like_count}</span>
      </Button>
      <div className="flex-1 space-y-0.5">
        <p className="text-xs font-medium text-gray-600">{answer.nickname || "익명"}</p>
        <p className="text-sm">{answer.content}</p>
        <span className="text-xs text-gray-400">{timeAgo}</span>
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
```

**Step 3: answer-form.tsx 생성**

`src/components/answer-form.tsx`:
```tsx
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
```

**Step 4: answer-list.tsx 생성**

`src/components/answer-list.tsx`:
```tsx
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
}

export function AnswerList({ questionId, eventCode }: AnswerListProps) {
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

      if (data) setAnswers(data);

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
  }, [questionId]);

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
            setAnswers((prev) => [...prev, payload.new as Answer]);
          } else if (payload.eventType === "UPDATE") {
            setAnswers((prev) =>
              prev.map((a) =>
                a.id === (payload.new as Answer).id ? (payload.new as Answer) : a
              )
            );
          } else if (payload.eventType === "DELETE") {
            setAnswers((prev) =>
              prev.filter((a) => a.id !== (payload.old as Answer).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      getSupabase().removeChannel(channel);
    };
  }, [questionId]);

  function handleLikeToggle(answerId: string, liked: boolean) {
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (liked) next.add(answerId);
      else next.delete(answerId);
      return next;
    });
  }

  if (!loaded) {
    return <p className="text-xs text-gray-400 py-2">로딩 중...</p>;
  }

  const sorted = [...answers].sort((a, b) => b.like_count - a.like_count);

  return (
    <div className="mt-2 pl-12 border-l-2 border-gray-100">
      {sorted.map((answer) => (
        <AnswerCard
          key={answer.id}
          answer={answer}
          liked={likedIds.has(answer.id)}
          onLikeToggle={handleLikeToggle}
        />
      ))}
      {sorted.length === 0 && (
        <p className="text-xs text-gray-400 py-2">아직 답변이 없습니다</p>
      )}
      <AnswerForm questionId={questionId} eventCode={eventCode} />
    </div>
  );
}
```

**Step 5: 커밋**

```bash
git add src/components/
git commit -m "답변 UI 구현: 답변 카드, 답변 폼, 답변 목록 (실시간)"
```

---

## Task 5: QuestionList에서 QuestionCard로 관리자 기능 이동 + 최종 통합

**Files:**
- Modify: `src/components/question-list.tsx`
- Modify: `src/components/question-card.tsx`

**Step 1: QuestionCard에 관리자 기능 통합**

기존 `question-list.tsx`에서 관리자 "답변 완료 처리" 버튼을 `QuestionCard` 내부로 이동.
`QuestionCard`에 `isAdmin`, `onMarkAnswered` prop 추가.

**Step 2: QuestionList에서 eventCode 전달**

`QuestionList`가 `QuestionCard`에 `eventCode` prop을 전달하도록 수정.

**Step 3: 빌드 검증**

```bash
npm run build
```

Expected: 에러 없이 빌드 성공

**Step 4: 커밋 + 푸시**

```bash
git add -A
git commit -m "답변 + 닉네임 기능 완성: 통합 및 빌드 검증"
git push
```

---

## 요약

| Task | 내용 | 파일 수 |
|------|------|---------|
| 1 | DB 마이그레이션 + 타입 확장 | 3 |
| 2 | 닉네임 유틸리티 + 게이트 컴포넌트 | 2 |
| 3 | 닉네임 게이트 적용 + 질문 폼 닉네임 반영 | 4 |
| 4 | 답변 UI (카드, 폼, 목록 + 실시간) | 4 |
| 5 | 관리자 기능 통합 + 최종 빌드 검증 | 2 |

**총 5 Tasks, ~15개 파일 변경**

**주의:** Task 1의 마이그레이션 SQL은 Supabase SQL Editor에서 수동 실행 필요.
