// ============================================================
// 찰떡메모 — "오늘의 기억" 일일 요약 Edge Function
// ============================================================
// Deploy: supabase functions deploy daily-summary --no-verify-jwt
// Cron:   0 12 * * *  (UTC 12:00 = KST 21:00)
//         ↑ KST 21:00 = UTC 12:00 (UTC+9). 반드시 UTC 기준으로 설정.
//
// 환경변수 (Supabase Secrets):
//   SUPABASE_URL              - 자동 주입
//   SUPABASE_SERVICE_ROLE_KEY - 자동 주입
//   GEMINI_API_KEY            - 서버 전용 (NEXT_PUBLIC_ 아님!)
//   NEXT_PUBLIC_VAPID_PUBLIC_KEY  - VAPID 공개 키
//   VAPID_PRIVATE_KEY         - VAPID 비밀 키
//   VAPID_EMAIL               - VAPID 이메일
// ============================================================

import webpush from 'npm:web-push@3.6.7';

const SUPABASE_URL        = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY    = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const GEMINI_API_KEY      = Deno.env.get('GEMINI_API_KEY')!;
const VAPID_PUBLIC_KEY    = Deno.env.get('NEXT_PUBLIC_VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE_KEY   = Deno.env.get('VAPID_PRIVATE_KEY')!;
const VAPID_EMAIL         = Deno.env.get('VAPID_EMAIL') || 'mailto:admin@chaltteok.com';

const FREE_MONTHLY_LIMIT  = 30; // 무료 플랜 월 최대 요약 횟수

webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

/* ── 헬퍼: KST 날짜 문자열 반환 (YYYY-MM-DD) ── */
function getKstDateKey(): string {
  // KST = UTC+9: Date.now() + 9시간(ms)
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

/* ── 헬퍼: Supabase REST API GET ── */
async function supabaseGet(path: string): Promise<any[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
  });
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

/* ── 헬퍼: Supabase REST API UPSERT ── */
async function supabaseUpsert(table: string, body: Record<string, unknown>): Promise<void> {
  await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify(body),
  });
}

/* ── 헬퍼: Gemini Flash API 호출 ── */
async function generateSummary(memos: string[], lang: string): Promise<string> {
  const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  // 언어별 프롬프트 조정
  const langInstr =
    lang === 'en' ? 'Write the summary in warm, friendly English.' :
    lang === 'ja' ? '優しい日本語で書いてください。' :
    '한국어로 따뜻하게 써주세요.';

  const prompt = `다음은 어르신이 오늘 남긴 메모들입니다:\n\n${memos.map((m, i) => `${i + 1}. ${m}`).join('\n')}\n\n위 메모들을 할머니/할아버지의 따뜻한 하루 이야기로 2-3문장으로 요약해 주세요. 마치 손자/손녀가 어르신의 하루를 듣고 싶어하는 것처럼, 따뜻하고 격려하는 문장으로 써주세요. ${langInstr}`;

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 200 },
  };

  let res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  // gemini-1.5-flash 실패 시 fallback
  if (!res.ok) {
    const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;
    res = await fetch(fallbackUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);

  const json = await res.json();
  return json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
}

/* ── 헬퍼: 특정 유저의 이번 달 요약 횟수 ── */
async function getMonthlyCount(userId: string, dateKey: string): Promise<number> {
  const yearMonth = dateKey.slice(0, 7); // 'YYYY-MM'
  const data = await supabaseGet(
    `daily_summaries?user_id=eq.${userId}&date=like.${yearMonth}-*&select=id`,
  );
  return data.length;
}

/* ── 헬퍼: 유저 플랜 조회 ── */
async function getUserPlan(userId: string): Promise<'free' | 'premium'> {
  const data = await supabaseGet(
    `subscriptions?user_id=eq.${userId}&select=plan,status`,
  );
  const sub = data[0];
  return sub?.plan === 'premium' && sub?.status === 'active' ? 'premium' : 'free';
}

