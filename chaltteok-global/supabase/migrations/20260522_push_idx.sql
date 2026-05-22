-- ================================================
-- 찰떡메모 — "오늘의 기억" 기능
-- push_subscriptions user_id 인덱스 추가
-- ================================================
-- 이유: daily-summary Edge Function이 특정 유저의 모든 디바이스에
--       Web Push를 보내야 함. user_id 기준 조회 최적화.

CREATE INDEX IF NOT EXISTS idx_push_subs_user
  ON push_subscriptions(user_id);
