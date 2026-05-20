// ============================================
// 찰떡메모 - Supabase Edge Function (Cron)
// 매 1분마다 발송 시각이 된 Push 알림을 자동 전송
// ============================================
// Deploy: supabase functions deploy send-push --no-verify-jwt
// Cron:   매 1분 ("* * * * *") 으로 Supabase Dashboard에서 설정

import webpush from 'npm:web-push@3.6.7';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const VAPID_PUBLIC_KEY = Deno.env.get('NEXT_PUBLIC_VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!;
const VAPID_EMAIL = Deno.env.get('VAPID_EMAIL') || 'mailto:admin@chaltteok.com';

webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

Deno.serve(async (_req) => {
  const now = new Date().toISOString();

  // 1) 발송해야 할 알림 조회 (notify_at <= now AND sent = false)
  const qRes = await fetch(
    `${SUPABASE_URL}/rest/v1/scheduled_pushes?sent=eq.false&notify_at=lte.${encodeURIComponent(now)}&select=*`,
    { headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` } },
  );
  const pendingPushes = await qRes.json();

  if (!Array.isArray(pendingPushes) || pendingPushes.length === 0) {
    return new Response(JSON.stringify({ ok: true, sent: 0 }), { status: 200 });
  }

  let sentCount = 0;
  const failedIds: string[] = [];

  for (const push of pendingPushes) {
    // 2) 디바이스 구독 정보 조회
    const subRes = await fetch(
      `${SUPABASE_URL}/rest/v1/push_subscriptions?device_id=eq.${push.device_id}&select=endpoint,p256dh,auth`,
      { headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` } },
    );
    const subs = await subRes.json();
    if (!Array.isArray(subs) || subs.length === 0) continue;

    const sub = subs[0];
    const pushSubscription = {
      endpoint: sub.endpoint,
      keys: { p256dh: sub.p256dh, auth: sub.auth },
    };

    // 3) 알림 페이로드 구성
    const travelLabel: Record<string, string> = {
      local: '🏘️ 동네 약속',
      city: '🏙️ 시내 약속',
      intercity_train: '🚄 타도시 (기차)',
      intercity_bus: '🚌 타도시 (버스)',
      overseas: '✈️ 해외 일정',
    };
    const label = travelLabel[push.travel_type] || '📅 약속';
    const shortText = push.memo_text.length > 40
      ? push.memo_text.substring(0, 40) + '...'
      : push.memo_text;

    const payload = JSON.stringify({
      title: `⏰ 찰떡메모 - ${label}`,
      body: shortText,
      icon: '/icon-192.png',
      tag: `chaltteok-${push.memo_id}`,
      url: '/',
      memoId: push.memo_id,
    });

    // 4) Web Push 발송
    try {
      await webpush.sendNotification(pushSubscription, payload);
      sentCount++;

      // 5) sent = true 업데이트
      await fetch(
        `${SUPABASE_URL}/rest/v1/scheduled_pushes?id=eq.${push.id}`,
        {
          method: 'PATCH',
          headers: {
            apikey: SERVICE_ROLE_KEY,
            Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sent: true }),
        },
      );
    } catch (err) {
      console.error(`Push 발송 실패 (memo: ${push.memo_id}):`, err);
      failedIds.push(push.id);
    }
  }

  return new Response(
    JSON.stringify({ ok: true, sent: sentCount, failed: failedIds.length }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
});
