# 익명 답변 + 닉네임 기능 설계

## 개요

기존 익명 질문 플랫폼에 두 가지 기능을 추가한다:
1. **익명 답변** — 누구든 질문에 답변 가능, 답변에도 좋아요 가능
2. **닉네임** — 이벤트 참여 시 닉네임 설정, 질문/답변에 자동 적용

## 데이터 모델

### questions 테이블 변경
- `nickname VARCHAR(30)` 추가 (nullable, 없으면 "익명")

### answers 테이블 (신규)
```
answers
├── id UUID DEFAULT gen_random_uuid() PK
├── question_id UUID FK → questions(id) ON DELETE CASCADE
├── content TEXT NOT NULL (500자)
├── nickname VARCHAR(30) — nullable, 없으면 "익명"
├── like_count INTEGER DEFAULT 0
├── created_at TIMESTAMPTZ DEFAULT now()
```

### likes 테이블 변경
- `question_id` → nullable로 변경
- `answer_id UUID` 추가 (nullable, FK → answers)
- 기존 UNIQUE(question_id, visitor_id) 유지
- 추가 UNIQUE(answer_id, visitor_id)
- CHECK: question_id와 answer_id 중 하나만 NOT NULL

### RLS 정책 (answers)
- SELECT: 모든 사용자
- INSERT: 모든 사용자
- UPDATE: 모든 사용자 (like_count 업데이트용)

### RPC 함수 확장
- `increment_answer_like_count(a_id UUID, delta INTEGER)` 추가

### Realtime
- answers 테이블도 supabase_realtime publication에 추가

## UI 설계

### 이벤트 참여 시 닉네임 입력
- `/event/[code]` 최초 접속 시 닉네임 입력 화면
- "닉네임 (선택)" + "참여하기" 버튼
- 빈 칸이면 "익명"
- localStorage `anonymous-qna-nickname-{code}` 키로 저장

### 질문 카드 변경
- 닉네임 표시 추가
- "답변 N개" 펼침 버튼 추가
- 펼치면 답변 목록 + 답변 입력란

### 답변 카드
- 닉네임 + 내용 + 시간 + 좋아요 버튼
- 좋아요순 정렬

### 질문 작성 폼
- 닉네임 자동 적용, "OO 님으로 질문" 표시

## 타입 정의

```typescript
export interface Answer {
  id: string;
  question_id: string;
  content: string;
  nickname: string | null;
  like_count: number;
  created_at: string;
}
```

Question 인터페이스에 `nickname: string | null` 추가
