-- Migration 004: visitor_id 추가 (질문/답변 수정 기능용)
-- Supabase SQL Editor에서 실행할 것

-- 1. questions 테이블에 visitor_id 추가
ALTER TABLE questions ADD COLUMN visitor_id VARCHAR(64);

-- 2. answers 테이블에 visitor_id 추가
ALTER TABLE answers ADD COLUMN visitor_id VARCHAR(64);

-- 3. 인덱스
CREATE INDEX idx_questions_visitor_id ON questions(visitor_id);
CREATE INDEX idx_answers_visitor_id ON answers(visitor_id);
