-- ================================================
-- 찰떡메모 - 스마트 푸시 알림 테이블 v1
-- Supabase SQL Editor에서 실행하세요
-- ================================================

-- 1. 사용자별 Push 구독 정보 (디바이스당 1개)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id  TEXT UNIQUE NOT NULL,          -- localStorage에 저장된 UUID
  user_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  endpoint   TEXT NOT NULL,                 -- 브라우저 Push 엔드포인트 URL
  p256dh     TEXT NOT NULL,                 -- 암호화 공개키
  auth       TEXT NOT NULL,                 -- 인증 시크릿
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 알림 발송 예약 큐
CREATE TABLE IF NOT EXISTS scheduled_pushes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id        TEXT NOT NULL,
  user_id          UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  memo_id          TEXT UNIQUE NOT NULL,    -- 메모 ID (중복 방지)
  memo_text        TEXT NOT NULL,           -- 메모 전체 텍스트 (알림 본문에 활용)
  appointment_date TEXT NOT NULL,           -- 'YYYY-MM-DD'
  travel_type      TEXT DEFAULT 'city',     -- 'local'|'city'|'intercity_train'|'intercity_bus'|'overseas'
  notify_at        TIMESTAMPTZ NOT NULL,    -- 실제 알림 발송 시각
  sent             BOOLEAN DEFAULT FALSE,  -- 발송 완료 여부
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RLS 비활성화 (서비스 롤 키로만 접근)
ALTER TABLE push_subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_pushes   DISABLE ROW LEVEL SECURITY;

-- 4. 인덱스 (Cron 쿼리 속도 최적화)
CREATE INDEX IF NOT EXISTS idx_pushes_notify ON scheduled_pushes(notify_at)
  WHERE sent = FALSE;
CREATE INDEX IF NOT EXISTS idx_pushes_device ON push_subscriptions(device_id);

-- 5. updated_at 트리거
CREATE TRIGGER push_subs_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
