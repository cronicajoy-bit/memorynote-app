-- ================================================
-- 찰떡메모 — "오늘의 기억" 기능
-- daily_summaries 테이블 생성 마이그레이션
-- ================================================
-- Run in Supabase Dashboard > SQL Editor

CREATE TABLE IF NOT EXISTS daily_summaries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date          TEXT NOT NULL,           -- 'YYYY-MM-DD' (KST 기준)
  summary_text  TEXT NOT NULL,           -- Gemini가 생성한 2-3문장 요약
  memo_count    INT NOT NULL DEFAULT 0,  -- 요약에 사용된 메모 수
  is_free_limit BOOLEAN DEFAULT FALSE,   -- 무료 플랜 30회/월 한도 초과 여부
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)                  -- 1일 1요약
);

-- RLS 활성화
ALTER TABLE daily_summaries ENABLE ROW LEVEL SECURITY;

-- 본인 데이터만 읽기 가능
CREATE POLICY "daily_summaries_select"
  ON daily_summaries FOR SELECT
  USING (auth.uid() = user_id);

-- Service Role (Edge Function)만 삽입/수정 가능 (아래 정책 없어도 service_role은 RLS 우회)
-- 클라이언트 직접 삽입 차단 (security 강화)
-- INSERT는 Edge Function에서 service_role 키로만 처리

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_daily_summaries_user_date
  ON daily_summaries(user_id, date DESC);
