-- ================================================
-- 찰떡메모 Supabase 스키마 v2 (구독 시스템 추가)
-- ================================================

-- 1. 메모 테이블
CREATE TABLE IF NOT EXISTS memos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text        TEXT NOT NULL,
  date_key    TEXT NOT NULL,
  time_label  TEXT NOT NULL,
  is_voice    BOOLEAN DEFAULT FALSE,
  is_starred  BOOLEAN DEFAULT FALSE,
  lang        TEXT DEFAULT 'ko',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 구독 정보 테이블
CREATE TABLE IF NOT EXISTS subscriptions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id   TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  plan                 TEXT DEFAULT 'free',  -- 'free' | 'premium'
  status               TEXT DEFAULT 'active', -- 'active' | 'canceled' | 'past_due'
  current_period_end   TIMESTAMPTZ,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 무료 플랜 음성 메모 사용량 추적
CREATE TABLE IF NOT EXISTS voice_usage (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  date_key   TEXT NOT NULL,   -- 'YYYY-MM-DD'
  count      INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. RLS 활성화
ALTER TABLE memos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_usage   ENABLE ROW LEVEL SECURITY;

-- memos RLS
CREATE POLICY "memos_select" ON memos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "memos_insert" ON memos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "memos_update" ON memos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "memos_delete" ON memos FOR DELETE USING (auth.uid() = user_id);

-- subscriptions RLS
CREATE POLICY "subs_select" ON subscriptions FOR SELECT USING (auth.uid() = user_id);

-- voice_usage RLS
CREATE POLICY "voice_select" ON voice_usage FOR SELECT USING (auth.uid() = user_id);

-- 5. 신규 회원 자동 free 구독 생성 트리거
CREATE OR REPLACE FUNCTION create_free_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO subscriptions(user_id, plan, status)
  VALUES (NEW.id, 'free', 'active')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_free_subscription();

-- 6. updated_at 자동 갱신
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER memos_updated_at
  BEFORE UPDATE ON memos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER subs_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 7. 인덱스
CREATE INDEX idx_memos_user_date ON memos(user_id, date_key DESC);
CREATE INDEX idx_memos_starred   ON memos(user_id, is_starred) WHERE is_starred = TRUE;
CREATE INDEX idx_subs_user       ON subscriptions(user_id);
