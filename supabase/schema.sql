-- events 테이블
CREATE TABLE events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(6) UNIQUE NOT NULL,
  title VARCHAR(200) NOT NULL,
  admin_token UUID DEFAULT gen_random_uuid() NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- questions 테이블
CREATE TABLE questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  like_count INTEGER DEFAULT 0 NOT NULL,
  is_answered BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- likes 테이블
CREATE TABLE likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
  visitor_id VARCHAR(64) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(question_id, visitor_id)
);

-- 인덱스
CREATE INDEX idx_events_code ON events(code);
CREATE INDEX idx_questions_event_id ON questions(event_id);
CREATE INDEX idx_likes_question_id ON likes(question_id);

-- Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE questions;

-- RLS (Row Level Security) 정책
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 events 읽기 가능 (admin_token 제외)
CREATE POLICY "events_select" ON events
  FOR SELECT USING (true);

-- 모든 사용자가 events 생성 가능
CREATE POLICY "events_insert" ON events
  FOR INSERT WITH CHECK (true);

-- 모든 사용자가 questions 읽기 가능
CREATE POLICY "questions_select" ON questions
  FOR SELECT USING (true);

-- 모든 사용자가 questions 생성 가능
CREATE POLICY "questions_insert" ON questions
  FOR INSERT WITH CHECK (true);

-- 모든 사용자가 questions 수정 가능 (좋아요 카운트 업데이트용)
CREATE POLICY "questions_update" ON questions
  FOR UPDATE USING (true);

-- 모든 사용자가 likes 읽기/생성 가능
CREATE POLICY "likes_select" ON likes
  FOR SELECT USING (true);

CREATE POLICY "likes_insert" ON likes
  FOR INSERT WITH CHECK (true);
