// src/lib/stripe.ts
// 서버 전용 Stripe 인스턴스

import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-04-22.dahlia',
    });
  }
  return _stripe;
}

// 하위 호환을 위한 getter
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string, unknown>)[prop as string];
  },
});

/* ── 국가별 Stripe 가격 ID ── */
export const STRIPE_PRICES: Record<string, string> = {
  ko: process.env.STRIPE_PRICE_ID_KR    ?? '',   // ₩5,900/월
  en: process.env.STRIPE_PRICE_ID_GLOBAL ?? '',   // $4.99/월
  ja: process.env.STRIPE_PRICE_ID_GLOBAL ?? '',   // $4.99/월 (일본은 추후 로컬 플랜 추가)
};

/* ── 국가별 표시 통화/가격 ── */
export const PLAN_DISPLAY: Record<string, { price: string; currency: string }> = {
  ko: { price: '₩5,900', currency: 'KRW' },
  en: { price: '$4.99',  currency: 'USD' },
  ja: { price: '$4.99',  currency: 'USD' },
};
