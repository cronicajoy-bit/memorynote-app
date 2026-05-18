// src/app/api/auth/callback/route.ts
// Supabase OAuth(구글 등) 인증 후 리다이렉트되는 콜백 처리

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const lang = searchParams.get('lang') || 'ko';
  const next = searchParams.get('next') ?? `/${lang}`;

  console.log('[Auth Callback] Code received:', !!code, 'Lang:', lang, 'Next:', next);

  if (code) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('[Auth Callback] exchangeCodeForSession Error:', error);
        return NextResponse.redirect(`${origin}/${lang}?error=exchange_failed&message=${encodeURIComponent(error.message)}`);
      }
      
      console.log('[Auth Callback] Session exchanged successfully for user:', data.user?.email);
      
      // Next.js 15+ Route Handler 쿠키 안전 동기화를 위한 리다이렉트 응답 생성
      const response = NextResponse.redirect(`${origin}${next}`);
      return response;
    } catch (e: any) {
      console.error('[Auth Callback] Unexpected error during callback processing:', e);
      return NextResponse.redirect(`${origin}/${lang}?error=unexpected_callback_error&message=${encodeURIComponent(e.message || '')}`);
    }
  }

  console.warn('[Auth Callback] Missing code parameter in OAuth callback');
  return NextResponse.redirect(`${origin}/${lang}?error=no_code_provided`);
}

