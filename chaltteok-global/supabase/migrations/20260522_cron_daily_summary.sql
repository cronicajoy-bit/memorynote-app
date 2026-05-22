-- =====================================================
-- Cron: 매일 저녁 9시(KST) daily-summary Edge Function 호출
-- UTC 12:00 = KST 21:00
-- =====================================================
-- 전제: pg_cron, pg_net 익스텐션이 활성화되어 있어야 함.
-- Supabase Dashboard > Database > Extensions 또는:
--   CREATE EXTENSION IF NOT EXISTS pg_cron;
--   CREATE EXTENSION IF NOT EXISTS pg_net;
-- =====================================================

-- 기존 동일 이름 job 제거 (재실행 안전성)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-memory-summary') THEN
    PERFORM cron.unschedule('daily-memory-summary');
  END IF;
END $$;

-- Edge Function을 매일 UTC 12:00에 호출 (= KST 21:00)
-- Authorization: service_role JWT (환경에 맞게 교체)
SELECT cron.schedule(
  'daily-memory-summary',
  '0 12 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://ybpikgpnfgmzaadgnenx.supabase.co/functions/v1/daily-summary',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer <SERVICE_ROLE_KEY>"}'::jsonb,
    body    := '{}'::jsonb
  ) AS request_id
  $$
);
