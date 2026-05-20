import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// POST /api/push/subscribe
// 브라우저의 Push 구독 정보를 Supabase에 저장
export async function POST(req: NextRequest) {
  try {
    const { subscription, deviceId, userId } = await req.json();

    if (!subscription?.endpoint || !deviceId) {
      return NextResponse.json({ error: 'endpoint와 deviceId가 필요합니다.' }, { status: 400 });
    }

    const { error } = await supabase
      .from('push_subscriptions')
      .upsert(
        {
          device_id: deviceId,
          user_id: userId || null,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys?.p256dh,
          auth: subscription.keys?.auth,
        },
        { onConflict: 'device_id' },
      );

    if (error) {
      console.error('구독 저장 오류:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('subscribe API 오류:', e);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
