import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// POST /api/push/schedule
// 알림 발송 예약을 Supabase에 저장
export async function POST(req: NextRequest) {
  try {
    const { deviceId, userId, memoId, memoText, appointmentDate, travelType, notifyAt } =
      await req.json();

    if (!deviceId || !memoId || !notifyAt) {
      return NextResponse.json({ error: 'deviceId, memoId, notifyAt이 필요합니다.' }, { status: 400 });
    }

    const { error } = await supabase.from('scheduled_pushes').upsert(
      {
        device_id: deviceId,
        user_id: userId || null,
        memo_id: memoId,
        memo_text: memoText,
        appointment_date: appointmentDate,
        travel_type: travelType,
        notify_at: notifyAt,
        sent: false,
      },
      { onConflict: 'memo_id' },
    );

    if (error) {
      console.error('알림 예약 저장 오류:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('schedule API 오류:', e);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
