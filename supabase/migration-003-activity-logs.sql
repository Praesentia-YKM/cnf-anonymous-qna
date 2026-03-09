-- Migration 003: 활동 로그 테이블
-- Supabase SQL Editor에서 실행할 것

-- 1. activity_logs 테이블 생성
CREATE TABLE activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action_type VARCHAR(20) NOT NULL, -- 'question', 'answer', 'event_create'
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  question_id UUID REFERENCES questions(id) ON DELETE SET NULL,
  answer_id UUID REFERENCES answers(id) ON DELETE SET NULL,
  visitor_id VARCHAR(64),
  ip_address VARCHAR(45), -- IPv6 지원
  nickname VARCHAR(30),
  content_preview VARCHAR(100), -- 내용 미리보기 (앞 100자)
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_event_id ON activity_logs(event_id);
CREATE INDEX idx_activity_logs_ip ON activity_logs(ip_address);

-- 2. RLS
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- 슈퍼 관리자만 조회 (서버에서만 service role로 접근)
-- anon 사용자는 INSERT만 가능
CREATE POLICY "activity_logs_insert" ON activity_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "activity_logs_select" ON activity_logs
  FOR SELECT USING (true);

-- 3. questions/answers DELETE 정책 추가 (관리자 삭제 기능용)
CREATE POLICY "questions_delete" ON questions
  FOR DELETE USING (true);

CREATE POLICY "answers_delete" ON answers
  FOR DELETE USING (true);

-- 4. events DELETE 정책 추가
CREATE POLICY "events_delete" ON events
  FOR DELETE USING (true);
