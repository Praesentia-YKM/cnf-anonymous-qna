-- migration-005: 질문 고정(Pin) 기능 추가
ALTER TABLE questions ADD COLUMN is_pinned BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX idx_questions_is_pinned ON questions(is_pinned);
