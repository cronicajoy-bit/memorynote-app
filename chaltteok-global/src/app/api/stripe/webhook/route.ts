// src/app/api/stripe/webhook/route.ts
// Stripe Webhook 처리 - 결제 완료/취소 시 DB 자동 업데이트

import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Stripe SDK 버전 호환을 위한 타입 헬퍼
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyStripeObj = any;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig  = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createAdminClient();

  switch (event.type) {

    // 구독 결제 완료
    case 'invoice.payment_succeeded': {
      const invoice  = event.data.object as AnyStripeObj;
      const subId    = invoice.subscription as string;
      const sub      = await stripe.subscriptions.retrieve(subId) as AnyStripeObj;
      const userId   = sub.metadata?.user_id;
      if (!userId) break;

      await supabase.from('subscriptions').upsert({
        user_id:                userId,
        stripe_customer_id:     sub.customer as string,
        stripe_subscription_id: subId,
        plan:                   'premium',
        status:                 'active',
        current_period_end:     new Date(sub.current_period_end * 1000).toISOString(),
      }, { onConflict: 'user_id' });
      break;
    }

    // 구독 취소
    case 'customer.subscription.deleted': {
      const sub    = event.data.object as AnyStripeObj;
      const userId = sub.metadata?.user_id;
      if (!userId) break;

      await supabase.from('subscriptions').update({
        plan:                   'free',
        status:                 'canceled',
        stripe_subscription_id: null,
      }).eq('user_id', userId);
      break;
    }

    // 결제 실패
    case 'invoice.payment_failed': {
      const invoice = event.data.object as AnyStripeObj;
      const subId   = invoice.subscription as string;
      if (!subId) break;
      const sub     = await stripe.subscriptions.retrieve(subId) as AnyStripeObj;
      const userId  = sub.metadata?.user_id;
      if (!userId) break;

      await supabase.from('subscriptions').update({
        status: 'past_due',
      }).eq('user_id', userId);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
