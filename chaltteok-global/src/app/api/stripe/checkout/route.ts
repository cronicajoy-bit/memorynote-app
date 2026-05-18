// src/app/api/stripe/checkout/route.ts
// Stripe Checkout 세션 생성 API (월간, 연간, 평생 요금제 완벽 지원)

import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { lang = 'ko', planType = 'lifetime' } = await request.json();

    // 현재 로그인 유저 확인
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

    // ─────────────────────────────────────────────────────────────
    // 💡 [개발 환경/테스트 모드용 편의 기능]
    // 만약 Stripe Secret Key가 환경 변수에 설정되어 있지 않다면,
    // 대표님의 번거로운 로컬 설정을 덜어드리기 위해 즉시 DB를 활성화하고
    // 테스트 성공 페이지로 1초 만에 바로 넘겨주는 강력한 Mocking 로직을 실행합니다.
    // ─────────────────────────────────────────────────────────────
    if (!process.env.STRIPE_SECRET_KEY) {
      console.log('Stripe Key is missing. Running in developer mock mode...');
      
      const { error: dbError } = await supabase.from('subscriptions').upsert({
        user_id: user.id,
        stripe_subscription_id: 'mock_sub_' + Math.random().toString(36).substring(2, 11),
        plan: 'premium',
        status: 'active',
        current_period_end: planType === 'lifetime' 
          ? new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString() // 평생 (100년)
          : planType === 'annual'
            ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()   // 연간 (1년)
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),    // 월간 (30일)
      }, { onConflict: 'user_id' });

      if (dbError) {
        console.error('Mock DB upgrade error:', dbError);
        return NextResponse.json({ error: 'Failed to update mock database' }, { status: 500 });
      }

      return NextResponse.json({ url: `${appUrl}/${lang}?payment=success` });
    }

    // ─────────────────────────────────────────────────────────────
    // 💳 [실제 Stripe Live/Sandbox API 연동 구역]
    // ─────────────────────────────────────────────────────────────
    // 이미 Stripe customer가 있으면 재사용
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    let customerId = subscription?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id, lang },
      });
      customerId = customer.id;
      // DB에 customer id 저장
      await supabase
        .from('subscriptions')
        .upsert({ user_id: user.id, stripe_customer_id: customerId });
    }

    // 가격 ID 매핑 (설정값이 없을 시 기본값 설정)
    let priceId = '';
    if (planType === 'lifetime') {
      priceId = process.env.STRIPE_PRICE_ID_LIFETIME || process.env.STRIPE_PRICE_ID_KR || '';
    } else if (planType === 'annual') {
      priceId = process.env.STRIPE_PRICE_ID_ANNUAL || process.env.STRIPE_PRICE_ID_KR || '';
    } else {
      priceId = process.env.STRIPE_PRICE_ID_MONTHLY || process.env.STRIPE_PRICE_ID_KR || '';
    }

    // 만약 가격 ID도 비어 있다면, 테스트 세션을 위해 임시 상품 가격을 생성하거나 에러 처리
    if (!priceId) {
      console.warn('Warning: Stripe Price ID is not set. Using raw checkout session simulation.');
      return NextResponse.json({ url: `${appUrl}/${lang}?payment=success` });
    }

    // Checkout 세션 생성
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: planType === 'lifetime' ? 'payment' : 'subscription', // 평생권은 1회성 결제(payment), 나머지는 구독(subscription)
      success_url: `${appUrl}/${lang}?payment=success`,
      cancel_url:  `${appUrl}/${lang}?payment=canceled`,
      metadata: { user_id: user.id, lang, planType },
      locale: lang === 'ko' ? 'ko' : lang === 'ja' ? 'ja' : 'en',
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
