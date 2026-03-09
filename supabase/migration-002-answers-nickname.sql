-- Migration 002: 답변 테이블 + 닉네임 기능
-- Supabase SQL Editor에서 실행할 것

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

-- 5. likes 테이블 확장
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
