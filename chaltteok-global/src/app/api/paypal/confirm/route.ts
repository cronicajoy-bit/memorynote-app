// src/app/api/paypal/confirm/route.ts
// PayPal 결제 승인 후 DB 업데이트 API

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPayPalSubscription } from '@/lib/paypal';

export async function POST(request: NextRequest) {
  try {
    const { subscriptionId } = await request.json();

    if (!subscriptionId) {
      return NextResponse.json({ error: 'subscriptionId is required' }, { status: 400 });
    }

    // 1. 로그인한 유저 확인
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. PayPal API를 통해 구독 상태 조회 및 검증
    let paypalSub;
    try {
      paypalSub = await getPayPalSubscription(subscriptionId);
    } catch (err: any) {
      console.error('PayPal sub retrieve error:', err);
      return NextResponse.json({ error: 'Failed to verify subscription with PayPal' }, { status: 400 });
    }

    // ACTIVE 또는 APPROVED 상태인 경우 활성화 처리
    const isActive = paypalSub.status === 'ACTIVE' || paypalSub.status === 'APPROVED';
    if (!isActive) {
      return NextResponse.json({ error: `Subscription is not active (Status: ${paypalSub.status})` }, { status: 400 });
    }

    // 3. 만료 날짜 계산 (기본 30일 뒤, PayPal에서 제공하는 경우 해당 값 사용)
    let periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const nextBillingTime = paypalSub.billing_info?.next_billing_time;
    if (nextBillingTime) {
      periodEnd = new Date(nextBillingTime).toISOString();
    }

    // 4. Supabase DB 업데이트 (Stripe 필드를 재활용하여 프리미엄 권한 부여)
    const { error: dbError } = await supabase.from('subscriptions').upsert({
      user_id: user.id,
      stripe_subscription_id: subscriptionId, // PayPal ID를 저장
      plan: 'premium',
      status: 'active',
      current_period_end: periodEnd,
    }, { onConflict: 'user_id' });

    if (dbError) {
      console.error('Database update error:', dbError);
      return NextResponse.json({ error: 'Failed to update database' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('PayPal confirmation error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
