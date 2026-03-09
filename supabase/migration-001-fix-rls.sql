-- Migration 001: RLS 정책 누락 수정 + like_count 원자적 업데이트 함수
-- Supabase SQL Editor에서 실행할 것

-- 1. likes DELETE 정책 추가 (좋아요 취소용)
CREATE POLICY "likes_delete" ON likes
  FOR DELETE USING (true);

-- 2. events UPDATE 정책 추가 (관리자 is_active 토글용)
CREATE POLICY "events_update" ON events
  FOR UPDATE USING (true);

-- 3. 좋아요 원자적 업데이트 RPC 함수
CREATE OR REPLACE FUNCTION increment_like_count(q_id UUID, delta INTEGER)
RETURNS void AS $$
  UPDATE questions SET like_count = GREATEST(like_count + delta, 0) WHERE id = q_id;
$$ LANGUAGE sql;