/* ── 헬퍼: Web Push 발송 (유저의 모든 디바이스) ── */
async function sendPushToUser(userId: string, summaryText: string): Promise<void> {
  const subs = await supabaseGet(
    `push_subscriptions?user_id=eq.${userId}&select=endpoint,p256dh,auth`,
  );

  const payload = JSON.stringify({
    title: '🌸 오늘의 기억',
    body: summaryText.length > 60 ? summaryText.slice(0, 60) + '...' : summaryText,
    icon: '/icon-192.png',
    tag: 'daily-memory',
    url: '/?tab=timeline',
  });

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload,
      );
    } catch (err) {
      // 만료된 구독은 무시 (410 Gone)
      console.warn(`Push 발송 실패 (userId: ${userId}):`, err);
    }
  }
}

/* ── 메인 핸들러 ── */
Deno.serve(async (_req) => {
  const dateKey = getKstDateKey();
  console.log(`[daily-summary] 실행 시작 — KST date_key: ${dateKey}`);

  let processed = 0;
  let skipped = 0;
  let errors = 0;

  try {
    // 1) 오늘 메모가 1개 이상인 유저 목록 조회 (중복 제거)
    const todayMemos = await supabaseGet(
      `memos?date_key=eq.${dateKey}&select=user_id,text,lang&order=created_at.asc`,
    );

    if (todayMemos.length === 0) {
      console.log('[daily-summary] 오늘 메모 없음 — 종료');
      return new Response(JSON.stringify({ ok: true, processed: 0, skipped: 0 }), { status: 200 });
    }

    // 유저별로 메모 그룹화
    const userMemoMap = new Map<string, { texts: string[]; lang: string }>();
    for (const memo of todayMemos) {
      if (!userMemoMap.has(memo.user_id)) {
        userMemoMap.set(memo.user_id, { texts: [], lang: memo.lang ?? 'ko' });
      }
      const entry = userMemoMap.get(memo.user_id)!;
      entry.texts.push(memo.text);
    }

    // 2) 유저별 순차 처리 (초기: sequential. DAU 100+ 시 Promise.allSettled 배치로 업그레이드 — TODOS.md #2)
    for (const [userId, { texts, lang }] of userMemoMap) {
      try {
        // 3) 플랜 확인
        const plan = await getUserPlan(userId);
        const monthlyCount = await getMonthlyCount(userId, dateKey);

        if (plan === 'free' && monthlyCount >= FREE_MONTHLY_LIMIT) {
          // 무료 한도 초과: 업그레이드 안내 카드 데이터 저장 (빈 알림 대신)
          await supabaseUpsert('daily_summaries', {
            user_id: userId,
            date: dateKey,
            summary_text: '이번 달 요약이 모두 찼어요! ⭐ 프리미엄으로 업그레이드하면 매일 기억을 돌아볼 수 있어요.',
            memo_count: texts.length,
            is_free_limit: true,
          });
          skipped++;
          continue;
        }

        // 4) Gemini Flash로 요약 생성 (최대 20개 메모 사용)
        const memoTexts = texts.slice(-20); // 최신 20개
        const summaryText = await generateSummary(memoTexts, lang);

        if (!summaryText) {
          console.error(`[daily-summary] Gemini 응답 없음 (userId: ${userId})`);
          errors++;
          continue;
        }

        // 5) daily_summaries 테이블에 upsert
        await supabaseUpsert('daily_summaries', {
          user_id: userId,
          date: dateKey,
          summary_text: summaryText,
          memo_count: memoTexts.length,
          is_free_limit: false,
        });

        // 6) Web Push 발송 (유저의 모든 디바이스)
        await sendPushToUser(userId, summaryText);

        processed++;
      } catch (err) {
        console.error(`[daily-summary] 유저 처리 실패 (userId: ${userId}):`, err);
        errors++;
      }
    }
  } catch (err) {
    console.error('[daily-summary] 치명적 오류:', err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500 });
  }

  console.log(`[daily-summary] 완료 — processed: ${processed}, skipped: ${skipped}, errors: ${errors}`);
  return new Response(
    JSON.stringify({ ok: true, date: dateKey, processed, skipped, errors }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
});
